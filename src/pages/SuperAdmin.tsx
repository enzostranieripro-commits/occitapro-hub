import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Shield, Users, Building2, Trash2, Ban, ArrowLeft, RefreshCw, LogOut } from 'lucide-react';

const SESSION_KEY = 'occitapro_admin_session';

interface Workspace {
  id: string;
  name: string;
  sector: string;
  is_active: boolean;
  created_at: string;
  email_pro: string;
}

export default function SuperAdminPage() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session === 'granted') {
      setAuthorized(true);
      fetchData();
    } else {
      setAuthorized(false);
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setWorkspaces(data || []);
    setLoading(false);
  };

  const handleToggleActive = async (ws: Workspace) => {
    await (supabase as any).from('workspaces').update({ is_active: !ws.is_active }).eq('id', ws.id);
    fetchData();
  };

  const handleDelete = async (wsId: string, wsName: string) => {
    if (!confirm(`Supprimer définitivement "${wsName}" ?`)) return;
    await (supabase as any).from('workspaces').delete().eq('id', wsId);
    fetchData();
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    navigate('/');
  };

  const SECTORS: Record<string, string> = {
    restauration: '🍽️ Restauration',
    btp: '🏗️ BTP',
    transport: '🚛 Transport',
    commerce: '🛒 Commerce',
    sante: '💆 Santé',
    immobilier: '🏡 Immobilier',
    tourisme: '🌿 Tourisme',
    hotellerie: '🏨 Hôtellerie',
  };

  if (authorized === false) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-16 w-16 text-destructive opacity-50" />
          <h1 className="text-2xl font-bold">Accès refusé</h1>
          <p className="mt-2 text-muted-foreground">Vous devez vous connecter via le Back Office.</p>
          <Button className="mt-6" onClick={() => navigate('/')}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  if (authorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-destructive" />
            <h1 className="text-xl font-bold">Back Office — Super Admin</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" />Actualiser
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-3.5 w-3.5" />Accueil
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive hover:text-destructive">
              <LogOut className="mr-2 h-3.5 w-3.5" />Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total workspaces</span>
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <p className="mt-2 text-3xl font-bold">{workspaces.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Actifs</span>
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <p className="mt-2 text-3xl font-bold">{workspaces.filter(w => w.is_active).length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Suspendus</span>
              <Ban className="h-5 w-5 text-destructive" />
            </div>
            <p className="mt-2 text-3xl font-bold">{workspaces.filter(w => !w.is_active).length}</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Nom</th>
                <th className="px-4 py-3 text-left font-medium">Secteur</th>
                <th className="px-4 py-3 text-left font-medium">Créé le</th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Chargement...</td></tr>
              ) : workspaces.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Aucun workspace</td></tr>
              ) : workspaces.map(ws => (
                <tr key={ws.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{ws.name}</td>
                  <td className="px-4 py-3">{SECTORS[ws.sector] || ws.sector}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(ws.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ws.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {ws.is_active ? 'Actif' : 'Suspendu'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleToggleActive(ws)} title={ws.is_active ? 'Suspendre' : 'Réactiver'}>
                        <Ban className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(ws.id, ws.name)} title="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
