

// src/services/api.js
const API_BASE_URL = 'http://localhost:4000/ajouter';

class ApiService {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  /* =========================
      TOKEN MANAGEMENT
   ========================== */

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  getAuthHeaders() {
    return {
      'Authorization': this.accessToken
        ? `Bearer ${this.accessToken}`
        : '',
      'Content-Type': 'application/json',
    };
  }

  /* =========================
     REFRESH TOKEN
  ========================== */

  async refreshAccessToken() {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await fetch(`${API_BASE_URL}/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Refresh token expired');
      }

      const data = await response.json();
      this.accessToken = data.accessToken;
      localStorage.setItem('accessToken', data.accessToken);

      this.failedQueue.forEach(p => p.resolve(data.accessToken));
      this.failedQueue = [];

      return data.accessToken;
    } catch (error) {
      this.failedQueue.forEach(p => p.reject(error));
      this.failedQueue = [];
      this.logout();
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }


  async request(endpoint, options = {}, retry = true) {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...(options.headers || {}),
      },
    });

    if (response.status === 401 && retry) {
      try {
        const newAccessToken = await this.refreshAccessToken();

        return this.request(
          endpoint,
          {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newAccessToken}`,
            },
          },
          false
        );
      } catch {
        throw new Error('Session expired');
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  // Auth methods
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // ✅ Store both tokens
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async register(email, password, role = 'user') {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  async updateTask(id, taskData) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async deleteProject(id) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }



  // Get statistics for a specific member
  async getMemberStatistics(memberId) {
    return this.request(`/statistics/member/${memberId}`);
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

  //notifications
  // In your ApiService class, add:

  // Notification methods
  async getNotifications() {
    return this.request('/notifications');
  }

  async getUnreadNotificationCount() {
    return this.request('/notifications/unread-count');
  }

  async markNotificationAsRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'PATCH',
    });
  }

  async deleteNotification(notificationId) {
    return this.request(`/notifications/${notificationId}`, {
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
    this.clearTokens();
    window.location.href = '/signin';
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


  async getProjectTimeline(projectId) {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/statistics/project/${projectId}/timeline`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching project timeline:', error);
      return null;
    }
  }

  async getAllProjectsTimeline() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/statistics/timeline/aggregated', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching all projects timeline:', error);
      return null;
    }
  }

  // In your ApiService.js
  async updateProjectStatus(projectId, status) {
    const token = localStorage.getItem('accessToken');

    const response = await fetch(
      `http://localhost:4000/ajouter/projects/${projectId}/status`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      }
    );

    return await response.json();
  }


  // Add this method to your ApiService class in api.js
  async getMemberTimeline(memberId) {
    try {
      console.log(`📊 Fetching member timeline for member: ${memberId}`);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/statistics/member/${memberId}/timeline`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('⚠️ Member timeline endpoint not found, will use fallback');
          return null; // Will trigger fallback
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Member timeline loaded: ${data.timelineData?.length || 0} days`);
      return data;

    } catch (error) {
      console.error('❌ Error fetching member timeline:', error);
      return null;
    }
  }

  // Also add this fallback method for generating member timeline
  async generateMemberTimelineFallback(memberId) {
    try {
      console.log(`🔄 Generating fallback timeline for member: ${memberId}`);

      // First, get member statistics
      const memberStats = await this.getMemberStatistics(memberId);

      if (!memberStats) {
        return this.generateSampleMemberTimeline(memberId);
      }

      // Use your existing generateMemberTimelineFromStats function logic
      const now = new Date();
      const timelineData = [];
      const member = memberStats.member || {};
      const summary = memberStats.summary || {};
      const projects = memberStats.projects || [];

      // Base metrics from member stats
      const baseProgress = summary.overallCompletionRate || 50;
      const totalCompleted = summary.completedTasks || 0;
      const totalAssigned = summary.totalTasks || 10;
      const memberProductivity = summary.productivity || 60;

      // Generate 30 days of member-specific timeline data
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);

        const dateStr = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });

        // Calculate daily progress
        const dailyProgress = Math.min(baseProgress * (i / 30) * (1 - (i / 30) * 0.3), 100);
        const variation = Math.sin(i * 0.5) * 3 + Math.random() * 2;
        const memberProgress = Math.min(dailyProgress + variation, 100);

        // Simulate task completion pattern
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const baseTasks = isWeekend ? 0.5 : 2;
        const dailyCompleted = Math.floor(baseTasks + Math.random() * 2);

        // Calculate cumulative tasks
        const cumulativeTasks = Math.min(
          Math.floor(totalCompleted * (i / 30) * 1.2) + dailyCompleted,
          totalCompleted
        );

        // Simulate productivity
        const dailyProductivity = Math.min(
          memberProductivity + Math.sin(i * 0.3) * 10 + Math.random() * 15,
          100
        );

        timelineData.push({
          date: dateStr,
          memberProgress: parseFloat(memberProgress.toFixed(1)),
          memberTasksCompleted: cumulativeTasks,
          dailyCompletedTasks: dailyCompleted,
          memberProductivity: parseFloat(dailyProductivity.toFixed(1)),
          assignedTasks: totalAssigned,
          activeProjects: summary.totalProjects || projects.length || 1,
          completionRate: parseFloat(((cumulativeTasks / totalAssigned) * 100).toFixed(1))
        });
      }

      // Calculate insights
      const insights = this.calculateMemberTimelineInsights(timelineData);

      return {
        timelineData: timelineData,
        insights: insights,
        memberInfo: {
          name: member.name || member.email?.split('@')[0] || `Member ${memberId}`,
          totalProjects: summary.totalProjects || 0,
          totalTasks: summary.totalTasks || 0
        }
      };

    } catch (error) {
      console.error('❌ Error generating fallback timeline:', error);
      return this.generateSampleMemberTimeline(memberId);
    }
  }

  // Helper method for sample data
  generateSampleMemberTimeline(memberId) {
    console.log(`🎭 Generating sample timeline for member: ${memberId}`);

    const now = new Date();
    const timelineData = [];

    // Generate 30 days of sample data
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);

      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const productivityMultiplier = isWeekend ? 0.6 : 1.2;

      const baseProgress = (60 / 30) * (30 - i);
      const variation = Math.sin(i * 0.5) * 10 + Math.random() * 5;
      const memberProgress = Math.min(baseProgress + variation, 100);

      const dailyCompleted = Math.floor(Math.random() * 3 * productivityMultiplier) + (i % 5 === 0 ? 2 : 0);
      const cumulativeCompleted = Math.floor(50 * (i / 30)) + dailyCompleted;

      timelineData.push({
        date: dateStr,
        memberProgress: parseFloat(memberProgress.toFixed(1)),
        memberTasksCompleted: cumulativeCompleted,
        dailyCompletedTasks: dailyCompleted,
        memberProductivity: parseFloat((memberProgress * productivityMultiplier).toFixed(1)),
        assignedTasks: 65,
        activeProjects: 3,
        completionRate: parseFloat(((cumulativeCompleted / 65) * 100).toFixed(1))
      });
    }

    return {
      timelineData: timelineData,
      insights: this.calculateMemberTimelineInsights(timelineData),
      memberInfo: {
        name: `Member ${memberId}`,
        totalProjects: 3,
        totalTasks: 65
      }
    };
  }

  // Calculate member timeline insights
  calculateMemberTimelineInsights(timelineData) {
    if (!timelineData || timelineData.length === 0) {
      return {
        memberProgress: 0,
        averageDailyProgress: 0,
        mostProductiveDay: null,
        memberProductivity: 0,
        activeDays: 0,
        progressTrend: 0,
        consistencyScore: 0,
        avgTasksPerDay: 0,
        peakProductivity: 0
      };
    }

    const progressValues = timelineData.map(d => d.memberProgress);
    const productivityValues = timelineData.map(d => d.memberProductivity);
    const taskValues = timelineData.map(d => d.dailyCompletedTasks);

    // Find most productive day
    let mostProductiveDay = { date: '', tasks: 0, productivity: 0 };
    timelineData.forEach(day => {
      if (day.dailyCompletedTasks > mostProductiveDay.tasks) {
        mostProductiveDay = {
          date: day.date,
          tasks: day.dailyCompletedTasks,
          productivity: day.memberProductivity
        };
      }
    });

    // Calculate progress trend (last 7 days vs previous 7 days)
    const recentWeek = timelineData.slice(-7);
    const previousWeek = timelineData.slice(-14, -7);

    const recentAvgProgress = recentWeek.reduce((sum, day) => sum + day.memberProgress, 0) / recentWeek.length;
    const previousAvgProgress = previousWeek.reduce((sum, day) => sum + day.memberProgress, 0) / previousWeek.length;
    const progressTrend = recentAvgProgress - previousAvgProgress;

    // Calculate active days
    const activeDays = timelineData.filter(day => day.dailyCompletedTasks > 0).length;

    // Calculate consistency
    const avgProgress = progressValues.reduce((a, b) => a + b, 0) / progressValues.length;
    const squaredDiffs = progressValues.map(value => Math.pow(value - avgProgress, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    const consistencyScore = Math.max(0, 100 - Math.sqrt(avgSquaredDiff) * 2);

    return {
      memberProgress: timelineData[timelineData.length - 1]?.memberProgress || 0,
      averageDailyProgress: parseFloat((progressValues.reduce((a, b) => a + b, 0) / progressValues.length).toFixed(1)),
      mostProductiveDay: mostProductiveDay.tasks > 0 ? mostProductiveDay : null,
      memberProductivity: parseFloat((productivityValues.reduce((a, b) => a + b, 0) / productivityValues.length).toFixed(1)),
      activeDays: activeDays,
      progressTrend: parseFloat(progressTrend.toFixed(1)),
      consistencyScore: parseFloat(consistencyScore.toFixed(1)),
      avgTasksPerDay: parseFloat((taskValues.reduce((a, b) => a + b, 0) / taskValues.length).toFixed(1)),
      peakProductivity: Math.max(...productivityValues)
    };
  }


}

export default new ApiService();