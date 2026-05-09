export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          adresse: string
          created_at: string
          date_naissance: string | null
          email: string
          id: string
          nom: string
          notes: string
          prenom: string
          telephone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adresse?: string
          created_at?: string
          date_naissance?: string | null
          email?: string
          id?: string
          nom: string
          notes?: string
          prenom?: string
          telephone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          adresse?: string
          created_at?: string
          date_naissance?: string | null
          email?: string
          id?: string
          nom?: string
          notes?: string
          prenom?: string
          telephone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      commande_counters: {
        Row: {
          next_numero: number
          user_id: string
        }
        Insert: {
          next_numero?: number
          user_id: string
        }
        Update: {
          next_numero?: number
          user_id?: string
        }
        Relationships: []
      }
      commandes: {
        Row: {
          client_id: string
          created_at: string
          date_livraison_prevue: string | null
          details_personnalisation: string
          id: string
          inclut_personnalisation: boolean
          montant_total: number
          notes: string
          numero: number
          ordonnance_id: string | null
          prix_personnalisation: number | null
          statut: Database["public"]["Enums"]["commande_statut"]
          stock_applied: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          date_livraison_prevue?: string | null
          details_personnalisation?: string
          id?: string
          inclut_personnalisation?: boolean
          montant_total?: number
          notes?: string
          numero: number
          ordonnance_id?: string | null
          prix_personnalisation?: number | null
          statut?: Database["public"]["Enums"]["commande_statut"]
          stock_applied?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          date_livraison_prevue?: string | null
          details_personnalisation?: string
          id?: string
          inclut_personnalisation?: boolean
          montant_total?: number
          notes?: string
          numero?: number
          ordonnance_id?: string | null
          prix_personnalisation?: number | null
          statut?: Database["public"]["Enums"]["commande_statut"]
          stock_applied?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commandes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commandes_ordonnance_id_fkey"
            columns: ["ordonnance_id"]
            isOneToOne: false
            referencedRelation: "ordonnances"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_commande: {
        Row: {
          commande_id: string
          created_at: string
          designation: string
          id: string
          position: number
          prix_unitaire: number
          produit_id: string | null
          quantite: number
          user_id: string
        }
        Insert: {
          commande_id: string
          created_at?: string
          designation?: string
          id?: string
          position?: number
          prix_unitaire?: number
          produit_id?: string | null
          quantite?: number
          user_id: string
        }
        Update: {
          commande_id?: string
          created_at?: string
          designation?: string
          id?: string
          position?: number
          prix_unitaire?: number
          produit_id?: string | null
          quantite?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lignes_commande_commande_id_fkey"
            columns: ["commande_id"]
            isOneToOne: false
            referencedRelation: "commandes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_commande_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
        ]
      }
      ordonnances: {
        Row: {
          client_id: string
          created_at: string
          date_expiration: string | null
          date_prescription: string | null
          distance_pupillaire: number | null
          ecart_od: number | null
          ecart_og: number | null
          hauteur_od: number | null
          hauteur_og: number | null
          id: string
          nom_medecin: string
          notes: string
          od_addition: number | null
          od_axe: number | null
          od_base: string | null
          od_cylindre: number | null
          od_prisme: number | null
          od_sphere: number | null
          og_addition: number | null
          og_axe: number | null
          og_base: string | null
          og_cylindre: number | null
          og_prisme: number | null
          og_sphere: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          date_expiration?: string | null
          date_prescription?: string | null
          distance_pupillaire?: number | null
          ecart_od?: number | null
          ecart_og?: number | null
          hauteur_od?: number | null
          hauteur_og?: number | null
          id?: string
          nom_medecin?: string
          notes?: string
          od_addition?: number | null
          od_axe?: number | null
          od_base?: string | null
          od_cylindre?: number | null
          od_prisme?: number | null
          od_sphere?: number | null
          og_addition?: number | null
          og_axe?: number | null
          og_base?: string | null
          og_cylindre?: number | null
          og_prisme?: number | null
          og_sphere?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          date_expiration?: string | null
          date_prescription?: string | null
          distance_pupillaire?: number | null
          ecart_od?: number | null
          ecart_og?: number | null
          hauteur_od?: number | null
          hauteur_og?: number | null
          id?: string
          nom_medecin?: string
          notes?: string
          od_addition?: number | null
          od_axe?: number | null
          od_base?: string | null
          od_cylindre?: number | null
          od_prisme?: number | null
          od_sphere?: number | null
          og_addition?: number | null
          og_axe?: number | null
          og_base?: string | null
          og_cylindre?: number | null
          og_prisme?: number | null
          og_sphere?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordonnances_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      produits: {
        Row: {
          categorie: Database["public"]["Enums"]["produit_categorie"]
          created_at: string
          description: string
          id: string
          marque: string
          modele: string
          nom: string
          prix: number
          stock: number
          updated_at: string
          user_id: string
        }
        Insert: {
          categorie?: Database["public"]["Enums"]["produit_categorie"]
          created_at?: string
          description?: string
          id?: string
          marque?: string
          modele?: string
          nom: string
          prix?: number
          stock?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          categorie?: Database["public"]["Enums"]["produit_categorie"]
          created_at?: string
          description?: string
          id?: string
          marque?: string
          modele?: string
          nom?: string
          prix?: number
          stock?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_roles: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager"
      commande_statut: "EN_ATTENTE" | "EN_TRAITEMENT" | "TERMINEE" | "ANNULEE"
      produit_categorie: "MONTURE" | "VERRE" | "ACCESSOIRE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager"],
      commande_statut: ["EN_ATTENTE", "EN_TRAITEMENT", "TERMINEE", "ANNULEE"],
      produit_categorie: ["MONTURE", "VERRE", "ACCESSOIRE"],
    },
  },
} as const
