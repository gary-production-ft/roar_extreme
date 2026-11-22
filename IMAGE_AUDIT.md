# Roar Extreme Image Audit (IMAGE_AUDIT.md)

Audit conducted in accordance with defect **D13** on all image assets stored under `src/assets/roar/`.
Every asset was inspected for actual visual content, dimensions, file size, label accuracy, and integrity.

---

## 1. Complete Asset Audit Table

| File Path | Original Label / Purpose | Actual Visual Content | Dimensions | File Size | Verdict & Action |
|:---|:---|:---|:---|:---|:---|
| `branding/roar-logo.jpg` | Brand Wordmark & Crest | High-res Roar Extreme lion crest on dark background | 944 x 944 | 46.6 KB | **APPROVED (MATCH)**: Used in navbar, brand identity. |
| `branding/roar-branding-signage.jpg` | Gym Wall Art / Signage | Authentic high-contrast ROAR gym wall graphics inside Nashik facility | 1000 x 562 | 133.6 KB | **APPROVED (MATCH)**: Used in About editorial section. |
| `hero/hero-main.jpg` | Hero Main Arena | High-angle perspective of Nashik rooftop interior training floor looking toward bright terrace doorway | 1200 x 1600 | 331.4 KB | **APPROVED (MATCH)**: Used in Hero section. Scrim added for contrast. |
| `gym-interior/interior-floor.jpg` | Main Gym Floor | Wide open gym conditioning floor with rubber impact turf and resistance stations | 800 x 600 | 44.5 KB | **APPROVED (MATCH)**: Used in Gallery and General Gym Training service. |
| `gym-interior/cable-crossover.jpg` | Dual Cable Multi-Station | Commercial dual-pulley cable crossover tower with multi-grip pull-up bar | 675 x 1200 | 89.3 KB | **APPROVED (MATCH)**: Used in Gallery (Strength). |
| `strength-training/strength-dumbbells.jpg` | Dumbbells & Free Weights | Graduated rubber-coated dumbbell rack with pairs from 2.5 kg to heavy increments | 675 x 1200 | 74.0 KB | **APPROVED (MATCH)**: Used in Strength Training service & Gallery. |
| `strength-training/bench-press-station.jpg` | Olympic Bench Press Station | Commercial Olympic flat bench press with barbell catches, bar, and weight horns | 800 x 450 | 105.8 KB | **APPROVED (MATCH)**: Used in Strength service & Gallery. |
| `cardio/cardio-treadmills.jpg` | Cardiovascular Treadmill Line | Bank of commercial motorized treadmills with electronic consoles facing mirrors | 800 x 1067 | 175.0 KB | **APPROVED (MATCH)**: Used in Cardio Fitness service & Gallery. |
| `group-fitness/functional-rig.jpg` | CrossFit & Functional Rig | Heavy-duty steel functional rig with chin-up bars, dip horns, and gymnastics rings | 800 x 400 | 76.9 KB | **APPROVED (MATCH)**: Used in Functional Training service & Gallery. |
| `group-fitness/zumba-dance-floor.jpg` | Zumba & Aerobics Studio | Open aerobic studio floor with shock-absorbing surface and mirrored wall | 800 x 1067 | 255.3 KB | **APPROVED (MATCH)**: Used in Zumba service & Gallery. |
| `facilities/facility-aircon.jpg` | Air-Conditioned Facility | High-output industrial ceiling HVAC duct and cassette air conditioning units | 800 x 800 | 89.1 KB | **APPROVED (MATCH)**: Used in Amenities and Facilities gallery. |
| `facilities/lockers-changing.jpg` | Lockers & Changing Rooms | Clean wooden personal day lockers and changing room corridor | 800 x 450 | 111.0 KB | **APPROVED (MATCH)**: Deduplicated; used once for Lockers & Changing Rooms. |
| `gallery/gallery-01.jpg` | Lat Pulldown / Cable Tower | Commercial selectorized lat pulldown and seated cable row machine | 800 x 1067 | 189.6 KB | **APPROVED (MATCH)**: Categorized under Strength. |
| `gallery/gallery-02.jpg` | Selectorized Weight Stacks | Multi-station selectorized pin-loaded resistance machines in sequence | 800 x 600 | 118.6 KB | **APPROVED (MATCH)**: Categorized under Strength. |
| `gallery/gallery-03.jpg` | Cardio Ellipticals | Row of heavy-duty commercial elliptical cross-trainers | 800 x 600 | 132.7 KB | **APPROVED (MATCH)**: Categorized under Cardio. |
| `gallery/gallery-04.jpg` | 45-Degree Leg Press | Heavy-duty 45-degree angle linear leg press sled loaded with Olympic plates | 675 x 1200 | 93.4 KB | **APPROVED (MATCH)**: Categorized under Strength. |
| `gallery/gallery-05.jpg` | Barbell & Plate Racks | Olympic weight trees, bumper plates, and barbell storage corner | 800 x 600 | 93.2 KB | **APPROVED (MATCH)**: Categorized under Strength. |
| `gallery/gallery-06.jpg` | Mislabeled "Personal Coach Station" | Seated leg extension / hamstring curl machine (NOT a trainer coaching corner) | 800 x 1067 | 86.4 KB | **RELABELED**: Correctly labeled as "Seated Leg Extension Station" under Strength. Removed from Personal Trainer service card. |
| `kickboxing/combat-kickboxing.jpg` | Combat & Kickboxing Area | Corrupted 4.8 KB asset displaying a solid black rectangle with generic play icon | 640 x 352 | 4.8 KB | **REMOVED (CORRUPTED / FAKE)**: Purged from gallery and services. Added to `OWNER_INPUTS.md` shot-list. |

---

## 2. Remediation Summary

1. **Purged Fake & Corrupted Asset**: `src/assets/roar/kickboxing/combat-kickboxing.jpg` was a broken 4.8 KB placeholder. It has been excluded from all public layouts.
2. **Corrected Mismatched Labels**:
   - `gallery-06.jpg` is a leg extension machine, not a 1-on-1 personal coaching corner. Relabeled in `gallery.ts`.
   - In `services.ts`, "CARDIO FITNESS" was erroneously paired with `benchPressImg` (Olympic bench press). Re-linked to `cardioTreadmillsImg`.
   - Hidden unphotographed services (Combat Kickboxing, Personal Trainer 1-on-1 Corner) until genuine photography is supplied by the gym owner.
3. **Dimensions & Lazy Loading**: Every `<img>` across `Hero`, `About`, `Gallery`, `Amenities`, and `Training` now provides explicit `width` and `height` alongside `loading="lazy"` to eliminate Cumulative Layout Shift (CLS).
4. **No Color Alterations**: Images are rendered with their native photography—zero recoloring, filters, or synthetic AI gym generations.
