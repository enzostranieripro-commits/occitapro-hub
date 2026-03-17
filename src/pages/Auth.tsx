import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useSector } from '@/contexts/SectorContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { sector } = useSector();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: 'Inscription réussie', description: 'Vérifiez votre email pour confirmer votre compte.' });
      }
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = sector?.primaryColor || '#0F172A';

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div
        className="hidden w-1/2 items-center justify-center lg:flex"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-md px-12 text-center">
          <span className="text-6xl">{sector?.emoji || '🏢'}</span>
          <h2
            className="mt-6 text-3xl font-bold"
            style={{ fontFamily: sector?.fontFamily, color: '#fff' }}
          >
            {sector?.label || 'OccitaPro'}
          </h2>
          <p className="mt-3 text-base" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {sector?.description || 'Plateforme de gestion multi-secteurs'}
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full items-center justify-center lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md px-8"
        >
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <span className="text-xs font-bold text-background">OP</span>
            </div>
            <span className="text-lg font-bold">OccitaPro</span>
          </div>

          <h1 className="text-2xl font-bold">
            {isLogin ? 'Connexion' : 'Créer un compte'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLogin
              ? 'Accédez à votre espace de gestion'
              : 'Lancez votre espace en quelques secondes'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@entreprise.fr"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Mot de passe</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Chargement...' : isLogin ? 'Se connecter' : "S'inscrire"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
              {isLogin ? "S'inscrire" : 'Se connecter'}
            </button>
          </p>

          <button
            onClick={() => navigate('/')}
            className="mt-4 block w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            ← Changer de secteur
          </button>
        </motion.div>
      </div>
    </div>
  );
}
