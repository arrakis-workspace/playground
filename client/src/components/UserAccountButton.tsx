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
import { User, LogOut, LayoutDashboard, UserCircle, Building2 } from "lucide-react";
import { useLocation } from "wouter";

export function UserAccountButton() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();

  if (!isAuthenticated || !user) {
    return (
      <a href="/login" data-testid="button-login">
        <Button variant="outline" size="sm" className="gap-2">
          <User className="w-4 h-4" />
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
          variant="ghost"
          size="sm"
          className="gap-2 hover:bg-muted"
          data-testid="button-user-menu"
        >
          <Avatar className="h-7 w-7">
            {user.profileImageUrl && (
              <AvatarImage src={user.profileImageUrl} alt={displayName} />
            )}
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm font-medium text-foreground">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {location !== "/" && (
          <DropdownMenuItem
            onClick={() => setLocation("/")}
            data-testid="menu-item-dashboard"
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => setLocation("/profile-setup")}
          data-testid="menu-item-settings"
        >
          <UserCircle className="w-4 h-4 mr-2" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocation("/company")}
          data-testid="menu-item-company"
        >
          <Building2 className="w-4 h-4 mr-2" />
          Company
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
