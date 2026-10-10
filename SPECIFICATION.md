# System Functional & Technical Specification

## PulseGuard — Distributed Uptime Monitoring & Public Status Platform

### 1. System Overview
PulseGuard is a distributed, multi-protocol uptime monitoring and status page platform designed for high-availability observability. It continuously verifies the operational health of endpoints and web infrastructure, executes resilient 3-stage retry verification to eliminate false-positive alerts, maintains time-series latency telemetry, and exposes public status pages with 90-day historical availability.

---

### 2. Architecture & Tech Stack

- **Client Application (`client`):**
  - **Framework:** React 19, Vite
  - **Styling:** Tailwind CSS, responsive dark mode NOC (Network Operations Center) design
  - **Telemetry Visualization:** Recharts (24h response time area charts), custom 90-day daily uptime history bars
  - **State & Routing:** Context API (Authentication & Session), React Router DOM

- **Application API (`api`):**
  - **Runtime & Framework:** Node.js (ES Modules), Express
  - **Security:** Helmet, CORS, Express Rate Limit, JWT Authentication with bcrypt hashing
  - **Database:** MongoDB via Mongoose ODM
  - **Time-Series Storage:** `PingLog` collection with 90-day automatic TTL expiration (`7,776,000` seconds)

- **Worker & Queue Engine (`api/src/worker.js`):**
  - **Job Queue:** BullMQ with Redis persistence
  - **Concurrency:** Configurable concurrent worker threads
  - **Scheduler:** Atomic repeat schedulers (`upsertJobScheduler`) per monitor interval

- **Alerting & Notification:**
  - **Engine:** Nodemailer SMTP transport with automated Ethereal development sandbox fallback
  - **Deduplication:** State-transition alerts (`UP -> DOWN` and `DOWN -> UP`) to prevent notification storms

---

### 3. Monitoring Protocols

1. **HTTP / HTTPS:**
   - Evaluates target endpoints using native fetch requests with configurable timeouts (10 seconds).
   - Validates `2xx` HTTP status codes and tracks network response latency in milliseconds.

2. **Keyword Assertion (`KEYWORD`):**
   - Retrieves response body and asserts the presence of designated substrings or error tokens.

3. **SSL / TLS Certificate Monitoring (`SSL`):**
   - Connects to hostname over TLS (port 443) and inspects certificate validity dates.
   - Raises alert thresholds when certificates expire in under 7 days.

4. **Raw TCP Socket Check (`TCP`):**
   - Opens direct network sockets to target IP/host on specified port (e.g. 5432, 6379, 3306).
   - Verifies raw reachability without application-layer overhead.

5. **Reverse Cron Heartbeat (`HEARTBEAT`):**
   - Issues a unique webhook ping endpoint for external jobs and scheduled cron tasks.
   - If no ping request is received within the configured interval plus grace window, an outage incident is triggered automatically.

---

### 4. Zero False-Positive Engine (3-Retry Policy)
When an initial probe returns an unexpected failure:
1. The background worker immediately pauses execution for 5 seconds.
2. It retries the probe up to 3 consecutive times.
3. Only if all 3 consecutive attempts fail is the monitor marked `DOWN` and an incident created.

---

### 5. Data Models

- **User:** `email`, `passwordHash`, `companyName`, `createdAt`, `updatedAt`
- **Monitor:** `userId`, `name`, `type`, `target`, `port`, `keyword`, `interval`, `status`, `isPublic`, `lastPingAt`
- **PingLog:** `monitorId`, `status`, `responseTimeMs`, `errorDetails`, `createdAt` (with 90-day TTL index)
- **Incident:** `monitorId`, `startedAt`, `resolvedAt`, `cause`, `createdAt`
