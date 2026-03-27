import React, { useState } from 'react';
import Cookies from 'js-cookie';
import * as AiIcons from 'react-icons/ai';
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import { FiSun, FiMoon } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IconContext } from 'react-icons';
import { useTheme } from '../../libraries/ThemeContext';
import './Navbar.css';

export default function Navbar({ setToken, activeTrip, name }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
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
        <>
            <div className='navbar-container'>
                <div className="navbar-left">
                    <button className="menu-bars-hamburger-btn" onClick={showSidebar} aria-label="Open Menu">
                        <FaIcons.FaBars />
                    </button>
                    <Link to='/' className='tacs-logo'>
                        <RouteIcon /> TACS.
                    </Link>
                </div>
                <div className="navbar-right">
                    <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                        {theme === 'light' ? <FiMoon /> : <FiSun />}
                    </button>
                    <Link to='/login' className="btn-secondary nav-auth-btn" style={{ padding: '8px 16px', fontSize: '13px' }}>Login</Link>
                    <Link to='/signup' className="btn-primary nav-auth-btn" style={{ padding: '8px 16px', fontSize: '13px' }}>Sign Up</Link>
                </div>
            </div>

            {/* Logged Out Sidebar */}
            <nav className={sidebar ? 'nav-menu active' : 'nav-menu'}>
                <div className="sidebar-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '20px' }}>
                        <button className="theme-toggle-sidebar" onClick={toggleTheme}>
                            {theme === 'light' ? <FiMoon /> : <FiSun />}
                        </button>
                        <div style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={showSidebar}>
                            <AiIcons.AiOutlineClose size={20} />
                        </div>
                    </div>
                    <div style={{
                        width: 48, height: 48, borderRadius: '12px',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--teal)', fontSize: 20
                    }}>
                        <RouteIcon />
                    </div>
                    <div className="sidebar-name">Welcome to TACS</div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Sustainable carpooling for students</p>
                </div>

                <div className="sidebar-nav-items" onClick={showSidebar} style={{ padding: '0 24px' }}>
                    <Link to='/login' className="btn-secondary w-100 mb-2" style={{ textAlign: 'center' }}>Login</Link>
                    <Link to='/signup' className="btn-primary w-100" style={{ textAlign: 'center' }}>Sign Up</Link>
                </div>
            </nav>
        </>
    );

    return (
        <>
            <IconContext.Provider value={{ color: 'inherit' }}>
                <div className='navbar-container'>
                    <div className="navbar-left">
                        <button className="menu-bars-hamburger-btn" onClick={showSidebar} aria-label="Open Menu">
                            <FaIcons.FaBars />
                        </button>
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
                        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                            {theme === 'light' ? <FiMoon /> : <FiSun />}
                        </button>
                        <div className="user-profile-small">
                            <div className="avatar-circle-sm">{initials}</div>
                            <span className="user-name-header">{name}</span>
                        </div>
                        <FaIcons.FaSignOutAlt className="logout-icon" onClick={handleLogOut} title="Logout" />
                    </div>
                </div>

                {/* Sidebar Overlay */}
                <nav className={sidebar ? 'nav-menu active' : 'nav-menu'}>
                    <div className="sidebar-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px' }}>
                            <button className="theme-toggle-sidebar" onClick={toggleTheme}>
                                {theme === 'light' ? <FiMoon /> : <FiSun />}
                            </button>
                            <div style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={showSidebar}>
                                <AiIcons.AiOutlineClose size={20} />
                            </div>
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