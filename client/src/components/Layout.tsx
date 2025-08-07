import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import ChatWidget from "@/components/ChatWidget";
import { Button } from "@/components/ui/button";
import { Menu, Bell, User } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();

  const toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
      sidebar.classList.toggle('-translate-x-full');
      overlay.classList.toggle('opacity-0');
      overlay.classList.toggle('invisible');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Sidebar />
      
      {/* Mobile sidebar overlay */}
      <div 
        id="sidebar-overlay" 
        className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm opacity-0 invisible transition-all duration-300"
        onClick={toggleSidebar}
      />
      
      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        {/* Top Navigation Bar */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={toggleSidebar}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Page title area - will be filled by pages */}
              <div className="flex-1 lg:flex-none">
                <h1 className="text-xl font-semibold text-foreground hidden lg:block">
                  FinanceAI Dashboard
                </h1>
              </div>
              
              {/* Right side actions */}
              <div className="flex items-center gap-3">
                {/* Theme toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="h-9 w-9 p-0"
                >
                  {theme === 'dark' ? '☀️' : '🌙'}
                </Button>
                
                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 relative"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                    2
                  </span>
                </Button>
                
                {/* User menu */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                >
                  <User className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
      
      <ChatWidget />
    </div>
  );
}