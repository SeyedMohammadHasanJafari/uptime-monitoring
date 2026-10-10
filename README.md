# PulseGuard

PulseGuard is a distributed uptime monitoring and public status page platform designed for high-availability web services. It provides multi-protocol health checks, background job processing with queue retries to eliminate false-positive alerts, time-series telemetry storage, and customizable public status pages with 90-day availability history.

---

## Architecture

The system consists of three decoupled components running alongside Redis and MongoDB:

```
+-------------------------------------------------------------------------+
|                        Client Layer (React 19 / Vite)                   |
|  - Real-time Mission Control (NOC) Dashboard                            |
|  - 24-Hour Latency Area Charts (Recharts)                               |
|  - Public Status Pages (/status/:companyName) with 90-day history bars   |
+------------------------------------+------------------------------------+
                                     |
                                     | HTTP REST (/api/v1)
                                     v
+-------------------------------------------------------------------------+
|                         API Server (Express 5 / Node.js)                |
|  - JWT Authentication & Session Management                              |
|  - Monitor Management (CRUD & State Toggles)                            |
|  - Aggregation Analytics (24h average latency, 30d availability)        |
|  - Public Heartbeat Webhook Ingestion                                   |
+-------------------+---------------------------------+-------------------+
                    |                                 |
       Enqueues     |                                 | Persists
       Schedules    v                                 v
+-----------------------+                 +-------------------------------+
|  Redis 7 / BullMQ 6   |                 |       MongoDB 6 (Mongoose)    |
|  - Atomic Schedulers  |                 |  - Users                      |
|  - Job Concurrency    |                 |  - Monitors                   |
+-----------+-----------+                 |  - PingLogs (90-day TTL)      |
            |                             |  - Incidents                  |
  Pulls     |                             +---------------+---------------+
  Jobs      v                                             ^
+------------------------------------+                    |
|       Background Worker Engine     +--------------------+
|  - HTTP / HTTPS Probe              |  Writes Telemetry & Incidents
|  - Keyword Assertion               |
|  - TLS / SSL Certificate Inspector |
|  - TCP Socket Connection Probe     |
|  - Reverse Cron Heartbeat Checker  |
|  - 3-Stage Retry Verification      |
+-------------------+----------------+
                    |
                    | Outage / Recovery Events
                    v
+------------------------------------+
|         Alerting Dispatcher        |
|  - SMTP (Production)               |
|  - Ethereal Sandbox (Development)  |
+------------------------------------+
```

### Component Roles

1. **API Server (`api/src/server.js`)**: Stateless Express application providing authentication, monitor configuration endpoints, telemetry queries, and public heartbeat webhook ingestion.
2. **Worker Engine (`api/src/worker.js`)**: Standalone daemon running a BullMQ consumer pool with configurable concurrency. Pulls scheduled health check jobs from Redis, executes network probes, logs time-series data, and triggers alerts on state transitions.
3. **Frontend Client (`client/src`)**: Single-page application built with React 19, Tailwind CSS, and Vite. Implements the operator dashboard, monitor configuration modal, telemetry chart viewer, and public status pages.
4. **Data Stores**:
   - **MongoDB**: Primary document store. Utilizes a TTL index (`7,776,000` seconds) on the `PingLog` collection to automatically prune metrics older than 90 days.
   - **Redis**: In-memory store backing BullMQ repeatable job schedulers (`upsertJobScheduler`) and execution queues.

---

## Features

### Multi-Protocol Health Probing

- **HTTP / HTTPS**: Sends requests using native `fetch` with an `AbortSignal` timeout of 10 seconds. Evaluates response status (`2xx`) and records response time in milliseconds.
- **Keyword Match**: Fetches page content and asserts the presence of a target string. Marks the service down if the string is missing or if the server returns a non-2xx status code.
- **SSL / TLS Certificate Monitoring**: Connects via TLS to port 443, retrieves the peer certificate, and calculates days remaining until expiration. Triggers an alert if validity is under 7 days.
- **Raw TCP Port Check**: Establishes a raw network socket (`net.Socket`) to a target host and port (e.g., PostgreSQL `5432`, Redis `6379`, MySQL `3306`).
- **Reverse Cron Heartbeat**: Allocates a unique ping endpoint (`/api/v1/monitors/:id/ping`) for background scripts, backup routines, or scheduled tasks. If a ping is not received within the expected interval plus grace window (`2 * interval`), an outage incident is automatically created.

### Zero False-Positive Engine (3-Retry Verification)

When an initial probe returns an unexpected failure (e.g. network timeout, 5xx status, connection refused):
1. The worker delays execution for 5 seconds.
2. The probe is retried up to 3 consecutive times.
3. Only if all 3 attempts fail is the monitor marked `DOWN`.
4. State transitions from `UP` to `DOWN` create an `Incident` record and dispatch an outage email.
5. When the monitor recovers, the incident is closed with calculated downtime duration and a recovery notification is sent.

---

## Tech Stack

| Component | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | Node.js (ES Modules) | `>= 18.0.0` | Server & worker execution environment |
| Backend Framework | Express | `5.2.x` | REST API layer |
| Database | MongoDB / Mongoose | `9.11.x` | Primary document & time-series storage |
| Message Queue | BullMQ | `6.3.x` | Distributed job scheduling & concurrency |
| In-Memory Cache | Redis / ioredis | `6.0.x` | Queue persistence backend |
| Security | Helmet, CORS, bcrypt, jsonwebtoken | Latest | HTTP security headers, password hashing, JWT |
| Frontend | React | `19.3.x` | UI component layer |
| Bundler | Vite | `8.3.x` | Build tool and development server |
| Styling | Tailwind CSS | `4.3.x` | Utility-first responsive styling |
| Visualization | Recharts | `3.10.x` | Telemetry latency charts |
| Testing | Node Test Runner (`node:test`, `node:assert`) | Built-in | Unit, security, and middleware tests |

---

## Project Structure

```
.
├── docker-compose.yml          # Container configuration for MongoDB 6 and Redis 7
├── README.md                   # System architecture and deployment guide
├── SPECIFICATION.md            # Technical specifications and data schemas
├── RUN_AND_TEST_GUIDE.md       # Operational verification and manual testing runbook
├── api/
│   ├── src/
│   │   ├── config/             # Database connection logic (db.js)
│   │   ├── controllers/        # Request controllers (auth, monitor, analytics, status)
│   │   ├── middlewares/        # JWT auth protection and centralized error handling
│   │   ├── models/             # Mongoose schemas (User, Monitor, PingLog, Incident)
│   │   ├── queues/             # BullMQ queue schedulers (monitor.queue.js)
│   │   ├── routes/             # Express route definitions
│   │   ├── scripts/            # Diagnostic utility scripts (test-email.js)
│   │   ├── services/           # Probe engines (check.service.js) and email dispatch (email.service.js)
│   │   ├── workers/            # BullMQ worker consumers (monitor.worker.js)
│   │   ├── server.js           # API server entry point
│   │   └── worker.js           # Worker daemon entry point
│   ├── test/                   # Automated tests (check, security, error handling)
│   ├── .env.example            # Backend environment template
│   └── package.json
└── client/
    ├── src/
    │   ├── assets/             # Static graphics
    │   ├── components/         # Reusable UI components (modals, charts, uptime bars)
    │   ├── context/            # AuthContext provider and session state
    │   ├── pages/              # LandingPage, Dashboard, StatusPage
    │   ├── services/           # Axios HTTP client configuration
    │   ├── App.jsx             # Router and route protection
    │   ├── main.jsx            # React root mount
    │   └── index.css           # Global theme variables and Tailwind directives
    ├── public/                 # Static assets (favicon, icons)
    ├── jsconfig.json           # Module resolution configuration
    ├── vite.config.js          # Vite build and plugin configuration
    ├── .env.example            # Client environment template
    └── package.json
```

---

## Quickstart

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Docker and Docker Compose

### 1. Start Infrastructure Services

From the project root:

```bash
docker compose up -d
```

Verifies that the MongoDB container (`pulseguard_mongo` on port `27017`) and Redis container (`pulseguard_redis` on port `6379`) are running:

```bash
docker compose ps
```

### 2. Configure and Start the API Server

In a new terminal window:

```bash
cd api
cp .env.example .env
npm install
npm run dev
```

The API starts at `http://localhost:5000`.

### 3. Start the Monitoring Worker

In a separate terminal window:

```bash
cd api
npm run worker
```

The worker connects to Redis and begins listening for scheduled monitoring jobs.

### 4. Configure and Start the Client

In a third terminal window:

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Configuration Reference

### Backend Configuration (`api/.env`)

| Variable | Type | Default | Description |
|---|---|---|---|
| `PORT` | Number | `5000` | Port on which the Express API server listens |
| `NODE_ENV` | String | `development` | Runtime environment (`development`, `production`, `test`) |
| `MONGO_URI` | String | `mongodb://admin:securepassword@localhost:27017/pulseguard?authSource=admin` | MongoDB connection string |
| `REDIS_URI` | String | `redis://localhost:6379` | Redis connection string for BullMQ |
| `JWT_SECRET` | String | `super_secret_jwt_key_change_in_production` | Secret key used for signing JSON Web Tokens |
| `JWT_EXPIRES_IN` | String | `7d` | Token expiration duration |
| `CLIENT_URL` | String | `http://localhost:5173` | Frontend origin used in alert emails and CORS |
| `SMTP_HOST` | String | *(Optional)* | SMTP server hostname. If omitted, Ethereal sandbox is used |
| `SMTP_PORT` | Number | `587` | SMTP server port |
| `SMTP_USER` | String | *(Optional)* | SMTP authentication username |
| `SMTP_PASS` | String | *(Optional)* | SMTP authentication password |

### Frontend Configuration (`client/.env`)

| Variable | Type | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | String | `http://localhost:5000/api/v1` | Base URL for backend API requests |

---

## API Reference

All protected endpoints require a valid Bearer token in the request header:
`Authorization: Bearer <TOKEN>`

### Authentication

#### Register Account
`POST /api/v1/auth/register`

Request Body:
```json
{
  "email": "admin@example.com",
  "password": "Password123!",
  "companyName": "Acme Corp"
}
```

Response (`201 Created`):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6704fa1c2b...",
    "email": "admin@example.com",
    "companyName": "Acme Corp"
  }
}
```

#### Authenticate
`POST /api/v1/auth/login`

Request Body:
```json
{
  "email": "admin@example.com",
  "password": "Password123!"
}
```

Response (`200 OK`):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6704fa1c2b...",
    "email": "admin@example.com",
    "companyName": "Acme Corp"
  }
}
```

#### Current User
`GET /api/v1/auth/me` (Protected)

Response (`200 OK`):
```json
{
  "success": true,
  "user": {
    "_id": "6704fa1c2b...",
    "email": "admin@example.com",
    "companyName": "Acme Corp"
  }
}
```

---

### Monitor Management

#### List Monitors
`GET /api/v1/monitors` (Protected)

Response (`200 OK`):
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "6704fb3a1e...",
      "name": "Production Gateway",
      "type": "HTTP",
      "target": "https://api.example.com/health",
      "interval": 1,
      "status": "UP",
      "isPublic": true,
      "createdAt": "2026-10-09T12:00:00.000Z"
    }
  ]
}
```

#### Create Monitor
`POST /api/v1/monitors` (Protected)

Request Body:
```json
{
  "name": "Main Database Port",
  "type": "TCP",
  "target": "db.example.com",
  "port": 5432,
  "interval": 3,
  "isPublic": false
}
```

Supported `type` values: `HTTP`, `KEYWORD`, `SSL`, `TCP`, `HEARTBEAT`.

Response (`201 Created`):
```json
{
  "success": true,
  "data": {
    "_id": "6704fc921a...",
    "name": "Main Database Port",
    "type": "TCP",
    "target": "db.example.com",
    "port": 5432,
    "interval": 3,
    "status": "UP",
    "isPublic": false
  }
}
```

#### Update Monitor
`PUT /api/v1/monitors/:id` (Protected)

Request Body:
```json
{
  "name": "Updated Gateway",
  "interval": 5
}
```

Response (`200 OK`): Returns updated monitor object.

#### Delete Monitor
`DELETE /api/v1/monitors/:id` (Protected)

Removes the monitor document from MongoDB and removes the job scheduler from BullMQ.

Response (`200 OK`):
```json
{
  "success": true,
  "data": {}
}
```

#### Pause / Resume Monitor
`PATCH /api/v1/monitors/:id/toggle-status` (Protected)

Toggles status between `PAUSED` and `UP`. Removes or reinstates the scheduler in BullMQ accordingly.

Response (`200 OK`): Returns updated monitor with modified status.

#### Send Heartbeat Ping
`GET /api/v1/monitors/:id/ping` or `POST /api/v1/monitors/:id/ping` (Public)

Updates `lastPingAt` to the current timestamp. If the monitor was previously in a `DOWN` state, closes any open incident and dispatches a recovery email.

Response (`200 OK`):
```json
{
  "success": true,
  "message": "Heartbeat ping received for Backup Cron",
  "timestamp": "2026-10-09T14:30:00.000Z",
  "status": "UP"
}
```

---

### Telemetry & Status

#### Monitor Analytics
`GET /api/v1/analytics/:monitorId` (Protected)

Returns 24-hour latency data points for chart rendering, 30-day uptime percentage, and the 25 most recent execution logs.

Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "uptimePercentage": 99.98,
    "avgResponseTime24h": 42,
    "chartData": [
      {
        "time": "14:00",
        "responseTime": 38,
        "fullDate": "2026-10-09T14:00:00.000Z"
      }
    ],
    "logs": [
      {
        "id": "6705a2b...",
        "status": "UP",
        "responseTime": 39,
        "details": "HTTP 200 OK",
        "timestamp": "2026-10-09T14:05:00.000Z"
      }
    ]
  }
}
```

#### Public Status Page
`GET /api/v1/status/:companyName` (Public)

Retrieves all public monitors for the specified user ID or company name, including aggregated 90-day daily uptime percentages.

Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "companyName": "Acme Corp",
    "globalStatus": "All Systems Operational",
    "monitors": [
      {
        "_id": "6704fb3a1e...",
        "name": "API Service",
        "type": "HTTP",
        "status": "UP",
        "uptime90Days": 100,
        "history": [
          { "date": "2026-07-12", "uptime": 100 },
          { "date": "2026-10-09", "uptime": 100 }
        ]
      }
    ]
  }
}
```

---

## Testing

### Automated Test Suite

Unit, security, and middleware tests run using Node.js's built-in test runner:

```bash
cd api
npm test
```

Test coverage:
- **`test/check.service.test.js`**: Validates heartbeat grace period calculations, missed check windows, and unknown type handling.
- **`test/security.test.js`**: Validates regular expression escaping to protect the status endpoint from ReDoS and wildcard injection.
- **`test/error.middleware.test.js`**: Validates status codes and response bodies for Mongoose `ValidationError` (400), `CastError` (400), Duplicate Key `11000` (409), and JWT errors (401).

### Email Alert Testing

To verify local SMTP or Ethereal sandbox email formatting:

```bash
cd api
npm run test:email
```

Prints the simulated incident dispatch result and web preview URL to the console.

---

## Production Readiness Checklist

1. **Environment Variables**:
   - Replace `JWT_SECRET` with a cryptographically random 32-character string.
   - Configure authoritative `SMTP_*` credentials (e.g. Amazon SES, Postmark, SendGrid).
   - Set `CLIENT_URL` to your production domain to ensure alert links navigate correctly.
2. **Process Management**:
   - Run the API server and worker daemon as separate systemd units, PM2 processes, or container tasks.
   - Example PM2 ecosystem:
     ```bash
     pm2 start src/server.js --name "pulseguard-api"
     pm2 start src/worker.js --name "pulseguard-worker"
     ```
3. **Reverse Proxy & TLS**:
   - Terminate SSL at NGINX, Cloudflare, or an AWS Application Load Balancer.
   - Ensure the `X-Forwarded-For` header is properly forwarded for accurate rate limiting.
4. **Database Retention**:
   - The `PingLog` collection uses a MongoDB TTL index on `createdAt` expiring at 90 days (`7,776,000` seconds). Ensure background index builds are permitted on your MongoDB instance.

---

## License

All rights reserved.
