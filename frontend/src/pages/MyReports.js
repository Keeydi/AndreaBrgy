import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../lib/api';
import { formatRelativeTime, getStatusColor } from '../lib/utils';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { FileText, MapPin, Loader2, Clock, MessageSquare, CheckCircle } from 'lucide-react';

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await reportsAPI.getAll();
      setReports(response.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Naghihintay';
      case 'in_progress':
        return 'Inaaksyunan';
      case 'resolved':
        return 'Tapos Na';
      case 'rejected':
        return 'Hindi Natanggap';
      default:
        return status;
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
    <div className="space-y-8" data-testid="my-reports-page">
      <div className="animate-fade-in">
        <h1 className="text-3xl lg:text-4xl font-bold font-['Outfit']">
          Aking mga Report
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Tingnan ang status ng iyong mga na-submit
        </p>
      </div>

      {reports.length === 0 ? (
        <Card className="animate-slide-up">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">Wala ka pang naipadala na report</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {reports.map((report, index) => (
            <Card 
              key={report.id} 
              className="hover:shadow-lg transition-shadow animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <Badge variant="outline" className="text-base px-4 py-1 mb-3">
                      {report.report_type}
                    </Badge>
                    <div className="flex items-center gap-3 text-base text-muted-foreground">
                      <Clock className="w-5 h-5" />
                      {formatRelativeTime(report.created_at)}
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(report.status)} text-base px-4 py-2`}>
                    {getStatusLabel(report.status)}
                  </Badge>
                </div>

                <p className="text-lg mb-4 leading-relaxed">{report.description}</p>

                {report.location && (
                  <div className="flex items-center gap-3 text-base text-muted-foreground mb-4">
                    <MapPin className="w-5 h-5" />
                    {report.location}
                  </div>
                )}

                {report.official_response && (
                  <div className="mt-4 p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/50">
                    <div className="flex items-center gap-3 text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                      <CheckCircle className="w-6 h-6" />
                      Sagot mula sa Barangay
                    </div>
                    <p className="text-base text-emerald-800 dark:text-emerald-300 leading-relaxed">
                      {report.official_response}
                    </p>
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
