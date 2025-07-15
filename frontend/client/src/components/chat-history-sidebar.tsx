import { useState } from "react";
import { MessageCircle, Plus, Search, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useConversations, useCreateConversation } from "@/hooks/use-conversations";
import { formatDistanceToNow } from "date-fns";

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationSelect: (conversationId: string) => void;
  onNewChat: () => void;
  currentConversationId?: string;
}

export default function ChatHistorySidebar({
  isOpen,
  onClose,
  onConversationSelect,
  onNewChat,
  currentConversationId
}: ChatHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: conversationsData, isLoading } = useConversations();
  const createConversationMutation = useCreateConversation();

  const conversations = conversationsData?.items || [];

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation =>
    // For now, filter by conversation ID since we don't have titles yet
    // In a real app, you'd filter by conversation title or first message
    conversation.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChat = async () => {
    try {
      const newConversation = await createConversationMutation.mutateAsync();
      onConversationSelect(newConversation.id);
      onNewChat();
    } catch (error) {
      console.error("Failed to create new conversation:", error);
    }
  };

  const getConversationPreview = (conversation: any) => {
    // Generate a more user-friendly conversation title
    const createdDate = new Date(conversation.created_at);
    const dateStr = createdDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `Chat from ${dateStr}`;
  };

  const getConversationTime = (conversation: any) => {
    try {
      return formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true });
    } catch {
      return "Unknown time";
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-80 bg-card shadow-xl border-r border-border flex flex-col",
        "fixed lg:relative h-screen z-50 transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-card-foreground">Chats</h2>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* New Chat Button */}
          <Button 
            onClick={handleNewChat}
            className="w-full mb-3"
            disabled={createConversationMutation.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search chats"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoading ? (
              <div className="space-y-2">
                {/* Loading skeleton */}
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-3 rounded-lg border border-border animate-pulse">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted/60 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted" />
                <p className="text-sm">
                  {searchQuery ? "No chats found" : "No chats yet"}
                </p>
                <p className="text-xs mt-1">
                  {searchQuery ? "Try a different search term" : "Start a new conversation"}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => onConversationSelect(conversation.id)}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-all duration-200",
                      "border border-transparent group hover:shadow-sm",
                      currentConversationId === conversation.id 
                        ? "bg-accent border-accent-foreground shadow-sm" 
                        : "hover:bg-accent/50 hover:border-border"
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                          currentConversationId === conversation.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
                        )}>
                          <MessageCircle className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-card-foreground text-sm truncate">
                            {getConversationPreview(conversation)}
                          </h3>
                          <div className="flex items-center ml-2">
                            {conversation.status === "active" && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getConversationTime(conversation)}
                        </p>
                        {/* Conversation preview snippet */}
                        <p className="text-xs text-muted-foreground/60 mt-1 truncate">
                          Last activity: {conversation.status}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

      </aside>
    </>
  );
}