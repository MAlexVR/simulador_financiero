/**
 * Constantes Fiscales Colombia (Valores Base)
 */
const TAX_CONFIG = {
  GMF_RATE: 0.004,
};

/**
 * MODELO: Lógica Financiera Pura
 */
class FinancialCalculator {
  constructor(
    capital,
    tasaEA,
    aporteMensual,
    aplicarGMF,
    retencionRate,
    months,
    productType
  ) {
    this.capital = capital;
    this.tasaEA = tasaEA;
    this.aporteMensual = aporteMensual;
    this.aplicarGMF = aplicarGMF;
    this.retencionRate = retencionRate;
    this.months = months;
    this.productType = productType; // 'cdt' o 'ahorros'
    this.tasaMensual = Math.pow(1 + this.tasaEA, 1 / 12) - 1;
  }

  calculateProjection() {
    let saldo = this.capital;
    let acumuladoInteresBruto = 0;
    let acumuladoRetefuente = 0;
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

    // Proyección dinámica
    for (let i = 1; i <= this.months; i++) {
      const saldoInicial = saldo;
      const interesBruto = saldo * this.tasaMensual;

      let retencionMes = 0;
      let interesNeto = 0;

      if (this.productType === "cdt") {
        // LÓGICA CDT: Retención al vencimiento.
        acumuladoInteresBruto += interesBruto;

        // Si es el último mes, calculamos la retención sobre TODO el acumulado
        if (i === this.months) {
          retencionMes = acumuladoInteresBruto * this.retencionRate;
        } else {
          retencionMes = 0;
        }

        // Saldo crece bruto hasta el final, donde se descuenta el impuesto
        if (i === this.months) {
          interesNeto = interesBruto - retencionMes;
          saldo += interesBruto - retencionMes;
        } else {
          interesNeto = interesBruto;
          saldo += interesBruto;
        }
      } else {
        // LÓGICA AHORROS: Retención mensual.
        retencionMes = interesBruto * this.retencionRate;
        interesNeto = interesBruto - retencionMes;
        saldo += interesNeto + this.aporteMensual;
      }

      acumuladoRetefuente += retencionMes;

      projection.push({
        mes: i,
        inicial: saldoInicial,
        aporte: this.aporteMensual,
        interesBruto: interesBruto,
        impuesto: retencionMes,
        interesNeto: interesNeto,
        final: saldo,
      });
    }

    // Resumen final
    let totalGananciaNet = 0;
    if (this.productType === "cdt") {
      totalGananciaNet = acumuladoInteresBruto - acumuladoRetefuente;
    } else {
      totalGananciaNet = projection.reduce(
        (acc, row) => acc + row.interesNeto,
        0
      );
    }

    const costoGMF = this.aplicarGMF ? saldo * TAX_CONFIG.GMF_RATE : 0;
    const netoRetiro = saldo - costoGMF;

    return {
      details: projection,
      summary: {
        saldoFinal: saldo,
        totalGananciaNet: totalGananciaNet,
        totalRetefuente: acumuladoRetefuente,
        costoGMF: costoGMF,
        netoRetiro: netoRetiro,
        retefuenteRate: this.retencionRate,
        months: this.months,
      },
    };
  }
}

/**
 * VISTA/UI: Manejo del DOM y Visualización
 */
const UI = {
  chartInstance: null,
  currentData: null,
  currentProductType: "Cuenta de Ahorros",

  // --- Helpers de Formato Input ---

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

  unformatCurrency(input) {
    let val = input.value;
    input.value = val.replace(/[^\d]/g, "");
  },

  formatPercentage(input) {
    let val = input.value.replace("%", "");
    if (val === "") return;
    input.value = val + "%";
  },

  unformatPercentage(input) {
    input.value = input.value.replace("%", "");
  },

  parseCurrencyValue(str) {
    if (!str) return 0;
    let clean = str.replace(/\$/g, "").replace(/\./g, "").trim();
    clean = clean.replace(",", ".");
    return parseFloat(clean) || 0;
  },

  parsePercentageValue(str) {
    if (!str) return 0;
    let clean = str.replace(/%/g, "").trim();
    clean = clean.replace(",", ".");
    return parseFloat(clean) || 0;
  },

  // --- CAMBIO AQUÍ: Formato con 1 decimal ---
  formatMoneyDisplay(amount) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 1, // Fuerza mostrar 1 decimal
      maximumFractionDigits: 1, // No muestra más de 1 decimal
    }).format(amount);
  },

  // --- Manipulación del DOM ---

  toggleModal(action) {
    const modal = document.getElementById("helpModal");
    modal.style.display = action === "open" ? "block" : "none";
  },

  toggleAporte(forceState = null) {
    const check = document.getElementById("checkAporte");
    if (forceState !== null) check.checked = forceState;

    const isChecked = check.checked;
    const container = document.getElementById("aporteInputContainer");
    container.style.display = isChecked ? "block" : "none";
  },

  updateProductUI(type) {
    const plazoGroup = document.getElementById("groupPlazo");
    const aportesContainer = document.getElementById("containerAportes");
    const avisoCDT = document.getElementById("avisoCDT");

    const retInput = document.getElementById("retencion");
    const tasaInput = document.getElementById("tasa");

    if (type === "cdt") {
      plazoGroup.style.display = "block";
      aportesContainer.style.display = "none";
      avisoCDT.style.display = "block";

      retInput.value = "4%";
      tasaInput.value = "10.5%";

      this.toggleAporte(false);
      this.currentProductType = "CDT";
    } else {
      plazoGroup.style.display = "none";
      aportesContainer.style.display = "block";
      avisoCDT.style.display = "none";

      retInput.value = "7%";
      tasaInput.value = "11%";

      this.currentProductType = "Cuenta de Ahorros";
    }
  },

  renderResults(data) {
    this.currentData = data;

    const panel = document.getElementById("resultsPanel");
    panel.style.display = "block";
    panel.scrollIntoView({ behavior: "smooth" });

    let duracionLabel = data.summary.months + " Meses";
    if (this.currentProductType === "CDT") {
      duracionLabel = data.summary.months === 6 ? "180 Días" : "360 Días";
    }

    document.getElementById(
      "resumenTitleSuffix"
    ).innerText = `| ${this.currentProductType} - ${duracionLabel}`;

    document.getElementById("resSaldo").innerText = this.formatMoneyDisplay(
      data.summary.saldoFinal
    );
    document.getElementById("resGanancia").innerText = this.formatMoneyDisplay(
      data.summary.totalGananciaNet
    );

    const totalTax = data.summary.totalRetefuente + data.summary.costoGMF;
    document.getElementById("resImpuesto").innerText =
      this.formatMoneyDisplay(totalTax);

    const reteRatePercent = (data.summary.retefuenteRate * 100)
      .toFixed(2)
      .replace(".00", "");
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
      const impuestoDisplay =
        row.impuesto > 0 ? `-${this.formatMoneyDisplay(row.impuesto)}` : "-";

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
                <td style="color:var(--danger);">${impuestoDisplay}</td>
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
 */
const Exporter = {
  toPDF() {
    if (!UI.currentData) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const data = UI.currentData;
    const retePercent =
      (data.summary.retefuenteRate * 100).toFixed(2).replace(".00", "") + "%";

    const productLabel = UI.currentProductType;
    let durationLabel = data.summary.months + " Meses";
    if (UI.currentProductType === "CDT")
      durationLabel = data.summary.months === 6 ? "180 Días" : "360 Días";

    doc.setFillColor(0, 77, 64);
    doc.rect(0, 0, 210, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("Reporte de Proyección Financiera", 14, 16);
    doc.setFontSize(10);
    doc.text(`Simulador Pro | ${productLabel} (${durationLabel})`, 14, 22);

    doc.setTextColor(40);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 35);
    doc.text(`Tasa E.A.: ${document.getElementById("tasa").value}`, 80, 35);
    doc.text(`Retefuente: ${retePercent}`, 140, 35);

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
      `Nota: Proyección estimada para ${productLabel} a ${durationLabel}.`,
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
      (UI.currentData.summary.retefuenteRate * 100)
        .toFixed(2)
        .replace(".00", "") + "%";

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

    let sheetName =
      UI.currentProductType === "CDT" ? "CDT_Proyeccion" : "Ahorros_Proyeccion";
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, "Proyeccion_Financiera.xlsx");
  },
};

/**
 * CONTROLADOR PRINCIPAL: App
 */
const App = {
  init() {
    this.setInitialValues();
    this.bindEvents();
  },

  setInitialValues() {
    const capInput = document.getElementById("capital");
    const tasaInput = document.getElementById("tasa");
    const aporteInput = document.getElementById("aporte");
    const retInput = document.getElementById("retencion");

    capInput.value = "1000000";
    tasaInput.value = "11";
    aporteInput.value = "500000";
    retInput.value = "7";

    UI.formatCurrency(capInput);
    UI.formatPercentage(tasaInput);
    UI.formatCurrency(aporteInput);
    UI.formatPercentage(retInput);
  },

  bindEvents() {
    document
      .getElementById("btnCalculate")
      .addEventListener("click", () => this.calculate());
    document
      .getElementById("btnExportPdf")
      .addEventListener("click", () => Exporter.toPDF());
    document
      .getElementById("btnExportXls")
      .addEventListener("click", () => Exporter.toExcel());

    const helpModal = document.getElementById("helpModal");
    document
      .getElementById("btnHelp")
      .addEventListener("click", () => UI.toggleModal("open"));
    document
      .getElementById("closeHelpModal")
      .addEventListener("click", () => UI.toggleModal("close"));
    window.addEventListener("click", (event) => {
      if (event.target == helpModal) UI.toggleModal("close");
    });

    document
      .getElementById("checkAporte")
      .addEventListener("change", () => UI.toggleAporte());

    document.getElementById("tipoProducto").addEventListener("change", (e) => {
      UI.updateProductUI(e.target.value);
    });

    const currencyInputs = document.querySelectorAll('[data-type="currency"]');
    currencyInputs.forEach((input) => {
      input.addEventListener("focus", (e) => UI.unformatCurrency(e.target));
      input.addEventListener("blur", (e) => UI.formatCurrency(e.target));
    });

    const percentInputs = document.querySelectorAll('[data-type="percentage"]');
    percentInputs.forEach((input) => {
      input.addEventListener("focus", (e) => UI.unformatPercentage(e.target));
      input.addEventListener("blur", (e) => UI.formatPercentage(e.target));
    });
  },

  calculate() {
    const capital = UI.parseCurrencyValue(
      document.getElementById("capital").value
    );

    const tasaRaw = UI.parsePercentageValue(
      document.getElementById("tasa").value
    );
    const tasa = tasaRaw / 100;

    const retencionRaw = UI.parsePercentageValue(
      document.getElementById("retencion").value
    );
    const retencionRate = retencionRaw / 100;

    const aplicarGMF = document.getElementById("checkGMF").checked;

    const productType = document.getElementById("tipoProducto").value;
    let months = 12;
    let aporte = 0;

    if (productType === "cdt") {
      const plazoSelect = document.getElementById("plazoCdt");
      months = parseInt(plazoSelect.value);
      aporte = 0;
    } else {
      months = 12;
      const hayAporte = document.getElementById("checkAporte").checked;
      aporte = hayAporte
        ? UI.parseCurrencyValue(document.getElementById("aporte").value)
        : 0;
    }

    const calculator = new FinancialCalculator(
      capital,
      tasa,
      aporte,
      aplicarGMF,
      retencionRate,
      months,
      productType
    );
    const results = calculator.calculateProjection();

    UI.renderResults(results);
  },
};

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
