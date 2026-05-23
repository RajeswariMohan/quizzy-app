# Quizzy Auth & Multi-Tenant RBAC

JWT authentication with tenant isolation per `architecture_plan.md`.

## Request flow

1. **TenantContextMiddleware** — Extracts `Authorization: Bearer <token>`, verifies JWT signature, validates `school_id` against the `users` row, attaches `req.tenantContext`.
2. **JwtAuthGuard** (global) — Requires `tenantContext` on non-`@Public()` routes.
3. **RolesGuard** (global) — Enforces `@Roles(...)` when present.
4. **PermissionsGuard** (global) — Enforces `@RequirePermissions(...)` when present.

## Roles

| Role | `school_id` in JWT | Scope |
|------|-------------------|--------|
| `SUPER_ADMIN` | Must be `null` | Platform-wide |
| `SCHOOL_ADMIN` | Required | Single school |
| `TEACHER` | Required | Single school |
| `STUDENT` | Required | Single school |
| `PARENT` | Required | Single school |

## Usage

```typescript
@Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
@RequirePermissions(Permission.MANAGE_QUIZZES)
@Get('quizzes')
list(@CurrentTenant() tenant: TenantContext) {
  const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
  // query with { schoolId }
}
```

## Environment

See `backend/.env.example` for `JWT_SECRET` and `JWT_EXPIRES_IN`.
