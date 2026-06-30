import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { InvoiceLineItem } from '@wyre-technology/node-alternative-payments';
import type { CallToolResult, DomainHandler } from '../utils/types.js';
import { getClient } from '../utils/client.js';
import { confirmOrAbort } from '../elicitation/confirm.js';

function ok(data: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function getTools(): Tool[] {
  return [
    {
      name: 'ap_list_invoices',
      description: 'List invoices, optionally filtered by status or customer.',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Filter by invoice status.' },
          customer_id: { type: 'string', description: 'Filter by customer id.' },
          limit: { type: 'number' },
          after: { type: 'string', description: 'Pagination cursor.' },
        },
      },
      annotations: { title: 'List invoices', readOnlyHint: true, openWorldHint: true },
    },
    {
      name: 'ap_get_invoice',
      description: 'Retrieve a single invoice by id.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Invoice id.' } },
        required: ['id'],
      },
      annotations: { title: 'Get invoice', readOnlyHint: true, openWorldHint: true },
    },
    {
      name: 'ap_get_invoice_payment_link',
      description: 'Get the hosted payment link for an invoice.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Invoice id.' } },
        required: ['id'],
      },
      annotations: {
        title: 'Get invoice payment link',
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    {
      name: 'ap_get_invoice_pdf_link',
      description: 'Get a signed PDF download link for an invoice.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Invoice id.' } },
        required: ['id'],
      },
      annotations: {
        title: 'Get invoice PDF link',
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    {
      name: 'ap_create_invoice',
      description: 'Create an invoice with line items.',
      inputSchema: {
        type: 'object',
        properties: {
          customer_id: { type: 'string' },
          currency: { type: 'string', description: 'ISO currency code, e.g. USD.' },
          due_date: { type: 'string', description: 'Due date (YYYY-MM-DD).' },
          line_items: {
            type: 'array',
            description: 'Invoice line items.',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                amount: { type: 'number' },
                quantity: { type: 'number' },
              },
              required: ['description', 'amount'],
            },
          },
        },
        required: ['customer_id', 'currency', 'due_date', 'line_items'],
      },
      annotations: {
        title: 'Create invoice',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    {
      name: 'ap_create_payment_request',
      description:
        'Create a one-time payment request, returning a hosted checkout link. ' +
        'This does not charge anyone — it produces a URL the customer can visit to pay.',
      inputSchema: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Amount to request.' },
          currency: { type: 'string', description: 'ISO currency code, e.g. USD.' },
          redirect_url: {
            type: 'string',
            description: 'URL to redirect the customer to after payment.',
          },
          reference_id: { type: 'string', description: 'Optional reference id.' },
        },
        required: ['amount', 'currency', 'redirect_url'],
      },
      annotations: {
        title: 'Create payment request',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    {
      name: 'ap_get_payment_request',
      description: 'Retrieve a payment request and its current status.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Payment request id.' } },
        required: ['id'],
      },
      annotations: {
        title: 'Get payment request',
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    {
      name: 'ap_archive_invoice',
      description:
        '⚠ HIGH-IMPACT. Archives an invoice. Confirm with the user before invoking.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Invoice id to archive.' } },
        required: ['id'],
      },
      annotations: {
        title: 'Archive invoice (high-impact)',
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
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
    case 'ap_list_invoices':
      return ok(
        await client.invoices.list({
          status: args.status as string | undefined,
          customer_id: args.customer_id as string | undefined,
          limit: args.limit as number | undefined,
          after: args.after as string | undefined,
        }),
      );
    case 'ap_get_invoice':
      return ok(await client.invoices.get(args.id as string));
    case 'ap_get_invoice_payment_link':
      return ok(await client.invoices.getPaymentLink(args.id as string));
    case 'ap_get_invoice_pdf_link':
      return ok(await client.invoices.getPdfLink(args.id as string));
    case 'ap_create_invoice':
      return ok(
        await client.invoices.create({
          customer_id: args.customer_id as string,
          currency: args.currency as string,
          due_date: args.due_date as string,
          line_items: args.line_items as InvoiceLineItem[],
        }),
      );
    case 'ap_create_payment_request':
      return ok(
        await client.paymentRequests.create({
          amount: args.amount as number,
          currency: args.currency as string,
          redirect_url: args.redirect_url as string,
          reference_id: args.reference_id as string | undefined,
        }),
      );
    case 'ap_get_payment_request':
      return ok(await client.paymentRequests.get(args.id as string));
    case 'ap_archive_invoice': {
      const abort = await confirmOrAbort(`Archive invoice ${args.id as string}?`);
      if (abort) return abort;
      await client.invoices.archive(args.id as string);
      return ok({ archived: true, id: args.id });
    }
    default:
      return {
        content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
        isError: true,
      };
  }
}

export const invoicingHandler: DomainHandler = { getTools, handleCall };
