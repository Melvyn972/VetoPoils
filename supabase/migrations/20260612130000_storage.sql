-- Vet'OPoil - Storage buckets et policies (F04)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'animal-photos',
    'animal-photos',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'animal-documents',
    'animal-documents',
    false,
    20971520,
    ARRAY[
      'image/jpeg', 'image/png', 'image/webp',
      'application/pdf',
      'image/tiff'
    ]
  )
ON CONFLICT (id) DO NOTHING;

-- Chemin storage : {proprietaire_id}/{animal_id}/{uuid}.{ext}

CREATE OR REPLACE FUNCTION public.storage_animal_id_from_path(p_path TEXT)
RETURNS UUID
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(split_part(p_path, '/', 2), '')::uuid;
$$;

CREATE POLICY animal_photos_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'animal-photos'
    AND public.can_read_animal(public.storage_animal_id_from_path(name))
  );

CREATE POLICY animal_photos_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'animal-photos'
    AND public.can_write_animal(public.storage_animal_id_from_path(name))
    AND (storage.foldername(name))[1] = public.get_compte_proprietaire_id()::text
  );

CREATE POLICY animal_photos_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'animal-photos'
    AND public.can_write_animal(public.storage_animal_id_from_path(name))
  );

CREATE POLICY animal_photos_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'animal-photos'
    AND public.can_write_animal(public.storage_animal_id_from_path(name))
  );

CREATE POLICY animal_documents_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'animal-documents'
    AND public.can_read_animal(public.storage_animal_id_from_path(name))
  );

CREATE POLICY animal_documents_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'animal-documents'
    AND public.can_write_animal(public.storage_animal_id_from_path(name))
    AND (storage.foldername(name))[1] = public.get_compte_proprietaire_id()::text
  );

CREATE POLICY animal_documents_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'animal-documents'
    AND public.can_write_animal(public.storage_animal_id_from_path(name))
  );
