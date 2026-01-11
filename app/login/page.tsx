'use client';

import './login.css';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) return setErr(error.message);
    router.push('/dashboard');
  };

  return (
    <div className="login-page">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
      <div className="login-container">
        <div className="login-title">
          <i className="fas fa-building" />
          <h1>منظِم</h1>
        </div>
        <p className="login-sub">نظام إدارة الأملاك والعقود الإلكتروني</p>

        <form className="login-form" onSubmit={login}>
          <label>
            <i className="fas fa-envelope" style={{ color: 'var(--primary-color)' }} />
            البريد الإلكتروني
          </label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />

          <label>
            <i className="fas fa-lock" style={{ color: 'var(--primary-color)' }} />
            كلمة المرور
          </label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />

          {err && <div className="err">{err}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}