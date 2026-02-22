import { useState, useEffect } from 'react';

const DECRYPT_MSG  = 'DECRIPTOGRAFANDO RESULTADO SEGURO...';
const FAKE_LINES   = [
  'VERIFICANDO INTEGRIDADE SHA256_AES256...',
  'CONSULTANDO BANCO DE DADOS SEGURO...',
  'VALIDANDO TOKEN DE SESSÃO ÚNICA...',
];

export default function RevealStep({ revealedFriend }) {
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

  /* ── Decrypting phase ──────────────────────────────── */
  if (phase === 'decrypt') {
    return (
      <div className="py-10 space-y-6">
        {/* Typing line */}
        <div
          className="flex items-center gap-2 text-xs tracking-widest"
          style={{ color: 'rgba(57, 255, 132, 0.65)' }}
        >
          <span>{typed}</span>
          <span
            className="inline-block w-2 h-4"
            style={{ background: 'rgba(57, 255, 132, 0.65)', animation: 'blink 0.9s step-end infinite' }}
          />
        </div>

        {/* Fake log lines */}
        {typed.length > 12 && (
          <div
            className="space-y-1.5"
            style={{ color: 'rgba(57, 255, 132, 0.17)', fontSize: '10px', letterSpacing: '0.15em' }}
          >
            {FAKE_LINES.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── Reveal phase ──────────────────────────────────── */
  return (
    <div className="text-center py-8 space-y-6 animate-fade-in-up">
      <p
        style={{
          color: 'rgba(57, 255, 132, 0.45)',
          fontSize: '10px',
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
        }}
      >
        {revealedFriend.from.toUpperCase()}, VOCÊ TIROU:
      </p>

      {/* Name card */}
      <div
        className="relative py-12 px-6 overflow-hidden"
        style={{
          border: '1px solid rgba(57, 255, 132, 0.3)',
          background: 'rgba(57, 255, 132, 0.03)',
        }}
      >
        {/* Bloom glow behind name */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(57, 255, 132, 0.1) 0%, transparent 65%)',
          }}
        />

        <span
          className="relative text-5xl sm:text-6xl font-black uppercase text-crt-green block animate-glitch-reveal"
          style={{
            textShadow:
              '0 0 18px var(--color-crt-green), 0 0 50px rgba(57, 255, 132, 0.55), 0 0 100px rgba(57, 255, 132, 0.2)',
            letterSpacing: '0.08em',
            lineHeight: '1.1',
          }}
        >
          {revealedFriend.to}
        </span>
      </div>

      {/* Confirmation */}
      <p
        className="text-[9px] tracking-[0.3em] uppercase animate-pulse"
        style={{ color: 'rgba(57, 255, 132, 0.28)' }}
      >
        ■ RESULTADO CONFIRMADO E REGISTRADO
      </p>
    </div>
  );
}
