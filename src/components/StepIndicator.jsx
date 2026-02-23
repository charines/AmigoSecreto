const STEPS = [
  { key: 'email',   label: 'AUTH'  },
  { key: 'members', label: 'NOMES' },
  { key: 'results', label: 'LINKS' },
];

const ORDER = ['email', 'members', 'results'];

export default function StepIndicator({ step }) {
  const currentIdx = ORDER.indexOf(step);

  return (
    <div className="flex items-center justify-center mb-6">
      {STEPS.map((s, i) => {
        const isDone   = i < currentIdx;
        const isActive = i === currentIdx;

        return (
          <div key={s.key} className="flex items-center">
            {/* Dot + label */}
            <div className="flex flex-col items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full block transition-all duration-500"
                style={{
                  background: isActive
                    ? 'var(--color-crt-green)'
                    : isDone
                    ? 'rgb(var(--color-crt-green-raw, 57 255 132) / 0.45)'
                    : 'transparent',
                  border: `1px solid ${
                    isActive
                      ? 'var(--color-crt-green)'
                      : isDone
                      ? 'rgb(var(--color-crt-green-raw, 57 255 132) / 0.45)'
                      : 'rgb(var(--color-crt-green-raw, 57 255 132) / 0.2)'
                  }`,
                  boxShadow: isActive
                    ? '0 0 8px var(--color-crt-green), 0 0 18px rgb(var(--color-crt-green-raw, 57 255 132) / 0.3)'
                    : 'none',
                }}
              />
              <span
                className="hidden sm:block text-[9px] tracking-[0.22em] uppercase transition-all duration-300"
                style={{
                  color: isActive
                    ? 'var(--color-crt-green)'
                    : isDone
                    ? 'rgb(var(--color-crt-green-raw, 57 255 132) / 0.45)'
                    : 'rgb(var(--color-crt-green-raw, 57 255 132) / 0.2)',
                  textShadow: isActive ? '0 0 8px var(--color-crt-green)' : 'none',
                }}
              >
                {s.label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className="w-16 sm:w-24 h-px mx-2 mb-3.5 transition-all duration-500"
                style={{
                  background: isDone
                    ? 'rgb(var(--color-crt-green-raw, 57 255 132) / 0.4)'
                    : isActive
                    ? 'rgb(var(--color-crt-green-raw, 57 255 132) / 0.2)'
                    : 'rgb(var(--color-crt-green-raw, 57 255 132) / 0.1)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
