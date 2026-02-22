import { useState, useEffect, useRef } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Send } from "lucide-react";

function ConversationList() {
  const [, setLocation] = useLocation();

  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: connections = [] } = useQuery<any[]>({
    queryKey: ["/api/connections"],
  });

  return (
    <div className="flex flex-col w-full max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setLocation("/")} className="text-white" data-testid="button-back">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-['Aclonica',sans-serif] text-white text-xl md:text-2xl" data-testid="text-chat-title">Messages</h1>
      </div>

      {conversations.length === 0 && connections.length === 0 && (
        <p className="text-white/50 text-sm text-center py-8" data-testid="text-no-conversations">No conversations yet. Connect with someone to start chatting!</p>
      )}

      {conversations.length > 0 && (
        <div className="space-y-2 mb-4">
          {conversations.map((c: any) => (
            <button
              key={c.user.id}
              onClick={() => setLocation(`/chat/${c.user.id}`)}
              className="bg-white/10 rounded-xl p-4 flex items-center gap-3 w-full text-left hover:bg-white/20 transition-colors"
              data-testid={`conversation-${c.user.id}`}
            >
              {c.user.profileImageUrl ? (
                <img src={c.user.profileImageUrl} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                  {(c.user.firstName?.[0] || "?").toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{c.user.firstName} {c.user.lastName}</p>
                <p className="text-white/50 text-xs truncate">{c.lastMessage.content}</p>
              </div>
              <span className="text-white/30 text-xs">
                {new Date(c.lastMessage.createdAt).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      )}

      {connections.length > 0 && (
        <>
          <h3 className="text-white/60 text-xs uppercase tracking-wider mb-2 mt-4">Connections</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {connections.map((c: any) => (
              <button
                key={c.id}
                onClick={() => setLocation(`/chat/${c.id}`)}
                className="flex flex-col items-center gap-1 min-w-[60px]"
                data-testid={`quick-chat-${c.id}`}
              >
                {c.profileImageUrl ? (
                  <img src={c.profileImageUrl} alt="" className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                    {(c.firstName?.[0] || "?").toUpperCase()}
                  </div>
                )}
                <span className="text-white/70 text-[10px] truncate max-w-[60px]">{c.firstName}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ChatThread({ userId }: { userId: string }) {
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ["/api/messages", userId],
    refetchInterval: 3000,
  });

  const { data: connections = [] } = useQuery<any[]>({
    queryKey: ["/api/connections"],
  });
  const otherUser = connections.find((c: any) => c.id === userId);

  const sendMsg = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/messages", { receiverId: userId, content: message });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sorted = [...messages].reverse();

  return (
    <div className="flex flex-col w-full max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-2xl h-[calc(100vh-200px)]">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setLocation("/chat")} className="text-white" data-testid="button-back-chat">
          <ArrowLeft className="w-6 h-6" />
        </button>
        {otherUser && (
          <div className="flex items-center gap-2">
            {otherUser.profileImageUrl ? (
              <img src={otherUser.profileImageUrl} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                {(otherUser.firstName?.[0] || "?").toUpperCase()}
              </div>
            )}
            <span className="text-white font-medium" data-testid="text-chat-user">{otherUser.firstName} {otherUser.lastName}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {sorted.map((msg: any) => {
          const isMe = msg.senderId === currentUser?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`} data-testid={`message-${msg.id}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe ? "bg-[#34e916] text-black" : "bg-white/20 text-white"}`}>
                <p className="text-sm">{msg.content}</p>
                <p className="text-[10px] opacity-50 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <Input
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && message.trim() && sendMsg.mutate()}
          placeholder="Type a message..."
          className="bg-white text-black border-none h-[42px] flex-1"
          data-testid="input-message"
        />
        <Button
          onClick={() => message.trim() && sendMsg.mutate()}
          disabled={!message.trim() || sendMsg.isPending}
          className="bg-[#34e916] text-black h-[42px] px-4"
          data-testid="button-send"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function ChatPage() {
  const params = useParams<{ userId?: string }>();

  return (
    <PageLayout>
      {params.userId ? <ChatThread userId={params.userId} /> : <ConversationList />}
    </PageLayout>
  );
}
