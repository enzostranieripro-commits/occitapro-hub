import { TrendingUp, Users, FileText, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const KPI_MAP: Record<string, { label: string; value: string; icon: any; change: string }[]> = {
  restauration: [
    { label: 'Couverts du jour', value: '47', icon: Users, change: '+12%' },
    { label: 'Réservations', value: '8', icon: FileText, change: '+3' },
    { label: 'Alertes stock', value: '2', icon: AlertTriangle, change: 'Urgent' },
    { label: 'CA du mois', value: '12 450€', icon: TrendingUp, change: '+8%' },
  ],
  btp: [
    { label: 'Devis en attente', value: '5', icon: FileText, change: '32 000€' },
    { label: 'Chantiers actifs', value: '3', icon: TrendingUp, change: 'En cours' },
    { label: 'CA du mois', value: '45 200€', icon: TrendingUp, change: '+15%' },
    { label: 'Relances à envoyer', value: '4', icon: AlertTriangle, change: 'J+3' },
  ],
  transport: [
    { label: 'Livraisons du jour', value: '12', icon: FileText, change: '3 restantes' },
    { label: 'Retards', value: '1', icon: AlertTriangle, change: '-30min' },
    { label: 'Véhicules dispo', value: '6/8', icon: TrendingUp, change: '75%' },
    { label: 'CA du mois', value: '28 800€', icon: TrendingUp, change: '+5%' },
  ],
  commerce: [
    { label: 'CA du jour', value: '1 230€', icon: TrendingUp, change: '+22%' },
    { label: 'Ruptures stock', value: '3', icon: AlertTriangle, change: 'Urgent' },
    { label: 'Clients actifs', value: '156', icon: Users, change: '+8' },
    { label: 'Commandes', value: '4', icon: FileText, change: 'En attente' },
  ],
  sante: [
    { label: 'RDV du jour', value: '9', icon: Users, change: '2 libres' },
    { label: 'Paiements en attente', value: '3', icon: FileText, change: '420€' },
    { label: 'Relances client', value: '7', icon: AlertTriangle, change: '60j+' },
    { label: 'CA du mois', value: '8 900€', icon: TrendingUp, change: '+11%' },
  ],
  immobilier: [
    { label: 'Prospects actifs', value: '23', icon: Users, change: '+5' },
    { label: 'Visites du jour', value: '4', icon: FileText, change: '2 confirmées' },
    { label: 'Dossiers bloqués', value: '2', icon: AlertTriangle, change: 'Action req.' },
    { label: 'Biens disponibles', value: '18', icon: TrendingUp, change: '3 nouveaux' },
  ],
  tourisme: [
    { label: 'Réservations', value: '6', icon: FileText, change: 'Aujourd\'hui' },
    { label: 'Capacité restante', value: '34%', icon: TrendingUp, change: '12 places' },
    { label: 'Guides dispo', value: '3/5', icon: Users, change: '60%' },
    { label: 'Avis à traiter', value: '5', icon: AlertTriangle, change: 'Nouveaux' },
  ],
  hotellerie: [
    { label: 'Check-ins', value: '8', icon: Users, change: 'Aujourd\'hui' },
    { label: 'Check-outs', value: '5', icon: FileText, change: '3 restants' },
    { label: 'Taux occupation', value: '78%', icon: TrendingUp, change: '+6%' },
    { label: 'Ménages', value: '4', icon: AlertTriangle, change: 'À planifier' },
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
            className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{kpi.label}</span>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold">{kpi.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{kpi.change}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
