import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Brain, BarChart3, Upload, FileText, MessageSquare, BarChart2, Settings, User } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useDashboardStore } from "@/store/dashboardStore";

export default function Sidebar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { stats } = useDashboardStore();

  const navItems = [
    { icon: BarChart3, label: "Dashboard", href: "/", active: location === "/" },
    { icon: Upload, label: "Upload Documents", href: "/upload", active: location === "/upload" },
    { icon: FileText, label: `Documents (${stats?.totalDocuments || 0})`, href: "/documents", active: location === "/documents" },
    { icon: MessageSquare, label: "Chat", href: "/chat", active: location === "/chat" },
    { icon: BarChart2, label: "Analytics", href: "/analytics", active: location === "/analytics" },
    { icon: Settings, label: "Settings", href: "/settings", active: location === "/settings" },
  ];

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 gradient-bg transform -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-in-out" id="sidebar">
      <div className="flex items-center justify-between h-16 px-6 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Brain className="text-white" size={16} />
          </div>
          <span className="text-white font-semibold text-lg">FinanceAI</span>
        </div>
        <button 
          className="lg:hidden text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          onClick={() => {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            sidebar?.classList.add('-translate-x-full');
            overlay?.classList.add('opacity-0', 'invisible');
          }}
        >
          ×
        </button>
      </div>
      
      <nav className="mt-6 px-3">
        <div className="space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center px-4 py-3 rounded-xl transition-colors group cursor-pointer ${
                item.active 
                  ? 'text-white/90 bg-white/10' 
                  : 'text-white/70 hover:bg-white/10 hover:text-white/90'
              }`}>
                <item.icon className="mr-3 group-hover:scale-110 transition-transform" size={18} />
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
        
        {/* Theme toggle */}
        <div className="mt-8 px-4">
          <div className="flex items-center justify-between py-3">
            <span className="text-white/70 text-sm">Dark Mode</span>
            <button 
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 ${
                theme === 'dark' ? 'bg-primary-600' : 'bg-white/20'
              }`}
            >
              <span 
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`} 
              />
            </button>
          </div>
        </div>
      </nav>
      
      {/* User Profile */}
      <div className="absolute bottom-6 left-3 right-3">
        <div className="flex items-center px-4 py-3 bg-white/10 rounded-xl">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <User className="text-white" size={16} />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-white font-medium text-sm">John Smith</p>
            <p className="text-white/60 text-xs">Finance Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
}
