import type { DomainHandler, DomainName } from '../utils/types.js';

const domainCache = new Map<DomainName, DomainHandler>();

export async function getDomainHandler(domain: DomainName): Promise<DomainHandler> {
  const cached = domainCache.get(domain);
  if (cached) return cached;

  let handler: DomainHandler;
  switch (domain) {
    case 'customers': {
      const { customersHandler } = await import('./customers.js');
      handler = customersHandler;
      break;
    }
    case 'invoicing': {
      const { invoicingHandler } = await import('./invoicing.js');
      handler = invoicingHandler;
      break;
    }
    case 'payments': {
      const { paymentsHandler } = await import('./payments.js');
      handler = paymentsHandler;
      break;
    }
    case 'webhooks': {
      const { webhooksHandler } = await import('./webhooks.js');
      handler = webhooksHandler;
      break;
    }
    default:
      throw new Error(`Unknown domain: ${domain}`);
  }

  domainCache.set(domain, handler);
  return handler;
}
