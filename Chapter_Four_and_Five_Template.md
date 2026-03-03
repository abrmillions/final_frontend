# Chapter Four: Implementation and Testing

## 4.1 Introduction

- Purpose: Describe implementation, testing, and evaluation against Phase‑1 design.
- Design recap: Summarize core modules, data flows, and key decisions.
- Technology stack: List tools/frameworks with brief rationale.
  - Example: Next.js (frontend), Django REST (backend), PostgreSQL (DB), Jest/RTL (FE tests), PyTest (BE tests), Postman (API), Locust/JMeter (performance).

### Project‑Specific Summary

- Frontend: Next.js app with Vercel config ([vercel.json](file:///C:/Users/pc/Downloads/finalyear/Digital_licensing/vercel.json)); env `NEXT_PUBLIC_DJANGO_API_URL` currently `https://backend-te21.onrender.com`.
- Backend: Django REST API ([backend_project/settings.py](file:///C:/Users/pc/Downloads/finalyear/backend/backend_project/settings.py)); DB engine defaults to SQLite unless env overrides; host preset to Render Postgres.
- API client: Centralized endpoints in [django-api.ts](file:///C:/Users/pc/Downloads/finalyear/Digital_licensing/lib/config/django-api.ts).
- Integration guide: See [DJANGO_INTEGRATION_GUIDE.md](file:///C:/Users/pc/Downloads/finalyear/Digital_licensing/DJANGO_INTEGRATION_GUIDE.md) for setup and endpoints.

### Design Recap

- Core modules:
  - Applications: applicant submits forms for Contractor/Professional/Import-Export licenses via dashboard pages like [applications/page.tsx](file:///C:/Users/pc/Downloads/finalyear/Digital_licensing/app/dashboard/applications/page.tsx) and specific apply pages.
  - Licenses: issuance, renewal, verification; backend serializers/views in [licenses/views.py](file:///C:/Users/pc/Downloads/finalyear/backend/licenses/views.py).
  - Admin: review and approval through Django Admin, linked from [admin/page.tsx](file:///C:/Users/pc/Downloads/finalyear/Digital_licensing/app/admin/page.tsx).
- Key endpoints (Django):
  - Applications: `/api/applications/`, actions: approve/reject/request_info`
  - Licenses: `/api/licenses/`, renew `/api/licenses/{id}/renew/`, verify `/api/licenses/verify/`
  - Documents: `/api/documents/upload/`
- Frontend utilities:
  - QR generation route: [app/api/licenses/qr/route.ts](file:///C:/Users/pc/Downloads/finalyear/Digital_licensing/app/api/licenses/qr/route.ts)
  - License listing and verification UI: [licenses/page.tsx](file:///C:/Users/pc/Downloads/finalyear/Digital_licensing/app/dashboard/licenses/page.tsx), [verify/page.tsx](file:///C:/Users/pc/Downloads/finalyear/Digital_licensing/app/verify/page.tsx)

### Data Flow (Textual)

- Applicant uses Next.js dashboard to submit a license application.
- Frontend sends POST to Django `/api/applications/` (see [django-api.ts](file:///C:/Users/pc/Downloads/finalyear/Digital_licensing/lib/config/django-api.ts)).
- Admin reviews application in Django Admin and approves; backend generates/associates a license.
- Frontend fetches license details and renders QR with a verification URL.
- Public users verify licenses via `/verify` page which calls Django `/api/licenses/verify/`.

## 4.2 Application Testing

- Test strategy: Levels (unit, integration, system), environments, data, coverage targets.
- Test plan: Objectives, entry/exit criteria, responsibilities, schedule.
- Environments: Local/CI/staging; versions of Node/Python/DB.
- Test data: Synthetic datasets, anonymized production samples (if allowed).

### Project‑Specific Testing Tools (current)

- Automated test frameworks are not configured in the repo (no Jest/PyTest entries found). Prefer manual E2E and API tests via Postman initially; add unit tests later as recommended in 5.2.

### 4.2.1 Unit Tests

- Scope: Individual functions/classes/components.
- Frameworks and tools: [e.g., Jest for React, PyTest for Django]
- Mocking/stubbing: [tools/methods]
- Coverage goals: [e.g., 80% statements, 70% branches]
- Artifacts:
  - Case list and coverage report.
  - Pass/fail summary and defect fixes.

#### Unit Test Case Template

| Field              | Entry |
| ------------------ | ----- |
| Name               |       |
| Module/Function    |       |
| Inputs             |       |
| Expected Output    |       |
| Setup/Mocks        |       |
| Result (Pass/Fail) |       |
| Notes/Defects      |       |

### 4.2.2 Integration Tests

- Scope: Module interfaces, API↔DB, frontend↔backend.
- Scenarios: Validate data flow, contracts, error propagation, idempotency.
- Artifacts: Interface tables/sequence diagrams, cases + results, defect tracking.

#### Integration Scenario Template

| Field                 | Entry |
| --------------------- | ----- |
| Interfaces            |       |
| Preconditions         |       |
| Steps                 |       |
| Expected Interactions |       |
| Logs/Evidence         |       |
| Result and Issues     |       |

### 4.2.3 System Tests

- Scope: End‑to‑end behavior vs requirements (functional and non‑functional).
- Methods: Use‑case flows, performance/load, security checks, usability.
- Artifacts: Requirement→test matrix, metrics (latency, throughput), pass/fail summary.

#### System Requirement Test Template

| Field                                | Entry |
| ------------------------------------ | ----- |
| Requirement ID                       |       |
| Scenario                             |       |
| Test Data                            |       |
| Expected Behavior                    |       |
| KPIs (e.g., p95 latency, throughput) |       |
| Outcome and Metrics                  |       |

#### Performance Test Summary (Example)

| Metric             | Target | Observed | Notes |
| ------------------ | ------ | -------- | ----- |
| p95 latency        |        |          |       |
| Throughput (req/s) |        |          |       |
| Error rate (%)     |        |          |       |

#### Requirements → Test Cases Matrix (Sample)

| Req ID | Requirement                                | Test Scenario                                                      | Expected Result                                          | Evidence                         |
| ------ | ------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------- | -------------------------------- |
| R1     | Applicants can submit license applications | Submit contractor form; POST `/api/applications/`                  | HTTP 201, application created with status=Pending        | Response body, DB record         |
| R2     | Admin can approve applications             | Admin triggers approve `/api/applications/{id}/approve/`           | Application status=Approved; license created with number | Admin action log, license record |
| R3     | Licenses can be renewed                    | POST `/api/licenses/{id}/renew/`                                   | Expiry date extended; status Active                      | License detail before/after      |
| R4     | Public license verification works          | GET `/api/licenses/verify/?license_number=...` from `/verify` page | Found=true with details; Not found shows error           | UI screenshot, API response      |
| R5     | Document uploads succeed                   | POST `/api/documents/upload/`                                      | HTTP 200; document listed in `/api/documents/`           | Upload response, list result     |
| R6     | Auth required for license CRUD             | Access `/api/licenses/` without token                              | HTTP 401 Unauthorized                                    | API response log                 |

#### Sample System Test Cases

- End-to-end issuance:
  - Login, submit application, admin approves, user sees issued license with QR on [applications/[id]/page.tsx](file:///C:/Users/pc/Downloads/finalyear/Digital_licensing/app/dashboard/applications/%5Bid%5D/page.tsx).
  - KPIs: p95 page render < 1s; verify response < 300ms.
- Renewal flow:
  - From [licenses/page.tsx](file:///C:/Users/pc/Downloads/finalyear/Digital_licensing/app/dashboard/licenses/page.tsx), invoke renew action (backend `/renew/`), confirm new expiry; license remains Active.
  - Edge: expired license renewal sets status Active.
- Verification (public):
  - Navigate to [verify/page.tsx](file:///C:/Users/pc/Downloads/finalyear/Digital_licensing/app/verify/page.tsx), enter license number or scan QR; expect success with holder and dates shown.
  - Negative: invalid number returns Not Found; show helpful guidance.

## 4.3 Hardware/Software Acquisitions

- Hardware: CPU, RAM, storage, network; local/cloud; quantity.
- Software: OS, runtimes, libraries, databases; versions and compatibility matrix.
- Procurement: Sources, costs, license terms, installation media, constraints.

#### Version and Compatibility Matrix

| Component            | Version | Depends On | Compatibility Notes |
| -------------------- | ------- | ---------- | ------------------- |
| OS                   |         |            |                     |
| Node.js              |         |            |                     |
| Python               |         |            |                     |
| Database             |         |            |                     |
| Frameworks/Libraries |         |            |                     |

## 4.4 User Manual Preparation

- Audience and prerequisites.
- Getting started: Overview, key concepts, system layout.
- Tasks/Features: Step‑by‑step instructions with numbered steps and screenshots.
- Configuration: Settings, defaults, advanced options.
- Troubleshooting: Common issues, error messages, remedies.
- Support: Contact channels, maintenance windows, version info.

#### Task Instruction Template

1. Objective: [what the user accomplishes]
2. Prerequisites: [accounts, data]
3. Steps:
   - Step 1:
   - Step 2:
   - Step 3:
4. Expected result:
5. Notes/Troubleshooting:

### User Manual: Issuance, Renewal, Verification

#### License Issuance (Applicant + Admin)

- Objective: Apply for and issue a new license with QR verification.
- Prerequisites: Registered user account; backend running; admin available.
- Steps (Applicant):
  - Sign in and go to Dashboard → Applications ([applications/page.tsx](file:///C:/Users/pc/Downloads/finalyear/Digital_licensing/app/dashboard/applications/page.tsx)).
  - Choose license type (Contractor/Professional/Import‑Export) and fill required fields.
  - Submit; note application ID and status Pending.
- Steps (Admin):
  - Open Django Admin via [admin/page.tsx](file:///C:/Users/pc/Downloads/finalyear/Digital_licensing/app/admin/page.tsx); review application details.
  - Approve the application; confirm license is created with number.
- Expected result: Applicant sees Approved status and can view license with QR and verification URL.
- Troubleshooting: If approval fails, check API URL env and CORS; verify backend logs.

#### License Renewal

- Objective: Extend license expiry.
- Prerequisites: Active or expired license exists.
- Steps:
  - Open Dashboard → Licenses ([licenses/page.tsx](file:///C:/Users/pc/Downloads/finalyear/Digital_licensing/app/dashboard/licenses/page.tsx)).
  - Select a license and trigger Renew (backend `/api/licenses/{id}/renew/`).
  - Confirm new expiry date and Active status.
- Expected result: Expiry updated; license remains valid for the new period.
- Troubleshooting: If renewal fails, ensure authentication and backend endpoint availability.

#### License Verification (Public)

- Objective: Verify authenticity of a license.
- Prerequisites: License number or QR code.
- Steps:
  - Navigate to Verification page ([verify/page.tsx](file:///C:/Users/pc/Downloads/finalyear/Digital_licensing/app/verify/page.tsx)).
  - Enter license number or use QR scanner to capture code.
  - Run verification; review returned details (holder, issue/expiry dates, status).
- Expected result: Valid licenses show Verified with details; invalid shows Not Found.
- Troubleshooting: Check network connectivity and correct license number format; try manual entry if QR fails.

## 4.5 Installation Process

- Prerequisites: Hardware/software, accounts, environment variables, network ports.
- Step‑by‑step installation: Download, install, configure, DB migrations/seed, verification.
- Rollback: Uninstall and backup/restore procedure.
- Post‑install checks: Health checks, logs, smoke checklist.

### Windows Setup Steps (validated)

1. Backend (PowerShell):
   - `python -m venv .venv`
   - `.\.venv\Scripts\Activate.ps1`
   - `pip install -r requirements.txt`
   - `cd backend`
   - `python manage.py migrate`
   - Optional: `python manage.py createsuperuser`
   - `python manage.py runserver 8000`
2. Frontend:
   - Create `.env.local` in `Digital_licensing`:
     - `NEXT_PUBLIC_DJANGO_API_URL=https://backend-te21.onrender.com` (or your local backend)
   - `npm install`
   - `npm run dev` (served at `http://localhost:3000`)
3. Post‑install checks:
   - Open `http://localhost:3000/admin` and verify Django Admin link works.
   - Call `/api/users/token/` and `/api/licenses/` via the UI or Postman.

#### Installation Checklist

- Verify prerequisites installed (Node.js, Python, DB).
- Configure environment variables.
- Run backend migrations and start services.
- Start frontend and run smoke tests.
- Check logs/health endpoints.

## 4.6 Start‑Up Strategy

- Deployment plan: Pilot → staged rollout → full; timeline and responsibilities.
- Training: Materials, sessions, competency assessment.
- Change management: Communication, onboarding, feedback loop.
- Risk mitigation: Known risks, contingencies, monitoring, incident response.
- Sustaining: Maintenance schedule, updates, escalation path.

### Project‑Specific Notes

- Admin operations via Django Admin: accessible from the frontend admin page ([app/admin/page.tsx](file:///C:/Users/pc/Downloads/finalyear/Digital_licensing/app/admin/page.tsx)).
- CORS and environment: Ensure `CORS_ALLOWED_ORIGINS` and `NEXT_PUBLIC_DJANGO_API_URL` are aligned for each environment.

---

# Chapter Five: Conclusions and Recommendation

## 5.1 Conclusions

- Objectives restated and how they were met.
- Key results: Implementation outcomes, test evidence, performance/security/usability highlights.
- Lessons learned: Design/implementation/testing insights and constraints.

## 5.2 Recommendations

- Short‑term improvements: Fixes, optimizations, documentation gaps.
- Medium/long‑term roadmap: New features, refactors, scalability, observability.
- Operational suggestions: Maintenance, monitoring, backup, SLAs, governance.

---

# References

- Use a consistent style (APA/IEEE/department).
- Include books, articles, standards, official docs, websites (with access dates).
- Ensure in‑text citations match the reference list.

#### Reference Entry Examples (adjust to your style)

- Book: Author, A. A. (Year). Title. Publisher.
- Article: Author, A. A. (Year). Title. Journal, volume(issue), pages.
- Web: Organization. (Year). Title. URL (Accessed: Date).

---

# Appendix

- Label consistently (Appendix 1/2/3 or A/B/C).
- List supplementary works and instruments.
- Provide brief context for each item.

## Appendix 1: Questionnaires / Interview Protocols

- Purpose and usage notes.
- Instrument items.

## Appendix 2: Sample Code

- Critical snippets not included in the main body.
- File references and brief descriptions.

## Appendix 3: Sample Dataset and Data Dictionary

- Dataset description and provenance.
- Attribute dictionary: names, types, ranges, missing‑value handling.

#### Attribute Dictionary Template

| Attribute | Type | Range/Domain | Missing Handling | Notes |
| --------- | ---- | ------------ | ---------------- | ----- |
|           |      |              |                  |       |

## Appendix 4: Additional Figures/Tables

- Performance plots, test matrices, extended logs.
- How to read/use each artifact.

## Appendix 5: Key API Endpoints (Summary)

- Auth: `POST /api/users/register/`, `POST /api/users/token/`, `POST /api/users/token/refresh/`
- Applications: `GET/POST /api/applications/`, `GET/PATCH /api/applications/{id}/`, actions: approve/reject/request_info
- Licenses: `GET/POST /api/licenses/`, `GET/PATCH /api/licenses/{id}/`, `POST /api/licenses/{id}/renew/`, `GET /api/licenses/verify/`
- Documents: `POST /api/documents/upload/`, `GET /api/documents/`, `DELETE /api/documents/{id}/`
- Partnerships: `POST /api/partnerships/`, `GET /api/partnerships/`, `GET /api/partnerships/{id}/`

---

# Quality Checklist

- Traceability: Requirements → design → implementation → tests → results.
- Evidence: Tables/figures for test cases, coverage, performance; reproducible steps.
- Consistency: Numbering, terminology, versions; align figures/tables with text references.
- Clarity: Concise explanations; diagrams where valuable.
- Reproducibility: Installation + User Manual enable independent setup and verification.

---

# Tailored Example (Digital Licensing System)

- Modules: User registration, license issuance, renewal, verification (QR), admin revocation.
- Data flow: Frontend (Next.js) → Backend (Django REST) → PostgreSQL tables (users, licenses, payments).
- Unit tests:
  - Frontend: Form validation, QR component props/state transitions.
  - Backend: License key generation, expiry calculation, serializers/validators.
- Integration tests:
  - Form submission → `/api/licenses/create` → DB insert; verify HTTP 201 and payload.
  - Payment callback updates license status; verify idempotency.
- System tests:
  - End‑to‑end: user requests license, pays, receives QR, verification succeeds.
  - Performance: Issue 1000 licenses/hour, p95 < 300 ms.
  - Security: Admin‑only revocation; input sanitization; auth checks.
