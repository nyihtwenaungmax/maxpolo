# Sun — Knowledge Assistant (POC)

A minimal, installable (PWA) chat front-end that calls a Microsoft Foundry
agent grounded on your knowledge base.

## What's in here

```
sun-knowledge-bot/
├── index.html              Chat UI (PWA-enabled)
├── app.js                  Frontend chat logic
├── manifest.json           PWA manifest
├── service-worker.js       App-shell caching for installability
├── icon-192.png / icon-512.png   App icons
├── staticwebapp.config.json      Routing rules for Static Web Apps
├── api/
│   ├── chat/
│   │   ├── __init__.py     Azure Function — calls the Foundry agent
│   │   └── function.json   HTTP trigger binding
│   ├── host.json
│   └── requirements.txt
└── README.md
```

## 1. Push this to your GitHub repo

```bash
git init  # if not already a repo
git add .
git commit -m "Initial Sun knowledge assistant app"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## 2. Create the Static Web App (if not already created)

Azure Portal → Static Web Apps → Create
- Resource Group: `rg-sun-poc-sea`
- Name: `stapp-sun-poc-sea`
- Plan type: Free
- Deployment source: GitHub → select this repo → branch `main`
- Build details:
  - App location: `/`
  - Api location: `/api`
  - Output location: *(leave blank)*

This auto-generates a GitHub Actions workflow in `.github/workflows/` that
builds and deploys on every push to `main`.

## 3. Set required Application Settings

In the Azure Portal, go to your Static Web App → **Environment variables**
(or **Configuration**) and add:

| Name | Value |
|---|---|
| `FOUNDRY_PROJECT_ENDPOINT` | Your Foundry project endpoint, e.g. `https://foundry-sun-poc-sea.services.ai.azure.com/api/projects/sun-poc-project` |
| `FOUNDRY_AGENT_NAME` | `sun-knowledge-agent` (or your actual agent name) |

## 4. Enable Managed Identity and grant it access

1. Static Web App → **Identity** → System assigned → **On** → Save.
2. Go to your **Azure AI Foundry** resource → **Access control (IAM)** →
   **Add role assignment** → role **Azure AI Developer** (or **Foundry
   User**) → assign to **Managed identity** → select your Static Web App's
   identity.

## 5. Test

Visit your Static Web App URL (shown in the Overview page, something like
`https://<random-name>.azurestaticapps.net`), ask a question, and confirm
you get a grounded answer.

On mobile Chrome/Edge, you should see an "Install app" / "Add to Home
Screen" prompt once the manifest + service worker are being served over
HTTPS — Static Web Apps gives you HTTPS by default, so no extra setup
needed there.

## Notes

- The service worker only caches the app shell (HTML/JS/CSS/icons), never
  `/api/*` calls — so chat answers are always fresh, only the app itself
  works offline/installs like a native app.
- `DefaultAzureCredential` in `api/chat/__init__.py` will automatically use
  the Static Web App's managed identity once deployed — no secrets stored
  in code or config.
- For local testing before deploying, you'd need the Azure Static Web Apps
  CLI (`swa start`) and Azure Functions Core Tools — ask if you want those
  steps too.
