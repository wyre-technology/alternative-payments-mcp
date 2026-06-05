import {
  AlternativePaymentsClient,
  type Environment,
} from '@wyre-technology/node-alternative-payments';
import { logger } from './logger.js';

let _client: AlternativePaymentsClient | null = null;
let _credKey: string | null = null;

export interface Credentials {
  clientId: string;
  clientSecret: string;
  environment: Environment;
}

export function getCredentials(): Credentials | null {
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

export async function getClient(): Promise<AlternativePaymentsClient> {
  const creds = getCredentials();
  if (!creds) {
    throw new Error(
      'No Alternative Payments credentials configured. Set ALTERNATIVE_PAYMENTS_CLIENT_ID and ALTERNATIVE_PAYMENTS_CLIENT_SECRET.',
    );
  }

  // Invalidate the cached client if the gateway injected different credentials.
  const key = `${creds.clientId}:${creds.clientSecret}:${creds.environment}`;
  if (_client && _credKey !== key) {
    _client = null;
  }

  if (!_client) {
    _client = new AlternativePaymentsClient(creds);
    _credKey = key;
    logger.info('Created Alternative Payments API client', {
      environment: creds.environment,
    });
  }
  return _client;
}

export function resetClient(): void {
  _client = null;
  _credKey = null;
}
