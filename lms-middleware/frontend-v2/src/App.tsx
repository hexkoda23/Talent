import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.tsx';
import Login from './Login.tsx';
import Dashboard from './Dashboard.tsx';
import QuestWorkspace from './QuestWorkspace.tsx';
import AuditWorkspace from './AuditWorkspace.tsx';
import AdminDashboard from './AdminDashboard.tsx';
import QuestEditor from './QuestEditor.tsx';
import './App.css';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading-screen"><div className="loading-spinner"></div></div>;
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/" 
        element={<Navigate to="/quests" />} 
      />
      <Route 
        path="/quests" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/audits" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/quest/:questId" 
        element={
          <ProtectedRoute>
            <QuestWorkspace />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/audit/:sessionId"
        element={
          <ProtectedRoute>
            <AuditWorkspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/quest/:id"
        element={
          <ProtectedRoute>
            <QuestEditor />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
