import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, User, RefreshCw } from 'lucide-react';

export default function EcoBuddy({ userId }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `### 🌿 Welcome to EcoBuddy!
I am your personal AI sustainability coach. I track your habits, location context, and carbon logs to give you actionable advice.

Click a suggestion below or type your own question to start!`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestions = [
    "Why did my electric bill go up?",
    "How can I reduce food waste?",
    "Suggestions for a green commute",
    "Forecast my carbon footprint next month"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    if (!textToSend) setInput('');

    // Add user message
    const userMsg = { role: 'user', content: query, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, user_id: userId })
      });
      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply, timestamp: new Date() }
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "❌ Sorry, I encountered an issue connecting to the AI services. Please verify your connection or try again shortly.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple Markdown Renderer
  const renderMessageContent = (content) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-md font-bold text-white mt-3 mb-1 font-display">{line.substring(4)}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="text-lg font-bold text-white mt-4 mb-2 font-display">{line.substring(3)}</h3>;
      }
      
      // Bullet points
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const itemText = line.trim().substring(2);
        return (
          <ul key={idx} className="list-disc list-inside pl-2 py-0.5 text-slate-300 text-sm">
            <li>{parseBoldText(itemText)}</li>
          </ul>
        );
      }

      // Numbered lists
      const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <ol key={idx} className="list-decimal list-inside pl-2 py-0.5 text-slate-300 text-sm">
            <li>{parseBoldText(numMatch[2])}</li>
          </ol>
        );
      }

      // Default paragraph
      if (line.trim() === '') return <div key={idx} className="h-2"></div>;
      
      return <p key={idx} className="text-slate-300 text-sm leading-relaxed my-1">{parseBoldText(line)}</p>;
    });
  };

  const parseBoldText = (text) => {
    // Basic bold parser **text**
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-semibold text-eco-accent-mint">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="glass-card rounded-2xl border-white/10 flex flex-col h-[520px] overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-eco-accent-green/20 text-eco-accent-mint rounded-lg">
            <Sparkles className="w-5 h-5 animate-pulse-slow" />
          </div>
          <div>
            <span className="font-bold text-white block text-sm">EcoBuddy Coach</span>
            <span className="text-xxs text-eco-accent-mint flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-eco-accent-green mr-1 inline-block animate-ping"></span>
              AI Advisor Online
            </span>
          </div>
        </div>
        
        <button 
          onClick={() => {
            setMessages([
              {
                role: 'assistant',
                content: `### 🌿 Chat reset!
Ask me anything about your current carbon footprint or how to lower emissions.`,
                timestamp: new Date()
              }
            ]);
          }}
          title="Clear Chat"
          className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex items-start space-x-3 max-w-[85%] ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`p-2 rounded-lg flex-shrink-0 ${
              msg.role === 'user' ? 'bg-eco-accent-cyan/20 text-eco-accent-cyan' : 'bg-eco-accent-green/20 text-eco-accent-mint'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
            </div>

            <div className={`p-3.5 rounded-2xl border text-slate-200 ${
              msg.role === 'user' 
                ? 'bg-eco-bg-input border-eco-accent-cyan/20 rounded-tr-none' 
                : 'bg-white/5 border-white/15 rounded-tl-none'
            }`}>
              {msg.role === 'user' ? (
                <p className="text-sm font-medium">{msg.content}</p>
              ) : (
                renderMessageContent(msg.content)
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start space-x-3 max-w-[80%]">
            <div className="p-2 bg-eco-accent-green/20 text-eco-accent-mint rounded-lg">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/15 rounded-tl-none flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-eco-accent-mint animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 rounded-full bg-eco-accent-mint animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 rounded-full bg-eco-accent-mint animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length === 1 && (
        <div className="p-3 bg-white/5 border-t border-white/5 flex flex-wrap gap-1.5 justify-center">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(s)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xxs font-medium text-slate-300 hover:text-white transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Form Input */}
      <div className="p-3 border-t border-white/10 bg-white/5 flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask EcoBuddy a question..."
          className="flex-1 px-4 py-2 bg-eco-bg-input border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-eco-accent-green placeholder-slate-500"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={isLoading || !input.trim()}
          className="p-2.5 bg-eco-accent-green hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-900 font-bold rounded-xl shadow-lg transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
