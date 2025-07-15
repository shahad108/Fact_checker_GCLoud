import { User, Settings, HelpCircle, LogOut, ChevronDown, Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth0 } from "@auth0/auth0-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface AccountPopupProps {
  theme?: 'light' | 'dark' | 'system';
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
}

export default function AccountPopup({ theme = 'system', onThemeChange }: AccountPopupProps) {
  const { user, logout } = useAuth0();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      logout({ logoutParams: { returnTo: window.location.origin } });
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFeedbackHistory = () => {
    setLocation('/feedback-history');
  };

  const handleSettings = () => {
    // TODO: Implement settings page
    toast({
      title: "Settings",
      description: "Settings page coming soon!",
    });
  };

  const handleHelp = () => {
    // TODO: Implement help/support
    toast({
      title: "Help",
      description: "Help center coming soon!",
    });
  };

  const handleUpgrade = () => {
    // TODO: Implement upgrade flow
    toast({
      title: "Upgrade Plan",
      description: "Upgrade options coming soon!",
    });
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    return user?.name || user?.email?.split('@')[0] || 'User';
  };

  const getThemeIcon = (themeOption: string) => {
    switch (themeOption) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={user?.picture} 
              alt={getDisplayName()}
            />
            <AvatarFallback className="bg-blue-500 text-white font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-72" align="end" forceMount>
        {/* User Info Header */}
        <DropdownMenuLabel className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={user?.picture} 
                alt={getDisplayName()}
              />
              <AvatarFallback className="bg-blue-500 text-white font-semibold text-lg">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {getDisplayName()}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {/* Account Options */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleUpgrade} className="cursor-pointer">
            <div className="flex items-center justify-between w-full">
              <span>Upgrade plan</span>
              <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                Free
              </div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>

          {/* Theme Submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              {getThemeIcon(theme)}
              <span className="ml-2">Theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem 
                onClick={() => onThemeChange?.('light')}
                className="cursor-pointer"
              >
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onThemeChange?.('dark')}
                className="cursor-pointer"
              >
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onThemeChange?.('system')}
                className="cursor-pointer"
              >
                <Monitor className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem onClick={handleFeedbackHistory} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Feedback History</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Help */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleHelp} className="cursor-pointer">
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}