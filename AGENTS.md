# AGENTS.md — TicketApp POS

## 1. Project Purpose

TicketApp POS is a React Native point-of-sale application designed for restaurant operations.

The application currently supports:

* Physical table orders.
* Independent takeaway orders.
* Counter / quick-sale ordering.
* Kitchen workflows.
* Kitchen stations.
* Order rounds.
* Cash checkout.
* ESC/POS thermal printing over TCP.
* Remote menu/catalog management through Supabase.
* Product variants and modifiers.
* Paid modifiers.
* Favorites configured from Supabase.
* Multi-terminal realtime synchronization.
* Runtime Supabase configuration.

This is a production-oriented POS system.

Changes that appear locally correct may still cause:

* incorrect totals,
* duplicated orders,
* lost items,
* stale menu data,
* multi-terminal conflicts,
* incorrect kitchen state,
* duplicate printing,
* payment inconsistencies.

Treat domain, synchronization, payment and printing code as critical.

---

# 2. Technology Stack

The current stack is:

* React Native CLI
* React 19
* React Native 0.86
* TypeScript
* Zustand
* Supabase
* Supabase Realtime
* AsyncStorage
* react-native-tcp-socket
* ESC/POS
* Jest
* ESLint
* pnpm

Package manager:

```bash
pnpm
```

Do not switch package managers.

`package.json` and repository configuration are authoritative.

Do not assume README examples are correct if they conflict with actual scripts or configuration.

---

# 3. Required Workflow Before Modifying Code

Before implementing a change:

1. Read the relevant existing implementation.
2. Understand the complete data flow affected by the change.
3. Identify existing domain helpers before creating new ones.
4. Identify whether the change affects:

   * another terminal,
   * Supabase,
   * realtime synchronization,
   * kitchen state,
   * payments,
   * printing,
   * product identity,
   * menu/catalog state.
5. Prefer extending an existing abstraction over creating a duplicate one.
6. Check existing tests covering the behavior.

Do not modify code based only on filenames or assumptions.

Trace the actual implementation first.

---

# 4. Architecture Philosophy

Prefer incremental architecture improvements.

Do NOT perform large architectural rewrites unless explicitly requested.

The desired dependency direction is progressively:

```text
UI
 ↓
Application / Store
 ↓
Domain
 ↓
Repositories / Services
 ↓
External systems
```

Current external systems include:

```text
Supabase
Thermal printer
AsyncStorage
```

Pure business rules should progressively move toward `src/domain`.

Do not move code merely for aesthetic reasons.

Extraction must provide a concrete benefit such as:

* reuse,
* testability,
* clearer ownership,
* reduced coupling,
* elimination of duplicated rules.

---

# 5. Zustand Store Rules

`src/store/useCartStore.ts` is central to the application.

It currently coordinates substantial POS state and must be changed carefully.

## Do not grow the store unnecessarily

Before adding business logic directly to `useCartStore`, determine whether it can be implemented as:

* a pure domain function,
* selector,
* repository/service,
* synchronization helper,
* product helper,
* order helper,
* utility.

Prefer pure functions for deterministic business rules.

Good candidates for domain extraction include:

* calculations,
* validation,
* reference handling,
* product configuration identity,
* modifier rules,
* cart transformations,
* state-machine decisions.

## Do not perform a full store refactor

Unless explicitly requested:

* do not split the entire Zustand store,
* do not replace Zustand,
* do not redesign global state management,
* do not migrate every existing action at once.

Refactor incrementally.

---

# 6. Domain Types

Domain types should progressively become independent from Zustand.

Services should not depend on the store merely to access shared domain types when those types can live in a domain module.

Preferred long-term direction:

```text
src/domain/
    orders/
    products/
    kitchen/
    payments/
    types/
```

Both Zustand and infrastructure services may depend on domain types.

Avoid creating new infrastructure → store type dependencies.

Do not perform a mass migration solely to satisfy this guideline.

---

# 7. Order References

The application no longer operates exclusively on physical tables.

An operational order may represent:

```text
Physical table
Takeaway order
```

Takeaway orders use references such as:

```text
L-XXXXXXXX
```

Use the existing order-reference domain helpers.

Examples include:

```ts
isTakeawayReference()
isTableReference()
getOrderReferenceType()
getOrderDisplayLabel()
createTakeawayReference()
```

Do NOT duplicate these rules in components.

Do NOT determine takeaway status manually with string checks outside the centralized domain helper.

Do NOT construct user-facing labels manually when `getOrderDisplayLabel()` can be used.

Avoid:

```ts
`MESA ${tableNumber}`
```

when the reference may represent another order type.

Prefer:

```ts
getOrderDisplayLabel(reference)
```

---

# 8. `tableNumber` Legacy Naming

Some existing APIs still use the name:

```ts
tableNumber
```

even when the value may represent a takeaway order reference.

This is known legacy terminology.

Do NOT perform a repository-wide:

```text
tableNumber → orderReference
```

rename unless explicitly requested.

When writing new domain-level APIs, prefer terminology such as:

```text
orderReference
reference
serviceReference
```

when appropriate.

Gradually reduce semantic ambiguity without creating a massive migration.

---

# 9. Takeaway Reference Safety

Takeaway orders must have independent references.

Never intentionally reuse a single global `"Llevar"` order for new takeaway orders.

Legacy `"Llevar"` recognition may remain for backwards compatibility.

New takeaway references must:

* be short enough for the current database schema,
* remain stable throughout the order lifecycle,
* not overwrite an existing active order,
* be safe for use as synchronization keys.

When changing reference generation, add collision and stability tests.

---

# 10. Table State Machine

Current table states are:

```ts
free
busy
bill_requested
cleaning
```

Conceptually:

```text
free
 ↓
busy
 ↓
bill_requested
 ↓
cleaning
 ↓
free
```

Not every code path must necessarily traverse every state, but transitions must remain semantically valid.

Before changing table-state behavior, check:

* local state,
* Supabase state,
* realtime propagation,
* active cart,
* payment behavior,
* kitchen visibility.

Never introduce a new table state without reviewing every consumer.

---

# 11. Kitchen State Machine

Kitchen item states are:

```ts
pending
sent_to_kitchen
preparing
ready
```

The conceptual flow is:

```text
pending
 ↓
sent_to_kitchen
 ↓
preparing
 ↓
ready
```

Kitchen behavior is operationally critical.

When changing it, consider:

* multiple kitchen stations,
* multiple rounds,
* quantity increases after sending,
* realtime changes,
* remote order reloads,
* kitchen ticket printing.

Do not silently mark items as sent or ready unless the corresponding operation succeeds.

---

# 12. Kitchen Stations

Current kitchen stations include:

```ts
station_a
station_b
```

Products may be routed according to kitchen station.

Do not hardcode station behavior in UI components if an existing product/domain field can determine routing.

Printing for one station must not accidentally include items belonging exclusively to another station.

---

# 13. Supabase Is the Persistent Source of Truth

Supabase is the persistent source of truth for shared POS data.

The conceptual model is:

```text
Zustand
   │
   ├── immediate local UI state
   │
Realtime / Broadcast
   │
   ├── fast propagation
   │
Supabase
   │
   └── persistent shared truth
```

Realtime broadcast improves responsiveness.

It must NOT become the only source of truth.

Database-backed events and reloads remain necessary where consistency matters.

Never introduce a second persistent source of truth for shared commercial/order data without explicit architectural approval.

---

# 14. Multi-Terminal First

Every meaningful shared-state change must be evaluated as if at least two terminals are active.

Do not reason only about:

```text
User → local Zustand → UI
```

Also reason about:

```text
Terminal A
   ↓
local update
   ↓
broadcast
   ↓
Supabase
   ↓
Terminal B
```

and simultaneously:

```text
Terminal B
   ↓
another update
   ↓
Supabase
   ↓
Terminal A
```

Before modifying shared order behavior, consider:

* concurrent edits,
* stale responses,
* event ordering,
* duplicate events,
* reconnects,
* delayed network requests,
* writes from different orders,
* writes from different terminals.

---

# 15. Synchronization Debounce

Synchronization debounce is scoped by order reference.

Do NOT replace it with one global timeout.

A change to:

```text
Mesa 1
```

must never cancel a pending synchronization for:

```text
Mesa 2
```

or:

```text
L-XXXXXXXX
```

Rapid changes to the SAME order may be grouped.

Different orders must remain independent.

The existing order synchronization debouncer should be reused.

Changes to synchronization debounce require regression tests.

---

# 16. Remote Responses

Network responses may arrive out of order.

Never assume:

```text
latest response received == latest request made
```

For resources susceptible to stale responses, preserve or introduce request sequencing/version protection.

The remote menu already uses this principle.

Do not remove stale-response protection without a concrete reason.

---

# 17. Remote Cart Synchronization

Remote cart synchronization is one of the highest-risk areas of the project.

Before modifying order synchronization, explicitly consider:

* lost updates,
* deletion/reinsertion behavior,
* concurrent terminal edits,
* remote empty carts,
* locally pending edits,
* order completion,
* table release,
* stale realtime events.

A successful single-device test is not sufficient evidence that synchronization is correct.

Prefer idempotent and conflict-resistant operations where practical.

Do not redesign the entire synchronization protocol unless explicitly requested.

---

# 18. Menu and Catalog Source of Truth

Supabase is the only source of truth for the commercial menu.

This includes, where applicable:

* categories,
* products,
* prices,
* favorites,
* variants,
* modifier groups,
* modifier options,
* paid modifiers.

Do NOT introduce a bundled fallback commercial menu containing prices.

Reason:

Different terminals using different fallback/catalog versions could calculate different totals.

An unavailable remote catalog should be treated as a synchronization/configuration condition, not solved by silently using stale hardcoded commercial prices.

---

# 19. Open Orders and Catalog Updates

Remote menu updates may affect products already present in:

* active carts,
* tables,
* takeaway orders,
* quick-sale carts.

Preserve existing behavior that refreshes relevant product/catalog information when appropriate.

Be extremely careful when changing this behavior.

A price update must not accidentally corrupt configured-product identity or modifiers.

---

# 20. Product Configuration Identity

Configured products require deterministic identity.

Use the centralized configured-product ID helper.

Do NOT manually generate configured IDs in UI components.

Configured-product identity must satisfy:

```text
same base product
+ same configuration
= same configured ID
```

regardless of modifier selection order.

And:

```text
different configuration
= different configured ID
```

Modifier IDs and variant IDs must be normalized and ordered consistently.

Do not create a second ID format.

---

# 21. Product Base Identity

Configured cart-line identity and commercial menu-product identity are different concepts.

Use fields/helpers such as:

```ts
menuProductId
getBaseProductId()
```

where appropriate.

Do not assume:

```ts
cartLine.product.id === Supabase menu product id
```

for configured products.

This distinction is critical when refreshing catalog data.

---

# 22. Product Modifiers

Modifier business rules belong in the product domain rather than React components whenever possible.

Reuse centralized helpers for:

* paid modifiers,
* visible modifier groups,
* defaults,
* available options,
* modifier totals,
* effective price,
* configured names,
* min/max validation,
* option selection.

Do NOT reproduce modifier calculations in:

* ProductCard,
* CartSheet,
* QuantityModal,
* QuickSaleView.

If a new modifier rule is required, prefer adding it to the domain module and testing it independently.

---

# 23. Money and Totals

Money calculations are critical.

Never derive totals independently in multiple components if a centralized calculation exists.

Before changing price behavior, test:

* base product,
* quantity,
* paid modifier,
* multiple modifiers,
* variant,
* configured product,
* quick sale,
* table order,
* catalog price refresh.

Avoid hidden rounding behavior.

Do not introduce string-based arithmetic.

---

# 24. Checkout

Current checkout is cash-only.

The current payment method domain is intentionally limited to:

```ts
cash
```

Do not reintroduce:

```text
card
transfer
```

or other payment methods unless explicitly requested.

Do not preserve obsolete multi-payment abstractions merely because older versions supported them.

---

# 25. Payment and Printing Are Separate Operations

A successful payment is NOT equivalent to a successful print.

Critical invariant:

```text
Payment succeeds
      │
      ├── print succeeds → OK
      │
      └── print fails    → payment remains successful
```

Never roll back or mark a successfully processed payment as failed solely because printing failed.

Printing errors must be handled separately.

Preserve regression coverage for this behavior.

---

# 26. Thermal Printing

All printer communication must go through the printer service.

Do NOT write directly to:

```ts
TcpSocket
```

from screens/components/store code.

Do NOT create parallel printer implementations.

Preserve:

* ESC/POS formatting,
* sanitization,
* TCP lifecycle handling,
* timeout handling,
* print queue behavior,
* sequential execution.

Printing is physical I/O and should be assumed unreliable.

Expected failures include:

* printer offline,
* wrong IP,
* network timeout,
* paper issues,
* socket disconnect,
* delayed connection.

The POS must remain operational when printing fails.

---

# 27. Print Concurrency

Do not send independent concurrent writes to the same thermal printer.

Preserve FIFO/sequential print behavior.

Changes to the print queue require tests.

Do not optimize printer throughput by parallelizing socket connections unless explicitly requested and validated against the actual printer.

---

# 28. Supabase Runtime Configuration

Supabase connection configuration is entered at runtime.

Current public client configuration includes:

```text
Project URL
Anon key
```

Runtime configuration is persisted through the dedicated configuration service.

Do not access AsyncStorage directly from UI components for this configuration.

Use the existing service.

Validate stored configuration before applying it.

Invalid persisted values must not silently initialize Supabase.

---

# 29. Credentials and Secrets

Never commit:

* service-role keys,
* database passwords,
* private signing keys,
* keystore passwords,
* private API tokens,
* credentials intended for server-side use.

A Supabase anon/publishable client key is client-side configuration, but do not confuse it with privileged Supabase credentials.

Never replace an anon key with a service-role key in the mobile application.

Never log credentials.

---

# 30. Supabase Boundary Validation

Supabase is an external data boundary.

Do not blindly trust remote values.

Prefer:

```ts
unknown
```

plus parsing/narrowing when remote shape is not statically guaranteed.

Avoid:

```ts
any
```

unless technically necessary and documented.

When adding Supabase tables/fields, add or update explicit row types/parsers where appropriate.

Malformed remote rows should not crash the entire POS.

---

# 31. Realtime Lifecycle

When modifying realtime behavior, check:

* initialization,
* reconnection,
* duplicate subscriptions,
* cleanup,
* session initialization,
* connected/disconnected UI state.

Do not create additional realtime channels without checking whether an existing subscription can handle the event.

Avoid duplicated subscriptions caused by repeated initialization.

---

# 32. UI Components

The application intentionally uses React Native primitives and focused dependencies rather than a large UI framework.

Do not introduce a major UI framework without explicit request.

Current UI relies primarily on:

* StyleSheet,
* View,
* Text,
* TouchableOpacity,
* FlatList,
* ScrollView,
* Modal,
* lucide-react-native,
* react-native-safe-area-context.

Maintain visual consistency with the existing design.

---

# 33. Large Components

Some components are already large.

Before adding substantial business logic to a large component, consider extracting:

* a pure domain helper,
* focused hook,
* small presentational component,
* service operation.

Do not refactor an entire large component merely because it is large.

The objective is controlled complexity, not arbitrary file-size reduction.

---

# 34. Navigation

The application currently uses global state to select the active POS screen.

Do NOT introduce React Navigation merely because it is conventional in React Native projects.

Only introduce a navigation framework if the application's actual requirements justify it and the change is explicitly approved.

---

# 35. Error Handling

Do not silently swallow operational errors.

Use appropriate handling depending on context:

* user-visible error for actionable failures,
* warning/log for recoverable infrastructure failures,
* safe fallback state when external data is malformed.

Do not show low-level Supabase/socket implementation details directly to end users.

Do not convert recoverable printer errors into POS transaction failures.

---

# 36. Async Operations

Every asynchronous change must consider:

* race conditions,
* component/store lifecycle,
* stale responses,
* duplicate requests,
* rejection handling.

Never fire-and-forget a critical transaction without intentional error handling.

Background operations must have explicit semantics.

---

# 37. Android Release Builds

Release signing is mandatory.

Release builds must NOT silently fall back to:

```text
debug.keystore
```

Required release signing configuration must remain enforced.

Do not weaken release signing checks merely to make a build pass.

Debug builds may continue using the debug keystore.

---

# 38. Build vs Deploy

Building and deployment are separate operations.

Expected semantics:

```bash
pnpm build:apk
```

Build APK only.

```bash
pnpm build:aab
```

Build Android App Bundle only.

```bash
pnpm upload:drive
```

Upload existing artifact only.

```bash
pnpm build:drive
```

Explicitly build and upload.

Never attach deployment/upload side effects directly to:

```bash
./gradlew assembleRelease
```

A developer validating a release build must not accidentally deploy/upload it.

---

# 39. Do Not Run Release Builds Casually

Routine code validation should NOT require a release build.

Release builds require signing configuration and are materially different from normal static/test validation.

For normal changes prefer:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Only run release build commands when:

* explicitly requested,
* validating release behavior,
* modifying Android release configuration.

---

# 40. Package Management

Use:

```bash
pnpm
```

Do not generate:

```text
package-lock.json
yarn.lock
```

Do not run dependency upgrades unrelated to the task.

Do not add dependencies when the functionality can reasonably be implemented with the existing stack or small internal code.

Every new dependency should have a concrete justification.

---

# 41. Testing Requirements

Every bug fix should include a regression test when practical.

Every extracted pure domain rule should have unit tests when behavior is non-trivial.

High-priority test areas include:

* order references,
* takeaway uniqueness,
* cart totals,
* product configuration identity,
* modifier calculations,
* modifier validation,
* kitchen transitions,
* synchronization debounce,
* stale responses,
* remote catalog refresh,
* payment,
* printing independence,
* realtime synchronization.

Never delete a failing test merely to make CI green unless the test is proven obsolete and the reason is documented.

---

# 42. Multi-Terminal Regression Testing

Synchronization changes require more than happy-path tests.

When practical, test scenarios conceptually equivalent to:

```text
Terminal A edits Mesa 1
Terminal B edits Mesa 2
```

and:

```text
Terminal A edits Mesa 1
Terminal B receives Mesa 1
```

and:

```text
Terminal A changes order
old server response arrives
new server response arrives
```

and:

```text
two different orders debounce simultaneously
```

Do not assume a single Zustand instance accurately represents production concurrency.

---

# 43. Required Validation

Before considering implementation complete, run:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

When relevant, also run focused tests during development.

Do not claim a problem is fixed solely because TypeScript compiles.

---

# 44. Diff Review

Before finishing any task:

1. Review the complete git diff.
2. Verify no unrelated files changed.
3. Verify no secrets were added.
4. Verify no debugging code remains.
5. Verify no accidental dependency was introduced.
6. Verify no business behavior changed unintentionally.
7. Verify tests cover the intended regression.
8. Check whether the change affects another terminal.

Large unexpected diffs must be investigated before completion.

---

# 45. CI

GitHub CI is an important validation layer.

Local success does not replace CI.

CI success does not replace domain reasoning.

For synchronization, printer, network and physical-device behavior, passing unit tests does not prove real-world correctness.

---

# 46. Performance

Do not optimize without evidence.

However, watch for:

* unnecessary Zustand subscriptions,
* unnecessary full-store rerenders,
* repeated cart transformations,
* repeated menu calculations,
* duplicate network requests,
* repeated realtime initialization,
* unnecessary large array/object cloning.

Prefer selectors that subscribe only to required state.

Do not introduce memoization everywhere without measuring a benefit.

---

# 47. Data Integrity Over UI Convenience

When forced to choose between:

```text
slightly slower UI
```

and:

```text
potentially incorrect order/payment data
```

choose data integrity.

Never sacrifice order correctness to remove a small loading state.

---

# 48. Critical Files

Changes to these areas require extra caution:

```text
src/store/useCartStore.ts
src/services/supabaseService.ts
src/services/printerService.ts
src/services/orderSyncDebouncer.ts
src/services/runtimeSupabaseConfigService.ts
src/domain/orders/
src/domain/products/
src/screens/PaymentScreen.tsx
src/screens/KitchenScreen.tsx
src/components/CartSheet.tsx
src/components/QuantityModal.tsx
src/components/QuickSaleView.tsx
src/config/supabaseConfig.ts
android/app/build.gradle
.github/workflows/
```

Before modifying a critical file, understand its callers and side effects.

---

# 49. Forbidden Shortcuts

Do NOT solve problems by:

* introducing `any` everywhere,
* disabling TypeScript checks,
* disabling ESLint rules globally,
* deleting tests,
* removing error handling,
* hardcoding Supabase credentials,
* adding fallback commercial prices,
* bypassing printerService,
* bypassing synchronization services,
* using one global sync timeout,
* duplicating modifier rules,
* duplicating configured-product ID rules,
* silently using debug signing for release,
* coupling release build to deployment,
* replacing architecture without explicit approval.

---

# 50. Scope Discipline

Implement the smallest complete change that solves the requested problem.

Avoid opportunistic refactors unrelated to the task.

If you discover a significant unrelated problem:

1. do not silently redesign it,
2. document it,
3. explain its risk,
4. propose it as separate work.

---

# 51. Definition of Done

A change is complete only when:

* existing architecture was understood before modification,
* the requested behavior works,
* relevant domain invariants remain valid,
* multi-terminal effects were considered,
* Supabase consistency was considered when applicable,
* printer behavior was considered when applicable,
* payment integrity was preserved,
* relevant tests were added or updated,
* TypeScript passes,
* lint passes,
* tests pass,
* git diff was reviewed,
* no secrets were introduced,
* no unrelated behavior was changed.

---

# 52. Final Response Required From Codex

After implementing a non-trivial task, report:

## Changes

What was changed.

## Architecture

Whether any responsibility moved between UI, store, domain or services.

## Multi-terminal impact

Explain whether the change affects synchronization or concurrent terminals.

If not applicable, explicitly state that.

## Tests

Tests added or modified.

## Validation

Report the result of:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

## Risks

Remaining concrete risks.

Do not invent risks merely to populate this section.

## Not changed

Important adjacent behavior intentionally left untouched.

---

# 53. Core Project Invariants

These rules have the highest priority.

### Invariant 1 — Commercial catalog

Supabase is the only source of truth for commercial menu/catalog data.

### Invariant 2 — Multi-terminal

Shared-state changes must be designed with multiple terminals in mind.

### Invariant 3 — Order synchronization

Different orders must never cancel each other's pending synchronization.

### Invariant 4 — Product identity

Configured-product identity must be deterministic and centralized.

### Invariant 5 — Payment

A successful payment remains successful even if printing fails.

### Invariant 6 — Printing

Printer communication goes through the printer service and remains sequential.

### Invariant 7 — Architecture

Do not increase `useCartStore` responsibilities when logic can reasonably live in the domain or service layer.

### Invariant 8 — Release

Release builds require legitimate release signing.

### Invariant 9 — Deployment

Building must never implicitly deploy or upload artifacts.

### Invariant 10 — Refactoring

Prefer incremental improvements over large rewrites.

---

# 54. Decision Priority

When multiple implementations are possible, prioritize in this order:

```text
1. Data integrity
2. Correct POS behavior
3. Multi-terminal consistency
4. Payment correctness
5. Kitchen correctness
6. Printing reliability
7. Maintainability
8. Testability
9. Performance
10. Code brevity
```

Never choose shorter code when it makes synchronization or business rules harder to reason about.
