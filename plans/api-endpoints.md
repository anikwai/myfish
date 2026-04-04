# Plan: API Endpoints (Mobile)

> Source PRD: grill-me session — 2026-04-04

## Architectural Decisions

- **Base path**: `/api/v1/`
- **Auth**: Laravel Sanctum token auth, 90-day expiration, 2FA enforced per user account
- **Rate limiting**: `throttle:6,1` on auth endpoints, `throttle:60,1` on all others
- **Roles**: Reuse existing Spatie roles (`admin`, `staff`) — same accounts as web
- **DTOs**: `spatie/laravel-data` for both input validation and API output (replaces Form Requests + Eloquent Resources in API layer)
- **Pagination**: `cursorPaginate(15)` for orders; no pagination for bounded lists (fish types, inventory, reviews)
- **Error format**: Laravel default — `{ message, errors }` shape
- **Order creation response**: Full order object (no second round-trip needed)
- **Real-time**: Laravel Reverb WebSockets + database notifications. Private channel `orders.{orderId}` for authenticated users only. Guests receive no real-time updates.
- **Media**: Business logo uploaded via `multipart/form-data`, returned as full URL via `getFirstMediaUrl()`
- **Shared logic**: Existing `OrderCreatorInterface`, `OrderCreator`, `DeductOrderFromInventory`, and `app/Values/` config objects are reused directly — no duplication
- **New packages**: `laravel/sanctum`, `laravel/reverb`, `spatie/laravel-data`, `knuckleswtf/scribe`
- **Key models**: `Order`, `OrderItem`, `FishType`, `Inventory`, `InventoryAdjustment`, `Review`, `Business`, `User`

---

## Phase 1: Infrastructure & Auth

**User stories**:

- As a mobile user, I can register, log in, and log out
- As a mobile user with 2FA enabled, I am prompted for my TOTP code after password login
- As a mobile user, I can request a password reset link and set a new password

### What to build

Install all four packages. Register `routes/api.php` in `bootstrap/app.php` with the `api` middleware group and `/api/v1` prefix. Wire Sanctum token guards. Build the full auth flow: register, login (with 2FA challenge step for users who have 2FA enabled), logout, forgot password, reset password. Apply tiered rate limiting. Create `UserData` DTO for profile representation. Write feature tests against real DB.

### Acceptance criteria

- [ ] `POST /api/v1/auth/register` creates a user and returns a Sanctum token
- [ ] `POST /api/v1/auth/login` returns a token on success; returns a `two_factor` challenge state when user has 2FA enabled
- [ ] `POST /api/v1/auth/two-factor` completes 2FA login and returns a token
- [ ] `POST /api/v1/auth/logout` revokes the current token
- [ ] `POST /api/v1/auth/forgot-password` sends a reset email
- [ ] `POST /api/v1/auth/reset-password` sets a new password
- [ ] Auth endpoints are rate-limited to 6 req/min; all others to 60 req/min
- [ ] Tokens expire after 90 days
- [ ] All endpoints return `UserData` or Laravel default error shapes
- [ ] Feature tests pass

---

## Phase 2: Customer Order Flow

**User stories**:

- As a logged-in customer, I can view my order history with infinite scroll
- As a logged-in customer, I can place a new order
- As a logged-in customer, I can view a single order's full details

### What to build

Create `OrderData` and `OrderItemData` DTOs. Wire `GET /api/v1/orders` (cursor-paginated, filterable by status), `POST /api/v1/orders`, and `GET /api/v1/orders/{order}` using the existing `OrderCreatorInterface`. The API controller delegates to the same service as the web controller — no business logic duplication. Write feature tests.

### Acceptance criteria

- [ ] `GET /api/v1/orders` returns cursor-paginated orders for the authenticated user
- [ ] `GET /api/v1/orders?status=active` filters by status correctly
- [ ] `POST /api/v1/orders` creates an order and returns the full `OrderData` object
- [ ] `GET /api/v1/orders/{order}` returns full order detail including items and status logs
- [ ] Unauthenticated requests return 401
- [ ] Accessing another user's order returns 403
- [ ] Feature tests pass

---

## Phase 3: Guest Order Flow

**User stories**:

- As a guest, I can place an order without creating an account
- As a guest, I can look up my order by its reference token

### What to build

`POST /api/v1/orders/guest` (public, no auth) uses the existing `OrderCreatorInterface::placeForGuest()`. Returns the full order object plus a signed tracking token the mobile app stores locally. `GET /api/v1/orders/guest/{order}` verifies the token and returns order detail. No Reverb channel for guests. Write feature tests.

### Acceptance criteria

- [ ] `POST /api/v1/orders/guest` creates a guest order and returns `OrderData` + a signed `tracking_token`
- [ ] `GET /api/v1/orders/guest/{order}?token={tracking_token}` returns the order detail for a valid token
- [ ] Invalid or missing token returns 403
- [ ] No authentication required for either endpoint
- [ ] Feature tests pass

---

## Phase 4: Reviews

**User stories**:

- As a customer, I can submit a review for a delivered order

### What to build

`POST /api/v1/orders/{order}/review`. Create `ReviewData` DTO. Validate the order belongs to the authenticated user and has status `delivered`. Prevent duplicate reviews. Write feature tests.

### Acceptance criteria

- [ ] `POST /api/v1/orders/{order}/review` creates a review and returns `ReviewData`
- [ ] Returns 403 if the order does not belong to the authenticated user
- [ ] Returns 422 if the order is not in `delivered` status
- [ ] Returns 422 if a review already exists for the order
- [ ] Feature tests pass

---

## Phase 5: Real-time (Reverb + Notifications)

**User stories**:

- As a logged-in customer, I receive live order status updates without refreshing
- As a logged-in customer, I can fetch my notification history

### What to build

Configure Reverb. Broadcast an `OrderStatusUpdated` event on the `orders.{orderId}` private channel whenever `Order::transitionTo()` fires (already calls `OrderNotifier`). Authenticate private channels via Sanctum. Add `GET /api/v1/notifications` to return the authenticated user's database notifications (paginated). Write feature tests for broadcasting and notification listing.

### Acceptance criteria

- [ ] `OrderStatusUpdated` event is broadcast on `private-orders.{orderId}` when status changes
- [ ] Channel auth endpoint authorises only the order owner
- [ ] `GET /api/v1/notifications` returns the user's database notifications
- [ ] `POST /api/v1/notifications/{id}/read` marks a notification as read
- [ ] Reverb is configured and a WebSocket connection can be established in tests
- [ ] Feature tests pass

---

## Phase 6: Admin Order Management

**User stories**:

- As admin/staff, I can view all orders with search and status filters
- As admin/staff, I can view a single order's full detail
- As admin/staff, I can transition an order's status
- As admin/staff, I can create a guest order on behalf of a walk-in customer

### What to build

Under `/api/v1/admin/orders`: list (cursor-paginated, searchable, filterable), show, update status, create guest. Reuse existing `Order::transitionTo()` and `DeductOrderFromInventory` action. Protect with `sanctum` + `role:admin|staff` middleware. Write feature tests including role enforcement.

### Acceptance criteria

- [ ] `GET /api/v1/admin/orders` returns cursor-paginated orders, filterable by status and searchable by name/ID
- [ ] `GET /api/v1/admin/orders/{order}` returns full detail including status logs and actor names
- [ ] `PATCH /api/v1/admin/orders/{order}/status` transitions status and deducts inventory on `packed`
- [ ] `POST /api/v1/admin/orders/guest` creates a guest order and returns full `OrderData`
- [ ] Requests from non-admin/staff users return 403
- [ ] Invalid status transitions return 422
- [ ] Feature tests pass

---

## Phase 7: Admin Catalogue

**User stories**:

- As admin, I can manage fish types (list, create, update, toggle active)
- As admin, I can view inventory and record adjustments
- As admin, I can view and update pricing configuration

### What to build

Fish types CRUD under `/api/v1/admin/fish-types`. Inventory GET + adjustment POST under `/api/v1/admin/inventory`. Pricing GET/PATCH under `/api/v1/admin/pricing`. Create `FishTypeData`, `InventoryData`, `PricingData` DTOs. All routes behind `role:admin`. Write feature tests.

### Acceptance criteria

- [ ] `GET /api/v1/admin/fish-types` returns all fish types
- [ ] `POST /api/v1/admin/fish-types` creates a fish type
- [ ] `PATCH /api/v1/admin/fish-types/{fishType}` updates name, price, or active state
- [ ] `DELETE /api/v1/admin/fish-types/{fishType}` removes a fish type
- [ ] `GET /api/v1/admin/inventory` returns current stock and recent adjustments
- [ ] `POST /api/v1/admin/inventory/adjustments` applies a delta and records the adjustment
- [ ] `GET /api/v1/admin/pricing` returns current pricing config
- [ ] `PATCH /api/v1/admin/pricing` updates pricing config
- [ ] All routes return 403 for non-admin users
- [ ] Feature tests pass

---

## Phase 8: Admin Business & Reports

**User stories**:

- As admin, I can view and update business settings including the logo
- As admin, I can view reports
- As admin, I can list and delete reviews

### What to build

Business GET/PATCH under `/api/v1/admin/business`. Logo upload via `POST /api/v1/admin/business/logo` (`multipart/form-data`, Spatie MediaLibrary). Logo delete via `DELETE /api/v1/admin/business/logo`. Reports GET under `/api/v1/admin/reports`. Reviews list + delete under `/api/v1/admin/reviews`. Create `BusinessData` DTO with `logo_url` from `getFirstMediaUrl()`. Write feature tests.

### Acceptance criteria

- [ ] `GET /api/v1/admin/business` returns business data including `logo_url`
- [ ] `PATCH /api/v1/admin/business` updates business fields
- [ ] `POST /api/v1/admin/business/logo` accepts a file upload and stores via MediaLibrary
- [ ] `DELETE /api/v1/admin/business/logo` removes the logo
- [ ] `GET /api/v1/admin/reports` returns report data
- [ ] `GET /api/v1/admin/reviews` returns all reviews
- [ ] `DELETE /api/v1/admin/reviews/{review}` removes a review
- [ ] All routes return 403 for non-admin users
- [ ] Feature tests pass

---

## Phase 9: Profile

**User stories**:

- As a logged-in user, I can view and update my profile
- As a logged-in user, I can change my password

### What to build

`GET/PUT /api/v1/profile` and `PUT /api/v1/profile/password`. Reuse existing Fortify actions (`UpdateUserProfileInformation`, `UpdateUserPassword`). Returns `UserData`. Write feature tests.

### Acceptance criteria

- [ ] `GET /api/v1/profile` returns the authenticated user's profile as `UserData`
- [ ] `PUT /api/v1/profile` updates name, email, phone and returns updated `UserData`
- [ ] `PUT /api/v1/profile/password` validates current password and sets the new one
- [ ] Wrong current password returns 422
- [ ] Unauthenticated requests return 401
- [ ] Feature tests pass

---

## Phase 10: API Documentation

**User stories**:

- As a mobile developer, I have accurate, up-to-date API docs and a Postman collection to import

### What to build

Configure Scribe (`knuckleswtf/scribe`) to extract routes, request/response shapes from the DTOs, and auth requirements. Add PHPDoc annotations where Scribe needs hints. Generate HTML docs and a Postman v2 collection. Commit the generated output.

### Acceptance criteria

- [ ] `php artisan scribe:generate` runs without errors
- [ ] All 30+ endpoints appear in the generated docs
- [ ] Auth requirements (Bearer token, public, role) are documented per endpoint
- [ ] Request and response shapes are documented for each endpoint
- [ ] A Postman v2 collection is generated and importable
- [ ] Docs are accessible at `/docs`
