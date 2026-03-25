import { useEffect, useMemo, useState } from 'react';
import TerminalPanel from './components/TerminalPanel';
import AdminAuth from './components/AdminAuth';
import AdminDashboard from './components/AdminDashboard';
import InvitePage from './components/InvitePage';
import RevealPage from './components/RevealPage';
import JoinGroup from './components/JoinGroup';
import ChatAnonimo from './components/ChatAnonimo';
import { apiGet, apiPost, API_BASE_URL } from './lib/api';

function resolveRoute() {
  const path = window.location.pathname;
  if (path.startsWith('/invite')) return 'invite';
  if (path.startsWith('/reveal')) return 'reveal';
  if (path.startsWith('/join')) return 'join';
  if (path.startsWith('/chat')) return 'chat';
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
    return (
      <TerminalPanel step="auth">
        <p className="text-crt-red text-[10px] tracking-wider uppercase">
          ✖ API nao configurada (VITE_API_BASE_URL).
        </p>
      </TerminalPanel>
    );
  }

  if (route === 'invite') {
    return (
      <TerminalPanel step="invite" showSteps={false}>
        {token ? (
          <InvitePage token={token} />
        ) : (
          <p className="text-crt-red text-[10px] tracking-wider uppercase">
            ✖ Token de convite ausente.
          </p>
        )}
      </TerminalPanel>
    );
  }

  if (route === 'reveal') {
    return (
      <TerminalPanel step="reveal" showSteps={false}>
        {token ? (
          <RevealPage token={token} />
        ) : (
          <p className="text-crt-red text-[10px] tracking-wider uppercase">
            ✖ Token de revelacao ausente.
          </p>
        )}
      </TerminalPanel>
    );
  }
  if (route === 'join') {
    return <JoinGroup />;
  }

  if (route === 'chat') {
    return token ? (
      <ChatAnonimo token={token} />
    ) : (
      <TerminalPanel step="chat" showSteps={false}>
        <p className="text-crt-red text-[10px] tracking-wider uppercase">
          ✖ Token de chat ausente.
        </p>
      </TerminalPanel>
    );
  }

  if (checking) {
    return (
      <TerminalPanel step="auth">
        <p className="text-[10px] opacity-60">Carregando sessao...</p>
      </TerminalPanel>
    );
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

  return (
    <TerminalPanel step={admin ? 'dashboard' : 'auth'}>
      {!admin && <AdminAuth onAuth={setAdmin} />}
      {admin && (
        <AdminDashboard
          admin={admin}
          onLogout={handleLogout}
        />
      )}
    </TerminalPanel>
  );
}
