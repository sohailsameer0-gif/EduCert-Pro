import React, { useState, useEffect } from 'react';
import { Shield, Download, ArrowLeft, RefreshCw, FileCheck, Lock, User, Settings, LogOut, LayoutDashboard, Loader2, Maximize2, Mail, KeyRound, HelpCircle, Send, X, Bell } from 'lucide-react';
import { AppData, StudentCertificateData, UserProfile } from './types';
import { getAppData, findUser, saveUser, updateUserPassword } from './utils/storage';
import { SECURITY_QUESTIONS } from './constants';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Components
import AdminDashboard from './components/AdminDashboard';
import Certificate from './components/Certificate';

type ViewMode = 'auth' | 'generator' | 'settings' | 'preview';
type AuthMode = 'login' | 'signup' | 'forgot' | 'otp';

function App() {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [view, setView] = useState<ViewMode>('auth');
  
  // Auth State
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Login Inputs
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  
  // Signup Inputs
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupQuestion, setSignupQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [signupAnswer, setSignupAnswer] = useState('');

  // OTP State
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  
  // Mock Email Notification State
  const [mockEmail, setMockEmail] = useState<{to: string, code: string} | null>(null);

  // Forgot Password Inputs
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [newPass, setNewPass] = useState('');
  const [securityQuestionToDisplay, setSecurityQuestionToDisplay] = useState<string | null>(null);

  const [authMsg, setAuthMsg] = useState({ type: '', text: '' });

  // Certificate Form State
  const [isDownloading, setIsDownloading] = useState(false);
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

  // Clear mock email after 10 seconds if not closed
  useEffect(() => {
    if (mockEmail) {
        const timer = setTimeout(() => setMockEmail(null), 15000); // 15 seconds visibility
        return () => clearTimeout(timer);
    }
  }, [mockEmail]);

  const clearAuthForms = () => {
    setEmailInput(''); setPasswordInput('');
    setSignupEmail(''); setSignupPass(''); setSignupConfirm(''); setSignupAnswer('');
    setForgotEmail(''); setForgotAnswer(''); setNewPass('');
    setOtpInput(''); setGeneratedOtp(''); setPendingUser(null);
    setAuthMsg({ type: '', text: '' });
    setSecurityQuestionToDisplay(null);
    setMockEmail(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim().toLowerCase();
    
    const user = findUser(email);
    
    if (user && user.password === passwordInput) {
      setCurrentUser(user);
      setView('generator');
      clearAuthForms();
    } else {
      setAuthMsg({ type: 'error', text: 'Invalid Gmail or Password.' });
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    const email = signupEmail.trim().toLowerCase();

    // 1. STRICT GMAIL VALIDATION
    if (!email.endsWith('@gmail.com')) {
      setAuthMsg({ type: 'error', text: 'Registration restricted: Please use a valid @gmail.com address.' });
      return;
    }

    if (findUser(email)) {
      setAuthMsg({ type: 'error', text: 'This Gmail address is already registered.' });
      return;
    }

    if (signupPass !== signupConfirm) {
      setAuthMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (signupPass.length < 4) {
      setAuthMsg({ type: 'error', text: 'Password must be at least 4 characters.' });
      return;
    }
    
    // 2. GENERATE OTP & PREPARE PENDING USER
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    
    setPendingUser({
      email: email,
      password: signupPass,
      securityQuestion: signupQuestion,
      securityAnswer: signupAnswer
    });

    // 3. SHOW MOCK EMAIL NOTIFICATION
    setMockEmail({ to: email, code: code });

    setAuthMode('otp');
    setAuthMsg({ type: 'success', text: `Verification code sent to ${email}` });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpInput === generatedOtp && pendingUser) {
      // Create User
      const success = saveUser(pendingUser);
      
      if (success) {
        setAuthMsg({ type: 'success', text: 'Email Verified! Account created successfully.' });
        setAuthMode('login');
        setEmailInput(pendingUser.email);
        
        // Cleanup
        setPendingUser(null);
        setGeneratedOtp('');
        setOtpInput('');
        setMockEmail(null);
      } else {
        setAuthMsg({ type: 'error', text: 'Error creating account. User might exist.' });
      }
    } else {
      setAuthMsg({ type: 'error', text: 'Invalid OTP Code. Please try again.' });
    }
  };

  const handleResendOtp = () => {
    if (!pendingUser) return;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setMockEmail({ to: pendingUser.email, code: code });
    setAuthMsg({ type: 'success', text: 'New OTP sent.' });
  };

  const checkEmailForRecovery = () => {
    const email = forgotEmail.trim().toLowerCase();
    
    if (!email.endsWith('@gmail.com')) {
       setAuthMsg({ type: 'error', text: 'Please enter a valid @gmail.com address.' });
       return;
    }

    const user = findUser(email);
    if (user) {
      setSecurityQuestionToDisplay(user.securityQuestion);
      setAuthMsg({ type: '', text: '' });
    } else {
      setAuthMsg({ type: 'error', text: 'Gmail account not found.' });
      setSecurityQuestionToDisplay(null);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const email = forgotEmail.trim().toLowerCase();
    const user = findUser(email);

    if (user && user.securityAnswer.toLowerCase() === forgotAnswer.toLowerCase()) {
      if(newPass.length < 4) {
         setAuthMsg({ type: 'error', text: 'Password must be at least 4 chars.' });
         return;
      }
      updateUserPassword(email, newPass);
      setAuthMsg({ type: 'success', text: 'Password reset successful! Login now.' });
      setTimeout(() => {
        setAuthMode('login');
        setEmailInput(email);
      }, 1500);
    } else {
      setAuthMsg({ type: 'error', text: 'Incorrect Security Answer.' });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('auth');
    setAuthMode('login');
  };

  const handleGenerateCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId || !formData.typeId) {
      alert("Please select Course and Certificate Type");
      return;
    }
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
        alert("Failed to download PDF.");
    } finally {
        setIsDownloading(false);
    }
  };

  if (!appData) return <div className="min-h-screen flex items-center justify-center">Loading Data...</div>;

  // Theme Styles
  const themeClasses = {
    light: 'bg-slate-100 text-slate-900',
    dark: 'bg-slate-950 text-slate-200',
    midnight: 'bg-[#0a192f] text-gold-50',
  };
  
  const currentThemeClass = themeClasses[appData.appTheme || 'light'];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${currentThemeClass} relative`}>
      
      {/* SIMULATED EMAIL NOTIFICATION POPUP */}
      {mockEmail && (
        <div className="fixed top-4 right-4 z-[100] max-w-sm w-full animate-bounce-in">
           <div className="bg-white border-l-4 border-indigo-600 rounded-lg shadow-2xl overflow-hidden">
              <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
                 <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                    <Mail size={16} /> New Email (Simulation)
                 </div>
                 <button onClick={() => setMockEmail(null)} className="text-slate-400 hover:text-red-500">
                    <X size={16} />
                 </button>
              </div>
              <div className="p-4">
                 <div className="text-xs text-slate-500 mb-1">To: {mockEmail.to}</div>
                 <div className="font-bold text-slate-800 text-sm mb-2">Subject: Your Verification Code</div>
                 <div className="bg-slate-100 p-3 rounded text-center">
                    <span className="text-2xl font-mono font-bold tracking-widest text-indigo-700 select-all">
                       {mockEmail.code}
                    </span>
                 </div>
                 <p className="text-[10px] text-slate-400 mt-2 text-center">
                    * Since this app is offline, we simulate the email here.
                 </p>
              </div>
           </div>
        </div>
      )}

      {/* AUTH VIEW */}
      {view === 'auth' && (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center mb-6 animate-fade-in">
             <div className="bg-navy-900 text-gold-400 p-4 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-xl border border-gold-500/20">
                <Shield size={40} />
             </div>
             <h1 className="text-3xl font-bold">EduCert Pro</h1>
             <p className="opacity-70 mt-2">Secure Certificate Management System</p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 text-slate-900 relative overflow-hidden">
            
            {/* LOGIN FORM */}
            {authMode === 'login' && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2 flex items-center gap-2">
                   <Lock size={20} className="text-indigo-600"/> Login
                </h2>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gmail Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      <input type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 pl-10 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-navy-800 outline-none" placeholder="you@gmail.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 pl-10 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-navy-800 outline-none" placeholder="Enter password" />
                    </div>
                    <div className="text-right mt-1">
                      <button type="button" onClick={() => { clearAuthForms(); setAuthMode('forgot'); }} className="text-xs text-indigo-600 hover:underline">Forgot Password?</button>
                    </div>
                  </div>
                  
                  {authMsg.text && (
                    <div className={`p-3 rounded text-sm text-center border ${authMsg.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                      {authMsg.text}
                    </div>
                  )}
                  
                  <button type="submit" className="w-full bg-navy-900 text-white py-3.5 rounded-lg font-bold hover:bg-navy-800 transition shadow-lg">Login</button>
                  
                  <div className="text-center text-sm text-slate-600 mt-4">
                     Don't have an account? <button type="button" onClick={() => { clearAuthForms(); setAuthMode('signup'); }} className="text-indigo-600 font-bold hover:underline">Sign Up with Gmail</button>
                  </div>
                </form>
              </div>
            )}

            {/* SIGNUP FORM */}
            {authMode === 'signup' && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2 flex items-center gap-2">
                   <User size={20} className="text-indigo-600"/> Create Account
                </h2>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Gmail Address (@gmail.com)</label>
                    <input type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-navy-800 outline-none" placeholder="you@gmail.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Password</label>
                      <input type="password" required minLength={4} value={signupPass} onChange={(e) => setSignupPass(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-navy-800 outline-none" placeholder="****" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Confirm</label>
                      <input type="password" required minLength={4} value={signupConfirm} onChange={(e) => setSignupConfirm(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-navy-800 outline-none" placeholder="****" />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                     <p className="text-xs text-slate-400 mb-2 font-medium">Security Question (for password recovery)</p>
                     <div className="space-y-2">
                        <select value={signupQuestion} onChange={e => setSignupQuestion(e.target.value)} className="w-full text-sm border border-slate-300 rounded p-2 text-slate-700">
                           {SECURITY_QUESTIONS.map((q, i) => <option key={i} value={q}>{q}</option>)}
                        </select>
                        <input type="text" required value={signupAnswer} onChange={e => setSignupAnswer(e.target.value)} className="w-full text-sm border border-slate-300 rounded p-2 text-slate-900" placeholder="Your Answer" />
                     </div>
                  </div>

                  {authMsg.text && (
                    <div className={`p-2 rounded text-xs text-center border ${authMsg.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                      {authMsg.text}
                    </div>
                  )}

                  <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition shadow-md">Sign Up</button>
                  
                  <div className="text-center text-sm text-slate-600 mt-2">
                     Already have an account? <button type="button" onClick={() => { clearAuthForms(); setAuthMode('login'); }} className="text-navy-900 font-bold hover:underline">Login</button>
                  </div>
                </form>
              </div>
            )}

            {/* OTP VERIFICATION FORM */}
            {authMode === 'otp' && (
               <div className="animate-fade-in">
                  <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2 flex items-center gap-2">
                     <Send size={20} className="text-indigo-600"/> Verify Email
                  </h2>
                  <div className="mb-6 text-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Mail className="text-indigo-600" size={32} />
                    </div>
                    <p className="text-sm text-slate-600">
                       We have sent a 6-digit verification code to <br/>
                       <span className="font-bold text-slate-900">{pendingUser?.email}</span>
                    </p>
                    <p className="text-xs text-red-500 mt-2 font-bold animate-pulse">
                       Check the simulated email popup on your screen!
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase text-center">Enter 6-Digit Code</label>
                        <input 
                           type="text" 
                           maxLength={6}
                           value={otpInput} 
                           onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))} 
                           className="w-full border-2 border-slate-300 rounded-lg p-3 text-center text-2xl tracking-[0.5em] font-mono text-slate-900 focus:ring-2 focus:ring-navy-800 focus:border-navy-800 outline-none transition-all" 
                           placeholder="000000" 
                           autoFocus
                        />
                     </div>

                     {authMsg.text && (
                        <div className={`p-2 rounded text-xs text-center border ${authMsg.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                           {authMsg.text}
                        </div>
                     )}

                     <button type="submit" className="w-full bg-navy-900 text-white py-3 rounded-lg font-bold hover:bg-navy-800 transition shadow-md">Verify & Create Account</button>
                     
                     <div className="flex justify-between text-xs mt-4">
                        <button type="button" onClick={() => { setAuthMode('signup'); setPendingUser(null); setMockEmail(null); }} className="text-slate-500 hover:text-slate-800">Change Email</button>
                        <button type="button" onClick={handleResendOtp} className="text-indigo-600 font-bold hover:underline">Resend Code</button>
                     </div>
                  </form>
               </div>
            )}

            {/* FORGOT PASSWORD FORM */}
            {authMode === 'forgot' && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2 flex items-center gap-2">
                   <HelpCircle size={20} className="text-indigo-600"/> Recovery
                </h2>
                
                {!securityQuestionToDisplay ? (
                  <div className="space-y-4">
                     <p className="text-sm text-slate-600">Enter your Gmail address to retrieve your security question.</p>
                     <div>
                        <input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-navy-800 outline-none" placeholder="you@gmail.com" />
                     </div>
                     {authMsg.text && <div className="text-xs text-red-500 text-center">{authMsg.text}</div>}
                     <button type="button" onClick={checkEmailForRecovery} className="w-full bg-navy-900 text-white py-3 rounded-lg font-bold hover:bg-navy-800 transition">Next</button>
                     <button type="button" onClick={() => { clearAuthForms(); setAuthMode('login'); }} className="w-full text-slate-500 py-2 text-sm hover:text-slate-800">Cancel</button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                     <div className="bg-indigo-50 p-3 rounded border border-indigo-100 text-indigo-900 text-sm font-medium mb-2">
                        {securityQuestionToDisplay}
                     </div>
                     <div>
                        <input type="text" required value={forgotAnswer} onChange={e => setForgotAnswer(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-navy-800 outline-none" placeholder="Your Security Answer" autoFocus />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">New Password</label>
                        <input type="password" required minLength={4} value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-navy-800 outline-none" placeholder="****" />
                     </div>

                     {authMsg.text && (
                        <div className={`p-2 rounded text-xs text-center border ${authMsg.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                           {authMsg.text}
                        </div>
                     )}

                     <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-md">Reset Password</button>
                     <button type="button" onClick={() => { clearAuthForms(); setAuthMode('login'); }} className="w-full text-slate-500 py-2 text-sm hover:text-slate-800">Cancel</button>
                  </form>
                )}
              </div>
            )}

          </div>
          <p className="mt-8 text-xs opacity-50">© 2024 EduCert Pro. All Rights Reserved.</p>
        </div>
      )}

      {/* AUTHENTICATED VIEWS */}
      {view !== 'auth' && currentUser && (
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
                  <span className="text-[10px] text-gold-400 font-medium uppercase tracking-wider">
                     {currentUser.email}
                  </span>
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
            {view === 'settings' && currentUser && (
              <AdminDashboard 
                data={appData} 
                currentUser={currentUser}
                onUpdate={(newData) => {
                  setAppData(newData);
                }} 
                onLogout={handleLogout}
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