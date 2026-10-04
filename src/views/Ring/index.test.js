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
