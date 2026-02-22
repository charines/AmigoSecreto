import RetroTyping from '../RetroTyping';
import StepIndicator from './StepIndicator';

export default function TerminalPanel({ step, children }) {
  const showStepIndicator = step !== 'reveal';

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 sm:py-16 relative"
      style={{ background: 'var(--color-crt-bg)' }}
    >
      {/* Moving scanline sweep */}
      <div className="scanline-sweep" />

      {/* Ambient glow blob behind the panel */}
      <div
        className="fixed inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <div
          style={{
            width: '520px',
            height: '300px',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse at center, rgba(57, 255, 132, 0.05) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* ── Main CRT Panel ─────────────────────────────────── */}
      <div
        className="w-full max-w-2xl relative"
        style={{
          zIndex: 10,
          background: 'var(--color-crt-panel)',
          border: '1px solid rgba(57, 255, 132, 0.18)',
          boxShadow:
            '0 0 0 1px rgba(57,255,132,0.06), 0 0 60px rgba(57,255,132,0.08), 0 0 120px rgba(57,255,132,0.03), inset 0 0 80px rgba(0,0,0,0.45)',
        }}
      >
        {/* Title bar */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid rgba(57, 255, 132, 0.12)' }}
        >
          {/* macOS-style traffic lights */}
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full block"
              style={{
                background: 'var(--color-crt-red)',
                boxShadow: '0 0 6px rgba(255, 68, 68, 0.6)',
              }}
            />
            <span
              className="w-3 h-3 rounded-full block"
              style={{
                background: 'var(--color-crt-amber)',
                boxShadow: '0 0 6px rgba(255, 187, 0, 0.6)',
              }}
            />
            <span
              className="w-3 h-3 rounded-full block"
              style={{
                background: 'var(--color-crt-green)',
                boxShadow: '0 0 6px rgba(57, 255, 132, 0.7)',
              }}
            />
          </div>

          {/* Title */}
          <span
            className="text-crt-green text-[11px] font-bold tracking-[0.35em] uppercase"
            style={{ textShadow: '0 0 10px rgba(57, 255, 132, 0.5)' }}
          >
            AMIGO_SECRETO.EXE
          </span>

          {/* Live status badge */}
          <span
            className="text-[9px] tracking-[0.2em] uppercase px-2 py-0.5"
            style={{
              color: 'rgba(57, 255, 132, 0.4)',
              border: '1px solid rgba(57, 255, 132, 0.15)',
            }}
          >
            {step}
          </span>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-8 pt-6 pb-4 min-h-96">
          <RetroTyping />
          {showStepIndicator && <StepIndicator step={step} />}

          <div className="mt-5">{children}</div>
        </div>

        {/* Footer */}
        <div
          className="px-5 sm:px-8 py-3 flex justify-between items-center"
          style={{ borderTop: '1px solid rgba(57, 255, 132, 0.08)' }}
        >
          <span
            style={{
              color: 'rgba(57, 255, 132, 0.2)',
              fontSize: '9px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            © 1994-2026 AMIGOSECRETO_OS
          </span>
          <span
            style={{
              color: 'rgba(57, 255, 132, 0.2)',
              fontSize: '9px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            DB_AUTH: MYSQL_ENABLED
          </span>
        </div>
      </div>
    </div>
  );
}
