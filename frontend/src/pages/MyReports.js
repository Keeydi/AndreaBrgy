import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { reportsAPI } from '../lib/api';
import { formatRelativeTime, getStatusColor } from '../lib/utils';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { FileText, MapPin, Loader2, Clock, CheckCircle } from 'lucide-react';

export default function MyReports() {
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    try {
      const response = await reportsAPI.getAll();
      setReports(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = { pending: t('statusPending'), in_progress: t('statusInProgress'), resolved: t('statusResolved'), rejected: t('statusRejected') };
    return labels[status] || status;
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4" data-testid="my-reports-page">
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold font-['Outfit']">{t('myReports')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('myReportsDesc')}</p>
      </div>

      {reports.length === 0 ? (
        <Card className="animate-slide-up"><CardContent className="p-6 text-center">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{t('noAlerts')}</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report, index) => (
            <Card key={report.id} className="animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <Badge variant="outline" className="text-xs mb-1">{report.report_type}</Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />{formatRelativeTime(report.created_at)}
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(report.status)} text-xs`}>{getStatusLabel(report.status)}</Badge>
                </div>
                <p className="text-sm mb-2">{report.description}</p>
                {report.location && <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2"><MapPin className="w-3 h-3" />{report.location}</div>}
                {report.official_response && (
                  <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                    <div className="flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">
                      <CheckCircle className="w-4 h-4" />Response
                    </div>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">{report.official_response}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
