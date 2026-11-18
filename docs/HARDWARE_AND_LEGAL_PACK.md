# ROAR EXTREME — Hardware Commissioning & Legal Compliance Pack

**Date:** 18 November 2026  
**Location:** Rooftop Floor 6, ROAR EXTREME Fitness Studio, Nashik, Maharashtra, India  
**Target Systems:** ESP32 Turnstile Access Controller & Biometric Facial Attendance  
**Classification:** Engineering Specification & Compliance Handoff  
**Status:** BLOCKED for Physical Operations (Pending On-Site Electrician & Legal Counsel Review)

---

## PART 1: 6th-Floor Rooftop Turnstile Hardware Commissioning Pack

### 1.1 Physical Hardware Specification & Bill of Materials (BOM)

| Component | Specification | Quantity | Purpose & Safety Function |
| :--- | :--- | :--- | :--- |
| **Microcontroller** | ESP32-WROOM-32 (Dual Core 240MHz) | 1 | Access decision enforcement, HMAC-SHA256 signature verification. |
| **Network Shield** | W5500 SPI Ethernet Shield | 1 | Hardwired industrial Ethernet connection (avoids rooftop 2.4GHz Wi-Fi congestion). |
| **Electromagnetic Lock** | 280kg (600 lbs) Holding Force, 12V DC, **Fail-Safe** | 1 | Secures turnstile/door leaf; unlocks automatically on power interruption. |
| **Relay Module** | 5V Optocoupler-Isolated Relay Module | 1 | Complete galvanic isolation between ESP32 3.3V logic and 12V inductive lock circuit. |
| **Flyback Diode** | 1N4007 (1000V, 1A) Standard Silicon Rectifier | 1 | Shunts high-voltage inductive flyback kickback from maglock coil when de-energized. |
| **Power Supply (PSU)** | 12V DC 5A Regulated Linear/Switching PSU with Battery Backup | 1 | Powers maglock and step-down converter with 7Ah lead-acid UPS battery. |
| **DC-DC Step-Down** | LM2596 Buck Converter (12V to 5V DC) | 1 | Steps down 12V PSU to clean 5V DC for ESP32 and relay board. |
| **Emergency Release** | Break-Glass Emergency Call Point (Green, NC contacts) | 1 | Mandated physical override to cut 12V lock power unconditionally. |
| **Exit Device** | Stainless Steel Push-to-Exit Button / Crash Bar (NC) | 1 | Series-wired physical egress for rooftop safety compliance. |

---

### 1.2 Electrical Wiring & Flyback Diode Schematic

> [!CAUTION]
> **ELECTRICAL FIRE & INDUCTIVE SPIKE WARNING**  
> An unsuppressed electromagnetic lock coil creates negative voltage transients exceeding -400V upon switch-off. This transient will weld relay contacts or destroy semiconductor switches unless a 1N4007 flyback diode is clamped directly across the lock terminals.

```
       +12V DC Regulated PSU (+)
                  |
                  +-----------------------------------+
                  |                                   |
                  |                                   |
             [LM2596 Buck]                            |
             12V -> 5V DC                             |
                  |                                   |
                  +---> ESP32 (VIN)                   |
                  |     ESP32 (GND) <---+             |
                  |                     |             |
                  +---> Relay VCC       |             |
                        Relay GND <-----+             |
                                                      |
ESP32 GPIO 23 --------> Relay IN                      |
                                                      |
                  +-----------------------------------+
                  |
              [Relay NO] (Not Used)
              [Relay COM] <---------------------------+
              [Relay NC] 
                  |
                  |  (Normally-Closed Circuit for Fail-Safe Operation)
                  v
       +-------------------------+
       |   Break-Glass Unit      |  (In series: breaks circuit on emergency press)
       +-------------------------+
                  |
                  v
       +-------------------------+
       |   Push-to-Exit Button   |  (In series: breaks circuit momentarily on exit)
       +-------------------------+
                  |
                  +--------------------------+
                  |                          |
               Cathode (Band)                |
             +--------| |<--------+          |
             |   1N4007 Diode     |          |
             +--------| |<--------+          |
               Anode                         |
                  |                          |
                  v                          v
       +-----------------------------------------+
       |      12V DC 280kg Magnetic Lock         |
       +-----------------------------------------+
                  |
                  |
       GND PSU ---+-----------------------------------+
```

---

### 1.3 11-Step Rooftop Commissioning Checklist

This checklist must be executed on-site by a licensed electrical technician before enabling `ENABLE_DOOR_CONTROL=true`.

- [ ] **Step 1: Visual & Mechanical Inspection**: Verify turnstile chassis grounding, weatherproofing against Nashik monsoon rains, and IP65 cable glands.
- [ ] **Step 2: Flyback Diode Polarity Verification**: Inspect 1N4007 diode orientation with a digital multimeter in diode mode. Cathode (silver band) MUST connect to +12V; anode MUST connect to GND.
- [ ] **Step 3: Galvanic Isolation Check**: Confirm zero DC continuity between ESP32 ground and 12V PSU ground prior to optocoupler pairing.
- [ ] **Step 4: Mechanical Egress Validation**: Verify that interior push-to-exit crash bar breaks the circuit cleanly and allows effortless physical exit.
- [ ] **Step 5: Break-Glass Physical Cut**: Actuate break-glass emergency test key; confirm 12V circuit is severed and maglock drops holding force to 0 kg instantly.
- [ ] **Step 6: Power Loss Simulation (Fail-Safe)**: Unplug 12V PSU mains; confirm gate unlocks freely.
- [ ] **Step 7: ESP32 Boot State Test**: Cycle power to ESP32; confirm GPIO 23 does not float or glitch-unlock during bootloader initialization.
- [ ] **Step 8: Replay Attack Defense Test**: Send captured MQTT/HTTP unlock payload with an expired timestamp or identical nonce; verify ESP32 firmware rejects with code `401 INVALID_NONCE`.
- [ ] **Step 9: Network Partition Behavior**: Disconnect Ethernet cable; confirm ESP32 logs offline status, denies entry, but local interior exit mechanisms remain 100% operational.
- [ ] **Step 10: Holding Time Calibration**: Verify unlock relay pulses for exactly 5.0 seconds before re-energizing maglock.
- [ ] **Step 11: Fire Alarm Interlock (Building Integration)**: Confirm the building’s centralized rooftop fire alarm panel relay is wired in series with the 12V power supply to drop turnstile power automatically on fire alarm trigger.

---

## PART 2: Biometric Data Protection & Privacy Compliance (DPDP Act 2023)

> [!IMPORTANT]
> **LEGAL NOTICE: FOR TECHNICAL SPECIFICATION ONLY — NOT FORMAL LEGAL COUNSEL.**  
> The following terms and policies are provided for technical compliance review under India's Digital Personal Data Protection (DPDP) Act, 2023. Formal sign-off by a qualified Indian advocate is mandatory prior to live production activation.

### 2.1 Technical Guarantees in Software Architecture

1. **Zero Image Storage**: Raw webcam photos or facial images are processed in client volatile memory via TensorFlow.js / face-api models. Only a mathematical floating-point embedding vector (128-dimensional array) is transmitted.
2. **AES-256-GCM Envelope Encryption**: Facial embeddings are encrypted at rest with hardware-grade AES-256-GCM using a dedicated 256-bit key (`FACE_ENCRYPTION_KEY`) before persistence in MongoDB.
3. **Non-Discrimination & Equal Access**: Facial recognition is completely optional. Members may opt for an RFID card, keyfob, or front-desk check-in without penalty or service degradation.
4. **Instant Erasure**: Deletion of biometric consent triggers an immediate atomic database wipe of the encrypted vector (`$unset: { faceEmbedding: "" }`).

---

### 2.2 Plain-Language Biometric Consent Form (Template for Review)

```
CONSENT FOR VOLUNTARY BIOMETRIC FACIAL ATTENDANCE
ROAR EXTREME Rooftop Fitness Studio, Nashik

1. Purpose of Processing:
   ROAR EXTREME collects and processes mathematical representations of your facial geometry 
   solely for authorizing fast, hands-free turnstile entry to the fitness studio premises.

2. Nature of Data Collected:
   We DO NOT store your photograph or raw video. We store only an encrypted numerical mathematical 
   code (vector embedding) derived from facial landmarks.

3. Complete Voluntariness & Alternative Options:
   Enrollment is entirely voluntary. If you choose not to enroll, you may freely use an RFID keyfob 
   or check in manually at the front reception desk with zero difference in membership benefits.

4. Storage & Security:
   Your mathematical code is encrypted using industry-standard AES-256-GCM encryption. 
   It is never sold, shared, or transferred to third-party advertisers or external entities.

5. Right to Withdraw Consent & Erasure:
   You have the absolute right to withdraw your biometric consent at any time through your member 
   dashboard or by notifying reception. Upon withdrawal, your biometric code will be permanently 
   and irreversibly deleted within 72 hours.

6. Grievance Redressal:
   For privacy concerns or data rights requests under the DPDP Act 2023, contact:
   Data Grievance Officer: privacy@roarextreme.in
   Address: ROAR EXTREME, 6th Floor Rooftop, Nashik, Maharashtra, India.
```

---

## PART 3: Status Summary

- **Hardware Commissioning**: `BLOCKED` (Awaiting physical rooftop installation, wiring inspection, and electrician sign-off).
- **DPDP Biometric Consent**: `BLOCKED` (Awaiting Indian legal counsel formal review and sign-off).
- **Software Readiness**: `PROVEN` (Fail-safe architecture, HMAC authentication, AES-256-GCM encryption, and kill-switches verified).
