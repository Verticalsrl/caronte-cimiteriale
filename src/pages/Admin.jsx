import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Settings, Users, Upload, Download, Search, MapPin, FileSpreadsheet } from "lucide-react";

const tipiSepoltura = [
  { value: 'loculo', label: 'Loculo' },
  { value: 'cappella', label: 'Cappella' },
  { value: 'terra', label: 'Sepoltura a Terra' },
  { value: 'ossario', label: 'Ossario' },
  { value: 'cinerario', label: 'Cinerario' },
];

const emptyDefunto = {
  nome: '', cognome: '', data_nascita: '', data_morte: '',
  luogo_nascita: '', settore: '', fila: '', numero: '',
  tipo_sepoltura: 'loculo', note: '', foto_url: '',
  coordinate_lat: '', coordinate_lng: '', geojson_id: ''
};

export default function Admin() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDefunto, setEditingDefunto] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch data
  const { data: defunti = [], isLoading } = useQuery({
    queryKey: ['defunti-admin'],
    queryFn: () => base44.entities.Defunto.list('-updated_date'),
  });

  const { data: impostazioni = [] } = useQuery({
    queryKey: ['impostazioni'],
    queryFn: () => base44.entities.Impostazioni.list(),
  });

  const settings = impostazioni[0] || {};

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Defunto.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['defunti-admin']);
      toast.success('Defunto aggiunto con successo');
      setIsDialogOpen(false);
      setEditingDefunto(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Defunto.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['defunti-admin']);
      toast.success('Defunto aggiornato');
      setIsDialogOpen(false);
      setEditingDefunto(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Defunto.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['defunti-admin']);
      toast.success('Defunto eliminato');
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (data) => {
      if (settings.id) {
        return base44.entities.Impostazioni.update(settings.id, data);
      }
      return base44.entities.Impostazioni.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['impostazioni']);
      toast.success('Impostazioni salvate');
    },
  });

  const handleSaveDefunto = () => {
    const data = { ...editingDefunto };
    if (data.coordinate_lat) data.coordinate_lat = parseFloat(data.coordinate_lat);
    if (data.coordinate_lng) data.coordinate_lng = parseFloat(data.coordinate_lng);

    if (editingDefunto.id) {
      updateMutation.mutate({ id: editingDefunto.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredDefunti = defunti.filter(d => {
    const search = searchQuery.toLowerCase();
    return !search || 
      d.nome?.toLowerCase().includes(search) ||
      d.cognome?.toLowerCase().includes(search) ||
      d.settore?.toLowerCase().includes(search);
  });

  const [settingsForm, setSettingsForm] = useState(settings);

  React.useEffect(() => {
    setSettingsForm(settings);
  }, [settings.id]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">Backoffice</h1>
              <p className="text-xs text-slate-500">Gestione Anagrafe Cimiteriale</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="defunti" className="space-y-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="defunti" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              Defunti
            </TabsTrigger>
            <TabsTrigger value="impostazioni" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Settings className="h-4 w-4 mr-2" />
              Impostazioni
            </TabsTrigger>
          </TabsList>

          {/* Defunti Tab */}
          <TabsContent value="defunti">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle>Gestione Defunti</CardTitle>
                  <CardDescription>{defunti.length} registrazioni totali</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => setEditingDefunto(emptyDefunto)}
                      className="bg-amber-500 hover:bg-amber-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nuovo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingDefunto?.id ? 'Modifica Defunto' : 'Nuovo Defunto'}
                      </DialogTitle>
                    </DialogHeader>
                    
                    {editingDefunto && (
                      <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                          <Label>Cognome *</Label>
                          <Input
                            value={editingDefunto.cognome}
                            onChange={e => setEditingDefunto({...editingDefunto, cognome: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Nome *</Label>
                          <Input
                            value={editingDefunto.nome}
                            onChange={e => setEditingDefunto({...editingDefunto, nome: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Data Nascita</Label>
                          <Input
                            type="date"
                            value={editingDefunto.data_nascita}
                            onChange={e => setEditingDefunto({...editingDefunto, data_nascita: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Data Morte</Label>
                          <Input
                            type="date"
                            value={editingDefunto.data_morte}
                            onChange={e => setEditingDefunto({...editingDefunto, data_morte: e.target.value})}
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>Luogo di Nascita</Label>
                          <Input
                            value={editingDefunto.luogo_nascita}
                            onChange={e => setEditingDefunto({...editingDefunto, luogo_nascita: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Settore</Label>
                          <Input
                            value={editingDefunto.settore}
                            onChange={e => setEditingDefunto({...editingDefunto, settore: e.target.value})}
                            placeholder="es. A, B, C"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fila</Label>
                          <Input
                            value={editingDefunto.fila}
                            onChange={e => setEditingDefunto({...editingDefunto, fila: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Numero</Label>
                          <Input
                            value={editingDefunto.numero}
                            onChange={e => setEditingDefunto({...editingDefunto, numero: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo Sepoltura</Label>
                          <Select 
                            value={editingDefunto.tipo_sepoltura} 
                            onValueChange={v => setEditingDefunto({...editingDefunto, tipo_sepoltura: v})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {tipiSepoltura.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Latitudine</Label>
                          <Input
                            type="number"
                            step="any"
                            value={editingDefunto.coordinate_lat}
                            onChange={e => setEditingDefunto({...editingDefunto, coordinate_lat: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Longitudine</Label>
                          <Input
                            type="number"
                            step="any"
                            value={editingDefunto.coordinate_lng}
                            onChange={e => setEditingDefunto({...editingDefunto, coordinate_lng: e.target.value})}
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>ID GeoJSON</Label>
                          <Input
                            value={editingDefunto.geojson_id}
                            onChange={e => setEditingDefunto({...editingDefunto, geojson_id: e.target.value})}
                            placeholder="ID corrispondente nel file GeoJSON"
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>URL Foto</Label>
                          <Input
                            value={editingDefunto.foto_url}
                            onChange={e => setEditingDefunto({...editingDefunto, foto_url: e.target.value})}
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>Note</Label>
                          <Textarea
                            value={editingDefunto.note}
                            onChange={e => setEditingDefunto({...editingDefunto, note: e.target.value})}
                            rows={3}
                          />
                        </div>
                      </div>
                    )}

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Annulla</Button>
                      </DialogClose>
                      <Button 
                        onClick={handleSaveDefunto}
                        disabled={!editingDefunto?.cognome || !editingDefunto?.nome}
                        className="bg-amber-500 hover:bg-amber-600"
                      >
                        Salva
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>

              <CardContent>
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Cerca per nome, cognome o settore..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Table */}
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead>Cognome Nome</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Posizione</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="w-24">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDefunti.map(defunto => (
                          <TableRow key={defunto.id}>
                            <TableCell className="font-medium">
                              {defunto.cognome} {defunto.nome}
                            </TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {defunto.data_nascita} - {defunto.data_morte}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {defunto.settore && `Sett. ${defunto.settore}`}
                                {defunto.fila && ` - F.${defunto.fila}`}
                                {defunto.numero && ` - N.${defunto.numero}`}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {defunto.tipo_sepoltura}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingDefunto(defunto);
                                    setIsDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    if (confirm('Eliminare questo defunto?')) {
                                      deleteMutation.mutate(defunto.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Impostazioni Tab */}
          <TabsContent value="impostazioni">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Impostazioni Sistema</CardTitle>
                <CardDescription>Configura i parametri dell'anagrafe cimiteriale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Nome Cimitero</Label>
                    <Input
                      value={settingsForm.nome_cimitero || ''}
                      onChange={e => setSettingsForm({...settingsForm, nome_cimitero: e.target.value})}
                      placeholder="Cimitero Comunale"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Indirizzo</Label>
                    <Input
                      value={settingsForm.indirizzo || ''}
                      onChange={e => setSettingsForm({...settingsForm, indirizzo: e.target.value})}
                      placeholder="Via Roma, 1 - 00100 Roma"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Configurazione Mappa
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Latitudine Centro</Label>
                      <Input
                        type="number"
                        step="any"
                        value={settingsForm.centro_mappa_lat || ''}
                        onChange={e => setSettingsForm({...settingsForm, centro_mappa_lat: parseFloat(e.target.value)})}
                        placeholder="41.9028"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Longitudine Centro</Label>
                      <Input
                        type="number"
                        step="any"
                        value={settingsForm.centro_mappa_lng || ''}
                        onChange={e => setSettingsForm({...settingsForm, centro_mappa_lng: parseFloat(e.target.value)})}
                        placeholder="12.4964"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Zoom Default</Label>
                      <Input
                        type="number"
                        value={settingsForm.zoom_default || ''}
                        onChange={e => setSettingsForm({...settingsForm, zoom_default: parseInt(e.target.value)})}
                        placeholder="18"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Fonti Dati
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>URL File GeoJSON</Label>
                      <Input
                        value={settingsForm.geojson_url || ''}
                        onChange={e => setSettingsForm({...settingsForm, geojson_url: e.target.value})}
                        placeholder="https://example.com/cimitero.geojson"
                      />
                      <p className="text-xs text-slate-500">
                        URL pubblico del file GeoJSON con la cartografia del cimitero
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>ID Google Sheet (opzionale)</Label>
                      <Input
                        value={settingsForm.google_sheet_id || ''}
                        onChange={e => setSettingsForm({...settingsForm, google_sheet_id: e.target.value})}
                        placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                      />
                      <p className="text-xs text-slate-500">
                        ID del foglio Google Sheets per importazione dati
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => saveSettingsMutation.mutate(settingsForm)}
                    className="bg-slate-800 hover:bg-slate-900"
                  >
                    Salva Impostazioni
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}