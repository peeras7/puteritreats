import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail 
} from "firebase/auth";
import { auth } from '../firebase';
import { Cookie, Lock, Mail, User, ArrowRight, Loader, ArrowLeft } from 'lucide-react';

export default function Login() {
  // view state: 'signin' | 'signup' | 'forgot'
  const [view, setView] = useState('signin'); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Switch between views and clear errors
  const switchView = (newView) => {
    setView(newView);
    setError('');
    setSuccessMsg('');
    setPassword(''); // Clear password for security
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (view === 'signup') {
        // 1. Create User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (fullName) {
          await updateProfile(userCredential.user, { displayName: fullName });
        }
      } else if (view === 'signin') {
        // 2. Sign In
        await signInWithEmailAndPassword(auth, email, password);
      } else if (view === 'forgot') {
        // 3. Reset Password
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg("Reset link sent! Please check your email inbox.");
      }
    } catch (err) {
      // Clean up Firebase error messages
      const msg = err.message
        .replace('Firebase: ', '')
        .replace('auth/', '')
        .replace(/-/g, ' ')
        .replace(/\(.*\)/, '')
        .trim();
      setError(msg.charAt(0).toUpperCase() + msg.slice(1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] p-4 text-slate-800 font-sans">
      <div className="bg-white w-full max-w-[420px] p-8 md:p-10 rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden">
        
        {/* Background Decorative Blobs */}
        <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-32 h-32 bg-yellow-50 rounded-full blur-3xl opacity-60"></div>

        {/* --- ILLUSTRATION AREA --- */}
        <div className="flex justify-center mb-6 relative z-10">
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-50 to-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/10 border border-white">
           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md transform -rotate-6 overflow-hidden border-2 border-slate-100">
  <img src="/logo.png" alt="Pu3's Treats Logo" className="w-full h-full object-contain p-1" />
</div>
          </div>
        </div>

        {/* --- HEADER TEXT --- */}
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {view === 'signup' && 'Get Started'}
            {view === 'signin' && 'Welcome Back'}
            {view === 'forgot' && 'Forgot Password?'}
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium px-4 leading-relaxed">
            {view === 'signup' && 'Create your account to continue'}
            {view === 'signin' && 'Enter your details to access the POS'}
            {view === 'forgot' && "Don't worry! Enter your email and we'll send you a reset link."}
          </p>
        </div>

        {/* --- FORM --- */}
        <form onSubmit={handleAuth} className="space-y-5 relative z-10">
          
          {/* Full Name (Only for Sign Up) */}
          {view === 'signup' && (
            <div className="group animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center bg-slate-50 rounded-2xl px-5 py-4 border border-slate-100 focus-within:border-blue-500/30 focus-within:bg-white focus-within:shadow-[0_4px_20px_-2px_rgba(26,115,232,0.1)] transition-all duration-300">
                <User size={20} className="text-slate-400 mr-3 group-focus-within:text-[#1a73e8] transition-colors" />
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  className="bg-transparent w-full outline-none text-slate-700 font-bold placeholder-slate-400 text-sm"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={view === 'signup'}
                />
              </div>
            </div>
          )}

          {/* Email (Always Visible) */}
          <div className="group">
            <div className="flex items-center bg-slate-50 rounded-2xl px-5 py-4 border border-slate-100 focus-within:border-blue-500/30 focus-within:bg-white focus-within:shadow-[0_4px_20px_-2px_rgba(26,115,232,0.1)] transition-all duration-300">
              <Mail size={20} className="text-slate-400 mr-3 group-focus-within:text-[#1a73e8] transition-colors" />
              <input 
                type="email" 
                required 
                placeholder="Email Address" 
                className="bg-transparent w-full outline-none text-slate-700 font-bold placeholder-slate-400 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password (Hidden in Forgot Password view) */}
          {view !== 'forgot' && (
            <div className="group animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center bg-slate-50 rounded-2xl px-5 py-4 border border-slate-100 focus-within:border-blue-500/30 focus-within:bg-white focus-within:shadow-[0_4px_20px_-2px_rgba(26,115,232,0.1)] transition-all duration-300">
                <Lock size={20} className="text-slate-400 mr-3 group-focus-within:text-[#1a73e8] transition-colors" />
                <input 
                  type="password" 
                  required={view !== 'forgot'}
                  placeholder="Password" 
                  className="bg-transparent w-full outline-none text-slate-700 font-bold placeholder-slate-400 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Forgot Password Link */}
          {view === 'signin' && (
            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={() => switchView('forgot')}
                className="text-xs font-bold text-slate-400 hover:text-[#1a73e8] transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl text-center border border-red-100 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-green-50 text-green-600 text-xs font-bold rounded-xl text-center border border-green-100 animate-in fade-in slide-in-from-top-2">
              {successMsg}
            </div>
          )}

          {/* Main Action Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#1a73e8] hover:bg-blue-600 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader className="animate-spin" size={20} /> : (
              view === 'signup' ? 'Create Account' : 
              view === 'forgot' ? 'Send Reset Link' : 'Sign In'
            )}
            {!loading && view !== 'forgot' && <ArrowRight size={20} />}
          </button>
        </form>

        {/* --- FOOTER NAVIGATION --- */}
        <div className="mt-8 text-center relative z-10">
          {view === 'forgot' ? (
            <button 
              onClick={() => switchView('signin')}
              className="flex items-center justify-center mx-auto text-sm font-bold text-slate-400 hover:text-[#1a73e8] transition-colors gap-2"
            >
              <ArrowLeft size={16} /> Back to Sign In
            </button>
          ) : (
            <p className="text-sm font-medium text-slate-400">
              {view === 'signup' ? 'Already have an account?' : "Don't have an account?"}
              <button 
                onClick={() => switchView(view === 'signup' ? 'signin' : 'signup')}
                className="ml-1 text-[#1a73e8] font-bold hover:underline"
              >
                {view === 'signup' ? 'Sign In' : 'Sign up'}
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}