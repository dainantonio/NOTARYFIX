import React from 'react';
import { Logo } from '../components/UI';
import { 
    LayoutDashboard, Calendar, FileText, Users, Settings, 
    Bell, Search, Plus, MoreHorizontal, ArrowUpRight
} from 'lucide-react';

export default function Dashboard({ onLogout }) {
    return (
        <div className="min-h-screen bg-slate-50 flex animate-fade-in font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-20">
                <div className="p-6">
                    <Logo />
                </div>
                <div className="px-4 py-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Main Menu</p>
                    <nav className="space-y-1">
                        <a href="#" className="flex items-center gap-3 px-3 py-2.5 bg-brand-50 text-brand-700 rounded-lg font-medium transition-colors">
                            <LayoutDashboard className="w-5 h-5" /> Dashboard
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-medium transition-colors">
                            <Calendar className="w-5 h-5" /> Schedule
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-medium transition-colors">
                            <FileText className="w-5 h-5" /> Journal
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-medium transition-colors">
                            <Users className="w-5 h-5" /> Clients
                        </a>
                    </nav>
                </div>
                <div className="mt-auto p-4 border-t border-slate-100">
                    <button onClick={onLogout} className="flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:text-red-600 font-medium w-full transition-colors rounded-lg hover:bg-red-50">
                        <Settings className="w-5 h-5" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="flex items-center gap-4 w-1/3">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search clients, invoices..." 
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-xs border border-brand-200">
                            SJ
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                            <p className="text-slate-500">Welcome back, Sarah.</p>
                        </div>
                        <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors">
                            <Plus className="w-4 h-4" /> New Appointment
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-green-50 rounded-lg text-green-600"><span className="text-2xl font-bold">$</span></div>
                                <span className="flex items-center text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full"><ArrowUpRight className="w-3 h-3 mr-1"/> 12%</span>
                            </div>
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Total Revenue</p>
                                <h3 className="text-3xl font-bold text-slate-900">$4,250.00</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                             <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Calendar className="w-6 h-6" /></div>
                                <span className="flex items-center text-blue-600 text-xs font-bold bg-blue-50 px-2 py-1 rounded-full">This Month</span>
                            </div>
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Appointments</p>
                                <h3 className="text-3xl font-bold text-slate-900">24</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                             <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><FileText className="w-6 h-6" /></div>
                                <span className="flex items-center text-purple-600 text-xs font-bold bg-purple-50 px-2 py-1 rounded-full">Pending</span>
                            </div>
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Open Invoices</p>
                                <h3 className="text-3xl font-bold text-slate-900">3</h3>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Recent Appointments</h3>
                            <button className="text-sm text-brand-600 font-medium hover:underline">View All</button>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3">Client</th>
                                    <th className="px-6 py-3">Service</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">Michael Scott</td>
                                    <td className="px-6 py-4 text-slate-500">Loan Signing</td>
                                    <td className="px-6 py-4 text-slate-500">Oct 24, 2:00 PM</td>
                                    <td className="px-6 py-4"><span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-bold">Paid</span></td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-900">$150.00</td>
                                    <td className="px-6 py-4 text-right"><button className="text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-5 h-5" /></button></td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">Dwight Schrute</td>
                                    <td className="px-6 py-4 text-slate-500">General Notary</td>
                                    <td className="px-6 py-4 text-slate-500">Oct 25, 10:00 AM</td>
                                    <td className="px-6 py-4"><span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-bold">Pending</span></td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-900">$45.00</td>
                                    <td className="px-6 py-4 text-right"><button className="text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-5 h-5" /></button></td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">Jim Halpert</td>
                                    <td className="px-6 py-4 text-slate-500">Refinance</td>
                                    <td className="px-6 py-4 text-slate-500">Oct 26, 9:00 AM</td>
                                    <td className="px-6 py-4"><span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold">Scheduled</span></td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-900">$125.00</td>
                                    <td className="px-6 py-4 text-right"><button className="text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-5 h-5" /></button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
