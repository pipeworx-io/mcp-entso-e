# @pipeworx/entso-e

ENTSO-E Transparency Platform MCP — pan-European electricity transmission system data. Generation, load, cross-border flows, day-ahead prices.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

- `day_ahead_prices(area, period_start, period_end)` — auction clearing prices per hour
- `actual_load(area, period_start, period_end)` — measured consumption
- `actual_generation_per_type(area, period_start, period_end)` — generation broken down by fuel/source
- `cross_border_flow(area_from, area_to, period_start, period_end)` — interconnector physical flow
- `installed_capacity(area, year)` — installed generation capacity per type

## Auth

- **Platform key:** gateway env `PLATFORM_ENTSOE_KEY`
- **BYO:** `?_apiKey=<token>` after registering at https://transparency.entsoe.eu/ and emailing transparency@entsoe.eu to request API access.

## Data source

`https://web-api.tp.entsoe.eu/api` — token in `securityToken` query. Returns XML (we parse the most useful fields into JSON).

Bidding-zone codes (`area`) are EIC area codes — `10YDE-VE-------2` (Germany Amprion + 50Hertz), `10YFR-RTE------C` (France), `10YBE----------2` (Belgium), `10YGB----------A` (UK), etc. See `https://transparency.entsoe.eu/content/static_content/Static%20content/web%20api/Guide.html#_areas` for the full list.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "entso-e": {
      "url": "https://gateway.pipeworx.io/entso-e/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/entso-e/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Entso E data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/day_ahead_prices \
  -H 'Content-Type: application/json' \
  -d '{"area":"10YDE-VE-------2","period_start":"202504010000","period_end":"202504012300"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/day_ahead_prices`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.
