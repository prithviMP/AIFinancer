import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWebSocket, type WebSocketMessage } from "@/hooks/useWebSocket";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { messages, isConnected, sendMessage } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim() && isConnected) {
      sendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ${
          isOpen ? 'bg-gray-600 hover:bg-gray-700' : 'bg-primary-600 hover:bg-primary-700 animate-pulse'
        }`}
      >
        {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-80 h-96 shadow-2xl transform transition-all duration-300">
          {/* Chat Header */}
          <CardHeader className="gradient-bg rounded-t-xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                  <Bot className="text-white" size={16} />
                </div>
                <div>
                  <h3 className="text-white font-medium">FinanceAI Assistant</h3>
                  <p className={`text-white/70 text-xs ${isConnected ? 'text-green-200' : 'text-red-200'}`}>
                    {isConnected ? 'Online' : 'Connecting...'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X size={14} />
              </Button>
            </div>
          </CardHeader>

          {/* Chat Messages */}
          <ScrollArea className="h-64 p-4">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-start space-x-2 ${msg.isFromBot ? '' : 'justify-end'}`}>
                  {msg.isFromBot && (
                    <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="text-primary-600" size={12} />
                    </div>
                  )}
                  <div className={`max-w-xs px-3 py-2 rounded-lg ${
                    msg.isFromBot 
                      ? 'bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white' 
                      : 'bg-primary-600 text-white'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  {!msg.isFromBot && (
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="text-white" size={12} />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <CardContent className="border-t border-gray-200 dark:border-dark-600 p-4">
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Ask about your documents..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!isConnected}
                className="flex-1 bg-gray-100 dark:bg-dark-700 border-0"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || !isConnected}
                size="sm"
                className="w-8 h-8 p-0"
              >
                <Send size={12} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
