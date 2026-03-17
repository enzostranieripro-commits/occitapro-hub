import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText, Download, ArrowRightLeft, Trash2, Search, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SECTOR_DOCUMENTS, SectorId } from '@/lib/sectorConfigs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DocLine {
  description: string;
  qty: number;
  unit_price: number;
  vat_rate: number;
}

interface Document {
  id: string;
  type: string;
  number: string;
  status: string;
  total_ht: number;
  total_ttc: number;
  lines: DocLine[];
  client_id: string;
  due_date: string;
  created_at: string;
}

interface Client { id: string; name: string; email: string; }

const emptyLine: DocLine = { description: '', qty: 1, unit_price: 0, vat_rate: 20 };

export default function DocumentsPage() {
  const { workspace } = useWorkspace();
  const { toast } = useToast();
  const [docs, setDocs] = useState<Document[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [docType, setDocType] = useState('');
  const [clientId, setClientId] = useState('');
  const [lines, setLines] = useState<DocLine[]>([{ ...emptyLine }]);
  const [dueDate, setDueDate] = useState('');

  const sectorId = (workspace?.sector || 'btp') as SectorId;
  const sectorDocs = SECTOR_DOCUMENTS[sectorId] || SECTOR_DOCUMENTS.btp;

  const fetchData = async () => {
    if (!workspace) return;
    const [docsRes, clientsRes, catRes] = await Promise.all([
      (supabase as any).from('documents').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }),
      (supabase as any).from('clients').select('id, name, email').eq('workspace_id', workspace.id),
      (supabase as any).from('catalog').select('*').eq('workspace_id', workspace.id).eq('is_active', true),
    ]);
    if (!docsRes.error) setDocs(docsRes.data || []);
    if (!clientsRes.error) setClients(clientsRes.data || []);
    if (!catRes.error) setCatalogItems(catRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [workspace]);

  const totals = useMemo(() => {
    const ht = lines.reduce((sum, l) => sum + l.qty * l.unit_price, 0);
    const ttc = lines.reduce((sum, l) => sum + l.qty * l.unit_price * (1 + l.vat_rate / 100), 0);
    return { ht, ttc };
  }, [lines]);

  const generateNumber = (type: string) => {
    const prefix = type.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${date}-${rand}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;
    try {
      const { error } = await (supabase as any).from('documents').insert({
        workspace_id: workspace.id, type: docType,
        number: generateNumber(docType), client_id: clientId || null,
        lines, total_ht: totals.ht, total_ttc: totals.ttc,
        status: sectorDocs.statuses[0]?.value || 'brouillon',
        due_date: dueDate || null,
      });
      if (error) throw error;
      toast({ title: 'Document créé' });
      setDialogOpen(false); setLines([{ ...emptyLine }]); setDocType(''); setClientId(''); setDueDate('');
      fetchData();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const updateStatus = async (docId: string, status: string) => {
    await (supabase as any).from('documents').update({ status }).eq('id', docId);
    fetchData();
  };

  const convertToInvoice = async (doc: Document) => {
    try {
      const invoiceType = sectorDocs.types.find(t => t.value.toLowerCase().includes('facture'))?.value || 'Facture';
      const { error } = await (supabase as any).from('documents').insert({
        workspace_id: workspace!.id, type: invoiceType,
        number: generateNumber(invoiceType), client_id: doc.client_id,
        lines: doc.lines, total_ht: doc.total_ht, total_ttc: doc.total_ttc,
        status: 'envoyé',
      });
      if (error) throw error;
      await (supabase as any).from('documents').update({ status: 'accepté' }).eq('id', doc.id);
      toast({ title: 'Facture créée' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const exportPDF = (doc: Document) => {
    const pdf = new jsPDF();
    const client = clients.find(c => c.id === doc.client_id);
    pdf.setFontSize(20);
    pdf.text(workspace?.name || 'OccitaPro', 14, 22);
    pdf.setFontSize(12);
    pdf.text(`${doc.type} N° ${doc.number}`, 14, 32);
    pdf.setFontSize(10);
    pdf.text(`Date: ${new Date(doc.created_at).toLocaleDateString('fr-FR')}`, 14, 40);
    if (doc.due_date) pdf.text(`Échéance: ${new Date(doc.due_date).toLocaleDateString('fr-FR')}`, 14, 46);
    if (client) { pdf.text(`Client: ${client.name}`, 130, 32); if (client.email) pdf.text(client.email, 130, 38); }
    const docLines = (doc.lines || []) as DocLine[];
    autoTable(pdf, {
      startY: 55,
      head: [['Description', 'Qté', 'Prix HT', 'TVA', 'Total HT']],
      body: docLines.map(l => [l.description, l.qty, `${l.unit_price.toFixed(2)} €`, `${l.vat_rate}%`, `${(l.qty * l.unit_price).toFixed(2)} €`]),
      foot: [['', '', '', 'Total HT', `${doc.total_ht?.toFixed(2)} €`], ['', '', '', 'Total TTC', `${doc.total_ttc?.toFixed(2)} €`]],
      theme: 'striped',
    });
    pdf.save(`${doc.type}-${doc.number}.pdf`);
  };

  const addLineFromCatalog = (catItem: any) => {
    setLines(prev => [...prev, { description: catItem.name, qty: 1, unit_price: catItem.price || 0, vat_rate: catItem.vat_rate || 20 }]);
  };

  const getStatusConfig = (status: string) =>
    sectorDocs.statuses.find(s => s.value === status) || { value: status, label: status, color: 'bg-gray-100 text-gray-700' };

  const filtered = docs.filter(d => {
    const matchSearch = !search || d.number?.toLowerCase().includes(search.toLowerCase()) || d.type?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{sectorDocs.title}</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nouveau document</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Créer un document — {sectorDocs.title}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Type *</label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger><SelectValue placeholder="Type de document" /></SelectTrigger>
                    <SelectContent>
                      {sectorDocs.types.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          <span className="flex items-center gap-2">{t.icon && <span>{t.icon}</span>}{t.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Client</label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Échéance</label>
                  <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>

              {catalogItems.length > 0 && (
                <div>
                  <label className="mb-1 block text-sm font-medium">Depuis le catalogue</label>
                  <div className="flex flex-wrap gap-2">
                    {catalogItems.slice(0, 8).map(ci => (
                      <Button key={ci.id} type="button" variant="outline" size="sm" onClick={() => addLineFromCatalog(ci)}>
                        + {ci.name} ({ci.price}€)
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">Lignes</label>
                {lines.map((line, i) => (
                  <div key={i} className="mb-2 grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5"><Input placeholder="Description" value={line.description} onChange={e => { const nl = [...lines]; nl[i].description = e.target.value; setLines(nl); }} /></div>
                    <div className="col-span-2"><Input type="number" placeholder="Qté" value={line.qty} onChange={e => { const nl = [...lines]; nl[i].qty = parseFloat(e.target.value) || 0; setLines(nl); }} /></div>
                    <div className="col-span-2"><Input type="number" step="0.01" placeholder="Prix HT" value={line.unit_price} onChange={e => { const nl = [...lines]; nl[i].unit_price = parseFloat(e.target.value) || 0; setLines(nl); }} /></div>
                    <div className="col-span-2"><Input type="number" placeholder="TVA%" value={line.vat_rate} onChange={e => { const nl = [...lines]; nl[i].vat_rate = parseFloat(e.target.value) || 20; setLines(nl); }} /></div>
                    <div className="col-span-1"><Button type="button" variant="ghost" size="icon" onClick={() => setLines(lines.filter((_, idx) => idx !== i))} disabled={lines.length <= 1}><Trash2 className="h-4 w-4" /></Button></div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setLines([...lines, { ...emptyLine }])}><Plus className="mr-1 h-3 w-3" />Ligne</Button>
              </div>

              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="flex justify-between"><span>Total HT</span><span className="font-semibold">{totals.ht.toFixed(2)} €</span></div>
                <div className="flex justify-between mt-1"><span>Total TTC</span><span className="font-bold text-lg">{totals.ttc.toFixed(2)} €</span></div>
              </div>
              <Button type="submit" className="w-full" disabled={!docType}>Créer le document</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Type description chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {sectorDocs.types.slice(0, 5).map(t => (
          <span key={t.value} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {t.icon && <span>{t.icon}</span>}{t.label}
          </span>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {sectorDocs.types.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">N°</th>
              <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Client</th>
              <th className="px-4 py-3 text-right font-medium">Montant TTC</th>
              <th className="px-4 py-3 text-left font-medium">Statut</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Aucun document</td></tr>
            ) : filtered.map(doc => {
              const statusConf = getStatusConfig(doc.status);
              const isDevis = doc.type?.toLowerCase().includes('devis') || doc.type?.toLowerCase().includes('offre') || doc.type?.toLowerCase().includes('proposition');
              return (
                <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{doc.type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{doc.number}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">{clients.find(c => c.id === doc.client_id)?.name || '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{doc.total_ttc?.toFixed(2)} €</td>
                  <td className="px-4 py-3">
                    <Select value={doc.status} onValueChange={v => updateStatus(doc.id, v)}>
                      <SelectTrigger className="h-7 w-[130px] text-xs border-0 bg-transparent p-0">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConf.color}`}>
                          {statusConf.label}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {sectorDocs.statuses.map(s => (
                          <SelectItem key={s.value} value={s.value}>
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${s.color}`}>{s.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Télécharger PDF" onClick={() => exportPDF(doc)}><Download className="h-4 w-4" /></Button>
                      {isDevis && doc.status !== 'accepté' && (
                        <Button variant="ghost" size="icon" title="Convertir en facture" onClick={() => convertToInvoice(doc)}><ArrowRightLeft className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
