const fs = require('fs');
const request = require('request');
const logger = require('winston');
const Constants = require('./../constants');
const packageInfo = require('../../package.json');

//const PREFIX = 'http://hotsapi.net/api/v1';
const PREFIX = 'https://api.heroesprofile.com/api';

const UPLOAD_ENDPOINT = '/upload';
const USER_AGENT = `HeroesProfile Electron Uploader / version ${packageInfo.version} (https://github.com/Heroes-Profile/heroesprofile-electron-uploader)`;

class API {
	/**
	 * Uploads replay to heroesprofile.com and returns promise with replay object with new status
	 *
	 * @param {Object} replay
	 * @returns {Promise<Object>}
	 */
	static async uploadReplay(replay) {
		const options = {
			url: `${PREFIX}${UPLOAD_ENDPOINT}`,
			headers: {
				'User-Agent': USER_AGENT
			},
			formData: {
				file: fs.createReadStream(replay.fullPath)
			}
		};

		return new Promise(resolve => {
			logger.info(`Uploading: ${replay.fullPath}`);
			request.post(options, (err, resp, body) => {
				// if we encountered some weird connection error
				if (err) {
					logger.error(`Failed to upload: ${replay.fullPath}`, err);
					return resolve(
						Object.assign({}, replay, {
							status: Constants.REPLAY_STATUS.UPLOAD_ERROR
						})
					);
				}

				try {
					const parsedBody = JSON.parse(body);
					logger.info(`Uploaded: ${replay.fullPath} - body: ${body}`);
					return resolve(
						Object.assign({}, replay, {
							status:
								Constants.REPLAY_STATUS[parsedBody.status] ||
								Constants.REPLAY_STATUS.UNKNOWN
						})
					);
				} catch (err) {
					// If for some reason we failed to parse response from API
					logger.error(`Failed to parse response: ${replay.fullPath}`, err);
					return resolve(
						Object.assign({}, replay, {
							status: Constants.REPLAY_STATUS.UNKNOWN
						})
					);
				}
			});
		});
	}
}

module.exports = API;
