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
- [ ] Save final checkpoint and deliver project version

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
