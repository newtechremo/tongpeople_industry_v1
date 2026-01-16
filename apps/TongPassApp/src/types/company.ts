export interface Company {
  id: string;
  name: string;
  code: string;
  logo?: string;
}

export interface Site {
  id: string;
  name: string;
  address: string;
  companyId: string;
}

export interface Team {
  id: string;
  name: string;
  siteId: string;
}
