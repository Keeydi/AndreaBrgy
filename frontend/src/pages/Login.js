import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success(`Maligayang pagbabalik, ${user.name}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Mali ang email o password');
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
      toast.success(`Maligayang pagbabalik, ${user.name}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error('Hindi makapag-login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-muted/30">
      {/* Theme Toggle */}
      <Button
        variant="outline"
        size="lg"
        onClick={toggleTheme}
        className="absolute top-4 right-4 rounded-full h-14 w-14"
      >
        {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </Button>

      <Card className="w-full max-w-lg relative animate-slide-up shadow-2xl">
        <CardHeader className="text-center pb-6">
          <Link to="/" className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <Shield className="w-9 h-9 text-primary-foreground" />
            </div>
          </Link>
          <CardTitle className="text-3xl font-['Outfit']">Maligayang Pagbabalik!</CardTitle>
          <CardDescription className="text-lg">Mag-login sa Brgy Korokan BarangayAlert</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-lg font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="iyong@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-16 text-lg px-5"
                data-testid="login-email"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="password" className="text-lg font-semibold">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ilagay ang password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-16 text-lg px-5 pr-16"
                  data-testid="login-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-12 w-12"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-16 rounded-2xl text-xl font-semibold" 
              disabled={loading}
              data-testid="login-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Naglo-login...
                </>
              ) : (
                'Mag-login'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-lg text-muted-foreground">
            Wala ka pang account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline" data-testid="register-link">
              Mag-register dito
            </Link>
          </div>

          {/* Demo credentials - Quick Login Buttons */}
          <div className="mt-8 p-6 bg-muted rounded-2xl">
            <p className="text-base text-muted-foreground mb-4 text-center font-semibold">
              I-click para mabilis na mag-login:
            </p>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-14 text-base justify-start gap-4"
                onClick={() => handleDemoLogin('admin@brgykorokan.gov.ph', 'admin123')}
                disabled={loading}
              >
                <span className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-bold">A</span>
                <span>Admin (Kapitan)</span>
              </Button>
              <Button
                variant="outline"
                className="w-full h-14 text-base justify-start gap-4"
                onClick={() => handleDemoLogin('official@brgykorokan.gov.ph', 'official123')}
                disabled={loading}
              >
                <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold">O</span>
                <span>Official (Kagawad)</span>
              </Button>
              <Button
                variant="outline"
                className="w-full h-14 text-base justify-start gap-4"
                onClick={() => handleDemoLogin('pedro@gmail.com', 'resident123')}
                disabled={loading}
              >
                <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-bold">R</span>
                <span>Residente (Pedro)</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
