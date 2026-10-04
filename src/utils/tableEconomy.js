export const withTableEconomyContract = (source = {}) => {
    const payload = { ...source };
    const balanceType = String(payload.balanceType || 'CASH').toUpperCase();
    const freePlay = balanceType === 'FP';

    payload.balanceType = balanceType;
    payload.consumesTime = !freePlay && (payload.randomnessProvider === 'ORAO' ? Number(payload.oraoTimeChargeMpcePerHour) > 0 : String(payload.timeChargeTier || 'STANDARD').toUpperCase() !== 'NONE');
    payload.timeChargeEnabled = payload.consumesTime;

    if (freePlay) {
        payload.timeChargeTier = 'NONE';
        payload.timeChargeMinutesPerHour = 0;
        payload.timeChargeMpcePerHour = null;
        payload.consumesTime = false;
        payload.timeChargeEnabled = false;
    }

    return payload;
};
