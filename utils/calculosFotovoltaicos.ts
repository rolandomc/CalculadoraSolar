// utils/calculosFotovoltaicos.ts

// 1. Exportamos la función de calibres para usarla donde sea
export const determinarCalibre = (amperaje: number): string => {
  if (amperaje <= 20) return "12 AWG";
  if (amperaje <= 30) return "10 AWG";
  if (amperaje <= 50) return "8 AWG";
  if (amperaje <= 65) return "6 AWG";
  if (amperaje <= 85) return "4 AWG";
  return "Cálculo Especial (>4 AWG)";
};

// 2. Empaquetamos toda la matemática principal en una sola máquina
export const calcularDimensionamiento = (
  consumoBimestral: number,
  porcentaje: number,
  hspFinal: number,
  isPremium: boolean,
  panel: { pMax: number; isc: number },
  inversor: { iMaxCA: number }
) => {
  const EFICIENCIA_SISTEMA = 0.80;
  const DIAS_BIMESTRE = 60;

  // Cálculos base (Gratis)
  const consumoObjetivoKwh = consumoBimestral * (porcentaje / 100);
  const energiaAGenerarWh = ((consumoObjetivoKwh / DIAS_BIMESTRE) * 1000) / EFICIENCIA_SISTEMA;
  const potenciaSistemaW = energiaAGenerarWh / hspFinal;

  const panelesCalculados = Math.ceil(potenciaSistemaW / panel.pMax);
  const potenciaTotalKw = (panelesCalculados * panel.pMax) / 1000;

  // Preparamos el paquete de resultados
  let resultados = {
    paneles: panelesCalculados,
    potenciaKWp: potenciaTotalKw,
    proteccionCC: null as number | null,
    calibreCC: null as string | null,
    proteccionCA: null as number | null,
    calibreCA: null as string | null,
  };

  // Cálculos NOM-001 (Premium)
  if (isPremium) {
    const ampCC = Math.ceil(panel.isc * 1.25 * 1.25);
    resultados.proteccionCC = ampCC;
    resultados.calibreCC = determinarCalibre(ampCC);

    const ampCA = Math.ceil(inversor.iMaxCA * 1.25);
    resultados.proteccionCA = ampCA;
    resultados.calibreCA = determinarCalibre(ampCA);
  }

  return resultados;
};