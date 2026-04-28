# Security Guidelines — Reflexallen MES

> **Audience**: Developers, Claude Code, system administrators
> **Compliance target**: IATF 16949, GDPR, automotive Tier-1 requirements
> **Last updated**: 2026-04-27
> **Version**: 1.0

---

## 🎯 Why this document exists

Reflexallen is a Tier-1 automotive supplier. The MES handles:

- **Production data** subject to 15+ year retention (genealogy, recalls)
- **Personal data** of operators (PII under GDPR)
- **Quality data** subject to customer audits (IATF 16949)
- **Compliance data** for ECE-R104 (homologation certificates)

A breach or data corruption could mean:
- Customer audit failures
- Regulatory fines
- Recall liability disputes
- GDPR penalties (up to 4% of global revenue)

These guidelines are **non-negotiable** for code touching production data.

---

## 🔐 Authentication

### Operator authentication (HMI)

**Method**: Badge + PIN

- **Badge**: Physical card (RFID or barcode), maps to `operator.badgeCode`
- **PIN**: 4-6 digits, **MUST be hashed in DB** (Argon2id)

**Implementation rules**:
- ✅ PINs hashed with Argon2id (memory cost 64MB, time cost 3, parallelism 4)
- ✅ PIN hashing happens BEFORE storage (never store plaintext)
- ✅ PIN responses NEVER include the hash (hide from API responses)
- ✅ Failed PIN attempts: 5 max, then 60-second lockout
- ✅ Lockout audit-logged with operator ID and workstation
- ❌ NEVER log PINs (not even hashed)
- ❌ NEVER send PINs over email/SMS
- ❌ NEVER use bcrypt or PBKDF2 (use Argon2id)
- ❌ NEVER allow numeric-only "1111" or "1234" patterns

### Admin/Engineer authentication (Web)

**Method**: Email + password

- **Password requirements**:
  - Minimum 12 characters
  - Mix of uppercase, lowercase, numbers, symbols
  - Cannot match operator's name, email, or last 5 passwords
- **Hashing**: Argon2id (same parameters as PINs)
- **Two-factor**: Recommended for admin role (TOTP via authenticator app)

### JWT Tokens

- **Algorithm**: RS256 (asymmetric) preferred; HS256 (symmetric) acceptable for MVP
- **Access token**: 8 hours (matches a typical shift)
- **Refresh token**: 30 days
- **Storage**: HttpOnly + Secure + SameSite=Strict cookies (NOT localStorage)
- **Rotation**: Refresh tokens rotate on use
- **Revocation**: Maintain blocklist (Redis) for logout / compromise

### Session management

- **Session timeout**: Auto-logout after 30 min inactivity (web) / 60 min (HMI)
- **Concurrent sessions**: Allowed (operator might use multiple workstations)
- **Forced logout**: Admin can force logout all sessions (security incident)

---

## 🛡️ Authorization (RBAC)

### Role definitions

5 base roles:

1. **Admin** — Full access (system configuration, all data, user management)
2. **Plant Manager** — All operational data, KPI dashboards, no system config
3. **Process Engineer** — Workflow design, recipes, master data registries
4. **Quality Manager** — Quality data, audit trail, scrap analysis, holds
5. **Production Operator** — HMI execution, own productivity data only

### Authorization rules

- ✅ Every API endpoint declares required role
- ✅ Role checks happen at the API layer (not just UI)
- ✅ UI hides unauthorized features but does NOT trust this
- ✅ Database queries filter by role-appropriate scope
- ❌ NEVER trust role from frontend — always verify in backend

### Permission granularity (V2)

For now (MVP): role-based.

For V2: consider permission-based:
- `workOrders.read.own` (operator can read own WOs)
- `workOrders.read.all` (manager can read all)
- `workOrders.release` (planner can release)

---

## 🔑 Secrets management

### Development

- Store secrets in `.env` (NEVER in code)
- `.env` MUST be in `.gitignore`
- `.env.example` provides structure (no real values)
- Defaults are weak intentionally (force change in production)

### Production

- **NEVER use `.env` in production**
- Use a secret manager:
  - HashiCorp Vault (preferred, on-premise)
  - AWS Secrets Manager
  - Azure Key Vault
  - Or environment variables injected at deploy time
- Rotate secrets:
  - JWT secrets: every 90 days
  - Database passwords: every 180 days
  - API keys for external services: per provider recommendation

### What counts as a "secret"

- Database passwords
- API keys (any external service)
- JWT signing keys
- Encryption keys
- OAuth client secrets
- Certificates (private keys)

### What does NOT count as a secret

- Configuration values (ports, hostnames, feature flags)
- Public keys (only private keys are secrets)
- Connection strings WITHOUT credentials

---

## 🔒 Data protection

### Data at rest

- **Database**: Encrypted disk volumes (LUKS, dm-crypt, or cloud equivalent)
- **Backups**: Encrypted with separate key (gpg, age, or backup tool's encryption)
- **File uploads** (MinIO): Server-side encryption (SSE)
- **Logs**: Encrypted if containing PII

### Data in transit

- **Production**: TLS 1.3 mandatory (TLS 1.2 minimum)
- **Internal services** (api ↔ db, api ↔ redis): TLS preferred
- **HMI ↔ API**: HTTPS only
- **Certificate management**: Let's Encrypt or internal CA
- **Development**: HTTP acceptable on localhost only

### Sensitive data handling

These fields require special care:

| Field | Treatment |
|---|---|
| Operator PIN | Argon2id hash, never logged, never returned in API |
| Operator password | Argon2id hash, never logged |
| JWT secret | In secret manager, rotated quarterly |
| Customer order details | Visible to authorized roles only |
| Personal data (PII) | GDPR rules: export/delete on request |
| Audit logs | Tamper-evident if possible (cryptographic chain) |

---

## 📝 Audit logging

### What to audit

**ALL** of these events MUST be audit-logged:

- Authentication: login, logout, failed attempts, lockouts
- Authorization: permission denied events
- Data mutations: every create, update, delete (including soft-delete)
- WO state transitions
- Workflow approvals/rejections
- Scrap events
- Maintenance interventions
- Skills override
- Lot quality status changes
- Audit log access (yes, audit the audit log)

### What to log

For each event:
- Who: user ID + role + IP address
- What: action + entity type + entity ID
- When: timestamp (UTC)
- Where: workstation/source
- Why: reason if applicable (e.g., scrap cause code)
- Before/after state for mutations
- Correlation ID (trace request across services)

### Retention

- **Audit logs**: 15+ years (IATF 16949 + automotive standards)
- **Operational logs**: 90 days minimum
- **Access logs**: 1 year minimum
- **Login attempts**: 6 months minimum

### Tamper evidence (V2)

For high-compliance requirements:
- Hash chain: each entry includes hash of previous (like blockchain)
- Off-site backup of audit logs
- Periodic verification of chain integrity

For MVP: append-only DB table with no UPDATE/DELETE permissions for app user.

---

## 🛡️ Application security

### Input validation

- ✅ Validate ALL input with Zod schemas (FE + BE)
- ✅ Reject early (middleware level if possible)
- ✅ Sanitize before DB queries (Prisma helps, but be careful with raw SQL)
- ✅ Validate file uploads (type, size, content)
- ❌ NEVER trust client-side validation alone
- ❌ NEVER concatenate user input into SQL
- ❌ NEVER eval() or new Function() with user input

### Output encoding

- ✅ React auto-escapes by default (good)
- ❌ NEVER use `dangerouslySetInnerHTML` with user input
- ✅ Set `Content-Type` headers correctly
- ✅ Use Content Security Policy (CSP) headers

### Security headers

In production, set these HTTP headers:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

NestJS: use `helmet` middleware.

### CSRF protection

- API uses JWT in HttpOnly cookies → vulnerable to CSRF
- Use `SameSite=Strict` cookies
- Implement CSRF tokens for state-changing operations
- Or use double-submit cookie pattern

### Rate limiting

- API: 100 requests/min/IP for unauthenticated
- API: 1000 requests/min/user for authenticated
- Login: 5 attempts/min/IP, then exponential backoff
- Heavy endpoints (reports, exports): 10 requests/min/user

### Dependency security

- ✅ Run `pnpm audit` weekly
- ✅ Update dependencies monthly (security patches)
- ✅ Review major version updates carefully
- ✅ Use Dependabot or Renovate for automation
- ❌ NEVER use `--force` to bypass audit warnings without review

---

## 🔍 SQL injection prevention

Prisma ORM is generally safe, but:

- ✅ Use Prisma Client methods (`.findMany()`, `.create()`, etc.)
- ✅ Use Prisma's `$queryRaw` with template literals (auto-parameterized)
- ❌ NEVER use `$queryRawUnsafe` with user input
- ❌ NEVER concatenate strings into raw SQL

```typescript
// ✅ SAFE — Prisma method
prisma.item.findMany({ where: { code: userInput } });

// ✅ SAFE — Tagged template
prisma.$queryRaw`SELECT * FROM Item WHERE code = ${userInput}`;

// ❌ DANGEROUS
prisma.$queryRawUnsafe(`SELECT * FROM Item WHERE code = '${userInput}'`);
```

---

## 🚪 API security

### Endpoint protection

- ✅ Every endpoint declares authentication requirement
- ✅ Public endpoints explicitly marked
- ✅ Default = require authentication
- ✅ Return 401 for missing/invalid auth
- ✅ Return 403 for valid auth but insufficient permission
- ❌ NEVER reveal whether user exists in error messages

### Error handling

- ✅ Generic error messages to users
- ✅ Detailed errors in logs (server-side)
- ❌ NEVER expose stack traces to users in production
- ❌ NEVER return DB errors verbatim
- ❌ NEVER reveal internal paths or technologies in errors

### Webhook security (V2)

When integrating external systems:
- Use HMAC signatures
- Verify timestamps (prevent replay)
- IP allowlists where possible
- Separate webhook secrets per integration

---

## 📡 Network security

### Internal network

- Database on private subnet (not public)
- Redis on private subnet
- MinIO accessible only from API
- Only API exposed to clients (web/hmi)

### Firewall rules (production target)

```
Internet → API (443/HTTPS only)
Internet → Web/HMI (443/HTTPS only)
API → DB (5432/internal only)
API → Redis (6379/internal only)
API → MinIO (9000/internal only)
```

---

## 👥 GDPR compliance

### Personal data inventory

The MES stores PII:
- Operator: name, email, badge, photo, performance metrics
- User: name, email, role
- Audit log: user actions (PII by association)

### GDPR rights implementation

- **Right to access**: API endpoint to download user's own data
- **Right to rectification**: Update endpoints exist
- **Right to erasure**: Anonymization (not delete — keep for audit)
- **Right to restriction**: Block account
- **Right to portability**: Export data in JSON

### Data minimization

- Don't collect what you don't need
- Photos: low-res sufficient (don't store HD)
- Performance metrics: aggregated where possible

---

## 🚨 Incident response

### What constitutes a security incident

- Unauthorized access (or attempt) to production data
- Data breach (PII or production data leaked)
- Compromised credentials
- Audit log tampering
- Suspicious access patterns

### Response procedure

1. **Detect**: Monitoring + alerts (out of scope for MVP)
2. **Contain**: Block affected accounts, rotate secrets
3. **Assess**: Determine scope and impact
4. **Notify**: Internal stakeholders, then customers/authorities (GDPR: 72h)
5. **Remediate**: Fix root cause
6. **Document**: Post-mortem, update SECURITY.md if needed

### Contacts

- **Internal security lead**: TBD
- **Anthropic (if AI-related)**: support@anthropic.com
- **Authorities (Italy)**: Garante per la protezione dei dati personali

---

## ✅ Security checklist for new features

When adding a feature, verify:

- [ ] Inputs validated with Zod
- [ ] Authorization checked at API layer
- [ ] Audit log entry for all mutations
- [ ] No secrets in code or commits
- [ ] PII handled per GDPR rules
- [ ] Error messages generic (no info leak)
- [ ] Rate limiting if user-controlled trigger
- [ ] Tests cover security edge cases
- [ ] Documentation updated if new role/permission

---

## 🚦 Implementation priority

### MVP (PROMPT_1-6)

- ✅ Argon2id for PINs and passwords
- ✅ JWT with HttpOnly cookies
- ✅ Zod validation everywhere
- ✅ Audit logging on all mutations
- ✅ RBAC at API level
- ✅ `.env` for secrets, never in git
- ✅ HTTPS in production (config only, certs come later)
- ✅ Soft delete (no hard delete)

### Post-MVP (V2)

- ⏳ Tamper-evident audit logs (hash chain)
- ⏳ 2FA for admin role
- ⏳ External secret manager
- ⏳ Penetration testing
- ⏳ Compliance audit
- ⏳ SOC 2 / ISO 27001 alignment

---

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [GDPR text](https://gdpr-info.eu/)
- [IATF 16949](https://www.iatfglobaloversight.org/)
- [Argon2 RFC 9106](https://datatracker.ietf.org/doc/rfc9106/)

---

## 🔄 Change log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial security guidelines for MVP. |
