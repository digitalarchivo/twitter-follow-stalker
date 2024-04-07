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

	async loop() {
		if (!this.me) {
			await request(async () => this.me = await client.instance.currentUser());
		}

		if (this.timeout && (this.timeout - moment().unix() > 0)) {
			const ms = (this.timeout - moment().unix()) * 100;
			console.log(`Waiting ${ms}ms for timeout to expire...`);
			await new Promise(r => setTimeout(r, ms));
		}

		this.check();
	}

	async check() {
		const timeout = moment();

		timeout.add(client.config.delay * 10, 'milliseconds');

		this.timeout = timeout.unix();

		// const users = await getUsers(...client.config.accounts);
		for (const user of client.config.accounts) {
			const following = await request(() => client.instance.v1.userFollowingIds({ screen_name: user, count: 9999999999999 }));

			const newFollowing = client.storage.compare(user, following.data.ids);

			const users = await getUsers(...newFollowing);
			if (users.length) {
				webhook.send(client.config.webhook, {
					content: [
						`${user} is now following the following people:`,
						'',
						...users.map(r => `(${r.name} (@${r.screen_name}))[${r.url}]`).join('\n')
					].join('\n')
				});
			}

			client.storage.set(user, following.data.ids);
		}

		this.loop();
	}
}

export default new Interval();