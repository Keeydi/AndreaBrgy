import React, { useState, useEffect } from 'react';
import { logsAPI } from '../lib/api';
import { formatRelativeTime } from '../lib/utils';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Activity, Search, Loader2, User, Clock } from 'lucide-react';

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const res = await logsAPI.getAll();
      setLogs(res.data);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.user_name.toLowerCase().includes(search.toLowerCase()) ||
    (log.details && log.details.toLowerCase().includes(search.toLowerCase()))
  );

  const getActionColor = (action) => {
    if (action.includes('LOGIN')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (action.includes('REGISTERED')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (action.includes('ALERT')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    if (action.includes('REPORT')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0" data-testid="system-logs-page">
      <div className="animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit']">
          System Logs
        </h1>
        <p className="text-muted-foreground mt-1">
          View user activity and system events
        </p>
      </div>

      {/* Search */}
      <div className="relative animate-slide-up">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <Card className="animate-slide-up">
          <CardContent className="p-8 text-center">
            <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No logs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log, index) => (
            <Card 
              key={log.id} 
              className="animate-slide-up"
              style={{ animationDelay: `${index * 20}ms` }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge className={getActionColor(log.action)}>
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="w-3 h-3" />
                        {log.user_name}
                      </div>
                    </div>
                    {log.details && (
                      <p className="text-sm text-muted-foreground truncate">
                        {log.details}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(log.timestamp)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
