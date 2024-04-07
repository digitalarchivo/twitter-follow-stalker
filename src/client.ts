import { CONSUMER_SECRET, CONSUMER_KEY } from './constants';
import { TwitterApi } from 'twitter-api-v2';
import { xauthLogin } from 'xauth-login';
import config from '../config.json';
import Interval from './interval';
import Storage from './storage';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export class Client {
	public instance: InstanceType<typeof TwitterApi>;
	public storage = new Storage();
	public config = config;
	public started: Date;

	async connect() {
		let auth;

		const authPath = join(__dirname, '..', 'auth.json');
		if (existsSync(authPath)) {
			const content = readFileSync(authPath, 'utf-8');
			auth = JSON.parse(content);
		} else {
			auth = await xauthLogin({
				username: this.config.sniper.username,
				password: this.config.sniper.password,
				appKey: CONSUMER_KEY,
				appSecret: CONSUMER_SECRET
			});
		}

		if (typeof auth !== 'object' || !auth.oauth_token || !auth.oauth_token_secret) {
			console.error('Failed to log in:', auth);
			return;
		}

		const { oauth_token, oauth_token_secret } = auth;
		writeFileSync(authPath, JSON.stringify(auth, null, 2), 'utf-8');

		this.instance = new TwitterApi({
			appKey: CONSUMER_KEY,
			appSecret: CONSUMER_SECRET,
			accessToken: oauth_token,
			accessSecret: oauth_token_secret
		});

		console.log(`Logged in as ${(await this.instance.currentUser()).screen_name}`);

		this.started = new Date();

		await Interval.loop();
	}
}

export default new Client();