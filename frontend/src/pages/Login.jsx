import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

const Login = ({ setAdminUser }) => {
  const navigate = useNavigate();

  const handleLoginSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const user = {
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture
      };
      // For this project, any valid Google Login is accepted as Admin
      localStorage.setItem('adminUser', JSON.stringify(user));
      setAdminUser(user);
      navigate('/admin');
    } catch (error) {
      console.error('Login error', error);
      alert('Failed to login. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-10 max-w-md w-full text-center">
        <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Access</h1>
        <p className="text-gray-600 mb-8">Sign in with your Google account to access the administration dashboard.</p>
        
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => {
              console.log('Login Failed');
              alert('Login Failed');
            }}
            useOneTap
            shape="rectangular"
            theme="outline"
            size="large"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
