import { connect } from 'react-redux';
import React from 'react';
import { getSettings, updateSetting } from "../../store/actions/Settings";
import { Modal, ModalHeader, ModalBody } from "reactstrap";

import './index.css';

class Settings extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showEditModal: false,
            editingSetting: null,
            editValue: ''
        };
        props.getSettings();
    }

    getSettingLabel = (key) => {
        const labels = {
            'burnRate': 'Burn Rate',
            'lowBalanceThreshold': 'Low Balance Threshold',
            'burnIntervalMinutes': 'Burn Interval (Minutes)'
        };
        return labels[key] || key;
    }

    getSettingIcon = (key) => {
        const icons = {
            'burnRate': 'tim-icons icon-coins',
            'lowBalanceThreshold': 'tim-icons icon-alert-circle-exc',
            'burnIntervalMinutes': 'tim-icons icon-time-alarm'
        };
        return icons[key] || 'tim-icons icon-settings-gear-63';
    }

    openEditModal = (setting) => {
        this.setState({
            showEditModal: true,
            editingSetting: setting,
            editValue: setting.value.toString()
        });
    }

    closeEditModal = () => {
        this.setState({
            showEditModal: false,
            editingSetting: null,
            editValue: ''
        });
    }

    handleValueChange = (e) => {
        this.setState({ editValue: e.target.value });
    }

    handleSubmit = () => {
        const { editingSetting, editValue } = this.state;
        const numValue = parseFloat(editValue);

        if (isNaN(numValue) || numValue < 0) {
            return;
        }

        this.props.updateSetting({
            key: editingSetting.key,
            value: numValue
        });

        this.closeEditModal();
    }

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
        const { showEditModal, editingSetting, editValue } = this.state;

        return (
            <div className="content settings-container">
                <div className="main-container">
                    <div className="main-container-head">
                        <h3 className="main-container-heading">Admin Settings</h3>
                    </div>

                    <div className="settings-cards-container">
                        {settings && settings.length > 0 ? (
                            settings.map((setting, index) => (
                                <div key={index} className="setting-card">
                                    <div className="setting-icon">
                                        <i className={this.getSettingIcon(setting.key)}></i>
                                    </div>
                                    <div className="setting-card-body">
                                        <div className="setting-info">
                                            <h4 className="setting-title">{this.getSettingLabel(setting.key)}</h4>
                                            <p className="setting-description">{setting.description}</p>
                                        </div>
                                        <div className="setting-value-container">
                                            <span className="setting-value-label">Value:</span>
                                            <span className="setting-value">{setting.value}</span>
                                        </div>
                                        <div className="setting-meta">
                                            <span className="setting-updated">
                                                Last updated: {this.formatDate(setting.updatedAt)}
                                            </span>
                                            {setting.updatedBy && (
                                                <span className="setting-updated-by">
                                                    by {setting.updatedBy.username || setting.updatedBy.email}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="setting-card-footer">
                                        <button
                                            className="add-btn"
                                            onClick={() => this.openEditModal(setting)}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-settings">
                                <p>No settings available</p>
                            </div>
                        )}
                    </div>
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
                                        <p className="edit-setting-description">{editingSetting.description}</p>
                                    </div>
                                </div>

                                <div className="col-12 mt-3">
                                    <div className="form-group">
                                        <label className="form-label">Value</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={editValue}
                                            onChange={this.handleValueChange}
                                            min="0"
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
                                        disabled={!editValue || parseFloat(editValue) < 0}
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

const mapStateToProps = ({ Settings }) => {
    const { settings, loading } = Settings;
    return { settings, loading };
};

const mapDispatchToProps = {
    getSettings,
    updateSetting
};

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
