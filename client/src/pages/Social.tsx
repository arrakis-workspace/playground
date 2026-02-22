import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Search, UserPlus, Check, X, ArrowLeft, MessageCircle } from "lucide-react";

export function Social() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<"connections" | "requests" | "search">("connections");

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

  return (
    <PageLayout>
      <div className="flex flex-col w-full max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setLocation("/")} className="text-white" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-['Aclonica',sans-serif] text-white text-xl md:text-2xl" data-testid="text-social-title">Social</h1>
          {pendingRequests.length > 0 && (
            <span className="bg-[#34e916] text-black text-xs rounded-full px-2 py-0.5 font-bold">{pendingRequests.length}</span>
          )}
        </div>

        <div className="flex gap-2 mb-6">
          {(["connections", "requests", "search"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-['Roboto',Helvetica] capitalize transition-colors ${
                tab === t ? "bg-white text-black font-medium" : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
              data-testid={`tab-${t}`}
            >
              {t === "requests" && pendingRequests.length > 0 ? `Requests (${pendingRequests.length})` : t}
            </button>
          ))}
        </div>

        {tab === "search" && (
          <div className="flex gap-2 mb-4">
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search by name or handle..."
              className="bg-white text-black border-none h-[42px]"
              data-testid="input-search-users"
            />
            <Button onClick={handleSearch} variant="secondary" className="bg-white text-black h-[42px]" data-testid="button-search">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        )}

        {tab === "connections" && (
          <div className="space-y-3">
            {connections.length === 0 && (
              <p className="text-white/50 text-sm text-center py-8" data-testid="text-no-connections">No connections yet. Search for users to connect!</p>
            )}
            {connections.map((c: any) => (
              <div key={c.id} className="bg-white/10 rounded-xl p-4 flex items-center justify-between" data-testid={`connection-${c.id}`}>
                <div className="flex items-center gap-3">
                  {c.profileImageUrl ? (
                    <img src={c.profileImageUrl} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                      {(c.firstName?.[0] || "?").toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium text-sm">{c.firstName} {c.lastName}</p>
                    {c.handle && <p className="text-white/50 text-xs">@{c.handle}</p>}
                  </div>
                </div>
                <button onClick={() => setLocation(`/chat/${c.id}`)} className="text-[#34e916]" data-testid={`button-chat-${c.id}`}>
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "requests" && (
          <div className="space-y-3">
            {pendingRequests.length === 0 && (
              <p className="text-white/50 text-sm text-center py-8" data-testid="text-no-requests">No pending requests</p>
            )}
            {pendingRequests.map((p: any) => (
              <div key={p.id} className="bg-white/10 rounded-xl p-4 flex items-center justify-between" data-testid={`request-${p.id}`}>
                <div className="flex items-center gap-3">
                  {p.requester.profileImageUrl ? (
                    <img src={p.requester.profileImageUrl} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                      {(p.requester.firstName?.[0] || "?").toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium text-sm">{p.requester.firstName} {p.requester.lastName}</p>
                    {p.requester.handle && <p className="text-white/50 text-xs">@{p.requester.handle}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => acceptRequest.mutate(p.id)} className="bg-[#34e916] text-black rounded-full p-2" data-testid={`button-accept-${p.id}`}>
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => rejectRequest.mutate(p.id)} className="bg-white/20 text-white rounded-full p-2" data-testid={`button-reject-${p.id}`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "search" && searchResults.length > 0 && (
          <div className="space-y-3">
            {searchResults.map((u: any) => (
              <div key={u.id} className="bg-white/10 rounded-xl p-4 flex items-center justify-between" data-testid={`search-result-${u.id}`}>
                <div className="flex items-center gap-3">
                  {u.profileImageUrl ? (
                    <img src={u.profileImageUrl} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                      {(u.firstName?.[0] || "?").toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium text-sm">{u.firstName} {u.lastName}</p>
                    {u.handle && <p className="text-white/50 text-xs">@{u.handle}</p>}
                  </div>
                </div>
                <button
                  onClick={() => sendRequest.mutate(u.id)}
                  disabled={sendRequest.isPending}
                  className="bg-white/20 text-white rounded-full p-2 hover:bg-white/30"
                  data-testid={`button-connect-${u.id}`}
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
