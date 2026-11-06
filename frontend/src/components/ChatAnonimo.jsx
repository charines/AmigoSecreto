import { useState, useRef, useEffect, useMemo } from 'react';
import { apiGet, apiPost } from '../lib/api';
import { mergeChannels } from '../lib/chatMerge';

export default function ChatAnonimo({ token }) {
  const [messages, setMessages] = useState({ amigo: [], admirador: [] });
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null); // null | 'amigo' | 'admirador'
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
      const res = await apiGet(`/api/chat?token=${encodeURIComponent(token)}`);
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

  const unifiedMessages = useMemo(() => mergeChannels(messages), [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [unifiedMessages]);

  const handleSend = async (channel) => {
    if (!inputText.trim() || sending === channel) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(channel);

    try {
      const res = await apiPost('/api/chat', {
        token,
        channel,
        texto: textToSend
      });

      if (res.ok) {
        setMessages(prev => ({
          ...prev,
          [channel]: [...prev[channel], res.message]
        }));
      }
    } catch (err) {
      console.error('Falha ao enviar mensagem', err);
    } finally {
      setSending(null);
    }
  };

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

            {unifiedMessages.map((msg) => {
              const isMe = msg.role === 'Você';
              const isSystem = msg.role === 'Sistema';

              if (isSystem) {
                return (
                  <div key={msg.key} className="text-center text-[10px] text-on-surface-variant/50 tracking-widest font-bold my-4 uppercase">
                    — {msg.texto} —
                  </div>
                );
              }

              const channelLabel = msg.channel === 'amigo' ? 'Amigo Secreto' : 'Admirador Secreto';
              const channelAccent = msg.channel === 'amigo' ? 'var(--color-primary)' : 'var(--color-secondary)';

              return (
                <div key={msg.key} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${isMe ? 'ml-auto' : ''}`}>
                  <span
                    className="text-[9px] font-black uppercase tracking-wider mb-1 mx-1 px-2 py-0.5 rounded-full border-2"
                    style={{ color: channelAccent, borderColor: channelAccent }}
                  >
                    {isMe ? `Para: ${channelLabel}` : `De: ${channelLabel}`}
                  </span>
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

            {unifiedMessages.filter(m => m.role !== 'Sistema').length === 0 && !loading && (
              <div className="text-center py-8 space-y-2">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/30" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                <p className="text-sm font-bold text-on-surface-variant/50">Nenhuma mensagem ainda. Seja o primeiro!</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input de mensagem */}
          <div className="p-4 bg-surface-container-low border-t-2 border-(--color-nb-ink) flex flex-col gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escreva sua mensagem..."
              className="nb-input w-full p-4 rounded-xl text-sm text-on-surface nb-shadow-sm"
              autoComplete="off"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSend('amigo')}
                disabled={!inputText.trim() || sending === 'amigo'}
                className="flex-1 bg-primary text-on-primary border-2 border-(--color-nb-ink) py-3 px-3 rounded-xl flex items-center justify-center gap-2 nb-shadow nb-press transition-all hover:bg-primary-container disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-lg">send</span>
                <span className="text-xs sm:text-sm font-black uppercase">Para quem eu tirei</span>
              </button>
              <button
                type="button"
                onClick={() => handleSend('admirador')}
                disabled={!inputText.trim() || sending === 'admirador'}
                className="flex-1 bg-secondary-container text-on-secondary-container border-2 border-(--color-nb-ink) py-3 px-3 rounded-xl flex items-center justify-center gap-2 nb-shadow nb-press transition-all hover:bg-secondary disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-lg">send</span>
                <span className="text-xs sm:text-sm font-black uppercase">Para quem me tirou</span>
              </button>
            </div>
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
