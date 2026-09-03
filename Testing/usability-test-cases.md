# Usability Test Cases — MuvMi App Revamp

> Based on `testing_goals.md` and the interactive prototype in this project.
> All tasks run on the prototype — moderator switches variations via Proto Console.

---

## Pre-test Setup

| Item | Detail |
|---|---|
| Prototype URL | GitHub Pages or `localhost:8080` |
| Device | Mobile phone browser (393×852 viewport) or desktop preview |
| Proto Console | Use FAB button to switch variations, reset state |
| Reset between tasks | Console → Reset (clears localStorage + sessionStorage) |

---

## Task 1 · First-time Booking (End-to-End)

**Supports:** Testing Goal 1 (first booking without assistance), Goal 4 (correct selection)
**User type:** New User
**Variation:** V1

### Setup
Console → `setVariation(1)` → Reset

### Scenario (read to participant)
> "คุณเพิ่งลง app MuvMi เป็นครั้งแรก คุณอยู่แถว EmQuartier และต้องการไป Siam Paragon ลองจองรถดู"

### Expected flow
1. Home → tap destination input → Search page
2. Type "Siam" → select "Siam Paragon" from results
3. Select Drop-off → choose hop-point → confirm
4. Select Pickup → choose hop-point (closest pre-selected) → confirm
5. Service Selection → select service type → Next
6. Request → adjust passengers if needed → "Request Tuk Tuk"
7. Tracking screen → "Ride Requested!"

### Observe
- Can they complete without help?
- Do they understand hop-points (pickup vs drop-off)?
- Do they understand shared ride / zone model?
- Any hesitation or wrong taps?

### Measure
| Metric | Target |
|---|---|
| Completion rate | ≥ 90% unassisted |
| SEQ (1-7) | ≥ 5.5 |
| Total taps | Count |
| Time to complete | Record |
| Errors | Count wrong selections |

### Post-task questions
1. "ขั้นตอนไหนที่รู้สึกสับสนที่สุด?"
2. "คุณเข้าใจว่า hop-point คืออะไรไหม?"
3. "รถที่จองเป็นรถส่วนตัวหรือรถร่วม?"

---

## Task 2 · Repeat Trip — Go Again (Casual User)

**Supports:** Testing Goal 2 (faster regular flow)
**User type:** Casual
**Variation:** V2

### Setup
Console → `setVariation(2)` → Reset

### Scenario
> "คุณเคยไป Phrom Phong BTS มาก่อน อยากไปอีกครั้ง ลองจองรถดู"

### Expected flow
1. Home → see "Go Again" section → tap "Phrom Phong BTS" card
2. → Select Pickup → confirm → Service Selection → Request → Tracking

### Observe
- Do they notice and use Go Again cards?
- How many fewer taps vs Task 1?

### Measure
| Metric | Target |
|---|---|
| SEQ (1-7) | ≥ 5.5 |
| Taps | Fewer than Task 1 |
| Time | Faster than Task 1 |

### Post-task questions
1. "รู้สึกว่าเร็วขึ้นไหมเมื่อเทียบกับครั้งแรก?"
2. "ส่วน 'Go Again' มีประโยชน์ไหม?"

---

## Task 3 · Repeat Trip — Saved Places (Recurring User)

**Supports:** Testing Goal 2 (faster regular flow)
**User type:** Recurring
**Variation:** V3

### Setup
Console → `setVariation(3)` → Reset

### Scenario
> "คุณบันทึกที่ทำงาน (Work) ไว้แล้ว ตอนนี้อยากไปทำงาน ลองจองรถดู"

### Expected flow
1. Home → see "Saved Places" → tap "Work"
2. → Select Pickup → confirm → Service Selection → Request → Tracking

### Observe
- Do they understand Saved Places?
- Do they use it immediately or explore other options first?

### Measure
| Metric | Target |
|---|---|
| SEQ (1-7) | ≥ 5.5 |
| Taps | Count (should be minimal) |
| Time | Record |

### Post-task questions
1. "ส่วน 'Saved Places' ใช้งานง่ายไหม?"
2. "อยากเพิ่มอะไรใน Saved Places อีกไหม?"

---


## Task 5 · Explore & Discover + Save Favorite

**Supports:** Testing Goal 3 (notice promotions/places), Goal 2 (save for reuse)
**User type:** New/Casual
**Variation:** V1 or V4

### Setup
Console → `setVariation(1)` → Reset

### Scenario (Part A — Explore)
> "ลองดูในแอปว่ามีที่ไหนน่าสนใจไปบ้าง สำรวจตามสบาย"

### Observe (Part A)
- Do they scroll and explore place cards?
- Do they notice offer banners?
- Do they tap a place card → see the dialog?

### Scenario (Part B — Save)
> "ถ้าเจอที่ที่ชอบ ลองบันทึกไว้เพื่อใช้ครั้งหน้า"

### Expected flow (Part B)
1. Open any place card → hp dialog
2. Find "Save" button next to Opening Hours
3. Tap Save → bottom sheet → name + label → Save
4. Button changes to "Saved"
5. Back to Home → Saved Places section shows new item

### Measure
| Metric | Target |
|---|---|
| Noticed promotions? | Yes/No + what they recall |
| Found Save button? | Yes/No + time to find |
| Completed save? | Yes/No |
| SEQ (1-7) | ≥ 5.5 |

### Post-task questions (awareness recall)
1. "เห็นโปรโมชั่นอะไรบ้างไหม?"
2. "โปรโมชั่นนั้นให้ส่วนลดเท่าไหร่?"
3. "สถานที่ไหนน่าสนใจที่สุด?"
4. "การบันทึกสถานที่ทำได้ง่ายไหม?"

---

## Task 6 · Correct Passengers & Private Car

**Supports:** Testing Goal 4 (correct pax/service on first attempt)
**User type:** Any
**Variation:** V1

### Setup
Complete flow to Request page (or navigate directly via Console → Pages → Request)

### Scenario
> "คุณจะไปกับเพื่อน 3 คน (รวมตัวเอง 4 คน) และต้องการรถส่วนตัว ไม่แชร์กับคนอื่น"

### Expected actions
1. Adjust passengers to 4 (using +/- or dropdown)
2. Toggle Private Car checkbox ON
3. Check Price Summary (tap ⓘ) → understand pricing
4. Request Tuk Tuk

### Observe
- Can they adjust pax easily? (buttons + dropdown)
- Do they find the Private Car toggle?
- Do they check price before confirming?

### Measure
| Metric | Target |
|---|---|
| Correct pax on first try? | Yes/No |
| Found private car? | Yes/No |
| Opened price summary? | Yes/No |
| SEQ (1-7) | ≥ 5.5 |

### Post-task questions
1. "ราคาที่แสดงถูกต้องไหม?"
2. "เข้าใจว่า Private Car คืออะไรไหม?"
3. "ส่วนลดมาจากไหน?"

---


## Test Session Structure

| Phase | Duration | Detail |
|---|---|---|
| Intro | 5 min | Explain prototype, think-aloud, consent |
| Task 1 (E2E) | 8-10 min | New user first booking |
| Task 6 (Pax/Private) | 3-5 min | Continues from Task 1 or standalone |
| Task 2 or 3 (Repeat) | 5 min | Switch to V2 or V3 |
| Task 5 (Explore+Save) | 5-8 min | Discovery + save favorite |
| Wrap-up | 5 min | Overall impressions, SUS, debrief |
| **Total** | **~30-35 min** | |

---

## Participant Assignment

| User Type | Variation | Primary Tasks | Focus |
|---|---|---|---|
| New User (3-4 people) | V1 | Task 1, 5, 6 | Learnability, comprehension |
| Casual (2-3 people) | V2 | Task 1, 2, 5 | Efficiency, Go Again |
| Recurring (2-3 people) | V3 | Task 1, 3, 5 | Speed, Saved Places |
| Travel (1-2 people) | V4 | Task 1, 5 | Exploration, discovery |

> Recurring users run Task 1 twice (first = learnability, second = true efficiency) to separate learning dip from design issues.

---

## Metrics Summary

| Metric | Where measured | Target |
|---|---|---|
| Completion rate | Task 1 | ≥ 90% unassisted |
| SEQ | All tasks | ≥ 5.5 / 7 |
| Taps + Time | Task 1 vs 2/3 | Repeat < First |
| Awareness recall | Task 5 post-questions | Can name promo + place |
| Error count | Task 1, 6 | First-attempt accuracy |
