# Power Platform Data Fetcher Documentation

## Overview

This interactive/non-interactive CLI utility fetches data from specified Microsoft Power Platform (Dataverse) API endpoints. It authenticates using OAuth2 client credentials, retrieves data, optionally transforms it using JMESPath, formats it using Prettier, and saves the results as individual JSON files. It's built with Node.js and TypeScript, and can run `.ts` files directly **without requiring a build step** using `--experimental-strip-types`.

The script is typically executed directly via `node`:

```bash
node --experimental-strip-types ./scripts/fetch-power-platform-data.ts \
   --auth-client-id ... \
   --auth-client-secret ... \
   --auth-tenant-id ... \
   [OPTIONS]
```

## Features

- **OAuth2 Authentication:** Securely connects using Client ID, Client Secret, and Tenant ID.
- **Interactive Mode:** Select specific endpoints to fetch via checkboxes.
- **Non-Interactive Mode:** Fetch predefined or all endpoints for automated runs.
- **Configurable Endpoints:** Define API targets, queries, and output files within the script.
- **JMESPath Transformation:** Reshape raw API responses into desired JSON structures.
- **Prettier Formatting:** Automatically formats output JSON for readability.
- **Error Handling:** Reports issues during authentication or fetching clearly.

## Configuration (Command-Line Options)

| Option               | Req? | Description                                                                          | Default                                     |
| -------------------- | ---- | ------------------------------------------------------------------------------------ | ------------------------------------------- |
| --auth-client-id     | Yes  | Azure AD / Entra ID App Registration Client ID.                                      | -                                           |
| --auth-client-secret | Yes  | App Registration Client Secret. (Treat securely!)                                    | -                                           |
| --auth-tenant-id     | Yes  | Azure AD / Entra ID Tenant (Directory) ID.                                           | -                                           |
| --endpoints          | No   | Comma-separated list of endpoint names to fetch. If omitted, prompts or fetches all. | -                                           |
| --non-interactive    | No   | Run without prompts. Fetches --endpoints or all enabled endpoints.                   | false                                       |
| --output-dir         | No   | Directory to save output JSON files.                                                 | ./app/.server/resources/power-platform-new  |
| --resource-url       | No   | Base URL of the Power Platform environment (ends with /).                            | https://canadadental-uat.crm3.dynamics.com/ |

> **Security Warning:** The `--auth-client-secret` is sensitive. Avoid hardcoding it or exposing it in scripts/logs. Use environment variables or a secret manager.

## Running the Script

Execute using node, providing the required authentication flags:

```bash
# Basic command structure (handle secrets securely!)

node --experimental-strip-types ./scripts/fetch-power-platform-data.ts \
 --auth-client-id "YOUR_CLIENT_ID" \
 --auth-client-secret "YOUR_SECRET" \
 --auth-tenant-id "YOUR_TENANT_ID"
```

## Example Usage & Output (Interactive Mode)

### Command

```bash
# SECURITY WARNING: Example secret shown for illustration ONLY. Use secure methods!

node --experimental-strip-types ./scripts/fetch-power-platform-data.ts \
 --auth-client-id "ceab7c4a-2081-45c2-9996-2f0f3745d39d" \
 --auth-client-secret "8NvxpArEXGy3AyfpUAAbBnsx.GjmOq0cy" \
 --auth-tenant-id "52c352d9-496b-4279-887c-c61eafb16ce7"
```

### Example Console Prompt

```bash
# Script output after initial validation and token acquisition:

? Select endpoints to fetch: ›
❯ ◯ esdc_cctlettertypes - ESDC CCT Letter Types
◯ esdc_clientfriendlystatuses - ESDC Client Friendly Statuses
◯ esdc_countries - ESDC Countries
◯ esdc_governmentinsuranceplans (federal) - ESDC Federal Government Insurance Plans
◯ esdc_governmentinsuranceplans (provincial) - ESDC Provincial Government Insurance Plans
◯ esdc_maritalstatus - ESDC Marital Status
◯ esdc_preferredlanguage - ESDC Preferred Language
... (other defined endpoints)

```

User selects desired endpoints using spacebar and arrow keys, then presses `[Enter]`

## Security Considerations

- **Client Secret Handling:** The most critical aspect is the secure management of the `--auth-client-secret`.
  - **DO NOT** commit secrets to Git.
  - **DO NOT** log secrets or leave them in shell history.
  - **DO** use environment variables (export AUTH_SECRET=...), .env files (with dotenv or similar, ensuring .env is in .gitignore), or dedicated secret management tools (Azure Key Vault, Doppler, HashiCorp Vault, etc.).
