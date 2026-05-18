import studentsData from './students.json'

export interface RealStudent {
  id: string
  name: string
  email: string
  phone: string
  university: string
  major: string
  expectedGraduation: number
  cohort: string
  enrollmentDate: string
  status: 'Active' | 'At Risk'
  attendanceRate: number
  engagementScore: number
  sessionsAttended: number
  totalSessions: number
  gpa: number
  picture: string
}

export interface CohortStudent {
  id: string
  name: string
  initials: string
  school: string
  year: string
  ai: number
  experiential: number
  sessionAttendance: number
  status: 'On track' | 'At risk'
  lastActive: string
  email: string
  phone: string
  major: string
  note: string
  eventsAttended: number
  applications: number
  mentorSessions: number
  jobShadows: number
  opportunities: { title: string; subtitle: string }[]
  staffNotes: { text: string; date: string; author: string }[]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getYearFromGraduation(gradYear: number): string {
  const currentYear = 2026
  const yearsUntilGrad = gradYear - currentYear
  if (yearsUntilGrad <= 1) return 'Senior'
  if (yearsUntilGrad === 2) return 'Junior'
  if (yearsUntilGrad === 3) return 'Sophomore'
  return 'Freshman'
}

function getLastActive(attendanceRate: number): string {
  if (attendanceRate > 90) return 'Today'
  if (attendanceRate > 80) return '2 days ago'
  if (attendanceRate > 70) return '1 week ago'
  return '2 weeks ago'
}

export function transformToCohortStudent(student: RealStudent): CohortStudent {
  return {
    id: student.id,
    name: student.name,
    initials: getInitials(student.name),
    school: student.university,
    year: getYearFromGraduation(student.expectedGraduation),
    ai: student.engagementScore,
    experiential: Math.round(student.attendanceRate * 0.8),
    sessionAttendance: student.attendanceRate,
    status: student.status === 'Active' ? 'On track' : 'At risk',
    lastActive: getLastActive(student.attendanceRate),
    email: student.email,
    phone: student.phone,
    major: student.major,
    note: student.gpa >= 3.5 ? 'High performer' : '',
    eventsAttended: Math.floor(student.sessionsAttended * 0.6),
    applications: Math.floor(Math.random() * 5),
    mentorSessions: Math.floor(student.sessionsAttended * 0.4),
    jobShadows: Math.floor(Math.random() * 3),
    opportunities: [
      { title: 'Curated Connections — Spring', subtitle: 'Networking • Apr 4' },
      { title: 'Crocs Micro-Internship', subtitle: 'Marketing • Closes Apr 15' }
    ],
    staffNotes: [
      { 
        text: `Enrolled in ${student.cohort}. Major: ${student.major}`, 
        date: student.enrollmentDate, 
        author: 'System' 
      }
    ]
  }
}

export const realStudents: RealStudent[] = studentsData as RealStudent[]
export const cohortStudents: CohortStudent[] = realStudents.map(transformToCohortStudent)
