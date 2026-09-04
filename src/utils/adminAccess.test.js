import { canAccess } from './adminAccess';

describe('delegated admin UI access', () => {
  test('full admins may use every console capability', () => {
    expect(canAccess({ role: 'admin', permissions: [] }, 'balances.manage')).toBe(true);
  });

  test('sub-admin access is explicit and same-resource manage includes view', () => {
    const access = { role: 'sub_admin', permissions: ['bots.manage'] };
    expect(canAccess(access, 'bots.manage')).toBe(true);
    expect(canAccess(access, 'bots.view')).toBe(true);
    expect(canAccess(access, 'games.view')).toBe(false);
    expect(canAccess(access, 'balances.manage')).toBe(false);
  });

  test('players do not receive console access', () => {
    expect(canAccess({ role: 'user', permissions: ['bots.manage'] }, 'bots.manage')).toBe(false);
  });
});
