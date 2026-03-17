CREATE TABLE public.super_admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.super_admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view" ON public.super_admin_users
  FOR SELECT USING (user_id = auth.uid());

INSERT INTO public.super_admin_users (user_id)
VALUES ('815f5fd9-b318-418d-92dd-809557090e2c')
ON CONFLICT DO NOTHING;
