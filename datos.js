// Datos de AWS D1.1/D1.1M:2020 (es), Apéndice B — método de control de hidrógeno.
// Transcritos de «AWS D1.1 2020 Español.pdf» (página del PDF = página impresa + 29) y verificados contra la imagen de cada página.
// Script clásico para que la aplicación funcione con doble clic en index.html (sin servidor); también se importa desde las pruebas.
(function (raiz) {
  'use strict';

  const REFERENCIAS = {
    '1.2': { texto: 'AWS D1.1:2020, 1.2 Unidades de medida estándar', pagina: '1' },
    '1.4': { texto: 'AWS D1.1:2020, 1.4 Aplicabilidad', pagina: '2' },
    '6.8.4': { texto: 'AWS D1.1:2020, 6.8.4 Temperaturas de precalentamiento y entre pasadas', pagina: '126' },
    'B1': { texto: 'Apéndice B, B1 Introducción', pagina: '353' },
    'B4': { texto: 'Apéndice B, B4 Control de hidrógeno', pagina: '354' },
    'B5.1': { texto: 'Apéndice B, B5.1 Selección del método (CE)', pagina: '354' },
    'B5.2': { texto: 'Apéndice B, B5.2 Comportamiento de cada zona', pagina: '355' },
    'B6.1.1': { texto: 'Apéndice B, B6.1.1 Origen del análisis químico', pagina: '355' },
    'B6.2.1': { texto: 'Apéndice B, B6.2.1 Parámetro de composición Pcm', pagina: '355' },
    'B6.2.2': { texto: 'Apéndice B, B6.2.2 Nivel de hidrógeno', pagina: '355–356' },
    'B6.2.3': { texto: 'Apéndice B, B6.2.3 Grupo del índice de susceptibilidad', pagina: '356' },
    'B6.2.4': { texto: 'Apéndice B, B6.2.4 Temperaturas mínimas de precalentamiento y entre pasadas', pagina: '356' },
    'B6.2.5': { texto: 'Apéndice B, B6.2.5 Restricción', pagina: '356' },
    'Tabla B.1': { texto: 'Tabla B.1 Agrupamiento del índice de susceptibilidad', pagina: '357' },
    'Tabla B.2 °F': { texto: 'Tabla B.2 en °F (espesor en pulgadas)', pagina: '357' },
    'Tabla B.2 °C': { texto: 'Tabla B.2 en °C (espesor en mm)', pagina: '358' },
    'Figura B.1': { texto: 'Figura B.1 Zona de clasificación de aceros', pagina: '359' },
    'C-B': { texto: 'Comentario del Apéndice B, «Restricción»', pagina: '614' },
  };

  // Orden de los elementos igual al de la diapositiva 28 de Precalentamiento.pdf.
  const ELEMENTOS = [
    { id: 'C', nombre: 'Carbono' },
    { id: 'Mn', nombre: 'Manganeso' },
    { id: 'Si', nombre: 'Silicio' },
    { id: 'Cr', nombre: 'Cromo' },
    { id: 'Mo', nombre: 'Molibdeno' },
    { id: 'V', nombre: 'Vanadio' },
    { id: 'Ni', nombre: 'Níquel' },
    { id: 'Cu', nombre: 'Cobre' },
    { id: 'B', nombre: 'Boro' },
  ];

  // Cada término es «coeficiente × elemento / divisor»; se usan fracciones para mostrar la fórmula tal como la imprime la norma.
  const FORMULAS = {
    CE: {
      nombre: 'Carbono equivalente',
      texto: 'CE = C + (Mn + Si)/6 + (Cr + Mo + V)/5 + (Ni + Cu)/15',
      terminos: [
        { elementos: ['C'], divisor: 1 },
        { elementos: ['Mn', 'Si'], divisor: 6 },
        { elementos: ['Cr', 'Mo', 'V'], divisor: 5 },
        { elementos: ['Ni', 'Cu'], divisor: 15 },
      ],
      referencias: ['B5.1', 'Figura B.1'],
    },
    PCM: {
      nombre: 'Parámetro de composición',
      texto: 'Pcm = C + Si/30 + Mn/20 + Cu/20 + Ni/60 + Cr/20 + Mo/15 + V/10 + 5B',
      terminos: [
        { elementos: ['C'], divisor: 1 },
        { elementos: ['Si'], divisor: 30 },
        { elementos: ['Mn'], divisor: 20 },
        { elementos: ['Cu'], divisor: 20 },
        { elementos: ['Ni'], divisor: 60 },
        { elementos: ['Cr'], divisor: 20 },
        { elementos: ['Mo'], divisor: 15 },
        { elementos: ['V'], divisor: 10 },
        { elementos: ['B'], divisor: 1, factor: 5 },
      ],
      referencias: ['B6.2.1'],
    },
  };

  const HIDROGENO = {
    H1: {
      nombre: 'Hidrógeno extra bajo',
      criterio: 'Hidrógeno difusible menor que 5 ml/100 g de metal depositado (ISO 3690-1976) o humedad del recubrimiento del electrodo de 0,2 % máximo (AWS A5.1 o A5.5).',
      cumple: [
        'Electrodos de bajo hidrógeno de contenedores herméticamente sellados, secados a 370–430 °C [700–800 °F] durante una hora y usados dentro de las dos horas de ser retirados.',
        'GMAW con alambres sólidos limpios.',
      ],
      H: 5,
    },
    H2: {
      nombre: 'Bajo hidrógeno',
      criterio: 'Hidrógeno difusible menor que 10 ml/100 g de metal depositado (ISO 3690-1976) o humedad del recubrimiento del electrodo de 0,4 % máximo (AWS A5.1).',
      cumple: [
        'Electrodos de bajo hidrógeno de contenedores herméticamente sellados, acondicionados según 7.3.2.1 y usados dentro de las cuatro horas de ser retirados.',
        'SAW con fundente seco.',
      ],
      H: 10,
    },
    H3: {
      nombre: 'Hidrógeno no controlado',
      criterio: 'El resto de los consumibles que no alcanzan los requisitos de H1 o H2.',
      cumple: [],
      H: 30,
    },
  };

  const TABLA_B1 = {
    limitesPcm: [0.18, 0.23, 0.28, 0.33, 0.38],
    etiquetas: ['< 0,18', '< 0,23', '< 0,28', '< 0,33', '< 0,38'],
    letras: {
      H1: ['A', 'B', 'C', 'D', 'E'],
      H2: ['B', 'C', 'D', 'E', 'F'],
      H3: ['C', 'D', 'E', 'F', 'G'],
    },
    // Nota b: rangos del IS para cada letra (con huecos entre rangos; la nota no indica redondeo).
    rangosIS: [
      { letra: 'A', max: 3.0, texto: 'A = 3,0' },
      { letra: 'B', min: 3.1, max: 3.5, texto: 'B = 3,1–3,5' },
      { letra: 'C', min: 3.6, max: 4.0, texto: 'C = 3,6–4,0' },
      { letra: 'D', min: 4.1, max: 4.5, texto: 'D = 4,1–4,5' },
      { letra: 'E', min: 4.6, max: 5.0, texto: 'E = 4,6–5,0' },
      { letra: 'F', min: 5.1, max: 5.5, texto: 'F = 5,1–5,5' },
      { letra: 'G', min: 5.6, max: 7.0, texto: 'G = 5,6–7,0' },
    ],
  };

  const TABLA_B2 = {
    letras: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    sistemas: {
      mm: {
        unidadEspesor: 'mm',
        unidadTemperatura: '°C',
        referencia: 'Tabla B.2 °C',
        bandas: [
          { etiqueta: '< 10', max: 10, incluyeMax: false },
          { etiqueta: '10–20 incl.', min: 10, incluyeMin: true, max: 20, incluyeMax: true },
          { etiqueta: '> 20–38 incl.', min: 20, incluyeMin: false, max: 38, incluyeMax: true },
          { etiqueta: '> 38–75 incl.', min: 38, incluyeMin: false, max: 75, incluyeMax: true },
          { etiqueta: '> 75', min: 75, incluyeMin: false },
        ],
        temperaturas: {
          baja: [
            ['<20', '<20', '<20', '<20', '60', '140', '150'],
            ['<20', '<20', '20', '60', '100', '140', '150'],
            ['<20', '<20', '20', '80', '110', '140', '150'],
            ['20', '20', '40', '95', '120', '140', '150'],
            ['20', '20', '40', '95', '120', '140', '150'],
          ],
          media: [
            ['<20', '<20', '<20', '<20', '70', '140', '160'],
            ['<20', '<20', '20', '80', '115', '145', '160'],
            ['20', '20', '75', '110', '140', '150', '160'],
            ['20', '80', '110', '130', '150', '150', '160'],
            ['95', '120', '140', '150', '160', '160', '160'],
          ],
          alta: [
            ['<20', '<20', '20', '40', '110', '150', '160'],
            ['<20', '20', '65', '105', '140', '160', '160'],
            ['20', '85', '115', '140', '150', '160', '160'],
            ['115', '130', '150', '150', '160', '160', '160'],
            ['115', '130', '150', '150', '160', '160', '160'],
          ],
        },
      },
      in: {
        unidadEspesor: 'pulg',
        unidadTemperatura: '°F',
        referencia: 'Tabla B.2 °F',
        bandas: [
          { etiqueta: '< 3/8', max: 0.375, incluyeMax: false },
          { etiqueta: '3/8–3/4 incl.', min: 0.375, incluyeMin: true, max: 0.75, incluyeMax: true },
          { etiqueta: '> 3/4–1-1/2 incl.', min: 0.75, incluyeMin: false, max: 1.5, incluyeMax: true },
          { etiqueta: '> 1-1/2–3 incl.', min: 1.5, incluyeMin: false, max: 3, incluyeMax: true },
          { etiqueta: '> 3', min: 3, incluyeMin: false },
        ],
        temperaturas: {
          baja: [
            ['<65', '<65', '<65', '<65', '140', '280', '300'],
            ['<65', '<65', '65', '140', '210', '280', '300'],
            ['<65', '<65', '65', '175', '230', '280', '300'],
            ['65', '65', '100', '200', '250', '280', '300'],
            ['65', '65', '100', '200', '250', '280', '300'],
          ],
          media: [
            ['<65', '<65', '<65', '<65', '160', '280', '320'],
            ['<65', '<65', '65', '175', '240', '290', '320'],
            ['<65', '65', '165', '230', '280', '300', '320'],
            ['65', '175', '230', '265', '300', '300', '320'],
            ['200', '250', '280', '300', '320', '320', '320'],
          ],
          alta: [
            ['<65', '<65', '<65', '100', '230', '300', '320'],
            ['<65', '65', '150', '220', '280', '320', '320'],
            ['65', '185', '240', '280', '300', '320', '320'],
            ['240', '265', '300', '300', '320', '320', '320'],
            ['240', '265', '300', '300', '320', '320', '320'],
          ],
        },
      },
    },
  };

  const RESTRICCIONES = {
    baja: {
      nombre: 'Baja',
      descripcion: 'Juntas soldadas en filete y en ranura comunes, en las cuales existe una libertad razonable de movimiento de los miembros.',
      comentario: 'Intensidad de restricción k < 1000 N/mm/mm, independiente del espesor.',
    },
    media: {
      nombre: 'Media',
      descripcion: 'Juntas en filete y en ranura en las cuales, debido a que los miembros ya están fijos a una pieza estructural, existe una libertad de movimiento reducida.',
      comentario: 'k = 150 × espesor de la placa (mm): aumenta con el espesor.',
    },
    alta: {
      nombre: 'Alta',
      descripcion: 'Soldaduras en las cuales casi no existe libertad de movimiento para los miembros unidos (por ejemplo, soldaduras de reparación, especialmente en materiales de gran espesor).',
      comentario: 'k = 400 × espesor de la placa (mm): nivel severo de restricción.',
    },
  };

  // Material de aporte: dos electrodos SMAW y dos alambres GMAW (mismos datos que data/consumibles.json de la app general).
  // El nivel de hidrógeno depende del manejo del consumible (B6.2.2), por eso cada condición de uso asigna su propio nivel.
  const FUENTES_CURSO = {
    'matap-d10': 'Material de aporte 1, diap. 9–10 (designación AWS A5.1 y revestimiento)',
    'matap-d23': 'Material de aporte 1, diap. 23 (clasificación del alambre GMAW)',
    'matap-d26': 'Material de aporte 1, diap. 26 (ER70S-6, ER80S-B2: composición)',
    'guia-smaw': 'Guía APE SMAW – Carbono, II. Objetivo (E7018, E6011, E6013)',
    'selap-d18': 'Selección de material de aporte, diap. 18 (designador HZ en GMAW)',
    'aws-tabla-5.4': 'AWS D1.1:2020, Tabla 5.4 Metales de aporte (p. 73–74)',
    'aws-tabla-7.1': 'AWS D1.1:2020, Tabla 7.1 Exposición atmosférica de electrodos de bajo hidrógeno (p. 205)',
    'aws-7.3.2': 'AWS D1.1:2020, 7.3.2.1 Almacenamiento de electrodos de bajo hidrógeno (p. 189)',
    'aws-b6.2.2': 'AWS D1.1:2020, B6.2.2 Niveles de hidrógeno (p. 355–356)',
  };

  const CONSUMIBLES = [
    {
      id: 'E7018',
      proceso: 'SMAW',
      especificacion: 'AWS A5.1',
      descripcion: 'Electrodo revestido de acero al carbono. Último dígito 8: polvo de hierro, potasio y bajo hidrógeno.',
      condiciones: [
        { id: 'h1-secado', nivel: 'H1', descripcion: 'Envase herméticamente sellado; secado a 370–430 °C durante 1 h y usado dentro de las 2 h de retirado.', fuentes: ['aws-b6.2.2'] },
        { id: 'h2-acondicionado', nivel: 'H2', descripcion: 'Envase herméticamente sellado; acondicionado según AWS 7.3.2.1 y usado dentro de las 4 h de retirado.', fuentes: ['aws-b6.2.2', 'aws-7.3.2'] },
        { id: 'h3-no-verificado', nivel: 'H3', descripcion: 'Manejo distinto o no verificado (no se acredita H1 ni H2 por las condiciones anteriores ni por ensayo).', fuentes: ['aws-b6.2.2'] },
      ],
      fuentes: ['matap-d10', 'guia-smaw', 'aws-tabla-5.4', 'aws-tabla-7.1', 'aws-b6.2.2'],
      limitaciones: 'Sin nombre comercial ni contenido medido de hidrógeno difusible (ml/100 g) en las fuentes: solo la categoría AWS.',
    },
    {
      id: 'E6011',
      proceso: 'SMAW',
      especificacion: 'AWS A5.1',
      descripcion: 'Electrodo revestido de acero al carbono. Último dígito 1: alta celulosa y potasio (no es de bajo hidrógeno).',
      condiciones: [
        { id: 'h3-celulosico', nivel: 'H3', descripcion: 'Cualquier condición de uso: revestimiento celulósico, no alcanza H1 ni H2 sin un ensayo que lo demuestre.', fuentes: ['aws-b6.2.2', 'matap-d10'] },
      ],
      fuentes: ['matap-d10', 'guia-smaw', 'aws-tabla-5.4', 'aws-b6.2.2'],
      limitaciones: 'Sin contenido medido de hidrógeno difusible: el nivel H3 se asigna por exclusión (B6.2.2(3)).',
    },
    {
      id: 'ER70S-6',
      proceso: 'GMAW',
      especificacion: 'AWS A5.18',
      descripcion: 'Alambre sólido de acero al carbono (ER: electrodo o varilla; 70: resistencia en ksi; S: sólido; 6: composición química).',
      condiciones: [
        { id: 'h1-limpio', nivel: 'H1', descripcion: 'Alambre sólido limpio.', fuentes: ['aws-b6.2.2'] },
        { id: 'h3-limpieza-no-asegurada', nivel: 'H3', descripcion: 'Limpieza del alambre no asegurada (no cumple «alambre sólido limpio» y no hay ensayo).', fuentes: ['aws-b6.2.2'] },
      ],
      fuentes: ['matap-d23', 'matap-d26', 'aws-tabla-5.4', 'aws-b6.2.2', 'selap-d18'],
      limitaciones: 'Sin nombre comercial ni contenido medido de hidrógeno difusible en las fuentes.',
    },
    {
      id: 'ER80S-B2',
      proceso: 'GMAW',
      especificacion: 'AWS A5.28',
      descripcion: 'Alambre sólido de acero de baja aleación al cromo-molibdeno.',
      condiciones: [
        { id: 'h1-limpio', nivel: 'H1', descripcion: 'Alambre sólido limpio.', fuentes: ['aws-b6.2.2'] },
        { id: 'h3-limpieza-no-asegurada', nivel: 'H3', descripcion: 'Limpieza del alambre no asegurada (no cumple «alambre sólido limpio» y no hay ensayo).', fuentes: ['aws-b6.2.2'] },
      ],
      fuentes: ['matap-d23', 'matap-d26', 'aws-tabla-5.4', 'aws-b6.2.2'],
      limitaciones: 'El curso recomienda 260–300 °C al soldar aceros Cr-Mo semejantes (diap. 26); esa recomendación no es parte del Apéndice B.',
    },
  ];

  // Figura B.1: la norma solo dibuja las fronteras. Extremos de las líneas discontinuas extraídos de los trazos vectoriales
  // del PDF (p. 359) y llevados a unidades del diagrama con las marcas de los ejes; error de calibración ≤ 0,0015.
  const FIGURA_B1 = {
    dominio: { CEmin: 0.2, CEmax: 0.72, Cmin: 0, Cmax: 0.4 },
    fronteraI: { p1: { CE: 0.2, C: 0.1177 }, p2: { CE: 0.7236, C: 0.0903 } },
    fronteraIIyIII: { p1: { CE: 0.4951, C: 0.1003 }, p2: { CE: 0.6193, C: 0.425 } },
    // Criterio de la aplicación (no es de AWS): a ±0,003 de una frontera el punto se informa «sobre la frontera» y se adopta la
    // zona de número mayor, porque esa banda cubre el error de calibración y el grosor del trazo.
    tolerancia: 0.003,
    zonas: {
      1: {
        nombre: 'Zona I',
        comportamiento: 'El agrietamiento es improbable, pero puede ocurrir con hidrógeno alto o restricción alta.',
        accion: 'Usar el método de control de hidrógeno para determinar el precalentamiento.',
      },
      2: {
        nombre: 'Zona II',
        comportamiento: 'Para soldaduras en filete de pasada única sin precalentamiento, el control de dureza determina la entrada mínima de calor; si no resulta práctica, se usa el control de hidrógeno. Para soldaduras en ranura debe usarse el control de hidrógeno. En aceros de alto carbono puede requerirse entrada mínima de calor y precalentamiento en ambos tipos de soldadura.',
        accion: 'Ranura: control de hidrógeno. Filete de pasada única: control de dureza o, si no es práctico, control de hidrógeno.',
      },
      3: {
        nombre: 'Zona III',
        comportamiento: 'Debe usarse el método de control de hidrógeno, también donde se restringe la entrada de calor para preservar las propiedades de la HAZ (por ejemplo, algunos aceros templados y revenidos).',
        accion: 'Usar el método de control de hidrógeno.',
      },
    },
  };

  raiz.AWS_D11_DATOS = {
    norma: 'AWS D1.1/D1.1M:2020 (es)',
    archivo: 'AWS D1.1 2020 Español.pdf',
    REFERENCIAS,
    ELEMENTOS,
    FORMULAS,
    HIDROGENO,
    TABLA_B1,
    TABLA_B2,
    RESTRICCIONES,
    CONSUMIBLES,
    FUENTES_CURSO,
    FIGURA_B1,
    espesorMinimo: { mm: 3, in: 0.125 }, // 1.4: el código se desarrolló para espesores de 1/8 pulg [3 mm] o más.
  };
})(globalThis);
