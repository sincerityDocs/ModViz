import { ApifyClient } from 'apify-client';
import { BudgetTracker, BudgetError } from '../../shared/lib/budget';
import { MetricsCollector } from '../../shared/lib/metrics';
import { alertOnFailure } from '../../shared/lib/alerts';
import config from '../../shared/connectors.json';
 
const CONNECTOR_ID = 'ebay-scraper';
const connectorConfig = config.connectors.find(c => c.id === CONNECTOR_ID)!;
 
// Price range filter
const MIN_PRICE = 12;
const MAX_PRICE = 200;
 
interface EbayProduct {
  title: string;
  price: number;
  shipping: string;
  listingType: string;
  condition: string;
  url: string;
}
 
function normalize(item: Record<string, unknown>): EbayProduct | null {
  const title = String(
    item.title ?? item.name ?? item.itemTitle ?? ''
  ).trim();
 
  const rawPrice = String(
    item.price ??
    item.currentPrice ??
    item.itemPrice ??
    item.salePrice ??
    ''
  );
  const price = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));
 
  const shipping = String(
    item.shippingCost ?? item.shipping ?? item.shippingPrice ?? 'unknown'
  ).trim();
 
  const listingType = String(
    item.listingType ?? item.type ?? item.buyingFormat ?? item.saleFormat ?? ''
  ).trim();
 
  const condition = String(
    item.condition ?? item.itemCondition ?? ''
  ).trim();
 
  const url = String(
    item.url ?? item.itemUrl ?? item.link ?? item.viewItemURL ?? ''
  ).trim();
 
  // Required fields
  if (!title || !url.startsWith('http')) return null;
 
  // Price filter — only enforce when a valid price was parsed
  if (!isNaN(price) && price > 0) {
    if (price < MIN_PRICE || price > MAX_PRICE) return null;
  }
 
  // Filter: Buy It Now only — only enforce if field exists
  if (listingType) {
    const isBuyItNow =
      listingType.toLowerCase().includes('fixed') ||
      listingType.toLowerCase().includes('buy');
    if (!isBuyItNow) return null;
  }
 
  // Filter: New only — only enforce if field exists
  if (condition) {
    const isNew = condition.toLowerCase().includes('new');
    if (!isNew) return null;
  }
 
  return {
    title,
    price: isNaN(price) ? 0 : price,
    shipping,
    listingType: listingType || 'unknown',
    condition: condition || 'unknown',
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
    console.error('[ebay-scraper] Error: SEARCH_QUERY env var or CLI arg required');
    process.exit(1);
  }
 
  const apifyToken = process.env.APIFY_API_TOKEN;
  if (!apifyToken) {
    console.error('[ebay-scraper] Error: APIFY_API_TOKEN env var required');
    process.exit(1);
  }
 
  const client = new ApifyClient({ token: apifyToken });
 
  try {
    budget.check('actor-start');
    metrics.recordRequest();
    console.log(`[ebay-scraper] Starting actor run for: "${searchQuery}"`);
 
    const actorRun = await client.actor(connectorConfig.apify_actor).call({
      searchQuery: searchQuery,
      ebayDomain: 'ebay.com',
      maxItems: connectorConfig.budget.per_run_call_cap,
      saleFormat: 'Buy It Now',
      itemCondition: 'new',
      minPrice: MIN_PRICE,
      maxPrice: MAX_PRICE,
      proxyConfiguration: { useApifyProxy: true },
    });
 
    // Wait briefly for Apify to flush dataset writes
    await new Promise(resolve => setTimeout(resolve, 5000));
 
    metrics.recordRequest();
    const { items } = await client.dataset(actorRun.defaultDatasetId).listItems();
    console.log(`[ebay-scraper] Raw items from Apify: ${items.length}`);
 
    if (items.length > 0) {
      console.log('[debug] Sample item keys:', Object.keys(items[0]).join(', '));
      console.log('[debug] Sample item:', JSON.stringify(items[0], null, 2).slice(0, 1500));
    }
 
    const valid: EbayProduct[] = [];
    for (const item of items as Record<string, unknown>[]) {
      const normalized = normalize(item);
      if (normalized) {
        valid.push(normalized);
      }
    }
 
    console.log(`[ebay-scraper] Valid products after filtering ($${MIN_PRICE}-$${MAX_PRICE}, BIN, New): ${valid.length}`);
 
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
  console.error('[ebay-scraper] Fatal unhandled error:', err);
  process.exit(1);
});