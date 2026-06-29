import { useState } from 'react';
import { apiPost } from '../lib/api';

export default function ForgotPassword({ onBack }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiPost('/admin_forgot_password.php', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-6 text-center" style={{ fontFamily: 'var(--font-nb)' }}>
        <div className="flex justify-center">
          <span
            className="material-symbols-outlined text-secondary-container"
            style={{ fontSize: '72px', fontVariationSettings: "'FILL' 1", filter: 'drop-shadow(3px 3px 0px var(--color-nb-ink))' }}
          >
            mark_email_read
          </span>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-on-surface">E-mail enviado!</h3>
          <p className="text-sm font-semibold text-on-surface-variant">
            Se esse endereço estiver cadastrado, você receberá um link em breve.
          </p>
          <p className="text-xs text-on-surface-variant/60 font-semibold">
            Verifique também a caixa de spam.
          </p>
        </div>
        <button
          className="text-sm font-extrabold text-primary hover:underline flex items-center gap-1 mx-auto"
          onClick={onBack}
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Voltar para o login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5" style={{ fontFamily: 'var(--font-nb)' }}>
      <div className="space-y-1">
        <h3 className="text-xl font-black text-on-surface">Esqueci minha senha</h3>
        <p className="text-sm font-semibold text-on-surface-variant">
          Informe seu e-mail e enviaremos um link para criar uma nova senha.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-xs font-extrabold text-on-surface uppercase tracking-wider">
            E-mail da conta
          </label>
          <input
            className="nb-input w-full p-3 rounded-xl text-sm text-on-surface"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
          />
        </div>

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
              ENVIANDO...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
              ENVIAR LINK
            </>
          )}
        </button>
      </form>

      <button
        type="button"
        className="text-sm font-extrabold text-primary hover:underline flex items-center gap-1"
        onClick={onBack}
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Voltar para o login
      </button>
    </div>
  );
}
