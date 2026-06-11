import { addStudent } from './api'

const AUTH_API = import.meta.env.VITE_AUTH_API_URL as string

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
    this.token = localStorage.getItem('access_token')
  }

  async signup(data: SignupData): Promise<AuthResponse> {
    const res = await fetch(`${AUTH_API}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Signup failed')
    }
    const authData: AuthResponse = await res.json()

    this.token = authData.access_token
    localStorage.setItem('access_token', authData.access_token)
    localStorage.setItem('user', JSON.stringify(authData.user))
    localStorage.setItem('isAuthenticated', 'true')

    // Persist student enrollment to database (fire-and-forget)
    if (data.role === 'student') {
      const enrolledAt = new Date().toISOString()
      const record_id = `STU-${authData.user.id}`
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
      }).catch(() => { /* non-blocking */ })
    }

    return authData
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const res = await fetch(`${AUTH_API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Login failed')
    }
    const authData: AuthResponse = await res.json()

    this.token = authData.access_token
    localStorage.setItem('access_token', authData.access_token)
    localStorage.setItem('user', JSON.stringify(authData.user))
    localStorage.setItem('isAuthenticated', 'true')

    return authData
  }

  async getCurrentUser(): Promise<User> {
    if (!this.token) throw new Error('Not authenticated')
    const res = await fetch(`${AUTH_API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${this.token}` },
    })
    if (!res.ok) throw new Error('Failed to get current user')
    return res.json()
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!this.token) throw new Error('Not authenticated')
    const res = await fetch(`${AUTH_API}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Password change failed')
    }
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
