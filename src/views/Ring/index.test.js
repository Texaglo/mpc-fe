import { Ring, normalizeFormData } from './index';

function form() {
    const component = new Ring({ getAllRingGames: jest.fn(), getAllTemplates: jest.fn(), getSettings: jest.fn(), setLoader: jest.fn(), settings: [] });
    component.setState = update => { component.state = { ...component.state, ...(typeof update === 'function' ? update(component.state) : update) }; };
    return component;
}

test.each(['FP', 'CASH'])('Omaha selection and payload enforce Pot Limit in %s', balanceType => {
    const component = form();
    component.handleFormChange({ target: { name: 'balanceType', value: balanceType } });
    component.handleFormChange({ target: { name: 'gameVariant', value: 'Omaha' } });
    expect(component.state.formData.formatLimit).toBe('Pot Limit');
    component.state.formData.formatLimit = 'No Limit'; // Old template cannot defeat payload normalization.
    expect(component.buildPayload()).toMatchObject({ gameVariant: 'Omaha', formatLimit: 'Pot Limit', balanceType });
    if (balanceType === 'FP') expect(component.buildPayload().timeChargeTier).toBe('NONE');
});

test('loading an older Omaha table or template repairs the betting-limit form value', () => {
    expect(normalizeFormData({ gameVariant: 'Omaha', formatLimit: 'No Limit' }).formatLimit).toBe('Pot Limit');
});

test('switching back to Holdem selects No Limit', () => {
    const component = form();
    component.handleFormChange({ target: { name: 'gameVariant', value: 'Omaha' } });
    component.handleFormChange({ target: { name: 'gameVariant', value: "Texas Hold'em" } });
    expect(component.buildPayload()).toMatchObject({ gameVariant: "Texas Hold'em", formatLimit: 'No Limit' });
});

test('time-bank admin toggle sends configured seconds when enabled and zero when disabled', () => {
    const component = form();
    component.handleFormChange({ target: { name: 'timeBankEnabled', type: 'checkbox', checked: true } });
    expect(component.buildPayload().timeBankSeconds).toBe(30);
    component.handleFormChange({ target: { name: 'timeBankSeconds', value: '45' } });
    expect(component.buildPayload().timeBankSeconds).toBe(45);
    component.handleFormChange({ target: { name: 'timeBankEnabled', type: 'checkbox', checked: false } });
    expect(component.buildPayload().timeBankSeconds).toBe(0);
    expect(normalizeFormData({ timeBankSeconds: 45 }).timeBankEnabled).toBe(true);
    expect(normalizeFormData({ timeBankSeconds: 0 }).timeBankEnabled).toBe(false);
});

test('ORAO rate survives switching off without overwriting the ordinary custom rate', () => {
    const component = form();
    component.state.formData = normalizeFormData({ randomnessProvider: 'ORAO', oraoTimeChargeMpcePerHour: 30,
        timeChargeTier: 'CUSTOM', timeChargeMpcePerHour: 20, balanceType: 'CASH' });
    expect(component.buildPayload()).toMatchObject({ randomnessProvider: 'ORAO', oraoTimeChargeMpcePerHour: 30, timeChargeMpcePerHour: 20 });
    component.handleFormChange({ target: { name: 'randomnessProvider', value: 'CSPRNG' } });
    expect(component.buildPayload()).toMatchObject({ randomnessProvider: 'CSPRNG', oraoTimeChargeMpcePerHour: 30, timeChargeMpcePerHour: 20 });
});
test('ORAO enabled on FP preserves no-burn contract', () => {
    const component = form();
    component.state.formData = normalizeFormData({ randomnessProvider: 'ORAO', oraoTimeChargeMpcePerHour: 50, balanceType: 'FP' });
    expect(component.buildPayload()).toMatchObject({ consumesTime: false, timeChargeEnabled: false, timeChargeTier: 'NONE', timeChargeMinutesPerHour: 0 });
});
test('ORAO enabling requires an explicit rate but zero sponsorship is allowed', () => {
    const component = form();
    const payload = { name: 'Test', gameVariant: 'Omaha', formatLimit: 'Pot Limit', region: 'us', seatLimit: 6,
        minPlayersToStart: 2, smallBlinds: 1, bigBlinds: 2, minBuyIn: 10, maxBuyIn: 100, idleSeatClearMinutes: 30,
        randomnessProvider: 'ORAO', oraoTimeChargeMpcePerHour: null };
    expect(component.validatePayload(payload)).toMatch(/ORAO/);
    expect(component.validatePayload({ ...payload, oraoTimeChargeMpcePerHour: 0 })).toBe('');
});
