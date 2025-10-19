// src/infrastructure/services/locker-dashboard.service.ts

import { LockerDashboardResponse } from '../../core/entities/locker-dashboard';
import { MockLockerDataService } from './mock-locker-data.service';

// Toggle this to switch between real API and mock data
const USE_MOCK_DATA = false; // Set to true for development without backend

class LockerDashboardService {
    private readonly baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://148.230.111.245:32080';

    async getUserLockerDashboard(userId: number, userName?: string): Promise<LockerDashboardResponse> {
        // Use mock data if enabled
        if (USE_MOCK_DATA) {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            // Return mock data with 80% chance of having data
            return Math.random() > 0.2
                ? MockLockerDataService.generateMockData(userId, userName)
                : MockLockerDataService.generateEmptyData(userId, userName);
        }

        try {
            const response = await fetch(`${this.baseUrl}/locker-dashboard/user/${userId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    // Add authorization header if needed
                    // 'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                console.warn(`API returned ${response.status}, using mock data`);
                // Return mock data on API error
                return MockLockerDataService.generateMockData(userId, userName);
            }

            const data: LockerDashboardResponse = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching locker dashboard, using mock data:', error);
            // Return mock data on network error
            return MockLockerDataService.generateMockData(userId, userName);
        }
    }
}

export const lockerDashboardService = new LockerDashboardService();