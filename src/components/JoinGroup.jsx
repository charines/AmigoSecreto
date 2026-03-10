import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../lib/api';

function getJoinCode() {
  const parts = window.location.pathname.split('/');
  return parts[parts.length - 1] || '';
}

export default function JoinGroup() {
  const code = getJoinCode();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [joining, setJoining] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadGroup() {
      try {
        const data = await apiGet(`/groups_get_public.php?code=${code}`);
        setGroup(data.group);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadGroup();
  }, [code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setJoining(true);
    setError('');
    try {
      await apiPost('/groups_join.php', { code, name, email });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-crt-green flex items-center justify-center p-4">
        <div className="text-xs tracking-[0.5em] animate-pulse uppercase">Estabelecendo Conexão...</div>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="min-h-screen bg-black text-crt-red flex items-center justify-center p-4">
        <div className="crt-panel border-crt-red p-8 max-w-md w-full bg-crt-red/5">
          <div className="text-[10px] tracking-[0.2em] uppercase mb-4 opacity-70">Sistema Interrompido</div>
          <p className="text-sm uppercase leading-relaxed font-bold">{error}</p>
          <a href="/" className="inline-block mt-6 text-[10px] border border-crt-red px-4 py-2 hover:bg-crt-red/10 transition-colors uppercase">Voltar ao Inicio</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-crt-green flex flex-col items-center justify-center p-4 py-12">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header Style Lost */}
        <div className="flex flex-col items-center space-y-4 mb-12">
          <div className="w-16 h-16 border-4 border-crt-green rounded-full flex items-center justify-center font-bold text-2xl tracking-tighter">
            <span className="relative -top-1">DH</span>
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-xs tracking-[0.6em] uppercase opacity-40">Dharma Initiative</h1>
            <div className="text-[8px] tracking-[0.4em] uppercase opacity-20">Station 3: The Swan</div>
          </div>
        </div>

        {!success ? (
          <div className="crt-panel border-crt-green/40 p-8 space-y-8 bg-crt-green/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-crt-green/10">
              <div className="h-full bg-crt-green/40 animate-progress" style={{ width: '30%' }}></div>
            </div>

            <div className="space-y-4">
              <div className="text-[10px] tracking-[0.3em] uppercase opacity-60">Mensagem do Sistema:</div>
              <p className="text-lg uppercase tracking-tight leading-tight">
                VOCÊ FOI SELECIONADO PARA PARTICIPAR DO <span className="text-crt-green-bright font-bold">"{group.title}"</span>.
              </p>
              {group.description && (
                <p className="text-xs opacity-60 uppercase leading-relaxed italic border-l-2 border-crt-green/20 pl-4">
                  {group.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-[10px] uppercase opacity-50">
              <div className="border border-crt-green/20 p-2 text-center">
                <div>Data do Evento</div>
                <div className="text-crt-green-bright mt-1 font-bold">{group.draw_date || 'A DEFINIR'}</div>
              </div>
              <div className="border border-crt-green/20 p-2 text-center">
                <div>Limite Budget</div>
                <div className="text-crt-green-bright mt-1 font-bold">{group.budget_limit ? `R$ ${group.budget_limit}` : 'N/A'}</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-crt-green/10">
              <div className="text-[10px] tracking-[0.2em] uppercase opacity-60">Preencha suas credenciais:</div>
              <div className="space-y-4">
                <input
                  className="crt-input w-full p-4 text-sm"
                  placeholder="NOME COMPLETO"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <input
                  className="crt-input w-full p-4 text-sm"
                  type="email"
                  placeholder="ENDEREÇO DE E-MAIL"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              {error && <p className="text-[10px] text-crt-red uppercase font-bold tracking-wider">{error}</p>}

              <button 
                type="submit" 
                className={`crt-btn w-full py-4 text-sm font-bold shadow-[0_0_20px_rgba(57,255,132,0.1)] ${joining ? 'opacity-50' : ''}`}
                disabled={joining}
              >
                {joining ? 'PROCESSANDO...' : 'EXECUTAR PROTOCOLO DE INSCRICAO'}
              </button>
            </form>
          </div>
        ) : (
          <div className="crt-panel border-crt-green p-10 space-y-8 bg-crt-green/5 text-center">
            <div className="text-crt-green-bright text-4xl mb-4">✓</div>
            <h2 className="text-xl uppercase tracking-wider font-bold">Protocolo Iniciado</h2>
            <div className="space-y-4 text-xs uppercase leading-relaxed opacity-80">
              <p>Suas credenciais foram aceitas pelo sistema.</p>
              <p>Um link de confirmação foi enviado para:</p>
              <p className="text-white font-bold tracking-[0.1em]">{email}</p>
              <p className="opacity-40 text-[9px]">Verifique também sua caixa de spam.</p>
            </div>
            <div className="pt-8 w-1/2 mx-auto border-t border-crt-green/10">
              <div className="text-[8px] tracking-[1em] opacity-30">4 8 15 16 23 42</div>
            </div>
          </div>
        )}

        <div className="text-center">
          <div className="text-[8px] tracking-[2em] uppercase opacity-10 hover:opacity-100 transition-opacity cursor-default inline-block">
            NAMASTE
          </div>
        </div>
      </div>
    </div>
  );
}
