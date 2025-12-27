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
  Loader2
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
      // If no data, try to seed
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Resident Dashboard
  if (isResident) {
    return (
      <div className="space-y-6 pb-20 md:pb-0" data-testid="resident-dashboard">
        {/* Welcome */}
        <div className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit']">
            Kumusta, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with the latest from Brgy Korokan
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 animate-slide-up">
          <Link to="/report">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-red-200 dark:border-red-900/30">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-semibold">Report Emergency</h3>
                <p className="text-xs text-muted-foreground mt-1">Submit a report</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/chatbot">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold">Get Help</h3>
                <p className="text-xs text-muted-foreground mt-1">Ask BarangayBot</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Latest Alerts */}
        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold font-['Outfit']">Latest Alerts</h2>
            <Link to="/alerts">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No alerts yet</p>
                <Button onClick={handleSeedData} disabled={seeding} className="mt-4">
                  {seeding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Load Demo Data
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Card key={alert.id} className={`${getAlertBorderClass(alert.type)} hover:shadow-md transition-shadow`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getAlertTypeColor(alert.type)}>
                            {alert.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(alert.created_at)}
                          </span>
                        </div>
                        <h3 className="font-semibold truncate">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
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
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">My Reports</h3>
                  <p className="text-sm text-muted-foreground">View your submitted reports</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    );
  }

  // Official/Admin Dashboard
  return (
    <div className="space-y-6 pb-20 md:pb-0" data-testid="official-dashboard">
      {/* Welcome */}
      <div className="animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit']">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.name}
        </p>
      </div>

      {/* Stats Grid */}
      {stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_users}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending_reports}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.resolved_reports}</p>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_alerts}</p>
                  <p className="text-sm text-muted-foreground">Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No stats available</p>
            <Button onClick={handleSeedData} disabled={seeding} className="mt-4">
              {seeding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Load Demo Data
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <Link to="/manage-reports">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <FileText className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-semibold text-lg">Manage Reports</h3>
              <p className="text-sm text-muted-foreground mt-1">
                View and respond to resident reports
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/create-alert">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <Megaphone className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-semibold text-lg">Create Alert</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Send alerts to all residents
              </p>
            </CardContent>
          </Card>
        </Link>
        {isAdmin && (
          <Link to="/users">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <Users className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg">User Management</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage user accounts and roles
                </p>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* Recent Reports */}
      {stats?.recent_reports && stats.recent_reports.length > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold font-['Outfit']">Recent Reports</h2>
            <Link to="/manage-reports">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {stats.recent_reports.map((report) => (
                  <div key={report.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{report.report_type}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-md">
                        {report.description}
                      </p>
                    </div>
                    <Badge className={`status-${report.status}`}>
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
