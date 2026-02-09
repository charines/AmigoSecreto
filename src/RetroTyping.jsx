import { useState, useEffect } from 'react';

const RetroTyping = () => {
  const [quotes, setQuotes] = useState([]);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);

  // Carrega as frases do arquivo JSON na pasta public
  useEffect(() => {
    fetch('/quotes.json')
      .then(res => {
        if (!res.ok) throw new Error("Erro ao carregar banco de frases");
        return res.json();
      })
      .then(data => {
        // Embaralha para que cada sessão comece com uma frase diferente
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setQuotes(shuffled);
      })
      .catch(err => {
        console.error(err);
        setQuotes(["C:\\> SYSTEM READY..."]);
      });
  }, []);

  useEffect(() => {
    if (quotes.length === 0) return;

    const handleTyping = () => {
      const i = loopNum % quotes.length;
      const fullText = quotes[i];

      setDisplayText(
        isDeleting 
          ? fullText.substring(0, displayText.length - 1) 
          : fullText.substring(0, displayText.length + 1)
      );

      // Velocidade: apagar (delete) é mais rápido que escrever
      setTypingSpeed(isDeleting ? 40 : 100);

      if (!isDeleting && displayText === fullText) {
        setTimeout(() => setIsDeleting(true), 2500); // Pausa ao terminar frase
      } else if (isDeleting && displayText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1); // Próxima frase
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, loopNum, typingSpeed, quotes]);

  return (
    <div className="mb-6 h-6 flex items-center text-[10px] text-terminal-green font-mono">
      {/* Prompt estilo DOS */}
      <span className="mr-2 text-terminal-green font-bold">C:\&gt;</span>
      <span className="tracking-widest">{displayText}</span>
      {/* Cursor clássico do DOS */}
      <span className="w-2 h-4 bg-terminal-green ml-1 animate-pulse shadow-[0_0_5px_#4ade80]"></span>
    </div>
  );
};

export default RetroTyping;