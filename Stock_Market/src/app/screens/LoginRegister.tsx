import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTrading } from '../context/TradingContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { TrendingUp, Lock, User } from 'lucide-react';

export default function LoginRegister() {
  const navigate = useNavigate();
  const { login, register } = useTrading();
  
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (login(loginData.username, loginData.password)) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (register(registerData.username, registerData.password)) {
      navigate('/dashboard');
    } else {
      setError('Username already exists');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a0a2e] to-[#0f0721]">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-[#2979ff] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-[#00c853] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-[#ff1744] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Forex Trading Animation Video Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          style={{ pointerEvents: 'none' }}
          src="/videos/forex-trading-animation.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label="Background Video"
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      </div>

      {/* Glass Card Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2979ff] to-[#1e5dd8] mb-4 shadow-lg shadow-[#2979ff]/50">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-[#2979ff] to-[#00c853] bg-clip-text text-transparent mb-2">
            Stock Trading Engine
          </h1>
          <p className="text-[#888888] text-sm font-mono">
            Min-Heap · Max-Heap · O(log n) Performance
          </p>
        </div>

        {/* Glassmorphism Login/Register Card */}
        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#2979ff]/20 via-[#00c853]/20 to-[#2979ff]/20 rounded-2xl blur-lg opacity-30"></div>
          
          <div className="relative">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-1 mb-6">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#2979ff] data-[state=active]:to-[#1e5dd8] rounded-lg data-[state=active]:text-white transition-all duration-300"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#2979ff] data-[state=active]:to-[#1e5dd8] rounded-lg data-[state=active]:text-white transition-all duration-300"
                >
                  Register
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-username" className="text-white/90">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                      <Input
                        id="login-username"
                        type="text"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        className="pl-11 bg-black/30 backdrop-blur-md border-white/10 text-white placeholder:text-[#666666] rounded-xl focus:border-[#2979ff] focus:ring-2 focus:ring-[#2979ff]/50 transition-all"
                        placeholder="Enter username"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-white/90">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                      <Input
                        id="login-password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="pl-11 bg-black/30 backdrop-blur-md border-white/10 text-white placeholder:text-[#666666] rounded-xl focus:border-[#2979ff] focus:ring-2 focus:ring-[#2979ff]/50 transition-all"
                        placeholder="Enter password"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-[#ff1744]/20 border border-[#ff1744]/50 rounded-xl backdrop-blur-sm">
                      <p className="text-[#ff1744] text-sm text-center">{error}</p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-[#2979ff] to-[#1e5dd8] hover:from-[#1e5dd8] hover:to-[#2979ff] text-white rounded-xl h-12 font-semibold shadow-lg shadow-[#2979ff]/50 hover:shadow-[#2979ff]/70 transition-all duration-300"
                  >
                    Login
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="register-username" className="text-white/90">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                      <Input
                        id="register-username"
                        type="text"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        className="pl-11 bg-black/30 backdrop-blur-md border-white/10 text-white placeholder:text-[#666666] rounded-xl focus:border-[#00c853] focus:ring-2 focus:ring-[#00c853]/50 transition-all"
                        placeholder="Choose username"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-white/90">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                      <Input
                        id="register-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="pl-11 bg-black/30 backdrop-blur-md border-white/10 text-white placeholder:text-[#666666] rounded-xl focus:border-[#00c853] focus:ring-2 focus:ring-[#00c853]/50 transition-all"
                        placeholder="Create password"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm" className="text-white/90">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                      <Input
                        id="register-confirm"
                        type="password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        className="pl-11 bg-black/30 backdrop-blur-md border-white/10 text-white placeholder:text-[#666666] rounded-xl focus:border-[#00c853] focus:ring-2 focus:ring-[#00c853]/50 transition-all"
                        placeholder="Confirm password"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-[#ff1744]/20 border border-[#ff1744]/50 rounded-xl backdrop-blur-sm">
                      <p className="text-[#ff1744] text-sm text-center">{error}</p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-[#00c853] to-[#00a844] hover:from-[#00a844] hover:to-[#00c853] text-white rounded-xl h-12 font-semibold shadow-lg shadow-[#00c853]/50 hover:shadow-[#00c853]/70 transition-all duration-300"
                  >
                    Register
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Admin Hint */}
        <div className="mt-6 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-center font-mono text-[#888888]">
            <span className="text-[#2979ff] font-semibold">ADMIN ACCESS</span> → 
            <span className="text-white/90"> admin</span> / 
            <span className="text-white/90">admin@123</span>
          </p>
        </div>

        {/* Starting Balance Info */}
        <div className="mt-3 backdrop-blur-xl bg-gradient-to-r from-[#00c853]/10 to-[#2979ff]/10 border border-white/10 rounded-xl p-3">
          <p className="text-xs text-center font-mono text-white/80">
            💰 Starting Balance: <span className="text-[#00c853] font-semibold">$500,000</span> · Max 1000 shares/order
          </p>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}