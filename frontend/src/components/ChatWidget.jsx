import { useEffect, useRef, useState } from 'react';
import api, { errorMessage } from '../api/axios.js';

const GREETING = 'Hi! I can help with your orders: status, delivery dates, payments and cancellations. What would you like to know?';
const SUGGESTIONS = ['Where is my latest order?', 'When will it arrive?', 'How do I pay for an unpaid order?'];

// Floating order-help chat powered by an LLM on the server (/api/chat).
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async (text) => {
    const message = text.trim();
    if (!message || busy) return;
    const history = messages
      .slice(1)
      .filter((m) => !m.error)
      .slice(-10)
      .map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: 'user', content: message }]);
    setInput('');
    setBusy(true);
    try {
      const { data } = await api.post('/chat', { message, history });
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: errorMessage(e), error: true }]);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button className="chat__fab" onClick={() => setOpen(true)} aria-label="Open order assistant">
        Order help
      </button>
    );
  }

  return (
    <section className="chat" aria-label="Order assistant">
      <header className="chat__head">
        <strong>Order assistant</strong>
        <button onClick={() => setOpen(false)} aria-label="Close chat">×</button>
      </header>
      <div className="chat__log" aria-live="polite">
        {messages.map((m, i) => (
          <p key={i} className={`chat__msg chat__msg--${m.role} ${m.error ? 'chat__msg--error' : ''}`}>{m.content}</p>
        ))}
        {busy && <p className="chat__msg chat__msg--assistant chat__typing">Thinking…</p>}
        <div ref={endRef} />
      </div>
      {messages.length === 1 && (
        <div className="chat__chips">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}
      <form
        className="chat__form"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input value={input} maxLength={600} onChange={(e) => setInput(e.target.value)} placeholder="Ask about an order" aria-label="Your message" />
        <button className="btn" disabled={busy || !input.trim()}>Send</button>
      </form>
    </section>
  );
}
