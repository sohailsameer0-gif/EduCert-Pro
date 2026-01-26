
import React, { useState, useEffect } from 'react';
import { UserProfile, PaymentRequest, ActivationKey } from '../types';
import { getUsers, getPayments, getKeys, updateUserStatus, updatePaymentStatus, generateKey, updateUserLicense, deleteUsers, deletePayments, deleteKeys } from '../utils/storage';
import { Users, CreditCard, Key, BarChart3, Search, Check, X, ShieldAlert, CheckCircle2, Lock, Trash2, Eye, ImageIcon, AlertOctagon, Copy } from 'lucide-react';

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
    <div className="flex h-[calc(100vh-80px)] bg-slate-100 animate-fade-in relative">
        
        {/* Image Proof Modal */}
        {viewImage && (
            <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewImage(null)}>
                <div className="relative max-w-2xl w-full bg-white rounded-lg overflow-hidden p-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setViewImage(null)} className="absolute top-4 right-4 bg-slate-100 hover:bg-red-100 text-slate-800 hover:text-red-600 p-2 rounded-full z-10">
                        <X size={24} />
                    </button>
                    <img src={viewImage} alt="Payment Proof" className="w-full h-auto max-h-[80vh] object-contain rounded" />
                    <div className="p-4 text-center">
                        <p className="text-sm text-slate-500 font-bold uppercase">Payment Screenshot Proof</p>
                    </div>
                </div>
            </div>
        )}

        {/* Sidebar */}
        <div className="w-64 bg-navy-900 text-slate-300 flex flex-col p-4">
            <h2 className="text-white font-bold text-xl mb-6 px-2 flex items-center gap-2">
                <ShieldAlert className="text-red-500"/> Super Admin
            </h2>
            <nav className="space-y-2">
                <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'hover:bg-navy-800'}`}>
                    <BarChart3 size={18} /> Dashboard
                </button>
                <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'hover:bg-navy-800'}`}>
                    <Users size={18} /> Institutes
                    {stats.pendingUsers > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-2 rounded-full">{stats.pendingUsers}</span>}
                </button>
                <button onClick={() => setActiveTab('payments')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'payments' ? 'bg-indigo-600 text-white' : 'hover:bg-navy-800'}`}>
                    <CreditCard size={18} /> Payments
                    {stats.pendingPayments > 0 && <span className="ml-auto bg-gold-500 text-navy-900 text-xs px-2 rounded-full">{stats.pendingPayments}</span>}
                </button>
                <button onClick={() => setActiveTab('keys')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'keys' ? 'bg-indigo-600 text-white' : 'hover:bg-navy-800'}`}>
                    <Key size={18} /> Licenses Keys
                </button>
            </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
            
            {/* DASHBOARD */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-navy-900">System Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-slate-500 text-sm font-bold uppercase">Total Institutes</div>
                            <div className="text-3xl font-bold text-navy-900 mt-2">{stats.totalUsers}</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-slate-500 text-sm font-bold uppercase">Pending Approval</div>
                            <div className="text-3xl font-bold text-orange-600 mt-2">{stats.pendingUsers}</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-slate-500 text-sm font-bold uppercase">Active Licenses</div>
                            <div className="text-3xl font-bold text-green-600 mt-2">{stats.activeLicenses}</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-slate-500 text-sm font-bold uppercase">Total Revenue (PKR)</div>
                            <div className="text-3xl font-bold text-indigo-600 mt-2">{stats.totalRevenue.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* USERS */}
            {activeTab === 'users' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center h-10">
                        <h3 className="text-2xl font-bold text-navy-900">Manage Institutes</h3>
                        {selectedUsers.length > 0 && (
                            <button 
                                onClick={handleBulkDeleteUsers}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm animate-fade-in transition"
                            >
                                <Trash2 size={18} /> Delete Selected ({selectedUsers.length})
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
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
                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Blocked</span>
                                            ) : user.isApproved ? (
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Active</span>
                                            ) : (
                                                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold animate-pulse">Pending</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs">
                                                Plan: <span className="font-bold">{user.license.plan.toUpperCase()}</span><br/>
                                                Exp: {new Date(user.license.expiryDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                            {!user.isApproved && (
                                                <button onClick={() => handleUserAction(user.email, 'approve')} className="text-green-600 hover:bg-green-50 px-3 py-1 rounded border border-green-200 font-bold text-xs">Approve</button>
                                            )}
                                            {user.isBlocked ? (
                                                <button onClick={() => handleUserAction(user.email, 'unblock')} className="text-slate-600 hover:bg-slate-50 px-3 py-1 rounded border border-slate-200 font-bold text-xs">Unblock</button>
                                            ) : (
                                                 <button onClick={() => handleUserAction(user.email, 'block')} className="text-red-600 hover:bg-red-50 px-3 py-1 rounded border border-red-200 font-bold text-xs">Block</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">No users found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PAYMENTS */}
            {activeTab === 'payments' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center h-10">
                        <h3 className="text-2xl font-bold text-navy-900">Payment Requests</h3>
                        {selectedPayments.length > 0 && (
                            <button 
                                onClick={handleBulkDeletePayments}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm animate-fade-in transition"
                            >
                                <Trash2 size={18} /> Delete Selected ({selectedPayments.length})
                            </button>
                        )}
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
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
                                            <div className="font-bold text-navy-900 uppercase">{p.method}</div>
                                            <div className="text-xs font-mono">{p.transactionId}</div>
                                            <div className="text-xs text-slate-500">Sender: {p.senderName}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold capitalize flex w-fit items-center gap-1 ${
                                                p.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                                p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gold-100 text-gold-700'
                                            }`}>
                                                {p.status === 'pending' && <AlertOctagon size={12}/>}
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {p.proofImage ? (
                                                <button onClick={() => setViewImage(p.proofImage)} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-bold border border-indigo-200 px-2 py-1 rounded bg-indigo-50">
                                                    <ImageIcon size={14}/> View Proof
                                                </button>
                                            ) : <span className="text-xs text-slate-400">No Image</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {p.status === 'pending' && (
                                                <>
                                                    <button onClick={() => handlePaymentAction(p.id, 'approve')} className="bg-green-600 text-white hover:bg-green-700 px-3 py-1 rounded font-bold text-xs shadow-sm" disabled={!p.proofImage}>Accept</button>
                                                    <button onClick={() => handlePaymentAction(p.id, 'reject')} className="bg-red-500 text-white hover:bg-red-600 px-3 py-1 rounded font-bold text-xs shadow-sm">Reject</button>
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
            )}

            {/* KEYS */}
            {activeTab === 'keys' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center h-10">
                        <h3 className="text-2xl font-bold text-navy-900">License Keys</h3>
                        
                        <div className="flex gap-4">
                            {selectedKeys.length > 0 && (
                                <button 
                                    onClick={handleBulkDeleteKeys}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm animate-fade-in transition"
                                >
                                    <Trash2 size={18} /> Delete Selected ({selectedKeys.length})
                                </button>
                            )}
                            <button onClick={handleGenerateKey} className="bg-navy-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-navy-800 shadow-md">
                                <CheckCircle2 size={18}/> Generate 1-Year Key
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
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
                                                <span className="font-mono font-bold text-lg text-indigo-700">{k.key}</span>
                                                <button onClick={() => handleCopyKey(k.key)} className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-100 transition" title="Copy Key">
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{new Date(k.generatedDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            {k.isUsed ? (
                                                <span className="text-red-500 font-bold text-xs uppercase flex items-center gap-1"><Lock size={12}/> Redeemed</span>
                                            ) : (
                                                <span className="text-green-600 font-bold text-xs uppercase flex items-center gap-1"><Check size={12}/> Available</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{k.usedBy || '-'}</td>
                                    </tr>
                                ))}
                                {keys.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">No keys generated yet.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default SuperAdminPortal;
