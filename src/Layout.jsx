import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Home, Loader2 } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (cancelled) return;
        if (isAuth) {
          const userData = await base44.auth.me();
          if (cancelled) return;
          setUser(userData);
          setLoading(false);
        } else {
          base44.auth.redirectToLogin(window.location.href);
        }
      } catch {
        if (!cancelled) base44.auth.redirectToLogin(window.location.href);
      }
    };
    checkAuth();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto" />
          <p className="mt-3 text-slate-500">Caricamento...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --color-primary: 41 37 36;
          --color-accent: 245 158 11;
        }
      `}</style>

      {/* Top navigation bar */}
      {user && (
        <nav className="fixed top-0 right-0 z-50 p-3">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg px-2 py-1 border border-slate-200/50">
            {currentPageName !== 'Home' && (
              <Link to={createPageUrl('Home')}>
                <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
                  <Home className="h-4 w-4" />
                </Button>
              </Link>
            )}
            
            {isAdmin && currentPageName !== 'Admin' && (
              <Link to={createPageUrl('Admin')}>
                <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            )}

            <div className="h-6 w-px bg-slate-200 mx-1" />
            
            <span className="text-sm text-slate-600 px-2">{user.full_name || user.email}</span>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => base44.auth.logout()}
              className="rounded-full h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      )}

      {children}
    </div>
  );
}