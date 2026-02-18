import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import NeuralCursor from './components/NeuralCursor.jsx';

// Lazy load components
const Home = lazy(() => import('./components/Home.jsx'));
const AdminDashboard = lazy(() => import('./components/dashboard/AdminDashboard.jsx'));
const WardenDashboard = lazy(() => import('./components/dashboard/WardenDashboard.jsx'));
const StudentDashboard = lazy(() => import('./components/dashboard/StudentDashboard.jsx'));
const Login = lazy(() => import('./components/Login.jsx'));
const Signup = lazy(() => import('./components/Signup.jsx'));

// Loading component for Suspense
const PageLoader = () => (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: '#00f2ff' }}>
        <div className="loader">LOADING SECURE PORTAL...</div>
    </div>
);

export default function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: '#00f2ff' }}>
                <div className="loader">INITIALIZING HAVEN OS...</div>
            </div>
        );
    }

    const ProtectedRoute = ({ children, allowedRoles }) => {
        if (!session) return <Navigate to="/login" replace />;

        // Check metadata for role - handle both possible paths
        const userRole = session.user.user_metadata?.role || session.user.app_metadata?.role || 'student';

        // Admin can access all portals
        if (userRole === 'admin') return children;

        if (allowedRoles && !allowedRoles.includes(userRole)) {
            // Redirect unauthorized users to their own dashboard
            console.warn(`Access denied for ${userRole} to ${allowedRoles} - redirecting to authorized zone.`);
            return <Navigate to={`/${userRole}`} replace />;
        }

        return children;
    };

    return (
        <>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/" element={<Home session={session} />} />
                    <Route path="/login" element={!session ? <Login /> : <Navigate to={`/${session.user.user_metadata?.role || 'student'}`} replace />} />
                    <Route path="/signup" element={!session ? <Signup /> : <Navigate to={`/${session.user.user_metadata?.role || 'student'}`} replace />} />

                    <Route path="/admin/*" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/warden/*" element={
                        <ProtectedRoute allowedRoles={['warden']}>
                            <WardenDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/student/*" element={
                        <ProtectedRoute allowedRoles={['student']}>
                            <StudentDashboard />
                        </ProtectedRoute>
                    } />

                    {/* Catch-all redirect */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Suspense>
            <NeuralCursor />
        </>
    );
}

