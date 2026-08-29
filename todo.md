# Project TODO

- [x] Create branded Attendance Companion icon assets and wire app configuration
- [x] Define attendance domain types and configurable category rules
- [x] Implement attendance calculation engine with edge-case handling
- [x] Add automated unit tests for calculations and simulator scenarios
- [x] Add local persistence for profile, settings, categories, timetable, and attendance history
- [x] Build first-launch profile setup flow
- [x] Build Dashboard with live metrics, target status, safe absence, and projected attendance
- [x] Build what-if simulator with hours, full-day, and selected-event scenarios
- [x] Build Calendar / Week view with attendance state controls
- [x] Build configurable attendance category settings
- [x] Build timetable import flow for images, PDFs, and spreadsheets
- [x] Add AI/OCR extraction integration and manual fallback
- [x] Build editable timetable review and confirmation screen
- [x] Add empty, loading, error, and destructive-action confirmation states
- [x] Run lint, typecheck, automated tests, and end-to-end persistence validation
- [x] Save final checkpoint and deliver project version

- [x] Audit repository for secrets, sensitive local data, generated files, and build artifacts before GitHub use
- [x] Update .gitignore and .env.example for safe GitHub preparation without changing app functionality
- [x] Verify the exact safe commit set and document local Git commands without pushing

- [x] Perform final staged-file and secret-safety check before GitHub push
- [x] Commit repository-hygiene changes and connect the existing remote history to GitHub
- [x] Push main and verify the complete application source on GitHub

- [x] Add secure server-side image/PDF timetable extraction with editable review and transformation tests
- [x] Extend the simulator with full-day and multi-event absence selection
- [x] Implement add, edit, delete, and safeguards for attendance categories
- [x] Expand calculation integrity coverage for category behaviors and absence scenarios
- [x] Run complete regression, production build, persistence checks, and push validated enhancements to main

- [x] Restart the unresponsive development server and verify preview recovery

- [x] Fix Expo timetable file-selection error this.validatePath is not a function without UI or calculation changes
- [x] Validate actual image/PDF OCR and CSV/XLSX import through the editable Review screen
- [x] Run lint, TypeScript, automated tests, and production builds after the upload fix

- [x] Validate the fixed upload and OCR flow against the user-provided university timetable image and report exact extraction discrepancies

- [x] Clearly identify app-provided default categories while preserving their existing calculation behavior and edit/delete safeguards
- [x] Fix deterministic Reset all local data behavior across storage, in-memory state, navigation, and reload
- [x] Add regression coverage for reset persistence and first-launch recovery after rehydration
- [x] Manually validate reset confirmation, reset, reload, and first-launch behavior
- [x] Run full validation, commit intended fixes, push main without rewriting history, and verify origin/main


- [x] Reconstruct the previously reviewed timetable/OCR upload, server extraction, editable review, and associated tests without unrelated changes
