📄 ADR 0002 — Payment strategy, lifecycle authority, and execution gating

Status

Accepted (design + execution gating)

Supersedes: ADR 0001 (clarifies authority, boundaries, and next steps)

⸻

1. Context
	•	The registration lifecycle is fully validated in STAGING, including:
	•	offer → awaiting_response → confirm / expire
	•	refill (orchestrated + non-orchestrated)
	•	queue + email delivery
	•	A Stripe-based payment foundation exists in the repo (migrations + Edge functions), but:
	•	it is not validated end-to-end
	•	it is not aligned with current product needs
	•	it introduces provider coupling risk

At this stage, the system is operationally complete without payments.

⸻

2. Core decision

Payments are not part of the current execution scope.
	•	No payment provider is active
	•	No payment flow is part of the validated lifecycle
	•	All events operate as non-payment (payment_required = false)

⸻

3. System authority (critical invariant)

The registration lifecycle is the single source of truth.
	•	event_registrations.status defines:
	•	capacity
	•	eligibility
	•	lifecycle progression
	•	Payment does not introduce a parallel state machine
	•	Payment can only act as a constraint on transitions, never as a driver

Specifically:
	•	Only lifecycle logic decides:
	•	who gets an offer
	•	who holds a slot
	•	who is confirmed
	•	Payment (if introduced later) may only gate:
	•	awaiting_response → confirmed

⸻

4. Current operating mode

Active path (validated)
	•	pending
	•	waitlist
	•	awaiting_response
	•	confirmed
	•	cancelled

All transitions are:
	•	deterministic
	•	DB-driven
	•	already validated via Scenarios A–E

⸻

5. Stripe implementation status

Classification: Dormant experimental path

The following are not part of the active system contract:
	•	create-stripe-checkout
	•	stripe-webhook
	•	registration_payments
	•	payment-related RPC guards

They are:
	•	kept for reference
	•	not deployed as required infrastructure
	•	not used by the application
	•	not relied upon by operators

⸻

6. Architecture direction (future payments)

When payments are reintroduced:

Build from domain → not provider

Core domain concepts
	•	Payment attempt
	•	Payment outcome
	•	Monetary commitment
	•	Domain events:
	•	PaymentInitiated
	•	PaymentCaptured
	•	PaymentFailed
	•	PaymentCanceled

NOT core concepts
	•	Checkout session
	•	Stripe webhook payload
	•	Provider-specific IDs

⸻

7. Strict boundaries

Core system (must remain provider-agnostic)
	•	Lifecycle transitions
	•	Capacity logic
	•	Refill logic
	•	Registration states
	•	Eligibility rules

Adapter layer (provider-specific)
	•	Payment session creation
	•	Webhook verification
	•	Provider payload mapping
	•	External API communication

⸻

8. Anti-patterns (forbidden)

Do not:
	•	Add provider-specific fields to lifecycle tables
	•	Use Stripe identifiers in core logic
	•	Allow payment to bypass lifecycle transitions
	•	Couple confirmation logic to provider event names
	•	Introduce new registration states for payment without full lifecycle review
	•	Treat payment as a parallel state machine

⸻

9. Revisit trigger (when payments come back)

Payment work resumes only if at least one condition is met:

Product signal
	•	Users drop off after receiving offers
	•	Users confirm but do not show up
	•	Commitment needs strengthening

Business signal
	•	Monetization is required
	•	Pricing model is defined

Technical readiness
	•	Payment abstraction contract is defined and approved
	•	A provider decision is made

Until then:

👉 Payments remain out of scope

⸻

10. Execution priority (important)

Current focus is NOT payments

Next steps are:
	1.	Run real events
	2.	Observe user behavior
	3.	Measure:
	•	offer acceptance rate
	•	expiry rate
	•	cancellation rate
	4.	Identify real friction points

⸻

11. Consequences

Positive
	•	System remains simple and stable
	•	No premature coupling to providers
	•	Faster iteration on core product

Trade-offs
	•	No monetization yet
	•	No financial commitment enforcement
	•	Some drop-off risk remains unmitigated

⸻

12. Next step (explicit)

Run real-world validation
	•	Execute events using current lifecycle
	•	Collect data
	•	Evaluate need for payments based on reality, not assumptions

⸻

13. References
	•	ADR 0001 (historical context)
	•	STAGING validation scenarios A–E
	•	Existing Stripe experimental files (non-authoritative)
