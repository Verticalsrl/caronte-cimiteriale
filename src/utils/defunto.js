import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export const formatDate = (dateStr, fallback = '-') => {
  if (!dateStr) return fallback;
  try {
    return format(new Date(dateStr), 'd MMMM yyyy', { locale: it });
  } catch {
    return dateStr;
  }
};

export const calcAge = (dataNascita, dataMorte) => {
  if (!dataNascita || !dataMorte) return null;
  const birth = new Date(dataNascita);
  const death = new Date(dataMorte);
  const age = Math.floor((death - birth) / (365.25 * 24 * 60 * 60 * 1000));
  return age >= 0 ? age : null;
};
