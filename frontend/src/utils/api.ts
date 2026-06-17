const getApiBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  return url.endsWith('/api') ? url : `${url.replace(/\/$/, '')}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

export interface User {
  id: string;
  name: string;
  email: string;
  roleTarget: string;
  experienceLevel: 'fresher' | 'junior' | 'mid' | 'senior';
  avatarUrl?: string;
  streak: number;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface SessionStats {
  totalSessions: number;
  avgScore: number;
  bestScore: number;
  streak: number;
  questionsAnswered: number;
  weakAreas: {
    dimension: string;
    avgPercentage: number;
    suggestion: string;
  }[];
  recentSessions: {
    id: string;
    role: string;
    interviewType: string;
    overallScore: number | null;
    grade: string | null;
    endedAt: string | null;
  }[];
  dimensionAverages: {
    star: number;
    techDepth: number;
    comm: number;
    relevance: number;
    confidence: number;
    conciseness: number;
  };
}

export interface ScoreTrendItem {
  id: string;
  score: number;
  date: string;
  role: string;
}

export interface RadarItem {
  subject: string;
  current: number;
  average: number;
}

export interface Question {
  id: string;
  sessionId: string;
  questionText: string;
  questionType: string;
  difficulty: string;
  orderIndex: number;
  briefAcknowledgment?: string;
  answer?: {
    id: string;
    questionId: string;
    userId: string;
    answerText: string;
    wordCount: number;
    submittedAt: string;
    score?: {
      id: string;
      answerId: string;
      starScore: number;
      techDepthScore: number;
      commScore: number;
      relevanceScore: number;
      confidenceScore: number;
      concisenessScore: number;
      overallScore: number;
      aiFeedbackJson: {
        star: {
          situation: string;
          task: string;
          action: string;
          result: string;
        };
        topStrength: string;
        topWeakness: string;
        fillerWords: string[];
        idealAnswerSkeleton: string;
      };
    } | null;
  } | null;
}

export interface SessionDetail {
  id: string;
  userId: string;
  interviewType: string;
  role: string;
  durationMins: number;
  startedAt: string;
  endedAt: string | null;
  overallScore: number | null;
  grade: string | null;
  questions?: Question[];
}

// Helper to get headers
function getHeaders(token?: string) {
  const t = token || localStorage.getItem('accessToken') || '';
  return {
    'Content-Type': 'application/json',
    ...(t ? { 'Authorization': `Bearer ${t}` } : {}),
  };
}

// Robust fetch helper
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Authentication APIs
  async login(email: string, password?: string): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: password || 'password123' }),
    });
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('currentUser', JSON.stringify(res.user));
    return res;
  },

  async register(name: string, email: string, roleTarget: string, experienceLevel: 'fresher' | 'junior' | 'mid' | 'senior', password?: string): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password: password || 'password123', roleTarget, experienceLevel }),
    });
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('currentUser', JSON.stringify(res.user));
    return res;
  },

  async logout(): Promise<void> {
    try {
      await request<void>('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout request failed', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('currentUser');
    }
  },

  async fetchMe(): Promise<User> {
    const res = await request<User>('/auth/me');
    localStorage.setItem('currentUser', JSON.stringify(res));
    return res;
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Dashboard stats APIs
  async getDashboardStats(): Promise<SessionStats> {
    try {
      return await request<SessionStats>('/dashboard/stats');
    } catch (err) {
      console.warn('API error fetching dashboard stats, returning empty metrics:', err);
      return {
        totalSessions: 0,
        avgScore: 0,
        bestScore: 0,
        streak: 0,
        questionsAnswered: 0,
        weakAreas: [],
        recentSessions: [],
        dimensionAverages: {
          star: 0,
          techDepth: 0,
          comm: 0,
          relevance: 0,
          confidence: 0,
          conciseness: 0
        }
      };
    }
  },

  async getScoreTrend(): Promise<ScoreTrendItem[]> {
    try {
      return await request<ScoreTrendItem[]>('/dashboard/score-trend');
    } catch (err) {
      console.warn('API error fetching score trend, returning empty:', err);
      return [];
    }
  },

  async getRadarData(): Promise<RadarItem[]> {
    try {
      return await request<RadarItem[]>('/dashboard/radar-data');
    } catch (err) {
      console.warn('API error fetching radar data, returning empty:', err);
      return [];
    }
  },

  // Session & active interview APIs
  async startSession(role: string, interviewType: 'behavioural' | 'technical' | 'resume_based', durationMins = 30, selectedDomain?: string): Promise<{ sessionId: string; firstQuestion: Question }> {
    return await request<{ sessionId: string; firstQuestion: Question }>('/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ role, interviewType, durationMins, selectedDomain }),
    });
  },

  async submitAnswer(sessionId: string, questionId: string, answerText: string): Promise<{ scoreId: string; scores: any; nextQuestion: Question | null }> {
    return await request<{ scoreId: string; scores: any; nextQuestion: Question | null }>(`/sessions/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ questionId, answerText }),
    });
  },

  async endSession(sessionId: string): Promise<SessionDetail> {
    return await request<SessionDetail>(`/sessions/${sessionId}/end`, {
      method: 'POST',
    });
  },

  async getSessionDetail(sessionId: string): Promise<SessionDetail> {
    return await request<SessionDetail>(`/sessions/${sessionId}`);
  },

  async getHistory(role?: string, type?: string): Promise<{ sessions: SessionDetail[] }> {
    try {
      const queryParams = new URLSearchParams();
      if (role && role !== 'All Roles') queryParams.append('role', role);
      if (type && type !== 'All Types') {
        const mappedType = type === 'Technical Deep Dive' ? 'technical' : type.toLowerCase();
        queryParams.append('type', mappedType);
      }
      return await request<{ sessions: SessionDetail[] }>(`/sessions/history?${queryParams.toString()}`);
    } catch (err) {
      console.warn('API error fetching history, returning empty:', err);
      return { sessions: [] };
    }
  },

  async getResume(): Promise<any> {
    return request<any>('/resumes/me');
  },

  async uploadResume(formData: FormData): Promise<any> {
    const url = `${API_BASE_URL}/resumes/upload`;
    const token = localStorage.getItem('accessToken') || '';
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload failed with status ${response.status}`);
    }

    return response.json();
  },

  async deleteResume(id: string): Promise<any> {
    return request<any>(`/resumes/${id}`, {
      method: 'DELETE',
    });
  },

  async getSessionReportUrl(sessionId: string): Promise<{ url: string }> {
    try {
      return await request<{ url: string }>(`/sessions/${sessionId}/report`);
    } catch (err) {
      console.warn('API error fetching session report URL, using fallback', err);
      return { url: '' };
    }
  },

  async getAiReportSummary(sessionId: string): Promise<{ executive_summary: string, action_plan: string[] }> {
    try {
      return await request<{ executive_summary: string, action_plan: string[] }>(`/sessions/${sessionId}/ai-summary`);
    } catch (err) {
      console.warn('API error fetching AI report summary', err);
      return { executive_summary: '', action_plan: [] };
    }
  },

  async savePreferences(theme: 'light' | 'dark'): Promise<{ success: boolean; theme: string }> {
    try {
      return await request<{ success: boolean; theme: string }>('/preferences', {
        method: 'POST',
        body: JSON.stringify({ theme }),
      });
    } catch (err) {
      console.warn('API error saving preferences, using fallback', err);
      document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
      return { success: true, theme };
    }
  }
};
