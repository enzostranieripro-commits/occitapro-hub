import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useSector } from '@/contexts/SectorContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, Sparkles, Lightbulb, RotateCcw, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SECTOR_SUGGESTIONS: Record<string, string[]> = {
  restauration: [
    "Rédige un menu du jour pour un restaurant bistronomique",
    "Comment optimiser le food cost à 30% ?",
    "Génère un message de relance pour une réservation groupe",
  ],
  btp: [
    "Rédige un devis type pour une rénovation de salle de bain",
    "Quelles mentions légales sur une facture BTP ?",
    "Aide-moi à calculer la marge sur un chantier",
  ],
  transport: [
    "Optimise ma tournée de livraison pour 8 points",
    "Rédige un email de suivi de colis retardé",
    "Comment calculer le coût au kilomètre ?",
  ],
  commerce: [
    "Rédige une description produit accrocheuse",
    "Aide-moi à planifier une opération promotionnelle",
    "Comment augmenter le panier moyen en boutique ?",
  ],
  sante: [
    "Rédige un SMS de rappel de rendez-vous",
    "Quels sont les tarifs recommandés pour un soin visage ?",
    "Aide-moi à créer un forfait fidélité",
  ],
  immobilier: [
    "Rédige une annonce immobilière pour un T3",
    "Quels documents pour une vente immobilière ?",
    "Aide-moi à préparer un argumentaire de visite",
  ],
  tourisme: [
    "Rédige un programme de séjour de 3 jours",
    "Comment fixer les prix en haute saison ?",
    "Génère un email de bienvenue pour des touristes",
  ],
  hotellerie: [
    "Rédige un email de confirmation de réservation",
    "Comment améliorer le taux d'occupation en basse saison ?",
    "Génère un message de check-in automatique",
  ],
};

export default function AIAssistantPage() {
  const { workspace } = useWorkspace();
  const { sector, sectorId } = useSector();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = SECTOR_SUGGESTIONS[sectorId || 'btp'] || SECTOR_SUGGESTIONS.btp;

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: content.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          sector: sectorId,
          sectorLabel: sector?.label,
        }),
      });

      if (resp.status === 429) {
        toast({ title: 'Limite atteinte', description: 'Trop de requêtes, réessayez dans un moment.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast({ title: 'Crédits insuffisants', description: 'Ajoutez des crédits pour continuer.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error('Erreur serveur');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      const updateAssistant = (chunk: string) => {
        assistantContent += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
          }
          return [...prev, { role: 'assistant', content: assistantContent }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) updateAssistant(delta);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (err: any) {
      toast({ title: 'Erreur IA', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleReset = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex h-[calc(100vh-7rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sector-secondary" />
              Assistant IA — {sector?.label}
            </h2>
            <p className="text-xs text-muted-foreground">Posez vos questions métier, je vous aide</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Nouvelle conversation
          </Button>
        )}
      </div>

      {/* Chat area */}
      <ScrollArea className="flex-1 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-sector-secondary/20 shadow-inner">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Comment puis-je vous aider ?</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md text-center">
              Je suis spécialisé en <strong>{sector?.label}</strong>. Posez une question ou choisissez une suggestion ci-dessous.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg">
              {suggestions.map((s, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs shadow-sm hover:shadow-md transition-shadow"
                  onClick={() => sendMessage(s)}
                >
                  <Lightbulb className="h-3 w-3 text-sector-secondary" />
                  {s}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[75%] gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  msg.role === 'user' ? 'bg-primary' : 'bg-gradient-to-br from-primary/10 to-sector-secondary/20'
                }`}>
                  {msg.role === 'user'
                    ? <User className="h-3.5 w-3.5 text-primary-foreground" />
                    : <Bot className="h-3.5 w-3.5 text-primary" />
                  }
                </div>
                <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-card border border-border rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex items-center gap-2 px-2 py-2 text-muted-foreground">
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary/40" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary/40" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary/40" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs">Réflexion en cours...</span>
          </div>
        )}
        <div ref={scrollRef} />
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border pt-4">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Posez votre question..."
          className="min-h-[44px] max-h-32 flex-1 resize-none"
          rows={1}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button type="submit" disabled={!input.trim() || isLoading} className="gap-2 self-end shadow-md">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </motion.div>
  );
}
