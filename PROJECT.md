# Project: Qblink UI Overhaul & Glitch Remediation

## Architecture
- React 18, Vite 5, Tailwind CSS with CSS custom properties (`hsl(var(--...))`).
- Universal theme support: seamless toggle between Dark Mode (`.dark`) and Light Mode (`:root`) with full WCAG AA contrast (>= 4.5:1).
- Responsive viewports: 360px–390px (mobile) to 1440px+ (desktop), plus 16:9 fullscreen TV display.
- Strictly local execution: under no circumstances commit or push anything to git or remote servers.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Universal Theme Root Container | Refactor `Index.tsx` from hardcoded `bg-[#0B1220]` to `bg-background text-foreground` | M1 | survey (exp1) |
| 2 | TopNav Unscrolled Contrast | Replace `.stage-text` and `.stage-muted` (cream `#F5F2EB`) with theme-aware classes | M1 | survey (exp1) |
| 3 | Hero Customer Navigation Flow | Route "I'm a Customer / Patient →" to `/customer-dashboard` instead of auth wall | M1 | survey (exp1) |
| 4 | Hero & TicketPreview Theme Polish | Refactor hardcoded slate/teal colors to semantic tokens in Hero and TicketPreview | M1 | survey (exp1) |
| 5 | Explainer Video Section Contrast | Refactor video container, tabs, and 3-step caption cards to theme-aware classes | M1 | survey (exp1) |
| 6 | Comparison Table Responsiveness | Add `min-w-[560px]` inside `overflow-x-auto` to prevent 390px column compression | M1 | survey (exp1) |
| 7 | ThreeSurfaces Cards Theme Polish | Refactor surface cards and code pills to theme-aware classes | M1 | survey (exp1) |
| 8 | Mumbai Pilots Section Polish | Refactor metrics cards, testimonial card, and photo deployment cards to theme variables | M1 | survey (exp1) |
| 9 | Healthcare FAQ Accordion Contrast | Refactor accordion trigger, border, and expanded answer text to theme variables | M1 | survey (exp1) |
| 10 | CleanFooter Contrast & Styling | Refactor footer background, borders, and links to theme-aware classes | M1 | survey (exp1) |
| 11 | QueueJoin Above-the-fold CTA | Rebalance padding, compact guidance box, and position account link below CTA | M2 | survey (exp2) |
| 12 | TicketLanguagePicker Light Theme | Refactor hardcoded dark slate buttons to semantic `bg-muted` / `border-border` | M2 | survey (exp2) |
| 13 | QueueJoin Open Badge Contrast | Replace low-contrast `text-emerald-400` with `bg-success-soft text-success` | M2 | survey (exp2) |
| 14 | CustomerDashboard Badge Contrast | Fix `bg-primary text-primary` invisible text on "Sponsored" badge | M2 | survey (exp2) |
| 15 | Customer Mobile Bottom Nav | Add `MobileBottomNav` to `/customer-dashboard` for seamless mobile navigation | M2 | survey (exp2) |
| 16 | Floating AI & Nav Z-Index Collision | Elevate AI button z-index and add `safe-area-inset-bottom` clearance | M2 | survey (exp2) |
| 17 | Customer Profile Bottom Clearance | Increase `pb-8` to `pb-32` on `CustomerProfile.tsx` to prevent nav overlap | M2 | survey (exp2) |
| 18 | QueueIntegrityPanel Badge Contrast | Fix invisible text on `checked_in` and `serving` badges (`text-primary bg-primary/10`) | M3 | survey (exp3) |
| 19 | Business Dashboard Action Buttons | Provide active visual hover delta for pause, stop, reset, skip, and remove buttons | M3 | survey (exp3) |
| 20 | Business Dashboard Modal Geometry | Prevent mobile top-clipping by adjusting margins to `my-4 sm:my-auto` and add ARIA attributes | M3 | survey (exp3) |
| 21 | Standee Printer Multi-Industry | Parameterize clinic vs. general business text, add `onafterprint` auto-close, sanitize SVG | M3 | survey (exp3) |
| 22 | Waiting Room TV Viewport & Clipping | Replace `h-screen overflow-hidden` with `min-h-screen md:h-screen overflow-y-auto md:overflow-hidden` | M3 | survey (exp3) |
| 23 | Waiting Room TV Contrast & Font Size | Refactor low-contrast `text-slate-500` to `text-slate-400` and enlarge token text | M3 | survey (exp3) |
| 24 | Fullscreen Event Listener Sync | Sync `isFullscreen` state with `document.addEventListener("fullscreenchange")` | M3 | survey (exp3) |
| 25 | Verification & Build Validation | Pass 100% of Vitest test suite (`npm test`) and Vite build (`npm run build`) | M4 | survey (exp1-3) |
| 26 | Forensic Integrity Audit | Independent verification of zero hardcoded cheats, facades, or test circumvention | M4 | survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|--------------|--------|
| 1 | Marketing & Landing Surfaces | `Index.tsx`, `TopNav.tsx`, `Hero.tsx`, `ExplainerVideoSection.tsx`, `ThreeSurfacesSection.tsx`, `MumbaiPilotsSection.tsx`, `HealthcareFAQ.tsx`, `CleanFooter.tsx` | none | DONE (Verified: 151/151 tests pass, build OK) |
| 2 | Patient Experience & Customer Dashboard | `JoinQueue.tsx`, `TicketPreferences.tsx`, `CustomerDashboard.tsx`, `CustomerProfile.tsx`, `AIAssistant.tsx` | none | DONE (Verified: 151/151 tests pass, build OK) |
| 3 | Business Dashboard & Waiting Room TV | `QueueIntegrityPanel.tsx`, `Dashboard.tsx`, `PublicDisplay.tsx` | none | DONE (Verified: 151/151 tests pass, build OK) |
| 4 | Verification & Audit Gate | Full test run (`npm test`), build validation (`npm run build`), Reviewer & Auditor gate | M1, M2, M3 | DONE (Verified: 151/151 tests pass, build OK, Auditor CLEAN, Reviewers & Challengers APPROVE) |

## Code Layout
### Marketing Surfaces (Milestone 1)
- `src/pages/Index.tsx`: Root wrapper
- `src/components/qb/TopNav.tsx`: Navigation header
- `src/components/qb/Hero.tsx`: Hero section & ticket preview
- `src/components/qb/ExplainerVideoSection.tsx`: Explainer video & 3-step captions
- `src/components/qb/ThreeSurfacesSection.tsx`: 3 surfaces & comparison table
- `src/components/qb/MumbaiPilotsSection.tsx`: Metrics, testimonial & deployment photos
- `src/components/qb/HealthcareFAQ.tsx`: FAQ accordion
- `src/components/qb/CleanFooter.tsx`: Footer

### Patient & Customer Surfaces (Milestone 2)
- `src/pages/JoinQueue.tsx`: Queue join flow
- `src/components/queue/TicketPreferences.tsx`: Language picker
- `src/pages/CustomerDashboard.tsx`: Customer dashboard & discovery
- `src/pages/CustomerProfile.tsx`: Customer profile & visit history
- `src/components/AIAssistant.tsx`: Floating AI Assistant

### Business & TV Surfaces (Milestone 3)
- `src/components/business/QueueIntegrityPanel.tsx`: Queue activity logs & status badges
- `src/pages/Dashboard.tsx`: Business queue management, modals, and standee generator
- `src/pages/PublicDisplay.tsx`: Waiting room TV display

## Interface Contracts
- **Tailwind Tokens**: Use `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, `bg-muted`, `text-primary`, `bg-primary/10`, `text-success`, `bg-success-soft`, etc.
- **Contrast**: Text contrast >= 4.5:1 against respective backgrounds in both `.dark` and `:root` light mode.
- **Responsiveness**: No horizontal scrollbar on body at 360px–390px; table and wide elements must scroll internally with `overflow-x-auto min-w-[560px]`.
- **Integrity**: Pure local development, no git operations, no simulated facades.
