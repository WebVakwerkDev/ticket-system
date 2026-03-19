---
title: n8n koppelen aan Agency OS
folder: Integraties
order: 10
---

# Doel

Gebruik n8n om automatisch intakeformulieren, e-mails of andere triggers door te zetten naar Agency OS.

# Aanpak

1. Maak in n8n een trigger aan.

Bijvoorbeeld:

- Webhook
- Gmail / IMAP trigger
- Typeform / Tally / website formulier

2. Voeg daarna een HTTP Request node toe.

Gebruik deze instellingen:

- Methode: `POST`
- URL: `https://jouwdomein.nl/api/internal/projects`
- Header: `Authorization = Bearer JOUW_INTERNAL_API_KEY`
- Header: `Content-Type = application/json`

3. Stuur een JSON body mee met klant, project en eventueel het eerste logitem.

# Praktisch voorbeeld

```json
{
  "client": {
    "companyName": "Acme B.V.",
    "contactName": "Jan Jansen",
    "email": "jan@acme.nl",
    "phone": "+31 6 12345678"
  },
  "project": {
    "name": "Nieuwe website Acme",
    "projectType": "NEW_WEBSITE",
    "status": "INTAKE",
    "priority": "MEDIUM",
    "description": "Klant wil een nieuwe website met duidelijke dienstenpagina's en een betere intakeflow."
  },
  "initialCommunication": {
    "type": "EMAIL",
    "subject": "Nieuwe aanvraag via formulier",
    "content": "Aanvraag automatisch doorgestuurd vanuit n8n."
  },
  "source": {
    "type": "n8n",
    "label": "Website intake"
  }
}
```

# Wat er gebeurt

- Bestaat de klant al, dan wordt die hergebruikt.
- Bestaat de klant nog niet, dan wordt die aangemaakt.
- Het project wordt aangemaakt in Agency OS.
- Het eerste logitem kan meteen worden opgeslagen.

# Benodigd in .env

- `INTERNAL_API_KEY=een lange geheime sleutel`

# Advies

- Laat n8n altijd een vaste `source.label` meesturen, zodat je later weet waar de intake vandaan kwam.
- Gebruik een centrale HTTP Request node of subworkflow voor alle nieuwe aanvragen.
- Test eerst met een losse webhook en voorbeeldpayload voordat je live formulieren koppelt.
