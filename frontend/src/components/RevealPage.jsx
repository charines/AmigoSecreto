import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';
import { decryptName } from '../lib/crypto';
import RevealStep from './RevealStep';

export default function RevealPage({ token }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [code, setCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || '';
  });
  const [revealed, setRevealed] = useState(null);
  const [error, setError] = useState('');
  const [decrypting, setDecrypting] = useState(false);
  const [autoRevealed, setAutoRevealed] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiGet(`/reveal.php?token=${encodeURIComponent(token)}`);
        setData(res);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleReveal = async (e) => {
    if (e) e.preventDefault();
    if (!data) return;
    const cleaned = code.trim();
    if (!cleaned) {
      setError('Informe o codigo recebido por email.');
      return;
    }

    setDecrypting(true);
    setError('');
    try {
      const name = await decryptName(data.payload.encrypted, data.payload.iv_b64, cleaned);
      setRevealed({ from: data.giver.name, to: name });
      await apiPost('/reveal_confirm.php', { token });
    } catch (err) {
      setError('Codigo invalido ou expirado.');
    } finally {
      setDecrypting(false);
    }
  };

  useEffect(() => {
    if (data && code && !revealed && !decrypting && !autoRevealed && !error) {
      setAutoRevealed(true);
      handleReveal();
    }
  }, [data, code, revealed, decrypting, autoRevealed, error]);

  /* ── Header compartilhado ── */
  const header = (
    <header className="nb-header">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-3xl">redeem</span>
        <h1 className="text-[1.75rem] leading-tight font-black text-primary italic" style={{ fontFamily: 'var(--font-nb)' }}>
          AmigoSecreto
        </h1>
      </div>
      <div className="w-10 h-10 rounded-full border-2 border-[var(--color-nb-ink)] overflow-hidden nb-shadow-sm bg-surface-container-highest flex items-center justify-center">
        <span className="material-symbols-outlined text-on-surface-variant">person</span>
      </div>
    </header>
  );

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-nb-bg)', fontFamily: 'var(--font-nb)' }}>
        {header}
        <main className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <p className="text-on-surface-variant font-bold animate-pulse">Carregando resultado...</p>
        </main>
      </div>
    );
  }

  /* ── Erro sem dados ── */
  if (error && !data) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-nb-bg)', fontFamily: 'var(--font-nb)' }}>
        {header}
        <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-5">
          <div className="nb-card p-6 max-w-md w-full text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-error">error</span>
            <p className="text-error font-black text-lg">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  /* ── Sucesso: delegar para RevealStep ── */
  if (revealed) {
    return <RevealStep revealedFriend={revealed} token={token} />;
  }

  /* ── Formulário de revelação ── */
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--color-nb-bg)', fontFamily: 'var(--font-nb)' }}>
      {/* Balões decorativos */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-10 left-[5%] animate-bounce opacity-30">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '80px', fontVariationSettings: "'FILL' 1" }}>redeem</span>
        </div>
        <div className="absolute top-40 right-[8%] opacity-20" style={{ animation: 'nb-float 3s ease-in-out infinite 0.5s' }}>
          <span className="material-symbols-outlined text-secondary-container" style={{ fontSize: '80px', fontVariationSettings: "'FILL' 1" }}>card_giftcard</span>
        </div>
        <div className="absolute bottom-24 left-[12%] opacity-20" style={{ animation: 'nb-float 3.5s ease-in-out infinite 1s' }}>
          <span className="material-symbols-outlined text-tertiary-container" style={{ fontSize: '64px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        </div>
      </div>

      {header}

      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-5 py-10 pb-28">
        <div className="w-full max-w-[520px] flex flex-col items-center space-y-8">

          <div className="text-center space-y-2">
            <h2
              className="text-[2.5rem] leading-tight font-black text-primary"
              style={{ textShadow: '2px 2px 0px var(--color-nb-ink)' }}
            >
              Quem você tirou?
            </h2>
            <p className="text-on-surface-variant font-bold text-lg">A curiosidade acaba agora!</p>
          </div>

          {/* Ícone de presente animado */}
          <div className="relative py-6 cursor-pointer group">
            <div className="relative z-10 w-48 h-48 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-primary"
                style={{
                  fontSize: '160px',
                  fontVariationSettings: "'FILL' 1",
                  animation: 'nb-float 2.5s ease-in-out infinite',
                  filter: 'drop-shadow(4px 4px 0px var(--color-nb-ink))',
                }}
              >
                redeem
              </span>
            </div>
            <div className="absolute inset-0 bg-secondary-container opacity-20 blur-2xl rounded-full scale-75 group-hover:scale-90 transition-transform"></div>
          </div>

          {/* Input + botão */}
          <div className="w-full space-y-5">
            {data && (
              <p className="text-center text-on-surface-variant font-semibold text-sm">
                Olá <span className="font-black text-on-surface">{data.giver.name}</span>! Insira o código recebido por e-mail.
              </p>
            )}

            <div className="flex flex-col space-y-2">
              <label className="text-sm font-extrabold text-on-surface ml-1" htmlFor="reveal-code">
                Código secreto recebido por e-mail
              </label>
              <input
                id="reveal-code"
                className="nb-input w-full p-4 rounded-xl text-xl font-black tracking-widest text-on-surface nb-shadow"
                placeholder="EX: SANTA-2024"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !decrypting && handleReveal(e)}
              />
            </div>

            {error && (
              <div className="bg-error-container border-2 border-error rounded-xl p-3 nb-shadow-sm">
                <p className="text-on-error-container font-black text-sm">✖ {error}</p>
              </div>
            )}

            <button
              className="nb-btn-primary w-full py-5 rounded-xl text-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleReveal}
              disabled={decrypting}
            >
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              {decrypting ? 'DESCRIPTOGRAFANDO...' : 'REVELAR AMIGO SECRETO'}
            </button>
          </div>
        </div>
      </main>

      {/* Bottom nav decorativa */}
      <nav className="nb-bottom-nav">
        <div className="flex flex-col items-center text-on-surface-variant px-4 py-1">
          <span className="material-symbols-outlined">group</span>
          <span className="text-xs font-bold">Groups</span>
        </div>
        <div className="flex flex-col items-center text-on-surface-variant px-4 py-1">
          <span className="material-symbols-outlined">chat_bubble</span>
          <span className="text-xs font-bold">Messages</span>
        </div>
        <div className="flex flex-col items-center bg-secondary-container text-on-secondary-container rounded-xl border-2 border-[var(--color-nb-ink)] px-4 py-1 nb-shadow-sm">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
          <span className="text-xs font-bold">Reveal</span>
        </div>
        <div className="flex flex-col items-center text-on-surface-variant px-4 py-1">
          <span className="material-symbols-outlined">person</span>
          <span className="text-xs font-bold">Profile</span>
        </div>
      </nav>
    </div>
  );
}
