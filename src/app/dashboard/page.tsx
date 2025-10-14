// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
    Activity,
    FileText,
    Users,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Clock,
    DollarSign,
    Calendar,
    Bell, LogOut
} from 'lucide-react';
// Types
interface Announcement {
    id: string;
    date: string;
    title: string;
    description: string;
}

interface TPADashboardStats {
    totalClaims: number;
    incompleteClaims: number;
    approvalRate: number;
    // totalAmount: number;
}

// Auth utility
const logout = () => {
    // Clear any auth tokens/session
    if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userSession');
        window.location.href = '/login';
    }
};

export default function DashboardPage() {
    const [stats, setStats] = useState<TPADashboardStats | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch dashboard data
        // TODO: Replace with actual API call
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        // Mock data for now
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-300 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900">
                                Healthcare Claims Management System
                            </h1>
                            <p className="text-sm text-slate-600 mt-0.5">
                                Dr. Ameen Ibrahim - General Practitioner
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Notifications */}
                            <button className="relative p-2 hover:bg-slate-50 rounded border border-slate-300 transition-colors">
                                <Bell className="w-4 h-4 text-slate-600" />
                                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-600 rounded-full border border-white" />
                            </button>

                            {/* Language Toggle */}
                            <select className="px-3 py-2 border border-slate-300 rounded text-sm bg-white text-slate-700 font-medium">
                                <option>English</option>
                                <option>العربية</option>
                            </select>

                            {/* Profile */}
                            <div className="flex items-center gap-3 pl-3 border-l border-slate-300">
                                <div className="text-right">
                                    <div className="text-sm font-medium text-slate-900">
                                        Clinic / Ameen Ibrahim Ahmad Abu Leel
                                    </div>
                                    <div className="text-xs text-slate-600">Provider ID: CLI-2025-001</div>
                                </div>
                                <div className="w-9 h-9 rounded bg-slate-700 flex items-center justify-center text-white text-sm font-medium">
                                    AI
                                </div>
                            </div>

                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded border border-slate-300 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                    <StatCard
                        title="Total Claims"
                        value="847"
                        change="+12.5%"
                        trend="up"
                        icon={<FileText className="w-5 h-5" />}
                        color="blue"
                    />
                    <StatCard
                        title="Incomplete Claims"
                        value="23"
                        change="-8.2%"
                        trend="down"
                        icon={<AlertCircle className="w-5 h-5" />}
                        color="amber"
                    />
                    <StatCard
                        title="Approval Rate"
                        value="94.2%"
                        change="+2.1%"
                        trend="up"
                        icon={<CheckCircle className="w-5 h-5" />}
                        color="emerald"
                    />
                    {/*<StatCard*/}
                    {/*    title="Total Amount"*/}
                    {/*    value="$284,320"*/}
                    {/*    change="+18.7%"*/}
                    {/*    trend="up"*/}
                    {/*    icon={<DollarSign className="w-5 h-5" />}*/}
                    {/*    color="purple"*/}
                    {/*/>*/}
                </div>

                {/* Claims List - HIGH PRIORITY */}
                <div className="mb-6">
                    <div className="bg-white rounded border-2">
                        <div className="px-6 py-5 border-b-2  bg-blue-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                        <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Claims Management</h2>
                                    </div>
                                    <p className="text-sm text-slate-700 font-medium">Review and process pending claims</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <a
                                        href="/claims/new"
                                        className="px-4 py-2.5 bg-blue-700 text-white rounded text-sm font-semibold hover:bg-blue-800 transition-colors border border-blue-800 shadow-sm"
                                    >
                                        + New Claim
                                    </a>
                                    <a
                                        href="/claims"
                                        className="px-4 py-2.5 bg-white text-blue-700 rounded text-sm font-semibold hover:bg-slate-50 transition-colors border-2 border-blue-700"
                                    >
                                        View All Claims
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-100 border-b-2 border-slate-300">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Claim Date
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Patient No.
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Patient Name
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Claim No.
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                <ClaimRow
                                    status="Ready"
                                    date="9/23/2025"
                                    patientNo="145*95005*0"
                                    patientName="Fawaz Maher Hamdan"
                                    claimNo="H001-117771"
                                    amount="$450.00"
                                />
                                <ClaimRow
                                    status="Incomplete"
                                    date="10/8/2025"
                                    patientNo="145*94718*0"
                                    patientName="Ahmad Qalsi Test Co..."
                                    claimNo="0001-"
                                    amount="$320.00"
                                />
                                <ClaimRow
                                    status="Ready"
                                    date="6/23/2025"
                                    patientNo="145*94718*0"
                                    patientName="Fawaz Maher Hamdan"
                                    claimNo="H001-117771"
                                    amount="$580.00"
                                />
                                <ClaimRow
                                    status="Submitted"
                                    date="6/20/2025"
                                    patientNo="145*94820*0"
                                    patientName="Sara Ahmed Hassan"
                                    claimNo="H001-117772"
                                    amount="$720.00"
                                />
                                <ClaimRow
                                    status="Ready"
                                    date="6/18/2025"
                                    patientNo="145*94901*0"
                                    patientName="Mohammed Ali Khalil"
                                    claimNo="H001-117773"
                                    amount="$390.00"
                                />
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                    <QuickActionCard
                        title="Patient Search"
                        description="Search patient records"
                        icon={<Users className="w-6 h-6" />}
                        href="/patients"
                        color="indigo"
                    />
                    <QuickActionCard
                        title="View Reports"
                        description="Access analytics & reports"
                        icon={<TrendingUp className="w-6 h-6" />}
                        href="/reports"
                        color="purple"
                    />
                    <QuickActionCard
                        title="Payment History"
                        description="View payment records"
                        icon={<DollarSign className="w-6 h-6" />}
                        href="/payments"
                        color="blue"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Announcements */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded border border-slate-300 overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-slate-300 bg-slate-50">
                                <div className="flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-slate-700" />
                                    <h2 className="text-base font-semibold text-slate-900">
                                        Official Announcements
                                    </h2>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-200">
                                <AnnouncementItem
                                    date="20/04/2019"
                                    title="Comprehensive health Insurance - Dead Sea"
                                    description="Medexa is participating in the Comprehensive health Insurance - Dead Sea program"
                                />
                                <AnnouncementItem
                                    date="15/04/2019"
                                    title="New Insurance Network Partners"
                                    description="We're excited to announce partnerships with 5 new healthcare providers"
                                />
                                <AnnouncementItem
                                    date="10/04/2019"
                                    title="System Maintenance Schedule"
                                    description="Planned maintenance on April 25th from 2:00 AM to 4:00 AM"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Recent Claims */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded border border-slate-300 shadow-sm">
                            <div className="px-6 py-4 border-b border-slate-300 bg-slate-50">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-slate-700" />
                                    <h2 className="text-base font-semibold text-slate-900">
                                        Recent Activity
                                    </h2>
                                </div>
                            </div>

                            <div className="p-4 space-y-3">
                                <ActivityItem
                                    type="approved"
                                    text="Claim #H001-117771 approved"
                                    time="2 hours ago"
                                />
                                <ActivityItem
                                    type="submitted"
                                    text="New claim submitted for Fawaz Hamdan"
                                    time="5 hours ago"
                                />
                                <ActivityItem
                                    type="pending"
                                    text="Claim #0001- awaiting documents"
                                    time="1 day ago"
                                />
                                <ActivityItem
                                    type="approved"
                                    text="Payment processed - $2,450"
                                    time="2 days ago"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface StatCardProps {
    title: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
    icon: React.ReactNode;
    color: 'blue' | 'amber' | 'emerald' | 'purple';
}

function StatCard({ title, value, change, trend, icon, color }: StatCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200'
    };

    return (
        <div className="bg-white rounded border border-slate-300 p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">{title}</p>
                    <p className="text-2xl font-semibold text-slate-900 mb-2">{value}</p>
                    <div className="flex items-center gap-1.5">
            <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-700' : 'text-red-700'}`}>
              {change}
            </span>
                        <span className="text-xs text-slate-500">from previous period</span>
                    </div>
                </div>
                <div className={`p-2.5 rounded border ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

interface QuickActionCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    color: 'blue' | 'indigo' | 'purple';
}

function QuickActionCard({ title, description, icon, href, color }: QuickActionCardProps) {
    const colorClasses = {
        blue: 'bg-blue-700 border-blue-800 hover:bg-blue-800',
        indigo: 'bg-indigo-700 border-indigo-800 hover:bg-indigo-800',
        purple: 'bg-purple-700 border-purple-800 hover:bg-purple-800'
    };

    return (
        <a
            href={href}
            className={`group ${colorClasses[color]} rounded border p-5 text-white shadow-sm hover:shadow transition-all cursor-pointer`}
        >
            <div className="flex items-start gap-4">
                <div className="p-2.5 bg-white/20 rounded border border-white/30">
                    {icon}
                </div>
                <div className="flex-1">
                    <h3 className="text-base font-semibold mb-1">{title}</h3>
                    <p className="text-sm text-white/90">{description}</p>
                </div>
            </div>
        </a>
    );
}

function AnnouncementItem({ date, title, description }: { date: string; title: string; description: string }) {
    return (
        <div className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-20 text-left">
                    <div className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">{date}</div>
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">
                        {title}
                    </h3>
                    <p className="text-sm text-slate-600">{description}</p>
                </div>
            </div>
        </div>
    );
}

function ActivityItem({ type, text, time }: { type: string; text: string; time: string }) {
    const iconClass = {
        approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        submitted: 'bg-blue-50 text-blue-700 border-blue-200',
        pending: 'bg-amber-50 text-amber-700 border-amber-200'
    }[type] || 'bg-slate-100 text-slate-600';

    return (
        <div className="flex items-start gap-3">
            <div className={`p-2 rounded border ${iconClass}`}>
                <CheckCircle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{text}</p>
                <p className="text-xs text-slate-500 mt-0.5">{time}</p>
            </div>
        </div>
    );
}

function ClaimRow({ status, date, patientNo, patientName, claimNo, amount }: any) {
    const statusColors = {
        'Ready': 'bg-emerald-50 text-emerald-800 border-emerald-300',
        'Incomplete': 'bg-amber-50 text-amber-800 border-amber-300',
        'Submitted': 'bg-blue-50 text-blue-800 border-blue-300'
    };

    return (
        <tr className="hover:bg-blue-50 transition-colors border-l-4 border-l-transparent hover:border-l-blue-600">
            <td className="px-6 py-4">
        <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded border ${statusColors[status as keyof typeof statusColors]}`}>
          {status}
        </span>
            </td>
            <td className="px-6 py-4 text-sm font-medium text-slate-700">{date}</td>
            <td className="px-6 py-4 text-sm text-slate-600 font-mono">{patientNo}</td>
            <td className="px-6 py-4 text-sm font-semibold text-slate-900">{patientName}</td>
            <td className="px-6 py-4 text-sm text-blue-700 font-bold">{claimNo}</td>
            <td className="px-6 py-4 text-sm font-bold text-slate-900">{amount}</td>
            <td className="px-6 py-4">
                <button className="px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded border border-blue-300 transition-colors">
                    View Details
                </button>
            </td>
        </tr>
    );
}