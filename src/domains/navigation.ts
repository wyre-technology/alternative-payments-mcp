import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { DomainName } from '../utils/types.js';

export const DOMAINS: DomainName[] = [
  'customers',
  'invoicing',
  'payments',
  'webhooks',
];

export function getNavigationTools(): Tool[] {
  return [
    {
      name: 'ap_navigate',
      description:
        'Discover available Alternative Payments tools by domain. All tools are ' +
        'callable at any time — this is a help/discovery aid, not a prerequisite.',
      inputSchema: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            enum: DOMAINS,
            description: `The domain to explore:
- customers: list/get/create/archive customers and manage their users
- invoicing: invoices, payment & PDF links, and hosted payment requests
- payments: read-only transactions and payouts (no money movement)
- webhooks: manage webhook subscriptions and inspect delivery history`,
          },
        },
        required: ['domain'],
      },
      annotations: { title: 'Navigate domains', readOnlyHint: true },
    },
    {
      name: 'ap_status',
      description:
        'Check Alternative Payments API connection status and available domains.',
      inputSchema: { type: 'object', properties: {} },
      annotations: { title: 'Connection status', readOnlyHint: true },
    },
  ];
}
