import { useState, useEffect } from 'react';
import { performSecretSanta } from './utils/secretSanta';
import TerminalPanel from './components/TerminalPanel';
import EmailStep    from './components/EmailStep';
import MembersStep  from './components/MembersStep';
import ResultsStep  from './components/ResultsStep';
import RevealStep   from './components/RevealStep';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

function App() {
  const [step,           setStep]           = useState('email');
  const [owner,          setOwner]          = useState('');
  const [inputVal,       setInputVal]       = useState('');
  const [participants,   setParticipants]   = useState('');
  const [results,        setResults]        = useState([]);
  const [revealedFriend, setRevealedFriend] = useState(null);
  const [error,          setError]          = useState('');
  const [loading,        setLoading]        = useState(false);

  /* ── Initial load ─────────────────────────────────────────── */
  useEffect(() => {
    const storedOwner = localStorage.getItem('owner_email');
    if (storedOwner) {
      setOwner(storedOwner);
      setStep('members');
    }

    const params        = new URLSearchParams(window.location.search);
    const participantId = params.get('id');

    if (participantId) {
      (async () => {
        try {
          if (!API_BASE_URL) { setError('ERRO: API não configurada.'); return; }
          const res  = await fetch(`${API_BASE_URL}/reveal.php?id=${encodeURIComponent(participantId)}`);
          const data = await res.json();
          if (res.ok && data.ok) {
            setRevealedFriend({ from: data.from, to: data.to });
            setStep('reveal');
          } else {
            setError('ACESSO NEGADO: Sorteio inválido ou expirado.');
          }
        } catch (err) {
          console.error(err);
          setError('FALHA NO SISTEMA: Não foi possível validar o link.');
        }
      })();
    }
  }, []);

  /* ── Step 1: email ────────────────────────────────────────── */
  const handleEmail = (e) => {
    if (e.key !== 'Enter') return;
    if (!inputVal.trim().includes('@')) {
      setError('E-mail inválido — inclua um @ e domínio.');
      return;
    }
    setError('');
    const email = inputVal.trim();
    setOwner(email);
    localStorage.setItem('owner_email', email);
    setStep('members');
    setInputVal('');
  };

  /* ── Step 2: draw ─────────────────────────────────────────── */
  const startDraw = async () => {
    const lines = participants.split('\n').map((n) => n.trim()).filter(Boolean);
    if (lines.length < 2)               { setError('Mínimo de 2 participantes necessário.');     return; }
    if (!API_BASE_URL)                  { setError('API não configurada (VITE_API_BASE_URL).');  return; }
    if (!owner || !owner.includes('@')) { setError('E-mail do organizador inválido.');            return; }

    setError('');
    setLoading(true);

    try {
      const shuffled = performSecretSanta(lines);
      const payload  = lines.map((name, i) => ({ name, secret_friend_name: shuffled[i] }));

      const res  = await fetch(`${API_BASE_URL}/draw.php`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ owner_email: owner, participants: payload }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || 'Erro ao salvar o sorteio');

      setResults(data.participants.map((p) => ({
        from: p.name,
        link: `${window.location.origin}/?id=${p.id}`,
      })));
      setStep('results');
    } catch (err) {
      console.error(err);
      setError(`FALHA: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <TerminalPanel step={step}>
      {step === 'email' && (
        <EmailStep
          inputVal={inputVal}
          setInputVal={setInputVal}
          onKeyDown={handleEmail}
          error={error}
        />
      )}

      {step === 'members' && (
        <MembersStep
          owner={owner}
          participants={participants}
          setParticipants={setParticipants}
          onDraw={startDraw}
          error={error}
          loading={loading}
        />
      )}

      {step === 'results' && <ResultsStep results={results} />}

      {step === 'reveal' && revealedFriend && (
        <RevealStep revealedFriend={revealedFriend} />
      )}
    </TerminalPanel>
  );
}

export default App;
