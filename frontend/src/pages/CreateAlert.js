import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertsAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Megaphone, Loader2, ChevronLeft, AlertTriangle, Info, Bell } from 'lucide-react';

const ALERT_TYPES = [
  { 
    value: 'Emergency', 
    label: 'Emergency', 
    description: 'Critical alerts requiring immediate attention',
    icon: AlertTriangle,
    color: 'text-red-600'
  },
  { 
    value: 'Advisory', 
    label: 'Advisory', 
    description: 'Important notices and warnings',
    icon: Info,
    color: 'text-amber-600'
  },
  { 
    value: 'Announcement', 
    label: 'Announcement', 
    description: 'General community announcements',
    icon: Bell,
    color: 'text-emerald-600'
  }
];

export default function CreateAlert() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.type) {
      toast.error('Please select an alert type');
      return;
    }
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!formData.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setLoading(true);

    try {
      await alertsAPI.create({
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type.toLowerCase()
      });
      toast.success('Alert created successfully!');
      navigate('/alerts');
    } catch (error) {
      // Handle validation errors (422)
      if (error.response?.status === 422) {
        const errorData = error.response?.data;
        if (Array.isArray(errorData?.detail)) {
          // FastAPI validation errors are in an array
          const errorMessages = errorData.detail.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
          toast.error(errorMessages || 'Validation error');
        } else if (typeof errorData?.detail === 'string') {
          toast.error(errorData.detail);
        } else {
          toast.error('Validation error. Please check your input.');
        }
      } else {
        // Handle other errors
        const errorMessage = error.response?.data?.detail || error.message || 'Failed to create alert';
        toast.error(typeof errorMessage === 'string' ? errorMessage : 'Failed to create alert');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 md:pb-0" data-testid="create-alert-page">
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
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-['Outfit']">Create Alert</CardTitle>
          <CardDescription>
            Send an alert to all Brgy Korokan residents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Alert Type *</Label>
              <div className="grid grid-cols-3 gap-3">
                {ALERT_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.type === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${type.color}`} />
                      <p className="font-medium text-sm">{type.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter alert title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="h-12"
                data-testid="alert-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Enter the full alert message..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                className="min-h-[150px] resize-none"
                data-testid="alert-message"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-full" 
              disabled={loading}
              data-testid="submit-alert"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Megaphone className="w-4 h-4 mr-2" />
                  Send Alert
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
