-- Ajoute le statut de refus pour les événements vétérinaires en attente.
-- À appliquer avant 20260914121000 (la nouvelle valeur d'enum ne peut pas
-- être utilisée dans la même transaction que ALTER TYPE ... ADD VALUE).

ALTER TYPE public.medical_event_status ADD VALUE IF NOT EXISTS 'rejected';
