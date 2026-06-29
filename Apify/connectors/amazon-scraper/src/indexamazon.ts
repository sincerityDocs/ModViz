import { ApifyClient } from 'apify-client';
import { BudgetTracker, BudgetError } from '../../shared/lib/budget';
import { MetricsCollector } from '../../shared/lib/metrics';
import { alertOnFailure } from '../../shared/lib/alerts';
import config from '../../shared/connectors.json';

const CONNECTOR_ID = 'amazon-scraper';
const connectorConfig = config.connectors.find(c => c.id === CONNECTOR_ID)!;

// Price range filter
const MIN_PRICE = 12;
const MAX_PRICE = 200;

interface AmazonProduct {
  title: string;
  price: number;
  availability: string;
  url: string;
}

function normalize(item: Record<string, unknown>): AmazonProduct | null {
  // Title
  const title = String(item.title ?? item.name ?? '').trim();

  // Price — junglee/amazon-crawler returns price as { value, currency }
  const priceObj = (item.price ?? {}) as Record<string, unknown>;
  const rawPrice = String(
    priceObj.value ??
    item.currentPrice ??
    item.salePrice ??
    item.listPrice ??
    ''
  );
  const price = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));

  // Availability — actor returns inStock: boolean and inStockText: string
  const availability =
    item.inStock === true
      ? 'In Stock'
      : String(item.inStockText ?? item.availability ?? 'unknown').trim();

  // URL
  const url = String(item.url ?? item.productUrl ?? item.link ?? '').trim();

  // Required fields
  if (!title || !url.startsWith('http')) return null;

  // Price filter — only enforce when a valid price was parsed
  if (!isNaN(price) && price > 0) {
    if (price < MIN_PRICE || price > MAX_PRICE) return null;
  }

  return {
    title,
    price: isNaN(price) ? 0 : price,
    availability,
    url,
  };
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
    console.error('[amazon-scraper] Error: SEARCH_QUERY env var or CLI arg required');
    process.exit(1);
  }

  const apifyToken = process.env.APIFY_API_TOKEN;
  if (!apifyToken) {
    console.error('[amazon-scraper] Error: APIFY_API_TOKEN env var required');
    process.exit(1);
  }

  const client = new ApifyClient({ token: apifyToken });

  try {
    budget.check('actor-start');
    metrics.recordRequest();
    console.log(`[amazon-scraper] Starting actor run for: "${searchQuery}"`);

    const actorRun = await client.actor(connectorConfig.apify_actor).call({
      categoryOrProductUrls: [
        { url: `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}&i=us` },
      ],
      maxItems: connectorConfig.budget.per_run_call_cap,
      country: 'US',
      proxyConfiguration: { useApifyProxy: true },
    });

    // Wait briefly for Apify to flush dataset writes
    await new Promise(resolve => setTimeout(resolve, 5000));

    metrics.recordRequest();
    const { items } = await client.dataset(actorRun.defaultDatasetId).listItems();
    console.log(`[amazon-scraper] Raw items from Apify: ${items.length}`);

    const valid: AmazonProduct[] = [];
    for (const item of items as Record<string, unknown>[]) {
      const normalized = normalize(item);
      if (normalized) {
        valid.push(normalized);
      }
    }

    console.log(`[amazon-scraper] Valid products after filtering ($${MIN_PRICE}-$${MAX_PRICE}): ${valid.length}`);

    if (valid.length === 0) {
      throw new Error(`No valid products returned — check field mapping or price filter ($${MIN_PRICE}-$${MAX_PRICE})`);
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
  console.error('[amazon-scraper] Fatal unhandled error:', err);
  process.exit(1);
});