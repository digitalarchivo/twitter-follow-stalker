import { ApiResponseError } from 'twitter-api-v2';
import sleep from './sleep';
import client from '../client';

async function request<T>(callback: () => T | Promise<T>, ratelimits: { remaining?: number, reset?: number, optimal?: number; highestNumber?: number; lastRatelimited?: number; } = {}) {
	while (true) {
		try {
			const res = await callback();

			// @ts-ignore
			if (res.rateLimit?.remaining > ratelimits.highestNumber) {
				// @ts-ignore
				ratelimits.highestNumber = res.rateLimit.remaining;
			}

			return res;
		} catch (error) {
			if (error instanceof ApiResponseError && error.rateLimit?.remaining === 0) {
				// @ts-ignore
				if (error.rateLimit?.remaining > ratelimits.highestNumber) {
					// @ts-ignore
					ratelimits.highestNumber = error.rateLimit.remaining;
				}

				if (ratelimits.reset > error.rateLimit.reset) {
					ratelimits.reset = error.rateLimit.reset;
					ratelimits.lastRatelimited = Date.now();
				}

				const ms = error.rateLimit.reset * 1000;
				const timeout = ms - ratelimits.lastRatelimited;
				const optimal = (timeout / ratelimits.highestNumber) * client.config.accounts.length;


				if (optimal > ratelimits.optimal) {
					ratelimits.optimal = optimal;
				}

				console.log('---------------------');
				console.log(`Updated optimal ratelimit delay: ${ratelimits.optimal}ms`);
				console.log(`Encountered ratelimit. Waiting for ${timeout}ms (until ${new Date(ms)})`);
				console.log('---------------------');

				await sleep(timeout);
				continue;
			} else {
				console.error('Encountered error:', error);
			}

			throw error;
		}
	}
}

export default request;