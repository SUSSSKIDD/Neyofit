# Neyofit - Fitness & Wellness Platform

![Neyofit Logo](frontend/public/images/neyofit.png)

A comprehensive fitness platform connecting gym-goers with gyms, offering subscription management, payment processing, and gym management tools.

---

## 🎯 Purpose

Neyofit is a **multi-sided marketplace platform** that bridges the gap between:
- **Customers** - Find gyms, purchase subscriptions, track attendance
- **Gym Owners** - Manage members, subscriptions, payments, and payouts
- **Platform Admins** - Oversee operations, commissions, and user management

### Key Features

| Module | Customer | Gym Owner | Admin |
|--------|:--------:|:---------:|:-----:|
| Gym Discovery & Search | ✅ | - | ✅ |
| Subscription Purchase | ✅ | ✅ | ✅ |
| OTP/Password Authentication | ✅ | ✅ | ✅ |
| Razorpay Payment Integration | ✅ | ✅ | ✅ |
| Attendance Check-in/out | - | ✅ | - |
| Member Management (CRM) | - | ✅ | ✅ |
| Payout & Commission Tracking | - | ✅ | ✅ |
| Platform Settings & Analytics | - | - | ✅ |

---

## 🛠 Tech Stack

### Backend (Node.js + TypeScript)
```
Runtime:           Node.js 20.x (ES Modules)
Framework:         Express.js 4.x
Database:          MongoDB 7.x + Mongoose 8.x
Authentication:    JWT (Access: 15min, Refresh: 7d) + HTTP-only Cookies
Password Hashing:  bcryptjs (12 rounds)
Validation:        Zod 4.x
Rate Limiting:     express-rate-limit
Email:             Nodemailer + EJS Templates
Payments:          Razorpay (Orders, Webhooks, Refunds)
File Upload:       Multer + Sharp (Image optimization)
Documentation:     Swagger/OpenAPI 3.0
Logging:           Custom Winston Logger
Scheduling:        node-cron
```

### Frontend (Next.js 14 + React 18)
```
Framework:         Next.js 14.2 (App Router)
Language:          TypeScript 5.x
Styling:           Tailwind CSS 3.4 + Tailwind Animate
UI Components:     Radix UI Primitives + shadcn/ui
Forms:             React Hook Form + Zod Resolvers
State:             React Context + Custom Hooks
Charts:            Recharts 2.15
Maps:              @react-google-maps/api
Animations:        Framer Motion
Icons:             Lucide React
Date Handling:     date-fns 4.x
PWA:               Serwist (Workbox)
```

### Infrastructure & DevOps
```
Containerization:  Docker (Multi-stage builds)
Orchestration:     Docker Compose (Blue-Green Deployment)
Reverse Proxy:     Nginx (SSL termination, rate limiting)
Database:          MongoDB (Internal network only)
CI/CD:             GitHub Actions (Parallel jobs, caching)
Security Scanning: Trivy (Container), Semgrep (SAST)
Package Manager:   npm (with lockfiles)
```

---

## 🏗 System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        PWA[Mobile PWA]
    end

    subgraph "Edge Layer"
        NGINX[Nginx Reverse Proxy<br/>SSL + Rate Limit + CORS]
    end

    subgraph "Application Layer"
        BLUE[Backend Blue<br/>Port 8905]
        GREEN[Backend Green<br/>Port 8915]
        FE_BLUE[Frontend Blue<br/>Port 8906]
        FE_GREEN[Frontend Green<br/>Port 8916]
    end

    subgraph "Data Layer"
        MONGO[(MongoDB<br/>Internal Network)]
    end

    subgraph "External Services"
        RAZORPAY[Razorpay API]
        EMAIL[Email Provider<br/>SendGrid/Mailgun]
        MAPS[Google Maps API]
    end

    WEB --> NGINX
    PWA --> NGINX
    NGINX --> BLUE
    NGINX --> GREEN
    NGINX --> FE_BLUE
    NGINX --> FE_GREEN
    BLUE --> MONGO
    GREEN --> MONGO
    BLUE --> RAZORPAY
    BLUE --> EMAIL
    BLUE --> MAPS
    GREEN --> RAZORPAY
    GREEN --> EMAIL
    GREEN --> MAPS
```

### Component Diagram

```mermaid
graph LR
    subgraph "Auth Module"
        AUTH_CTRL[Auth Controllers]
        AUTH_MW[Auth Middleware]
        JWT_UTIL[JWT Utilities]
        COOKIE_UTIL[Cookie Utilities]
        TOKEN_BL[Token Blacklist]
    end

    subgraph "User Module"
        USER_MODEL[User Model]
        USER_CTRL[User Controllers]
        ENCRYPTION[Encryption Utils]
    end

    subgraph "Payment Module"
        PAY_CTRL[Payment Controllers]
        PAY_MODEL[Payment Model]
        RAZORPAY[Razorpay Client]
        WEBHOOK[Webhook Handler]
    end

    subgraph "Gym Module"
        GYM_MODEL[Gym Model]
        GYM_CTRL[Gym Controllers]
        SLOT_MODEL[Gym Slot Model]
        FACILITY[Facility Model]
    end

    subgraph "Subscription Module"
        SUB_LIST[Subscription Listing]
        SUB_MODEL[Subscription Model]
    end

    subgraph "CRM Module"
        MEMBER[Gym Member]
        VISIT[Visit/Attendance]
        OFFLINE_PAY[Offline Payment]
    end

    AUTH_CTRL --> JWT_UTIL
    AUTH_CTRL --> COOKIE_UTIL
    AUTH_CTRL --> TOKEN_BL
    AUTH_MW --> JWT_UTIL
    AUTH_MW --> USER_MODEL
    
    PAY_CTRL --> RAZORPAY
    PAY_CTRL --> PAY_MODEL
    PAY_CTRL --> SUB_MODEL
    PAY_CTRL --> SUB_LIST
    WEBHOOK --> PAY_MODEL
    WEBHOOK --> SUB_MODEL
    
    USER_MODEL --> ENCRYPTION
    
    GYM_CTRL --> GYM_MODEL
    GYM_CTRL --> SLOT_MODEL
    GYM_CTRL --> FACILITY
    
    MEMBER --> GYM_MODEL
    VISIT --> MEMBER
    OFFLINE_PAY --> MEMBER
```

### Data Model (ER Diagram)

```mermaid
erDiagram
    USER ||--o{ SUBSCRIPTION : owns
    USER ||--o{ PAYMENT : makes
    USER ||--o{ GYM_MEMBER : "is member of"
    USER ||--o{ VISIT : visits
    USER ||--o{ OFFLINE_PAYMENT : pays
    USER ||--o{ GYM : owns
    USER ||--o{ GYM_REVIEW : writes
    
    GYM ||--o{ SUBSCRIPTION_LISTING : offers
    GYM ||--o{ GYM_SLOT : "has schedule"
    GYM ||--o{ GYM_PICTURE : displays
    GYM ||--o{ GYM_MEMBER : manages
    GYM ||--o{ VISIT : hosts
    GYM ||--o{ OFFLINE_PAYMENT : records
    GYM ||--o{ GYM_FACILITY : has
    
    SUBSCRIPTION_LISTING ||--o{ SUBSCRIPTION : "purchased as"
    SUBSCRIPTION_LISTING ||--o{ PAYMENT : "paid for"
    
    SUBSCRIPTION }|--|| PAYMENT : generates
    SUBSCRIPTION }|--|| PAYOUT : "commission from"
    
    PAYOUT ||--o{ PAYMENT : includes
    
    USER {
        string _id PK
        enum userType
        string email UK
        string phone UK
        string passwordHash
        int tokenVersion
        json bankDetails "encrypted"
        date lastLogin
        bool isEmailVerified
        bool isActive
    }
    
    GYM {
        string _id PK
        string name
        string ownerId FK
        string locationId FK
        json openingHours
        enum status
        float commissionRate
        bool isActive
    }
    
    SUBSCRIPTION_LISTING {
        string _id PK
        string gymId FK
        string name
        enum type
        int durationInDays
        float cost
        string currency
        bool isActive
    }
    
    SUBSCRIPTION {
        string _id PK
        string userId FK
        string subscriptionListingId FK
        date startDate
        date endDate
        enum status
        bool isRecurring
    }
    
    PAYMENT {
        string _id PK
        string userId FK
        string subscriptionId FK
        string razorpayOrderId
        string razorpayPaymentId
        float amount
        enum status
        float commissionRate
        float commissionAmount
        enum payoutStatus
    }
    
    GYM_MEMBER {
        string _id PK
        string gymId FK
        string userId FK
        string membershipNumber
        date membershipStartDate
        date membershipEndDate
        enum membershipStatus
        enum memberType
    }
    
    VISIT {
        string _id PK
        string gymId FK
        string memberId FK
        datetime checkInTime
        datetime checkOutTime
    }
    
    PAYOUT {
        string _id PK
        string gymOwnerId FK
        float amount
        string[] paymentIds
        enum status
        string transactionReference
    }
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x
- Docker & Docker Compose
- MongoDB 7.x (or use provided container)
- Razorpay Account (for payments)
- Email Provider (SendGrid, Mailgun, or SMTP)
- Google Maps API Key (optional)

### Quick Start (Development)

```bash
# 1. Clone repository
git clone https://github.com/your-org/neyofit.git
cd neyofit

# 2. Set up environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Edit .env files with your credentials
# Required: JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY, MONGODB_URI
# Required: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
# Required: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS

# 4. Start databases
docker compose -f docker-compose.db.yml up -d

# 5. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 6. Start development servers
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# 7. Access applications
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# API Docs: http://localhost:5000/api-docs (dev only)
```

### Production Deployment (Blue-Green)

```bash
# On VPS (200.97.166.2)
cd /srv/projects/pratyush/neyofit

# 1. Rotate secrets (first time only)
chmod +x rotate-secrets.sh
./rotate-secrets.sh

# 2. Configure Razorpay webhook URL in dashboard:
# https://api.neyofit.in/api/v1/payments/webhook

# 3. Deploy
./deploy-blue-green.sh

# 4. Verify
curl https://api.neyofit.in/health
curl https://neyofit.in/
```

---

## ⚙️ Configuration

### Backend Environment Variables (`backend/.env`)

| Variable | Required | Description | Example |
|----------|:--------:|-------------|---------|
| `PORT` | ✅ | Server port | `5000` |
| `NODE_ENV` | ✅ | Environment | `production` |
| `MONGODB_URI` | ✅ | MongoDB connection string | `mongodb://user:pass@host:27017/db?authSource=admin` |
| `CORS_ORIGIN` | ✅ | Allowed frontend origin | `https://neyofit.in` |
| `FRONTEND_URL` | ✅ | Frontend URL for emails | `https://neyofit.in` |
| `PUBLIC_API_URL` | ✅ | Public API URL | `https://api.neyofit.in` |
| `JWT_SECRET` | ✅ | Access token secret (32+ chars) | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token secret (32+ chars) | `openssl rand -base64 48` |
| `JWT_ACCESS_EXPIRES_IN` | | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | | Refresh token TTL | `7d` |
| `ENCRYPTION_KEY` | ✅ | Bank details encryption (64 hex) | `openssl rand -hex 32` |
| `RAZORPAY_KEY_ID` | ✅ | Razorpay Key ID | `rzp_live_xxx` |
| `RAZORPAY_KEY_SECRET` | ✅ | Razorpay Secret | `xxx` |
| `RAZORPAY_WEBHOOK_SECRET` | ✅ | Webhook verification secret | `openssl rand -base64 32` |
| `EMAIL_HOST` | ✅ | SMTP host | `smtp.sendgrid.net` |
| `EMAIL_PORT` | ✅ | SMTP port | `587` |
| `EMAIL_USER` | ✅ | SMTP username | `apikey` |
| `EMAIL_PASS` | ✅ | SMTP password | `SG.xxx` |
| `EMAIL_FROM` | ✅ | From address | `Neyofit <noreply@neyofit.in>` |

### Frontend Environment Variables (`frontend/.env.local`)

| Variable | Required | Description | Example |
|----------|:--------:|-------------|---------|
| `NEXT_PUBLIC_ADMIN_SECRET` | ✅ | Admin panel secret | `secret` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | ✅ | Razorpay publishable key | `rzp_live_xxx` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | | Google Maps API key | `AIzaSy...` |
| `NEXT_PUBLIC_API_BASE_URL` | ✅ | Backend API URL | `https://api.neyofit.in/api/v1` |

### Secret Generation Commands

```bash
# JWT Secrets (run each separately)
openssl rand -base64 48  # JWT_SECRET
openssl rand -base64 48  # JWT_REFRESH_SECRET

# Encryption Key (32 bytes = 64 hex chars)
openssl rand -hex 32

# Razorpay Webhook Secret
openssl rand -base64 32

# MongoDB Password
openssl rand -base64 24
```

---

## 🔐 Security Implementation

### Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant Server
    Client->>Server: POST /auth/login {email, password}
    Server->>Client: 200 OK + Set-Cookie (accessToken, refreshToken)
    Note over Client,Server: Access Token: 15min, HTTP-only, Secure, SameSite=Strict
    Note over Client,Server: Refresh Token: 7d, HTTP-only, Secure, SameSite=Strict
    
    Client->>API: GET /api/resource + Cookies
    API->>Client: 200 OK
    
    alt Access Token Expired
        Client->>Server: POST /auth/refresh-token + Cookies
        Server->>Client: 200 OK + New Access Token Cookie
    end
    
    Client->>Server: POST /auth/logout + Cookies
    Server->>Client: 200 OK + Clear Cookies + Increment tokenVersion
```

### Security Measures Implemented

| Layer | Implementation |
|-------|----------------|
| **Transport** | HTTPS enforced, HSTS, Secure cookies |
| **Authentication** | JWT with short expiry (15min), refresh rotation, token versioning |
| **Authorization** | Role-based (Customer, Gym, Employee, SuperAdmin), resource ownership |
| **Rate Limiting** | Per-user/IP: Auth 5/15min, OTP 3/hr, Payment 30/15min, General 200/15min |
| **CORS** | Allowlist with regex for preview deployments (`*.neyofit.in`) |
| **Headers** | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy, COOP, CORP |
| **Input Validation** | Zod schemas on all endpoints, MongoDB injection prevention |
| **Secrets** | No defaults, fail-fast on missing env, no `.env` in Docker images |
| **Encryption** | AES-256-GCM for bank details (account number, IFSC, UPI) |
| **Audit** | Structured logging for auth events, payments, admin actions |
| **Webhooks** | Constant-time HMAC verification, idempotency keys |
| **File Upload** | MIME validation, size limits (10KB JSON, 50MB multipart), Sharp processing |

### Key Security Code Locations

- **JWT Config**: `backend/src/config/jwt.config.ts` (fail-fast, no defaults)
- **Token Utils**: `backend/src/utils/token.utils.ts` (access/refresh pair, versioning)
- **Auth Middleware**: `backend/src/auth/auth.middleware.ts` (cookie + header, tokenVersion check)
- **Encryption**: `backend/src/utils/encryption.utils.ts` (AES-256-GCM)
- **Rate Limiting**: `backend/src/middleware/rateLimiting.ts` (user/IP based, no localhost bypass)
- **CORS**: `backend/src/middleware/cors.ts` (allowlist + regex)
- **Security Headers**: `backend/src/middleware/security.ts` (CSP, HSTS, COOP, CORP)
- **Webhook**: `backend/src/payment/payment.webhook.ts` (timing-safe compare)

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/register-user` | Public | Register new user |
| `POST` | `/api/v1/auth/login-user` | Public | Email/password login |
| `POST` | `/api/v1/auth/send-otp` | Public | Send OTP (login/signup) |
| `POST` | `/api/v1/auth/verify-otp` | Public | Verify OTP + login/register |
| `POST` | `/api/v1/auth/refresh-token` | Cookie | Refresh access token |
| `POST` | `/api/v1/auth/logout` | Protected | Logout + revoke tokens |
| `GET` | `/api/v1/auth/verify-token` | Protected | Verify token + get user |
| `POST` | `/api/v1/auth/forgot-password` | Public | Request password reset |
| `POST` | `/api/v1/auth/reset-password` | Public | Reset password with token |
| `POST` | `/api/v1/auth/check-email` | Public | Check email (uniform response) |
| `POST` | `/api/v1/auth/send-verification-email` | Protected | Resend verification email |
| `GET` | `/api/v1/auth/verify-email/:token` | Public | Verify email via token |

### Users (Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/users` | SuperAdmin | List users (paginated, filtered) |
| `GET` | `/api/v1/users/:id` | SuperAdmin | Get user by ID |
| `PATCH` | `/api/v1/users/:id/toggle-active` | SuperAdmin | Activate/deactivate user |
| `DELETE` | `/api/v1/users/:id` | SuperAdmin | Delete user |
| `POST` | `/api/v1/auth/register-gym-owner` | SuperAdmin | Create gym owner |

### Gyms

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/gyms` | Gym/Employee/SuperAdmin | Create gym |
| `GET` | `/api/v1/gyms` | Public | List gyms (paginated, search, filter) |
| `GET` | `/api/v1/gyms/:id` | Public | Get gym by ID |
| `PUT` | `/api/v1/gyms/:id` | Owner/SuperAdmin | Update gym |
| `DELETE` | `/api/v1/gyms/:id` | SuperAdmin | Delete gym |
| `PATCH` | `/api/v1/gyms/:id/status` | Owner/SuperAdmin | Update status (draft/published/archived) |
| `GET` | `/api/v1/gyms/:id/subscription-listings` | Public | Get gym's subscription plans |
| `POST` | `/api/v1/gyms/:id/subscription-listings` | Owner/SuperAdmin | Link subscription to gym |

### Subscription Listings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/subscription-listings` | Gym/SuperAdmin | Create subscription plan |
| `GET` | `/api/v1/subscription-listings` | Public | List plans (filterable) |
| `GET` | `/api/v1/subscription-listings/:id` | Public | Get plan by ID |
| `PUT` | `/api/v1/subscription-listings/:id` | Owner/SuperAdmin | Update plan |
| `DELETE` | `/api/v1/subscription-listings/:id` | Owner/SuperAdmin | Delete plan |

### Subscriptions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/subscriptions` | Customer | Purchase subscription |
| `GET` | `/api/v1/subscriptions` | Customer | List user's subscriptions |

### Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/payments/order` | Customer | Create Razorpay order |
| `POST` | `/api/v1/payments/verify` | Customer | Verify payment + activate sub |
| `GET` | `/api/v1/payments/status/:orderId` | Customer | Get payment status |
| `GET` | `/api/v1/payments/gym-passes` | Customer | Get active gym passes |
| `GET` | `/api/v1/payments/user-payments` | Customer | Get payment history |
| `GET` | `/api/v1/payments/all` | SuperAdmin | All payments (paginated) |
| `GET` | `/api/v1/payments/gym-owner` | Gym Owner | Payments for owned gyms |
| `GET` | `/api/v1/payments/payout-summary` | SuperAdmin | Payout summary per gym owner |

### Payouts (SuperAdmin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/payouts/dashboard` | SuperAdmin | Payout dashboard |
| `GET` | `/api/v1/payouts` | SuperAdmin | All payouts (paginated) |
| `POST` | `/api/v1/payouts` | SuperAdmin | Create payout |
| `PATCH` | `/api/v1/payouts/:id/complete` | SuperAdmin | Mark payout complete |
| `PATCH` | `/api/v1/payouts/:id/fail` | SuperAdmin | Mark payout failed |

### CRM (Gym Owner)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/gym-members` | Gym/Employee | Create member |
| `GET` | `/api/v1/gym-members/gym/:gymId` | Gym/Employee | List members |
| `GET` | `/api/v1/gym-members/:id` | Gym/Employee | Get member |
| `PUT` | `/api/v1/gym-members/:id` | Gym/Employee | Update member |
| `POST` | `/api/v1/gym-members/:id/freeze` | Gym/Employee | Freeze membership |
| `POST` | `/api/v1/gym-members/:id/unfreeze` | Gym/Employee | Unfreeze membership |
| `POST` | `/api/v1/gym-members/:id/renew` | Gym/Employee | Renew membership |

### Visits/Attendance

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/visits/check-in` | Gym/Employee | Check-in member |
| `POST` | `/api/v1/visits/check-out/:visitId` | Gym/Employee | Check-out member |
| `GET` | `/api/v1/visits/gym/:gymId/today` | Gym/Employee | Today's attendance |
| `GET` | `/api/v1/visits/gym/:gymId/currently-in` | Gym/Employee | Currently in gym |

### Offline Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/offline-payments` | Gym/Employee | Record offline payment |
| `GET` | `/api/v1/offline-payments/gym/:gymId` | Gym/Employee | List offline payments |
| `GET` | `/api/v1/offline-payments/gym/:gymId/summary` | Gym/Employee | Revenue summary |

---

## 🧪 Testing

### Test Structure

```
backend/tests/
├── factories.ts          # Test data factories
├── tabular-reporter.ts   # Custom tabular output
├── setup.ts              # Global test setup
├── auth.e2e.test.ts      # Authentication E2E tests
├── payment.e2e.test.ts   # Payment E2E tests
├── gym.e2e.test.ts       # Gym E2E tests
└── user.e2e.test.ts      # User management E2E tests
```

### Running Tests

```bash
# All tests
cd backend && npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests only
npm run test:e2e

# Unit tests only
npm run test:unit
```

### Test Output (Tabular)

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        NEYOFIT E2E TEST SUITE                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Suite                          │ Test                                     │ Status  │ Time   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Auth E2E Tests                 │ Valid customer registration              │ ✅ PASS │  145ms ║
║  Auth E2E Tests                 │ Valid gym registration                   │ ✅ PASS │  132ms ║
║  Auth E2E Tests                 │ Missing email                            │ ✅ PASS │   89ms ║
║  Auth E2E Tests                 │ Password without name                    │ ✅ PASS │   76ms ║
║  Auth E2E Tests                 │ Invalid userType                         │ ✅ PASS │   81ms ║
║  Auth E2E Tests                 │ Duplicate email                          │ ✅ PASS │   94ms ║
║  Auth E2E Tests                 │ Weak password (6 chars)                  │ ✅ PASS │   87ms ║
║  Auth E2E Tests                 │ XSS in name                              │ ✅ PASS │   91ms ║
║  Auth E2E Tests                 │ Unicode name                             │ ✅ PASS │   83ms ║
║  Payment E2E Tests              │ Create payment order for valid sub       │ ✅ PASS │  234ms ║
║  Payment E2E Tests              │ Missing subscriptionListingId            │ ✅ PASS │  112ms ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  SUMMARY: 42 tests | 42 passed | 0 failed | 0 skipped | 3847ms total                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Test Coverage Areas

| Module | Coverage | Test Types |
|--------|:--------:|------------|
| Authentication | 95% | E2E, Unit, Edge cases |
| Payments | 90% | E2E, Webhook simulation |
| Users | 85% | E2E, RBAC |
| Gyms | 85% | E2E, Ownership |
| Subscriptions | 80% | E2E |
| CRM | 75% | E2E |

---

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow (`.github/workflows/ci-cd.yml`)

```mermaid
graph LR
    A[Push to main] --> B[Lint & TypeCheck]
    B --> C[Security Scan]
    C --> D[Build Backend]
    C --> E[Build Frontend]
    D --> F[Docker Build]
    E --> F
    F --> G[Trivy Scan]
    G --> H[Deploy]
```

### Pipeline Stages

| Stage | Jobs | Parallel | Timeout |
|-------|------|:--------:|---------|
| **Lint & TypeCheck** | 2 | ✅ | 10 min |
| **Security Scan** | 2 | ✅ | 15 min |
| **Build** | 2 | ✅ | 15 min |
| **Docker Build & Scan** | 2 | ✅ | 20 min |
| **Deploy** | 1 | | 15 min |

### Optimizations

- **Parallel Execution**: Backend/Frontend builds run simultaneously
- **npm Caching**: `cache-dependency-path` for both package-lock.json
- **Docker Layer Caching**: `cache-from: type=gha, cache-to: type=gha,mode=max`
- **Artifact Sharing**: Build outputs passed between jobs via artifacts

### Security Gates

- Semgrep SAST (security-audit, secrets, owasp-top-ten, nodejs)
- Trivy Container Scan (CRITICAL, HIGH vulnerabilities block deploy)
- npm audit (high/critical blocks)

---

## 📦 Deployment

### Blue-Green Deployment Script (`deploy-blue-green.sh`)

```bash
#!/bin/bash
# Zero-downtime deployment with health checks

1. Determine active environment (blue/green)
2. Build & start new environment
3. Wait 15s for initialization
4. Health check: GET /health on new backend
5. Switch Nginx upstream
6. Reload Nginx
7. Verify new environment: GET /health
8. Stop & remove old environment
9. Clean unused Docker images
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/neyofit-blue.conf
server {
    listen 80;
    server_name neyofit.in www.neyofit.in;
    location / {
        proxy_pass http://127.0.0.1:8906;  # Frontend Blue
        # ... headers
    }
}

server {
    listen 80;
    server_name api.neyofit.in;
    location / {
        proxy_pass http://127.0.0.1:8905;  # Backend Blue
        # ... headers
    }
}
```

### Docker Compose Files

- `docker-compose.yml` - Blue/Green application services
- `docker-compose.db.yml` - MongoDB (internal network only)

### Health Check Endpoint

```bash
GET /health
# Response: { "status": "OK", "timestamp": "...", "uptime": 12345, "environment": "production" }
```

---

## 📊 Monitoring & Operations

### Logging

- **Format**: JSON with timestamp, level, message, context
- **Levels**: error, warn, info, debug
- **Correlation**: Request ID propagated through all services
- **Sensitive Data**: Automatically masked (passwords, tokens, PII)

### Key Metrics to Monitor

| Metric | Alert Threshold |
|--------|-----------------|
| API Error Rate | > 1% over 5min |
| Auth Failure Rate | > 5% over 5min |
| Payment Failure Rate | > 2% over 5min |
| DB Connection Pool | > 80% utilization |
| Memory Usage | > 85% |
| Disk Usage | > 80% |

### Backup Strategy

- **MongoDB**: Daily automated backups to cloud storage
- **Point-in-time Recovery**: Enabled

---

## 📁 Project Structure

```
neyofit/
├── backend/
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   │   ├── auth.controllers.ts
│   │   │   ├── auth.middleware.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── ...
│   │   ├── config/            # Configuration
│   │   ├── gym/               # Gym management
│   │   ├── middleware/        # Express middleware
│   │   ├── payment/           # Payment processing
│   │   ├── subscription/      # Subscriptions
│   │   ├── subscriptionListing/ # Subscription plans
│   │   ├── user/              # User management
│   │   ├── utils/             # Utilities (crypto, token, encryption)
│   │   ├── server.ts          # Entry point
│   │   └── mainroutes.ts      # Route aggregation
│   ├── tests/                 # Test files
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── app/                   # Next.js App Router pages
│   ├── components/            # React components
│   ├── contexts/              # React contexts (Auth)
│   ├── lib/                   # API client, utilities
│   ├── hooks/                 # Custom hooks
│   ├── public/                # Static assets
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   ├── neyofit-blue.conf
│   └── neyofit-green.conf
├── docker-compose.yml
├── docker-compose.db.yml
├── deploy-blue-green.sh
├── rotate-secrets.sh
├── .github/workflows/ci-cd.yml
└── README.md
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards

- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- 80%+ test coverage for new code

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

- **Documentation**: [API Docs](https://api.neyofit.in/api-docs)
- **Issues**: [GitHub Issues](https://github.com/your-org/neyofit/issues)
- **Email**: support@neyofit.in

---

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/)
- [Next.js](https://nextjs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Razorpay](https://razorpay.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- All open-source contributors