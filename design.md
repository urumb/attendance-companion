# Attendance Companion — Mobile Interface Design

## Product direction

Attendance Companion is a calm, high-signal iOS-style utility for students who need to understand attendance risk quickly. The design uses a warm off-white canvas, ink navy typography, and a cobalt-blue primary action with semantic green, amber, and coral status colors. The experience is optimized for portrait orientation and one-handed use: primary actions sit in the lower half of sheets, cards are thumb-friendly, and key numbers are visible without drilling into menus.

## Screen list

| Screen | Primary content and functionality |
|---|---|
| Welcome / Profile setup | Collect student name, course or semester label, initial present hours, initial counted hours, and target percentage. Provide a clear “Continue” action and an option to change the target later. |
| Dashboard | Show current attendance percentage, present hours, counted hours, target, status, safe absence, hours needed, projected final attendance, and a compact what-if simulator. Include quick actions for marking today’s class and importing a timetable. |
| Simulator | Accept planned absence hours, a full-day shortcut, or selected future events. Recalculate projected present/count totals and show whether the target remains safe. |
| Calendar / Week | Display the imported week as vertically stacked day sections and event cards. Each event can be marked Present, Absent, Excused, or Ignored. Filter by week and category. |
| Timetable import | Choose an image, PDF, or spreadsheet file. Show parsing/loading state, extraction errors, and a fallback manual-entry action. |
| Timetable review | Present every extracted row in editable controls for weekday, subject, time, duration, and category. Require explicit confirmation before saving imported events. |
| Categories | List configurable attendance categories with present/total behavior. Support add, edit, and delete with confirmation when a category is in use. |
| Settings | Update profile, target percentage, default category, appearance, and reset data with confirmation. |
| Empty / error states | Guide the user when no timetable exists, parsing fails, or attendance data is incomplete. Every state includes a useful next action. |

## Key user flows

### First launch

1. The user opens the app and sees the Welcome screen.
2. They enter their profile label and current attendance figures, then choose a target such as 75%, 80%, 85%, or 90%.
3. The app persists the setup and opens the Dashboard.
4. The Dashboard explains the next best action: import a timetable or add a class manually.

### Timetable import

1. The user taps Import timetable from the Dashboard or Calendar.
2. They choose an image, PDF, or spreadsheet from the device.
3. A loading state explains that the app is extracting weekday, subject, times, duration, and category.
4. The app shows the extracted rows in the Review screen. Every field is editable.
5. The user fixes any values, confirms the rows, and saves them to the local timetable.
6. The Dashboard and Calendar update immediately.

### Mark attendance

1. The user opens Calendar and selects a class card.
2. They choose Present, Absent, Excused, or Ignored.
3. The app updates the attendance history and recalculates the Dashboard metrics.
4. A small success confirmation explains the resulting attendance state.

### What-if simulation

1. The user enters a number of planned absence hours or selects future timetable events.
2. The app calculates projected attendance using each event category’s present/total rules.
3. The result is shown with a clear safe / at risk label and the exact remaining safe absence.
4. The user can reset the scenario without changing saved attendance.

## Visual system

| Element | Choice |
|---|---|
| Canvas | `#F7F8FA` light background with `#111827` ink text |
| Surface | `#FFFFFF` cards with a subtle `#E7EAF0` border |
| Primary | `#3155D9` cobalt blue for navigation and primary actions |
| Success | `#168A5B` for safe attendance and Present states |
| Warning | `#B7791F` for near-target states |
| Error | `#C94B4B` for at-risk states and destructive actions |
| Accent | `#6B7CFF` for progress highlights and selected controls |
| Typography | System sans-serif, large numeric display for percentage, semibold section titles, muted supporting copy |
| Shape | 18–24px rounded cards and 14px controls; avoid excessive pills except for statuses and filters |
| Motion | Short opacity/scale press feedback only; no decorative motion before core flows work |

## Interaction rules

Use safe-area-aware containers on every screen. Lists use performant list primitives. Primary buttons use visible press feedback and light haptics on native platforms. Forms use explicit labels, keyboard-friendly inputs, inline validation, and clear save/cancel actions. Destructive actions require confirmation. The tab bar contains Dashboard, Calendar, and Settings; import and simulator actions are surfaced from the Dashboard as prominent cards and sheets.
