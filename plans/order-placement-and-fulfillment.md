# Plan: Order Placement & Fulfillment System

> Source PRD: [anikwai/myfish#1](https://github.com/anikwai/myfish/issues/1)

## Architectural Decisions

- **Roles**: Three roles — `admin`, `staff`, `client`. Stored on the `users` table. Admin is a superset of staff. Clients self-register. Staff created by admin.
- **Routes**: Namespaced under `/admin/` for admin-only, `/orders/` for client-facing, `/staff/` for staff actions where they differ from admin.
- **Schema**: All monetary values stored in SBD. Weight stored in KG; pounds are calculated on the fly (`kg × 2.20462`). Order totals and fees are snapshotted at time of placement.
- **Key models**: `FishType`, `Setting`, `Inventory`, `InventoryAdjustment`, `Order`, `OrderItem`
- **Settings storage**: Key-value `settings` table (e.g. `price_per_pound`, `filleting_fee`, `delivery_fee`). Accessed via a typed Settings service.
- **KG → Pounds conversion**: `pounds = kg × 2.20462`. Applied at order placement; stored on `order_items`.
- **Order total formula**: `(total_pounds × price_per_pound_snapshot) + (filleting_fee_snapshot if filleting) + (delivery_fee_snapshot if delivery)`
- **Notifications**: Laravel Mail with queued jobs. Client notified on every status change. Admin notified on new order.
- **Guest orders**: `user_id` is nullable on `orders`. Guest name and phone stored directly on the order.
- **Auth**: Existing Laravel Fortify handles authentication. Role-based middleware gates routes.
- **Frontend**: Inertia + React pages. TypeScript. Wayfinder for typed route/action imports.

---

## Phase 1: Roles & Pricing Settings

**User stories**: 35, 36, 37, 38, 39

### What to build

Extend the users table with a `role` column (`admin`, `staff`, `client`). Gate existing and future routes by role using middleware. Build an admin settings page where the admin can view and update the three pricing values: price per pound (SBD), filleting flat fee (SBD), and delivery flat fee (SBD). Changes apply to new orders only.

### Acceptance criteria

- [ ] Users have a role; existing users default to `client`
- [ ] Role-based middleware prevents clients and staff from accessing admin routes
- [ ] Admin can view current values for price/pound, filleting fee, and delivery fee
- [ ] Admin can update any of the three values and they are persisted
- [ ] Non-admin users cannot access the settings page
- [ ] Tests: settings read/write, role middleware enforcement

---

## Phase 2: Fish Catalog

**User stories**: 32, 33, 34

### What to build

An admin-managed catalog of fish types. Admin can add new fish types, and toggle any fish type between active and inactive. Only active fish types are visible to clients when placing orders. Deactivated fish types are preserved on historical orders.

### Acceptance criteria

- [ ] Admin can create a new fish type with a name
- [ ] Admin can view a list of all fish types with their active/inactive status
- [ ] Admin can deactivate an active fish type
- [ ] Admin can reactivate an inactive fish type
- [ ] Inactive fish types are excluded from the client-facing order form
- [ ] Tests: CRUD operations, active/inactive filtering

---

## Phase 3: Inventory Management

**User stories**: 40, 41, 42, 44

### What to build

A single inventory record tracking total stock in KG. Admin can view the current stock level and make manual adjustments (increase for new stock arrival, decrease for corrections). Every change — whether automatic or manual — is recorded in an adjustment log with a reason, type, delta, and timestamp.

### Acceptance criteria

- [ ] Admin can view current stock in KG (and pounds equivalent)
- [ ] Admin can add stock (positive adjustment) with a reason
- [ ] Admin can reduce stock manually (negative adjustment) with a reason
- [ ] Every adjustment is recorded in the inventory adjustment log
- [ ] Log shows: type, delta, reason, who made the change, and when
- [ ] Tests: stock adjustment, audit log entries, manual override

---

## Phase 4: Client Order Placement

**User stories**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 43

### What to build

The core client ordering flow. An authenticated client sees a list of active fish types and enters a quantity in KG for each they want. They can add filleting and/or delivery (with a text location). Before submitting, they see an order summary: KG per item, equivalent pounds, line subtotals, selected fees, and a grand total in SBD — all calculated from the current settings values. On submission, fees and price/pound are snapshotted onto the order. If the total KG ordered exceeds current stock, admin is warned (order is not auto-blocked). Client sees a confirmation screen after placing.

### Acceptance criteria

- [ ] Client sees only active fish types on the order form
- [ ] Client can enter KG quantity for one or more fish types
- [ ] KG is converted to pounds and displayed in the order summary
- [ ] Total is calculated correctly: `(pounds × price_per_pound) + applicable fees`
- [ ] Filleting and delivery fees are shown separately in the summary
- [ ] Price/pound, filleting fee, and delivery fee are snapshotted on the order at placement
- [ ] Client can add a delivery location (free text) when selecting delivery
- [ ] Order is saved with status `placed` on submission
- [ ] Client sees a confirmation screen after placing the order
- [ ] Client can view their order history and current status of each order
- [ ] Admin receives a warning indicator when a new order exceeds available stock
- [ ] Tests: total calculation, fee snapshots, KG→pound conversion, order creation, stock warning

---

## Phase 5: Order Fulfillment Workflow

**User stories**: 12, 13, 18, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31

### What to build

The admin/staff order management interface. Shows all orders in a filterable list (by status). Clicking an order shows full details: client info, items with KG and pounds, selected options, snapshotted fees, and total. Admin/staff can transition the order through its status flow. Rejecting requires an optional reason. Marking as Packed auto-deducts the total KG from inventory. Staff can create guest orders (name + phone, no account needed) for walk-in customers using the same order form.

**Status flow**: `placed → confirmed | rejected | on_hold → packed → delivered`

### Acceptance criteria

- [ ] Admin/staff see all orders in a list with status badges
- [ ] List can be filtered by status
- [ ] Order detail view shows all items, KG, pounds, fees, and total
- [ ] Admin/staff can confirm a `placed` order
- [ ] Admin/staff can reject a `placed` order with an optional reason
- [ ] Admin/staff can put a `placed` order on hold (waiting for stock)
- [ ] Admin/staff can mark a `confirmed` order as packed; stock is auto-deducted
- [ ] Admin/staff can mark a `packed` order as delivered
- [ ] Invalid status transitions are rejected
- [ ] Staff can create a guest order with only name and phone number
- [ ] Guest orders appear in the same order list as regular orders
- [ ] Clients cannot access the admin/staff order management interface
- [ ] Tests: each status transition, stock deduction on pack, guest order creation, role access

---

## Phase 6: Notifications

**User stories**: 14, 15, 16, 17, 19

### What to build

Email notifications triggered by order events. When a new order is placed, admin (and optionally all staff) receive an email. When any status transition occurs, the client receives an email. Guest orders notify admin on placement but have no client email to notify on transitions. All emails are sent via queued jobs.

**Notification triggers**:
- New order placed → email to admin/staff
- Order confirmed → email to client
- Order rejected → email to client (include rejection reason if provided)
- Order on hold → email to client
- Order packed → email to client
- Order delivered → email to client

### Acceptance criteria

- [ ] Admin receives an email when any new order is placed
- [ ] Client receives an email when their order is confirmed
- [ ] Client receives an email when their order is rejected (with reason if given)
- [ ] Client receives an email when their order is put on hold
- [ ] Client receives an email when their order is packed
- [ ] Client receives an email when their order is delivered
- [ ] Notifications are sent as queued jobs (not synchronously)
- [ ] Guest order transitions do not attempt to email a non-existent client
- [ ] Tests: each notification dispatched on correct trigger, correct recipient, queue usage

---

## Phase 7: Reporting Dashboard

**User stories**: 45, 46, 47, 48, 49, 50

### What to build

An admin-only reporting dashboard aggregating data from orders and inventory. Reports are displayed for three selectable periods: today, this week, this month. Includes: total revenue (SBD), number of orders, total weight sold (KG and pounds), revenue breakdown by option (filleting, delivery), top fish types by order frequency, and stock level history from the inventory adjustment log.

### Acceptance criteria

- [ ] Admin can view total revenue for today, this week, and this month
- [ ] Admin can view number of orders for each period
- [ ] Admin can view total weight sold (KG and pounds) for each period
- [ ] Admin can see revenue contribution from filleting and delivery fees
- [ ] Admin can see which fish types are most frequently ordered
- [ ] Admin can see stock level history (from inventory adjustment log)
- [ ] Report data updates correctly when orders or inventory change
- [ ] Non-admin users cannot access the reporting dashboard
- [ ] Tests: revenue aggregation, order counts, weight totals, top fish types, period filtering
