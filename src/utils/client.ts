import { AsyncLocalStorage } from 'node:async_hooks';
import {
  AlternativePaymentsClient,
  type Environment,
} from '@wyre-technology/node-alternative-payments';
import { logger } from './logger.js';

export interface Credentials {
  clientId: string;
  clientSecret: string;
  environment: Environment;
}

// Request-scoped credential store. In gateway mode the HTTP layer runs each
// request inside runWithCredentials({clientId, clientSecret, environment});
// getCredentials() reads it first, then falls back to process.env for
// stdio/single-tenant mode.
const credStore = new AsyncLocalStorage<Credentials>();

export function runWithCredentials<T>(creds: Credentials, fn: () => T): T {
  return credStore.run(creds, fn);
}

export function getCredentials(): Credentials | null {
  const scoped = credStore.getStore();
  if (scoped?.clientId && scoped?.clientSecret && scoped?.environment) return scoped;

  const clientId = process.env.ALTERNATIVE_PAYMENTS_CLIENT_ID;
  const clientSecret = process.env.ALTERNATIVE_PAYMENTS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    logger.warn('Missing credentials', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
    });
    return null;
  }
  const env = (process.env.ALTERNATIVE_PAYMENTS_ENVIRONMENT || 'production').toLowerCase();
  const environment: Environment = env === 'demo' ? 'demo' : 'production';
  return { clientId, clientSecret, environment };
}

// Constructs a client from the request-scoped (or env) credentials. The client
// is cheap and holds no shared mutable state, so we build one per call — never
// a process-global singleton.
export function getClient(): AlternativePaymentsClient {
  const creds = getCredentials();
  if (!creds) {
    throw new Error(
      'No Alternative Payments credentials configured. Set ALTERNATIVE_PAYMENTS_CLIENT_ID, ALTERNATIVE_PAYMENTS_CLIENT_SECRET, and ALTERNATIVE_PAYMENTS_ENVIRONMENT.',
    );
  }
  logger.debug('Building Alternative Payments API client', {
    environment: creds.environment,
  });
  return new AlternativePaymentsClient(creds);
}
