import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout.jsx';
import { supabase } from '../../supabaseClient';
import {
    Users, BedDouble, AlertCircle, Edit3,
    FileText, CheckCircle, Clock, Plus, Utensils, Bell, Search, Save, X, Home, User, ListChecks, Trash2, Send
} from 'lucide-react';
import './Dashboard.css';

export default function WardenDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const [view, setView] = useState('overview');
    const [loading, setLoading] = useState(true);

    // Data State
    const [wardenProfile, setWardenProfile] = useState(null);
    const [students, setStudents] = useState([]);
    const [myBlockStudents, setMyBlockStudents] = useState([]); // Students in assigned block
    const [myBlockRooms, setMyBlockRooms] = useState([]); // Rooms in assigned block
    // Fix: Use local date for default to avoid "Yesterday" issue in early morning hours (e.g. IST vs UTC)
    const [attendanceDate, setAttendanceDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [messMenu, setMessMenu] = useState([]);
    const [stats, setStats] = useState({ present: 0, vacant: 0, issues: 0 });
    const [complaints, setComplaints] = useState([]);
    const [notices, setNotices] = useState([]);
    const [queries, setQueries] = useState([]);
    const [newNotice, setNewNotice] = useState({ title: '', message: '' });

    // Editing State
    const [isEditingMenu, setIsEditingMenu] = useState(false);
    const [editedMenu, setEditedMenu] = useState([]);

    useEffect(() => {
        const path = location.pathname.split('/warden')[1];
        if (!path || path === '') setView('overview');
        else {
            setView(path.replace('/', ''));
        }
    }, [location]);

    useEffect(() => {
        fetchWardenData();
    }, [attendanceDate]);

    const fetchWardenData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            let assignedBlock = 'A';
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setWardenProfile(profile);
                if (profile?.assigned_block) assignedBlock = profile.assigned_block;
            }

            // Fetch Students
            const { data: studentsData } = await supabase.from('students').select('*, rooms(room_no, block)').order('created_at', { ascending: false });

            // Fetch Fees
            const { data: feesData } = await supabase.from('fees').select('*');
            const feesMap = {};
            if (feesData) {
                feesData.forEach(f => {
                    feesMap[f.student_id] = f.status;
                });
            }
            // Enhance students with fee status
            const studentsWithFees = studentsData?.map(s => ({
                ...s,
                fee_status: feesMap[s.id] || 'pending' // Default to pending if no record
            })) || [];

            setStudents(studentsWithFees);

            // Filter for My Block (using enhanced list)
            const blockStudents = studentsWithFees.filter(s => s.rooms?.block === assignedBlock);
            setMyBlockStudents(blockStudents);

            // ... rest of fetchWardenData


            const { data: roomsData } = await supabase.from('rooms').select('*').eq('block', assignedBlock).order('room_no');
            setMyBlockRooms(roomsData || []);

            const { data: attData } = await supabase.from('attendance').select('*').eq('date', attendanceDate);
            const attMap = {};
            if (attData) {
                attData.forEach(a => {
                    attMap[a.student_id] = a.status;
                });
            }
            setAttendanceRecords(attMap);

            const { data: menuData } = await supabase.from('mess_menu').select('*');
            const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
            const sortedMenu = menuData?.sort((a, b) => dayOrder[a.day_of_week] - dayOrder[b.day_of_week]) || [];
            setMessMenu(sortedMenu);
            setEditedMenu(JSON.parse(JSON.stringify(sortedMenu)));

            const { data: complaintsData } = await supabase.from('complaints').select('*, students(name, rooms(room_no))').order('created_at', { ascending: false });
            setComplaints(complaintsData || []);

            // Fetch Notices
            const { data: noticesData } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
            setNotices(noticesData || []);

            // Fetch Queries
            const { data: queriesData } = await supabase.from('queries').select('*').order('created_at', { ascending: false });
            setQueries(queriesData || []);

            const totalVacant = roomsData?.reduce((acc, r) => acc + (r.capacity - r.occupied), 0) || 0;
            const issueCount = complaintsData?.filter(c => c.status === 'pending').length || 0;
            const presentCount = attData?.filter(a => a.status === 'present').length || 0;

            setStats({
                present: presentCount,
                vacant: totalVacant,
                issues: issueCount
            });

        } catch (error) {
            console.error('Error fetching warden data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAttendance = async (studentId, status) => {
        try {
            // Optimistic update
            setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));

            const { error } = await supabase.from('attendance').upsert({
                student_id: studentId,
                date: attendanceDate,
                status: status
            }, { onConflict: 'student_id, date' });

            if (error) {
                // Revert on error
                setAttendanceRecords(prev => ({ ...prev, [studentId]: attendanceRecords[studentId] }));
                throw error;
            }

        } catch (error) {
            console.error('Error marking attendance:', error);
            alert('Failed to save attendance. Please try again.');
        }
    };

    const markAllPresent = async () => {
        if (!window.confirm(`Mark all ${myBlockStudents.length} students as PRESENT for ${attendanceDate}?`)) return;
        try {
            // Optimistic UI update
            const newRecords = { ...attendanceRecords };
            myBlockStudents.forEach(s => newRecords[s.id] = 'present');
            setAttendanceRecords(newRecords);

            const updates = myBlockStudents.map(s => ({
                student_id: s.id,
                date: attendanceDate,
                status: 'present'
            }));

            const { error } = await supabase.from('attendance').upsert(updates, { onConflict: 'student_id, date' });
            if (error) {
                fetchWardenData(); // simplistic revert
                throw error;
            }
        } catch (error) {
            console.error('Error marking all present:', error);
            alert('Operation failed');
        }
    };

    const handleMenuChange = (index, field, value) => {
        const newMenu = [...editedMenu];
        newMenu[index][field] = value;
        setEditedMenu(newMenu);
    };

    const saveMessMenu = async () => {
        try {
            const { error } = await supabase.from('mess_menu').upsert(editedMenu);
            if (error) throw error;
            setMessMenu(editedMenu);
            setIsEditingMenu(false);
            alert('Mess Menu updated successfully!');
        } catch (error) {
            console.error('Error updating mess menu:', error);
            alert('Failed to update menu');
        }
    };

    const handleResolveComplaint = async (id) => {
        try {
            const { error } = await supabase.from('complaints').update({ status: 'resolved' }).eq('id', id);
            if (error) throw error;
            fetchWardenData();
        } catch (error) {
            console.error('Error resolving complaint:', error);
        }
    };

    const handleCreateNotice = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('notices').insert([newNotice]);
            if (error) throw error;
            alert('Notice posted successfully!');
            setNewNotice({ title: '', message: '' });
            fetchWardenData();
        } catch (error) {
            console.error('Error posting notice:', error);
            alert('Failed to post notice');
        }
    };

    const handleDeleteNotice = async (id) => {
        if (!window.confirm('Delete this notice?')) return;
        try {
            const { error } = await supabase.from('notices').delete().eq('id', id);
            if (error) throw error;
            fetchWardenData();
        } catch (error) {
            console.error('Error deleting notice:', error);
        }
    };

    // --- Renderers ---

    const renderOverview = () => (
        <>
            <div className="overview-welcome">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.4rem', letterSpacing: '-0.04em' }}>Welcome, {wardenProfile?.name || 'Warden'}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', color: 'var(--dash-text-muted)', fontWeight: '600' }}>
                            <Home size={20} style={{ color: 'var(--dash-accent)' }} />
                            <span>Staff Assignment: <strong>Block {wardenProfile?.assigned_block || 'Not Assigned'}</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card students">
                    <div className="stat-icon"><CheckCircle size={24} /></div>
                    <div className="stat-value">{Object.values(attendanceRecords).filter(s => s === 'present').length}</div>
                    <div className="stat-label">Present Today</div>
                </div>
                <div className="stat-card rooms">
                    <div className="stat-icon"><BedDouble size={24} /></div>
                    <div className="stat-value">{stats.vacant}</div>
                    <div className="stat-label">Vacant Beds (Block {wardenProfile?.assigned_block})</div>
                </div>
                <div className="stat-card fees">
                    <div className="stat-icon"><AlertCircle size={24} /></div>
                    <div className="stat-value">{stats.issues}</div>
                    <div className="stat-label">Pending Issues</div>
                </div>
            </div>

            <div className="grid-2">
                <div className="content-section">
                    <div className="section-header">
                        <h2 className="section-title">Quick Attendance</h2>
                        <button className="btn-primary" onClick={() => navigate('/warden/attendance')}>View All</button>
                    </div>
                    <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table className="dashboard-table">
                            <thead><tr><th>Name</th><th>Status</th></tr></thead>
                            <tbody>
                                {myBlockStudents.slice(0, 5).map(s => (
                                    <tr key={s.id}>
                                        <td>{s.name}</td>
                                        <td>
                                            <span className={`status-pill ${attendanceRecords[s.id] === 'present' ? 'status-success' : attendanceRecords[s.id] === 'absent' ? 'status-danger' : 'status-warning'}`}>
                                                {attendanceRecords[s.id] || 'Not Marked'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Combined Status and Quick Notices */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="content-section">
                        <div className="section-header">
                            <h2 className="section-title">Block {wardenProfile?.assigned_block} Overview</h2>
                            <div style={{ padding: '1rem', background: 'var(--dash-bg)', borderRadius: '16px' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--dash-text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Residents</p>
                                <p style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--dash-text)' }}>{myBlockStudents.length}</p>
                            </div>
                        </div>
                    </div>
                    {/* Recent Notices Preview */}
                    <div className="content-section">
                        <div className="section-header">
                            <h2 className="section-title">Latest Notice</h2>
                            <button className="btn-outline" onClick={() => navigate('/warden/notices')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>Manage</button>
                        </div>
                        {notices.length > 0 ? (
                            <div>
                                <h4 style={{ margin: '0 0 5px 0' }}>{notices[0].title}</h4>
                                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{notices[0].message.substring(0, 80)}...</p>
                            </div>
                        ) : <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No notices posted.</p>}
                    </div>
                </div>
            </div>
        </>
    );

    const renderRooms = () => (
        <div className="content-section">
            <div className="section-header">
                <h2 className="section-title">Room Allocation (Block {wardenProfile?.assigned_block})</h2>
            </div>
            <div className="table-container">
                <table className="dashboard-table">
                    <thead>
                        <tr><th>Room No</th><th>Status</th><th>Capacity</th><th>Occupants</th></tr>
                    </thead>
                    <tbody>
                        {myBlockRooms.map(room => {
                            const occupants = students.filter(s => s.room_id === room.id);
                            return (
                                <tr key={room.id}>
                                    <td style={{ fontWeight: 'bold' }}>{room.room_no}</td>
                                    <td><span className={`status-pill ${room.status === 'available' ? 'status-success' : 'status-danger'}`}>{room.status}</span></td>
                                    <td>{room.occupied} / {room.capacity}</td>
                                    <td>
                                        {occupants.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {occupants.map(s => (
                                                    <div key={s.id} style={{ fontSize: '0.85rem' }}>
                                                        <User size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                                        {s.name}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Empty</span>}
                                    </td>
                                </tr>
                            );
                        })}
                        {myBlockRooms.length === 0 && (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No rooms found in Block {wardenProfile?.assigned_block}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderAttendance = () => (
        <div className="content-section">
            <div className="section-header">
                <h2 className="section-title">Daily Attendance (Block {wardenProfile?.assigned_block})</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button className="btn-outline" onClick={markAllPresent} title="Mark all students in block as Present">
                        <ListChecks size={18} /> Mark All Present
                    </button>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {/* Today Button for quick reset */}
                        <button
                            className={`btn-outline ${attendanceDate === new Date().toLocaleDateString('en-CA') ? 'active' : ''}`}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                            onClick={() => setAttendanceDate(new Date().toLocaleDateString('en-CA'))}
                        >
                            Today
                        </button>
                        <div className="date-picker-wrapper">
                            <Clock size={16} />
                            <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="date-input" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="table-container">
                <table className="dashboard-table">
                    <thead><tr><th>Room</th><th>Student Name</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {myBlockStudents.length > 0 ? myBlockStudents.map((student) => (
                            <tr key={student.id}>
                                <td>{student.rooms?.room_no || 'NA'}</td>
                                <td>{student.name}</td>
                                <td>
                                    <span className={`status-pill ${attendanceRecords[student.id] === 'present' ? 'status-success' :
                                        attendanceRecords[student.id] === 'absent' ? 'status-danger' : 'status-warning'
                                        }`}>
                                        {attendanceRecords[student.id] ? attendanceRecords[student.id].charAt(0).toUpperCase() + attendanceRecords[student.id].slice(1) : 'Pending'}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <button
                                            className={`btn-icon ${attendanceRecords[student.id] === 'present' ? 'active-success' : ''}`}
                                            onClick={() => handleAttendance(student.id, 'present')}
                                            title="Mark Present"
                                        >
                                            <CheckCircle size={20} />
                                        </button>
                                        <button
                                            className={`btn-icon ${attendanceRecords[student.id] === 'absent' ? 'active-danger' : ''}`}
                                            onClick={() => handleAttendance(student.id, 'absent')}
                                            title="Mark Absent"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No students assigned to Block {wardenProfile?.assigned_block}</td></tr>
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
                <div>
                    {isEditingMenu ? (
                        <>
                            <button className="btn-outline" onClick={() => { setIsEditingMenu(false); setEditedMenu(messMenu); }} style={{ marginRight: '10px' }}>Cancel</button>
                            <button className="btn-primary" onClick={saveMessMenu}><Save size={16} /> Save Menu</button>
                        </>
                    ) : (
                        <button className="btn-primary" onClick={() => setIsEditingMenu(true)}><Edit3 size={16} /> Edit Menu</button>
                    )}
                </div>
            </div>
            <div className="table-container">
                <table className="dashboard-table">
                    <thead><tr><th>Day</th><th>Breakfast</th><th>Lunch</th><th>Snacks</th><th>Dinner</th></tr></thead>
                    <tbody>
                        {isEditingMenu ? editedMenu.map((day, i) => (
                            <tr key={day.id || i}>
                                <td style={{ fontWeight: 'bold' }}>{day.day_of_week}</td>
                                <td><input className="form-input" value={day.breakfast || ''} onChange={(e) => handleMenuChange(i, 'breakfast', e.target.value)} /></td>
                                <td><input className="form-input" value={day.lunch || ''} onChange={(e) => handleMenuChange(i, 'lunch', e.target.value)} /></td>
                                <td><input className="form-input" value={day.snacks || ''} onChange={(e) => handleMenuChange(i, 'snacks', e.target.value)} /></td>
                                <td><input className="form-input" value={day.dinner || ''} onChange={(e) => handleMenuChange(i, 'dinner', e.target.value)} /></td>
                            </tr>
                        )) : messMenu.map((day) => (
                            <tr key={day.id}>
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

    const renderComplaints = () => (
        <div className="content-section">
            <div className="section-header">
                <h2 className="section-title">Student Complaints</h2>
            </div>
            <div className="table-container">
                <table className="dashboard-table">
                    <thead><tr><th>Date</th><th>Student</th><th>Room</th><th>Title</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {complaints.map(c => (
                            <tr key={c.id}>
                                <td>{new Date(c.created_at).toLocaleDateString()}</td>
                                <td>{c.students?.name}</td>
                                <td>{c.students?.rooms?.room_no || 'NA'}</td>
                                <td>{c.title}</td>
                                <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.description}>{c.description}</td>
                                <td><span className={`status-pill ${c.status === 'resolved' ? 'status-success' : 'status-warning'}`}>{c.status}</span></td>
                                <td>
                                    <button
                                        className={`btn-outline ${c.status === 'resolved' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                        onClick={() => { if (c.status !== 'resolved') handleResolveComplaint(c.id); }}
                                        disabled={c.status === 'resolved'}
                                    >
                                        {c.status === 'resolved' ? 'Resolved' : 'Resolve'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderNotices = () => (
        <div className="grid-2">
            <div className="content-section">
                <div className="section-header">
                    <h2 className="section-title">Post New Notice</h2>
                </div>
                <form onSubmit={handleCreateNotice}>
                    <div className="form-group">
                        <label>Title</label>
                        <input className="form-input" required value={newNotice.title} onChange={e => setNewNotice({ ...newNotice, title: e.target.value })} placeholder="e.g., Holiday Announcement" style={{ marginBottom: '1rem' }} />
                    </div>
                    <div className="form-group">
                        <label>Message</label>
                        <textarea className="form-input" required rows="4" value={newNotice.message} onChange={e => setNewNotice({ ...newNotice, message: e.target.value })} placeholder="Enter notice content..." />
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                        <button type="submit" className="btn-primary"><Send size={16} /> Post Notice</button>
                    </div>
                </form>
            </div>

            <div className="content-section">
                <div className="section-header">
                    <h2 className="section-title">Active Notices</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                    {notices.map(n => (
                        <div key={n.id} className="stat-card" style={{ position: 'relative', borderLeft: '3px solid var(--dash-accent)' }}>
                            <button onClick={() => handleDeleteNotice(n.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Delete Notice">
                                <Trash2 size={16} />
                            </button>
                            <h4 style={{ margin: '0 0 5px 0' }}>{n.title}</h4>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px' }}>
                                <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                {new Date(n.created_at).toLocaleString()}
                            </p>
                            <p style={{ margin: 0, color: '#cbd5e1', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{n.message}</p>
                        </div>
                    ))}
                    {notices.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>No active notices.</p>}
                </div>
            </div>
        </div>
    );

    const renderStudents = () => (
        <div className="content-section">
            <div className="section-header">
                <h2 className="section-title">Residents List</h2>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input type="text" placeholder="Search by name or room..." className="form-input" style={{ paddingLeft: '35px' }} />
                </div>
            </div>
            <div className="table-container">
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Room</th>
                            <th>Course</th>
                            <th>Phone</th>
                            <th>Address</th>
                            <th>Blood Group</th>
                            <th>Fee Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(s => (
                            <tr key={s.id}>
                                <td style={{ fontWeight: '500' }}>{s.name}</td>
                                <td>{s.rooms?.room_no || 'NA'}</td>
                                <td>{s.course}</td>
                                <td>{s.parent_phone}</td>
                                <td>{s.address || 'NA'}</td>
                                <td>{s.blood_group || 'NA'}</td>
                                <td>
                                    <span className={`status-pill ${s.fee_status === 'paid' ? 'status-success' : 'status-danger'}`}>
                                        {s.fee_status ? s.fee_status.toUpperCase() : 'PENDING'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderQueries = () => (
        <div className="content-section">
            <div className="section-header">
                <h2 className="section-title">Admission Queries</h2>
            </div>
            <div className="table-container">
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Room Type</th>
                            <th>Message</th>
                        </tr>
                    </thead>
                    <tbody>
                        {queries.map(q => (
                            <tr key={q.id}>
                                <td>{new Date(q.created_at).toLocaleDateString()}</td>
                                <td style={{ fontWeight: '500' }}>{q.full_name}</td>
                                <td>{q.email}</td>
                                <td><span className="status-pill status-success">{q.room_type}</span></td>
                                <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={q.message}>
                                    {q.message}
                                </td>
                            </tr>
                        ))}
                        {queries.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No admission queries found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (loading) return <div className="loader">Loading Warden Dashboard...</div>;

    return (
        <DashboardLayout role="warden" title="Hostel Warden" subtitle={`Dashboard > ${view.charAt(0).toUpperCase() + view.slice(1)}`}>
            <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {['overview', 'attendance', 'rooms', 'mess', 'students', 'complaints', 'notices', 'queries'].map(t => (
                    <button
                        key={t}
                        onClick={() => navigate(t === 'overview' ? '/warden' : `/warden/${t}`)}
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
                        {t === 'rooms' ? 'ROOM ALLOC' : t.toUpperCase()}
                    </button>
                ))}
            </div>

            {view === 'overview' && renderOverview()}
            {view === 'attendance' && renderAttendance()}
            {view === 'rooms' && renderRooms()}
            {view === 'mess' && renderMessMenu()}
            {view === 'complaints' && renderComplaints()}
            {view === 'notices' && renderNotices()}
            {view === 'queries' && renderQueries()}
            {view === 'students' && renderStudents()}
        </DashboardLayout>
    );
}
