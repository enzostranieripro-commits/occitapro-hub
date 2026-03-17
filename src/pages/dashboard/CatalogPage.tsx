import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Package, AlertTriangle, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

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

const SECTOR_LABELS: Record<string, { title: string; itemLabel: string; categories: string[] }> = {
  restauration: { title: 'Menu & Carte', itemLabel: 'Plat / Boisson', categories: ['Entrées', 'Plats', 'Desserts', 'Boissons', 'Menus'] },
  btp: { title: 'Prestations & Matériaux', itemLabel: 'Prestation', categories: ['Main d\'œuvre', 'Matériaux', 'Location', 'Sous-traitance'] },
  transport: { title: 'Prestations & Tarifs', itemLabel: 'Prestation', categories: ['Livraison', 'Transport', 'Stockage', 'Manutention'] },
  commerce: { title: 'Catalogue Produits', itemLabel: 'Produit', categories: ['Alimentaire', 'Textile', 'Électronique', 'Maison', 'Autre'] },
  sante: { title: 'Soins & Produits', itemLabel: 'Soin / Produit', categories: ['Soins visage', 'Soins corps', 'Massages', 'Produits', 'Forfaits'] },
  immobilier: { title: 'Catalogue Biens', itemLabel: 'Bien', categories: ['Appartement', 'Maison', 'Terrain', 'Local commercial', 'Bureau'] },
  tourisme: { title: 'Activités & Séjours', itemLabel: 'Activité', categories: ['Excursions', 'Séjours', 'Activités', 'Transferts'] },
  hotellerie: { title: 'Chambres & Services', itemLabel: 'Chambre / Service', categories: ['Chambre simple', 'Chambre double', 'Suite', 'Service', 'Restaurant'] },
};

const emptyItem = { name: '', description: '', price: 0, vat_rate: 20, unit: 'unité', category: '', stock_qty: 0, stock_alert: 5, is_active: true };

export default function CatalogPage() {
  const { workspace } = useWorkspace();
  const { toast } = useToast();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState(emptyItem);

  const labels = SECTOR_LABELS[workspace?.sector || 'btp'] || SECTOR_LABELS.btp;

  const fetchItems = async () => {
    if (!workspace) return;
    const { data, error } = await (supabase as any)
      .from('catalog').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false });
    if (!error) setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [workspace]);

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
      setDialogOpen(false); setEditing(null); setForm(emptyItem); fetchItems();
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
    setForm({ name: item.name || '', description: item.description || '', price: item.price || 0, vat_rate: item.vat_rate || 20, unit: item.unit || 'unité', category: item.category || '', stock_qty: item.stock_qty || 0, stock_alert: item.stock_alert || 5, is_active: item.is_active });
    setDialogOpen(true);
  };

  const filtered = items.filter(i => {
    const matchSearch = !search || i.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || i.category === catFilter;
    return matchSearch && matchCat;
  });

  const stockColor = (qty: number, alert: number) => {
    if (qty <= 0) return 'bg-red-100 text-red-800';
    if (qty <= alert) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{labels.title}</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} élément{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditing(null); setForm(emptyItem); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Ajouter</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? 'Modifier' : `Nouveau ${labels.itemLabel}`}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Nom *</label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Catégorie</label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>{labels.categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Prix HT (€)</label>
                  <Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">TVA (%)</label>
                  <Input type="number" step="0.1" value={form.vat_rate} onChange={e => setForm({ ...form, vat_rate: parseFloat(e.target.value) || 20 })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Stock</label>
                  <Input type="number" value={form.stock_qty} onChange={e => setForm({ ...form, stock_qty: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Seuil d'alerte</label>
                  <Input type="number" value={form.stock_alert} onChange={e => setForm({ ...form, stock_alert: parseInt(e.target.value) || 5 })} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <Button type="submit" className="w-full">{editing ? 'Enregistrer' : 'Ajouter'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {labels.categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="col-span-full text-center text-muted-foreground py-8">Chargement...</p>
        ) : filtered.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground py-8">Aucun élément</p>
        ) : filtered.map(item => (
          <div key={item.id} className={`rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md ${!item.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <Package className="h-5 w-5 text-muted-foreground" />
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
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${stockColor(item.stock_qty, item.stock_alert)}`}>
                {item.stock_qty <= item.stock_alert && <AlertTriangle className="h-3 w-3" />}
                Stock: {item.stock_qty}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
