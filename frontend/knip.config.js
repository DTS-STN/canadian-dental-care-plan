/** @import {KnipConfig} from "knip" */

/** @type {KnipConfig} */
const config = {
  workspaces: {
    '.': {
      entry: ['./app/.server/express-server/opentelemetry.server.ts', './app/.server/express-server/express.server.ts'],
    },
  },
};

export default config;
