const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper to get stored user details
export function getStoredUser(): { id: number; username: string } | null {
  const userStr = localStorage.getItem('todo_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// Helper to set stored user details
export function setStoredUser(user: { id: number; username: string } | null) {
  if (user) {
    localStorage.setItem('todo_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('todo_user');
  }
}

// Base request wrapper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  // Set default JSON Content-Type if body is present and not already set
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: options.credentials || 'include',
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // Fallback if response is not JSON
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  // For DELETE or 204 No Content, check if there's content to parse
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export interface User {
  id: number;
  username: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user: User;
}

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export const api = {
  // Auth endpoints
  async register(username: string, password: string): Promise<AuthResponse> {
    const data = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setStoredUser(data.user);
    return data;
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const data = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setStoredUser(data.user);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      setStoredUser(null);
    }
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/auth/me');
  },

  // Todo endpoints
  async getTodos(): Promise<Todo[]> {
    return request<Todo[]>('/todos');
  },

  async createTodo(title: string): Promise<Todo> {
    return request<Todo>('/todos', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  async updateTodo(id: number, updates: { title?: string; completed?: boolean }): Promise<Todo> {
    return request<Todo>(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteTodo(id: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/todos/${id}`, {
      method: 'DELETE',
    });
  },
};
