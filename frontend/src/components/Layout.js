import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Home,
  AlertTriangle,
  FileText,
  MessageSquare,
  Users,
  Activity,
  Sun,
  Moon,
  LogOut,
  User,
  Shield,
  Megaphone,
  Menu,
  X,
  Settings,
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getNavItems = () => {
    const base = [
      { path: '/dashboard', label: t('dashboard'), icon: Home },
      { path: '/alerts', label: t('alerts'), icon: Megaphone },
    ];

    if (user?.role === 'resident') {
      return [
        ...base,
        { path: '/report', label: t('report'), icon: AlertTriangle },
        { path: '/my-reports', label: t('myReports'), icon: FileText },
        { path: '/chatbot', label: t('help'), icon: MessageSquare },
        { path: '/settings', label: t('settings'), icon: Settings },
      ];
    }

    if (user?.role === 'official') {
      return [
        ...base,
        { path: '/manage-reports', label: t('manageReports'), icon: FileText },
        { path: '/create-alert', label: t('createAlert'), icon: Bell },
        { path: '/settings', label: t('settings'), icon: Settings },
      ];
    }

    if (user?.role === 'admin') {
      return [
        ...base,
        { path: '/manage-reports', label: t('manageReports'), icon: FileText },
        { path: '/create-alert', label: t('createAlert'), icon: Bell },
        { path: '/analytics', label: t('analytics'), icon: BarChart3 },
        { path: '/users', label: t('users'), icon: Users },
        { path: '/logs', label: t('logs'), icon: Activity },
        { path: '/settings', label: t('settings'), icon: Settings },
      ];
    }

    return base;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:flex flex-col bg-card border-r transition-all duration-300 ${
          sidebarOpen ? 'w-56' : 'w-16'
        }`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-3 border-b">
          {sidebarOpen && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-sm font-['Outfit']">Brgy Korokan</h1>
              </div>
            </Link>
          )}
          {!sidebarOpen && (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mx-auto">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex h-8 w-8"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                } ${!sidebarOpen ? 'justify-center px-2' : ''}`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            onClick={toggleTheme}
            className={`w-full h-9 text-sm gap-2 ${!sidebarOpen ? 'px-2' : ''}`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4" />
                {sidebarOpen && <span>{t('light')}</span>}
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                {sidebarOpen && <span>{t('dark')}</span>}
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside 
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-56 bg-card border-r transform transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 flex items-center justify-between px-3 border-b">
          <Link to="/dashboard" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm font-['Outfit']">Brgy Korokan</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t">
          <Button variant="ghost" onClick={toggleTheme} className="w-full h-9 text-sm gap-2">
            {theme === 'dark' ? (
              <><Sun className="w-4 h-4" /><span>{t('light')}</span></>
            ) : (
              <><Moon className="w-4 h-4" /><span>{t('dark')}</span></>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-14 bg-card border-b flex items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold font-['Outfit']">
              {navItems.find(item => item.path === location.pathname)?.label || t('dashboard')}
            </h1>
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm font-['Outfit']">Brgy Korokan</span>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-2 gap-2" data-testid="user-menu">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="hidden sm:block text-sm">{user?.name?.split(' ')[0]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-2 py-2">
                <p className="font-medium text-sm">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary capitalize">
                  {user?.role}
                </span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
                <User className="w-4 h-4 mr-2" />
                {t('profile')}
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                {t('settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                {t('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
