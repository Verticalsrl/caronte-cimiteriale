import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function parseDate(str) {
  if (!str) return '';
  // Format: DD/MM/YYYY
  const parts = str.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return '';
}

function parseCsv(text) {
  // Rimuove BOM UTF-8 se presente
  const clean = text.replace(/^\ufeff/, '');
  const lines = clean.split('\n');
  if (lines.length < 2) return [];

  // Rileva automaticamente il delimitatore (virgola o punto e virgola)
  const firstLine = lines[0];
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';

  const header = firstLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = [];
    let current = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      if (line[c] === '"') {
        inQuotes = !inQuotes;
      } else if (line[c] === delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += line[c];
      }
    }
    values.push(current.trim());

    const row = {};
    header.forEach((h, idx) => { row[h] = values[idx] || ''; });
    rows.push(row);
  }

  return rows;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Accesso non autorizzato' }, { status: 403 });
    }

    const { cimitero_id, csv_url, tipo_sepoltura } = await req.json();
    
    if (!cimitero_id || !csv_url) {
      return Response.json({ error: 'cimitero_id e csv_url sono obbligatori' }, { status: 400 });
    }

    // Fetch CSV
    const csvResp = await fetch(csv_url);
    if (!csvResp.ok) {
      return Response.json({ error: 'Impossibile scaricare il CSV' }, { status: 500 });
    }
    const csvText = await csvResp.text();
    const rows = parseCsv(csvText);

    if (rows.length === 0) {
      return Response.json({ error: 'CSV vuoto o non valido' }, { status: 400 });
    }

    // Delete existing defunti for this cemetery filtered by tipo_sepoltura
    // (avoids wiping records of a different type imported in the same session)
    // Filter by tipo_sepoltura in JS because base44 may not support it as a server-side filter
    let existingPage = await base44.asServiceRole.entities.Defunto.filter({ cimitero_id }, null, 500);
    while (existingPage.length > 0) {
      const toDelete = tipo_sepoltura
        ? existingPage.filter(d => d.tipo_sepoltura === tipo_sepoltura)
        : existingPage;
      if (toDelete.length > 0) {
        await Promise.all(toDelete.map(d => base44.asServiceRole.entities.Defunto.delete(d.id)));
      }
      // If nothing was deleted (all were the other type), stop to avoid infinite loop
      if (toDelete.length === 0) break;
      existingPage = await base44.asServiceRole.entities.Defunto.filter({ cimitero_id }, null, 500);
    }

    // Helper: pick first non-empty value among candidate column names
    const col = (row, ...keys) => {
      for (const k of keys) {
        const v = row[k]?.trim();
        if (v) return v;
      }
      return '';
    };

    // Build records to import
    const records = [];
    for (const row of rows) {
      const cognome = col(row, 'defunto_cognome', 'cognome', 'COGNOME', 'Cognome');
      const nome    = col(row, 'defunto_nome',    'nome',    'NOME',    'Nome');
      if (!cognome && !nome) continue;

      const settore  = col(row, 'settore', 'settore_codice', 'SETTORE', 'Settore');
      const posNum   = col(row, 'loculo_numero', 'fossa_numero', 'numero_fossa',
                               'numero', 'NUMERO', 'Numero', 'tomba_numero');
      // Support separators: '/' (3/15) or '-' (3-15); fallback to a separate fila column
      let [fila, numero] = posNum.includes('/')
        ? posNum.split('/')
        : posNum.includes('-') ? posNum.split('-') : ['', posNum];
      if (!fila) {
        fila = col(row, 'fila', 'FILA', 'piano', 'PIANO', 'piano_numero', 'riga');
      }

      records.push({
        cognome,
        nome,
        data_nascita: parseDate(col(row, 'defunto_datanascita', 'data_nascita', 'nascita',
                                      'DATA_NASCITA', 'Data Nascita')),
        data_morte:   parseDate(col(row, 'defunto_datadecesso', 'data_morte', 'data_decesso',
                                      'decesso', 'DATA_MORTE', 'Data Morte', 'Data Decesso')),
        settore,
        fila:  fila?.trim()   || '',
        numero: numero?.trim() || '',
        tipo_sepoltura: tipo_sepoltura || 'loculo',
        geojson_id: col(row, 'ID', 'id', 'Id', 'geojson_id'),
        note: col(row, 'blocco', 'note', 'NOTE', 'Note'),
        cimitero_id,
      });
    }

    // Se ci sono righe ma nessun record parsato, probabilmente i nomi colonna non corrispondono
    if (records.length === 0 && rows.length > 0) {
      const headers = Object.keys(rows[0]).join(', ');
      return Response.json({
        error: `Nessun defunto trovato nel CSV. Colonne rilevate: [${headers}]. Attesi: defunto_cognome/cognome, defunto_nome/nome`,
        headers,
        total: rows.length,
      }, { status: 422 });
    }

    // Bulk insert in batches of 100
    const BATCH = 100;
    for (let i = 0; i < records.length; i += BATCH) {
      await base44.asServiceRole.entities.Defunto.bulkCreate(records.slice(i, i + BATCH));
    }

    return Response.json({ success: true, imported: records.length, total: rows.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});