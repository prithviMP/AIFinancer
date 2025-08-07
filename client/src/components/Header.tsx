import { useState } from "react";
import { Menu, Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
      const isHidden = sidebar.classList.contains('-translate-x-full');
      sidebar.classList.toggle('-translate-x-full', !isHidden);
      overlay.classList.toggle('opacity-0', isHidden);
      overlay.classList.toggle('invisible', isHidden);
    }
  };

  return (
    <header className="bg-white dark:bg-dark-800 shadow-sm border-b border-gray-200 dark:border-dark-600">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center">
          <button 
            className="lg:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mr-4"
            onClick={toggleSidebar}
          >
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, manage your financial documents</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="hidden md:flex items-center relative w-80">
            <Search className="absolute left-3 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Search documents, ask questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-16 bg-gray-100 dark:bg-dark-700 border-0"
            />
            <kbd className="absolute right-3 px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-200 dark:bg-dark-600 dark:text-gray-400 border border-gray-300 dark:border-dark-500 rounded">
              ⌘K
            </kbd>
          </div>
          
          {/* Notifications */}
          <button className="relative text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
