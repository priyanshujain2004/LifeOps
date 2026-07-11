export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      locations: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'HOME' | 'OFFICE' | 'SITE';
          address: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'HOME' | 'OFFICE' | 'SITE';
          address?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: 'HOME' | 'OFFICE' | 'SITE';
          address?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      activity_types: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: 'COMMUTE' | 'WORK' | 'BREAK' | 'MEAL' | 'SLEEP' | 'SITE_VISIT' | 'PERSONAL';
          is_paired: boolean;
          pair_label: string | null;
          is_expense_trigger: boolean;
          expense_reimbursable_rule: 'NEVER' | 'ALWAYS' | 'CONDITIONAL';
          reimbursable_conditions: Json;
          icon: string | null;
          color: string | null;
          sort_order: number | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category: 'COMMUTE' | 'WORK' | 'BREAK' | 'MEAL' | 'SLEEP' | 'SITE_VISIT' | 'PERSONAL';
          is_paired?: boolean;
          pair_label?: string | null;
          is_expense_trigger?: boolean;
          expense_reimbursable_rule?: 'NEVER' | 'ALWAYS' | 'CONDITIONAL';
          reimbursable_conditions?: Json;
          icon?: string | null;
          color?: string | null;
          sort_order?: number | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: 'COMMUTE' | 'WORK' | 'BREAK' | 'MEAL' | 'SLEEP' | 'SITE_VISIT' | 'PERSONAL';
          is_paired?: boolean;
          pair_label?: string | null;
          is_expense_trigger?: boolean;
          expense_reimbursable_rule?: 'NEVER' | 'ALWAYS' | 'CONDITIONAL';
          reimbursable_conditions?: Json;
          icon?: string | null;
          color?: string | null;
          sort_order?: number | null;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          trip_type: 'HOME_TO_OFFICE' | 'HOME_TO_SITE' | 'OFFICE_TO_SITE' | 'SITE_TO_SITE' | 'SITE_TO_OFFICE' | 'SITE_TO_HOME' | 'OFFICE_TO_HOME';
          origin_label: string;
          destination_label: string;
          origin_location_id: string | null;
          destination_location_id: string | null;
          departed_at: string;
          arrived_at: string | null;
          status: 'IN_PROGRESS' | 'COMPLETED';
          reimbursable: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          trip_type: 'HOME_TO_OFFICE' | 'HOME_TO_SITE' | 'OFFICE_TO_SITE' | 'SITE_TO_SITE' | 'SITE_TO_OFFICE' | 'SITE_TO_HOME' | 'OFFICE_TO_HOME';
          origin_label: string;
          destination_label: string;
          origin_location_id?: string | null;
          destination_location_id?: string | null;
          departed_at?: string;
          arrived_at?: string | null;
          status?: 'IN_PROGRESS' | 'COMPLETED';
          reimbursable?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          trip_type?: 'HOME_TO_OFFICE' | 'HOME_TO_SITE' | 'OFFICE_TO_SITE' | 'SITE_TO_SITE' | 'SITE_TO_OFFICE' | 'SITE_TO_HOME' | 'OFFICE_TO_HOME';
          origin_label?: string;
          destination_label?: string;
          origin_location_id?: string | null;
          destination_location_id?: string | null;
          departed_at?: string;
          arrived_at?: string | null;
          status?: 'IN_PROGRESS' | 'COMPLETED';
          reimbursable?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trips_origin_location_id_fkey";
            columns: ["origin_location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trips_destination_location_id_fkey";
            columns: ["destination_location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          }
        ];
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          activity_type_id: string;
          logged_at: string;
          notes: string | null;
          location_lat: number | null;
          location_lng: number | null;
          trip_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type_id: string;
          logged_at?: string;
          notes?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          trip_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type_id?: string;
          logged_at?: string;
          notes?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          trip_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_logs_activity_type_id_fkey";
            columns: ["activity_type_id"];
            isOneToOne: false;
            referencedRelation: "activity_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_logs_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          }
        ];
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          trip_id: string | null;
          activity_log_id: string | null;
          category: 'FOOD' | 'TRAVEL' | 'HOTEL' | 'MISC';
          amount: number;
          description: string | null;
          reimbursable: boolean;
          receipt_url: string | null;
          logged_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          trip_id?: string | null;
          activity_log_id?: string | null;
          category: 'FOOD' | 'TRAVEL' | 'HOTEL' | 'MISC';
          amount: number;
          description?: string | null;
          reimbursable?: boolean;
          receipt_url?: string | null;
          logged_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          trip_id?: string | null;
          activity_log_id?: string | null;
          category?: 'FOOD' | 'TRAVEL' | 'HOTEL' | 'MISC';
          amount?: number;
          description?: string | null;
          reimbursable?: boolean;
          receipt_url?: string | null;
          logged_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_activity_log_id_fkey";
            columns: ["activity_log_id"];
            isOneToOne: false;
            referencedRelation: "activity_logs";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      seed_user_defaults: {
        Args: {
          target_user_id: string;
        };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
