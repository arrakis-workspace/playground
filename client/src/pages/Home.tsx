import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings } from "lucide-react";
import { useLocation } from "wouter";

function UserAccountButton() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated || !user) {
    return (
      <a href="/api/login" data-testid="button-login">
        <Button variant="outline" className="text-white border-white/30 bg-white/10">
          <User className="w-5 h-5 mr-2" />
          <span>Login</span>
        </Button>
      </a>
    );
  }

  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((n) => n!.charAt(0).toUpperCase())
    .join("");
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="text-white border-white/30 bg-white/10 gap-2"
          data-testid="button-user-menu"
        >
          <Avatar className="h-7 w-7">
            {user.profileImageUrl && (
              <AvatarImage src={user.profileImageUrl} alt={displayName} />
            )}
            <AvatarFallback className="text-xs bg-white/20 text-white">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => setLocation("/profile-setup")}
          data-testid="menu-item-settings"
        >
          <Settings className="w-4 h-4 mr-2" />
          Account Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          data-testid="menu-item-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Home() {
  return (
    <div className="bg-[#2e99e7] w-full min-h-screen flex flex-col">
      <header className="flex flex-wrap items-center justify-end gap-2 px-4 py-3 sm:px-6">
        <UserAccountButton />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
        <div className="flex flex-col items-center gap-4">
          <img
            className="w-[100px] h-[100px] md:w-[125px] md:h-[125px]"
            alt="Playground logo"
            src="/figmaAssets/frame.svg"
            data-testid="img-logo"
          />
          <h1
            className="font-['Aclonica',sans-serif] text-[#34e916] text-4xl md:text-5xl"
            data-testid="text-app-name"
          >
            Playground
          </h1>
        </div>
      </main>
    </div>
  );
}
