import * as fs from 'fs';
import * as path from 'path';

export interface Metrics {
  connectorId: string;
  runId: string;
  timestamp: string;
  run_duration_seconds: number;
  success_rate: number;
  requests_made: number;
  count_429: number;
  price_delta_count: number;
  results_count: number;
  error?: string;
}

export class MetricsCollector {
  private readonly startTime = Date.now();
  public requestsMade = 0;
  public count429 = 0;
  public priceDeltaCount = 0;

  constructor(private readonly connectorId: string, private readonly runId: string) {}

  recordRequest(): void {
    this.requestsMade++;
  }

  record429(): void {
    this.count429++;
    this.requestsMade++;
  }

  recordPriceDelta(): void {
    this.priceDeltaCount++;
  }

  emit(resultsCount: number, error?: string): Metrics {
    const metrics: Metrics = {
      connectorId: this.connectorId,
      runId: this.runId,
      timestamp: new Date().toISOString(),
      run_duration_seconds: parseFloat(((Date.now() - this.startTime) / 1000).toFixed(2)),
      success_rate:
        this.requestsMade > 0
          ? parseFloat(((this.requestsMade - this.count429) / this.requestsMade).toFixed(2))
          : 1,
      requests_made: this.requestsMade,
      count_429: this.count429,
      price_delta_count: this.priceDeltaCount,
      results_count: resultsCount,
      ...(error ? { error } : {}),
    };

    // Write to ./metrics/ for GitHub Actions artifact upload
    const metricsDir = path.join(process.cwd(), 'metrics');
    if (!fs.existsSync(metricsDir)) {
      fs.mkdirSync(metricsDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(metricsDir, `${this.connectorId}-${this.runId}.json`),
      JSON.stringify(metrics, null, 2)
    );

    console.log(`[metrics] ${JSON.stringify(metrics)}`);
    return metrics;
  }
}
