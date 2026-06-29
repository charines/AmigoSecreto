import { useState, useEffect } from 'react';

const DECRYPT_MSG = 'DECRIPTOGRAFANDO RESULTADO SEGURO...';
const FAKE_LINES = [
  'VERIFICANDO INTEGRIDADE SHA256_AES256...',
  'CONSULTANDO BANCO DE DADOS SEGURO...',
  'VALIDANDO TOKEN DE SESSÃO ÚNICA...',
];

export default function RevealStep({ revealedFriend, token }) {
  const [phase, setPhase] = useState('decrypt'); // 'decrypt' | 'reveal'
  const [typed, setTyped] = useState('');

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setTyped(DECRYPT_MSG.slice(0, i));
      if (i >= DECRYPT_MSG.length) {
        clearInterval(timer);
        setTimeout(() => setPhase('reveal'), 950);
      }
    }, 36);
    return () => clearInterval(timer);
  }, []);

  const header = (
    <header className="nb-header">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-3xl">redeem</span>
        <h1 className="text-[1.75rem] leading-tight font-black text-primary italic" style={{ fontFamily: 'var(--font-nb)' }}>
          AmigoSecreto
        </h1>
      </div>
      <div className="w-10 h-10 rounded-full border-2 border-(--color-nb-ink) overflow-hidden nb-shadow-sm bg-surface-container-highest flex items-center justify-center">
        <span className="material-symbols-outlined text-on-surface-variant">person</span>
      </div>
    </header>
  );

  /* ── Fase de descriptografia ── */
  if (phase === 'decrypt') {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-nb-bg)', fontFamily: 'var(--font-nb)' }}>
        {header}
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-5 py-10">
          <div className="nb-card p-8 max-w-md w-full space-y-6">
            <div className="flex items-center gap-2 text-sm font-bold text-on-surface-variant">
              <span>{typed}</span>
              <span
                className="inline-block w-2 h-5 bg-primary"
                style={{ animation: 'blink 0.9s step-end infinite' }}
              />
            </div>
            {typed.length > 12 && (
              <div className="space-y-1.5">
                {FAKE_LINES.map((line, i) => (
                  <p key={i} className="text-[10px] text-on-surface-variant/50 uppercase tracking-wider">{line}</p>
                ))}
              </div>
            )}
            <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden border border-(--color-nb-ink)">
              <div className="h-full bg-primary animate-pulse w-2/3 rounded-full"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ── Fase de revelação ── */
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--color-nb-bg)', fontFamily: 'var(--font-nb)' }}>
      {header}

      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-5 py-10 pb-28">
        <div className="w-full max-w-lg flex flex-col items-center space-y-8 text-center">

          {/* Ícone de celebração */}
          <div className="animate-bounce">
            <span
              className="material-symbols-outlined text-secondary-container"
              style={{ fontSize: '100px', fontVariationSettings: "'FILL' 1", filter: 'drop-shadow(4px 4px 0px var(--color-nb-ink))' }}
            >
              celebration
            </span>
          </div>

          <h3 className="text-[2.5rem] leading-tight font-black text-on-background">
            {revealedFriend.from.toUpperCase()}, você tirou:
          </h3>

          {/* Card do nome */}
          <div
            className="px-8 py-6 bg-secondary-container border-4 border-(--color-nb-ink) rounded-2xl nb-shadow-lg"
            style={{ transform: 'rotate(-2deg)' }}
          >
            <span
              className="font-black tracking-tight text-on-secondary-container block"
              style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)' }}
            >
              {revealedFriend.to.toUpperCase()}
            </span>
          </div>

          <p className="text-xs text-on-surface-variant/60 font-bold uppercase tracking-widest animate-pulse">
            ■ RESULTADO CONFIRMADO E REGISTRADO
          </p>

          {/* Ações */}
          <div className="w-full max-w-sm space-y-4">
            <div className="nb-card p-6 space-y-3">
              <p className="text-on-surface-variant font-bold text-sm">
                Mande uma dica anônima ou descubra o que ele quer ganhar!
              </p>
              <button
                className="w-full bg-tertiary-container text-on-tertiary-container font-extrabold text-base py-4 rounded-xl border-2 border-(--color-nb-ink) nb-shadow nb-press flex items-center justify-center gap-3 transition-all"
                onClick={() => { window.location.href = `/chat?token=${token}`; }}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>masks</span>
                Abrir Chat Anônimo
              </button>
            </div>

            <button
              className="font-bold text-primary hover:underline flex items-center justify-center gap-2 mx-auto text-sm"
              onClick={() => location.reload()}
            >
              <span className="material-symbols-outlined text-base">restart_alt</span>
              Revelar outro código
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
        <div className="flex flex-col items-center bg-secondary-container text-on-secondary-container rounded-xl border-2 border-(--color-nb-ink) px-4 py-1 nb-shadow-sm">
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
