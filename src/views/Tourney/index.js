import './index.css';
import '../../assets/css/competition-management.css';
import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import React from 'react';
import Button from '@material-ui/core/Button';
import EventBus from 'eventing-bus';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { addTournament, getAllTournaments, updateTournament, deleteTournament } from '../../store/actions/Tournament';
import { toggleModal, setLoader } from '../../store/actions/Auth';
import { getAllTemplates } from '../../store/actions/Template';
import { withTableEconomyContract } from '../../utils/tableEconomy';

const REGIONS = [['asia','Asia'],['au','Australia'],['cae','Canada, East'],['eu','Europe'],['in','India'],['jp','Japan'],['za','South Africa'],['sa','South America'],['kr','South Korea'],['tr','Turkey'],['us','USA, East'],['ussc','USA, South Central']];
const localDateTime = value => {
    const date = value ? new Date(value) : new Date(Date.now() + 3600000);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
const emptyForm = () => ({
    name: '', balanceType: 'CASH', buyIn: '', fee: 0, prizePool: '', startingStack: 5000,
    minPlayers: 2, maxPlayers: 30, gameVariant: "Texas Hold'em", formatLimit: 'No Limit',
    region: 'us', tournamentStartingDate: localDateTime(),
    blinds: [{ smallBlind: 25, bigBlind: 50, duration: 10, ante: 0 }],
});
const Field = ({ label, hint, className = '', children }) => <label className={`competition-field ${className}`}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
const unitName = value => value === 'FP' ? 'FP' : value === 'TIME' ? 'MPCE' : 'USD';
const economyName = value => value === 'FP' ? 'Free Play (FP)' : value === 'TIME' ? 'Time / MPCE' : 'Cash / USD';

class Tournament extends React.Component {
    state = { formData: emptyForm(), template: '', selectedGame: null };

    constructor(props) {
        super(props);
        props.getAllTournaments();
        props.getAllTemplates();
        props.setLoader(true);
    }

    handleFormChange = ({ target }) => this.setState(({ formData }) => ({ formData: { ...formData, [target.name]: target.value } }));
    handleBlindChange = (index, field, value) => this.setState(({ formData }) => ({ formData: { ...formData, blinds: formData.blinds.map((blind, position) => position === index ? { ...blind, [field]: value } : blind) } }));
    addBlind = () => this.setState(({ formData }) => ({ formData: { ...formData, blinds: [...formData.blinds, { smallBlind: '', bigBlind: '', duration: 10, ante: 0 }] } }));
    removeBlind = index => this.setState(({ formData }) => ({ formData: { ...formData, blinds: formData.blinds.filter((_, position) => position !== index) } }));

    handleTemplateChange = ({ target }) => {
        const template = this.props.allTemplates.find(item => item._id === target.value);
        this.setState({ template: target.value, formData: template ? { ...emptyForm(), ...template, tournamentStartingDate: localDateTime(template.tournamentStartingDate), balanceType: template.balanceType || (template.buyInType === 'mpceCredit' ? 'TIME' : 'CASH') } : emptyForm() });
    };

    openCreate = () => this.setState({ selectedGame: null, template: '', formData: emptyForm() }, () => this.props.toggleModal(true));
    editGame = game => this.setState({ selectedGame: game, template: '', formData: { ...emptyForm(), ...game, tournamentStartingDate: localDateTime(game.tournamentStartingDate), balanceType: game.balanceType || 'TIME' } }, () => this.props.toggleModal(true));
    cancelModal = () => this.setState({ selectedGame: null, template: '', formData: emptyForm() }, () => this.props.toggleModal(false));

    submitGame = event => {
        event.preventDefault();
        const { formData, selectedGame } = this.state;
        if (!formData.name.trim() || !formData.region || !formData.gameVariant || !formData.formatLimit) return EventBus.publish('error', 'Complete all tournament setup fields');
        if (Number(formData.buyIn) <= 0 || Number(formData.startingStack) <= 0 || Number(formData.prizePool) <= 0) return EventBus.publish('error', 'Buy-in, starting chips and prize pool must be greater than zero');
        if (Number(formData.minPlayers) < 2 || Number(formData.maxPlayers) < Number(formData.minPlayers)) return EventBus.publish('error', 'Maximum players must be at least the minimum');
        const scheduled = new Date(formData.tournamentStartingDate);
        if (Number.isNaN(scheduled.getTime())) return EventBus.publish('error', 'Select a valid tournament start time');
        const payload = withTableEconomyContract({
            ...formData,
            buyIn: Number(formData.buyIn), fee: Number(formData.fee || 0), prizePool: Number(formData.prizePool), startingStack: Number(formData.startingStack), minPlayers: Number(formData.minPlayers), maxPlayers: Number(formData.maxPlayers),
            tournamentStartingDate: scheduled.toISOString(),
            buyInType: formData.balanceType === 'TIME' ? 'mpceCredit' : formData.balanceType,
            blinds: formData.blinds.map(blind => ({ smallBlind: Number(blind.smallBlind), bigBlind: Number(blind.bigBlind), duration: Number(blind.duration || 10), ante: Number(blind.ante || 0) })),
        });
        if (selectedGame) this.props.updateTournament(payload); else this.props.addTournament(payload);
        this.cancelModal();
    };

    render() {
        const { formData, selectedGame, template } = this.state;
        const games = Object.values(this.props.allTournaments || {}).filter(game => !game.isTemplate);
        const unit = unitName(formData.balanceType);
        const isFreePlay = formData.balanceType === 'FP';
        const columns = [
            { Header: '#', width: 48, filterable: false, Cell: ({ index }) => index + 1 },
            { Header: 'Tournament', accessor: 'name', minWidth: 170 },
            { Header: 'Starts', minWidth: 130, filterable: false, Cell: row => new Date(row.original.tournamentStartingDate).toLocaleString() },
            { Header: 'Economy', minWidth: 112, filterable: false, Cell: row => <span className={`competition-economy ${String(row.original.balanceType || 'TIME').toLowerCase()}`}>{economyName(row.original.balanceType || 'TIME')}</span> },
            { Header: 'Buy-in', minWidth: 92, filterable: false, Cell: row => `${Number(row.original.buyIn || 0).toLocaleString()} ${unitName(row.original.balanceType || 'TIME')}` },
            { Header: 'Prize pool', minWidth: 105, filterable: false, Cell: row => `${Number(row.original.prizePool || 0).toLocaleString()} ${unitName(row.original.balanceType || 'TIME')}` },
            { Header: 'Players', minWidth: 82, filterable: false, Cell: row => `${row.original.totalRegisteredPlayers || 0}/${row.original.maxPlayers || 0}` },
            { Header: 'Status', accessor: 'status', minWidth: 90 },
            { Header: 'Actions', width: 180, filterable: false, sortable: false, Cell: row => <div className="competition-actions"><button onClick={() => this.editGame(row.original)} className="add-btn">Edit</button><button onClick={() => this.props.deleteTournament(row.original._id)} className="delete-btn add-btn">Delete</button></div> },
        ];

        return <div className="content"><div className="main-container player-scores">
            <div className="main-container-head competition-list-header mb-3"><p className="main-container-heading">TOURNAMENTS</p><button onClick={this.openCreate} className="add-btn">Create Tournament</button></div>
            <div className="competition-list-shell"><ReactTable minRows={Math.min(Math.max(games.length, 1), 10)} defaultPageSize={10} showPagination={games.length > 10} className="table competition-table" data={games} columns={columns} filterable /></div>
        </div>

        <Modal isOpen={this.props.isModal} toggle={this.cancelModal} className="main-modal reward-modal competition-modal">
            <ModalHeader toggle={this.cancelModal}><div className="reward-modal-title"><p>{selectedGame ? 'Edit Tournament' : 'Create Tournament'}</p></div></ModalHeader>
            <ModalBody className="modal-body reward-modal-body"><form className="competition-form" onSubmit={this.submitGame}>
                {!selectedGame && <section className="competition-section"><div className="competition-grid"><Field label="Start from template" className="span-2"><select className="competition-control" value={template} onChange={this.handleTemplateChange}><option value="">Blank tournament</option>{this.props.allTemplates.filter(item => item.gameType === 'MTT').map(item => <option key={item._id} value={item._id}>{item.name}</option>)}</select></Field></div></section>}
                <section className="competition-section"><div className="competition-section-heading"><h3>Tournament setup</h3><span>Schedule, format and capacity</span></div><div className="competition-grid">
                    <Field label="Tournament name" className="span-2"><input className="competition-control" name="name" value={formData.name} onChange={this.handleFormChange} placeholder="e.g. Sunday Free Play Major" /></Field>
                    <Field label="Starts"><input className="competition-control" type="datetime-local" name="tournamentStartingDate" value={formData.tournamentStartingDate} onChange={this.handleFormChange} /></Field>
                    <Field label="Region"><select className="competition-control" name="region" value={formData.region} onChange={this.handleFormChange}>{REGIONS.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                    <Field label="Game type"><select className="competition-control" name="gameVariant" value={formData.gameVariant} onChange={this.handleFormChange}><option value="Texas Hold'em">Texas Hold’em (NLH)</option><option value="Omaha">Omaha (PLO)</option></select></Field>
                    <Field label="Betting limit"><select className="competition-control" name="formatLimit" value={formData.formatLimit} onChange={this.handleFormChange}><option>No Limit</option><option>Pot Limit</option><option>Fixed Limit</option></select></Field>
                    <Field label="Minimum players"><input className="competition-control" type="number" min="2" name="minPlayers" value={formData.minPlayers} onChange={this.handleFormChange} /></Field>
                    <Field label="Maximum players"><input className="competition-control" type="number" min="2" name="maxPlayers" value={formData.maxPlayers} onChange={this.handleFormChange} /></Field>
                </div></section>
                <section className="competition-section"><div className="competition-section-heading"><h3>{isFreePlay ? 'Free Play economics' : 'Tournament economics'}</h3><span>All values explicitly follow the selected economy</span></div><div className="competition-grid five">
                    <Field label="Tournament economy"><select className="competition-control" name="balanceType" value={formData.balanceType} onChange={this.handleFormChange}><option value="CASH">Cash / USD</option><option value="FP">Free Play (FP)</option><option value="TIME">Time / MPCE (legacy)</option></select></Field>
                    <Field label={formData.balanceType === 'TIME' ? 'Configured buy-in (MPCE)' : `Buy-in (${unit})`} hint={formData.balanceType === 'TIME' ? 'Legacy TIME tournaments reserve starting-stack MPCE.' : `Charged from the player’s ${unit} balance.`}><input className="competition-control" type="number" min="0.01" step="any" name="buyIn" value={formData.buyIn} onChange={this.handleFormChange} /></Field>
                    <Field label={`Fee (${unit})`}><input className="competition-control" type="number" min="0" step="any" name="fee" value={formData.fee} onChange={this.handleFormChange} /></Field>
                    <Field label={`Prize pool (${unit})`}><input className="competition-control" type="number" min="0.01" step="any" name="prizePool" value={formData.prizePool} onChange={this.handleFormChange} /></Field>
                    <Field label="Starting chips" hint="In-game tournament chips; not an extra FP charge."><input className="competition-control" type="number" min="1" name="startingStack" value={formData.startingStack} onChange={this.handleFormChange} /></Field>
                </div>{isFreePlay && <div className="competition-economy-notice"><strong>FP entry + FP prizes</strong><span>The buy-in is deducted in FP, the prize pool is awarded in FP, and no value is withdrawable or converted to time.</span></div>}</section>
                <section className="competition-section"><div className="competition-section-heading"><h3>Blind structure</h3><span>Levels use in-game tournament chips</span></div><div className="competition-blinds">{formData.blinds.map((blind,index) => <div className="competition-blind-row" key={index}><b>{index + 1}</b><Field label="Small blind"><input className="competition-control" type="number" min="1" value={blind.smallBlind} onChange={event => this.handleBlindChange(index,'smallBlind',event.target.value)} /></Field><Field label="Big blind"><input className="competition-control" type="number" min="1" value={blind.bigBlind} onChange={event => this.handleBlindChange(index,'bigBlind',event.target.value)} /></Field><Field label="Minutes · ante" className="blind-duration"><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}><input className="competition-control" type="number" min="1" value={blind.duration} onChange={event => this.handleBlindChange(index,'duration',event.target.value)} /><input className="competition-control" type="number" min="0" value={blind.ante || 0} onChange={event => this.handleBlindChange(index,'ante',event.target.value)} /></div></Field><button className="competition-icon-button" type="button" onClick={() => this.removeBlind(index)} disabled={formData.blinds.length === 1}>×</button></div>)}</div><button type="button" className="competition-add-level" onClick={this.addBlind}>+ Add blind level</button></section>
                <div className="competition-form-actions"><Button className="delete-btn add-btn" type="button" onClick={this.cancelModal}>Cancel</Button><Button className="add-btn" type="submit">{selectedGame ? 'Save changes' : 'Create tournament'}</Button></div>
            </form></ModalBody>
        </Modal></div>;
    }
}

const mapDispatchToProps = { getAllTemplates, getAllTournaments, addTournament, toggleModal, setLoader, updateTournament, deleteTournament };
const mapStateToProps = ({ Auth, Tournament: TournamentState, Template }) => ({ allTournaments: TournamentState.allTournaments, allTemplates: Template.allTemplates, isModal: Auth.isModal });
export default connect(mapStateToProps, mapDispatchToProps)(Tournament);
