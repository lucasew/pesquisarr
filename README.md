# pesquisarr

Simple cloudflare worker to search for the gold in torrent sites.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/lucasew/pesquisarr)

**WARNING**: This thing doesn't store any illegal data. All the data provided is already freely available on the Internet. This utility only makes it easier to search for it.

The utility already tries to use the first page of both Google and DuckDuckGo, then get the site links, static website content and lastly the magnet links in the site content. All of this without loading any of the Javascript crap that is pushed towards the user.

If the search fails, it's treated as if there is nothing found.

If the site loading takes more than 2s it's treated as if the site does not have any magnet link.

You only gets what really matters: the magnet links.

**The search query is your responsibility**

## Desktop window

```bash
mise run embed
lewkit release run --config eletrocromo.json
```

`mise run embed` builds the Cloudflare worker and writes `cmd/pesquisarr/embed`. `lewkit release run` stamps `br.tec.lew.pesquisarr` and opens that worker in a window. orvalho runs the worker. If `cmd/pesquisarr/embed/guest.js` is already built, skip `mise run embed`.

Outbound `fetch` is open because result pages sit on whatever host the search engine returned. The app still refuses non-public URLs before it fetches them.
