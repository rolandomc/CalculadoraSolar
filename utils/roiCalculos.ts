// Precios aproximados del mercado mexicano 2024 (en MXN)
export const PRECIOS_MERCADO = {
  // Precio por Watt (panel solar) - Más realista
  precioPanel: 4.5, // MXN/W (incluye panel + estructura)

  // Precio por Watt (inversor) - Reducido
  precioInversor: 2.5, // MXN/W

  // Costo de Balance of System (cables, protecciones, etc)
  precioSOP: 12, // MXN/W (sistema de protecciones y componentes)

  // Instalación por kW - Más realista
  costoInstalacion: 250, // MXN/kW

  // Permiso CFE y trámites
  costoPermiso: 1500, // MXN (aproximado)

  // Tarifa promedio de electricidad en México
  tarifaElectricia: 3.8, // MXN/kWh (residencial, puede variar por región y tarifa)

  // Incremento anual de tarifa
  incrementoTarifaAnual: 0.08, // 8% anual

  // Degradación de paneles
  degradacionAnual: 0.005, // 0.5% anual

  // Garantía de paneles
  garantiaPaneles: 25, // años
};

export interface AnalisisROI {
  costoPaneles: number;
  costoInversor: number;
  costoSOP: number;
  costoInstalacion: number;
  costoPermiso: number;
  costoTotal: number;
  ahorroMensual: number;
  ahorroAnual: number;
  tiempoRecuperacion: number; // en años
  ahorroA5Anios: number;
  ahorroA10Anios: number;
  ahorroA25Anios: number;
  co2Evitado: number; // kg de CO2
  tir: number; // Tasa Interna de Retorno
  vrn: number; // Valor Presente Neto a 25 años
}

export function calcularROI(
  potenciaKWp: number,
  consumoMensualkWh: number,
  porcentajeAhorro: number,
  hsp: number = 5.0,
  tarifaPersonalizada?: number
): AnalisisROI {
  // Usar tarifa personalizada si se proporciona, si no usar la del mercado
  const tarifa = tarifaPersonalizada || PRECIOS_MERCADO.tarifaElectricia;

  // Cálculo de costos
  const potenciaW = potenciaKWp * 1000;
  const costoPaneles = potenciaW * PRECIOS_MERCADO.precioPanel;
  const costoInversor = potenciaKWp * 1000 * PRECIOS_MERCADO.precioInversor;
  const costoSOP = potenciaW * PRECIOS_MERCADO.precioSOP;
  const costoInstalacion = potenciaKWp * PRECIOS_MERCADO.costoInstalacion;
  const costoPermiso = PRECIOS_MERCADO.costoPermiso;
  const costoTotal = costoPaneles + costoInversor + costoSOP + costoInstalacion + costoPermiso;

  // Producción mensual en kWh
  const diasMes = 30;
  const produccionMensual = potenciaKWp * hsp * diasMes; // kWh

  // Ahorro mensual (% de la producción es realmente lo que usa)
  const ahorroMensual = (produccionMensual * porcentajeAhorro) / 100;
  const ahorroMensualMXN = ahorroMensual * tarifa;
  const ahorroAnual = ahorroMensualMXN * 12;

  // Tiempo de recuperación simple (sin considerar inflación)
  const tiempoRecuperacion = costoTotal / ahorroAnual;

  // Cálculos a largo plazo con degradación y aumento de tarifa
  let ahorroA5Anios = 0;
  let ahorroA10Anios = 0;
  let ahorroA25Anios = 0;
  let flujosCaja: number[] = [-costoTotal]; // Año 0

  for (let anio = 1; anio <= 25; anio++) {
    const degradacion = Math.pow(1 - PRECIOS_MERCADO.degradacionAnual, anio);
    const produccionAnual = ahorroMensual * 12 * degradacion;
    const tarifaAnual =
      tarifa *
      Math.pow(1 + PRECIOS_MERCADO.incrementoTarifaAnual, anio);
    const ahorroAnioActual = produccionAnual * tarifaAnual;

    flujosCaja.push(ahorroAnioActual);

    if (anio === 5) ahorroA5Anios = ahorroAnioActual;
    if (anio === 10) ahorroA10Anios = ahorroAnioActual;
    if (anio === 25) ahorroA25Anios = ahorroAnioActual;
  }

  // Cálculo de VPN (Valor Presente Neto) a tasa de descuento del 5%
  const tasaDescuento = 0.05;
  let vpn = 0;
  flujosCaja.forEach((flujo, idx) => {
    vpn += flujo / Math.pow(1 + tasaDescuento, idx);
  });

  // Cálculo simple de TIR (aproximación)
  const ahorroTotal25Anios = flujosCaja.slice(1).reduce((a, b) => a + b, 0);
  const tir = ((ahorroTotal25Anios / costoTotal) ** (1 / 25) - 1) * 100;

  // CO2 evitado (factor: 0.5 kg CO2 por kWh en México)
  const co2Factor = 0.5;
  const co2Evitado = ahorroMensual * 12 * 25 * co2Factor;

  // Acumulado a 5, 10 y 25 años
  let acumulado5 = 0,
    acumulado10 = 0,
    acumulado25 = 0;
  for (let i = 1; i <= 25; i++) {
    if (i <= 5) acumulado5 += flujosCaja[i];
    if (i <= 10) acumulado10 += flujosCaja[i];
    if (i <= 25) acumulado25 += flujosCaja[i];
  }

  return {
    costoPaneles,
    costoInversor,
    costoSOP,
    costoInstalacion,
    costoPermiso,
    costoTotal,
    ahorroMensual: ahorroMensualMXN,
    ahorroAnual,
    tiempoRecuperacion,
    ahorroA5Anios: acumulado5,
    ahorroA10Anios: acumulado10,
    ahorroA25Anios: acumulado25,
    co2Evitado,
    tir,
    vrn: vpn,
  };
}
