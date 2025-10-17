// Repository Interfaces - Clean Architecture

import {
    User,
    Provider,
    Product,
    ProductDetail,
    Locker,
    DashboardStats
} from '../entities';


export interface PaginationParams {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Base entity interface (if not already in entities/base.ts)
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}

// Authentication Repository
export interface IAuthRepository {
    login(email: string, password: string): Promise<{ user: User; token: string }>;
    logout(): Promise<void>;
    getCurrentUser(): Promise<User | null>;
    refreshToken(): Promise<string>;
}

// User Repository
export interface IUserRepository {
    getAll(params: PaginationParams): Promise<PaginatedResponse<User>>;
    getById(id: string): Promise<User>;
    create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
    update(id: string, user: Partial<User>): Promise<User>;
    delete(id: string): Promise<void>;
}

// Provider Repository
export interface IProviderRepository {
    getAll(params: PaginationParams): Promise<PaginatedResponse<Provider>>;
    getById(id: string): Promise<Provider>;
    create(provider: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>): Promise<Provider>;
    update(id: string, provider: Partial<Provider>): Promise<Provider>;
    delete(id: string): Promise<void>;
}

// Product Repository
export interface IProductRepository {
    getAll(params: PaginationParams): Promise<PaginatedResponse<Product>>;
    getById(id: string): Promise<Product>;
    create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
    update(id: string, product: Partial<Product>): Promise<Product>;
    delete(id: string): Promise<void>;
    getByProviderId(providerId: string): Promise<Product[]>;
}

// Product Detail Repository
export interface IProductDetailRepository {
    getByProductId(productId: string): Promise<ProductDetail>;
    create(detail: Omit<ProductDetail, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductDetail>;
    update(id: string, detail: Partial<ProductDetail>): Promise<ProductDetail>;
}

// Locker Repository
export interface ILockerRepository {
    getAll(params: PaginationParams): Promise<PaginatedResponse<Locker>>;
    getById(id: string): Promise<Locker>;
    create(locker: Omit<Locker, 'id' | 'createdAt' | 'updatedAt'>): Promise<Locker>;
    update(id: string, locker: Partial<Locker>): Promise<Locker>;
    delete(id: string): Promise<void>;
    getNearby(lat: number, lng: number, radius: number): Promise<Locker[]>;
}

// Dashboard Repository
export interface IDashboardRepository {
    getStats(): Promise<DashboardStats>;
}