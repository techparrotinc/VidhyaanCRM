import { getAlertChannels } from '@/lib/platform-config'

/**
 * Post a platform ops alert to the configured Slack Incoming Webhook.
 * Fire-and-forget: never awaited on a critical path, never throws. No-op when
 * no webhook URL is configured (admin settings → env fallback).
 */
export function postSlackAlert(text: string): void {
  getAlertChannels()
    .then(({ slackWebhookUrl }) => {
      if (!slackWebhookUrl) return
      return fetch(slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
    })
    .catch(() => {
      /* best-effort */
    })
}
