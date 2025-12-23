// src/services/api.js
const API_BASE_URL = 'http://localhost:4000/ajouter';

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

  // Update task status for drag and drop
  async updateTaskStatus(taskId, status) {
    console.log('Updating task status:', { taskId, status });
    return this.request(`/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // NEW: Update task assignee
  async updateTaskAssignee(taskId, assigneeId) {
    return this.request(`/tasks/${taskId}/assignee`, {
      method: 'PATCH',
      body: JSON.stringify({ assignee_id: assigneeId }),
    });
  }

  // NEW: Update task dates
  async updateTaskDates(taskId, startDate, endDate) {
    return this.request(`/tasks/${taskId}/dates`, {
      method: 'PATCH',
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate
      }),
    });
  }

  // Statistics methods
  async getProjectStatistics(projectId) {
    return this.request(`/statistics/project/${projectId}`);
  }

  async getStatisticsSummary() {
    return this.request('/statistics/summary');
  }

  // Dashboard methods
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // User methods
  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  async getUsers() {
    return this.request('/users');
  }

  async getMyProjects() {
    return this.request('/api/my-projects');
  }

  // In your api.js file, update the getMembers function:
  async getMembers() {
    try {
      const response = await this.request('/users/members'); // Use `this.request()`
      console.log("👥 API Members response:", response);

      // Handle different response structures
      if (Array.isArray(response)) {
        return { users: response };
      } else if (response && response.users) {
        return response;
      } else if (response && response.data) {
        return { users: response.data };
      } else {
        console.warn("⚠️ Unexpected members response structure:", response);
        return { users: [] };
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      return { users: [] };
    }
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

  // Add to ApiService class in api.js
  async getProjectMembers(projectId) {
    return this.request(`/projects/${projectId}/members`);
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

  logout() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // In your ApiService class, update the getProjectsByStats method:
  async getProjectsByStats() {
    try {
      console.log("🔄 Starting getProjectsByStats()");

      // 1. Get statistics summary
      console.log("📊 Fetching statistics summary...");
      const summary = await this.getStatisticsSummary(); // Use `this.`
      console.log("✅ Statistics summary:", summary);

      // 2. Get projects
      console.log("📋 Fetching projects...");
      const projectsResponse = await this.getProjects(); // Use `this.`
      console.log("📦 Projects response:", projectsResponse);

      // Ensure projects is an array
      const projects = Array.isArray(projectsResponse.projects)
        ? projectsResponse.projects
        : (projectsResponse.projects?.projects || []);

      console.log(`📊 Processing ${projects.length} projects`);

      // Transform projects data to include KPI metrics
      const projectsWithKPI = await Promise.all(
        projects.map(async (project) => {
          try {
            // Get project statistics
            const stats = await this.getProjectStatistics(project.project_id || project.id); // Use `this.`

            return {
              projectId: project.project_id || project.id,
              projectName: project['project-name'] || project.name || 'Unnamed Project',
              totalTasks: stats?.totalTasks || 0,
              todoTasks: stats?.todoTasks || 0,
              inProgressTasks: stats?.inProgressTasks || 0,
              doneTasks: stats?.doneTasks || 0,
              completionRate: stats?.completionRate || 0,
              totalMembers: stats?.totalMembers || 0,
              assignedTasks: stats?.assignedTasks || 0,
              unassignedTasks: stats?.unassignedTasks || 0,
              projectDuration: stats?.projectDuration || 0,
              daysRemaining: stats?.daysRemaining || 0,
              daysElapsed: stats?.daysElapsed || 0,
              progressPercentage: stats?.progressPercentage || 0,
              startDate: project['start-date'] || project.start_date,
              endDate: project['end-date'] || project.end_date
            };
          } catch (error) {
            console.error(`❌ Error processing project ${project.project_id}:`, error);
            return {
              projectId: project.project_id || project.id,
              projectName: project['project-name'] || project.name || 'Unnamed Project',
              totalTasks: 0,
              todoTasks: 0,
              inProgressTasks: 0,
              doneTasks: 0,
              completionRate: 0,
              totalMembers: 0,
              assignedTasks: 0,
              unassignedTasks: 0,
              projectDuration: 0,
              daysRemaining: 0,
              daysElapsed: 0,
              progressPercentage: 0
            };
          }
        })
      );

      const result = {
        projects: projectsWithKPI,
        totalProjects: projectsWithKPI.length,
        summary: summary || {}
      };

      console.log("✅ getProjectsByStats result:", result);
      return result;

    } catch (error) {
      console.error("❌ Error in getProjectsByStats:", error);
      return {
        projects: [],
        totalProjects: 0,
        summary: {}
      };
    }
  }

  // You might also want a simpler version for just project stats without member details
  async getProjectsStatistics() {
    return this.request('/statistics/projects');
  }




}

export default new ApiService();
