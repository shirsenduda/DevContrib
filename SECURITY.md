# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest (main) | Yes |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, please report it responsibly:

1. **Open a GitHub Security Advisory** — go to the [Security tab](../../security/advisories/new) of this repository and click "Report a vulnerability"
2. **Or email directly** — contact the maintainer at the email listed on their GitHub profile

Please include:
- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fix (optional)

You can expect a response within **72 hours**. We will keep you informed of progress toward a fix and public disclosure.

## Security Best Practices for Self-Hosting

- Never commit `.env` or `.env.local` files — use `.env.example` as a template
- Rotate `NEXTAUTH_SECRET`, `CRON_SECRET`, and `GITHUB_WEBHOOK_SECRET` regularly
- Use environment-specific OAuth apps (separate apps for dev and prod)
- Keep your `GITHUB_PERSONAL_ACCESS_TOKEN` scoped to the minimum required permissions (`public_repo` read only)
- Enable branch protection on `main` — require PR reviews and passing CI before merging
