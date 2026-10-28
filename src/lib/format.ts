import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Datas "yyyy-MM-dd" (colunas DATE) precisam de parseISO: new Date('2026-10-19')
// é interpretado como UTC e aparece como o dia anterior no Brasil.
export function formatDate(value: string): string {
  return format(parseISO(value), 'dd/MM/yyyy')
}

export function formatDateTime(value: string): string {
  return format(parseISO(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}
