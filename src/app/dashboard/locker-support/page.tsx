// src/app/dashboard/locker-support/page.tsx
'use client';

import LockerSupportWorkspace from '../../../presentation/components/lockers/LockerSupportWorkspace';

export default function LockerSupportPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
                <LockerSupportWorkspace />
            </div>
        </div>
    );
}