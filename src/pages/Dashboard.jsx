import React, { useMemo, useState } from 'react';
import { Logo } from '../components/UI';
import {
    LayoutDashboard,
    Calendar,
    FileText,
    Users,
    Settings,
    Bell,
    Search,
    Plus,
    MoreHorizontal,
    ArrowUpRight,
    Menu,
    X,
    Moon,
    Sun,
    Palette,
    TrendingUp,
    CreditCard,
    Activity
} from 'lucide-react';

const themes = {
    skydash: {
        name: 'Skydash',
        shell: 'bg-slate-100 text-slate-900',
        surface: 'bg-white border-slate-200 text-slate-900',
        muted: 'text-slate-500',
        menuIdle: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        menuActive: 'bg-indigo-50 text-indigo-700',
        accent: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        softAccent: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        input: 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
    },
    purple: {
        name: 'Purple Admin',
        shell: 'bg-violet-50 text-slate-900',
        surface: 'bg-white border-violet-100 text-slate-900',
        muted: 'text-slate-500',
        menuIdle: 'text-slate-600 hover:bg-violet-100 hover:text-violet-900',
        menuActive: 'bg-violet-100 text-violet-700',
        accent: 'bg-violet-600 hover:bg-violet-700 text-white',
        softAccent: 'bg-violet-100 text-violet-700 border-violet-200',
        input: 'bg-white border-violet-200 text-slate-800 placeholder-slate-400'
    },
    azia: {
        name: 'Azia Admin',
        shell: 'bg-cyan-50 text-slate-900',
        surface: 'bg-white border-cyan-100 text-slate-900',
        muted: 'text-slate-500',
        menuIdle: 'text-slate-600 hover:bg-cyan-100 hover:text-cyan-900',
        menuActive: 'bg-cyan-100 text-cyan-700',
        accent: 'bg-cyan-600 hover:bg-cyan-700 text-white',
        softAccent: 'bg-cyan-100 text-cyan-700 border-cyan-200',
        input: 'bg-white border-cyan-200 text-slate-800 placeholder-slate-400'
    },
    star: {
        name: 'Star Admin',
        shell: 'bg-amber-50 text-slate-900',
        surface: 'bg-white border-amber-100 text-slate-900',
        muted: 'text-slate-500',
        menuIdle: 'text-slate-600 hover:bg-amber-100 hover:text-amber-900',
        menuActive: 'bg-amber-100 text-amber-700',
        accent: 'bg-amber-500 hover:bg-amber-600 text-white',
        softAccent: 'bg-amber-100 text-amber-700 border-amber-200',
        input: 'bg-white border-amber-200 text-slate-800 placeholder-slate-400'
    },
    pollux: {
        name: 'Pollux Admin',
        shell: 'bg-emerald-50 text-slate-900',
        surface: 'bg-white border-emerald-100 text-slate-900',
        muted: 'text-slate-500',
        menuIdle: 'text-slate-600 hover:bg-emerald-100 hover:text-emerald-900',
        menuActive: 'bg-emerald-100 text-emerald-700',
        accent: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        softAccent: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        input: 'bg-white border-emerald-200 text-slate-800 placeholder-slate-400'
    },
    dark: {
        name: 'Dark Mode',
        shell: 'bg-slate-950 text-slate-100',
        surface: 'bg-slate-900 border-slate-800 text-slate-100',
        muted: 'text-slate-400',
        menuIdle: 'text-slate-300 hover:bg-slate-800 hover:text-white',
        menuActive: 'bg-slate-800 text-indigo-300',
        accent: 'bg-indigo-500 hover:bg-indigo-400 text-white',
        softAccent: 'bg-slate-800 text-indigo-300 border-slate-700',
        input: 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400'
    }
};

const appointments = [
    { client: 'Michael Scott', service: 'Loan Signing', date: 'Oct 24, 2:00 PM', status: 'Paid', amount: '$150.00' },
    { client: 'Dwight Schrute', service: 'General Notary', date: 'Oct 25, 10:00 AM', status: 'Pending', amount: '$45.00' },
    { client: 'Jim Halpert', service: 'Refinance', date: 'Oct 26, 9:00 AM', status: 'Scheduled', amount: '$125.00' },
    { client: 'Pam Beesly', service: 'Power of Attorney', date: 'Oct 27, 1:30 PM', status: 'Scheduled', amount: '$80.00' }
];

const statusClassMap = {
    Paid: 'bg-emerald-100 text-emerald-700',
    Pending: 'bg-amber-100 text-amber-700',
    Scheduled: 'bg-sky-100 text-sky-700'
};

export default function Dashboard({ onLogout }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [themeKey, setThemeKey] = useState('skydash');
    const [isDark, setIsDark] = useState(false);

    const activeTheme = useMemo(() => {
        if (isDark) {
            return themes.dark;
        }
        return themes[themeKey] || themes.skydash;
    }, [isDark, themeKey]);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', active: true },
        { icon: Calendar, label: 'Schedule' },
        { icon: FileText, label: 'Journal' },
        { icon: Users, label: 'Clients' }
    ];

    const stats = [
        {
            icon: CreditCard,
            title: 'Total Revenue',
            value: '$4,250.00',
            meta: '12% from last month'
        },
        {
            icon: TrendingUp,
            title: 'Appointments',
            value: '24',
            meta: 'This month'
        },
        {
            icon: Activity,
            title: 'Completion Rate',
            value: '93%',
            meta: 'On-time closings'
        }
    ];

    return (
        <div className={`min-h-screen transition-colors duration-300 ${activeTheme.shell}`}>
            <div className="flex min-h-screen">
                <aside className={`fixed inset-y-0 left-0 z-30 w-72 transform border-r p-4 transition-transform duration-200 md:translate-x-0 md:static md:w-64 ${activeTheme.surface} ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex items-center justify-between border-b border-inherit pb-4">
                        <Logo />
                        <button className="rounded-lg p-2 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="pt-5">
                        <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${activeTheme.muted}`}>Main Menu</p>
                        <nav className="space-y-1">
                            {navItems.map(({ icon: Icon, label, active }) => (
                                <a
                                    href="#"
                                    key={label}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? activeTheme.menuActive : activeTheme.menuIdle}`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </a>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-6 rounded-xl border border-inherit p-3">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                            <Palette className="h-4 w-4" /> Theme Presets
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(themes)
                                .filter(([key]) => key !== 'dark')
                                .map(([key, theme]) => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setThemeKey(key);
                                            setIsDark(false);
                                        }}
                                        className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${themeKey === key && !isDark ? activeTheme.softAccent : 'border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                    >
                                        {theme.name}
                                    </button>
                                ))}
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className={`mt-6 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${activeTheme.menuIdle}`}
                    >
                        <Settings className="h-4 w-4" /> Sign Out
                    </button>
                </aside>

                {isMobileMenuOpen && (
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 z-20 bg-black/40 md:hidden"
                        aria-label="Close menu"
                    />
                )}

                <main className="flex-1 md:ml-0">
                    <header className={`sticky top-0 z-10 border-b px-4 py-3 sm:px-6 ${activeTheme.surface}`}>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                className="rounded-lg border border-inherit p-2 md:hidden"
                                onClick={() => setIsMobileMenuOpen(true)}
                            >
                                <Menu className="h-5 w-5" />
                            </button>

                            <div className="relative min-w-[180px] flex-1">
                                <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${activeTheme.muted}`} />
                                <input
                                    type="text"
                                    placeholder="Search clients, invoices..."
                                    className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${activeTheme.input}`}
                                />
                            </div>

                            <button
                                onClick={() => setIsDark((prev) => !prev)}
                                className={`inline-flex items-center gap-2 rounded-lg border border-inherit px-3 py-2 text-sm font-medium ${activeTheme.softAccent}`}
                            >
                                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                {isDark ? 'Light' : 'Dark'}
                            </button>

                            <button className="relative rounded-full p-2">
                                <Bell className="h-5 w-5" />
                                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
                            </button>
                            <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold ${activeTheme.softAccent}`}>
                                SJ
                            </div>
                        </div>
                    </header>

                    <section className="p-4 sm:p-6">
                        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-bold">Skydash-style Dashboard</h1>
                                <p className={`text-sm ${activeTheme.muted}`}>
                                    Mobile-first, reusable UI blocks with theme customization.
                                </p>
                            </div>
                            <button className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${activeTheme.accent}`}>
                                <Plus className="h-4 w-4" /> New Appointment
                            </button>
                        </div>

                        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {stats.map(({ icon: Icon, title, value, meta }) => (
                                <article key={title} className={`rounded-xl border p-5 shadow-sm ${activeTheme.surface}`}>
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className={`rounded-lg p-2 ${activeTheme.softAccent}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                                            <ArrowUpRight className="mr-1 h-3 w-3" />
                                            8%
                                        </span>
                                    </div>
                                    <p className={`text-sm ${activeTheme.muted}`}>{title}</p>
                                    <h3 className="text-2xl font-bold">{value}</h3>
                                    <p className={`mt-1 text-xs ${activeTheme.muted}`}>{meta}</p>
                                </article>
                            ))}
                        </div>

                        <div className={`overflow-hidden rounded-xl border shadow-sm ${activeTheme.surface}`}>
                            <div className="flex items-center justify-between border-b border-inherit px-4 py-3">
                                <h3 className="font-semibold">Recent Appointments</h3>
                                <button className="text-sm font-medium text-indigo-600 hover:underline">View All</button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="border-b border-inherit text-xs uppercase tracking-wide">
                                        <tr>
                                            <th className="px-4 py-3">Client</th>
                                            <th className="px-4 py-3">Service</th>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-right">Amount</th>
                                            <th className="px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {appointments.map((appointment) => (
                                            <tr key={`${appointment.client}-${appointment.date}`} className="border-b border-inherit last:border-b-0">
                                                <td className="px-4 py-3 font-medium">{appointment.client}</td>
                                                <td className={`px-4 py-3 ${activeTheme.muted}`}>{appointment.service}</td>
                                                <td className={`px-4 py-3 ${activeTheme.muted}`}>{appointment.date}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassMap[appointment.status]}`}>
                                                        {appointment.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">{appointment.amount}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button className="rounded p-1 hover:bg-slate-100">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
