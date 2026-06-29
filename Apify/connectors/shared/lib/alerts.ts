export interface AlertConfig {
  githubToken?: string;
  githubRepo?: string;   // format: "owner/repo"
  slackWebhook?: string;
}

async function createGitHubIssue(
  config: AlertConfig,
  title: string,
  body: string
): Promise<void> {
  if (!config.githubToken || !config.githubRepo) return;
  const [owner, repo] = config.githubRepo.split('/');
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.githubToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({ title, body, labels: ['connector-failure'] }),
  });
  if (!res.ok) {
    console.error(`[alerts] GitHub issue creation failed: ${res.status} ${await res.text()}`);
  }
}

async function sendSlackAlert(webhookUrl: string, message: string): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  });
  if (!res.ok) {
    console.error(`[alerts] Slack alert failed: ${res.status}`);
  }
}

export async function alertOnFailure(
  config: AlertConfig,
  connectorId: string,
  error: string
): Promise<void> {
  const title = `[${connectorId}] Persistent connector failure — manual review needed`;
  const body = [
    `**Connector:** \`${connectorId}\``,
    `**Error:** \`${error}\``,
    '',
    'This connector hit max retries and has been paused. No further scraping will occur until you intervene.',
    '',
    '**Next steps:**',
    '1. Check proxy / API key rotation if this is a 429 / auth error.',
    '2. Re-enable the connector run once resolved.',
  ].join('\n');

  await Promise.allSettled([
    createGitHubIssue(config, title, body),
    config.slackWebhook
      ? sendSlackAlert(config.slackWebhook, `🚨 *${title}*\n\n${error}`)
      : Promise.resolve(),
  ]);
}
