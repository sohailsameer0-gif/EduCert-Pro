
import React, { useState, useEffect } from 'react';
import { UserProfile, PaymentRequest, ActivationKey } from '../types';
import { getUsers, getPayments, getKeys, updateUserStatus, updatePaymentStatus, generateKey, updateUserLicense, deleteUsers, deletePayments, deleteKeys } from '../utils/storage';
import { Users, CreditCard, Key, BarChart3, Search, Check, X, ShieldAlert, CheckCircle2, Lock, Trash2, Eye, ImageIcon, AlertOctagon, Copy, LayoutDashboard } from 'lucide-react';

interface SuperAdminProps {
  currentUser: UserProfile;
}

const SuperAdminPortal: React.FC<SuperAdminProps> = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'payments' | 'keys'>('dashboard');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [keys, setKeys] = useState<ActivationKey[]>([]);
  
  // Selection State
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  
  // Modal for Image Proof
  const [viewImage, setViewImage] = useState<string | null>(null);

  // Function to strictly reload data from storage
  const loadData = () => {
    setUsers(getUsers().filter(u => !u.isAdmin)); // Exclude admin
    setPayments(getPayments().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setKeys(getKeys().sort((a, b) => new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime()));
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- ACTIONS ---

  // User Actions
  const handleUserAction = (email: string, action: 'approve' | 'block' | 'unblock') => {
    if (action === 'approve') updateUserStatus(email, true, false);
    if (action === 'block') updateUserStatus(email, true, true);
    if (action === 'unblock') updateUserStatus(email, true, false);
    loadData();
  };

  // Payment Actions
  const handlePaymentAction = (id: string, action: 'approve' | 'reject') => {
    if(action === 'reject' && !window.confirm("Are you sure you want to reject this payment? The user will be notified to try again.")) return;

    const status = action === 'approve' ? 'approved' : 'rejected';
    updatePaymentStatus(id, status);
    loadData();
  };

  // Key Actions
  const handleGenerateKey = () => {
    generateKey(365); // 1 Year key
    loadData();
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    // Visual feedback handled by user interaction, simple alert for now or just silent
    // alert("Key copied to clipboard!"); 
  };

  // --- BULK SELECTION & DELETE HANDLERS ---

  // 1. Users
  const toggleSelectAllUsers = (checked: boolean) => {
      setSelectedUsers(checked ? users.map(u => u.email) : []);
  };
  const toggleSelectUser = (email: string) => {
      setSelectedUsers(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);
  };
  const handleBulkDeleteUsers = () => {
      if (selectedUsers.length === 0) return;
      if(window.confirm(`Are you sure you want to delete ${selectedUsers.length} selected institute(s)?`)) {
          deleteUsers(selectedUsers);
          setUsers(prev => prev.filter(u => !selectedUsers.includes(u.email)));
          setSelectedUsers([]);
      }
  };

  // 2. Payments
  const toggleSelectAllPayments = (checked: boolean) => {
      setSelectedPayments(checked ? payments.map(p => p.id) : []);
  };
  const toggleSelectPayment = (id: string) => {
      setSelectedPayments(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };
  const handleBulkDeletePayments = () => {
      if (selectedPayments.length === 0) return;
      if(window.confirm(`Are you sure you want to delete ${selectedPayments.length} selected payment record(s)?`)) {
          deletePayments(selectedPayments);
          setPayments(prev => prev.filter(p => !selectedPayments.includes(p.id)));
          setSelectedPayments([]);
      }
  };

  // 3. Keys
  const toggleSelectAllKeys = (checked: boolean) => {
      setSelectedKeys(checked ? keys.map(k => k.key) : []);
  };
  const toggleSelectKey = (key: string) => {
      setSelectedKeys(prev => prev.includes(key) ? prev.filter(e => e !== key) : [...prev, key]);
  };
  const handleBulkDeleteKeys = () => {
      if (selectedKeys.length === 0) return;
      if(window.confirm(`Are you sure you want to delete ${selectedKeys.length} selected license key(s)?`)) {
          deleteKeys(selectedKeys);
          setKeys(prev => prev.filter(k => !selectedKeys.includes(k.key)));
          setSelectedKeys([]);
      }
  };

  // Stats
  const stats = {
    totalUsers: users.length,
    pendingUsers: users.filter(u => !u.isApproved).length,
    activeLicenses: users.filter(u => u.license.status === 'active').length,
    pendingPayments: payments.filter(p => p.status === 'pending').length,
    totalRevenue: payments.filter(p => p.status === 'approved').reduce((acc, curr) => acc + parseInt(curr.amount), 0)
  };

  return (
    <div className="flex flex-col md:flex-row h-full md:h-[calc(100vh-80px)] bg-slate-100 animate-fade-in relative md:rounded-xl overflow-hidden shadow-xl border border-slate-200">
        
        {/* Image Proof Modal */}
        {viewImage && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewImage(null)}>
                <div className="relative max-w-2xl w-full bg-white rounded-xl overflow-hidden p-2 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setViewImage(null)} className="absolute top-4 right-4 bg-white/80 hover:bg-red-100 text-slate-800 hover:text-red-600 p-2 rounded-full z-10 shadow-sm transition">
                        <X size={24} />
                    </button>
                    <img src={viewImage} alt="Payment Proof" className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
                    <div className="p-4 text-center">
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Payment Screenshot Proof</p>
                    </div>
                </div>
            </div>
        )}

        {/* Sidebar (Desktop) / Tab Bar (Mobile) */}
        <div className="w-full md:w-64 bg-navy-900 text-slate-300 flex flex-col flex-shrink-0 z-20">
            <div className="p-4 md:p-6 pb-2 md:pb-6 border-b border-white/10 flex justify-between items-center md:block">
                <h2 className="text-white font-bold text-lg md:text-xl flex items-center gap-2">
                    <ShieldAlert className="text-red-500"/> <span className="hidden md:inline">Admin Portal</span><span className="md:hidden">Admin</span>
                </h2>
                <span className="md:hidden text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">SUPER</span>
            </div>
            
            <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible scrollbar-hide bg-navy-800 md:bg-transparent">
                <button onClick={() => setActiveTab('dashboard')} className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 md:py-4 transition text-sm font-medium border-b-2 md:border-b-0 md:border-l-4 ${activeTab === 'dashboard' ? 'border-gold-500 bg-white/5 text-white' : 'border-transparent hover:bg-white/5 hover:text-white'}`}>
                    <BarChart3 size={20} /> <span className="hidden md:inline">Dashboard</span>
                </button>
                <button onClick={() => setActiveTab('users')} className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 md:py-4 transition text-sm font-medium border-b-2 md:border-b-0 md:border-l-4 ${activeTab === 'users' ? 'border-gold-500 bg-white/5 text-white' : 'border-transparent hover:bg-white/5 hover:text-white'}`}>
                    <div className="relative">
                        <Users size={20} />
                        {stats.pendingUsers > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}
                    </div>
                    <span className="hidden md:inline">Institutes</span>
                </button>
                <button onClick={() => setActiveTab('payments')} className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 md:py-4 transition text-sm font-medium border-b-2 md:border-b-0 md:border-l-4 ${activeTab === 'payments' ? 'border-gold-500 bg-white/5 text-white' : 'border-transparent hover:bg-white/5 hover:text-white'}`}>
                    <div className="relative">
                        <CreditCard size={20} />
                        {stats.pendingPayments > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-gold-500 rounded-full animate-ping"></span>}
                    </div>
                    <span className="hidden md:inline">Payments</span>
                </button>
                <button onClick={() => setActiveTab('keys')} className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 md:py-4 transition text-sm font-medium border-b-2 md:border-b-0 md:border-l-4 ${activeTab === 'keys' ? 'border-gold-500 bg-white/5 text-white' : 'border-transparent hover:bg-white/5 hover:text-white'}`}>
                    <Key size={20} /> <span className="hidden md:inline">Licenses</span>
                </button>
            </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50">
            
            {/* DASHBOARD */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fade-in">
                    <h3 className="text-xl md:text-2xl font-bold text-navy-900 flex items-center gap-2"><LayoutDashboard size={24}/> System Overview</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total Institutes</div>
                            <div className="text-3xl font-bold text-navy-900">{stats.totalUsers}</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Pending Approval</div>
                            <div className="text-3xl font-bold text-orange-600">{stats.pendingUsers}</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Active Licenses</div>
                            <div className="text-3xl font-bold text-green-600">{stats.activeLicenses}</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Revenue (PKR)</div>
                            <div className="text-3xl font-bold text-indigo-600">{stats.totalRevenue.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* USERS */}
            {activeTab === 'users' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h3 className="text-xl md:text-2xl font-bold text-navy-900">Manage Institutes</h3>
                        {selectedUsers.length > 0 && (
                            <button 
                                onClick={handleBulkDeleteUsers}
                                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm animate-fade-in transition text-sm"
                            >
                                <Trash2 size={18} /> Delete Selected ({selectedUsers.length})
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[800px]">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 w-12 text-center">
                                            <input 
                                                type="checkbox" 
                                                onChange={(e) => toggleSelectAllUsers(e.target.checked)}
                                                checked={users.length > 0 && selectedUsers.length === users.length}
                                                className="w-4 h-4 rounded text-navy-900 focus:ring-navy-900 cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-6 py-4">Email / User</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">License</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map(user => (
                                        <tr key={user.email} className={`hover:bg-slate-50 transition ${selectedUsers.includes(user.email) ? 'bg-indigo-50' : ''}`}>
                                            <td className="px-6 py-4 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedUsers.includes(user.email)}
                                                    onChange={() => toggleSelectUser(user.email)}
                                                    className="w-4 h-4 rounded text-navy-900 focus:ring-navy-900 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-medium text-navy-900">{user.email}</td>
                                            <td className="px-6 py-4">
                                                {user.isBlocked ? (
                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200">Blocked</span>
                                                ) : user.isApproved ? (
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">Active</span>
                                                ) : (
                                                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold border border-orange-200 animate-pulse">Pending</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs">
                                                    <span className="font-bold text-slate-700">{user.license.plan.toUpperCase()}</span>
                                                    <div className="text-slate-400">Exp: {new Date(user.license.expiryDate).toLocaleDateString()}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                {!user.isApproved && (
                                                    <button onClick={() => handleUserAction(user.email, 'approve')} className="bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition">Approve</button>
                                                )}
                                                {user.isBlocked ? (
                                                    <button onClick={() => handleUserAction(user.email, 'unblock')} className="text-slate-600 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-xs transition">Unblock</button>
                                                ) : (
                                                    <button onClick={() => handleUserAction(user.email, 'block')} className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 font-bold text-xs transition">Block</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">No users found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* PAYMENTS */}
            {activeTab === 'payments' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h3 className="text-xl md:text-2xl font-bold text-navy-900">Payment Requests</h3>
                        {selectedPayments.length > 0 && (
                            <button 
                                onClick={handleBulkDeletePayments}
                                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm animate-fade-in transition text-sm"
                            >
                                <Trash2 size={18} /> Delete Selected ({selectedPayments.length})
                            </button>
                        )}
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[800px]">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 w-12 text-center">
                                            <input 
                                                type="checkbox" 
                                                onChange={(e) => toggleSelectAllPayments(e.target.checked)}
                                                checked={payments.length > 0 && selectedPayments.length === payments.length}
                                                className="w-4 h-4 rounded text-navy-900 focus:ring-navy-900 cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Method / TID</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Proof</th>
                                        <th className="px-6 py-4 text-right">Verify</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {payments.map(p => (
                                        <tr key={p.id} className={`hover:bg-slate-50 transition ${selectedPayments.includes(p.id) ? 'bg-indigo-50' : ''}`}>
                                            <td className="px-6 py-4 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedPayments.includes(p.id)}
                                                    onChange={() => toggleSelectPayment(p.id)}
                                                    className="w-4 h-4 rounded text-navy-900 focus:ring-navy-900 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-navy-900">{p.userEmail}</div>
                                                <div className="text-xs text-slate-500">{new Date(p.date).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-navy-900 uppercase text-xs">{p.method}</div>
                                                <div className="text-xs font-mono bg-slate-100 px-1 rounded w-fit">{p.transactionId}</div>
                                                <div className="text-xs text-slate-500 mt-1">Sender: {p.senderName}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-lg text-xs font-bold capitalize flex w-fit items-center gap-1 border ${
                                                    p.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : 
                                                    p.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gold-100 text-gold-700 border-gold-200'
                                                }`}>
                                                    {p.status === 'pending' && <AlertOctagon size={12}/>}
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {p.proofImage ? (
                                                    <button onClick={() => setViewImage(p.proofImage)} className="flex items-center gap-1 text-indigo-600 hover:text-white hover:bg-indigo-600 transition text-xs font-bold border border-indigo-200 px-2 py-1 rounded-lg bg-indigo-50">
                                                        <ImageIcon size={14}/> View
                                                    </button>
                                                ) : <span className="text-xs text-slate-400">No Image</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                {p.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handlePaymentAction(p.id, 'approve')} className="bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition" disabled={!p.proofImage}>Accept</button>
                                                        <button onClick={() => handlePaymentAction(p.id, 'reject')} className="bg-red-500 text-white hover:bg-red-600 px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition">Reject</button>
                                                    </>
                                                )}
                                                {p.status !== 'pending' && <span className="text-xs text-slate-400 italic">Processed</span>}
                                            </td>
                                        </tr>
                                    ))}
                                    {payments.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">No payment requests.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* KEYS */}
            {activeTab === 'keys' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h3 className="text-xl md:text-2xl font-bold text-navy-900">License Keys</h3>
                        
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            {selectedKeys.length > 0 && (
                                <button 
                                    onClick={handleBulkDeleteKeys}
                                    className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm animate-fade-in transition text-sm"
                                >
                                    <Trash2 size={18} /> Delete ({selectedKeys.length})
                                </button>
                            )}
                            <button onClick={handleGenerateKey} className="flex-1 sm:flex-none bg-navy-900 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-navy-800 shadow-md text-sm transition">
                                <CheckCircle2 size={18}/> Generate 1-Year Key
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[800px]">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 w-12 text-center">
                                            <input 
                                                type="checkbox" 
                                                onChange={(e) => toggleSelectAllKeys(e.target.checked)}
                                                checked={keys.length > 0 && selectedKeys.length === keys.length}
                                                className="w-4 h-4 rounded text-navy-900 focus:ring-navy-900 cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-6 py-4">Activation Key</th>
                                        <th className="px-6 py-4">Created</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Used By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {keys.map(k => (
                                        <tr key={k.key} className={`hover:bg-slate-50 transition ${selectedKeys.includes(k.key) ? 'bg-indigo-50' : ''}`}>
                                            <td className="px-6 py-4 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedKeys.includes(k.key)}
                                                    onChange={() => toggleSelectKey(k.key)}
                                                    className="w-4 h-4 rounded text-navy-900 focus:ring-navy-900 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-lg text-indigo-700 whitespace-nowrap bg-indigo-50 px-2 py-1 rounded">{k.key}</span>
                                                    <button onClick={() => handleCopyKey(k.key)} className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-full hover:bg-indigo-100 transition" title="Copy Key">
                                                        <Copy size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{new Date(k.generatedDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                {k.isUsed ? (
                                                    <span className="text-red-500 font-bold text-xs uppercase flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full w-fit"><Lock size={12}/> Redeemed</span>
                                                ) : (
                                                    <span className="text-green-600 font-bold text-xs uppercase flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full w-fit"><Check size={12}/> Available</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-xs">{k.usedBy || '-'}</td>
                                        </tr>
                                    ))}
                                    {keys.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">No keys generated yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default SuperAdminPortal;
