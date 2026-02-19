import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  FileSignature, 
  DollarSign, 
  MapPin, 
  Plus, 
  Calendar as CalendarIcon, 
  ChevronRight, 
  Clock,
  TrendingUp,
  CheckCircle2,
  MoreHorizontal,
  Bell,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Badge, 
  Progress,
  Select 
} from '../components/UI';
import AppointmentModal from '../components/AppointmentModal';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// --- Mock Data ---

const revenueData = [
  { name: 'Jan', amount: 2400, prev: 2100 },
  { name: 'Feb', amount: 1398, prev: 1800 },
  { name: 'Mar', amount: 9800, prev: 2200 },
  { name: 'Apr', amount: 3908, prev: 2600 },
  { name: 'May', amount: 4800, prev: 3200 },
  { name: 'Jun', amount: 3800, prev: 3500 },
  { name: 'Jul', amount: 4300, prev: 3800 },
];

const serviceTypeData = [
  { name: 'Loan Signing', value: 45, color: '#3b82f6' },
  { name: 'General Notary', value: 30, color: '#10b981' },
  { name: 'I-9 Verify', value: 15, color: '#8b5cf6' },
  { name: 'Remote (RON)', value: 10, color: '#f59e0b' },
];

const initialAppointments = [
  { id: 1, client: 'Sarah Johnson', type: 'Loan Signing', date: 'Today', time: '2:00 PM', status: 'upcoming', amount: 150, location: 'Downtown Office' },
  { id: 2, client: 'TechCorp Inc', type: 'I-9 Verification', date: 'Today', time: '4:30 PM', status: 'upcoming', amount: 45, location: 'Remote' },
  { id: 3, client: 'Michael Smith', type: 'Power of Attorney', date: 'Yesterday', time: '10:00 AM', status: 'completed', amount: 75, location: 'Client Home' },
  { id: 4, client: 'Estate Realty', type: 'Refinance', date: 'Yesterday', time: '1:00 PM', status: 'completed', amount: 125, location: 'Title Office' },
];

// --- Sub-Components ---

const StatsCard = ({ title, value, change, icon: Icon, trend, targetProgress }) => (
  <Card className="overflow-hidden border-none shadow-sm hover:shadow-lg transition-shadow duration-300">
    <CardContent className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
        <Badge variant={trend === 'up' ? 'success' : trend === 'down' ? 'danger' : 'default'} className="flex items-center gap-1">
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
          {change}
        </Badge>
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
      </div>
      {targetProgress && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Monthly Goal</span>
            <span>{targetProgress}%</span>
          </div>
          <Progress value={targetProgress} className="h-1.5" indicatorClassName={trend === 'down' ? 'bg-red-500' : 'bg-blue-600'} />
        </div>
      )}
    </CardContent>
  </Card>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700">
        <p className="font-semibold mb-1">{label}</p>
        <p className="text-blue-200">Revenue: <span className="text-white font-bold ml-1">${payload[0].value}</span></p>
        <p className="text-slate-400">Prev Year: <span className="text-slate-300 ml-1">${payload[1].value}</span></p>
      </div>
    );
  }
  return null;
};

// --- Main Dashboard Component ---

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [timeRange, setTimeRange] = useState('This Year');

  // Derived Logic
  const totalRevenue = 12450 + appointments.reduce((sum, apt) => sum + (typeof apt.amount === 'number' ? apt.amount : 0), 0);
  const upcomingCount = appointments.filter(a => a.status === 'upcoming').length;

  const handleSaveAppointment = (data) => {
    const newApt = {
      id: Date.now(),
      client: data.client,
      type: data.type,
      date: 'Upcoming', 
      time: data.time,
      status: 'upcoming',
      amount: parseFloat(data.fee) || 0,
      location: data.location || 'TBD'
    };
    setAppointments([newApt, ...appointments]);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <AppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveAppointment}
      />

      {/* Top Navigation / Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <span>Overview for Oct 24, 2025</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span className="text-blue-600 font-medium">{upcomingCount} appointments pending</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search clients..." 
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all w-64 shadow-sm"
            />
          </div>
          <Button variant="secondary" size="icon" className="relative">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="shadow-blue-500/20 shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div variants={itemVariants}>
            <StatsCard 
              title="Total Revenue" 
              value={`$${totalRevenue.toLocaleString()}`} 
              change="12.5%" 
              trend="up"
              icon={DollarSign} 
              targetProgress={78}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard 
              title="Signings" 
              value="48" 
              change="4.2%" 
              trend="up"
              icon={FileSignature} 
              targetProgress={65}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard 
              title="Mileage (YTD)" 
              value="842 mi" 
              change="0.8%" 
              trend="down"
              icon={MapPin} 
              targetProgress={42}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard 
              title="Active Clients" 
              value="124" 
              change="8.1%" 
              trend="up"
              icon={Users} 
            />
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Revenue Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <div>
                  <CardTitle>Financial Performance</CardTitle>
                  <p className="text-sm text-slate-500">Income vs Previous Year</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select 
                    options={[{label: 'This Year', value: 'year'}, {label: 'Last 6 Months', value: '6m'}]}
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="w-36"
                  />
                  <Button variant="secondary" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                        dy={10} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                        tickFormatter={(value) => `$${value}`} 
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="prev" 
                        stroke="#cbd5e1" 
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        fill="transparent"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Service Distribution Chart */}
          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Service Mix</CardTitle>
                <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-[220px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {serviceTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-slate-800">100%</span>
                    <span className="text-xs text-slate-500 uppercase font-medium">Distribution</span>
                  </div>
                </div>
                <div className="w-full mt-6 space-y-3">
                  {serviceTypeData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                      <span className="font-semibold text-slate-900">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Section: Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Detailed Appointment List */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <CardTitle>Recent Appointments</CardTitle>
                  <Badge variant="blue">{appointments.length} Total</Badge>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 font-medium hover:bg-blue-50">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer">
                      <div className="flex items-start gap-4 mb-4 sm:mb-0">
                        <div className={`p-3 rounded-xl transition-all duration-300 ${
                          apt.status === 'upcoming' 
                            ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-md' 
                            : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-md'
                        }`}>
                          {apt.status === 'upcoming' ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{apt.client}</h4>
                          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>{apt.type}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {apt.location}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        <div className="text-right">
                          <p className="font-bold text-slate-900">${apt.amount}</p>
                          <p className="text-xs text-slate-500">{apt.date}</p>
                        </div>
                        <Badge variant={apt.status === 'upcoming' ? 'blue' : 'success'} className="px-3 py-1">
                          {apt.status === 'upcoming' ? 'Scheduled' : 'Completed'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Smart Quick Actions */}
          <motion.div variants={itemVariants} className="space-y-6">
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl">
              <CardHeader className="border-slate-700">
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="p-1 bg-blue-500 rounded"><Plus className="w-4 h-4 text-white" /></div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button onClick={() => setIsModalOpen(true)} className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800/50 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 transition-all group">
                  <span className="font-medium">New Appointment</span>
                  <div className="bg-slate-700 p-1.5 rounded-lg group-hover:bg-white/20 transition-colors">
                    <Clock className="w-4 h-4 text-slate-300 group-hover:text-white" />
                  </div>
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800/50 hover:bg-purple-600 border border-slate-700 hover:border-purple-500 transition-all group">
                  <span className="font-medium">Create Invoice</span>
                  <div className="bg-slate-700 p-1.5 rounded-lg group-hover:bg-white/20 transition-colors">
                    <FileSignature className="w-4 h-4 text-slate-300 group-hover:text-white" />
                  </div>
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800/50 hover:bg-emerald-600 border border-slate-700 hover:border-emerald-500 transition-all group">
                  <span className="font-medium">Log Mileage</span>
                  <div className="bg-slate-700 p-1.5 rounded-lg group-hover:bg-white/20 transition-colors">
                    <MapPin className="w-4 h-4 text-slate-300 group-hover:text-white" />
                  </div>
                </button>
              </CardContent>
            </Card>

            {/* Mini Marketing / Tip Card */}
             <div className="rounded-xl p-6 border border-blue-100 bg-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                <h4 className="font-semibold text-slate-900 mb-2 relative z-10">Tax Tip 💡</h4>
                <p className="text-sm text-slate-600 mb-4 relative z-10">You've driven 842 miles this year. That's a <strong>$564 deduction</strong>. Keep logging!</p>
                <Button variant="outline" size="sm" className="w-full relative z-10 bg-white hover:bg-blue-50 hover:border-blue-200">View Tax Report</Button>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
