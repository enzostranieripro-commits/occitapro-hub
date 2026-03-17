import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageCircle, Users2, Hash, Crown, Shield, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

interface Member {
  id: string;
  user_id: string;
  email: string;
  role: string;
}

export default function MessagesPage() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!workspace) return;
    const [msgsRes, membersRes] = await Promise.all([
      (supabase as any).from('messages').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: true }).limit(200),
      (supabase as any).from('workspace_members').select('*').eq('workspace_id', workspace.id),
    ]);
    if (!msgsRes.error) setMessages(msgsRes.data || []);
    if (!membersRes.error) setMembers(membersRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, [workspace]);

  useEffect(() => {
    if (!workspace) return;
    const channel = supabase
      .channel(`messages-${workspace.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `workspace_id=eq.${workspace.id}` },
        (payload: any) => setMessages(prev => [...prev, payload.new as Message]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workspace]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !workspace || !user) return;
    const { error } = await (supabase as any).from('messages').insert({
      workspace_id: workspace.id, sender_id: user.id, content: newMessage.trim(),
    });
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    setNewMessage('');
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const getMemberByUserId = (uid: string) => members.find(m => m.user_id === uid);
  const getRoleIcon = (role: string) => {
    if (role === 'admin') return <Crown className="h-3 w-3 text-amber-500" />;
    if (role === 'responsable') return <Shield className="h-3 w-3 text-blue-500" />;
    return <User className="h-3 w-3 text-muted-foreground" />;
  };
  const getRoleBadge = (role: string) => {
    if (role === 'admin') return 'bg-amber-100 text-amber-800';
    if (role === 'responsable') return 'bg-blue-100 text-blue-800';
    return 'bg-muted text-muted-foreground';
  };

  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  messages.forEach(msg => {
    const date = new Date(msg.created_at).toDateString();
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) last.msgs.push(msg);
    else groupedMessages.push({ date, msgs: [msg] });
  });

  const otherMembers = members.filter(m => m.user_id !== user?.id);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex h-[calc(100vh-7rem)] gap-4">

      {/* Member sidebar */}
      <div className="hidden md:flex w-64 flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Users2 className="h-4 w-4 text-primary" />
            Équipe ({members.length})
          </p>
        </div>
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {/* General channel */}
            <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 cursor-pointer">
              <Hash className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Général</span>
            </div>

            <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Membres</p>
            {members.map(m => {
              const isMe = m.user_id === user?.id;
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors ${isMe ? 'bg-muted/50' : 'hover:bg-muted/30 cursor-pointer'}`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {m.email?.charAt(0).toUpperCase()}
                    </div>
                    {/* Online indicator (mock) */}
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border border-card" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{m.email?.split('@')[0]}{isMe && ' (moi)'}</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getRoleBadge(m.role)}`}>
                      {getRoleIcon(m.role)}{m.role}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Hash className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Général — {workspace?.name}</p>
            <p className="text-xs text-muted-foreground">{members.length} membre{members.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <MessageCircle className="mb-3 h-12 w-12 opacity-30" />
              <p className="text-sm">Aucun message. Lancez la conversation !</p>
              {otherMembers.length > 0 && (
                <p className="text-xs mt-2 text-muted-foreground">
                  {otherMembers.length} membre{otherMembers.length > 1 ? 's' : ''} dans ce workspace
                </p>
              )}
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
                  const sender = getMemberByUserId(msg.sender_id);
                  return (
                    <div key={msg.id} className={`mb-3 flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex max-w-[70%] gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground mt-1">
                            {sender?.email?.charAt(0).toUpperCase() || '?'}
                          </div>
                        </div>
                        <div>
                          {!isMe && (
                            <p className="text-[10px] text-muted-foreground mb-0.5 ml-1">
                              {sender?.email?.split('@')[0] || 'Utilisateur'}
                              {sender?.role && (
                                <span className={`ml-1.5 rounded-full px-1 py-0.5 text-[9px] ${getRoleBadge(sender.role)}`}>
                                  {sender.role}
                                </span>
                              )}
                            </p>
                          )}
                          <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted/80 border border-border rounded-bl-md'
                          }`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <p className={`mt-1 text-right text-[10px] ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
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
        <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-4">
          <Input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Écrire un message à l'équipe..."
            className="flex-1"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
            }}
          />
          <Button type="submit" disabled={!newMessage.trim()} className="gap-2 shadow-md">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
