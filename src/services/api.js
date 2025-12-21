// src/services/api.js
const API_BASE_URL = 'https://plan-back.azurewebsites.net/ajouter'; // Adjust to your backend URL

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    this.setToken(data.token);
    return data;
  }

  async register(email, password, role = 'user') {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  }

  // Project methods
  async createProject(projectData) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async getProjects() {
    return this.request('/projects');
  }

  async getProject(id) {
    return this.request(`/projects/${id}`);
  }

  async updateProject(id, projectData) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(id) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Task methods
  async createTask(taskData) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async getTasks(projectId) {
    return this.request(`/projects/${projectId}/tasks`);
  }

  async getTask(id) {
    return this.request(`/tasks/${id}`);
  }

  async updateTask(id, taskData) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(id) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard methods
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // User methods
  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }


  // src/services/api.js - Add these methods to your ApiService class

// User methods
async getUsers() {
  return this.request('/users');
}

async getMyProjects() {
  return this.request('/api/my-projects');
}

// ✅ ADD THIS
async getMembers() {
  return this.request('/users/members');
}

async searchUsers(email) {
  return this.request(`/users/search/${encodeURIComponent(email)}`);
}

async getUsersBatch(userIds) {
  return this.request('/users/batch', {
    method: 'POST',
    body: JSON.stringify({ userIds }),
  });
}

async getProfile() {
  return this.request('/profile');
}

async updateUser(id, userData) {
  return this.request(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
}

async updateProfile(userData) {
  return this.request('/profile', {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
}

async getProjectTeam(projectId) {
  return this.request(`/projects/${projectId}/team`);
}

//fetch members 

}

export default new ApiService();
