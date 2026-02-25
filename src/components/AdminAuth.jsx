import { useState } from 'react';
import { apiPost } from '../lib/api';

export default function AdminAuth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = mode === 'register'
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };
      const data = await apiPost(mode === 'register' ? '/admin_register.php' : '/admin_login.php', payload);
      onAuth(data.admin);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <div className="flex justify-between items-start">
          <p className="text-crt-green text-xs tracking-[0.25em] uppercase">
            {mode === 'login' ? '>>> ACESSO ADMIN' : '>>> CRIAR CONTA ADMIN'}
          </p>
          <div className="text-[7px] tracking-[0.2em] opacity-30 text-right">
            DHARMA INITIATIVE<br />
            STATION 3
          </div>
        </div>
        <p style={{ color: 'rgb(var(--color-crt-green-raw, 57 255 132) / 0.4)', fontSize: '11px' }}>
          {mode === 'login'
            ? 'Entre para gerenciar seus grupos e convites.'
            : 'Cadastre o administrador para iniciar um novo grupo.'}
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <input
            className="crt-input w-full p-3 text-sm"
            placeholder="Nome do administrador"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          className="crt-input w-full p-3 text-sm"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="crt-input w-full p-3 text-sm"
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-crt-red text-[10px] tracking-wider uppercase">
            ✖ {error}
          </p>
        )}

        <button className="crt-btn" type="submit" disabled={loading}>
          {loading ? 'PROCESSANDO...' : mode === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}
        </button>
      </form>

      <button
        type="button"
        className="crt-btn-sm w-full"
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? 'CRIAR CONTA' : 'JA TENHO CONTA'}
      </button>
    </div>
  );
}
