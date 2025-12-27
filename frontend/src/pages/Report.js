import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { reportsAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { AlertTriangle, MapPin, Loader2, ChevronLeft, Flame, Droplets, Car, Shield, HelpCircle, Phone } from 'lucide-react';

export default function Report() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ report_type: '', description: '', location: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const REPORT_TYPES = [
    { value: 'Emergency', label: t('emergency'), desc: t('emergencyDesc'), icon: Flame, color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20' },
    { value: 'Crime', label: t('crime'), desc: t('crimeDesc'), icon: Shield, color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20' },
    { value: 'Infrastructure', label: t('infrastructure'), desc: t('infrastructureDesc'), icon: Car, color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20' },
    { value: 'Health', label: t('health'), desc: t('healthDesc'), icon: HelpCircle, color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20' },
    { value: 'Flood', label: t('flood'), desc: t('floodDesc'), icon: Droplets, color: 'text-cyan-600 bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20' },
    { value: 'Other', label: t('other'), desc: t('otherDesc'), icon: Phone, color: 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-800' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.report_type) { toast.error(t('selectType')); return; }
    if (!formData.description.trim()) { toast.error(t('enterDescription')); return; }

    setLoading(true);
    try {
      await reportsAPI.create({
        report_type: formData.report_type,
        description: formData.description.trim(),
        location: formData.location.trim() || null
      });
      toast.success(t('reportSuccess'));
      navigate('/my-reports');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto" data-testid="report-page">
      <Button variant="ghost" className="mb-4 gap-1 text-sm" onClick={() => navigate(-1)}>
        <ChevronLeft className="w-4 h-4" />{t('back')}
      </Button>

      <Card className="animate-slide-up shadow-md">
        <CardHeader className="text-center pb-3">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-lg font-['Outfit']">{t('submitReport')}</CardTitle>
          <CardDescription className="text-sm">{t('reportProblem')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('whatProblem')} *</Label>
              <div className="grid grid-cols-3 gap-2">
                {REPORT_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.report_type === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, report_type: type.value }))}
                      className={`p-3 rounded-lg border transition-all text-left ${type.color} ${isSelected ? 'ring-2 ring-primary' : ''}`}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <p className="font-medium text-xs">{type.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">{t('describeProblem')} *</Label>
              <Textarea
                id="description"
                placeholder={t('writeDetails')}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[100px] resize-none text-sm"
                data-testid="report-description"
              />
              <p className="text-xs text-muted-foreground">{t('addDetails')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium flex items-center gap-1">
                <MapPin className="w-4 h-4" />{t('whereHappened')}
              </Label>
              <Input
                id="location"
                placeholder={t('locationExample')}
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="text-sm"
                data-testid="report-location"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading} data-testid="submit-report">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('sending')}</> : t('sendReport')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
