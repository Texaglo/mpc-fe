export function buildBalanceAdjustmentPayload(payload = {}) {
    const asset = String(payload.asset || 'CASH').toUpperCase();

    return {
        userId: payload.userId,
        amount: payload.amount,
        reason: payload.reason,
        asset,
        ...(asset === 'CASH' && payload.network
            ? { network: payload.network }
            : {})
    };
}
