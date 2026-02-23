import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../components/UI';
import { useData } from '../context/DataContext';
import { Wrench } from 'lucide-react';

const DEV_PROFILES = [
  {
    label: 'Free User',
    icon: '🆓',
    desc: 'Starter plan, owner role',
    settings: { planTier: 'free', userRole: 'owner' },
  },
  {
    label: 'Pro User',
    icon: '⚡',
    desc: 'Pro — Signer Portal + AI Trainer',
    settings: { planTier: 'pro', userRole: 'owner' },
  },
  {
    label: 'Agency User',
    icon: '🏢',
    desc: 'Agency — all features unlocked',
    settings: { planTier: 'agency', userRole: 'owner' },
  },
  {
    label: 'Admin Role',
    icon: '🔐',
    desc: 'Agency plan + admin role',
    settings: { planTier: 'agency', userRole: 'admin' },
  },
];

const Auth = () => {
  const navigate = useNavigate();
  const { updateSettings } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  const signInAs = (profile) => {
    updateSettings(profile.settings);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-start justify-center p-4 pt-12">
      <div className="w-full max-w-md space-y-4">

        {/* DEV BYPASS */}
        <Card className="border-2 border-dashed border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Dev Testing — Sign in as
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEV_PROFILES.map((profile) => (
                <button
                  key={profile.label}
                  onClick={() => signInAs(profile)}
                  className="flex flex-col items-start gap-1 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-slate-800 p-3 text-left hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-slate-700 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{profile.icon}</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{profile.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{profile.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* STANDARD LOGIN */}
        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">N</div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Sign in to your NotaryOS account</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-800 dark:text-white"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-800 dark:text-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">Sign In</Button>
            </form>
            <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/" className="text-blue-600 hover:underline">Sign up</Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Auth;
