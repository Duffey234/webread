# WebRead

URL to clean Markdown for AI agents (MCP server + x402 API).

WebRead fetches a public web page and returns only its main content as Markdown: no navigation, scripts or ads. Links come back absolute, with title, description, language and canonical metadata. It respects robots.txt and refuses private/internal addresses (SSRF-safe).

- **Hosted remote MCP:** `https://api.youraitools.co/webread/mcp` (Streamable HTTP)
- **Free tier:** 30 full reads/day per IP (full Markdown, up to 200,000 characters) on the remote MCP endpoint, then $0.002 USDC per successful read over [x402](https://x402.org), in USDC on Base, Polygon, Arbitrum One or Solana. No account or API key.
- **Hosted API:** https://api.youraitools.co/webread (`GET /v1/read?url=<page>` ($0.002; failed reads are free), free `GET /v1/read/preview?url=<page>` (first 2,000 characters, 10/min per IP))
- **Local stdio MCP server:** this repo. Starts with no key, no account and no npm registry package.
- **MCP Registry:** `co.youraitools/webread`
- **License:** MIT

## Use the hosted server (no install)

Claude Code:

```bash
claude mcp add --transport http webread https://api.youraitools.co/webread/mcp
```

Claude Desktop: Settings > Connectors > Add custom connector with the URL above, or in `claude_desktop_config.json`:

```json
{ "mcpServers": { "webread": { "command": "npx", "args": ["-y", "mcp-remote", "https://api.youraitools.co/webread/mcp"] } } }
```

Cursor (`~/.cursor/mcp.json`), or one click: [Add to Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=webread&config=eyJ1cmwiOiJodHRwczovL2FwaS55b3VyYWl0b29scy5jby93ZWJyZWFkL21jcCJ9)

```json
{ "mcpServers": { "webread": { "url": "https://api.youraitools.co/webread/mcp" } } }
```

Each free result includes an `upgrade` field with the calls left today. Past the daily limit the tool returns a `payment_required` (402) result with the paid x402 URL.

## Self-host: run from source (no npm registry)

Requires Node.js 20+ (or Docker). The server has no runtime dependencies.

```bash
git clone https://github.com/Duffey234/webread.git
cd webread
npm ci --omit=dev
node src/mcp-stdio.js        # stdio MCP server (newline-delimited JSON-RPC 2.0)
```

No git? Download the source tarball from the mirror instead: `curl -sL https://agentgate-source.pages.dev/x402-url-to-markdown/x402-url-to-markdown.tar.gz | tar xz`.

MCP client config (use the absolute path of your checkout):

```json
{ "mcpServers": { "webread": { "command": "node", "args": ["/absolute/path/to/webread/src/mcp-stdio.js"] } } }
```

Claude Code: `claude mcp add webread -- node /absolute/path/to/webread/src/mcp-stdio.js`

Tool `read_url` reads pages locally on your machine with the same SSRF-safe, robots.txt-respecting reader and HTML-to-Markdown converter the hosted API uses (default 50,000 characters, max 200,000). Nothing is sent to WebRead.

### Docker

```bash
docker build -t webread-mcp .
docker run -i --rm webread-mcp
```

```json
{ "mcpServers": { "webread": { "command": "docker", "args": ["run", "-i", "--rm", "webread-mcp"] } } }
```

## Test

```bash
npm test        # starts the stdio server with no key and checks initialize + tools/list
```

## Full source

The complete hosted service (Cloudflare Worker, x402 v2 + v1, remote MCP) is on the source mirror: https://agentgate-source.pages.dev/x402-url-to-markdown/

Built by [YourAITools](https://youraitools.co). Informational tooling; no warranty.
