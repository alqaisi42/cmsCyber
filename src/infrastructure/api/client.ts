// API Client with Axios - Infrastructure Layer

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Error response type definitions
interface ErrorResponse {
    message?: string;
    error?: string;
    errors?: string[];
    [key: string]: any;
}

export interface ApiError {
    message: string;
    status: number;
    data?: any;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                const token = this.getToken();
                if (token && config.headers) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response: AxiosResponse) => response,
            async (error: AxiosError<ErrorResponse>) => {
                if (error.response?.status === 401) {
                    this.handleUnauthorized();
                }
                return Promise.reject(this.normalizeError(error));
            }
        );
    }

    private getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('auth_token');
        }
        return null;
    }

    private handleUnauthorized() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
    }

    private normalizeError(error: AxiosError<ErrorResponse>): ApiError {
        const responseData = error.response?.data;
        const message = this.extractErrorMessage(responseData, error.message);

        return {
            message,
            status: error.response?.status || 500,
            data: responseData,
        };
    }

    private extractErrorMessage(data: ErrorResponse | undefined, fallback: string): string {
        if (!data) return fallback || 'An error occurred';

        // Handle different error response formats
        if (typeof data === 'string') return data;
        if (data.message) return data.message;
        if (data.error) return data.error;
        if (data.errors && Array.isArray(data.errors)) {
            return data.errors.join(', ');
        }

        return fallback || 'An error occurred';
    }

    // Public methods
    async get<T>(url: string, config?: any): Promise<T> {
        const response = await this.client.get<T>(url, config);
        return response.data;
    }

    async post<T>(url: string, data?: any, config?: any): Promise<T> {
        const response = await this.client.post<T>(url, data, config);
        return response.data;
    }

    async put<T>(url: string, data?: any, config?: any): Promise<T> {
        const response = await this.client.put<T>(url, data, config);
        return response.data;
    }

    async patch<T>(url: string, data?: any, config?: any): Promise<T> {
        const response = await this.client.patch<T>(url, data, config);
        return response.data;
    }

    async delete<T>(url: string, config?: any): Promise<T> {
        const response = await this.client.delete<T>(url, config);
        return response.data;
    }
}

export const apiClient = new ApiClient();