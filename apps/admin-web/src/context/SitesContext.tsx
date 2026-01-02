import { createContext, useContext, useState, ReactNode } from 'react';
import type { Site } from '@tong-pass/shared';

// 초기 현장 데이터
const initialSites: Site[] = [
  {
    id: 1,
    name: '통하는사람들 서울본사',
    address: '서울특별시 강남구 테헤란로 123',
    managerName: '김철수',
    managerPhone: '02-1234-5678',
    checkoutPolicy: 'AUTO_8H',
    autoHours: 8,
  },
  {
    id: 2,
    name: '통사 대전공장',
    address: '대전광역시 유성구 대덕대로 456',
    managerName: '박영희',
    managerPhone: '042-987-6543',
    checkoutPolicy: 'MANUAL',
    autoHours: 8,
  },
];

interface SitesContextType {
  sites: Site[];
  selectedSite: Site | null;
  setSites: (sites: Site[]) => void;
  setSelectedSite: (site: Site | null) => void;
  addSite: (site: Site) => void;
  updateSite: (id: number, updates: Partial<Site>) => void;
  deleteSite: (id: number) => void;
}

const SitesContext = createContext<SitesContextType | undefined>(undefined);

export function SitesProvider({ children }: { children: ReactNode }) {
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [selectedSite, setSelectedSite] = useState<Site | null>(initialSites[0] || null);

  const addSite = (site: Site) => {
    setSites((prev) => [...prev, site]);
  };

  const updateSite = (id: number, updates: Partial<Site>) => {
    setSites((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    // 선택된 현장이 업데이트되면 selectedSite도 업데이트
    if (selectedSite?.id === id) {
      setSelectedSite((prev) => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteSite = (id: number) => {
    setSites((prev) => prev.filter((s) => s.id !== id));
    // 삭제된 현장이 선택되어 있었으면 첫 번째 현장으로 변경
    if (selectedSite?.id === id) {
      setSites((prev) => {
        const remaining = prev.filter((s) => s.id !== id);
        setSelectedSite(remaining[0] || null);
        return remaining;
      });
    }
  };

  return (
    <SitesContext.Provider
      value={{
        sites,
        selectedSite,
        setSites,
        setSelectedSite,
        addSite,
        updateSite,
        deleteSite,
      }}
    >
      {children}
    </SitesContext.Provider>
  );
}

export function useSites() {
  const context = useContext(SitesContext);
  if (context === undefined) {
    throw new Error('useSites must be used within a SitesProvider');
  }
  return context;
}
