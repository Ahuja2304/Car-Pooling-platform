import React, { useState } from 'react';
import Cookies from 'js-cookie';
import * as AiIcons from 'react-icons/ai';
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IconContext } from 'react-icons';
import './Navbar.css';

export default function Navbar({ setToken, activeTrip, name }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebar, setSidebar] = useState(false);
    const showSidebar = () => setSidebar(!sidebar);

    const initials = name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) ?? 'U';

    const handleLogOut = async e => {
        e.preventDefault();
        fetch(import.meta.env.VITE_END_POINT + '/signout', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + Cookies.get('tokken')
            },
        }).then(() => {
            setToken(null);
            Cookies.remove('tokken');
            window.location.href = '/login';
        });
    }

    const handleDeleteProfile = async () => {
        if (!window.confirm("Are you sure you want to delete your profile? This action is permanent.")) return;
        fetch(import.meta.env.VITE_END_POINT + '/delete', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + Cookies.get('tokken')
            }
        }).then(() => {
            setToken(null);
            window.location.reload();
        });
    }

    const RouteIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
            <circle cx="5" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
        </svg>
    );

    const navItems = [
        { title: 'Dashboard', path: '/trip-history', icon: <AiIcons.AiOutlineDashboard /> },
        { title: 'Find Ride', path: '/ride', icon: <MdIcons.MdSearch /> },
        { title: 'Post Ride', path: '/drive', icon: <AiIcons.AiOutlinePlusSquare /> },
        { title: 'My Rides', path: '/active-trip', icon: <AiIcons.AiOutlineCar />, hidden: !activeTrip },
    ];

    if (!Cookies.get('tokken')) return (
        <div className='navbar-container'>
            <Link to='/' className='tacs-logo'>
                <RouteIcon /> TACS.
            </Link>
            <div className="navbar-right">
                <Link to='/login' className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>Login</Link>
                <Link to='/signup' className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>Sign Up</Link>
            </div>
        </div>
    );

    return (
        <>
            <IconContext.Provider value={{ color: 'inherit' }}>
                <div className='navbar-container'>
                    <div className="navbar-left">
                        <FaIcons.FaBars className="menu-bars-hamburger" onClick={showSidebar} />
                        <Link to='/' className='tacs-logo'>
                            <RouteIcon /> TACS.
                        </Link>
                    </div>

                    <div className="navbar-center">
                        {navItems.filter(item => !item.hidden).map(item => (
                            <Link 
                                key={item.path} 
                                to={item.path} 
                                className={`nav-link-item ${location.pathname === item.path ? 'active' : ''}`}
                            >
                                {item.icon} {item.title}
                            </Link>
                        ))}
                    </div>

                    <div className="navbar-right">
                        <div className="user-profile-small">
                            <div className="avatar-circle-sm">{initials}</div>
                            <span>{name}</span>
                        </div>
                        <FaIcons.FaSignOutAlt className="logout-icon" onClick={handleLogOut} title="Logout" />
                    </div>
                </div>

                {/* Sidebar Overlay */}
                <nav className={sidebar ? 'nav-menu active' : 'nav-menu'}>
                    <div className="sidebar-header">
                        <div style={{ alignSelf: 'flex-end', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={showSidebar}>
                            <AiIcons.AiOutlineClose size={20} />
                        </div>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: 'var(--teal)', color: 'var(--teal-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'Syne', fontSize: 22, fontWeight: 700
                        }}>
                            {initials}
                        </div>
                        <div className="sidebar-name">{name}</div>
                        <div className="sidebar-meta">VIT Bhopal · Student</div>
                    </div>

                    <div className="sidebar-nav-items" onClick={showSidebar}>
                        {navItems.map((item, index) => (
                            <Link 
                                key={index} 
                                to={item.path} 
                                className={`sidebar-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                            >
                                {item.icon}
                                <span>{item.title}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="sidebar-footer">
                        <button className="btn-danger w-100" onClick={handleDeleteProfile}>
                            Delete Profile
                        </button>
                    </div>
                </nav>
            </IconContext.Provider>
        </>
    );
}