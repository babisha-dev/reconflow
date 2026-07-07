# Smart Reconciliation & Audit System

## Exact Project Structure
```
SmartRecon/                          ← ROOT (open this in VS Code / IntelliJ)
├── backend/                         ← Spring Boot project
│   ├── pom.xml                      ← Maven dependencies
│   └── src/main/
│       ├── java/com/reconciliation/
│       │   ├── SmartReconciliationApplication.java
│       │   ├── config/              ← Security, Async, OpenAPI, DataInit
│       │   ├── controller/          ← REST endpoints (Auth, Upload, Recon, Audit)
│       │   ├── dto/                 ← Request / Response objects
│       │   ├── enums/               ← Role, MatchStatus, UploadStatus
│       │   ├── model/               ← JPA entities (5 tables)
│       │   ├── repository/          ← Spring Data JPA interfaces
│       │   ├── security/            ← JWT filter + UserDetailsService
│       │   └── service/             ← Business logic (File, Reconciliation, Audit)
│       └── resources/
│           └── application.properties
│
├── frontend/                        ← React project
│   ├── package.json
│   ├── public/index.html
│   └── src/
│       ├── App.js                   ← Routes + auth guards
│       ├── index.js
│       ├── context/AuthContext.js   ← Global auth state
│       ├── services/api.js          ← All Axios API calls
│       └── components/
│           ├── Auth/Login.js
│           ├── Layout/Layout.js     ← Sidebar + header shell
│           ├── Dashboard/Dashboard.js
│           ├── Upload/FileUpload.js
│           ├── Reconciliation/ReconciliationView.js
│           └── Audit/AuditTimeline.js
│
├── database/schema.sql              ← Run this FIRST in phpMyAdmin
├── samples/
│   ├── sample_transactions.csv      ← 10 rows (covers all 4 match types)
│   └── sample_transactions_large.csv ← 500 rows for load testing
└── README.md                        ← This file

## Why This Structure?
- backend/ and frontend/ are completely separate projects
- No nesting of one inside the other
- database/ and samples/ sit at the root level for easy access
- No shell scripts, no duplicate folders

## Setup (3 steps)

### Step 1 — Database
1. Start XAMPP → ensure MySQL is running on port 3306
2. Open http://localhost/phpmyadmin
3. Click the SQL tab and paste the contents of database/schema.sql → Go
   (This creates the database, all 5 tables with indexes, and 10 seed records)

### Step 2 — Backend
```bash
cd SmartRecon/backend
mvn spring-boot:run
```
→ Starts at http://localhost:8080
→ Swagger UI: http://localhost:8080/swagger-ui.html
→ Auto-creates any missing tables (ddl-auto=update)
→ Seeds 3 default users on startup

### Step 3 — Frontend
```bash
cd SmartRecon/frontend
npm install
npm start
```
→ Starts at http://localhost:3000
→ API calls proxy to http://localhost:8080 automatically

## Login Credentials
| User     | Password    | Role    | What they can do          |
|----------|-------------|---------|---------------------------|
| admin    | admin123    | ADMIN   | Everything                |
| analyst1 | analyst123  | ANALYST | Upload + reconcile + view |
| viewer1  | viewer123   | VIEWER  | View only                 |

## Quick Test Flow
1. Login as admin
2. Go to File Upload → drag samples/sample_transactions.csv
3. Column mapping auto-detects → click Submit
4. Watch status bar fill up (polls every 2s)
5. Go to Reconciliation → select the completed job
6. See MATCHED / PARTIAL / NOT_MATCHED / DUPLICATE results
7. Click any row → expand to see system vs uploaded comparison
8. Click Correct on an unmatched row → add a note
9. Go to Audit Trail → see every action in visual timeline

## API Endpoints
| Method | Endpoint                            | Auth     |
|--------|-------------------------------------|----------|
| POST   | /api/auth/login                     | None     |
| POST   | /api/upload/preview                 | ANALYST+ |
| POST   | /api/upload/submit                  | ANALYST+ |
| GET    | /api/upload/jobs                    | Any      |
| GET    | /api/upload/jobs/{id}               | Any      |
| GET    | /api/reconciliation/dashboard       | Any      |
| GET    | /api/reconciliation/results/{jobId} | Any      |
| PUT    | /api/reconciliation/correct/{id}    | ANALYST+ |
| GET    | /api/audit                          | Any      |

Full interactive docs: http://localhost:8080/swagger-ui.html

## Reconciliation Rules
1. MATCHED          — Transaction ID + exact amount match
2. PARTIALLY_MATCHED — Reference Number match + amount within ±2%
3. DUPLICATE         — Same Transaction ID appears more than once
4. NOT_MATCHED       — No system record found

Variance % is configurable in application.properties:
  reconciliation.amount-variance-percentage=2.0
