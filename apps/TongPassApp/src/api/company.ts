/**
 * 회사 관련 API
 * - 참여 회사 목록 조회
 */

import api from './client';
import {ApiError} from '@/types/api';

// ==================== 응답 타입 ====================

export interface CompanyWithSite {
  id: string;
  name: string;
  code: string;
  logo?: string;
  site: {
    id: string;
    name: string;
    address: string;
  };
  joinedAt?: string; // ISO 8601 형식
  role?: string; // WORKER, TEAM_ADMIN 등
}

// ==================== API 함수 ====================

/**
 * 참여 회사 목록 조회
 * - 로그인된 근로자가 참여한 모든 회사 목록을 조회
 */
export async function getMyCompanies(): Promise<CompanyWithSite[]> {
  try {
    const response = await api.get<{
      success: boolean;
      data: CompanyWithSite[];
    }>('/worker-companies');

    // 응답 검증
    if (!response.data?.success) {
      throw new ApiError('SERVER_ERROR', '회사 목록을 불러올 수 없습니다.');
    }

    return response.data.data || [];
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // 개발 환경에서는 목업 데이터 반환
    if (__DEV__) {
      console.warn('[company.ts] getMyCompanies error, returning mock data:', error);
      return getMockCompanies();
    }

    throw new ApiError('SERVER_ERROR', '회사 목록 조회에 실패했습니다.');
  }
}

/**
 * 목업 데이터 (개발용)
 */
function getMockCompanies(): CompanyWithSite[] {
  return [
    {
      id: 'company-1',
      name: '(주)통피플',
      code: 'TONG001',
      site: {
        id: 'site-1',
        name: '대전 본사',
        address: '대전광역시 유성구 테크노로 123',
      },
      joinedAt: '2024-01-15T09:00:00Z',
      role: 'WORKER',
    },
    {
      id: 'company-2',
      name: '삼성전자',
      code: 'SEC001',
      site: {
        id: 'site-2',
        name: '기흥캠퍼스',
        address: '경기도 용인시 기흥구 삼성로 1',
      },
      joinedAt: '2024-03-01T09:00:00Z',
      role: 'WORKER',
    },
  ];
}
