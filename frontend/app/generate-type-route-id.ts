import fs from 'fs';
import prettier from 'prettier';

import routesJson from './routes.json';
import { Route } from './utils/route-utils';

/**
 * Recursively extracts IDs from the JSON data.
 */
function extractIds(data: Route[], idSet: Set<string>) {
  for (const item of data) {
    idSet.add(item.id);
    if (item.children) {
      extractIds(item.children, idSet);
    }
  }
}

/**
 * Main function to generate union type of IDs.
 */
async function generateUnionType() {
  const idSet = new Set<string>();
  extractIds(routesJson as Route[], idSet);
  const idsArray = Array.from(idSet);

  const readonlySet = `export const routeIds = ${JSON.stringify(idsArray)} as const;\n`;
  const unionType = `export type RouteId = (typeof routeIds)[number];\n`;
  const output = `${readonlySet}${unionType}`;

  // Format the output with Prettier
  const formattedOutput = await prettier.format(output, { parser: 'typescript' });

  // Write the formatted union type to a file
  fs.writeFileSync('route-id.ts', formattedOutput);
  console.log('Union type generated and written to route-ids.ts');
}

generateUnionType();
