-- Fix Vet'OPoil: make animal creation robust for authenticated owners.

DROP POLICY IF EXISTS animaux_insert ON public.animaux;

CREATE POLICY animaux_insert ON public.animaux
  FOR INSERT TO authenticated
  WITH CHECK (
    proprietaire_id = auth.uid()
    OR proprietaire_id = public.get_compte_proprietaire_id(auth.uid())
  );
