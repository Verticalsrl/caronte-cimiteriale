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
  const lines = text.split('\n');
  if (lines.length < 2) return [];
  
  const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parse (handles basic cases)
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      if (line[c] === '"') {
        inQuotes = !inQuotes;
      } else if (line[c] === ',' && !inQuotes) {
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
    const deleteFilter = { cimitero_id, ...(tipo_sepoltura ? { tipo_sepoltura } : {}) };
    let existingPage = await base44.asServiceRole.entities.Defunto.filter(deleteFilter, null, 500);
    while (existingPage.length > 0) {
      await Promise.all(existingPage.map(d => base44.asServiceRole.entities.Defunto.delete(d.id)));
      existingPage = await base44.asServiceRole.entities.Defunto.filter(deleteFilter, null, 500);
    }

    // Build records to import
    const records = [];
    for (const row of rows) {
      const cognome = row['defunto_cognome']?.trim();
      const nome = row['defunto_nome']?.trim();
      if (!cognome && !nome) continue;

      const settore = row['settore']?.trim() || row['settore_codice']?.trim() || '';
      const loculoNum = row['loculo_numero']?.trim() || '';
      const [fila, numero] = loculoNum.includes('/') ? loculoNum.split('/') : ['', loculoNum];

      records.push({
        cognome: cognome || '',
        nome: nome || '',
        data_nascita: parseDate(row['defunto_datanascita']),
        data_morte: parseDate(row['defunto_datadecesso']),
        settore: settore,
        fila: fila?.trim() || '',
        numero: numero?.trim() || '',
        tipo_sepoltura: tipo_sepoltura || 'loculo',
        geojson_id: row['ID']?.trim() || '',
        note: row['blocco']?.trim() || '',
        cimitero_id,
      });
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