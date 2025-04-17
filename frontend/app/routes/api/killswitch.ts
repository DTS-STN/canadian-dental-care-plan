/**
 * A dev-only API that force-enabled the application killswitch.
 */
import type { Route } from './+types/killswitch';

import { TYPES } from '~/.server/constants';
import { KILLSWITCH_KEY } from '~/.server/domain/services';
import { createLogger } from '~/.server/logging';
import { HttpStatusCodes } from '~/constants/http-status-codes';

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const log = createLogger('killswitch/loader');

  const serverConfig = context.appContainer.get(TYPES.configs.ServerConfig);

  if (!serverConfig.ENABLED_FEATURES.includes('killswitch-api')) {
    log.warn('killswitch-api is not enabled; returning 404 response');
    throw Response.json(null, { status: HttpStatusCodes.NOT_FOUND });
  }

  const redisService = context.appContainer.find(TYPES.data.services.RedisService);
  const currentRemainingTime = await redisService?.ttl(KILLSWITCH_KEY);

  if (currentRemainingTime && currentRemainingTime >= 0) {
    log.debug('Killswitch already engaged; returning killswitch status');
    return { engaged: true, remainingTimeSecs: currentRemainingTime };
  }

  const searchParams = new URL(request.url).searchParams;
  const engage = searchParams.get('engage') !== null;

  if (engage) {
    log.info('Force-enabling killswitch via killswitch API call');

    // note: `redisService` might not be defined, so we have to check that the return value is `OK` to know if the switch has been flipped
    const killswitchEngaged = (await redisService?.set(KILLSWITCH_KEY, true, serverConfig.APPLICATION_KILLSWITCH_TTL_SECONDS)) === 'OK';

    return {
      engaged: killswitchEngaged,
      ...(killswitchEngaged && {
        remainingTimeSecs: serverConfig.APPLICATION_KILLSWITCH_TTL_SECONDS,
      }),
    };
  }

  return { engaged: false };
}
