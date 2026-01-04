/**
 * Supabase Database 타입 정의
 * 이 파일은 supabase gen types typescript 명령으로 자동 생성할 수 있습니다.
 * 현재는 수동으로 정의합니다.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CheckoutPolicy = 'AUTO_8H' | 'MANUAL';
export type UserRole = 'SUPER_ADMIN' | 'SITE_ADMIN' | 'TEAM_ADMIN' | 'WORKER';

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: number;
          name: string;
          business_number: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          business_number?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          business_number?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sites: {
        Row: {
          id: number;
          company_id: number;
          name: string;
          address: string | null;
          checkout_policy: CheckoutPolicy;
          auto_hours: number;
          work_day_start_hour: number;
          senior_age_threshold: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          company_id: number;
          name: string;
          address?: string | null;
          checkout_policy?: CheckoutPolicy;
          auto_hours?: number;
          work_day_start_hour?: number;
          senior_age_threshold?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          company_id?: number;
          name?: string;
          address?: string | null;
          checkout_policy?: CheckoutPolicy;
          auto_hours?: number;
          work_day_start_hour?: number;
          senior_age_threshold?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sites_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          }
        ];
      };
      partners: {
        Row: {
          id: number;
          company_id: number;
          site_id: number | null;
          name: string;
          contact_name: string | null;
          contact_phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          company_id: number;
          site_id?: number | null;
          name: string;
          contact_name?: string | null;
          contact_phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          company_id?: number;
          site_id?: number | null;
          name?: string;
          contact_name?: string | null;
          contact_phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'partners_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'partners_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          }
        ];
      };
      users: {
        Row: {
          id: string;
          company_id: number | null;
          site_id: number | null;
          partner_id: number | null;
          name: string;
          phone: string | null;
          birth_date: string | null;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          company_id?: number | null;
          site_id?: number | null;
          partner_id?: number | null;
          name: string;
          phone?: string | null;
          birth_date?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: number | null;
          site_id?: number | null;
          partner_id?: number | null;
          name?: string;
          phone?: string | null;
          birth_date?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'users_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'users_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'users_partner_id_fkey';
            columns: ['partner_id'];
            isOneToOne: false;
            referencedRelation: 'partners';
            referencedColumns: ['id'];
          }
        ];
      };
      attendance: {
        Row: {
          id: number;
          work_date: string;
          site_id: number;
          partner_id: number | null;
          user_id: string;
          worker_name: string;
          role: UserRole;
          birth_date: string | null;
          age: number | null;
          is_senior: boolean;
          check_in_time: string | null;
          check_out_time: string | null;
          is_auto_out: boolean;
          has_accident: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          work_date: string;
          site_id: number;
          partner_id?: number | null;
          user_id: string;
          worker_name: string;
          role: UserRole;
          birth_date?: string | null;
          age?: number | null;
          is_senior?: boolean;
          check_in_time?: string | null;
          check_out_time?: string | null;
          is_auto_out?: boolean;
          has_accident?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          work_date?: string;
          site_id?: number;
          partner_id?: number | null;
          user_id?: string;
          worker_name?: string;
          role?: UserRole;
          birth_date?: string | null;
          age?: number | null;
          is_senior?: boolean;
          check_in_time?: string | null;
          check_out_time?: string | null;
          is_auto_out?: boolean;
          has_accident?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'attendance_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'attendance_partner_id_fkey';
            columns: ['partner_id'];
            isOneToOne: false;
            referencedRelation: 'partners';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'attendance_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      client_profiles: {
        Row: {
          id: number;
          company_id: number;
          biz_num: string;
          biz_file_url: string | null;
          industry_code: string | null;
          admin_info: Json;
          billing_info: Json;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          company_id: number;
          biz_num: string;
          biz_file_url?: string | null;
          industry_code?: string | null;
          admin_info?: Json;
          billing_info?: Json;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          company_id?: number;
          biz_num?: string;
          biz_file_url?: string | null;
          industry_code?: string | null;
          admin_info?: Json;
          billing_info?: Json;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'client_profiles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: true;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {};
    Functions: {
      get_user_company_id: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_user_site_id: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_user_partner_id: {
        Args: Record<string, never>;
        Returns: number;
      };
      is_super_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_site_admin_or_above: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_team_admin_or_above: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      calculate_age: {
        Args: { birth_date: string; base_date?: string };
        Returns: number;
      };
      get_work_date: {
        Args: { check_time: string; start_hour?: number };
        Returns: string;
      };
    };
    Enums: {
      checkout_policy: CheckoutPolicy;
      user_role: UserRole;
    };
    CompositeTypes: {};
  };
};

// 헬퍼 타입
type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
      PublicSchema['Views'])
  ? (PublicSchema['Tables'] &
      PublicSchema['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;
