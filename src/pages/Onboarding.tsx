import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useSector } from '@/contexts/SectorContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function OnboardingPage() {
  const { user } = useAuth();
  const { sector, sectorId } = useSector();
  const { refreshWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) navigate('/auth');
    if (!sectorId) navigate('/');
  }, [user, sectorId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !sectorId) return;
    setLoading(true);
    try {
      // Create workspace
      const { data: ws, error: wsErr } = await (supabase as any)
        .from('workspaces')
        .insert({ name, sector: sectorId, owner_id: user.id })
        .select()
        .single();
      if (wsErr) throw wsErr;
      if (!ws) throw new Error('Failed to create workspace');

      // Add owner as admin member
      const { error: memErr } = await (supabase as any)
        .from('workspace_members')
        .insert({ workspace_id: ws.id, user_id: user.id, email: user.email, role: 'admin' });
      if (memErr) throw memErr;

      toast({ title: 'Espace créé !', description: `${name} est prêt.` });
      await refreshWorkspace();
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-10 shadow-sm"
      >
        <div className="mb-2 text-4xl">{sector?.emoji}</div>
        <h1 className="text-2xl font-bold">Créer votre espace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configurez votre workspace <strong>{sector?.label}</strong>
        </p>

        <form onSubmit={handleCreate} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Nom de l'entreprise</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Mon entreprise"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Création...' : 'Créer mon espace'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
