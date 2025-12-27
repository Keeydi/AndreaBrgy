import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { AlertTriangle, MapPin, Loader2, ChevronLeft, Phone, Flame, Droplets, Car, Shield, HelpCircle } from 'lucide-react';

const REPORT_TYPES = [
  { value: 'Emergency', label: 'Emergency', description: 'Sunog, baha, aksidente', icon: Flame, color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/50' },
  { value: 'Crime', label: 'Krimen', description: 'Nakawan, away', icon: Shield, color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-900/50' },
  { value: 'Infrastructure', label: 'Imprastraktura', description: 'Sirang kalsada, ilaw', icon: Car, color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/50' },
  { value: 'Health', label: 'Kalusugan', description: 'Sakit, sanitation', icon: HelpCircle, color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900/50' },
  { value: 'Flood', label: 'Baha', description: 'Bumabahang lugar', icon: Droplets, color: 'text-cyan-600 bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-900/50' },
  { value: 'Other', label: 'Iba Pa', description: 'Ibang problema', icon: Phone, color: 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700' }
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
      toast.error('Pumili ng uri ng report');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Ilagay ang detalye ng problema');
      return;
    }

    setLoading(true);

    try {
      await reportsAPI.create({
        report_type: formData.report_type,
        description: formData.description.trim(),
        location: formData.location.trim() || null
      });
      toast.success('Matagumpay na naipadala ang report!');
      navigate('/my-reports');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Hindi naipadala ang report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto" data-testid="report-page">
      <Button 
        variant="ghost" 
        className="mb-6 gap-2 text-lg h-14" 
        onClick={() => navigate(-1)}
      >
        <ChevronLeft className="w-6 h-6" />
        Bumalik
      </Button>

      <Card className="animate-slide-up shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-3xl font-['Outfit']">Mag-report ng Problema</CardTitle>
          <CardDescription className="text-lg">
            I-report ang problema sa barangay officials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Report Type Selection - Large Touch Targets */}
            <div className="space-y-4">
              <Label className="text-xl font-semibold">Ano ang problema? *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {REPORT_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.report_type === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, report_type: type.value }))}
                      className={`p-5 rounded-2xl border-2 transition-all text-left ${type.color} ${
                        isSelected ? 'ring-4 ring-primary scale-[1.02]' : 'hover:scale-[1.02]'
                      }`}
                    >
                      <Icon className="w-10 h-10 mb-3" />
                      <p className="font-bold text-lg">{type.label}</p>
                      <p className="text-sm opacity-80">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-xl font-semibold">
                Ilarawan ang problema *
              </Label>
              <Textarea
                id="description"
                placeholder="Isulat dito ang buong detalye ng problema..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[180px] resize-none text-lg p-4"
                data-testid="report-description"
              />
              <p className="text-base text-muted-foreground">
                Maglagay ng maraming detalye para mas mabilis na matulungan ka.
              </p>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <Label htmlFor="location" className="text-xl font-semibold flex items-center gap-2">
                <MapPin className="w-6 h-6" />
                Saan ito nangyari? (Optional)
              </Label>
              <Input
                id="location"
                placeholder="Hal: Zone 3 malapit sa basketball court"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="h-16 text-lg px-5"
                data-testid="report-location"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-16 rounded-2xl text-xl font-semibold" 
              disabled={loading}
              data-testid="submit-report"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Ipinapadala...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-6 h-6 mr-3" />
                  Ipadala ang Report
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
