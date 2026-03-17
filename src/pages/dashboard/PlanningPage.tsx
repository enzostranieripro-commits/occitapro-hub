import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus, ChevronLeft, ChevronRight, Clock, CalendarDays } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PlanningEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  type: string;
  notes: string;
  user_id: string;
}

interface LeaveRequest {
  id: string;
  user_id: string;
  type: string;
  start_date: string;
  end_date: string;
  status: string;
  motif_refus: string;
  created_at: string;
}

const EVENT_COLORS: Record<string, string> = {
  travail: 'bg-blue-200 text-blue-900',
  reunion: 'bg-purple-200 text-purple-900',
  rdv: 'bg-green-200 text-green-900',
  livraison: 'bg-orange-200 text-orange-900',
  autre: 'bg-gray-200 text-gray-900',
};

const LEAVE_TYPES = ['Congé payé', 'RTT', 'Maladie', 'Absence', 'Autre'];

export default function PlanningPage() {
  const { workspace, userRole } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<PlanningEvent[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [loading, setLoading] = useState(true);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  // Event form
  const [evForm, setEvForm] = useState({ title: '', start_time: '', end_time: '', type: 'travail', notes: '' });
  // Leave form
  const [leaveForm, setLeaveForm] = useState({ type: 'Congé payé', start_date: '', end_date: '', notes: '' });

  const isAdmin = userRole === 'admin' || userRole === 'responsable';

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i)), [currentWeek]);

  const fetchData = async () => {
    if (!workspace) return;
    const [evRes, lvRes] = await Promise.all([
      (supabase as any).from('planning').select('*').eq('workspace_id', workspace.id),
      (supabase as any).from('leave_requests').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }),
    ]);
    if (!evRes.error) setEvents(evRes.data || []);
    if (!lvRes.error) setLeaves(lvRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [workspace]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !user) return;
    try {
      const { error } = await (supabase as any).from('planning').insert({
        workspace_id: workspace.id,
        user_id: user.id,
        ...evForm,
      });
      if (error) throw error;
      toast({ title: 'Créneau ajouté' });
      setEventDialogOpen(false);
      setEvForm({ title: '', start_time: '', end_time: '', type: 'travail', notes: '' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !user) return;
    try {
      const { error } = await (supabase as any).from('leave_requests').insert({
        workspace_id: workspace.id,
        user_id: user.id,
        type: leaveForm.type,
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
      });
      if (error) throw error;
      toast({ title: 'Demande envoyée' });
      setLeaveDialogOpen(false);
      setLeaveForm({ type: 'Congé payé', start_date: '', end_date: '', notes: '' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleLeaveAction = async (leaveId: string, status: string, motif?: string) => {
    await (supabase as any).from('leave_requests').update({ status, motif_refus: motif || null }).eq('id', leaveId);
    toast({ title: status === 'accepté' ? 'Demande acceptée' : 'Demande refusée' });
    fetchData();
  };

  const getEventsForDay = (day: Date) =>
    events.filter(ev => ev.start_time && isSameDay(parseISO(ev.start_time), day));

  const pendingLeaves = leaves.filter(l => l.status === 'en_attente');

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Planning</h2>
        <div className="flex gap-2">
          {userRole !== 'admin' && (
            <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><Clock className="mr-2 h-4 w-4" />Demande de congé</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Demande de congé / absence</DialogTitle></DialogHeader>
                <form onSubmit={handleLeaveRequest} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Type</label>
                    <Select value={leaveForm.type} onValueChange={v => setLeaveForm({ ...leaveForm, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LEAVE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Du</label>
                      <Input type="date" value={leaveForm.start_date} onChange={e => setLeaveForm({ ...leaveForm, start_date: e.target.value })} required />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Au</label>
                      <Input type="date" value={leaveForm.end_date} onChange={e => setLeaveForm({ ...leaveForm, end_date: e.target.value })} required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">Envoyer la demande</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
          {isAdmin && (
            <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Nouveau créneau</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Ajouter un créneau</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Titre *</label>
                    <Input value={evForm.title} onChange={e => setEvForm({ ...evForm, title: e.target.value })} required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Type</label>
                    <Select value={evForm.type} onValueChange={v => setEvForm({ ...evForm, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(EVENT_COLORS).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Début</label>
                      <Input type="datetime-local" value={evForm.start_time} onChange={e => setEvForm({ ...evForm, start_time: e.target.value })} required />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Fin</label>
                      <Input type="datetime-local" value={evForm.end_time} onChange={e => setEvForm({ ...evForm, end_time: e.target.value })} required />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Notes</label>
                    <Textarea value={evForm.notes} onChange={e => setEvForm({ ...evForm, notes: e.target.value })} rows={2} />
                  </div>
                  <Button type="submit" className="w-full">Créer</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Week navigation */}
      <div className="mt-6 flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {format(weekDays[0], 'd MMM', { locale: fr })} — {format(weekDays[6], 'd MMM yyyy', { locale: fr })}
        </span>
        <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
          Aujourd'hui
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="mt-4 grid grid-cols-7 gap-px rounded-2xl border border-border bg-border overflow-hidden">
        {weekDays.map(day => (
          <div key={day.toISOString()} className={`bg-card min-h-[140px] p-2 ${isSameDay(day, new Date()) ? 'bg-muted/50' : ''}`}>
            <p className={`text-xs font-medium mb-1 ${isSameDay(day, new Date()) ? 'text-primary' : 'text-muted-foreground'}`}>
              {format(day, 'EEE d', { locale: fr })}
            </p>
            <div className="space-y-1">
              {getEventsForDay(day).map(ev => (
                <div key={ev.id} className={`rounded px-1.5 py-0.5 text-[11px] font-medium truncate ${EVENT_COLORS[ev.type] || EVENT_COLORS.autre}`}>
                  {ev.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Leave requests section */}
      {isAdmin && pendingLeaves.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Demandes en attente ({pendingLeaves.length})</h3>
          <div className="space-y-3">
            {pendingLeaves.map(leave => (
              <div key={leave.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div>
                  <p className="font-medium">{leave.type}</p>
                  <p className="text-sm text-muted-foreground">
                    Du {new Date(leave.start_date).toLocaleDateString('fr-FR')} au {new Date(leave.end_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleLeaveAction(leave.id, 'accepté')}>✅ Accepter</Button>
                  <Button size="sm" variant="outline" onClick={() => handleLeaveAction(leave.id, 'refusé')}>❌ Refuser</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All leave requests */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Historique des demandes</h3>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Période</th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-left font-medium">Date demande</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Aucune demande</td></tr>
              ) : leaves.map(l => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{l.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(l.start_date).toLocaleDateString('fr-FR')} → {new Date(l.end_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      l.status === 'accepté' ? 'bg-green-100 text-green-800' :
                      l.status === 'refusé' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>{l.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(l.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
