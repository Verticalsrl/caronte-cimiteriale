import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Grid3X3 } from "lucide-react";

const RIGHE = 4;
const COLONNE = 60;

const PIANO_LABELS = ['4° Piano', '3° Piano', '2° Piano', '1° Piano'];

export default function GrigliaLoculi({ defunti = [], onSelectDefunto, selectedDefunto }) {

  const defuntiLoculi = defunti.filter(d => d.tipo_sepoltura === 'loculo');

  const settori = [...new Set(defuntiLoculi.map(d => d.settore).filter(Boolean))].sort();
  const [settoreSelezionato, setSettoreSelezionato] = useState(settori[0] || null);

  const defuntiFiltrati = settoreSelezionato
    ? defuntiLoculi.filter(d => d.settore === settoreSelezionato)
    : defuntiLoculi;

  const getDefunto = (riga, colonna) => {
    return defuntiFiltrati.find(d => {
      if (!d.note) return false;
      const parts = d.note.split('/');
      if (parts.length < 2) return false;
      const c = parseInt(parts[0]);
      const r = parseInt(parts[1]);
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
            {settori.map(s => (
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
        <div className="w-full">
          {/* Header colonne */}
          <div className="flex mb-1">
            <div className="w-20 shrink-0" />
            {Array.from({ length: COLONNE }, (_, i) => (
              <div key={i} className="flex-1 text-center text-xs text-slate-400 font-medium min-w-0">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Righe (piani) */}
          {Array.from({ length: RIGHE }, (_, rigaIdx) => {
            const riga = RIGHE - rigaIdx;
            return (
              <div key={riga} className="flex items-center mb-1">
                <div className="w-20 shrink-0 text-xs text-slate-500 font-medium pr-2 text-right">
                  {PIANO_LABELS[rigaIdx]}
                </div>
                {Array.from({ length: COLONNE }, (_, colIdx) => {
                  const colonna = colIdx + 1;
                  const defunto = getDefunto(riga, colonna);
                  const isSelected = selectedDefunto?.id === defunto?.id;

                  return (
                    <div
                      key={colonna}
                      onClick={() => defunto && onSelectDefunto && onSelectDefunto(defunto)}
                      title={defunto ? `${defunto.cognome} ${defunto.nome}` : `Loculo libero`}
                      className={`flex-1 min-w-0 h-9 mx-px rounded transition-all border
                        ${isSelected
                          ? 'bg-amber-600 border-amber-700 shadow-md scale-105'
                          : defunto
                            ? 'bg-slate-300 border-slate-400 hover:bg-slate-400 hover:scale-105 cursor-pointer'
                            : 'bg-slate-100 border-slate-200'
                        }`}
                    />
                  );
                })}
              </div>
            );
          })}

          {/* Footer colonne */}
          <div className="flex mt-1">
            <div className="w-20 shrink-0" />
            {Array.from({ length: COLONNE }, (_, i) => (
              <div key={i} className="flex-1 text-center text-xs text-slate-300 min-w-0">
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}