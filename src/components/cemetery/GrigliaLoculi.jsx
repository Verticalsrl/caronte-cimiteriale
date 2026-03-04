import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Grid3X3 } from "lucide-react";

const RIGHE = 4;
const COLONNE = 15;

const PIANO_LABELS = ['4° Piano', '3° Piano', '2° Piano', '1° Piano'];

export default function GrigliaLoculi({ defunti = [], onSelectDefunto, selectedDefunto, settoreFiltro }) {

  const defuntiLoculi = defunti.filter(d => d.tipo_sepoltura === 'loculo');

  const getDefunto = (riga, colonna) => {
    return defuntiLoculi.find(d => {
      const r = parseInt(d.fila);
      const c = parseInt(d.numero);
      return r === riga && c === colonna;
    });
  };

  const settori = [...new Set(defuntiLoculi.map(d => d.settore).filter(Boolean))].sort();

  const [settoreSelezionato, setSettoreSelezionato] = useState(settoreFiltro || settori[0] || null);

  const defuntiFiltrati = settoreSelezionato
    ? defuntiLoculi.filter(d => d.settore === settoreSelezionato)
    : defuntiLoculi;

  const getDefuntoFiltrato = (riga, colonna) => {
    return defuntiFiltrati.find(d => {
      const r = parseInt(d.fila);
      const c = parseInt(d.numero);
      return r === riga && c === colonna;
    });
  };

  const totalOccupati = defuntiFiltrati.filter(d => {
    const r = parseInt(d.fila);
    const c = parseInt(d.numero);
    return r >= 1 && r <= RIGHE && c >= 1 && c <= COLONNE;
  }).length;

  return (
    <Card className="border-0 shadow-lg mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Grid3X3 className="h-4 w-4 text-amber-500" />
            Griglia Loculi
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {settori.length > 0 && settori.map(s => (
              <button
                key={s}
                onClick={() => setSettoreSelezionato(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  settoreSelezionato === s
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                }`}
              >
                {s}
              </button>
            ))}
            <Badge variant="outline" className="text-xs">
              {totalOccupati}/{RIGHE * COLONNE} occupati
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Legenda */}
        <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded bg-amber-400 inline-block" />
            Occupato
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded bg-slate-100 border border-slate-200 inline-block" />
            Libero
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded bg-amber-600 inline-block" />
            Selezionato
          </span>
        </div>

        {/* Griglia */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header colonne */}
            <div className="flex mb-1">
              <div className="w-24 shrink-0" />
              {Array.from({ length: COLONNE }, (_, i) => (
                <div key={i} className="w-10 shrink-0 text-center text-xs text-slate-400 font-medium">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Righe (piani) — mostrate dal piano più alto in cima */}
            {Array.from({ length: RIGHE }, (_, rigaIdx) => {
              const riga = RIGHE - rigaIdx; // 4, 3, 2, 1
              return (
                <div key={riga} className="flex items-center mb-1">
                  {/* Label piano */}
                  <div className="w-24 shrink-0 text-xs text-slate-500 font-medium pr-2 text-right">
                    {PIANO_LABELS[rigaIdx]}
                  </div>

                  {/* Celle */}
                  {Array.from({ length: COLONNE }, (_, colIdx) => {
                    const colonna = colIdx + 1;
                    const defunto = getDefuntoFiltrato(riga, colonna);
                    const isSelected = selectedDefunto?.id === defunto?.id;

                    return (
                      <div
                        key={colonna}
                        onClick={() => defunto && onSelectDefunto && onSelectDefunto(defunto)}
                        title={defunto ? `${defunto.cognome} ${defunto.nome}` : `Loculo ${riga}-${colonna} libero`}
                        className={`w-10 h-9 shrink-0 mx-0.5 rounded flex items-center justify-center cursor-pointer transition-all border text-xs font-bold
                          ${isSelected
                            ? 'bg-amber-600 border-amber-700 text-white shadow-md scale-105'
                            : defunto
                              ? 'bg-amber-400 border-amber-500 text-amber-900 hover:bg-amber-500 hover:scale-105'
                              : 'bg-slate-100 border-slate-200 text-slate-300 hover:bg-slate-200 cursor-default'
                          }`}
                      >
                        {defunto ? (defunto.cognome?.charAt(0) || '?') : ''}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Numero colonna in fondo ripetuto */}
        <div className="flex mt-1 ml-24">
          {Array.from({ length: COLONNE }, (_, i) => (
            <div key={i} className="w-10 mx-0.5 shrink-0 text-center text-xs text-slate-300">
              {i + 1}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}