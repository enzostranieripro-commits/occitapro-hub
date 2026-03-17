import { Bell, Mail, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSector } from '@/contexts/SectorContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface Props {
  workspace: { name: string; sector: string };
}

export function DashboardHeader({ workspace }: Props) {
  const { user, signOut } = useAuth();
  const { sector } = useSector();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <div
          className="hidden h-5 rounded-full px-2.5 text-[11px] font-medium leading-5 sm:block"
          style={{
            backgroundColor: sector?.primaryColor + '18',
            color: sector?.primaryColor,
          }}
        >
          {sector?.label}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <Mail className="h-4 w-4" />
        </Button>
        <div className="ml-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <span className="hidden text-sm sm:block">{user?.email}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
