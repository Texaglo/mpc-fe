import { connect } from 'react-redux';
import React from 'react';
import { getSettings, updateSetting } from "../../store/actions/Settings";
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import { canAccess } from '../../utils/adminAccess';

import './index.css';

class Settings extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showEditModal: false,
            editingSetting: null,
            editValue: '',
            auditReason: ''
        };
        props.getSettings();
    }

    getSettingLabel = (key) => {
        const labels = {
            'lowBalanceThreshold': 'Low Balance Threshold',
            'burnIntervalMinutes': 'Processing Interval',
            'mpceMinutesValue': 'MPCE Time Value'
        };
        return labels[key] || key;
    }

    getSettingIcon = (key) => {
        const icons = {
            'lowBalanceThreshold': 'tim-icons icon-alert-circle-exc',
            'burnIntervalMinutes': 'tim-icons icon-time-alarm',
            'mpceMinutesValue': 'tim-icons icon-watch-time'
        };
        return icons[key] || 'tim-icons icon-settings-gear-63';
    }

    getSettingDescription = (setting) => {
        const descriptions = {
            burnIntervalMinutes: 'How often seated-player usage is deducted. This changes posting frequency, not MPCE value.',
            mpceMinutesValue: 'Standard table-time minutes represented by one MPCE.',
        };
        return descriptions[setting.key] || setting.description;
    }

    openEditModal = (setting) => {
        this.setState({
            showEditModal: true,
            editingSetting: setting,
            editValue: setting.value.toString(),
            auditReason: ''
        });
    }

    closeEditModal = () => {
        this.setState({
            showEditModal: false,
            editingSetting: null,
            editValue: '',
            auditReason: ''
        });
    }

    handleValueChange = (e) => {
        this.setState({ editValue: e.target.value });
    }

    handleSubmit = () => {
        const { editingSetting, editValue, auditReason } = this.state;
        const numValue = parseFloat(editValue);

        if (isNaN(numValue) || numValue < 0 || auditReason.trim().length < 3 || (['burnIntervalMinutes', 'mpceMinutesValue'].includes(editingSetting.key) && numValue <= 0)) {
            return;
        }

        this.props.updateSetting({
            key: editingSetting.key,
            value: numValue,
            reason: auditReason.trim()
        });

        this.closeEditModal();
    }

    formatSettingValue = (setting) => {
        const units = {
            burnIntervalMinutes: ' minutes',
            mpceMinutesValue: ' minutes / MPCE'
        };
        return `${setting.value}${units[setting.key] || ''}`;
    }

    formatCalculatedValue = (value) => Number(Number(value || 0).toFixed(6)).toString();

    renderSettingCard = (setting) => (
        <div key={setting._id || setting.key} className="setting-card">
            <div className="setting-icon"><i className={this.getSettingIcon(setting.key)}></i></div>
            <div className="setting-card-body">
                <div className="setting-info">
                    <h4 className="setting-title">{this.getSettingLabel(setting.key)}</h4>
                    <p className="setting-description">{this.getSettingDescription(setting)}</p>
                </div>
                <div className="setting-value-container">
                    <span className="setting-value">{this.formatSettingValue(setting)}</span>
                </div>
                <div className="setting-meta">
                    <span className="setting-updated">Last updated: {this.formatDate(setting.updatedAt)}</span>
                    {setting.updatedBy && <span className="setting-updated-by">by {setting.updatedBy.username || setting.updatedBy.email}</span>}
                </div>
            </div>
            <div className="setting-card-footer">
                    {canAccess({ role: this.props.role, permissions: this.props.permissions }, 'economy.manage') && <button className="add-btn" onClick={() => this.openEditModal(setting)}>Edit</button>}
            </div>
        </div>
    )

    formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    render() {
        const { settings } = this.props;
        const { showEditModal, editingSetting, editValue, auditReason } = this.state;
        const cashierKeys = ['timePriceUsdPerHour', 'minDepositUsd', 'maxDepositUsd', 'minWithdrawalUsd', 'maxWithdrawalUsd', 'depositsPaused', 'withdrawalsPaused', 'cashierPaused', 'newGamesPaused'];
        const visibleSettings = (settings || []).filter(setting => setting.key !== 'burnRate' && !cashierKeys.includes(setting.key));
        const economyKeys = ['mpceMinutesValue', 'burnIntervalMinutes'];
        const economySettings = economyKeys.map(key => visibleSettings.find(setting => setting.key === key)).filter(Boolean);
        const otherSettings = visibleSettings.filter(setting => !economyKeys.includes(setting.key));
        const minutesPerMpce = Number(economySettings.find(setting => setting.key === 'mpceMinutesValue')?.value || 6);
        const processingInterval = Number(economySettings.find(setting => setting.key === 'burnIntervalMinutes')?.value || 6);
        const standardMpcePerHour = minutesPerMpce > 0 ? 60 / minutesPerMpce : 0;
        const standardMpcePerInterval = minutesPerMpce > 0 ? processingInterval / minutesPerMpce : 0;

        return (
            <div className="content settings-container">
                <div className="main-container">
                    <div className="main-container-head settings-page-heading">
                        <div>
                            <h3 className="main-container-heading">MPCE Economy</h3>
                            <p>Set what one MPCE represents and how often usage is posted. The deduction is calculated automatically.</p>
                        </div>
                    </div>

                    <section className="economy-panel">
                        <div className="economy-summary-grid">
                            <div className="economy-metric"><span>Standard value</span><strong>1 MPCE = {this.formatCalculatedValue(minutesPerMpce)} min</strong></div>
                            <div className="economy-metric"><span>Standard hourly cost</span><strong>{this.formatCalculatedValue(standardMpcePerHour)} MPCE / hour</strong></div>
                            <div className="economy-metric"><span>Deducted each interval</span><strong>{this.formatCalculatedValue(standardMpcePerInterval)} MPCE</strong></div>
                        </div>
                        <p className="economy-formula">Standard deduction = processing interval ÷ MPCE time value. Table overrides set MPCE/hour without changing the user’s master time display.</p>
                        <div className="settings-cards-container economy-settings-grid">
                            {economySettings.length > 0 ? economySettings.map(this.renderSettingCard) : (
                            <div className="no-settings">
                                <p>No MPCE economy settings available</p>
                            </div>
                        )}
                        </div>
                    </section>

                    {otherSettings.length > 0 && (
                        <section className="other-settings-section">
                            <h4>Other controls</h4>
                            <div className="settings-cards-container">{otherSettings.map(this.renderSettingCard)}</div>
                        </section>
                    )}
                </div>

                {/* Edit Setting Modal */}
                <Modal isOpen={showEditModal} toggle={this.closeEditModal} className="main-modal settings-modal">
                    <ModalHeader toggle={this.closeEditModal}>
                        <div className="modal-title">
                            <p>Edit Setting</p>
                        </div>
                        <div className="modal-line"><hr /></div>
                    </ModalHeader>
                    <ModalBody className="modal-body settings-modal-body">
                        {editingSetting && (
                            <div className="row">
                                <div className="col-12">
                                    <div className="edit-setting-info">
                                        <h5>{this.getSettingLabel(editingSetting.key)}</h5>
                                        <p className="edit-setting-description">{this.getSettingDescription(editingSetting)}</p>
                                    </div>
                                </div>

                                <div className="col-12 mt-3"><div className="form-group"><label className="form-label">Audit reason</label><textarea className="form-input" rows="3" value={auditReason} onChange={event => this.setState({ auditReason: event.target.value })} placeholder="Why is this economy setting changing?" /></div></div>

                                <div className="col-12 mt-3">
                                    <div className="form-group">
                                        <label className="form-label">Value</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={editValue}
                                            onChange={this.handleValueChange}
                                            min={['burnIntervalMinutes', 'mpceMinutesValue'].includes(editingSetting.key) ? '0.001' : '0'}
                                            step="any"
                                            placeholder="Enter value"
                                        />
                                    </div>
                                </div>

                                <div className="col-12 mt-4 d-flex justify-content-around">
                                    <button className="delete-btn add-btn col-4" type='button' onClick={this.closeEditModal}>Cancel</button>
                                    <button
                                        className="add-btn col-4"
                                        type='button'
                                        onClick={this.handleSubmit}
                                        disabled={!editValue || auditReason.trim().length < 3 || parseFloat(editValue) < 0 || (['burnIntervalMinutes', 'mpceMinutesValue'].includes(editingSetting.key) && parseFloat(editValue) <= 0)}
                                    >
                                        Update
                                    </button>
                                </div>
                            </div>
                        )}
                    </ModalBody>
                </Modal>
            </div>
        );
    }
}

const mapStateToProps = ({ Settings, Auth }) => {
    const { settings, loading } = Settings;
    return { settings, loading, role: Auth.role, permissions: Auth.permissions };
};

const mapDispatchToProps = {
    getSettings,
    updateSetting
};

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
