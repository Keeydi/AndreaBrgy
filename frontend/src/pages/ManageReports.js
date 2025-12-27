import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../lib/api';
import { formatRelativeTime, getStatusColor } from '../lib/utils';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { FileText, MapPin, User, Clock, Loader2, Search, Filter } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' }
];

export default function ManageReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [response, setResponse] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const res = await reportsAPI.getAll();
      setReports(res.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }

    setUpdating(true);
    try {
      await reportsAPI.updateStatus(selectedReport.id, {
        status: newStatus,
        official_response: response.trim() || null
      });
      toast.success('Report updated successfully');
      loadReports();
      setSelectedReport(null);
      setNewStatus('');
      setResponse('');
    } catch (error) {
      toast.error('Failed to update report');
    } finally {
      setUpdating(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.description.toLowerCase().includes(search.toLowerCase()) ||
      report.report_type.toLowerCase().includes(search.toLowerCase()) ||
      report.user_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0" data-testid="manage-reports-page">
      <div className="animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit']">
          Manage Reports
        </h1>
        <p className="text-muted-foreground mt-1">
          View and respond to resident reports
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 h-12">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <Card className="animate-slide-up">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No reports found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report, index) => (
            <Card 
              key={report.id} 
              className="hover:shadow-md transition-shadow animate-slide-up cursor-pointer"
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => {
                setSelectedReport(report);
                setNewStatus(report.status);
                setResponse(report.official_response || '');
              }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{report.report_type}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="w-3 h-3" />
                      {report.user_name}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(report.created_at)}
                    </div>
                  </div>
                  <Badge className={getStatusColor(report.status)}>
                    {report.status.replace('_', ' ')}
                  </Badge>
                </div>

                <p className="text-sm line-clamp-2 mb-2">{report.description}</p>

                {report.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {report.location}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Update Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-['Outfit']">Update Report</DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{selectedReport.report_type}</Badge>
                  <span className="text-sm text-muted-foreground">
                    by {selectedReport.user_name}
                  </span>
                </div>
                <p className="text-sm">{selectedReport.description}</p>
                {selectedReport.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <MapPin className="w-4 h-4" />
                    {selectedReport.location}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Response to Resident (Optional)</label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Add a response message..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReport(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={updating}>
              {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
