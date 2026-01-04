import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables, TablesInsert, TablesUpdate } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// 개발 환경에서 환경 변수가 없으면 경고
if (import.meta.env.DEV && (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
  console.warn(
    '⚠️ Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 생성하세요.\n' +
    'VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정해주세요.'
  );
}

export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// 타입 재export
export type { Database, Tables, TablesInsert, TablesUpdate };

// Realtime 구독 헬퍼
export function subscribeToTable<T extends keyof Database['public']['Tables']>(
  table: T,
  callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: Tables<T> | null;
    old: Tables<T> | null;
  }) => void
) {
  return supabase
    .channel(`public:${table}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as Tables<T> | null,
          old: payload.old as Tables<T> | null,
        });
      }
    )
    .subscribe();
}
