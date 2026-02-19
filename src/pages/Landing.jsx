import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/UI';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-white">
      <nav className="p-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">N</div>
          <span className="font-bold text-xl text-slate-900">NotaryFix</span>
        </div>
        <div className="flex gap-4">
           <Link to="/auth"><Button variant="ghost">Log In</Button></Link>
           <Link to="/dashboard"><Button>Get Started</Button></Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto mt-20 px-6 text-center">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
          The All-In-One OS for <span className="text-blue-600">Modern Notaries</span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          Manage appointments, track revenue, and automate your workflow. 
          Stop using spreadsheets and start running a business.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/dashboard">
            <Button size="lg" className="h-14 px-8 text-lg">
              Launch Dashboard <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8 text-left">
          {[
            'Automated Scheduling',
            'Revenue Tracking',
            'Mileage Logs'
          ].map((feature, i) => (
            <div key={i} className="p-6 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-bold text-lg mb-2">{feature}</h3>
              <p className="text-slate-500">Streamline your daily operations with our powerful tools.</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Landing;
