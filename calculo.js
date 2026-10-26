// Cálculo de la temperatura mínima de precalentamiento y entre pasadas según AWS D1.1:2020, Apéndice B,
// método de control de hidrógeno (B6.2): Pcm → nivel de hidrógeno → grupo de la Tabla B.1 → Tabla B.2.
// El CE y la Figura B.1 se usan para indicar qué método recomienda B5.2 para la zona del acero.
// Funciones puras, sin DOM. Script clásico (doble clic en index.html) que también se importa desde las pruebas.
(function (raiz) {
  'use strict';

  const ESTADO = Object.freeze({
    COMPLETO: 'completo',
    FALTAN_DATOS: 'faltan_datos',
    ERROR: 'error',
    NO_APLICABLE: 'no_aplicable',
  });

  /** Número con coma o punto decimal. Devuelve { vacio } | { valor } | { error }. */
  function leerNumero(texto) {
    const limpio = String(texto ?? '').trim();
    if (limpio === '') return { vacio: true };
    if (limpio.startsWith('-')) return { error: 'No puede ser negativo.' };
    if (!/^(\d+([.,]\d*)?|[.,]\d+)$/.test(limpio)) return { error: 'Escriba un número (use coma o punto decimal).' };
    return { valor: Number(limpio.replace(',', '.')) };
  }

  /** Espesor: decimal en ambas unidades; en pulgadas también fracciones como 3/4, 1-1/2 o 1 1/2. */
  function leerEspesor(texto, unidad) {
    const limpio = String(texto ?? '').trim();
    if (limpio === '') return { vacio: true };
    if (unidad === 'in') {
      const fraccion = /^(?:(\d+)[\s-]+)?(\d+)\s*\/\s*(\d+)$/.exec(limpio);
      if (fraccion) {
        const [, entero, num, den] = fraccion;
        if (Number(den) === 0) return { error: 'El denominador no puede ser 0.' };
        const valor = Number(entero ?? 0) + Number(num) / Number(den);
        return valor > 0 ? { valor } : { error: 'El espesor debe ser mayor que 0.' };
      }
    }
    const numero = leerNumero(limpio);
    if (numero.error) {
      return { error: unidad === 'in' ? 'Escriba un número o una fracción (p. ej. 0,75; 3/4; 1-1/2).' : numero.error };
    }
    if (numero.valor <= 0) return { error: 'El espesor debe ser mayor que 0.' };
    return numero;
  }

  /** Elimina el ruido de coma flotante (p. ej. 0.18000000000000002) antes de comparar con los límites de la Tabla B.1. */
  function ajustar(x) {
    return Math.round(x * 1e9) / 1e9;
  }

  /** Formato con coma decimal. */
  function fmt(x, decimales) {
    return x.toFixed(decimales).replace('.', ',');
  }

  /** Valor tal como lo ingresó el usuario, con coma decimal. */
  function fmtDato(x) {
    return String(x).replace('.', ',');
  }

  function validarComposicion(textos, elementos) {
    const valores = {};
    const mostrados = {}; // valor tal como se escribió (con coma decimal), para la sustitución en las fórmulas
    const errores = {};
    const ceros = [];
    let faltaCarbono = false;
    for (const { id } of elementos) {
      const r = leerNumero(textos[id]);
      if (r.error) errores[id] = r.error;
      else if (r.vacio) {
        if (id === 'C') faltaCarbono = true;
        else {
          valores[id] = 0;
          mostrados[id] = '0';
          ceros.push(id);
        }
      } else if (r.valor > 100) errores[id] = 'Debe estar entre 0 y 100 %.';
      else {
        valores[id] = r.valor;
        mostrados[id] = fmtDato(String(textos[id]).trim());
      }
    }
    let errorSuma = null;
    if (Object.keys(errores).length === 0) {
      const suma = Object.values(valores).reduce((a, b) => a + b, 0);
      if (suma > 100) errorSuma = `La suma de los elementos (${fmt(suma, 2)} %) supera el 100 %.`;
    }
    const valida = !faltaCarbono && Object.keys(errores).length === 0 && errorSuma === null;
    return { valores, mostrados, errores, ceros, faltaCarbono, errorSuma, valida };
  }

  /** Evalúa CE o Pcm y arma la sustitución numérica término por término. */
  function evaluarFormula(formula, valores, mostrados = {}) {
    let total = 0;
    const partes = [];
    for (const { elementos, divisor, factor = 1 } of formula.terminos) {
      const suma = elementos.reduce((a, id) => a + valores[id], 0);
      total += (factor * suma) / divisor;
      const textoSuma = elementos.map((id) => mostrados[id] ?? fmtDato(valores[id])).join(' + ');
      let parte = elementos.length > 1 ? `(${textoSuma})` : textoSuma;
      if (factor !== 1) parte = `${factor}·${parte}`;
      if (divisor !== 1) parte = `${parte}/${divisor}`;
      partes.push(parte);
    }
    return { valor: ajustar(total), sustitucion: partes.join(' + ') };
  }

  /** Tabla B.1: encabezados «< 0,18 … < 0,38»; se toma la primera columna cuyo límite supera al Pcm. */
  function grupoTablaB1(pcm, nivel, tabla) {
    const columna = tabla.limitesPcm.findIndex((limite) => pcm < limite);
    if (columna === -1) return { fueraDeTabla: true, columna: null, letra: null };
    return { fueraDeTabla: false, columna, letra: tabla.letras[nivel][columna] };
  }

  /** Nota b de la Tabla B.1: ubica el IS numérico en los rangos de cada letra (solo como verificación). */
  function letraPorRangoIS(is, rangos) {
    for (const r of rangos) {
      if ((r.min === undefined || is >= r.min) && is <= r.max) return { letra: r.letra, texto: r.texto };
    }
    const ultimo = rangos[rangos.length - 1];
    if (is > ultimo.max) return { letra: null, texto: `mayor que ${fmt(ultimo.max, 1)}, fuera de los rangos de la nota b` };
    for (let k = 0; k < rangos.length - 1; k += 1) {
      if (is > rangos[k].max && is < rangos[k + 1].min) {
        return { letra: null, texto: `entre ${rangos[k].texto} y ${rangos[k + 1].texto}` };
      }
    }
    return { letra: null, texto: 'sin rango' };
  }

  function indiceBanda(valor, bandas) {
    return bandas.findIndex((b) => {
      const sobreMin = b.min === undefined || (b.incluyeMin ? valor >= b.min : valor > b.min);
      const bajoMax = b.max === undefined || (b.incluyeMax ? valor <= b.max : valor < b.max);
      return sobreMin && bajoMax;
    });
  }

  /** Celda de la Tabla B.2. «<20» se conserva como cota (nota a), no se convierte en número. */
  function leerCelda(texto, unidad) {
    const menor = /^<\s*(\d+)$/.exec(texto);
    if (menor) return { valor: Number(menor[1]), menorQue: true, texto: `< ${menor[1]} ${unidad}` };
    return { valor: Number(texto), menorQue: false, texto: `${texto} ${unidad}` };
  }

  function cFronteraI(CE, f) {
    return f.p1.C + ((CE - f.p1.CE) * (f.p2.C - f.p1.C)) / (f.p2.CE - f.p1.CE);
  }

  function ceFronteraIIyIII(C, f) {
    return f.p1.CE + ((C - f.p1.C) * (f.p2.CE - f.p1.CE)) / (f.p2.C - f.p1.C);
  }

  /** Zona de la Figura B.1 para el punto (CE, C). Fuera del dominio de la figura no se extrapola. */
  function clasificarZona(C, CE, fig) {
    const d = fig.dominio;
    const fuera = [];
    if (CE < d.CEmin) fuera.push(`CE < ${fmt(d.CEmin, 2)}`);
    if (CE > d.CEmax) fuera.push(`CE > ${fmt(d.CEmax, 2)}`);
    if (C < d.Cmin) fuera.push(`C < ${fmt(d.Cmin, 2)}`);
    if (C > d.Cmax) fuera.push(`C > ${fmt(d.Cmax, 2)}`);
    if (fuera.length > 0) return { zona: null, fuera: fuera.join('; '), enFrontera: null, adyacentes: [] };

    const tol = fig.tolerancia;
    const dI = C - cFronteraI(CE, fig.fronteraI);
    const dII = CE - ceFronteraIIyIII(C, fig.fronteraIIyIII);
    // Lado de la línea inclinada: 2 (izquierda), 3 (derecha) o null (sobre ella).
    const lado = dII > tol ? 3 : dII < -tol ? 2 : null;
    if (dI < -tol) return { zona: 1, fuera: null, enFrontera: null, adyacentes: [] };
    if (dI > tol) {
      if (lado !== null) return { zona: lado, fuera: null, enFrontera: null, adyacentes: [] };
      return { zona: 3, fuera: null, enFrontera: 'II–III', adyacentes: [2, 3] };
    }
    if (lado !== null) return { zona: lado, fuera: null, enFrontera: lado === 2 ? 'I–II' : 'I–III', adyacentes: [1, lado] };
    return { zona: 3, fuera: null, enFrontera: 'I–II–III', adyacentes: [1, 2, 3] };
  }

  function aviso(tipo, texto, refs = []) {
    return { tipo, texto, refs };
  }

  /**
   * entrada: { composicion: { C: '0,15', … }, unidad: 'mm' | 'in', espesor: '25',
   *            consumible: 'E7018' | … | '', condicion: id de la condición de uso | '', hidrogeno: 'H1' | 'H2' | 'H3' | '' (sin consumible),
   *            restriccion: 'baja' | 'media' | 'alta' | '', tipoSoldadura: 'ranura' | 'filete' | '' }
   * Cada paso se calcula en cuanto tiene sus datos; el estado indica si se llegó a la temperatura.
   */
  function calcular(entrada, datos) {
    const D = datos;
    const unidad = entrada.unidad === 'in' ? 'in' : 'mm';
    const sistema = D.TABLA_B2.sistemas[unidad];
    const r = {
      estado: null,
      unidad,
      composicion: validarComposicion(entrada.composicion ?? {}, D.ELEMENTOS),
      ce: null,
      pcm: null,
      zona: null,
      consumible: null,
      hidrogeno: null,
      is: null,
      grupo: null,
      espesor: null,
      restriccion: null,
      tipoSoldadura: entrada.tipoSoldadura === 'ranura' || entrada.tipoSoldadura === 'filete' ? entrada.tipoSoldadura : null,
      temperatura: null,
      faltantes: [],
      errores: [],
      avisos: [],
      motivoNoAplicable: null,
    };
    const comp = r.composicion;

    // Composición: CE (B5.1) y Pcm (B6.2.1).
    for (const [id, texto] of Object.entries(comp.errores)) r.errores.push({ campo: id, texto: `${id}: ${texto}` });
    if (comp.errorSuma) r.errores.push({ campo: 'composicion', texto: comp.errorSuma });
    if (comp.faltaCarbono) r.faltantes.push({ campo: 'C', texto: 'Contenido de carbono (C)' });
    if (comp.valida) {
      r.ce = evaluarFormula(D.FORMULAS.CE, comp.valores, comp.mostrados);
      r.pcm = evaluarFormula(D.FORMULAS.PCM, comp.valores, comp.mostrados);
      if (comp.ceros.length > 0) {
        r.avisos.push(aviso('precaucion',
          `Se tomaron como 0 % los elementos sin dato: ${comp.ceros.join(', ')}. Si el acero los contiene, el CE y el Pcm serán mayores.`,
          ['B6.1.1']));
      }
      r.zona = clasificarZona(comp.valores.C, r.ce.valor, D.FIGURA_B1);
    }

    // Nivel de hidrógeno (B6.2.2) y valor de H para el IS (Tabla B.1, nota b). Con un consumible de la base, el nivel lo
    // fija la condición de uso elegida; sin consumible se elige el nivel directamente.
    let nivel = entrada.hidrogeno;
    const consumible = (D.CONSUMIBLES ?? []).find((c) => c.id === entrada.consumible);
    if (consumible) {
      const condicion = consumible.condiciones.length === 1
        ? consumible.condiciones[0]
        : consumible.condiciones.find((c) => c.id === entrada.condicion);
      r.consumible = { id: consumible.id, proceso: consumible.proceso, especificacion: consumible.especificacion, condicion: condicion ?? null };
      nivel = condicion?.nivel ?? '';
      if (!condicion) r.faltantes.push({ campo: 'condicion', texto: `Condición de uso del ${consumible.id} (define H1, H2 o H3)` });
    }
    if (D.HIDROGENO[nivel]) {
      const h = D.HIDROGENO[nivel];
      r.hidrogeno = { nivel, nombre: h.nombre, H: h.H };
    } else if (!consumible) {
      r.faltantes.push({ campo: 'hidrogeno', texto: 'Material de aporte o nivel de hidrógeno (H1, H2 o H3)' });
    }

    // Espesor de la parte más gruesa (Tabla B.2, nota b).
    const esp = leerEspesor(entrada.espesor, unidad);
    if (esp.error) r.errores.push({ campo: 'espesor', texto: `Espesor: ${esp.error}` });
    else if (esp.vacio) r.faltantes.push({ campo: 'espesor', texto: 'Espesor de la parte más gruesa' });
    else {
      const indice = indiceBanda(esp.valor, sistema.bandas);
      r.espesor = { valor: esp.valor, unidad: sistema.unidadEspesor, indiceBanda: indice, banda: sistema.bandas[indice].etiqueta };
      if (esp.valor < D.espesorMinimo[unidad]) {
        r.avisos.push(aviso('precaucion',
          'AWS D1.1 se desarrolló para aceros de 1/8 pulg [3 mm] de espesor o más. Para láminas de 3/16 pulg [5 mm] o menos la norma recomienda considerar AWS D1.3.',
          ['1.4']));
      }
    }

    if (D.RESTRICCIONES[entrada.restriccion]) {
      r.restriccion = { id: entrada.restriccion, nombre: D.RESTRICCIONES[entrada.restriccion].nombre };
    } else {
      r.faltantes.push({ campo: 'restriccion', texto: 'Nivel de restricción (baja, media o alta)' });
    }

    // Índice de susceptibilidad y grupo (B6.2.3, Tabla B.1).
    if (r.pcm && r.hidrogeno) {
      const valorIS = ajustar(12 * r.pcm.valor + Math.log10(r.hidrogeno.H));
      r.is = { valor: valorIS, notaB: letraPorRangoIS(valorIS, D.TABLA_B1.rangosIS) };
    }
    if (r.pcm) {
      const nivel = r.hidrogeno ? r.hidrogeno.nivel : 'H1';
      const g = grupoTablaB1(r.pcm.valor, nivel, D.TABLA_B1);
      r.grupo = { columna: g.columna, fueraDeTabla: g.fueraDeTabla, letra: r.hidrogeno ? g.letra : null };
      if (g.fueraDeTabla) {
        r.motivoNoAplicable = `Pcm = ${fmt(r.pcm.valor, 4)} ≥ 0,38: queda fuera de la Tabla B.1. La norma no asigna grupo de susceptibilidad a este valor y no se extrapola.`;
      }
    }
    if (r.is && r.grupo?.letra && r.is.notaB.letra !== r.grupo.letra) {
      r.avisos.push(aviso('info',
        `El IS = ${fmt(r.is.valor, 3)} queda ${r.is.notaB.letra ? `en el rango ${r.is.notaB.texto}` : r.is.notaB.texto} de la nota b. La letra se toma de la Tabla B.1 por columna de Pcm y fila de hidrógeno (B6.2.3): grupo ${r.grupo.letra}.`,
        ['Tabla B.1', 'B6.2.3']));
    }

    // Selección del método según la zona (B5.2).
    if (r.zona) {
      const z = r.zona;
      if (z.zona === null) {
        r.avisos.push(aviso('precaucion',
          `El punto (CE = ${fmt(r.ce.valor, 3)}; C = ${comp.mostrados.C}) queda fuera de la Figura B.1 (${z.fuera}); la figura no se extrapola y la selección del método según B5.2 no puede confirmarse.`,
          ['Figura B.1', 'B5.2']));
      } else {
        if (z.enFrontera) {
          r.avisos.push(aviso('info',
            `El punto está sobre la frontera ${z.enFrontera} de la Figura B.1 (a ±${fmt(D.FIGURA_B1.tolerancia, 3)} o menos); se adopta la zona de número mayor, la más desfavorable.`,
            ['Figura B.1']));
        }
        if (z.zona === 2 && r.tipoSoldadura === 'filete') {
          r.avisos.push(aviso('precaucion',
            'Zona II, soldadura en filete: B5.2(2) indica primero el método de control de dureza para hallar la entrada mínima de calor de filetes de pasada única sin precalentamiento (Figuras B.2 a B.4, no incluidas en esta aplicación). Si esa entrada de calor no resulta práctica, se usa el control de hidrógeno, que es el resultado mostrado.',
            ['B5.2']));
        } else if (z.zona === 2 && r.tipoSoldadura === null) {
          r.avisos.push(aviso('info',
            'Zona II: indique si la soldadura es en ranura o en filete. En ranura B5.2(2) exige el control de hidrógeno; en filetes de pasada única indica primero el control de dureza.',
            ['B5.2']));
        }
      }
    }

    // Temperatura (B6.2.4, Tabla B.2).
    if (r.grupo?.letra && r.espesor && r.restriccion) {
      const indiceLetra = D.TABLA_B2.letras.indexOf(r.grupo.letra);
      const celda = leerCelda(sistema.temperaturas[r.restriccion.id][r.espesor.indiceBanda][indiceLetra], sistema.unidadTemperatura);
      r.temperatura = { ...celda, indiceLetra, indiceBanda: r.espesor.indiceBanda, unidad: sistema.unidadTemperatura, referencia: sistema.referencia };
      if (celda.menorQue) {
        r.avisos.push(aviso('info',
          `«${celda.texto}»: temperaturas de precalentamiento y entre pasadas menores que ${celda.texto} pueden ser adecuadas para evitar el agrietamiento por hidrógeno. Si ambas son menores que las de la Tabla 5.8, deben calificarse por ensayo (nota a).`,
          [sistema.referencia]));
      }
    }

    if (r.errores.length > 0) r.estado = ESTADO.ERROR;
    else if (r.motivoNoAplicable) r.estado = ESTADO.NO_APLICABLE;
    else if (r.temperatura) r.estado = ESTADO.COMPLETO;
    else r.estado = ESTADO.FALTAN_DATOS;
    return r;
  }

  raiz.AWS_D11 = {
    ESTADO,
    leerNumero,
    leerEspesor,
    validarComposicion,
    evaluarFormula,
    grupoTablaB1,
    letraPorRangoIS,
    indiceBanda,
    leerCelda,
    cFronteraI,
    ceFronteraIIyIII,
    clasificarZona,
    calcular,
    fmt,
    fmtDato,
  };
})(globalThis);
