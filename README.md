<div align="center">

#  ReconFlow
### Smart Reconciliation & Audit System

Automatically reconcile financial transactions, detect mismatches, and generate audit-ready reports.

🌐 **Live Demo:** https://reconflow-frontend.onrender.com/

</div>

---

#  Overview

ReconFlow is a full-stack financial reconciliation platform that automates the process of comparing transactions from multiple systems.

Instead of manually checking thousands of records, the system automatically:

-  Matches transactions
-  Detects mismatches
-  Identifies missing records
-  Generates reconciliation summaries
-  Produces audit-ready information

The project follows a modern enterprise architecture using React, Spring Boot, PostgreSQL, and JWT Authentication.

---

#  Features

### Authentication

- JWT Authentication
- Secure Login
- Role Based Authorization
- Protected APIs

---

### Transaction Management

- Upload transaction records
- Store records securely
- View transaction history
- Filter transactions

---

### Smart Reconciliation

Automatically detects

- Exact Matches
- Amount Mismatches
- Missing Records
- Duplicate Records
- Status Differences

---

### Dashboard

- Total Transactions
- Matched Records
- Unmatched Records
- Pending Records
- Reconciliation Statistics

---

### Audit Support

- Complete reconciliation history
- Audit trail
- Result tracking
- Detailed reconciliation reports

---
##  Tech Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | React.js, Axios, React Context API |
| **Backend** | Java 21, Spring Boot, Spring MVC, Spring Security, Spring Data JPA, Hibernate |
| **Database** | PostgreSQL |
| **Authentication** | JWT, BCrypt, Spring Security |
| **API** | RESTful APIs, JSON |
| **Build Tool** | Maven |
| **Version Control** | Git, GitHub |
| **Deployment** | Render |
| **IDE & Tools** | IntelliJ IDEA, Postman |
| **Architecture** | Layered Architecture, MVC, Client–Server, REST |

---

#  Architecture

```

React Frontend
│
▼
REST APIs
│
▼
Spring Boot Backend
│
├── Security (JWT)
├── Controllers
├── Services
├── Repository Layer
│
▼
PostgreSQL Database
```
---

# Project Structure
```
smart-reconciliation/
│
├── backend/
│   ├── src/main/java/com/reconciliation
│   │   ├── config/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── enums/
│   │   ├── model/
│   │   ├── repository/
│   │   ├── security/
│   │   ├── service/
│   │   └── SmartReconciliationApplication.java
│   │
│   └── src/main/resources
│       └── application.properties
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   │
│   ├── package.json
│   └── package-lock.json
│
├── database/
│   └── schema.sql
│
├── docs/
│
└── README.md
```
---
# Screenshots

<img width="1361" height="616" alt="image" src="https://github.com/user-attachments/assets/8f0331f5-fc0a-4024-b8a6-c4dd31f6366d" />
<img width="1343" height="607" alt="image" src="https://github.com/user-attachments/assets/63684cf1-50e9-4b7b-9e3e-2ee90eff7cda" />
<img width="1298" height="625" alt="image" src="https://github.com/user-attachments/assets/4e8ec562-e17b-4493-a14f-a1eadd345625" />
<img width="1365" height="614" alt="image" src="https://github.com/user-attachments/assets/2206c39c-b546-46e6-b5a0-ee023838a149" />
<img width="1366" height="614" alt="image" src="https://github.com/user-attachments/assets/210d4b2c-bf5c-4a8a-9dbb-29aa7ea854a9" />
<img width="1358" height="612" alt="image" src="https://github.com/user-attachments/assets/6ac62079-5a16-4370-b784-1e60426a4120" />

---

## ⭐ Support

If you found this project useful, please consider supporting it by:

-  **Starring** the repository
-  **Forking** the project
-  **Contributing** with improvements, bug fixes, or new features
-  **Reporting** bugs or suggesting enhancements by opening an Issue
-  **Sharing** the project with others

Your support helps improve ReconFlow and motivates further development. Thank you!





