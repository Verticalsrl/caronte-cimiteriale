import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar } from "lucide-react";
import { formatDate, calcAge } from '@/utils/defunto';

const tipoSepolturaBadge = {
  loculo: { label: 'Loculo', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  cappella: { label: 'Cappella', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  terra: { label: 'Terra', color: 'bg-green-100 text-green-800 border-green-200' },
  ossario: { label: 'Ossario', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  cinerario: { label: 'Cinerario', color: 'bg-slate-100 text-slate-800 border-slate-200' },
};

export default function DefuntoCard({ defunto, onLocate, isSelected }) {
  const age = calcAge(defunto.data_nascita, defunto.data_morte);
  const tipo = tipoSepolturaBadge[defunto.tipo_sepoltura] || tipoSepolturaBadge.loculo;

  return (
    <Card className={`
      transition-all duration-300 hover:shadow-lg cursor-pointer border-0
      ${isSelected 
        ? 'ring-2 ring-amber-500 shadow-lg bg-amber-50/50' 
        : 'bg-white/80 hover:bg-white shadow-sm'
      }
    `}>
      <CardContent className="p-4 md:p-5">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-lg truncate">
              {defunto.cognome} {defunto.nome}
            </h3>
            
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(defunto.data_nascita)}</span>
              </div>
              <span className="text-slate-300">—</span>
              <span>{formatDate(defunto.data_morte)}</span>
              {age && (
                <span className="text-slate-400 text-xs">({age} anni)</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge variant="outline" className={`${tipo.color} border text-xs font-medium`}>
                {tipo.label}
              </Badge>
              {defunto.settore && (
                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-xs">
                  Sett. {defunto.settore} {defunto.fila && `- Fila ${defunto.fila}`} {defunto.numero && `- N° ${defunto.numero}`}
                </Badge>
              )}
            </div>
          </div>

          {(defunto.coordinate_lat && defunto.coordinate_lng) && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onLocate(defunto);
              }}
              className="shrink-0 h-9 w-9 p-0 border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          )}
        </div>

        {defunto.note && (
          <p className="mt-3 text-sm text-slate-500 line-clamp-2 italic">
            {defunto.note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}