import React, { useState } from 'react';
import { Plus, Download, CheckCircle2, Clock, AlertCircle, LayoutGrid, List as ListIcon, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../components/UI';
import { useData } from '../context/DataContext';

const Invoices = () => {
  const [viewMode, setViewMode] = useState('board');
  const { data } = useData();
  const invoices = data.invoices || [];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Paid': return <Badge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Paid</Badge>;
      case 'Pending': return <Badge variant="warning" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'Overdue': return <Badge variant="danger" className="gap-1"><AlertCircle className="w-3 h-3" /> Overdue</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const columns = {
    'Draft': invoices.filter(i => i.status === 'Draft'),
    'Pending': invoices.filter(i => i.status === 'Pending'),
    'Overdue': invoices.filter(i => i.status === 'Overdue'),
    'Paid': invoices.filter(i => i.status === 'Paid'),
  };

  const totalCollected = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0);
  const totalOutstanding = invoices.filter(i => i.status === 'Pending').reduce((sum, i) => sum + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === 'Overdue').reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Invoices</h1>
          <p className="text-slate-500 dark:text-slate-400">Track payments and manage billing pipeline.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}><ListIcon className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('board')} className={`p-2 rounded-md transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}><LayoutGrid className="w-4 h-4" /></button>
          </div>
          <Button variant="secondary" className="hidden sm:flex"><Download className="w-4 h-4 mr-2" /> Export</Button>
          <Button><Plus className="w-4 h-4 mr-2" /> Create Invoice</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-none text-white shadow-lg shadow-blue-500/20">
          <CardContent className="p-6 text-white">
            <p className="text-blue-100 font-medium mb-1 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Collected</p>
            <h3 className="text-3xl font-bold">${totalCollected.toFixed(2)}</h3>
          </CardContent>
        </Card>
        <Card>
           <CardContent className="p-6">
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-2"><Clock className="w-4 h-4" /> Outstanding</p>
            <h3 className="text-3xl font-bold text-amber-500">${totalOutstanding.toFixed(2)}</h3>
          </CardContent>
        </Card>
        <Card>
           <CardContent className="p-6">
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Overdue</p>
            <h3 className="text-3xl font-bold text-red-500">${totalOverdue.toFixed(2)}</h3>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'list' ? (
        <Card>
           <CardHeader><CardTitle>All Invoices</CardTitle></CardHeader>
           <CardContent className="p-0 overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                 <tr>
                   <th className="px-6 py-4">Invoice ID</th>
                   <th className="px-6 py-4">Client</th>
                   <th className="px-6 py-4">Date</th>
                   <th className="px-6 py-4">Amount</th>
                   <th className="px-6 py-4">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                 {invoices.map((inv) => (
                   <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                     <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400">{inv.id}</td>
                     <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{inv.client}</td>
                     <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{inv.date}</td>
                     <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">${inv.amount.toFixed(2)}</td>
                     <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(columns).map(([title, items]) => (
            <div key={title} className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400">{items.length}</span>
              </div>
              <div className="flex flex-col gap-3 min-h-[200px]">
                {items.length === 0 ? (
                  <div className="h-24 rounded-lg border-2 border-dashed border-slate-100 dark:border-slate-800 flex items-center justify-center text-xs text-slate-400">No invoices</div>
                ) : (
                  items.map(inv => (
                    <Card key={inv.id} className="p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-slate-400">{inv.id}</span>
                        {getStatusBadge(inv.status)}
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-1">{inv.client}</h4>
                      <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">${inv.amount.toFixed(2)}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3" /> Due {inv.due}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Invoices;
