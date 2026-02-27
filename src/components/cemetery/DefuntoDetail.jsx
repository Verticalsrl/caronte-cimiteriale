import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X, MapPin, Calendar, User, Home, FileText, Flower2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const tipoLabels = {
  loculo: 'Loculo',
  cappella: 'Cappella Gentilizia',
  terra: 'Sepoltura a Terra',
  ossario: 'Ossario',
  cinerario: 'Cinerario'
};

export default function DefuntoDetail({ defunto, onClose, onLocate }) {
  if (!defunto) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Non disponibile';
    try {
      return format(new Date(dateStr), 'd MMMM yyyy', { locale: it });
    } catch {
      return dateStr;
    }
  };

  const calcAge = () => {
    if (!defunto.data_nascita || !defunto.data_morte) return null;
    const birth = new Date(defunto.data_nascita);
    const death = new Date(defunto.data_morte);
    return Math.floor((death - birth) / (365.25 * 24 * 60 * 60 * 1000));
  };

  const age = calcAge();

  return (
    <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-slate-800 to-slate-900 text-white pb-8 relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-3 right-3 text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
            <Flower2 className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-2xl font-light tracking-wide">
              {defunto.cognome}
            </CardTitle>
            <p className="text-xl text-white/80">{defunto.nome}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-white/70">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(defunto.data_nascita)}</span>
          <span className="mx-1">—</span>
          <span>{formatDate(defunto.data_morte)}</span>
          {age && <span className="ml-2 text-amber-400">({age} anni)</span>}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Posizione */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            Posizione
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Settore</p>
              <p className="text-lg font-semibold text-slate-800">{defunto.settore || '-'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Fila</p>
              <p className="text-lg font-semibold text-slate-800">{defunto.fila || '-'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Numero</p>
              <p className="text-lg font-semibold text-slate-800">{defunto.numero || '-'}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Informazioni */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            Informazioni
          </h4>
          
          <div className="space-y-2">
            {defunto.luogo_nascita && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Luogo di nascita</span>
                <span className="text-slate-800 font-medium">{defunto.luogo_nascita}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tipo sepoltura</span>
              <Badge variant="outline" className="bg-slate-50">
                {tipoLabels[defunto.tipo_sepoltura] || 'Non specificato'}
              </Badge>
            </div>
          </div>
        </div>

        {defunto.note && (
          <>
            <Separator />
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Note
              </h4>
              <p className="text-sm text-slate-600 italic">{defunto.note}</p>
            </div>
          </>
        )}

        {defunto.foto_url && (
          <>
            <Separator />
            <div>
              <img 
                src={defunto.foto_url} 
                alt="Foto sepoltura"
                className="w-full h-48 object-cover rounded-xl"
              />
            </div>
          </>
        )}

        {(defunto.coordinate_lat && defunto.coordinate_lng) && (
          <Button
            onClick={() => onLocate(defunto)}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Mostra sulla Mappa
          </Button>
        )}
      </CardContent>
    </Card>
  );
}