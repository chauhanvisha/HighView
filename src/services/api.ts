const API_BASE = import.meta.env.VITE_API_BASE as string
const API_KEY = import.meta.env.VITE_API_KEY as string

// GET single student
export async function getStudent(record_id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/students?record_id=${record_id}`, {
    headers: { 'x-api-key': API_KEY }
  })
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
}

// GET all students
export async function getAllStudents(): Promise<any> {
  const recordIds = ['EDU-001', 'EDU-002', 'EDU-003']
  const results = await Promise.all(
    recordIds.map(id =>
      fetch(`${API_BASE}/students?record_id=${id}`, { headers: { 'x-api-key': API_KEY } })
        .then(res => (res.ok ? res.json() : null))
        .catch(() => null)
    )
  )
  return results.filter(Boolean)
}

// POST (create student)
export async function addStudent(student: any): Promise<any> {
  const res = await fetch(`${API_BASE}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify(student),
  })
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
}

// PUT (update student)
export async function updateStudent(record_id: string, student: any): Promise<any> {
  const res = await fetch(`${API_BASE}/students?record_id=${record_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify(student),
  })
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
}

// DELETE student
export async function deleteStudent(record_id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/students?record_id=${record_id}`, {
    method: 'DELETE',
    headers: { 'x-api-key': API_KEY },
  })
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
}
