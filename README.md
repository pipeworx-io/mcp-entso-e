# mcp-entso-e

ENTSO-E Transparency Platform MCP

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 250+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `actual_load` | Measured electricity consumption per hour for a bidding zone (MW). |
| `actual_generation_per_type` | Actual generation per production type (solar, wind, nuclear, gas, ...) per hour. |
| `cross_border_flow` | Physical flow across an interconnector (in_area → out_area). |
| `installed_capacity` | Year-end installed generation capacity by production type (MW). |

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

Or connect to the full Pipeworx gateway for access to all 250+ data sources:

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

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
