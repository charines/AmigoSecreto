import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';
import { decryptName } from '../lib/crypto';
import RevealStep from './RevealStep';

export default function RevealPage({ token }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [code, setCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || '';
  });
  const [revealed, setRevealed] = useState(null);
  const [error, setError] = useState('');
  const [decrypting, setDecrypting] = useState(false);
  const [autoRevealed, setAutoRevealed] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiGet(`/reveal.php?token=${encodeURIComponent(token)}`);
        setData(res);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleReveal = async (e) => {
    if (e) e.preventDefault();
    if (!data) return;
    const cleaned = code.trim();
    if (!cleaned) {
      setError('Informe o codigo recebido por email.');
      return;
    }

    setDecrypting(true);
    setError('');
    try {
      const name = await decryptName(data.payload.encrypted, data.payload.iv_b64, cleaned);
      setRevealed({ from: data.giver.name, to: name });
      await apiPost('/reveal_confirm.php', { token });
    } catch (err) {
      setError('Codigo invalido ou expirado.');
    } finally {
      setDecrypting(false);
    }
  };

  useEffect(() => {
    if (data && code && !revealed && !decrypting && !autoRevealed && !error) {
      setAutoRevealed(true);
      handleReveal();
    }
  }, [data, code, revealed, decrypting, autoRevealed, error]);

  if (loading) {
    return <p className="text-[10px] opacity-60">Carregando resultado...</p>;
  }

  if (error && !data) {
    return (
      <p className="text-crt-red text-[10px] tracking-wider uppercase">
        ✖ {error}
      </p>
    );
  }

  if (revealed) {
    return <RevealStep revealedFriend={revealed} />;
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-crt-green text-xs tracking-[0.3em] uppercase">
          Resultado do grupo {data.group.title}
        </p>
        <p style={{ color: 'rgb(var(--color-crt-green-raw, 57 255 132) / 0.4)', fontSize: '11px' }}>
          Ola {data.giver.name}, insira o codigo recebido por email para revelar.
        </p>
      </div>

      <input
        className="crt-input w-full p-3 text-sm"
        placeholder="Codigo secreto"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      {error && (
        <p className="text-crt-red text-[10px] tracking-wider uppercase">
          ✖ {error}
        </p>
      )}

      <button className="crt-btn" onClick={handleReveal} disabled={decrypting}>
        {decrypting ? 'DESCRIPTOGRAFANDO...' : 'REVELAR AMIGO SECRETO'}
      </button>
    </div>
  );
}
