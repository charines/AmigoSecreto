export default function MembersStep({
  owner,
  participants,
  setParticipants,
  onDraw,
  error,
  loading,
}) {
  const lines = participants.split('\n').filter((l) => l.trim() !== '');
  const count = lines.length;
  const valid = count >= 2;

  return (
    <div className="space-y-4">
      {/* Session header */}
      <div className="flex items-center justify-between">
        <span
          style={{
            color:         'rgb(var(--color-crt-green-raw, 57 255 132) / 0.4)',
            fontSize:      '10px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          SESSÃO: {owner}
        </span>
        <span style={{ fontSize: '10px', letterSpacing: '0.15em' }}>
          <span
            style={{
              color: valid
                ? 'var(--color-crt-green)'
                : count > 0
                ? 'var(--color-crt-red)'
                : 'rgb(var(--color-crt-green-raw, 57 255 132) / 0.35)',
              textShadow: valid ? '0 0 6px var(--color-crt-green)' : 'none',
            }}
          >
            {count}
          </span>
          <span style={{ color: 'rgb(var(--color-crt-green-raw, 57 255 132) / 0.35)' }}>
            {' '}participante{count !== 1 ? 's' : ''}
          </span>
          {!valid && count > 0 && (
            <span style={{ color: 'rgb(var(--color-crt-red-raw, 255 68 68) / 0.6)', marginLeft: '0.5rem' }}>
              (mín. 2)
            </span>
          )}
        </span>
      </div>

      {/* Participants textarea */}
      <textarea
        className="crt-input w-full p-4 text-sm resize-none min-h-64"
        style={{ fontFamily: 'inherit', lineHeight: '1.9' }}
        placeholder={'NOME_01\nNOME_02\nNOME_03\n...'}
        value={participants}
        onChange={(e) => setParticipants(e.target.value)}
      />

      <p style={{ color: 'rgb(var(--color-crt-green-raw, 57 255 132) / 0.22)', fontSize: '10px', letterSpacing: '0.15em' }}>
        ↵ Um nome por linha
      </p>

      {/* Inline error */}
      {error && (
        <p
          className="text-crt-red text-[10px] tracking-wider uppercase"
          style={{ textShadow: '0 0 6px rgb(var(--color-crt-red-raw, 255 68 68) / 0.4)' }}
        >
          ✖ {error}
        </p>
      )}

      {/* Draw button */}
      <button className="crt-btn" onClick={onDraw} disabled={!valid || loading}>
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <span className="inline-block w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
            <span className="inline-block w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <span className="inline-block w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            &nbsp;PROCESSANDO...
          </span>
        ) : (
          '[ EXECUTAR SORTEIO ]'
        )}
      </button>
    </div>
  );
}
