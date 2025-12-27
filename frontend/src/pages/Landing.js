import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useTheme } from '../context/ThemeContext';
import { Shield, Bell, FileText, MessageSquare, Sun, Moon, ChevronRight, AlertTriangle, Users } from 'lucide-react';

export default function Landing() {
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: Bell,
      title: 'Real-time Alerts',
      description: 'Receive instant emergency alerts, advisories, and announcements from barangay officials.'
    },
    {
      icon: FileText,
      title: 'Easy Reporting',
      description: 'Submit emergency reports and community concerns directly to barangay officials.'
    },
    {
      icon: MessageSquare,
      title: 'AI Assistant',
      description: 'Get quick answers to common questions with our intelligent chatbot.'
    },
    {
      icon: Users,
      title: 'Community Connected',
      description: 'Stay informed and connected with your barangay community.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg font-['Outfit']">Brgy Korokan</h1>
                <p className="text-xs text-muted-foreground -mt-1">BarangayAlert</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
                data-testid="theme-toggle-landing"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Link to="/login">
                <Button variant="outline" className="rounded-full" data-testid="login-link">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="rounded-full" data-testid="register-link">
                  Register
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium mb-6">
                <AlertTriangle className="w-4 h-4" />
                Community Emergency Alert System
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight font-['Outfit'] mb-6">
                Stay Safe with{' '}
                <span className="text-primary">Brgy Korokan</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl">
                Your direct line to barangay emergency services. Report incidents, receive alerts, 
                and stay connected with your community through BarangayAlert.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <Button size="lg" className="rounded-full gap-2" data-testid="get-started-btn">
                    Get Started
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="rounded-full">
                    I already have an account
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative animate-slide-up">
              <div className="aspect-square max-w-lg mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-red-500/20 rounded-3xl blur-3xl" />
                <img
                  src="https://images.unsplash.com/photo-1568359852789-b3c8b7b98cc0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxmaWxpcGlubyUyMGNvbW11bml0eSUyMHN0cmVldCUyMHNtaWxpbmclMjBwZW9wbGV8ZW58MHx8fHwxNzY2ODQ4OTA0fDA&ixlib=rb-4.1.0&q=85"
                  alt="Filipino Community"
                  className="relative rounded-3xl object-cover w-full h-full shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-['Outfit'] mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              BarangayAlert provides essential tools for community safety and communication
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-card p-6 rounded-2xl border shadow-lg hover:shadow-xl transition-shadow animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 font-['Outfit']">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Emergency Image Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img
                src="https://images.unsplash.com/photo-1737430566442-cfc9a90f3d34?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwzfHxlbWVyZ2VuY3klMjByZXNwb25zZSUyMHRlYW0lMjBwaGlsaXBwaW5lc3xlbnwwfHx8fDE3NjY4NDg5MDV8MA&ixlib=rb-4.1.0&q=85"
                alt="Emergency Response"
                className="rounded-3xl shadow-2xl"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold font-['Outfit'] mb-6">
                Quick Emergency Response
              </h2>
              <p className="text-muted-foreground mb-6">
                In times of emergency, every second counts. Our system ensures that your reports 
                reach barangay officials immediately, enabling faster response times and better 
                community coordination during disasters.
              </p>
              <ul className="space-y-4">
                {[
                  'Instant notification to officials',
                  'Real-time status tracking',
                  'Location-based reporting',
                  '24/7 emergency support'
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-['Outfit'] mb-6">
            Join Brgy Korokan Today
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Be part of a connected and safer community. Register now to receive important 
            alerts and report concerns in your barangay.
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="rounded-full gap-2">
              Create Your Account
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-semibold font-['Outfit']">BarangayAlert</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; 2025 Brgy Korokan. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
