import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';

export default function InvitePage({ token }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const load = async () => {
      setError('');
      setLoading(true);
      try {
        const res = await apiGet(`/invite.php?token=${encodeURIComponent(token)}`);
        setData(res);
        setConfirmed(res?.participant?.status === 'confirmed');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleConfirm = async () => {
    setConfirming(true);
    setError('');
    try {
      await apiPost('/invite_confirm.php', { token });
      setConfirmed(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ fontFamily: 'var(--font-nb)' }}>
      <div className="star-pattern fixed inset-0 z-0" />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[5%] opacity-20 nb-float">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '100px', fontVariationSettings: "'FILL' 1" }}>
            mail
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
          CONVITE
        </span>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm space-y-6">
          {loading && (
            <div className="nb-card p-6 flex items-center justify-center gap-2 text-on-surface-variant font-semibold">
              <span className="material-symbols-outlined animate-spin">autorenew</span>
              Carregando convite...
            </div>
          )}

          {!loading && error && (
            <div className="bg-error-container border-2 border-error rounded-xl p-4">
              <p className="text-on-error-container text-sm font-bold">✖ {error}</p>
            </div>
          )}

          {!loading && !error && data && (
            <>
              <div className="text-center space-y-1">
                <h2 className="text-[2.25rem] leading-tight font-black text-on-background" style={{ textShadow: '2px 2px 0px var(--color-nb-ink)' }}>
                  Você foi convidado!
                </h2>
                <p className="text-on-surface-variant font-semibold text-base">
                  Grupo: {data.group.title}
                </p>
                {data.group.description && (
                  <p className="text-on-surface-variant/70 text-sm">{data.group.description}</p>
                )}
              </div>

              <div className="nb-card p-6 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-on-surface uppercase tracking-wider">
                    Participante
                  </label>
                  <p className="text-sm font-bold text-on-surface">{data.participant.name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-on-surface uppercase tracking-wider">
                    E-mail
                  </label>
                  <p className="text-sm font-bold text-on-surface">{data.participant.email}</p>
                </div>

                {confirmed ? (
                  <div className="bg-secondary-container border-2 border-(--color-nb-ink) rounded-xl p-4 flex items-center gap-2 mt-2">
                    <span className="material-symbols-outlined text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                    <p className="text-on-secondary-container text-sm font-bold">
                      Participação confirmada. Aguarde o sorteio.
                    </p>
                  </div>
                ) : (
                  <button
                    className="nb-btn-primary w-full py-4 rounded-xl text-base flex items-center justify-center gap-2 mt-2"
                    onClick={handleConfirm}
                    disabled={confirming}
                  >
                    {confirming ? (
                      <>
                        <span className="material-symbols-outlined text-xl animate-spin">autorenew</span>
                        CONFIRMANDO...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          how_to_reg
                        </span>
                        CONFIRMAR PARTICIPAÇÃO
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}

          <p className="text-center text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-widest">
            4 8 15 16 23 42
          </p>
        </div>
      </main>
    </div>
  );
}
