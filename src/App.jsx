import { useState, useEffect, useRef } from 'react' // 1. Adicionado useRef
import { performSecretSanta, encryptData, decryptData } from './utils/secretSanta'
import RetroTyping from './RetroTyping'; // Importe o novo componente

function App() {
  const [step, setStep] = useState('email'); // email, auth, members, results, reveal
  const [owner, setOwner] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [participants, setParticipants] = useState('');
  const [results, setResults] = useState([]);
  const [revealedFriend, setRevealedFriend] = useState(null);

  // 2. Referência para o textarea
  const textareaRef = useRef(null);

  // Efeito para detectar se é um link de revelação
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('show');
    if (data) {
      const decoded = decryptData(data);
      if (decoded) {
        setRevealedFriend(decoded);
        setStep('reveal');
      }
    }
  }, []);

  // 3. Efeito para focar e selecionar o conteúdo quando entrar em 'members'
  useEffect(() => {
    if (step === 'members' && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select(); // Seleciona o texto se houver algo
    }
  }, [step]);

  const handleEmail = (e) => {
    if (e.key === 'Enter' && inputVal.includes('@')) {
      setOwner(inputVal);
      setStep('auth');
      setInputVal('');
    }
  };

  const handleAuth = (e) => {
    if (e.key === 'Enter') {
      if (inputVal === '091205') {
        setStep('members');
        setInputVal('');
      } else {
        alert("ACESSO NEGADO: CHAVE INCORRETA");
      }
    }
  };

  const startDraw = () => {
    const names = participants.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (names.length < 2) return alert("ERRO: MÍNIMO DE 2 PARTICIPANTES");

    const shuffled = performSecretSanta(names);
    const drawData = names.map((name, i) => ({
      from: name,
      link: `${window.location.origin}/?show=${encryptData({ from: name, to: shuffled[i], owner })}`
    }));

    setResults(drawData);
    setStep('results');
  };


  return (
    <div className="min-h-screen bg-black text-terminal-green font-mono p-10 flex items-start justify-start">      
      <div className="scanline"></div>      
      <div className="w-full max-w-3xl border border-terminal-border p-6 bg-black shadow-2xl min-h-[70vh] flex flex-col z-10">
        
        {/* Header */}
        <div className="border-b border-terminal-border pb-4 mb-6 flex justify-between items-center">
          <span className="text-terminal-green font-bold tracking-tighter">TERMINAL v3.0_REACT</span>
          <span className="text-[10px] opacity-30 uppercase">Status: {step}</span>
        </div>

        {/* ADICIONE AQUI: */}
        <RetroTyping />

        <div className="flex-grow">
          {step === 'email' && (
            <div className="space-y-4">
              <p className="text-terminal-green">{">>>"} AGUARDANDO IDENTIFICAÇÃO DO ORGANIZADOR...</p>
              <div className="flex items-center">
                <span className="text-terminal-green mr-2">owner@root:~$</span>
                <input autoFocus className="bg-transparent outline-none text-terminal-green w-full" 
                  value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={handleEmail} placeholder="seu e-mail + enter" />
              </div>
            </div>
          )}

          {step === 'auth' && (
            <div className="space-y-4">
              <p className="text-yellow-600 font-bold tracking-widest uppercase italic">ALERTA: ACESSO RESTRITO</p>
              <div className="flex items-center">
                <span className="mr-2 text-zinc-600">CHAVE_SESSÃO:</span>
                <input autoFocus type="password" title="password" className="bg-transparent outline-none text-yellow-500 w-full" 
                  value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={handleAuth} />
              </div>
            </div>
          )}

          {step === 'members' && (
            <div className="flex flex-col h-full space-y-4">
              <p className="text-terminal-green text-xs uppercase">Conectado como: {owner}</p>
              <label className="text-[10px] opacity-40 italic">Cole os nomes dos participantes (um por linha):</label>
              <textarea 
                ref={textareaRef}
                className="flex-grow bg-zinc-900/30 border border-terminal-border p-4 text-terminal-green outline-none focus:border-terminal-green min-h-[300px] leading-tight"
                // Garantimos que o value comece sem espaços acidentais
                value={participants}
                onChange={e => {
                  const val = e.target.value;
                  // Se o usuário tentar começar com um "Enter", nós limpamos para manter no topo
                  setParticipants(val.startsWith('\n') ? val.trim() : val);
                }}
                placeholder="NOME_01&#10;NOME_02&#10;NOME_03"
              />
              <button onClick={startDraw} className="border border-terminal-green text-terminal-green py-3 hover:bg-terminal-green hover:text-black transition-all font-bold uppercase tracking-widest">
                [ EXECUTAR_SORTEIO ]
              </button>
            </div>
          )}

          {step === 'results' && (
            <div className="overflow-x-auto space-y-4">
              <p className="text-terminal-green text-center">--- RESULTADOS CRIPTOGRAFADOS ---</p>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-terminal-border text-zinc-500 uppercase">
                    <th className="py-2">Membro</th>
                    <th className="py-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((res, i) => (
                    <tr key={i} className="border-b border-zinc-900">
                      <td className="py-3 font-bold">{res.from}</td>
                      <td className="py-3 text-right">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(res.link);
                            alert(`Link de ${res.from} copiado!`);
                          }} 
                          className="text-terminal-green hover:bg-terminal-green/10 px-2 py-1 border border-terminal-green/30 uppercase text-[10px]"
                        >
                          Copiar Link
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={() => setStep('members')} className="mt-8 text-[10px] opacity-30 hover:opacity-100 hover:text-terminal-green underline">REINICIAR PROCESSO</button>
            </div>
          )}

          {step === 'reveal' && revealedFriend && (
            <div className="text-center py-12 space-y-8 animate-in zoom-in duration-500">
              <p className="text-terminal-green tracking-[0.4em] text-sm uppercase">Sessão Descriptografada</p>
              <div>
                <p className="text-xs opacity-50 mb-2 font-bold uppercase">{revealedFriend.from}, seu amigo secreto é:</p>
                <div className="inline-block border-2 border-terminal-green p-8 bg-terminal-green/5">
                  <span className="text-4xl text-terminal-green font-black tracking-tighter uppercase">
                    {revealedFriend.to}
                  </span>
                </div>
              </div>
              <p className="text-[10px] opacity-20 italic">Este terminal será encerrado automaticamente ao fechar a aba.</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-terminal-border flex justify-between items-center opacity-30 text-[9px]">
          <span>© 1994-2026 AMIGOSECRETO_OS</span>
          <span>ENCRYPTION: AES_B64_SALT</span>
        </div>
      </div>
    </div>
  )
}

export default App;