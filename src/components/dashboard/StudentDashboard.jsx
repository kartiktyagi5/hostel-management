import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout.jsx';
import { supabase } from '../../supabaseClient';
import {
    Clock, CheckCircle, XCircle, Utensils,
    MessageSquare, AlertCircle, FileText, Send, User, Bell, BedDouble, Edit, Trash2, Wallet
} from 'lucide-react';
import './Dashboard.css';

export default function StudentDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const [view, setView] = useState('overview');
    const [loading, setLoading] = useState(true);

    // Data State
    const [student, setStudent] = useState(null);
    const [profile, setProfile] = useState(null);
    const [messMenu, setMessMenu] = useState([]); // Full week
    const [todayMenu, setTodayMenu] = useState(null);
    const [notices, setNotices] = useState([]);
    const [myComplaints, setMyComplaints] = useState([]);
    const [myFees, setMyFees] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]); // New state for attendance

    // Edit Profile State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({});

    // Complaint Form
    const [complaintForm, setComplaintForm] = useState({ title: '', description: '' });

    // Room Request Form
    const [roomRequestForm, setRoomRequestForm] = useState({ reason: '', preferred_block: 'A' });

    // Payment Process State
    const [isPaying, setIsPaying] = useState(false);

    // Sync View with URL
    useEffect(() => {
        const path = location.pathname.split('/student')[1];
        if (!path || path === '') setView('overview');
        else setView(path.replace('/', ''));
    }, [location]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch Profile
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(profileData);

            // 2. Fetch Student Record (using user_id)
            const { data: studentData } = await supabase.from('students').select('*, rooms(*)').eq('user_id', user.id).single();
            setStudent(studentData);
            if (studentData) {
                setProfileForm({
                    parent_phone: studentData.parent_phone || '',
                    blood_group: studentData.blood_group || '',
                    address: studentData.address || '',
                    email: studentData.email || '',
                    phone: studentData.phone || ''
                });

                // Fetch Fees
                const { data: feesData } = await supabase.from('fees').select('*').eq('student_id', studentData.id).single();
                setMyFees(feesData);

                // Fetch Attendance History
                const { data: attendanceData } = await supabase.from('attendance')
                    .select('*')
                    .eq('student_id', studentData.id)
                    .order('date', { ascending: false });
                setAttendanceHistory(attendanceData || []);
            }

            // 3. Fetch Mess Menu (All)
            const { data: menuData } = await supabase.from('mess_menu').select('*');
            const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
            const sortedMenu = menuData?.sort((a, b) => dayOrder[a.day_of_week] - dayOrder[b.day_of_week]) || [];
            setMessMenu(sortedMenu);

            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const today = days[new Date().getDay()];
            setTodayMenu(sortedMenu.find(m => m.day_of_week === today));

            // 4. Fetch Notices
            const { data: noticesData } = await supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(5);
            setNotices(noticesData || []);

            // 5. Fetch Complaints
            if (studentData) {
                const { data: complaintsData } = await supabase.from('complaints').select('*').eq('student_id', studentData.id).order('created_at', { ascending: false });
                setMyComplaints(complaintsData || []);
            }

        } catch (error) {
            console.error('Error fetching student data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('students').update({
                parent_phone: profileForm.parent_phone,
                blood_group: profileForm.blood_group,
                address: profileForm.address,
                email: profileForm.email,
                phone: profileForm.phone
            }).eq('id', student.id);

            if (error) throw error;

            alert('Profile updated successfully');
            setIsEditingProfile(false);
            fetchDashboardData();
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        }
    };

    const handleComplaintSubmit = async (e) => {
        e.preventDefault();
        if (!student) {
            alert('Student profile not linked. Contact Admin.');
            return;
        }
        try {
            const { error } = await supabase.from('complaints').insert({
                student_id: student.id,
                title: complaintForm.title,
                description: complaintForm.description,
                status: 'pending'
            });

            if (error) throw error;

            alert('Complaint submitted successfully');
            setComplaintForm({ title: '', description: '' });
            fetchDashboardData(); // Refresh list
        } catch (error) {
            console.error('Error submitting complaint:', error);
            alert('Failed to submit complaint');
        }
    };

    const handleDeleteComplaint = async (id) => {
        if (!window.confirm("Are you sure you want to delete this complaint?")) return;
        try {
            const { error } = await supabase.from('complaints').delete().eq('id', id);
            if (error) throw error;
            fetchDashboardData();
        } catch (error) {
            console.error('Error deleting complaint:', error);
            alert('Failed to delete complaint');
        }
    };

    const handleRoomRequestSubmit = async (e) => {
        e.preventDefault();
        if (!student) {
            alert('Student profile not linked. Contact Admin.');
            return;
        }
        try {
            const title = `Room Change Request - ${student.name}`;
            const description = `Preferred Block: ${roomRequestForm.preferred_block}. Reason: ${roomRequestForm.reason}`;

            const { error } = await supabase.from('complaints').insert({
                student_id: student.id,
                title: title,
                description: description,
                status: 'pending'
            });

            if (error) throw error;

            alert('Room change request submitted successfully');
            setRoomRequestForm({ reason: '', preferred_block: 'A' });
            fetchDashboardData();
        } catch (error) {
            console.error('Error submitting room request:', error);
            alert('Failed to submit request');
        }
    };

    // --- Renderers ---

    const renderOverview = () => (
        <>
            {/* ID Card Style Profile */}
            <div className="profile-card-large" style={{ background: 'white', padding: '2.5rem', borderRadius: '28px', border: '1px solid var(--dash-border)', marginBottom: '2.5rem', boxShadow: 'var(--dash-shadow)' }}>
                <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="profile-avatar-large" style={{ background: 'var(--dash-accent-light)', padding: '1.5rem', borderRadius: '24px', color: 'var(--dash-accent)' }}>
                        <User size={56} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--dash-text)' }}>{student?.name || profile?.name || 'Student'}</h2>
                                <p style={{ margin: '0.2rem 0 0', color: 'var(--dash-text-muted)', fontWeight: '600' }}>Official Resident Profile</p>
                            </div>
                            <button onClick={() => setIsEditingProfile(true)} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Edit size={16} /> Edit Profile
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                            <div>
                                <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Room Assignment</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--dash-text)' }}>{student?.rooms?.room_no || 'Unassigned'} <span style={{ color: 'var(--dash-text-muted)', fontWeight: '500' }}>(Block {student?.rooms?.block || '-'})</span></p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Academic Course</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--dash-text)' }}>{student?.course || 'Not Updated'}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Contact Phone</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--dash-text)' }}>{student?.phone || 'Not Provided'}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Fee Status</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: '700', color: myFees?.status === 'paid' ? '#15803d' : '#b91c1c' }}>
                                    {myFees ? myFees.status.toUpperCase() : 'NO RECORDS'}
                                </p>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--dash-border)', fontSize: '0.95rem', color: 'var(--dash-text-muted)', display: 'flex', flexWrap: 'wrap', gap: '2.5rem', fontWeight: '500' }}>
                            <span><span style={{ fontWeight: '700', color: 'var(--dash-text)' }}>Email:</span> {student?.email || 'N/A'}</span>
                            <span><span style={{ fontWeight: '700', color: 'var(--dash-text)' }}>Parent:</span> {student?.parent_phone || 'N/A'}</span>
                            <span><span style={{ fontWeight: '700', color: 'var(--dash-text)' }}>Blood:</span> {student?.blood_group || 'N/A'}</span>
                            <span><span style={{ fontWeight: '700', color: 'var(--dash-text)' }}>Address:</span> {student?.address || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid-2">
                <div className="content-section">
                    <div className="section-header">
                        <h2 className="section-title">Daily Menu</h2>
                        <Utensils size={20} color="var(--dash-accent)" />
                    </div>
                    {todayMenu ? (
                        <div className="menu-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <div className="menu-item-card" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '18px', border: '1px solid var(--dash-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem', color: '#f59e0b' }}>
                                    <Clock size={16} /> <span style={{ fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase' }}>Breakfast</span>
                                </div>
                                <div style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--dash-text)' }}>{todayMenu.breakfast}</div>
                            </div>
                            <div className="menu-item-card" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '18px', border: '1px solid var(--dash-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem', color: '#10b981' }}>
                                    <Utensils size={16} /> <span style={{ fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase' }}>Lunch</span>
                                </div>
                                <div style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--dash-text)' }}>{todayMenu.lunch}</div>
                            </div>
                            <div className="menu-item-card" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '18px', border: '1px solid var(--dash-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem', color: '#8b5cf6' }}>
                                    <Clock size={16} /> <span style={{ fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase' }}>Snacks</span>
                                </div>
                                <div style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--dash-text)' }}>{todayMenu.snacks}</div>
                            </div>
                            <div className="menu-item-card" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '18px', border: '1px solid var(--dash-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem', color: '#6366f1' }}>
                                    <Utensils size={16} /> <span style={{ fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase' }}>Dinner</span>
                                </div>
                                <div style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--dash-text)' }}>{todayMenu.dinner}</div>
                            </div>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--dash-text-muted)', fontWeight: '500' }}>Menu not updated for today.</p>
                    )}
                </div>

                <div className="content-section">
                    <div className="section-header">
                        <h2 className="section-title">Notice Board</h2>
                        <Bell size={20} color="var(--dash-accent)" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {notices.length > 0 ? notices.map((n, i) => (
                            <div key={n.id || i} className="stat-card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b', background: 'white' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <p style={{ margin: '0', fontWeight: '700', fontSize: '1.05rem', color: 'var(--dash-text)' }}>{n.title}</p>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--dash-text-muted)', fontWeight: '600' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--dash-text-muted)', lineHeight: '1.5' }}>{n.message}</p>
                            </div>
                        )) : <p style={{ color: 'var(--dash-text-muted)', fontWeight: '500' }}>No new announcements yet.</p>}
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditingProfile && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Edit Profile</h3>
                        <form onSubmit={handleProfileUpdate} className="modal-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input className="form-input" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input className="form-input" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Parent Phone</label>
                                    <input className="form-input" value={profileForm.parent_phone} onChange={(e) => setProfileForm({ ...profileForm, parent_phone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Blood Group</label>
                                    <select className="form-select" value={profileForm.blood_group} onChange={(e) => setProfileForm({ ...profileForm, blood_group: e.target.value })}>
                                        <option value="">Select</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Address</label>
                                <textarea className="form-input" rows="2" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-outline" onClick={() => setIsEditingProfile(false)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );

    const renderFees = () => (
        <div className="content-section">
            <div className="section-header">
                <h2 className="section-title">My Fees</h2>
                <Wallet size={20} color="var(--dash-accent)" />
            </div>

            {myFees ? (
                <div>
                    <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <p style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>Total Payable Amount</p>
                            <h2 style={{ margin: 0, fontSize: '2.5rem' }}>₹{myFees.amount.toLocaleString()}</h2>
                            <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Due Date: {new Date(myFees.due_date).toLocaleDateString()}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <span className={`status-pill ${myFees.status === 'paid' ? 'status-success' : 'status-danger'}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                                    {myFees.status.toUpperCase()}
                                </span>
                            </div>
                            {myFees.status === 'pending' && (
                                <button
                                    className="btn-primary"
                                    disabled={isPaying}
                                    style={{ opacity: isPaying ? 0.7 : 1, cursor: isPaying ? 'wait' : 'pointer' }}
                                    onClick={async () => {
                                        if (window.confirm('Proceed to mock payment gateway?')) {
                                            setIsPaying(true);
                                            // Simulate Payment Delay
                                            setTimeout(async () => {
                                                const { error } = await supabase.from('fees').update({ status: 'paid', payment_date: new Date() }).eq('id', myFees.id);
                                                setIsPaying(false);
                                                if (!error) {
                                                    alert('Payment Successful!');
                                                    fetchDashboardData();
                                                } else {
                                                    alert('Payment Failed');
                                                }
                                            }, 2000); // 2 second mock delay
                                        }
                                    }}>
                                    {isPaying ? 'Processing...' : 'Pay Now'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="dashboard-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Term</th>
                                    <th>Amount</th>
                                    <th>Date Paid</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Hostel & Mess Fees</td>
                                    <td>{myFees.payment_type === '6_months' ? 'Semester (6 Months)' : 'Yearly'}</td>
                                    <td>₹{myFees.amount}</td>
                                    <td>{myFees.payment_date ? new Date(myFees.payment_date).toLocaleDateString() : '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No fee records found for this account. Please contact admin.</p>
            )}
        </div>
    );

    const renderAttendance = () => (
        <div className="content-section">
            <div className="section-header">
                <h2 className="section-title">My Attendance History</h2>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                    <span><CheckCircle size={14} style={{ verticalAlign: 'middle', color: '#22c55e' }} /> Present: {attendanceHistory.filter(a => a.status === 'present').length}</span>
                    <span><XCircle size={14} style={{ verticalAlign: 'middle', color: '#ef4444' }} /> Absent: {attendanceHistory.filter(a => a.status === 'absent').length}</span>
                </div>
            </div>
            <div className="table-container">
                <table className="dashboard-table">
                    <thead><tr><th>Date</th><th>Status</th><th>Recorded At</th></tr></thead>
                    <tbody>
                        {attendanceHistory.map(record => (
                            <tr key={record.id}>
                                <td>{new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                <td>
                                    <span className={`status-pill ${record.status === 'present' ? 'status-success' : 'status-danger'}`}>
                                        {record.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            </tr>
                        ))}
                        {attendanceHistory.length === 0 && (
                            <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>No attendance records found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderComplaints = () => (
        <div className="content-section">
            <div className="section-header">
                <h2 className="section-title">My Complaints</h2>
                <MessageSquare size={20} color="var(--dash-accent)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Visual / Info Side */}
                <div className="stat-card" style={{ background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(99, 102, 241, 0.1))', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <AlertCircle size={32} color="#fff" />
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff' }}>Facing an Issue?</h3>
                        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            We are here to help! Please describe your issue in detail.
                            Your complaint will be reviewed by the warden.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', textAlign: 'left', fontSize: '0.85rem', color: '#94a3b8' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <CheckCircle size={14} color="#22c55e" /> Average Response: 12 Hrs
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <CheckCircle size={14} color="#22c55e" /> Direct Warden Access
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Side */}
                <form onSubmit={handleComplaintSubmit} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--dash-border)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Edit size={16} /> New Complaint
                    </h3>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Subject <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            className="form-input"
                            placeholder="e.g., Fan not working, Water leakage..."
                            required
                            value={complaintForm.title}
                            onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
                            style={{ fontSize: '1rem' }}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Description <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <textarea
                            className="form-input"
                            rows="5"
                            placeholder="Please provide details about the location and nature of the problem..."
                            required
                            value={complaintForm.description}
                            onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                            style={{ fontSize: '0.95rem', lineHeight: '1.5' }}
                        />
                    </div>

                    <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                        <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem' }}>
                            <Send size={18} /> Submit Complaint
                        </button>
                    </div>
                </form>
            </div>

            <div className="section-header" style={{ marginTop: '3rem' }}>
                <h3 className="section-title" style={{ fontSize: '1.2rem' }}>History</h3>
            </div>

            <div className="table-container">
                <table className="dashboard-table">
                    <thead><tr><th>Date</th><th>Title</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                        {myComplaints.length > 0 ? myComplaints.map(c => (
                            <tr key={c.id}>
                                <td>{new Date(c.created_at).toLocaleDateString()}</td>
                                <td style={{ fontWeight: '500', color: '#fff' }}>{c.title}</td>
                                <td><span className={`status-pill ${c.status === 'resolved' ? 'status-success' : 'status-warning'}`}>{c.status.toUpperCase()}</span></td>
                                <td>
                                    <button className="btn-icon danger" onClick={() => handleDeleteComplaint(c.id)} title="Delete Complaint"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No complaints filed yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderMessMenu = () => (
        <div className="content-section">
            <div className="section-header">
                <h2 className="section-title">Mess Menu</h2>
            </div>
            <div className="table-container">
                <table className="dashboard-table">
                    <thead><tr><th>Day</th><th>Breakfast</th><th>Lunch</th><th>Snacks</th><th>Dinner</th></tr></thead>
                    <tbody>
                        {messMenu.map((day) => (
                            <tr key={day.id} style={{ background: todayMenu && todayMenu.id === day.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent' }}>
                                <td style={{ fontWeight: 'bold', color: 'var(--dash-accent)' }}>{day.day_of_week}</td>
                                <td>{day.breakfast}</td>
                                <td>{day.lunch}</td>
                                <td>{day.snacks}</td>
                                <td>{day.dinner}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderRoomRequest = () => (
        <div className="content-section">
            <div className="section-header">
                <h2 className="section-title">Request Room Change</h2>
            </div>

            <form onSubmit={handleRoomRequestSubmit} style={{ maxWidth: '600px' }}>
                <div className="form-group">
                    <label>Preferred Block</label>
                    <select className="form-input" value={roomRequestForm.preferred_block} onChange={e => setRoomRequestForm({ ...roomRequestForm, preferred_block: e.target.value })}>
                        <option value="A">Block A</option>
                        <option value="B">Block B</option>
                        <option value="C">Block C</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Reason for Change</label>
                    <textarea
                        className="form-input"
                        rows="4"
                        required
                        value={roomRequestForm.reason}
                        onChange={e => setRoomRequestForm({ ...roomRequestForm, reason: e.target.value })}
                        placeholder="Please explain why you want to change rooms..."
                    />
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Submit Request</button>
            </form>
        </div>
    );

    const renderNotices = () => (
        <div className="content-section">
            <div className="section-header">
                <h2 className="section-title">Recent Notices</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {notices.map(n => (
                    <div key={n.id} className="stat-card" style={{ borderLeft: '4px solid var(--dash-accent)' }}>
                        <h4 style={{ margin: '0 0 5px 0' }}>{n.title}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '10px' }}>
                            <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                            {new Date(n.created_at).toLocaleString()}
                        </p>
                        <p style={{ margin: 0, color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>{n.message}</p>
                    </div>
                ))}
                {notices.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center' }}>No notices yet.</p>}
            </div>
        </div>
    );

    if (loading) return <div className="loader">Loading Student Dashboard...</div>;

    return (
        <DashboardLayout role="student" title="Student Portal" subtitle={`Dashboard > ${view.charAt(0).toUpperCase() + view.slice(1)}`}>
            <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {['overview', 'fees', 'attendance', 'mess', 'complaints', 'room-request', 'notices'].map(t => (
                    <button
                        key={t}
                        onClick={() => navigate(t === 'overview' ? '/student' : `/student/${t}`)}
                        className={`btn-primary ${view === t ? '' : 'btn-outline'}`}
                        style={{
                            background: view === t ? 'var(--dash-accent)' : 'transparent',
                            border: '1px solid var(--dash-border)',
                            color: view === t ? '#fff' : 'var(--dash-text-muted)',
                            padding: '0.5rem 1rem',
                            fontSize: '0.9rem',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {t === 'room-request' ? 'ROOM CHANGE' : t.toUpperCase()}
                    </button>
                ))}
            </div>

            {view === 'overview' && renderOverview()}
            {view === 'fees' && renderFees()}
            {view === 'attendance' && renderAttendance()}
            {view === 'mess' && renderMessMenu()}
            {view === 'complaints' && renderComplaints()}
            {view === 'room-request' && renderRoomRequest()}
            {view === 'notices' && renderNotices()}
        </DashboardLayout>
    );
}
