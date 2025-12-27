import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Globe, Sun, Moon, Bell } from 'lucide-react';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="settings-page">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold font-['Outfit']">{t('settingsTitle')}</h1>
        <p className="text-muted-foreground">{t('settingsDesc')}</p>
      </div>

      {/* Language Settings */}
      <Card className="animate-slide-up">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base">{t('language')}</CardTitle>
              <CardDescription className="text-sm">{t('languageDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full" data-testid="language-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">
                <div className="flex items-center gap-2">
                  <span>🇺🇸</span>
                  <span>English</span>
                </div>
              </SelectItem>
              <SelectItem value="tl">
                <div className="flex items-center gap-2">
                  <span>🇵🇭</span>
                  <span>Tagalog</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div>
              <CardTitle className="text-base">{t('theme')}</CardTitle>
              <CardDescription className="text-sm">{t('themeDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-full" data-testid="theme-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  <span>{t('light')}</span>
                </div>
              </SelectItem>
              <SelectItem value="dark">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  <span>{t('dark')}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-base">{t('notifications')}</CardTitle>
              <CardDescription className="text-sm">{t('notificationsDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications" className="text-sm">
              {t('enableNotifications')}
            </Label>
            <Switch id="notifications" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
