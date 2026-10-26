// Interfaz: arma el formulario a partir de datos.js, llama a calcular() en cada cambio y dibuja el desarrollo paso a paso.
(function () {
  'use strict';

  const D = window.AWS_D11_DATOS;
  const M = window.AWS_D11;
  const { ESTADO, fmt } = M;
  const $ = (selector) => document.querySelector(selector);

  // Ejemplos de Precalentamiento.pdf. Solo se cargan los datos que informa cada documento.
  const EJEMPLOS = [
    {
      id: 'ej1',
      nombre: 'Ejercicio 1 — Precalentamiento.pdf, diap. 20 (20 mm, E7018)',
      nota: 'El ejercicio no informa Mo, V ni B (se toman como 0 %). Con E7018 el nivel es H1 o H2 según el secado y el tiempo de exposición: elija la condición de uso en el paso 3 (B6.2.2). La restricción no se indica.',
      composicion: { C: '0.22', Mn: '1.3', Si: '0.3', Cr: '0.4', Ni: '0.3', Cu: '0.02' },
      espesor: '20',
      consumible: 'E7018',
    },
    {
      id: 'ej2',
      nombre: 'Ejercicio 2 — Acero A36, Precalentamiento.pdf, diap. 24 (8 mm)',
      nota: 'P = 0,04 y S = 0,05 no intervienen en el CE ni en el Pcm. El ejercicio no indica el consumible ni la restricción.',
      composicion: { C: '0.25', Mn: '0.8', Si: '0.4', Cu: '0.2' },
      espesor: '8',
    },
    {
      id: 'ej3',
      nombre: 'Ejercicio 3 — ASTM A588 Gr. B, Precalentamiento.pdf, diap. 25 (25 mm, E7018)',
      nota: 'Se usan los máximos de la especificación, como permite B6.1.1(3). Mo y B no tienen requisito y se toman como 0 %. Elija la condición de uso del E7018 y la restricción.',
      composicion: { C: '0.20', Mn: '1.35', Si: '0.50', Cr: '0.70', V: '0.10', Ni: '0.50', Cu: '0.40' },
      espesor: '25',
      consumible: 'E7018',
    },
  ];

  let marcarFaltantes = false;

  function esc(texto) {
    return String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function refs(lista) {
    if (!lista || lista.length === 0) return '';
    const textos = lista.map((id) => `${id}, p. ${D.REFERENCIAS[id].pagina}`);
    return ` <span class="ref">(${esc(textos.join('; '))})</span>`;
  }

  /* ------------------------------------------------------------------------
     Formulario
     ------------------------------------------------------------------------ */
  function construirFormulario() {
    $('#composicion').innerHTML = D.ELEMENTOS.map(({ id, nombre }) => `
      <div class="elemento">
        <label for="el-${id}"><b>${id}</b><small>${nombre}</small></label>
        <input id="el-${id}" class="control" data-elemento="${id}" inputmode="decimal" autocomplete="off" placeholder="${id === 'C' ? 'obligatorio' : '0'}">
      </div>`).join('');

    $('#hidrogeno').innerHTML = Object.entries(D.HIDROGENO).map(([nivel, h]) => `
      <label class="opcion">
        <input type="radio" name="hidrogeno" value="${nivel}">
        <span class="opcion__titulo">${nivel} · ${h.nombre}<em>H = ${h.H} ml/100 g para el IS</em></span>
        <span class="opcion__texto">${esc(h.criterio)}</span>
        ${h.cumple.length ? `<ul>${h.cumple.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : '<span></span>'}
      </label>`).join('');

    const grupo = (proceso) => `<optgroup label="${proceso}">${D.CONSUMIBLES.filter((c) => c.proceso === proceso)
      .map((c) => `<option value="${c.id}">${c.id} — ${c.proceso}, ${c.especificacion}</option>`).join('')}</optgroup>`;
    $('#consumible').innerHTML = `<option value="">Otro / elegir el nivel H directamente</option>${grupo('SMAW')}${grupo('GMAW')}`;

    $('#restriccion').innerHTML = Object.entries(D.RESTRICCIONES).map(([id, rr]) => `
      <label class="opcion">
        <input type="radio" name="restriccion" value="${id}">
        <span class="opcion__titulo">Restricción ${rr.nombre.toLowerCase()}</span>
        <span class="opcion__texto">${esc(rr.descripcion)}</span>
        <span class="opcion__texto">${esc(rr.comentario)} <span class="ref">(Comentario, p. 614)</span></span>
      </label>`).join('');

    $('#ejemplo').insertAdjacentHTML('beforeend', EJEMPLOS.map((e) => `<option value="${e.id}">${esc(e.nombre)}</option>`).join(''));
  }

  /** Muestra la ficha y las condiciones de uso del consumible elegido; sin consumible, los niveles H1–H3. */
  function pintarConsumible() {
    const c = D.CONSUMIBLES.find((x) => x.id === $('#consumible').value);
    $('#ficha-consumible').hidden = !c;
    $('#condicion').hidden = !c;
    $('#hidrogeno').hidden = Boolean(c);
    if (!c) {
      $('#condicion').innerHTML = '';
      return;
    }
    const fuentes = c.fuentes.map((id) => D.FUENTES_CURSO[id]).filter(Boolean);
    $('#ficha-consumible').innerHTML = `
      <p><b>${esc(c.id)}</b> · ${esc(c.proceso)} · ${esc(c.especificacion)}. ${esc(c.descripcion)}</p>
      <p>${esc(c.limitaciones)}</p>
      <p>Fuentes: ${esc(fuentes.join('; '))}.</p>`;
    $('#condicion').innerHTML = c.condiciones.map((k) => `
      <label class="opcion">
        <input type="radio" name="condicion" value="${k.id}"${c.condiciones.length === 1 ? ' checked' : ''}>
        <span class="opcion__titulo">${k.nivel} · ${esc(D.HIDROGENO[k.nivel].nombre)}<em>H = ${D.HIDROGENO[k.nivel].H} ml/100 g</em></span>
        <span class="opcion__texto">${esc(k.descripcion)} <span class="ref">(B6.2.2, p. 355–356)</span></span>
      </label>`).join('');
  }

  function valorRadio(nombre) {
    return document.querySelector(`input[name="${nombre}"]:checked`)?.value ?? '';
  }

  function marcarRadio(nombre, valor) {
    for (const input of document.querySelectorAll(`input[name="${nombre}"]`)) input.checked = input.value === valor;
  }

  function leerEntrada() {
    const composicion = {};
    for (const { id } of D.ELEMENTOS) composicion[id] = $(`#el-${id}`).value;
    return {
      composicion,
      unidad: valorRadio('unidad'),
      espesor: $('#espesor').value,
      consumible: $('#consumible').value,
      condicion: valorRadio('condicion'),
      hidrogeno: valorRadio('hidrogeno'),
      restriccion: valorRadio('restriccion'),
      tipoSoldadura: valorRadio('tipo'),
    };
  }

  function pintarCampos(r) {
    const comp = r.composicion;
    for (const { id } of D.ELEMENTOS) {
      const invalido = Boolean(comp.errores[id]) || (id === 'C' && comp.faltaCarbono && marcarFaltantes);
      $(`#el-${id}`).setAttribute('aria-invalid', String(invalido));
    }
    const mensajes = Object.entries(comp.errores).map(([id, t]) => `${id}: ${t}`);
    if (comp.errorSuma) mensajes.push(comp.errorSuma);
    if (comp.faltaCarbono && marcarFaltantes) mensajes.push('Ingrese el contenido de carbono.');
    $('#err-composicion').hidden = mensajes.length === 0;
    $('#err-composicion').textContent = mensajes.join(' ');

    const errEspesor = r.errores.find((e) => e.campo === 'espesor');
    const faltaEspesor = marcarFaltantes && r.faltantes.some((f) => f.campo === 'espesor');
    $('#espesor').setAttribute('aria-invalid', String(Boolean(errEspesor) || faltaEspesor));
    $('#err-espesor').hidden = !errEspesor && !faltaEspesor;
    $('#err-espesor').textContent = errEspesor ? errEspesor.texto.replace('Espesor: ', '') : 'Ingrese el espesor.';

    for (const [id, campos] of [['hidrogeno', ['hidrogeno', 'condicion']], ['restriccion', ['restriccion']]]) {
      const falta = marcarFaltantes && r.faltantes.some((f) => campos.includes(f.campo));
      $(`#${id}`).closest('.paso-form').classList.toggle('paso-form--falta', falta);
    }
  }

  const CAMPO_FOCO = {
    C: '#el-C', hidrogeno: '#consumible', condicion: 'input[name="condicion"]', espesor: '#espesor',
    restriccion: 'input[name="restriccion"]', composicion: '#el-C',
  };

  function enfocarCampo(campo) {
    const el = document.querySelector(CAMPO_FOCO[campo] ?? `#el-${campo}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------------------
     Resultados
     ------------------------------------------------------------------------ */
  function textoTemperatura(t) {
    return `${t.menorQue ? '&lt;&#8239;' : ''}${t.valor}<small>${t.unidad}</small>`;
  }

  function renderHero(r) {
    if (r.estado === ESTADO.COMPLETO) {
      const t = r.temperatura;
      return `
        <section class="tarjeta hero" aria-label="Resultado">
          <div class="hero__fila">
            <div>
              <p class="hero__etiqueta">Temperatura mínima de precalentamiento y entre pasadas</p>
              <p class="hero__valor">${textoTemperatura(t)}</p>
            </div>
            <span class="estado estado--ok">✓ Calculado · AWS D1.1 Apéndice B</span>
          </div>
          <p class="hero__detalle">${r.consumible ? `Aporte <b>${esc(r.consumible.id)}</b> (${esc(r.consumible.proceso)}) · ` : ''}Hidrógeno <b>${r.hidrogeno.nivel}</b> · Grupo <b>${r.grupo.letra}</b> · Restricción <b>${esc(r.restriccion.nombre.toLowerCase())}</b> ·
            Espesor <b>${esc(fmt(r.espesor.valor, decimalesEspesor(r.espesor.valor)))} ${esc(r.espesor.unidad)}</b> (banda «${esc(r.espesor.banda)}») ·
            ${esc(D.REFERENCIAS[t.referencia].texto)}, p. ${D.REFERENCIAS[t.referencia].pagina}</p>
          ${t.menorQue ? `<p class="hero__detalle">«&lt;» indica que temperaturas menores que ${esc(t.texto)} pueden ser adecuadas para evitar el agrietamiento por hidrógeno (nota a).</p>` : ''}
        </section>`;
    }
    if (r.estado === ESTADO.ERROR) {
      return `
        <section class="tarjeta hero hero--error" aria-label="Resultado">
          <div class="hero__fila">
            <p class="hero__etiqueta">Hay datos no válidos. Corríjalos para calcular:</p>
            <span class="estado estado--error">× Error de entrada</span>
          </div>
          <ul class="faltantes">${r.errores.map((e) => `<li><button type="button" data-campo="${esc(e.campo)}">${esc(e.texto)}</button></li>`).join('')}</ul>
        </section>`;
    }
    if (r.estado === ESTADO.NO_APLICABLE) {
      return `
        <section class="tarjeta hero hero--no-aplicable" aria-label="Resultado">
          <div class="hero__fila">
            <p class="hero__etiqueta">El método de control de hidrógeno no cubre este acero</p>
            <span class="estado estado--no-aplicable">! No aplicable</span>
          </div>
          <p>${esc(r.motivoNoAplicable)}${refs(['Tabla B.1'])}</p>
        </section>`;
    }
    return `
      <section class="tarjeta hero hero--pendiente" aria-label="Resultado">
        <div class="hero__fila">
          <div>
            <p class="hero__etiqueta">Temperatura mínima de precalentamiento y entre pasadas</p>
            <p class="hero__valor" aria-label="sin calcular">—</p>
          </div>
          <span class="estado estado--pendiente">○ Faltan datos</span>
        </div>
        <p class="hero__detalle">Complete:</p>
        <ul class="faltantes">${r.faltantes.map((f) => `<li><button type="button" data-campo="${esc(f.campo)}">${esc(f.texto)}</button></li>`).join('')}</ul>
      </section>`;
  }

  function decimalesEspesor(valor) {
    return Number.isInteger(valor) ? 0 : Math.min(3, String(valor).split('.')[1]?.length ?? 0);
  }

  function renderIndices(r) {
    const celda = (titulo, valor) => `<div class="indice"><dt>${titulo}</dt><dd class="${valor === null ? 'vacio' : ''}">${valor ?? '—'}</dd></div>`;
    const zona = r.zona ? (r.zona.zona ? D.FIGURA_B1.zonas[r.zona.zona].nombre : 'Fuera') : null;
    return `
      <dl class="indices" aria-label="Índices">
        ${celda('CE', r.ce ? `${fmt(r.ce.valor, 3)} %` : null)}
        ${celda('Pcm', r.pcm ? `${fmt(r.pcm.valor, 4)} %` : null)}
        ${celda('Índice de susceptibilidad', r.is ? fmt(r.is.valor, 3) : null)}
        ${celda('Grupo (Tabla B.1)', r.grupo?.letra ?? (r.grupo?.fueraDeTabla ? 'Fuera' : null))}
        ${celda('Zona (Figura B.1)', zona)}
      </dl>`;
  }

  function renderAvisos(r) {
    if (r.avisos.length === 0) return '';
    return `<ul class="avisos" aria-label="Observaciones">${r.avisos.map((a) => `<li class="aviso aviso--${a.tipo}"><span>${esc(a.texto)}${refs(a.refs)}</span></li>`).join('')}</ul>`;
  }

  /* Figura B.1 ------------------------------------------------------------- */
  function renderFiguraB1(r) {
    const F = D.FIGURA_B1;
    const { CEmin, CEmax, Cmin, Cmax } = F.dominio;
    const W = 360;
    const H = 262;
    const m = { izq: 46, der: 12, sup: 12, inf: 40 };
    const ancho = W - m.izq - m.der;
    const alto = H - m.sup - m.inf;
    const x = (ce) => m.izq + ((ce - CEmin) / (CEmax - CEmin)) * ancho;
    const y = (c) => m.sup + ((Cmax - c) / (Cmax - Cmin)) * alto;
    const p = (ce, c) => `${x(ce).toFixed(1)},${y(c).toFixed(1)}`;

    const cI = (ce) => M.cFronteraI(ce, F.fronteraI);
    const ceII = (c) => M.ceFronteraIIyIII(c, F.fronteraIIyIII);
    // Cruce de las dos fronteras (recta casi horizontal C = a1 + b1·CE y recta inclinada CE = a2 + b2·C).
    const fI = F.fronteraI;
    const fII = F.fronteraIIyIII;
    const b1 = (fI.p2.C - fI.p1.C) / (fI.p2.CE - fI.p1.CE);
    const a1 = fI.p1.C - b1 * fI.p1.CE;
    const b2 = (fII.p2.CE - fII.p1.CE) / (fII.p2.C - fII.p1.C);
    const a2 = fII.p1.CE - b2 * fII.p1.C;
    const cX = (a1 + b1 * a2) / (1 - b1 * b2);
    const ceX = a2 + b2 * cX;

    const zonaActual = r.zona?.zona ?? null;
    const clase = (n) => `fig-zona fig-zona--${n}${zonaActual && zonaActual !== n ? ' inactiva' : ''}`;
    const zonas = `
      <polygon class="${clase(1)}" points="${p(CEmin, Cmin)} ${p(CEmax, Cmin)} ${p(CEmax, cI(CEmax))} ${p(CEmin, cI(CEmin))}"/>
      <polygon class="${clase(2)}" points="${p(CEmin, cI(CEmin))} ${p(ceX, cX)} ${p(ceII(Cmax), Cmax)} ${p(CEmin, Cmax)}"/>
      <polygon class="${clase(3)}" points="${p(ceX, cX)} ${p(CEmax, cI(CEmax))} ${p(CEmax, Cmax)} ${p(ceII(Cmax), Cmax)}"/>`;

    let rejilla = '';
    for (let k = 0; k <= 5; k += 1) {
      const ce = 0.2 + k * 0.1;
      rejilla += `<line class="fig-rejilla" x1="${x(ce)}" y1="${y(Cmin)}" x2="${x(ce)}" y2="${y(Cmax)}"/>`;
      rejilla += `<text class="fig-texto" x="${x(ce)}" y="${y(Cmin) + 15}" text-anchor="middle">${fmt(ce, 2)}</text>`;
    }
    for (let k = 0; k <= 4; k += 1) {
      const c = k * 0.1;
      rejilla += `<line class="fig-rejilla" x1="${x(CEmin)}" y1="${y(c)}" x2="${x(CEmax)}" y2="${y(c)}"/>`;
      rejilla += `<text class="fig-texto" x="${m.izq - 6}" y="${y(c) + 4}" text-anchor="end">${fmt(c, 2)}</text>`;
    }

    const fronteras = `
      <line class="fig-frontera" x1="${x(CEmin)}" y1="${y(cI(CEmin))}" x2="${x(CEmax)}" y2="${y(cI(CEmax))}"/>
      <line class="fig-frontera" x1="${x(fII.p1.CE)}" y1="${y(fII.p1.C)}" x2="${x(ceII(Cmax))}" y2="${y(Cmax)}"/>`;

    const etiquetas = `
      <text class="fig-etiqueta" x="${x(0.44)}" y="${y(0.045)}" text-anchor="middle">ZONA I</text>
      <text class="fig-etiqueta" x="${x(0.33)}" y="${y(0.27)}" text-anchor="middle">ZONA II</text>
      <text class="fig-etiqueta" x="${x(0.665)}" y="${y(0.3)}" text-anchor="middle">ZONA III</text>`;

    let punto = '';
    let descripcion = 'sin punto';
    if (r.ce && r.zona && r.zona.zona) {
      const C = r.composicion.valores.C;
      const ce = r.ce.valor;
      punto = `
        <line class="fig-guia" x1="${x(ce)}" y1="${y(C)}" x2="${x(ce)}" y2="${y(Cmin)}"/>
        <line class="fig-guia" x1="${x(CEmin)}" y1="${y(C)}" x2="${x(ce)}" y2="${y(C)}"/>
        <circle class="fig-punto" cx="${x(ce)}" cy="${y(C)}" r="5.5"/>`;
      descripcion = `punto CE ${fmt(ce, 3)}, C ${fmt(C, 3)} en ${D.FIGURA_B1.zonas[r.zona.zona].nombre}`;
    }

    const ejes = `
      <line class="fig-eje" x1="${x(CEmin)}" y1="${y(Cmin)}" x2="${x(CEmax)}" y2="${y(Cmin)}"/>
      <line class="fig-eje" x1="${x(CEmin)}" y1="${y(Cmin)}" x2="${x(CEmin)}" y2="${y(Cmax)}"/>
      <text class="fig-titulo" x="${m.izq + ancho / 2}" y="${H - 6}" text-anchor="middle">Carbono equivalente (CE), %</text>
      <text class="fig-titulo" transform="translate(12 ${m.sup + alto / 2}) rotate(-90)" text-anchor="middle">Carbono, %</text>`;

    return `
      <figure class="figura" style="margin:0">
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Figura B.1, zona de clasificación de aceros: ${esc(descripcion)}">
          ${zonas}${rejilla}${fronteras}${etiquetas}${ejes}${punto}
        </svg>
        <figcaption>Figura B.1 (p. 359), redibujada a partir de las fronteras de la norma digitalizadas.</figcaption>
      </figure>`;
  }

  /* Tablas ----------------------------------------------------------------- */
  function renderTablaB1(r) {
    const T = D.TABLA_B1;
    const col = r.grupo && !r.grupo.fueraDeTabla ? r.grupo.columna : null;
    const fila = r.hidrogeno?.nivel ?? null;
    const filas = Object.entries(T.letras).map(([nivel, letras]) => {
      const celdas = letras.map((letra, i) => {
        let c = '';
        if (nivel === fila && i === col) c = 'elegida';
        else if (nivel === fila || i === col) c = 'cruce';
        return `<td class="${c}">${letra}</td>`;
      }).join('');
      return `<tr><th scope="row" class="${nivel === fila ? 'cruce' : ''}">${nivel}</th>${celdas}</tr>`;
    }).join('');
    return `
      <div class="tabla-caja">
        <table class="tabla">
          <caption>Tabla B.1 — Grupo del índice de susceptibilidad según el nivel de hidrógeno y el Pcm (p. 357)</caption>
          <thead>
            <tr><th scope="col" rowspan="2">Nivel de hidrógeno</th><th scope="colgroup" colspan="5">Pcm</th></tr>
            <tr>${T.etiquetas.map((e, i) => `<th scope="col" class="${i === col ? 'cruce' : ''}">${e}</th>`).join('')}</tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
      </div>`;
  }

  function renderTablaB2(r) {
    const S = D.TABLA_B2.sistemas[r.unidad];
    const letras = D.TABLA_B2.letras;
    const restr = r.restriccion?.id ?? null;
    const banda = r.espesor?.indiceBanda ?? null;
    const letra = r.grupo?.letra ? letras.indexOf(r.grupo.letra) : null;
    let cuerpo = '';
    for (const [id, info] of Object.entries(D.RESTRICCIONES)) {
      const atenuar = restr !== null && restr !== id;
      S.temperaturas[id].forEach((fila, b) => {
        const filaCruce = !atenuar && restr !== null && b === banda;
        const celdas = fila.map((texto, l) => {
          let c = atenuar ? 'atenuada' : '';
          if (!atenuar && restr !== null && b === banda && l === letra) c = 'elegida';
          else if (filaCruce || (!atenuar && l === letra)) c = 'cruce';
          return `<td class="${c}">${texto.replace('<', '&lt;&#8239;')}</td>`;
        }).join('');
        cuerpo += `<tr class="${b === 0 ? 'bloque-inicio' : ''}">
          ${b === 0 ? `<th scope="rowgroup" rowspan="5" class="grupo-restriccion ${atenuar ? 'atenuada' : ''}">${info.nombre}</th>` : ''}
          <th scope="row" class="${filaCruce ? 'cruce' : ''} ${atenuar ? 'atenuada' : ''}">${esc(S.bandas[b].etiqueta)}</th>${celdas}</tr>`;
      });
    }
    return `
      <div class="tabla-caja">
        <table class="tabla">
          <caption>Tabla B.2 — Temperaturas mínimas de precalentamiento y entre pasadas (${S.unidadTemperatura}; espesor en ${S.unidadEspesor}), p. ${D.REFERENCIAS[S.referencia].pagina}</caption>
          <thead><tr><th scope="col">Restricción</th><th scope="col">Espesor (${S.unidadEspesor})</th>${letras.map((l, i) => `<th scope="col" class="${i === letra ? 'cruce' : ''}">${l}</th>`).join('')}</tr></thead>
          <tbody>${cuerpo}</tbody>
        </table>
      </div>`;
  }

  /* Pasos ------------------------------------------------------------------ */
  function paso(titulo, referencias, contenido) {
    return `
      <article class="paso">
        <div class="paso__cabeza"><h3>${titulo}</h3>${refs(referencias)}</div>
        ${contenido}
      </article>`;
  }

  const PENDIENTE = (texto) => `<p class="pendiente">${texto}</p>`;

  function pasoCE(r) {
    let formula = `<div class="formula">${esc(D.FORMULAS.CE.texto)}`;
    if (r.ce) formula += `<br>CE = ${esc(r.ce.sustitucion)}<br>CE = <span class="resultado">${fmt(r.ce.valor, 3)} %</span>`;
    formula += '</div>';

    let zonaTexto = PENDIENTE('Ingrese la composición para ubicar el acero en la figura.');
    if (r.zona && r.zona.zona === null) {
      zonaTexto = `<div class="zona-texto"><p>El punto queda <b>fuera de la Figura B.1</b> (${esc(r.zona.fuera)}). La figura no se extrapola; la temperatura por control de hidrógeno se informa igualmente.</p></div>`;
    } else if (r.zona) {
      const z = D.FIGURA_B1.zonas[r.zona.zona];
      zonaTexto = `
        <div class="zona-texto">
          <p>Con C = ${esc(r.composicion.mostrados.C)} % y CE = ${fmt(r.ce.valor, 3)} % el acero queda en
            <span class="zona-chip zona-chip--${r.zona.zona}">${z.nombre}</span>${r.zona.enFrontera ? ` (sobre la frontera ${r.zona.enFrontera})` : ''}.</p>
          <p>${esc(z.comportamiento)}</p>
          <p><b>Método según B5.2:</b> ${esc(z.accion)}</p>
        </div>`;
    }
    return paso('Carbono equivalente y zona del acero', ['B5.1', 'B5.2', 'Figura B.1'],
      `${formula}<div class="dos-columnas">${renderFiguraB1(r)}${zonaTexto}</div>`);
  }

  function pasoPcm(r) {
    let formula = `<div class="formula">${esc(D.FORMULAS.PCM.texto)}`;
    if (r.pcm) formula += `<br>Pcm = ${esc(r.pcm.sustitucion)}<br>Pcm = <span class="resultado">${fmt(r.pcm.valor, 4)} %</span>`;
    formula += '</div>';
    return paso('Parámetro de composición Pcm', ['B6.2.1'], formula);
  }

  function pasoHidrogeno(r) {
    const titulo = 'Material de aporte y nivel de hidrógeno';
    if (!r.hidrogeno) {
      const texto = r.consumible
        ? `Elija la condición de uso del ${esc(r.consumible.id)}: de ella depende el nivel H1, H2 o H3.`
        : 'Elija un consumible de la base o, si no está, el nivel H1, H2 o H3.';
      return paso(titulo, ['B6.2.2'], PENDIENTE(texto));
    }
    const h = D.HIDROGENO[r.hidrogeno.nivel];
    const aporte = r.consumible
      ? `<p>Consumible <b>${esc(r.consumible.id)}</b> (${esc(r.consumible.proceso)}, ${esc(r.consumible.especificacion)}), condición de uso:
          ${esc(r.consumible.condicion.descripcion)} → <b>${r.hidrogeno.nivel}</b>.</p>`
      : '<p>Consumible fuera de la base: nivel de hidrógeno elegido directamente.</p>';
    return paso(titulo, ['B6.2.2'], `
      ${aporte}
      <p><b>${r.hidrogeno.nivel} · ${esc(h.nombre)}.</b> ${esc(h.criterio)}</p>
      <p>Para el índice de susceptibilidad se usa <b>H = ${h.H} ml/100 g</b> (Tabla B.1, nota b: H1 = 5; H2 = 10; H3 = 30).</p>`);
  }

  function pasoGrupo(r) {
    let contenido = '';
    if (r.is) {
      const termino = 12 * r.pcm.valor;
      const log = Math.log10(r.hidrogeno.H);
      contenido += `<div class="formula">IS = 12·Pcm + log<sub>10</sub> H<br>IS = 12 × ${fmt(r.pcm.valor, 4)} + log<sub>10</sub>(${r.hidrogeno.H}) = ${fmt(termino, 3)} + ${fmt(log, 3)} = <span class="resultado">${fmt(r.is.valor, 3)}</span></div>
        <p class="nota">La traducción imprime «12—Pcm»; se lee 12·Pcm, la única lectura compatible con los rangos 3,0–7,0 de la nota b.</p>`;
    } else {
      contenido += '<div class="formula">IS = 12·Pcm + log<sub>10</sub> H</div>';
    }
    if (r.grupo?.fueraDeTabla) {
      contenido += `<p>Pcm = ${fmt(r.pcm.valor, 4)} ≥ 0,38: fuera de la Tabla B.1, no se asigna grupo.</p>`;
    } else if (r.grupo?.letra) {
      contenido += `<p>Pcm = ${fmt(r.pcm.valor, 4)} → columna «Pcm ${D.TABLA_B1.etiquetas[r.grupo.columna]}»; fila ${r.hidrogeno.nivel} → <b>grupo ${r.grupo.letra}</b>.
        ${r.is.notaB.letra === r.grupo.letra ? `Coincide con el rango ${esc(r.is.notaB.texto)} de la nota b.` : ''}</p>`;
    } else {
      contenido += PENDIENTE('Se necesitan el Pcm y el nivel de hidrógeno.');
    }
    contenido += renderTablaB1(r);
    return paso('Índice de susceptibilidad y grupo', ['B6.2.3', 'Tabla B.1'], contenido);
  }

  function pasoTemperatura(r) {
    const S = D.TABLA_B2.sistemas[r.unidad];
    let texto;
    if (r.temperatura) {
      texto = `<p>Restricción ${esc(r.restriccion.nombre.toLowerCase())}, espesor ${esc(fmt(r.espesor.valor, decimalesEspesor(r.espesor.valor)))} ${esc(r.espesor.unidad)} (banda «${esc(r.espesor.banda)}») y grupo ${r.grupo.letra}
        → <b>${esc(r.temperatura.texto)}</b>. La tabla se lee por intervalos: no se interpola ni se redondea.</p>`;
    } else {
      const falta = [];
      if (!r.grupo?.letra) falta.push('el grupo');
      if (!r.espesor) falta.push('el espesor');
      if (!r.restriccion) falta.push('la restricción');
      texto = PENDIENTE(`Se necesitan ${falta.join(', ').replace(/, ([^,]*)$/, ' y $1')}.`);
    }
    return paso('Temperatura mínima de precalentamiento y entre pasadas', ['B6.2.4', S.referencia], texto + renderTablaB2(r));
  }

  function renderDatos(r, entrada) {
    const comp = D.ELEMENTOS.map(({ id }) => {
      const v = r.composicion.mostrados[id];
      return `${id} ${v === undefined ? '—' : esc(v)}${r.composicion.ceros.includes(id) ? '*' : ''}`;
    }).join(' · ');
    const h = r.hidrogeno ? `${r.hidrogeno.nivel} (${esc(r.hidrogeno.nombre)})` : '—';
    const espesor = r.espesor ? `${esc(fmt(r.espesor.valor, decimalesEspesor(r.espesor.valor)))} ${esc(r.espesor.unidad)}` : '—';
    const tipo = { ranura: 'Ranura', filete: 'Filete' }[entrada.tipoSoldadura] ?? 'Sin indicar';
    return `
      <section class="tarjeta">
        <h3>Datos usados</h3>
        <dl class="lista-datos">
          <dt>Composición (%)</dt><dd class="mono">${comp}${r.composicion.ceros.length ? '<br><span class="nota">* sin dato, tomado como 0 %</span>' : ''}</dd>
          <dt>Sistema</dt><dd>${r.unidad === 'in' ? 'Pulgadas → Tabla B.2 en °F' : 'Milímetros → Tabla B.2 en °C'}</dd>
          <dt>Material de aporte</dt><dd>${r.consumible ? `${esc(r.consumible.id)} (${esc(r.consumible.proceso)}, ${esc(r.consumible.especificacion)})` : 'Fuera de la base'}</dd>
          <dt>Hidrógeno</dt><dd>${h}</dd>
          <dt>Espesor</dt><dd>${espesor}</dd>
          <dt>Restricción</dt><dd>${r.restriccion ? esc(r.restriccion.nombre) : '—'}</dd>
          <dt>Tipo de soldadura</dt><dd>${tipo}</dd>
        </dl>
      </section>`;
  }

  function renderNotas() {
    const notas = [
      ['El método supone que la HAZ se endurece totalmente (un único cordón de baja entrada de calor, como una pasada de raíz); por eso el precalentamiento predicho puede ser demasiado conservador para aceros al carbono.', ['B4']],
      ['El Apéndice B es una alternativa a la Tabla 5.8 y puede predecir temperaturas mayores. Temperaturas inferiores a las de la Tabla 5.8 o a las calculadas con el Apéndice B solo pueden usarse si las aprueba el Ingeniero y se califican con el ensayo de la WPS.', ['B1', '6.8.4']],
      ['El resultado depende de la restricción elegida, que se clasifica según la experiencia, el análisis de ingeniería, la investigación o el cálculo.', ['B6.2.5']],
      ['Las unidades de EE. UU. y del SI no son equivalentes exactos: un espesor en mm se evalúa con la tabla en °C y uno en pulgadas con la tabla en °F.', ['1.2']],
    ];
    return `
      <section class="tarjeta">
        <h3>Consideraciones de la norma</h3>
        <ul class="notas-norma">${notas.map(([t, r]) => `<li>${esc(t)}${refs(r)}</li>`).join('')}</ul>
      </section>`;
  }

  function renderReferencias(r) {
    const usadas = ['1.2', '6.8.4', 'B1', 'B4', 'B5.1', 'B5.2', 'B6.1.1', 'B6.2.1', 'B6.2.2', 'B6.2.3', 'B6.2.4', 'B6.2.5', 'Tabla B.1',
      D.TABLA_B2.sistemas[r.unidad].referencia, 'Figura B.1', 'C-B'];
    if (r.espesor && r.avisos.some((a) => a.refs.includes('1.4'))) usadas.splice(1, 0, '1.4');
    return `
      <section class="tarjeta">
        <h3>Referencias — ${esc(D.norma)}</h3>
        <ul class="referencias">${usadas.map((id) => `<li>${esc(D.REFERENCIAS[id].texto)} — p. ${D.REFERENCIAS[id].pagina}</li>`).join('')}</ul>
        <p class="nota">Archivo: «${esc(D.archivo)}». Páginas impresas (página del PDF = impresa + 29).</p>
      </section>`;
  }

  function render(r, entrada) {
    return `
      ${renderHero(r)}
      ${renderIndices(r)}
      ${renderAvisos(r)}
      <section class="tarjeta">
        <h3>Desarrollo</h3>
        <div class="pasos">${pasoCE(r)}${pasoPcm(r)}${pasoHidrogeno(r)}${pasoGrupo(r)}${pasoTemperatura(r)}</div>
      </section>
      ${renderDatos(r, entrada)}
      ${renderNotas()}
      ${renderReferencias(r)}`;
  }

  /* ------------------------------------------------------------------------
     Eventos
     ------------------------------------------------------------------------ */
  let ultimo = null;

  function actualizar() {
    const entrada = leerEntrada();
    ultimo = M.calcular(entrada, D);
    pintarCampos(ultimo);
    $('#salida').innerHTML = render(ultimo, entrada);
  }

  function cargarEjemplo(id) {
    const ej = EJEMPLOS.find((e) => e.id === id);
    $('#nota-ejemplo').hidden = !ej;
    if (!ej) return;
    $('#nota-ejemplo').textContent = ej.nota;
    for (const { id: el } of D.ELEMENTOS) $(`#el-${el}`).value = ej.composicion[el] ?? '';
    marcarRadio('unidad', 'mm');
    $('#unidad-espesor').textContent = 'mm';
    $('#ayuda-espesor').textContent = AYUDA_ESPESOR;
    $('#espesor').value = ej.espesor;
    $('#consumible').value = ej.consumible ?? '';
    pintarConsumible();
    marcarRadio('hidrogeno', ej.hidrogeno ?? '');
    marcarRadio('restriccion', '');
    marcarRadio('tipo', '');
    marcarFaltantes = false;
    actualizar();
  }

  function limpiar() {
    $('#formulario').reset();
    pintarConsumible();
    $('#nota-ejemplo').hidden = true;
    $('#unidad-espesor').textContent = 'mm';
    $('#ayuda-espesor').textContent = AYUDA_ESPESOR;
    marcarFaltantes = false;
    actualizar();
  }

  function temaEfectivo() {
    const fijado = document.documentElement.dataset.theme;
    if (fijado === 'light' || fijado === 'dark') return fijado;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function pintarBotonTema() {
    const oscuro = temaEfectivo() === 'dark';
    $('#tema').textContent = oscuro ? 'Tema claro' : 'Tema oscuro';
    $('#tema').setAttribute('aria-pressed', String(oscuro));
  }

  let AYUDA_ESPESOR = '';

  function iniciar() {
    construirFormulario();
    AYUDA_ESPESOR = $('#ayuda-espesor').textContent;
    const form = $('#formulario');

    form.addEventListener('input', (e) => {
      if (e.target.id === 'ejemplo') return;
      if (e.target.id === 'espesor') $('#ayuda-espesor').textContent = AYUDA_ESPESOR;
      actualizar();
    });
    form.addEventListener('change', (e) => {
      if (e.target.id === 'ejemplo') {
        cargarEjemplo(e.target.value);
        return;
      }
      if (e.target.id === 'consumible') pintarConsumible();
      if (e.target.name === 'unidad') {
        const unidad = e.target.value === 'in' ? 'pulg' : 'mm';
        $('#unidad-espesor').textContent = unidad;
        if ($('#espesor').value.trim() !== '') {
          // Los sistemas son independientes (AWS 1.2): no se convierte el valor, se pide de nuevo en la otra unidad.
          $('#espesor').value = '';
          $('#ayuda-espesor').textContent = `Se borró el espesor al cambiar de sistema: ingréselo en ${unidad} (AWS 1.2).`;
        }
      }
      actualizar();
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      marcarFaltantes = true;
      actualizar();
      const primero = ultimo.errores[0] ?? ultimo.faltantes[0];
      if (primero) enfocarCampo(primero.campo);
      else {
        $('#resultados').scrollIntoView({ behavior: 'smooth', block: 'start' });
        $('#resultados').focus({ preventScroll: true });
      }
    });
    $('#limpiar').addEventListener('click', limpiar);
    $('#salida').addEventListener('click', (e) => {
      const boton = e.target.closest('button[data-campo]');
      if (boton) enfocarCampo(boton.dataset.campo);
    });

    $('#tema').addEventListener('click', () => {
      const nuevo = temaEfectivo() === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = nuevo;
      try { localStorage.setItem('aws-d11-tema', nuevo); } catch (err) { /* sin almacenamiento: el cambio dura esta visita */ }
      pintarBotonTema();
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', pintarBotonTema);

    // La impresión siempre usa el tema claro.
    let temaAntesDeImprimir = null;
    window.addEventListener('beforeprint', () => {
      temaAntesDeImprimir = document.documentElement.dataset.theme ?? '';
      document.documentElement.dataset.theme = 'light';
    });
    window.addEventListener('afterprint', () => {
      if (temaAntesDeImprimir) document.documentElement.dataset.theme = temaAntesDeImprimir;
      else delete document.documentElement.dataset.theme;
    });
    $('#imprimir').addEventListener('click', () => window.print());

    pintarBotonTema();
    actualizar();
  }

  if (!D || !M) {
    document.body.insertAdjacentHTML('afterbegin', '<p style="padding:16px;color:#a3262b">No se pudieron cargar datos.js o calculo.js. Mantenga los cinco archivos de la aplicación en la misma carpeta.</p>');
    return;
  }
  iniciar();
})();
