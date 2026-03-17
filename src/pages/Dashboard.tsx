import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { KPICards } from '@/components/dashboard/KPICards';
import { SidebarProvider } from '@/components/ui/sidebar';

const ClientsPage = lazy(() => import('./dashboard/ClientsPage'));
const CatalogPage = lazy(() => import('./dashboard/CatalogPage'));
const DocumentsPage = lazy(() => import('./dashboard/DocumentsPage'));
const PlanningPage = lazy(() => import('./dashboard/PlanningPage'));

function DashboardHome({ workspace }: { workspace: { id: string; sector: string } }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <h2 className="text-2xl font-bold">Bonjour 👋</h2>
      <p className="mt-1 text-muted-foreground">Voici un résumé de votre activité</p>
      <KPICards sectorId={workspace.sector} workspaceId={workspace.id} />
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="font-semibold">Activité récente</h3>
          <p className="mt-2 text-sm text-muted-foreground">Les graphiques seront disponibles prochainement.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="font-semibold">Alertes</h3>
          <p className="mt-2 text-sm text-muted-foreground">Aucune alerte pour le moment.</p>
        </div>
      </div>
    </motion.div>
  );
}

function PageLoader() {
  return <div className="flex items-center justify-center py-20"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { workspace, loading: wsLoading } = useWorkspace();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || wsLoading) return;
    if (!user) { navigate('/auth'); return; }
    if (!workspace) { navigate('/onboarding'); return; }
  }, [user, authLoading, workspace, wsLoading]);

  if (authLoading || wsLoading || !workspace) {
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
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route index element={<DashboardHome workspace={workspace} />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="catalog" element={<CatalogPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="planning" element={<PlanningPage />} />
                <Route path="*" element={<div className="py-20 text-center text-muted-foreground">Module en cours de développement</div>} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
