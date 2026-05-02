import { format, formatDistance, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

export const formatDateTimeRelative = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(d, new Date(), { addSuffix: true, locale: ptBR });
};

export const formatNumber = (n: number, totalNumbers: number): string => {
  const digits = String(totalNumbers).length;
  return String(n).padStart(digits, '0');
};

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

export const getImageUrl = (imagePath: string | null): string => {
  if (!imagePath) return '/placeholder-raffle.svg';
  if (imagePath.startsWith('http')) return imagePath;
  return `/${imagePath}`;
};

export const calculateProgress = (stats: {
  total_numbers: number;
  purchased: number;
  reserved: number;
}): number => {
  if (stats.total_numbers === 0) return 0;
  return Math.round(((stats.purchased + stats.reserved) / stats.total_numbers) * 100);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));
