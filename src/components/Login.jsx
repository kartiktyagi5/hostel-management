import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Github, Chrome, Shield, Home } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './Auth.css';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            // Success! Get user metadata to redirect by role
            const user = data.user;
            const role = user.user_metadata?.role || user.app_metadata?.role || 'student';

            console.log('Login successful. Detected role:', role);

            if (role === 'admin') navigate('/admin', { replace: true });
            else if (role === 'warden') navigate('/warden', { replace: true });
            else navigate('/student', { replace: true });

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-background"></div>

            <div className="auth-card">
                <div className="auth-logo">
                    <div className="logo-icon-wrapper">
                        <Home size={32} />
                    </div>
                </div>

                <div className="auth-header">
                    <h1>Welcome Back</h1>
                    <p>Student & Staff Login Portal</p>
                </div>

                {error && <div className="auth-error-message">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" size={20} />
                            <input
                                type="email"
                                className="auth-input"
                                placeholder="name@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                className="auth-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="auth-options">
                        <label className="remember-me">
                            <input type="checkbox" className="checkbox-custom" />
                            Remember Me
                        </label>
                        <a href="#forgot" className="forgot-password">Forgot Password?</a>
                    </div>

                    <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? (
                            "Verifying..."
                        ) : (
                            <>
                                Sign In <LogIn size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-divider">or continue with</div>

                <div className="social-auth">
                    <button className="social-btn">
                        <Chrome size={20} /> Google
                    </button>
                    <button className="social-btn">
                        <Github size={20} /> GitHub
                    </button>
                </div>

                <div className="auth-footer">
                    New to Hostel Management?
                    <Link to="/signup" className="auth-link">Create Account</Link>
                </div>
            </div>
        </div>
    );
}


