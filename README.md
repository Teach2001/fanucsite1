# FanucSite Cloudflare Password Protection

This repository is configured for Cloudflare Pages with server-side password protection using Pages Functions.

## What was added

- `functions/_middleware.js` — blocks every route unless the visitor is authenticated.
- `functions/login.js` — serves a login form and sets a secure HTTP-only auth cookie.
- `wrangler.toml` — Cloudflare Pages/Wrangler config.
- `package.json` — local dev tooling with `@cloudflare/wrangler`.

## Setup

1. Upload this repo to GitHub.
2. Create a Cloudflare Pages project from the repo.
3. In Cloudflare Pages, add a secret named `PASSWORD_SECRET`.
   - This is the password users must enter.
   - Do not commit the secret to GitHub.
4. Deploy the site.

## Local development

If you have Node.js installed:

```bash
npm install
npm run dev
```

If you want to test locally without Pages secrets, replace `your_secret_here` in `package.json` with a local password value, or use the `--bindings PASSWORD_SECRET=...` option directly.

## Notes

- No site page is accessible until `/login` authenticates the visitor.
- The password is validated server-side using the Cloudflare secret.
- The auth state is stored via a secure cookie, not in the browser HTML.
