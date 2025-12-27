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
        return <AlertTriangle className="w-7 h-7" />;
      case 'advisory':
        return <Info className="w-7 h-7" />;
      case 'announcement':
        return <Megaphone className="w-7 h-7" />;
      default:
        return <Bell className="w-7 h-7" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="alerts-page">
      <div className="animate-fade-in">
        <h1 className="text-3xl lg:text-4xl font-bold font-['Outfit']">
          Mga Abiso at Balita
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Manatiling updated sa mga balita ng Brgy Korokan
        </p>
      </div>

      <Tabs defaultValue="all" onValueChange={setFilter} className="animate-slide-up">
        <TabsList className="grid w-full grid-cols-4 h-16 text-lg">
          <TabsTrigger value="all" className="text-lg py-4">Lahat</TabsTrigger>
          <TabsTrigger value="emergency" className="text-lg py-4 text-red-600 data-[state=active]:text-red-600">
            Emergency
          </TabsTrigger>
          <TabsTrigger value="advisory" className="text-lg py-4 text-amber-600 data-[state=active]:text-amber-600">
            Advisory
          </TabsTrigger>
          <TabsTrigger value="announcement" className="text-lg py-4 text-emerald-600 data-[state=active]:text-emerald-600">
            Balita
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-8">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Megaphone className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">
                  Walang {filter === 'all' ? '' : filter} na abiso
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredAlerts.map((alert, index) => (
                <Card 
                  key={alert.id} 
                  className={`${getAlertBorderClass(alert.type)} hover:shadow-lg transition-shadow animate-slide-up`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-5">
                      <div className={`p-4 rounded-2xl ${getAlertTypeColor(alert.type)}`}>
                        {getIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-3">
                          <Badge className={`${getAlertTypeColor(alert.type)} text-base px-4 py-1`}>
                            {alert.type}
                          </Badge>
                          <span className="text-base text-muted-foreground">
                            {formatRelativeTime(alert.created_at)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-2xl mb-3">{alert.title}</h3>
                        <p className="text-lg text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {alert.message}
                        </p>
                        <p className="text-base text-muted-foreground mt-4">
                          Mula kay {alert.created_by_name}
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
