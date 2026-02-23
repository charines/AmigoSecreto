import { useState, useEffect } from 'react';
import { useTheme } from './contexts/ThemeContext';

const RetroTyping = () => {
  const { themeConfig } = useTheme();
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
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setQuotes(shuffled);
      })
      .catch(err => {
        console.error(err);
        setQuotes(["SYSTEM READY..."]);
      });
  }, []);

  useEffect(() => {
    if (quotes.length === 0) return;

    const handleTyping = () => {
      const i        = loopNum % quotes.length;
      const fullText = quotes[i];

      setDisplayText(
        isDeleting
          ? fullText.substring(0, displayText.length - 1)
          : fullText.substring(0, displayText.length + 1)
      );

      setTypingSpeed(isDeleting ? 40 : 100);

      if (!isDeleting && displayText === fullText) {
        setTimeout(() => setIsDeleting(true), 2500);
      } else if (isDeleting && displayText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, loopNum, typingSpeed, quotes]);

  return (
    <div className="mb-6 h-6 flex items-center text-[10px] text-terminal-green font-mono">
      {/* Prompt — changes per theme */}
      <span
        className="mr-2 text-terminal-green font-bold"
        style={{ fontFamily: 'var(--theme-display-font)' }}
      >
        {themeConfig.prompt}
      </span>
      <span className="tracking-widest">{displayText}</span>
      {/* Cursor */}
      <span
        className="w-2 h-4 bg-terminal-green ml-1 animate-blink"
        style={{ boxShadow: '0 0 6px var(--color-crt-green)' }}
      />
    </div>
  );
};

export default RetroTyping;
