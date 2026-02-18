import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, BedDouble, Wallet,
    UserCog, MessageSquare, FileText, Settings,
    LogOut, ClipboardList, Utensils, Bell, User, Home
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import './Dashboard.css';

export default function Sidebar({ role }) {
    const location = useLocation();

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const adminLinks = [
        { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/admin' },
        { icon: <Users size={20} />, label: 'Students', path: '/admin/students' },
        { icon: <BedDouble size={20} />, label: 'Rooms', path: '/admin/rooms' },
        { icon: <Wallet size={20} />, label: 'Fees', path: '/admin/fees' },
        { icon: <UserCog size={20} />, label: 'Staff', path: '/admin/staff/wardens' },
        { icon: <MessageSquare size={20} />, label: 'Complaints', path: '/admin/complaints' },
        { icon: <UserCog size={20} />, label: 'User Access', path: '/admin/access' },
        { icon: <FileText size={20} />, label: 'Reports', path: '/admin/reports' },
        { icon: <Settings size={20} />, label: 'Settings', path: '/admin/settings' },
    ];

    const wardenLinks = [
        { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/warden' },
        { icon: <ClipboardList size={20} />, label: 'Attendance', path: '/warden/attendance' },
        { icon: <BedDouble size={20} />, label: 'Room Allocation', path: '/warden/rooms' },
        { icon: <MessageSquare size={20} />, label: 'Complaints', path: '/warden/complaints' },
        { icon: <Utensils size={20} />, label: 'Mess Menu', path: '/warden/mess' },
        { icon: <Users size={20} />, label: 'Student List', path: '/warden/students' },
        { icon: <Bell size={20} />, label: 'Notices', path: '/warden/notices' },
    ];

    const studentLinks = [
        { icon: <User size={20} />, label: 'Profile', path: '/student' },
        { icon: <Wallet size={20} />, label: 'Fees', path: '/student/fees' },
        { icon: <ClipboardList size={20} />, label: 'Attendance', path: '/student/attendance' },
        { icon: <MessageSquare size={20} />, label: 'Complaints', path: '/student/complaints' },
        { icon: <Utensils size={20} />, label: 'Mess Menu', path: '/student/mess' },
        { icon: <BedDouble size={20} />, label: 'Room Change', path: '/student/room-request' },
        { icon: <Bell size={20} />, label: 'Notices', path: '/student/notices' },
    ];

    let links = [];
    if (role === 'admin') links = adminLinks;
    if (role === 'warden') links = wardenLinks;
    if (role === 'student') links = studentLinks;

    return (
        <aside className="dashboard-sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <Home size={28} style={{ color: '#6366f1', marginBottom: '4px' }} />
                    <span style={{ marginLeft: '10px' }}>HOSTEL MANAGEMENT</span>
                </div>
            </div>

            <nav className="sidebar-menu">
                {links.map((link, index) => (
                    <div key={index} className="menu-item">
                        <Link
                            to={link.path}
                            className={`menu-link ${location.pathname === link.path ? 'active' : ''}`}
                        >
                            {link.icon}
                            <span>{link.label}</span>
                        </Link>
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <Link to="/" className="menu-link" onClick={handleLogout}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </Link>
            </div>
        </aside>
    );
}

