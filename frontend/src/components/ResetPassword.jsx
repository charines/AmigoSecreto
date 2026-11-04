import { useState } from 'react';
import { apiPost } from '../lib/api';

export default function ResetPassword({ token }) {
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');
  const [showPass, setShowPass]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await apiPost('/admin_reset_password.php', { token, password });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const header = (
    <header className="nb-header">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          redeem
        </span>
        <h1 className="text-[1.75rem] leading-tight font-black text-primary italic" style={{ fontFamily: 'var(--font-nb)' }}>
          AmigoSecreto
        </h1>
      </div>
      <span className="text-xs font-bold text-on-surface-variant border-2 border-(--color-nb-ink) px-3 py-1 rounded-full nb-shadow-sm bg-white">
        ADMIN
      </span>
    </header>
  );

  if (success) {
    return (
      <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-nb)' }}>
        <div className="star-pattern fixed inset-0 z-0" />
        {header}
        <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-10">
          <div className="nb-card p-8 max-w-sm w-full text-center space-y-6">
            <span
              className="material-symbols-outlined text-secondary-container"
              style={{ fontSize: '80px', fontVariationSettings: "'FILL' 1", filter: 'drop-shadow(4px 4px 0px var(--color-nb-ink))' }}
            >
              check_circle
            </span>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-on-surface">Senha redefinida!</h2>
              <p className="text-sm font-semibold text-on-surface-variant">
                Sua senha foi atualizada com sucesso. Faça login com a nova senha.
              </p>
            </div>
            <button
              className="nb-btn-primary w-full py-4 rounded-xl text-base flex items-center justify-center gap-2"
              onClick={() => { window.location.href = '/'; }}
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
              IR PARA O LOGIN
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-nb)' }}>
        <div className="star-pattern fixed inset-0 z-0" />
        {header}
        <main className="relative z-10 flex-1 flex items-center justify-center px-5">
          <div className="nb-card p-6 max-w-sm w-full text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-error">link_off</span>
            <p className="text-on-surface font-black text-lg">Link inválido</p>
            <p className="text-sm font-semibold text-on-surface-variant">
              O link de recuperação está incompleto ou expirou.
            </p>
            <button
              className="text-sm font-extrabold text-primary hover:underline"
              onClick={() => { window.location.href = '/'; }}
            >
              Voltar para o login
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-nb)' }}>
      <div className="star-pattern fixed inset-0 z-0" />
      {header}

      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm space-y-6">

          <div className="text-center space-y-1">
            <h2
              className="text-[2rem] leading-tight font-black text-on-background"
              style={{ textShadow: '2px 2px 0px var(--color-nb-ink)' }}
            >
              Nova senha
            </h2>
            <p className="text-on-surface-variant font-semibold text-sm">
              Escolha uma senha com no mínimo 6 caracteres.
            </p>
          </div>

          <div className="nb-card p-6 space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-on-surface uppercase tracking-wider">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    className="nb-input w-full p-3 pr-12 rounded-xl text-sm text-on-surface"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                    onClick={() => setShowPass(v => !v)}
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-on-surface uppercase tracking-wider">
                  Confirmar senha
                </label>
                <input
                  className="nb-input w-full p-3 rounded-xl text-sm text-on-surface"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              {/* Indicador de força */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(level => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full border border-(--color-nb-ink) transition-colors ${
                          password.length >= level * 4
                            ? level === 1 ? 'bg-error' : level === 2 ? 'bg-secondary-container' : 'bg-[#22c55e]'
                            : 'bg-surface-container'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-on-surface-variant font-bold">
                    {password.length < 4 ? 'Muito curta' : password.length < 8 ? 'Razoável' : 'Boa senha'}
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-error-container border-2 border-error rounded-xl p-3">
                  <p className="text-on-error-container text-sm font-bold">✖ {error}</p>
                </div>
              )}

              <button
                className="nb-btn-primary w-full py-4 rounded-xl text-base flex items-center justify-center gap-2"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-xl animate-spin">autorenew</span>
                    SALVANDO...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock_reset</span>
                    REDEFINIR SENHA
                  </>
                )}
              </button>
            </form>

            <button
              type="button"
              className="text-sm font-extrabold text-primary hover:underline flex items-center gap-1"
              onClick={() => { window.location.href = '/'; }}
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Cancelar e voltar ao login
            </button>
          </div>

          <p className="text-center text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-widest">
            4 8 15 16 23 42
          </p>
        </div>
      </main>
    </div>
  );
}
