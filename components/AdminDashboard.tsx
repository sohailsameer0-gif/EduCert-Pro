
import React, { useState } from 'react';
import { AppData, UserProfile } from '../types';
import { fileToBase64, saveAppData, updateUserPassword } from '../utils/storage';
import { Trash2, Plus, Save, Settings, BookOpen, Clock, FileBadge, LayoutTemplate, CheckCircle2, Palette, User, Lock, KeyRound } from 'lucide-react';

interface AdminDashboardProps {
  data: AppData;
  currentUser: UserProfile;
  onUpdate: (newData: AppData) => void;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ data, currentUser, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'account' | 'templates' | 'courses' | 'durations' | 'types'>('general');
  const [tempData, setTempData] = useState<AppData>(data);
  const [isSaving, setIsSaving] = useState(false);
  
  // Account State
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  const handleSave = () => {
    setIsSaving(true);
    saveAppData(tempData);
    onUpdate(tempData);
    setTimeout(() => setIsSaving(false), 800);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.current !== currentUser.password) {
      setPassMsg({ type: 'error', text: 'Current password is incorrect.' });
      return;
    }
    if (passForm.new !== passForm.confirm) {
       setPassMsg({ type: 'error', text: 'New passwords do not match.' });
       return;
    }
    if (passForm.new.length < 4) {
      setPassMsg({ type: 'error', text: 'Password must be at least 4 characters.' });
      return;
    }

    updateUserPassword(currentUser.email, passForm.new);
    // Update local session current user password reference so further changes don't fail immediately
    currentUser.password = passForm.new; 
    setPassMsg({ type: 'success', text: 'Password updated successfully!' });
    setPassForm({ current: '', new: '', confirm: '' });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof tempData.institute) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setTempData(prev => ({
          ...prev,
          institute: { ...prev.institute, [key]: base64 }
        }));
      } catch (err) {
        alert("Error uploading image");
      }
    }
  };

  // Generic handler for array updates
  const addItem = <T extends { id: string }>(key: 'courses' | 'durations' | 'types', newItem: T) => {
    setTempData(prev => ({ ...prev, [key]: [...prev[key], newItem] }));
  };

  const removeItem = (key: 'courses' | 'durations' | 'types', id: string) => {
    setTempData(prev => ({ ...prev, [key]: prev[key].filter(item => item.id !== id) }));
  };

  const updateItem = (key: 'courses' | 'durations' | 'types', id: string, field: string, value: string) => {
    setTempData(prev => ({
      ...prev,
      [key]: prev[key].map(item => item.id === id ? { ...item, [field]: value } : item)
    } as any));
  };

  // Common input class to ensure consistency across all tabs
  const inputClass = "w-full border border-slate-300 rounded-lg p-3 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all";

  return (
    <div className="bg-white/95 text-slate-900 shadow-lg rounded-xl overflow-hidden flex flex-col md:flex-row border border-slate-200 h-full md:h-[calc(100vh-140px)] animate-fade-in backdrop-blur-sm">
      
      {/* Sidebar (Desktop) / Horizontal Scroll (Mobile) */}
      <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-2 md:p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto scrollbar-hide flex-shrink-0">
        <h2 className="hidden md:block text-xs font-bold text-slate-400 uppercase tracking-wider px-4 py-2 mb-2">Configuration</h2>
        
        <button onClick={() => setActiveTab('general')} className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-all font-medium text-xs md:text-sm whitespace-nowrap ${activeTab === 'general' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white hover:shadow text-slate-600'}`}>
          <Settings size={18} /> <span className="md:inline">General</span>
        </button>
        <button onClick={() => setActiveTab('account')} className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-all font-medium text-xs md:text-sm whitespace-nowrap ${activeTab === 'account' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white hover:shadow text-slate-600'}`}>
          <User size={18} /> <span className="md:inline">My Account</span>
        </button>
        <button onClick={() => setActiveTab('appearance')} className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-all font-medium text-xs md:text-sm whitespace-nowrap ${activeTab === 'appearance' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white hover:shadow text-slate-600'}`}>
          <Palette size={18} /> <span className="md:inline">Appearance</span>
        </button>
        <button onClick={() => setActiveTab('templates')} className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-all font-medium text-xs md:text-sm whitespace-nowrap ${activeTab === 'templates' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white hover:shadow text-slate-600'}`}>
          <LayoutTemplate size={18} /> <span className="md:inline">Templates</span>
        </button>
        <div className="hidden md:block h-px bg-slate-200 my-2"></div>
        <button onClick={() => setActiveTab('courses')} className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-all font-medium text-xs md:text-sm whitespace-nowrap ${activeTab === 'courses' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white hover:shadow text-slate-600'}`}>
          <BookOpen size={18} /> <span className="md:inline">Courses</span>
        </button>
        <button onClick={() => setActiveTab('durations')} className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-all font-medium text-xs md:text-sm whitespace-nowrap ${activeTab === 'durations' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white hover:shadow text-slate-600'}`}>
          <Clock size={18} /> <span className="md:inline">Durations</span>
        </button>
        <button onClick={() => setActiveTab('types')} className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-all font-medium text-xs md:text-sm whitespace-nowrap ${activeTab === 'types' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white hover:shadow text-slate-600'}`}>
          <FileBadge size={18} /> <span className="md:inline">Cert Types</span>
        </button>

        <div className="md:mt-auto pt-0 md:pt-4 md:border-t border-slate-200 hidden md:block">
           <button onClick={handleSave} className="w-full mb-2 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-semibold shadow-sm transition-colors" disabled={isSaving}>
            <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Mobile Save Button (Fixed at bottom right) */}
      <button 
        onClick={handleSave} 
        disabled={isSaving}
        className="md:hidden fixed bottom-6 right-6 z-50 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95"
      >
        <Save size={24} />
      </button>

      {/* Content Area */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        
        {/* GENERAL SETTINGS */}
        {activeTab === 'general' && (
          <div className="space-y-6 max-w-3xl animate-fade-in">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 border-b pb-4 mb-4">Institute Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Institute Name</label>
                <input type="text" value={tempData.institute.name} onChange={e => setTempData({...tempData, institute: {...tempData.institute, name: e.target.value}})} className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Phone</label>
                <input type="text" value={tempData.institute.phone} onChange={e => setTempData({...tempData, institute: {...tempData.institute, phone: e.target.value}})} className={inputClass} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">Address</label>
                <textarea value={tempData.institute.address} onChange={e => setTempData({...tempData, institute: {...tempData.institute, address: e.target.value}})} className={`${inputClass} h-24 resize-none`} />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Email</label>
                <input type="email" value={tempData.institute.email} onChange={e => setTempData({...tempData, institute: {...tempData.institute, email: e.target.value}})} className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Website</label>
                <input type="text" value={tempData.institute.website} onChange={e => setTempData({...tempData, institute: {...tempData.institute, website: e.target.value}})} className={inputClass} />
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-800 border-b pb-4 mt-8 md:mt-10 mb-4">Branding Assets</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
               {['logo', 'seal', 'badge', 'signature'].map((key) => (
                 <div key={key} className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center text-center hover:bg-slate-50 transition-colors">
                   <div className="h-20 w-20 md:h-24 md:w-24 bg-white border border-slate-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden shadow-sm">
                     {tempData.institute[key as keyof typeof tempData.institute] ? (
                       <img src={tempData.institute[key as keyof typeof tempData.institute] as string} className="h-full w-full object-contain" alt={key}/>
                     ) : <span className="text-xs text-slate-400">No {key}</span>}
                   </div>
                   <label className="cursor-pointer bg-navy-900 text-white text-[10px] md:text-xs font-bold py-2 px-3 md:px-4 rounded hover:bg-navy-800 transition capitalize w-full">
                     <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, key as any)} />
                     Upload
                   </label>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* ACCOUNT SETTINGS */}
        {activeTab === 'account' && (
          <div className="space-y-6 max-w-xl animate-fade-in">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 border-b pb-4 mb-4">My Account</h3>
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 flex items-center gap-4">
               <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                  <User size={24} />
               </div>
               <div className="overflow-hidden">
                  <p className="text-xs text-slate-500 uppercase font-bold">Logged in as</p>
                  <p className="text-lg font-bold text-slate-800 truncate">{currentUser.email}</p>
               </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
               <h4 className="font-bold text-slate-700 flex items-center gap-2"><Lock size={16}/> Change Password</h4>
               
               {passMsg.text && (
                 <div className={`p-3 rounded text-sm ${passMsg.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                   {passMsg.text}
                 </div>
               )}

               <div className="space-y-2">
                 <label className="text-sm font-semibold text-slate-600">Current Password</label>
                 <input type="password" required value={passForm.current} onChange={e => setPassForm({...passForm, current: e.target.value})} className={inputClass} placeholder="Enter current password" />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-semibold text-slate-600">New Password</label>
                 <input type="password" required minLength={4} value={passForm.new} onChange={e => setPassForm({...passForm, new: e.target.value})} className={inputClass} placeholder="Enter new password" />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-semibold text-slate-600">Confirm New Password</label>
                 <input type="password" required minLength={4} value={passForm.confirm} onChange={e => setPassForm({...passForm, confirm: e.target.value})} className={inputClass} placeholder="Confirm new password" />
               </div>

               <button type="submit" className="w-full bg-navy-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-navy-800 transition shadow-md flex items-center justify-center gap-2">
                  <KeyRound size={18} /> Update Password
               </button>
            </form>
          </div>
        )}

        {/* APPEARANCE SETTINGS */}
        {activeTab === 'appearance' && (
           <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">App Theme</h3>
                <p className="text-slate-500 mb-6 text-sm">Select a theme that matches your institute's branding.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {/* Light Theme */}
                   <div 
                      onClick={() => setTempData({...tempData, appTheme: 'light'})}
                      className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${tempData.appTheme === 'light' ? 'border-indigo-600 ring-2 ring-indigo-200 shadow-xl' : 'border-slate-200 hover:border-slate-300'}`}
                   >
                      <div className="h-32 bg-slate-100 flex flex-col items-center justify-center p-4">
                         <div className="w-3/4 h-3 bg-white rounded-full shadow-sm mb-2"></div>
                         <div className="w-1/2 h-3 bg-white rounded-full shadow-sm"></div>
                      </div>
                      <div className="p-4 bg-white">
                         <h4 className="font-bold text-slate-800 flex items-center gap-2">
                           Professional Light {tempData.appTheme === 'light' && <CheckCircle2 className="text-green-500" size={16}/>}
                         </h4>
                         <p className="text-xs text-slate-500 mt-1">Clean, standard interface.</p>
                      </div>
                   </div>

                   {/* Dark Theme */}
                   <div 
                      onClick={() => setTempData({...tempData, appTheme: 'dark'})}
                      className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${tempData.appTheme === 'dark' ? 'border-indigo-600 ring-2 ring-indigo-200 shadow-xl' : 'border-slate-200 hover:border-slate-300'}`}
                   >
                      <div className="h-32 bg-slate-900 flex flex-col items-center justify-center p-4">
                         <div className="w-3/4 h-3 bg-slate-700 rounded-full mb-2"></div>
                         <div className="w-1/2 h-3 bg-slate-700 rounded-full"></div>
                      </div>
                      <div className="p-4 bg-white">
                         <h4 className="font-bold text-slate-800 flex items-center gap-2">
                           Executive Dark {tempData.appTheme === 'dark' && <CheckCircle2 className="text-green-500" size={16}/>}
                         </h4>
                         <p className="text-xs text-slate-500 mt-1">High contrast, modern dark mode.</p>
                      </div>
                   </div>

                   {/* Midnight Theme */}
                   <div 
                      onClick={() => setTempData({...tempData, appTheme: 'midnight'})}
                      className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${tempData.appTheme === 'midnight' ? 'border-indigo-600 ring-2 ring-indigo-200 shadow-xl' : 'border-slate-200 hover:border-slate-300'}`}
                   >
                      <div className="h-32 bg-[#0a192f] flex flex-col items-center justify-center p-4">
                         <div className="w-3/4 h-3 bg-[#112240] rounded-full mb-2"></div>
                         <div className="w-1/2 h-3 bg-[#dba62d] rounded-full"></div>
                      </div>
                      <div className="p-4 bg-white">
                         <h4 className="font-bold text-slate-800 flex items-center gap-2">
                           Midnight Gold {tempData.appTheme === 'midnight' && <CheckCircle2 className="text-green-500" size={16}/>}
                         </h4>
                         <p className="text-xs text-slate-500 mt-1">Matches Modern/Corporate templates.</p>
                      </div>
                   </div>
                </div>
              </div>
           </div>
        )}

        {/* TEMPLATES SETTINGS */}
        {activeTab === 'templates' && (
          <div className="space-y-8 animate-fade-in">
             <div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">Select Template</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { id: 'classic', name: 'Classic Academic', desc: 'Traditional bordered look with serif fonts.', color: 'bg-white' },
                    { id: 'modern', name: 'Modern Professional', desc: 'Clean sidebar layout with bold headers.', color: 'bg-slate-800' },
                    { id: 'corporate', name: 'Corporate Experience', desc: 'Grid-based blue theme for employees.', color: 'bg-blue-900' },
                    { id: 'elegant', name: 'Elegant Gold', desc: 'Luxury feel with script fonts and gold accents.', color: 'bg-orange-50' },
                    { id: 'artistic', name: 'Artistic Ink', desc: 'Creative watercolor style layout.', color: 'bg-[#fdfbf7]' },
                  ].map((t) => (
                    <div 
                        key={t.id}
                        onClick={() => setTempData({ ...tempData, activeTemplate: t.id as any })}
                        className={`cursor-pointer rounded-xl border-2 overflow-hidden transition-all duration-200 relative group
                          ${tempData.activeTemplate === t.id ? 'border-indigo-600 shadow-xl ring-2 ring-indigo-200 scale-[1.02]' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'}`}
                    >
                        <div className={`h-32 w-full flex items-center justify-center border-b border-slate-100 ${t.color}`}>
                          <span className={`font-bold text-lg ${t.id === 'modern' || t.id === 'corporate' ? 'text-white' : 'text-slate-500'}`}>{t.name}</span>
                        </div>
                        <div className="p-4 bg-white">
                          <div className="flex justify-between items-center mb-2">
                              <h4 className="font-bold text-slate-800">{t.name}</h4>
                              {tempData.activeTemplate === t.id && <CheckCircle2 className="text-indigo-600" size={20} />}
                          </div>
                          <p className="text-xs text-slate-500">{t.desc}</p>
                        </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {/* COURSES, DURATIONS, TYPES */}
        {(['courses', 'durations'] as const).map(tab => activeTab === tab && (
          <div key={tab} className="space-y-6 max-w-2xl animate-fade-in">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 capitalize">Manage {tab}</h3>
            
            {/* Add New Box */}
            <div className="bg-slate-50 p-4 rounded-xl flex gap-3 border border-slate-200 shadow-inner">
              <input type="text" id={`new${tab}`} placeholder={`Add new ${tab.slice(0, -1)}`} className={inputClass} 
                onKeyDown={(e) => { if(e.key === 'Enter' && e.currentTarget.value) { addItem(tab, { id: crypto.randomUUID(), [tab === 'courses' ? 'name' : 'label']: e.currentTarget.value }); e.currentTarget.value = ''; }}} />
              <button onClick={() => { const el = document.getElementById(`new${tab}`) as HTMLInputElement; if(el?.value) { addItem(tab, { id: crypto.randomUUID(), [tab === 'courses' ? 'name' : 'label']: el.value }); el.value = ''; }}} className="bg-indigo-600 text-white px-5 rounded-lg font-bold hover:bg-indigo-700 transition shadow-sm flex items-center"><Plus /></button>
            </div>
            
            {/* List Items */}
            <div className="space-y-3">
              {tempData[tab].map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                  <input value={item.name || item.label} onChange={(e) => updateItem(tab, item.id, tab === 'courses' ? 'name' : 'label', e.target.value)} className="flex-1 bg-transparent border-none outline-none text-slate-900 font-medium" />
                  <button onClick={() => removeItem(tab, item.id)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                </div>
              ))}
              {tempData[tab].length === 0 && <p className="text-center text-slate-400 text-sm">No items found.</p>}
            </div>
          </div>
        ))}

        {activeTab === 'types' && (
          <div className="space-y-6 max-w-2xl animate-fade-in">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800">Certificate Types</h3>
             <button onClick={() => addItem('types', { id: crypto.randomUUID(), label: 'New Type', templateTitle: 'Certificate', description: 'This is to certify that {{student}}...' })} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-lg hover:bg-indigo-700 shadow-sm mb-4 transition font-bold w-full md:w-auto justify-center">
                <Plus size={18}/> Add New Type
              </button>
            <div className="space-y-4">
              {tempData.types.map(t => (
                <div key={t.id} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-3 relative group hover:border-indigo-300 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Label</label>
                        <input value={t.label} onChange={(e) => updateItem('types', t.id, 'label', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Title on Certificate</label>
                        <input value={t.templateTitle} onChange={(e) => updateItem('types', t.id, 'templateTitle', e.target.value)} className={`${inputClass} font-bold`} />
                    </div>
                    <div className="md:col-span-2">
                       <label className="text-xs font-bold text-slate-500 mb-1 block">Body Text</label>
                       <p className="text-[10px] text-slate-400 mb-2">Placeholders: <code>{`{{student}}, {{father}}, {{course}}, {{duration}}, {{certNo}}, {{startDate}}, {{endDate}}`}</code></p>
                       <textarea value={t.description} onChange={(e) => updateItem('types', t.id, 'description', e.target.value)} className={`${inputClass} h-32`} />
                    </div>
                  </div>
                   <button onClick={() => removeItem('types', t.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-2"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
