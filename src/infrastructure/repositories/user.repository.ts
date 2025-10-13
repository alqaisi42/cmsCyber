// User Repository Implementation - WITH MOCK DATA SUPPORT
import { IUserRepository, PaginationParams, PaginatedResponse } from '../../core/interfaces/repositories';
import { User } from '../../core/entities';
import { apiClient } from '../api/client';
import { MockDataService, MOCK_USERS } from '../api/mock-data.service';

// Toggle this to switch between mock and real API
const USE_MOCK_API = true;

export class UserRepository implements IUserRepository {
    private readonly baseUrl = '/users';

    async getAll(params: PaginationParams): Promise<PaginatedResponse<User>> {
        if (USE_MOCK_API) {
            await MockDataService.delay();
            return MockDataService.paginate(
                MOCK_USERS,
                params.page,
                params.limit,
                params.search,
                ['name', 'email', 'phone'] as (keyof User)[]
            );
        }

        const queryParams = new URLSearchParams({
            page: params.page.toString(),
            limit: params.limit.toString(),
            ...(params.search && { search: params.search }),
            ...(params.sortBy && { sortBy: params.sortBy }),
            ...(params.sortOrder && { sortOrder: params.sortOrder }),
        });

        return await apiClient.get(`${this.baseUrl}?${queryParams}`);
    }

    async getById(id: string): Promise<User> {
        if (USE_MOCK_API) {
            await MockDataService.delay(500);
            const user = MOCK_USERS.find(u => u.id === id);
            if (!user) throw new Error('User not found');
            return user;
        }

        return await apiClient.get(`${this.baseUrl}/${id}`);
    }

    async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
        if (USE_MOCK_API) {
            await MockDataService.delay();
            const newUser: User = {
                ...user,
                id: `user-${Date.now()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            MOCK_USERS.push(newUser);
            return newUser;
        }

        return await apiClient.post(this.baseUrl, user);
    }

    async update(id: string, user: Partial<User>): Promise<User> {
        if (USE_MOCK_API) {
            await MockDataService.delay();
            const index = MOCK_USERS.findIndex(u => u.id === id);
            if (index === -1) throw new Error('User not found');

            MOCK_USERS[index] = {
                ...MOCK_USERS[index],
                ...user,
                updatedAt: new Date(),
            };
            return MOCK_USERS[index];
        }

        return await apiClient.patch(`${this.baseUrl}/${id}`, user);
    }

    async delete(id: string): Promise<void> {
        if (USE_MOCK_API) {
            await MockDataService.delay();
            const index = MOCK_USERS.findIndex(u => u.id === id);
            if (index === -1) throw new Error('User not found');
            MOCK_USERS.splice(index, 1);
            return;
        }

        await apiClient.delete(`${this.baseUrl}/${id}`);
    }
}

export const userRepository = new UserRepository();