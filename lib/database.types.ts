// Tipos do banco no formato gerado pela CLI do Supabase.
// Se alterar as migrations, regenere com:
//   npx supabase gen types typescript --project-id <id> > lib/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          code: string;
          slug: string;
          title: string;
          deal_type: Database["public"]["Enums"]["deal_type"];
          property_type: Database["public"]["Enums"]["property_type"];
          status: Database["public"]["Enums"]["property_status"];
          visible: boolean;
          featured: boolean;
          accepts_proposal: boolean;
          rent_price: number | null;
          sale_price: number | null;
          condo_fee: number | null;
          iptu: number | null;
          iptu_exempt: boolean;
          price_notes: string | null;
          street: string | null;
          number: string | null;
          complement: string | null;
          neighborhood: string;
          city: string;
          state: string;
          zip_code: string | null;
          hide_number: boolean;
          bedrooms: number;
          suites: number;
          bathrooms: number;
          parking_spots: number;
          usable_area: number | null;
          total_area: number | null;
          amenities: string[];
          description: string | null;
          search_text: string | null;
          status_changed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code?: string;
          slug?: string;
          title: string;
          deal_type: Database["public"]["Enums"]["deal_type"];
          property_type: Database["public"]["Enums"]["property_type"];
          status?: Database["public"]["Enums"]["property_status"];
          visible?: boolean;
          featured?: boolean;
          accepts_proposal?: boolean;
          rent_price?: number | null;
          sale_price?: number | null;
          condo_fee?: number | null;
          iptu?: number | null;
          iptu_exempt?: boolean;
          price_notes?: string | null;
          street?: string | null;
          number?: string | null;
          complement?: string | null;
          neighborhood: string;
          city?: string;
          state?: string;
          zip_code?: string | null;
          hide_number?: boolean;
          bedrooms?: number;
          suites?: number;
          bathrooms?: number;
          parking_spots?: number;
          usable_area?: number | null;
          total_area?: number | null;
          amenities?: string[];
          description?: string | null;
          status_changed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Insert"]>;
        Relationships: [];
      };
      property_images: {
        Row: {
          id: string;
          property_id: string;
          storage_path: string;
          url: string;
          position: number;
          is_cover: boolean;
          width: number | null;
          height: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          storage_path: string;
          url: string;
          position?: number;
          is_cover?: boolean;
          width?: number | null;
          height?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["property_images"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      settings: {
        Row: {
          id: number;
          company_name: string;
          whatsapp: string;
          phone: string | null;
          email: string | null;
          creci: string | null;
          address: string | null;
          opening_hours: string | null;
          instagram_url: string | null;
          facebook_url: string | null;
          about_text: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          company_name?: string;
          whatsapp?: string;
          phone?: string | null;
          email?: string | null;
          creci?: string | null;
          address?: string | null;
          opening_hours?: string | null;
          instagram_url?: string | null;
          facebook_url?: string | null;
          about_text?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["settings"]["Insert"]>;
        Relationships: [];
      };
      admins: {
        Row: {
          user_id: string;
          name: string | null;
          email: string | null;
          role: Database["public"]["Enums"]["team_role"];
          created_at: string;
        };
        Insert: {
          user_id: string;
          name?: string | null;
          email?: string | null;
          role?: Database["public"]["Enums"]["team_role"];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admins"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_owner: { Args: Record<PropertyKey, never>; Returns: boolean };
      set_property_cover: { Args: { p_image_id: string }; Returns: undefined };
      reorder_property_images: {
        Args: { p_property_id: string; p_image_ids: string[] };
        Returns: undefined;
      };
      slugify: { Args: { value: string }; Returns: string };
      sync_property_images: { Args: { p_property_id: string; p_images: Json }; Returns: string[] };
      site_snapshot: { Args: Record<PropertyKey, never>; Returns: Json };
      purge_closed_property_photos: { Args: { p_days?: number }; Returns: string[] };
      orphan_property_photos: { Args: { p_days?: number }; Returns: string[] };
    };
    Enums: {
      // "role" em admins é texto com check no banco; tipado aqui como união
      team_role: "dono" | "corretor";
      deal_type: "rent" | "sale";
      property_status: "available" | "reserved" | "rented" | "sold";
      property_type:
        | "apartamento"
        | "casa"
        | "cobertura"
        | "kitnet"
        | "sala_comercial"
        | "loja"
        | "galpao"
        | "terreno"
        | "outro";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
