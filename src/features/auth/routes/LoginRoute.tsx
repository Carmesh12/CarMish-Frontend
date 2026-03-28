import React, { useState } from 'react';
import { InputField } from '../components/InputField';

// Login Route Component
export const LoginRoute: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      // Save token to localStorage (or handle it based on your auth strategy)
      localStorage.setItem('token', data.token);
      
      // For now, just show a success message
      alert(`Login successful! Welcome ${data.user.role}`);
      console.log('User Data:', data.user);
      
      // TODO: Redirect user to the dashboard using React Router
      // navigate('/dashboard');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full bg-[#FFFFFF]">
      {/* Left Visual Side (60% on desktop) */}
      <div className="md:w-[60%] w-full min-h-[40vh] md:min-h-screen relative flex flex-col justify-center items-center p-8 overflow-hidden bg-gradient-to-br from-[#1A2238] to-[#007BFF]">
        
        {/* Subtle geometric/tech overlay */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{
            backgroundImage: `linear-gradient(rgba(224, 224, 224, 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(224, 224, 224, 0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        >
          {/* Decorative glowing orb */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#007BFF] rounded-full mix-blend-screen filter blur-[128px] opacity-50 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#1A2238] rounded-full mix-blend-screen filter blur-[128px] opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative z-10 text-center max-w-2xl">
          <h1 className="text-5xl md:text-7xl font-extrabold text-[#FFFFFF] mb-6 tracking-tight drop-shadow-lg">
            CarMesh
          </h1>
          <p className="text-xl md:text-2xl text-[#E0E0E0] font-light tracking-wide">
            Experience the drive before the ride.
          </p>
        </div>
      </div>

      {/* Right Form Side (40% on desktop) */}
      <div className="md:w-[40%] w-full flex flex-col justify-center items-center p-8 md:p-16 bg-[#FFFFFF]">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-bold text-[#1A2238] mb-3">
              Welcome Back to CarMesh
            </h2>
            <p className="text-base text-[#1A2238]/70">
              Please enter your details to sign in.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full">
            {error && (
              <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            <InputField
              label="Email Address"
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <InputField
              label="Password"
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex justify-end mb-8 mt-2">
              <a href="#" className="text-sm font-medium text-[#007BFF] hover:text-[#1A2238] transition-colors duration-200">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 px-4 text-[#FFFFFF] font-semibold rounded-md transition-colors duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:ring-offset-2 ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[#1A2238] hover:bg-[#007BFF] hover:shadow-lg'
              }`}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-[#1A2238]">
              Don't have an account?{' '}
              <a href="#" className="font-semibold text-[#007BFF] hover:underline transition-all">
                Create Account
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
