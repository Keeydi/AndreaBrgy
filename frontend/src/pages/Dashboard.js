import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { alertsAPI, statsAPI, seedAPI } from '../lib/api';
import { formatRelativeTime, getAlertTypeColor, getAlertBorderClass } from '../lib/utils';
import { Card, CardContent } from '../components/ui/card';
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
  const { t } = useLanguage();
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
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await seedAPI.seed();
      toast.success('Demo data loaded!');
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

  if (isResident) {
    return (
      <div className="space-y-6" data-testid="resident-dashboard">
        <div className="animate-fade-in">
          <h1 className="text-xl font-bold font-['Outfit']">
            {t('welcomeBack')}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('stayUpdated')}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 animate-slide-up">
          <Link to="/report">
            <Card className="hover:shadow-md transition-all cursor-pointer border-red-200 dark:border-red-900/50 h-full">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-semibold text-sm">{t('reportEmergency')}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t('clickIfProblem')}</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/chatbot">
            <Card className="hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{t('askForHelp')}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t('askBarangayBot')}</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold font-['Outfit']">{t('latestAlerts')}</h2>
            <Link to="/alerts">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                {t('viewAll')} <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Megaphone className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{t('noAlerts')}</p>
                <Button onClick={handleSeedData} disabled={seeding} size="sm" className="mt-3">
                  {seeding ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  {t('loadDemoData')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <Card key={alert.id} className={`${getAlertBorderClass(alert.type)}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${getAlertTypeColor(alert.type)} text-xs px-2 py-0`}>
                        {alert.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(alert.created_at)}
                      </span>
                    </div>
                    <h3 className="font-medium text-sm">{alert.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{alert.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Link to="/my-reports" className="block animate-slide-up" style={{ animationDelay: '100ms' }}>
          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{t('myReports')}</h3>
                  <p className="text-xs text-muted-foreground">{t('myReportsDesc')}</p>
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
    <div className="space-y-6" data-testid="official-dashboard">
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold font-['Outfit']">{t('dashboardOverview')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('welcomeBack')}, {user?.name}</p>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-up">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.total_users}</p>
                  <p className="text-xs text-muted-foreground">{t('totalUsers')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.pending_reports}</p>
                  <p className="text-xs text-muted-foreground">{t('pending')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.resolved_reports}</p>
                  <p className="text-xs text-muted-foreground">{t('resolved')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.total_alerts}</p>
                  <p className="text-xs text-muted-foreground">{t('alerts')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <Activity className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{t('noAlerts')}</p>
            <Button onClick={handleSeedData} disabled={seeding} size="sm" className="mt-3">
              {seeding ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {t('loadDemoData')}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <Link to="/manage-reports">
          <Card className="hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="p-4">
              <FileText className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-medium text-sm">{t('manageReports')}</h3>
            </CardContent>
          </Card>
        </Link>
        <Link to="/create-alert">
          <Card className="hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="p-4">
              <Megaphone className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-medium text-sm">{t('createAlert')}</h3>
            </CardContent>
          </Card>
        </Link>
        {isAdmin && (
          <>
            <Link to="/analytics">
              <Card className="hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="p-4">
                  <BarChart3 className="w-6 h-6 text-primary mb-2" />
                  <h3 className="font-medium text-sm">{t('analytics')}</h3>
                </CardContent>
              </Card>
            </Link>
            <Link to="/users">
              <Card className="hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="p-4">
                  <Users className="w-6 h-6 text-primary mb-2" />
                  <h3 className="font-medium text-sm">{t('users')}</h3>
                </CardContent>
              </Card>
            </Link>
          </>
        )}
      </div>

      {stats?.recent_reports?.length > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold font-['Outfit']">{t('manageReports')}</h2>
            <Link to="/manage-reports">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                {t('viewAll')} <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-0 divide-y">
              {stats.recent_reports.map((report) => (
                <div key={report.id} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{report.report_type}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">{report.description}</p>
                  </div>
                  <Badge className={`status-${report.status} text-xs`}>
                    {report.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
