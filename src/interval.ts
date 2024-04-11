import { UserV1 } from 'twitter-api-v2';
import request from './actions/request';
import client from './client';
import moment from 'moment';
import getUsers from './actions/getUsers';
import webhook from './webhook';

class Interval {
	public followed = new Map();
	public timeout: number;
	public me: UserV1;
	public optimalRatelimit: number;
	public ratelimits = {
		remaining: null,
		get optimal() {
			return client.storage.getOptimalRatelimitResetLength();
		},
		set optimal(value: number) {
			client.storage.setOptimalRatelimitResetLength(value);
		},
		get highestNumber() {
			return client.storage.getOptimalRatelimitRemaining();
		},
		set highestNumber(value: number) {
			client.storage.setOptimalRatelimitRemaining(value);
		},
		get reset() {
			return client.storage.getRatelimitReset();
		},
		set reset(value: number) {
			client.storage.setRatelimitReset(value);
		},
		get lastRatelimited() {
			return client.storage.getLastRatelimited();
		},
		set lastRatelimited(value: number) {
			client.storage.setLastRatelimited(value);
		},
	};

	async loop() {
		if (!this.me) {
			await request(async () => this.me = await client.instance.currentUser(), this.ratelimits);
		}

		if (this.timeout && (this.timeout - moment().unix() > 0)) {
			const ms = (this.timeout - moment().unix()) * 100;
			console.log(`Waiting ${ms}ms for timeout to expire...`);
			await new Promise(r => setTimeout(r, ms));
		}

		this.check();
	}

	async check() {
		for (const user of client.config.accounts) {
			console.log(`> Checking ${user}.`);
			const following = await request(() => client.instance.v1.userFollowingIds({ screen_name: user }), this.ratelimits);
			const newFollowing = client.storage.compare(user, following.data.ids);


			console.log(newFollowing);

			if (newFollowing.length) {
				const users = await getUsers(...newFollowing) as any as UserV1[];
				if (users.length) {
					webhook.send(client.config.webhook, {
						content: [
							`${user} is now following the following people:`,
							'',
							users.map(r => `${r.name} [@${r.screen_name}](https://x.com/${r.screen_name})`.trim()).join('\n')
						].join('\n')
					});
				}
			}

			if (following.rateLimit) {
				this.ratelimits.remaining = following.rateLimit.remaining;
				this.ratelimits.reset = following.rateLimit.reset;
			}

			const ms = this.ratelimits.reset * 1000;

			console.log('---------------------');
			console.log('Ratelimit remaining requests bucket:', this.ratelimits.remaining);
			console.log('Ratelimit bucket reset:', new Date(ms));
			if (this.ratelimits.optimal > 0) console.log('Optimal ratelimit delay:', this.ratelimits.optimal);
			console.log('---------------------');


			client.storage.set(user, following.data.ids);
		}

		const timeout = moment();
		timeout.add(this.ratelimits.optimal * 10, 'milliseconds');
		this.timeout = timeout.unix();

		this.loop();
	}
}

export default new Interval();