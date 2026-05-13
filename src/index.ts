interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * ENTSO-E Transparency Platform MCP
 *
 * Pan-European electricity TSO data: load, generation, day-ahead prices, flows.
 * API returns XML; we parse the bare minimum into typed JSON.
 *
 * Auth: token via `securityToken` query param. Requires registration at
 *       transparency.entsoe.eu + an email to transparency@entsoe.eu requesting
 *       API access.
 *
 * Docs: https://transparency.entsoe.eu/content/static_content/Static%20content/web%20api/Guide.html
 */


const BASE = 'https://web-api.tp.entsoe.eu/api';

const tools: McpToolExport['tools'] = [
  {
    name: 'day_ahead_prices',
    description:
      'Day-ahead auction prices (€/MWh) per hour for a bidding zone. Period is YYYYMMDDHHmm format (UTC).',
    inputSchema: {
      type: 'object',
      properties: {
        area: { type: 'string', description: 'Bidding-zone EIC code (e.g. "10YDE-VE-------2" Germany)' },
        period_start: { type: 'string', description: 'YYYYMMDDHHmm (UTC)' },
        period_end: { type: 'string', description: 'YYYYMMDDHHmm (UTC)' },
      },
      required: ['area', 'period_start', 'period_end'],
    },
  },
  {
    name: 'actual_load',
    description: 'Measured electricity consumption per hour for a bidding zone (MW).',
    inputSchema: {
      type: 'object',
      properties: {
        area: { type: 'string', description: 'Bidding-zone EIC code' },
        period_start: { type: 'string' },
        period_end: { type: 'string' },
      },
      required: ['area', 'period_start', 'period_end'],
    },
  },
  {
    name: 'actual_generation_per_type',
    description: 'Actual generation per production type (solar, wind, nuclear, gas, ...) per hour.',
    inputSchema: {
      type: 'object',
      properties: {
        area: { type: 'string', description: 'Bidding-zone EIC code' },
        period_start: { type: 'string' },
        period_end: { type: 'string' },
      },
      required: ['area', 'period_start', 'period_end'],
    },
  },
  {
    name: 'cross_border_flow',
    description: 'Physical flow across an interconnector (in_area → out_area).',
    inputSchema: {
      type: 'object',
      properties: {
        area_from: { type: 'string', description: 'Source area EIC code' },
        area_to: { type: 'string', description: 'Destination area EIC code' },
        period_start: { type: 'string' },
        period_end: { type: 'string' },
      },
      required: ['area_from', 'area_to', 'period_start', 'period_end'],
    },
  },
  {
    name: 'installed_capacity',
    description: 'Year-end installed generation capacity by production type (MW).',
    inputSchema: {
      type: 'object',
      properties: {
        area: { type: 'string', description: 'Bidding-zone EIC code' },
        year: { type: 'number', description: 'Year (e.g. 2024)' },
      },
      required: ['area', 'year'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = (args._apiKey as string | undefined)?.trim();
  if (!apiKey) {
    throw new Error(
      'ENTSO-E requires a security token. Contact the operator about platform credentials, or BYO via ?_apiKey=<token> after registering at https://transparency.entsoe.eu/ and emailing transparency@entsoe.eu.',
    );
  }
  switch (name) {
    case 'day_ahead_prices':
      return entsoeQuery(apiKey, {
        documentType: 'A44',
        in_Domain: reqStr(args, 'area', '"10YDE-VE-------2"'),
        out_Domain: reqStr(args, 'area', '"10YDE-VE-------2"'),
        periodStart: reqStr(args, 'period_start', '"202504010000"'),
        periodEnd: reqStr(args, 'period_end', '"202504020000"'),
      });
    case 'actual_load':
      return entsoeQuery(apiKey, {
        documentType: 'A65',
        processType: 'A16',
        outBiddingZone_Domain: reqStr(args, 'area', '"10YDE-VE-------2"'),
        periodStart: reqStr(args, 'period_start', '"202504010000"'),
        periodEnd: reqStr(args, 'period_end', '"202504020000"'),
      });
    case 'actual_generation_per_type':
      return entsoeQuery(apiKey, {
        documentType: 'A75',
        processType: 'A16',
        in_Domain: reqStr(args, 'area', '"10YDE-VE-------2"'),
        periodStart: reqStr(args, 'period_start', '"202504010000"'),
        periodEnd: reqStr(args, 'period_end', '"202504020000"'),
      });
    case 'cross_border_flow':
      return entsoeQuery(apiKey, {
        documentType: 'A11',
        in_Domain: reqStr(args, 'area_to', '"10YFR-RTE------C"'),
        out_Domain: reqStr(args, 'area_from', '"10YDE-VE-------2"'),
        periodStart: reqStr(args, 'period_start', '"202504010000"'),
        periodEnd: reqStr(args, 'period_end', '"202504020000"'),
      });
    case 'installed_capacity': {
      const yr = (args.year as number) ?? new Date().getUTCFullYear();
      return entsoeQuery(apiKey, {
        documentType: 'A68',
        processType: 'A33',
        in_Domain: reqStr(args, 'area', '"10YDE-VE-------2"'),
        periodStart: `${yr}01010000`,
        periodEnd: `${yr}01020000`,
      });
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function entsoeQuery(token: string, q: Record<string, string>) {
  const params = new URLSearchParams({ securityToken: token, ...q });
  const url = `${BASE}?${params}`;
  const res = await fetch(url);
  if (res.status === 401) throw new Error('ENTSO-E: unauthorized — check security token');
  if (res.status === 400) {
    const t = await res.text();
    throw new Error(`ENTSO-E bad request: ${t.slice(0, 300)}`);
  }
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`ENTSO-E error: ${res.status} ${t.slice(0, 200)}`);
  }
  const xml = await res.text();
  return parseEntsoeXml(xml, q);
}

// Minimal XML extractor — pulls timeseries and points without a full XML parser.
// Returns { time_series: [{ resolution, mrid, business_type, period_start, period_end, points: [{position, quantity, price}] }] }
function parseEntsoeXml(xml: string, query: Record<string, string>) {
  const tsBlocks = [...xml.matchAll(/<TimeSeries>([\s\S]*?)<\/TimeSeries>/g)].map((m) => m[1]);
  const timeSeries = tsBlocks.map((block) => {
    const mrid = first(block, /<mRID>([^<]+)<\/mRID>/);
    const business = first(block, /<businessType>([^<]+)<\/businessType>/);
    const psrType = first(block, /<psrType>([^<]+)<\/psrType>|<MktPSRType>\s*<psrType>([^<]+)<\/psrType>/);
    const inDomain = first(block, /<in_Domain\.mRID[^>]*>([^<]+)</);
    const outDomain = first(block, /<out_Domain\.mRID[^>]*>([^<]+)</);
    const periodBlocks = [...block.matchAll(/<Period>([\s\S]*?)<\/Period>/g)].map((m) => m[1]);
    const periods = periodBlocks.map((p) => {
      const start = first(p, /<timeInterval>\s*<start>([^<]+)<\/start>/);
      const end = first(p, /<timeInterval>[\s\S]*?<end>([^<]+)<\/end>/);
      const resolution = first(p, /<resolution>([^<]+)<\/resolution>/);
      const points = [...p.matchAll(/<Point>\s*<position>(\d+)<\/position>\s*(?:<quantity>([^<]+)<\/quantity>|<price\.amount>([^<]+)<\/price\.amount>)\s*<\/Point>/g)].map((m) => ({
        position: Number(m[1]),
        value: Number(m[2] ?? m[3]),
      }));
      return { period_start: start, period_end: end, resolution, points };
    });
    return { mrid, business_type: business, psr_type: psrType, in_domain: inDomain, out_domain: outDomain, periods };
  });
  return { query, time_series_count: timeSeries.length, time_series: timeSeries };
}

function first(text: string, re: RegExp): string | null {
  const m = re.exec(text);
  return m ? (m[1] ?? m[2] ?? null) : null;
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  }
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
