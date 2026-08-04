# @pipeworx/entso-e

ENTSO-E Transparency Platform MCP — pan-European electricity transmission system data. Generation, load, cross-border flows, day-ahead prices.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Entso E data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
