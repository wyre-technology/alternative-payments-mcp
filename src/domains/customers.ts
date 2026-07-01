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
      name: 'ap_list_customers',
      description: 'List customers (cursor paginated).',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max results to return.' },
          after: { type: 'string', description: 'Pagination cursor.' },
        },
      },
      annotations: { title: 'List customers', readOnlyHint: true, openWorldHint: true },
    },
    {
      name: 'ap_get_customer',
      description: 'Retrieve a single customer by id.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Customer id.' } },
        required: ['id'],
      },
      annotations: { title: 'Get customer', readOnlyHint: true, openWorldHint: true },
    },
    {
      name: 'ap_list_customer_users',
      description: 'List users associated with a customer.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Customer id.' } },
        required: ['id'],
      },
      annotations: {
        title: 'List customer users',
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    {
      name: 'ap_create_customer',
      description: 'Create a new customer.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Customer name.' },
          email: { type: 'string', description: 'Customer email.' },
        },
        required: ['name', 'email'],
      },
      annotations: {
        title: 'Create customer',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    {
      name: 'ap_add_customer_user',
      description: 'Add a user to a customer account.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Customer id.' },
          email: { type: 'string' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
        },
        required: ['id', 'email', 'first_name', 'last_name'],
      },
      annotations: {
        title: 'Add customer user',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    {
      name: 'ap_archive_customer',
      description:
        '⚠ HIGH-IMPACT. Archives (soft-deletes) a customer. The customer will ' +
        'no longer appear in active lists. Confirm with the user before invoking.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Customer id to archive.' } },
        required: ['id'],
      },
      annotations: {
        title: 'Archive customer (high-impact)',
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
    case 'ap_list_customers':
      return ok(
        await client.customers.list({
          limit: args.limit as number | undefined,
          after: args.after as string | undefined,
        }),
      );
    case 'ap_get_customer':
      return ok(await client.customers.get(args.id as string));
    case 'ap_list_customer_users':
      return ok(await client.customers.listUsers(args.id as string));
    case 'ap_create_customer':
      return ok(
        await client.customers.create({
          name: args.name as string,
          email: args.email as string,
        }),
      );
    case 'ap_add_customer_user':
      return ok(
        await client.customers.addUser(args.id as string, {
          email: args.email as string,
          first_name: args.first_name as string,
          last_name: args.last_name as string,
        }),
      );
    case 'ap_archive_customer': {
      const abort = await confirmOrAbort(
        `Archive customer ${args.id as string}?`,
      );
      if (abort) return abort;
      await client.customers.archive(args.id as string);
      return ok({ archived: true, id: args.id });
    }
    default:
      return {
        content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
        isError: true,
      };
  }
}

export const customersHandler: DomainHandler = { getTools, handleCall };
