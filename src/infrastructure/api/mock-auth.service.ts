// Mock Authentication Service - For Development Only
import { User, UserRole, UserStatus } from '../../core/entities';

// Dummy users database
const MOCK_USERS: Array<User & { password: string }> = [
    {
        id: '1',
        email: 'admin@3lababee.com',
        password: 'admin123',
        name: 'Admin User',
        phone: '+962-79-1234567',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=3b82f6&color=fff',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
    },
    {
        id: '2',
        email: 'manager@3lababee.com',
        password: 'manager123',
        name: 'Manager User',
        phone: '+962-79-2345678',
        role: UserRole.MANAGER,
        status: UserStatus.ACTIVE,
        avatar: 'https://ui-avatars.com/api/?name=Manager+User&background=10b981&color=fff',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
    },
    {
        id: '3',
        email: 'user@3lababee.com',
        password: 'user123',
        name: 'Regular User',
        phone: '+962-79-3456789',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        avatar: 'https://ui-avatars.com/api/?name=Regular+User&background=8b5cf6&color=fff',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date(),
    },
];

export class MockAuthService {
    private static delay(ms: number = 1000) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static async login(email: string, password: string): Promise<{ user: User; token: string }> {
        // Simulate network delay
        await this.delay(1000);

        const user = MOCK_USERS.find(u => u.email === email && u.password === password);

        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        // Generate fake JWT token
        const token = `mock_token_${user.id}_${Date.now()}`;

        return {
            user: userWithoutPassword,
            token,
        };
    }

    static async logout(): Promise<void> {
        await this.delay(500);
        return;
    }

    static async getCurrentUser(token: string): Promise<User | null> {
        await this.delay(500);

        // Extract user ID from token
        const userId = token.split('_')[2];
        const user = MOCK_USERS.find(u => u.id === userId);

        if (!user) return null;

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    static async refreshToken(): Promise<string> {
        await this.delay(500);
        return `mock_token_refreshed_${Date.now()}`;
    }

    // Get all mock users (for display purposes)
    static getMockUsers(): Array<{ email: string; password: string; role: string }> {
        return MOCK_USERS.map(u => ({
            email: u.email,
            password: u.password,
            role: u.role,
        }));
    }
}

// Export mock credentials for easy reference
export const MOCK_CREDENTIALS = {
    admin: {
        email: 'admin@3lababee.com',
        password: 'admin123',
    },
    manager: {
        email: 'manager@3lababee.com',
        password: 'manager123',
    },
    user: {
        email: 'user@3lababee.com',
        password: 'user123',
    },
};