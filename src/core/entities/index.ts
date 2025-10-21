// Core Entity Types for 3lababee Admin Portal

export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface User extends BaseEntity {
    email: string;
    name: string;
    phone?: string;
    role: UserRole;
    status: UserStatus;
    avatar?: string;
}

export enum UserRole {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    USER = 'USER'
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED'
}

export interface Provider extends BaseEntity {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    status: ProviderStatus;
    rating?: number;
    productsCount: number;
}

export enum ProviderStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    PENDING = 'PENDING'
}

export interface Product extends BaseEntity {
    name: string;
    sku: string;
    description: string;
    price: number;
    currency: string;
    category: string;
    providerId: string;
    provider?: Provider;
    stock: number;
    images: string[];
    status: ProductStatus;
}

export enum ProductStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    OUT_OF_STOCK = 'OUT_OF_STOCK'
}

export interface ProductDetail extends BaseEntity {
    productId: string;
    specifications: Record<string, any>;
    dimensions?: {
        length: number;
        width: number;
        height: number;
        weight: number;
        unit: string;
    };
    materials: string[];
    warranty?: string;
    tags: string[];
}

export interface Locker extends BaseEntity {
    lockerId: string;
    location: string;
    address: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    capacity: number;
    availableSlots: number;
    status: LockerStatus;
    temperature?: number;
}

export enum LockerStatus {
    OPERATIONAL = 'OPERATIONAL',
    MAINTENANCE = 'MAINTENANCE',
    OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}

export interface DashboardStats {
    totalUsers: number;
    totalProviders: number;
    totalProducts: number;
    totalLockers: number;
    activeOrders: number;
    revenue: number;
    trends: {
        users: number;
        providers: number;
        products: number;
        revenue: number;
    };
}

export * from './orders';