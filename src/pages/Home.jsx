import React, { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import SearchBar from '@/components/cemetery/SearchBar';
import DefuntoCard from '@/components/cemetery/DefuntoCard';
import DefuntoDetail from '@/components/cemetery/DefuntoDetail';
import CemeteryMap from '@/components/cemetery/CemeteryMap';
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Flower2, Search, MapPin, Users, ChevronRight, ArrowLeft, TreePine, FileDown, X } from "lucide-react";
import GrigliaLoculi from '@/components/cemetery/GrigliaLoculi';

const MAPPA_PDF_URL = "https://www.cimitericapitolini.it/public/files/cimiteri-di-roma/elenco-cimiteri/Mappa_Laurentino.pdf";

export default function Home() {
  const [selectedCimitero, setSelectedCimitero] = useState(null);
  const [searchParams, setSearchParams] = useState({ searchText: '', settore: '' });
  const [selectedDefunto, setSelectedDefunto] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');

  // Fetch cimiteri
  const { data: cimiteri = [], isLoading: loadingCimiteri } = useQuery({
    queryKey: ['cimiteri'],
    queryFn: () => base44.entities.Cimitero.list('nome'),
  });

  // Fetch tutti i defunti per la ricerca globale
  const { data: tuttiDefunti = [], isLoading: loadingGlobal } = useQuery({
    queryKey: ['defunti-global'],
    queryFn: () => base44.entities.Defunto.list('cognome', 10000),
    enabled: globalSearch.length >= 2,
  });

  const globalResults = useMemo(() => {
    if (globalSearch.length < 2) return [];
    const q = globalSearch.toLowerCase();
    return tuttiDefunti.filter(d =>
      d.nome?.toLowerCase().includes(q) || d.cognome?.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [tuttiDefunti, globalSearch]);

  // Fetch defunti del cimitero selezionato
  const { data: defunti = [], isLoading: loadingDefunti } = useQuery({
    queryKey: ['defunti', selectedCimitero?.id],
    queryFn: () => base44.entities.Defunto.filter({ cimitero_id: selectedCimitero.id }, '-cognome', 10000),
    enabled: !!selectedCimitero,
  });

  // Fetch GeoJSON tramite React Query per gestione errori e caching
  const { data: geojsonData = null } = useQuery({
    queryKey: ['geojson', selectedCimitero?.id],
    queryFn: async () => {
      const res = await fetch(selectedCimitero.geojson_url);
      if (!res.ok) throw new Error(`GeoJSON non disponibile (${res.status})`);
      return res.json();
    },
    enabled: !!selectedCimitero?.geojson_url,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Reset ricerca solo quando si CAMBIA cimitero (non al primo accesso da ricerca globale)
  const prevCimiteroId = useRef(null);
  useEffect(() => {
    if (prevCimiteroId.current !== null && prevCimiteroId.current !== selectedCimitero?.id) {
      setSelectedDefunto(null);
      setSearchParams({ searchText: '', settore: '' });
    }
    prevCimiteroId.current = selectedCimitero?.id ?? null;
  }, [selectedCimitero?.id]);

  // Get unique settori
  const settori = useMemo(() => {
    const unique = [...new Set(defunti.map(d => d.settore).filter(Boolean))];
    return unique.sort();
  }, [defunti]);

  // Filter defunti
  // Chiudi il dettaglio quando parte una nuova ricerca
  const handleSearch = (params) => {
    setSelectedDefunto(null);
    setSearchParams(params);
  };

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

  const mapCenter = selectedCimitero?.centro_mappa_lat && selectedCimitero?.centro_mappa_lng
    ? [selectedCimitero.centro_mappa_lat, selectedCimitero.centro_mappa_lng]
    : [41.9028, 12.4964];

  // ── VISTA LISTA CIMITERI ──────────────────────────────────────────
  if (!selectedCimitero) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-slate-100">
        {/* Header */}
        <header className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white">
          <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-14 w-14 flex items-center justify-center">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a1b4d9acc7322885902155/103cfcb77_image.png" alt="Logo" className="h-14 w-14 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-light tracking-wide">
                  Anagrafe Cimiteriale
                </h1>
                <p className="text-slate-400 text-sm md:text-base mt-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Cimiteri Capitolini – Comune di Roma
                </p>
              </div>
            </div>
            <p className="text-slate-400 mt-6 max-w-xl text-sm">
              Seleziona un cimitero per consultare l'anagrafe e localizzare le sepolture sulla mappa interattiva.
            </p>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-10">

          {/* Ricerca globale */}
          <div className="mb-10 -mt-6 relative z-10">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-4 md:p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cerca un defunto in tutti i cimiteri..."
                  value={globalSearch}
                  onChange={e => setGlobalSearch(e.target.value)}
                  className="pl-12 h-12 text-base border-slate-200 focus:border-amber-500 rounded-xl"
                />
                {globalSearch && (
                  <button onClick={() => setGlobalSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {globalSearch.length >= 2 && (
                <div className="mt-3 border border-slate-100 rounded-xl overflow-hidden">
                  {loadingGlobal ? (
                    <div className="p-4 text-sm text-slate-400">Ricerca in corso...</div>
                  ) : globalResults.length === 0 ? (
                    <div className="p-4 text-sm text-slate-400">Nessun risultato trovato</div>
                  ) : (
                    <ScrollArea className="max-h-72">
                      {globalResults.map(d => {
                        const cimitero = cimiteri.find(c => c.id === d.cimitero_id);
                        return (
                          <button
                            key={d.id}
                            onClick={() => { setSelectedCimitero(cimitero || null); setSelectedDefunto(d); }}
                            className="w-full text-left px-4 py-3 hover:bg-amber-50 border-b border-slate-100 last:border-0 transition-colors"
                          >
                            <div className="font-medium text-slate-800">{d.cognome} {d.nome}</div>
                            <div className="text-xs text-slate-400 mt-0.5 flex gap-3">
                              {cimitero && <span>{cimitero.nome}</span>}
                              {d.settore && <span>Sett. {d.settore}</span>}
                              {d.data_morte && <span>† {d.data_morte}</span>}
                            </div>
                          </button>
                        );
                      })}
                    </ScrollArea>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cimiteri maggiori */}
          <section className="mb-10">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Cimiteri Maggiori
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {loadingCimiteri
                ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
                : cimiteri.filter(c => c.tipo === 'maggiore' && c.attivo !== false).map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCimitero(c)}
                    className="group text-left bg-white rounded-2xl shadow-md hover:shadow-xl border border-slate-100 hover:border-amber-200 p-6 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                        <TreePine className="h-5 w-5 text-amber-600" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-amber-500 transition-colors" />
                    </div>
                    <h3 className="font-semibold text-slate-800 group-hover:text-slate-900 leading-tight">
                      {c.nome}
                    </h3>
                    {c.indirizzo && (
                      <p className="text-sm text-slate-400 mt-1 truncate">{c.indirizzo}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">Maggiore</Badge>
                        {c.estensione_ha && (
                          <span className="text-xs text-slate-400">{c.estensione_ha} ha</span>
                        )}
                      </div>
                      <a
                        href={MAPPA_PDF_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        Mappa
                      </a>
                    </div>
                  </button>
                ))
              }
            </div>
          </section>

          {/* Cimiteri minori */}
          <section>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Cimiteri Minori
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {loadingCimiteri
                ? Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
                : cimiteri.filter(c => c.tipo === 'minore' && c.attivo !== false).map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCimitero(c)}
                    className="group text-left bg-white rounded-xl shadow-sm hover:shadow-lg border border-slate-100 hover:border-slate-300 p-4 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 group-hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <Flower2 className="h-4 w-4 text-slate-500" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                    </div>
                    <h3 className="font-medium text-slate-700 group-hover:text-slate-900 mt-2 text-sm leading-snug">
                      {c.nome}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      {c.zona && <p className="text-xs text-slate-400">{c.zona}</p>}
                      <a
                        href={MAPPA_PDF_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-amber-700 font-medium ml-auto"
                      >
                        <FileDown className="h-3 w-3" />
                        Mappa
                      </a>
                    </div>
                  </button>
                ))
              }
            </div>
          </section>

          {/* Empty state */}
          {!loadingCimiteri && cimiteri.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <Flower2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Nessun cimitero configurato</p>
              <p className="text-sm mt-1">Aggiungi i cimiteri dal pannello di amministrazione</p>
            </div>
          )}
        </main>

        <footer className="mt-8 py-6 border-t border-slate-200 bg-white/50">
          <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-400">
            Cimiteri Capitolini – Comune di Roma
          </div>
        </footer>
      </div>
    );
  }

  // ── VISTA CIMITERO SELEZIONATO ────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          <button
            onClick={() => setSelectedCimitero(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Tutti i cimiteri
          </button>

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a1b4d9acc7322885902155/103cfcb77_image.png" alt="Logo" className="h-12 w-12 object-contain" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-light tracking-wide">
                {selectedCimitero.nome}
              </h1>
              {selectedCimitero.indirizzo && (
                <p className="text-slate-400 text-sm flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {selectedCimitero.indirizzo}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="h-4 w-4 text-amber-400" />
              <span>{defunti.length} registrazioni</span>
            </div>
            {settori.length > 0 && (
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="h-4 w-4 text-amber-400" />
                <span>{settori.length} settori</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Search */}
        <div className="mb-6 -mt-8 relative z-10">
          <SearchBar onSearch={handleSearch} settori={settori} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <div className="order-1 lg:order-2">
            <CemeteryMap
              geojsonData={geojsonData}
              defunti={filteredDefunti}
              selectedDefunto={selectedDefunto}
              center={mapCenter}
              zoom={selectedCimitero?.zoom_default || 18}
            />
          </div>

          {/* Results */}
          <div className="order-2 lg:order-1">
            {selectedDefunto ? (
              <DefuntoDetail
                defunto={selectedDefunto}
                onClose={() => setSelectedDefunto(null)}
                onLocate={setSelectedDefunto}
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
                            onLocate={setSelectedDefunto}
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

        {/* Griglia Loculi - full width */}
        <GrigliaLoculi
          defunti={filteredDefunti}
          selectedDefunto={selectedDefunto}
          onSelectDefunto={setSelectedDefunto}
        />
      </main>

      <footer className="mt-12 py-6 border-t border-slate-200 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-400">
          {selectedCimitero.nome} – Cimiteri Capitolini Roma
        </div>
      </footer>
    </div>
  );
}