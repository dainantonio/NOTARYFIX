import React from 'react';
import { Plus, Download, Filter, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../components/UI';

const Invoices = () => {
  const invoices = [
    { id: 'INV-1024', client: 'Estate Realty', amount: 150.00, date: 'Oct 24, 2025', status: 'Paid', due: 'Oct 24, 2025' },
    { id: 'INV-1023', client: 'TechCorp Inc', amount: 450.00, date: 'Oct 22, 2025', status: 'Pending', due: 'Nov 01, 2025' },
    { id: 'INV-1022', client: 'Sarah Johnson', amount: 75.00, date: 'Oct 20, 2025', status: 'Overdue', due: 'Oct 21, 2025' },
    { id: 'INV-1021', client: 'Legal Partners LLP', amount: 200.00, date: 'Oct 15, 2025', status: 'Paid', due: 'Oct 15, 2025' },
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Paid': return <Badge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Paid</Badge>;
      case 'Pending': return <Badge variant="warning" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'Overdue': return <Badge variant="danger" className="gap-1"><AlertCircle className="w-3 h-3" /> Overdue</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Invoices</h1>
          <p className="text-slate-500 dark:text-slate-400">Track payments and manage billing.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Create Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-none text-white">
          <CardContent className="p-6 text-white">
            <p className="text-blue-100 font-medium mb-1">Total Revenue (This Month)</p>
            <h3 className="text-3xl font-bold">$4,250.00</h3>
          </CardContent>
        </Card>
        <Card>
           <CardContent className="p-6">
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Pending</p>
            <h3 className="text-3xl font-bold text-amber-500">$850.00</h3>
          </CardContent>
        </Card>
        <Card>
           <CardContent className="p-6">
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Overdue</p>
            <h3 className="text-3xl font-bold text-red-500">$75.00</h3>
          </CardContent>
        </Card>
      </div>

      <Card>
         <CardHeader>
           <div className="flex items-center gap-4">
             <CardTitle>Recent Invoices</CardTitle>
             <div className="flex gap-2">
               <Badge variant="default" className="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600">All</Badge>
               <Badge variant="default" className="bg-transparent border-transparent text-slate-500 hover:text-slate-700 cursor-pointer">Paid</Badge>
               <Badge variant="default" className="bg-transparent border-transparent text-slate-500 hover:text-slate-700 cursor-pointer">Pending</Badge>
             </div>
           </div>
         </CardHeader>
         <CardContent className="p-0">
           <table className="w-full text-left text-sm">
             <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
               <tr>
                 <th className="px-6 py-4">Invoice ID</th>
                 <th className="px-6 py-4">Client</th>
                 <th className="px-6 py-4">Date Issued</th>
                 <th className="px-6 py-4">Due Date</th>
                 <th className="px-6 py-4">Amount</th>
                 <th className="px-6 py-4">Status</th>
                 <th className="px-6 py-4 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
               {invoices.map((inv) => (
                 <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                   <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400">{inv.id}</td>
                   <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{inv.client}</td>
                   <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{inv.date}</td>
                   <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{inv.due}</td>
                   <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">${inv.amount.toFixed(2)}</td>
                   <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                   <td className="px-6 py-4 text-right">
                     <Button variant="ghost" size="sm">
                       <Download className="w-4 h-4" />
                     </Button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </CardContent>
      </Card>
    </div>
  );
};

export default Invoices;
