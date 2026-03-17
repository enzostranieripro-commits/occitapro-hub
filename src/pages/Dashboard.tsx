import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useSector } from '@/contexts/SectorContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { KPICards } from '@/components/dashboard/KPICards';
import { SidebarProvider } from '@/components/ui/sidebar';

interface Workspace {
  id: string;
  name: string;
  sector: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { sectorId } = useSector();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth'); return; }
    
    // Fetch user's workspace
    (supabase as any)
      .from('workspace_members')
      .select('workspace_id, workspaces(id, name, sector)')
      .eq('user_id', user.id)
      .limit(1)
      .single()
      .then(({ data, error }: any) => {
        if (error || !data) {
          navigate('/onboarding');
          return;
        }
        const ws = (data as any).workspaces as Workspace;
        setWorkspace(ws);
      });
  }, [user, authLoading]);

  if (authLoading || !workspace) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DashboardSidebar workspace={workspace} />
        <div className="flex flex-1 flex-col">
          <DashboardHeader workspace={workspace} />
          <main className="flex-1 p-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold">
                Bonjour 👋
              </h2>
              <p className="mt-1 text-muted-foreground">
                Voici un résumé de votre activité
              </p>
              <KPICards sectorId={workspace.sector} workspaceId={workspace.id} />

              {/* Placeholder content area */}
              <div className="mt-8 grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-semibold">Activité récente</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Les graphiques et données seront disponibles dans la prochaine phase.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-semibold">Alertes</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Aucune alerte pour le moment.
                  </p>
                </div>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
