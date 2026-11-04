# Battery Insights

Aplicação web acadêmica para análise de dados e Machine Learning aplicados à saúde de baterias de veículos elétricos.

## Funcionalidades
- Upload de CSV, JSON e XML (até 16 MB).
- Resumo estatístico, prévia, distribuições e matriz de correlação.
- Regressão para estimar `state_of_health_pct`.
- Classificação para prever `failure_risk_label`.
- Clusterização K-Means (K=4 por padrão), agregando medianas por `battery_id`.
- Retreinamento explícito após carregar uma nova base.
- Divisão treino/teste por `battery_id` quando houver identificadores suficientes.
- Imputação de ausentes, padronização numérica e One-Hot Encoding de categorias.

## Requisitos
Python 3.10 ou superior recomendado.

## Instalação

```bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

Acesse http://127.0.0.1:5000.

## Testes

```bash
pytest -q
```

## Dataset e colunas
O tema usa o conjunto `ev_battery_health.csv`. Para os fluxos de ML, são esperadas as colunas abaixo (os nomes devem corresponder exatamente):

- Identificador: `battery_id`
- Regressão: `state_of_health_pct`
- Classificação: `failure_risk_label`
- Clusterização: `fast_charge_ratio`, `avg_depth_of_discharge_pct`, `avg_state_of_charge_pct`, `avg_daily_distance_km`, `charge_cycles_per_month`, `avg_ambient_temp_c`
- Campos conhecidos adicionais: `capacity_fade_pct`, `remaining_useful_life_cycles`, `degradation_category`, `last_service_date`

A análise exploratória aceita outras colunas também. Os modelos exigem a variável-alvo correspondente e atributos compatíveis.

## Decisões metodológicas
- `capacity_fade_pct` é excluída como preditora da regressão porque representa informação diretamente derivada da saúde da bateria.
- `remaining_useful_life_cycles`, `failure_risk_label` e `degradation_category` são excluídas dos atributos preditores para evitar vazamento de informação.
- `battery_id` não entra como atributo; quando possível, é usado para manter registros da mesma bateria no mesmo lado da divisão treino/teste.
- A clusterização resume cada bateria pela mediana de seus registros, evitando tratar leituras repetidas como baterias independentes.
- `last_service_date` ausente é normalizado para `never`, representando explicitamente que não há serviço registrado.
- Após um novo upload, é necessário treinar novamente o modelo antes de predizer. Os modelos ficam em memória e são perdidos ao reiniciar o servidor.

## Limitações da versão acadêmica
- O dataset ativo e os modelos são mantidos em memória; não há banco de dados nem autenticação.
- A aplicação foi pensada para uso local/demonstração, não para múltiplos usuários simultâneos em produção.
- O upload substitui a base ativa; não mescla registros automaticamente.
- A interface de predição apresenta os atributos do modelo treinado; campos categóricos devem receber valores compatíveis com a base.
- O carregamento de XML espera uma estrutura tabular simples, com um elemento filho por registro e seus filhos como colunas.

## Estrutura
`app/routes` contém os endpoints e páginas; `app/services` concentra leitura, análise e modelos; `templates` e `static` formam a interface; `tests` contém testes automatizados.
