# Enterprise-Grade Workspace & Conference Room Booking System (FlexiSpace MVP)

## 1. Project Overview & Technology Stack

**FlexiSpace MVP** is a lightweight, highly concurrent fractional workspace booking system designed for modern Hybrid Work models. This system eschews bloated third-party middleware, deeply leveraging underlying framework features to achieve commercial-grade real-time data synchronization and financial-grade concurrent transaction consistency under a minimalist architecture with **zero external service dependencies (No Redis, No MQ)**.

### Core Technology Stack
- **Backend Architecture**: Spring Boot 3.x, Spring Data JPA (Hibernate), H2 Database
- **Real-Time Communication**: Native Server-Sent Events (SSE), Spring ApplicationEvents
- **Security & Authorization**: Native JWT Interceptors (io.jsonwebtoken:jjwt), Role-Based Dual-Client Routing Isolation
- **Frontend Ecosystem**: React 18 (Hooks Architecture), Vite, Tailwind CSS, Axios, Lucide React

---

## 2. Dual-Client Feature Matrix & UI/UX Breakdown

The system enforces strict User/Admin privilege isolation, with both clients featuring entirely independent host layouts and business rule engines:

| Module | Target Audience | Core Features & Commercial-Grade UX |
| :--- | :--- | :--- |
| **Intelligent Console** | Standard User | **7-Day Smart Slider Calendar**: Dynamically calculates booking density to display colored indicator dots (Red/Yellow/Green), providing intuitive capacity warnings.<br>**Rich Media Asset Cards**: Frontend static configuration mapping physical metadata (e.g., `👥 8 Seats · 🖥️ 4K Projector`), reducing network transmission overhead.<br>**Hardcore Quota Settlement**: Strictly enforces a "4 hours per user per day" aggregated limit, automatically circuit-breaking frontend submissions when the balance is insufficient.<br>**Smart Itinerary Management**: Features time-locked self-cancellation (the cancellation entry point is instantly disabled once the booked time slot begins).<br>**Defensive Interactions**: Overrides irreversible actions globally, forcing the display of a secondary confirmation Modal. |
| **Management Dashboard** | System Admin | **Global Dispatch Board**: Real-time aggregation of total resource booking status and occupancy rates.<br>**One-Click Circuit Breaker**: Smoothly toggles resource states to `MAINTENANCE` and forcibly releases all associated bookings.<br>**In-Memory Frictionless Interactivity**: Abandons heavy backend search/filter APIs, utilizing `useMemo` combined with native `Array.sort/filter` to achieve zero-latency real-time search and column-level sorting entirely within the frontend memory. |

---

## 3. Hardcore Technical Highlights (Deep Dive)

This project refuses to settle for superficial CRUD operations, focusing heavily on solving the complex engineering challenges of high-concurrency overbooking prevention and multi-client state synchronization:

### 3.1 Absolute Consistency with Zero External Dependencies (Serializable Isolation + Pessimistic Write Locking)
In high-concurrency booking scenarios, malicious users might attempt to bypass the daily 4-hour quota limit via concurrent requests (a classic "Phantom Read" anomaly).
- **Architectural Solution**: Within the core write pipeline of `BookingService`, the system utilizes `@Lock(LockModeType.PESSIMISTIC_WRITE)` to enforce an exclusive lock on the resource row, and **forcefully elevates the transaction isolation level to `@Transactional(isolation = Isolation.SERIALIZABLE)`**.
- **Under the Hood**: Standard `REPEATABLE_READ` cannot prevent two concurrent transactions from simultaneously reading an aggregated "3 hours booked" state and committing independently. By enabling `SERIALIZABLE` transaction isolation, the database engine locks the index range covered by the aggregation query (`calculateTotalHoursByUserAndDate`), mathematically eradicating phantom reads and overbooking loopholes at the storage level, achieving financial-grade absolute data consistency.

### 3.2 Real-Time Multi-Client Synchronization (One-Way Broadcast + Atomic State Mutation)
Without introducing the handshake overhead of WebSockets or the operational complexity of message queues, the system realizes seamless multi-client collaboration.
- **Server-Sent Events (SSE) Broadcast**: The backend achieves business layer decoupling via Spring's `ApplicationEventPublisher`, pushing transaction states into a pool of `SseEmitter` instances managed by a `CopyOnWriteArrayList`, and delivering incremental JSON payloads to clients via HTTP/1.1 persistent connections.
- **Reactive UI Mutation & Flash Highlights**: Upon intercepting the SSE push, the frontend `useUserBooking` Hook executes local state incremental merging and filtering directly in memory without a page refresh. Concurrently, the frontend precisely targets the affected grid coordinates, injecting a 1.5-second CSS keyframe animation (`animate-flash-red` for new reservations / `animate-flash-green` for releases), perfectly replicating the tactile real-time feedback of commercial collaboration software.

### 3.3 Network Resiliency & Frontend Disaster Recovery
- **401 Auto-Circuit Breaker**: An Axios response interceptor globally catches token validation failures, executing an atomic `localStorage` wipe and forcefully decoupling the stale state, redirecting the router back to the login portal.
- **5xx Transient Retry Compensation**: To handle transient network jitter or brief 500/502 server overloads during high concurrency, the interceptor embeds a 500ms delayed single auto-retry closure. This heals the network blip without user awareness, significantly enhancing frontend robustness in complex network environments.

---

## 4. Quickstart & Demonstration Credentials

### Environment Startup
Please launch the backend and frontend services in separate independent terminals:

**Backend (Spring Boot)**
```bash
cd backend
mvn spring-boot:run
```
*(Backend runs on http://localhost:8081)*

**Frontend (React/Vite)**
```bash
cd frontend
npm run dev
```
*(Frontend runs on http://localhost:5173)*

### Demonstration Credentials & Best Practice (Dual-Browser Testing)
The system automatically initializes demo accounts upon startup via JPA `data.sql`:
- **Standard User**: `user01` / `123456`
- **System Admin**: `admin01` / `123456`

**🌟 Highly Recommended Demonstration Flow**:
1. Open the left half of your screen with a browser, log in as `user01`, and remain on the Workspace Grid page.
2. Open the right half of your screen (or an incognito window), navigate to `/admin/login`, and log in as `admin01`.
3. From the Admin Dashboard, set a specific resource to `Maintenance`, or forcefully delete an order.
4. **Observe the left User UI**: You will instantly witness the corresponding grid cell emit a green/red flash animation, and the daily quota will update automatically in milliseconds—experiencing the seamless SSE real-time synchronization firsthand!
