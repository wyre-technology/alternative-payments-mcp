import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { CallToolResult, DomainHandler } from '../utils/types.js';
import { getClient } from '../utils/client.js';
import { confirmOrAbort } from '../elicitation/confirm.js';

function ok(data: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function getTools(): Tool[] {
  return [
    {
      name: 'ap_list_webhooks',
      description: 'List webhook subscriptions.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number' },
          topic: { type: 'string', description: 'Filter by topic.' },
        },
      },
      annotations: { title: 'List webhooks', readOnlyHint: true, openWorldHint: true },
    },
    {
      name: 'ap_list_webhook_events',
      description: 'View webhook delivery history.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number' },
          status: { type: 'string', description: 'Filter by delivery status.' },
        },
      },
      annotations: {
        title: 'List webhook events',
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    {
      name: 'ap_create_webhook',
      description: 'Subscribe to a webhook topic.',
      inputSchema: {
        type: 'object',
        properties: {
          endpoint_url: { type: 'string', description: 'Destination URL.' },
          topic: { type: 'string', description: 'Topic to subscribe to.' },
        },
        required: ['endpoint_url', 'topic'],
      },
      annotations: {
        title: 'Create webhook',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    {
      name: 'ap_retry_webhooks',
      description: 'Resume failed webhook delivery.',
      inputSchema: { type: 'object', properties: {} },
      annotations: {
        title: 'Retry webhook delivery',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    {
      name: 'ap_delete_webhook',
      description:
        '⚠ DESTRUCTIVE — IRREVERSIBLE. Permanently unsubscribes a webhook. ' +
        'Future events for this subscription will no longer be delivered. ' +
        'This action cannot be undone. Confirm with the user before invoking.',
      inputSchema: {
        type: 'object',
        properties: {
          subscription_id: {
            type: 'string',
            description: 'Webhook subscription id to delete.',
          },
        },
        required: ['subscription_id'],
      },
      annotations: {
        title: 'Delete webhook (irreversible)',
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
  ];
}

async function handleCall(
  toolName: string,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const client = getClient();
  switch (toolName) {
    case 'ap_list_webhooks':
      return ok(
        await client.webhooks.list({
          limit: args.limit as number | undefined,
          topic: args.topic as string | undefined,
        }),
      );
    case 'ap_list_webhook_events':
      return ok(
        await client.webhooks.listEvents({
          limit: args.limit as number | undefined,
          status: args.status as string | undefined,
        }),
      );
    case 'ap_create_webhook':
      return ok(
        await client.webhooks.create({
          endpoint_url: args.endpoint_url as string,
          topic: args.topic as string,
        }),
      );
    case 'ap_retry_webhooks':
      await client.webhooks.retry();
      return ok({ retried: true });
    case 'ap_delete_webhook': {
      const abort = await confirmOrAbort(
        `Permanently delete webhook subscription ${args.subscription_id as string}?`,
      );
      if (abort) return abort;
      await client.webhooks.delete(args.subscription_id as string);
      return ok({ deleted: true, subscription_id: args.subscription_id });
    }
    default:
      return {
        content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
        isError: true,
      };
  }
}

export const webhooksHandler: DomainHandler = { getTools, handleCall };
