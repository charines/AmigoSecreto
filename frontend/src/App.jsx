import { useEffect, useMemo, useState } from 'react';
import AdminAuth from './components/AdminAuth';
import AdminDashboard from './components/AdminDashboard';
import InvitePage from './components/InvitePage';
import RevealPage from './components/RevealPage';
import JoinGroup from './components/JoinGroup';
import ChatAnonimo from './components/ChatAnonimo';
import ResetPassword from './components/ResetPassword';
import { apiGet, apiPost, API_BASE_URL } from './lib/api';

function StatusScreen({ icon, spinning, message, isError }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ fontFamily: 'var(--font-nb)' }}>
      <div
        className={`nb-card p-6 max-w-sm w-full flex items-center gap-3 ${
          isError ? 'bg-error-container' : ''
        }`}
      >
        <span
          className={`material-symbols-outlined text-2xl ${spinning ? 'animate-spin' : ''} ${
            isError ? 'text-on-error-container' : 'text-primary'
          }`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
        <p className={`text-sm font-bold ${isError ? 'text-on-error-container' : 'text-on-surface'}`}>
          {message}
        </p>
      </div>
    </div>
  );
}

function resolveRoute() {
  const path = window.location.pathname;
  if (path.startsWith('/invite'))        return 'invite';
  if (path.startsWith('/reveal'))        return 'reveal';
  if (path.startsWith('/join'))          return 'join';
  if (path.startsWith('/chat'))          return 'chat';
  if (path.startsWith('/reset-password')) return 'reset-password';
  return 'admin';
}

function getTokenParam() {
  const params = new URLSearchParams(window.location.search);
  return params.get('token') || '';
}

export default function App() {
  const [route, setRoute] = useState(resolveRoute());
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);

  const token = useMemo(() => getTokenParam(), [route]);

  useEffect(() => {
    const onPop = () => setRoute(resolveRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (route !== 'admin') return;
    const check = async () => {
      setChecking(true);
      try {
        const data = await apiGet('/admin_me.php');
        setAdmin(data.admin);
      } catch {
        setAdmin(null);
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [route]);

  if (!API_BASE_URL) {
    return <StatusScreen icon="error" message="API não configurada (VITE_API_BASE_URL)." isError />;
  }

  if (route === 'invite') {
    return token ? (
      <InvitePage token={token} />
    ) : (
      <StatusScreen icon="error" message="Token de convite ausente." isError />
    );
  }

  if (route === 'reveal') {
    return token ? (
      <RevealPage token={token} />
    ) : (
      <StatusScreen icon="error" message="Token de revelação ausente." isError />
    );
  }
  if (route === 'join') {
    return <JoinGroup />;
  }

  if (route === 'reset-password') {
    const resetToken = new URLSearchParams(window.location.search).get('token') || '';
    return <ResetPassword token={resetToken} />;
  }

  if (route === 'chat') {
    return token ? (
      <ChatAnonimo token={token} />
    ) : (
      <StatusScreen icon="error" message="Token de chat ausente." isError />
    );
  }

  if (checking) {
    return <StatusScreen icon="autorenew" spinning message="Carregando sessão..." />;
  }

  const handleLogout = async () => {
    try {
      await apiPost('/admin_logout.php', {});
    } catch {
      // ignore
    } finally {
      setAdmin(null);
    }
  };

  if (admin) {
    return <AdminDashboard admin={admin} onLogout={handleLogout} />;
  }

  return <AdminAuth onAuth={setAdmin} />;
}
