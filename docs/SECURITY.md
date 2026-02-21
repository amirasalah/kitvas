# Security Notes

## Current Vulnerabilities

### High Severity: glob in eslint-config-next (Dev Dependency)

**Status:** Acceptable risk for development

**Details:**
- Vulnerability: Command injection in `glob` CLI tool (CVE-2025-XXXX)
- Affected: `@next/eslint-plugin-next` (transitive dependency)
- Impact: Dev dependency only - does not affect production runtime
- Fix: Would require upgrading to Next.js 16 (breaking change)

**Why it's acceptable:**
1. This is a **dev dependency** - not included in production builds
2. Only affects the ESLint plugin's CLI tool, not our application code
3. Fixing it would require a major Next.js upgrade (v14 → v16)
4. We've added an npm override to pin `glob` to a safer version

**Action Plan:**
- Monitor for Next.js 14.x patches that update the dependency
- Address during planned Next.js upgrade (V1.1+)
- The npm override (`glob@^10.4.6`) should mitigate the issue

## Resolved Vulnerabilities

✅ **Next.js Security Patches** (Fixed)
- Updated from `14.0.4` to `14.2.10`
- Fixed: Server-Side Request Forgery, Cache Poisoning, DoS in image optimization

## Authentication Architecture

### Overview

Kitvas uses **NextAuth v5 (beta.30)** with Google OAuth for authentication. The frontend manages sessions via NextAuth, and the backend verifies tokens independently using the `jose` library.

### Auth Flow

```
1. User clicks "Sign in with Google" → NextAuth handles OAuth
2. NextAuth stores encrypted JWT (JWE) in `authjs.session-token` cookie
3. Frontend reads cookie, sends as `Authorization: Bearer <token>` in tRPC headers
4. Backend extracts token, decrypts JWE using AUTH_SECRET via jose
5. Backend upserts user record and sets ctx.userId / ctx.userEmail
```

### Key Security Details

- **Token format**: JWE (JSON Web Encryption), NOT signed JWT. Tokens are encrypted, not just signed.
- **Key derivation**: `hkdf('sha256', AUTH_SECRET, '', 'Auth.js Generated Encryption Key', 64)` — derived from AUTH_SECRET using HKDF
- **Decryption**: `jwtDecrypt` from jose library (NOT `jwtVerify`)
- **Cookie names**: `authjs.session-token` (development), `__Secure-authjs.session-token` (production with HTTPS)
- **AUTH_SECRET**: Must be identical in both `frontend/.env` and `backend/.env`

### Procedure Authorization

| Procedure Type | Access Level | Usage |
|---------------|-------------|-------|
| `t.procedure` (public) | Anyone | Search, autocomplete, analytics, gaps, dashboard |
| `protectedProcedure` | Signed-in users | Alerts (getStatus, subscribe, unsubscribe) |

## Security Best Practices

1. **Regular Updates**: Run `npm audit` regularly
2. **Dependency Pinning**: Use exact versions for critical dependencies in production
3. **Environment Variables**: Never commit secrets (use `.env` files)
4. **API Keys**: Rotate keys periodically
5. **AUTH_SECRET**: Must be kept secret — it can decrypt all session tokens
6. **Google OAuth**: Ensure redirect URIs are restricted to your domains only
7. **Monitoring**: Set up Sentry for error tracking

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly.
