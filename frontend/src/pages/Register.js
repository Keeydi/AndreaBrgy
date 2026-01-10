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

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    // Check password requirements
    if (!/[A-Z]/.test(formData.password)) {
      toast.error('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(formData.password)) {
      toast.error('Password must contain at least one lowercase letter');
      return;
    }
    if (!/\d/.test(formData.password)) {
      toast.error('Password must contain at least one number');
      return;
    }

    setLoading(true);

    try {
      const user = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        address: formData.address || null,
        phone: formData.phone || null
      });
      toast.success(`Welcome to BarangayAlert, ${user.name}!`);
      navigate('/dashboard');
    } catch (error) {
      // Handle validation errors (422)
      if (error.response?.status === 422) {
        const errorData = error.response?.data;
        if (Array.isArray(errorData?.detail)) {
          // FastAPI validation errors are in an array
          const errorMessages = errorData.detail.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
          toast.error(errorMessages || 'Validation error');
        } else if (typeof errorData?.detail === 'string') {
          toast.error(errorData.detail);
        } else {
          toast.error('Validation error. Please check your input.');
        }
      } else {
        // Handle other errors
        const errorMessage = error.response?.data?.detail || error.message || 'Registration failed';
        toast.error(typeof errorMessage === 'string' ? errorMessage : 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1758979616462-8bdc7d854af3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBtaW5pbWFsaXN0JTIwYWJzdHJhY3QlMjBnZW9tZXRyaWMlMjBzaGFwZXMlMjBibHVlJTIwcmVkfGVufDB8fHx8MTc2Njg0ODkwN3ww&ixlib=rb-4.1.0&q=85')`
        }}
      />
      
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4 rounded-full"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </Button>

      <Card className="w-full max-w-md relative animate-slide-up shadow-2xl">
        <CardHeader className="text-center">
          <Link to="/" className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Shield className="w-7 h-7 text-primary-foreground" />
            </div>
          </Link>
          <CardTitle className="text-2xl font-['Outfit']">Create Account</CardTitle>
          <CardDescription>Join Brgy Korokan BarangayAlert</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Juan dela Cruz"
                value={formData.name}
                onChange={handleChange}
                required
                className="h-12"
                data-testid="register-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="h-12"
                data-testid="register-email"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 chars, A-Z, a-z, 0-9"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="h-12 pr-10"
                    data-testid="register-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-12 w-10"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="h-12"
                  data-testid="register-confirm-password"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Input
                id="address"
                name="address"
                placeholder="Brgy Korokan, Zone 1"
                value={formData.address}
                onChange={handleChange}
                className="h-12"
                data-testid="register-address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="09XX XXX XXXX"
                value={formData.phone}
                onChange={handleChange}
                className="h-12"
                data-testid="register-phone"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 rounded-full" 
              disabled={loading}
              data-testid="register-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline" data-testid="login-link">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
