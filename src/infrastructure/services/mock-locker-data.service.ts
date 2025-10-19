// src/infrastructure/services/mock-locker-data.service.ts

import { LockerDashboardResponse } from '../../core/entities/locker-dashboard';

export class MockLockerDataService {
    static generateMockData(userId: number, userName?: string): LockerDashboardResponse {
        const currentDate = new Date();
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const nextYear = new Date(currentDate);
        nextYear.setFullYear(nextYear.getFullYear() + 1);

        return {
            success: true,
            data: {
                user: {
                    id: userId,
                    name: userName || `User ${userId}`,
                    email: `user${userId}@example.com`,
                    totalSubscriptions: 3,
                    totalSharedAccess: 1
                },
                ownedSubscriptions: [
                    {
                        id: `sub-${userId}-001`,
                        location: {
                            id: "loc-001",
                            code: "LOC-001",
                            name: "Downtown Hub",
                            address: "123 Main Street, City Center",
                            latitude: 31.9539,
                            longitude: 35.9106
                        },
                        plan: {
                            id: "plan-001",
                            name: "Standard 5 Lockers",
                            code: "STANDARD_5",
                            capacity: 5,
                            monthlyPrice: 19.99,
                            annualPrice: 199.99
                        },
                        status: "ACTIVE",
                        billingCycle: "MONTHLY",
                        startDate: currentDate.toISOString(),
                        endDate: nextMonth.toISOString(),
                        autoRenew: true,
                        currentUsage: 2,
                        availableCapacity: 3,
                        sharedWith: [
                            {
                                userId: userId + 1,
                                name: "John Doe",
                                sharingType: "BASIC",
                                accessLevel: "BASIC_ACCESS",
                                allocatedBalance: 2,
                                currentUsage: 1
                            }
                        ]
                    },
                    {
                        id: `sub-${userId}-002`,
                        location: {
                            id: "loc-002",
                            code: "LOC-002",
                            name: "Mall Branch",
                            address: "456 Shopping Ave, Mall District",
                            latitude: 31.956578,
                            longitude: 35.945695
                        },
                        plan: {
                            id: "plan-002",
                            name: "Premium 10 Lockers",
                            code: "PREMIUM_10",
                            capacity: 10,
                            monthlyPrice: 39.99,
                            annualPrice: 399.99
                        },
                        status: "ACTIVE",
                        billingCycle: "ANNUALLY",
                        startDate: currentDate.toISOString(),
                        endDate: nextYear.toISOString(),
                        autoRenew: true,
                        currentUsage: 5,
                        availableCapacity: 5,
                        sharedWith: []
                    }
                ],
                sharedSubscriptions: [
                    {
                        id: `shared-sub-001`,
                        location: {
                            id: "loc-003",
                            code: "LOC-003",
                            name: "Airport Terminal",
                            address: "789 Airport Road, Terminal 2",
                            latitude: 31.963158,
                            longitude: 35.960293
                        },
                        plan: {
                            id: "plan-003",
                            name: "Basic 2 Lockers",
                            code: "BASIC_2",
                            capacity: 2,
                            monthlyPrice: 9.99,
                            annualPrice: 99.99
                        },
                        status: "ACTIVE",
                        billingCycle: "MONTHLY",
                        startDate: currentDate.toISOString(),
                        endDate: nextMonth.toISOString(),
                        autoRenew: false,
                        currentUsage: 1,
                        availableCapacity: 1,
                        sharedWith: []
                    }
                ],
                activeReservations: [
                    {
                        id: `res-${userId}-001`,
                        locker: {
                            id: "locker-001",
                            code: "L-001-SMALL",
                            name: "Locker 1A",
                            size: "SMALL",
                            status: "OCCUPIED"
                        },
                        location: {
                            id: "loc-001",
                            code: "LOC-001",
                            name: "Downtown Hub",
                            address: "123 Main Street, City Center",
                            latitude: 31.9539,
                            longitude: 35.9106
                        },
                        orderId: `order-${Date.now()}`,
                        reservedFrom: currentDate.toISOString(),
                        reservedUntil: new Date(currentDate.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
                        reservationType: "INCOMING_DELIVERY",
                        status: "ACTIVE",
                        accessCode: "AC" + Math.floor(1000 + Math.random() * 9000),
                        createdAt: currentDate.toISOString()
                    },
                    {
                        id: `res-${userId}-002`,
                        locker: {
                            id: "locker-002",
                            code: "L-002-MEDIUM",
                            name: "Locker 2B",
                            size: "MEDIUM",
                            status: "RESERVED"
                        },
                        location: {
                            id: "loc-002",
                            code: "LOC-002",
                            name: "Mall Branch",
                            address: "456 Shopping Ave, Mall District",
                            latitude: 31.956578,
                            longitude: 35.945695
                        },
                        orderId: `order-${Date.now() + 1}`,
                        reservedFrom: new Date(currentDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour from now
                        reservedUntil: new Date(currentDate.getTime() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
                        reservationType: "PERSONAL_USE",
                        status: "ACTIVE",
                        accessCode: "AC" + Math.floor(1000 + Math.random() * 9000),
                        createdAt: currentDate.toISOString()
                    }
                ],
                pastReservations: [],
                availableLocations: [
                    {
                        location: {
                            id: "loc-001",
                            code: "LOC-001",
                            name: "Downtown Hub",
                            address: "123 Main Street, City Center",
                            latitude: 31.9539,
                            longitude: 35.9106
                        },
                        totalLockers: 20,
                        availableLockers: 12,
                        lockersBySize: {
                            SMALL: 5,
                            MEDIUM: 4,
                            LARGE: 3
                        }
                    },
                    {
                        location: {
                            id: "loc-002",
                            code: "LOC-002",
                            name: "Mall Branch",
                            address: "456 Shopping Ave, Mall District",
                            latitude: 31.956578,
                            longitude: 35.945695
                        },
                        totalLockers: 15,
                        availableLockers: 8,
                        lockersBySize: {
                            SMALL: 3,
                            MEDIUM: 3,
                            LARGE: 2
                        }
                    }
                ],
                familyMembers: [
                    {
                        userId: userId + 1,
                        name: "John Doe",
                        email: "john.doe@example.com",
                        subscriptionName: "Standard 5 Lockers",
                        locationName: "Downtown Hub",
                        sharingType: "BASIC",
                        accessLevel: "BASIC_ACCESS",
                        allocatedBalance: 2,
                        status: "ACTIVE"
                    },
                    {
                        userId: userId + 2,
                        name: "Jane Smith",
                        email: "jane.smith@example.com",
                        subscriptionName: "Premium 10 Lockers",
                        locationName: "Mall Branch",
                        sharingType: "OWNER",
                        accessLevel: "MANAGE_SHARING",
                        allocatedBalance: null,
                        status: "ACTIVE"
                    }
                ],
                statistics: {
                    totalReservations: 25,
                    activeReservations: 2,
                    completedReservations: 23,
                    totalCapacity: 15,
                    usedCapacity: 7,
                    mostUsedLocation: "Downtown Hub",
                    mostUsedSize: "MEDIUM",
                    totalFamilyMembers: 2
                }
            },
            message: "Mock data generated successfully",
            errors: [],
            timestamp: currentDate.toISOString()
        };
    }

    static generateEmptyData(userId: number, userName?: string): LockerDashboardResponse {
        return {
            success: true,
            data: {
                user: {
                    id: userId,
                    name: userName || `User ${userId}`,
                    email: `user${userId}@example.com`,
                    totalSubscriptions: 0,
                    totalSharedAccess: 0
                },
                ownedSubscriptions: [],
                sharedSubscriptions: [],
                activeReservations: [],
                pastReservations: [],
                availableLocations: [],
                familyMembers: [],
                statistics: {
                    totalReservations: 0,
                    activeReservations: 0,
                    completedReservations: 0,
                    totalCapacity: 0,
                    usedCapacity: 0,
                    mostUsedLocation: "N/A",
                    mostUsedSize: "N/A",
                    totalFamilyMembers: 0
                }
            },
            message: "No locker data found for this user",
            errors: [],
            timestamp: new Date().toISOString()
        };
    }
}