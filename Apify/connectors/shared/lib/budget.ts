export class BudgetError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'BudgetError';
  }
}

export class BudgetTracker {
  private callsUsed = 0;
  private readonly startTime = Date.now();

  constructor(
    private readonly perRunCap: number,
    private readonly maxRuntimeSeconds: number
  ) {}

  check(label = 'call'): void {
    this.callsUsed++;
    const elapsed = (Date.now() - this.startTime) / 1000;

    if (this.callsUsed > this.perRunCap) {
      throw new BudgetError(
        `Per-run call cap (${this.perRunCap}) exceeded at [${label}]`
      );
    }
    if (elapsed > this.maxRuntimeSeconds) {
      throw new BudgetError(
        `Runtime cap (${this.maxRuntimeSeconds}s) exceeded at [${label}] — elapsed: ${elapsed.toFixed(1)}s`
      );
    }

    const pct = this.callsUsed / this.perRunCap;
    if (pct >= 0.9) {
      console.warn(
        `[budget] ⚠ ${(pct * 100).toFixed(0)}% of per-run cap used (${this.callsUsed}/${this.perRunCap})`
      );
    }
  }

  summary() {
    return {
      callsUsed: this.callsUsed,
      callsRemaining: this.perRunCap - this.callsUsed,
      elapsedSeconds: parseFloat(((Date.now() - this.startTime) / 1000).toFixed(2)),
    };
  }
}
