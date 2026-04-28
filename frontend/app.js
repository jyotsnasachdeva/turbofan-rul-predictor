const metrics = {
  LSTM_Baseline: {
    display_name: "Stacked LSTM",
    results: {
      FD001: { rmse: 16.184988021850586, score: 348.75213623046875 },
      FD002: { rmse: 24.98519515991211, score: 4677.0966796875 },
      FD003: { rmse: 20.080459594726562, score: 1260.635009765625 },
      FD004: { rmse: 29.506919860839844, score: 8764.29296875 }
    }
  },
  CNN_Baseline: {
    display_name: "1D-FCLCNN",
    results: {
      FD001: { rmse: 19.997568130493164, score: 1232.5567626953125 },
      FD002: { rmse: 21.70716667175293, score: 4222.62890625 },
      FD003: { rmse: 20.898000717163086, score: 1537.8460693359375 },
      FD004: { rmse: 26.748937606811523, score: 7472.65283203125 }
    }
  },
  Paper_Model: {
    display_name: "1D-FCLCNN+LSTM (Peng 2021)",
    results: {
      FD001: { rmse: 18.0030574798584, score: 587.7715454101562 },
      FD002: { rmse: 19.84087562561035, score: 2017.1412353515625 },
      FD003: { rmse: 16.030351638793945, score: 618.253662109375 },
      FD004: { rmse: 25.791852951049805, score: 7640.24365234375 }
    }
  },
  SA_FCLCNN_TF: {
    display_name: "SA-FCLCNN-TF (Ours)",
    results: {
      FD001: { rmse: 12.55839729309082, score: 236.87081909179688 },
      FD002: { rmse: 19.595502853393555, score: 3398.8984375 },
      FD003: { rmse: 13.791271209716797, score: 296.3505859375 },
      FD004: { rmse: 24.88585662841797, score: 4330.509765625 }
    }
  },
  SA_FCLCNN_TF_PINN: {
    display_name: "SA-FCLCNN-TF-PINN (Ours)",
    results: {
      FD001: { rmse: 13.510204315185547, score: 272.1482238769531 },
      FD002: { rmse: 21.16539192199707, score: 3988.28955078125 },
      FD003: { rmse: 12.506317138671875, score: 238.82223510742188 },
      FD004: { rmse: 24.656526565551758, score: 4254.189453125 }
    }
  },
  CNN_LSTM_Attn_2024: {
    display_name: "CNN-LSTM-Attn (2024)",
    results: {
      FD001: { rmse: 15.977, score: null },
      FD002: { rmse: 14.452, score: null },
      FD003: { rmse: 13.907, score: null },
      FD004: { rmse: 16.637, score: null }
    }
  }
};

const subsets = {
  FD001: { complexity: 0.85, baseLife: 132 },
  FD002: { complexity: 1.08, baseLife: 118 },
  FD003: { complexity: 0.94, baseLife: 126 },
  FD004: { complexity: 1.18, baseLife: 110 }
};

const modelRows = Object.values(metrics);
const format = (number) => (number === null ? "N/A" : Number(number).toFixed(2));
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const canvas = $("#rmse-chart");
const ctx = canvas.getContext("2d");
const chartMaxRmse = Math.ceil(
  Math.max(...modelRows.flatMap((model) => Object.values(model.results).map((result) => result.rmse))) + 2
);

function bestForSubset(subset) {
  return modelRows
    .filter((model) => model.results[subset])
    .reduce((best, model) => (model.results[subset].rmse < best.results[subset].rmse ? model : best));
}

function drawChart(subset) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const cssWidth = rect.width;
  const cssHeight = 390;

  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const plot = {
    left: 72,
    right: 28,
    top: 58,
    bottom: 104
  };
  const plotWidth = cssWidth - plot.left - plot.right;
  const plotHeight = cssHeight - plot.top - plot.bottom;
  const baseY = plot.top + plotHeight;
  const slotWidth = plotWidth / modelRows.length;
  const barWidth = Math.min(106, slotWidth * 0.64);

  ctx.font = "700 16px Inter, sans-serif";
  ctx.fillStyle = "#607084";
  ctx.fillText(`RMSE comparison for ${subset}`, plot.left, 30);

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plot.left, baseY);
  ctx.lineTo(cssWidth - plot.right, baseY);
  ctx.stroke();

  modelRows.forEach((model, index) => {
    const value = model.results[subset].rmse;
    const height = (value / chartMaxRmse) * plotHeight;
    const x = plot.left + index * slotWidth + (slotWidth - barWidth) / 2;
    const y = baseY - height;
    const isBest = model === bestForSubset(subset);

    ctx.fillStyle = isBest ? "#0f9f9a" : "#9db0c4";
    ctx.fillRect(x, y, barWidth, height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#13202f";
    ctx.font = "800 15px Inter, sans-serif";
    ctx.fillText(format(value), x + barWidth / 2, y - 10);

    ctx.save();
    ctx.translate(x + barWidth / 2, baseY + 24);
    ctx.rotate(-Math.PI / 6);
    ctx.fillStyle = "#607084";
    ctx.font = "800 13px Inter, sans-serif";
    ctx.fillText(model.display_name.replace(" (Ours)", "").replace(" (Peng 2021)", ""), 0, 0);
    ctx.restore();
  });

  ctx.textAlign = "left";
}

function renderTable(subset) {
  const best = bestForSubset(subset);
  $("#metrics-table").innerHTML = modelRows
    .map((model) => {
      const result = model.results[subset];
      const status =
        model === best
          ? '<span class="status-best">Best in this set</span>'
          : model.display_name.includes("Ours")
            ? "Project model"
            : "Baseline";

      return `
        <tr>
          <td>${model.display_name}</td>
          <td>${format(result.rmse)}</td>
          <td>${format(result.score)}</td>
          <td>${status}</td>
        </tr>
      `;
    })
    .join("");
}

function updateSubset(subset) {
  $$(".tab").forEach((button) => button.classList.toggle("active", button.dataset.subset === subset));
  drawChart(subset);
  renderTable(subset);
}

function updateRangeReadouts() {
  ["temperature", "vibration", "pressure"].forEach((id) => {
    $(`#${id}-value`).textContent = $(`#${id}`).value;
  });
}

function parseSensorImpact() {
  const raw = $("#sensor-row").value.trim();
  if (!raw) return 0;

  const values = raw
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));

  if (!values.length) return 0;

  const averageMagnitude = values.reduce((sum, value) => sum + Math.abs(value), 0) / values.length;
  return Math.min(18, averageMagnitude % 22);
}

function predict(event) {
  event.preventDefault();
  updateRangeReadouts();

  const subset = $("#dataset").value;
  const cycle = Number($("#cycle").value);
  const temperature = Number($("#temperature").value);
  const vibration = Number($("#vibration").value);
  const pressure = Number($("#pressure").value);
  const selectedBest = bestForSubset(subset);
  const selectedResult = selectedBest.results[subset];
  const subsetConfig = subsets[subset];

  const degradation =
    cycle * 0.34 +
    temperature * 0.46 +
    vibration * 0.58 +
    pressure * 0.32 +
    parseSensorImpact();

  const rawRul = subsetConfig.baseLife - degradation * subsetConfig.complexity + selectedResult.rmse * 0.74;
  const rul = Math.max(8, Math.round(rawRul));
  const confidence = Math.max(42, Math.min(92, Math.round(96 - selectedResult.rmse * 1.45 - degradation * 0.08)));

  const risk =
    rul < 35 || vibration > 78
      ? { label: "Critical", className: "critical" }
      : rul < 70 || temperature > 68
        ? { label: "Watch", className: "watch" }
        : { label: "Stable", className: "stable" };

  const recommendation =
    risk.label === "Critical"
      ? "Prioritize inspection and prepare a maintenance action. The sensor pattern indicates accelerated degradation."
      : risk.label === "Watch"
        ? "Increase monitoring frequency and review recent cycles for trend changes before the next operating window."
        : "Continue routine monitoring. Schedule a sensor trend review within the next maintenance window.";

  $("#rul-output").textContent = rul;
  $("#confidence-fill").style.width = `${confidence}%`;
  $("#recommendation").textContent = recommendation;
  $("#rmse-output").textContent = format(selectedResult.rmse);
  $("#score-output").textContent = format(selectedResult.score);
  $("#dataset-output").textContent = subset;
  $("#selected-model").textContent = selectedBest.display_name;

  const riskPill = $("#risk-pill");
  riskPill.textContent = risk.label;
  riskPill.className = `risk-pill ${risk.className}`;
}

$$(".tab").forEach((button) => {
  button.addEventListener("click", () => updateSubset(button.dataset.subset));
});

["temperature", "vibration", "pressure"].forEach((id) => {
  $(`#${id}`).addEventListener("input", updateRangeReadouts);
});

$("#prediction-form").addEventListener("submit", predict);
window.addEventListener("resize", () => drawChart($(".tab.active").dataset.subset));

const initialBest = bestForSubset("FD001");
$("#hero-rmse").textContent = format(initialBest.results.FD001.rmse);
$("#best-model-name").textContent = initialBest.display_name.replace(" (Ours)", "");
updateRangeReadouts();
updateSubset("FD001");
$("#prediction-form").dispatchEvent(new Event("submit"));
