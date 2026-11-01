# Make Ultron a real AI (optional, ~10 minutes)

Without this, Ultron uses his built-in offline brain (already works).

1. Get an API key at console.anthropic.com and set a small monthly spend limit there.
2. Create a free account at cloudflare.com -> Workers & Pages -> Create -> Worker.
3. Paste the contents of `ultron-worker.js` into the worker and deploy.
4. In the worker's Settings -> Variables add:
   - `ANTHROPIC_API_KEY` (type: Secret) = your key
   - `ALLOWED_ORIGIN` = your site address, e.g. https://samanyudhangar.github.io (no slash at the end)
5. Copy the worker URL and paste it into `ultron-config.js` between the quotes.
6. Upload the files to GitHub as usual.

Never put the API key in any file on GitHub.
