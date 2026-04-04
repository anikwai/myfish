# Plan: Order State Machine (Spatie Model States)

> Source: conversation — migration from hand-rolled `transitionTo()` to `spatie/laravel-model-states`

## Architectural decisions

- **Package**: `spatie/laravel-model-states`
- **Schema**: No migration needed — Spatie stores state as a string, matching the existing `orders.status` column
- **State namespace**: `App\States\Order\` (base + 6 concrete classes)
- **Transition namespace**: `App\States\Order\Transitions\` (5 transition classes)
- **States**: `placed`, `confirmed`, `on_hold`, `rejected`, `packed`, `delivered`
- **Transitions**:
  - placed → confirmed, on_hold, rejected
  - on_hold → confirmed, rejected
  - confirmed → packed
  - packed → delivered
- **Side effects per transition**:
  - ToConfirmed: sends invoice via `OrderNotifier`
  - ToRejected: stores `rejection_reason`
  - ToPacked: deducts inventory via `DeductOrderFromInventory`
  - ToDelivered: sends receipt + review invite via `OrderNotifier`
- **Status metadata (label/color)**: defined on state classes, passed via Inertia — not computed on the frontend

---

## Phase 1: Install and scaffold state classes

**Goal**: Additive only — install the package and create the state class hierarchy. Zero behavior changes. All existing tests pass.

### What to build

Install `spatie/laravel-model-states`. Create the base `OrderState` abstract class with `AllowTransition` attributes covering all 6 valid transition arrows. Create 6 concrete state classes. Add `HasStates` to the `Order` model with `state` cast pointing at `OrderState`. The existing `transitionTo()` method and `TRANSITIONS` constant remain untouched. No frontend changes.

### Acceptance criteria

- [ ] `spatie/laravel-model-states` installed
- [ ] `App\States\Order\OrderState` base class exists with all `AllowTransition` attributes declared
- [ ] 6 concrete state classes exist: `OrderPlaced`, `OrderConfirmed`, `OrderOnHold`, `OrderRejected`, `OrderPacked`, `OrderDelivered`
- [ ] `Order` model uses `HasStates` and casts `state` to `OrderState`
- [ ] `Order::TRANSITIONS` and `Order::transitionTo()` still exist and still work
- [ ] All existing tests pass

---

## Phase 2: Replace transition logic with transition classes

**Goal**: Move all side effects out of `Order::transitionTo()` and `OrderNotifier::statusChanged()` into dedicated transition classes. Wire `UpdateOrderStatus` and `UpdateOrderStatusRequest` to the state machine. Remove the hand-rolled transition infrastructure.

### What to build

Create 5 transition classes. `ToConfirmed` sends the invoice. `ToRejected` sets `rejection_reason`. `ToPacked` deducts inventory. `ToDelivered` sends receipt and review invite. `ToOnHold` has no side effects. Each transition sets its own state, timestamps if needed, saves the order, creates a status log, and fires the relevant notifier call directly — no string branching.

Update `UpdateOrderStatus::handle()` to call `$order->state->transitionTo(TargetState::class, ...)`. Update `UpdateOrderStatusRequest` to validate with `$order->state->canTransitionTo()` instead of `Order::TRANSITIONS`. Remove `Order::transitionTo()`, `Order::TRANSITIONS`, and `OrderNotifier::statusChanged()`.

### Acceptance criteria

- [ ] 5 transition classes exist: `ToConfirmed`, `ToOnHold`, `ToRejected`, `ToPacked`, `ToDelivered`
- [ ] Each transition class owns its side effects (no string branching in notifier)
- [ ] `UpdateOrderStatus::handle()` uses `$order->state->transitionTo()`
- [ ] `UpdateOrderStatusRequest` validates with `$order->state->canTransitionTo()`
- [ ] `Order::transitionTo()` removed
- [ ] `Order::TRANSITIONS` removed
- [ ] `OrderNotifier::statusChanged()` removed
- [ ] All existing tests pass

---

## Phase 3: Push state metadata to frontend

**Goal**: Eliminate `STATUS_LABELS` and `STATUS_COLORS` duplication across 6 frontend files by moving label and color to PHP state classes and passing them via Inertia.

### What to build

Add abstract `label(): string` and `color(): string` methods to `OrderState`. Implement on each concrete state class. Update `Admin\OrderController@show`, `Admin\OrderController@index`, `OrderController@show`, `OrderController@index`, and any guest-facing controllers to pass `status_label` and `status_color` (or a `status_meta` shape) alongside the existing `status` string. Update the 6 frontend files to consume these props instead of local lookup maps. Remove `STATUS_LABELS`, `STATUS_COLORS`, and `TRANSITION_LABELS` constants from all frontend files.

### Acceptance criteria

- [ ] `OrderState` declares abstract `label()` and `color()` methods
- [ ] All 6 concrete state classes implement `label()` and `color()`
- [ ] Controllers pass `status_label` and `status_color` via Inertia where status is displayed
- [ ] `STATUS_LABELS` removed from all frontend files
- [ ] `STATUS_COLORS` removed from all frontend files
- [ ] Status badges and labels render correctly in: admin order show, admin order index, customer order show, customer order index, guest confirmation
- [ ] All existing tests pass
