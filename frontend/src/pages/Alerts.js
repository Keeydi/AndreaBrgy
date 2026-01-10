import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../hooks/useNotifications';
import { alertsAPI } from '../lib/api';
import { formatRelativeTime, getAlertTypeColor, getAlertBorderClass } from '../lib/utils';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Megaphone, AlertTriangle, Info, Bell, Loader2 } from 'lucide-react';

export default function Alerts() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { resetNewAlertsCount } = useNotifications(false); // Don't poll here, just reset count

  useEffect(() => { 
    loadAlerts();
    resetNewAlertsCount(); // Reset count when viewing alerts page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await alertsAPI.getAll();
      setAlerts(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(alert => alert.type.toLowerCase() === filter);

  const getIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'emergency': return <AlertTriangle className="w-4 h-4" />;
      case 'advisory': return <Info className="w-4 h-4" />;
      case 'announcement': return <Megaphone className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4" data-testid="alerts-page">
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold font-['Outfit']">{t('alertsTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('alertsDesc')}</p>
      </div>

      <Tabs defaultValue="all" onValueChange={setFilter} className="animate-slide-up">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="text-xs">{t('all')}</TabsTrigger>
          <TabsTrigger value="emergency" className="text-xs text-red-600">{t('emergency')}</TabsTrigger>
          <TabsTrigger value="advisory" className="text-xs text-amber-600">{t('advisory')}</TabsTrigger>
          <TabsTrigger value="announcement" className="text-xs text-emerald-600">{t('announcement')}</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          {filteredAlerts.length === 0 ? (
            <Card><CardContent className="p-6 text-center">
              <Megaphone className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{t('noAlertsType')}</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert, index) => (
                <Card key={alert.id} className={`${getAlertBorderClass(alert.type)} animate-slide-up`} style={{ animationDelay: `${index * 30}ms` }}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getAlertTypeColor(alert.type)}`}>{getIcon(alert.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge className={`${getAlertTypeColor(alert.type)} text-xs px-2 py-0`}>{alert.type}</Badge>
                          <span className="text-xs text-muted-foreground">{formatRelativeTime(alert.created_at)}</span>
                        </div>
                        <h3 className="font-medium text-sm mb-1">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{t('postedBy')} {alert.created_by_name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
