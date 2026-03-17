import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SECTORS, SectorConfig } from '@/lib/sectors';
import { useSector } from '@/contexts/SectorContext';
import { ArrowRight, Zap, Shield, BarChart3, Users } from 'lucide-react';

function SectorCard({ sector, index }: { sector: SectorConfig; index: number }) {
  const navigate = useNavigate();
  const { setSectorId } = useSector();

  const handleClick = () => {
    setSectorId(sector.id);
    navigate('/auth');
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      whileHover={{ y: -8, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      className="group relative flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6 text-left shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/20"
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-inner"
        style={{ backgroundColor: sector.secondaryColor + '33' }}
      >
        {sector.emoji}
      </div>
      <h3
        className="text-lg font-semibold"
        style={{ fontFamily: sector.fontFamily, color: sector.primaryColor }}
      >
        {sector.label}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {sector.description}
      </p>
      <div className="mt-auto flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
        Commencer <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
      </div>
      <div
        className="absolute bottom-0 left-0 h-1 w-0 rounded-b-2xl transition-all duration-300 group-hover:w-full"
        style={{ backgroundColor: sector.primaryColor }}
      />
    </motion.button>
  );
}

const FEATURES = [
  { icon: Zap, title: 'Tout-en-un', desc: 'CRM, devis, factures, planning réunis' },
  { icon: Shield, title: 'Sécurisé', desc: 'Données chiffrées, accès par rôle' },
  { icon: BarChart3, title: 'Analytics', desc: 'KPIs en temps réel par secteur' },
  { icon: Users, title: 'Collaboratif', desc: 'Messagerie et gestion d\'équipe' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground shadow-md">
              <span className="text-sm font-bold text-background">OP</span>
            </div>
            <span className="text-xl font-bold tracking-tight">OccitaPro</span>
          </div>
          <a
            href="/auth"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            Se connecter
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm mb-6"
        >
          <Zap className="h-3 w-3 text-primary" />
          Plateforme multi-secteurs propulsée par l'IA
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
        >
          La gestion{' '}
          <span className="bg-gradient-to-r from-primary via-primary/70 to-muted-foreground bg-clip-text text-transparent">
            pensée pour votre métier
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground"
        >
          CRM, devis, facturation, planning, messagerie, assistant IA — tout en un, adapté à votre secteur d'activité.
        </motion.p>
      </section>

      {/* Features strip */}
      <section className="container pb-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-3xl mx-auto">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm text-center"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-sm font-semibold">{f.title}</h4>
              <p className="text-[11px] text-muted-foreground leading-snug">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Sector Grid */}
      <section className="container pb-24">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground"
        >
          Choisissez votre secteur pour commencer
        </motion.p>
        <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SECTORS.map((sector, i) => (
            <SectorCard key={sector.id} sector={sector} index={i} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-foreground">
            <span className="text-[9px] font-bold text-background">OP</span>
          </div>
          <span className="font-semibold text-foreground">OccitaPro</span>
        </div>
        © {new Date().getFullYear()} OccitaPro — Plateforme de gestion multi-secteurs
      </footer>
    </div>
  );
}
