import React from 'react';
import './index.css';

import logo from '../../assets/img/logo.png';

class AdminHomePage extends React.Component {
    render() {
        return (
            <div className="admin-home-page">
                <div className='banner-center-content'>
                    <img className="login-page-logo" src={logo} alt='logo' />
                </div>
            </div>
        );
    }
}

export default AdminHomePage;
