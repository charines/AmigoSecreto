import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';

export default function InvitePage({ token }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const load = async () => {
      setError('');
      setLoading(true);
      try {
        const res = await apiGet(`/invite.php?token=${encodeURIComponent(token)}`);
        setData(res);
        setConfirmed(res?.participant?.status === 'confirmed');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleConfirm = async () => {
    setConfirming(true);
    setError('');
    try {
      await apiPost('/invite_confirm.php', { token });
      setConfirmed(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return <p className="text-[10px] opacity-60">Carregando convite...</p>;
  }

  if (error) {
    return (
      <p className="text-crt-red text-[10px] tracking-wider uppercase">
        ✖ {error}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-crt-green text-xs tracking-[0.3em] uppercase">
          Convite para {data.group.title}
        </p>
        {data.group.description && (
          <p style={{ color: 'rgb(var(--color-crt-green-raw, 57 255 132) / 0.4)', fontSize: '11px' }}>
            {data.group.description}
          </p>
        )}
      </div>

      <div className="crt-input p-4 text-sm space-y-2">
        <div>Participante: {data.participant.name}</div>
        <div>Email: {data.participant.email}</div>
      </div>

      {confirmed ? (
        <p className="text-[10px] tracking-wider uppercase">
          ✔ Participacao confirmada. Aguarde o sorteio.
        </p>
      ) : (
        <button className="crt-btn" onClick={handleConfirm} disabled={confirming}>
          {confirming ? 'CONFIRMANDO...' : 'CONFIRMAR PARTICIPACAO'}
        </button>
      )}
    </div>
  );
}
