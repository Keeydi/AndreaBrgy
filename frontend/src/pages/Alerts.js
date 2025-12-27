import React, { useState, useEffect } from 'react';
import { alertsAPI } from '../lib/api';
import { formatRelativeTime, getAlertTypeColor, getAlertBorderClass } from '../lib/utils';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Megaphone, AlertTriangle, Info, Bell, Loader2 } from 'lucide-react';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await alertsAPI.getAll();
      setAlerts(response.data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.type.toLowerCase() === filter);

  const getIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'emergency':
        return <AlertTriangle className="w-5 h-5" />;
      case 'advisory':
        return <Info className="w-5 h-5" />;
      case 'announcement':
        return <Megaphone className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0" data-testid="alerts-page">
      <div className="animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit']">
          Alerts & Announcements
        </h1>
        <p className="text-muted-foreground mt-1">
          Stay updated with the latest from Brgy Korokan
        </p>
      </div>

      <Tabs defaultValue="all" onValueChange={setFilter} className="animate-slide-up">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="emergency" className="text-red-600 data-[state=active]:text-red-600">
            Emergency
          </TabsTrigger>
          <TabsTrigger value="advisory" className="text-amber-600 data-[state=active]:text-amber-600">
            Advisory
          </TabsTrigger>
          <TabsTrigger value="announcement" className="text-emerald-600 data-[state=active]:text-emerald-600">
            News
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No {filter === 'all' ? '' : filter} alerts</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert, index) => (
                <Card 
                  key={alert.id} 
                  className={`${getAlertBorderClass(alert.type)} hover:shadow-md transition-shadow animate-slide-up`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${getAlertTypeColor(alert.type)}`}>
                        {getIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Badge className={getAlertTypeColor(alert.type)}>
                            {alert.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(alert.created_at)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{alert.title}</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-3">
                          Posted by {alert.created_by_name}
                        </p>
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
