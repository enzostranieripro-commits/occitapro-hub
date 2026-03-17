import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSector } from '@/contexts/SectorContext';

export interface Workspace {
  id: string;
  name: string;
  sector: string;
}

interface WorkspaceContextType {
  workspace: Workspace | null;
  userRole: string | null;
  loading: boolean;
  refreshWorkspace: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspace: null,
  userRole: null,
  loading: true,
  refreshWorkspace: async () => {},
});

export const useWorkspace = () => useContext(WorkspaceContext);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { setSectorId } = useSector();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspace = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('workspace_members')
      .select('workspace_id, role, workspaces(id, name, sector)')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    if (!error && data) {
      const ws = data.workspaces as Workspace;
      setWorkspace(ws);
      setUserRole(data.role);
      if (ws.sector) setSectorId(ws.sector as any);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchWorkspace(); }, [fetchWorkspace]);

  return (
    <WorkspaceContext.Provider value={{ workspace, userRole, loading, refreshWorkspace: fetchWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
