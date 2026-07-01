/**
 * Tests for request-scoped credential isolation via AsyncLocalStorage.
 *
 * Validates:
 *   - ALS-scoped credentials take precedence over process.env
 *   - Credentials do NOT leak out of their ALS context
 *   - Partial credential sets (any of the 3 fields missing) fall back to env, not ALS
 *   - Concurrent requests for two different tenants never contaminate each other
 */
import { describe, it, expect, afterEach } from 'vitest';
import { runWithCredentials, getCredentials } from '../utils/client.js';
import type { Credentials } from '../utils/client.js';

const TENANT_A: Credentials = {
  clientId: 'client-a',
  clientSecret: 'secret-a',
  environment: 'production',
};
const TENANT_B: Credentials = {
  clientId: 'client-b',
  clientSecret: 'secret-b',
  environment: 'demo',
};

afterEach(() => {
  delete process.env.ALTERNATIVE_PAYMENTS_CLIENT_ID;
  delete process.env.ALTERNATIVE_PAYMENTS_CLIENT_SECRET;
  delete process.env.ALTERNATIVE_PAYMENTS_ENVIRONMENT;
});

// Helper: capture getCredentials() inside an ALS context
function captureInContext(creds: Credentials): Credentials | null {
  let captured: Credentials | null = null;
  runWithCredentials(creds, () => {
    captured = getCredentials();
  });
  return captured;
}

describe('getCredentials — ALS precedence', () => {
  it('returns ALS-scoped credentials when all three fields are present', () => {
    const result = captureInContext(TENANT_A);
    expect(result).toEqual(TENANT_A);
  });

  it('ALS credentials override process.env', () => {
    process.env.ALTERNATIVE_PAYMENTS_CLIENT_ID = 'env-client';
    process.env.ALTERNATIVE_PAYMENTS_CLIENT_SECRET = 'env-secret';
    process.env.ALTERNATIVE_PAYMENTS_ENVIRONMENT = 'production';

    const result = captureInContext(TENANT_A);
    expect(result).toEqual(TENANT_A);
    expect(result?.clientId).toBe('client-a');
  });
});

describe('getCredentials — no-leak-out', () => {
  it('returns null outside an ALS context when env is not set', () => {
    const result = getCredentials();
    expect(result).toBeNull();
  });

  it('does not leak ALS credentials outside the run() callback', () => {
    runWithCredentials(TENANT_A, () => {
      // inside context — intentionally empty
    });
    // Outside the callback, no env vars → null
    const result = getCredentials();
    expect(result).toBeNull();
  });

  it('falls back to process.env outside an ALS context', () => {
    process.env.ALTERNATIVE_PAYMENTS_CLIENT_ID = 'env-client';
    process.env.ALTERNATIVE_PAYMENTS_CLIENT_SECRET = 'env-secret';
    // No ALTERNATIVE_PAYMENTS_ENVIRONMENT → defaults to 'production'
    const result = getCredentials();
    expect(result).toEqual({
      clientId: 'env-client',
      clientSecret: 'env-secret',
      environment: 'production',
    });
  });
});

describe('getCredentials — partial credentials fall back to env (not ALS)', () => {
  it('falls back to env when ALS clientId is empty', () => {
    process.env.ALTERNATIVE_PAYMENTS_CLIENT_ID = 'env-client';
    process.env.ALTERNATIVE_PAYMENTS_CLIENT_SECRET = 'env-secret';

    const result = captureInContext({
      clientId: '',
      clientSecret: 'secret-a',
      environment: 'production',
    });
    // empty clientId fails the AND-guard → falls back to env
    expect(result?.clientId).toBe('env-client');
  });

  it('falls back to env when ALS clientSecret is empty', () => {
    process.env.ALTERNATIVE_PAYMENTS_CLIENT_ID = 'env-client';
    process.env.ALTERNATIVE_PAYMENTS_CLIENT_SECRET = 'env-secret';

    const result = captureInContext({
      clientId: 'client-a',
      clientSecret: '',
      environment: 'production',
    });
    expect(result?.clientSecret).toBe('env-secret');
  });

  it('returns null when ALS environment is falsy and env not set', () => {
    // environment is the third required field; empty string fails the AND-guard
    const result = captureInContext({
      clientId: 'client-a',
      clientSecret: 'secret-a',
      environment: '' as 'production',
    });
    // empty environment fails the AND-guard; no env fallback → null
    expect(result).toBeNull();
  });
});

describe('getCredentials — concurrent two-tenant isolation', () => {
  it('two concurrent contexts return their own credentials without contamination', async () => {
    const taskA = new Promise<Credentials | null>((resolve) => {
      runWithCredentials(TENANT_A, async () => {
        await Promise.resolve(); // yield so both tasks overlap
        resolve(getCredentials());
      });
    });

    const taskB = new Promise<Credentials | null>((resolve) => {
      runWithCredentials(TENANT_B, async () => {
        await Promise.resolve();
        resolve(getCredentials());
      });
    });

    const [resultA, resultB] = await Promise.all([taskA, taskB]);

    expect(resultA).toEqual(TENANT_A);
    expect(resultB).toEqual(TENANT_B);

    // Explicit cross-field contamination checks for all three credential fields
    expect(resultA?.clientId).toBe('client-a');
    expect(resultB?.clientId).toBe('client-b');
    expect(resultA?.clientSecret).toBe('secret-a');
    expect(resultB?.clientSecret).toBe('secret-b');
    expect(resultA?.environment).toBe('production');
    expect(resultB?.environment).toBe('demo');
  });

  it('many concurrent requests each see their own credentials', async () => {
    const tenants: Credentials[] = Array.from({ length: 10 }, (_, i) => ({
      clientId: `client-${i}`,
      clientSecret: `secret-${i}`,
      environment: (i % 2 === 0 ? 'production' : 'demo') as Credentials['environment'],
    }));

    const results = await Promise.all(
      tenants.map(
        (tenant) =>
          new Promise<Credentials | null>((resolve) => {
            runWithCredentials(tenant, async () => {
              await Promise.resolve();
              resolve(getCredentials());
            });
          }),
      ),
    );

    for (let i = 0; i < tenants.length; i++) {
      expect(results[i]).toEqual(tenants[i]);
    }
  });
});
