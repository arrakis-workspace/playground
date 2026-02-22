import { useState, useEffect } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Search, UserPlus, Check, X, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function Social() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<"connections" | "requests" | "search">("connections");

  useEffect(() => {
    apiRequest("POST", "/api/connections/mark-seen")
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/connections/unseen-count"] });
      })
      .catch(() => {});
  }, []);

  const { data: connections = [] } = useQuery<any[]>({
    queryKey: ["/api/connections"],
  });

  const { data: pendingRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/connections/pending"],
  });

  const { data: searchResults = [], refetch: searchUsers } = useQuery<any[]>({
    queryKey: ["/api/users/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: false,
  });

  const sendRequest = useMutation({
    mutationFn: async (receiverId: string) => {
      await apiRequest("POST", "/api/connections/request", { receiverId });
    },
    onSuccess: () => {
      toast({ title: "Connection request sent!" });
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
    },
    onError: (err: any) => {
      toast({ title: err.message || "Failed to send request", variant: "destructive" });
    },
  });

  const acceptRequest = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/connections/${id}/accept`);
    },
    onSuccess: () => {
      toast({ title: "Connection accepted!" });
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/pending"] });
    },
  });

  const rejectRequest = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/connections/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections/pending"] });
    },
  });

  const handleSearch = () => {
    if (searchQuery.length >= 2) searchUsers();
  };

  function UserAvatar({ u }: { u: any }) {
    if (u.profileImageUrl) return <img src={u.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />;
    return (
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
        {(u.firstName?.[0] || "?").toUpperCase()}
      </div>
    );
  }

  return (
    <PageLayout>
      <div className="flex flex-col w-full max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight" data-testid="text-social-title">
            @{user?.handle || "social"}
          </h1>
          {pendingRequests.length > 0 && (
            <span className="inline-flex items-center bg-amber-100 text-amber-700 text-xs font-medium rounded-full px-2.5 py-0.5 mt-1">
              {pendingRequests.length} pending
            </span>
          )}
        </div>

        <div className="flex gap-2 mb-5">
          {(["connections", "requests", "search"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                tab === t ? "bg-primary text-primary-foreground shadow-sm" : "bg-card text-muted-foreground border border-border hover:border-primary/30 hover:text-primary hover:bg-primary/5"
              }`}
              data-testid={`tab-${t}`}
            >
              {t === "requests" && pendingRequests.length > 0 ? `Requests (${pendingRequests.length})` : t}
            </button>
          ))}
        </div>

        {tab === "search" && (
          <div className="flex gap-2 mb-4 max-w-lg">
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search by name or handle..."
              className="bg-card border-border h-11 rounded-xl text-sm"
              data-testid="input-search-users"
            />
            <Button onClick={handleSearch} className="bg-primary text-primary-foreground h-11 rounded-xl px-4" data-testid="button-search">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {tab === "connections" && connections.length === 0 && (
            <div className="bg-card rounded-2xl border border-border p-8 text-center col-span-full">
              <p className="text-muted-foreground text-sm" data-testid="text-no-connections">No connections yet. Search for users to connect!</p>
            </div>
          )}
          {tab === "connections" && connections.map((c: any) => (
            <div key={c.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between hover:border-primary/30 hover:shadow-sm transition-all" data-testid={`connection-${c.id}`}>
              <div className="flex items-center gap-3">
                <UserAvatar u={c} />
                <div>
                  <p className="text-foreground font-medium text-sm">{c.firstName} {c.lastName}</p>
                  {c.handle && <p className="text-muted-foreground text-xs">@{c.handle}</p>}
                </div>
              </div>
              <button onClick={() => setLocation(`/chat/${c.id}`)} className="text-primary hover:text-primary/80 transition-colors" data-testid={`button-chat-${c.id}`}>
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>
          ))}

          {tab === "requests" && pendingRequests.length === 0 && (
            <div className="bg-card rounded-2xl border border-border p-8 text-center col-span-full">
              <p className="text-muted-foreground text-sm" data-testid="text-no-requests">No pending requests</p>
            </div>
          )}
          {tab === "requests" && pendingRequests.map((p: any) => (
            <div key={p.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between hover:border-primary/30 hover:shadow-sm transition-all" data-testid={`request-${p.id}`}>
              <div className="flex items-center gap-3">
                <UserAvatar u={p.requester} />
                <div>
                  <p className="text-foreground font-medium text-sm">{p.requester.firstName} {p.requester.lastName}</p>
                  {p.requester.handle && <p className="text-muted-foreground text-xs">@{p.requester.handle}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => acceptRequest.mutate(p.id)} className="bg-emerald-500 text-white rounded-full p-2 hover:bg-emerald-600 transition-colors" data-testid={`button-accept-${p.id}`}>
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => rejectRequest.mutate(p.id)} className="bg-muted text-muted-foreground rounded-full p-2 hover:bg-muted/80 transition-colors" data-testid={`button-reject-${p.id}`}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {tab === "search" && searchResults.map((u: any) => (
            <div key={u.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between hover:border-primary/30 hover:shadow-sm transition-all" data-testid={`search-result-${u.id}`}>
              <div className="flex items-center gap-3">
                <UserAvatar u={u} />
                <div>
                  <p className="text-foreground font-medium text-sm">{u.firstName} {u.lastName}</p>
                  {u.handle && <p className="text-muted-foreground text-xs">@{u.handle}</p>}
                </div>
              </div>
              <button
                onClick={() => sendRequest.mutate(u.id)}
                disabled={sendRequest.isPending}
                className="bg-primary/10 text-primary rounded-full p-2 hover:bg-primary/20 transition-colors"
                data-testid={`button-connect-${u.id}`}
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
