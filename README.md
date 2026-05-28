# HighView — Student Engagement Platform

A web application for managing student cohorts, sessions, courses, and opportunities. Built for both staff and students, with role-based views, profile management, and settings that work across the entire app.

---

## What It Does

**Staff**
- View and manage the full student cohort with engagement metrics, attendance, and at-risk alerts
- Create and manage sessions with grade-level attendance requirements
- Track course enrollment, completion rates, and attendance distribution
- Upload session recordings for AI-powered attendance analysis
- Post and manage opportunities (internships, job shadows, events)
- AI analytics chatbot connected to AWS for querying student data

**Students**
- Dashboard showing pillar progress (AI Learning, Experiential Learning, Session Attendance)
- Sessions page with mandatory vs. optional sessions highlighted by grade level
- Course catalog with registration, enrollment tracking, and upcoming courses
- LinkedIn/Handshake-style profile with bio, education, skills, and contact info
- Opportunities page for browsing internships, job shadows, and events

**Both**
- Fully functional settings: dark mode, notifications, timezone/date format, password change
- Notification bell in navbar driven by live settings state

---

## Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion, Recharts
- **Auth:** Mock authentication via localStorage (Supabase integration planned)
- **Data:** localStorage persistence for sessions, registrations, settings, profiles
- **AI:** AWS Lambda chatbot for staff analytics queries
- **Deployment:** Vercel — https://high-view-u3gz.vercel.app

---

## Pages

| Route | Staff | Student |
|---|---|---|
| `/` | Cohort dashboard + AI chatbot | Pillar progress dashboard |
| `/sessions` | Manage sessions, upload recordings | View sessions, register, add to calendar |
| `/courses` | Analytics, completion rates, attendance chart | My courses + course catalog with registration |
| `/explore` | Manage opportunities | Browse opportunities |
| `/cohort` | Full cohort table with filters | — |
| `/profile` | Job title + settings | LinkedIn-style profile + settings |
| `/login` | — | Sign in / sign up |

---

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173

### Test Accounts

Sign up on the login page and select **Student** or **Staff** as your role. All data is stored in your browser's localStorage.

---

## Key Features

**Role-based views** — staff and student see entirely different UIs for the same routes (home, courses, sessions, profile).

**Global settings** — dark mode, timezone, and date format apply across the whole app via React Context, not just the settings page.

**Mandatory sessions** — staff tag sessions by grade level (Freshman/Sophomore/Junior/Senior). Students see a "Required for You" section if their class year is set in their profile.

**Pillar progress** — student home shows real completion percentages for AI Learning, Experiential Learning, and Session Attendance pulled from cohort data matched by email.

**Course registration** — students register/drop courses, which persists to localStorage and reflects immediately in "My Courses".

**Student profile** — editable bio, school, major, class year, GPA, location, skills, phone, LinkedIn, GitHub. All persisted to localStorage.

---

## Roadmap

- [ ] Supabase backend — replace all localStorage with real database + auth
- [ ] Google OAuth login
- [ ] Real notification delivery (email + push)
- [ ] Live attendance tracking via video upload
- [ ] Student-staff messaging
