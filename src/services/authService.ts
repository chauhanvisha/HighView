// Mock authentication - works without backend
// In production, replace with actual API_URL from environment variable
const USE_MOCK_AUTH = true // Set to false when backend is deployed

import { addStudent } from './api'

export interface User {
  id: number
  email: string
  name: string
  type: 'student' | 'staff' | 'admin'
  institution?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface SignupData {
  email: string
  password: string
  fullName: string
  role: string
  institution?: string
}

export interface LoginData {
  email: string
  password: string
  role?: string
}

class AuthService {
  private token: string | null = null

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('access_token')
  }

  private generateMockToken(): string {
    return 'mock_token_' + Math.random().toString(36).substring(2, 15)
  }

  async signup(data: SignupData): Promise<AuthResponse> {
    if (USE_MOCK_AUTH) {
      // Mock signup - simulate successful registration
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay
      
      const user: User = {
        id: Date.now(),
        email: data.email,
        name: data.fullName,
        type: data.role as 'student' | 'staff' | 'admin',
        institution: data.institution,
      }

      const authData: AuthResponse = {
        access_token: this.generateMockToken(),
        token_type: 'Bearer',
        user,
      }

      // Store token and user data
      this.token = authData.access_token
      localStorage.setItem('access_token', authData.access_token)
      localStorage.setItem('user', JSON.stringify(authData.user))
      localStorage.setItem('isAuthenticated', 'true')

      // Persist student enrollment to database (fire-and-forget — never blocks signup)
      if (data.role === 'student') {
        const enrolledAt = new Date().toISOString()
        const record_id = `STU-${user.id}`
        addStudent({
          record_id,
          student_id: record_id,
          student_name: data.fullName,
          student_email: data.email,
          department: data.institution || '',
          class_name: '',
          teacher_name: '',
          topic: '',
          session_date: enrolledAt.split('T')[0],
          attendance: 0,
          engagement: 0,
          grade: 0,
          speaking_time: 0,
          photo_url: '',
          enrolled_at: enrolledAt,
          role: 'student',
        }).catch(() => { /* non-blocking — enrollment saved locally */ })
      }

      return authData
    }

    // Backend auth code (when USE_MOCK_AUTH is false)
    throw new Error('Backend authentication not configured')
  }

  async login(data: LoginData): Promise<AuthResponse> {
    if (USE_MOCK_AUTH) {
      // Mock login - simulate successful authentication
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay
      
      const user: User = {
        id: Date.now(),
        email: data.email,
        name: data.email.split('@')[0],
        type: (data.role as 'student' | 'staff' | 'admin') || 'student',
        institution: 'HighView',
      }

      const authData: AuthResponse = {
        access_token: this.generateMockToken(),
        token_type: 'Bearer',
        user,
      }

      // Store token and user data
      this.token = authData.access_token
      localStorage.setItem('access_token', authData.access_token)
      localStorage.setItem('user', JSON.stringify(authData.user))
      localStorage.setItem('isAuthenticated', 'true')

      return authData
    }

    // Backend auth code (when USE_MOCK_AUTH is false)
    throw new Error('Backend authentication not configured')
  }

  async getCurrentUser(): Promise<User> {
    if (!this.token) {
      throw new Error('No authentication token found')
    }

    if (USE_MOCK_AUTH) {
      // Mock getCurrentUser - return user from localStorage
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        throw new Error('No user data found')
      }
      return JSON.parse(userStr)
    }

    // Backend auth code (when USE_MOCK_AUTH is false)
    throw new Error('Backend authentication not configured')
  }

  logout(): void {
    this.token = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
  }

  isAuthenticated(): boolean {
    return !!this.token && localStorage.getItem('isAuthenticated') === 'true'
  }

  getToken(): string | null {
    return this.token
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }
}

export const authService = new AuthService()
