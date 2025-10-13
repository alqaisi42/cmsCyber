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
import {Announcement, TPADashboardStats} from "../../core/entities/healthcare";
import {logout} from "../../shared/utils/auth";

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-sm bg-white/90">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Healthcare Claims Portal
                            </h1>
                            <p className="text-sm text-slate-600 mt-1">
                                Welcome back, Dr. Ameen Ibrahim
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Notifications */}
                            <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <Bell className="w-5 h-5 text-slate-600" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                            </button>

                            {/* Language Toggle */}
                            <select className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
                                <option>English</option>
                                <option>العربية</option>
                            </select>

                            {/* Profile */}
                            <div className="flex items-center gap-3 pl-4 border-l border-slate-300">
                                <div className="text-right">
                                    <div className="text-sm font-medium text-slate-900">
                                        Clinic / Ameen Ibrahim Ahmad Abu Leel
                                    </div>
                                    <div className="text-xs text-slate-500">General Practitioner</div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                    AI
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Claims"
                        value="847"
                        change="+12.5%"
                        trend="up"
                        icon={<FileText className="w-6 h-6" />}
                        color="blue"
                    />
                    <StatCard
                        title="Incomplete Claims"
                        value="23"
                        change="-8.2%"
                        trend="down"
                        icon={<AlertCircle className="w-6 h-6" />}
                        color="amber"
                    />
                    <StatCard
                        title="Approval Rate"
                        value="94.2%"
                        change="+2.1%"
                        trend="up"
                        icon={<CheckCircle className="w-6 h-6" />}
                        color="emerald"
                    />
                    <StatCard
                        title="Total Amount"
                        value="$284,320"
                        change="+18.7%"
                        trend="up"
                        icon={<DollarSign className="w-6 h-6" />}
                        color="purple"
                    />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <QuickActionCard
                        title="New Claim"
                        description="Start a new insurance claim"
                        icon={<FileText className="w-8 h-8" />}
                        href="/claims/new"
                        color="blue"
                    />
                    <QuickActionCard
                        title="Patient Search"
                        description="Find patient records"
                        icon={<Users className="w-8 h-8" />}
                        href="/patients"
                        color="indigo"
                    />
                    <QuickActionCard
                        title="View Reports"
                        description="Analytics and insights"
                        icon={<TrendingUp className="w-8 h-8" />}
                        href="/reports"
                        color="purple"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Announcements */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                                <div className="flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-blue-600" />
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        News & Announcements
                                    </h2>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100">
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
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
                            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-emerald-600" />
                                    <h2 className="text-lg font-semibold text-slate-900">
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

                {/* Claims List Preview */}
                <div className="mt-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Recent Claims</h2>
                                <p className="text-sm text-slate-600 mt-1">View and manage your claims</p>
                            </div>
                            <a
                                href="/claims"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                View All Claims
                            </a>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Claim Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Patient No.
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Patient Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Claim No.
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Amount
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
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
                                </tbody>
                            </table>
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
        blue: 'from-blue-500 to-blue-600',
        amber: 'from-amber-500 to-amber-600',
        emerald: 'from-emerald-500 to-emerald-600',
        purple: 'from-purple-500 to-purple-600'
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-slate-900 mb-2">{value}</p>
                    <div className="flex items-center gap-1">
            <span className={`text-sm font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
              {change}
            </span>
                        <span className="text-xs text-slate-500">vs last month</span>
                    </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white`}>
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
        blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
        indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
        purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
    };

    return (
        <a
            href={href}
            className={`group bg-gradient-to-br ${colorClasses[color]} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer`}
        >
            <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{title}</h3>
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
                <div className="flex-shrink-0 w-16 text-center">
                    <div className="text-xs font-medium text-slate-500">{date}</div>
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-600 hover:text-blue-700 mb-1">
                        {title}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2">{description}</p>
                </div>
            </div>
        </div>
    );
}

function ActivityItem({ type, text, time }: { type: string; text: string; time: string }) {
    const iconClass = {
        approved: 'bg-emerald-100 text-emerald-600',
        submitted: 'bg-blue-100 text-blue-600',
        pending: 'bg-amber-100 text-amber-600'
    }[type] || 'bg-slate-100 text-slate-600';

    return (
        <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${iconClass}`}>
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
        'Ready': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Incomplete': 'bg-amber-100 text-amber-700 border-amber-200',
        'Submitted': 'bg-blue-100 text-blue-700 border-blue-200'
    };

    return (
        <tr className="hover:bg-slate-50 transition-colors cursor-pointer">
            <td className="px-6 py-4">
        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${statusColors[status as keyof typeof statusColors]}`}>
          {status}
        </span>
            </td>
            <td className="px-6 py-4 text-sm text-slate-900">{date}</td>
            <td className="px-6 py-4 text-sm text-slate-600">{patientNo}</td>
            <td className="px-6 py-4 text-sm font-medium text-slate-900">{patientName}</td>
            <td className="px-6 py-4 text-sm text-blue-600 font-medium">{claimNo}</td>
            <td className="px-6 py-4 text-sm font-semibold text-slate-900">{amount}</td>
        </tr>
    );
}