# 📈 Simulador Financiero Pro (Colombia)

![Estado](https://img.shields.io/badge/Estado-Terminado-success)
![Licencia](https://img.shields.io/badge/Licencia-MIT-blue)

Una aplicación web moderna y responsiva diseñada para simular rendimientos de cuentas de ahorros de alto rendimiento (como Pibank, Nu, Lulo) y CDTs en Colombia. Permite realizar proyecciones financieras detalladas considerando impuestos locales como la Retención en la Fuente y el GMF (4x1000).

🔗 **[Ver Demo en Vivo](https://vercel.com/malexvrs-projects/simulador-financiero)** _(Reemplaza este enlace con tu URL de Vercel una vez desplegado)_

## 🚀 Características Principales

- **Cálculo de Interés Compuesto:** Conversión automática de Tasa Efectiva Anual (E.A.) a Nominal Mensual.
- **Parámetros Fiscales Configurables:**
  - Ajuste de tasa de Retención en la Fuente (Por defecto 7%).
  - Opción para calcular o exentar el GMF (4x1000).
- **Aportes Recurrentes:** Simulación de ahorro mensual constante.
- **Visualización de Datos:** Gráfico interactivo de crecimiento del capital vs. tiempo.
- **Exportación de Reportes:** Generación de informes en **PDF** y tablas de datos en **Excel**.
- **Diseño Responsivo:** Interfaz optimizada para móviles, tablets y escritorio.

## 🛠️ Tecnologías Utilizadas

El proyecto fue desarrollado siguiendo una arquitectura **MVC (Modelo-Vista-Controlador)** utilizando JavaScript Vainilla (sin frameworks) para garantizar ligereza y rendimiento.

- **HTML5:** Estructura semántica.
- **CSS3:** Variables CSS (Custom Properties), CSS Grid, Flexbox y diseño _Mobile-First_. Incluye un reset moderno.
- **JavaScript (ES6+):** Lógica de negocio orientada a objetos (clase `FinancialCalculator`) y manipulación del DOM desacoplada.

### Librerías Externas (CDN)

- [Chart.js](https://www.chartjs.org/): Renderizado de gráficos.
- [jsPDF](https://github.com/parallax/jsPDF): Generación de reportes PDF.
- [SheetJS (xlsx)](https://sheetjs.com/): Exportación a hojas de cálculo Excel.
- [FontAwesome](https://fontawesome.com/): Iconografía.

## 🗂️ Estructura del Proyecto

```text
/
├── index.html      # Estructura y maquetación
├── styles.css      # Estilos, variables y reset
├── script.js       # Lógica financiera y controlador de UI
└── README.md       # Documentación
```
