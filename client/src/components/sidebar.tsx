import { MessageCircle, History, Bookmark, TrendingUp, Upload, Download, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  userStats?: any;
}

export default function Sidebar({ isOpen, onClose, user, userStats }: SidebarProps) {
  const navItems = [
    { icon: MessageCircle, label: "Fact Check", active: true },
    { icon: History, label: "History", count: userStats?.totalClaims || 0 },
    { icon: Bookmark, label: "Saved", count: userStats?.savedClaims || 0 },
    { icon: TrendingUp, label: "Analytics" },
  ];

  const quickActions = [
    { icon: Upload, label: "Bulk Upload" },
    { icon: Download, label: "Export Report" },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-80 bg-white shadow-xl border-r border-gray-200 flex flex-col",
        "sidebar-transition fixed lg:relative h-full z-50",
        isOpen ? "translate-x-0" : "sidebar-hidden"
      )}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">Wahrify</h1>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">Advanced Fact Verification Platform</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href="#"
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover-lift",
                  item.active
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.count !== undefined && (
                  <span className="ml-auto bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                    {item.count}
                  </span>
                )}
              </a>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Quick Actions
            </p>
            {quickActions.map((action) => (
              <button
                key={action.label}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover-lift"
              >
                <action.icon className="w-5 h-5" />
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"}
              alt="User avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {user?.name || "Dr. Sarah Johnson"}
              </p>
              <p className="text-xs text-gray-500">
                {user?.plan || "Pro Plan"}
              </p>
            </div>
            <Settings className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </aside>
    </>
  );
}
