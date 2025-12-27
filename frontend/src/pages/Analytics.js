import React, { useState, useEffect } from 'react';
import { statsAPI, reportsAPI, alertsAPI, usersAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Bell, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Loader2,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

const COLORS = ['#DC2626', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, reportsRes, alertsRes, usersRes] = await Promise.all([
        statsAPI.getDashboard(),
        reportsAPI.getAll(),
        alertsAPI.getAll(),
        usersAPI.getAll()
      ]);
      setStats(statsRes.data);
      setReports(reportsRes.data);
      setAlerts(alertsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // Prepare chart data
  const reportStatusData = [
    { name: 'Pending', value: stats?.pending_reports || 0, color: '#F59E0B' },
    { name: 'In Progress', value: reports.filter(r => r.status === 'in_progress').length, color: '#3B82F6' },
    { name: 'Resolved', value: stats?.resolved_reports || 0, color: '#10B981' },
    { name: 'Rejected', value: reports.filter(r => r.status === 'rejected').length, color: '#DC2626' }
  ];

  const reportTypeData = Object.entries(stats?.report_types || {}).map(([type, count]) => ({
    name: type,
    count: count
  }));

  const alertTypeData = [
    { name: 'Emergency', value: alerts.filter(a => a.type === 'Emergency').length, color: '#DC2626' },
    { name: 'Advisory', value: alerts.filter(a => a.type === 'Advisory').length, color: '#F59E0B' },
    { name: 'Announcement', value: alerts.filter(a => a.type === 'Announcement').length, color: '#10B981' }
  ];

  const userRoleData = [
    { name: 'Residents', value: users.filter(u => u.role === 'resident').length, color: '#3B82F6' },
    { name: 'Officials', value: users.filter(u => u.role === 'official').length, color: '#8B5CF6' },
    { name: 'Admins', value: users.filter(u => u.role === 'admin').length, color: '#DC2626' }
  ];

  return (
    <div className="space-y-8" data-testid="analytics-page">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl lg:text-4xl font-bold font-['Outfit']">
          Analytics Dashboard
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Tingnan ang mga datos ng Brgy Korokan
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 animate-slide-up">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-lg">Kabuuang Users</p>
                <p className="text-4xl lg:text-5xl font-bold mt-2">{stats?.total_users || 0}</p>
              </div>
              <Users className="w-12 h-12 lg:w-16 lg:h-16 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-lg">Pending Reports</p>
                <p className="text-4xl lg:text-5xl font-bold mt-2">{stats?.pending_reports || 0}</p>
              </div>
              <Clock className="w-12 h-12 lg:w-16 lg:h-16 text-amber-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-lg">Resolved</p>
                <p className="text-4xl lg:text-5xl font-bold mt-2">{stats?.resolved_reports || 0}</p>
              </div>
              <CheckCircle className="w-12 h-12 lg:w-16 lg:h-16 text-emerald-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-lg">Mga Abiso</p>
                <p className="text-4xl lg:text-5xl font-bold mt-2">{stats?.total_alerts || 0}</p>
              </div>
              <Bell className="w-12 h-12 lg:w-16 lg:h-16 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="reports" className="animate-slide-up">
        <TabsList className="grid w-full grid-cols-3 h-14 text-lg">
          <TabsTrigger value="reports" className="text-lg py-3">Mga Report</TabsTrigger>
          <TabsTrigger value="alerts" className="text-lg py-3">Mga Abiso</TabsTrigger>
          <TabsTrigger value="users" className="text-lg py-3">Mga User</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Report Status Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-['Outfit'] flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Status ng mga Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reportStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Report Types Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-['Outfit'] flex items-center gap-2">
                  <BarChart3 className="w-6 h-6" />
                  Uri ng mga Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 14 }} />
                      <YAxis tick={{ fontSize: 14 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Alert Types */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-['Outfit'] flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  Uri ng mga Abiso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={alertTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {alertTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Alerts List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-['Outfit'] flex items-center gap-2">
                  <Calendar className="w-6 h-6" />
                  Mga Kamakailang Abiso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-72 overflow-y-auto">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 bg-muted rounded-xl">
                      <div>
                        <p className="font-semibold text-lg">{alert.title}</p>
                        <p className="text-muted-foreground">{alert.created_by_name}</p>
                      </div>
                      <Badge className={
                        alert.type === 'Emergency' ? 'bg-red-100 text-red-800 text-base px-3 py-1' :
                        alert.type === 'Advisory' ? 'bg-amber-100 text-amber-800 text-base px-3 py-1' :
                        'bg-emerald-100 text-emerald-800 text-base px-3 py-1'
                      }>
                        {alert.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* User Roles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-['Outfit'] flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Mga User ayon sa Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userRoleData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {userRoleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* User Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-['Outfit'] flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  Buod ng mga User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="text-xl font-medium">Mga Residente</span>
                    </div>
                    <span className="text-3xl font-bold text-blue-600">
                      {users.filter(u => u.role === 'resident').length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                      <span className="text-xl font-medium">Mga Opisyal</span>
                    </div>
                    <span className="text-3xl font-bold text-purple-600">
                      {users.filter(u => u.role === 'official').length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                        <Users className="w-6 h-6 text-red-600" />
                      </div>
                      <span className="text-xl font-medium">Mga Admin</span>
                    </div>
                    <span className="text-3xl font-bold text-red-600">
                      {users.filter(u => u.role === 'admin').length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      </div>
                      <span className="text-xl font-medium">Active Users</span>
                    </div>
                    <span className="text-3xl font-bold text-emerald-600">
                      {users.filter(u => u.status === 'active').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
