import { useState, useEffect } from 'react';
import { useChatSessions, useChatHistory, useSendMessage, useCreateChatSession } from '@/hooks/useChat';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Plus, Trash2, Bot, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingOverlay } from '@/components/business/LoadingOverlay';
import { EmptyState } from '@/components/ui/empty-state';

export default function ChatPage() {
  const { toast } = useToast();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const { data: sessions, isLoading: sessionsLoading } = useChatSessions();
  const { data: messages, isLoading: messagesLoading } = useChatHistory(selectedSessionId);
  const sendMessageMutation = useSendMessage();
  const createSessionMutation = useCreateChatSession();

  const isLoading = sessionsLoading || messagesLoading;

  // Auto-select first session if none selected
  useEffect(() => {
    if (sessions?.length && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedSessionId) return;

    const messageData = {
      content: message.trim(),
      session_id: selectedSessionId,
      is_from_user: true,
    };

    try {
      setIsTyping(true);
      await sendMessageMutation.mutateAsync(messageData);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      const newSession = await createSessionMutation.mutateAsync();
      setSelectedSessionId(newSession.id);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const selectedSession = sessions?.find(s => s.id === selectedSessionId);

  return (
    <Layout>
      <div className="container mx-auto max-w-7xl h-[calc(100vh-4rem)]">
        <div className="flex h-full gap-6">
          {/* Sessions sidebar */}
          <div className="w-80 flex flex-col">
            <Card className="flex-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Chat Sessions
                  </CardTitle>
                  <Button size="sm" onClick={handleCreateSession}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sessions?.length ? (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedSessionId === session.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedSessionId(session.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              Session {session.id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={session.is_active ? "default" : "secondary"}>
                            {session.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={MessageSquare}
                    title="No chat sessions"
                    description="Create a new session to start chatting"
                    action={{
                      label: "Create Session",
                      onClick: handleCreateSession,
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat interface */}
          <div className="flex-1 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  {selectedSession ? `Chat Session ${selectedSession.id.slice(0, 8)}` : 'Select a session'}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {selectedSessionId ? (
                  <>
                    {/* Messages area */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                      <LoadingOverlay isLoading={messagesLoading} loadingText="Loading messages...">
                        {messages?.length ? (
                          <div className="space-y-4">
                            {messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.is_from_user ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                    msg.is_from_user
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    {msg.is_from_user ? (
                                      <User className="h-4 w-4" />
                                    ) : (
                                      <Bot className="h-4 w-4" />
                                    )}
                                    <span className="text-xs opacity-70">
                                      {formatTime(msg.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-sm">{msg.content}</p>
                                </div>
                              </div>
                            ))}
                            {isTyping && (
                              <div className="flex justify-start">
                                <div className="bg-muted px-4 py-2 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <Bot className="h-4 w-4" />
                                    <span className="text-sm">AI is typing...</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <EmptyState
                            icon={MessageSquare}
                            title="No messages yet"
                            description="Start a conversation with the AI assistant"
                          />
                        )}
                      </LoadingOverlay>
                    </div>

                    {/* Message input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isTyping}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || isTyping}
                        size="sm"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon={MessageSquare}
                    title="No session selected"
                    description="Select a chat session or create a new one"
                    action={{
                      label: "Create Session",
                      onClick: handleCreateSession,
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
