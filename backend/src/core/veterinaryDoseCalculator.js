/**
 * Calculadora Farmacológica Veterinaria y Fluidoterapia
 * Incluye alertas de contraindicación estricta por especie y raza
 */

// Contraindicaciones letales y de alto riesgo por especie
const CONTRAINDICACIONES = [
  {
    especie: 'felino',
    farmaco: 'paracetamol',
    nombreComun: 'Paracetamol / Acetaminofén',
    nivel: 'mortal',
    alerta: '¡CONTRAINDICACIÓN ABSOLUTA EN FELINOS! Produce metahemoglobinemia y fallo hepático fulminante letal por deficiencia de glucuronil transferasa.'
  },
  {
    especie: 'felino',
    farmaco: 'permetrina',
    nombreComun: 'Permetrina / Piretroides concentrados',
    nivel: 'mortal',
    alerta: '¡TOXICIDAD NEUROLÓGICA MORTAL EN GATOS! Provoca hiperexcitabilidad, temblores generalizados y convulsiones letales.'
  },
  {
    especie: 'felino',
    farmaco: 'ibuprofeno',
    nombreComun: 'Ibuprofeno / Naproxeno',
    nivel: 'critico',
    alerta: 'Alto riesgo de perforación gástrica y falla renal aguda en felinos. No utilizar AINEs de uso humano.'
  },
  {
    especie: 'felino',
    farmaco: 'aspirina',
    nombreComun: 'Ácido Acetilsalicílico (Aspirina)',
    nivel: 'critico',
    alerta: 'Metabolización extremadamente lenta (vida media de ~38-45 horas). Riesgo severo de intoxicación sistémica.'
  },
  {
    especie: 'canino',
    razaKeyword: ['collie', 'pastor australiano', 'border collie', 'sheltie', 'pastor de shetland', 'whippet'],
    farmaco: 'ivermectina',
    nombreComun: 'Ivermectina / Lactonas macrocíclicas',
    nivel: 'critico',
    alerta: '¡ALERTA GENÉTICA MDR1! Razas de pastoreo tienen susceptibilidad a neurotoxicidad severa, coma y muerte por deficiencia de glicoproteína P.'
  }
];

// Fármacos veterinarios predefinidos para cálculo rápido
const FARMACOS_PREDEFINIDOS = [
  {
    id: 'amoxicilina_clavulanico',
    nombre: 'Amoxicilina + Ácido Clavulánico',
    especies: ['canino', 'felino'],
    dosisMgKg: { min: 12.5, max: 25, default: 15 },
    frecuenciaHoras: 12,
    concentracionMgMl: 50, // ej. suspensión oral 50mg/ml o inyectable
    via: 'Oral / SC'
  },
  {
    id: 'meloxicam',
    nombre: 'Meloxicam',
    especies: ['canino', 'felino'],
    dosisMgKg: {
      canino: { min: 0.1, max: 0.2, default: 0.2 },
      felino: { min: 0.05, max: 0.1, default: 0.05 }
    },
    frecuenciaHoras: 24,
    concentracionMgMl: 5, // inyectable 5mg/ml o gotas
    via: 'Oral / SC / IV'
  },
  {
    id: 'enrofloxacino',
    nombre: 'Enrofloxacino',
    especies: ['canino', 'felino'],
    dosisMgKg: {
      canino: { min: 5, max: 10, default: 5 },
      felino: { min: 2.5, max: 5, default: 5 } // advertencia de retinopatía en felinos > 5mg/kg
    },
    frecuenciaHoras: 24,
    concentracionMgMl: 50,
    via: 'Oral / SC / IM'
  },
  {
    id: 'tramadol',
    nombre: 'Tramadol Clorhidrato',
    especies: ['canino', 'felino'],
    dosisMgKg: { min: 2, max: 4, default: 3 },
    frecuenciaHoras: 8,
    concentracionMgMl: 50,
    via: 'Oral / SC / IV'
  },
  {
    id: 'metronidazol',
    nombre: 'Metronidazol',
    especies: ['canino', 'felino'],
    dosisMgKg: { min: 15, max: 25, default: 15 },
    frecuenciaHoras: 12,
    concentracionMgMl: 50,
    via: 'Oral / IV lenta'
  },
  {
    id: 'dexametasona',
    nombre: 'Dexametasona',
    especies: ['canino', 'felino'],
    dosisMgKg: { min: 0.1, max: 0.5, default: 0.2 },
    frecuenciaHoras: 24,
    concentracionMgMl: 2,
    via: 'IM / IV / SC'
  }
];

class VeterinaryDoseCalculator {
  /**
   * Verifica si existe una contraindicación severa
   */
  static verificarContraindicacion(especie, farmaco, raza = '') {
    const esp = (especie || '').toLowerCase().trim();
    const farm = (farmaco || '').toLowerCase().trim();
    const raz = (raza || '').toLowerCase().trim();

    for (const contra of CONTRAINDICACIONES) {
      if (contra.especie && contra.especie !== esp) continue;

      if (contra.farmaco && farm.includes(contra.farmaco)) {
        if (contra.razaKeyword) {
          const coincideRaza = contra.razaKeyword.some(k => raz.includes(k));
          if (coincideRaza) {
            return contra;
          }
        } else {
          return contra;
        }
      }
    }

    return null;
  }

  /**
   * Calcula dosis en mg y volumen en ml
   */
  static calcularDosis({ pesoKg, dosisMgKg, concentracionMgMl, especie, farmacoNombre, raza }) {
    const peso = parseFloat(pesoKg);
    const dosis = parseFloat(dosisMgKg);
    const concentracion = parseFloat(concentracionMgMl);

    if (isNaN(peso) || peso <= 0) {
      throw new Error('El peso debe ser un número positivo mayor a cero');
    }
    if (isNaN(dosis) || dosis <= 0) {
      throw new Error('La dosis en mg/kg debe ser un número positivo');
    }
    if (isNaN(concentracion) || concentracion <= 0) {
      throw new Error('La concentración en mg/ml debe ser un número positivo');
    }

    const contraindicacion = this.verificarContraindicacion(especie, farmacoNombre, raza);

    const dosisTotalMg = parseFloat((peso * dosis).toFixed(2));
    const volumenTotalMl = parseFloat((dosisTotalMg / concentracion).toFixed(3));

    return {
      pesoKg: peso,
      dosisMgKg: dosis,
      concentracionMgMl: concentracion,
      dosisTotalMg,
      volumenTotalMl,
      contraindicacion
    };
  }

  /**
   * Calcula fluidoterapia veterinaria (Tasa de mantenimiento, deshidratación y gotas/minuto)
   * Formula: Mantenimiento (ml/día) + Deshidratación (% * peso * 10)
   * Equipo: normogotero (20 gotas/ml) o microgotero (60 gotas/ml)
   */
  static calcularFluidoterapia({ pesoKg, especie = 'canino', porcentajeDeshidratacion = 0, tipoGotero = 'normogotero' }) {
    const peso = parseFloat(pesoKg);
    const deshidratacion = parseFloat(porcentajeDeshidratacion) || 0;

    if (isNaN(peso) || peso <= 0) {
      throw new Error('El peso del paciente debe ser válido');
    }

    // Tasa basal de mantenimiento ml/kg/día
    const mlPorKgDia = (especie.toLowerCase() === 'felino') ? 40 : 50;
    const mantenimientoDiarioMl = peso * mlPorKgDia;

    // Reposición de pérdidas por deshidratación: % deshidratación * peso en kg * 10 (ej. 5% en 10kg = 500ml)
    const reposicionDeshidratacionMl = deshidratacion > 0 ? (deshidratacion / 100) * peso * 1000 : 0;

    const volumenTotal24hMl = Math.round(mantenimientoDiarioMl + reposicionDeshidratacionMl);
    const flujoMlHora = parseFloat((volumenTotal24hMl / 24).toFixed(1));

    const factorGoteo = (tipoGotero === 'microgotero') ? 60 : 20;
    // Gotas/min = (Volumen total en ml * factor de goteo) / (tiempo en horas * 60)
    // Gotas/min = (flujoMlHora * factorGoteo) / 60
    const gotasPorMinuto = Math.round((flujoMlHora * factorGoteo) / 60);
    const segundosPorGota = gotasPorMinuto > 0 ? parseFloat((60 / gotasPorMinuto).toFixed(1)) : 0;

    return {
      pesoKg: peso,
      especie,
      mantenimientoDiarioMl,
      reposicionDeshidratacionMl,
      volumenTotal24hMl,
      flujoMlHora,
      tipoGotero,
      factorGoteo,
      gotasPorMinuto,
      segundosPorGota
    };
  }

  static obtenerFarmacosPredefinidos() {
    return FARMACOS_PREDEFINIDOS;
  }
}

module.exports = {
  VeterinaryDoseCalculator,
  CONTRAINDICACIONES,
  FARMACOS_PREDEFINIDOS
};
