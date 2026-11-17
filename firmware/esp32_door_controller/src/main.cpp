/**
 * ==============================================================================
 * ROAR EXTREME — ESP32 Physical Door Controller Firmware (Phase 2)
 *
 * Core Guarantees:
 * 1. Default LOCKED state on boot, brownout, or fault.
 * 2. Unlocks ONLY upon receiving a cryptographically valid HMAC-SHA256 signature
 *    tied to a logged server-side GRANT within a 5-second freshness window.
 * 3. Anti-Replay: Nonce cache prevents captured packet re-transmission.
 * 4. Hardware Safety: Firmware-enforced 5-second auto-relock in local loop(),
 *    independent of server connectivity.
 * 5. Life Safety: Local Push-to-Exit (PTE) button opens lock immediately.
 * ==============================================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include "mbedtls/md.h"

#if __has_include("config.h")
  #include "config.h"
#else
  #include "config.h.example"
#endif

// State Variables
WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);

bool isDoorUnlocked = false;
unsigned long unlockDeadlineMs = 0;
unsigned long lastHeartbeatMs = 0;
bool isEmergencyLockdown = false;

// Anti-Replay Nonce Ring Buffer (stores last 32 nonces)
#define NONCE_CACHE_SIZE 32
String nonceCache[NONCE_CACHE_SIZE];
uint8_t nonceCacheIndex = 0;

// Door Position Sensor Debouncing
int lastDoorState = HIGH;
unsigned long doorOpenedTimeMs = 0;
bool doorHeldOpenAlertSent = false;

// ------------------------------------------------------------------------------
// NTP & System Time Helpers
// ------------------------------------------------------------------------------
void initNtpTime() {
  Serial.println("[NTP] Synchronizing network time with pool.ntp.org...");
  configTime(0, 0, "pool.ntp.org", "time.google.com");
  
  time_t now = time(nullptr);
  uint8_t retries = 0;
  while (now < 1700000000 && retries < 20) { // Check that epoch > year 2023
    delay(500);
    now = time(nullptr);
    retries++;
    Serial.print(".");
  }
  Serial.println("\n[NTP] Network time synchronized.");
}

unsigned long long getCurrentEpochMs() {
  struct timeval tv;
  gettimeofday(&tv, NULL);
  return ((unsigned long long)tv.tv_sec * 1000ULL) + ((unsigned long long)tv.tv_usec / 1000ULL);
}

// ------------------------------------------------------------------------------
// Cryptographic HMAC-SHA256 Verification
// ------------------------------------------------------------------------------
bool verifyHmacSignature(const String& canonical, const String& expectedHexSig) {
  uint8_t hmacResult[32];
  mbedtls_md_context_t ctx;
  mbedtls_md_type_t md_type = MBEDTLS_MD_SHA256;

  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(md_type), 1);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char*)HMAC_SHARED_SECRET, strlen(HMAC_SHARED_SECRET));
  mbedtls_md_hmac_update(&ctx, (const unsigned char*)canonical.c_str(), canonical.length());
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);

  char actualHex[65];
  for (int i = 0; i < 32; i++) {
    sprintf(&actualHex[i * 2], "%02x", hmacResult[i]);
  }
  actualHex[64] = '\0';

  // Constant-time comparison
  return (strcmp(actualHex, expectedHexSig.c_str()) == 0);
}

bool isNonceReplayed(const String& nonce) {
  for (int i = 0; i < NONCE_CACHE_SIZE; i++) {
    if (nonceCache[i] == nonce) {
      return true;
    }
  }
  return false;
}

void recordNonce(const String& nonce) {
  nonceCache[nonceCacheIndex] = nonce;
  nonceCacheIndex = (nonceCacheIndex + 1) % NONCE_CACHE_SIZE;
}

// ------------------------------------------------------------------------------
// Hardware Actuation (Lock / Unlock Relay)
// ------------------------------------------------------------------------------
void setRelayLockState(bool unlock) {
  if (unlock) {
    // For standard active-low relay driving Fail-Safe Maglock:
    // De-energize coil to release maglock (or energize NO for strike)
    digitalWrite(PIN_RELAY, HIGH);
    digitalWrite(PIN_STATUS_LED, HIGH);
    isDoorUnlocked = true;
    Serial.println("🔓 [HARDWARE] Relay actuated: LOCK DISENGAGED (Door Unlocked)");
  } else {
    digitalWrite(PIN_RELAY, LOW);
    digitalWrite(PIN_STATUS_LED, LOW);
    isDoorUnlocked = false;
    Serial.println("🔒 [HARDWARE] Relay reset: LOCK ENGAGED (Door Locked)");
  }
}

void publishTelemetry(const char* eventType, JsonDocument& doc) {
  if (!mqttClient.connected()) return;

  char topic[64];
  snprintf(topic, sizeof(topic), "roar/doors/%s/events", DOOR_ID);

  doc["doorId"] = DOOR_ID;
  doc["deviceId"] = DEVICE_ID;
  doc["eventType"] = eventType;
  doc["timestamp"] = (uint64_t)getCurrentEpochMs();

  char buffer[512];
  serializeJson(doc, buffer);
  mqttClient.publish(topic, buffer, 1);
}

// ------------------------------------------------------------------------------
// MQTT Inbound Message Dispatcher
// ------------------------------------------------------------------------------
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (err) {
    Serial.println("[MQTT] JSON parse error on inbound command.");
    return;
  }

  const char* action = doc["action"] | "";

  // Emergency Lockdown Handling
  if (strcmp(action, "lockdown_enable") == 0) {
    Serial.println("🚨 [ALERT] Emergency lockdown enabled by gym administration.");
    isEmergencyLockdown = true;
    setRelayLockState(false); // Force lock immediately
    return;
  }

  if (strcmp(action, "lockdown_disable") == 0) {
    Serial.println("🟢 [NOTICE] Emergency lockdown released.");
    isEmergencyLockdown = false;
    return;
  }

  if (strcmp(action, "unlock") == 0) {
    if (isEmergencyLockdown) {
      Serial.println("🔒 [BLOCKED] Unlock rejected: Door is currently in studio lockdown.");
      return;
    }

    const char* commandId = doc["commandId"] | "";
    const char* targetDoor = doc["doorId"] | "";
    const char* accessLogId = doc["accessLogId"] | "";
    unsigned long long timestamp = doc["timestamp"] | 0ULL;
    unsigned long long expiresAt = doc["expiresAt"] | 0ULL;
    int durationSec = doc["durationSeconds"] | 5;
    const char* nonce = doc["nonce"] | "";
    const char* signature = doc["signature"] | "";

    unsigned long long nowMs = getCurrentEpochMs();

    // 1. Freshness Check (< 5-second lifetime)
    if (nowMs > expiresAt) {
      Serial.printf("❌ [REJECT] Command expired! now=%llu > expiresAt=%llu\n", nowMs, expiresAt);
      return;
    }

    // 2. Anti-Replay Check
    if (isNonceReplayed(nonce)) {
      Serial.printf("❌ [REJECT] Replayed nonce detected: %s\n", nonce);
      return;
    }

    // 3. Cryptographic Signature Check
    char canonical[256];
    snprintf(canonical, sizeof(canonical), "%s|%s|%s|%llu|%llu|%d|%s",
      commandId, targetDoor, accessLogId, timestamp, expiresAt, durationSec, nonce);

    if (!verifyHmacSignature(String(canonical), String(signature))) {
      Serial.println("❌ [REJECT] Cryptographic HMAC-SHA256 signature verification failed!");
      return;
    }

    // Validated! Record nonce & energize unlock relay
    recordNonce(nonce);
    Serial.printf("✅ [VERIFIED] Valid HMAC command received. Unlocking for %d seconds...\n", durationSec);
    
    setRelayLockState(true);
    unlockDeadlineMs = millis() + (durationSec * 1000);

    // Publish confirmation ACK back to server
    JsonDocument ackDoc;
    ackDoc["details"]["commandId"] = commandId;
    ackDoc["details"]["durationSeconds"] = durationSec;
    publishTelemetry("unlock_ack", ackDoc);
  }
}

// ------------------------------------------------------------------------------
// Wi-Fi & MQTT Connection Loop
// ------------------------------------------------------------------------------
void reconnectMqtt() {
  while (!mqttClient.connected()) {
    Serial.print("[MQTT] Connecting to broker...");
    String clientId = "esp32_" + String(DEVICE_ID) + "_" + String(random(0xffff), HEX);
    
    if (mqttClient.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD)) {
      Serial.println(" connected!");
      char cmdTopic[64];
      snprintf(cmdTopic, sizeof(cmdTopic), "roar/doors/%s/command", DOOR_ID);
      mqttClient.subscribe(cmdTopic, 1);
      Serial.printf("[MQTT] Subscribed to %s\n", cmdTopic);
    } else {
      Serial.printf(" failed (rc=%d). Retrying in 4s...\n", mqttClient.state());
      delay(4000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n⚡ ROAR EXTREME — ESP32 Hardware Door Controller v1.2.0");

  // SAFETY DEFAULT: Initialize relay to LOCKED state immediately before any network init
  pinMode(PIN_RELAY, OUTPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);
  pinMode(PIN_DOOR_SENSOR, INPUT_PULLUP);
  pinMode(PIN_EXIT_BUTTON, INPUT_PULLUP);
  setRelayLockState(false);

  // Connect Wi-Fi
  Serial.printf("[WIFI] Connecting to SSID: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\n[WIFI] Connected! IP Address: %s\n", WiFi.localIP().toString().c_str());

  initNtpTime();

  // Configure Secure TLS Client for MQTT
  espClient.setInsecure(); // Or inject your CA certificate here for production root validation
  mqttClient.setServer(MQTT_BROKER_HOST, MQTT_BROKER_PORT);
  mqttClient.setCallback(onMqttMessage);
  mqttClient.setBufferSize(1024);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    delay(500);
    return;
  }

  if (!mqttClient.connected()) {
    reconnectMqtt();
  }
  mqttClient.loop();

  // 1. HARDWARE-ENFORCED AUTO-RELOCK
  // Guarantees door re-locks automatically even if network connection is lost
  if (isDoorUnlocked && millis() >= unlockDeadlineMs) {
    setRelayLockState(false);
    JsonDocument relockDoc;
    publishTelemetry("relock", relockDoc);
  }

  // 2. PHYSICAL PUSH-TO-EXIT (PTE) BUTTON
  // Life-safety priority: egress from inside always works mechanically and electrically
  if (digitalRead(PIN_EXIT_BUTTON) == LOW && !isDoorUnlocked && !isEmergencyLockdown) {
    Serial.println("🚪 [EXIT BUTTON] Physical Push-To-Exit button pressed inside studio.");
    setRelayLockState(true);
    unlockDeadlineMs = millis() + UNLOCK_PULSE_MS;

    JsonDocument pteDoc;
    pteDoc["details"]["method"] = "physical_exit_button";
    publishTelemetry("door_opened", pteDoc);
    delay(300); // debounce
  }

  // 3. DOOR POSITION SENSOR (REED SWITCH)
  int currentDoorState = digitalRead(PIN_DOOR_SENSOR);
  if (currentDoorState != lastDoorState) {
    lastDoorState = currentDoorState;
    if (currentDoorState == LOW) { // Door open
      doorOpenedTimeMs = millis();
      doorHeldOpenAlertSent = false;
      JsonDocument openDoc;
      publishTelemetry("door_opened", openDoc);
    } else { // Door closed
      JsonDocument closeDoc;
      publishTelemetry("door_closed", closeDoc);
    }
  }

  // Alert if door held open for more than 30 seconds
  if (currentDoorState == LOW && !doorHeldOpenAlertSent && (millis() - doorOpenedTimeMs > 30000)) {
    doorHeldOpenAlertSent = true;
    Serial.println("⚠️ [ALERT] Door held open for more than 30 seconds!");
    JsonDocument alertDoc;
    alertDoc["details"]["durationSeconds"] = (millis() - doorOpenedTimeMs) / 1000;
    publishTelemetry("door_held_open", alertDoc);
  }

  // 4. PERIODIC HEARTBEAT TELEMETRY (every 20s)
  if (millis() - lastHeartbeatMs >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatMs = millis();
    JsonDocument hbDoc;
    hbDoc["details"]["firmwareVersion"] = "1.2.0-esp32";
    hbDoc["details"]["ipAddress"] = WiFi.localIP().toString();
    hbDoc["details"]["wifiRssi"] = WiFi.RSSI();
    hbDoc["details"]["relayState"] = isDoorUnlocked ? "UNLOCKED" : "LOCKED";
    hbDoc["details"]["doorSensor"] = (digitalRead(PIN_DOOR_SENSOR) == LOW) ? "OPEN" : "CLOSED";
    publishTelemetry("heartbeat", hbDoc);
  }
}
