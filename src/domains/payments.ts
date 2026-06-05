import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { CallToolResult, DomainHandler } from '../utils/types.js';
import { getClient } from '../utils/client.js';

function ok(data: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

/**
 * Read-only payments domain: transactions and payouts.
 *
 * Note: there is intentionally no "create payment" tool. The SDK does not
 * expose direct money movement, so it cannot be surfaced here.
 */
function getTools(): Tool[] {
  return [
    {
      name: 'ap_list_transactions',
      description:
        'List payment transactions with optional filters (type, status, customer, ' +
        'invoice, payment method, date range).',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number' },
          after: { type: 'string', description: 'Cursor (forward).' },
          before: { type: 'string', description: 'Cursor (backward).' },
          type: { type: 'string' },
          status: { type: 'string' },
          customer_id: { type: 'string' },
          invoice_id: { type: 'string' },
          payment_method: {
            type: 'string',
            description: 'e.g. card or standard_ach.',
          },
          created_at_start: { type: 'string', description: 'RFC3339 timestamp.' },
          created_at_end: { type: 'string', description: 'RFC3339 timestamp.' },
        },
      },
      annotations: {
        title: 'List transactions',
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    {
      name: 'ap_get_transaction',
      description: 'Retrieve a single transaction by id.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Transaction id.' } },
        required: ['id'],
      },
      annotations: {
        title: 'Get transaction',
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    {
      name: 'ap_list_payouts',
      description: 'List payout batches.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number' },
          after: { type: 'string', description: 'Pagination cursor.' },
        },
      },
      annotations: { title: 'List payouts', readOnlyHint: true, openWorldHint: true },
    },
    {
      name: 'ap_get_payout',
      description: 'Retrieve a single payout by id.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Payout id.' } },
        required: ['id'],
      },
      annotations: { title: 'Get payout', readOnlyHint: true, openWorldHint: true },
    },
    {
      name: 'ap_list_payout_transactions',
      description: 'List the transactions included in a payout.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Payout id.' } },
        required: ['id'],
      },
      annotations: {
        title: 'List payout transactions',
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
  ];
}

async function handleCall(
  toolName: string,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const client = await getClient();
  switch (toolName) {
    case 'ap_list_transactions':
      return ok(await client.transactions.list(args));
    case 'ap_get_transaction':
      return ok(await client.transactions.get(args.id as string));
    case 'ap_list_payouts':
      return ok(
        await client.payouts.list({
          limit: args.limit as number | undefined,
          after: args.after as string | undefined,
        }),
      );
    case 'ap_get_payout':
      return ok(await client.payouts.get(args.id as string));
    case 'ap_list_payout_transactions':
      return ok(await client.payouts.listTransactions(args.id as string));
    default:
      return {
        content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
        isError: true,
      };
  }
}

export const paymentsHandler: DomainHandler = { getTools, handleCall };
