# 📈 Simulador Financiero Pro (Colombia)

![Estado](https://img.shields.io/badge/Estado-Terminado-success)
![Licencia](https://img.shields.io/badge/Licencia-MIT-blue)

Una aplicación web moderna y responsiva diseñada para simular y comparar rendimientos de productos financieros en Colombia. Permite elegir entre **Cuentas de Ahorros de alta rentabilidad** (como Pibank, Nu, Lulo) y **CDTs (Certificados de Depósito a Término)**, ajustando automáticamente la lógica financiera según el tipo de producto.

🔗 **[Ver Demo en Vivo](https://simulador-financiero-smoky.vercel.app/)**

## 🚀 Características Principales

- **Simulación Multi-Producto:**
  - **Cuentas de Ahorros:** Proyección a 12 meses con opción de aportes mensuales recurrentes.
  - **CDTs:** Proyección a plazo fijo (6 o 12 meses) sin aportes adicionales, ajustando la tabla de amortización.
- **Cálculo de Interés Compuesto:** Conversión automática de Tasa Efectiva Anual (E.A.) a Nominal Mensual.
- **Parámetros Fiscales Configurables:**
  - Ajuste de tasa de Retención en la Fuente (Sugerido 7% para Ahorros, 4% para CDT).
  - Opción para calcular o exentar el GMF (4x1000).
- **Interfaz Dinámica:** La UI se adapta para ocultar/mostrar campos según el producto seleccionado (ej. oculta aportes mensuales en modo CDT).
- **Visualización de Datos:** Gráfico interactivo de crecimiento del capital vs. tiempo.
- **Exportación de Reportes:** Generación de informes en **PDF** y tablas de datos en **Excel** que indican el tipo de producto y plazo simulado.
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
├── index.html      # Estructura y maquetación (Selectores de producto y plazo)
├── styles.css      # Estilos, variables, reset y diseño responsivo
├── script.js       # Lógica financiera (Cálculo dinámico de meses) y controlador de UI
└── README.md       # Documentación técnica
```
