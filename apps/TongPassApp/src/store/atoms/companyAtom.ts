import {atom} from 'recoil';
import {Company, Site, Team} from '@/types/company';

export const selectedCompanyState = atom<Company | null>({
  key: 'selectedCompanyState',
  default: null,
});

export const selectedSiteState = atom<Site | null>({
  key: 'selectedSiteState',
  default: null,
});

export const teamsState = atom<Team[]>({
  key: 'teamsState',
  default: [],
});
