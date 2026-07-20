<div align="center">

<img width="150" height="150" alt="image" src="https://github.com/user-attachments/assets/08453326-52bd-4d24-ac4d-21dd148be878" />

# stdy.io
**A responsive learning platform demo — courses, checkout, dashboards, and a forum, all in the browser.**

Browse courses, enroll for free or "buy" a paid course, track progress, earn certificates, and explore student, instructor, and admin dashboards. No backend, no signup, no risk, everything runs and persists locally in your browser.

[![Live Demo](https://img.shields.io/badge/OPEN%20APP-Live%20Demo-1C5D42?style=for-the-badge&logo=vercel&logoColor=0C1117)](https://stdy-io.vercel.app/)
[![No Backend](https://img.shields.io/badge/No%20Backend-Fully%20Static-163F14?style=for-the-badge)](https://stdy-io.vercel.app/)
[![Demo Only](https://img.shields.io/badge/Data-Browser%20Storage%20Only-070D0C?style=for-the-badge)](https://stdy-io.vercel.app/)
[![Type](https://img.shields.io/badge/Type-Learning%20Platform-0C1117?style=for-the-badge)](https://stdy-io.vercel.app/)

</div>

---

## About

stdy.io is a **responsive, front-end learning platform demo** built with plain HTML, CSS, and vanilla JavaScript, no framework, no build step, no server.

Course data, enrollment, progress, cart, checkout, forum activity, and user sessions are all simulated in browser storage. It's designed to look and feel like a real e-learning platform (think Udemy-style browsing, checkout, and dashboards) while staying 100% static and safe to click around in.

> **Heads up:** unlike a typical full-stack template, stdy.io has **no backend and needs no database.** Every "account," "purchase," and "certificate" lives only in your browser's local storage. Clone it, open it, and it just works, nothing to configure.

---

## Data Flow

```
Browse Courses          →  Static course catalog, search and filtering
    ↓
Enroll / Add to Cart     →  Free courses enroll instantly, paid courses go to cart
    ↓
Simulated Checkout       →  Safe demo autofill, no real payment ever processed
    ↓
Local Persistence        →  Enrollment, progress, cart, and session saved in browser storage
    ↓
Learning & Dashboards    →  Lessons, quizzes, certificates, forum, role-based dashboards
```

---

## Features

- **Twelve Realistic Courses** — Searchable catalog with detailed curricula and course pages
- **Whole-Card Navigation** — Clickable course cards with responsive detail layouts
- **One-Click Learner Demo** — Instant free-course enrollment with confirmation
- **Cart & Simulated Checkout** — Paid-course cart flow with safe demo autofill, no real payment
- **Progress & Certificates** — Learning progress tracking, quizzes, and earned certificates
- **Three Role Dashboards** — Separate student, instructor, and admin dashboards
- **Community Forum** — Simulated forum activity and discussion pages
- **Emerald Light & Dark Themes** — Built around the supplied stdy.io artwork
- **Fully Responsive** — Layouts tuned for desktop, tablet, and mobile

---

## Built For

```
Purpose  → Front-end learning-platform demo and portfolio piece
Backend  → None — HTML, CSS, and vanilla JavaScript only
Storage  → Browser local storage (courses, cart, sessions, progress)
Status   → Complete, ready to run — no setup or configuration needed
Not For  → Real accounts, real payments, or real personal data
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML |
| Styling | CSS (light/dark emerald themes) |
| Logic | Vanilla JavaScript |
| Persistence | Browser local storage |
| Deployment | Vercel (static hosting) |

---

## Project Structure

```
stdy.io/
├── assets/                    Images and stdy.io artwork
├── css/                       Stylesheets, light and dark themes
├── js/                        App logic, cart, auth, dashboards
├── index.html                 Landing page
├── courses.html                Course catalog
├── course-details.html         Individual course page
├── cart.html / checkout.html   Cart and simulated checkout
├── dashboard.html               Student dashboard
├── instructor-dashboard.html    Instructor dashboard
├── admin-dashboard.html         Admin dashboard
├── learning.html                In-course learning view
├── certificates.html            Earned certificates
├── forum.html                   Community forum
├── login.html / register.html   Auth pages
└── about.html / contact.html / terms.html / privacy.html
```

---

## Run Locally

No build step, no installation, no environment variables.

1. Clone the repo
2. Open `index.html` directly in your browser, **or** serve the folder with any static file server, e.g.:
   ```
   npx serve .
   ```
3. That's it, browse, enroll, "buy" a course, and everything saves in your browser

---

## Demo Accounts

The login page also has one-click buttons for each role below.

| Role | Email | Password |
|------|-------|----------|
| Student | `student@stdy.io` | `Student123` |
| Instructor | `instructor@stdy.io` | `Instructor123` |
| Administrator | `admin@stdy.io` | `Admin123` |

---

## Demo-Only Notice

This project has **no backend.** Authentication, payment, email, and persistence are all simulated locally in the browser. Do not enter real personal or financial information anywhere in the app.

---

## Roadmap / Ideas

- [ ] Optional real backend (Supabase/Firebase) for persistent accounts
- [ ] Real payment gateway integration
- [ ] Video lesson playback
- [ ] Instructor course-authoring tools
- [ ] Notifications and email digests

---

<div align="center">

*stdy.io — a complete learning-platform front end. No backend required, just open it and explore.*

[stdy-io.vercel.app](https://stdy-io.vercel.app/)

</div>
