import { useState, useEffect } from 'react';
import { apiPost } from '../lib/api';
import { API_BASE_URL } from '../lib/api';
import ForgotPassword from './ForgotPassword';

export default function AdminAuth({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Health check — 'checking' | 'all_good' | 'server_only' | 'offline'
  const [health, setHealth] = useState('checking');

  useEffect(() => {
    if (!API_BASE_URL) { setHealth('offline'); return; }
    const controller = new AbortController();
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ping.php`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setHealth(data.db ? 'all_good' : 'server_only');
      } catch {
        setHealth('offline');
      }
    };
    checkHealth();
    return () => controller.abort();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = mode === 'register'
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };
      const data = await apiPost(mode === 'register' ? '/admin_register.php' : '/admin_login.php', payload);
      onAuth(data.admin);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden"
      style={{ fontFamily: 'var(--font-nb)' }}
    >
      {/* Fundo com padrão de estrelinhas */}
      <div className="star-pattern fixed inset-0 z-0" />

      {/* Decorações flutuantes */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[5%] opacity-20 nb-float">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontSize: '100px', fontVariationSettings: "'FILL' 1" }}
          >
            redeem
          </span>
        </div>
        <div
          className="absolute top-[40%] right-[4%] opacity-15"
          style={{ animation: 'nb-float 3.5s ease-in-out infinite 1s' }}
        >
          <span
            className="material-symbols-outlined text-secondary-container"
            style={{ fontSize: '80px', fontVariationSettings: "'FILL' 1" }}
          >
            card_giftcard
          </span>
        </div>
        <div
          className="absolute bottom-[15%] left-[8%] opacity-15"
          style={{ animation: 'nb-float 4s ease-in-out infinite 2s' }}
        >
          <span
            className="material-symbols-outlined text-tertiary-container"
            style={{ fontSize: '72px', fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="nb-header relative z-10">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-primary text-3xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            redeem
          </span>
          <h1 className="text-[1.75rem] leading-tight font-black text-primary italic">
            AmigoSecreto
          </h1>
        </div>
        <span className="text-xs font-bold text-on-surface-variant border-2 border-(--color-nb-ink) px-3 py-1 rounded-full nb-shadow-sm bg-white">
          ADMIN
        </span>
      </header>

      {/* Conteúdo centralizado */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm space-y-6">

          {/* Modo forgot password — delega para componente dedicado */}
          {mode === 'forgot' && (
            <div className="nb-card p-6">
              <ForgotPassword onBack={() => { setMode('login'); setError(''); }} />
            </div>
          )}

          {/* Formulário de login / registro */}
          {mode !== 'forgot' && <>

          {/* Título */}
          <div className="text-center space-y-1">
            <h2
              className="text-[2.25rem] leading-tight font-black text-on-background"
              style={{ textShadow: '2px 2px 0px var(--color-nb-ink)' }}
            >
              {mode === 'login' ? 'Bem-vindo!' : 'Criar Conta'}
            </h2>
            <p className="text-on-surface-variant font-semibold text-base">
              {mode === 'login'
                ? 'Entre para gerenciar seu amigo secreto.'
                : 'Cadastre-se para criar seu primeiro grupo.'}
            </p>
          </div>

          {/* Card do formulário */}
          <div className="nb-card p-6 space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-on-surface uppercase tracking-wider">
                    Nome
                  </label>
                  <input
                    className="nb-input w-full p-3 rounded-xl text-sm text-on-surface"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-on-surface uppercase tracking-wider">
                  E-mail
                </label>
                <input
                  className="nb-input w-full p-3 rounded-xl text-sm text-on-surface"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-on-surface uppercase tracking-wider">
                  Senha
                </label>
                <input
                  className="nb-input w-full p-3 rounded-xl text-sm text-on-surface"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>

              {error && (
                <div className="bg-error-container border-2 border-error rounded-xl p-3">
                  <p className="text-on-error-container text-sm font-bold">✖ {error}</p>
                </div>
              )}

              <button
                className="nb-btn-primary w-full py-4 rounded-xl text-base flex items-center justify-center gap-2"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-xl animate-spin">autorenew</span>
                    PROCESSANDO...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {mode === 'login' ? 'login' : 'person_add'}
                    </span>
                    {mode === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}
                  </>
                )}
              </button>
            </form>

            <div className="border-t-2 border-outline-variant pt-4 space-y-3">
              <button
                type="button"
                className="w-full py-3 rounded-xl border-2 border-(--color-nb-ink) bg-surface-container font-extrabold text-sm text-on-surface hover:bg-surface-container-high transition-colors nb-shadow-sm nb-press"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              >
                {mode === 'login' ? 'Criar nova conta' : 'Já tenho uma conta'}
              </button>

              {mode === 'login' && (
                <button
                  type="button"
                  className="w-full text-sm font-extrabold text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-1"
                  onClick={() => { setMode('forgot'); setError(''); }}
                >
                  <span className="material-symbols-outlined text-base">lock_reset</span>
                  Esqueci minha senha
                </button>
              )}
            </div>
          </div>

          </>}

          {/* Indicador de saúde da conexão */}
          <div className="flex items-center justify-center gap-2 py-2">
            {health === 'checking' && (
              <>
                <span className="inline-block w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-secondary-container)' }} />
                <span className="text-xs font-bold text-on-surface-variant/60">Conectando ao servidor...</span>
              </>
            )}
            {health === 'all_good' && (
              <>
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#16a34a' }} />
                <span className="text-xs font-bold text-on-surface-variant/60">Tudo pronto!</span>
              </>
            )}
            {health === 'server_only' && (
              <>
                <span className="inline-block w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-secondary-container)' }} />
                <span className="text-xs font-bold text-on-surface-variant/60">Servidor acordando, aguarde um momento...</span>
              </>
            )}
            {health === 'offline' && (
              <>
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--color-error)' }} />
                <span className="text-xs font-bold text-on-surface-variant/60">Servidor indisponível no momento</span>
              </>
            )}
          </div>

          {/* Rodapé */}
          <p className="text-center text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-widest">
            4 8 15 16 23 42
          </p>
        </div>
      </main>
    </div>
  );
}
