import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { alertsAPI, statsAPI, seedAPI } from '../lib/api';
import { formatRelativeTime, getAlertTypeColor, getAlertBorderClass } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  AlertTriangle, 
  Bell, 
  FileText, 
  MessageSquare, 
  Users, 
  Activity,
  ChevronRight,
  Megaphone,
  Clock,
  CheckCircle,
  Loader2,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, isResident, isOfficial, isAdmin } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const alertsRes = await alertsAPI.getAll();
      setAlerts(alertsRes.data.slice(0, 5));

      if (isOfficial || isAdmin) {
        const statsRes = await statsAPI.getDashboard();
        setStats(statsRes.data);
      }
    } catch (error) {
      if (error.response?.status === 401) return;
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await seedAPI.seed();
      toast.success('Demo data loaded successfully! Please refresh the page.');
      loadData();
    } catch (error) {
      toast.error('Failed to load demo data');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // Resident Dashboard - Senior Friendly
  if (isResident) {
    return (
      <div className="space-y-8" data-testid="resident-dashboard">
        {/* Welcome */}
        <div className="animate-fade-in">
          <h1 className="text-3xl lg:text-4xl font-bold font-['Outfit']">
            Kumusta, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-xl text-muted-foreground mt-2">
            Manatiling updated sa mga balita ng Brgy Korokan
          </p>
        </div>

        {/* Quick Actions - Large Buttons for Seniors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-slide-up">
          <Link to="/report" className="block">
            <Card className="hover:shadow-xl transition-all cursor-pointer border-2 border-red-200 dark:border-red-900/50 h-full">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-bold text-2xl mb-2">Mag-report ng Emergency</h3>
                <p className="text-lg text-muted-foreground">I-click ito kung may problema</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/chatbot" className="block">
            <Card className="hover:shadow-xl transition-all cursor-pointer h-full">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-bold text-2xl mb-2">Humingi ng Tulong</h3>
                <p className="text-lg text-muted-foreground">Magtanong sa BarangayBot</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Latest Alerts */}
        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl lg:text-3xl font-semibold font-['Outfit']">Mga Pinakabagong Abiso</h2>
            <Link to="/alerts">
              <Button variant="outline" size="lg" className="gap-2 text-lg h-14 px-6">
                Tingnan Lahat <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
          
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Megaphone className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground mb-4">Wala pang mga abiso</p>
                <Button onClick={handleSeedData} disabled={seeding} size="lg" className="h-14 px-8 text-lg">
                  {seeding ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  I-load ang Demo Data
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card key={alert.id} className={`${getAlertBorderClass(alert.type)} hover:shadow-lg transition-shadow`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={`${getAlertTypeColor(alert.type)} text-base px-4 py-1`}>
                            {alert.type}
                          </Badge>
                          <span className="text-base text-muted-foreground">
                            {formatRelativeTime(alert.created_at)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-xl mb-2">{alert.title}</h3>
                        <p className="text-lg text-muted-foreground line-clamp-2">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* My Reports Link */}
        <Link to="/my-reports" className="block animate-slide-up" style={{ animationDelay: '200ms' }}>
          <Card className="hover:shadow-xl transition-all">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">Aking mga Report</h3>
                  <p className="text-lg text-muted-foreground">Tingnan ang iyong mga na-submit</p>
                </div>
              </div>
              <ChevronRight className="w-8 h-8 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    );
  }

  // Official/Admin Dashboard
  return (
    <div className="space-y-8" data-testid="official-dashboard">
      {/* Welcome */}
      <div className="animate-fade-in">
        <h1 className="text-3xl lg:text-4xl font-bold font-['Outfit']">
          Dashboard Overview
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Maligayang pagbabalik, {user?.name}
        </p>
      </div>

      {/* Stats Grid */}
      {stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 animate-slide-up">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="text-3xl lg:text-4xl font-bold">{stats.total_users}</p>
                  <p className="text-base text-muted-foreground">Mga User</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-3xl lg:text-4xl font-bold">{stats.pending_reports}</p>
                  <p className="text-base text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-3xl lg:text-4xl font-bold">{stats.resolved_reports}</p>
                  <p className="text-base text-muted-foreground">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Bell className="w-7 h-7 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-3xl lg:text-4xl font-bold">{stats.total_alerts}</p>
                  <p className="text-base text-muted-foreground">Mga Abiso</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Activity className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground mb-4">Walang available na stats</p>
            <Button onClick={handleSeedData} disabled={seeding} size="lg" className="h-14 px-8 text-lg">
              {seeding ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              I-load ang Demo Data
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <Link to="/manage-reports" className="block">
          <Card className="hover:shadow-xl transition-all cursor-pointer h-full">
            <CardContent className="p-6">
              <FileText className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-semibold text-xl mb-2">I-manage ang Reports</h3>
              <p className="text-base text-muted-foreground">
                Tingnan at tumugon sa mga report
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/create-alert" className="block">
          <Card className="hover:shadow-xl transition-all cursor-pointer h-full">
            <CardContent className="p-6">
              <Megaphone className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-semibold text-xl mb-2">Gumawa ng Abiso</h3>
              <p className="text-base text-muted-foreground">
                Magpadala ng abiso sa lahat
              </p>
            </CardContent>
          </Card>
        </Link>
        {isAdmin && (
          <>
            <Link to="/analytics" className="block">
              <Card className="hover:shadow-xl transition-all cursor-pointer h-full">
                <CardContent className="p-6">
                  <BarChart3 className="w-10 h-10 text-primary mb-4" />
                  <h3 className="font-semibold text-xl mb-2">Analytics</h3>
                  <p className="text-base text-muted-foreground">
                    Tingnan ang mga datos
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/users" className="block">
              <Card className="hover:shadow-xl transition-all cursor-pointer h-full">
                <CardContent className="p-6">
                  <Users className="w-10 h-10 text-primary mb-4" />
                  <h3 className="font-semibold text-xl mb-2">Mga User</h3>
                  <p className="text-base text-muted-foreground">
                    I-manage ang mga account
                  </p>
                </CardContent>
              </Card>
            </Link>
          </>
        )}
      </div>

      {/* Recent Reports */}
      {stats?.recent_reports && stats.recent_reports.length > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl lg:text-3xl font-semibold font-['Outfit']">Mga Kamakailang Report</h2>
            <Link to="/manage-reports">
              <Button variant="outline" size="lg" className="gap-2 text-lg h-14 px-6">
                Tingnan Lahat <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {stats.recent_reports.map((report) => (
                  <div key={report.id} className="p-6 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{report.report_type}</p>
                      <p className="text-base text-muted-foreground truncate max-w-md">
                        {report.description}
                      </p>
                    </div>
                    <Badge className={`status-${report.status} text-base px-4 py-1`}>
                      {report.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
