# PulseGuard — Verification and Operational Testing Runbook

This document outlines the step-by-step procedures for verifying, testing, and demonstrating all core subsystems of the PulseGuard uptime monitoring platform.

---

## 1. Environment Checklist

Before running tests, ensure the following services and ports are available on your workstation:

| Service | Port | Process / Container |
|---|---|---|
| MongoDB 6.0 | `27017` | Container: `pulseguard_mongo` |
| Redis 7.0 | `6379` | Container: `pulseguard_redis` |
| Express API | `5000` | Node.js process: `api/src/server.js` |
| Monitoring Worker | N/A | Node.js process: `api/src/worker.js` |
| Vite Dev Server | `5173` | Node.js process: `client` |

---

## 2. Startup Sequence

Open three terminal windows.

### Terminal 1: Infrastructure and API Server

```bash
# Start Docker containers from project root
docker compose up -d

# Verify containers are healthy
docker compose ps

# Start the API server
cd api
npm run dev
```

Expected log output:
```
[DB] MongoDB Connected: localhost
[Server] Running in development mode on port 5000
```

### Terminal 2: Monitoring Worker

```bash
cd api
npm run worker
```

Expected log output:
```
[DB] MongoDB Connected: localhost
[Worker] Starting BullMQ Worker...
```

### Terminal 3: Frontend Client

```bash
cd client
npm run dev
```

Expected output:
```
  VITE v8.3.x  ready in ... ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 3. Test Phase 1: Authentication and Session State

### Objective
Verify user registration, JWT generation, secure token storage, and session persistence across page refreshes.

### Test Steps (Browser)
1. Navigate to `http://localhost:5173/`.
2. Click **Sign In** in the top navigation.
3. Switch to the **Register** tab:
   - Email: `operator@example.com`
   - Password: `Password123!`
   - Company Name: `Acme Telemetry`
4. Submit the form.
5. Verify redirection to `http://localhost:5173/dashboard`.
6. Confirm the company name and email appear in the top-right profile badge.
7. Refresh the browser page (`F5`). Verify the session remains active without prompting for credentials.

### Alternative: One-Click Demo Mode
On the landing page, click **Live Demo**. The application automatically creates or logs into the demonstration account (`demo@pulseguard.io`) and opens the dashboard immediately.

### API Verification (cURL)
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test_admin@example.com","password":"Password123!","companyName":"Demo Org"}'
```

---

## 4. Test Phase 2: Monitor Configuration (CRUD)

### Objective
Verify that all 5 monitoring protocols can be created, edited, paused, and deleted, and that BullMQ repeatable job schedulers synchronize correctly.

### Test Steps (Dashboard UI)
1. In the dashboard, click **+ Add New Monitor**.
2. Create each of the following test monitors:

#### Case A: HTTP/HTTPS Check
- **Name**: `Public DNS Health`
- **Protocol**: `HTTP / HTTPS`
- **Target URL**: `https://1.1.1.1`
- **Interval**: `1 minute`
- **Public Status Page**: Enabled

#### Case B: Keyword Assertion
- **Name**: `Google Search Assertion`
- **Protocol**: `Keyword Match`
- **Target URL**: `https://www.google.com`
- **Assertion String**: `Google`
- **Interval**: `1 minute`
- **Public Status Page**: Enabled

#### Case C: TLS / SSL Certificate Inspector
- **Name**: `GitHub SSL Validity`
- **Protocol**: `SSL Expiration`
- **Hostname / URL**: `https://github.com`
- **Interval**: `3 minutes`

#### Case D: Raw TCP Socket Probe
- **Name**: `Local Redis Socket`
- **Protocol**: `TCP Port Check`
- **Host / IP**: `127.0.0.1`
- **Port**: `6379`
- **Interval**: `1 minute`

#### Case E: Reverse Cron Heartbeat
- **Name**: `Database Backup Cron`
- **Protocol**: `Heartbeat (Cron)`
- **Expected Frequency**: `3 minutes`
- **Public Status Page**: Enabled

3. **Verify State**: Confirm all monitors appear in the dashboard table with `UP` status badges.
4. **Pause / Resume**: Click the **Pause** icon on any monitor. Verify the status updates to `PAUSED`. Click **Resume**; verify it transitions back to `UP` and BullMQ reschedules the job.
5. **Deletion**: Click the **Trash** icon to remove a test monitor. Confirm it is deleted from both the UI table and the backend database.

---

## 5. Test Phase 3: Distributed Worker and 3-Retry Verification

### Objective
Confirm that transient network errors trigger the 3-stage retry mechanism with 5-second backoff to prevent false-positive incident alerts.

### Test Steps
1. Create a monitor targeting an unreachable endpoint:
   - **Name**: `Simulated Network Failure`
   - **Protocol**: `HTTP / HTTPS`
   - **Target URL**: `https://unreachable-domain-test-9999.invalid`
   - **Interval**: `1 minute`
2. Monitor Terminal 2 (Worker process).
3. Observe the worker retry sequence:
   - Initial failure detected.
   - 5-second backoff delay.
   - Retry 1 executed.
   - 5-second backoff delay.
   - Retry 2 executed.
   - Final failure confirmed after 3 consecutive failed attempts.
4. Verify the incident lifecycle:
   - The monitor status in the dashboard changes to `DOWN` (red badge).
   - An incident record is written to the database with root cause details.
   - Terminal 2 displays an alert dispatch log:
     ```
     [Email] Outage alert dispatched to operator@example.com for "Simulated Network Failure"
     [Email] Instant Web Inbox Preview: https://ethereal.email/message/...
     ```
5. Click the Ethereal preview link to inspect the formatted HTML outage email.

---

## 6. Test Phase 4: Reverse Cron Heartbeat Webhook

### Objective
Verify that background jobs can signal health by pinging their dedicated webhook endpoint, and that missed heartbeats trigger alerts.

### Test Steps
1. Locate the `Database Backup Cron` monitor created in Test Phase 2.
2. Expand the monitor row by clicking on it.
3. In the expanded drawer, locate the **Heartbeat Cron Trigger Command** section.
4. Click the **Copy** icon next to the cURL or PowerShell command:
   ```bash
   curl -X POST http://localhost:5000/api/v1/monitors/<MONITOR_ID>/ping
   ```
5. Alternatively, click the in-app button **Test Ping**.
6. Observe:
   - A success notification confirms the ping receipt.
   - The timestamp updates immediately to `just now`.
   - The status remains `OPERATIONAL` (green badge).
   - A `PingLog` entry is written with `1ms` response time.

---

## 7. Test Phase 5: Telemetry Aggregation and Charts

### Objective
Validate MongoDB aggregation pipelines for 24-hour response latency and 30-day availability calculations.

### Test Steps
1. Click on any active monitor row in the dashboard to expand its telemetry view.
2. Verify the following metrics load in the drawer:
   - **30-Day Availability**: Displayed as a percentage (e.g., `100%` or `99.98%`).
   - **24-Hour Average Latency**: Calculated from historical ping logs (e.g., `42 ms`).
   - **Latency Area Chart (Recharts)**: Renders a smooth blue gradient curve plotting latency over time.
   - **Inspection Audit Table**: Displays the 25 most recent execution logs with exact UTC timestamps, status codes, and execution details.

---

## 8. Test Phase 6: Public Status Page Integrity

### Objective
Verify that public monitors and historical availability data render correctly on the standalone status page without requiring authentication.

### Test Steps
1. In the dashboard header, click **Public Status Page**, or open a new browser window (or Incognito tab) and navigate to:
   ```
   http://localhost:5173/status/Acme%20Telemetry
   ```
   *(Replace with your configured company name or user ID).*
2. Verify:
   - The page loads without requiring login.
   - The global system status indicator shows **All Systems Operational**.
   - Only monitors with `isPublic: true` are displayed.
   - Each public monitor renders a row of **90 daily status bars**:
     - Green bars: 100% daily availability.
     - Yellow bars: 90% - 99% availability.
     - Red bars: Below 90% availability or total outage.
   - Hovering over any bar displays a tooltip showing the date and exact percentage.
   - The page automatically refreshes data every 30 seconds.

---

## 9. Command Reference (cURL)

Execute these commands from any terminal to test the API directly:

### 1. API Health Check
```bash
curl http://localhost:5000/
# Expected: {"message":"PulseGuard API is running..."}
```

### 2. User Registration
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"qa@example.com","password":"Password123!","companyName":"QA Labs"}'
```

### 3. User Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"qa@example.com","password":"Password123!"}'
```

### 4. Create Monitor (Requires Token)
```bash
curl -X POST http://localhost:5000/api/v1/monitors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"name":"Google Health","type":"HTTP","target":"https://google.com","interval":1,"isPublic":true}'
```

### 5. Send Heartbeat Ping
```bash
curl -X POST http://localhost:5000/api/v1/monitors/<MONITOR_ID>/ping
```

### 6. Query Public Status
```bash
curl http://localhost:5000/api/v1/status/QA%20Labs
```

---

## 10. Automated Test Suite Execution

Run the internal unit and security test suite:

```bash
cd api
npm test
```

Expected output:
```
# tests 15
# suites 0
# pass 15
# fail 0
# duration_ms 200ms
```

To test email delivery formatting in development:
```bash
cd api
npm run test:email
```
