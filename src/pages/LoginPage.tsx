import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { authService } from '../api/authService';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { motion } from 'framer-motion';

export function LoginPage() {
  const [email, setEmail] = useState('test@csm.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const login = useSessionStore((state) => state.login);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = await authService.login(email, password);
      login(data.token, data.user);
      
      // Navigate back to where they came from or home
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-display text-brand-primary mb-2">CSM</h1>
            <p className="text-neutral-600">Đăng nhập để nhận nhiều ưu đãi</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-danger p-3 rounded-md text-sm text-center font-medium">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-900">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-neutral-300 rounded-sm px-4 py-2 focus:outline-brand-primary transition-colors"
                placeholder="Nhập email của bạn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-900">Mật khẩu</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-neutral-300 rounded-sm px-4 py-2 focus:outline-brand-primary transition-colors"
                placeholder="••••••••"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6" 
              size="lg" 
              isLoading={isLoading}
            >
              Đăng Nhập
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-neutral-600">
            Mock credentials: test@csm.com / 123456
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
