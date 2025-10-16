// Provider Repository Implementation
import { IProviderRepository, PaginationParams, PaginatedResponse } from '../../core/interfaces/repositories';
import { Provider } from '../../core/entities';
import { apiClient } from '../api/client';

export class ProviderRepository implements IProviderRepository {
    private readonly baseUrl = '/api/v1/providers';

    async getAll(params: PaginationParams): Promise<PaginatedResponse<Provider>> {
        const queryParams = new URLSearchParams({
            page: params.page.toString(),
            limit: params.limit.toString(),
            ...(params.search && { search: params.search }),
            ...(params.sortBy && { sortBy: params.sortBy }),
            ...(params.sortOrder && { sortOrder: params.sortOrder }),
        });

        return await apiClient.get(`${this.baseUrl}?${queryParams}`);
    }

    async getById(id: string): Promise<Provider> {
        return await apiClient.get(`${this.baseUrl}/${id}`);
    }

    async create(provider: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>): Promise<Provider> {
        return await apiClient.post(this.baseUrl, provider);
    }

    async update(id: string, provider: Partial<Provider>): Promise<Provider> {
        return await apiClient.patch(`${this.baseUrl}/${id}`, provider);
    }

    async delete(id: string): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/${id}`);
    }
}

export const providerRepository = new ProviderRepository();