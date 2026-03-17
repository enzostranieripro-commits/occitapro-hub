import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageCircle, Users2, Hash } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

export default function MessagesPage() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!workspace) return;
    const { data, error } = await (supabase as any)
      .from('messages')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: true })
      .limit(200);
    if (!error) setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, [workspace]);

  // Realtime subscription
  useEffect(() => {
    if (!workspace) return;
    const channel = supabase
      .channel(`messages-${workspace.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `workspace_id=eq.${workspace.id}`,
      }, (payload: any) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [workspace]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !workspace || !user) return;
    const { error } = await (supabase as any).from('messages').insert({
      workspace_id: workspace.id,
      sender_id: user.id,
      content: newMessage.trim(),
    });
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    setNewMessage('');
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  // Group messages by date
  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  messages.forEach(msg => {
    const date = new Date(msg.created_at).toDateString();
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) last.msgs.push(msg);
    else groupedMessages.push({ date, msgs: [msg] });
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex h-[calc(100vh-7rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Hash className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messagerie d'équipe
          </h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Users2 className="h-3 w-3" />
            Canal général du workspace
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <MessageCircle className="mb-3 h-12 w-12 opacity-30" />
            <p className="text-sm">Aucun message. Lancez la conversation !</p>
          </div>
        ) : (
          groupedMessages.map(group => (
            <div key={group.date}>
              <div className="sticky top-0 z-10 flex justify-center py-2">
                <span className="rounded-full bg-muted px-3 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm">
                  {formatDate(group.msgs[0].created_at)}
                </span>
              </div>
              {group.msgs.map(msg => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`mb-2 flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-card border border-border rounded-bl-md'
                    }`}>
                      {!isMe && (
                        <p className="mb-0.5 text-[10px] font-medium text-muted-foreground">
                          {msg.sender_id.slice(0, 8)}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={`mt-1 text-right text-[10px] ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 border-t border-border pt-4">
        <Input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Écrire un message..."
          className="flex-1"
          autoFocus
        />
        <Button type="submit" disabled={!newMessage.trim()} className="gap-2 shadow-md">
          <Send className="h-4 w-4" />
          Envoyer
        </Button>
      </form>
    </motion.div>
  );
}
