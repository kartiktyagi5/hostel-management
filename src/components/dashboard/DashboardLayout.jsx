import React from 'react';
import Sidebar from './Sidebar.jsx';
import './Dashboard.css';

export default function DashboardLayout({ children, role, title, subtitle }) {
    return (
        <div className="dashboard-container">
            <Sidebar role={role} />
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="header-title">
                        <h1>{title}</h1>
                        <p>{subtitle}</p>
                    </div>
                </header>
                {children}
            </main>
        </div>
    );
}
