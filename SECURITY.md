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

## Security Best Practices

1. **Regular Updates**: Run `npm audit` regularly
2. **Dependency Pinning**: Use exact versions for critical dependencies in production
3. **Environment Variables**: Never commit secrets (use `.env` files)
4. **API Keys**: Rotate keys periodically
5. **Monitoring**: Set up Sentry for error tracking (Week 9)

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly.
