import { useState, useRef, useEffect } from 'react';
import { apiGet, apiPost } from '../lib/api';

export default function ChatAnonimo({ token }) {
  const [activeTab, setActiveTab] = useState('amigo'); // 'amigo' | 'admirador'
  const [messages, setMessages] = useState({ amigo: [], admirador: [] });
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '...';
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const res = await apiGet(`/chat_get.php?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.error('Erro ao buscar mensagens do chat', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    const timer = setInterval(loadMessages, 5000);
    return () => clearInterval(timer);
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTab]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      const res = await apiPost('/chat_send.php', {
        token,
        channel: activeTab,
        texto: textToSend
      });

      if (res.ok) {
        setMessages(prev => ({
          ...prev,
          [activeTab]: [...prev[activeTab], res.message]
        }));
      }
    } catch (err) {
      console.error('Falha ao enviar mensagem', err);
    }
  };

  const currentMessages = messages[activeTab];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--color-nb-bg)', fontFamily: 'var(--font-nb)' }}
    >
      {/* Header */}
      <header className="nb-header">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl">redeem</span>
          <h1 className="text-[1.75rem] leading-tight font-black text-primary italic" style={{ fontFamily: 'var(--font-nb)' }}>
            AmigoSecreto
          </h1>
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-(--color-nb-ink) overflow-hidden bg-surface-container-highest flex items-center justify-center">
          <span className="material-symbols-outlined text-on-surface-variant">person</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col max-w-[600px] mx-auto w-full px-5 pt-6 pb-24">

        {/* Seletor de tabs */}
        <div className="flex gap-2 mb-6">
          <button
            className={`flex-1 py-3 px-4 text-sm font-extrabold border-2 border-(--color-nb-ink) rounded-xl transition-all ${
              activeTab === 'amigo'
                ? 'bg-tertiary-container text-on-tertiary-container nb-shadow nb-press'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
            onClick={() => setActiveTab('amigo')}
          >
            Para: Meu Amigo
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-extrabold border-2 border-(--color-nb-ink) rounded-xl transition-all ${
              activeTab === 'admirador'
                ? 'bg-tertiary-container text-on-tertiary-container nb-shadow nb-press'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
            onClick={() => setActiveTab('admirador')}
          >
            De: Quem me tirou
          </button>
        </div>

        {/* Área de chat */}
        <div className="flex-1 flex flex-col bg-white border-2 border-(--color-nb-ink) rounded-xl nb-shadow overflow-hidden relative" style={{ minHeight: '400px', maxHeight: '60vh' }}>
          {/* Padrão de fundo */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(var(--color-primary-container) 0.5px, transparent 0.5px), radial-gradient(var(--color-secondary-container) 0.5px, var(--color-nb-bg) 0.5px)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 10px 10px',
            }}
          />

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10">
            {/* Indicador de data */}
            <div className="flex justify-center mb-2">
              <span className="bg-surface-container border-2 border-(--color-nb-ink) px-3 py-1 rounded-full text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Hoje
              </span>
            </div>

            {loading && (
              <p className="text-center text-sm font-semibold text-on-surface-variant animate-pulse">Carregando mensagens...</p>
            )}

            {currentMessages.map((msg) => {
              const isMe = msg.role === 'Você';
              const isSystem = msg.role === 'Sistema';

              if (isSystem) {
                return (
                  <div key={msg.id} className="text-center text-[10px] text-on-surface-variant/50 tracking-widest font-bold my-4 uppercase">
                    — {msg.texto} —
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${isMe ? 'ml-auto' : ''}`}>
                  {isMe ? (
                    <div className="bg-primary text-on-primary border-2 border-(--color-nb-ink) p-4 rounded-t-2xl rounded-bl-2xl relative"
                      style={{ boxShadow: '-4px 4px 0px 0px var(--color-nb-ink)' }}>
                      <div className="absolute -top-3 -right-2 text-primary-container" style={{ animation: 'nb-float 3s ease-in-out infinite' }}>
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>grade</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ wordBreak: 'break-word' }}>{msg.texto}</p>
                    </div>
                  ) : (
                    <div className="bg-secondary-container text-on-secondary-container border-2 border-(--color-nb-ink) p-4 rounded-t-2xl rounded-br-2xl nb-shadow relative">
                      <div className="absolute -top-3 -left-2 text-secondary" style={{ animation: 'nb-float 3s ease-in-out infinite' }}>
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>grade</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ wordBreak: 'break-word' }}>{msg.texto}</p>
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-on-surface-variant mt-1 mx-1">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              );
            })}

            {currentMessages.length === 0 && !loading && (
              <div className="text-center py-8 space-y-2">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/30" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                <p className="text-sm font-bold text-on-surface-variant/50">Nenhuma mensagem ainda. Seja o primeiro!</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input de mensagem */}
          <div className="p-4 bg-surface-container-low border-t-2 border-(--color-nb-ink)">
            <form onSubmit={handleSend} className="flex gap-2 items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escreva sua mensagem..."
                className="nb-input flex-1 p-4 rounded-xl text-sm text-on-surface nb-shadow-sm"
                autoComplete="off"
              />
              <button
                type="submit"
                className="bg-primary text-on-primary border-2 border-(--color-nb-ink) p-4 rounded-xl flex items-center justify-center nb-shadow nb-press transition-all hover:bg-primary-container disabled:opacity-40"
                disabled={!inputText.trim()}
              >
                <span className="hidden sm:inline text-sm font-black mr-2 uppercase">ENVIAR</span>
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Botão voltar para revelação */}
        <div className="mt-8 flex justify-center">
          <button
            className="flex items-center gap-2 text-sm font-extrabold border-2 border-(--color-nb-ink) bg-white px-6 py-3 rounded-full nb-shadow nb-press transition-all hover:bg-surface-container-high"
            onClick={() => { window.location.href = `/reveal?token=${token}`; }}
          >
            <span className="material-symbols-outlined">celebration</span>
            Voltar para Revelação
          </button>
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="nb-bottom-nav">
        <div className="flex flex-col items-center text-on-surface-variant px-4 py-1 cursor-pointer hover:bg-surface-container-highest rounded-xl transition-colors">
          <span className="material-symbols-outlined">group</span>
          <span className="text-xs font-bold">Groups</span>
        </div>
        <div className="flex flex-col items-center bg-secondary-container text-on-secondary-container rounded-xl border-2 border-(--color-nb-ink) px-4 py-1 nb-shadow-sm">
          <span className="material-symbols-outlined">chat_bubble</span>
          <span className="text-xs font-bold">Messages</span>
        </div>
        <div className="flex flex-col items-center text-on-surface-variant px-4 py-1 cursor-pointer hover:bg-surface-container-highest rounded-xl transition-colors">
          <span className="material-symbols-outlined">celebration</span>
          <span className="text-xs font-bold">Reveal</span>
        </div>
        <div className="flex flex-col items-center text-on-surface-variant px-4 py-1 cursor-pointer hover:bg-surface-container-highest rounded-xl transition-colors">
          <span className="material-symbols-outlined">person</span>
          <span className="text-xs font-bold">Profile</span>
        </div>
      </nav>
    </div>
  );
}
