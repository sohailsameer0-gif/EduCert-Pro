import React, { useState, useEffect } from 'react';
import { Shield, Download, ArrowLeft, RefreshCw, FileCheck, Lock, User, Settings, LogOut, LayoutDashboard, Loader2, Maximize2 } from 'lucide-react';
import { AppData, StudentCertificateData } from './types';
import { getAppData } from './utils/storage';
import { ADMIN_CREDENTIALS } from './constants';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Components
import AdminDashboard from './components/AdminDashboard';
import Certificate from './components/Certificate';

type ViewMode = 'login' | 'generator' | 'settings' | 'preview';

function App() {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [view, setView] = useState<ViewMode>('login');
  
  // Login State
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  // PDF Generation State
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<StudentCertificateData>({
    id: '',
    certificateNo: '',
    studentName: '',
    fatherName: '',
    courseId: '',
    durationId: '',
    typeId: '',
    orientation: 'landscape',
    dateOfJoining: '',
    dateOfCompletion: '',
    issueDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Load data from offline storage
    const data = getAppData();
    setAppData(data);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput === ADMIN_CREDENTIALS.username && passwordInput === ADMIN_CREDENTIALS.password) {
      setView('generator');
      setUsernameInput('');
      setPasswordInput('');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setView('login');
  };

  const handleGenerateCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId || !formData.typeId) {
      alert("Please select Course and Certificate Type");
      return;
    }
    // Generate a pseudo-random ID for the certificate if empty
    if (!formData.id) {
        setFormData(prev => ({...prev, id: crypto.randomUUID()}));
    }
    setView('preview');
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('certificate-to-download');
    if (!element) return;

    setIsDownloading(true);
    
    try {
        const isPortrait = formData.orientation === 'portrait';
        // A4 Landscape: 1123x794px | Portrait: 794x1123px (CSS Pixels)
        const width = isPortrait ? 794 : 1123;
        const height = isPortrait ? 1123 : 794;

        const canvas = await html2canvas(element, {
            scale: 4, 
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: width, 
            height: height,
            windowWidth: 1600,
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        
        const pdf = new jsPDF({
            orientation: isPortrait ? 'portrait' : 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        const safeName = formData.studentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        pdf.save(`${safeName}_certificate.pdf`);

    } catch (err) {
        console.error("PDF Download failed:", err);
        alert("Failed to download PDF. Please check console for errors.");
    } finally {
        setIsDownloading(false);
    }
  };

  if (!appData) return <div className="min-h-screen flex items-center justify-center">Loading Data...</div>;

  // Theme Styles
  const themeClasses = {
    light: 'bg-slate-100 text-slate-900',
    dark: 'bg-slate-950 text-slate-200',
    midnight: 'bg-[#0a192f] text-gold-50', // Matching the Modern Template / Login
  };
  
  const currentThemeClass = themeClasses[appData.appTheme || 'light'];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${currentThemeClass}`}>
      
      {/* LOGIN VIEW */}
      {view === 'login' && (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center mb-8 animate-fade-in">
             <div className="bg-navy-900 text-gold-400 p-4 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-xl border border-gold-500/20">
                <Shield size={40} />
             </div>
             <h1 className="text-3xl font-bold">EduCert Pro</h1>
             <p className="opacity-70 mt-2">Secure Certificate Management System</p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 text-slate-900">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">Admin Access</h2>
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-3 pl-10 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-navy-800 focus:border-transparent outline-none transition-all"
                    placeholder="Enter username"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-3 pl-10 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-navy-800 focus:border-transparent outline-none transition-all"
                    placeholder="Enter password"
                  />
                </div>
              </div>
              
              {loginError && (
                <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center border border-red-100 font-medium">
                  Invalid Username or Password.
                </div>
              )}
              
              <button type="submit" className="w-full bg-navy-900 text-white py-3.5 rounded-lg font-bold hover:bg-navy-800 transition shadow-lg transform active:scale-[0.98]">
                Login to Portal
              </button>
            </form>
          </div>
          <p className="mt-8 text-xs opacity-50">© 2024 EduCert Pro. All Rights Reserved.</p>
        </div>
      )}

      {/* AUTHENTICATED VIEWS */}
      {view !== 'login' && (
        <>
          {/* HEADER (Hidden when printing) */}
          <header className="bg-navy-900 text-white shadow-md no-print sticky top-0 z-50 border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-gold-500 text-navy-900 p-1.5 rounded">
                  <FileCheck size={20} strokeWidth={3} />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-white leading-none">EduCert Pro</h1>
                  <span className="text-[10px] text-gold-400 font-medium uppercase tracking-wider">Admin Portal</span>
                </div>
              </div>

              {view !== 'preview' && (
                <nav className="flex items-center gap-2 bg-navy-800 p-1 rounded-lg">
                   <button 
                     onClick={() => setView('generator')}
                     className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'generator' ? 'bg-gold-500 text-navy-900 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-navy-700'}`}
                   >
                     <LayoutDashboard size={16} /> Generator
                   </button>
                   <button 
                     onClick={() => setView('settings')}
                     className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'settings' ? 'bg-gold-500 text-navy-900 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-navy-700'}`}
                   >
                     <Settings size={16} /> Settings
                   </button>
                </nav>
              )}
              
              <div className="flex items-center">
                 {view === 'preview' ? (
                   <button onClick={() => setView('generator')} className="text-sm text-slate-300 hover:text-white flex items-center gap-2">
                     <ArrowLeft size={16} /> Back to Edit
                   </button>
                 ) : (
                   <button onClick={handleLogout} className="text-sm text-red-300 hover:text-red-100 hover:bg-red-900/30 px-3 py-1.5 rounded transition flex items-center gap-2">
                     <LogOut size={16} /> Logout
                   </button>
                 )}
              </div>
            </div>
          </header>

          {/* MAIN CONTENT */}
          <main className="flex-1 container mx-auto p-4 md:p-6">
            
            {/* GENERATOR FORM */}
            {view === 'generator' && (
              <div className="max-w-5xl mx-auto animate-fade-in">
                 <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-slate-200">
                    <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center text-slate-900">
                       <div>
                         <h2 className="text-2xl font-bold text-navy-900">New Certificate</h2>
                         <p className="text-slate-500 text-sm">Enter student details to generate a credential</p>
                       </div>
                       <button 
                          onClick={() => setFormData({
                              id: '',
                              certificateNo: '',
                              studentName: '',
                              fatherName: '',
                              courseId: '',
                              durationId: '',
                              typeId: '',
                              orientation: 'landscape',
                              dateOfJoining: '',
                              dateOfCompletion: '',
                              issueDate: new Date().toISOString().split('T')[0]
                            })}
                          className="text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
                       >
                          <RefreshCw size={16} /> Reset Form
                       </button>
                    </div>
                    
                    <form onSubmit={handleGenerateCertificate} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-900">
                       
                       {/* Section 1 */}
                       <div className="md:col-span-2">
                          <h3 className="text-sm uppercase tracking-wider font-bold text-indigo-600 mb-4 flex items-center gap-2">
                            <User size={16} /> Student Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Certificate No.</label>
                                <input 
                                  required
                                  type="text" 
                                  value={formData.certificateNo}
                                  onChange={e => setFormData({...formData, certificateNo: e.target.value})}
                                  className="w-full border border-slate-300 bg-white rounded-lg p-3 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                  placeholder="e.g. PITS-2024-001"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Student Name</label>
                                <input 
                                  required
                                  type="text" 
                                  value={formData.studentName}
                                  onChange={e => setFormData({...formData, studentName: e.target.value})}
                                  className="w-full border border-slate-300 bg-white rounded-lg p-3 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                  placeholder="e.g. Muhammad Owais Ali"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Father's Name</label>
                                <input 
                                  type="text" 
                                  value={formData.fatherName}
                                  onChange={e => setFormData({...formData, fatherName: e.target.value})}
                                  className="w-full border border-slate-300 bg-white rounded-lg p-3 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                  placeholder="e.g. Ali Ahmed"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Paper Orientation</label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 border rounded-lg p-3 cursor-pointer flex items-center justify-center gap-2 ${formData.orientation === 'landscape' ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold' : 'border-slate-300'}`}>
                                        <input type="radio" name="orientation" value="landscape" checked={formData.orientation === 'landscape'} onChange={() => setFormData({...formData, orientation: 'landscape'})} className="hidden" />
                                        <Maximize2 className="rotate-90" size={18}/> Landscape
                                    </label>
                                    <label className={`flex-1 border rounded-lg p-3 cursor-pointer flex items-center justify-center gap-2 ${formData.orientation === 'portrait' ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold' : 'border-slate-300'}`}>
                                        <input type="radio" name="orientation" value="portrait" checked={formData.orientation === 'portrait'} onChange={() => setFormData({...formData, orientation: 'portrait'})} className="hidden" />
                                        <Maximize2 size={18} /> Portrait
                                    </label>
                                </div>
                             </div>
                          </div>
                       </div>

                       {/* Section 2 */}
                       <div className="md:col-span-2 border-t pt-6">
                          <h3 className="text-sm uppercase tracking-wider font-bold text-indigo-600 mb-4 flex items-center gap-2">
                            <FileCheck size={16} /> Course Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Select Course</label>
                                <select 
                                  required
                                  value={formData.courseId}
                                  onChange={e => setFormData({...formData, courseId: e.target.value})}
                                  className="w-full border border-slate-300 rounded-lg p-3 bg-white text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                >
                                   <option value="">-- Select Course --</option>
                                   {appData.courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                             </div>

                             <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Duration</label>
                                <select 
                                  required
                                  value={formData.durationId}
                                  onChange={e => setFormData({...formData, durationId: e.target.value})}
                                  className="w-full border border-slate-300 rounded-lg p-3 bg-white text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                >
                                   <option value="">-- Select Duration --</option>
                                   {appData.durations.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                                </select>
                             </div>

                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Certificate Type</label>
                                <select 
                                  required
                                  value={formData.typeId}
                                  onChange={e => setFormData({...formData, typeId: e.target.value})}
                                  className="w-full border border-slate-300 rounded-lg p-3 bg-white text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                >
                                   <option value="">-- Select Type --</option>
                                   {appData.types.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                </select>
                             </div>
                          </div>
                       </div>

                       {/* Section 3 */}
                       <div className="md:col-span-2 border-t pt-6">
                           <h3 className="text-sm uppercase tracking-wider font-bold text-indigo-600 mb-4 flex items-center gap-2">
                            <Settings size={16} /> Timeline
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Date of Joining</label>
                                <input 
                                  type="date" 
                                  value={formData.dateOfJoining}
                                  onChange={e => setFormData({...formData, dateOfJoining: e.target.value})}
                                  className="w-full border border-slate-300 bg-white rounded-lg p-3 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Date of Completion</label>
                                <input 
                                  type="date" 
                                  value={formData.dateOfCompletion}
                                  onChange={e => setFormData({...formData, dateOfCompletion: e.target.value})}
                                  className="w-full border border-slate-300 bg-white rounded-lg p-3 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Issue Date</label>
                                <input 
                                  type="date" 
                                  value={formData.issueDate}
                                  onChange={e => setFormData({...formData, issueDate: e.target.value})}
                                  className="w-full border border-slate-300 bg-white rounded-lg p-3 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                             </div>
                          </div>
                       </div>

                       <div className="md:col-span-2 mt-4">
                          <button type="submit" className="w-full bg-navy-900 hover:bg-navy-800 text-gold-400 text-lg font-bold py-4 rounded-xl shadow-lg transform transition hover:-translate-y-1 active:scale-[0.99] flex items-center justify-center gap-3">
                             <FileCheck size={24} /> Generate Certificate Preview
                          </button>
                       </div>

                    </form>
                 </div>
              </div>
            )}

            {/* SETTINGS VIEW */}
            {view === 'settings' && (
              <AdminDashboard 
                data={appData} 
                onUpdate={(newData) => {
                  setAppData(newData);
                }} 
                onLogout={handleLogout} // Passed but unused in internal UI now
              />
            )}

            {/* PREVIEW VIEW */}
            {view === 'preview' && (
              <div className="flex flex-col items-center gap-8 animate-fade-in pb-10">
                 <div className="w-full flex justify-between items-center max-w-[1123px] no-print bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                   <div className="text-slate-900">
                      <h3 className="font-bold">Preview Mode</h3>
                      <p className="text-xs text-slate-500">Review details before downloading</p>
                   </div>
                   <div className="flex gap-4">
                      <button 
                        onClick={() => setView('generator')}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        <ArrowLeft size={18} /> Edit Details
                      </button>
                      <button 
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                        className={`flex items-center gap-2 bg-navy-900 text-gold-400 px-6 py-2 rounded-lg shadow hover:bg-navy-800 transition font-bold ${isDownloading ? 'opacity-70 cursor-wait' : ''}`}
                      >
                        {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        {isDownloading ? 'Processing...' : 'Download PDF'}
                      </button>
                   </div>
                 </div>
                 
                 {/* The Certificate itself */}
                 <div className="print-area w-full flex justify-center py-4 bg-slate-200 overflow-auto">
                    {/* ID used for HTML2Canvas targeting */}
                    <div id="certificate-to-download">
                       <Certificate data={formData} settings={appData} previewMode={false} />
                    </div>
                 </div>
              </div>
            )}

          </main>
        </>
      )}
    </div>
  );
}

export default App;