import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth0 } from "@auth0/auth0-react";

// Types for conversations based on the backend schema
interface Conversation {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ConversationList {
  items: Conversation[];
  total: number;
  limit: number;
  offset: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_type: string;
  content: string;
  timestamp: string;
  claim_conversation_id?: string;
  claim_id?: string;
  analysis_id?: string;
}

// Hook to fetch conversations list
export function useConversations(limit: number = 50, offset: number = 0) {
  const { isAuthenticated } = useAuth0();
  
  return useQuery({
    queryKey: ["/api/conversations", { limit, offset }],
    queryFn: async (): Promise<ConversationList> => {
      const response = await apiRequest("GET", `/v1/conversations/?limit=${limit}&offset=${offset}`);
      return await response.json();
    },
    enabled: isAuthenticated, // Only run when authenticated
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to create a new conversation
export function useCreateConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (): Promise<Conversation> => {
      const response = await apiRequest("POST", "/v1/conversations/", {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });
}

// Hook to get messages for a specific conversation
export function useConversationMessages(conversationId: string | null) {
  const { isAuthenticated } = useAuth0();
  
  return useQuery({
    queryKey: ["/api/messages", conversationId],
    queryFn: async (): Promise<Message[]> => {
      if (!conversationId) return [];
      const response = await apiRequest("GET", `/v1/messages/?conversation_id=${conversationId}`);
      return await response.json();
    },
    enabled: !!conversationId && isAuthenticated, // Only run when authenticated and conversationId exists
    staleTime: 10 * 1000, // 10 seconds
  });
}

// Hook to create a message
export function useCreateMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      conversation_id: string;
      sender_type: string;
      content: string;
      claim_id?: string;
      analysis_id?: string;
    }): Promise<Message> => {
      const response = await apiRequest("POST", "/v1/messages/", data);
      return await response.json();
    },
    onSuccess: (newMessage) => {
      // Invalidate conversations list to update last message
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      // Invalidate specific conversation messages
      queryClient.invalidateQueries({ queryKey: ["/api/messages", newMessage.conversation_id] });
    },
  });
}

// Hook to update conversation status  
export function useUpdateConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { id: string; status: string }): Promise<Conversation> => {
      const response = await apiRequest("PUT", `/v1/conversations/${data.id}`, { status: data.status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });
}