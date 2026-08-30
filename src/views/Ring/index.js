import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import React, { Fragment } from 'react';
import Button from '@material-ui/core/Button';
import EventBus from 'eventing-bus';
import axios from 'axios';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { addRingGame, getAllRingGames, updateRingGame, deleteRingGame } from '../../store/actions/Ring';
import { toggleModal, setLoader } from '../../store/actions/Auth';
import { getAllTemplates } from '../../store/actions/Template';
import { getSettings, updateSetting } from '../../store/actions/Settings';

import './index.css';

const TIME_MINUTES_PER_MPCE = 6;

const DEFAULT_RING_FORM = {
    name: '', seatLimit: 6, smallBlinds: '', bigBlinds: '', minBuyIn: '', maxBuyIn: '',
    balanceType: 'CASH', timeChargeTier: 'STANDARD', timeChargeMinutesPerHour: 60,
    customBurnRateMpcePerHour: 20, minPlayersToStart: 2, tableStatus: 'ACTIVE',
    straddleMode: 'NONE', straddleEnabled: false, ante: 0, anteEnabled: false,
    actionTimerSeconds: 15, timeBankSeconds: 0, timeBankEnabled: false, allowTopUp: true,
    formatLimit: '', gameVariant: '', region: '',
};

const REGION_OPTIONS = [
    ['asia', 'Asia'], ['au', 'Australia'], ['cae', 'Canada, East'], ['eu', 'Europe'],
    ['in', 'India'], ['jp', 'Japan'], ['za', 'South Africa'], ['sa', 'South America'],
    ['kr', 'South Korea'], ['tr', 'Turkey'], ['us', 'USA, East'], ['ussc', 'USA, South Central'],
];

function normalizeFormData(source = {}, minutesPerMpce = TIME_MINUTES_PER_MPCE) {
    const timeChargeTier = String(source.timeChargeTier || 'STANDARD').toUpperCase();
    const timeChargeMinutesPerHour = Number(source.timeChargeMinutesPerHour ?? 60);
    const ante = Number(source.ante || 0);
    const timeBankSeconds = Number(source.timeBankSeconds || 0);
    const straddleMode = String(source.straddleMode || 'NONE').toUpperCase();

    return {
        ...DEFAULT_RING_FORM,
        ...source,
        minBuyIn: source.minBuyIn ?? source.minCoins ?? '',
        maxBuyIn: source.maxBuyIn ?? source.maxCoins ?? '',
        timeChargeTier,
        timeChargeMinutesPerHour,
        customBurnRateMpcePerHour: timeChargeTier === 'CUSTOM'
            ? Number(source.timeChargeMpcePerHour ?? (timeChargeMinutesPerHour / minutesPerMpce))
            : DEFAULT_RING_FORM.customBurnRateMpcePerHour,
        straddleMode,
        straddleEnabled: straddleMode !== 'NONE',
        ante,
        anteEnabled: ante > 0,
        timeBankSeconds,
        timeBankEnabled: timeBankSeconds > 0,
        allowTopUp: source.allowTopUp !== false && String(source.allowTopUp) !== 'false',
    };
}

const Field = ({ label, hint, className = '', children }) => (
    <label className={`ring-field ${className}`}>
        <span className="ring-field__label">{label}</span>
        {children}
        {hint && <span className="ring-field__hint">{hint}</span>}
    </label>
);

const Toggle = ({ name, checked, onChange, title, description }) => (
    <label className={`ring-toggle-card ${checked ? 'is-on' : ''}`}>
        <span>
            <span className="ring-toggle-card__title">{title}</span>
            <span className="ring-toggle-card__description">{description}</span>
        </span>
        <span className="ring-switch">
            <input type="checkbox" name={name} checked={checked} onChange={onChange} />
            <span className="ring-switch__track" />
        </span>
    </label>
);

class Ring extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            formData: { ...DEFAULT_RING_FORM }, selectedGame: null, template: '',
            showNewGamesModal: false, pendingNewGamesPaused: false, newGamesReason: '',
            showCloseModal: false, closeRing: null, closeReason: '',
        };
        props.getAllRingGames();
        props.getAllTemplates();
        props.getSettings();
        props.setLoader(true);
    }

    handleFormChange = ({ target }) => {
        const value = target.type === 'checkbox' ? target.checked : target.value;
        this.setState(({ formData }) => {
            const next = { ...formData, [target.name]: value };
            if (target.name === 'straddleEnabled') {
                next.straddleMode = value ? (formData.straddleMode === 'NONE' ? 'UTG' : formData.straddleMode) : 'NONE';
            }
            if (target.name === 'anteEnabled') next.ante = value ? (Number(formData.ante) || 1) : 0;
            if (target.name === 'timeBankEnabled') next.timeBankSeconds = value ? (Number(formData.timeBankSeconds) || 30) : 0;
            if (target.name === 'timeChargeTier' && value === 'NONE') next.timeChargeMinutesPerHour = 0;
            return { formData: next };
        });
    };

    handleTemplateChange = ({ target }) => {
        const selectedTemplate = this.props.allTemplates.find(item => item._id === target.value);
        this.setState({ template: target.value, formData: selectedTemplate ? normalizeFormData(selectedTemplate, this.getMinutesPerMpce()) : { ...DEFAULT_RING_FORM } });
    };

    getSettingValue = (key, fallback) => {
        const setting = (this.props.settings || []).find(item => item.key === key);
        const value = Number(setting?.value);
        return Number.isFinite(value) ? value : fallback;
    };

    getMinutesPerMpce = () => this.getSettingValue('mpceMinutesValue', TIME_MINUTES_PER_MPCE);

    buildPayload = () => {
        const { customBurnRateMpcePerHour, straddleEnabled, anteEnabled, timeBankEnabled, ...payload } = this.state.formData;
        if (payload.timeChargeTier === 'CUSTOM') {
            payload.timeChargeMpcePerHour = Number(customBurnRateMpcePerHour);
            payload.timeChargeMinutesPerHour = Number(customBurnRateMpcePerHour) * this.getMinutesPerMpce();
        }
        else if (payload.timeChargeTier === 'NONE') {
            payload.timeChargeMpcePerHour = null;
            payload.timeChargeMinutesPerHour = 0;
        }
        else {
            payload.timeChargeMpcePerHour = null;
            payload.timeChargeMinutesPerHour = 60;
        }
        payload.allowTopUp = Boolean(payload.allowTopUp);
        payload.straddleMode = straddleEnabled ? payload.straddleMode : 'NONE';
        payload.ante = anteEnabled ? Number(payload.ante) : 0;
        payload.timeBankSeconds = timeBankEnabled ? Number(payload.timeBankSeconds) : 0;
        return payload;
    };

    validatePayload = payload => {
        const required = ['name', 'gameVariant', 'formatLimit', 'region'];
        if (required.some(field => !String(payload[field] || '').trim())) return 'Complete all required game setup fields';
        if (Number(payload.seatLimit) < 2 || Number(payload.seatLimit) > 9) return 'Seat limit must be between 2 and 9';
        if (Number(payload.minPlayersToStart) < 2 || Number(payload.minPlayersToStart) > Number(payload.seatLimit)) return 'Minimum players must be between 2 and the seat limit';
        if (Number(payload.smallBlinds) <= 0 || Number(payload.bigBlinds) <= Number(payload.smallBlinds)) return 'Big blind must be greater than the small blind';
        if (Number(payload.minBuyIn) < 0 || Number(payload.maxBuyIn) < Number(payload.minBuyIn)) return 'Maximum buy-in must be at least the minimum buy-in';
        if (payload.timeChargeTier === 'CUSTOM' && Number(payload.timeChargeMinutesPerHour) <= 0) return 'Enter a custom table burn rate greater than zero';
        return '';
    };

    submitRing = () => {
        const payload = this.buildPayload();
        const validationError = this.validatePayload(payload);
        if (validationError) return EventBus.publish('error', validationError);
        if (this.state.selectedGame) this.props.updateRingGame(payload);
        else this.props.addRingGame(payload);
        this.cancelModal();
    };

    cancelModal = () => {
        this.setState({ selectedGame: null, formData: { ...DEFAULT_RING_FORM }, template: '' });
        this.props.toggleModal(false);
    };

    editRing = ring => {
        this.setState({ selectedGame: ring, formData: normalizeFormData(ring, this.getMinutesPerMpce()), template: '' });
        this.props.toggleModal(true);
    };

    openNewGamesControl = pendingNewGamesPaused => {
        this.setState({ showNewGamesModal: true, pendingNewGamesPaused, newGamesReason: '' });
    };

    closeNewGamesControl = () => {
        this.setState({ showNewGamesModal: false, newGamesReason: '' });
    };

    submitNewGamesControl = event => {
        event.preventDefault();
        const reason = this.state.newGamesReason.trim();
        if (!reason) return;
        this.props.updateSetting({
            key: 'newGamesPaused',
            value: this.state.pendingNewGamesPaused ? 1 : 0,
            reason,
        });
        this.closeNewGamesControl();
    };

    openCloseControl = ring => this.setState({ showCloseModal: true, closeRing: ring, closeReason: '' });
    closeCloseControl = () => this.setState({ showCloseModal: false, closeRing: null, closeReason: '' });
    submitCloseControl = async event => {
        event.preventDefault();
        const { closeRing, closeReason } = this.state;
        if (!closeRing || closeReason.trim().length < 3) return;
        this.props.setLoader(true);
        try {
            const response = await axios.post('/ring/closeAfterHand', { ringId: closeRing._id, close: !closeRing.closeAfterHand, reason: closeReason.trim() });
            EventBus.publish('success', response?.data?.message || 'Table close state updated');
            this.props.getAllRingGames();
            this.closeCloseControl();
        } catch (error) {
            EventBus.publish('error', error?.response?.data?.message || 'Unable to update graceful close');
        } finally {
            this.props.setLoader(false);
        }
    };

    render() {
        const { selectedGame, template, formData, showNewGamesModal, pendingNewGamesPaused, newGamesReason, showCloseModal, closeRing, closeReason } = this.state;
        const {
            name, seatLimit, smallBlinds, bigBlinds, minBuyIn, maxBuyIn, balanceType,
            timeChargeTier, customBurnRateMpcePerHour, minPlayersToStart, tableStatus,
            straddleMode, straddleEnabled, ante, anteEnabled, actionTimerSeconds,
            timeBankSeconds, timeBankEnabled, allowTopUp, formatLimit, region, gameVariant,
        } = formData;
        const { isModal, allTemplates, allRingGames } = this.props;
        const allRingGamesArray = Object.values(allRingGames);
        const minBuyInBb = Number(bigBlinds) > 0 && minBuyIn !== '' ? Number(minBuyIn) / Number(bigBlinds) : null;
        const maxBuyInBb = Number(bigBlinds) > 0 && maxBuyIn !== '' ? Number(maxBuyIn) / Number(bigBlinds) : null;
        const minutesPerMpce = this.getMinutesPerMpce();
        const standardMpcePerHour = minutesPerMpce > 0 ? 60 / minutesPerMpce : 0;
        const standardMinutesPerHour = 60;
        const effectiveCustomMinutesPerHour = Number(customBurnRateMpcePerHour || 0) * minutesPerMpce;
        const customMultiplier = standardMinutesPerHour > 0 ? effectiveCustomMinutesPerHour / standardMinutesPerHour : 0;
        const newGamesPaused = this.getSettingValue('newGamesPaused', 0) === 1;

        const columns = [
            { Header: '#', Cell: ({ index }) => index + 1, width: 52, maxWidth: 52, filterable: false },
            {
                accessor: 'name', Header: 'Ring Name', minWidth: 155,
                className: 'ring-name-cell',
                filterMethod: (filter, row) => String(row[filter.id] || '').toLowerCase().includes(filter.value.toLowerCase()),
            },
            { Header: 'Blinds', minWidth: 80, Cell: row => `${row.original.smallBlinds}/${row.original.bigBlinds}`, filterable: false },
            { Header: 'Players', minWidth: 80, Cell: row => `${row.original.playersJoined}/${row.original.seatLimit}`, filterable: false },
            { accessor: 'gameVariant', Header: 'Game Type', minWidth: 145 },
            { Header: 'Buy-In', minWidth: 115, filterable: false, Cell: row => `${row.original.minBuyIn ?? row.original.minCoins ?? 0} – ${row.original.maxBuyIn ?? row.original.maxCoins ?? 'No max'}` },
            {
                accessor: 'balanceType', Header: 'Balance', minWidth: 90, filterable: false,
                Cell: row => <span className="ring-balance-badge">{row.original.balanceType || 'CASH'}</span>,
            },
            {
                accessor: 'tableStatus', Header: 'Status', minWidth: 100, filterable: false,
                Cell: row => {
                    const status = String(row.original.tableStatus || 'ACTIVE').toUpperCase();
                    return <span className={`ring-status-badge is-${row.original.closeAfterHand ? 'closing' : status.toLowerCase()}`}>{row.original.closeAfterHand ? 'CLOSING' : status}</span>;
                },
            },
            {
                Header: 'Actions', width: 285, minWidth: 285, maxWidth: 300, filterable: false, sortable: false,
                Cell: row => (
                    <div className="ring-table-actions">
                        <button onClick={() => this.editRing(row.original)} className="ring-action-btn ring-action-edit">Edit</button>
                        {String(row.original.tableStatus || 'ACTIVE').toUpperCase() === 'ACTIVE' && <button onClick={() => this.openCloseControl(row.original)} className="ring-action-btn ring-action-close">{row.original.closeAfterHand ? 'Cancel close' : 'Close safely'}</button>}
                        <button onClick={() => this.props.deleteRingGame(row.original._id)} className="ring-action-btn ring-action-delete">Delete</button>
                    </div>
                ),
            },
        ];

        return (
            <div className="content">
                <div className="main-container player-scores">
                    <div className="main-container-head ring-list-header mb-3">
                        <p className="main-container-heading">RING GAME</p>
                        <div className="ring-list-controls">
                            <span className={`ring-join-state ${newGamesPaused ? 'is-paused' : 'is-live'}`}>
                                New joins: {newGamesPaused ? 'Paused' : 'Live'}
                            </span>
                            <button onClick={() => this.openNewGamesControl(!newGamesPaused)} className={`ring-global-control ${newGamesPaused ? 'is-resume' : ''}`}>
                                {newGamesPaused ? 'Resume new joins' : 'Pause new joins'}
                            </button>
                            <button onClick={() => { this.props.toggleModal(true); this.setState({ selectedGame: null, formData: { ...DEFAULT_RING_FORM }, template: '' }); }} className="add-btn">Create Ring Game</button>
                        </div>
                    </div>
                    <Fragment>
                        <div className="ring-table-shell mb-3">
                            <ReactTable
                                minRows={Math.min(Math.max(allRingGamesArray.length, 1), 10)}
                                defaultPageSize={10}
                                showPagination={allRingGamesArray.length > 10}
                                className="table ring-games-table"
                                data={allRingGamesArray}
                                columns={columns}
                                filterable
                            />
                        </div>
                    </Fragment>
                </div>

                <Modal isOpen={isModal} toggle={this.cancelModal} className="main-modal reward-modal ring-management-modal">
                    <ModalHeader toggle={this.cancelModal}><div className="reward-modal-title"><p>{selectedGame ? 'Edit Ring' : 'Create Ring'}</p></div></ModalHeader>
                    <ModalBody className="modal-body reward-modal-body">
                        <form className="ring-form" onSubmit={event => { event.preventDefault(); this.submitRing(); }}>
                            {!selectedGame && (
                                <Field label="Start from template" className="ring-field--full">
                                    <select className="ring-control" name="template" value={template} onChange={this.handleTemplateChange}>
                                        <option value="">Blank table</option>
                                        {allTemplates.filter(item => item.gameType === 'RING').map(item => <option key={item._id} value={item._id}>{item.name}</option>)}
                                    </select>
                                </Field>
                            )}

                            <section className="ring-form-section ring-form-section--game ring-field--full">
                                <div className="ring-form-section__heading"><h3>Game setup</h3><span>Identity, format and availability</span></div>
                                <div className="ring-form-grid ring-form-grid--four">
                                    <Field label="Table name" className="ring-field--span-2"><input className="ring-control" name="name" value={name} onChange={this.handleFormChange} placeholder="e.g. Friday Night 2/5" required /></Field>
                                    <Field label="Status"><select className="ring-control" name="tableStatus" value={tableStatus} onChange={this.handleFormChange}><option value="ACTIVE">Active</option><option value="DISABLED">Disabled</option><option value="MAINTENANCE">Maintenance</option></select></Field>
                                    <Field label="Region"><select className="ring-control" name="region" value={region} onChange={this.handleFormChange} required><option value="">Select region</option>{REGION_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                                    <Field label="Game type"><select className="ring-control" name="gameVariant" value={gameVariant} onChange={this.handleFormChange} required><option value="">Select game</option><option value="Texas Hold'em">Texas Hold'em</option><option value="Omaha">Omaha</option></select></Field>
                                    <Field label="Betting limit"><select className="ring-control" name="formatLimit" value={formatLimit} onChange={this.handleFormChange} required><option value="">Select limit</option><option value="No Limit">No Limit</option><option value="Pot Limit">Pot Limit</option><option value="Fixed Limit">Fixed Limit</option></select></Field>
                                    <Field label="Seats"><input className="ring-control" name="seatLimit" type="number" min="2" max="9" value={seatLimit} onChange={this.handleFormChange} /></Field>
                                    <Field label="Players to start"><input className="ring-control" name="minPlayersToStart" type="number" min="2" max={seatLimit || 9} value={minPlayersToStart} onChange={this.handleFormChange} /></Field>
                                </div>
                            </section>

                            <section className="ring-form-section ring-form-section--stakes ring-field--full">
                                <div className="ring-form-section__heading"><h3>Stakes & access</h3><span>Amounts are shown in the selected table balance</span></div>
                                <div className="ring-form-grid ring-form-grid--five">
                                    <Field label="Small blind"><input className="ring-control" name="smallBlinds" type="number" min="0" step="any" value={smallBlinds} onChange={this.handleFormChange} placeholder="2" required /></Field>
                                    <Field label="Big blind"><input className="ring-control" name="bigBlinds" type="number" min="0" step="any" value={bigBlinds} onChange={this.handleFormChange} placeholder="5" required /></Field>
                                    <Field label="Minimum buy-in" hint={minBuyInBb !== null ? `${minBuyInBb.toFixed(0)} BB` : 'e.g. 40 BB / $200'}><input className="ring-control" name="minBuyIn" type="number" min="0" step="any" value={minBuyIn} onChange={this.handleFormChange} placeholder="200" required /></Field>
                                    <Field label="Maximum buy-in" hint={maxBuyInBb !== null ? `${maxBuyInBb.toFixed(0)} BB` : 'e.g. 100 BB / $500'}><input className="ring-control" name="maxBuyIn" type="number" min="0" step="any" value={maxBuyIn} onChange={this.handleFormChange} placeholder="500" required /></Field>
                                    <Field label="Balance type"><select className="ring-control" name="balanceType" value={balanceType} onChange={this.handleFormChange}><option value="CASH">Cash / USDC</option><option value="TIME">Time</option><option value="FP">FP</option></select></Field>
                                </div>
                            </section>

                            <section className="ring-form-section ring-form-section--charge">
                                <div className="ring-form-section__heading"><h3>Time charge</h3><span>Master: {standardMpcePerHour.toFixed(2)} MPCE/hour · {minutesPerMpce} minutes/MPCE</span></div>
                                <div className="ring-form-grid ring-form-grid--four">
                                    <Field label="Fee tier" className="ring-field--span-2"><select className="ring-control" name="timeChargeTier" value={timeChargeTier} onChange={this.handleFormChange}><option value="STANDARD">Standard — inherit general rate</option><option value="CUSTOM">Custom — override for this table</option><option value="NONE">None — do not consume table time</option></select></Field>
                                    {timeChargeTier === 'CUSTOM' && (
                                        <Field label="Table burn rate" className="ring-field--span-2" hint={`${effectiveCustomMinutesPerHour} time minutes/hour · ${customMultiplier.toFixed(2)}× master rate`}>
                                            <div className="ring-control-with-unit"><input className="ring-control" name="customBurnRateMpcePerHour" type="number" min="0.01" step="0.01" value={customBurnRateMpcePerHour} onChange={this.handleFormChange} /><span>MPCE / hour</span></div>
                                        </Field>
                                    )}
                                </div>
                            </section>

                            <section className="ring-form-section ring-form-section--rules">
                                <div className="ring-form-section__heading"><h3>Table rules</h3><span>Optional rules stay out of the way until enabled</span></div>
                                <div className="ring-toggle-grid">
                                    <Toggle name="allowTopUp" checked={allowTopUp} onChange={this.handleFormChange} title="Auto-rebuy / top-up" description="Allow stack refills between hands" />
                                    <Toggle name="straddleEnabled" checked={straddleEnabled} onChange={this.handleFormChange} title="Straddle" description="Enable a voluntary blind raise" />
                                    <Toggle name="anteEnabled" checked={anteEnabled} onChange={this.handleFormChange} title="Ante" description="Collect an ante before each hand" />
                                    <Toggle name="timeBankEnabled" checked={timeBankEnabled} onChange={this.handleFormChange} title="Time bank" description="Give players reserve decision time" />
                                </div>
                                <div className="ring-form-grid ring-form-grid--four ring-conditional-rules">
                                    <Field label="Action timer"><div className="ring-control-with-unit"><input className="ring-control" name="actionTimerSeconds" type="number" min="1" max="300" value={actionTimerSeconds} onChange={this.handleFormChange} /><span>sec</span></div></Field>
                                    {straddleEnabled && <Field label="Straddle type"><select className="ring-control" name="straddleMode" value={straddleMode} onChange={this.handleFormChange}><option value="UTG">UTG only</option><option value="MISSISSIPPI">Mississippi</option></select></Field>}
                                    {anteEnabled && <Field label="Ante amount"><input className="ring-control" name="ante" type="number" min="0" step="any" value={ante} onChange={this.handleFormChange} /></Field>}
                                    {timeBankEnabled && <Field label="Time bank"><div className="ring-control-with-unit"><input className="ring-control" name="timeBankSeconds" type="number" min="1" max="3600" value={timeBankSeconds} onChange={this.handleFormChange} /><span>sec</span></div></Field>}
                                </div>
                            </section>

                            <div className="ring-form-actions ring-field--full">
                                <Button className="delete-btn add-btn" type="button" onClick={this.cancelModal}>Cancel</Button>
                                <Button className="add-btn" type="submit">{selectedGame ? 'Save changes' : 'Create table'}</Button>
                            </div>
                        </form>
                    </ModalBody>
                </Modal>

                <Modal isOpen={showNewGamesModal} toggle={this.closeNewGamesControl} className="main-modal reward-modal ring-operations-modal">
                    <ModalHeader toggle={this.closeNewGamesControl}>
                        <div className="reward-modal-title"><p>{pendingNewGamesPaused ? 'Pause new game joins' : 'Resume new game joins'}</p></div>
                    </ModalHeader>
                    <ModalBody className="modal-body reward-modal-body">
                        <form className="ring-operations-form" onSubmit={this.submitNewGamesControl}>
                            <p>
                                {pendingNewGamesPaused
                                    ? 'Existing seated players and reconnects continue normally. Only new table joins are blocked.'
                                    : 'New players will be allowed to join active tables again.'}
                            </p>
                            <Field label="Reason (required)">
                                <textarea className="ring-operations-reason" value={newGamesReason} onChange={event => this.setState({ newGamesReason: event.target.value })} placeholder="Record why this operational control is changing" />
                            </Field>
                            <div className="ring-operations-actions">
                                <Button className="delete-btn add-btn" type="button" onClick={this.closeNewGamesControl}>Cancel</Button>
                                <Button className="add-btn" type="submit" disabled={!newGamesReason.trim()}>{pendingNewGamesPaused ? 'Pause new joins' : 'Resume new joins'}</Button>
                            </div>
                        </form>
                    </ModalBody>
                </Modal>

                <Modal isOpen={showCloseModal} toggle={this.closeCloseControl} className="main-modal reward-modal ring-operations-modal">
                    <ModalHeader toggle={this.closeCloseControl}><div className="reward-modal-title"><p>{closeRing?.closeAfterHand ? 'Cancel safe close' : 'Close table safely'}</p></div></ModalHeader>
                    <ModalBody className="modal-body reward-modal-body">
                        <form className="ring-operations-form" onSubmit={this.submitCloseControl}>
                            <p>{closeRing?.closeAfterHand ? 'New joins will resume for this active table.' : 'New joins stop immediately. If a hand is active, seated players finish it before the table becomes Disabled.'}</p>
                            <Field label="Reason (required)"><textarea className="ring-operations-reason" value={closeReason} onChange={event => this.setState({ closeReason: event.target.value })} placeholder="Record why this table is changing state" /></Field>
                            <div className="ring-operations-actions"><Button className="delete-btn add-btn" type="button" onClick={this.closeCloseControl}>Cancel</Button><Button className="add-btn" type="submit" disabled={closeReason.trim().length < 3}>{closeRing?.closeAfterHand ? 'Keep table open' : 'Close after hand'}</Button></div>
                        </form>
                    </ModalBody>
                </Modal>
            </div>
        );
    }
}

const mapDispatchToProps = { getAllRingGames, getAllTemplates, getSettings, updateSetting, addRingGame, toggleModal, setLoader, updateRingGame, deleteRingGame };
const mapStateToProps = ({ Auth, Ring: RingState, Template, Settings }) => ({ allRingGames: RingState.allRingGames, allTemplates: Template.allTemplates, settings: Settings.settings, isModal: Auth.isModal });

export default connect(mapStateToProps, mapDispatchToProps)(Ring);
