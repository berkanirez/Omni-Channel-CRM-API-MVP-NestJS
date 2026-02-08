# Omni-Channel CRM API (MVP) — NestJS

A multi-tenant CRM backend MVP built to learn **NestJS** with real-world patterns: **RBAC**, tenant isolation, workflows, communications (SMS/email/push abstraction), audit logging, and E2E testing.

## ✨ Features

### Core CRM
- Customers, Contacts, Deals (pipeline stages), Tasks, Notes, Tags
- Soft-delete support (`deletedAt`) and company-scoped queries

### Multi-tenant (Company-based)
- Users belong to companies via memberships
- **Tenant isolation** enforced on read/write operations

### Auth & Security
- JWT authentication (`/auth/login`, `/auth/register`)
- Company-aware login (email + password + `companySlug`)
- Role-Based Access Control (RBAC) with permissions (e.g. `customer:create`, `deal:read`)
- Consistent HTTP error responses (401/403/404/400)

### Workflow Engine
- Event-driven workflow rules (`customer_created`, `deal_stage_changed`, `task_overdue`)
- Rule conditions evaluation + actions (e.g. `sendMessage`)
- Dynamic recipient resolution (e.g. `customer.phone`)

### Communications (Omni-channel)
- Provider registry abstraction (SMS/Email/Push)
- `CommunicationRecord` table for auditability:
  - queued/sent/failed statuses
  - provider response snapshots
  - retry metadata (`retryCount`, `nextRetryAt`, `lastAttemptAt`)

### Audit Logging
- `AuditLog` model to track actions, request context, metadata

### Testing
- E2E + integration tests with Jest + Supertest
- Security contract tests:
  - Auth (401)
  - Permissions (403)
  - Tenant isolation (cross-company access denied)
- Full flow E2E test:
  - `customer → deal → stage change → workflow → communication record`

## 🧱 Tech Stack
- NestJS, TypeScript
- Prisma ORM + PostgreSQL
- Jest + Supertest (E2E)
- class-validator DTO validation

## 🚀 Getting Started

### 1) Install
```bash
npm install
