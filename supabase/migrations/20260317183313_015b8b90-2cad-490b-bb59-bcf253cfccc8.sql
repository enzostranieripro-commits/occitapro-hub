
-- Workspaces
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  sector text NOT NULL,
  logo_url text,
  email_pro text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Workspace members
CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text,
  role text CHECK (role IN ('admin','responsable','salarie')) NOT NULL DEFAULT 'salarie',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_user_workspace_ids(_user_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT workspace_id FROM public.workspace_members WHERE user_id = _user_id; $$;

CREATE OR REPLACE FUNCTION public.get_user_role_in_workspace(_user_id uuid, _workspace_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.workspace_members WHERE user_id = _user_id AND workspace_id = _workspace_id; $$;

-- Workspaces policies (now workspace_members exists)
CREATE POLICY "Users can view their workspaces" ON public.workspaces
  FOR SELECT USING (id IN (SELECT public.get_user_workspace_ids(auth.uid())));
CREATE POLICY "Owner can insert workspace" ON public.workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner can update workspace" ON public.workspaces
  FOR UPDATE USING (owner_id = auth.uid());

-- Workspace members policies
CREATE POLICY "Members can view workspace members" ON public.workspace_members
  FOR SELECT USING (workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));
CREATE POLICY "Admins can insert members" ON public.workspace_members
  FOR INSERT WITH CHECK (
    public.get_user_role_in_workspace(auth.uid(), workspace_id) = 'admin'
    OR NOT EXISTS (SELECT 1 FROM public.workspace_members wm2 WHERE wm2.workspace_id = workspace_members.workspace_id)
  );
CREATE POLICY "Admins can update members" ON public.workspace_members
  FOR UPDATE USING (public.get_user_role_in_workspace(auth.uid(), workspace_id) = 'admin');
CREATE POLICY "Admins can delete members" ON public.workspace_members
  FOR DELETE USING (public.get_user_role_in_workspace(auth.uid(), workspace_id) = 'admin');

-- Clients
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name text, email text, phone text, address text, notes text,
  status text DEFAULT 'prospect', sector_data jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_clients_select" ON public.clients FOR SELECT USING (workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));
CREATE POLICY "ws_clients_insert" ON public.clients FOR INSERT WITH CHECK (workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));
CREATE POLICY "ws_clients_update" ON public.clients FOR UPDATE USING (workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));
CREATE POLICY "ws_clients_delete" ON public.clients FOR DELETE USING (public.get_user_role_in_workspace(auth.uid(), workspace_id) IN ('admin','responsable'));

-- Documents
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id),
  type text, number text, lines jsonb, status text DEFAULT 'brouillon',
  total_ht numeric, total_ttc numeric,
  relance_j3 boolean DEFAULT false, relance_j7 boolean DEFAULT false, relance_j14 boolean DEFAULT false,
  due_date timestamptz, created_at timestamptz DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_docs_select" ON public.documents FOR SELECT USING (workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));
CREATE POLICY "ws_docs_insert" ON public.documents FOR INSERT WITH CHECK (workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));
CREATE POLICY "ws_docs_update" ON public.documents FOR UPDATE USING (workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));

-- Catalog
CREATE TABLE public.catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name text, description text, price numeric, vat_rate numeric DEFAULT 20,
  unit text, category text, stock_qty numeric, stock_alert numeric,
  photo_url text, is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_catalog_select" ON public.catalog FOR SELECT USING (workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));
CREATE POLICY "ws_catalog_insert" ON public.catalog FOR INSERT WITH CHECK (workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));
CREATE POLICY "ws_catalog_update" ON public.catalog FOR UPDATE USING (workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));

-- Planning
CREATE TABLE public.planning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  title text, start_time timestamptz, end_time timestamptz, type text,
  notes text, created_at timestamptz DEFAULT now()
);
ALTER TABLE public.planning ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_planning_select" ON public.planning FOR SELECT USING (workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));
CREATE POLICY "ws_planning_insert" ON public.planning FOR INSERT WITH CHECK (public.get_user_role_in_workspace(auth.uid(), workspace_id) IN ('admin','responsable'));
CREATE POLICY "ws_planning_update" ON public.planning FOR UPDATE USING (public.get_user_role_in_workspace(auth.uid(), workspace_id) IN ('admin','responsable'));

-- Leave requests
CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  type text, start_date date, end_date date,
  status text DEFAULT 'en_attente', motif_refus text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_leave_select" ON public.leave_requests FOR SELECT USING (workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));
CREATE POLICY "ws_leave_insert" ON public.leave_requests FOR INSERT WITH CHECK (user_id = auth.uid() AND workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));
CREATE POLICY "ws_leave_update" ON public.leave_requests FOR UPDATE USING (public.get_user_role_in_workspace(auth.uid(), workspace_id) IN ('admin','responsable'));

-- Messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) NOT NULL,
  content text, is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_messages_select" ON public.messages FOR SELECT USING (workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));
CREATE POLICY "ws_messages_insert" ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid() AND workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  type text, message text, is_read boolean DEFAULT false,
  priority text DEFAULT 'normale',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_notif_select" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "ws_notif_insert" ON public.notifications FOR INSERT WITH CHECK (workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));
CREATE POLICY "ws_notif_update" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- Activity logs
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action text, details jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_logs_select" ON public.activity_logs FOR SELECT USING (public.get_user_role_in_workspace(auth.uid(), workspace_id) = 'admin');
CREATE POLICY "ws_logs_insert" ON public.activity_logs FOR INSERT WITH CHECK (workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));
