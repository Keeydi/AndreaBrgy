import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../lib/api';
import { formatRelativeTime, getStatusColor } from '../lib/utils';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { FileText, MapPin, Loader2, Clock, MessageSquare } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0" data-testid="my-reports-page">
      <div className="animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit']">
          My Reports
        </h1>
        <p className="text-muted-foreground mt-1">
          Track the status of your submitted reports
        </p>
      </div>

      {reports.length === 0 ? (
        <Card className="animate-slide-up">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">You haven't submitted any reports yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report, index) => (
            <Card 
              key={report.id} 
              className="hover:shadow-md transition-shadow animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {report.report_type}
                    </Badge>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(report.created_at)}
                    </div>
                  </div>
                  <Badge className={getStatusColor(report.status)}>
                    {report.status.replace('_', ' ')}
                  </Badge>
                </div>

                <p className="text-sm mb-3">{report.description}</p>

                {report.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4" />
                    {report.location}
                  </div>
                )}

                {report.official_response && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                      <MessageSquare className="w-4 h-4" />
                      Official Response
                    </div>
                    <p className="text-sm text-muted-foreground">
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
