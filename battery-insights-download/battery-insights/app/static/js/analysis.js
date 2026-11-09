
const LABELS = {
    battery_id: "Identificador da bateria",
    record_month: "Mês do registro",
    state_of_health_pct: "Saúde da bateria (%)",
    capacity_fade_pct: "Perda de capacidade (%)",
    remaining_useful_life_cycles: "Ciclos restantes estimados",
    failure_risk_label: "Risco de falha",
    degradation_category: "Categoria de degradação",
    last_service_date: "Data do último serviço",
    fast_charge_ratio: "Proporção de recargas rápidas",
    avg_depth_of_discharge_pct: "Profundidade de descarga (%)",
    avg_state_of_charge_pct: "Estado médio de carga (%)",
    avg_daily_distance_km: "Distância diária (km)",
    charge_cycles_per_month: "Ciclos mensais de carga",
    avg_ambient_temp_c: "Temperatura ambiente (°C)"
};

const HELP = {
    battery_id: "Identifica cada bateria. Essa variável serve para diferenciar os equipamentos, não para medir seu desempenho.",
    record_month: "Indica o mês em que a observação foi registrada. Permite conferir a distribuição temporal dos dados.",
    state_of_health_pct: "Representa a saúde atual da bateria em relação à sua capacidade original. Valores menores indicam maior degradação.",
    capacity_fade_pct: "Representa a porcentagem de capacidade perdida. Quanto maior esse valor, maior tende a ser o desgaste.",
    remaining_useful_life_cycles: "Estimativa de quantos ciclos de carga ainda restam na vida útil da bateria.",
    failure_risk_label: "Classifica o risco de falha. As categorias podem ser Low, Medium e High.",
    degradation_category: "Agrupa as baterias de acordo com seu nível de degradação.",
    last_service_date: "Indica a data do último serviço. O valor never significa que não há serviço anterior registrado.",
    fast_charge_ratio: "Representa a proporção de recargas realizadas utilizando carregamento rápido.",
    avg_depth_of_discharge_pct: "Indica quanto da carga é consumido antes de uma nova recarga. Descargas profundas podem representar maior esforço para a bateria.",
    avg_state_of_charge_pct: "Representa o nível médio de carga da bateria durante o período observado.",
    avg_daily_distance_km: "Representa a distância média percorrida diariamente pelo veículo.",
    charge_cycles_per_month: "Quantidade de ciclos de carga registrados mensalmente.",
    avg_ambient_temp_c: "Temperatura ambiente média durante o período. Temperaturas elevadas podem contribuir para o envelhecimento."
};

async function getJSON(url) {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar os dados.");
    }

    return data;
}

function displayName(column) {
    return LABELS[column] || column.replaceAll("_", " ");
}

function formatNumber(value, decimals = 0) {
    return Number(value).toLocaleString("pt-BR", {
        maximumFractionDigits: decimals
    });
}

function setText(id, value) {
    document.getElementById(id).textContent = value;
}

function renderPreview(data) {
    const table = document.getElementById("preview");

    if (!data.preview || !data.preview.length) {
        table.textContent = "Nenhum registro disponível.";
        return;
    }

    const thead = document.createElement("thead");
    const header = document.createElement("tr");

    data.column_names.forEach(column => {
        const th = document.createElement("th");
        th.textContent = displayName(column);
        th.title = column;
        header.appendChild(th);
    });

    thead.appendChild(header);

    const tbody = document.createElement("tbody");

    data.preview.forEach(row => {
        const tr = document.createElement("tr");

        data.column_names.forEach(column => {
            const td = document.createElement("td");
            td.textContent = row[column] ?? "—";
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    table.replaceChildren(thead, tbody);
}

function renderQuality(data) {
    const missing = Object.values(data.missing || {})
        .reduce((sum, value) => sum + value, 0);

    const total = data.rows * data.columns;

    const cards = [
        {
            title: "Células vazias",
            value: formatNumber(missing),
            note: total
                ? `${formatNumber(missing / total * 100, 1)}% do total`
                : "Sem dados"
        },
        {
            title: "Variáveis numéricas",
            value: formatNumber(data.numeric_columns.length),
            note: "Disponíveis para análise de correlação"
        },
        {
            title: "Variáveis categóricas",
            value: formatNumber(data.categorical_columns.length),
            note: "Categorias, identificadores e datas"
        }
    ];

    const container = document.getElementById("data-quality");

    container.replaceChildren(...cards.map(card => {
        const element = document.createElement("div");
        element.className = "quality-item";

        const title = document.createElement("span");
        title.textContent = card.title;

        const value = document.createElement("strong");
        value.textContent = card.value;

        const note = document.createElement("small");
        note.textContent = card.note;

        element.append(title, value, note);

        return element;
    }));
}

async function drawDistribution() {
    const column = document.getElementById("column-select").value;

    if (!column) return;

    const data = await getJSON(
        "/api/chart?column=" + encodeURIComponent(column)
    );

    const summary = window.analysisSummary;

    const numeric = summary.numeric_columns.includes(column);

    setText(
        "column-kind",
        numeric ? "Variável numérica" : "Variável categórica"
    );

    setText(
        "distribution-explanation",
        HELP[column] || "Visualização da frequência dos valores desta variável."
    );

    const labels = data.labels || [];
    const values = data.values || [];

    const total = values.reduce((sum, value) => sum + value, 0);

    const maxIndex = values.length
        ? values.indexOf(Math.max(...values))
        : -1;

    const maxLabel = maxIndex >= 0 ? labels[maxIndex] : "—";
    const maxValue = maxIndex >= 0 ? values[maxIndex] : 0;

    Plotly.newPlot("distribution", [{
        x: labels,
        y: values,
        type: "bar",
        marker: {
            color: "#64e0bd"
        },
        hovertemplate:
            "Valor: %{x}<br>Registros: %{y}<extra></extra>"
    }], {
        title: {
            text: numeric
                ? "Distribuição por faixa de valores"
                : "Frequência por categoria"
        },
        xaxis: {
            title: numeric ? "Faixas de valores" : "Categorias",
            tickangle: -30,
            automargin: true
        },
        yaxis: {
            title: "Quantidade de registros",
            rangemode: "tozero"
        },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: {
            color: "#eef3ff"
        },
        margin: {
            t: 55,
            b: 100,
            l: 60,
            r: 20
        }
    }, {
        responsive: true,
        displaylogo: false
    });

    const description = numeric
        ? `Foram encontrados ${formatNumber(total)} valores agrupados em intervalos. A faixa mais frequente é ${maxLabel}, com ${formatNumber(maxValue)} registros.`
        : `A categoria mais frequente é "${maxLabel}", com ${formatNumber(maxValue)} registros.`;

    setText("distribution-footnote", description);
}

function renderCorrelation(data) {
    const columns = data.columns || [];
    const values = data.values || [];

    if (!columns.length) {
        setText(
            "correlation",
            "Não existem variáveis numéricas suficientes para calcular correlações."
        );
        return;
    }

    const pairs = [];

    for (let i = 0; i < columns.length; i++) {
        for (let j = i + 1; j < columns.length; j++) {
            const value = Number(values[i][j]);

            if (Number.isFinite(value)) {
                pairs.push({
                    a: columns[i],
                    b: columns[j],
                    value
                });
            }
        }
    }

    pairs.sort((a, b) =>
        Math.abs(b.value) - Math.abs(a.value)
    );

    const container = document.getElementById("correlation-insights");

    const strongest = pairs.slice(0, 3);

    container.replaceChildren(...strongest.map(pair => {
        const item = document.createElement("div");
        item.className = "insight-item";

        const title = document.createElement("strong");
        title.textContent =
            `${displayName(pair.a)} × ${displayName(pair.b)}`;

        const value = document.createElement("span");
        value.textContent =
            `${pair.value > 0 ? "+" : ""}${formatNumber(pair.value, 3)}`;

        const strength =
            Math.abs(pair.value) >= 0.7 ? "forte" :
            Math.abs(pair.value) >= 0.4 ? "moderada" :
            Math.abs(pair.value) >= 0.2 ? "fraca" :
            "muito fraca";

        const description = document.createElement("small");

        description.textContent =
            `Associação ${strength} e ${
                pair.value >= 0 ? "positiva" : "negativa"
            }. Não representa causalidade.`;

        item.append(title, value, description);

        return item;
    }));

    Plotly.newPlot("correlation", [{
        z: values,
        x: columns.map(displayName),
        y: columns.map(displayName),
        type: "heatmap",
        zmin: -1,
        zmax: 1,
        colorscale: "RdBu",
        reversescale: true,
        colorbar: {
            title: "Correlação"
        },
        hovertemplate:
            "%{y}<br>%{x}<br>Correlação: %{z:.3f}<extra></extra>"
    }], {
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: {
            color: "#eef3ff",
            size: 11
        },
        xaxis: {
            tickangle: -45,
            automargin: true
        },
        yaxis: {
            automargin: true,
            autorange: "reversed"
        },
        margin: {
            t: 20,
            l: 180,
            b: 160,
            r: 35
        }
    }, {
        responsive: true,
        displaylogo: false
    });
}

async function initAnalysis() {
    try {
        const data = await getJSON("/api/summary");

        window.analysisSummary = data;

        setText("a-rows", formatNumber(data.rows));
        setText("a-cols", formatNumber(data.columns));
        setText("a-numeric", formatNumber(data.numeric_columns.length));

        const select = document.getElementById("column-select");

        data.column_names.forEach(column => {
            select.add(new Option(displayName(column), column));
        });

        select.value = data.column_names.includes("state_of_health_pct")
            ? "state_of_health_pct"
            : data.column_names[0];

        select.addEventListener("change", () => {
            drawDistribution().catch(showError);
        });

        renderPreview(data);
        renderQuality(data);

        if (data.column_names.length) {
            await drawDistribution();
        }

        const correlation = await getJSON("/api/correlation");

        renderCorrelation(correlation);

    } catch (error) {
        showError(error);
    }
}

function showError(error) {
    console.error("Erro na análise:", error);

    setText(
        "distribution-explanation",
        error.message || "Não foi possível carregar a análise."
    );
}

initAnalysis();
