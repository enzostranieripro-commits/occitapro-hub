import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  CalendarDays,
  MessageSquare,
  Bot,
  Settings,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useSector } from '@/contexts/SectorContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Clients', url: '/dashboard/clients', icon: Users },
  { title: 'Documents', url: '/dashboard/documents', icon: FileText },
  { title: 'Catalogue', url: '/dashboard/catalog', icon: Package },
  { title: 'Planning', url: '/dashboard/planning', icon: CalendarDays },
  { title: 'Messagerie', url: '/dashboard/messages', icon: MessageSquare },
  { title: 'Assistant IA', url: '/dashboard/ai', icon: Bot },
  { title: 'Paramètres', url: '/dashboard/settings', icon: Settings },
];

interface Props {
  workspace: { name: string; sector: string };
}

export function DashboardSidebar({ workspace }: Props) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { sector } = useSector();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Brand */}
        <div className="flex items-center gap-2 px-4 py-4">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: sector?.primaryColor || 'hsl(var(--primary))' }}
          >
            <span className="text-xs font-bold text-primary-foreground">OP</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{workspace.name}</p>
              <p className="truncate text-xs text-muted-foreground">{sector?.label}</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
