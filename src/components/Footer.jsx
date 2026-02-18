import React from 'react';
import { Shield, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Home } from 'lucide-react';
import './Footer.css';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer id="contact" className="footer">
            <div className="footer-container">
                <div className="footer-grid">
                    {/* About Section */}
                    <div className="footer-section">
                        <div className="footer-logo">
                            <Home className="footer-logo-icon" />
                            <span className="footer-logo-text">HOSTEL MANAGEMENT</span>
                        </div>
                        <p className="footer-description">
                            Providing a safe, comfortable, and academically focused living environment for students. Your success is our primary mission.
                        </p>
                        <div className="social-links">
                            <a href="#" className="social-link" aria-label="Facebook">
                                <Facebook />
                            </a>
                            <a href="#" className="social-link" aria-label="Twitter">
                                <Twitter />
                            </a>
                            <a href="#" className="social-link" aria-label="Instagram">
                                <Instagram />
                            </a>
                            <a href="#" className="social-link" aria-label="LinkedIn">
                                <Linkedin />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-section">
                        <h3 className="footer-title">Quick Links</h3>
                        <ul className="footer-links">
                            <li><a href="#home">Home</a></li>
                            <li><a href="#about">About Us</a></li>
                            <li><a href="#rooms">Rooms</a></li>
                            <li><a href="#apply">Apply Now</a></li>
                            <li><a href="#contact">Contact</a></li>
                        </ul>
                    </div>

                    {/* Facilities */}
                    <div className="footer-section">
                        <h3 className="footer-title">Our Services</h3>
                        <ul className="footer-links">
                            <li><a href="#about">24/7 Security</a></li>
                            <li><a href="#about">Hostel Wi-Fi</a></li>
                            <li><a href="#about">Student Mess</a></li>
                            <li><a href="#about">Laundry Service</a></li>
                            <li><a href="#about">Reading Rooms</a></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="footer-section">
                        <h3 className="footer-title">Contact Us</h3>
                        <ul className="footer-contact">
                            <li className="contact-item">
                                <MapPin className="contact-icon" />
                                <span>123 University Ave, City, State 12345</span>
                            </li>
                            <li className="contact-item">
                                <Phone className="contact-icon" />
                                <span>+1 (555) 123-4567</span>
                            </li>
                            <li className="contact-item">
                                <Mail className="contact-icon" />
                                <span>support@luxehostel.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="footer-bottom">
                    <p className="footer-copyright">
                        © {currentYear} Hostel Management. All rights reserved.
                    </p>
                    <div className="footer-bottom-links">
                        <a href="#privacy">Privacy Policy</a>
                        <span className="separator">•</span>
                        <a href="#terms">Terms of Service</a>
                        <span className="separator">•</span>
                        <a href="#cookies">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
