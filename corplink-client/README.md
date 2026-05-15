# 🏢 CorpLink - Enterprise-Grade Operational OS

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**CorpLink** is a massive, high-performance Enterprise Management System (EMS) designed for modern corporations. It unifies workforce collaboration, organizational hierarchy, project tracking, and secure communication into a single, high-contrast premium workspace.

---

## 🔗 Live Operations
🚀 **Live Demo:** [View CorpLink Live]([LIVE_DEMO_URL])  
*(Note: Replace `[LIVE_DEMO_URL]` with your actual deployed URL after hosting on Vercel/Netlify)*

---

## ✨ Core Modules & Features

### 🔐 Multi-Tier Security & Auth
- **Role-Based Access Control (RBAC)**: Distinct permissions for Super Admins, Corporate Admins, HR, and Employees.
- **Phased Guarding**: Specialized route protection (`ProtectedRoute`, `RoleGate`) ensures data isolation.
- **Audit Logs**: Real-time tracking of administrative actions and login attempts.

### 🏢 Corporate Architecture
- **Unit Management**: Create and manage Departments, Teams, and specialized workforce units.
- **Hierarchy Mapping**: Direct lead assignment and employee-to-team mapping.
- **Enterprise Settings**: Global branding, logo management, and platform-wide configuration.

### 📋 Workflow & Project Management
- **Kanban Boards**: Industry-standard task tracking with drag-and-drop intuition.
- **Deep Linking**: Direct navigation to specific tasks or projects via URL search params.
- **Task Attachments**: Integrated file storage and media preview for all project tasks.

### 💬 Unified Communication
- **Departmental Channels**: Automated real-time chat groups for every department created.
- **Project Collaboration**: Dedicated discussion hubs for specific project teams.
- **Real-time Notifications**: Instant system alerts for task assignments and organizational updates.

---

## 🛠️ Technical Architecture

### **Frontend Infrastructure**
- **React 19**: Utilizing the latest concurrent rendering features.
- **Vite 8**: Lightning-fast build tool with optimized bundling.
- **Tailwind CSS 4**: Modern, high-contrast design system.
- **Framer Motion**: Smooth, premium micro-animations and transitions.
- **Recharts**: Data-driven insights for organizational performance.

### **Backend & Storage**
- **PostgreSQL**: Robust relational data structure.
- **Realtime (WebSockets)**: Live sync for chat and notifications.
- **Supabase Auth**: Secure JWT-based session management.
- **Edge Storage**: Optimized bucket management for task attachments.

---

## 📂 Project Structure

```text
E:\CorpLink\
├── corplink-client/         # React Application (Frontend)
│   ├── src/
│   │   ├── components/      # Atomic UI, Shared Layouts, Role-specific widgets
│   │   ├── context/         # Auth, Theme, and Confirmation state providers
│   │   ├── lib/             # API clients & configuration (Supabase)
│   │   ├── pages/           # Organised by Role (Auth, Corporate, Employee, SuperAdmin)
│   │   ├── services/        # Business logic abstraction (Analytics, Usage)
│   │   └── utils/           # Global loggers, Permission helpers, Formatters
│   └── public/              # Static branding assets
└── database/                # Version-controlled Database Schema
    ├── schema/              # Core Table definitions & RLS Policies
    └── migrations/          # Incremental database updates & fix scripts
```

---

## 🚀 Deployment Guide

### **Step 1: Environment Configuration**
Create a `.env` file in the root of `corplink-client/`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### **Step 2: Local Installation**
```bash
cd corplink-client
npm install
npm run dev
```

### **Step 3: Production Build**
```bash
npm run build
```

### **Step 4: Hosting (Vercel/Netlify)**
1. Connect your GitHub repository to Vercel/Netlify.
2. Set the **Build Command** to `npm run build`.
3. Set the **Output Directory** to `dist`.
4. Add your **Environment Variables** (VITE_SUPABASE_URL, etc.) in the dashboard settings.

---

## 🤝 Contact & Support
Developed for Enterprise Excellence.  
**Platform Owner:** [Your Name/Company]  
**Documentation Version:** 1.0.0 (Stable)

---
© 2026 CorpLink Enterprise Systems. All rights reserved.
