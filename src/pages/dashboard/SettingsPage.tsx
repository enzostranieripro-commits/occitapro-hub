import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Settings, Building2, Users2, Shield, UserPlus,
  Crown, Trash2, Mail, Globe, Activity,
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Member {
  id: string;
  user_id: string;
  email: string;
  role: string;
  joined_at: string;
}

interface ActivityLog {
  id: string;
  action: string;
  details: any;
  user_id: string;
  created_at: string;
}

export default function SettingsPage() {
  const { workspace, userRole } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = userRole === 'admin';

  const [members, setMembers] = useState<Member[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [wsName, setWsName] = useState('');
  const [wsEmail, setWsEmail] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('salarie');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!workspace) return;
    const [membersRes, logsRes, wsRes] = await Promise.all([
      (supabase as any).from('workspace_members').select('*').eq('workspace_id', workspace.id).order('joined_at'),
      (supabase as any).from('activity_logs').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(50),
      (supabase as any).from('workspaces').select('*').eq('id', workspace.id).single(),
    ]);
    if (!membersRes.error) setMembers(membersRes.data || []);
    if (!logsRes.error) setLogs(logsRes.data || []);
    if (!wsRes.error && wsRes.data) {
      setWsName(wsRes.data.name || '');
      setWsEmail(wsRes.data.email_pro || '');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [workspace]);

  const handleUpdateWorkspace = async () => {
    if (!workspace) return;
    const { error } = await (supabase as any).from('workspaces')
      .update({ name: wsName, email_pro: wsEmail })
      .eq('id', workspace.id);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else toast({ title: 'Paramètres sauvegardés' });
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !user) return;
    // For now, create a placeholder member entry
    const { error } = await (supabase as any).from('workspace_members').insert({
      workspace_id: workspace.id,
      user_id: user.id, // placeholder
      email: inviteEmail,
      role: inviteRole,
    });
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Membre invité', description: `${inviteEmail} ajouté en tant que ${inviteRole}` });
      setInviteDialogOpen(false);
      setInviteEmail('');
      fetchData();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await (supabase as any).from('workspace_members').delete().eq('id', memberId);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Membre supprimé' }); fetchData(); }
  };

  const handleUpdateRole = async (memberId: string, role: string) => {
    const { error } = await (supabase as any).from('workspace_members').update({ role }).eq('id', memberId);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Rôle modifié' }); fetchData(); }
  };

  const roleIcon = (role: string) => {
    if (role === 'admin') return <Crown className="h-3.5 w-3.5 text-amber-500" />;
    if (role === 'responsable') return <Shield className="h-3.5 w-3.5 text-blue-500" />;
    return <Users2 className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-amber-100 text-amber-800',
      responsable: 'bg-blue-100 text-blue-800',
      salarie: 'bg-muted text-muted-foreground',
    };
    return colors[role] || colors.salarie;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shadow-sm">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Paramètres</h2>
          <p className="text-sm text-muted-foreground">Gérez votre espace de travail</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/60 shadow-sm">
          <TabsTrigger value="general" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Général
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5">
            <Users2 className="h-3.5 w-3.5" />
            Équipe
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="activity" className="gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Activité
            </TabsTrigger>
          )}
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <div className="max-w-lg space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nom de l'entreprise</label>
              <Input value={wsName} onChange={e => setWsName(e.target.value)} disabled={!isAdmin} />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <Mail className="h-3.5 w-3.5" />Email professionnel
              </label>
              <Input type="email" value={wsEmail} onChange={e => setWsEmail(e.target.value)} disabled={!isAdmin} placeholder="contact@entreprise.fr" />
            </div>
            {isAdmin && (
              <Button onClick={handleUpdateWorkspace} className="gap-2 shadow-md">
                <Globe className="h-4 w-4" />
                Sauvegarder
              </Button>
            )}
          </div>
        </TabsContent>

        {/* Members */}
        <TabsContent value="members">
          <div className="space-y-4">
            {isAdmin && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-md">
                    <UserPlus className="h-4 w-4" />
                    Inviter un membre
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Inviter un membre</DialogTitle></DialogHeader>
                  <form onSubmit={handleInvite} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Email</label>
                      <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Rôle</label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="salarie">Salarié</SelectItem>
                          <SelectItem value="responsable">Responsable</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full">Inviter</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Membre</th>
                    <th className="px-4 py-3 text-left font-medium">Rôle</th>
                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Rejoint le</th>
                    {isAdmin && <th className="px-4 py-3 text-right font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground shadow-sm">
                            {m.email?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{m.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isAdmin && m.user_id !== user?.id ? (
                          <Select value={m.role} onValueChange={v => handleUpdateRole(m.id, v)}>
                            <SelectTrigger className="h-7 w-[130px]">
                              <div className="flex items-center gap-1.5">
                                {roleIcon(m.role)}
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="salarie">Salarié</SelectItem>
                              <SelectItem value="responsable">Responsable</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge(m.role)}`}>
                            {roleIcon(m.role)}
                            {m.role}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {m.joined_at ? new Date(m.joined_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          {m.user_id !== user?.id && (
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(m.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Activity */}
        {isAdmin && (
          <TabsContent value="activity">
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Action</th>
                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Détails</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Aucune activité enregistrée</td></tr>
                  ) : logs.map(log => (
                    <tr key={log.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{log.action}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">
                        {log.details ? JSON.stringify(log.details).slice(0, 80) : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(log.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  );
}
