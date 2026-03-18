# Fresh Greens Platform Design & Architecture

## 1. System Overview
Fresh Greens is a monolithic B2C e-commerce web application running on Spring Boot. It connects buyers directly with sellers for fresh agricultural produce, functioning similarly to an online marketplace. The platform uses a client-server model where a single Spring Boot application hosts both the REST API endpoints and static static web assets.

## 2. Tech Stack
*   **Backend:** Java 17+, Spring Boot 3
*   **Data Persistence:** Spring Data JPA (Hibernate), MySQL Database
*   **Security & Authentication:** Spring Security, Firebase Admin Auth SDK (Client-side Firebase JWT Tokens verified by Backend)
*   **Caching:** Redis (or in-memory ConcurrentMap for local dev) via Spring Boot `@EnableCaching`
*   **Payment Gateway:** Razorpay Java SDK (Order creation + Webhook verifications)
*   **Frontend:** Vanilla HTML, CSS, JavaScript (Static fetching rendered client-side via API calls)

## 3. Core Modules & Configuration Layers

### 3.1 Security & Auth
*   `FirebaseTokenFilter`: Custom Spring Filter that intercepts the incoming requests, parses the `Bearer` token, resolves it via Firebase, and propagates `ROLE_USER`, `ROLE_SELLER`, or `ROLE_ADMIN` context into Spring's `SecurityContextHolder`.
*   `SecurityConfig`: Sets authorization rules (CSRF excluded for API edges like `/api/webhook` and auth, while stateful sessions (`JSESSIONID`) are maintained dynamically).

### 3.2 Caching Mechanism
*   `CacheConfig` & `RedisConfig`: Conditional caching beans providing quick hits for static catalog data (e.g., Active Products `TTL 5m`, Categories `TTL 30m`).

### 3.3 Payments
*   `OrderController` & `RazorpayConfig`: Encapsulates operations securely exchanging currency info with Razorpay APIs. Creates the order before prompting the interface and handles `PaymentVerifyRequest` (validating HMAC-SHA256 signatures).
*   `WebhookController`: Independent receptor for Razorpay's asynchronous event pings (`payment.captured`, etc.).

## 4. Admin Management Page
An dedicated module accessible exclusively by `ROLE_ADMIN` identities. Contains backend implementations via the `AdminController` to oversee and manage platform integrity.
*   **Stats Dashboard**: Retrieves global transaction and user metrics.
*   **User Management**: Fetch paginated arrays of registered accounts, toggle active/inactive constraints, and update/elevate distinct roles (e.g. promoting a buyer to a seller).
*   **Product Moderation**: Fetch universal product catalogues regardless of their visibilities and exercise toggle actions (e.g., force rejecting or unpublishing a contested item).
*   **Universal Order Supervision**: Ability to review cross-platform orders globally.

## 5. User Roles and Authorizations
1.  **GUEST (Unauthenticated)**: May browse categories and search active products.
2.  **ROLE_USER**: May mutate cart inventories, place checkouts, process payments, and track order histories.
3.  **ROLE_SELLER**: Inherits Buyer capabilities + Can create, publish, and edit custom produce entries mapped directly against their `sellerId`.
4.  **ROLE_ADMIN**: May access the admin APIs. Governs users, moderates catalog data overriding Seller ownership, and monitors stats.
