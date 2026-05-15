# 🏢 CorpLink - Unified Enterprise Operations OS

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/MehediHasanJibon2003/CorpLink)

**A high-performance, scalable Enterprise Management System (EMS) designed to unify organizational hierarchy, workforce collaboration, and real-time operational tracking.**

---

## 🚩 1. Problem Statement
Modern enterprises often suffer from **fragmented communication** and **operational silos**. Companies use separate tools for task management, internal messaging, and organizational hierarchy. This leads to:
- **Data fragmentation**: Information gets lost across multiple platforms.
- **Security risks**: Managing permissions across different tools is prone to error.
- **Inconsistent UX**: Employees waste time switching between different design systems and workflows.

## 💡 2. Solution Overview
**CorpLink** provides a **Unified Operating System** for the enterprise. It consolidates everything—from high-level departmental structuring to low-level task kanbans and real-time chat—into one cohesive, high-security environment. By centralizing operations, CorpLink reduces overhead and increases organizational transparency.

---

## 🛠️ 3. Tech Stack
- **Frontend**: React 19 (Concurrent Mode), Vite 8, Tailwind CSS 4.
- **State Management**: React Context API (Auth, Theme, Notification).
- **Backend**: Supabase (PostgreSQL, Realtime WebSockets, Storage Buckets).
- **Design**: Framer Motion (Animations), Lucide React (Icons).
- **Deployment**: Vercel.

---

## ✨ 4. Key Features
| Module | Capability |
| :--- | :--- |
| **🛡️ Multi-Tier Auth** | Role-Based Access Control (RBAC) for Super Admin, Corp Admin, HR, and Employee. |
| **🏢 Hierarchy Engine** | Dynamic creation of Departments, Teams, and specialized Workforce Units. |
| **📋 Workflow Kanban** | Industry-standard task tracking with deep-linking and attachment support. |
| **💬 Real-time Comms** | Auto-generated encrypted chat channels for every department and project. |
| **📈 Operational Intel** | Live performance analytics and system-wide activity logging (Audit Trails). |

---

## 📸 5. Screenshots / GIFs

| Landing Page | Admin Dashboard | Task Kanban |
| :---: | :---: | :---: |
| ![Landing](https://placehold.co/600x400?text=Premium+Landing+Page) | ![Dashboard](https://placehold.co/600x400?text=Corporate+Command+Center) | ![Kanban](https://placehold.co/600x400?text=Visual+Workflow+Tracking) |

---

## ⚙️ 6. Setup Instructions

### **Prerequisites**
- Node.js (v18+)
- npm or yarn
- Supabase Account

### **Installation**
```bash
# Clone the repository
git clone https://github.com/MehediHasanJibon2003/CorpLink.git

# Navigate to client directory
cd corplink/corplink-client

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🔑 7. Environment Variables
Create a `.env` file in the `corplink-client/` root folder and add the following:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

---

## 🏗️ 8. API / Architecture
### **System Design thinking**
- **Multi-Tenancy**: The database is structured to handle multiple corporations within a single instance using `company_id` isolation.
- **Security**: Row-Level Security (RLS) ensures users only see data related to their company and role.
- **Real-time**: Leverages PostgreSQL Listen/Notify for instant messaging and notifications without constant polling.

---

## 🔗 9. Live Demo & Credentials
🚀 **Live URL:** [View CorpLink Live](https://corp-link.vercel.app/)  

🔐 **Safe Test Credentials:**  
| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `super@corplink.com` | `123456` |
| **Corp Admin** | `admin@example.com` | `123456` |
| **Employee** | `emp@example.com` | `123456` |

---
© 2026 CorpLink Enterprise Systems. All rights reserved.
Developed for organizational excellence and high-impact efficiency.
