  import React, { useState } from 'react';
  import { Helmet } from 'react-helmet';
  import { useNavigate } from 'react-router-dom';
  import { useAuth } from '@/contexts/AuthContext.jsx';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';
  import Header from '@/components/Header.jsx';
  import { ChefHat, LogIn } from 'lucide-react';
  import { useToast } from '@/hooks/use-toast';

  const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
        await login(email, password);
        toast({
          title: "Login realizado!",
          description: "Bem-vindo ao painel administrativo",
        });
        navigate('/admin');
      } catch (error) {
        console.error('Login error:', error);
        toast({
          title: "Erro no login",
          description: "Email ou senha incorretos. Tente novamente.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    return (
      <>
        <Helmet>
          <title>Login - Painel Administrativo</title>
          <meta name="description" content="Acesse o painel administrativo do restaurante" />
        </Helmet>

        <div className="min-h-screen bg-stone-50">
          <Header />

          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                    <ChefHat className="w-8 h-8 text-amber-600" />
                  </div>
                  <h1 className="text-3xl font-bold text-stone-800 mb-2">
                    Painel Administrativo
                  </h1>
                  <p className="text-stone-600">
                    Faça login para acessar o sistema
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="mt-1"
                    />
                  </div>

                  <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
                    <LogIn className="w-5 h-5" />
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  export default LoginPage;