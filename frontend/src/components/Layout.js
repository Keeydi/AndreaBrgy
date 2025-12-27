import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
      { path: '/dashboard', label: 'Dashboard', icon: Home },
      { path: '/alerts', label: 'Mga Abiso', icon: Megaphone },
    ];

    if (user?.role === 'resident') {
      return [
        ...base,
        { path: '/report', label: 'Mag-report', icon: AlertTriangle },
        { path: '/my-reports', label: 'Aking Reports', icon: FileText },
        { path: '/chatbot', label: 'Tulong', icon: MessageSquare },
      ];
    }

    if (user?.role === 'official') {
      return [
        ...base,
        { path: '/manage-reports', label: 'Mga Report', icon: FileText },
        { path: '/create-alert', label: 'Gumawa ng Abiso', icon: Bell },
      ];
    }

    if (user?.role === 'admin') {
      return [
        ...base,
        { path: '/manage-reports', label: 'Mga Report', icon: FileText },
        { path: '/create-alert', label: 'Gumawa ng Abiso', icon: Bell },
        { path: '/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/users', label: 'Mga User', icon: Users },
        { path: '/logs', label: 'System Logs', icon: Activity },
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
          sidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-4 border-b">
          {sidebarOpen && (
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <Shield className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-xl font-['Outfit']">Brgy Korokan</h1>
                <p className="text-sm text-muted-foreground">BarangayAlert</p>
              </div>
            </Link>
          )}
          {!sidebarOpen && (
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mx-auto">
              <Shield className="w-7 h-7 text-primary-foreground" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex"
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                } ${!sidebarOpen ? 'justify-center px-2' : ''}`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle at Bottom */}
        <div className="p-4 border-t">
          <Button
            variant="outline"
            onClick={toggleTheme}
            className={`w-full h-14 text-lg gap-3 ${!sidebarOpen ? 'px-2' : ''}`}
            data-testid="theme-toggle"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-6 h-6" />
                {sidebarOpen && <span>Maliwanag</span>}
              </>
            ) : (
              <>
                <Moon className="w-6 h-6" />
                {sidebarOpen && <span>Madilim</span>}
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
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-card border-r transform transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-4 border-b">
          <Link to="/dashboard" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Shield className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl font-['Outfit']">Brgy Korokan</h1>
              <p className="text-sm text-muted-foreground">BarangayAlert</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="p-4 border-t">
          <Button
            variant="outline"
            onClick={toggleTheme}
            className="w-full h-14 text-lg gap-3"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-6 h-6" />
                <span>Maliwanag</span>
              </>
            ) : (
              <>
                <Moon className="w-6 h-6" />
                <span>Madilim</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-20 bg-card border-b flex items-center justify-between px-4 lg:px-8">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-14 w-14"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-7 h-7" />
          </Button>

          {/* Page Title - Desktop */}
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold font-['Outfit']">
              {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h1>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold font-['Outfit']">Brgy Korokan</span>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-14 px-4 gap-3" data-testid="user-menu">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <span className="hidden sm:block text-lg">{user?.name?.split(' ')[0]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <div className="px-3 py-3">
                <p className="text-lg font-semibold">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <span className="inline-block mt-2 px-3 py-1 text-sm rounded-full bg-primary/10 text-primary capitalize font-medium">
                  {user?.role === 'resident' ? 'Residente' : user?.role === 'official' ? 'Opisyal' : 'Admin'}
                </span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="py-3 text-lg cursor-pointer" data-testid="profile-btn">
                <User className="w-5 h-5 mr-3" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="py-3 text-lg cursor-pointer" data-testid="settings-btn">
                <Settings className="w-5 h-5 mr-3" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="py-3 text-lg cursor-pointer text-destructive focus:text-destructive" 
                data-testid="logout-btn"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Main Content Area - Full Viewport */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
