import { supabase, Tables, TablesInsert, TablesUpdate } from '../lib/supabase';

export type Partner = Tables<'partners'>;
export type PartnerInsert = TablesInsert<'partners'>;
export type PartnerUpdate = TablesUpdate<'partners'>;

// 파트너와 근로자 수를 함께 조회할 때 사용
export interface PartnerWithWorkerCount extends Partner {
  workerCount: number;
}

/**
 * 팀(파트너) 목록 조회
 */
export async function getPartners(siteId?: number) {
  let query = supabase
    .from('partners')
    .select('*')
    .order('created_at', { ascending: true });

  if (siteId) {
    query = query.or(`site_id.eq.${siteId},site_id.is.null`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * 팀(파트너) 상세 조회
 */
export async function getPartnerById(id: number) {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * 팀(파트너) 생성
 */
export async function createPartner(partner: PartnerInsert) {
  const { data, error } = await supabase
    .from('partners')
    .insert(partner)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 팀(파트너) 수정
 */
export async function updatePartner(id: number, partner: PartnerUpdate) {
  const { data, error } = await supabase
    .from('partners')
    .update(partner)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 팀(파트너) 삭제
 */
export async function deletePartner(id: number) {
  const { error } = await supabase
    .from('partners')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * 현장별 팀 목록 조회 (근로자 수 포함)
 */
export async function getPartnersWithWorkerCount(siteId: number): Promise<PartnerWithWorkerCount[]> {
  // 팀 목록 조회 (생성 순서대로)
  const { data: partners, error: partnersError } = await supabase
    .from('partners')
    .select('*')
    .or(`site_id.eq.${siteId},site_id.is.null`)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (partnersError) throw partnersError;

  // 각 팀의 근로자 수 조회
  const partnerIds = partners?.map(p => p.id) || [];

  if (partnerIds.length === 0) {
    return [];
  }

  const { data: workerCounts, error: countError } = await supabase
    .from('users')
    .select('partner_id')
    .in('partner_id', partnerIds)
    .eq('is_active', true);

  if (countError) throw countError;

  // 근로자 수 집계
  const countMap = new Map<number, number>();
  workerCounts?.forEach(w => {
    if (w.partner_id) {
      countMap.set(w.partner_id, (countMap.get(w.partner_id) || 0) + 1);
    }
  });

  return partners?.map(p => ({
    ...p,
    workerCount: countMap.get(p.id) || 0,
  })) || [];
}
