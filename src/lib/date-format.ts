const ptBrDateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

/**
 * Formata um timestamp (ms) para exibição consistente entre SSR e navegador.
 * Fixar `timeZone` evita diferenças de hidratação caso servidor e cliente estejam em fusos distintos.
 */
export function formatTaskDate(timestamp: number): string {
  return ptBrDateTimeFormatter.format(new Date(timestamp));
}
