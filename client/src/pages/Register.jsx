import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, User, UserPlus, AlertCircle, Sun, Moon } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const res = await register(name, email, password);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen w-screen bg-slate-50 dark:bg-dark-deep overflow-hidden transition-colors duration-300">
      {/* Theme toggle on top right */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-lg border transition-all duration-200 bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-dark-card dark:border-white/5 dark:text-slate-300 dark:hover:bg-white/5"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Floating backgrounds */}
      <div className="absolute w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -top-40 -left-40 dark:bg-indigo-500/5" />
      <div className="absolute w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] -bottom-40 -right-40 dark:bg-purple-500/5" />

      <div className="glass-card animate-slide-up w-full max-w-[420px] z-2 p-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-gradient-accent mb-2">CRM Pro</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create an account to get started</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200/60 rounded-xl p-3.5 mb-6 text-sm text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
            <AlertCircle size={18} className="shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider dark:text-slate-500">Full Name</label>
            <div className="relative flex items-center">
              <User size={18} className="absolute left-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input pl-11"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider dark:text-slate-500">Email Address</label>
            <div className="relative flex items-center">
              <Mail size={18} className="absolute left-4 text-slate-400 dark:text-slate-500" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input pl-11"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider dark:text-slate-500">Password</label>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-4 text-slate-400 dark:text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input pl-11"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-indigo-500/20 hover:brightness-110 hover:shadow-indigo-500/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span>Creating...</span>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-slate-400 dark:text-slate-500">
          <span>Already have an account? </span>
          <Link to="/login" className="text-indigo-500 font-bold hover:underline dark:text-indigo-400">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
