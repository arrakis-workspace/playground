import { useState, useEffect, useRef } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function UserAvatar({ u, size = "md" }: { u: any; size?: "md" | "lg" }) {
  const s = size === "lg" ? "w-12 h-12" : "w-10 h-10";
  const ts = size === "lg" ? "text-sm" : "text-xs";
  if (u.profileImageUrl) return <img src={u.profileImageUrl} alt="" className={`${s} rounded-full object-cover`} />;
  return (
    <div className={`${s} rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold ${ts}`}>
      {(u.firstName?.[0] || "?").toUpperCase()}
    </div>
  );
}

function ConversationList() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: connections = [] } = useQuery<any[]>({
    queryKey: ["/api/connections"],
  });

  const deleteConversation = useMutation({
    mutationFn: async (otherUserId: string) => {
      await apiRequest("DELETE", `/api/conversations/${otherUserId}`);
    },
    onSuccess: (_, otherUserId) => {
      toast({ title: "Conversation deleted" });
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages", otherUserId] });
    },
    onError: () => {
      toast({ title: "Failed to delete conversation", variant: "destructive" });
    },
  });

  return (
    <div className="flex flex-col w-full max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
      <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight mb-6" data-testid="text-chat-title">Messages</h1>

      {conversations.length === 0 && connections.length === 0 && (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <p className="text-muted-foreground text-sm" data-testid="text-no-conversations">No conversations yet. Connect with someone to start chatting!</p>
        </div>
      )}

      {connections.filter((c: any) => !c.deleted).length > 0 && (
        <div className="mb-6">
          <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-3">Connections</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {connections.filter((c: any) => !c.deleted).map((c: any) => (
              <button
                key={c.id}
                onClick={() => setLocation(`/chat/${c.id}`)}
                className="flex flex-col items-center gap-1.5 min-w-[64px] hover:opacity-80 transition-opacity"
                data-testid={`quick-chat-${c.id}`}
              >
                <UserAvatar u={c} size="lg" />
                <span className="text-muted-foreground text-[11px] truncate max-w-[64px]">{c.firstName}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {conversations.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {conversations.map((c: any) => (
            <div
              key={c.user.id}
              className="bg-card rounded-xl border border-border p-4 flex items-center gap-3 w-full hover:border-primary/30 hover:shadow-sm transition-all"
              data-testid={`conversation-${c.user.id}`}
            >
              <button
                onClick={() => setLocation(`/chat/${c.user.id}`)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
                data-testid={`button-open-chat-${c.user.id}`}
              >
                <UserAvatar u={c.user} />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium text-sm">{c.user.firstName} {c.user.lastName}</p>
                  <p className="text-muted-foreground text-xs truncate">{c.lastMessage.content}</p>
                </div>
                <span className="text-muted-foreground/60 text-xs shrink-0">
                  {new Date(c.lastMessage.createdAt).toLocaleDateString()}
                </span>
              </button>
              <button
                onClick={() => setDeleteTarget({ id: c.user.id, name: `${c.user.firstName} ${c.user.lastName}` })}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                data-testid={`button-delete-conversation-${c.user.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all messages with {deleteTarget?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteConversation.isPending} data-testid="button-cancel-delete-chat">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteConversation.mutate(deleteTarget.id)}
              disabled={deleteConversation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-chat"
            >
              {deleteConversation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    <div className="flex flex-col w-full max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-3xl h-[calc(100vh-200px)]">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
        <button onClick={() => setLocation("/chat")} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back-chat">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {otherUser && (
          <div className="flex items-center gap-2.5">
            <UserAvatar u={otherUser} />
            <span className="text-foreground font-medium text-sm" data-testid="text-chat-user">{otherUser.firstName} {otherUser.lastName}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 mb-4">
        {sorted.map((msg: any) => {
          const isMe = msg.senderId === currentUser?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`} data-testid={`message-${msg.id}`}>
              <div className={`max-w-[65%] lg:max-w-[50%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                <p className="text-sm">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
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
          className="bg-card border-border h-11 rounded-xl flex-1 text-sm"
          data-testid="input-message"
        />
        <Button
          onClick={() => message.trim() && sendMsg.mutate()}
          disabled={!message.trim() || sendMsg.isPending}
          className="bg-primary text-primary-foreground h-11 px-4 rounded-xl"
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
