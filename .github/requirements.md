Requirements.md

# Requirements Document

## Introduction
Fresh Greens is a B2C e-commerce platform that connects buyers directly with sellers of fresh agricultural produce. This document outlines the core functional requirements and corresponding user stories.

## Requirements

### Requirement 1: User Registration & Authentication
**User Story:** As a buyer or seller, I want to securely log in or register using my existing Google/Social accounts via Firebase so that I can access personalized features, manage my profile, and save my preferences.

#### Acceptance Criteria
	1. Users must be able to securely authenticate via Firebase Auth.
	2. The backend must properly issue and validate a session against the Firebase token.
	3. First-time users should be prompted to update their profile (email, phone, location) immediately post-login.

### Requirement 2: Product Discovery & Search
**User Story:** As a customer or guest, I want to browse and search for fresh produce by categories, keywords, or my local city/pincode so that I can easily find relevant products to buy.

#### Acceptance Criteria
	1. The product catalog must be accessible to both unauthenticated and authenticated users.
	2. Users must be able to filter search results by `city` and `pincode`.
	3. The catalogue payload must be fetched quickly, leveraging the cached layers (Redis/ConcurrentMap).

### Requirement 3: Shopping Cart Management
**User Story:** As an authenticated buyer, I want to add products to my cart, adjust quantities, and remove items so that I can compile my entire order before purchasing.

#### Acceptance Criteria
	1. Users must be logged in to add products to the cart.
	2. The platform must validate real-time stock availability before allowing items to be grouped in the cart.
	3. Cart total costs must strictly incorporate item quantity and respective real-time pricing.

### Requirement 4: Checkout & Secure Payments
**User Story:** As a buyer, I want to seamlessly check out my cart and pay via a comprehensive payment gateway (Razorpay) so that my order is successfully completed.

#### Acceptance Criteria
	1. Buyers must explicitly provide delivery addresses (City, Pincode, Address) at checkout.
	2. The application must initialize a Razorpay Order and launch the Razorpay UI wrapper block.
	3. Submitting the Razorpay signature must confidently verify HMAC-SHA256 legitimacy prior to confirming the local DB order as `PAID`.

### Requirement 5: Product Management (Seller)
**User Story:** As a registered seller, I want to easily create, modify, and delete my product listings so that my latest produce is available for buyers on the platform.

#### Acceptance Criteria
	1. Only users possessing the `ROLE_SELLER` authority can execute product creation or modification endpoints.
	2. Required fields must include title, price, unit type, category, stock count, and images.
	3. New additions by sellers must actively invalidate relevant local cache layers assuring the updated product immediately hits buyers' catalogs.

### Requirement 6: Order History & Tracking
**User Story:** As a buyer, I want to view my past and ongoing orders on a dedicated history page so that I can track deliveries and recount historical purchases.

#### Acceptance Criteria
	1. Buyers can retrieve a paginated array of their orders sorted by date.
	2. Detailed itemized views for each order showing snapshot locked prices (price at the time of purchase). 




