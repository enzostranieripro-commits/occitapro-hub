import { useState, useEffect } from 'react';
import { Bell, Mail, LogOut, MessageSquare, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSector } from '@/contexts/SectorContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface Props {
  workspace: { name: string; sector: string; id: string };
}

export function DashboardHeader({ workspace }: Props) {
  const { user, signOut } = useAuth();
  const { sector } = useSector();
  const { userRole } = useWorkspace();
  const navigate = useNavigate();
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);

  useEffect(() => {
    if (!workspace?.id || !user) return;
    // Fetch unread notifications
    (supabase as any)
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id)
      .eq('user_id', user.id)
      .eq('is_read', false)
      .then(({ count }: any) => setUnreadNotifs(count || 0));

    // Fetch unread messages (not from me)
    (supabase as any)
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id)
      .eq('is_read', false)
      .neq('sender_id', user.id)
      .then(({ count }: any) => setUnreadMsgs(count || 0));
  }, [workspace, user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 shadow-sm">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <div
          className="hidden h-6 items-center rounded-full px-2.5 text-[11px] font-semibold leading-6 sm:flex gap-1"
          style={{
            backgroundColor: sector?.primaryColor + '18',
            color: sector?.primaryColor,
          }}
        >
          <Sparkles className="h-3 w-3" />
          {sector?.label}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => navigate('/dashboard/settings')}
        >
          <Bell className="h-4 w-4" />
          {unreadNotifs > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-sm">
              {unreadNotifs > 9 ? '9+' : unreadNotifs}
            </span>
          )}
        </Button>

        {/* Messages */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => navigate('/dashboard/messages')}
        >
          <MessageSquare className="h-4 w-4" />
          {unreadMsgs > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm">
              {unreadMsgs > 9 ? '9+' : unreadMsgs}
            </span>
          )}
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="ml-1 gap-2 px-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden text-sm font-medium sm:block max-w-[120px] truncate">{user?.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize flex items-center gap-1 mt-0.5">
                {userRole === 'admin' ? '👑' : userRole === 'responsable' ? '🛡️' : '👤'} {userRole}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
