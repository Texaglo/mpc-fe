import './index.css';
import '../../assets/css/competition-management.css';
import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import React from 'react';
import Button from '@material-ui/core/Button';
import EventBus from 'eventing-bus';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { addSitnGoGame, getAllSitnGoGames, updateSitnGoGame, deleteSitnGoGame } from '../../store/actions/SitnGo';
import { toggleModal, setLoader } from '../../store/actions/Auth';
import { getAllTemplates } from '../../store/actions/Template';

const REGIONS = [['asia','Asia'],['au','Australia'],['cae','Canada, East'],['eu','Europe'],['in','India'],['jp','Japan'],['za','South Africa'],['sa','South America'],['kr','South Korea'],['tr','Turkey'],['us','USA, East'],['ussc','USA, South Central']];
const emptyForm = () => ({
    name: '', balanceType: 'CASH', buyIn: '', seatLimit: 6, startingStack: 1000,
    formatLimit: 'No Limit', gameVariant: "Texas Hold'em", region: 'us', duration: 10,
    blinds: [{ smallBlind: 10, bigBlind: 20, duration: 10 }],
});

const Field = ({ label, hint, className = '', children }) => <label className={`competition-field ${className}`}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
const economyName = value => value === 'FP' ? 'Free Play (FP)' : value === 'TIME' ? 'Time / MPCE' : 'Cash / USD';
const unitName = value => value === 'FP' ? 'FP' : value === 'TIME' ? 'MPCE' : 'USD';

class SitnGo extends React.Component {
    state = { formData: emptyForm(), selectedGame: null, template: '' };

    constructor(props) {
        super(props);
        props.getAllSitnGoGames();
        props.getAllTemplates();
        props.setLoader(true);
    }

    handleFormChange = ({ target }) => this.setState(({ formData }) => ({ formData: { ...formData, [target.name]: target.value } }));
    handleBlindChange = (index, field, value) => this.setState(({ formData }) => ({ formData: { ...formData, blinds: formData.blinds.map((blind, position) => position === index ? { ...blind, [field]: value } : blind) } }));
    addBlind = () => this.setState(({ formData }) => ({ formData: { ...formData, blinds: [...formData.blinds, { smallBlind: '', bigBlind: '', duration: 10 }] } }));
    removeBlind = index => this.setState(({ formData }) => ({ formData: { ...formData, blinds: formData.blinds.filter((_, position) => position !== index) } }));

    handleTemplateChange = ({ target }) => {
        const template = this.props.allTemplates.find(item => item._id === target.value);
        this.setState({ template: target.value, formData: template ? { ...emptyForm(), ...template, balanceType: template.balanceType || (template.buyInType === 'mpceCredit' ? 'TIME' : 'CASH') } : emptyForm() });
    };

    openCreate = () => this.setState({ selectedGame: null, template: '', formData: emptyForm() }, () => this.props.toggleModal(true));
    editGame = game => this.setState({ selectedGame: game, template: '', formData: { ...emptyForm(), ...game, balanceType: game.balanceType || 'TIME' } }, () => this.props.toggleModal(true));
    cancelModal = () => this.setState({ selectedGame: null, template: '', formData: emptyForm() }, () => this.props.toggleModal(false));

    submitGame = event => {
        event.preventDefault();
        const { formData, selectedGame } = this.state;
        if (!formData.name.trim() || !formData.region || !formData.gameVariant || !formData.formatLimit) return EventBus.publish('error', 'Complete all Sit & Go setup fields');
        if (Number(formData.buyIn) <= 0 || Number(formData.startingStack) <= 0) return EventBus.publish('error', 'Buy-in and starting stack must be greater than zero');
        if (Number(formData.seatLimit) < 2 || Number(formData.seatLimit) > 10) return EventBus.publish('error', 'Seat limit must be between 2 and 10');
        const payload = {
            ...formData,
            buyIn: Number(formData.buyIn), seatLimit: Number(formData.seatLimit), startingStack: Number(formData.startingStack), duration: Number(formData.duration || 10),
            buyInType: formData.balanceType === 'TIME' ? 'mpceCredit' : formData.balanceType,
            blinds: formData.blinds.map(blind => ({ smallBlind: Number(blind.smallBlind), bigBlind: Number(blind.bigBlind), duration: Number(blind.duration || 10) })),
        };
        if (selectedGame) this.props.updateSitnGoGame(payload); else this.props.addSitnGoGame(payload);
        this.cancelModal();
    };

    render() {
        const { formData, selectedGame, template } = this.state;
        const games = Object.values(this.props.allSitnGoGames || {});
        const unit = unitName(formData.balanceType);
        const isFreePlay = formData.balanceType === 'FP';
        const columns = [
            { Header: '#', width: 48, filterable: false, Cell: ({ index }) => index + 1 },
            { Header: 'Sit & Go', accessor: 'name', minWidth: 160 },
            { Header: 'Game', minWidth: 130, filterable: false, Cell: row => row.original.gameVariant || 'Poker' },
            { Header: 'Economy', minWidth: 110, filterable: false, Cell: row => <span className={`competition-economy ${String(row.original.balanceType || 'TIME').toLowerCase()}`}>{economyName(row.original.balanceType || 'TIME')}</span> },
            { Header: 'Buy-in', minWidth: 100, filterable: false, Cell: row => `${Number(row.original.buyIn || 0).toLocaleString()} ${unitName(row.original.balanceType || 'TIME')}` },
            { Header: 'Starting chips', minWidth: 100, filterable: false, Cell: row => Number(row.original.startingStack || 0).toLocaleString() },
            { Header: 'Players', minWidth: 82, filterable: false, Cell: row => `${row.original.totalRegisteredPlayers || row.original.playersJoined || 0}/${row.original.seatLimit}` },
            { Header: 'Status', accessor: 'status', minWidth: 90 },
            { Header: 'Actions', width: 180, filterable: false, sortable: false, Cell: row => <div className="competition-actions"><button onClick={() => this.editGame(row.original)} className="add-btn">Edit</button><button onClick={() => this.props.deleteSitnGoGame(row.original._id)} className="delete-btn add-btn">Delete</button></div> },
        ];

        return <div className="content"><div className="main-container player-scores">
            <div className="main-container-head competition-list-header mb-3"><p className="main-container-heading">SIT'N'GO</p><button onClick={this.openCreate} className="add-btn">Create Sit'n'Go</button></div>
            <div className="competition-list-shell"><ReactTable minRows={Math.min(Math.max(games.length, 1), 10)} defaultPageSize={10} showPagination={games.length > 10} className="table competition-table" data={games} columns={columns} filterable /></div>
        </div>

        <Modal isOpen={this.props.isModal} toggle={this.cancelModal} className="main-modal reward-modal competition-modal">
            <ModalHeader toggle={this.cancelModal}><div className="reward-modal-title"><p>{selectedGame ? 'Edit Sit’n’Go' : 'Create Sit’n’Go'}</p></div></ModalHeader>
            <ModalBody className="modal-body reward-modal-body"><form className="competition-form" onSubmit={this.submitGame}>
                {!selectedGame && <section className="competition-section"><div className="competition-grid"><Field label="Start from template" className="span-2"><select className="competition-control" value={template} onChange={this.handleTemplateChange}><option value="">Blank Sit’n’Go</option>{this.props.allTemplates.filter(item => item.gameType === 'SNG').map(item => <option key={item._id} value={item._id}>{item.name}</option>)}</select></Field></div></section>}
                <section className="competition-section"><div className="competition-section-heading"><h3>Game setup</h3><span>Identity, format and capacity</span></div><div className="competition-grid">
                    <Field label="Game name" className="span-2"><input className="competition-control" name="name" value={formData.name} onChange={this.handleFormChange} placeholder="e.g. Friday Night Turbo" /></Field>
                    <Field label="Game type"><select className="competition-control" name="gameVariant" value={formData.gameVariant} onChange={this.handleFormChange}><option value="Texas Hold'em">Texas Hold’em (NLH)</option><option value="Omaha">Omaha (PLO)</option></select></Field>
                    <Field label="Betting limit"><select className="competition-control" name="formatLimit" value={formData.formatLimit} onChange={this.handleFormChange}><option>No Limit</option><option>Pot Limit</option><option>Fixed Limit</option></select></Field>
                    <Field label="Seats"><input className="competition-control" type="number" min="2" max="10" name="seatLimit" value={formData.seatLimit} onChange={this.handleFormChange} /></Field>
                    <Field label="Region"><select className="competition-control" name="region" value={formData.region} onChange={this.handleFormChange}>{REGIONS.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                    <Field label="Estimated duration"><input className="competition-control" type="number" min="1" name="duration" value={formData.duration} onChange={this.handleFormChange} /></Field>
                </div></section>
                <section className="competition-section"><div className="competition-section-heading"><h3>{isFreePlay ? 'Free Play economics' : 'Entry economics'}</h3><span>Buy-in is the amount charged; starting chips are the in-game stack</span></div><div className="competition-grid">
                    <Field label="Table economy"><select className="competition-control" name="balanceType" value={formData.balanceType} onChange={this.handleFormChange}><option value="CASH">Cash / USD</option><option value="FP">Free Play (FP)</option><option value="TIME">Time / MPCE (legacy)</option></select></Field>
                    <Field label={formData.balanceType === 'TIME' ? 'Configured buy-in (MPCE)' : `Buy-in (${unit})`} hint={formData.balanceType === 'TIME' ? 'Legacy TIME games reserve the starting-stack amount in MPCE.' : `This is charged from the player’s ${unit} balance.`}><input className="competition-control" type="number" min="0.01" step="any" name="buyIn" value={formData.buyIn} onChange={this.handleFormChange} /></Field>
                    <Field label="Starting chips" hint="Tournament chips used only inside this game."><input className="competition-control" type="number" min="1" name="startingStack" value={formData.startingStack} onChange={this.handleFormChange} /></Field>
                </div>{isFreePlay && <div className="competition-economy-notice"><strong>FP only · no time charge</strong><span>Registration deducts the FP buy-in. Bets and results remain non-withdrawable Free Play value.</span></div>}</section>
                <section className="competition-section"><div className="competition-section-heading"><h3>Blind levels</h3><span>All blind amounts are tournament chips</span></div><div className="competition-blinds">{formData.blinds.map((blind,index) => <div className="competition-blind-row" key={index}><b>{index + 1}</b><Field label="Small blind"><input className="competition-control" type="number" min="1" value={blind.smallBlind} onChange={event => this.handleBlindChange(index,'smallBlind',event.target.value)} /></Field><Field label="Big blind"><input className="competition-control" type="number" min="1" value={blind.bigBlind} onChange={event => this.handleBlindChange(index,'bigBlind',event.target.value)} /></Field><Field label="Minutes" className="blind-duration"><input className="competition-control" type="number" min="1" value={blind.duration} onChange={event => this.handleBlindChange(index,'duration',event.target.value)} /></Field><button className="competition-icon-button" type="button" onClick={() => this.removeBlind(index)} disabled={formData.blinds.length === 1}>×</button></div>)}</div><button type="button" className="competition-add-level" onClick={this.addBlind}>+ Add blind level</button></section>
                <div className="competition-form-actions"><Button className="delete-btn add-btn" type="button" onClick={this.cancelModal}>Cancel</Button><Button className="add-btn" type="submit">{selectedGame ? 'Save changes' : 'Create game'}</Button></div>
            </form></ModalBody>
        </Modal></div>;
    }
}

const mapDispatchToProps = { getAllSitnGoGames, getAllTemplates, addSitnGoGame, toggleModal, setLoader, updateSitnGoGame, deleteSitnGoGame };
const mapStateToProps = ({ Auth, SitnGo: SitnGoState, Template }) => ({ allSitnGoGames: SitnGoState.allSitnGoGames, allTemplates: Template.allTemplates, isModal: Auth.isModal });
export default connect(mapStateToProps, mapDispatchToProps)(SitnGo);
