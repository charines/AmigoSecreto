export default function EmailStep({ inputVal, setInputVal, onKeyDown, error }) {
  return (
    <div className="space-y-5">
      {/* Prompt header */}
      <div className="space-y-1">
        <p
          className="text-crt-green text-xs tracking-[0.25em] uppercase"
          style={{ textShadow: '0 0 8px rgb(var(--color-crt-green-raw, 57 255 132) / 0.4)' }}
        >
          {'>>>'} INICIALIZANDO MÓDULO DE AUTENTICAÇÃO
        </p>
        <p style={{ color: 'rgb(var(--color-crt-green-raw, 57 255 132) / 0.4)', fontSize: '11px', lineHeight: '1.6' }}>
          Insira o e-mail do organizador para iniciar a sessão segura.
        </p>
      </div>

      {/* Input block */}
      <div className="crt-input p-4 space-y-2">
        <div
          style={{
            color:         'rgb(var(--color-crt-green-raw, 57 255 132) / 0.35)',
            fontSize:      '10px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          root@auth:~$
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-crt-green text-base shrink-0"
            style={{ textShadow: '0 0 6px currentColor' }}
          >
            ›
          </span>
          <input
            autoFocus
            type="email"
            className="bg-transparent outline-none text-crt-green w-full text-sm"
            style={{
              caretColor: 'var(--color-crt-green)',
              textShadow: '0 0 5px rgb(var(--color-crt-green-raw, 57 255 132) / 0.35)',
              fontFamily: 'inherit',
            }}
            placeholder="usuario@dominio.com"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
      </div>

      {/* Inline error */}
      {error && (
        <p
          className="text-crt-red text-[10px] tracking-wider uppercase"
          style={{ textShadow: '0 0 6px rgb(var(--color-crt-red-raw, 255 68 68) / 0.4)' }}
        >
          ✖ {error}
        </p>
      )}

      {/* Hint */}
      <p
        className="text-[10px] tracking-[0.25em] uppercase animate-pulse"
        style={{ color: 'rgb(var(--color-crt-green-raw, 57 255 132) / 0.28)' }}
      >
        PRESSIONE [ENTER] PARA AUTENTICAR
      </p>
    </div>
  );
}
