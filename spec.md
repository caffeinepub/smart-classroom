# Smart Classroom

## Current State
New project. A static HTML prototype exists as reference with hardcoded login, a single quiz question, fake poll/game/doubt/feedback buttons, and Chart.js charts.

## Requested Changes (Diff)

### Add
- Multi-account authentication: multiple teachers and students can register/login with username + password; role-based access (teacher vs student)
- Quiz system: teachers create/edit/delete quiz questions with multiple choice answers; students take quizzes and scores are saved per user
- Live polls: teacher creates real poll questions with options; students submit answers; teacher sees live results
- Doubts & feedback: students submit text doubts (with optional voice recording) and written feedback; all stored and visible in teacher dashboard with timestamps
- Doubt chat box: teacher can reply to student doubts; student sees reply
- Knowledge game: timed trivia game using quiz question bank; scores saved per student; real leaderboard showing all students ranked by total points
- Notification system: in-app notifications for students (new quiz, new poll, teacher reply to doubt) and teachers (new doubt, new feedback submitted)
- Real-time dashboard stats: teacher sees total students, active polls, quiz attempts today, pending doubts; student sees their quiz scores, game points, attendance %
- Attendance history: teacher can mark attendance per student per day; student can view their own attendance record
- Smart suggestions: teacher dashboard shows suggestions based on data (e.g. "3 students struggling with Quiz 2", "Poll participation dropped 20%")
- Dark/light mode toggle: persisted preference
- Mobile app simulation: responsive layout with a phone-frame preview mode

### Modify
- Login page: replace hardcoded auth with real account system
- Student dashboard: add all new feature sections
- Teacher dashboard: add quiz management, poll management, doubt inbox, attendance, analytics, notifications

### Remove
- All hardcoded alert() stubs
- Hardcoded chart data (replace with real backend data)

## Implementation Plan
1. Backend (Motoko): user accounts with roles, quiz CRUD, poll CRUD + vote storage, doubt/feedback CRUD + replies, game score storage + leaderboard, attendance records, notification storage
2. Frontend: role-based routing, teacher dashboard with all management panels, student dashboard with all interactive features, dark/light mode, notifications bell, voice doubt recording, leaderboard, attendance history, smart suggestion engine
