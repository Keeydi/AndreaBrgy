import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { AlertTriangle, MapPin, Loader2, ChevronLeft } from 'lucide-react';

const REPORT_TYPES = [
  { value: 'Emergency', label: 'Emergency', description: 'Fire, flood, medical emergency' },
  { value: 'Crime', label: 'Crime/Safety', description: 'Theft, violence, suspicious activity' },
  { value: 'Infrastructure', label: 'Infrastructure', description: 'Road damage, broken lights, etc.' },
  { value: 'Health', label: 'Health Concern', description: 'Disease outbreak, sanitation' },
  { value: 'Noise', label: 'Noise/Disturbance', description: 'Loud parties, construction' },
  { value: 'Other', label: 'Other', description: 'Any other concern' }
];

export default function Report() {
  const [formData, setFormData] = useState({
    report_type: '',
    description: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.report_type) {
      toast.error('Please select a report type');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Please provide a description');
      return;
    }

    setLoading(true);

    try {
      await reportsAPI.create({
        report_type: formData.report_type,
        description: formData.description.trim(),
        location: formData.location.trim() || null
      });
      toast.success('Report submitted successfully!');
      navigate('/my-reports');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 md:pb-0" data-testid="report-page">
      <Button 
        variant="ghost" 
        className="mb-4 gap-2" 
        onClick={() => navigate(-1)}
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </Button>

      <Card className="animate-slide-up shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-['Outfit']">Submit a Report</CardTitle>
          <CardDescription>
            Report an emergency or concern to barangay officials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="report_type">Report Type *</Label>
              <Select 
                value={formData.report_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, report_type: value }))}
              >
                <SelectTrigger className="h-12" data-testid="report-type-select">
                  <SelectValue placeholder="Select type of report" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Please describe the incident or concern in detail..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[150px] resize-none"
                data-testid="report-description"
              />
              <p className="text-xs text-muted-foreground">
                Include as much detail as possible to help officials respond appropriately.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location (Optional)
              </Label>
              <Input
                id="location"
                placeholder="e.g., Zone 3 near the basketball court"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="h-12"
                data-testid="report-location"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-full" 
              disabled={loading}
              data-testid="submit-report"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
