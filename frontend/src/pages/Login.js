import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Shield, Sun, Moon, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`${t('welcomeBack')}, ${user.name}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    try {
      const user = await login(demoEmail, demoPassword);
      toast.success(`${t('welcomeBack')}, ${user.name}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4 rounded-full"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>

      <Card className="w-full max-w-sm animate-slide-up shadow-lg">
        <CardHeader className="text-center pb-4">
          <Link to="/" className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
          </Link>
          <CardTitle className="text-xl font-['Outfit']">{t('loginTitle')}</CardTitle>
          <CardDescription className="text-sm">{t('loginDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="login-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">{t('password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                  data-testid="login-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('loggingIn')}</> : t('login')}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              {t('registerHere')}
            </Link>
          </div>

          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-2 text-center">{t('quickLogin')}</p>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full h-9 text-xs justify-start gap-2"
                onClick={() => handleDemoLogin('admin@brgykorokan.gov.ph', 'admin123')}
                disabled={loading}
              >
                <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 text-xs font-bold">A</span>
                {t('admin')}
              </Button>
              <Button
                variant="outline"
                className="w-full h-9 text-xs justify-start gap-2"
                onClick={() => handleDemoLogin('official@brgykorokan.gov.ph', 'official123')}
                disabled={loading}
              >
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xs font-bold">O</span>
                {t('official')}
              </Button>
              <Button
                variant="outline"
                className="w-full h-9 text-xs justify-start gap-2"
                onClick={() => handleDemoLogin('pedro@gmail.com', 'resident123')}
                disabled={loading}
              >
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 text-xs font-bold">R</span>
                {t('resident')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
