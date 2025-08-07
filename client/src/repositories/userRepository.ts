import { apiClient } from './apiClient';
import { RequestOptions } from './types';
import { User } from '@shared/schema';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  name: string;
  role?: string;
}

export interface UpdateProfileData {
  name?: string;
  role?: string;
}

export class UserRepository {
  private readonly basePath = '/api/users';

  async getCurrentUser(options?: RequestOptions): Promise<User> {
    return apiClient.get<User>(`${this.basePath}/me`, options);
  }

  async updateProfile(data: UpdateProfileData, options?: RequestOptions): Promise<User> {
    return apiClient.patch<User>(`${this.basePath}/me`, data, options);
  }

  async login(credentials: LoginCredentials, options?: RequestOptions): Promise<{ user: User; token?: string }> {
    return apiClient.post<{ user: User; token?: string }>('/api/auth/login', credentials, options);
  }

  async register(data: RegisterData, options?: RequestOptions): Promise<{ user: User; token?: string }> {
    return apiClient.post<{ user: User; token?: string }>('/api/auth/register', data, options);
  }

  async logout(options?: RequestOptions): Promise<void> {
    return apiClient.post<void>('/api/auth/logout', undefined, options);
  }

  async changePassword(oldPassword: string, newPassword: string, options?: RequestOptions): Promise<void> {
    return apiClient.post<void>(`${this.basePath}/change-password`, {
      oldPassword,
      newPassword,
    }, options);
  }
}

export const userRepository = new UserRepository();