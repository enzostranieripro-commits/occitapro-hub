import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Settings, Building2, Users2, Shield, UserPlus,
  Crown, Trash2, Mail, Globe, Activity,
  FileCheck, AlertCircle, Info,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

interface LegalInfo {
  siret: string;
  rcs: string;
  tva_intra: string;
  forme_juridique: string;
  capital: string;
  adresse: string;
  code_postal: string;
  ville: string;
  telephone: string;
  email_facturation: string;
  mentions_legales: string;
  iban: string;
  banque: string;
}

const emptyLegal: LegalInfo = {
  siret: '', rcs: '', tva_intra: '', forme_juridique: 'SAS', capital: '',
  adresse: '', code_postal: '', ville: '', telephone: '', email_facturation: '',
  mentions_legales: '', iban: '', banque: '',
};

const FORMES_JURIDIQUES = ['Auto-entrepreneur', 'EURL', 'SARL', 'SAS', 'SASU', 'SA', 'SNC', 'Autre'];

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
  const [legalInfo, setLegalInfo] = useState<LegalInfo>(emptyLegal);
  const [legalLoading, setLegalLoading] = useState(false);
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
      // Load legal info from workspace if stored
      if (wsRes.data.legal_info) {
        try { setLegalInfo({ ...emptyLegal, ...JSON.parse(wsRes.data.legal_info) }); } catch {}
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [workspace]);

  const handleUpdateWorkspace = async () => {
    if (!workspace) return;
    const { error } = await (supabase as any).from('workspaces').update({ name: wsName, email_pro: wsEmail }).eq('id', workspace.id);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else toast({ title: 'Paramètres sauvegardés' });
  };

  const handleSaveLegal = async () => {
    if (!workspace) return;
    setLegalLoading(true);
    // Store legal info as JSON in email_pro field or a dedicated column
    // We'll use a workaround via email_pro since we don't have a dedicated column
    // In a real scenario, you'd add a legal_info jsonb column
    const { error } = await (supabase as any).from('workspaces')
      .update({ email_pro: wsEmail || legalInfo.email_facturation })
      .eq('id', workspace.id);
    // Save to localStorage as workaround (in real app: DB column)
    localStorage.setItem(`legal_${workspace.id}`, JSON.stringify(legalInfo));
    setLegalLoading(false);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else toast({ title: '✅ Informations légales sauvegardées', description: 'Elles seront pré-remplies dans vos documents' });
  };

  useEffect(() => {
    if (workspace?.id) {
      const saved = localStorage.getItem(`legal_${workspace.id}`);
      if (saved) { try { setLegalInfo({ ...emptyLegal, ...JSON.parse(saved) }); } catch {} }
    }
  }, [workspace?.id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !user) return;
    // Check: only 1 admin allowed
    if (inviteRole === 'admin') {
      const adminCount = members.filter(m => m.role === 'admin').length;
      if (adminCount >= 1) {
        toast({ title: 'Un seul admin autorisé', description: 'Un workspace ne peut avoir qu\'un seul administrateur.', variant: 'destructive' });
        return;
      }
    }
    const { error } = await (supabase as any).from('workspace_members').insert({
      workspace_id: workspace.id, user_id: user.id, email: inviteEmail, role: inviteRole,
    });
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Membre invité', description: `${inviteEmail} ajouté en tant que ${inviteRole}` });
      setInviteDialogOpen(false); setInviteEmail(''); fetchData();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await (supabase as any).from('workspace_members').delete().eq('id', memberId);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Membre supprimé' }); fetchData(); }
  };

  const handleUpdateRole = async (memberId: string, role: string) => {
    // Check: only 1 admin
    if (role === 'admin') {
      const adminCount = members.filter(m => m.role === 'admin' && m.id !== memberId).length;
      if (adminCount >= 1) {
        toast({ title: 'Un seul admin autorisé', description: 'Retirez d\'abord le rôle admin de l\'autre utilisateur.', variant: 'destructive' });
        return;
      }
    }
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

  const adminCount = members.filter(m => m.role === 'admin').length;

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
        <TabsList className="bg-muted/60 shadow-sm flex-wrap h-auto">
          <TabsTrigger value="general" className="gap-1.5"><Building2 className="h-3.5 w-3.5" />Général</TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5"><Users2 className="h-3.5 w-3.5" />Équipe</TabsTrigger>
          <TabsTrigger value="legal" className="gap-1.5"><FileCheck className="h-3.5 w-3.5" />Mentions légales</TabsTrigger>
          {isAdmin && <TabsTrigger value="activity" className="gap-1.5"><Activity className="h-3.5 w-3.5" />Activité</TabsTrigger>}
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
                <Globe className="h-4 w-4" />Sauvegarder
              </Button>
            )}
          </div>
        </TabsContent>

        {/* Members */}
        <TabsContent value="members">
          <div className="space-y-4">
            {/* Role info banner */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Gestion des rôles</p>
                <p className="mt-0.5">Un seul <strong>Admin</strong> par workspace. Les <strong>Responsables</strong> peuvent gérer le planning et les documents. Les <strong>Salariés</strong> ont accès en lecture et messagerie.</p>
              </div>
            </div>

            {isAdmin && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-md"><UserPlus className="h-4 w-4" />Inviter un membre</Button>
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
                          <SelectItem value="salarie">👤 Salarié</SelectItem>
                          <SelectItem value="responsable">🛡️ Responsable</SelectItem>
                          <SelectItem value="admin" disabled={adminCount >= 1}>
                            👑 Admin {adminCount >= 1 ? '(déjà attribué)' : ''}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {adminCount >= 1 && inviteRole === 'admin' && (
                        <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />Un seul admin autorisé par workspace
                        </p>
                      )}
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
                  {members.map(m => {
                    const isMe = m.user_id === user?.id;
                    const isCurrentAdmin = m.role === 'admin';
                    return (
                      <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                              {m.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-medium">{m.email}</span>
                              {isMe && <span className="ml-2 text-xs text-muted-foreground">(vous)</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isAdmin && !isMe ? (
                            <Select value={m.role} onValueChange={v => handleUpdateRole(m.id, v)}>
                              <SelectTrigger className="h-7 w-[140px]">
                                <div className="flex items-center gap-1.5">
                                  {roleIcon(m.role)}<SelectValue />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="salarie">👤 Salarié</SelectItem>
                                <SelectItem value="responsable">🛡️ Responsable</SelectItem>
                                <SelectItem value="admin" disabled={adminCount >= 1 && m.role !== 'admin'}>
                                  👑 Admin {adminCount >= 1 && m.role !== 'admin' ? '(déjà attribué)' : ''}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge(m.role)}`}>
                              {roleIcon(m.role)}{m.role}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {m.joined_at ? new Date(m.joined_at).toLocaleDateString('fr-FR') : '—'}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            {!isMe && !isCurrentAdmin && (
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(m.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Legal Info */}
        <TabsContent value="legal">
          <div className="max-w-2xl">
            <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 flex gap-3">
              <FileCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Mentions légales & informations entreprise</p>
                <p className="mt-0.5">Ces informations seront automatiquement pré-remplies dans vos devis, factures et documents professionnels.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Identité juridique</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Forme juridique</label>
                    <Select value={legalInfo.forme_juridique} onValueChange={v => setLegalInfo({ ...legalInfo, forme_juridique: v })} disabled={!isAdmin}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{FORMES_JURIDIQUES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Capital social (€)</label>
                    <Input value={legalInfo.capital} onChange={e => setLegalInfo({ ...legalInfo, capital: e.target.value })} placeholder="10 000" disabled={!isAdmin} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">N° SIRET</label>
                    <Input value={legalInfo.siret} onChange={e => setLegalInfo({ ...legalInfo, siret: e.target.value })} placeholder="123 456 789 00012" disabled={!isAdmin} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">N° RCS / RM</label>
                    <Input value={legalInfo.rcs} onChange={e => setLegalInfo({ ...legalInfo, rcs: e.target.value })} placeholder="RCS Toulouse B 123 456 789" disabled={!isAdmin} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">N° TVA intracommunautaire</label>
                    <Input value={legalInfo.tva_intra} onChange={e => setLegalInfo({ ...legalInfo, tva_intra: e.target.value })} placeholder="FR 12 345 678 901" disabled={!isAdmin} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Coordonnées</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Adresse</label>
                    <Input value={legalInfo.adresse} onChange={e => setLegalInfo({ ...legalInfo, adresse: e.target.value })} placeholder="15 rue du Commerce" disabled={!isAdmin} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Code postal</label>
                    <Input value={legalInfo.code_postal} onChange={e => setLegalInfo({ ...legalInfo, code_postal: e.target.value })} placeholder="31000" disabled={!isAdmin} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Ville</label>
                    <Input value={legalInfo.ville} onChange={e => setLegalInfo({ ...legalInfo, ville: e.target.value })} placeholder="Toulouse" disabled={!isAdmin} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Téléphone</label>
                    <Input value={legalInfo.telephone} onChange={e => setLegalInfo({ ...legalInfo, telephone: e.target.value })} placeholder="05 61 00 00 00" disabled={!isAdmin} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Email facturation</label>
                    <Input type="email" value={legalInfo.email_facturation} onChange={e => setLegalInfo({ ...legalInfo, email_facturation: e.target.value })} placeholder="compta@entreprise.fr" disabled={!isAdmin} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Coordonnées bancaires</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">IBAN</label>
                    <Input value={legalInfo.iban} onChange={e => setLegalInfo({ ...legalInfo, iban: e.target.value })} placeholder="FR76 3000 6000 0112 3456 7890 189" disabled={!isAdmin} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Banque</label>
                    <Input value={legalInfo.banque} onChange={e => setLegalInfo({ ...legalInfo, banque: e.target.value })} placeholder="Crédit Mutuel" disabled={!isAdmin} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Mentions légales personnalisées</h3>
                <Textarea
                  value={legalInfo.mentions_legales}
                  onChange={e => setLegalInfo({ ...legalInfo, mentions_legales: e.target.value })}
                  placeholder="Ex: Pénalités de retard : 3x le taux d'intérêt légal. Pas d'escompte pour paiement anticipé. En cas de litige, tribunal de commerce de Toulouse."
                  rows={4}
                  disabled={!isAdmin}
                />
              </div>

              {isAdmin && (
                <Button onClick={handleSaveLegal} disabled={legalLoading} className="gap-2 shadow-md">
                  <FileCheck className="h-4 w-4" />
                  {legalLoading ? 'Sauvegarde...' : 'Sauvegarder les informations légales'}
                </Button>
              )}
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
                      <td className="px-4 py-3 text-muted-foreground">{new Date(log.created_at).toLocaleDateString('fr-FR')}</td>
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
