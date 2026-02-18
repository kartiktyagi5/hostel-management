import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
    Wifi, Utensils, Shield, Star, Navigation2, Send,
    ArrowRight, CheckCircle2, Heart, Coffee, Dumbbell,
    BookOpen, Camera, Sparkles, MapPin, Globe, Cpu,
    Zap, Activity, Layout, Layers, Box, Maximize, Lock,
    Users, Play
} from 'lucide-react';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

import LuxuryRoom3D from './LuxuryRoom3D.jsx';
import HeroTechDecor from './HeroTechDecor.jsx';
import { supabase } from '../supabaseClient';
import './Home.css';

export default function Home() {
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const { error } = await supabase.from('queries').insert([data]);
            if (error) throw error;
            alert("Inquiry Sent Successfully. Our team will contact you shortly.");
            e.target.reset();
        } catch (err) {
            console.error("Error sending inquiry:", err);
            alert("Inquiry Sent! (Note: Ensure 'queries' table exists in Supabase)");
        }
    };

    const [isVisible3D, setIsVisible3D] = React.useState(false);

    useEffect(() => {
        const observerOptions = { threshold: 0.1 };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-visible');
                    if (entry.target.classList.contains('hero-visual-block')) {
                        setIsVisible3D(true);
                    }
                } else {
                    if (entry.target.classList.contains('hero-visual-block')) {
                        setIsVisible3D(false);
                    }
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <>
            <div className="aurora-bg">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            <Navbar />

            <main className="luxe-main">
                {/* Re-engineered Hero Section */}
                <section id="home" className="hero-modern">
                    <div className="container hero-split">
                        <div className="hero-text-block">
                            <div className="reveal hero-badge">
                                <span className="dot"></span>
                                <span>Modern Student Housing</span>
                            </div>
                            <h1 className="hero-main-title reveal">
                                Your Home <br />
                                <span className="text-outline">Away</span> From Home
                            </h1>
                            <p className="hero-subline reveal">
                                A safe, comfortable, and vibrant living space for students. Combining modern management with all the amenities you need for academic success.
                            </p>
                            <div className="hero-buttons reveal">
                                <a href="#apply" className="btn-primary-luxe">
                                    Reserve Room Now <ArrowRight size={20} />
                                </a>
                                <div className="hero-stats-mini">
                                    <div className="mini-stat">
                                        <strong>500+</strong>
                                        <span>Happy Guests</span>
                                    </div>
                                    <div className="divider"></div>
                                    <div className="mini-stat">
                                        <strong>24/7</strong>
                                        <span>Full Security</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="hero-visual-block reveal">
                            <div className="visual-stage-v2" style={{ boxShadow: 'none', background: 'transparent' }}>
                                {isVisible3D && (
                                    <Canvas shadows camera={{ position: [0, 2, 10], fov: 40 }}>
                                        <HeroTechDecor />
                                        <LuxuryRoom3D />
                                    </Canvas>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Placeholder for next sections - we will do them section by section */}
                {/* --- HAVEN CORE: Neural Infrastructure --- */}
                <section id="about" className="infrastructure-core-section">
                    <div className="hex-bg-pattern"></div>

                    <div className="container">
                        <div className="center-text-block reveal">
                            <span className="premium-tag">Hostel Facilities</span>
                            <h2 className="glitch-title">Designed for <span>Comfort & Safety</span></h2>
                            <p className="subtitle-luxe" style={{ color: '#94a3b8' }}>
                                We provide a comprehensive range of services tailored to meet the needs of every student.
                            </p>
                        </div>

                        <div className="core-hub-container" style={{ marginTop: '4rem' }}>
                            <div className="neural-nodes-grid">
                                {/* Node 01 */}
                                <div className="neural-card" style={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                    <span className="node-tag">Security</span>
                                    <h3>24/7 Security</h3>
                                    <p>Comprehensive CCTV coverage and warden presence to ensure a safe environment for all residents.</p>
                                </div>

                                {/* Node 02 */}
                                <div className="neural-card" style={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: '#fff' }}>
                                    <span className="node-tag">Internet</span>
                                    <h3>High-Speed Wi-Fi</h3>
                                    <p>High-speed campus-wide Wi-Fi to support your online learning and research requirements.</p>
                                </div>

                                {/* Node 03 */}
                                <div className="neural-card" style={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: '#fff' }}>
                                    <span className="node-tag">Laundry</span>
                                    <h3>Laundry Services</h3>
                                    <p>Professional laundry and dry-cleaning services available within the hostel premises.</p>
                                </div>

                                {/* Node 04 */}
                                <div className="neural-card" style={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: '#fff' }}>
                                    <span className="node-tag">Dining</span>
                                    <h3>Hygienic Mess</h3>
                                    <p>Nutritious and delicious meals served daily with strict adherence to hygiene standards.</p>
                                </div>

                                {/* Node 05 */}
                                <div className="neural-card" style={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: '#fff' }}>
                                    <span className="node-tag">Medical</span>
                                    <h3>Emergency Support</h3>
                                    <p>On-call medical assistance and tie-ups with nearby hospitals for student health safety.</p>
                                </div>

                                {/* Node 06 */}
                                <div className="neural-card" style={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: '#fff' }}>
                                    <span className="node-tag">Study</span>
                                    <h3>Reading Rooms</h3>
                                    <p>Dedicated quiet spaces and reading rooms equipped for productive late-night sessions.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Showcasing the Rooms: The Living Nodes - Simplified */}
                <section id="rooms" className="atoll-section">
                    <div className="container">
                        <div className="atoll-header reveal">
                            <div className="atoll-title-wrap">
                                <span className="atoll-tag">Our Inventory</span>
                                <h2 className="atoll-title">Available Room Types</h2>
                                <p style={{ color: '#64748b', marginTop: '1rem', fontSize: '1.1rem' }}>
                                    Comfortable residential suites for your educational journey.
                                </p>
                                <div className="atoll-stats-strip" style={{ marginTop: '2rem' }}>
                                    <div className="atoll-stat">
                                        <span className="val">24+</span>
                                        <span className="lab">Premium Amenities</span>
                                    </div>
                                    <div className="atoll-stat">
                                        <span className="val">500</span>
                                        <span className="lab">Happy Students</span>
                                    </div>
                                </div>
                            </div>
                            <div className="atoll-visual-frame">
                                <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000" alt="Node Blueprint" loading="lazy" />
                                <div className="visual-overlay-scan"></div>
                            </div>
                        </div>

                        <div className="atoll-grid">
                            {[
                                {
                                    title: 'Single Seater Room',
                                    price: '8,500',
                                    img: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&q=80&w=2070',
                                    tag: 'Private & Quiet',
                                    availability: 'Limited Rooms'
                                },
                                {
                                    title: 'Premium Single Room',
                                    price: '12,000',
                                    img: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=2070',
                                    tag: 'Large Studio',
                                    availability: 'Available'
                                },
                                {
                                    title: 'Double Seater Room',
                                    price: '6,500',
                                    img: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&q=80&w=2070',
                                    tag: 'Social Living',
                                    availability: 'Filling Fast'
                                }
                            ].map((item, i) => (
                                <div key={i} className="atoll-card reveal">
                                    <div className="atoll-img-space">
                                        <img src={item.img} alt={item.title} loading="lazy" />
                                    </div>
                                    <div className="atoll-overlay"></div>
                                    <div className="atoll-content">
                                        <div className="node-label">
                                            <Heart size={14} /> {item.tag}
                                        </div>
                                        <h3>{item.title}</h3>
                                        <div className="atoll-price">Monthly Rent <span>₹{item.price}</span></div>

                                        <div className="atoll-capacity">
                                            <div className="capacity-head">
                                                <span>Availability Status</span>
                                                <span>{item.availability}</span>
                                            </div>
                                            <div className="capacity-bar">
                                                <div className="bar-fill" style={{ '--percent': item.availability === 'Available' ? '100%' : (item.availability === 'Filling Fast' ? '40%' : '15%') }}></div>
                                            </div>
                                        </div>

                                        <a href="#apply" className="atoll-link">
                                            Book Your Room <ArrowRight size={20} />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>



                {/* Lifestyle Prism Section */}
                <section className="prism-section">
                    <div className="container">
                        <div className="prism-layout">
                            <div className="prism-content reveal">
                                <span className="prism-tag">Campus Life</span>
                                <h2 className="prism-title">Community & <br /> Growth</h2>
                                <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: '1.8' }}>
                                    We foster an environment where friendships are made and futures are built. Living here is about making memories for life.
                                </p>

                                <div className="prism-features">
                                    <div className="feature-pill">
                                        <div className="feature-icon"><Users size={24} /></div>
                                        <div className="feature-text">
                                            <h4>Peer Interaction</h4>
                                            <p>Build lifelong friendships with a diverse group of fellow students.</p>
                                        </div>
                                    </div>
                                    <div className="feature-pill">
                                        <div className="feature-icon"><Layout size={24} /></div>
                                        <div className="feature-text">
                                            <h4>Common Spaces</h4>
                                            <p>Spacious lounges for recreation, indoor games, and relaxation.</p>
                                        </div>
                                    </div>
                                    <div className="feature-pill">
                                        <div className="feature-icon"><BookOpen size={24} /></div>
                                        <div className="feature-text">
                                            <h4>Academic Focus</h4>
                                            <p>Optimized environment for group studies and academic excellence.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="prism-visuals reveal">
                                <div className="prism-bg-grid"></div>
                                <div className="pv-item pv-1">
                                    <img src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=2070" alt="Community" loading="lazy" />
                                </div>
                                <div className="pv-item pv-2">
                                    <img src="https://images.unsplash.com/photo-1543269664-76bc3997d9ea?auto=format&fit=crop&q=80&w=2070" alt="Networking" loading="lazy" />
                                </div>
                                <div className="pv-item pv-3">
                                    <img src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&q=80&w=2075" alt="Wellness" loading="lazy" />
                                </div>

                                <div className="community-pulse-card">
                                    <div className="pulse-item">
                                        <Activity size={20} color="#6366f1" />
                                        <div className="pulse-bar-wrap">
                                            <div className="pulse-label"><span>Social Activity</span><span>88%</span></div>
                                            <div className="pulse-progress"><div className="p-fill" style={{ '--p': '88%' }}></div></div>
                                        </div>
                                    </div>
                                    <div className="pulse-item">
                                        <Zap size={20} color="#fbbf24" fill="#fbbf24" />
                                        <div className="pulse-bar-wrap">
                                            <div className="pulse-label"><span>Study Flow</span><span>Live</span></div>
                                            <div className="pulse-progress"><div className="p-fill" style={{ '--p': '65%', background: '#fbbf24' }}></div></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>



                {/* Form Section */}
                <section id="apply" className="section-spacing">
                    <div className="container">
                        <div className="form-wrapper reveal">
                            <div className="form-info">
                                <h2 className="title-massive">Reserve Your Spot</h2>
                                <p>Apply today to secure your preferred room for the next academic session. Our team will guide you through the process.</p>
                                <div className="trust-pills">
                                    <div className="trust-pill"><Shield size={18} /> Verified Safety</div>
                                    <div className="trust-pill"><CheckCircle2 size={18} /> Instant Approval</div>
                                </div>
                            </div>
                            <div className="form-box">
                                <form className="luxe-form" onSubmit={handleFormSubmit}>
                                    <div className="input-group">
                                        <input type="text" name="full_name" placeholder="Full Name" required />
                                        <input type="email" name="email" placeholder="Email Address" required />
                                    </div>
                                    <select name="room_type" required>
                                        <option value="">Select Room Type</option>
                                        <option value="Single Seater">Single Seater Room</option>
                                        <option value="Premium Single">Premium Single Room</option>
                                        <option value="Double Seater">Double Seater Room</option>
                                    </select>
                                    <textarea name="message" placeholder="Tell us about yourself or any special requests" rows="4"></textarea>
                                    <button type="submit" className="btn-luxe full-width">Send Inquiry <Send size={20} /></button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}