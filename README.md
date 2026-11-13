# pesquisarr

Simple cloudflare worker to search for the gold in torrent sites.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/lucasew/pesquisarr)

**WARNING**: This thing doesn't store any illegal data. All the data provided is already freely available on the Internet. This utility only makes it easier to search for it.

The utility already tries to use the first page of both Google and DuckDuckGo, then get the site links, static website content and lastly the magnet links in the site content. All of this without loading any of the Javascript crap that is pushed towards the user.

If the search fails, it's treated as if there is nothing found.

If the site loading takes more than 2s it's treated as if the site does not have any magnet link.

You only gets what really matters: the magnet links.

**The search query is your responsibility**

## MCP endpoint

`/api/mcp` speaks the [Model Context Protocol](https://modelcontextprotocol.io) over stateless Streamable HTTP, so tools like Claude Code, Codex, or the MCP Inspector can search without going through the HTML UI.

| Tool                  | What it does                                                             |
| --------------------- | ------------------------------------------------------------------------ |
| `search_torrents`     | Search indexers for a title/keyword and return torrents with magnet URIs |
| `get_torrent_streams` | Resolve an IMDb id (`tt…`) to torrents; optional `season`/`episode`      |
| `get_imdb_title`      | Fetch the display title for an IMDb id                                   |
| `health_check`        | Report service health (`deep: true` probes upstreams)                    |

Each request builds a fresh server, so no session state survives between Worker isolates. Responses are plain JSON (no SSE) and CORS is open for browser clients.

Point an MCP client at `https://<worker-host>/api/mcp` (or `http://localhost:4321/api/mcp` while running `npm run dev`). A quick check:

```bash
curl -s http://localhost:4321/api/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Desktop window

```bash
mise run embed
lewkit release run --config eletrocromo.json
```

`mise run embed` builds the Cloudflare worker and writes `cmd/pesquisarr/embed`. `lewkit release run` stamps `br.tec.lew.pesquisarr` and opens that worker in a window. orvalho runs the worker. If `cmd/pesquisarr/embed/guest.js` is already built, skip `mise run embed`.

Outbound `fetch` is open because result pages sit on whatever host the search engine returned. The app still refuses non-public URLs before it fetches them.
