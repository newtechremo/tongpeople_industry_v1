import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Site } from '@tong-pass/shared';
import { useAuth } from './AuthContext';
import { getSites } from '../api/sites';

interface SitesContextType {
  sites: Site[];
  selectedSite: Site | null;
  loading: boolean;
  setSites: (sites: Site[]) => void;
  setSelectedSite: (site: Site | null) => void;
  addSite: (site: Site) => void;
  updateSite: (id: number, updates: Partial<Site>) => void;
  deleteSite: (id: number) => void;
}

const SitesContext = createContext<SitesContextType | undefined>(undefined);

export function SitesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);

  // 사용자의 회사에 속한 현장 목록 로드
  useEffect(() => {
    async function loadSites() {
      if (!user?.companyId) {
        setLoading(false);
        return;
      }

      try {
        const data = await getSites(user.companyId);
        setSites(data);

        // 사용자의 현장을 선택된 현장으로 설정
        if (user.siteId) {
          const userSite = data.find((site) => site.id === user.siteId);
          setSelectedSite(userSite || data[0] || null);
        } else {
          setSelectedSite(data[0] || null);
        }
      } catch (error) {
        console.error('Failed to load sites:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSites();
  }, [user?.companyId, user?.siteId]);

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
        loading,
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
