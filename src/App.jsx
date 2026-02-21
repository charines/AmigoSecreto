import { useState, useEffect, useRef } from 'react'
import { performSecretSanta } from './utils/secretSanta'
import RetroTyping from './RetroTyping';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

function App() {
  const [step, setStep] = useState('email');
  const [owner, setOwner] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [participants, setParticipants] = useState('');
  const [results, setResults] = useState([]);
  const [revealedFriend, setRevealedFriend] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const storedOwner = localStorage.getItem('owner_email');
    if (storedOwner) {
      setOwner(storedOwner);
      setStep('members');
    }

    // Validação do Link de Revelação via ID do Banco
    const params = new URLSearchParams(window.location.search);
    const participantId = params.get('id');

    if (participantId) {
      const checkValidation = async () => {
        try {
          if (!API_BASE_URL) {
            alert("ERRO: API não configurada.");
            return;
          }
          const res = await fetch(`${API_BASE_URL}/reveal.php?id=${encodeURIComponent(participantId)}`);
          const data = await res.json();
          if (res.ok && data.ok) {
            setRevealedFriend({ from: data.from, to: data.to });
            setStep('reveal');
          } else {
            alert("ACESSO NEGADO: Sorteio inválido ou expirado.");
          }
        } catch (err) {
          console.error("Erro detalhado:", err);
          alert("FALHA NO SISTEMA: Não foi possível validar o link.");
        }
      };
      checkValidation();
    }
  }, []);

  const handleEmail = (e) => {
    if (e.key === 'Enter' && inputVal.includes('@')) {
      const email = inputVal.trim();
      setOwner(email);
      localStorage.setItem('owner_email', email);
      setStep('members');
      setInputVal('');
    }
  };

  // 2. Lógica de Sorteio Ajustada para o Banco de Dados 
  const startDraw = async () => {
    const lines = participants.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (lines.length < 2) return alert("ERRO: MÍNIMO DE 2 PARTICIPANTES");
    if (!API_BASE_URL) return alert("ERRO: API não configurada.");
    if (!owner || !owner.includes('@')) return alert("ERRO: E-MAIL DO ORGANIZADOR INVÁLIDO");

    try {
      const shuffled = performSecretSanta(lines);

      const payload = lines.map((name, i) => ({
        name: name,
        secret_friend_name: shuffled[i]
      }));

      const res = await fetch(`${API_BASE_URL}/draw.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_email: owner, participants: payload })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || 'Erro ao salvar o sorteio');

      const drawData = data.participants.map(p => ({
        from: p.name,
        link: `${window.location.origin}/?id=${p.id}`
      }));

      setResults(drawData);
      setStep('results');

    } catch (err) {
      console.error("Erro detalhado:", err);
      alert(`FALHA NO SISTEMA: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-terminal-green font-mono p-10 flex items-start justify-start">      
      <div className="scanline"></div>      
      <div className="w-full max-w-3xl border border-terminal-border p-6 bg-black shadow-2xl min-h-[70vh] flex flex-col z-10">
        
        <div className="border-b border-terminal-border pb-4 mb-6 flex justify-between items-center">
          <span className="text-terminal-green font-bold tracking-tighter">TERMINAL v4.0_DB_SECURE</span>
          <span className="text-[10px] opacity-30 uppercase">Status: {step}</span>
        </div>

        <RetroTyping />

        <div className="flex-grow">
          {step === 'email' && (
            <div className="space-y-4">
              <p className="text-terminal-green">{">>>"} AGUARDANDO E-MAIL DO ORGANIZADOR...</p>
              <div className="flex items-center">
                <span className="text-terminal-green mr-2">root@auth:~$</span>
                <input autoFocus className="bg-transparent outline-none text-terminal-green w-full" 
                  value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={handleEmail} placeholder="email + enter" />
              </div>
            </div>
          )}

          {step === 'members' && (
            <div className="flex flex-col h-full space-y-4">
              <p className="text-terminal-green text-xs uppercase">Sessão Ativa: {owner}</p>
              <textarea 
                ref={textareaRef}
                className="flex-grow bg-zinc-900/30 border border-terminal-border p-4 text-terminal-green outline-none focus:border-terminal-green min-h-[300px]"
                value={participants}
                onChange={e => setParticipants(e.target.value)}
                placeholder="NOME_01&#10;NOME_02&#10;NOME_03"
              />
              <button onClick={startDraw} className="border border-terminal-green text-terminal-green py-3 hover:bg-terminal-green hover:text-black font-bold uppercase transition-all">
                [ EXECUTAR_SORTEIO_DB ]
              </button>
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-4">
              <p className="text-terminal-green text-center">--- LINKS GERADOS COM SUCESSO ---</p>
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <tbody>
                    {results.map((res, i) => (
                      <tr key={i} className="border-b border-zinc-900">
                        <td className="py-3">{res.from}</td>
                        <td className="py-3 text-right">
                          <button onClick={() => {
                            navigator.clipboard.writeText(res.link);
                            alert("Link copiado!");
                          }} className="text-terminal-green border border-terminal-green/30 px-2 py-1 text-[10px] hover:bg-terminal-green hover:text-black">
                            COPIAR_URL
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 'reveal' && revealedFriend && (
            <div className="text-center py-12 space-y-8 animate-in zoom-in">
              <p className="text-terminal-green tracking-[0.4em] text-sm uppercase">Resultado Localizado</p>
              <div className="inline-block border-2 border-terminal-green p-8 bg-terminal-green/5">
                <span className="text-xs opacity-50 block mb-2">{revealedFriend.from.toUpperCase()}, VOCÊ TIROU:</span>
                <span className="text-4xl text-terminal-green font-black uppercase">{revealedFriend.to}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-terminal-border flex justify-between items-center opacity-30 text-[9px]">
          <span>© 1994-2026 AMIGOSECRETO_OS</span>
          <span>DB_AUTH: MYSQL_ENABLED</span>
        </div>
      </div>
    </div>
  )
}

export default App;
