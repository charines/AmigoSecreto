import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../lib/api';

function getJoinCode() {
  const parts = window.location.pathname.split('/');
  return parts[parts.length - 1] || '';
}

export default function JoinGroup() {
  const code = getJoinCode();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [joining, setJoining] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadGroup() {
      try {
        const data = await apiGet(`/groups_get_public.php?code=${code}`);
        setGroup(data.group);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadGroup();
  }, [code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setJoining(true);
    setError('');
    try {
      await apiPost('/groups_join.php', { code, name, email });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ fontFamily: 'var(--font-nb)' }}>
      <div className="dot-pattern fixed inset-0 z-0" />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[5%] opacity-20 nb-float">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '100px', fontVariationSettings: "'FILL' 1" }}>
            group_add
          </span>
        </div>
        <div className="absolute top-[40%] right-[4%] opacity-15" style={{ animation: 'nb-float 3.5s ease-in-out infinite 1s' }}>
          <span className="material-symbols-outlined text-secondary-container" style={{ fontSize: '80px', fontVariationSettings: "'FILL' 1" }}>
            card_giftcard
          </span>
        </div>
        <div className="absolute bottom-[15%] left-[8%] opacity-15" style={{ animation: 'nb-float 4s ease-in-out infinite 2s' }}>
          <span className="material-symbols-outlined text-tertiary-container" style={{ fontSize: '72px', fontVariationSettings: "'FILL' 1" }}>
            auto_awesome
          </span>
        </div>
      </div>

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
          ENTRAR
        </span>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm space-y-6">
          {loading && (
            <div className="nb-card p-6 flex items-center justify-center gap-2 text-on-surface-variant font-semibold">
              <span className="material-symbols-outlined animate-spin">autorenew</span>
              Carregando grupo...
            </div>
          )}

          {!loading && error && !group && (
            <div className="space-y-4">
              <div className="bg-error-container border-2 border-error rounded-xl p-4">
                <p className="text-on-error-container text-sm font-bold">✖ {error}</p>
              </div>
              <a
                href="/"
                className="block text-center w-full py-3 rounded-xl border-2 border-(--color-nb-ink) bg-surface-container font-extrabold text-sm text-on-surface hover:bg-surface-container-high transition-colors nb-shadow-sm nb-press"
              >
                Voltar ao início
              </a>
            </div>
          )}

          {!loading && group && !success && (
            <>
              <div className="text-center space-y-1">
                <h2 className="text-[2.25rem] leading-tight font-black text-on-background" style={{ textShadow: '2px 2px 0px var(--color-nb-ink)' }}>
                  Você foi convidado!
                </h2>
                <p className="text-on-surface-variant font-semibold text-base">
                  Participe do grupo "{group.title}"
                </p>
                {group.description && (
                  <p className="text-on-surface-variant/70 text-sm">{group.description}</p>
                )}
              </div>

              <div className="nb-card p-6 space-y-4">
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-on-surface uppercase tracking-wider">
                      Nome
                    </label>
                    <input
                      className="nb-input w-full p-3 rounded-xl text-sm text-on-surface"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  </div>

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

                  {error && (
                    <div className="bg-error-container border-2 border-error rounded-xl p-3">
                      <p className="text-on-error-container text-sm font-bold">✖ {error}</p>
                    </div>
                  )}

                  <button
                    className="nb-btn-primary w-full py-4 rounded-xl text-base flex items-center justify-center gap-2"
                    type="submit"
                    disabled={joining}
                  >
                    {joining ? (
                      <>
                        <span className="material-symbols-outlined text-xl animate-spin">autorenew</span>
                        PROCESSANDO...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          group_add
                        </span>
                        ENTRAR NO GRUPO
                      </>
                    )}
                  </button>
                </form>
              </div>
            </>
          )}

          {success && (
            <div className="nb-card p-8 space-y-4 text-center">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '64px', fontVariationSettings: "'FILL' 1" }}>
                celebration
              </span>
              <h2 className="text-2xl font-black text-on-background">Inscrição enviada!</h2>
              <p className="text-on-surface-variant font-semibold text-sm">
                Aguarde o convite de confirmação no seu e-mail:
              </p>
              <p className="text-on-surface font-bold text-sm">{email}</p>
            </div>
          )}

          <p className="text-center text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-widest">
            4 8 15 16 23 42
          </p>
        </div>
      </main>
    </div>
  );
}
