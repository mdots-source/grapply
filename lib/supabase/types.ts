export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      app_users: {
        Row: {
          id: string;
          auth_user_id: string | null;
          name: string;
          email: string;
          avatar_url: string | null;
          belt: "white" | "blue" | "purple" | "brown" | "black" | null;
          stripes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          name: string;
          email: string;
          avatar_url?: string | null;
          belt?: "white" | "blue" | "purple" | "brown" | "black" | null;
          stripes?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["app_users"]["Insert"]>;
      };
      clubs: {
        Row: {
          id: string;
          slug: string;
          name: string;
          location: string;
          status: "active" | "pending" | "archived";
          member_count: number;
          primary_coach: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          location: string;
          status?: "active" | "pending" | "archived";
          member_count?: number;
          primary_coach: string;
        };
        Update: Partial<Database["public"]["Tables"]["clubs"]["Insert"]>;
      };
      club_memberships: {
        Row: {
          id: string;
          user_id: string;
          club_id: string;
          role: "owner" | "admin" | "coach" | "member";
          invited_by: string | null;
          joined_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          club_id: string;
          role: "owner" | "admin" | "coach" | "member";
          invited_by?: string | null;
          joined_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["club_memberships"]["Insert"]>;
      };
      role_definitions: {
        Row: {
          role: "owner" | "admin" | "coach" | "member";
          label: string;
          description: string;
          permissions: string[];
        };
        Insert: Database["public"]["Tables"]["role_definitions"]["Row"];
        Update: Partial<Database["public"]["Tables"]["role_definitions"]["Insert"]>;
      };
      club_classes: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          coach: string;
          day: string;
          time: string;
          mat: string;
          level: string;
          checked_in: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          name: string;
          coach: string;
          day: string;
          time: string;
          mat: string;
          level: string;
          checked_in?: number;
        };
        Update: Partial<Database["public"]["Tables"]["club_classes"]["Insert"]>;
      };
      strava_connections: {
        Row: {
          id: string;
          user_id: string;
          athlete_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: number;
          scopes: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          athlete_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: number;
          scopes?: string[];
        };
        Update: Partial<Database["public"]["Tables"]["strava_connections"]["Insert"]>;
      };
      academy_members: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          belt: "white" | "blue" | "purple" | "brown" | "black";
          stripes: number;
          role: "member" | "coach";
          status: "active" | "inactive";
          total_hours: number;
          classes_30: number;
          streak: number;
          points: number;
          wins: number;
          losses: number;
          last_seen: string;
          focus: string;
          avatar_url: string | null;
          profile: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          club_id: string;
          name: string;
          belt: "white" | "blue" | "purple" | "brown" | "black";
          stripes?: number;
          role?: "member" | "coach";
          status?: "active" | "inactive";
          total_hours?: number;
          classes_30?: number;
          streak?: number;
          points?: number;
          wins?: number;
          losses?: number;
          last_seen: string;
          focus: string;
          avatar_url?: string | null;
          profile?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["academy_members"]["Insert"]>;
      };
      competitions: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          date_text: string;
          location: string;
          city: string;
          venue: string;
          registered_member_ids: string[];
          registration_deadline: string;
          status: string;
          notes: string;
          type: string;
          prep: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          club_id: string;
          name: string;
          date_text: string;
          location: string;
          city: string;
          venue: string;
          registered_member_ids?: string[];
          registration_deadline: string;
          status: string;
          notes: string;
          type: string;
          prep?: number;
        };
        Update: Partial<Database["public"]["Tables"]["competitions"]["Insert"]>;
      };
      training_camps: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          date_text: string;
          end_date_text: string;
          location: string;
          city: string;
          venue: string;
          host: string;
          focus: string;
          registered_member_ids: string[];
          registration_deadline: string;
          status: string;
          notes: string;
          type: string;
          prep: number;
          spots_total: number;
          estimated_cost: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          club_id: string;
          name: string;
          date_text: string;
          end_date_text: string;
          location: string;
          city: string;
          venue: string;
          host: string;
          focus: string;
          registered_member_ids?: string[];
          registration_deadline: string;
          status: string;
          notes: string;
          type: string;
          prep?: number;
          spots_total?: number;
          estimated_cost: string;
        };
        Update: Partial<Database["public"]["Tables"]["training_camps"]["Insert"]>;
      };
      training_posts: {
        Row: {
          id: string;
          club_id: string;
          type: string;
          pinned: boolean;
          class_name: string | null;
          coach: string;
          date_text: string;
          time_text: string;
          title: string;
          summary: string;
          attendance: number | null;
          top_participant: Json;
          sparring_highlight: string | null;
          achievements: string[] | null;
          tagged_students: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          club_id: string;
          type: string;
          pinned?: boolean;
          class_name?: string | null;
          coach: string;
          date_text: string;
          time_text: string;
          title: string;
          summary: string;
          attendance?: number | null;
          top_participant?: Json;
          sparring_highlight?: string | null;
          achievements?: string[] | null;
          tagged_students?: string[] | null;
        };
        Update: Partial<Database["public"]["Tables"]["training_posts"]["Insert"]>;
      };
      dashboard_events: {
        Row: {
          id: string;
          club_id: string;
          category: string;
          title: string;
          body: string | null;
          actor: string | null;
          meta: Json;
          occurred_at_text: string;
          created_at: string;
        };
        Insert: {
          id: string;
          club_id: string;
          category: string;
          title: string;
          body?: string | null;
          actor?: string | null;
          meta?: Json;
          occurred_at_text: string;
        };
        Update: Partial<Database["public"]["Tables"]["dashboard_events"]["Insert"]>;
      };
      club_settings: {
        Row: {
          club_id: string;
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          club_id: string;
          key: string;
          value?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["club_settings"]["Insert"]>;
      };
      class_checkins: {
        Row: {
          id: string;
          club_id: string;
          class_id: string;
          member_id: string;
          checked_in_by: string | null;
          source: "manual" | "qr" | "kiosk" | "strava";
          checked_in_at: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          club_id: string;
          class_id: string;
          member_id: string;
          checked_in_by?: string | null;
          source?: "manual" | "qr" | "kiosk" | "strava";
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["class_checkins"]["Insert"]>;
      };
      coach_notes: {
        Row: {
          id: string;
          club_id: string;
          member_id: string;
          coach_user_id: string | null;
          coach_name: string;
          body: string;
          visibility: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          member_id: string;
          coach_user_id?: string | null;
          coach_name: string;
          body: string;
          visibility?: string;
        };
        Update: Partial<Database["public"]["Tables"]["coach_notes"]["Insert"]>;
      };
      member_promotions: {
        Row: {
          id: string;
          club_id: string;
          member_id: string;
          awarded_by: string | null;
          awarded_by_name: string;
          type: "stripe" | "belt" | "ranking" | "achievement";
          belt: "white" | "blue" | "purple" | "brown" | "black" | null;
          stripes: number | null;
          detail: string;
          awarded_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          member_id: string;
          awarded_by?: string | null;
          awarded_by_name: string;
          type: "stripe" | "belt" | "ranking" | "achievement";
          belt?: "white" | "blue" | "purple" | "brown" | "black" | null;
          stripes?: number | null;
          detail: string;
        };
        Update: Partial<Database["public"]["Tables"]["member_promotions"]["Insert"]>;
      };
      club_invites: {
        Row: {
          id: string;
          club_id: string;
          email: string;
          role: "owner" | "admin" | "coach" | "member";
          invited_by: string | null;
          status: "pending" | "accepted" | "expired" | "revoked";
          token: string;
          expires_at: string;
          created_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          club_id: string;
          email: string;
          role?: "owner" | "admin" | "coach" | "member";
          invited_by?: string | null;
          status?: "pending" | "accepted" | "expired" | "revoked";
        };
        Update: Partial<Database["public"]["Tables"]["club_invites"]["Insert"]>;
      };
      member_goals: {
        Row: {
          id: string;
          club_id: string;
          member_id: string;
          title: string;
          status: string;
          target_date: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          club_id: string;
          member_id: string;
          title: string;
          status?: string;
          target_date?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["member_goals"]["Insert"]>;
      };
    };
  };
};

export type TableName = keyof Database["public"]["Tables"];
export type TableRow<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type TableInsert<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
