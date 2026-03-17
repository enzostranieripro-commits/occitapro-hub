import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Pencil, AlertTriangle, LayoutGrid, List, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { SECTOR_CATALOG, SectorId } from '@/lib/sectorConfigs';

interface CatalogItem {
  id: string;
  name: string;
  description: string;
  price: number;
  vat_rate: number;
  unit: string;
  category: string;
  stock_qty: number;
  stock_alert: number;
  is_active: boolean;
  created_at: string;
}

export default function CatalogPage() {
  const { workspace } = useWorkspace();
  const { toast } = useToast();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [form, setForm] = useState<any>({});

  const sectorId = (workspace?.sector || 'btp') as SectorId;
  const config = SECTOR_CATALOG[sectorId] || SECTOR_CATALOG.btp;

  const buildEmptyForm = () => {
    const base: any = { name: '', description: '', price: 0, vat_rate: 20, unit: config.unitOptions?.[0] || 'unité', category: '', stock_qty: 0, stock_alert: 5, is_active: true };
    config.formFields.forEach(f => { if (!(f.key in base)) base[f.key] = f.default ?? ''; });
    return base;
  };

  const fetchItems = async () => {
    if (!workspace) return;
    const { data, error } = await (supabase as any)
      .from('catalog').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false });
    if (!error) setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [workspace]);
  useEffect(() => { if (!editing) setForm(buildEmptyForm()); }, [sectorId, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;
    try {
      if (editing) {
        const { error } = await (supabase as any).from('catalog').update(form).eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'Élément modifié' });
      } else {
        const { error } = await (supabase as any).from('catalog').insert({ ...form, workspace_id: workspace.id });
        if (error) throw error;
        toast({ title: 'Élément ajouté' });
      }
      setDialogOpen(false); setEditing(null); setForm(buildEmptyForm()); fetchItems();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const toggleActive = async (item: CatalogItem) => {
    await (supabase as any).from('catalog').update({ is_active: !item.is_active }).eq('id', item.id);
    fetchItems();
  };

  const openEdit = (item: CatalogItem) => {
    setEditing(item);
    const f: any = { name: item.name || '', description: item.description || '', price: item.price || 0, vat_rate: item.vat_rate || 20, unit: item.unit || '', category: item.category || '', stock_qty: item.stock_qty || 0, stock_alert: item.stock_alert || 5, is_active: item.is_active };
    config.formFields.forEach(field => { if (!(field.key in f)) f[field.key] = (item as any)[field.key] ?? field.default ?? ''; });
    setForm(f);
    setDialogOpen(true);
  };

  const stockColor = (qty: number, alert: number) => {
    if (!config.showStock) return '';
    if (qty <= 0) return 'bg-red-100 text-red-800';
    if (qty <= alert) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const filtered = items.filter(i => {
    const matchSearch = !search || i.name?.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || i.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{config.title}</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} élément{filtered.length !== 1 ? 's' : ''} · {config.itemLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) { setEditing(null); setForm(buildEmptyForm()); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Ajouter {config.itemLabel}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? `Modifier — ${config.itemLabel}` : `Nouveau — ${config.itemLabel}`}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Nom *</label>
                    <Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Catégorie</label>
                    <Select value={form.category || ''} onValueChange={v => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                      <SelectContent>
                        {config.categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dynamic sector-specific fields */}
                  {config.formFields.map(field => {
                    if (field.key === 'name' || field.key === 'category') return null;
                    return (
                      <div key={field.key} className={field.fullWidth ? 'col-span-2' : ''}>
                        <label className="mb-1 block text-sm font-medium">{field.label}</label>
                        {field.type === 'select' ? (
                          <Select value={String(form[field.key] ?? field.default ?? '')} onValueChange={v => setForm({ ...form, [field.key]: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{field.options?.map((o: string) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                          </Select>
                        ) : field.type === 'textarea' ? (
                          <Textarea value={form[field.key] || ''} onChange={e => setForm({ ...form, [field.key]: e.target.value })} rows={2} />
                        ) : (
                          <Input type={field.type || 'text'} step={field.step} value={form[field.key] ?? ''} onChange={e => setForm({ ...form, [field.key]: field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })} />
                        )}
                      </div>
                    );
                  })}

                  {config.unitOptions && (
                    <div>
                      <label className="mb-1 block text-sm font-medium">Unité</label>
                      <Select value={form.unit || ''} onValueChange={v => setForm({ ...form, unit: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{config.unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}

                  {config.showStock && (
                    <>
                      <div>
                        <label className="mb-1 block text-sm font-medium">Stock actuel</label>
                        <Input type="number" value={form.stock_qty || 0} onChange={e => setForm({ ...form, stock_qty: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">Seuil alerte</label>
                        <Input type="number" value={form.stock_alert || 5} onChange={e => setForm({ ...form, stock_alert: parseInt(e.target.value) || 5 })} />
                      </div>
                    </>
                  )}
                </div>
                <Button type="submit" className="w-full">{editing ? 'Enregistrer' : 'Ajouter'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder={`Rechercher ${config.itemLabel.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          <Button variant={catFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setCatFilter('all')}>Toutes</Button>
          {config.categories.map(c => (
            <Button key={c} variant={catFilter === c ? 'default' : 'outline'} size="sm" onClick={() => setCatFilter(c)}>{c}</Button>
          ))}
        </div>
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' ? (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Nom</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Catégorie</th>
                {/* Sector-specific column headers */}
                {config.tableColumns?.map(col => (
                  <th key={col.key} className={`px-4 py-3 text-left font-medium hidden md:table-cell`}>{col.label}</th>
                ))}
                <th className="px-4 py-3 text-right font-medium">Prix</th>
                {config.showStock && <th className="px-4 py-3 text-left font-medium">Stock</th>}
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Aucun élément</td></tr>
              ) : filtered.map(item => (
                <tr key={item.id} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${!item.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.name}</div>
                    {item.description && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{item.description}</div>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{item.category}</span>
                  </td>
                  {config.tableColumns?.map(col => (
                    <td key={col.key} className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                      {(item as any)[col.key] || '—'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-semibold">{item.price?.toFixed(2)} €</td>
                  {config.showStock && (
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${stockColor(item.stock_qty, item.stock_alert)}`}>
                        {item.stock_qty <= item.stock_alert && <AlertTriangle className="h-3 w-3" />}
                        {item.stock_qty}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Switch checked={item.is_active} onCheckedChange={() => toggleActive(item)} />
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="col-span-full text-center text-muted-foreground py-8">Chargement...</p>
          ) : filtered.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground py-8">Aucun élément</p>
          ) : filtered.map(item => (
            <div key={item.id} className={`rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow ${!item.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={item.is_active} onCheckedChange={() => toggleActive(item)} />
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                </div>
              </div>
              {item.description && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold">{item.price?.toFixed(2)} €</span>
                {config.showStock && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${stockColor(item.stock_qty, item.stock_alert)}`}>
                    {item.stock_qty <= item.stock_alert && <AlertTriangle className="h-3 w-3" />}
                    Stock: {item.stock_qty}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
