# Near-Term Buildout Foundation SPEC

Date: 2026-04-18  
Status: Draft approved for documentation  
Scope: `social-matching-web` near-term buildout foundation

**Rollup (2026-04-19):** Shared foundation tickets **F-1…F-10** are **done** (`docs/foundation-tickets/README.md`), including legal stub routes `/terms` and `/privacy`. Dev A **public-readiness plan** engineering closeout adds FR coverage matrix, participant SPA deploy doc, participant data contracts, optional `VITE_SUPPORT_EMAIL` on landing, and narrow-viewport E2E — see `docs/superpowers/plans/2026-04-19-dev-a-public-readiness-master-plan.md`. Dev A remains in **maintenance mode** (`docs/superpowers/plans/2026-04-21-dev-a-remaining-work-audit-and-plan.md`). Host/admin buildout remains **Dev B**–owned per §6.3–6.4; this SPEC still describes shape and boundaries, not open foundation debt.

## 1. Purpose

This SPEC defines the near-term technical foundation for everything still left to
build in `social-matching-web`, based on the current codebase rather than an
imagined clean-slate version.

The goal is to create a single source of truth that:

- maps the product surfaces that already exist
- identifies what still needs to be completed
- establishes a minimal but functional placeholder standard
- creates clean workstream boundaries for two collaborators
- gives enough structure to delegate implementation without reopening core
  boundary decisions on every ticket

This document is intentionally broader than the currently validated vertical
slice. It covers the larger near-term product shape so the codebase can grow on
stable rails, even where implementation remains minimal for now.

## 2. Current-State Baseline

The app is already beyond pure scaffold stage. Today the repo includes:

- a routed React/Vite app with public, participant, host, and admin/operator
  surfaces
- shared shell and UI primitives
- Supabase-backed data access for events, applications, profile readiness, host
  event requests, and admin/operator flows
- at least one validated end-to-end operational slice around gathering and team
  gathering flows
- MVP product docs that define product intent, scope, workflows, and technical
  baseline

This SPEC therefore does not redesign the system from zero. It standardizes and
extends the existing shape into a more delegable build map.

## 3. Non-Goals

This SPEC does not attempt to:

- finalize the long-term perfect domain model
- define a full visual design system rewrite
- settle every future analytics, automation, or messaging feature
- replace existing MVP docs
- prescribe implementation tickets at task-by-task granularity

That work comes after this document, in the implementation planning phase.

## 4. Working Principles

The buildout should follow these principles:

1. Build from the current repo, not from abstraction.
2. Keep placeholders minimal, but never blank or misleading.
3. Preserve clean ownership boundaries between product surfaces.
4. Prefer real route and state shape now over deferred structure later.
5. Keep participant-facing placeholders easy to reference visually.
6. Keep host and admin/operator placeholders aligned to intended real contracts.
7. Avoid premature refactors that do not help delegation or delivery.
8. Make every added page and component answer three questions clearly:
   what it is for, what it depends on, and what makes it "done enough" for now.

## 5. SPEC Shape

This is a single master SPEC with four explicit workstreams:

1. Shared foundation
2. Participant product
3. Host product
4. Admin/operator product

This is the recommended structure for a two-person collaboration model because
it preserves one source of truth while still allowing clear ownership.

## 6. Workstream Model

### 6.1 Shared Foundation

Shared foundation owns the app-level rules that all other workstreams depend on:

- route inventory and naming conventions
- auth and role gating rules
- page-shell expectations
- placeholder standards
- shared state patterns
- shared component primitives
- cross-workstream vocabulary and status semantics
- testing conventions
- rules for introducing new route surfaces

This is the shortest workstream in implementation terms, but the highest
leverage one. Its purpose is to reduce drift and merge collisions.

### 6.2 Participant Product

Participant product owns the user-facing flow of discovering, understanding,
applying to, and managing participation in gatherings.

It includes:

- landing and entry surfaces
- auth entry and callback handling
- events list and event detail
- apply flow
- questionnaire/profile completion
- dashboard
- participant-facing gathering entry points

This workstream should optimize for clear user navigation, honest state
messaging, and minimal friction between route surfaces.

### 6.3 Host Product

Host is treated as its own product area, not as an extension of admin.

It includes the current request flow and the future host workspace shape, even
where parts remain placeholder-only for now:

- host event list
- draft creation and editing
- request submission and status visibility
- event-level host workspace placeholder surfaces
- registration/cohort visibility placeholders
- host communication placeholders
- post-event follow-up placeholders

This matters because host is a user-facing role with different needs, language,
and constraints than internal operators.

### 6.4 Admin/Operator Product

Admin/operator is the internal control surface for operating the system.

It includes:

- event request review queues
- event creation and internal event management
- operator event dashboard and orchestration
- team gathering operations
- lifecycle action panels
- internal visibility and diagnostics placeholders
- operational override surfaces

This workstream should optimize for clarity of state, safety of actions, and
alignment with real contracts and lifecycle rules.

## 7. Recommended Team Split

For two collaborators, the recommended split is:

- Person A: Participant product
- Person B: Host product + Admin/operator product
- Shared foundation: brief joint alignment pass, then tickets assigned into the
  product workstreams

This is preferred over a frontend/backend split because the current stage of the
project still mixes page completion, contract shaping, and workflow behavior in
the same units of work.

### 7.1 Ownership Rules

- Shared foundation may define app-wide contracts and primitives.
- Each product workstream owns its routes and local components.
- Shared components should only move into shared ownership after repeated use is
  real, not hypothetical.
- Cross-workstream edits should be explicit and contract-driven.
- If a ticket touches more than one workstream, one owner should still be named.

## 8. Placeholder Philosophy

The placeholder strategy is intentionally mixed.

### 8.1 Participant and Public Surfaces: UI-First Placeholders

Participant-facing placeholders should:

- feel coherent and navigable
- allow realistic visual and workflow reference during development
- use static or mixed data when needed
- clearly label unavailable actions or incomplete behavior
- preserve the intended route and state shape

These placeholders are allowed to lead with UX clarity as long as they do not
hide backend assumptions that will later matter.

### 8.2 Host and Admin/Operator Surfaces: Contract-First Placeholders

Host and admin/operator placeholders should:

- exist as real routes
- reflect the intended real state model
- organize actions around the true future workflow shape
- use stubbed or partial implementations only when the contract is still clear
- avoid fake UI that implies nonexistent permissions or lifecycle transitions

These placeholders are allowed to be visually minimal as long as their state and
workflow structure is stable and accurate.

### 8.3 Definition of a Functional Placeholder

A page only counts as "set up" when it has all of the following:

- a route entry
- correct auth and role gating
- a clear page title and purpose
- loading, empty, and error treatment
- at least one meaningful primary action or state summary area
- visible unavailable/future actions where relevant
- links to adjacent workflow pages where applicable
- a documented owner workstream
- explicit exit criteria for replacing the placeholder with fuller behavior

A blank shell, a title-only page, or a route that exists without workflow context
does not qualify.

## 9. Shared Foundation Requirements

### 9.1 Route Inventory Rules

Every route in the app should be classified in the SPEC as one of:

- Existing and keep
- Existing but normalize
- Existing but expand
- Add placeholder now
- Later, no route yet

Each route entry should also identify:

- owner workstream
- auth/role requirement
- data source status: real, mixed, or stubbed
- minimal supported states
- primary next-step links

### 9.2 Page-Shell Rules

All routes should use a consistent shell pattern appropriate to their product
surface:

- participant/public surfaces use the product shell
- internal surfaces use the minimal/internal shell
- page layout should make primary status and next action clear without requiring
  deep scrolling or hidden panels

### 9.3 Shared State Blocks

The app should standardize reusable state patterns for:

- loading
- empty
- error
- not found
- gated/permission denied
- not yet available
- success / next-step confirmation

These should be available as shared UI primitives or patterns so pages do not
reinvent state treatment.

### 9.4 Shared Component Inventory

The shared foundation layer should formalize three tiers of components.

#### App-shell primitives

- `PageShell`
- app header and chrome
- route guards
- standard section/layout wrappers

#### Cross-product shared components

- state blocks
- action bars
- status badges
- lifecycle summaries
- placeholder notices
- form sections with save-state affordances
- reusable data panels and info blocks

#### Workstream-local components

- participant-specific cards and forms
- host workspace modules
- admin/operator orchestration panels

A component should remain local until repetition makes sharing worthwhile.

### 9.5 Vocabulary and Status Semantics

The app should use stable language for:

- participant readiness
- event visibility
- application state
- temporary offer state
- confirmation state
- host request state
- admin/operator review state

These terms should align across route surfaces and code contracts.

### 9.6 Core Components to Standardize Now

The following core components or component families should be formalized early,
even if their first version stays minimal.

#### Shared foundation components

- route-state blocks: loading, empty, error, gated, not found, unavailable
- status badge and status summary primitives
- page action bar
- primary info panel / summary card
- placeholder notice / "coming later" panel
- save-state indicator for forms and drafts
- standardized section header with title, support copy, and optional actions

#### Participant components

- event discovery item / event summary card
- event detail summary block
- application status panel
- questionnaire completion status panel
- dashboard application item
- next-step prompt block

#### Host components

- host request list item
- host event workspace summary block
- host milestone/status rail
- host registrations summary block
- host communications placeholder panel
- host follow-up placeholder panel

#### Admin/operator components

- request review item
- operator event summary block
- selection / offering action panel
- lifecycle action panel
- diagnostics placeholder panel
- audit trail placeholder panel

The point is not to fully implement every one of these immediately. The point is
to reserve stable component shapes now so pages do not each invent their own
local structure for the same jobs.

## 10. Route and Surface Inventory

### 10.1 Participant and Public Routes

#### `/`

Classification: Existing and keep

Purpose:
Public landing and orientation surface.

Near-term expectation:
- keep as an entry page
- ensure it points clearly into event discovery and profile creation
- avoid turning it into a marketing-heavy diversion from the real product

#### `/auth`, `/sign-in`, `/auth/callback`

Classification: Existing and keep

Purpose:
Authentication entry and return flow.

Near-term expectation:
- preserve reliable entry and return behavior
- document allowed redirect behavior and route handoff expectations
- keep copy and error handling straightforward

#### `/events`

Classification: Existing but normalize

Purpose:
Participant discovery surface for currently visible events.

Near-term expectation:
- ensure route purpose is discovery, not a shortcut into a narrower slice
- standardize loading/empty/error treatment
- define the minimal event card/list contract
- maintain clear path into event detail

#### `/events/:eventId`

Classification: Existing and expand

Purpose:
Participant-facing event understanding and application status entry point.

Near-term expectation:
- remain the canonical event detail route
- clarify state handling for closed events, prior applications, temporary offer
  states, and reapplication eligibility
- remain the main handoff into apply

#### `/events/:eventId/apply`

Classification: Existing and expand

Purpose:
Application flow and application status surface.

Near-term expectation:
- support creation, revisit, blocked states, and temporary-offer response states
- define clean handling of readiness gating
- preserve local draft and persisted answer expectations where they already
  exist

#### `/questionnaire`

Classification: Existing and keep

Purpose:
Participant profile completion and readiness baseline.

Near-term expectation:
- remain the canonical readiness completion route
- expose enough state that users understand whether they are ready to apply

#### `/dashboard`

Classification: Existing and expand

Purpose:
Participant overview of profile state, applications, and next steps.

Near-term expectation:
- evolve into the participant home after sign-in
- summarize profile readiness and application lifecycle clearly

#### `/gathering/:eventId`

Classification: Existing but normalize

Purpose:
Participant gathering entry point tied to a later-stage event-specific flow.

Near-term expectation:
- keep the validated slice working
- document where this route sits relative to event detail and application routes
- avoid allowing it to define the whole participant architecture by accident

### 10.2 Host Routes

#### `/host/events`

Classification: Existing and expand

Purpose:
Host home surface for request creation, editing, submission, and status
tracking.

Near-term expectation:
- keep existing request flow
- evolve this route into a launch point for broader host workspace surfaces
- clearly separate draft, submitted, active, and completed host views

#### `/host/events/:eventId`

Classification: Add placeholder now

Purpose:
Host event workspace.

Near-term expectation:
- route exists even if initially minimal
- summarize event request state, key milestones, and host-visible next steps
- link to host sub-surfaces

#### `/host/events/:eventId/registrations`

Classification: Add placeholder now

Purpose:
Host-visible registration/cohort summary.

Near-term expectation:
- contract-first placeholder
- clearly define whether host sees full applicant data, summarized counts, or
  limited cohort visibility
- avoid implying admin powers

#### `/host/events/:eventId/communications`

Classification: Add placeholder now

Purpose:
Host communications and updates surface.

Near-term expectation:
- define the placeholder shape for future outbound updates or reminders
- clearly indicate unavailable actions where messaging is not yet supported

#### `/host/events/:eventId/follow-up`

Classification: Add placeholder now

Purpose:
Post-event follow-up workspace.

Near-term expectation:
- reserve the route and state shape for future recap, notes, or follow-up tasks
- keep the first version intentionally minimal

### 10.3 Admin/Operator Routes

#### `/admin`

Classification: Existing and keep

Purpose:
Admin entry route.

Near-term expectation:
- keep as redirect or landing behavior into the operational surface
- document the canonical entry point

#### `/admin/events`

Classification: Existing and keep

Purpose:
Operator event list and event access point.

Near-term expectation:
- remain the list surface for internal event operations
- preserve creation and event-open actions

#### `/admin/event-requests`

Classification: Existing and expand

Purpose:
Host-submitted event request review queue.

Near-term expectation:
- remain the operational review surface
- clarify status transitions and error behavior
- keep operator actions narrow and explicit

#### `/admin/events/new`

Classification: Existing and keep

Purpose:
Internal event creation surface.

Near-term expectation:
- stay minimal
- remain distinct from host request creation

#### `/admin/events/:eventId`

Classification: Existing and expand

Purpose:
Operator event dashboard and lifecycle orchestration.

Near-term expectation:
- remain the main internal event operation surface
- clearly expose selection, offering, refill, and event state actions
- formalize supported and unsupported actions

#### `/team/gathering/:eventId`

Classification: Existing and keep

Purpose:
Internal gathering/team operations route tied to the validated slice.

Near-term expectation:
- keep operationally stable
- document its relationship to the broader operator event dashboard

#### `/admin/events/:eventId/diagnostics`

Classification: Add placeholder now

Purpose:
Internal diagnostics and visibility surface.

Near-term expectation:
- contract-first placeholder
- reserve the place for internal logs, state summaries, or system checks
- keep access limited to admin/operator roles

#### `/admin/events/:eventId/audit`

Classification: Add placeholder now

Purpose:
Lifecycle audit and action history surface.

Near-term expectation:
- define the route and intended state shape now
- keep the first implementation minimal, but structured around the true need for
  traceability

## 11. Data and Contract Boundaries

This SPEC does not replace the current schema or RPC surface. It documents the
contract areas that must stay legible as implementation is split across people.

### 11.1 Shared Contract Areas

The core contract areas are:

- auth/session state
- profile readiness and questionnaire completion
- event visibility and lifecycle
- event application state
- temporary offer and response state
- participant gathering state
- host request state
- admin/operator review and orchestration state

### 11.2 Contract Stability Rules

- Participant placeholders may temporarily use mixed or mock data if the route
  purpose and future state model remain clear.
- Host and admin/operator placeholders should track the intended real contract
  shape even when backed by stubbed logic.
- Any unstable contract should be marked explicitly in implementation planning.
- Existing validated flows must not be weakened in the name of unifying the
  placeholder layer.

### 11.3 Delegation-Safe Contract Rule

If two people are working in parallel, each ticket should be able to answer:

- which contract it consumes
- which contract it is allowed to change
- what downstream routes depend on it

If that cannot be answered, the work item is too fuzzy and needs a smaller
boundary.

## 12. Standard Page States

Every meaningful route should support the relevant subset of these states:

- loading
- empty
- error
- not found
- gated / permission denied
- unavailable / not yet active
- success / next step

### 12.1 Participant State Examples

- questionnaire not complete
- already applied
- application submitted
- registration closed
- temporary offer awaiting response
- offer expired
- participation confirmed

### 12.2 Host State Examples

- no host requests yet
- draft incomplete
- draft saved
- submitted for review
- rejected
- active but host visibility limited
- completed with follow-up placeholder

### 12.3 Admin/Operator State Examples

- no queue items
- action in progress
- invalid lifecycle transition
- stale or missing event data
- selection saved
- offer/refill action failed
- no diagnostics available yet

## 13. Testing Strategy

Testing should be staged so placeholder buildout does not wait for full feature
completeness.

### 13.1 Foundation Verification

Verify that:

- routes render
- guards behave correctly
- page states show correctly
- adjacent workflow navigation works
- placeholder surfaces are reachable and intelligible

### 13.2 Workflow Verification

Verify the highest-value flows per workstream:

- participant happy path and blocked states
- questionnaire to apply handoff
- host draft/save/submit flow
- admin review and operator event actions
- validated gathering/team-gathering flow remains intact

### 13.3 Contract Verification

Verify:

- role boundaries
- key RPC/query assumptions
- lifecycle status transitions
- transitions that should be blocked

This division lets the team add placeholder surfaces quickly without sacrificing
route integrity or contract discipline.

## 14. Delivery Sequence

Implementation should proceed in this order:

1. Shared foundation normalization
2. Participant route completeness and state cleanup
3. Host workspace placeholder map
4. Admin/operator placeholder map
5. Highest-value workflow completion across the stabilized surfaces
6. Expanded verification for stable contracts and route transitions
7. Incremental replacement of placeholders with fuller behavior

This sequence gives the team a usable foundation early while preserving room for
parallel work.

## 15. Definition of Success

This SPEC succeeds if it allows two collaborators to:

- split ownership without guessing
- identify which routes must exist now
- distinguish real surfaces from placeholders
- understand the standard for "minimal but functional"
- work in parallel with fewer collisions
- turn the work into tickets without reopening boundary questions

## 16. Immediate Planning Output Expected From This SPEC

The implementation plan created from this SPEC should produce:

- a route inventory checklist
- a shared foundation checklist
- participant workstream tickets
- host workstream tickets
- admin/operator workstream tickets
- a verification checklist tied to the first delivery sequence

That plan should treat the existing codebase as the starting point, not as
unfinished noise to be rebuilt from scratch.
