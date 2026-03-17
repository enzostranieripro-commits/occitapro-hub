import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SECTORS, SectorConfig } from '@/lib/sectors';
import { useSector } from '@/contexts/SectorContext';
import { ArrowRight, Zap, Shield, BarChart3, Users, X, Lock, KeyRound, LogIn } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'occitapro_admin_creds';
const SESSION_KEY = 'occitapro_admin_session';
const DEFAULT_LOGIN = 'AveyronIA';
const DEFAULT_PASSWORD = 'Projet12';

function getStoredCreds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.login && parsed.password) return parsed;
    }
  } catch {}
  return { login: DEFAULT_LOGIN, password: DEFAULT_PASSWORD };
}

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
      <h3 className="text-lg font-semibold" style={{ fontFamily: sector.fontFamily, color: sector.primaryColor }}>
        {sector.label}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{sector.description}</p>
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
  { icon: Users, title: 'Collaboratif', desc: "Messagerie et gestion d'équipe" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'change'>('login');

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [currentLogin, setCurrentLogin] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newLogin, setNewLogin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const stored = getStoredCreds();
    if (login.trim() === stored.login && password === stored.password) {
      localStorage.setItem(SESSION_KEY, 'granted');
      closeModal();
      navigate('/super-admin');
    } else {
      setLoginError('Identifiant ou mot de passe incorrect.');
    }
  };

  const handleChangeCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');
    setChangeSuccess('');
    const stored = getStoredCreds();
    if (currentLogin.trim() !== stored.login || currentPassword !== stored.password) {
      setChangeError('Identifiant ou mot de passe actuel incorrect.');
      return;
    }
    if (!newLogin.trim()) { setChangeError('Le nouvel identifiant ne peut pas être vide.'); return; }
    if (newPassword.length < 4) { setChangeError('Le nouveau mot de passe doit faire au moins 4 caractères.'); return; }
    if (newPassword !== confirmPassword) { setChangeError('Les deux mots de passe ne correspondent pas.'); return; }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ login: newLogin.trim(), password: newPassword }));
    setChangeSuccess('Identifiants mis à jour avec succès !');
    setCurrentLogin(''); setCurrentPassword(''); setNewLogin(''); setNewPassword(''); setConfirmPassword('');
    setTimeout(() => { setActiveTab('login'); setChangeSuccess(''); }, 1500);
  };

  const closeModal = () => {
    setShowModal(false);
    setLogin(''); setPassword(''); setLoginError('');
    setCurrentLogin(''); setCurrentPassword(''); setNewLogin(''); setNewPassword(''); setConfirmPassword('');
    setChangeError(''); setChangeSuccess('');
    setActiveTab('login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground shadow-md">
              <span className="text-sm font-bold text-background">OP</span>
            </div>
            <span className="text-xl font-bold tracking-tight">OccitaPro</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm transition-all hover:bg-muted hover:text-foreground"
            >
              <Shield className="h-3.5 w-3.5" />
              Back Office
            </button>
            <a
              href="/auth"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              Se connecter
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={closeModal} className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>

              <div className="px-8 pt-8 pb-4 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Lock className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Back Office</h2>
                <p className="mt-1 text-sm text-muted-foreground">Accès réservé aux administrateurs</p>
              </div>

              <div className="mx-8 mb-4 flex rounded-xl bg-muted p-1">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${activeTab === 'login' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <LogIn className="h-3.5 w-3.5" />Connexion
                </button>
                <button
                  onClick={() => setActiveTab('change')}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${activeTab === 'change' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <KeyRound className="h-3.5 w-3.5" />Modifier
                </button>
              </div>

              <div className="px-8 pb-8">
                {activeTab === 'login' && (
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Identifiant</label>
                      <Input value={login} onChange={e => { setLogin(e.target.value); setLoginError(''); }} placeholder="Identifiant" autoFocus autoComplete="off" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Mot de passe</label>
                      <Input type="password" value={password} onChange={e => { setPassword(e.target.value); setLoginError(''); }} placeholder="••••••••" autoComplete="off" />
                    </div>
                    {loginError && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">{loginError}</p>}
                    <Button type="submit" className="w-full gap-2">
                      <Shield className="h-4 w-4" />Accéder au Back Office
                    </Button>
                  </form>
                )}

                {activeTab === 'change' && (
                  <form onSubmit={handleChangeCredentials} className="space-y-3">
                    <p className="text-xs text-muted-foreground mb-2">Vérifiez vos identifiants actuels puis renseignez les nouveaux.</p>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Identifiant actuel</label>
                      <Input value={currentLogin} onChange={e => { setCurrentLogin(e.target.value); setChangeError(''); }} placeholder="Identifiant actuel" autoComplete="off" autoFocus />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Mot de passe actuel</label>
                      <Input type="password" value={currentPassword} onChange={e => { setCurrentPassword(e.target.value); setChangeError(''); }} placeholder="••••••••" autoComplete="off" />
                    </div>
                    <hr className="border-border" />
                    <div>
                      <label className="mb-1 block text-sm font-medium">Nouvel identifiant</label>
                      <Input value={newLogin} onChange={e => { setNewLogin(e.target.value); setChangeError(''); }} placeholder="Nouvel identifiant" autoComplete="off" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Nouveau mot de passe</label>
                      <Input type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setChangeError(''); }} placeholder="••••••••" autoComplete="off" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Confirmer le mot de passe</label>
                      <Input type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setChangeError(''); }} placeholder="••••••••" autoComplete="off" />
                    </div>
                    {changeError && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">{changeError}</p>}
                    {changeSuccess && <p className="rounded-lg bg-green-100 px-3 py-2 text-center text-sm text-green-800">{changeSuccess}</p>}
                    <Button type="submit" className="w-full gap-2">
                      <KeyRound className="h-4 w-4" />Enregistrer les nouveaux identifiants
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="container py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm mb-6"
        >
          <Zap className="h-3 w-3 text-primary" />
          Plateforme multi-secteurs propulsée par l'IA
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
        >
          La gestion{' '}
          <span className="bg-gradient-to-r from-primary via-primary/70 to-muted-foreground bg-clip-text text-transparent">
            pensée pour votre métier
          </span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground"
        >
          CRM, devis, facturation, planning, messagerie, assistant IA — tout en un, adapté à votre secteur d'activité.
        </motion.p>
      </section>

      <section className="container pb-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-3xl mx-auto">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
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

      <section className="container pb-24">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
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
