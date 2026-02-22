import React from 'react';
import { Button } from '../components/UI';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Legal = () => {
  return (
    <div className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
      <Link to="/dashboard">
        <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-blue-600">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </Link>
      <h1 className="text-3xl font-bold mb-6">Legal & Compliance</h1>
      <div className="prose max-w-none text-slate-600">
        <p>This is a placeholder for legal documents, compliance checklists, and terms of service.</p>
        <p>In a production app, this would contain your privacy policy, terms of use, and notary compliance guidelines.</p>
      </div>
    </div>
  );
};

export default Legal;
