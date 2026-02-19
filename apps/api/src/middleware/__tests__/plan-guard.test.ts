import { describe, it, expect } from 'vitest';
import { invalidatePlanCache } from '../plan-guard';

describe('plan-guard', () => {
  it('invalidatePlanCache does not throw', () => {
    expect(() => invalidatePlanCache('test-org-id')).not.toThrow();
  });
});
