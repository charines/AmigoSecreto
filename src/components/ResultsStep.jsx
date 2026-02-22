import { useState } from 'react';

export default function ResultsStep({ results }) {
  const [copied, setCopied] = useState(null);

  const handleCopy = (link, idx) => {
    navigator.clipboard.writeText(link);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-1">
        <p
          className="text-crt-green text-xs tracking-[0.3em] uppercase"
          style={{ textShadow: '0 0 10px rgba(57, 255, 132, 0.45)' }}
        >
          ── SORTEIO CONCLUÍDO ──
        </p>
        <p style={{ color: 'rgba(57, 255, 132, 0.38)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          {results.length} LINKS ÚNICOS GERADOS
        </p>
      </div>

      {/* Results list */}
      <div
        className="divide-y max-h-80 overflow-y-auto"
        style={{ border: '1px solid rgba(57, 255, 132, 0.12)', borderBottom: 'none' }}
      >
        {results.map((res, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-3 transition-colors duration-150 hover:bg-crt-green/5"
            style={{ borderBottom: '1px solid rgba(57, 255, 132, 0.08)' }}
          >
            <div className="flex items-center gap-3">
              <span style={{ color: 'rgba(57, 255, 132, 0.28)', fontSize: '10px' }}>
                {String(i + 1).padStart(2, '0')}.
              </span>
              <span
                className="text-crt-green text-sm"
                style={{ textShadow: '0 0 4px rgba(57,255,132,0.2)' }}
              >
                {res.from}
              </span>
            </div>

            <button
              onClick={() => handleCopy(res.link, i)}
              className={`crt-btn-sm ${copied === i ? 'copied' : ''}`}
            >
              {copied === i ? '✓ COPIADO' : 'COPIAR_URL'}
            </button>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p
        style={{
          color: 'rgba(57, 255, 132, 0.22)',
          fontSize: '10px',
          textAlign: 'center',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          lineHeight: '1.7',
        }}
      >
        ENVIE CADA LINK PARA O PARTICIPANTE CORRESPONDENTE.<br />
        CADA LINK REVELA APENAS UM RESULTADO.
      </p>
    </div>
  );
}
