import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, UserPlus, Github, Chrome, Shield, User, Smartphone, UserCircle, Home } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './Auth.css';

export default function Signup() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'student'
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const { data, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        phone: formData.phone,
                        role: formData.role
                    }
                }
            });

            if (authError) throw authError;

            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
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
                    <h1>Create Account</h1>
                    <p>Join the Hostel Management Community</p>
                </div>

                {error && <div className="auth-error-message">{error}</div>}
                {success && <div className="auth-success-message">Registration successful! Redirecting to login...</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="name-grid">
                        <div className="input-group">
                            <label>First Name</label>
                            <div className="input-wrapper">
                                <User className="input-icon" size={20} />
                                <input
                                    type="text"
                                    name="firstName"
                                    className="auth-input"
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Last Name</label>
                            <div className="input-wrapper">
                                <User className="input-icon" size={20} />
                                <input
                                    type="text"
                                    name="lastName"
                                    className="auth-input"
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>User Type</label>
                        <div className="input-wrapper">
                            <UserCircle className="input-icon" size={20} />
                            <select
                                name="role"
                                className="auth-input role-select"
                                value={formData.role}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="student">Student (Resident)</option>
                                <option value="warden">Hostel Staff (Warden)</option>
                                <option value="admin">System Administrator</option>
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" size={20} />
                            <input
                                type="email"
                                name="email"
                                className="auth-input"
                                placeholder="name@email.com"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Phone Number</label>
                        <div className="input-wrapper">
                            <Smartphone className="input-icon" size={20} />
                            <input
                                type="tel"
                                name="phone"
                                className="auth-input"
                                placeholder="+91 123456789"
                                value={formData.phone}
                                onChange={handleInputChange}
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
                                name="password"
                                className="auth-input"
                                placeholder="Min 6 characters"
                                value={formData.password}
                                onChange={handleInputChange}
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

                    <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? (
                            "Registering..."
                        ) : (
                            <>
                                Register Account <UserPlus size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-divider">or signup with</div>

                <div className="social-auth">
                    <button className="social-btn">
                        <Chrome size={20} /> Google
                    </button>
                    <button className="social-btn">
                        <Github size={20} /> GitHub
                    </button>
                </div>

                <div className="auth-footer">
                    Already have an account?
                    <Link to="/login" className="auth-link">Sign In</Link>
                </div>
            </div>
        </div>
    );
}


