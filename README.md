# 🧺 Laundry Management System

An application for managing laundry machines and services.  
Supports machine status display, advance booking, admin dashboard, and usage statistics.

---

## 🛠️ Technologies Used

### 🖥️ Frontend (Web/UI)
- **React.js** - JavaScript framework for building user interfaces  
- **Tailwind CSS** - For design and styling  
- **Shadcn/ui** - UI components library (buttons, cards, forms)  
- **Lucide React** - Beautiful icons  
- **Axios** - For API requests  

### ⚙️ Backend (Server)
- **FastAPI** - Python framework for creating REST APIs  
- **Pydantic** - For data validation  
- **Python** - Primary programming language  

### 🗄️ Database
- **MongoDB** - NoSQL database for storing machine and booking data  
- **Motor** - Async MongoDB driver for Python  

### 🎨 Design & UX
- **Responsive Design** - Works well on both mobile and desktop  
- **Thai Language Support** - Full Thai language support  
- **Color Coding System** - Green = Available, Red = In use, Gray = Out of order  

### 🔧 Development Tools
- **Vite** - Build tool for React  
- **ESLint** - Code quality checker  
- **PostCSS** - CSS processor  

### ☁️ Deployment
- **Emergent Platform** - Cloud hosting  
- **Docker** - Containerization  
- **Nginx** - Web server  


---
## 🖥️ Screenshots
<img width="1915" height="954" alt="image" src="https://github.com/user-attachments/assets/3ee0a966-e711-42bb-9a97-ee9b6bb54d4d" />
<img width="1899" height="960" alt="image" src="https://github.com/user-attachments/assets/d01a77fb-d0eb-4e97-8bcf-b18359a86330" />
<img width="1899" height="970" alt="image" src="https://github.com/user-attachments/assets/236f03af-7891-42ce-91e0-81105473267a" />
<img width="1902" height="966" alt="image" src="https://github.com/user-attachments/assets/0a98a4b6-c332-4449-9c9c-1a4d17c043dc" />

---

## 🔗 Demo & Repository
- Live Demo: [https://your-live-demo-link.com  ](https://laundry-add.netlify.app/)
- GitHub: https://github.com/Foam-01/pos-inventory-system
---
## 📋 Application Structure
---

Laundry Management System/
├── Frontend (React)
│ ├── Machine Status Display
│ ├── Booking System
│ ├── Admin Dashboard
│ └── Usage Statistics
│
├── Backend (FastAPI)
│ ├── Machine Management API
│ ├── Booking API
│ ├── Statistics API
│ └── Admin System
│
└── Database (MongoDB)
├── Machine Data
├── Booking Data
└── Usage Statistics

---

## ⚡ Features
- ✅ Real-time Updates - Data refreshes every 30 seconds  
- ✅ Responsive Design - Fully mobile-friendly  
- ✅ Admin Panel - Manage system settings  
- ✅ Booking System - Reserve machines in advance  
- ✅ Statistics Dashboard - View usage statistics  

---

## 🎯 Why These Technologies?
- **React** - Popular with a large community  
- **FastAPI** - Fast with automatic documentation  
- **MongoDB** - Flexible, suitable for this type of data  
- **Tailwind** - Quickly build beautiful UIs  

---

## 🏁 Getting Started

```bash
git clone https://github.com/Foam-01/laundry-app.git
cd laundry-app

# Install frontend dependencies
npm install   # or yarn install

# Install backend dependencies
pip install -r requirements.txt

# Run frontend
npm run dev

# Run backend
uvicorn backend.main:app --reload
```
