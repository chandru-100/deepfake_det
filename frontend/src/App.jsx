import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Shield, Home as HomeIcon, Upload, AlertTriangle, Activity, LogOut } from 'lucide-react';
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import Report from './pages/Report';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';

function App() {
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
      setAdminUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    setAdminUser(null);
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {/* Navbar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="text-primary w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight text-gray-900">
              Deepfake Detection
            </span>
          </Link>
          <div className="flex gap-6 items-center">
            <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-medium"><HomeIcon className="w-5 h-5"/> Home</Link>
            <Link to="/scan" className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-medium"><Upload className="w-5 h-5"/> Scan Media</Link>
            <Link to="/report" className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-medium"><AlertTriangle className="w-5 h-5"/> Report</Link>
            <Link to="/admin" className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-medium"><Activity className="w-5 h-5"/> Admin</Link>
            
            {adminUser ? (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
                <img src={adminUser.picture} alt="Profile" className="w-8 h-8 rounded-full border border-gray-300" />
                <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors font-medium">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <Link to="/login" className="ml-4 pl-4 border-l border-gray-200">
                <button className="bg-primary hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors">
                  Sign in
                </button>
              </Link>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/scan" element={<Scanner />} />
            <Route path="/report" element={<Report />} />
            <Route path="/login" element={<Login setAdminUser={setAdminUser} />} />
            <Route path="/admin" element={adminUser ? <AdminDashboard /> : <Navigate to="/login" />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-200 py-4 mt-auto">
        </footer>
      </div>
    </Router>
  );
}

export default App;
