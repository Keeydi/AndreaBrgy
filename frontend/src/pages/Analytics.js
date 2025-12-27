import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { statsAPI, reportsAPI, alertsAPI, usersAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BarChart3, Users, FileText, Bell, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#DC2626', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

export default function Analytics() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statsRes, reportsRes, alertsRes, usersRes] = await Promise.all([
        statsAPI.getDashboard(), reportsAPI.getAll(), alertsAPI.getAll(), usersAPI.getAll()
      ]);
      setStats(statsRes.data);
      setReports(reportsRes.data);
      setAlerts(alertsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const reportStatusData = [
    { name: t('statusPending'), value: stats?.pending_reports || 0, color: '#F59E0B' },
    { name: t('statusInProgress'), value: reports.filter(r => r.status === 'in_progress').length, color: '#3B82F6' },
    { name: t('statusResolved'), value: stats?.resolved_reports || 0, color: '#10B981' },
    { name: t('statusRejected'), value: reports.filter(r => r.status === 'rejected').length, color: '#DC2626' }
  ];

  const reportTypeData = Object.entries(stats?.report_types || {}).map(([type, count]) => ({ name: type, count }));

  const alertTypeData = [
    { name: t('emergency'), value: alerts.filter(a => a.type === 'Emergency').length, color: '#DC2626' },
    { name: t('advisory'), value: alerts.filter(a => a.type === 'Advisory').length, color: '#F59E0B' },
    { name: t('announcement'), value: alerts.filter(a => a.type === 'Announcement').length, color: '#10B981' }
  ];

  const userRoleData = [
    { name: t('residents'), value: users.filter(u => u.role === 'resident').length, color: '#3B82F6' },
    { name: t('officials'), value: users.filter(u => u.role === 'official').length, color: '#8B5CF6' },
    { name: t('admins'), value: users.filter(u => u.role === 'admin').length, color: '#DC2626' }
  ];

  return (
    <div className="space-y-4" data-testid="analytics-page">
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold font-['Outfit']">{t('analyticsTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('analyticsDesc')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-up">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs">{t('totalUsers')}</p>
                <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-xs">{t('pending')}</p>
                <p className="text-2xl font-bold">{stats?.pending_reports || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-xs">{t('resolved')}</p>
                <p className="text-2xl font-bold">{stats?.resolved_reports || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-xs">{t('alerts')}</p>
                <p className="text-2xl font-bold">{stats?.total_alerts || 0}</p>
              </div>
              <Bell className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="animate-slide-up">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports" className="text-xs">{t('manageReports')}</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs">{t('alerts')}</TabsTrigger>
          <TabsTrigger value="users" className="text-xs">{t('users')}</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-4 grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4" />{t('reportStatus')}</CardTitle></CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={reportStatusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {reportStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" />{t('reportTypes')}</CardTitle></CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportTypeData}>
                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
                    <Tooltip /><Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4 grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('alertTypeChart')}</CardTitle></CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={alertTypeData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {alertTypeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('recentAlerts')}</CardTitle></CardHeader>
            <CardContent className="max-h-52 overflow-y-auto space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.created_by_name}</p>
                  </div>
                  <Badge className={alert.type === 'Emergency' ? 'bg-red-100 text-red-800 text-xs' : alert.type === 'Advisory' ? 'bg-amber-100 text-amber-800 text-xs' : 'bg-emerald-100 text-emerald-800 text-xs'}>{alert.type}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4 grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('usersByRole')}</CardTitle></CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={userRoleData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {userRoleData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('userSummary')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm">{t('residents')}</span>
                <span className="text-lg font-bold text-blue-600">{users.filter(u => u.role === 'resident').length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <span className="text-sm">{t('officials')}</span>
                <span className="text-lg font-bold text-purple-600">{users.filter(u => u.role === 'official').length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <span className="text-sm">{t('admins')}</span>
                <span className="text-lg font-bold text-red-600">{users.filter(u => u.role === 'admin').length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <span className="text-sm">{t('activeUsers')}</span>
                <span className="text-lg font-bold text-emerald-600">{users.filter(u => u.status === 'active').length}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
