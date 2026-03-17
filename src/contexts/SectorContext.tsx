import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SectorId, getSector, SectorConfig } from '@/lib/sectors';

interface SectorContextType {
  sectorId: SectorId | null;
  sector: SectorConfig | null;
  setSectorId: (id: SectorId) => void;
}

const SectorContext = createContext<SectorContextType>({
  sectorId: null,
  sector: null,
  setSectorId: () => {},
});

export const useSector = () => useContext(SectorContext);

export function SectorProvider({ children }: { children: ReactNode }) {
  const [sectorId, setSectorIdState] = useState<SectorId | null>(() => {
    return (localStorage.getItem('occitapro_sector') as SectorId) || null;
  });

  const setSectorId = (id: SectorId) => {
    setSectorIdState(id);
    localStorage.setItem('occitapro_sector', id);
  };

  const sector = sectorId ? getSector(sectorId) : null;

  // Load sector font dynamically
  useEffect(() => {
    if (!sector) return;
    const linkId = `sector-font-${sector.id}`;
    if (document.getElementById(linkId)) return;
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${sector.fontImport}&display=swap`;
    document.head.appendChild(link);
  }, [sector]);

  // Apply sector CSS custom properties
  useEffect(() => {
    if (!sector) {
      document.documentElement.removeAttribute('data-sector');
      return;
    }
    document.documentElement.setAttribute('data-sector', sector.id);
  }, [sector]);

  return (
    <SectorContext.Provider value={{ sectorId, sector, setSectorId }}>
      {children}
    </SectorContext.Provider>
  );
}
