// importamos la base de datos para que el motor pueda buscar el inversor
import baseDatos from '../data/catalogo.json';

export const calcularDimensionamiento = (
  consumoBimestral: number,
  porcentajeAhorro: number,
  hsp: number,
  isPremium: boolean,
  panel: any
) => {
  // 1. Calcular energía diaria requerida
  const consumoDiario = consumoBimestral / 60; 
  const energiaObjetivo = consumoDiario * (porcentajeAhorro / 100);

  // 2. Calcular energía real que produce un panel (factor de eficiencia 0.8 por pérdidas del sistema)
  const generacionPorPanel = (panel.pMax * hsp * 0.8) / 1000;

  // 3. Cantidad de paneles (siempre redondeamos hacia arriba para no quedarnos cortos)
  const panelesRequeridos = Math.ceil(energiaObjetivo / generacionPorPanel);

  // 4. Potencia Total Instalada en DC (kWp)
  const potenciaKWp = (panelesRequeridos * panel.pMax) / 1000;

  // 5. SELECCIÓN AUTOMÁTICA DEL INVERSOR (Regla de Sobredimensionamiento Máx 30%)
  // Ordenamos los inversores de menor a mayor capacidad
  const inversoresOrdenados = [...baseDatos.inversores].sort((a, b) => a.potenciaCA - b.potenciaCA);
  
  let inversorSugerido = inversoresOrdenados[inversoresOrdenados.length - 1]; // Por defecto el más grande
  let ratioSobredimensionamiento = 0;

  for (const inversor of inversoresOrdenados) {
    // Verificamos si la potencia DC instalada es menor o igual a la capacidad del inversor + 30%
    const capacidadMaxDC = inversor.potenciaCA * 1.30;
    
    if (potenciaKWp <= capacidadMaxDC) {
      inversorSugerido = inversor;
      ratioSobredimensionamiento = (potenciaKWp / inversor.potenciaCA) * 100;
      break;
    }
  }

  // 6. Protecciones normadas (NOM-001-SEDE)
  let proteccionCC = null;
  let calibreCC = null;
  let proteccionCA = null;
  let calibreCA = null;

  if (isPremium) {
    // Calculo de fusibles CC: Isc * 1.56 (Art. 690-8)
    const corrienteFusible = panel.isc * 1.56;
    proteccionCC = Math.ceil(corrienteFusible / 5) * 5; // Redondear a multiplos de 5 comerciales
    calibreCC = proteccionCC <= 20 ? '12 AWG o 10 AWG Solar' : '10 AWG Solar';

    // Calculo CA basado en el inversor sugerido (Asumiendo 220V Bifásico)
    const corrienteCA = (inversorSugerido.potenciaCA * 1000) / 220;
    const corrienteBreaker = corrienteCA * 1.25;
    proteccionCA = Math.ceil(corrienteBreaker / 5) * 5;
    calibreCA = proteccionCA <= 20 ? '12 AWG' : proteccionCA <= 30 ? '10 AWG' : '8 AWG';
  }

  return {
    paneles: panelesRequeridos,
    potenciaKWp,
    inversorSugerido,
    ratioSobredimensionamiento,
    proteccionCC,
    calibreCC,
    proteccionCA,
    calibreCA
  };
};