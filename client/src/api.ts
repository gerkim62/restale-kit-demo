const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper to get stored auth token
export function getAuthToken(): string | null {
  return localStorage.getItem('todo_jwt_token');
}

// Helper to set stored auth token
export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('todo_jwt_token', token);
  } else {
    localStorage.removeItem('todo_jwt_token');
    localStorage.removeItem('todo_user');
  }
}

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
  
  // Attach auth token if available
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set default JSON Content-Type if body is present and not already set
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
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
  token: string;
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
    setAuthToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const data = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setAuthToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  logout() {
    setAuthToken(null);
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
