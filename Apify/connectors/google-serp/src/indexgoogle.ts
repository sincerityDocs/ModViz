import { ApifyClient } from 'apify-client';
import { BudgetTracker, BudgetError } from '../../shared/lib/budget';
import { MetricsCollector } from '../../shared/lib/metrics';
import { alertOnFailure } from '../../shared/lib/alerts';
import config from '../../shared/connectors.json';
 
const CONNECTOR_ID = 'google-serp';
const connectorConfig = config.connectors.find(c => c.id === CONNECTOR_ID)!;
const MAX_RESULTS = connectorConfig.output_schema.max_results as number;
 
interface SerpResult {
  rank: number;
  title: string;
  url: string;
  domain: string;
  timestamp: string;
  visible_price?: string;
}
 
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
 
function normalize(item: Record<string, unknown>, rank: number): SerpResult | null {
  const title = String(item.title ?? item.name ?? '').trim();
  const url = String(item.url ?? item.link ?? '').trim();
  if (!title || !url.startsWith('http')) return null;
 
  const domain = extractDomain(url);
  if (!domain) return null;
 
  const result: SerpResult = {
    rank,
    title,
    url,
    domain,
    timestamp: new Date().toISOString(),
  };
 
  // Optional: extract price if present in description/snippet
  const snippet = String(item.description ?? item.snippet ?? item.descriptionHtml ?? '');
  const priceMatch = snippet.match(/\$[\d,]+(\.\d{2})?/);
  if (priceMatch) result.visible_price = priceMatch[0];
 
  return result;
}
 
async function run() {
  const runId = `${CONNECTOR_ID}-${Date.now()}`;
  const budget = new BudgetTracker(
    connectorConfig.budget.per_run_call_cap,
    connectorConfig.budget.max_runtime_seconds
  );
  const metrics = new MetricsCollector(CONNECTOR_ID, runId);
  const alertConfig = {
    githubToken: process.env.GITHUB_BOT_TOKEN,
    githubRepo: config.alerts.github_issues.repo,
    slackWebhook: process.env.SLACK_WEBHOOK_URL,
  };
 
  const searchQuery = process.env.SEARCH_QUERY ?? process.argv[2];
  if (!searchQuery) {
    console.error('[google-serp] Error: SEARCH_QUERY env var or CLI arg required');
    process.exit(1);
  }
 
  const apifyToken = process.env.APIFY_API_TOKEN;
  if (!apifyToken) {
    console.error('[google-serp] Error: APIFY_API_TOKEN env var required');
    process.exit(1);
  }
 
  const client = new ApifyClient({ token: apifyToken });
 
  try {
    budget.check('actor-start');
    metrics.recordRequest();
    console.log(`[google-serp] Starting actor run for: "${searchQuery}"`);
 
    const actorRun = await client.actor(connectorConfig.apify_actor).call({
      queries: searchQuery,
      resultsPerPage: MAX_RESULTS,
      maxPagesPerQuery: 1,
      countryCode: 'us',
      languageCode: 'en',
      proxyConfiguration: { useApifyProxy: true },
    });
 
    // Wait briefly for Apify to flush dataset writes
    await new Promise(resolve => setTimeout(resolve, 5000));
 
    metrics.recordRequest();
    const { items } = await client.dataset(actorRun.defaultDatasetId).listItems();
    console.log(`[google-serp] Raw items from Apify: ${items.length}`);
 
    if (items.length > 0) {
      console.log('[debug] Sample item keys:', Object.keys(items[0]).join(', '));
      console.log('[debug] Sample item:', JSON.stringify(items[0], null, 2).slice(0, 1500));
    }
 
    // Apify SERP scraper returns one item per query with a nested organicResults array
    const firstItem = items[0] as Record<string, unknown> | undefined;
    const rawResults: unknown[] = Array.isArray(firstItem?.organicResults)
      ? (firstItem!.organicResults as unknown[])
      : (items as unknown[]);
 
    const valid: SerpResult[] = [];
    for (let i = 0; i < rawResults.length && valid.length < MAX_RESULTS; i++) {
      const normalized = normalize(rawResults[i] as Record<string, unknown>, valid.length + 1);
      if (normalized) {
        valid.push(normalized);
      }
    }
 
    console.log(`[google-serp] Valid results: ${valid.length}`);
 
    if (valid.length === 0) {
      throw new Error('No valid SERP results returned — check field mapping');
    }
 
    const m = metrics.emit(valid.length);
    const output = {
      success: true,
      connector: CONNECTOR_ID,
      runId,
      query: searchQuery,
      results: valid,
      metrics: m,
      budget: budget.summary(),
    };
 
    console.log(JSON.stringify(output, null, 2));
 
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const m = metrics.emit(0, errorMsg);
 
    if (!(err instanceof BudgetError)) {
      await alertOnFailure(alertConfig, CONNECTOR_ID, errorMsg);
    }
 
    console.error(JSON.stringify({
      success: false,
      connector: CONNECTOR_ID,
      runId,
      error: errorMsg,
      metrics: m,
      budget: budget.summary(),
    }));
    process.exit(1);
  }
}
 
run().catch(err => {
  console.error('[google-serp] Fatal unhandled error:', err);
  process.exit(1);
});
 