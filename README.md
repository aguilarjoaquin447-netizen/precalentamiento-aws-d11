# Temperatura de precalentamiento — AWS D1.1:2020, Apéndice B

Aplicación web que calcula la temperatura mínima de precalentamiento y entre pasadas de aceros estructurales con el
**método de control de hidrógeno del Apéndice B de AWS D1.1/D1.1M:2020**.

**Usar en línea:** <https://aguilarjoaquin447-netizen.github.io/precalentamiento-aws-d11/>

## Cómo usarla

### En línea (recomendado)

1. Abra el enlace anterior en Chrome, Edge o Firefox. No necesita instalar nada ni crear una cuenta.
2. Opcional: en **Cargar un ejemplo del curso** elija un ejercicio para ver un caso completo.
3. **Paso 1 · Sistema de medida:** milímetros (tabla en °C) o pulgadas (tabla en °F).
4. **Paso 2 · Composición química del acero:** ingrese C, Mn, Si, Cr, Mo, V, Ni, Cu y B en % en masa. El carbono es
   obligatorio; un campo vacío se toma como 0 % y la aplicación lo avisa.
5. **Paso 3 · Material de aporte:** elija el consumible (E7018 o E6011 para SMAW; ER70S-6 o ER80S-B2 para GMAW) y su
   condición de uso, que fija el nivel de hidrógeno H1, H2 o H3. Para otro consumible, elija el nivel directamente.
6. **Paso 4 · Espesor:** espesor de la parte más gruesa de la unión.
7. **Paso 5 · Restricción:** baja, media o alta, según la descripción de cada nivel.
8. **Paso 6 · Tipo de soldadura (opcional):** ranura o filete.
9. Lea el resultado en el panel derecho: temperatura mínima, CE, Pcm, índice de susceptibilidad, grupo de la Tabla B.1,
   zona del diagrama de Graville y el desarrollo paso a paso con las referencias a la norma. El botón **Imprimir**
   permite guardar el resultado en PDF.

### Sin internet

1. En esta página, pulse **Code → Download ZIP** y descomprima el archivo.
2. Abra `index.html` con doble clic. Mantenga juntos los cinco archivos: `index.html`, `estilos.css`, `datos.js`,
   `calculo.js` y `app.js`.

## Qué calcula

| Paso | Cálculo | Norma (página impresa) |
|---|---|---|
| 1 | CE = C + (Mn + Si)/6 + (Cr + Mo + V)/5 + (Ni + Cu)/15 y zona del acero en la Figura B.1 | B5.1 p. 354, B5.2 p. 355, Fig. B.1 p. 359 |
| 2 | Pcm = C + Si/30 + Mn/20 + Cu/20 + Ni/60 + Cr/20 + Mo/15 + V/10 + 5B | B6.2.1 p. 355 |
| 3 | Nivel de hidrógeno H1, H2 o H3 según el consumible y su condición de uso (H = 5, 10 o 30 ml/100 g) | B6.2.2 p. 355–356; Tabla B.1, nota b |
| 4 | IS = 12·Pcm + log10 H y grupo A–G de la Tabla B.1 (columna de Pcm × fila de H) | B6.2.3 p. 356; Tabla B.1 p. 357 |
| 5 | Temperatura de la Tabla B.2 según restricción, espesor de la parte más gruesa y grupo | B6.2.4–B6.2.5 p. 356; Tabla B.2 p. 357–358 |

Criterios:

- La letra del grupo se toma de la Tabla B.1 (B6.2.3); el IS numérico se muestra solo como verificación.
- La Tabla B.2 no se interpola; «< 20 °C» se muestra como cota, tal como indica su nota a.
- Las tablas en mm/°C y en pulg/°F se usan por separado (AWS 1.2).
- Un Pcm ≥ 0,38 queda fuera de la Tabla B.1 y no se extrapola.
- El método de control de dureza (Zona II, filetes de pasada única) no está incluido; la aplicación lo advierte.

## Créditos

Proyecto académico del Grupo 1 de la asignatura de Soldadura, Carrera de Ingeniería Mecánica, Universidad Técnica de
Ambato (2026). Desarrollada con la asistencia de Claude (Anthropic).

> Herramienta de apoyo académico. No sustituye la calificación del procedimiento de soldadura (WPS/PQR) ni la revisión
> de un ingeniero competente.
