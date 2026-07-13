# FlexiSpace: Enterprise Time-Shared Workspace Booking System

## 1. Project Identity & Tech Stack
**FlexiSpace** is a highly concurrent, real-time time-shared workspace and conference room booking system designed for modern enterprise hybrid work models.

| Tier | Technology |
|---|---|
| **Backend** | Spring Boot 3.x, Spring Data JPA |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS |
| **Database** | H2 Embedded Database |
| **Live Sync** | Server-Sent Events (SSE) |
| **Security** | Lightweight JWT Authentication |

## 2. The Problem & Pure Architecture Solution
**The Challenge:** Traditional workspace management systems often struggle under high concurrency or sudden traffic bursts, leading to overlapping reservations (Double Bookings). Furthermore, static grid interfaces result in delayed state updates across multiple user terminals, degrading the collaborative experience.

**The Solution:** FlexiSpace introduces underlying strong-consistency transaction controls combined with a unidirectional reactive event broadcast stream. This pure architecture guarantees absolute data integrity while delivering a seamless, zero-refresh collaborative experience.

## 3. Features Breakdown (User Side vs Admin Side)

### User Side
- **7-Day Horizontal Scrolling Density Calendar:** A sleek, modern slider replacing native date inputs, automatically rendering the next 7 days.
- **Rich Media Asset Cards:** Visual capacity indicators and power outlet labels for an enhanced booking experience.
- **Real-Time Daily Quota Counter:** Hard enterprise constraint strictly limiting reservations to a maximum of 4 hours per user per day.
- **Live Itinerary Panel:** Interactive upcoming schedule featuring time-locked cancellations (cancellations are disabled once the time slot begins).
- **Flash Highlight:** SSE-driven atomic cell flashing (green/red indicators) to visually broadcast state mutations without triggering a full page re-render.

### Admin Side
- **Live Global Analytics:** Real-time metrics displaying overall occupancy rates and system utilization.
- **Asset Maintenance Hot-Swapping:** Instantaneous toggle of workspace states (ACTIVE ↔ MAINTENANCE) with forced release of associated bookings.
- **Zero-Network Ultra-Fast Searching:** Memory-based data grid sorting and searching utilizing React `useMemo` for zero network overhead.
- **Administrative Override:** Global authority to cancel bookings and instantly free up resources.

## 4. Concurrency & Real-Time Sync Deep Dive (Core Technical Highlights)

### High Concurrency Control
We deeply integrate `PESSIMISTIC_WRITE` exclusive locks with the highest transaction isolation level `@Transactional(isolation = Isolation.SERIALIZABLE)`. During the pessimistic lock closure, the system performs real-time quota accumulation validation. This mathematically eliminates Phantom Reads and concurrency loopholes, ensuring zero double bookings and absolute adherence to quota constraints.

### Server-Sent Events (SSE) Data Synchronization
Leveraging Spring Events' asynchronous mechanism combined with the browser's native `EventSource`, we constructed an incremental JSON broadcast pipeline. When a booking state changes, the frontend receives the event and performs an In-place Local State Mutation to instantly update the grid, preventing overlap anomalies with zero polling overhead.

### Network Resiliency
The frontend features a robust Axios interceptor pipeline. It includes an automatic 401 circuit breaker that immediately redirects expired sessions to the login portal. Additionally, it intelligently handles transient 5xx server errors with a 500ms delayed single auto-retry mechanism for self-healing operations.

## 5. API Endpoints & Monorepo Structure

### RESTful API Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Authenticate user and generate JWT |
| GET | `/api/bookings/stream` | Public (SSE) | Unidirectional real-time event broadcast |
| GET | `/api/bookings` | Protected (USER/ADMIN) | Fetch daily workspace bookings |
| POST | `/api/bookings` | Protected (USER) | Create a booking (validates 4-hour quota) |
| DELETE | `/api/bookings/{id}` | Protected (USER/ADMIN)| Cancel an existing booking |
| GET | `/api/admin/resources` | Protected (ADMIN) | Fetch all system workspaces |
| PUT | `/api/admin/resources/{id}`| Protected (ADMIN) | Toggle ACTIVE / MAINTENANCE status |

### Monorepo Structure
```text
FlexiSpace/
├── backend/
│   ├── src/main/java/com/example/booking/
│   │   ├── config/        # Global CorsFilter, WebMvcConfigurer
│   │   ├── controller/    # Auth, Booking, Admin, Sse Controller
│   │   ├── domain/        # Entities & Enums (Role, Status)
│   │   ├── dto/           # Request/Response Contracts
│   │   ├── exception/     # GlobalExceptionHandler
│   │   ├── repository/    # JPA Interfaces with Pessimistic Locks
│   │   ├── security/      # JwtUtil, AuthInterceptor
│   │   └── service/       # Transactional & Quota Validation Logic
│   └── pom.xml
└── frontend/
    ├── src/
    │   ├── api/           # Axios Interceptor (401 & 5xx Retry)
    │   ├── components/    # Reusable UI (ProtectedRoute)
    │   ├── layouts/       # Dual-Client Layouts (UserLayout, AdminLayout)
    │   ├── pages/         # BookingPage, AdminDashboard, Logins
    │   ├── utils/         # auth.ts (Authentication helpers)
    │   ├── App.tsx        # React Router v6 Configuration
    │   └── main.tsx
    ├── package.json
    └── tailwind.config.js
```

## 6. Local Development & Setup

### 1. Start Backend (Spring Boot)
Open a terminal and start the backend service:
```bash
cd backend
mvn clean package -DskipTests
mvn spring-boot:run
```
*The Spring Boot server will run on http://localhost:8081*

### 2. Start Frontend (React/Vite)
Open a separate terminal to launch the frontend:
```bash
cd frontend
npm install
npm run dev
```
*The Vite development server will run on http://localhost:5173*

### 3. Live Sync Demonstration
The database is pre-seeded with the following credentials:
- **User Account:** `user01` (Password: `123456`)
- **Admin Account:** `admin01` (Password: `123456`)

**🌟 Demonstration Guide:**
1. Open two independent browser windows (or one incognito window).
2. Log into the **User Portal** (`user01`) in one window and the **Admin Dashboard** (`admin01`) in the other.
3. Make a booking or cancel an itinerary on the User side, or toggle a workspace's maintenance status on the Admin side.
4. Watch the instantaneous atomic cell flashing (Flash Highlight) synchronize across both screens in real-time, showcasing the true power of the SSE broadcast pipeline!
