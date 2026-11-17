# ⚡ ROAR EXTREME — ESP32 Physical Door Controller (Phase 2)

Firmware and hardware design for the ROAR EXTREME 6th-floor rooftop turnstile/door access lock.

---

## 🔌 Hardware Wiring Diagram

```
                       +---------------------------------------+
                       |           ESP32 Dev Module            |
                       |                                       |
                       |  GPIO 23 -------------------------> IN (Relay Control)
                       |  GPIO 4  <--- [Magnetic Reed Switch] - GND (Internal Pullup)
                       |  GPIO 5  <--- [Push-to-Exit Button] -- GND (Internal Pullup)
                       |  GND --------------------------------- GND (Common Ground)
                       |  5V (USB) <-- Dedicated 5V 2A Adapter |
                       +---------------------------------------+

+--------------------+          +-----------------------------------------+
| 12V 3A DC Adapter  |          |       5V Optocoupled Relay Board        |
|                    |          |                                         |
| (+) 12V -----------+--------> | COM                                     |
|                    |          | NC (for Fail-Safe Maglock) -----------+ |
| (-) GND -----------+----+     +---------------------------------------|-+
+--------------------+    |                                             |
                          |     +---------------------------------------v-+
                          |     |      12V Electromagnetic Lock / Strike  |
                          |     |                                         |
                          +---> | (-) Terminal         (+) Terminal <-----+
                                |       |                   |             |
                                |       +----[|< 1N4007]----+             |
                                |       (Flyback Diode in Reverse Bias)   |
                                +-----------------------------------------+
```

---

## ⚡ Electrical Safety & Inductive Noise Suppression

1. **Power Isolation:**
   - **DO NOT** power the ESP32 from the same 12V supply feeding the maglock without an isolated DC-DC step-down regulator. Inductive loads pulling 500mA–1500mA cause momentary voltage dips that trigger ESP32 brownout detector resets.
2. **Flyback Diode (1N4007 / 1N5408):**
   - Inductive coils (maglocks, solenoid strikes) generate massive back-EMF reverse voltage spikes (100V+) when current is suddenly disconnected by the relay.
   - Install a **1N4007 rectifier diode directly across the lock terminals**:
     - **Cathode (stripe side)** ➔ connected to **+12V**.
     - **Anode** ➔ connected to **GND / Common Negative**.

---

## 🚒 Life-Safety & Fire Egress Rules

- **Fail-Safe Operation (Maglock):**
  - Relay uses the **NC (Normally Closed)** contacts. When electrical power is active, the relay holds the lock energized. When power cuts, the maglock de-energizes instantly and unlocks.
- **Physical Push-To-Exit (PTE):**
  - In addition to software trigger, wire an analog mechanical push-to-exit button directly into the power loop in series with an Emergency Break-Glass unit. This guarantees exit even if the microcontroller freezes or fails completely.

---

## 🛠️ Flashing the Firmware

1. Install [PlatformIO](https://platformio.org/) (VS Code Extension or CLI).
2. Copy `include/config.h.example` to `include/config.h`:
   ```bash
   cp include/config.h.example include/config.h
   ```
3. Update Wi-Fi credentials, HiveMQ/MQTT broker address, and device secret in `include/config.h`.
4. Connect ESP32 via USB and upload:
   ```bash
   pio run --target upload
   pio device monitor
   ```
