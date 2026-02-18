import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout.jsx';
import { supabase } from '../../supabaseClient';
import {
    Users, BedDouble, Wallet, UserCog,
    TrendingUp, FileText, Download, Edit, Trash2, Plus, X, Save,
    PieChart as PieChartIcon, BarChart as BarChartIcon, AlertCircle, MessageSquare
} from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';
import './Dashboard.css';

export default function AdminDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const [view, setView] = useState('overview');
    const [loading, setLoading] = useState(true);

    // Data State
    const [stats, setStats] = useState({ students: 0, rooms: 0, vacant: 0, wardens: 0, fees: 0 });
    const [students, setStudents] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [wardens, setWardens] = useState([]);
    const [queries, setQueries] = useState([]);
    const [allProfiles, setAllProfiles] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [fees, setFees] = useState([]);

    // Reports State
    const [reportPeriod, setReportPeriod] = useState('all'); // 'all', 'month'

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null); // 'student', 'room', 'warden'
    const [currentItem, setCurrentItem] = useState(null);

    // Sync View with URL
    useEffect(() => {
        const path = location.pathname.split('/admin')[1];
        if (!path || path === '') setView('overview');
        // Handle /admin/staff/wardens -> staff
        else if (path.includes('/staff')) setView('staff');
        else setView(path.replace('/', ''));
    }, [location]);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            setLoading(true);

            // 1. Stats Calculation (Real Counts)
            const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
            const { data: roomData } = await supabase.from('rooms').select('capacity, occupied, status');
            const totalCapacity = roomData?.reduce((acc, r) => acc + r.capacity, 0) || 0;
            const totalOccupied = roomData?.reduce((acc, r) => acc + r.occupied, 0) || 0;
            const { count: wardenCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'warden');

            // 2. Data Lists
            const { data: studentsData } = await supabase.from('students').select('*, rooms(room_no, block)').order('created_at', { ascending: false });
            setStudents(studentsData || []);

            const { data: allRooms } = await supabase.from('rooms').select('*').order('room_no');
            setRooms(allRooms || []);

            const { data: wardensData } = await supabase.from('profiles').select('*').eq('role', 'warden').order('name');
            setWardens(wardensData || []);

            const { data: complaintsData } = await supabase.from('complaints').select('*, students(name)').order('created_at', { ascending: false });
            setComplaints(complaintsData || []);

            const { data: queriesData } = await supabase.from('queries').select('*').order('created_at', { ascending: false });
            setQueries(queriesData || []);

            const { data: profilesData } = await supabase.from('profiles').select('*').order('name');
            setAllProfiles(profilesData || []);

            // Fetch Fees
            const { data: feesData } = await supabase.from('fees').select('*, students(name, rooms(room_no))').order('due_date');
            setFees(feesData || []);
            const pendingFeesCount = feesData?.filter(f => f.status === 'pending').length || 0;

            setStats({
                students: studentCount || 0,
                rooms: roomData?.length || 0,
                vacant: totalCapacity - totalOccupied,
                wardens: wardenCount || 0,
                fees: pendingFeesCount
            });

        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            if (modalType === 'student') {
                if (currentItem) {
                    // Update includes room_id now
                    const updates = {
                        name: data.name,
                        course: data.course,
                        parent_phone: data.parent_phone,
                        room_id: data.room_id || null
                    };
                    await supabase.from('students').update(updates).eq('id', currentItem.id);
                } else {
                    alert("To add a new student, please ask them to Sign Up.");
                    return;
                }
            } else if (modalType === 'room') {
                if (currentItem) {
                    await supabase.from('rooms').update(data).eq('id', currentItem.id);
                } else {
                    await supabase.from('rooms').insert(data);
                }
            } else if (modalType === 'warden') {
                if (currentItem) {
                    await supabase.from('profiles').update({ assigned_block: data.assigned_block }).eq('id', currentItem.id);
                }
            }

            setIsModalOpen(false);
            fetchAdminData();
        } catch (error) {
            console.error('Error saving:', error);
            alert('Operation failed');
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            const table = type === 'student' ? 'students' : type === 'room' ? 'rooms' : 'profiles';
            if (type === 'warden') {
                alert("Cannot delete Warden profile directly. Ask user to delete account.");
                return;
            }

            await supabase.from(table).delete().eq('id', id);
            fetchAdminData();
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const openModal = (type, item = null) => {
        setModalType(type);
        setCurrentItem(item);
        setIsModalOpen(true);
    };

    // --- Reports Helper Functions ---

    const downloadCSV = (data, filename) => {
        if (!data || !data.length) {
            alert('No data to download');
            return;
        }
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const val = row[header];
                return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename + '.csv';
        link.click();
    };

    const getFeesChartData = () => {
        const paid = fees.filter(f => f.status === 'paid').length;
        const pending = fees.filter(f => f.status === 'pending').length;
        const overdue = fees.filter(f => f.status === 'overdue').length;
        return [
            { name: 'Paid', value: paid, color: '#22c55e' },
            { name: 'Pending', value: pending, color: '#eab308' },
            { name: 'Overdue', value: overdue, color: '#ef4444' }
        ];
    };

    const getOccupancyData = () => {
        return [
            { name: 'Occupied', value: stats.rooms * 4 - stats.vacant, color: '#6366f1' }, // Approximate
            { name: 'Vacant', value: stats.vacant, color: '#94a3b8' }
        ];
    };

    const renderReports = () => {
        const feeChartData = getFeesChartData();
        const blockHash = {};
        students.forEach(s => {
            const block = s.rooms?.block || 'Unassigned';
            blockHash[block] = (blockHash[block] || 0) + 1;
        });
        const blockData = Object.keys(blockHash).map(k => ({ name: `Block ${k}`, students: blockHash[k] }));

        return (
            <div className="content-section">
                <div className="section-header">
                    <h2 className="section-title">Reports & Analytics</h2>
                    <PieChartIcon size={20} color="var(--dash-accent)" />
                </div>

                {/* Charts Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>

                    {/* Fees Chart */}
                    <div className="stat-card" style={{ background: 'white' }}>
                        <h3 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.2rem', fontWeight: '700' }}>Fee Status Overview</h3>
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={feeChartData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                                        {feeChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Block Occupancy Chart */}
                    <div className="stat-card" style={{ background: 'white' }}>
                        <h3 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.2rem', fontWeight: '700' }}>Students per Block</h3>
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer>
                                <BarChart data={blockData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} dy={10} />
                                    <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                    <Bar dataKey="students" radius={[6, 6, 0, 0]} barSize={40}>
                                        {blockData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#6366f1', '#818cf8', '#4f46e5'][index % 3]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Downloads Section */}
                <h3 className="section-title" style={{ marginBottom: '1.5rem' }}>Data Export Center</h3>
                <div className="grid-2">
                    <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h4 style={{ margin: '0 0 0.5rem 0' }}>Student Records</h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Download complete list with details.</p>
                        </div>
                        <button className="btn-primary" onClick={() => {
                            const data = students.map(s => ({
                                ID: s.id,
                                Name: s.name,
                                Email: s.email,
                                Phone: s.phone,
                                Course: s.course,
                                Room: s.rooms?.room_no || 'N/A',
                                Block: s.rooms?.block || 'N/A'
                            }));
                            downloadCSV(data, `Students_List_${new Date().toISOString().split('T')[0]}`);
                        }}>
                            <Download size={18} /> Excel/CSV
                        </button>
                    </div>

                    <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h4 style={{ margin: '0 0 0.5rem 0' }}>Fee Reports</h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Financial status of all residents.</p>
                        </div>
                        <button className="btn-primary" onClick={() => {
                            const data = fees.map(f => ({
                                Student: f.students?.name || 'Unknown',
                                Amount: f.amount,
                                Type: f.payment_type,
                                DueDate: f.due_date,
                                Status: f.status,
                                DatePaid: f.payment_date || 'N/A'
                            }));
                            downloadCSV(data, `Fees_Report_${new Date().toISOString().split('T')[0]}`);
                        }}>
                            <Download size={18} /> Excel/CSV
                        </button>
                    </div>

                    <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h4 style={{ margin: '0 0 0.5rem 0' }}>Warden Staff</h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Contact list of active wardens.</p>
                        </div>
                        <button className="btn-primary" onClick={() => {
                            const data = wardens.map(w => ({
                                Name: w.name,
                                Email: w.email,
                                Phone: w.phone,
                                Role: w.role
                            }));
                            downloadCSV(data, `Warden_List_${new Date().toISOString().split('T')[0]}`);
                        }}>
                            <Download size={18} /> Excel/CSV
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- Renderers ---

    const renderOverview = () => (
        <>
            <div className="overview-welcome">
                <h2>Welcome, Administrator</h2>
                <p>Manage your hostel residents and infrastructure with ease.</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card students">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div className="stat-label">Total Students</div>
                            <div className="stat-value">{stats.students}</div>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Registered residents</div>
                        </div>
                        <div className="stat-icon"><Users size={28} /></div>
                    </div>
                    <Users size={120} className="stat-card-bg-icon" />
                </div>

                <div className="stat-card rooms">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div className="stat-label">Vacant Beds</div>
                            <div className="stat-value">{stats.vacant}</div>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{stats.rooms} Total Rooms</div>
                        </div>
                        <div className="stat-icon"><BedDouble size={28} /></div>
                    </div>
                    <BedDouble size={120} className="stat-card-bg-icon" />
                </div>

                <div className="stat-card wardens">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div className="stat-label">Active Wardens</div>
                            <div className="stat-value">{stats.wardens}</div>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Managing blocks</div>
                        </div>
                        <div className="stat-icon"><UserCog size={28} /></div>
                    </div>
                    <UserCog size={120} className="stat-card-bg-icon" />
                </div>

                <div className="stat-card fees">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div className="stat-label">Pending Fees</div>
                            <div className="stat-value">{stats.fees}</div>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Students with dues</div>
                        </div>
                        <div className="stat-icon"><Wallet size={28} /></div>
                    </div>
                    <Wallet size={120} className="stat-card-bg-icon" />
                </div>
            </div>
        </>
    );

    const renderStudents = () => (
        <div className="content-section">
            <div className="section-header">
                <h2 className="section-title">Student Management</h2>
                <button className="btn-primary" onClick={() => alert("Students must Sign Up themselves to be added.")}><Plus size={16} /> Add Student</button>
            </div>
            <div className="table-container">
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Allocated Room</th>
                            <th>Academic Course</th>
                            <th>Parent Contact</th>
                            <th>Address</th>
                            <th>Blood</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((s) => (
                            <tr key={s.id}>
                                <td style={{ fontWeight: '500' }}>{s.name}</td>
                                <td>{s.rooms?.room_no || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>}</td>
                                <td>{s.course}</td>
                                <td>{s.parent_phone}</td>
                                <td>{s.address || 'NA'}</td>
                                <td>{s.blood_group || 'NA'}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon" onClick={() => openModal('student', s)}><Edit size={16} /></button>
                                        <button className="btn-icon danger" onClick={() => handleDelete('student', s.id)}><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderRooms = () => (
        <div className="content-section">
            <div className="section-header">
                <h2 className="section-title">Room Management</h2>
                <button className="btn-primary" onClick={() => openModal('room')}><Plus size={16} /> Add Room</button>
            </div>
            <div className="table-container">
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th>Room No</th>
                            <th>Block</th>
                            <th>Capacity</th>
                            <th>Occupied</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rooms.map((r) => (
                            <tr key={r.id}>
                                <td style={{ fontWeight: '500' }}>{r.room_no}</td>
                                <td>{r.block}</td>
                                <td>{r.capacity}</td>
                                <td>{r.occupied}</td>
                                <td>
                                    <span className={`status-pill ${r.status === 'available' ? 'status-success' : 'status-danger'}`}>
                                        {r.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon" onClick={() => openModal('room', r)}><Edit size={16} /></button>
                                        <button className="btn-icon danger" onClick={() => handleDelete('room', r.id)}><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderWardens = () => (
        <div className="content-section">
            <div className="section-header">
                <h2 className="section-title">Staff / Warden Management</h2>
                <div className="section-hint" style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Manage assigned blocks for Wardens. To add a Warden, a user must sign up with role 'Warden'.
                </div>
            </div>
            <div className="table-container">
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Assigned Block</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {wardens.map((w) => (
                            <tr key={w.id}>
                                <td style={{ fontWeight: '500' }}>{w.name}</td>
                                <td>{w.assigned_block || <span style={{ color: '#94a3b8' }}>Not Assigned</span>}</td>
                                <td>{w.role}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon" onClick={() => openModal('warden', w)} title="Assign Block"><Edit size={16} /></button>
                                    </div>
                                </td>
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
                <h2 className="section-title">All Complaints</h2>
            </div>
            <div className="table-container">
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Student</th>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {complaints.map(c => (
                            <tr key={c.id}>
                                <td>{new Date(c.created_at).toLocaleDateString()}</td>
                                <td>{c.students?.name}</td>
                                <td>{c.title}</td>
                                <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.description}>{c.description}</td>
                                <td><span className={`status-pill ${c.status === 'resolved' ? 'status-success' : 'status-warning'}`}>{c.status}</span></td>
                                <td>
                                    {c.status !== 'resolved' && (
                                        <button
                                            className="btn-outline"
                                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                            onClick={async () => {
                                                await supabase.from('complaints').update({ status: 'resolved' }).eq('id', c.id);
                                                fetchAdminData();
                                            }}
                                        >
                                            Resolve
                                        </button>
                                    )}
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
                <MessageSquare size={20} color="var(--dash-accent)" />
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
                            <th>Actions</th>
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
                                <td>
                                    <button className="btn-icon danger" onClick={async () => {
                                        if (window.confirm('Delete this query?')) {
                                            await supabase.from('queries').delete().eq('id', q.id);
                                            fetchAdminData();
                                        }
                                    }}><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                        {queries.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No admission queries found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderUserAccess = () => (
        <div className="content-section">
            <div className="section-header">
                <h2 className="section-title">User Access Management</h2>
                <UserCog size={20} color="var(--dash-accent)" />
            </div>
            <div className="table-container">
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th>User Name</th>
                            <th>Email</th>
                            <th>Currently Assigned Role</th>
                            <th>Update Access Level</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allProfiles.map(p => (
                            <tr key={p.id}>
                                <td style={{ fontWeight: '500' }}>{p.name}</td>
                                <td>{p.email || 'N/A'}</td>
                                <td>
                                    <span className={`status-pill ${p.role === 'admin' ? 'status-danger' : (p.role === 'warden' ? 'status-warning' : 'status-success')}`}>
                                        {p.role.toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    <select
                                        className="form-input"
                                        style={{ width: '150px', padding: '0.3rem' }}
                                        value={p.role}
                                        onChange={async (e) => {
                                            const newRole = e.target.value;
                                            if (window.confirm(`Change ${p.name}'s role to ${newRole.toUpperCase()}?`)) {
                                                const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', p.id);
                                                if (error) alert("Error updating role");
                                                else fetchAdminData();
                                            }
                                        }}
                                    >
                                        <option value="student">Student</option>
                                        <option value="warden">Warden</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderFees = () => (
        <div className="content-section">
            <div className="section-header">
                <h2 className="section-title">Fee Management</h2>
            </div>
            <div className="table-container">
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Room</th>
                            <th>Amount</th>
                            <th>Type</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fees.map(fee => (
                            <tr key={fee.id}>
                                <td style={{ fontWeight: '500' }}>{fee.students?.name || 'Unknown'}</td>
                                <td>{fee.students?.rooms?.room_no || 'NA'}</td>
                                <td>₹{fee.amount}</td>
                                <td>{fee.payment_type === '6_months' ? 'Semi-Annual' : 'Yearly'}</td>
                                <td>{new Date(fee.due_date).toLocaleDateString()}</td>
                                <td>
                                    <span className={`status-pill ${fee.status === 'paid' ? 'status-success' : 'status-danger'}`}>
                                        {fee.status.toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    {fee.status === 'pending' && (
                                        <button className="btn-outline" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }} onClick={async () => {
                                            if (!window.confirm('Mark this fee as PAID?')) return;
                                            const { error } = await supabase.from('fees').update({ status: 'paid', payment_date: new Date() }).eq('id', fee.id);
                                            if (!error) fetchAdminData();
                                        }}>
                                            Mark Paid
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {fees.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No fee records found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderModal = () => (
        isModalOpen && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header">
                        <h3>{currentItem ? 'Edit' : 'Add'} {modalType === 'warden' ? 'Warden Block' : modalType.charAt(0).toUpperCase() + modalType.slice(1)}</h3>
                        <button className="btn-icon" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSave}>
                        {modalType === 'student' && (
                            <>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input name="name" defaultValue={currentItem?.name} required className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Room Allocation</label>
                                    <select name="room_id" defaultValue={currentItem?.room_id || ''} className="form-input">
                                        <option value="">Unassigned</option>
                                        {rooms
                                            .filter(r => r.status === 'available' || (currentItem && r.id === currentItem.room_id))
                                            .sort((a, b) => a.room_no.localeCompare(b.room_no))
                                            .map(r => (
                                                <option key={r.id} value={r.id}>
                                                    {r.room_no} ({r.block}) - {r.occupied}/{r.capacity}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Course</label>
                                    <input name="course" defaultValue={currentItem?.course} required className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Parent Phone</label>
                                    <input name="parent_phone" defaultValue={currentItem?.parent_phone} required className="form-input" />
                                </div>
                            </>
                        )}
                        {modalType === 'room' && (
                            <>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>Room No</label>
                                        <input name="room_no" defaultValue={currentItem?.room_no} required className="form-input" />
                                    </div>
                                    <div className="form-group">
                                        <label>Block</label>
                                        <select name="block" defaultValue={currentItem?.block || 'A'} className="form-input">
                                            <option value="A">Block A</option>
                                            <option value="B">Block B</option>
                                            <option value="C">Block C</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>Capacity</label>
                                        <input type="number" name="capacity" defaultValue={currentItem?.capacity || 2} required className="form-input" />
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select name="status" defaultValue={currentItem?.status || 'available'} className="form-input">
                                            <option value="available">Available</option>
                                            <option value="filled">Filled</option>
                                            <option value="maintenance">Maintenance</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}
                        {modalType === 'warden' && (
                            <div className="form-group">
                                <label>Assigned Block</label>
                                <select name="assigned_block" defaultValue={currentItem?.assigned_block || 'A'} className="form-input">
                                    <option value="A">Block A</option>
                                    <option value="B">Block B</option>
                                    <option value="C">Block C</option>
                                </select>
                            </div>
                        )}
                        <div className="modal-actions">
                            <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button type="submit" className="btn-primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        )
    );

    if (loading) return <div className="loader">Loading Dashboard...</div>;

    return (
        <DashboardLayout role="admin" title="Administrator" subtitle={`Dashboard > ${view.charAt(0).toUpperCase() + view.slice(1)}`}>
            <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {['overview', 'students', 'rooms', 'staff', 'fees', 'reports', 'complaints', 'queries', 'access'].map(t => (
                    <button
                        key={t}
                        onClick={() => navigate(t === 'overview' ? '/admin' : `/admin/${t}`)}
                        className={`btn-primary ${view === t ? '' : 'btn-outline'}`}
                        style={{
                            background: view === t ? 'var(--dash-accent)' : 'transparent',
                            border: '1px solid var(--dash-border)',
                            color: view === t ? '#fff' : 'var(--dash-text-muted)',
                            padding: '0.5rem 1rem',
                            fontSize: '0.9rem',
                            display: t === 'wardens' ? 'none' : 'block', // Use Staff button for logic
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {t === 'staff' ? 'STAFF / WARDENS' : t.toUpperCase()}
                    </button>
                ))}
            </div>

            {view === 'overview' && renderOverview()}
            {view === 'students' && renderStudents()}
            {view === 'rooms' && renderRooms()}
            {view === 'wardens' && renderWardens()}
            {view === 'staff' && renderWardens()}
            {view === 'fees' && renderFees()}
            {view === 'reports' && renderReports()}
            {view === 'complaints' && renderComplaints()}
            {view === 'queries' && renderQueries()}
            {view === 'access' && renderUserAccess()}

            {renderModal()}
        </DashboardLayout>
    );
}
