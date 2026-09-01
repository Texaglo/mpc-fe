import { buildBalanceAdjustmentPayload } from './userPayloads';

describe('buildBalanceAdjustmentPayload', () => {
    it.each(['mainnet-beta', 'devnet'])('preserves the selected %s cash network', network => {
        expect(buildBalanceAdjustmentPayload({
            userId: 'player-1',
            amount: 25,
            reason: 'test credit',
            asset: 'CASH',
            network
        })).toEqual({
            userId: 'player-1',
            amount: 25,
            reason: 'test credit',
            asset: 'CASH',
            network
        });
    });

    it('does not attach a cash network to MPCE or FP adjustments', () => {
        expect(buildBalanceAdjustmentPayload({
            userId: 'player-1',
            amount: 10,
            reason: 'test credit',
            asset: 'FP',
            network: 'mainnet-beta'
        })).toEqual({
            userId: 'player-1',
            amount: 10,
            reason: 'test credit',
            asset: 'FP'
        });
    });
});
