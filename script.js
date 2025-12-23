/**
 * Constantes Fiscales Colombia (Valores Base)
 */
const TAX_CONFIG = {
  GMF_RATE: 0.004,
};

/**
 * MODELO: Lógica Financiera Pura
 * Responsable únicamente de los cálculos.
 */
class FinancialCalculator {
  constructor(capital, tasaEA, aporteMensual, aplicarGMF, retencionRate) {
    this.capital = capital;
    this.tasaEA = tasaEA;
    this.aporteMensual = aporteMensual;
    this.aplicarGMF = aplicarGMF;
    this.retencionRate = retencionRate;
    this.tasaMensual = Math.pow(1 + this.tasaEA, 1 / 12) - 1;
  }

  calculateProjection() {
    let saldo = this.capital;
    let acumuladoRetefuente = 0;
    let acumuladoInteresNeto = 0;
    let projection = [];

    // Estado inicial (Mes 0)
    projection.push({
      mes: 0,
      inicial: 0,
      aporte: 0,
      interesBruto: 0,
      impuesto: 0,
      interesNeto: 0,
      final: this.capital,
    });

    // Proyección a 12 meses
    for (let i = 1; i <= 12; i++) {
      const saldoInicial = saldo;
      const interesBruto = saldo * this.tasaMensual;
      const retencion = interesBruto * this.retencionRate;
      const interesNeto = interesBruto - retencion;

      acumuladoRetefuente += retencion;
      acumuladoInteresNeto += interesNeto;

      saldo += interesNeto + this.aporteMensual;

      projection.push({
        mes: i,
        inicial: saldoInicial,
        aporte: this.aporteMensual,
        interesBruto: interesBruto,
        impuesto: retencion,
        interesNeto: interesNeto,
        final: saldo,
      });
    }

    const costoGMF = this.aplicarGMF ? saldo * TAX_CONFIG.GMF_RATE : 0;
    const netoRetiro = saldo - costoGMF;

    return {
      details: projection,
      summary: {
        saldoFinal: saldo,
        totalGananciaNet: acumuladoInteresNeto,
        totalRetefuente: acumuladoRetefuente,
        costoGMF: costoGMF,
        netoRetiro: netoRetiro,
        retefuenteRate: this.retencionRate,
      },
    };
  }
}

/**
 * VISTA/UI: Manejo del DOM y Visualización
 * Responsable de leer inputs, formatear valores y pintar gráficos.
 */
const UI = {
  chartInstance: null,
  currentData: null,

  // --- Helpers de Formato Input ---

  // Moneda: Convierte 50000000 -> $ 50.000.000
  formatCurrency(input) {
    let val = input.value;
    if (val === "") return;
    const cleanVal = parseFloat(val.replace(/[^\d]/g, ""));
    if (isNaN(cleanVal)) return;

    input.value = new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(cleanVal);
  },

  // Quitar formato: $ 50.000.000 -> 50000000 (para editar)
  unformatCurrency(input) {
    let val = input.value;
    input.value = val.replace(/[^\d]/g, "");
  },

  // Porcentaje: 11 -> 11%
  formatPercentage(input) {
    let val = input.value.replace("%", "");
    if (val === "") return;
    input.value = val + "%";
  },

  unformatPercentage(input) {
    input.value = input.value.replace("%", "");
  },

  // Parseo seguro para cálculos
  parseValue(str) {
    if (!str) return 0;
    let clean = str
      .replace(/\$/g, "")
      .replace(/%/g, "")
      .replace(/\./g, "")
      .trim();
    clean = clean.replace(",", ".");
    return parseFloat(clean) || 0;
  },

  formatMoneyDisplay(amount) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);
  },

  // --- Manipulación del DOM ---

  toggleModal(action) {
    const modal = document.getElementById("helpModal");
    modal.style.display = action === "open" ? "block" : "none";
  },

  toggleAporte() {
    const isChecked = document.getElementById("checkAporte").checked;
    document.getElementById("aporteInputContainer").style.display = isChecked
      ? "block"
      : "none";
  },

  renderResults(data) {
    this.currentData = data;

    const panel = document.getElementById("resultsPanel");
    panel.style.display = "block";
    panel.scrollIntoView({ behavior: "smooth" });

    document.getElementById("resSaldo").innerText = this.formatMoneyDisplay(
      data.summary.saldoFinal
    );
    document.getElementById("resGanancia").innerText = this.formatMoneyDisplay(
      data.summary.totalGananciaNet
    );

    const totalTax = data.summary.totalRetefuente + data.summary.costoGMF;
    document.getElementById("resImpuesto").innerText =
      this.formatMoneyDisplay(totalTax);

    const reteRatePercent = (data.summary.retefuenteRate * 100).toFixed(0);
    let taxLabel = `Retefuente (${reteRatePercent}%)`;
    if (data.summary.costoGMF > 0)
      taxLabel += ` + GMF (${this.formatMoneyDisplay(data.summary.costoGMF)})`;
    document.getElementById("taxLabel").innerText = taxLabel;

    document.getElementById("resNetoRetiro").innerText =
      this.formatMoneyDisplay(data.summary.netoRetiro);

    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";

    const thead = document.querySelector("#dataTable thead tr");
    thead.children[4].innerText = `Retención (${reteRatePercent}%)`;

    data.details.slice(1).forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td style="text-align: center; font-weight:bold;">${
                  row.mes
                }</td>
                <td>${this.formatMoneyDisplay(row.inicial)}</td>
                <td>${
                  row.aporte > 0 ? this.formatMoneyDisplay(row.aporte) : "-"
                }</td>
                <td style="color:#78909c;">${this.formatMoneyDisplay(
                  row.interesBruto
                )}</td>
                <td style="color:var(--danger);">-${this.formatMoneyDisplay(
                  row.impuesto
                )}</td>
                <td style="color:var(--success); font-weight:bold;">+${this.formatMoneyDisplay(
                  row.interesNeto
                )}</td>
                <td>${this.formatMoneyDisplay(row.final)}</td>
            `;
      tbody.appendChild(tr);
    });

    this.renderChart(data.details);
  },

  renderChart(details) {
    const ctx = document.getElementById("growthChart").getContext("2d");
    if (this.chartInstance) this.chartInstance.destroy();

    const labels = details.map((d) =>
      d.mes === 0 ? "Inicio" : `Mes ${d.mes}`
    );
    const dataValues = details.map((d) => d.final);

    this.chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Crecimiento del Capital",
            data: dataValues,
            borderColor: "#004d40",
            backgroundColor: (context) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 300);
              gradient.addColorStop(0, "rgba(0, 77, 64, 0.2)");
              gradient.addColorStop(1, "rgba(0, 77, 64, 0.0)");
              return gradient;
            },
            borderWidth: 3,
            pointBackgroundColor: "#00bfa5",
            pointRadius: 4,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: (ctx) => this.formatMoneyDisplay(ctx.raw),
            },
          },
        },
        scales: {
          y: {
            grid: { color: "#f0f0f0" },
            ticks: {
              callback: (val) => "$" + (val / 1000000).toFixed(1) + "M",
            },
          },
          x: { grid: { display: false } },
        },
      },
    });
  },
};

/**
 * SERVICIO: Exportación
 * Maneja lógica externa de bibliotecas de terceros.
 */
const Exporter = {
  toPDF() {
    if (!UI.currentData) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const data = UI.currentData;
    const retePercent = (data.summary.retefuenteRate * 100).toFixed(0) + "%";

    doc.setFillColor(0, 77, 64);
    doc.rect(0, 0, 210, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("Reporte de Proyección Financiera", 14, 16);
    doc.setFontSize(10);
    doc.text("Generado por Simulador Pro", 14, 22);

    doc.setTextColor(40);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 35);
    doc.text(`Tasa E.A.: ${document.getElementById("tasa").value}`, 80, 35);
    doc.text(`Retefuente Aplicada: ${retePercent}`, 140, 35);

    doc.setFillColor(240, 242, 245);
    doc.roundedRect(14, 40, 180, 25, 3, 3, "F");
    doc.setFontSize(11);
    doc.text(
      `Saldo Final: ${UI.formatMoneyDisplay(data.summary.saldoFinal)}`,
      20,
      50
    );
    doc.text(
      `Rendimiento Neto: ${UI.formatMoneyDisplay(
        data.summary.totalGananciaNet
      )}`,
      20,
      58
    );
    doc.text(
      `Neto tras Retiro: ${UI.formatMoneyDisplay(data.summary.netoRetiro)}`,
      100,
      50
    );

    const rows = data.details
      .slice(1)
      .map((d) => [
        d.mes,
        UI.formatMoneyDisplay(d.inicial),
        UI.formatMoneyDisplay(d.aporte),
        UI.formatMoneyDisplay(d.interesBruto),
        UI.formatMoneyDisplay(d.impuesto),
        UI.formatMoneyDisplay(d.interesNeto),
        UI.formatMoneyDisplay(d.final),
      ]);

    doc.autoTable({
      startY: 70,
      head: [
        [
          "Mes",
          "Saldo Ini",
          "Aporte",
          "Int. Bruto",
          `Ret (${retePercent})`,
          "Int. Neto",
          "Saldo Final",
        ],
      ],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [0, 77, 64], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { halign: "center" },
        6: { halign: "right", fontStyle: "bold" },
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
      },
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Nota: Los valores son proyecciones estimadas. La retención en la fuente (${retePercent}) aplica sobre rendimientos.`,
      14,
      finalY
    );
    if (data.summary.costoGMF > 0) {
      doc.text(
        `* Incluye estimación de GMF (4x1000) por valor de ${UI.formatMoneyDisplay(
          data.summary.costoGMF
        )}`,
        14,
        finalY + 5
      );
    }

    doc.save("Proyeccion_Financiera.pdf");
  },

  toExcel() {
    if (!UI.currentData) return;
    const wb = XLSX.utils.book_new();
    const data = UI.currentData.details.slice(1);
    const retePercent =
      (UI.currentData.summary.retefuenteRate * 100).toFixed(0) + "%";

    const dataExcel = data.map((d) => ({
      Mes: d.mes,
      "Saldo Inicial": d.inicial,
      "Aporte Mensual": d.aporte,
      "Interés Bruto": d.interesBruto,
      [`Retención (${retePercent})`]: d.impuesto,
      "Interés Neto": d.interesNeto,
      "Saldo Final": d.final,
    }));

    const ws = XLSX.utils.json_to_sheet(dataExcel);
    ws["!cols"] = [
      { wch: 6 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Proyección");
    XLSX.writeFile(wb, "Proyeccion_Financiera.xlsx");
  },
};

/**
 * CONTROLADOR PRINCIPAL: App
 * Orquesta la inicialización y el flujo de datos.
 */
const App = {
  init() {
    // 1. Establecer valores iniciales
    this.setInitialValues();

    // 2. Configurar Event Listeners (Unobtrusive JS)
    this.bindEvents();
  },

  setInitialValues() {
    const capInput = document.getElementById("capital");
    const tasaInput = document.getElementById("tasa");
    const aporteInput = document.getElementById("aporte");
    const retInput = document.getElementById("retencion");

    capInput.value = "1000000";
    tasaInput.value = "11";
    aporteInput.value = "1000000";
    retInput.value = "7";

    UI.formatCurrency(capInput);
    UI.formatPercentage(tasaInput);
    UI.formatCurrency(aporteInput);
    UI.formatPercentage(retInput);
  },

  bindEvents() {
    // Botones Principales
    document
      .getElementById("btnCalculate")
      .addEventListener("click", () => this.calculate());
    document
      .getElementById("btnExportPdf")
      .addEventListener("click", () => Exporter.toPDF());
    document
      .getElementById("btnExportXls")
      .addEventListener("click", () => Exporter.toExcel());

    // Modal de Ayuda
    const helpModal = document.getElementById("helpModal");
    document
      .getElementById("btnHelp")
      .addEventListener("click", () => UI.toggleModal("open"));
    document
      .getElementById("closeHelpModal")
      .addEventListener("click", () => UI.toggleModal("close"));

    // Cerrar modal al hacer click fuera
    window.addEventListener("click", (event) => {
      if (event.target == helpModal) UI.toggleModal("close");
    });

    // Toggle Aporte
    document
      .getElementById("checkAporte")
      .addEventListener("change", () => UI.toggleAporte());

    // Inputs con formato automático
    // Usamos delegación o asignación directa para moneda
    const currencyInputs = document.querySelectorAll('[data-type="currency"]');
    currencyInputs.forEach((input) => {
      input.addEventListener("focus", (e) => UI.unformatCurrency(e.target));
      input.addEventListener("blur", (e) => UI.formatCurrency(e.target));
    });

    // Inputs con formato porcentaje
    const percentInputs = document.querySelectorAll('[data-type="percentage"]');
    percentInputs.forEach((input) => {
      input.addEventListener("focus", (e) => UI.unformatPercentage(e.target));
      input.addEventListener("blur", (e) => UI.formatPercentage(e.target));
    });
  },

  calculate() {
    const capital = UI.parseValue(document.getElementById("capital").value);
    const tasaRaw = UI.parseValue(document.getElementById("tasa").value);
    const tasa = tasaRaw / 100;

    const retencionRaw = UI.parseValue(
      document.getElementById("retencion").value
    );
    const retencionRate = retencionRaw / 100;

    const hayAporte = document.getElementById("checkAporte").checked;
    const aporte = hayAporte
      ? UI.parseValue(document.getElementById("aporte").value)
      : 0;

    const aplicarGMF = document.getElementById("checkGMF").checked;

    const calculator = new FinancialCalculator(
      capital,
      tasa,
      aporte,
      aplicarGMF,
      retencionRate
    );
    const results = calculator.calculateProjection();

    UI.renderResults(results);
  },
};

// Punto de entrada único
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
