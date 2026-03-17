import { TrendingUp, Users, FileText, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

const KPI_MAP: Record<string, { label: string; value: string; icon: any; change: string; trend: 'up' | 'down' | 'neutral' }[]> = {
  restauration: [
    { label: 'Couverts du jour', value: '47', icon: Users, change: '+12%', trend: 'up' },
    { label: 'Réservations', value: '8', icon: FileText, change: '+3', trend: 'up' },
    { label: 'Alertes stock', value: '2', icon: AlertTriangle, change: 'Urgent', trend: 'down' },
    { label: 'CA du mois', value: '12 450€', icon: TrendingUp, change: '+8%', trend: 'up' },
  ],
  btp: [
    { label: 'Devis en attente', value: '5', icon: FileText, change: '32 000€', trend: 'neutral' },
    { label: 'Chantiers actifs', value: '3', icon: TrendingUp, change: 'En cours', trend: 'up' },
    { label: 'CA du mois', value: '45 200€', icon: TrendingUp, change: '+15%', trend: 'up' },
    { label: 'Relances à envoyer', value: '4', icon: AlertTriangle, change: 'J+3', trend: 'down' },
  ],
  transport: [
    { label: 'Livraisons du jour', value: '12', icon: FileText, change: '3 restantes', trend: 'neutral' },
    { label: 'Retards', value: '1', icon: AlertTriangle, change: '-30min', trend: 'down' },
    { label: 'Véhicules dispo', value: '6/8', icon: TrendingUp, change: '75%', trend: 'up' },
    { label: 'CA du mois', value: '28 800€', icon: TrendingUp, change: '+5%', trend: 'up' },
  ],
  commerce: [
    { label: 'CA du jour', value: '1 230€', icon: TrendingUp, change: '+22%', trend: 'up' },
    { label: 'Ruptures stock', value: '3', icon: AlertTriangle, change: 'Urgent', trend: 'down' },
    { label: 'Clients actifs', value: '156', icon: Users, change: '+8', trend: 'up' },
    { label: 'Commandes', value: '4', icon: FileText, change: 'En attente', trend: 'neutral' },
  ],
  sante: [
    { label: 'RDV du jour', value: '9', icon: Users, change: '2 libres', trend: 'neutral' },
    { label: 'Paiements en attente', value: '3', icon: FileText, change: '420€', trend: 'down' },
    { label: 'Relances client', value: '7', icon: AlertTriangle, change: '60j+', trend: 'down' },
    { label: 'CA du mois', value: '8 900€', icon: TrendingUp, change: '+11%', trend: 'up' },
  ],
  immobilier: [
    { label: 'Prospects actifs', value: '23', icon: Users, change: '+5', trend: 'up' },
    { label: 'Visites du jour', value: '4', icon: FileText, change: '2 confirmées', trend: 'neutral' },
    { label: 'Dossiers bloqués', value: '2', icon: AlertTriangle, change: 'Action req.', trend: 'down' },
    { label: 'Biens disponibles', value: '18', icon: TrendingUp, change: '3 nouveaux', trend: 'up' },
  ],
  tourisme: [
    { label: 'Réservations', value: '6', icon: FileText, change: "Aujourd'hui", trend: 'up' },
    { label: 'Capacité restante', value: '34%', icon: TrendingUp, change: '12 places', trend: 'neutral' },
    { label: 'Guides dispo', value: '3/5', icon: Users, change: '60%', trend: 'neutral' },
    { label: 'Avis à traiter', value: '5', icon: AlertTriangle, change: 'Nouveaux', trend: 'down' },
  ],
  hotellerie: [
    { label: 'Check-ins', value: '8', icon: Users, change: "Aujourd'hui", trend: 'up' },
    { label: 'Check-outs', value: '5', icon: FileText, change: '3 restants', trend: 'neutral' },
    { label: 'Taux occupation', value: '78%', icon: TrendingUp, change: '+6%', trend: 'up' },
    { label: 'Ménages', value: '4', icon: AlertTriangle, change: 'À planifier', trend: 'down' },
  ],
};

interface Props {
  sectorId: string;
  workspaceId: string;
}

export function KPICards({ sectorId, workspaceId }: Props) {
  const kpis = KPI_MAP[sectorId] || KPI_MAP.btp;

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon;
        return (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{kpi.label}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold">{kpi.value}</p>
            <div className="mt-1 flex items-center gap-1">
              {kpi.trend === 'up' && <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />}
              {kpi.trend === 'down' && <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />}
              <span className={`text-xs font-medium ${
                kpi.trend === 'up' ? 'text-emerald-600' :
                kpi.trend === 'down' ? 'text-destructive' :
                'text-muted-foreground'
              }`}>{kpi.change}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
