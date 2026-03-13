import { Link, Navigate, Route, Routes, useEffect, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { api } from './api';

const AuthLayout = ({ title, children, subtitle }) => (
  <div className="page">
    <div className="card animate">
      <h1>{title}</h1>
      {subtitle && <p className="subtitle">{subtitle}</p>}
      {children}
    </div>
  </div>
);

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError('Please enter a valid email.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const { data } = await api.post('/auth/signup', form);
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Sign up and verify your email with OTP">
      <form onSubmit={submit} className="form">
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <input placeholder="Confirm Password" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
        <button type="submit">Signup</button>
      </form>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
      <div className="links">
        <Link to="/verify">Verify OTP</Link>
        <Link to="/login">Login</Link>
      </div>
    </AuthLayout>
  );
};

const VerifyOtp = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      setQrCode(data.qrCodeDataUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    }
  };

  return (
    <AuthLayout title="Verify Email OTP" subtitle="Enter 6-digit code sent to email">
      <form onSubmit={submit} className="form">
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} minLength={6} />
        <button type="submit">Verify OTP</button>
      </form>
      {error && <p className="error">{error}</p>}
      {qrCode && (
        <div className="qr-box">
          <p>Email verified! Scan QR for QR Login.</p>
          <img src={qrCode} alt="QR login" />
        </div>
      )}
      <div className="links"><Link to="/login">Back to Login</Link></div>
    </AuthLayout>
  );
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Invalid email format');
      return;
    }

    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Secure login with verified email only">
      <form onSubmit={submit} className="form">
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
      </form>
      {error && <p className="error">{error}</p>}
      <div className="links">
        <Link to="/signup">Create account</Link>
        <Link to="/verify">Verify OTP</Link>
      </div>
    </AuthLayout>
  );
};

const QrLogin = () => {
  const { token } = useParams();
  const [state, setState] = useState('loading');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.post(`/auth/qr-login/${token}`);
        localStorage.setItem('token', data.token);
        setState('success');
        setTimeout(() => navigate('/dashboard'), 1000);
      } catch (_error) {
        setState('error');
      }
    })();
  }, []);

  return (
    <AuthLayout title="QR Login">
      {state === 'loading' && <p>Logging in via QR...</p>}
      {state === 'success' && <p className="success">QR login successful! Redirecting...</p>}
      {state === 'error' && <p className="error">Invalid/expired QR login token.</p>}
    </AuthLayout>
  );
};

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const { data } = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        setProfile(data);
      } catch (_error) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    })();
  }, []);

  return (
    <AuthLayout title="Dashboard" subtitle="JWT authenticated route">
      {profile ? <p>Hello, {profile.name} ({profile.email})</p> : <p>Loading profile...</p>}
      <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>Logout</button>
    </AuthLayout>
  );
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify" element={<VerifyOtp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/qr-login/:token" element={<QrLogin />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}
