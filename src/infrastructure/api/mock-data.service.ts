// src/infrastructure/api/mock-data.service.ts
// Mock Data Service - UPDATED FOR COMPATIBILITY

import {
    User,
    UserRole,
    UserStatus,
    Provider,
    ProviderStatus,
    ProductStatus,
    Locker,
    LockerStatus,
    DashboardStats,
} from '../../core/entities';
import { PaginatedResponse } from '../../core/interfaces/repositories';

// Old Product interface for mock data (different from API Product)
interface MockProduct {
    id: string;
    name: string;
    sku: string;
    description: string;
    price: number;
    currency: string;
    category: string;
    providerId: string;
    stock: number;
    images: string[];
    status: ProductStatus;
    createdAt: Date;
    updatedAt: Date;
}

// Old Provider interface for mock data (different from API Provider)
interface MockProvider {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    status: ProviderStatus;
    rating: number;
    productsCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export class MockDataService {
    // Generate mock users
    static generateUsers(count: number = 50): User[] {
        const users: User[] = [];
        const roles = [UserRole.ADMIN, UserRole.MANAGER, UserRole.USER];
        const statuses = [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED];

        for (let i = 1; i <= count; i++) {
            users.push({
                id: `user-${i}`,
                email: `user${i}@3lababee.com`,
                name: `User ${i}`,
                phone: `+962-79-${String(i).padStart(7, '0')}`,
                role: roles[Math.floor(Math.random() * roles.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                avatar: `https://ui-avatars.com/api/?name=User+${i}&background=random`,
                createdAt: new Date(2024, 0, Math.floor(Math.random() * 30) + 1),
                updatedAt: new Date(),
            });
        }

        return users;
    }

    // Generate mock providers (old format)
    static generateProviders(count: number = 30): MockProvider[] {
        const providers: MockProvider[] = [];
        const cities = ['Amman', 'Zarqa', 'Irbid', 'Aqaba', 'Madaba', 'Salt'];
        const statuses = [ProviderStatus.ACTIVE, ProviderStatus.INACTIVE, ProviderStatus.PENDING];

        for (let i = 1; i <= count; i++) {
            const city = cities[Math.floor(Math.random() * cities.length)];
            providers.push({
                id: `provider-${i}`,
                name: `Provider ${i}`,
                email: `provider${i}@example.com`,
                phone: `+962-6-${String(i).padStart(7, '0')}`,
                address: `${i} Main Street`,
                city,
                country: 'Jordan',
                status: statuses[Math.floor(Math.random() * statuses.length)],
                rating: Math.random() * 2 + 3, // 3-5 stars
                productsCount: Math.floor(Math.random() * 50) + 1,
                createdAt: new Date(2024, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
                updatedAt: new Date(),
            });
        }

        return providers;
    }

    // Generate mock products (old format)
    static generateProducts(count: number = 100): MockProduct[] {
        const products: MockProduct[] = [];
        const categories = ['Electronics', 'Clothing', 'Food', 'Home', 'Sports', 'Books'];
        const statuses = [ProductStatus.ACTIVE, ProductStatus.INACTIVE, ProductStatus.OUT_OF_STOCK];

        for (let i = 1; i <= count; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];

            products.push({
                id: `product-${i}`,
                name: `Product ${i}`,
                sku: `SKU-${String(i).padStart(6, '0')}`,
                description: `This is a description for product ${i}. High quality and affordable.`,
                price: Math.random() * 500 + 10, // 10-510 JOD
                currency: 'JOD',
                category,
                providerId: `provider-${Math.floor(Math.random() * 30) + 1}`,
                stock: status === ProductStatus.OUT_OF_STOCK ? 0 : Math.floor(Math.random() * 100),
                images: [
                    `https://picsum.photos/seed/${i}/400/300`,
                    `https://picsum.photos/seed/${i + 1000}/400/300`,
                ],
                status,
                createdAt: new Date(2024, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
                updatedAt: new Date(),
            });
        }

        return products;
    }

    // Generate mock lockers
    static generateLockers(count: number = 20): Locker[] {
        const lockers: Locker[] = [];
        const locations = [
            { city: 'Amman', area: 'Abdali' },
            { city: 'Amman', area: 'Sweifieh' },
            { city: 'Amman', area: 'Mecca Street' },
            { city: 'Zarqa', area: 'City Center' },
            { city: 'Irbid', area: 'Downtown' },
            { city: 'Aqaba', area: 'Beach Road' },
        ];
        const statuses = [LockerStatus.OPERATIONAL, LockerStatus.MAINTENANCE, LockerStatus.OUT_OF_SERVICE];

        for (let i = 1; i <= count; i++) {
            const location = locations[Math.floor(Math.random() * locations.length)];
            const capacity = [20, 30, 40, 50][Math.floor(Math.random() * 4)];
            const availableSlots = Math.floor(Math.random() * capacity);

            lockers.push({
                id: `locker-${i}`,
                lockerId: `LCK-${String(i).padStart(4, '0')}`,
                location: `${location.area}, ${location.city}`,
                address: `${i} ${location.area} Street, ${location.city}`,
                coordinates: {
                    latitude: 31.9 + Math.random() * 0.5,
                    longitude: 35.9 + Math.random() * 0.5,
                },
                capacity,
                availableSlots,
                status: statuses[Math.floor(Math.random() * statuses.length)],
                temperature: 20 + Math.random() * 10, // 20-30°C
                createdAt: new Date(2024, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
                updatedAt: new Date(),
            });
        }

        return lockers;
    }

    // Generate dashboard stats
    static generateDashboardStats(): DashboardStats {
        return {
            totalUsers: 2543,
            totalProviders: 189,
            totalProducts: 1247,
            totalLockers: 67,
            activeOrders: 324,
            revenue: 125430.50,
            trends: {
                users: 12.5,
                providers: 8.2,
                products: 23.1,
                revenue: 15.8,
            },
        };
    }

    // Paginate data
    static paginate<T>(
        data: T[],
        page: number,
        limit: number,
        search?: string,
        searchFields?: (keyof T)[]
    ): PaginatedResponse<T> {
        let filteredData = [...data];

        // Apply search filter
        if (search && searchFields) {
            const searchLower = search.toLowerCase();
            filteredData = filteredData.filter((item) =>
                searchFields.some((field) => {
                    const value = item[field];
                    return String(value).toLowerCase().includes(searchLower);
                })
            );
        }

        const total = filteredData.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        return {
            data: paginatedData,
            total,
            page,
            limit,
            totalPages,
        };
    }

    // Simulate API delay
    static async delay(ms: number = 800): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Pre-generate data on module load
export const MOCK_USERS = MockDataService.generateUsers(50);
export const MOCK_PROVIDERS = MockDataService.generateProviders(30);
export const MOCK_PRODUCTS = MockDataService.generateProducts(100);
export const MOCK_LOCKERS = MockDataService.generateLockers(20);
export const MOCK_DASHBOARD_STATS = MockDataService.generateDashboardStats();