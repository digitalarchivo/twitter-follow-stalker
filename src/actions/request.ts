import { ApiResponseError } from 'twitter-api-v2';
import sleep from './sleep';

async function request<T>(callback: () => T | Promise<T>, ratelimits: { remaining?: number, reset?: number, optimal?: number; highestNumber?: number; } = {}) {
	while (true) {
		try {
			const res = await callback();


			// @ts-ignore
			ratelimits.highestNumber ??= 160;

			// @ts-ignore
			if (res.rateLimit?.remaining > ratelimits.highestNumber) {
				// @ts-ignore
				ratelimits.highestNumber = res.rateLimit.remaining;
			}

			return res;
		} catch (error) {
			if (error instanceof ApiResponseError && error.rateLimit?.remaining === 0) {
				ratelimits.highestNumber ??= 160;

				// @ts-ignore
				if (error.rateLimit?.remaining > ratelimits.highestNumber) {
					// @ts-ignore
					ratelimits.highestNumber = error.rateLimit.remaining;
				}

				const ms = error.rateLimit.reset * 1000;
				const timeout = ms - Date.now();
				const optimal = timeout / ratelimits.highestNumber;

				ratelimits.optimal = optimal > 0 ? optimal : 2500;

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