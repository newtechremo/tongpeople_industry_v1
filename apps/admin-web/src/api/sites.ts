import { supabase, Tables, TablesInsert, TablesUpdate } from '../lib/supabase';
import type { Site } from '@tong-pass/shared';

type SiteRow = Tables<'sites'>;
export type SiteInsert = TablesInsert<'sites'>;
export type SiteUpdate = TablesUpdate<'sites'>;

/**
 * Supabase의 snake_case를 shared의 camelCase로 변환
 */
function toSite(row: SiteRow): Site {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    address: row.address || undefined,
    checkoutPolicy: row.checkout_policy,
    autoHours: row.auto_hours,
    workDayStartHour: row.work_day_start_hour,
    seniorAgeThreshold: row.senior_age_threshold,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * 현장 목록 조회
 */
export async function getSites(companyId?: number): Promise<Site[]> {
  let query = supabase
    .from('sites')
    .select('*');

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query.order('name');

  if (error) throw error;
  return data.map(toSite);
}

/**
 * 현장 상세 조회
 */
export async function getSiteById(id: number): Promise<Site> {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return toSite(data);
}

/**
 * 현장 생성
 */
export async function createSite(site: Partial<Site> & { companyId: number; name: string }): Promise<Site> {
  const row: SiteInsert = {
    company_id: site.companyId,
    name: site.name,
    address: site.address || null,
    checkout_policy: site.checkoutPolicy || 'AUTO_8H',
    auto_hours: site.autoHours || 8,
    work_day_start_hour: site.workDayStartHour || 4,
    senior_age_threshold: site.seniorAgeThreshold || 65,
    is_active: site.isActive !== undefined ? site.isActive : true,
  };

  const { data, error } = await supabase
    .from('sites')
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return toSite(data);
}

/**
 * 현장 수정
 */
export async function updateSite(id: number, site: Partial<Site>): Promise<Site> {
  const row: SiteUpdate = {};

  if (site.name !== undefined) row.name = site.name;
  if (site.address !== undefined) row.address = site.address || null;
  if (site.checkoutPolicy !== undefined) row.checkout_policy = site.checkoutPolicy;
  if (site.autoHours !== undefined) row.auto_hours = site.autoHours;
  if (site.workDayStartHour !== undefined) row.work_day_start_hour = site.workDayStartHour;
  if (site.seniorAgeThreshold !== undefined) row.senior_age_threshold = site.seniorAgeThreshold;
  if (site.isActive !== undefined) row.is_active = site.isActive;

  const { data, error } = await supabase
    .from('sites')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toSite(data);
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
