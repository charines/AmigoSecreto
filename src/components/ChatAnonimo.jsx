import { useState, useRef, useEffect } from 'react';
import TerminalPanel from './TerminalPanel';
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
    // Inicia polling a cada 5s
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
    <TerminalPanel step="chat" showSteps={false}>
      <div className="flex flex-col h-[70vh] max-h-[600px] border border-terminal-green/30 bg-crt-panel rounded shadow-[0_0_15px_rgba(57,255,132,0.1)] overflow-hidden">
        
        {/* Header / Tabs */}
        <div className="flex border-b border-terminal-green/30 bg-crt-bg">
          <button
            onClick={() => setActiveTab('amigo')}
            className={`flex-1 py-3 text-xs tracking-widest uppercase transition-colors ${
              activeTab === 'amigo' 
                ? 'bg-terminal-green text-crt-bg font-bold shadow-[0_0_8px_var(--color-crt-green)]' 
                : 'text-terminal-green/50 hover:bg-terminal-green/10'
            }`}
          >
            Para: Meu Amigo Secreto
          </button>
          <button
            onClick={() => setActiveTab('admirador')}
            className={`flex-1 py-3 text-xs tracking-widest uppercase transition-colors border-l border-terminal-green/30 ${
              activeTab === 'admirador' 
                ? 'bg-terminal-green text-crt-bg font-bold shadow-[0_0_8px_var(--color-crt-green)]' 
                : 'text-terminal-green/50 hover:bg-terminal-green/10'
            }`}
          >
            De: Quem me tirou
          </button>
        </div>

        {/* Status Line */}
        <div className="p-2 border-b border-terminal-green/10 text-[10px] uppercase tracking-widest text-terminal-green/40 bg-crt-bg flex justify-between">
          <span>PROTOCOLO: SECURE_CHAT_V1</span>
          <span>STATUS: ONLINE</span>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono">
          {currentMessages.map((msg) => {
            const isMe = msg.role === 'Você';
            const isSystem = msg.role === 'Sistema';
            
            if (isSystem) {
              return (
                <div key={msg.id} className="text-center text-[10px] text-terminal-green/40 tracking-widest my-4">
                  --- {msg.texto} ---
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isMe ? 'text-terminal-green' : 'text-crt-amber'}`}>
                    {msg.role}
                  </span>
                  <span className="text-[9px] text-terminal-green/30">
                    [{formatTime(msg.timestamp)}]
                  </span>
                </div>
                <div 
                  className={`p-3 max-w-[85%] text-sm rounded-sm ${
                    isMe 
                      ? 'bg-terminal-green/10 border border-terminal-green/40 text-terminal-green' 
                      : 'bg-crt-amber/10 border border-crt-amber/40 text-crt-amber'
                  }`}
                  style={{ wordBreak: 'break-word' }}
                >
                  {msg.texto}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-terminal-green/30 bg-crt-bg">
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite sua mensagem anônima..."
              className="crt-input flex-1 p-3 text-sm placeholder-terminal-green/30"
              autoComplete="off"
            />
            <button 
              type="submit" 
              className="crt-btn !w-auto px-6"
              disabled={!inputText.trim()}
            >
              ENVIAR
            </button>
          </form>
        </div>
      </div>
      
      <div className="mt-4 flex justify-center">
        <button
          onClick={() => {
            window.location.href = `/reveal?token=${token}`;
          }}
          className="text-[10px] text-terminal-green/50 hover:text-terminal-green tracking-widest uppercase transition-colors"
        >
          &lt; VOLTAR PARA REVELAÇÃO
        </button>
      </div>

    </TerminalPanel>
  );
}
