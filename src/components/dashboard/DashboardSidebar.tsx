import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  CalendarDays,
  MessageSquare,
  Bot,
  Settings,
  Sparkles,
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
  { title: 'Assistant IA', url: '/dashboard/ai', icon: Bot, highlight: true },
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
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md"
            style={{ backgroundColor: sector?.primaryColor || 'hsl(var(--primary))' }}
          >
            <span className="text-xs font-bold text-primary-foreground">OP</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{workspace.name}</p>
              <p className="truncate text-[11px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {sector?.label}
              </p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
                      className={`hover:bg-muted/50 transition-colors ${
                        (item as any).highlight ? 'text-primary font-medium' : ''
                      }`}
                      activeClassName="bg-primary/10 text-primary font-semibold shadow-sm"
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
