-- Vet'OPoil - Row Level Security (toutes les tables)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vet_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_clicks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES
-- ============================================================================

CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR compte_proprietaire_id = auth.uid()
    OR id = (SELECT compte_proprietaire_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- ANIMAUX
-- ============================================================================

CREATE POLICY animaux_select ON public.animaux
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND public.can_read_animal(id)
  );

CREATE POLICY animaux_insert ON public.animaux
  FOR INSERT TO authenticated
  WITH CHECK (proprietaire_id = public.get_compte_proprietaire_id());

CREATE POLICY animaux_update ON public.animaux
  FOR UPDATE TO authenticated
  USING (public.can_write_animal(id) AND deleted_at IS NULL)
  WITH CHECK (public.can_write_animal(id));

CREATE POLICY animaux_delete ON public.animaux
  FOR DELETE TO authenticated
  USING (public.can_write_animal(id));

-- ============================================================================
-- MEDICAL EVENTS
-- ============================================================================

CREATE POLICY medical_events_select ON public.medical_events
  FOR SELECT TO authenticated
  USING (public.can_read_animal(animal_id));

CREATE POLICY medical_events_insert ON public.medical_events
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_animal(animal_id));

CREATE POLICY medical_events_update ON public.medical_events
  FOR UPDATE TO authenticated
  USING (public.can_write_animal(animal_id))
  WITH CHECK (public.can_write_animal(animal_id));

CREATE POLICY medical_events_delete ON public.medical_events
  FOR DELETE TO authenticated
  USING (public.can_write_animal(animal_id));

-- ============================================================================
-- DOCUMENTS
-- ============================================================================

CREATE POLICY documents_select ON public.documents
  FOR SELECT TO authenticated
  USING (public.can_read_animal(animal_id));

CREATE POLICY documents_insert ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_animal(animal_id));

CREATE POLICY documents_delete ON public.documents
  FOR DELETE TO authenticated
  USING (public.can_write_animal(animal_id));

-- ============================================================================
-- VET ACCESS TOKENS
-- ============================================================================

CREATE POLICY vet_tokens_select ON public.vet_access_tokens
  FOR SELECT TO authenticated
  USING (public.can_write_animal(animal_id));

CREATE POLICY vet_tokens_insert ON public.vet_access_tokens
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_animal(animal_id) AND cree_par = auth.uid());

CREATE POLICY vet_tokens_update ON public.vet_access_tokens
  FOR UPDATE TO authenticated
  USING (public.can_write_animal(animal_id));

-- ============================================================================
-- ANIMAL SHARES (F11)
-- ============================================================================

CREATE POLICY animal_shares_select ON public.animal_shares
  FOR SELECT TO authenticated
  USING (
    public.can_write_animal(animal_id)
    OR user_id = auth.uid()
    OR lower(email_invite) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE POLICY animal_shares_insert ON public.animal_shares
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_animal(animal_id) AND invite_par = auth.uid());

CREATE POLICY animal_shares_update ON public.animal_shares
  FOR UPDATE TO authenticated
  USING (
    public.can_write_animal(animal_id)
    OR (user_id = auth.uid() AND statut = 'en_attente')
  );

CREATE POLICY animal_shares_delete ON public.animal_shares
  FOR DELETE TO authenticated
  USING (public.can_write_animal(animal_id));

-- ============================================================================
-- REMINDERS (F08)
-- ============================================================================

CREATE POLICY reminders_select ON public.reminders
  FOR SELECT TO authenticated
  USING (public.can_read_animal(animal_id));

CREATE POLICY reminders_insert ON public.reminders
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_animal(animal_id));

CREATE POLICY reminders_update ON public.reminders
  FOR UPDATE TO authenticated
  USING (public.can_write_animal(animal_id))
  WITH CHECK (public.can_write_animal(animal_id));

CREATE POLICY reminders_delete ON public.reminders
  FOR DELETE TO authenticated
  USING (public.can_write_animal(animal_id));

-- ============================================================================
-- DAILY LOGS (F12)
-- ============================================================================

CREATE POLICY daily_logs_select ON public.daily_logs
  FOR SELECT TO authenticated
  USING (public.can_read_animal(animal_id));

CREATE POLICY daily_logs_insert ON public.daily_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.can_write_daily_log(animal_id)
    AND cree_par = auth.uid()
  );

CREATE POLICY daily_logs_update ON public.daily_logs
  FOR UPDATE TO authenticated
  USING (cree_par = auth.uid() AND public.can_write_daily_log(animal_id))
  WITH CHECK (cree_par = auth.uid());

CREATE POLICY daily_logs_delete ON public.daily_logs
  FOR DELETE TO authenticated
  USING (
    public.can_write_animal(animal_id)
    OR (cree_par = auth.uid() AND public.can_write_daily_log(animal_id))
  );

-- ============================================================================
-- EXPENSES (F13 - premium enforced by trigger)
-- ============================================================================

CREATE POLICY expenses_select ON public.expenses
  FOR SELECT TO authenticated
  USING (public.can_write_animal(animal_id));

CREATE POLICY expenses_insert ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_animal(animal_id) AND cree_par = auth.uid());

CREATE POLICY expenses_update ON public.expenses
  FOR UPDATE TO authenticated
  USING (public.can_write_animal(animal_id))
  WITH CHECK (public.can_write_animal(animal_id));

CREATE POLICY expenses_delete ON public.expenses
  FOR DELETE TO authenticated
  USING (public.can_write_animal(animal_id));

-- ============================================================================
-- HEALTH SCORE (F14)
-- ============================================================================

CREATE POLICY health_score_select ON public.health_score_history
  FOR SELECT TO authenticated
  USING (public.can_read_animal(animal_id));

CREATE POLICY health_score_insert ON public.health_score_history
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_animal(animal_id));

-- ============================================================================
-- NOTIFICATIONS (F18)
-- ============================================================================

CREATE POLICY notifications_select ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- PARTNERS B2B (F17)
-- ============================================================================

CREATE POLICY partners_select ON public.partners
  FOR SELECT TO authenticated, anon
  USING (actif = true);

CREATE POLICY partner_clicks_insert ON public.partner_clicks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY partner_clicks_select ON public.partner_clicks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
