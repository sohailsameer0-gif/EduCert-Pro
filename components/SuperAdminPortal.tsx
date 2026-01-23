
import React, { useState, useEffect } from 'react';
import { UserProfile, PaymentRequest, ActivationKey } from '../types';
import { getUsers, getPayments, getKeys, updateUserStatus, updatePaymentStatus, generateKey, updateUserLicense, deleteUser, deleteKey } from '../utils/storage';
import { Users, CreditCard, Key, BarChart3, Search, Check, X, ShieldAlert, CheckCircle2, Lock, Trash2 } from 'lucide-react';

interface SuperAdminProps {
  currentUser: UserProfile;
}

const SuperAdminPortal: React.FC<SuperAdminProps> = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'payments' | 'keys'>('dashboard');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [keys, setKeys] = useState<ActivationKey[]>([]);

  // Function to strictly reload data from storage
  const loadData = () => {
    setUsers(getUsers().filter(u => !u.isAdmin)); // Exclude admin
    setPayments(getPayments().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setKeys(getKeys().sort((a, b) => new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime()));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Actions
  const handleUserAction = (email: string, action: 'approve' | 'block' | 'unblock') => {
    if (action === 'approve') updateUserStatus(email, true, false);
    if (action === 'block') updateUserStatus(email, true, true);
    if (action === 'unblock') updateUserStatus(email, true, false);
    loadData();
  };
  
  const handleDeleteUser = (e: React.MouseEvent, email: string) => {
      e.preventDefault();
      e.stopPropagation();
      
      if(window.confirm(`Are you sure you want to PERMANENTLY delete the institute: ${email}?`)) {
          // 1. Delete from storage
          deleteUser(email);
          // 2. Instant UI update (Optimistic)
          setUsers(prev => prev.filter(u => u.email !== email));
      }
  };

  const handlePaymentAction = (id: string, action: 'approve' | 'reject') => {
    const status = action === 'approve' ? 'approved' : 'rejected';
    updatePaymentStatus(id, status);
    if (action === 'approve') {
        const payment = payments.find(p => p.id === id);
        if (payment) {
            const user = getUsers().find(u => u.email === payment.userEmail);
            if (user) {
                // Extend license by 1 year
                const newLicense = { ...user.license, status: 'active', plan: 'pro', expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() };
                updateUserLicense(user.email, newLicense as any);
            }
        }
    }
    loadData();
  };

  const handleGenerateKey = () => {
    generateKey(365); // 1 Year key
    loadData();
  };

  const handleDeleteKey = (e: React.MouseEvent, key: string) => {
      e.preventDefault();
      e.stopPropagation();

      if(window.confirm("Are you sure you want to delete this activation key?")) {
          deleteKey(key);
          // Instant UI update
          setKeys(prev => prev.filter(k => k.key !== key));
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
    <div className="flex h-[calc(100vh-80px)] bg-slate-100 animate-fade-in">
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
                    <h3 className="text-2xl font-bold text-navy-900">Manage Institutes</h3>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                                <tr>
                                    <th className="px-6 py-4">Email / User</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">License</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(user => (
                                    <tr key={user.email} className="hover:bg-slate-50">
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
                                            <button 
                                                type="button"
                                                onClick={(e) => handleDeleteUser(e, user.email)} 
                                                className="text-red-600 hover:bg-red-100 p-2 rounded-full transition cursor-pointer"
                                                title="Delete Institute"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">No users found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PAYMENTS */}
            {activeTab === 'payments' && (
                <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-navy-900">Payment Requests</h3>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Method / TID</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payments.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-slate-500">{new Date(p.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium">{p.userEmail}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-navy-900 uppercase">{p.method}</div>
                                            <div className="text-xs font-mono">{p.transactionId}</div>
                                            <div className="text-xs text-slate-500">Sender: {p.senderName}</div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-green-700">PKR {p.amount}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${
                                                p.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                                p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gold-100 text-gold-700'
                                            }`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {p.status === 'pending' && (
                                                <>
                                                    <button onClick={() => handlePaymentAction(p.id, 'approve')} className="bg-green-600 text-white hover:bg-green-700 px-3 py-1 rounded font-bold text-xs shadow-sm">Accept</button>
                                                    <button onClick={() => handlePaymentAction(p.id, 'reject')} className="bg-red-500 text-white hover:bg-red-600 px-3 py-1 rounded font-bold text-xs shadow-sm">Reject</button>
                                                </>
                                            )}
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
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold text-navy-900">License Keys</h3>
                        <button onClick={handleGenerateKey} className="bg-navy-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-navy-800">
                            <CheckCircle2 size={18}/> Generate 1-Year Key
                        </button>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                                <tr>
                                    <th className="px-6 py-4">Activation Key</th>
                                    <th className="px-6 py-4">Created</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Used By</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {keys.map(k => (
                                    <tr key={k.key} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono font-bold text-lg text-indigo-700">{k.key}</td>
                                        <td className="px-6 py-4 text-slate-500">{new Date(k.generatedDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            {k.isUsed ? (
                                                <span className="text-red-500 font-bold text-xs uppercase flex items-center gap-1"><Lock size={12}/> Redeemed</span>
                                            ) : (
                                                <span className="text-green-600 font-bold text-xs uppercase flex items-center gap-1"><Check size={12}/> Available</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{k.usedBy || '-'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                type="button"
                                                onClick={(e) => handleDeleteKey(e, k.key)}
                                                className="text-slate-400 hover:text-red-600 transition cursor-pointer"
                                                title="Delete Key"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {keys.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">No keys generated yet.</td></tr>}
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
