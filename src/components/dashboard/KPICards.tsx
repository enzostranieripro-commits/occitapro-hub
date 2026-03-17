import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SECTOR_KPIS, SectorId, KPIConfig } from '@/lib/sectorConfigs';
import {
  TrendingUp, TrendingDown, Minus, X, ArrowRight,
  Utensils, Calendar, AlertTriangle, Euro,
  Hammer, FileText, Truck, ShoppingCart,
  Heart, Building, Map, Hotel, Users, Package,
  BarChart3, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ICON_MAP: Record<string, any> = {
  utensils: Utensils, calendar: Calendar, 'alert-triangle': AlertTriangle,
  'trending-up': TrendingUp, euro: Euro, hammer: Hammer,
  'file-text': FileText, truck: Truck, 'shopping-cart': ShoppingCart,
  heart: Heart, building: Building, map: Map, hotel: Hotel,
  users: Users, package: Package, 'bar-chart': BarChart3, zap: Zap,
};

function getIcon(name: string) {
  return ICON_MAP[name] || TrendingUp;
}

function KPIDetailModal({ kpi, onClose }: { kpi: KPIConfig; onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.22 }}
        className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header band */}
        <div
          className="px-6 py-5"
          style={{ backgroundColor: kpi.color + '15', borderBottom: `2px solid ${kpi.color}30` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl shadow-md"
                style={{ backgroundColor: kpi.color }}
              >
                {(() => { const Icon = getIcon(kpi.icon); return <Icon className="h-5 w-5 text-white" />; })()}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                <p className="text-3xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h3 className="font-semibold text-sm mb-3">{kpi.detail.title}</h3>
            <p className="text-xs text-muted-foreground mb-3">{kpi.detail.description}</p>
            <div className="grid grid-cols-2 gap-2">
              {kpi.detail.data.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-muted/30 px-3 py-2.5"
                >
                  <p className="text-[11px] text-muted-foreground">{item.label}</p>
                  <p
                    className="text-lg font-bold mt-0.5"
                    style={{ color: item.color || kpi.color }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions rapides</p>
            {kpi.detail.actions.map((action, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="w-full justify-between"
                onClick={() => { onClose(); navigate(action.href); }}
              >
                {action.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface Props {
  sectorId: string;
  workspaceId: string;
}

export function KPICards({ sectorId, workspaceId }: Props) {
  const [selectedKPI, setSelectedKPI] = useState<KPIConfig | null>(null);
  const kpis = SECTOR_KPIS[sectorId as SectorId] || SECTOR_KPIS.btp;

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => {
          const Icon = getIcon(kpi.icon);
          return (
            <motion.button
              key={kpi.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedKPI(kpi)}
              className="group relative rounded-2xl border border-border bg-card p-5 shadow-sm text-left transition-all hover:shadow-lg hover:border-primary/20 cursor-pointer"
              style={{ '--kpi-color': kpi.color } as any}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{kpi.label}</span>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors group-hover:scale-110"
                  style={{ backgroundColor: kpi.color + '20' }}
                >
                  <Icon className="h-4 w-4" style={{ color: kpi.color }} />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold">{kpi.value}</p>
              <div className="mt-1 flex items-center gap-1">
                {kpi.trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />}
                {kpi.trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
                {kpi.trend === 'neutral' && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className={`text-xs font-medium ${
                  kpi.trend === 'up' ? 'text-emerald-600' :
                  kpi.trend === 'down' ? 'text-destructive' :
                  'text-muted-foreground'
                }`}>{kpi.change}</span>
              </div>
              {/* Bottom color bar */}
              <div
                className="absolute bottom-0 left-0 h-0.5 w-0 rounded-b-2xl transition-all duration-300 group-hover:w-full"
                style={{ backgroundColor: kpi.color }}
              />
              {/* Click hint */}
              <div className="absolute bottom-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-muted-foreground">Voir détail →</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedKPI && (
          <KPIDetailModal kpi={selectedKPI} onClose={() => setSelectedKPI(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
