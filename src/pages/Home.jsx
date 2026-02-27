import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import SearchBar from '@/components/cemetery/SearchBar';
import DefuntoCard from '@/components/cemetery/DefuntoCard';
import DefuntoDetail from '@/components/cemetery/DefuntoDetail';
import CemeteryMap from '@/components/cemetery/CemeteryMap';
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Flower2, Search, MapPin, Users } from "lucide-react";

export default function Home() {
  const [searchParams, setSearchParams] = useState({ searchText: '', settore: '' });
  const [selectedDefunto, setSelectedDefunto] = useState(null);
  const [geojsonData, setGeojsonData] = useState(null);

  // Fetch defunti
  const { data: defunti = [], isLoading: loadingDefunti } = useQuery({
    queryKey: ['defunti'],
    queryFn: () => base44.entities.Defunto.list('-cognome'),
  });

  // Fetch impostazioni
  const { data: impostazioni = [] } = useQuery({
    queryKey: ['impostazioni'],
    queryFn: () => base44.entities.Impostazioni.list(),
  });

  const settings = impostazioni[0] || {};

  // Load GeoJSON
  useEffect(() => {
    if (settings.geojson_url) {
      fetch(settings.geojson_url)
        .then(res => res.json())
        .then(setGeojsonData)
        .catch(console.error);
    }
  }, [settings.geojson_url]);

  // Get unique settori
  const settori = useMemo(() => {
    const unique = [...new Set(defunti.map(d => d.settore).filter(Boolean))];
    return unique.sort();
  }, [defunti]);

  // Filter defunti
  const filteredDefunti = useMemo(() => {
    return defunti.filter(d => {
      const searchLower = searchParams.searchText.toLowerCase();
      const matchesText = !searchParams.searchText || 
        d.nome?.toLowerCase().includes(searchLower) ||
        d.cognome?.toLowerCase().includes(searchLower);
      const matchesSettore = !searchParams.settore || searchParams.settore === 'all' || 
        d.settore === searchParams.settore;
      return matchesText && matchesSettore;
    });
  }, [defunti, searchParams]);

  const handleLocate = (defunto) => {
    setSelectedDefunto(defunto);
  };

  const mapCenter = settings.centro_mappa_lat && settings.centro_mappa_lng
    ? [settings.centro_mappa_lat, settings.centro_mappa_lng]
    : [41.9028, 12.4964];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
              <Flower2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-light tracking-wide">
                {settings.nome_cimitero || 'Anagrafe Cimiteriale'}
              </h1>
              {settings.indirizzo && (
                <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {settings.indirizzo}
                </p>
              )}
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="h-4 w-4 text-amber-400" />
              <span>{defunti.length} registrazioni</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="h-4 w-4 text-amber-400" />
              <span>{settori.length} settori</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Search */}
        <div className="mb-6 -mt-8 relative z-10">
          <SearchBar onSearch={setSearchParams} settori={settori} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <div className="order-1 lg:order-2">
            <CemeteryMap
              geojsonData={geojsonData}
              defunti={filteredDefunti}
              selectedDefunto={selectedDefunto}
              center={mapCenter}
              zoom={settings.zoom_default || 18}
            />
          </div>

          {/* Results */}
          <div className="order-2 lg:order-1">
            {selectedDefunto ? (
              <DefuntoDetail
                defunto={selectedDefunto}
                onClose={() => setSelectedDefunto(null)}
                onLocate={handleLocate}
              />
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="font-medium text-slate-800 flex items-center gap-2">
                    <Search className="h-4 w-4 text-amber-500" />
                    Risultati ricerca
                  </h2>
                  <span className="text-sm text-slate-500">
                    {filteredDefunti.length} trovati
                  </span>
                </div>

                <ScrollArea className="h-[450px] md:h-[500px]">
                  <div className="p-4 space-y-3">
                    {loadingDefunti ? (
                      Array(5).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                      ))
                    ) : filteredDefunti.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>Nessun risultato trovato</p>
                        <p className="text-sm mt-1">Prova a modificare i criteri di ricerca</p>
                      </div>
                    ) : (
                      filteredDefunti.map(defunto => (
                        <div key={defunto.id} onClick={() => setSelectedDefunto(defunto)}>
                          <DefuntoCard
                            defunto={defunto}
                            onLocate={handleLocate}
                            isSelected={selectedDefunto?.id === defunto.id}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-400">
          <p>Sistema di Anagrafe Cimiteriale</p>
        </div>
      </footer>
    </div>
  );
}