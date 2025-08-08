import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatRepository, type SendMessageRequest } from "@/repositories/chatRepository";
import { useToast } from "@/hooks/use-toast";

export function useChatSessions() {
  return useQuery({
    queryKey: ['chat', 'sessions'],
    queryFn: () => chatRepository.getChatSessions(),
    staleTime: 30000, // 30 seconds
  });
}

export function useChatHistory(sessionId?: string) {
  return useQuery({
    queryKey: ['chat', 'history', sessionId],
    queryFn: () => chatRepository.getChatHistory(sessionId),
    enabled: !!sessionId,
    staleTime: 10000, // 10 seconds
  });
}

export function useCreateChatSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => chatRepository.createChatSession(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
      toast({
        title: "Session created",
        description: "New chat session has been created",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Session creation failed",
        description: error.message || "Failed to create chat session",
        variant: "destructive",
      });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (message: SendMessageRequest) => chatRepository.sendMessage(message),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'history', data.session_id] });
    },
    onError: (error: any) => {
      toast({
        title: "Message failed",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteChatSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (sessionId: string) => chatRepository.deleteChatSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
      toast({
        title: "Session deleted",
        description: "Chat session has been deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete chat session",
        variant: "destructive",
      });
    },
  });
}
