import { describe, expect, it } from 'vitest';
import { getNavigationTools, DOMAINS } from '../domains/navigation.js';
import { getDomainHandler } from '../domains/index.js';

async function allTools() {
  const tools = [...getNavigationTools()];
  for (const domain of DOMAINS) {
    const handler = await getDomainHandler(domain);
    tools.push(...handler.getTools());
  }
  return tools;
}

describe('tool surface', () => {
  it('exposes navigation tools plus every domain tool', async () => {
    const names = (await allTools()).map((t) => t.name);
    expect(names).toContain('ap_navigate');
    expect(names).toContain('ap_status');
    // Spot-check one tool per domain.
    expect(names).toContain('ap_list_customers');
    expect(names).toContain('ap_create_invoice');
    expect(names).toContain('ap_list_payouts');
    expect(names).toContain('ap_list_webhooks');
  });

  it('does NOT expose any direct payment-creation tool', async () => {
    const names = (await allTools()).map((t) => t.name);
    expect(names).not.toContain('ap_create_payment');
    expect(names.some((n) => /create_payment$/.test(n))).toBe(false);
  });

  it('marks exactly the three destructive tools with destructiveHint', async () => {
    const destructive = (await allTools())
      .filter((t) => t.annotations?.destructiveHint === true)
      .map((t) => t.name)
      .sort();
    expect(destructive).toEqual([
      'ap_archive_customer',
      'ap_archive_invoice',
      'ap_delete_webhook',
    ]);
  });

  it('destructive tool descriptions instruct confirmation', async () => {
    const destructive = (await allTools()).filter(
      (t) => t.annotations?.destructiveHint === true,
    );
    for (const t of destructive) {
      expect(t.description).toMatch(/Confirm with the user before invoking\./);
    }
  });

  it('read-only tools carry no destructive warning prefix', async () => {
    const readOnly = (await allTools()).filter(
      (t) => t.annotations?.readOnlyHint === true,
    );
    for (const t of readOnly) {
      expect(t.description ?? '').not.toMatch(/⚠/);
    }
  });
});
