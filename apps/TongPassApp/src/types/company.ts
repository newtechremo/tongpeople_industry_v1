export interface Company {
  id: string;
  name: string;
  code?: string;
  logo?: string;
  address?: string;
}

export interface Site {
  id: string;
  name: string;
  address?: string;
  companyId?: string; // 프론트엔드에서 설정 가능
  partners?: Team[]; // 백엔드 verify-company-code 응답
}

export interface Team {
  id: string;
  name: string;
  siteId?: string;
  contactName?: string;
  contactPhone?: string;
}
