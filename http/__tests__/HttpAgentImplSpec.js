jest.mock('http/HttpProxy');
jest.mock('storage/CookieStorage');

import Helper from 'ima-helpers';
import Cache from 'cache/Cache';
import GenericError from 'error/GenericError';
import HttpAgentImpl from 'http/HttpAgentImpl';
import SuperAgentProxy from 'http/HttpProxy';
import CookieStorage from 'storage/CookieStorage';
import Storage from 'storage/Storage';

describe('ima.http.HttpAgentImpl', () => {

	let proxy = null;
	let http = null;
	let cache = null;
	let cookie = null;
	let options = null;
	let data = null;
	let httpConfig = null;
	let cacheStorage = null;
	let cacheFactory = null;

	beforeEach(() => {
		cache = new Cache();
		proxy = new SuperAgentProxy();
		cookie = new CookieStorage();
		httpConfig = {
			defaultRequestOptions: {
				timeout: 7000,
				repeatRequest: 1,
				ttl: 0,
				headers: {
					'Accept': 'application/json',
					'Accept-Language': 'en'
				},
				cache: true
			},
			cacheOptions: {
				prefix: 'http.'
			}
		};
		http = new HttpAgentImpl(proxy, cache, cookie, httpConfig);

		options = {
			ttl: httpConfig.defaultRequestOptions.ttl,
			timeout: httpConfig.defaultRequestOptions.timeout,
			repeatRequest: httpConfig.defaultRequestOptions.repeatRequest,
			headers: {},
			cache: true,
			withCredentials: true,
			language: httpConfig.defaultRequestOptions.language
		};

		data = {
			status: 200,
			body: 111,
			params:{
				url: 'url',
				data: {},
				options: options
			},
			header:{
				'set-cookie':[
					'cookie1=cookie1',
					'cookie2=cookie2'
				]
			}
		};
	});

	using([
		'get',
		'post',
		'put',
		'patch',
		'delete'
	], (method) => {
		describe(method + ' method', () => {

			beforeEach(() => {
				data.params.method = method;
			});

			it('should be return resolved promise with data', (done) => {
				spyOn(proxy, 'request')
					.and
					.callFake(() => {
						return Promise.resolve(data);
					});

				spyOn(proxy, 'haveToSetCookiesManually')
					.and
					.returnValue(false);

				http[method](data.params.url, data.params.data, data.params.options)
					.then((response) => {
						let agentResponse = {
							status: data.status,
							params: data.params,
							body: data.body,
							headers: data.header,
							cached: false
						};

						expect(response).toEqual(agentResponse);
						done();
					})
					.catch((e) => {
						console.error(e.message, e.stack);
						done();
					});
			});

			it('should be rejected with error', (done) => {
				spyOn(proxy, 'request')
					.and
					.callFake(() => {
						return Promise.reject(data.params);
					});

				http[method](data.params.url, data.params.data, data.params.options)
					.then(() => {}, (error) => {
						expect(error instanceof GenericError).toBe(true);
						expect(proxy.request.calls.count()).toEqual(2);
						done();
					});
			});

			it('should be set cookie', (done) => {
				spyOn(proxy, 'request')
					.and
					.callFake(() => {
						return Promise.resolve(data);
					});
				spyOn(proxy, 'haveToSetCookiesManually')
					.and
					.returnValue(true);
				spyOn(cookie, 'parseFromSetCookieHeader');

				http[method](data.params.url, data.params.data, data.params.options)
					.then(() => {
						expect(cookie.parseFromSetCookieHeader.calls.count()).toEqual(2);
						done();
					});
			});
		});
	});
});
