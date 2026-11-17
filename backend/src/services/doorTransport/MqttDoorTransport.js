import mqtt from 'mqtt';
import { DoorTransport } from './DoorTransport.js';
import { env } from '../../config/environment.js';
import { logger } from '../../utils/logger.js';

export class MqttDoorTransport extends DoorTransport {
  constructor() {
    super();
    this.name = 'MQTT-TLS';
    this.client = null;
    this.connected = false;
  }

  async init() {
    if (!env.mqttBrokerUrl) {
      throw new Error('MQTT_BROKER_URL is unset. Cannot initialize MQTT transport.');
    }

    const options = {
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      clean: true,
      clientId: `roar_backend_${Math.random().toString(16).slice(2, 8)}`,
    };

    if (env.mqttUsername) {
      options.username = env.mqttUsername;
      options.password = env.mqttPassword;
    }

    return new Promise((resolve) => {
      logger.info(`[TRANSPORT:MQTT] Connecting to broker at ${env.mqttBrokerUrl}...`);
      this.client = mqtt.connect(env.mqttBrokerUrl, options);

      this.client.on('connect', () => {
        this.connected = true;
        logger.info('[TRANSPORT:MQTT] Connected to Managed MQTT Broker.');

        // Subscribe to inbound device telemetry and event reports
        const topic = 'roar/doors/+/events';
        this.client.subscribe(topic, { qos: 1 }, (err) => {
          if (err) {
            logger.error(`[TRANSPORT:MQTT] Failed to subscribe to ${topic}: ${err.message}`);
          } else {
            logger.info(`[TRANSPORT:MQTT] Subscribed to ${topic}`);
          }
        });
        resolve(true);
      });

      this.client.on('message', (topic, message) => {
        try {
          const parts = topic.split('/');
          const doorId = parts[2];
          const payload = JSON.parse(message.toString());
          this.emit('device_event', { doorId, ...payload });
        } catch (err) {
          logger.error(`[TRANSPORT:MQTT] Malformed JSON message on ${topic}: ${err.message}`);
        }
      });

      this.client.on('error', (err) => {
        logger.error(`[TRANSPORT:MQTT] Error: ${err.message}`);
      });

      this.client.on('close', () => {
        this.connected = false;
      });

      // Avoid hanging indefinitely if broker unreachable on boot
      setTimeout(() => {
        if (!this.connected) {
          logger.warn('[TRANSPORT:MQTT] Initial connection timed out. Will continue retrying in background.');
          resolve(false);
        }
      }, 3000);
    });
  }

  async publishUnlockCommand(doorId, signedCommand) {
    if (!this.client || !this.connected) {
      logger.warn(`[TRANSPORT:MQTT] Cannot publish unlock command to ${doorId}: Broker disconnected.`);
      return false;
    }

    const topic = `roar/doors/${doorId}/command`;
    const payload = JSON.stringify({
      action: 'unlock',
      ...signedCommand,
    });

    return new Promise((resolve) => {
      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          logger.error(`[TRANSPORT:MQTT] Failed to publish unlock command to ${topic}: ${err.message}`);
          resolve(false);
        } else {
          logger.info(`[TRANSPORT:MQTT] Published unlock command to ${topic}`);
          resolve(true);
        }
      });
    });
  }

  async publishLockdown(doorId, isLockedDown) {
    if (!this.client || !this.connected) return false;

    const topic = `roar/doors/${doorId}/command`;
    const payload = JSON.stringify({
      action: isLockedDown ? 'lockdown_enable' : 'lockdown_disable',
      timestamp: Date.now(),
    });

    return new Promise((resolve) => {
      this.client.publish(topic, payload, { qos: 1, retain: true }, (err) => {
        if (err) resolve(false);
        else resolve(true);
      });
    });
  }

  async disconnect() {
    if (this.client) {
      return new Promise((resolve) => {
        this.client.end(false, () => {
          this.connected = false;
          resolve();
        });
      });
    }
  }
}
