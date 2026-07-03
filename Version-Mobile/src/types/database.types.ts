export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PlanType = "free" | "premium";
export type CompteRole = "owner" | "co_owner";
export type AnimalSexe = "male" | "femelle" | "inconnu";
export type MedicalEventType =
  | "consultation"
  | "vaccination"
  | "chirurgie"
  | "ordonnance"
  | "analyse"
  | "autre";
export type MedicalEventStatus = "pending" | "validated";
export type DocumentCategory =
  | "ordonnance"
  | "facture"
  | "analyse_sanguine"
  | "vaccination"
  | "autre";
export type ReminderType = "vaccination" | "antiparasitaire" | "rdv" | "autre";
export type ReminderChannel = "email" | "push" | "both";
export type ReminderStatus = "actif" | "termine" | "annule" | "reporte";
export type PartageRole = "read_only" | "contributor";
export type InvitationStatus = "en_attente" | "acceptee" | "revoquee";
export type VetTokenStatus = "actif" | "utilise" | "expire" | "revoque";

export type Profile = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: CompteRole;
  compte_proprietaire_id: string | null;
  plan: PlanType;
  ocr_usage: number;
  ocr_usage_mois: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Animal = {
  id: string;
  proprietaire_id: string;
  nom: string;
  espece: string;
  race: string | null;
  date_naissance: string | null;
  sexe: AnimalSexe;
  couleur: string | null;
  puce: string | null;
  photo_path: string | null;
  score_sante: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type MedicalEvent = {
  id: string;
  animal_id: string;
  type: MedicalEventType;
  date_event: string;
  titre: string | null;
  description: string | null;
  poids_kg: number | null;
  diagnostic: string | null;
  traitement: string | null;
  status: MedicalEventStatus;
  cree_par: string | null;
  vet_token_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string;
  animal_id: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  taille_octets: number;
  category_ocr: DocumentCategory | null;
  raw_ocr_json: Json | null;
  uploade_par: string | null;
  created_at: string;
};

export type Reminder = {
  id: string;
  animal_id: string;
  type: ReminderType;
  date_echeance: string;
  canal: ReminderChannel;
  statut: ReminderStatus;
  titre: string;
  notes: string | null;
  notifie_le: string | null;
  created_at: string;
  updated_at: string;
};

export type AnimalShare = {
  id: string;
  animal_id: string;
  user_id: string | null;
  email_invite: string;
  role: PartageRole;
  statut: InvitationStatus;
  invite_par: string;
  created_at: string;
  accepte_le: string | null;
};

export type VetAccessToken = {
  id: string;
  animal_id: string;
  token: string;
  expire_le: string;
  utilise_le: string | null;
  statut: VetTokenStatus;
  cree_par: string;
  created_at: string;
};

export type AppNotification = {
  id: string;
  user_id: string;
  type: string;
  titre: string;
  corps: string;
  donnees: Json;
  lu_le: string | null;
  created_at: string;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      animaux: Table<
        Animal,
        Omit<Partial<Animal>, "id" | "created_at" | "updated_at"> & {
          nom: string;
          espece: string;
          proprietaire_id: string;
        }
      >;
      medical_events: Table<
        MedicalEvent,
        Omit<Partial<MedicalEvent>, "id" | "created_at" | "updated_at"> & {
          animal_id: string;
          type: MedicalEventType;
        }
      >;
      documents: Table<
        Document,
        Omit<Partial<Document>, "id" | "created_at"> & {
          animal_id: string;
          file_path: string;
          file_name: string;
          mime_type: string;
          taille_octets: number;
        }
      >;
      reminders: Table<
        Reminder,
        Omit<Partial<Reminder>, "id" | "created_at" | "updated_at"> & {
          animal_id: string;
          type: ReminderType;
          date_echeance: string;
          titre: string;
        }
      >;
      animal_shares: Table<AnimalShare>;
      vet_access_tokens: Table<VetAccessToken>;
      notifications: Table<AppNotification>;
    };
    Functions: {
      generer_vet_token: {
        Args: { p_animal_id: string; p_duree_heures?: number };
        Returns: VetAccessToken;
      };
      revoquer_vet_token: {
        Args: { p_token: string };
        Returns: undefined;
      };
      valider_medical_event: {
        Args: { p_event_id: string };
        Returns: MedicalEvent;
      };
      increment_ocr_usage: {
        Args: { p_user_id?: string };
        Returns: number;
      };
      accepter_invitation_partage: {
        Args: { p_share_id: string };
        Returns: AnimalShare;
      };
    };
    Views: Record<string, never>;
    Enums: {
      plan_type: PlanType;
      compte_role: CompteRole;
      animal_sexe: AnimalSexe;
      medical_event_type: MedicalEventType;
      medical_event_status: MedicalEventStatus;
      document_category: DocumentCategory;
      reminder_type: ReminderType;
      reminder_channel: ReminderChannel;
      reminder_status: ReminderStatus;
      partage_role: PartageRole;
      invitation_status: InvitationStatus;
      vet_token_status: VetTokenStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
