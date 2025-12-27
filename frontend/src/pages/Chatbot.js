import React, { useState, useRef, useEffect } from 'react';
import { chatbotAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { MessageSquare, Send, Bot, User, Loader2 } from 'lucide-react';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Magandang araw! Ako si BarangayBot, ang iyong AI assistant para sa Brgy Korokan. Paano kita matutulungan?\n\nMaaari mo akong tanungin tungkol sa:\n• Oras ng barangay office\n• Paano mag-submit ng emergency report\n• Mga uri ng alerts\n• Mga serbisyo ng barangay"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await chatbotAPI.query({
        message: userMessage,
        session_id: sessionId
      });
      
      setSessionId(response.data.session_id);
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Pasensya na, may problema sa koneksyon. Subukan ulit o tumawag sa barangay office."
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const quickQuestions = [
    "Anong oras bukas ang office?",
    "Paano mag-report ng emergency?",
    "Ano ang mga uri ng alerts?",
    "Saan ang barangay hall?"
  ];

  return (
    <div className="max-w-3xl mx-auto" data-testid="chatbot-page">
      <Card className="h-[calc(100vh-10rem)] flex flex-col shadow-xl animate-slide-up">
        <CardHeader className="border-b flex-shrink-0 py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
              <Bot className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-['Outfit']">BarangayBot</CardTitle>
              <p className="text-lg text-muted-foreground">AI Assistant - Handa akong tumulong!</p>
            </div>
          </div>
        </CardHeader>

        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-5 rounded-3xl ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted rounded-bl-none'
                  }`}
                >
                  <p className="text-lg whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-4 justify-start">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div className="bg-muted p-5 rounded-3xl rounded-bl-none">
                  <Loader2 className="w-7 h-7 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Questions - Senior Friendly Large Buttons */}
        {messages.length === 1 && (
          <div className="px-6 pb-4 flex flex-wrap gap-3">
            {quickQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="lg"
                className="text-base rounded-full h-12 px-5"
                onClick={() => {
                  setInput(question);
                  inputRef.current?.focus();
                }}
              >
                {question}
              </Button>
            ))}
          </div>
        )}

        <CardContent className="border-t p-6 flex-shrink-0">
          <form onSubmit={sendMessage} className="flex gap-4">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="I-type ang iyong tanong dito..."
              className="h-16 text-lg px-6"
              disabled={loading}
              data-testid="chat-input"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-16 w-16 rounded-2xl" 
              disabled={loading || !input.trim()}
              data-testid="chat-send"
            >
              <Send className="w-7 h-7" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
