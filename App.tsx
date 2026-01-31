
import React, { useState, useEffect } from 'react';
import { Shield, Download, ArrowLeft, RefreshCw, FileCheck, Lock, User, Settings, LogOut, LayoutDashboard, Loader2, Maximize2, Mail, KeyRound, HelpCircle, Send, X, Bell, CreditCard, CheckCircle, AlertTriangle, Phone, UploadCloud, Image as ImageIcon, Clock } from 'lucide-react';
import { AppData, StudentCertificateData, UserProfile, LicenseInfo } from './types';
import { getAppData, findUser, saveUser, updateUserPassword, updateUserLicense, addPayment, validateAndUseKey, getPayments, fileToBase64 } from './utils/storage';
import { SECURITY_QUESTIONS } from './constants';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Components
import AdminDashboard from './components/AdminDashboard';
import SuperAdminPortal from './components/SuperAdminPortal';
import Certificate from './components/Certificate';

type ViewMode = 'auth' | 'generator' | 'settings' | 'preview' | 'license' | 'super_admin' | 'pending_approval';
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

  // License & Payment State
  const [activationKey, setActivationKey] = useState('');
  const [paymentForm, setPaymentForm] = useState({ method: 'easypaisa', sender: '', tid: '', amount: '5000' });
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [licenseMsg, setLicenseMsg] = useState({ type: '', text: '' });
  const [userPaymentStatus, setUserPaymentStatus] = useState<string | null>(null);

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

  // Check for existing payments when user loads license view
  useEffect(() => {
    if (currentUser && view === 'license') {
        const payments = getPayments();
        // Find most recent payment
        const myPayment = payments
            .filter(p => p.userEmail === currentUser.email)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        if (myPayment) {
            setUserPaymentStatus(myPayment.status);
        }
    }
  }, [currentUser, view]);

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
      if (user.isBlocked) {
        setAuthMsg({ type: 'error', text: 'Account Blocked. Contact Admin.' });
        return;
      }

      setCurrentUser(user);
      clearAuthForms();

      // ROUTING LOGIC
      if (user.isAdmin) {
          setView('super_admin');
          return;
      }

      if (!user.isApproved) {
          setView('pending_approval');
          return;
      }
      
      // Check License Logic
      const isExpired = new Date(user.license.expiryDate) < new Date();
      if (isExpired && user.license.status !== 'active') {
        user.license.status = 'expired';
        updateUserLicense(user.email, user.license);
      }

      if (user.license.status === 'expired') {
        setView('license'); // Force license view
      } else {
        setView('generator');
      }
    } else {
      setAuthMsg({ type: 'error', text: 'Invalid Credentials.' });
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
      securityAnswer: signupAnswer,
      isApproved: false, // Explicitly false for new users
      license: {} as any
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
        setAuthMsg({ type: 'success', text: 'Email Verified! Login to continue.' });
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

  // License Logic
  const handleActivateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const duration = validateAndUseKey(activationKey, currentUser.email);
    
    if (duration) {
        const newLicense: LicenseInfo = {
            ...currentUser.license,
            status: 'active',
            plan: 'pro',
            expiryDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
            activationKey: activationKey
        };
        updateUserLicense(currentUser.email, newLicense);
        setCurrentUser({...currentUser, license: newLicense});
        setLicenseMsg({ type: 'success', text: 'License Activated Successfully!' });
        setTimeout(() => setView('generator'), 1500);
    } else {
        setLicenseMsg({ type: 'error', text: 'Invalid or Used Activation Key.' });
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // VALIDATION 1: TID Length
    if (paymentForm.tid.length < 8) {
        setLicenseMsg({ type: 'error', text: 'Invalid Transaction ID (Too Short)' });
        return;
    }

    // VALIDATION 2: Mandatory Image
    if (!paymentFile) {
        setLicenseMsg({ type: 'error', text: 'Payment screenshot is MANDATORY.' });
        return;
    }

    // VALIDATION 3: Image Size (Max 5MB now allowed because we compress)
    if (paymentFile.size > 5 * 1024 * 1024) {
        setLicenseMsg({ type: 'error', text: 'Image too large. Max 5MB allowed.' });
        return;
    }

    try {
        const base64Image = await fileToBase64(paymentFile);

        const result = addPayment({
            id: crypto.randomUUID(),
            userEmail: currentUser.email,
            method: paymentForm.method as any,
            senderName: paymentForm.sender,
            transactionId: paymentForm.tid,
            amount: paymentForm.amount,
            proofImage: base64Image,
            status: 'pending',
            date: new Date().toISOString()
        });

        if (result.success) {
            setLicenseMsg({ type: 'success', text: result.message });
            setPaymentForm({ ...paymentForm, sender: '', tid: '' });
            setPaymentFile(null);
            setUserPaymentStatus('pending');
        } else {
            setLicenseMsg({ type: 'error', text: result.message });
        }

    } catch (error) {
        setLicenseMsg({ type: 'error', text: 'Error processing image.' });
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

  const handleFullScreen = () => {
    const element = document.getElementById('certificate-preview-wrapper');
    if (element) {
        if (!document.fullscreenElement) {
            element.requestFullscreen().catch((err) => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    }
  };

  // Helper for Payment Display Details
  const getPaymentDetails = () => {
     switch (paymentForm.method) {
        case 'easypaisa': return { number: '0345 9355293', title: 'Muhammad Sohail' };
        case 'sadapay': return { number: '0335 9523835', title: 'Muhammad Sohail' };
        case 'nayapay': return { number: '0335 9523835', title: 'Muhammad Sohail' };
        default: return { number: '0335 9523835', title: 'Muhammad Sohail' };
     }
  };
  const payDetails = getPaymentDetails();

  if (!appData) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin mr-2"/> Loading EduCert Pro...</div>;

  // Theme Styles
  const themeClasses = {
    light: 'bg-slate-50 text-slate-900',
    dark: 'bg-slate-950 text-slate-200',
    midnight: 'bg-[#0a192f] text-gold-50',
  };
  
  const currentThemeClass = themeClasses[appData.appTheme || 'light'];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${view === 'auth' ? 'bg-gradient-to-br from-slate-900 via-navy-900 to-black text-white' : currentThemeClass} relative`}>
      
      {/* SIMULATED EMAIL NOTIFICATION POPUP */}
      {mockEmail && (
        <div className="fixed top-4 right-4 z-[100] max-w-sm w-[90%] md:w-full animate-bounce-in mx-auto left-0 right-0 md:left-auto md:right-4">
           <div className="bg-white border-l-4 border-indigo-600 rounded-lg shadow-2xl overflow-hidden">
              <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center text-slate-900">
                 <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                    <Mail size={16} /> New Email (Simulation)
                 </div>
                 <button onClick={() => setMockEmail(null)} className="text-slate-400 hover:text-red-500">
                    <X size={16} />
                 </button>
              </div>
              <div className="p-4 text-slate-900">
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

      {/* AUTH VIEW - PREMIUM DARK THEME */}
      {view === 'auth' && (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center mb-8 animate-fade-in relative z-10">
             <div className="bg-white/10 backdrop-blur-md text-gold-400 p-4 rounded-3xl w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/10 ring-4 ring-white/5">
                <Shield size={48} />
             </div>
             <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gold-200 to-white">EduCert Pro</h1>
             <p className="text-blue-200 mt-3 font-medium tracking-wide">Professional Institute Certification System</p>
          </div>

          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 text-slate-900 relative overflow-hidden animate-slide-up">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            
            {/* LOGIN FORM */}
            {authMode === 'login' && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                   <Lock size={24} className="text-indigo-600"/> Institute Login
                </h2>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">Gmail Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                      <input type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 pl-10 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="institute@gmail.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">Password</label>
                    <div className="relative group">
                      <KeyRound className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                      <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 pl-10 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="••••••••" />
                    </div>
                    <div className="text-right mt-2">
                      <button type="button" onClick={() => { clearAuthForms(); setAuthMode('forgot'); }} className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition">Forgot Password?</button>
                    </div>
                  </div>
                  
                  {authMsg.text && (
                    <div className={`p-3 rounded-lg text-sm text-center font-medium border ${authMsg.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                      {authMsg.text}
                    </div>
                  )}
                  
                  <button type="submit" className="w-full bg-gradient-to-r from-navy-900 to-navy-800 hover:from-navy-800 hover:to-navy-700 text-white py-3.5 rounded-xl font-bold transition shadow-lg transform active:scale-[0.98]">
                    Login to Dashboard
                  </button>
                  
                  <div className="text-center text-sm text-slate-500 mt-6 pt-4 border-t border-slate-100">
                     New Institute? <button type="button" onClick={() => { clearAuthForms(); setAuthMode('signup'); }} className="text-indigo-600 font-bold hover:underline ml-1">Register Now</button>
                  </div>
                </form>
              </div>
            )}

            {/* OTHER AUTH FORMS (Simplified styles applied) */}
            {(authMode === 'signup' || authMode === 'otp' || authMode === 'forgot') && (
               <div className="animate-fade-in">
                  <div className="mb-4">
                     <button onClick={() => {clearAuthForms(); setAuthMode('login')}} className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-sm font-medium"><ArrowLeft size={16}/> Back to Login</button>
                  </div>
                  {/* Reuse existing logic but ensure style matches */}
                  {authMode === 'signup' && (
                     <form onSubmit={handleSignup} className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Create Account</h2>
                        <input type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="w-full border p-3 rounded-lg bg-slate-50" placeholder="Email Address" />
                        <div className="grid grid-cols-2 gap-2">
                           <input type="password" required value={signupPass} onChange={(e) => setSignupPass(e.target.value)} className="w-full border p-3 rounded-lg bg-slate-50" placeholder="Password" />
                           <input type="password" required value={signupConfirm} onChange={(e) => setSignupConfirm(e.target.value)} className="w-full border p-3 rounded-lg bg-slate-50" placeholder="Confirm" />
                        </div>
                        <select value={signupQuestion} onChange={e => setSignupQuestion(e.target.value)} className="w-full border p-3 rounded-lg bg-slate-50 text-sm"><option>{SECURITY_QUESTIONS[0]}</option></select>
                        <input type="text" required value={signupAnswer} onChange={e => setSignupAnswer(e.target.value)} className="w-full border p-3 rounded-lg bg-slate-50" placeholder="Security Answer" />
                        
                        {authMsg.text && <div className="text-xs text-red-500 text-center font-bold">{authMsg.text}</div>}
                        <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg">Register</button>
                     </form>
                  )}
                  {authMode === 'otp' && (
                      <form onSubmit={handleVerifyOtp} className="space-y-6 text-center">
                         <h2 className="text-2xl font-bold text-slate-800">Verify Email</h2>
                         <p className="text-sm text-slate-500">Enter the code sent to {pendingUser?.email}</p>
                         <input type="text" maxLength={6} value={otpInput} onChange={(e) => setOtpInput(e.target.value)} className="w-full text-center text-3xl font-mono tracking-widest border-2 border-indigo-100 focus:border-indigo-500 rounded-xl p-3 outline-none" placeholder="000000" />
                         {authMsg.text && <div className="text-xs text-red-500 font-bold">{authMsg.text}</div>}
                         <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg">Verify Code</button>
                      </form>
                  )}
                  {authMode === 'forgot' && (
                     <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800">Reset Password</h2>
                        {!securityQuestionToDisplay ? (
                           <>
                              <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className="w-full border p-3 rounded-lg bg-slate-50" placeholder="Enter your email" />
                              <button onClick={checkEmailForRecovery} className="w-full bg-navy-800 text-white py-3 rounded-xl font-bold">Find Account</button>
                           </>
                        ) : (
                           <form onSubmit={handleResetPassword} className="space-y-4">
                              <div className="bg-indigo-50 p-3 rounded text-indigo-800 text-sm font-medium">{securityQuestionToDisplay}</div>
                              <input type="text" value={forgotAnswer} onChange={e => setForgotAnswer(e.target.value)} className="w-full border p-3 rounded-lg bg-slate-50" placeholder="Your Answer" />
                              <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full border p-3 rounded-lg bg-slate-50" placeholder="New Password" />
                              <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">Reset Password</button>
                           </form>
                        )}
                        {authMsg.text && <div className="text-xs text-red-500 text-center font-bold">{authMsg.text}</div>}
                     </div>
                  )}
               </div>
            )}
          </div>
          
          <div className="mt-8 text-center text-white/50 text-sm animate-fade-in">
             <p className="flex items-center justify-center gap-2 mb-2">
                <span className="font-medium flex items-center gap-1"><Phone size={14}/> Support:</span> 
                <span className="font-mono text-gold-400 font-bold bg-white/10 px-2 rounded">0335 9523835</span>
             </p>
             <p className="text-xs opacity-50">© 2024 EduCert Pro. Secure Offline System.</p>
          </div>
        </div>
      )}

      {/* AUTHENTICATED VIEWS */}
      {view !== 'auth' && currentUser && (
        <>
          {/* STICKY HEADER */}
          <header className="bg-navy-900/95 backdrop-blur-md text-white shadow-lg no-print sticky top-0 z-50 border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 min-h-[4rem] py-2 flex flex-wrap justify-between items-center gap-y-2">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-gold-400 to-gold-600 text-navy-900 p-2 rounded-lg shadow-lg">
                  <FileCheck size={20} strokeWidth={3} />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-white leading-none font-official">EduCert Pro</h1>
                  <span className="text-[10px] text-gold-400 font-medium uppercase tracking-wider block opacity-90">
                     {currentUser.email.length > 20 ? currentUser.email.substring(0, 18) + '...' : currentUser.email}
                  </span>
                </div>
              </div>

              {/* Desktop Navigation */}
              {view !== 'preview' && view !== 'pending_approval' && !currentUser.isAdmin && (
                <nav className="hidden md:flex justify-center items-center gap-2 bg-navy-800/50 p-1 rounded-xl border border-white/5">
                   <button 
                     onClick={() => setView('generator')}
                     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'generator' ? 'bg-gold-500 text-navy-900 shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                   >
                     <LayoutDashboard size={16} /> Generator
                   </button>
                   <button 
                     onClick={() => setView('settings')}
                     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'settings' ? 'bg-gold-500 text-navy-900 shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                   >
                     <Settings size={16} /> Settings
                   </button>
                   <button 
                     onClick={() => setView('license')}
                     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'license' ? 'bg-gold-500 text-navy-900 shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                   >
                     <CreditCard size={16} /> License
                   </button>
                </nav>
              )}
              
              <div className="flex items-center gap-3 ml-auto md:ml-0">
                 {view === 'preview' ? (
                   <button onClick={() => setView('generator')} className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition font-medium">
                     <ArrowLeft size={16} /> <span className="hidden sm:inline">Back</span>
                   </button>
                 ) : (
                   <button onClick={handleLogout} className="text-sm text-red-300 hover:text-white hover:bg-red-600/80 px-3 py-1.5 rounded-lg transition flex items-center gap-2 font-medium">
                     <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
                   </button>
                 )}
              </div>
            </div>

            {/* Mobile Navigation (Bottom Bar or Top Tabs) */}
            {view !== 'preview' && view !== 'pending_approval' && !currentUser.isAdmin && (
               <div className="md:hidden flex overflow-x-auto scrollbar-hide border-t border-white/10 bg-navy-900/50 backdrop-blur-md">
                   <button onClick={() => setView('generator')} className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 ${view === 'generator' ? 'text-gold-400 border-b-2 border-gold-400 bg-white/5' : 'text-slate-400'}`}>
                      <LayoutDashboard size={18} /> Generator
                   </button>
                   <button onClick={() => setView('settings')} className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 ${view === 'settings' ? 'text-gold-400 border-b-2 border-gold-400 bg-white/5' : 'text-slate-400'}`}>
                      <Settings size={18} /> Settings
                   </button>
                   <button onClick={() => setView('license')} className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 ${view === 'license' ? 'text-gold-400 border-b-2 border-gold-400 bg-white/5' : 'text-slate-400'}`}>
                      <CreditCard size={18} /> License
                   </button>
               </div>
            )}
          </header>

          {/* MAIN CONTENT */}
          <main className="flex-1 container mx-auto p-4 md:p-6 pb-20 md:pb-6 overflow-x-hidden">
            
            {/* SUPER ADMIN PORTAL */}
            {view === 'super_admin' && (
                <SuperAdminPortal currentUser={currentUser} />
            )}

            {/* PENDING APPROVAL VIEW */}
            {view === 'pending_approval' && (
                <div className="max-w-md mx-auto mt-10 md:mt-20 text-center animate-fade-in px-4">
                    <div className="bg-orange-50 p-8 rounded-2xl shadow-lg border border-orange-200">
                        <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="text-orange-600" size={40}/>
                        </div>
                        <h2 className="text-2xl font-bold text-orange-800 mb-2">Account Pending Approval</h2>
                        <p className="text-slate-600 mb-6">
                            Thank you for registering. Your institute account is currently under review.
                        </p>
                        <div className="bg-white p-4 rounded-xl text-sm text-slate-500 border border-slate-200 shadow-sm">
                            Contact Admin Support:
                            <br/>
                            <strong className="text-navy-900 text-lg flex items-center justify-center gap-2 mt-1">
                                <Phone size={16}/> 0335 9523835
                            </strong>
                        </div>
                        <button onClick={handleLogout} className="mt-6 text-orange-700 font-bold hover:bg-orange-100 px-4 py-2 rounded-lg transition">Log Out</button>
                    </div>
                </div>
            )}

            {/* LICENSE & PAYMENT VIEW */}
            {view === 'license' && (
               <div className="max-w-5xl mx-auto animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {/* Status Card */}
                  <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
                     <h2 className="text-xl md:text-2xl font-bold text-navy-900 mb-6 flex items-center gap-2"><CreditCard className="text-indigo-600"/> License Status</h2>
                     
                     <div className={`p-6 rounded-xl mb-6 text-center border-2 ${currentUser.license.status === 'active' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                        <div className="text-xs uppercase tracking-widest font-bold mb-1 opacity-70">Current Plan</div>
                        <div className={`text-2xl md:text-3xl font-bold ${currentUser.license.status === 'active' ? 'text-green-700' : 'text-red-600'}`}>
                           {currentUser.license.status === 'active' ? 'PRO PLAN (1 YEAR)' : 'EXPIRED / TRIAL'}
                        </div>
                        <div className="mt-4 text-sm text-slate-600">
                           Expiry: <strong>{new Date(currentUser.license.expiryDate).toLocaleDateString()}</strong>
                        </div>
                     </div>

                     <div className="border-t pt-6">
                        <h3 className="font-bold text-lg mb-4 text-slate-800">Activate License</h3>
                        <form onSubmit={handleActivateKey} className="flex gap-2">
                           <input 
                              type="text" 
                              value={activationKey} 
                              onChange={e => setActivationKey(e.target.value.toUpperCase())}
                              className="flex-1 border border-slate-300 rounded-lg p-3 uppercase font-mono tracking-wider text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                              placeholder="EDC-XXXX-YYYY" 
                           />
                           <button type="submit" className="bg-navy-900 text-white px-4 rounded-lg font-bold text-sm shadow-md hover:bg-navy-800 transition">Activate</button>
                        </form>
                        {licenseMsg.text && (
                           <p className={`text-sm mt-2 font-medium ${licenseMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{licenseMsg.text}</p>
                        )}
                     </div>
                  </div>

                  {/* Payment Request */}
                  <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
                     <h2 className="text-xl md:text-2xl font-bold text-navy-900 mb-4">Buy License</h2>
                     
                     {userPaymentStatus === 'pending' ? (
                         <div className="bg-gold-50 border border-gold-200 rounded-xl p-8 text-center">
                             <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                 <Clock size={32} className="text-gold-600" />
                             </div>
                             <h3 className="text-xl font-bold text-gold-800 mb-2">Verification Pending</h3>
                             <p className="text-slate-600 text-sm">
                                 Your payment proof is under review. <br/>
                                 Please wait up to 24 hours.
                             </p>
                         </div>
                     ) : (
                         <>
                             <p className="text-sm text-slate-500 mb-6">Transfer <strong>PKR 5,000</strong> to the account below and submit proof.</p>
                             
                             <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200 transition-all hover:border-indigo-200 hover:shadow-sm">
                                <div className="flex justify-between mb-2">
                                   <span className="text-slate-500 text-sm font-medium">Account Title</span>
                                   <span className="font-bold text-navy-900">{payDetails.title}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                   <span className="text-slate-500 text-sm capitalize font-medium">{paymentForm.method}</span>
                                   <span className="font-bold text-navy-900 font-mono text-lg">{payDetails.number}</span>
                                </div>
                             </div>

                             <form onSubmit={handleSubmitPayment} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   <div>
                                      <label className="text-xs font-bold text-slate-500 mb-1 block">Method</label>
                                      <select value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})} className="w-full border p-2.5 rounded-lg bg-white text-slate-900 text-sm">
                                        <option value="easypaisa">Easypaisa</option>
                                        <option value="sadapay">SadaPay</option>
                                        <option value="nayapay">NayaPay</option>
                                      </select>
                                   </div>
                                   <div>
                                      <label className="text-xs font-bold text-slate-500 mb-1 block">TID / Ref No</label>
                                      <input 
                                        required 
                                        value={paymentForm.tid} 
                                        onChange={e => setPaymentForm({...paymentForm, tid: e.target.value})} 
                                        className="w-full border p-2.5 rounded-lg text-sm" 
                                        placeholder="e.g. 12345678901"
                                      />
                                   </div>
                                </div>
                                <div>
                                     <label className="text-xs font-bold text-slate-500 mb-1 block">Sender Name</label>
                                     <input required value={paymentForm.sender} onChange={e => setPaymentForm({...paymentForm, sender: e.target.value})} className="w-full border p-2.5 rounded-lg text-sm" />
                                </div>
                                
                                {/* Image Upload */}
                                <div>
                                     <label className="text-xs font-bold text-slate-500 mb-1 block">Proof Screenshot</label>
                                     <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-4 hover:bg-slate-50 transition text-center cursor-pointer group hover:border-indigo-400">
                                         <input 
                                            type="file" 
                                            accept="image/*" 
                                            required
                                            onChange={(e) => setPaymentFile(e.target.files ? e.target.files[0] : null)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                         />
                                         <div className="flex flex-col items-center gap-2 pointer-events-none">
                                            {paymentFile ? (
                                                <>
                                                    <ImageIcon className="text-green-500 group-hover:scale-110 transition" size={24} />
                                                    <span className="text-sm font-bold text-green-700 truncate max-w-full px-2">{paymentFile.name}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <UploadCloud className="text-slate-400 group-hover:text-indigo-500 transition" size={24} />
                                                    <span className="text-xs text-slate-500">Tap to upload image</span>
                                                </>
                                            )}
                                         </div>
                                     </div>
                                </div>

                                <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98]">
                                    <Send size={16} /> Submit Payment
                                </button>
                             </form>
                         </>
                     )}
                  </div>
               </div>
            )}
            
            {/* GENERATOR */}
            {view === 'generator' && (
                <div className="max-w-5xl mx-auto animate-fade-in pb-10">
                 <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                    <div className="bg-slate-50 p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-slate-900">
                       <div>
                         <h2 className="text-2xl font-bold text-navy-900">New Certificate</h2>
                         <p className="text-slate-500 text-sm">Enter student details</p>
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
                          className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition border border-indigo-100"
                       >
                          <RefreshCw size={16} /> Reset
                       </button>
                    </div>
                    
                    <form onSubmit={handleGenerateCertificate} className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-900">
                       {/* Section 1 */}
                       <div className="md:col-span-2">
                          <h3 className="text-xs uppercase tracking-wider font-bold text-indigo-600 mb-4 flex items-center gap-2">
                            <User size={14} /> Student Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Certificate No.</label>
                                <input 
                                  required
                                  type="text" 
                                  value={formData.certificateNo}
                                  onChange={e => setFormData({...formData, certificateNo: e.target.value})}
                                  className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                  placeholder="e.g. 2024-001"
                                />
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Student Name</label>
                                <input 
                                  required
                                  type="text" 
                                  value={formData.studentName}
                                  onChange={e => setFormData({...formData, studentName: e.target.value})}
                                  className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                  placeholder="Full Name"
                                />
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Father's Name</label>
                                <input 
                                  type="text" 
                                  value={formData.fatherName}
                                  onChange={e => setFormData({...formData, fatherName: e.target.value})}
                                  className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                  placeholder="Father Name"
                                />
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Orientation</label>
                                <div className="flex gap-2">
                                    <label className={`flex-1 border rounded-lg p-3 cursor-pointer flex items-center justify-center gap-2 transition ${formData.orientation === 'landscape' ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold' : 'border-slate-300 text-slate-500'}`}>
                                        <input type="radio" name="orientation" value="landscape" checked={formData.orientation === 'landscape'} onChange={() => setFormData({...formData, orientation: 'landscape'})} className="hidden" />
                                        <Maximize2 className="rotate-90" size={16}/> Landscape
                                    </label>
                                    <label className={`flex-1 border rounded-lg p-3 cursor-pointer flex items-center justify-center gap-2 transition ${formData.orientation === 'portrait' ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold' : 'border-slate-300 text-slate-500'}`}>
                                        <input type="radio" name="orientation" value="portrait" checked={formData.orientation === 'portrait'} onChange={() => setFormData({...formData, orientation: 'portrait'})} className="hidden" />
                                        <Maximize2 size={16} /> Portrait
                                    </label>
                                </div>
                             </div>
                          </div>
                       </div>

                       {/* Section 2 */}
                       <div className="md:col-span-2 border-t border-slate-100 pt-6">
                          <h3 className="text-xs uppercase tracking-wider font-bold text-indigo-600 mb-4 flex items-center gap-2">
                            <FileCheck size={14} /> Course Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Select Course</label>
                                <select 
                                  required
                                  value={formData.courseId}
                                  onChange={e => setFormData({...formData, courseId: e.target.value})}
                                  className="w-full border border-slate-300 rounded-lg p-3 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                   <option value="">-- Select Course --</option>
                                   {appData.courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                             </div>

                             <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Duration</label>
                                <select 
                                  required
                                  value={formData.durationId}
                                  onChange={e => setFormData({...formData, durationId: e.target.value})}
                                  className="w-full border border-slate-300 rounded-lg p-3 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                   <option value="">-- Select Duration --</option>
                                   {appData.durations.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                                </select>
                             </div>

                              <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Certificate Type</label>
                                <select 
                                  required
                                  value={formData.typeId}
                                  onChange={e => setFormData({...formData, typeId: e.target.value})}
                                  className="w-full border border-slate-300 rounded-lg p-3 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                   <option value="">-- Select Type --</option>
                                   {appData.types.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                </select>
                             </div>
                          </div>
                       </div>

                       {/* Section 3 */}
                       <div className="md:col-span-2 border-t border-slate-100 pt-6">
                           <h3 className="text-xs uppercase tracking-wider font-bold text-indigo-600 mb-4 flex items-center gap-2">
                            <Settings size={14} /> Timeline
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Date of Joining</label>
                                <input 
                                  type="date" 
                                  value={formData.dateOfJoining}
                                  onChange={e => setFormData({...formData, dateOfJoining: e.target.value})}
                                  className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Date of Completion</label>
                                <input 
                                  type="date" 
                                  value={formData.dateOfCompletion}
                                  onChange={e => setFormData({...formData, dateOfCompletion: e.target.value})}
                                  className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Issue Date</label>
                                <input 
                                  type="date" 
                                  value={formData.issueDate}
                                  onChange={e => setFormData({...formData, issueDate: e.target.value})}
                                  className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                             </div>
                          </div>
                       </div>

                       <div className="md:col-span-2 mt-4">
                          <button type="submit" className="w-full bg-navy-900 hover:bg-navy-800 text-gold-400 text-lg font-bold py-4 rounded-xl shadow-lg transform transition active:scale-[0.98] flex items-center justify-center gap-3">
                             <FileCheck size={24} /> Generate Certificate Preview
                          </button>
                       </div>

                    </form>
                 </div>
              </div>
            )}
            
            {view === 'settings' && currentUser && !currentUser.isAdmin && (
              <AdminDashboard 
                data={appData} 
                currentUser={currentUser}
                onUpdate={(newData) => {
                  setAppData(newData);
                }} 
                onLogout={handleLogout}
              />
            )}

            {view === 'preview' && (
              <div className="flex flex-col items-center gap-4 md:gap-8 animate-fade-in pb-10 w-full">
                 <div className="w-full flex flex-col md:flex-row justify-between items-center max-w-[1123px] no-print bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
                   <div className="text-slate-900 text-center md:text-left">
                      <h3 className="font-bold text-lg">Certificate Preview</h3>
                      <p className="text-xs text-slate-500">Review carefully before downloading.</p>
                   </div>
                   <div className="flex flex-wrap justify-center gap-3">
                      <button 
                        onClick={handleFullScreen}
                        className="flex items-center gap-2 px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition border border-indigo-200 font-bold text-sm shadow-sm"
                      >
                         <Maximize2 size={16} /> Full Screen
                      </button>
                      <button 
                        onClick={() => setView('generator')}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition border border-slate-200 font-bold text-sm"
                      >
                        <ArrowLeft size={16} /> Edit
                      </button>
                      <button 
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                        className={`flex items-center gap-2 bg-navy-900 text-gold-400 px-6 py-2 rounded-lg shadow-md hover:bg-navy-800 transition font-bold text-sm ${isDownloading ? 'opacity-70 cursor-wait' : ''}`}
                      >
                        {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        {isDownloading ? 'Processing...' : 'Download PDF'}
                      </button>
                   </div>
                 </div>
                 
                 {/* The Certificate itself with SCROLL WRAPPER for Mobile */}
                 <div id="certificate-preview-wrapper" className="print-area w-full overflow-auto h-full rounded-xl border border-slate-300 bg-slate-200 shadow-inner p-4 md:p-8 flex justify-center items-start">
                    {/* ID used for HTML2Canvas targeting */}
                    <div id="certificate-to-download" className="transform origin-top scale-[0.5] md:scale-[0.7] lg:scale-100 transition-transform">
                       <Certificate data={formData} settings={appData} previewMode={false} />
                    </div>
                 </div>
                 <div className="md:hidden text-xs text-slate-500 flex items-center gap-1">
                    <Maximize2 size={12}/> Pinch or scroll to view full certificate
                 </div>
              </div>
            )}
            {/* ... other views ... */}
          </main>
        </>
      )}
    </div>
  );
}

export default App;
