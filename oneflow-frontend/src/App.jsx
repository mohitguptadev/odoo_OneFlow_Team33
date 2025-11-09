import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Pages
import Login from "./pages/PremiumLogin";
import Register from "./pages/PremiumSignup";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Tasks from "./pages/Tasks";
import Analytics from "./pages/Analytics";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import OneFlowAssistant from "./components/assistant/OneFlowAssistant";
import SalesOrders from "./pages/financial/SalesOrders";
import PurchaseOrders from "./pages/financial/PurchaseOrders";
import Invoices from "./pages/financial/Invoices";
import VendorBills from "./pages/financial/VendorBills";
import Expenses from "./pages/financial/Expenses";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication - if no user and not loading, redirect to login
  if (!user && !loading) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated() ? <Navigate to="/dashboard" /> : <Login />}
      />
      <Route
        path="/register"
        element={
          isAuthenticated() ? <Navigate to="/dashboard" /> : <Register />
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1">
                <Navbar />
                <Dashboard />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1">
                <Navbar />
                <Projects />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1">
                <Navbar />
                <ProjectDetail />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1">
                <Navbar />
                <Tasks />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1">
                <Navbar />
                <Analytics />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics/advanced"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1">
                <Navbar />
                <AdvancedAnalytics />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/financial/sales-orders"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1">
                <Navbar />
                <SalesOrders />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/financial/purchase-orders"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1">
                <Navbar />
                <PurchaseOrders />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/financial/invoices"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1">
                <Navbar />
                <Invoices />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/financial/vendor-bills"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1">
                <Navbar />
                <VendorBills />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/financial/expenses"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1">
                <Navbar />
                <Expenses />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppRoutes />
          <OneFlowAssistant />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
