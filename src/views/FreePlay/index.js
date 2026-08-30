import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import EventBus from 'eventing-bus';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { setLoader } from '../../store/actions/Auth';
import './index.css';

const DEFAULT_SETTINGS = {
    enabled: true,
    purchasesEnabled: false,
    signupBonus: 1000,
    tokensPerUsd: 1,
    minPurchaseUsd: 10,
    maxPurchaseUsd: 1000,
    dailyBonuses: [],
};

const EMPTY_LEDGER = {
    entries: [],
    summary: { outstandingFp: 0, nonWithdrawable: true },
    pagination: { currentPage: 1, totalPages: 1, total: 0, limit: 25 },
};

const unwrapError = error => error?.response?.data?.message || error?.message || 'Request failed';
const formatNumber = value => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 6 });
const formatDate = value => value ? new Date(value).toLocaleString() : '—';
const dateInput = value => value ? new Date(value).toISOString().slice(0, 10) : '';
const todayInput = () => new Date().toISOString().slice(0, 10);

const normalizeBonus = bonus => ({
    ...(bonus?._id ? { _id: bonus._id } : {}),
    name: bonus?.name || 'Daily login bonus',
    amount: Number(bonus?.amount || 0),
    startsAt: dateInput(bonus?.startsAt) || todayInput(),
    endsAt: dateInput(bonus?.endsAt),
    enabled: bonus?.enabled !== false,
});

const normalizeSettings = body => {
    const source = body?.settings || body?.config || body || {};
    return {
        enabled: source.enabled !== false,
        purchasesEnabled: Boolean(source.purchasesEnabled),
        signupBonus: Number(source.signupBonus ?? DEFAULT_SETTINGS.signupBonus),
        tokensPerUsd: Number(source.tokensPerUsd ?? DEFAULT_SETTINGS.tokensPerUsd),
        minPurchaseUsd: Number(source.minPurchaseUsd ?? DEFAULT_SETTINGS.minPurchaseUsd),
        maxPurchaseUsd: Number(source.maxPurchaseUsd ?? DEFAULT_SETTINGS.maxPurchaseUsd),
        dailyBonuses: Array.isArray(source.dailyBonuses) ? source.dailyBonuses.map(normalizeBonus) : [],
    };
};

const normalizeLedger = body => {
    const source = body?.ledger || body || {};
    return {
        entries: Array.isArray(source.entries) ? source.entries : [],
        summary: { ...EMPTY_LEDGER.summary, ...(source.summary || {}) },
        pagination: { ...EMPTY_LEDGER.pagination, ...(source.pagination || {}) },
    };
};

const reasonLabel = entry => String(entry.reasonCode || entry.type || 'FP activity')
    .replace(/^FREE_PLAY_/, '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^./, character => character.toUpperCase());

const fpMovement = entry => {
    if (String(entry.receivedCoinType || '').toUpperCase() === 'FP') return Number(entry.receivedAmount || 0);
    if (String(entry.paidCoinType || '').toUpperCase() === 'FP') return -Number(entry.paidAmount || 0);
    return Number(entry.amount || 0);
};

const Toggle = ({ active, label, hint, onClick }) => (
    <article className={`fp-toggle-card ${active ? 'active' : ''}`}>
        <div><h4>{label}</h4><p>{hint}</p></div>
        <button type="button" className={`fp-toggle ${active ? 'on' : 'off'}`} aria-pressed={active} onClick={onClick}><span />{active ? 'Enabled' : 'Disabled'}</button>
    </article>
);

const FreePlay = () => {
    const dispatch = useDispatch();
    const history = useHistory();
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [savedSettings, setSavedSettings] = useState(DEFAULT_SETTINGS);
    const [ledger, setLedger] = useState(EMPTY_LEDGER);
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);

    const loadSettings = useCallback(async () => {
        const response = await axios.get('/free-play/admin/settings');
        const normalized = normalizeSettings(response?.data?.body);
        setSettings(normalized);
        setSavedSettings(normalized);
    }, []);

    const loadLedger = useCallback(async (page = 1) => {
        const response = await axios.get(`/free-play/admin/ledger?page=${page}&limit=25`);
        setLedger(normalizeLedger(response?.data?.body));
    }, []);

    useEffect(() => {
        let mounted = true;
        dispatch(setLoader(true));
        Promise.all([loadSettings(), loadLedger(1)])
            .catch(error => mounted && EventBus.publish('error', unwrapError(error)))
            .finally(() => mounted && dispatch(setLoader(false)));
        return () => { mounted = false; };
    }, [dispatch, loadLedger, loadSettings]);

    const updateSetting = (key, value) => setSettings(current => ({ ...current, [key]: value }));
    const updateBonus = (index, key, value) => setSettings(current => ({
        ...current,
        dailyBonuses: current.dailyBonuses.map((bonus, bonusIndex) => bonusIndex === index ? { ...bonus, [key]: value } : bonus),
    }));

    const addBonus = () => setSettings(current => ({
        ...current,
        dailyBonuses: [...current.dailyBonuses, normalizeBonus({ startsAt: todayInput() })],
    }));

    const removeBonus = index => setSettings(current => ({
        ...current,
        dailyBonuses: current.dailyBonuses.filter((bonus, bonusIndex) => bonusIndex !== index),
    }));

    const validationError = useMemo(() => {
        for (const key of ['signupBonus', 'tokensPerUsd', 'minPurchaseUsd', 'maxPurchaseUsd']) {
            if (!Number.isFinite(Number(settings[key])) || Number(settings[key]) < 0) return 'All economy values must be non-negative numbers.';
        }
        if (Number(settings.minPurchaseUsd) > Number(settings.maxPurchaseUsd)) return 'Minimum purchase cannot exceed maximum purchase.';
        for (const bonus of settings.dailyBonuses) {
            if (!bonus.name.trim() || !bonus.startsAt || !Number.isFinite(Number(bonus.amount)) || Number(bonus.amount) < 0) return 'Every daily bonus needs a name, non-negative amount and start date.';
            if (bonus.endsAt && bonus.endsAt < bonus.startsAt) return 'A daily bonus end date cannot be before its start date.';
        }
        return '';
    }, [settings]);

    const isDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings);
    const canSave = isDirty && !validationError && reason.trim().length >= 3 && !saving;

    const saveSettings = async () => {
        if (!canSave) return;
        setSaving(true);
        dispatch(setLoader(true));
        try {
            const payload = {
                ...settings,
                signupBonus: Number(settings.signupBonus),
                tokensPerUsd: Number(settings.tokensPerUsd),
                minPurchaseUsd: Number(settings.minPurchaseUsd),
                maxPurchaseUsd: Number(settings.maxPurchaseUsd),
                dailyBonuses: settings.dailyBonuses.map(bonus => ({
                    ...(bonus._id ? { _id: bonus._id } : {}),
                    name: bonus.name.trim(),
                    amount: Number(bonus.amount),
                    startsAt: bonus.startsAt,
                    endsAt: bonus.endsAt || null,
                    enabled: Boolean(bonus.enabled),
                })),
                reason: reason.trim(),
            };
            const response = await axios.put('/free-play/admin/settings', payload);
            const normalized = normalizeSettings(response?.data?.body);
            setSettings(normalized);
            setSavedSettings(normalized);
            setReason('');
            EventBus.publish('success', response?.data?.message || 'Free Play settings updated');
        } catch (error) {
            EventBus.publish('error', unwrapError(error));
        } finally {
            setSaving(false);
            dispatch(setLoader(false));
        }
    };

    const resetSettings = () => {
        setSettings(savedSettings);
        setReason('');
    };

    const pagination = ledger.pagination || EMPTY_LEDGER.pagination;

    return (
        <div className="content fp-content">
            <div className="fp-page">
                <header className="fp-header">
                    <div><span className="fp-eyebrow">Operations · canonical FP</span><h2>Free Play Control Center</h2><p>Configure the non-withdrawable player economy, scheduled login rewards and purchase limits.</p></div>
                    <div className={`fp-state ${settings.enabled ? 'live' : 'paused'}`}><span />{settings.enabled ? 'Free Play live' : 'Free Play disabled'}</div>
                </header>

                <section className="fp-notice">
                    <i className="tim-icons icon-lock-circle" />
                    <div><strong>FP is the only Free Play balance.</strong><p>It may be granted, earned or purchased, but it cannot be withdrawn or converted into Cash, USDC, SOL or MPCE.</p></div>
                    <button type="button" onClick={() => history.push('/home/users')}>Adjust a player’s FP →</button>
                </section>

                <section className="fp-toggle-grid">
                    <Toggle active={settings.enabled} label="Free Play availability" hint="Controls Free Play access and automated rewards" onClick={() => updateSetting('enabled', !settings.enabled)} />
                    <Toggle active={settings.purchasesEnabled} label="FP purchases" hint="Allows deposited Cash/USD to purchase non-withdrawable FP" onClick={() => updateSetting('purchasesEnabled', !settings.purchasesEnabled)} />
                </section>

                <section className="fp-panel">
                    <div className="fp-panel-title"><div><h3>Economy</h3><p>Simple global issuance and player purchase controls.</p></div><div className="fp-rate-preview"><span>Current purchase value</span><strong>$1 = {formatNumber(settings.tokensPerUsd)} FP</strong></div></div>
                    <div className="fp-economy-grid">
                        <label><span>Signup bonus</span><input type="number" min="0" step="any" value={settings.signupBonus} onChange={event => updateSetting('signupBonus', event.target.value)} /><small>FP issued once to a new player</small></label>
                        <label><span>Tokens per USD</span><input type="number" min="0" step="any" value={settings.tokensPerUsd} onChange={event => updateSetting('tokensPerUsd', event.target.value)} /><small>FP received for $1 Cash balance</small></label>
                        <label><span>Minimum purchase</span><input type="number" min="0" step="any" value={settings.minPurchaseUsd} onChange={event => updateSetting('minPurchaseUsd', event.target.value)} /><small>USD</small></label>
                        <label><span>Maximum purchase</span><input type="number" min="0" step="any" value={settings.maxPurchaseUsd} onChange={event => updateSetting('maxPurchaseUsd', event.target.value)} /><small>USD</small></label>
                    </div>
                </section>

                <section className="fp-panel">
                    <div className="fp-panel-title"><div><h3>Daily login bonuses</h3><p>The active date window determines which reward players can claim once per UTC day.</p></div><button type="button" className="fp-add-bonus" onClick={addBonus}>+ Add schedule</button></div>
                    <div className="fp-schedule-list">
                        {settings.dailyBonuses.map((bonus, index) => <article className={`fp-schedule-row ${bonus.enabled ? '' : 'disabled'}`} key={bonus._id || `new-${index}`}>
                            <label className="fp-schedule-name"><span>Name</span><input value={bonus.name} onChange={event => updateBonus(index, 'name', event.target.value)} placeholder="Daily login bonus" /></label>
                            <label><span>Amount</span><input type="number" min="0" step="any" value={bonus.amount} onChange={event => updateBonus(index, 'amount', event.target.value)} /></label>
                            <label><span>Starts</span><input type="date" value={bonus.startsAt} onChange={event => updateBonus(index, 'startsAt', event.target.value)} /></label>
                            <label><span>Ends · optional</span><input type="date" min={bonus.startsAt} value={bonus.endsAt} onChange={event => updateBonus(index, 'endsAt', event.target.value)} /></label>
                            <button type="button" className={`fp-row-toggle ${bonus.enabled ? 'on' : ''}`} onClick={() => updateBonus(index, 'enabled', !bonus.enabled)}>{bonus.enabled ? 'Enabled' : 'Disabled'}</button>
                            <button type="button" className="fp-remove-bonus" onClick={() => removeBonus(index)} aria-label={`Remove ${bonus.name}`}>×</button>
                        </article>)}
                        {!settings.dailyBonuses.length && <div className="fp-empty-schedule"><strong>No login bonus scheduled</strong><span>Players will not receive a daily FP claim until a schedule is added.</span></div>}
                    </div>
                </section>

                <section className="fp-save-bar">
                    <div><label>Required audit reason<input value={reason} onChange={event => setReason(event.target.value)} placeholder="Why are these Free Play settings changing?" /></label>{validationError && <span className="fp-validation">{validationError}</span>}{!validationError && isDirty && reason.trim().length < 3 && <span className="fp-save-hint">Enter at least 3 characters before saving.</span>}</div>
                    <button type="button" className="fp-reset" disabled={!isDirty || saving} onClick={resetSettings}>Discard</button>
                    <button type="button" className="fp-save" disabled={!canSave} onClick={saveSettings}>{saving ? 'Saving…' : 'Save changes'}</button>
                </section>

                <section className="fp-panel fp-ledger-panel">
                    <div className="fp-panel-title"><div><h3>FP ledger</h3><p>Recent database issuance, purchases and operator adjustments.</p></div><button type="button" className="fp-ledger-refresh" onClick={() => loadLedger(pagination.currentPage || 1)}>Refresh</button></div>
                    <div className="fp-ledger-summary"><article><span>Outstanding player FP</span><strong>{formatNumber(ledger.summary?.outstandingFp)}</strong><small>Non-withdrawable liability</small></article><article><span>Ledger records</span><strong>{formatNumber(pagination.total)}</strong><small>Canonical asset: FP</small></article><article><span>Withdrawal value</span><strong>$0</strong><small>FP cannot leave the Free Play economy</small></article></div>
                    <div className="fp-ledger-table-wrap"><table className="fp-ledger-table"><thead><tr><th>Date</th><th>Player</th><th>Activity</th><th>Paid</th><th>FP issued / received</th><th>FP balance</th><th>Reference</th></tr></thead><tbody>
                        {ledger.entries.map(entry => { const movement = fpMovement(entry); return <tr key={entry._id || entry.idempotencyKey}><td>{formatDate(entry.createdAt || entry.processedAt)}</td><td><strong>{entry.userId?.username || 'Player'}</strong><small>{entry.userId?.email || entry.userId?._id || entry.userId || '—'}</small></td><td>{reasonLabel(entry)}</td><td>{formatNumber(entry.paidAmount)} {String(entry.paidCoinType || '').toUpperCase()}</td><td className={movement >= 0 ? 'fp-issued' : 'fp-debited'}>{movement > 0 ? '+' : ''}{formatNumber(movement)} FP</td><td>{formatNumber(entry.updatedFpBalance)}</td><td title={entry.idempotencyKey || entry._id}>{entry.idempotencyKey ? `${entry.idempotencyKey.slice(0, 12)}…` : (entry._id || '—')}</td></tr>; })}
                        {!ledger.entries.length && <tr><td colSpan="7" className="fp-ledger-empty">No FP ledger entries have been recorded.</td></tr>}
                    </tbody></table></div>
                    <div className="fp-pagination"><button type="button" disabled={(pagination.currentPage || 1) <= 1} onClick={() => loadLedger(pagination.currentPage - 1)}>Previous</button><span>Page {pagination.currentPage || 1} of {pagination.totalPages || 1}</span><button type="button" disabled={(pagination.currentPage || 1) >= (pagination.totalPages || 1)} onClick={() => loadLedger(pagination.currentPage + 1)}>Next</button></div>
                </section>
            </div>
        </div>
    );
};

export default FreePlay;
