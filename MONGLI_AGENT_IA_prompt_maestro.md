# PROMPT MAESTRO — Mongli_Agent_IA
## Para usar en Claude Desktop / Claude Code

---

> **Cómo usarlo:** Copia todo el contenido de este documento y pégalo como primer mensaje en Claude Desktop o como contexto en Claude Code. Es tu brief completo de proyecto.

---

# CONTEXTO DEL PROYECTO

Eres el arquitecto técnico principal del proyecto **Mongli_Agent_IA**, un agente de inteligencia artificial de monitoreo on-chain para la red Mantle (blockchain EVM Layer 2). Este proyecto se construye para competir en el **Hackathon Turing Test 2026**, organizado por Mantle, con un premio total de $120,000 USD.

## Objetivo principal del hackathon

Desarrollar un agente autónomo de IA que:
1. Monitoree wallets de "smart money" en Mantle Network en tiempo real
2. Detecte patrones anómalos y movimientos inusuales on-chain usando IA
3. Genere señales accionables verificables en la blockchain
4. Entregue alertas via bot de Telegram y un dashboard web público

El proyecto compite en el track **AI Alpha & Data** (patrocinado por Mirana Ventures) y aspira simultáneamente al **Gran Campeón**, al **Premio Best UI/UX** y a los **20 Premios de Implementación**.

---

# NOMBRE DEL PROYECTO

**Mongli_Agent_IA**

Todo el código, contratos, repositorio, documentación y referencias públicas deben usar este nombre exacto.

---

# CRITERIOS DE EVALUACIÓN QUE DEBES MAXIMIZAR

El jurado evaluará con estos pesos. Cada decisión técnica debe estar justificada contra estos criterios:

| Criterio | Peso | Cómo lo maximizamos |
|---|---|---|
| Profundidad técnica | 30% | Tres capas: contrato Solidity + agente Python + interfaz web/Telegram |
| Innovación | 25% | Smart money detection con ML sobre Mantle — no existe aún |
| Contribución al ecosistema Mantle | 25% | Todos los datos desde Mantle RPC, contrato en Mantle Mainnet, NFT ERC-8004 |
| Integridad del producto | 20% | Demo pública funcional + video ≥2 min + README completo |

Para el track específico AI Alpha & Data:
- **General (60%):** Calidad de fuente de datos / Profundidad del análisis IA / Integridad técnica / Sostenibilidad
- **Específico (40%) — Estrategia Alpha:** Complejidad de estrategia + verificabilidad (backtesting / trading en vivo / registros on-chain)

---

# ARQUITECTURA TÉCNICA COMPLETA

## Stack tecnológico

```
Backend / Agente IA:
  - Python 3.11+
  - web3.py (conexión a Mantle RPC)
  - scikit-learn / numpy / pandas (análisis y clustering)
  - python-telegram-bot (bot de alertas)
  - FastAPI (API REST para el dashboard)
  - APScheduler (jobs periódicos de monitoreo)

Smart Contracts:
  - Solidity 0.8.x
  - Hardhat (desarrollo y deploy)
  - OpenZeppelin (estándares ERC)
  - Red objetivo: Mantle Mainnet (chain ID: 5000)
  - Red de prueba: Mantle Sepolia Testnet (chain ID: 5003)

Frontend Dashboard:
  - React + Vite
  - Tailwind CSS
  - ethers.js (lectura de datos on-chain)
  - Recharts (visualización de datos)
  - Deploy: Vercel o Netlify (acceso público obligatorio)

Infraestructura:
  - RPC Mantle: https://rpc.mantle.xyz (mainnet) / https://rpc.sepolia.mantle.xyz (testnet)
  - Explorer: https://explorer.mantle.xyz
  - GitHub: repositorio público con MIT license
```

## Diagrama de componentes

```
[Mantle Blockchain]
      ↓ (web3.py polling cada N segundos)
[Mongli Data Collector]
      ↓
[ML Engine] ← modelos de clustering y anomaly detection
      ↓
[Signal Writer] → escribe señales en contrato Solidity (on-chain)
      ↓
[Alert Dispatcher]
    ├── [Telegram Bot] → alertas a usuarios suscritos
    └── [FastAPI REST] → datos para el dashboard
                              ↓
                      [React Dashboard] ← acceso público
```

---

# COMPONENTES A DESARROLLAR (en orden de prioridad)

## 1. Smart Contract — `MongliSignals.sol`

**Propósito:** Registrar las señales de IA on-chain de forma permanente y verificable.

**Funciones requeridas:**
```solidity
// Registrar una señal de alerta generada por el agente
function recordSignal(
    address targetWallet,
    string calldata signalType,    // "WHALE_MOVE", "ANOMALY", "SMART_MONEY_IN", etc.
    uint256 confidenceScore,       // 0-100
    bytes32 dataHash               // hash del análisis off-chain
) external onlyAgent returns (uint256 signalId);

// Consultar señales por wallet
function getSignalsByWallet(address wallet) external view returns (Signal[] memory);

// Consultar últimas N señales globales
function getRecentSignals(uint256 count) external view returns (Signal[] memory);

// Estadísticas del agente
function getAgentStats() external view returns (uint256 totalSignals, uint256 accuracy);
```

**Requisitos del contrato:**
- Debe estar verificado en Mantle Explorer después del deploy
- Emitir eventos `SignalRecorded` para que el frontend pueda escucharlos
- Incluir control de acceso — solo la wallet del agente puede escribir señales
- Guardar timestamp de cada señal (block.timestamp)

## 2. Data Collector — `collector.py`

**Propósito:** Extraer y normalizar datos on-chain de Mantle.

**Datos a recolectar:**
- Transacciones de wallets con balance > X MNT (umbral configurable)
- Volumen de transfers por bloque
- Interacciones con protocolos DeFi de Mantle (Merchant Moe, Agni Finance, Fluxion)
- Cambios de liquidez en pools principales
- Wallets nuevas con actividad inusual en primeras 24h

**Output:** DataFrames normalizados listos para el ML Engine.

## 3. ML Engine — `ml_engine.py`

**Propósito:** Detectar patrones y anomalías usando modelos de ML ligeros.

**Modelos a implementar:**

```python
# Modelo 1: Detección de anomalías en volumen
IsolationForest(contamination=0.05)  # detecta wallets con comportamiento outlier

# Modelo 2: Clustering de wallets similares
KMeans(n_clusters=5)  # agrupa: retail, whale, bot, smart_money, nuevo

# Modelo 3: Score de "smart money"
# Reglas + ML: wallets que acumulan ANTES de movimientos de precio
# Features: timing relativo, tamaño de posición, diversificación, historial de profit
```

**Output de cada análisis:**
```python
{
    "wallet": "0x...",
    "signal_type": "SMART_MONEY_IN",
    "confidence": 87,
    "reasoning": "Wallet acumuló 50k MNT en 3 txs, patrón similar a movimiento del 2024-11-14",
    "on_chain_hash": "0x..."  # hash del objeto completo para el contrato
}
```

## 4. Signal Writer — `signal_writer.py`

**Propósito:** Conectar el ML Engine con el smart contract para escribir señales on-chain.

**Lógica:**
- Solo escribe señales con confidence ≥ 70
- Batching de señales para minimizar gas
- Retry automático si la tx falla
- Log local de todas las señales para backtesting

## 5. Telegram Bot — `telegram_bot.py`

**Comandos mínimos a implementar:**
```
/start          — Suscribirse a alertas
/watch 0x...    — Monitorear wallet específica
/top5           — Ver las 5 señales más recientes
/stats          — Estadísticas del agente (total señales, accuracy)
/help           — Ayuda
```

**Formato de alerta:**
```
🔴 MONGLI AGENT ALERT
━━━━━━━━━━━━━━━━━
Tipo: SMART_MONEY_IN
Wallet: 0x1234...5678
Confianza: 87%
Protocolo: Merchant Moe
Acción: Acumulación de 45,200 MNT
━━━━━━━━━━━━━━━━━
🔗 Ver on-chain: https://explorer.mantle.xyz/tx/...
```

## 6. React Dashboard — `frontend/`

**Páginas requeridas:**

### Home / Live Feed
- Tabla en tiempo real de últimas señales del agente
- Indicador de estado del agente (activo / inactivo)
- Contador total de señales emitidas

### Wallet Explorer
- Input para ingresar cualquier wallet address
- Historial de señales asociadas a esa wallet
- Score de "smart money" calculado por el agente

### Analytics
- Gráfico de señales por tipo (últimas 24h, 7d, 30d)
- Distribución de confidence scores
- Top 10 wallets más monitoreadas

### Verificación On-Chain
- Cualquier señal tiene un link directo al tx en Mantle Explorer
- Muestra el dataHash para verificación independiente

---

# REQUISITOS OBLIGATORIOS DEL HACKATHON

Estos son los requisitos que el jurado verificará. No son opcionales:

## Para el Premio de Implementación (20 slots)
- [ ] Contrato inteligente desplegado en **Mantle Mainnet o Testnet**
- [ ] Contrato **verificado** en Mantle Explorer
- [ ] Al menos una función de IA invocable on-chain (el `recordSignal` cumple esto)
- [ ] Demo frontend con **acceso público** (no localhost)
- [ ] Dirección del contrato incluida en el submit de DoraHacks
- [ ] Video demo ≥ 2 minutos mostrando el caso de uso principal
- [ ] Repositorio GitHub **público** con README completo

## Para el track AI Alpha & Data
- [ ] Usar datos on-chain de Mantle como fuente **primaria**
- [ ] Deploy en Mantle Network
- [ ] Repositorio open source + demo + descripción breve
- [ ] En el submit responder: ¿Qué fuentes de datos usa? ¿Qué papel juega la IA? ¿Cómo genera valor verificable en Mantle?

## Para el Gran Campeón
- [ ] Nominado en al menos una categoría
- [ ] Repositorio open source + demo ejecutable + propuesta de proyecto
- [ ] Debe estar desplegado en Mantle Network

---

# ESTRUCTURA DEL REPOSITORIO

El repo debe llamarse `Mongli_Agent_IA` y organizarse así:

```
Mongli_Agent_IA/
├── README.md                    ← Descripción, arquitectura, deploy instructions
├── contracts/
│   ├── MongliSignals.sol        ← Contrato principal
│   ├── hardhat.config.js
│   └── scripts/
│       └── deploy.js
├── agent/
│   ├── collector.py
│   ├── ml_engine.py
│   ├── signal_writer.py
│   ├── telegram_bot.py
│   ├── main.py                  ← Entry point del agente
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   └── components/
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── architecture.md          ← Diagrama de arquitectura
│   └── backtesting_results.md  ← Resultados de backtesting
└── .env.example                 ← Variables de entorno (sin claves reales)
```

---

# README.md — CONTENIDO OBLIGATORIO

El README debe incluir estas secciones exactas (el jurado lo revisa):

```markdown
# Mongli_Agent_IA

> AI-powered smart money tracking agent on Mantle Network

## What it does
[Descripción clara en ≤3 párrafos]

## Architecture Overview
[Diagrama ASCII o imagen del flujo]

## Deployed Contract
- Network: Mantle Mainnet / Mantle Sepolia Testnet
- Address: `0x...`
- Explorer: https://explorer.mantle.xyz/address/0x...

## How the AI works
[Explicación de los modelos usados y cómo generan señales verificables]

## Setup Instructions
[Pasos claros para correr el proyecto localmente]

## Live Demo
- Dashboard: https://...
- Telegram Bot: @MongliAgentBot

## Backtesting Results
[Tabla con resultados históricos de las señales]
```

---

# VARIABLES DE ENTORNO NECESARIAS

Crea un `.env.example` con estas variables (sin valores reales):

```env
# Mantle Network
MANTLE_RPC_URL=https://rpc.mantle.xyz
MANTLE_TESTNET_RPC_URL=https://rpc.sepolia.mantle.xyz
DEPLOYER_PRIVATE_KEY=           # wallet que despliega el contrato
AGENT_PRIVATE_KEY=              # wallet que escribe señales on-chain

# Telegram
TELEGRAM_BOT_TOKEN=             # obtenido de @BotFather

# Contrato desplegado
CONTRACT_ADDRESS=               # se completa después del deploy

# Configuración del agente
SCAN_INTERVAL_SECONDS=30        # frecuencia de escaneo
MIN_CONFIDENCE_THRESHOLD=70     # mínimo para emitir señal
WHALE_THRESHOLD_MNT=10000       # MNT mínimo para considerar wallet "whale"
```

---

# CRITERIOS DE ÉXITO — DEFINITION OF DONE

El proyecto está completo cuando:

### Nivel mínimo (asegura Premio Implementación)
- [ ] Contrato desplegado y verificado en Mantle
- [ ] Agente Python corriendo y generando señales
- [ ] Al menos 10 señales escritas on-chain en el contrato
- [ ] Dashboard público mostrando esas señales
- [ ] Video demo de 2 minutos subido

### Nivel competitivo (aspira a Premio por Track)
- [ ] Bot de Telegram funcional con alertas en tiempo real
- [ ] ML Engine con al menos 2 modelos (IsolationForest + KMeans)
- [ ] Backtesting documentado con resultados reales
- [ ] Dashboard con las 3 páginas: Live Feed, Wallet Explorer, Analytics

### Nivel campeón (aspira al Gran Campeón)
- [ ] Accuracy del agente documentada y verificable on-chain
- [ ] Al menos 50 señales registradas en mainnet
- [ ] Demo en vivo durante la transmisión del hackathon
- [ ] Propuesta escrita explicando el impacto a largo plazo para el ecosistema Mantle

---

# INSTRUCCIONES DE TRABAJO PARA CLAUDE

1. **Empieza siempre por el contrato.** Sin `MongliSignals.sol` desplegado y verificado no hay proyecto. Es el fundamento de todo.

2. **Prioriza que funcione sobre que sea perfecto.** Un agente que genera 10 señales reales on-chain vale más que un sistema complejo sin deploy.

3. **Cada función debe ser testeable de forma independiente.** El collector, el ML engine y el signal writer deben poder ejecutarse por separado con datos mock antes de conectarlos.

4. **Documenta mientras construyes.** Cada archivo debe tener docstrings. El README se actualiza cada vez que terminas un componente.

5. **Usa Mantle Sepolia Testnet para desarrollo, Mainnet para el submit final.** El chain ID del testnet es 5003. El RPC es `https://rpc.sepolia.mantle.xyz`.

6. **El video demo es tan importante como el código.** Planifica grabarlo cuando el sistema esté corriendo en vivo, no como afterthought.

7. **Antes de hacer el submit en DoraHacks, verifica esta lista:**
   - Contrato verificado en explorer
   - Demo URL pública funcionando
   - GitHub repo público
   - Video subido
   - Address del contrato en el submit

---

# CONTEXTO ADICIONAL DEL HACKATHON

- **Plataforma de submit:** DoraHacks (página de Mantle)
- **Jurado incluye:** Mirana Ventures, Nansen, Animoca Brands, Hashed, Cornell Blockchain
- **El estándar ERC-8004** asigna un NFT de identidad al agente automáticamente — Mantle lo provee, no necesitas implementarlo tú
- **Transmisión en vivo:** La fase AI Awakening se transmite globalmente — si llegamos a la final, el agente debe poder correr en tiempo real ante la audiencia
- **Un proyecto puede ganar múltiples premios** — no te limites a un solo track en el submit

---

*Prompt maestro generado para el proyecto Mongli_Agent_IA — Hackathon Turing Test 2026*
