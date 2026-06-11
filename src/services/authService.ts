import { supabase } from '../lib/supabase'
import { addStudent } from './api'

export interface User {
  id: string
  email: string
  name: string
  type: 'student' | 'staff' | 'admin'
  institution?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
  needsEmailConfirmation?: boolean
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

// Map Supabase user → our User shape (keeps all pages working unchanged)
function mapUser(supabaseUser: { id: string; email?: string; user_metadata?: Record<string, string> }): User {
  const meta = supabaseUser.user_metadata ?? {}
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    name: meta.full_name ?? supabaseUser.email?.split('@')[0] ?? '',
    type: (meta.role as User['type']) ?? 'student',
    institution: meta.institution,
  }
}

const STAFF_ALIASES = new Set(['staff', 'teacher'])

class AuthService {
  async signup(data: SignupData): Promise<AuthResponse> {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          role: data.role,
          institution: data.institution ?? '',
        },
      },
    })

    if (error) throw new Error(error.message)
    if (!authData.user) throw new Error('Signup failed — please try again')

    const user = mapUser(authData.user)
    const needsEmailConfirmation = !authData.session

    // Only persist session if email is already confirmed (session exists)
    if (!needsEmailConfirmation) {
      this._persist(user, authData.session!.access_token)
    }

    // Persist student enrollment to DynamoDB (fire-and-forget)
    if (data.role === 'student') {
      const enrolledAt = new Date().toISOString()
      const record_id = `STU-${user.id}`
      addStudent({
        record_id,
        student_id: record_id,
        student_name: data.fullName,
        student_email: data.email,
        department: data.institution ?? '',
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

    return { access_token: authData.session?.access_token ?? '', token_type: 'bearer', user, needsEmailConfirmation }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) throw new Error(error.message)
    if (!authData.user) throw new Error('Login failed — please try again')

    const user = mapUser(authData.user)

    // Enforce role separation: a student can't log in on the staff page and vice‑versa
    if (data.role) {
      const requestedIsStaff = STAFF_ALIASES.has(data.role)
      const actualIsStaff = STAFF_ALIASES.has(user.type)
      if (requestedIsStaff !== actualIsStaff) {
        await supabase.auth.signOut()
        const expected = requestedIsStaff ? 'staff' : 'student'
        throw new Error(`This account is registered as '${user.type}'. Please use the ${expected} login.`)
      }
    }

    this._persist(user, authData.session.access_token)
    return { access_token: authData.session.access_token, token_type: 'bearer', user }
  }

  async getCurrentUser(): Promise<User> {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) throw new Error('Not authenticated')
    return mapUser(data.user)
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = this.getUser()
    if (!user) throw new Error('Not authenticated')

    // Re-authenticate to verify the current password before allowing the change
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (verifyError) throw new Error('Current password is incorrect')

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw new Error(error.message)
  }

  logout(): void {
    supabase.auth.signOut()
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('isAuthenticated') === 'true'
  }

  getToken(): string | null {
    return localStorage.getItem('access_token')
  }

  getUser(): User | null {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return null }
  }

  private _persist(user: User, token: string): void {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('access_token', token)
    localStorage.setItem('isAuthenticated', 'true')
  }
}

export const authService = new AuthService()
