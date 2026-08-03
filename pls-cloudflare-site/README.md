# PL$ — Cloudflare Pages

PL$ website ready to deploy with Cloudflare Pages.

1. Create a **Cloudflare Pages** project from a Git repository or deploy it through Wrangler. The `functions/` directory needs to be deployed along with the website.
2. In **Settings → Environment variables**, add `RESEND_API_KEY` with an API key from [Resend](https://resend.com).
3. Optional: add `FROM_EMAIL` as a verified Resend sender, for example `PL$ <hello@yourdomain.com>`.
4. Deploy. Beta requests will then be sent automatically to `bbsally389@gmail.com`, with the visitor’s e-mail set as Reply-To.

The site needs no build step. The only configuration is the Resend secret above, which powers the beta-request form.
