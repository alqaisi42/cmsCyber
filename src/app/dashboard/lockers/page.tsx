// src/app/dashboard/lockers/page.tsx
'use client';

import LockerManagementDashboard from '../../../presentation/components/lockers/LockerManagementDashboard';

export default function LockersPage() {
    return <LockerManagementDashboard defaultTab="overview" />;
}
