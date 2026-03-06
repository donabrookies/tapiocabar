import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { ChefHat, LogOut, LayoutDashboard, LogIn } from 'lucide-react';

const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <ChefHat className="w-8 h-8 text-amber-600 group-hover:text-amber-700 transition-colors" />
            <span className="text-2xl font-bold text-stone-800 group-hover:text-amber-700 transition-colors">
              Restaurante
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link to="/" className="text-stone-700 hover:text-amber-600 transition-colors font-medium">
              Início
            </Link>

            {!isAuthenticated && (
              <Link to="/login">
                <Button variant="outline" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  Admin Login
                </Button>
              </Link>
            )}

            {isAuthenticated && (
              <>
                <Link to="/admin">
                  <Button variant="outline" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button onClick={handleLogout} variant="destructive" className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Sair
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;