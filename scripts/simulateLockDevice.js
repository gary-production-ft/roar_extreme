/**
 * ROAR EXTREME — Simulated ESP32 Lock Controller
 *
 * Runs as a standalone Node.js client simulating physical ESP32 hardware:
 * - Subscribes to MQTT command topic (or connects to backend)
 * - Verifies HMAC-SHA256 signature, 5-second freshness, and nonce replay protection
 * - Actuates virtual 12V relay with automatic 5-second mechanical relock
 * - Sends unlock_ack, relock, and periodic heartbeat telemetry
 *
 * Usage:
 *   node scripts/simulateLockDevice.js [doorId] [deviceId] [secret]
 */

import crypto from 'crypto';
import mqtt from 'mqtt';

const doorId = process.argv[2] || 'DOOR-ROOFTOP-MAIN';
const deviceId = process.argv[3] || 'lock-esp32-01';
const secret = process.argv[4] || process.env.LOCK_DEVICE_SECRET || 'roar_esp32_lock_hmac_secret_key_2026!';
const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://127.0.0.1:1883';

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║        ⚡ ROAR EXTREME — SIMULATED ESP32 DOOR CONTROLLER          ║');
console.log('╚════════════════════════════════════════════════════════════════════╝');
console.log(`[INIT] Target Door:   ${doorId}`);
console.log(`[INIT] Device ID:     ${deviceId}`);
console.log(`[INIT] Firmware:      v1.2.0-esp32-simulated`);
console.log(`[INIT] Broker Target: ${brokerUrl}\n`);

// Local replay protection cache
const seenNonces = new Set();
let isRelayEnergized = false;
let relockTimer = null;

function buildCanonicalPayload({ commandId, doorId, accessLogId, timestamp, expiresAt, durationSeconds, nonce }) {
  return `${commandId}|${doorId}|${accessLogId || ''}|${timestamp}|${expiresAt}|${durationSeconds}|${nonce}`;
}

function verifyCommand(command) {
  const now = Date.now();
  const { commandId, timestamp, expiresAt, durationSeconds, nonce, signature } = command;

  // 1. Freshness check (< 5 seconds expiry)
  if (now > expiresAt) {
    return { valid: false, reason: `EXPIRED: current time ${now} > expiresAt ${expiresAt}` };
  }

  // 2. Clock skew check
  if (timestamp > now + 2000) {
    return { valid: false, reason: 'FUTURE_TIMESTAMP: clock skew detected' };
  }

  // 3. Replay protection
  if (seenNonces.has(nonce)) {
    return { valid: false, reason: `REPLAY_ATTACK: nonce ${nonce} already consumed` };
  }

  // 4. Cryptographic HMAC-SHA256 signature
  const canonical = buildCanonicalPayload(command);
  const expectedSig = crypto.createHmac('sha256', secret).update(canonical).digest('hex');

  if (signature !== expectedSig) {
    return { valid: false, reason: 'INVALID_SIGNATURE: HMAC mismatch' };
  }

  seenNonces.add(nonce);
  return { valid: true };
}

let client = null;

try {
  client = mqtt.connect(brokerUrl, {
    clientId: `sim_${deviceId}_${Math.random().toString(16).slice(2, 6)}`,
    reconnectPeriod: 3000,
  });

  client.on('connect', () => {
    console.log(`[ONLINE] Connected to MQTT broker. Subscribing to door commands...`);
    const cmdTopic = `roar/doors/${doorId}/command`;
    client.subscribe(cmdTopic, { qos: 1 });
    console.log(`[LISTENING] Subscribed to topic: ${cmdTopic}\n`);

    // Send initial boot event
    publishEvent('heartbeat', {
      firmwareVersion: '1.2.0-esp32-simulated',
      ipAddress: '192.168.1.105',
      bootReason: 'POWER_ON_RESET',
      relayState: 'LOCKED',
    });
  });

  client.on('message', (topic, rawMessage) => {
    try {
      const payload = JSON.parse(rawMessage.toString());
      console.log(`\n[INBOUND] Received command on ${topic}`);

      if (payload.action === 'lockdown_enable') {
        console.log('🚨 [ALERT] LOCKDOWN SIGNAL RECEIVED: Relay de-energized, door HARD LOCKED.');
        isRelayEnergized = false;
        if (relockTimer) clearTimeout(relockTimer);
        publishEvent('lockdown_ack', { status: 'locked_down' });
        return;
      }

      if (payload.action === 'lockdown_disable') {
        console.log('🟢 [NOTICE] LOCKDOWN RELEASED: Resuming normal automated access.');
        publishEvent('lockdown_ack', { status: 'locked' });
        return;
      }

      if (payload.action === 'unlock') {
        const verifyResult = verifyCommand(payload);

        if (!verifyResult.valid) {
          console.error(`❌ [REJECTED] Signature verification failed: ${verifyResult.reason}`);
          console.error('🔒 [SECURITY] Relay remains LOCKED.');
          publishEvent('tamper_alert', { error: verifyResult.reason, commandId: payload.commandId });
          return;
        }

        console.log(`✅ [VERIFIED] Cryptographic HMAC & freshness valid! (Command: ${payload.commandId})`);
        const durationSec = payload.durationSeconds || 5;

        // ACTUATE RELAY
        isRelayEnergized = true;
        console.log(`🔓 [RELAY ENERGIZED] >>> 12V LOCK UNLOCKED for ${durationSec} seconds <<<`);
        publishEvent('unlock_ack', { commandId: payload.commandId, durationSeconds: durationSec });

        if (relockTimer) clearTimeout(relockTimer);
        relockTimer = setTimeout(() => {
          isRelayEnergized = false;
          console.log(`🔒 [RELAY DE-ENERGIZED] >>> 12V LOCK RELOCKED (Hardware auto-reset) <<<\n`);
          publishEvent('relock', { doorId, commandId: payload.commandId });
        }, durationSec * 1000);
      }
    } catch (err) {
      console.error('[ERROR] Malformed command packet:', err.message);
    }
  });

  client.on('error', (err) => {
    console.warn(`[MQTT] Warning: ${err.message}. (If no local MQTT broker is running, the backend simulated transport handles testing automatically).`);
  });

  // Heartbeat loop every 20 seconds
  setInterval(() => {
    if (client?.connected) {
      publishEvent('heartbeat', {
        uptimeSeconds: Math.floor(process.uptime()),
        relayState: isRelayEnergized ? 'UNLOCKED' : 'LOCKED',
        freeHeapBytes: 245120,
      });
    }
  }, 20000);
} catch (e) {
  console.log('[LOCAL MODE] Operating in stand-alone verification mode.');
}

function publishEvent(eventType, details) {
  if (client?.connected) {
    const eventTopic = `roar/doors/${doorId}/events`;
    client.publish(
      eventTopic,
      JSON.stringify({
        doorId,
        deviceId,
        eventType,
        details,
        timestamp: Date.now(),
      }),
      { qos: 1 }
    );
  }
}
