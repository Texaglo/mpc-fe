import { withTableEconomyContract } from './tableEconomy';

describe('table economy payload contract', () => {
    it('makes every FP table explicitly non-burning', () => {
        expect(withTableEconomyContract({
            balanceType: 'FP',
            timeChargeTier: 'CUSTOM',
            timeChargeMinutesPerHour: 120,
            timeChargeMpcePerHour: 20,
        })).toEqual(expect.objectContaining({
            balanceType: 'FP',
            timeChargeTier: 'NONE',
            timeChargeMinutesPerHour: 0,
            timeChargeMpcePerHour: null,
            consumesTime: false,
            timeChargeEnabled: false,
        }));
    });

    it('keeps the existing paid-table time policy', () => {
        expect(withTableEconomyContract({ balanceType: 'CASH', timeChargeTier: 'STANDARD' }))
            .toEqual(expect.objectContaining({ consumesTime: true, timeChargeEnabled: true }));
        expect(withTableEconomyContract({ balanceType: 'CASH', timeChargeTier: 'NONE' }))
            .toEqual(expect.objectContaining({ consumesTime: false, timeChargeEnabled: false }));
    });
});
