import { supabase, Tables, TablesInsert, TablesUpdate } from '../lib/supabase';

export type Site = Tables<'sites'>;
export type SiteInsert = TablesInsert<'sites'>;
export type SiteUpdate = TablesUpdate<'sites'>;

/**
 * 현장 목록 조회
 */
export async function getSites() {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

/**
 * 현장 상세 조회
 */
export async function getSiteById(id: number) {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * 현장 생성
 */
export async function createSite(site: SiteInsert) {
  const { data, error } = await supabase
    .from('sites')
    .insert(site)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 현장 수정
 */
export async function updateSite(id: number, site: SiteUpdate) {
  const { data, error } = await supabase
    .from('sites')
    .update(site)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 현장 삭제
 */
export async function deleteSite(id: number) {
  const { error } = await supabase
    .from('sites')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
