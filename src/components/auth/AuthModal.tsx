import React, { useState } from 'react';
import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  doc,
  setDoc,
  getDoc
} from '../../lib/firebase';
import { UserProfile } from '../../types';
import { ShieldCheck, User as UserIcon, Lock, Mail, AlertCircle, X, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
  initialRole?: 'student' | 'teacher';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'student',
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'student' | 'teacher'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [teacherSecretKey, setTeacherSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Sign in
        const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
        const userDocRef = doc(db, 'users', userCred.user.uid);
        const userDocSnap = await getDoc(userDocRef);

        let profile: UserProfile;
        if (userDocSnap.exists()) {
          profile = userDocSnap.data() as UserProfile;
        } else {
          // Fallback profile if record not found
          profile = {
            uid: userCred.user.uid,
            name: userCred.user.displayName || email.split('@')[0],
            email: userCred.user.email || '',
            role: 'student', // Default safe fallback
            createdAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, profile);
        }

        onSuccess(profile);
        onClose();
      } else {
        // Sign up
        if (!name.trim()) {
          throw new Error('Please enter your full name');
        }

        // STRICT MANDATORY ROLE CHECK:
        // A newly registered account MUST default to "student".
        // Teacher/admin role can only be assigned through authorized verification.
        let assignedRole: 'student' | 'teacher' = 'student';

        if (role === 'teacher') {
          // Call secure server verification endpoint
          const verifyRes = await fetch('/api/auth/verify-teacher', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim(),
              secretKey: teacherSecretKey.trim(),
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok || !verifyData.authorized) {
            throw new Error(verifyData.error || 'Invalid teacher authorization credentials.');
          }
          assignedRole = 'teacher';
        }

        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const newProfile: UserProfile = {
          uid: userCred.user.uid,
          name: name.trim(),
          email: email.trim(),
          role: assignedRole,
          mobile: mobile.trim(),
          createdAt: new Date().toISOString(),
        };

        // Write user profile to Firestore
        await setDoc(doc(db, 'users', userCred.user.uid), newProfile);

        if (assignedRole === 'teacher') {
          // Record in teacher directory
          await setDoc(doc(db, 'teachers', userCred.user.uid), {
            uid: userCred.user.uid,
            name: name.trim(),
            email: email.trim(),
            verifiedAt: new Date().toISOString(),
          });
        }

        setSuccessMsg('Account created successfully!');
        onSuccess(newProfile);
        setTimeout(() => onClose(), 600);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Authentication failed';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        msg = 'Invalid email or password.';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'This email is already registered. Please login.';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'Password should be at least 6 characters.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md p-6 overflow-hidden rounded-2xl bg-[#0f172a] border border-slate-700 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            {role === 'teacher' ? <ShieldCheck className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white">
              {isLogin ? 'Login to Portal' : 'Create New Account'}
            </h3>
            <p className="text-xs text-slate-400">
              शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव
            </p>
          </div>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 mb-5 bg-slate-900/80 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
              role === 'student'
                ? 'bg-cyan-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            👨‍🎓 Student Portal
          </button>
          <button
            type="button"
            onClick={() => setRole('teacher')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
              role === 'teacher'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            👩‍🏫 Teacher Portal
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 text-xs text-rose-300 bg-rose-950/50 border border-rose-800/60 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 mb-4 text-xs text-emerald-300 bg-emerald-950/50 border border-emerald-800/60 rounded-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block mb-1 text-xs font-medium text-slate-300">
                Full Name (पूरा नाम) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 text-white"
              />
            </div>
          )}

          <div>
            <label className="block mb-1 text-xs font-medium text-slate-300">
              Email Address (ईमेल) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-xs font-medium text-slate-300">
              Password (पासवर्ड) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 text-white"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block mb-1 text-xs font-medium text-slate-300">
                Mobile Number (मोबाइल नंबर)
              </label>
              <input
                type="tel"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 text-white"
              />
            </div>
          )}

          {/* Teacher Authorization Guard: Only visible when signing up as Teacher */}
          {!isLogin && role === 'teacher' && (
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60">
              <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold text-purple-300">
                <ShieldCheck className="w-4 h-4" />
                Teacher Verification Key (शिक्षक सत्यापन कोड) <span className="text-rose-400">*</span>
              </div>
              <p className="text-[11px] text-purple-400/80 mb-2">
                Restricted to verified faculty. Enter the key issued by Principal Anil Barole.
              </p>
              <input
                type="password"
                required
                value={teacherSecretKey}
                onChange={(e) => setTeacherSecretKey(e.target.value)}
                placeholder="Enter teacher authorization key"
                className="w-full px-3 py-2 text-sm bg-purple-900/40 border border-purple-700 rounded-lg text-white focus:outline-none focus:border-purple-400"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 px-4 font-semibold text-sm rounded-xl transition duration-200 shadow-lg text-white ${
              role === 'teacher'
                ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/30'
                : 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-900/30'
            } disabled:opacity-50`}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-400">
          {isLogin ? "Don't have an account yet?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="font-semibold text-cyan-400 hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
};
