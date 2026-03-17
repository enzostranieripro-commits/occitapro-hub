import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SECTOR_PLANNING, SectorId } from '@/lib/sectorConfigs';

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
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const [evForm, setEvForm] = useState({ title: '', start_time: '', end_time: '', type: '', notes: '' });
  const [leaveForm, setLeaveForm] = useState({ type: '', start_date: '', end_date: '' });

  const sectorId = (workspace?.sector || 'btp') as SectorId;
  const config = SECTOR_PLANNING[sectorId] || SECTOR_PLANNING.btp;
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
  useEffect(() => {
    if (config.eventTypes[0]) setEvForm(f => ({ ...f, type: config.eventTypes[0].value }));
    if (config.leaveTypes[0]) setLeaveForm(f => ({ ...f, type: config.leaveTypes[0] }));
  }, [sectorId]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !user) return;
    try {
      const { error } = await (supabase as any).from('planning').insert({ workspace_id: workspace.id, user_id: user.id, ...evForm });
      if (error) throw error;
      toast({ title: 'Créneau ajouté' });
      setEventDialogOpen(false);
      setEvForm({ title: '', start_time: selectedDay ? format(selectedDay, "yyyy-MM-dd'T'08:00") : '', end_time: selectedDay ? format(selectedDay, "yyyy-MM-dd'T'09:00") : '', type: config.eventTypes[0]?.value || '', notes: '' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !user) return;
    try {
      const { error } = await (supabase as any).from('leave_requests').insert({ workspace_id: workspace.id, user_id: user.id, type: leaveForm.type, start_date: leaveForm.start_date, end_date: leaveForm.end_date });
      if (error) throw error;
      toast({ title: 'Demande envoyée' });
      setLeaveDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleLeaveAction = async (leaveId: string, status: string) => {
    await (supabase as any).from('leave_requests').update({ status }).eq('id', leaveId);
    toast({ title: status === 'accepté' ? 'Demande acceptée' : 'Demande refusée' });
    fetchData();
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!isAdmin) return;
    await (supabase as any).from('planning').delete().eq('id', eventId);
    fetchData();
  };

  const getEventsForDay = (day: Date) =>
    events.filter(ev => ev.start_time && isSameDay(parseISO(ev.start_time), day));

  const getEventStyle = (type: string) =>
    config.eventTypes.find(t => t.value === type) || { bgColor: 'bg-gray-100 text-gray-900', color: '#666', value: type, label: type };

  const pendingLeaves = leaves.filter(l => l.status === 'en_attente');

  const openEventDialog = (day?: Date) => {
    setSelectedDay(day || null);
    if (day) {
      setEvForm(f => ({
        ...f,
        start_time: format(day, "yyyy-MM-dd'T'08:00"),
        end_time: format(day, "yyyy-MM-dd'T'09:00"),
        type: config.eventTypes[0]?.value || '',
      }));
    }
    setEventDialogOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">{config.title}</h2>
          <p className="text-sm text-muted-foreground">{config.features.join(' · ')}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Clock className="mr-2 h-4 w-4" />Demande absence</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Demande de congé / absence</DialogTitle></DialogHeader>
              <form onSubmit={handleLeaveRequest} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Type</label>
                  <Select value={leaveForm.type} onValueChange={v => setLeaveForm({ ...leaveForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{config.leaveTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
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

          {isAdmin && (
            <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openEventDialog()}><Plus className="mr-2 h-4 w-4" />Nouveau créneau</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Ajouter un créneau — {config.title}</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Titre *</label>
                    <Input value={evForm.title} onChange={e => setEvForm({ ...evForm, title: e.target.value })} required placeholder="Ex: Réunion équipe, Service du soir..." />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Type</label>
                    <Select value={evForm.type} onValueChange={v => setEvForm({ ...evForm, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {config.eventTypes.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            <span className={`inline-block rounded px-2 py-0.5 text-xs mr-2 ${t.bgColor}`}>{t.label}</span>
                          </SelectItem>
                        ))}
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

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">Calendrier semaine</TabsTrigger>
          <TabsTrigger value="leaves">
            Congés / Absences
            {pendingLeaves.length > 0 && <span className="ml-2 rounded-full bg-destructive px-1.5 text-[10px] text-white">{pendingLeaves.length}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          {/* Week navigation */}
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium">
              {format(weekDays[0], 'd MMM', { locale: fr })} — {format(weekDays[6], 'd MMM yyyy', { locale: fr })}
            </span>
            <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Aujourd'hui</Button>
          </div>

          {/* Calendar */}
          <div className="grid grid-cols-7 gap-px rounded-2xl border border-border bg-border overflow-hidden shadow-sm">
            {weekDays.map(day => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`bg-card min-h-[160px] p-2 ${isToday ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-xs font-semibold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      {format(day, 'EEE', { locale: fr })}
                      <span className={`ml-1 ${isToday ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[10px]' : ''}`}>
                        {format(day, 'd')}
                      </span>
                    </p>
                    {isAdmin && (
                      <button
                        onClick={() => openEventDialog(day)}
                        className="opacity-0 hover:opacity-100 group-hover:opacity-100 rounded p-0.5 hover:bg-muted text-muted-foreground transition-all"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map(ev => {
                      const style = getEventStyle(ev.type);
                      return (
                        <div
                          key={ev.id}
                          className={`rounded px-1.5 py-0.5 text-[11px] font-medium truncate cursor-pointer hover:opacity-80 transition-opacity ${style.bgColor}`}
                          title={`${ev.title}${ev.notes ? ` — ${ev.notes}` : ''}`}
                          onClick={() => isAdmin && handleDeleteEvent(ev.id)}
                        >
                          {ev.title}
                          <span className="ml-1 opacity-60 text-[9px]">
                            {ev.start_time ? format(parseISO(ev.start_time), 'HH:mm') : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-2">
            {config.eventTypes.map(t => (
              <span key={t.value} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${t.bgColor}`}>
                {t.label}
              </span>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaves" className="mt-4 space-y-4">
          {isAdmin && pendingLeaves.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-destructive">Demandes en attente ({pendingLeaves.length})</h3>
              <div className="space-y-3">
                {pendingLeaves.map(leave => (
                  <div key={leave.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div>
                      <p className="font-medium">{leave.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(leave.start_date).toLocaleDateString('fr-FR')} → {new Date(leave.end_date).toLocaleDateString('fr-FR')}
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
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
