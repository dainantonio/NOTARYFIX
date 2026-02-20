import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import { Building, Target, CheckCircle2, ArrowRight } from 'lucide-react';

// --- UTILS ---
const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- UI COMPONENTS ---
const Card = ({ children, className }) => (
  <div className={cn("bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm", className)}>
    {children}
  </div>
);

const CardContent = ({ children, className }) => (
  <div className={cn("p-6", className)}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', size = 'default', className, ...props }) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
  };
  const sizes = { 
    default: "h-10 px-4 py-2 text-sm", 
    lg: "h-12 px-8 text-base" 
  };
  
  return (
    <button 
      className={cn("inline-flex items-center justify-center rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50", variants[variant] || variants.primary, sizes[size] || sizes.default, className)} 
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className, ...props }) => (
  <input 
    className={cn("flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all", className)} 
    {...props} 
  />
);

const Label = ({ children, className }) => (
  <label className={cn("text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block", className)}>
    {children}
  </label>
);

// --- CONTEXT ---
const DataContext = createContext();

const defaultData = {
  settings: { name: '', businessName: '', monthlyGoal: 10000 }
};

const DataProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('notaryfix_data');
        if (saved) return { ...defaultData, ...JSON.parse(saved) };
      } catch (e) { console.error("Data Load Error", e); }
    }
    return defaultData;
  });

  useEffect(() => {
    localStorage.setItem('notaryfix_data', JSON.stringify(data));
  }, [data]);

  const updateSettings = (newSettings) => setData(prev => ({ ...prev, settings: { ...prev.settings, ...newSettings } }));

  return (
    <DataContext.Provider value={{ data, updateSettings }}>
      {children}
    </DataContext.Provider>
  );
};

const useData = () => useContext(DataContext);

// --- MAIN ONBOARDING COMPONENT ---
const OnboardingContent = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { data, updateSettings } = useData();

  const [formData, setFormData] = useState({
    name: data.settings?.name || '',
    businessName: data.settings?.businessName || '',
    monthlyGoal: data.settings?.monthlyGoal || 10000,
  });

  const handleNext = () => setStep(prev => prev + 1);
  
  const handleFinish = () => {
    updateSettings(formData);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
      
      <div className="w-full max-w-xl mb-8 flex items-center justify-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">N</div>
        NotaryFix OS
      </div>

      <Card className="w-full max-w-xl shadow-xl shadow-slate-200/50 dark:shadow-none border-0 overflow-hidden">
        {/* Progress Bar */}
        <div className="bg-slate-100 dark:bg-slate-800 h-1.5 w-full">
          <div 
            className="bg-blue-600 h-full transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <CardContent className="p-10">
          
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Building className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Let's set up your business.</h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                Welcome to NotaryFix. We just need a few details to personalize your dashboard, invoices, and reports.
              </p>
              <div className="pt-8">
                <Button size="lg" className="w-full md:w-auto px-8" onClick={handleNext}>
                  Get Started <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Business Details</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Your Full Name</Label>
                  <Input 
                    placeholder="e.g. Jane Doe" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>Legal Business Name</Label>
                  <Input 
                    placeholder="e.g. JD Mobile Notary LLC" 
                    value={formData.businessName} 
                    onChange={e => setFormData({...formData, businessName: e.target.value})} 
                  />
                  <p className="text-xs text-slate-500">This will appear on your generated invoices.</p>
                </div>
              </div>
              <div className="pt-6 flex justify-end">
                <Button size="lg" onClick={handleNext} disabled={!formData.name || !formData.businessName}>
                  Continue <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: GOALS */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
               <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Set your target</h2>
              <p className="text-slate-500 dark:text-slate-400">
                What is your monthly revenue goal? We'll track your progress against this target on your dashboard.
              </p>
              
              <div className="space-y-2 pt-4">
                <Label>Monthly Revenue Goal ($)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 font-bold text-slate-400">$</span>
                  <Input 
                    type="number" 
                    className="pl-8 text-lg font-bold"
                    value={formData.monthlyGoal} 
                    onChange={e => setFormData({...formData, monthlyGoal: e.target.value})} 
                  />
                </div>
              </div>

              <div className="pt-8 flex justify-end">
                <Button size="lg" onClick={handleFinish} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full">
                  <CheckCircle2 className="w-5 h-5 mr-2" /> Finish Setup
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
      
      <p className="mt-8 text-sm text-slate-400">You can always change these later in Settings.</p>
    </div>
  );
};

// --- WRAPPER FOR STANDALONE RUNNING ---
export default function App() {
  return (
    <Router>
      <DataProvider>
        <OnboardingContent />
      </DataProvider>
    </Router>
  );
}