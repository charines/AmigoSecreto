import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase' // Importa o cliente configurado
import { performSecretSanta } from './utils/secretSanta'
import RetroTyping from './RetroTyping';

function App() {
  const [step, setStep] = useState('email');
  const [owner, setOwner] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [participants, setParticipants] = useState('');
  const [results, setResults] = useState([]);
  const [revealedFriend, setRevealedFriend] = useState(null);
  const textareaRef = useRef(null);

  // 1. Persistência de Sessão: Verifica se o utilizador já está logado ao carregar
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setOwner(session.user.email);
        setStep('members');
      }
    };
    checkSession();

    // Validação do Link de Revelação via ID do Banco
    const params = new URLSearchParams(window.location.search);
    const participantId = params.get('id');

    if (participantId) {
      const checkValidation = async () => {
        const { data, error } = await supabase
          .from('participants')
          .select('name, secret_friend_name, groups(status)')
          .eq('id', participantId)
          .single();

        if (data && data.groups.status === 'active') {
          setRevealedFriend({ from: data.name, to: data.secret_friend_name });
          setStep('reveal');
        } else {
          alert("ACESSO NEGADO: Sorteio inválido ou expirado.");
        }
      };
      checkValidation();
    }
  }, []);

  const handleEmail = async (e) => {
    if (e.key === 'Enter' && inputVal.includes('@')) {
      const email = inputVal.trim();
      setOwner(email);
      
      const { error } = await supabase.auth.signInWithOtp({ email });
      
      if (error) {
        alert("Erro ao enviar código: " + error.message);
      } else {
        setStep('auth');
        setInputVal('');
      }
    }
  };

  const handleAuth = async (e) => {
    if (e.key === 'Enter') {
      const { data, error } = await supabase.auth.verifyOtp({
        email: owner,
        token: inputVal,
        type: 'magiclink'
      });

      if (!error) {
        // O login foi guardado no localStorage, useEffect mudará o step para 'members'
        setInputVal('');
      } else {
        alert("CÓDIGO INVÁLIDO OU EXPIRADO");
      }
    }
  };

  // 2. Lógica de Sorteio Ajustada para o Banco de Dados 
  const startDraw = async () => {
    const lines = participants.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (lines.length < 2) return alert("ERRO: MÍNIMO DE 2 PARTICIPANTES");

    try {
      // Cria o grupo conforme colunas do db.sql 
      const { data: group, error: gError } = await supabase
        .from('groups')
        .insert([{ owner_email: owner, status: 'active' }])
        .select()
        .single();

      if (gError) throw gError;

      const shuffled = performSecretSanta(lines);

      // Mapeia payload para as colunas: group_id, name, secret_friend_name, viewed 
      const payload = lines.map((name, i) => ({
        group_id: group.id,
        name: name,
        secret_friend_name: shuffled[i],
        viewed: false 
      }));

      const { data: createdParts, error: pError } = await supabase
        .from('participants')
        .insert(payload)
        .select();

      if (pError) throw pError;

      const drawData = createdParts.map(p => ({
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

          {step === 'auth' && (
            <div className="space-y-4">
              <p className="text-yellow-600 font-bold tracking-widest uppercase italic">VERIFICAÇÃO DE IDENTIDADE</p>
              <p className="text-[10px] text-zinc-500">Insira o código enviado para {owner}</p>
              <div className="flex items-center">
                <span className="mr-2 text-zinc-600">OTP_TOKEN:</span>
                <input autoFocus className="bg-transparent outline-none text-yellow-500 w-full" 
                  value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={handleAuth} placeholder="6 dígitos" />
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
          <span>DB_AUTH: SUPABASE_ENABLED</span>
        </div>
      </div>
    </div>
  )
}

export default App;