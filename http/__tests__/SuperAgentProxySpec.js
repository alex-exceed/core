import HttpProxy from 'http/HttpProxy';
import StatusCode from 'http/StatusCode';
import UrlTransformer from 'http/UrlTransformer';
import Window from 'window/Window';

describe('ima.http.SuperAgentProxy', () => {

	let proxy = null;
	let apiUrl = 'http://localhost:3001/api/';
	let response = {
		body: {
			data: 'some data'
		}
	};
	let superAgent = null;

	let data = {};
	let options = { ttl: 3600000, timeout: 2000, repeatRequest: 1, headers: [], withCredentials: true };
	let urlTransformer = new UrlTransformer();
	let windowHelper = new Window();

	beforeEach(() => {
		superAgent = {
			funcError: () => superAgent,
			get: () => superAgent,
			post: () => superAgent,
			put: () => superAgent,
			del: () => superAgent,
			patch: () => superAgent,
			set: () => superAgent,
			accept: () => superAgent,
			query: () => superAgent,
			send: () => superAgent,
			on: () => superAgent,
			withCredentials: () => superAgent,
			timeout: () => {
				setTimeout(() => {
					superAgent.funcError({ timeout: options.timeout });
				}, options.timeout);
				return superAgent;
			},
			end: () => superAgent
		};
		proxy = new HttpProxy(superAgent, urlTransformer, windowHelper);
	});

	using([
		'get',
		'post',
		'put',
		'delete',
		'patch'
	], (method) => {
		describe('method ' + method, () => {
			it('should return promise with response body', (done) => {
				spyOn(superAgent, 'end')
					.and
					.callFake((callback) => {
						return callback(null, response);
					});

				proxy.request(method, apiUrl, data, options)
					.then((result) => {
						expect(result.body).toEqual(response.body);
						done();
					})
					.catch((error) => {
						console.log(error);
						done();
					});
			});

			it('should return a "body" field in error object, when promise is rejected', (done) => {
				spyOn(superAgent, 'end')
					.and
					.callFake((callback) => {
						return callback({ timeout: options.timeout });
					});

				proxy.request(method, apiUrl, data, options)
					.then(() => {}, (error) => {
						expect(error.body).toBeDefined();
						done();
					});
			});

			it('should reject promise for Timeout error', (done) => {
				spyOn(superAgent, 'end')
					.and
					.callFake((callback) => {
						return callback({ timeout: options.timeout });
					});

				proxy.request(method, apiUrl, data, options)
					.then(() => {}, (error) => {
						expect(error.status).toEqual(StatusCode.TIMEOUT);
						done();
					});
			});

			it('should be timeouted for longer request then options.timeout', (done) => {
				jest.useFakeTimers();

				spyOn(superAgent, 'end')
					.and
					.callFake((callback) => {
						superAgent.funcError = callback;
						jest.runOnlyPendingTimers();
					});

				proxy.request(method, apiUrl, data, options)
					.then(() => {}, (error) => {
						expect(error.status).toEqual(StatusCode.TIMEOUT);
						done();
					});
			});

			it('should reject promise for CORS', (done) => {
				spyOn(superAgent, 'end')
					.and
					.callFake((callback) => {
						return callback({ crossDomain: true });
					});

				proxy.request(method, apiUrl, data, options)
					.then(() => {}, (error) => {
						expect(error.status).toEqual(StatusCode.FORBIDDEN);
						done();
					});
			});

			it('should reject promise for Forbidden', (done) => {
				spyOn(superAgent, 'end')
					.and
					.callFake((callback) => {
						return callback({ status: 403 });
					});

				proxy.request(method, apiUrl, data, options)
					.then(() => {}, (error) => {
						expect(error.status).toEqual(StatusCode.FORBIDDEN);
						done();
					});
			});

			it('should reject promise for Not found', (done) => {
				spyOn(superAgent, 'end')
					.and
					.callFake((callback) => {
						return callback({ status: 404 });
					});

				proxy.request(method, apiUrl, data, options)
					.then(() => {}, (error) => {
						expect(error.status).toEqual(StatusCode.NOT_FOUND);
						done();
					});
			});

			it('should reject promise for Internal Server Error', (done) => {
				spyOn(superAgent, 'end')
					.and
					.callFake((callback) => {
						return callback({ status: 500 });
					});

				proxy.request(method, apiUrl, data, options)
					.then(() => {}, (error) => {
						expect(error.status).toEqual(StatusCode.SERVER_ERROR);
						done();
					});
			});

			it('should reject promise for UNKNOWN', (done) => {
				spyOn(superAgent, 'end')
					.and
					.callFake((callback) => {
						return callback({});
					});

				proxy.request(method, apiUrl, data, options)
					.then(() => {}, (error) => {
						expect(error.status).toEqual(StatusCode.SERVER_ERROR);
						done();
					});
			});

			it('should set credentials to request', (done) => {
				spyOn(superAgent, 'end')
					.and
					.callFake((callback) => {
						return callback(null, response);
					});

				spyOn(proxy, '_setCredentials')
					.and
					.returnValue(proxy);

				proxy.request(method, apiUrl, data, options)
					.then((result) => {
						expect(proxy._setCredentials).toHaveBeenCalled();
						done();
					})
					.catch((error) => {
						console.log(error);
						done();
					});
			});

			it('should call private method _setListeners for each request', (done) => {
				spyOn(superAgent, 'end')
					.and
					.callFake((callback) => {
						return callback(null, response);
					});

				spyOn(proxy, '_setListeners')
					.and
					.returnValue(proxy);

				proxy.request(method, apiUrl, data, options)
					.then(() => {
						expect(proxy._setListeners).toHaveBeenCalled();
						done();
					});
			});

			it('should add listener for "progress" to request', (done) => {
				spyOn(superAgent, 'on')
					.and
					.stub();

				spyOn(superAgent, 'end')
					.and
					.callFake((callback) => {
						return callback(null, response);
					});

				function dummy() {}
				let reqOptions = Object.assign({}, options, { 'listeners': { 'progress': dummy } });

				proxy.request(method, apiUrl, data, reqOptions)
					.then(() => {
						expect(superAgent.on).toHaveBeenCalledWith('progress', dummy);
						expect(superAgent.on.calls.count()).toEqual(1);
						done();
					});
			});
		});
	});
});
