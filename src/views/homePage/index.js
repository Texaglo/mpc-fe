import React, { useEffect } from 'react';
import './index.css';
import logo from '../../assets/img/logo.png';
import { useDispatch} from "react-redux"
import { setLoader } from '../../store/actions/Auth';

const AdminHomePage = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setLoader(false));
    }, [])

    return (
        <div className="admin-home-page">
            <div className='banner-center-content'>
                <img className="login-page-logo" src={logo} alt='logo' />
            </div>
        </div>
    )
}

export default AdminHomePage;
