const kind = document.getElementById('kind');
const algo = document.getElementById('algorithm');
const target = document.getElementById('target');
const trainButton = document.getElementById('train-button');
const predictButton = document.getElementById('predict-button');

const algorithmInfo = {
  random_forest: {
    name: 'Random Forest',
    description: 'Cria várias árvores de decisão e combina seus resultados. Costuma ser uma boa opção inicial porque reduz a dependência de uma única árvore.',
    params: 'Número de árvores e profundidade máxima.'
  },
  extra_trees: {
    name: 'Extra Trees',
    description: 'Também combina várias árvores, mas introduz mais aleatoriedade na escolha das divisões. Pode gerar modelos rápidos e reduzir variância.',
    params: 'Número de árvores e profundidade máxima.'
  },
  gradient_boosting: {
    name: 'Gradient Boosting',
    description: 'Treina árvores em sequência. Cada nova árvore tenta corrigir parte dos erros cometidos pelas anteriores.',
    params: 'Número de árvores, profundidade máxima e taxa de aprendizado.'
  },
  decision_tree: {
    name: 'Decision Tree',
    description: 'Cria uma árvore de regras, dividindo os dados por características. É mais fácil de interpretar, mas uma árvore muito profunda pode decorar os dados de treino.',
    params: 'Profundidade máxima.'
  },
  knn: {
    name: 'K-Nearest Neighbors (KNN)',
    description: 'Procura os exemplos mais parecidos com a nova bateria. Na classificação, decide pela classe dos vizinhos mais próximos.',
    params: 'Número de vizinhos (K).'
  }
};

const fieldInfo = {
  record_month: [
    'Mês do registro',
    'Número do mês referente à observação.'
  ],
  last_service_date: [
    'Data do último serviço',
    'Informe a data ou o texto usado na base, como never.'
  ],
  fast_charge_ratio: [
    'Proporção de recargas rápidas',
    'Valor proporcional entre 0 e 1. Ex.: 0,35 significa 35%.'
  ],
  avg_depth_of_discharge_pct: [
    'Profundidade média de descarga (%)',
    'Percentual médio de capacidade consumida antes de recarregar.'
  ],
  avg_state_of_charge_pct: [
    'Estado médio de carga (%)',
    'Percentual médio de carga da bateria.'
  ],
  avg_daily_distance_km: [
    'Distância diária média (km)',
    'Quilometragem média percorrida por dia.'
  ],
  charge_cycles_per_month: [
    'Ciclos de carga por mês',
    'Quantidade média de ciclos de carga no mês.'
  ],
  avg_ambient_temp_c: [
    'Temperatura ambiente média (°C)',
    'Temperatura média do ambiente em que a bateria opera.'
  ]
};

const exampleValues = {
  record_month: 6,
  last_service_date: 'never',
  fast_charge_ratio: 0.35,
  avg_depth_of_discharge_pct: 60,
  avg_state_of_charge_pct: 75,
  avg_daily_distance_km: 80,
  charge_cycles_per_month: 25,
  avg_ambient_temp_c: 30
};

let trainedFeatures = [];
let trainedKind = null;
let trainedTarget = null;

function show(id, visible) {
  document.getElementById(id).classList.toggle('hidden', !visible);
}

function setAlgorithmOptions() {
  const classification = kind.value === 'classification';

  const allowed = classification
    ? [
        'random_forest',
        'decision_tree',
        'extra_trees',
        'gradient_boosting',
        'knn'
      ]
    : [
        'random_forest',
        'decision_tree',
        'extra_trees',
        'gradient_boosting'
      ];

  const previous = algo.value;

  algo.innerHTML = allowed
    .map(key => `<option value="${key}">${algorithmInfo[key].name}</option>`)
    .join('');

  algo.value = allowed.includes(previous)
    ? previous
    : 'random_forest';
}

function updateInterface() {
  const currentKind = kind.value;
  const isCluster = currentKind === 'clustering';

  setAlgorithmOptions();

  const targetOptions = currentKind === 'classification'
    ? [
        [
          'failure_risk_label',
          'Risco de falha (failure_risk_label)'
        ]
      ]
    : [
        [
          'state_of_health_pct',
          'Saúde da bateria (state_of_health_pct)'
        ],
        [
          'remaining_useful_life_cycles',
          'Ciclos de vida útil restantes (remaining_useful_life_cycles)'
        ]
      ];

  const previousTarget = target.value;

  target.innerHTML = targetOptions
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join('');

  target.value = targetOptions.some(([value]) => value === previousTarget)
    ? previousTarget
    : targetOptions[0][0];

  show('target-wrap', !isCluster);
  show('clusters-wrap', isCluster);
  show('algorithm-wrap', !isCluster);
  show('parameters-panel', !isCluster);
  show('predict-panel', !isCluster);

  show(
    'estimators-wrap',
    ['random_forest', 'extra_trees', 'gradient_boosting'].includes(algo.value)
  );

  show(
    'max-depth-wrap',
    ['random_forest', 'extra_trees', 'gradient_boosting', 'decision_tree'].includes(algo.value)
  );

  show('neighbors-wrap', algo.value === 'knn');
  show('learning-rate-wrap', algo.value === 'gradient_boosting');

  document.getElementById('kind-help').textContent = {
    regression:
      'Estima um valor numérico. O alvo escolhido define se a resposta será saúde (%) ou ciclos restantes.',

    classification:
      'Aprende a classificar cada registro em uma categoria de risco, como Low, Medium ou High.',

    clustering:
      'Agrupa baterias com características semelhantes. Não existe uma coluna-alvo nem uma previsão individual nesta tarefa.'
  }[currentKind];

  if (!isCluster) {
    const info = algorithmInfo[algo.value];

    document.getElementById('algorithm-help').textContent =
      info.description;

    document.getElementById('algorithm-detail').innerHTML = `
      <strong>${info.name}</strong>
      <p>${info.description}</p>
      <small>Parâmetros disponíveis: ${info.params}</small>
    `;
  } else {
    document.getElementById('algorithm-detail').innerHTML = `
      <strong>K-Means</strong>
      <p>O algoritmo calcula centros de grupos e associa cada bateria ao centro mais próximo. O número de grupos é definido por você.</p>
      <small>As variáveis usadas são selecionadas automaticamente entre as seis métricas de uso e temperatura disponíveis na base.</small>
    `;
  }

  document.getElementById('estimators-help').textContent =
    algo.value === 'gradient_boosting'
      ? 'Quantidade de árvores treinadas em sequência. Mais árvores podem melhorar o ajuste, mas também aumentam o tempo de treino.'
      : 'Quantidade de árvores que compõem o conjunto. Mais árvores podem estabilizar o resultado, mas aumentam o tempo de treinamento.';
}

kind.addEventListener('change', () => {
  trainedKind = null;
  trainedFeatures = [];
  trainedTarget = null;

  predictButton.disabled = true;

  document.getElementById('prediction-fields').innerHTML = '';
  document.getElementById('prediction-result').innerHTML = '';

  document.getElementById('metrics').textContent =
    'Treine o modelo para visualizar os resultados.';

  updateInterface();
});

algo.addEventListener('change', updateInterface);

updateInterface();

function metricLabel(key) {
  const labels = {
    mae: 'MAE · erro médio',
    rmse: 'RMSE · penaliza erros grandes',
    r2: 'R² · variação explicada',
    accuracy: 'Accuracy · acurácia',
    precision_macro: 'Precision · média',
    recall_macro: 'Recall · média',
    f1_macro: 'F1-score · média',
    high_recall: 'Recall da classe High',
    inertia: 'Inertia · compactação dos grupos'
  };

  return labels[key] || key.replaceAll('_', ' ');
}

function metricDescription(key) {
  const descriptions = {
    mae:
      'Erro médio em unidades do alvo. Quanto menor, melhor.',

    rmse:
      'Erro que dá mais peso a desvios grandes. Quanto menor, melhor.',

    r2:
      'Próximo de 1 indica melhor explicação da variação. Pode ser negativo.',

    accuracy:
      'Percentual total de classificações corretas.',

    precision_macro:
      'Média da precisão entre as classes.',

    recall_macro:
      'Média da proporção de exemplos de cada classe identificados.',

    f1_macro:
      'Média do equilíbrio entre precisão e recall.',

    high_recall:
      'Proporção das baterias realmente High que foram identificadas como High.',

    inertia:
      'Soma das distâncias quadráticas até os centros dos clusters; menor tende a indicar grupos mais compactos.'
  };

  return descriptions[key] || '';
}

function renderMetrics(data) {
  const metrics = document.getElementById('metrics');
  const explanation = document.getElementById('metrics-explanation');
  const confusionWrap = document.getElementById('confusion-wrap');
  const clusterExplanation = document.getElementById('cluster-explanation');

  metrics.innerHTML = '';
  explanation.classList.add('hidden');
  confusionWrap.classList.add('hidden');
  clusterExplanation.classList.add('hidden');

  const entries = Object.entries(data).filter(([key, value]) =>
    typeof value === 'number' && Number.isFinite(value)
  );

  metrics.className = 'metrics-grid';

  metrics.innerHTML = entries.map(([key, value]) => `
    <article class="metric-chip">
      <span>${metricLabel(key)}</span>
      <strong>${Number(value).toFixed(3)}</strong>
      <small>${metricDescription(key)}</small>
    </article>
  `).join('');

  if (data.confusion_matrix && data.labels) {
    const labels = data.labels;

    let table = `
      <table>
        <thead>
          <tr>
            <th>Real ↓ / Previsto →</th>
            ${labels.map(label => `<th>${label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    data.confusion_matrix.forEach((row, i) => {
      table += `
        <tr>
          <th>${labels[i]}</th>
          ${row.map(value => `<td>${value}</td>`).join('')}
        </tr>
      `;
    });

    table += '</tbody></table>';

    document.getElementById('confusion-matrix').innerHTML = table;
    confusionWrap.classList.remove('hidden');
  }

  if (data.clusters) {
    const total = data.n_batteries || 0;

    clusterExplanation.innerHTML = `
      <strong>Como interpretar os grupos?</strong>
      <p>
        Foram analisadas ${total} baterias distintas.
        Cada cluster representa um conjunto com características semelhantes
        nas variáveis usadas pelo K-Means.
        Os números dos clusters (0, 1, 2...) são apenas identificadores:
        cluster 0 não significa melhor ou pior que cluster 1.
      </p>
      <p>
        <strong>Distribuição:</strong>
        ${Object.entries(data.clusters)
          .map(([id, count]) => `Grupo ${id}: ${count} baterias`)
          .join(' · ')}
      </p>
    `;

    clusterExplanation.classList.remove('hidden');
  } else {
    explanation.innerHTML = `
      <strong>Como interpretar:</strong>
      <p>
        ${entries.map(([key]) => `
          <b>${metricLabel(key)}:</b> ${metricDescription(key)}
        `).join('<br>')}
      </p>
      <p>
        Os dados de treino e teste são separados por bateria quando existe
        a coluna battery_id. Isso evita colocar registros da mesma bateria
        nos dois conjuntos.
      </p>
    `;

    explanation.classList.remove('hidden');
  }
}

function buildPredictionFields(features) {
  const container = document.getElementById('prediction-fields');

  container.innerHTML = '';

  features.forEach(feature => {
    const info = fieldInfo[feature] || [
      feature.replaceAll('_', ' '),
      'Informe o valor conhecido desta variável.'
    ];

    const label = document.createElement('label');
    label.textContent = info[0];

    const help = document.createElement('small');
    help.textContent = `${feature} · ${info[1]}`;

    const input = document.createElement('input');

    input.name = feature;
    input.dataset.feature = feature;
    input.required = true;
    input.placeholder = 'Informe um valor';

    input.type = feature === 'last_service_date'
      ? 'text'
      : 'number';

    if (input.type === 'number') {
      input.step = 'any';
    }

    label.append(input, help);
    container.appendChild(label);
  });
}

document.getElementById('example-button').addEventListener('click', () => {
  document.querySelectorAll('#prediction-fields input').forEach(input => {
    if (Object.hasOwn(exampleValues, input.name)) {
      input.value = exampleValues[input.name];
    } else if (input.type === 'number') {
      input.value = '0';
    } else {
      input.value = 'never';
    }
  });

  document.getElementById('prediction-message').textContent =
    'Exemplo preenchido. Revise os valores e execute a previsão.';
});

trainButton.addEventListener('click', async () => {
  const msg = document.getElementById('train-message');

  msg.textContent = 'Treinando... aguarde.';

  trainButton.disabled = true;
  predictButton.disabled = true;

  document.getElementById('prediction-result').innerHTML = '';

  const params = {};

  const depth = document.getElementById('max-depth').value;
  const estimators = document.getElementById('estimators').value;
  const neighbors = document.getElementById('neighbors').value;
  const learningRate = document.getElementById('learning-rate').value;

  if (depth) {
    params.max_depth = depth;
  }

  if (
    ['random_forest', 'extra_trees', 'gradient_boosting'].includes(algo.value)
  ) {
    params.n_estimators = estimators;
  }

  if (algo.value === 'knn') {
    params.n_neighbors = neighbors;
  }

  if (algo.value === 'gradient_boosting' && learningRate) {
    params.learning_rate = learningRate;
  }

  const payload = {
    kind: kind.value,
    algorithm: algo.value,
    target: target.value,
    params,
    n_clusters: Number(document.getElementById('clusters').value)
  };

  try {
    const response = await fetch('/api/train', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Não foi possível treinar o modelo.');
    }

    renderMetrics(data.metrics || {});

    if (kind.value !== 'clustering') {
      trainedFeatures = data.features || [];
      trainedKind = kind.value;
      trainedTarget = target.value;

      buildPredictionFields(trainedFeatures);

      predictButton.disabled = trainedFeatures.length === 0;

      document.getElementById('prediction-message').textContent =
        `Modelo treinado para prever ${trainedTarget}. Preencha os ${trainedFeatures.length} campos para testar.`;
    } else {
      trainedKind = null;
      trainedFeatures = [];

      document.getElementById('prediction-fields').innerHTML = '';
    }

    msg.textContent = `
      ${data.message}
      ${data.train_rows
        ? `Treino: ${data.train_rows} registros; teste: ${data.test_rows} registros.`
        : ''}
    `;
  } catch (error) {
    msg.textContent = error.message;
  } finally {
    trainButton.disabled = false;
  }
});

predictButton.addEventListener('click', async () => {
  const result = document.getElementById('prediction-result');
  const msg = document.getElementById('prediction-message');

  const values = {};
  const missing = [];

  document.querySelectorAll('#prediction-fields input').forEach(input => {
    const value = input.value.trim();

    if (!value) {
      missing.push(input.name);
    } else {
      values[input.name] = value;
    }
  });

  if (missing.length) {
    msg.textContent =
      `Preencha todos os campos antes de prever: ${missing.join(', ')}.`;
    return;
  }

  predictButton.disabled = true;
  msg.textContent = 'Calculando previsão...';

  try {
    const response = await fetch('/api/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        kind: trainedKind,
        values
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Não foi possível executar a previsão.');
    }

    let title = trainedTarget === 'state_of_health_pct'
      ? 'Saúde estimada da bateria'
      : trainedTarget === 'remaining_useful_life_cycles'
        ? 'Ciclos de vida útil restantes estimados'
        : 'Categoria de risco estimada';

    let value = data.prediction;

    if (
      trainedKind === 'regression' &&
      trainedTarget === 'state_of_health_pct'
    ) {
      value = `${Number(value).toFixed(2)}%`;
    }

    if (
      trainedKind === 'regression' &&
      trainedTarget === 'remaining_useful_life_cycles'
    ) {
      value = `${Math.round(Number(value)).toLocaleString('pt-BR')} ciclos`;
    }

    let html = `
      <div class="ml-result-label">${title}</div>
      <div class="ml-result-value">${value}</div>
    `;

    if (data.probabilities) {
      html += `
        <div class="ml-probabilities">
          <b>Probabilidades estimadas por classe</b>
      `;

      html += Object.entries(data.probabilities).map(([label, probability]) => `
        <div>
          <span>${label}</span>
          <strong>${(probability * 100).toFixed(1)}%</strong>
          <div class="ml-probability-track">
            <i style="width:${Math.max(0, Math.min(100, probability * 100))}%"></i>
          </div>
        </div>
      `).join('');

      html += '</div>';
    }

    html += `
      <small>
        Resultado gerado pelo modelo treinado nesta sessão.
        É uma estimativa, não uma garantia sobre o comportamento real da bateria.
      </small>
    `;

    result.innerHTML = html;
    msg.textContent = 'Previsão concluída.';
  } catch (error) {
    msg.textContent = error.message;
  } finally {
    predictButton.disabled = false;
  }
});