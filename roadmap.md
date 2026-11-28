# Project roadmap
## Selected security findings
- [x] Restrict public queue metrics to business visibility, protect pickup-order lookups, and make saved session/health reports read-only.
- [x] Protect selected owner-only queue actions and reject caller-authored AI assistant turns and queue-context prompt injection.
- [x] Add focused regression tests, verify live database grants, deploy the AI change, and confirm denied pickup access in preview.
- [ ] Resolve check-in, guest-visit transfer, and SMS recipient/test behavior after the user's choices.

## Customer profile
- [x] Fix all current preview typecheck errors while preserving unrelated MCP changes.
- [x] Remove all customer-facing paid-plan/pricing claims and keep access free without trials or plan limits.
- [x] Make install-prompt dismissal permanent and verify the behavior with a focused test.
- [x] Verify home-page copy and FAQ on mobile, install behavior, all 139 tests, and a clean preview build; the free FAQ is readable, no pricing link/old prices or horizontal overflow remain, and the install prompt stays hidden until requested.
- [x] Build reliable home ticket taps and trust strip; use “One-tap token” and “Private by design” rather than unverified timing or absolute privacy claims.
- [x] Build EN/Hindi/Marathi tickets, return reminders, opt-in chime/wake lock, and visible back navigation without changing queue rules.
- [x] Verify pilot upgrades: 22 tests pass; desktop/phone taps, language switches, opt-in sound and controlled call update pass with no browser errors. Live clinic call remains unverified; no visits were added.
- [x] Apply customer details setting across all existing business queues; verified three QR links hide personal details, a real guest token is issued, and signed-in save survives reload. Test token released; 23 tests pass.
- [x] Fix queue and shared back navigation; verify queue, invalid link, auth, install, and affiliate clicks plus 24 navigation/queue regression tests without changing live visits.
- [x] Apply the four analytics/Health Coach fixes; 17 regression tests and signed-in analytics checks pass. AI request authorization verified with intercepted response; live AI reply not verified.
- [x] Add secure account-linked queue membership, history, and leave action.
- [x] Add customer profile page and portal navigation with editable name.
- [x] Verify signed-in profile loading, name save/read-back, denied unowned leave, and queue-status tests.
- [ ] Verify live join → current queues → leave → past visits with an authorised pilot visit; blocked on permission to add a visit to the shared live queue.