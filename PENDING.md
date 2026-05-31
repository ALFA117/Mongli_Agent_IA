# PENDING — Mongli_Agent_IA
> Lo que falta para el submit final en DoraHacks. Actualizar cuando se complete cada item.

---

## BLOQUEADOS — Requieren wallet con fondos

### ⏳ 1. Deploy del contrato en Mantle Sepolia (Testnet)

```bash
# Prerequisito: fondear la wallet en https://faucet.sepolia.mantle.xyz
# Crear .env con:
DEPLOYER_PRIVATE_KEY=0x...
AGENT_PRIVATE_KEY=0x...        # puede ser la misma wallet

# Deploy + verificación automática:
cd contracts
npx hardhat run scripts/deploy.js --network mantleTestnet
```

**Output esperado:**
```
MongliSignals deployed to: 0x<CONTRACT_ADDRESS>
✓ Verified on explorer!
```

**Después:** copiar `CONTRACT_ADDRESS` al `.env`

---

### ⏳ 2. Actualizar variable de entorno en Vercel

1. Ir a: https://vercel.com/alfa117s-projects/frontend/settings/environment-variables
2. Agregar: `VITE_CONTRACT_ADDRESS` = `0x<dirección del testnet>`
3. Redeploy: `npx vercel --prod --yes` desde `frontend/`

---

### ⏳ 3. Correr el agente y generar ≥ 10 señales on-chain

```bash
# Desde la raíz del proyecto, con .env configurado:
make agent
# O con Docker:
docker compose up -d
```

**El agente:**
- Escanea Mantle Sepolia cada 30s
- Genera señales con confidence ≥ 70%
- Las escribe en `MongliSignals.sol`
- Las muestra en el dashboard live

**Mínimo para el hackathon:** 10 señales on-chain

---

### ⏳ 4. Configurar el bot de Telegram

1. Hablar con `@BotFather` en Telegram
2. Crear bot: `/newbot` → nombre: `Mongli Agent IA` → username: `MongliAgentBot`
3. Copiar el token al `.env`: `TELEGRAM_BOT_TOKEN=...`
4. Reiniciar el agente

**Verificar:** `/start` en el bot, luego `/top5` para ver señales

---

### ⏳ 5. Deploy a Mantle Mainnet (para submit final)

```bash
# Solo después de haber probado en testnet con ≥ 10 señales
cd contracts
npx hardhat run scripts/deploy.js --network mantle
```

**Después:** actualizar `VITE_CONTRACT_ADDRESS` en Vercel con la dirección mainnet

---

### ⏳ 6. Grabar el video demo (≥ 2 minutos)

**Script:**
```
[0:00–0:15]  Abrir el dashboard: https://mongli-agent-ia.vercel.app
             Mostrar el HUD, señales live, ticker en el navbar
[0:15–0:40]  LiveFeed: explicar tipos de señal, hacer click en una fila
             Mostrar el modal con el dataHash y la explicación de verificación
[0:40–1:00]  WalletExplorer: buscar una wallet activa, mostrar el Score Ring
[1:00–1:20]  Analytics: mostrar gráficos, Top Wallets table
[1:20–1:40]  Abrir Mantle Explorer: mostrar el contrato MongliSignals.sol
             Llamar getRecentSignals() desde el explorer
[1:40–2:00]  Terminal: mostrar el agente corriendo, generando señales
             Mostrar el log: [SMART_MONEY_IN] conf=87% wallet=0x...
```

**Subir a:** YouTube (unlisted) o Loom → pegar URL en DoraHacks

---

### ⏳ 7. Submit en DoraHacks

**URL:** https://dorahacks.io (buscar "Turing Test 2026 Mantle")

**Información a completar** (ver `SUBMISSION.md`):
- [ ] Nombre: `Mongli_Agent_IA`
- [ ] Descripción corta: AI agent on Mantle...
- [ ] GitHub URL: https://github.com/ALFA117/Mongli_Agent_IA
- [ ] Dashboard URL: https://mongli-agent-ia.vercel.app
- [ ] **Contract address** ← llenar después del deploy
- [ ] **Video URL** ← llenar después de grabar
- [ ] Track: AI Alpha & Data + Implementation Prize

---

## COMPLETADO ✅

| Item | Estado |
|---|---|
| Smart contract `MongliSignals.sol` (Solidity 0.8.20) | ✅ |
| Hardhat setup + deploy script con auto-verificación | ✅ |
| 21 tests de contrato (Chai + Hardhat) | ✅ |
| Python agent completo (collector, ML, writer, API, backtesting) | ✅ |
| 46 tests del agente (pytest) | ✅ |
| ML Pipeline: IsolationForest + KMeans + SmartMoney Score | ✅ |
| FastAPI REST: `/signals`, `/stats`, `/health`, `/retrain` | ✅ |
| React dashboard (Vercel): LiveFeed, WalletExplorer, Analytics | ✅ |
| Dashboard live | ✅ https://mongli-agent-ia.vercel.app |
| GitHub público (MIT) | ✅ https://github.com/ALFA117/Mongli_Agent_IA |
| GitHub Actions CI (3 jobs paralelos) | ✅ |
| Signal detail modal con dataHash + verificación | ✅ |
| Top Wallets en Analytics | ✅ |
| Demo Mode banner | ✅ |
| Mobile hamburger menu | ✅ |
| SPA routing fix (vercel.json) | ✅ |
| Lazy loading (React.lazy + Suspense) | ✅ |
| Docker + docker-compose | ✅ |
| Fly.io config (fly.toml) | ✅ |
| README completo con arquitectura | ✅ |
| SUBMISSION.md con template DoraHacks | ✅ |
| LICENSE (MIT) | ✅ |
| Makefile con todos los comandos | ✅ |

---

## RESUMEN PARA LA SESIÓN DE MAÑANA

```
1. Fondear wallet Sepolia  → https://faucet.sepolia.mantle.xyz
2. make deploy-testnet     → copia CONTRACT_ADDRESS
3. Poner CONTRACT_ADDRESS en Vercel → redeploy
4. make agent              → genera señales 30min
5. Configurar Telegram bot → @BotFather
6. Grabar video 2min       → subir a YouTube/Loom
7. Submit DoraHacks        → pegar todo en el formulario
```

**Tiempo estimado:** 2–3 horas con fondos disponibles.
