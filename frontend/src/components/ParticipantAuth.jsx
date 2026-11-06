import { useState } from 'react';
import { apiPost } from '../lib/api';

export default function ParticipantAuth({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiPost('/api/participant?action=login', { email: email.trim(), password });
      onAuth(data.participant);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ fontFamily: 'var(--font-nb)' }}>
      <div className="star-pattern fixed inset-0 z-0" />

      <header className="nb-header relative z-10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            redeem
          </span>
          <h1 className="text-[1.75rem] leading-tight font-black text-primary italic">
            AmigoSecreto
          </h1>
        </div>
        <span className="text-xs font-bold text-on-surface-variant border-2 border-(--color-nb-ink) px-3 py-1 rounded-full nb-shadow-sm bg-white">
          MEUS GRUPOS
        </span>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-[2.25rem] leading-tight font-black text-on-background" style={{ textShadow: '2px 2px 0px var(--color-nb-ink)' }}>
              Entrar
            </h2>
            <p className="text-on-surface-variant font-semibold text-base">
              Acompanhe os grupos em que você participa.
            </p>
          </div>

          <div className="nb-card p-6 space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
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
                  autoComplete="current-password"
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
                    ENTRANDO...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      login
                    </span>
                    ENTRAR
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-on-surface-variant font-semibold text-center">
              A senha é criada a partir do link de convite que você recebeu por e-mail.
            </p>
          </div>

          <p className="text-center text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-widest">
            4 8 15 16 23 42
          </p>
        </div>
      </main>
    </div>
  );
}
