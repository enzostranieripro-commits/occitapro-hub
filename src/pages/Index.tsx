import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SECTORS, SectorConfig } from '@/lib/sectors';
import { useSector } from '@/contexts/SectorContext';

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
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="group relative flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6 text-left shadow-sm transition-shadow duration-200 hover:shadow-lg"
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
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
      <div
        className="absolute bottom-0 left-0 h-1 w-0 rounded-b-2xl transition-all duration-300 group-hover:w-full"
        style={{ backgroundColor: sector.primaryColor }}
      />
    </motion.button>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground">
              <span className="text-sm font-bold text-background">OP</span>
            </div>
            <span className="text-xl font-bold tracking-tight">OccitaPro</span>
          </div>
          <a href="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Se connecter
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl"
        >
          La plateforme de gestion{' '}
          <span className="bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
            pensée pour votre métier
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground"
        >
          CRM, devis, facturation, planning, messagerie — tout en un, adapté à votre secteur d'activité.
        </motion.p>
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
        © {new Date().getFullYear()} OccitaPro — Plateforme de gestion multi-secteurs
      </footer>
    </div>
  );
}
