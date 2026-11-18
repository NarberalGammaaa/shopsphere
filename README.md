# ShopSphere v2: multi-seller store with Razorpay payments

React 18 + Redux Toolkit, Spring Boot 3 + Spring Security (JWT), MySQL, Docker, GitHub Actions.

## What is in it

| Feature | Where |
|---|---|
| Separate **customer** and **seller** sign-in, each with its own UI | `/login` (store) and `/seller/login` (dark dashboard) |
| **Razorpay** online payment (UPI, cards, netbanking) or cash on delivery | Checkout page, `PaymentService`, `RazorpayClient` |
| **Delivery time** by PIN code: product page, checkout, and a tracking screen per order | `DeliveryService`, `/orders/:id` |
| **Sale countdown** banner + store-wide discount | `OfferService`, admin "Sales and offers" |
| **Order assistant chatbot** (LLM) | `ChatService`, floating "Order help" button |
| Multi-seller orders (one checkout is split per seller) | `OrderService.createOrders` |

## Run

```bash
docker compose up --build        # everything, http://localhost:3000
```

or run the parts yourself (MySQL on 3306, backend in IntelliJ, `cd frontend && npm install && npm run dev`).
The backend defaults to `localhost:3306`, database `shopsphere`, user `shop` / `shop_pass`.

**Upgrading from v1: reset the database once** (the schema changed a lot):
`DROP DATABASE shopsphere; CREATE DATABASE shopsphere;` then start the backend.

### Demo accounts

| Role | Email | Password | Portal |
|---|---|---|---|
| Customer | user@shopsphere.com | User@1234 | `/login` |
| Seller (Kolkata Gadget Hub, PIN 700001) | tech@shopsphere.com | Seller@123 | `/seller/login` |
| Seller (Mumbai Style Co, PIN 400001) | style@shopsphere.com | Seller@123 | `/seller/login` |
| Admin | admin@shopsphere.com | Admin@123 | `/login`, then `/admin` |

A browser holds one session at a time. Use a second browser or a private window to be a customer and a seller at once.

## Razorpay (online payment)

1. Create a free Razorpay account, switch the dashboard to **Test Mode**, and generate API keys.
2. Set environment variables for the backend (IntelliJ: Run configuration, Environment variables, separated by `;`):
   `RAZORPAY_KEY_ID=rzp_test_xxx;RAZORPAY_KEY_SECRET=xxx`
3. Restart the backend. Checkout now offers "Pay online". Without keys only cash on delivery is offered.

Test payments: UPI id `success@razorpay` (success) or `failure@razorpay` (failure); test card `4111 1111 1111 1111`, any future expiry, any CVV.

How a payment is secured:
1. Checkout creates the orders in `AWAITING_PAYMENT` (stock reserved) and a Razorpay order for the total, computed on the server.
2. The browser opens Razorpay's window. The card details never touch this server.
3. After success the browser sends the payment id and signature; the server checks the HMAC-SHA256 signature with the secret key and only then marks the orders `PAID`.
4. Optional backup: a webhook at `POST /api/payments/webhook` (set `RAZORPAY_WEBHOOK_SECRET`, give Razorpay a public URL, subscribe to `payment.captured`). It is verified by signature and fails closed without the secret.
5. Unpaid online orders are cancelled after 30 minutes and the stock is returned. The customer can also press "Complete payment" on My orders.
6. Refunds are **not** automated: refund in the Razorpay dashboard.

Amounts are in INR, so keep prices in rupees.

## Delivery time

`DeliveryService` compares the seller's dispatch PIN with the customer's PIN. The more leading digits they share, the closer they are:
same PIN 1 day, same city area (3 digits) 2, same region (2 digits) 3, same postal zone (1 digit) 5, otherwise 7 days, plus 1 day for packing.
It is an estimate, not live courier tracking. To use a courier API (Shiprocket, Delhivery), replace `DeliveryService.transitDays`.

## Chatbot

Set `ANTHROPIC_API_KEY` (from console.anthropic.com; API use is billed separately from any Claude subscription) and optionally `CHAT_MODEL`.
The signed-in customer's recent orders are given to the model as context; the bot is read-only (no tools), limited to 15 messages per 10 minutes per user. Edit the store facts in `ChatService.systemPrompt` to match your real policies.

## Sale countdown

Admin, "Sales and offers": set a name, discount and start/end time. Before the start the banner counts down to the start; while running it counts down to the end and all prices drop by the discount (the server applies the same discount to the order total). A 20% sale is seeded on first start.

## Roles and access

| Route | Access |
|---|---|
| `/api/auth/*`, `/api/seller/auth/*` | public (customer portal rejects seller accounts and the seller portal rejects everyone else) |
| `GET /api/products`, `/categories`, `/offers/current`, `/delivery/estimate`, `/payments/config` | public |
| `/api/orders/**`, `/api/payments/**`, `/api/chat` | customer |
| `/api/seller/**` | seller (own products and own orders only) |
| `/api/admin/**` | admin |

## Environment variables

| Variable | Purpose |
|---|---|
| `SPRING_DATASOURCE_URL / USERNAME / PASSWORD` | database |
| `JWT_SECRET` | Base64, 32+ bytes. Change for real use (`openssl rand -base64 48`) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | online payment |
| `ANTHROPIC_API_KEY`, `CHAT_MODEL` | chatbot |
| `CORS_ALLOWED_ORIGINS` | only if the UI and API are on different origins |

## CI

`.github/workflows/ci.yml` runs `mvn verify` (unit tests for JWT, Razorpay signatures and delivery estimates), builds the frontend and both Docker images, and pushes them to GHCR on `main`.

## Before production

Change all default passwords and `JWT_SECRET`; use Flyway with `ddl-auto: validate`; automate refunds; add seller approval and email notifications; put TLS in front; rate-limit `/api/auth/**`.
