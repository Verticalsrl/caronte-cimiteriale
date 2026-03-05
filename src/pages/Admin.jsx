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
import { Plus, Pencil, Trash2, Settings, Users, Search, MapPin, Building2, RefreshCw, Loader2 } from "lucide-react";

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
  coordinate_lat: '', coordinate_lng: '', geojson_id: '', cimitero_id: ''
};

const emptyCimitero = {
  nome: '', tipo: 'minore', indirizzo: '', zona: '', telefono: '',
  estensione_ha: '', centro_mappa_lat: '', centro_mappa_lng: '',
  geojson_url: '', google_sheet_id_loculi: '', google_sheet_id_fosse: '', attivo: true
};

export default function Admin() {
  const [searchDefunti, setSearchDefunti] = useState('');
  const [filterCimitero, setFilterCimitero] = useState('');
  const [editingDefunto, setEditingDefunto] = useState(null);
  const [isDefuntoDialogOpen, setIsDefuntoDialogOpen] = useState(false);
  const [editingCimitero, setEditingCimitero] = useState(null);
  const [isCimiteroDialogOpen, setIsCimiteroDialogOpen] = useState(false);
  const [importingId, setImportingId] = useState(null);
  const queryClient = useQueryClient();

  // Fetch data
  const { data: defunti = [] } = useQuery({
    queryKey: ['defunti-admin'],
    queryFn: () => base44.entities.Defunto.list('-updated_date'),
  });

  const { data: cimiteri = [] } = useQuery({
    queryKey: ['cimiteri-admin'],
    queryFn: () => base44.entities.Cimitero.list('nome'),
  });

  // ── Defunto mutations ──
  const createDefuntoMutation = useMutation({
    mutationFn: (data) => base44.entities.Defunto.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['defunti-admin']);
      toast.success('Defunto aggiunto');
      setIsDefuntoDialogOpen(false);
    },
    onError: (err) => toast.error('Errore: ' + (err.message || 'Impossibile aggiungere il defunto')),
  });

  const updateDefuntoMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Defunto.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['defunti-admin']);
      toast.success('Defunto aggiornato');
      setIsDefuntoDialogOpen(false);
    },
    onError: (err) => toast.error('Errore: ' + (err.message || 'Impossibile aggiornare il defunto')),
  });

  const deleteDefuntoMutation = useMutation({
    mutationFn: (id) => base44.entities.Defunto.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['defunti-admin']);
      toast.success('Eliminato');
    },
    onError: (err) => toast.error('Errore: ' + (err.message || 'Impossibile eliminare il defunto')),
  });

  // ── Cimitero mutations ──
  const createCimiteroMutation = useMutation({
    mutationFn: (data) => base44.entities.Cimitero.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cimiteri-admin']);
      queryClient.invalidateQueries(['cimiteri']);
      toast.success('Cimitero aggiunto');
      setIsCimiteroDialogOpen(false);
    },
    onError: (err) => toast.error('Errore: ' + (err.message || 'Impossibile aggiungere il cimitero')),
  });

  const updateCimiteroMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Cimitero.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cimiteri-admin']);
      queryClient.invalidateQueries(['cimiteri']);
      toast.success('Cimitero aggiornato');
      setIsCimiteroDialogOpen(false);
    },
    onError: (err) => toast.error('Errore: ' + (err.message || 'Impossibile aggiornare il cimitero')),
  });

  const deleteCimiteroMutation = useMutation({
    mutationFn: (id) => base44.entities.Cimitero.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['cimiteri-admin']);
      queryClient.invalidateQueries(['cimiteri']);
      toast.success('Cimitero eliminato');
    },
    onError: (err) => toast.error('Errore: ' + (err.message || 'Impossibile eliminare il cimitero')),
  });

  const handleSaveDefunto = () => {
    const data = { ...editingDefunto };
    if (data.coordinate_lat !== '') data.coordinate_lat = parseFloat(data.coordinate_lat) || null;
    if (data.coordinate_lng !== '') data.coordinate_lng = parseFloat(data.coordinate_lng) || null;
    if (editingDefunto.id) {
      updateDefuntoMutation.mutate({ id: editingDefunto.id, data });
    } else {
      createDefuntoMutation.mutate(data);
    }
  };

  const handleSaveCimitero = () => {
    const data = { ...editingCimitero };
    if (data.estensione_ha !== '') data.estensione_ha = parseFloat(data.estensione_ha) || null;
    if (data.centro_mappa_lat !== '') data.centro_mappa_lat = parseFloat(data.centro_mappa_lat) || null;
    if (data.centro_mappa_lng !== '') data.centro_mappa_lng = parseFloat(data.centro_mappa_lng) || null;
    if (editingCimitero.id) {
      updateCimiteroMutation.mutate({ id: editingCimitero.id, data });
    } else {
      createCimiteroMutation.mutate(data);
    }
  };

  const filteredDefunti = defunti.filter(d => {
    const search = searchDefunti.toLowerCase();
    const matchesSearch = !search ||
      d.nome?.toLowerCase().includes(search) ||
      d.cognome?.toLowerCase().includes(search) ||
      d.settore?.toLowerCase().includes(search);
    const matchesCimitero = !filterCimitero || d.cimitero_id === filterCimitero;
    return matchesSearch && matchesCimitero;
  });

  const getCimiteroNome = (id) => cimiteri.find(c => c.id === id)?.nome || '-';

  const handleImportCsv = async (cimitero) => {
    const hasLoculi = !!cimitero.google_sheet_id_loculi;
    const hasFosse = !!cimitero.google_sheet_id_fosse;
    if (!hasLoculi && !hasFosse) {
      toast.error('Nessun URL CSV configurato per questo cimitero');
      return;
    }
    setImportingId(cimitero.id);
    try {
      let totalImported = 0;
      const warnings = [];
      if (hasLoculi) {
        const resp = await base44.functions.invoke('importDefuntiCsv', {
          cimitero_id: cimitero.id,
          csv_url: cimitero.google_sheet_id_loculi,
          tipo_sepoltura: 'loculo',
        });
        if (resp.data.error) warnings.push(`Loculi: ${resp.data.error}`);
        else totalImported += resp.data.imported || 0;
      }
      if (hasFosse) {
        const resp = await base44.functions.invoke('importDefuntiCsv', {
          cimitero_id: cimitero.id,
          csv_url: cimitero.google_sheet_id_fosse,
          tipo_sepoltura: 'terra',
        });
        if (resp.data.error) warnings.push(`Fosse: ${resp.data.error}`);
        else totalImported += resp.data.imported || 0;
      }
      if (warnings.length) {
        toast.error(warnings.join('\n'), { duration: 10000 });
      }
      if (totalImported > 0) {
        toast.success(`Importati ${totalImported} defunti`);
      }
      queryClient.invalidateQueries(['defunti-admin']);
    } catch (e) {
      toast.error('Errore importazione: ' + e.message);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Backoffice</h1>
            <p className="text-xs text-slate-500">Gestione Anagrafe Cimiteriale</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="cimiteri" className="space-y-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="cimiteri" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Building2 className="h-4 w-4 mr-2" />
              Cimiteri
            </TabsTrigger>
            <TabsTrigger value="defunti" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              Defunti
            </TabsTrigger>
          </TabsList>

          {/* ── TAB CIMITERI ── */}
          <TabsContent value="cimiteri">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle>Cimiteri di Roma</CardTitle>
                  <CardDescription>{cimiteri.length} cimiteri configurati</CardDescription>
                </div>
                <Dialog open={isCimiteroDialogOpen} onOpenChange={setIsCimiteroDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingCimitero(emptyCimitero)} className="bg-amber-500 hover:bg-amber-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuovo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingCimitero?.id ? 'Modifica Cimitero' : 'Nuovo Cimitero'}</DialogTitle>
                    </DialogHeader>
                    {editingCimitero && (
                      <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="col-span-2 space-y-2">
                          <Label>Nome *</Label>
                          <Input
                            value={editingCimitero.nome}
                            onChange={e => setEditingCimitero({...editingCimitero, nome: e.target.value})}
                            placeholder="es. Cimitero Monumentale del Verano"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select value={editingCimitero.tipo} onValueChange={v => setEditingCimitero({...editingCimitero, tipo: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="maggiore">Maggiore</SelectItem>
                              <SelectItem value="minore">Minore</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Estensione (ha)</Label>
                          <Input type="number" step="any" value={editingCimitero.estensione_ha}
                            onChange={e => setEditingCimitero({...editingCimitero, estensione_ha: e.target.value})} />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>Indirizzo</Label>
                          <Input value={editingCimitero.indirizzo}
                            onChange={e => setEditingCimitero({...editingCimitero, indirizzo: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Zona / Municipio</Label>
                          <Input value={editingCimitero.zona}
                            onChange={e => setEditingCimitero({...editingCimitero, zona: e.target.value})}
                            placeholder="es. Municipio III" />
                        </div>
                        <div className="space-y-2">
                          <Label>Telefono</Label>
                          <Input value={editingCimitero.telefono}
                            onChange={e => setEditingCimitero({...editingCimitero, telefono: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Latitudine centro mappa</Label>
                          <Input type="number" step="any" value={editingCimitero.centro_mappa_lat}
                            onChange={e => setEditingCimitero({...editingCimitero, centro_mappa_lat: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Longitudine centro mappa</Label>
                          <Input type="number" step="any" value={editingCimitero.centro_mappa_lng}
                            onChange={e => setEditingCimitero({...editingCimitero, centro_mappa_lng: e.target.value})} />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>URL GeoJSON</Label>
                          <Input value={editingCimitero.geojson_url}
                            onChange={e => setEditingCimitero({...editingCimitero, geojson_url: e.target.value})}
                            placeholder="https://..." />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>ID Google Sheet – Loculi</Label>
                          <Input value={editingCimitero.google_sheet_id_loculi || ''}
                            onChange={e => setEditingCimitero({...editingCimitero, google_sheet_id_loculi: e.target.value})}
                            placeholder="ID del foglio Google Sheets per i loculi" />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>ID Google Sheet – Fosse</Label>
                          <Input value={editingCimitero.google_sheet_id_fosse || ''}
                            onChange={e => setEditingCimitero({...editingCimitero, google_sheet_id_fosse: e.target.value})}
                            placeholder="ID del foglio Google Sheets per le fosse" />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <DialogClose asChild><Button variant="outline">Annulla</Button></DialogClose>
                      <Button onClick={handleSaveCimitero} disabled={!editingCimitero?.nome} className="bg-amber-500 hover:bg-amber-600">
                        Salva
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>

              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Indirizzo</TableHead>
                        <TableHead>Zona</TableHead>
                        <TableHead>GeoJSON</TableHead>
                        <TableHead>Attivo</TableHead>
                        <TableHead className="w-24">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cimiteri.map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={c.tipo === 'maggiore' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50'}>
                              {c.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">{c.indirizzo || '-'}</TableCell>
                          <TableCell className="text-sm text-slate-500">{c.zona || '-'}</TableCell>
                          <TableCell>
                            {c.geojson_url
                              ? <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">✓ Configurato</Badge>
                              : <Badge variant="outline" className="text-xs text-slate-400">Non impostato</Badge>
                            }
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => updateCimiteroMutation.mutate({ id: c.id, data: { ...c, attivo: !c.attivo } })}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${c.attivo ? 'bg-green-500' : 'bg-slate-300'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${c.attivo ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {(c.google_sheet_id_loculi || c.google_sheet_id_fosse) && (
                                <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  title="Aggiorna dati dal CSV"
                                  disabled={importingId === c.id}
                                  onClick={() => handleImportCsv(c)}>
                                  {importingId === c.id
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <RefreshCw className="h-4 w-4" />}
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => { setEditingCimitero(c); setIsCimiteroDialogOpen(true); }}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => { if (confirm('Eliminare questo cimitero?')) deleteCimiteroMutation.mutate(c.id); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {cimiteri.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Nessun cimitero aggiunto</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB DEFUNTI ── */}
          <TabsContent value="defunti">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle>Gestione Defunti</CardTitle>
                  <CardDescription>{defunti.length} registrazioni totali</CardDescription>
                </div>
                <Dialog open={isDefuntoDialogOpen} onOpenChange={setIsDefuntoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingDefunto(emptyDefunto)} className="bg-amber-500 hover:bg-amber-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuovo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingDefunto?.id ? 'Modifica Defunto' : 'Nuovo Defunto'}</DialogTitle>
                    </DialogHeader>
                    {editingDefunto && (
                      <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="col-span-2 space-y-2">
                          <Label>Cimitero *</Label>
                          <Select value={editingDefunto.cimitero_id} onValueChange={v => setEditingDefunto({...editingDefunto, cimitero_id: v})}>
                            <SelectTrigger><SelectValue placeholder="Seleziona cimitero" /></SelectTrigger>
                            <SelectContent>
                              {cimiteri.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Cognome *</Label>
                          <Input value={editingDefunto.cognome} onChange={e => setEditingDefunto({...editingDefunto, cognome: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Nome *</Label>
                          <Input value={editingDefunto.nome} onChange={e => setEditingDefunto({...editingDefunto, nome: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Data Nascita</Label>
                          <Input type="date" value={editingDefunto.data_nascita} onChange={e => setEditingDefunto({...editingDefunto, data_nascita: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Data Morte</Label>
                          <Input type="date" value={editingDefunto.data_morte} onChange={e => setEditingDefunto({...editingDefunto, data_morte: e.target.value})} />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>Luogo di Nascita</Label>
                          <Input value={editingDefunto.luogo_nascita} onChange={e => setEditingDefunto({...editingDefunto, luogo_nascita: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Settore</Label>
                          <Input value={editingDefunto.settore} onChange={e => setEditingDefunto({...editingDefunto, settore: e.target.value})} placeholder="es. BLOCCO A" />
                        </div>
                        <div className="space-y-2">
                          <Label>Fila</Label>
                          <Input value={editingDefunto.fila} onChange={e => setEditingDefunto({...editingDefunto, fila: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Numero</Label>
                          <Input value={editingDefunto.numero} onChange={e => setEditingDefunto({...editingDefunto, numero: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo Sepoltura</Label>
                          <Select value={editingDefunto.tipo_sepoltura} onValueChange={v => setEditingDefunto({...editingDefunto, tipo_sepoltura: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {tipiSepoltura.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Latitudine</Label>
                          <Input type="number" step="any" value={editingDefunto.coordinate_lat} onChange={e => setEditingDefunto({...editingDefunto, coordinate_lat: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Longitudine</Label>
                          <Input type="number" step="any" value={editingDefunto.coordinate_lng} onChange={e => setEditingDefunto({...editingDefunto, coordinate_lng: e.target.value})} />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>ID GeoJSON</Label>
                          <Input value={editingDefunto.geojson_id} onChange={e => setEditingDefunto({...editingDefunto, geojson_id: e.target.value})} />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>URL Foto</Label>
                          <Input value={editingDefunto.foto_url} onChange={e => setEditingDefunto({...editingDefunto, foto_url: e.target.value})} />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>Note</Label>
                          <Textarea value={editingDefunto.note} onChange={e => setEditingDefunto({...editingDefunto, note: e.target.value})} rows={3} />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <DialogClose asChild><Button variant="outline">Annulla</Button></DialogClose>
                      <Button onClick={handleSaveDefunto} disabled={!editingDefunto?.cognome || !editingDefunto?.nome} className="bg-amber-500 hover:bg-amber-600">
                        Salva
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>

              <CardContent>
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Cerca per nome, cognome o settore..." value={searchDefunti} onChange={e => setSearchDefunti(e.target.value)} className="pl-10" />
                  </div>
                  <Select value={filterCimitero} onValueChange={setFilterCimitero}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Tutti i cimiteri" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tutti i cimiteri</SelectItem>
                      {cimiteri.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead>Cognome Nome</TableHead>
                          <TableHead>Cimitero</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Posizione</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="w-24">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDefunti.map(defunto => (
                          <TableRow key={defunto.id}>
                            <TableCell className="font-medium">{defunto.cognome} {defunto.nome}</TableCell>
                            <TableCell className="text-sm text-slate-500 max-w-[140px] truncate">
                              {getCimiteroNome(defunto.cimitero_id)}
                            </TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {defunto.data_nascita} - {defunto.data_morte}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {defunto.settore && `Sett. ${defunto.settore}`}
                                {defunto.fila && ` F.${defunto.fila}`}
                                {defunto.numero && ` N.${defunto.numero}`}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">{defunto.tipo_sepoltura}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => { setEditingDefunto(defunto); setIsDefuntoDialogOpen(true); }}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => { if (confirm('Eliminare questo defunto?')) deleteDefuntoMutation.mutate(defunto.id); }}>
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
        </Tabs>
      </main>
    </div>
  );
}