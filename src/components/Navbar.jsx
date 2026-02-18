import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Home, Bed, Zap, Cpu, Shield, LogIn, LogOut, Layout, Users, BookOpen, ChevronDown } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './Navbar.css';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [session, setSession] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            subscription.unsubscribe();
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const userRole = session?.user?.user_metadata?.role || 'student';

    return (
        <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
            <div className="navbar-container">
                <div className="navbar-logo">
                    <div className="logo-hex">
                        <Home size={20} className="logo-icon-inner" />
                    </div>
                    <span className="logo-text">HOSTEL MANAGEMENT</span>
                </div>

                {/* Desktop System Menu */}
                <div className="navbar-menu">
                    <a href="#home" className="nav-link">
                        <Home size={16} className="nav-icon" />
                        <span>Home</span>
                    </a>
                    <a href="#about" className="nav-link">
                        <Layout size={16} className="nav-icon" />
                        <span>Facilities</span>
                    </a>
                    <a href="#rooms" className="nav-link">
                        <Bed size={16} className="nav-icon" />
                        <span>Rooms</span>
                    </a>

                    {/* Role-based Dashboard Access Dropdown */}
                    {session && (
                        <div className="nav-dropdown">
                            <div className="nav-link nav-dropdown-trigger">
                                <Layout size={16} className="nav-icon" />
                                <span>Dashboard</span>
                                <ChevronDown size={14} />
                            </div>
                            <div className="nav-dropdown-menu">
                                {userRole === 'admin' && (
                                    <>
                                        <Link to="/admin" className="dropdown-item">
                                            <Shield size={16} color="#ef4444" />
                                            <span>Admin Terminal</span>
                                        </Link>
                                        <Link to="/warden" className="dropdown-item">
                                            <Users size={16} color="#eab308" />
                                            <span>Staff Portal</span>
                                        </Link>
                                        <Link to="/student" className="dropdown-item">
                                            <BookOpen size={16} color="#22c55e" />
                                            <span>Student Portal</span>
                                        </Link>
                                    </>
                                )}
                                {userRole === 'warden' && (
                                    <Link to="/warden" className="dropdown-item">
                                        <Users size={16} color="#eab308" />
                                        <span>Staff Portal</span>
                                    </Link>
                                )}
                                {userRole === 'student' && (
                                    <Link to="/student" className="dropdown-item">
                                        <BookOpen size={16} color="#22c55e" />
                                        <span>Student Portal</span>
                                    </Link>
                                )}
                                <div className="dropdown-divider"></div>
                                <button onClick={handleLogout} className="dropdown-item" style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {!session && (
                        <>
                            <Link to="/login" className="nav-link">
                                <span>Login</span>
                            </Link>
                            <Link to="/signup" className="nav-button">
                                Get Started <Zap size={14} />
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Interface Toggle */}
                <button className="mobile-menu-toggle" onClick={toggleMenu} aria-label="Toggle Menu">
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile System Menu */}
            {isMenuOpen && (
                <div className="mobile-menu">
                    <a href="#home" className="mobile-nav-link" onClick={toggleMenu}>
                        <Home size={20} /> Home
                    </a>

                    {/* Role-based Mobile Menu */}
                    {session ? (
                        <>
                            {userRole === 'admin' && (
                                <Link to="/admin" className="mobile-nav-link" onClick={toggleMenu}>
                                    <Shield size={20} /> Admin Terminal
                                </Link>
                            )}
                            {userRole === 'warden' && (
                                <Link to="/warden" className="mobile-nav-link" onClick={toggleMenu}>
                                    <Zap size={20} /> Operations
                                </Link>
                            )}
                            {userRole === 'student' && (
                                <Link to="/student" className="mobile-nav-link" onClick={toggleMenu}>
                                    <Cpu size={20} /> Resident Portal
                                </Link>
                            )}
                            <button onClick={() => { handleLogout(); toggleMenu(); }} className="mobile-nav-link" style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%' }}>
                                <LogOut size={20} /> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="mobile-nav-link" onClick={toggleMenu}>
                                <LogIn size={20} /> Login
                            </Link>
                            <Link to="/signup" className="mobile-nav-button" onClick={toggleMenu}>
                                Get Started <Zap size={18} />
                            </Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}

