describe('ima.page.renderer.ServerPageRenderer', function() {

	var param1 = 'param1';
	var param2 = 'param2';
	var params = {
		param1: param1,
		param2: Promise.resolve(param2)
	};

	var controller = new ns.ima.controller.Controller();
	controller.getMetaManager = function() {};
	var view = function() {};
	var expressResponse = {
		status: function() {},
		send: function() {}
	};

	var pageRenderer = null;
	var $Helper = oc.get('$Helper');
	var rendererFactory = oc.get('$PageRendererFactory');
	var ReactDOMServer = {
		renderToString: function() {},
		renderToStaticMarkup: function() {}
	};
	var settings = oc.get('$Settings');
	var response = oc.get('$Response');
	var cache = oc.get('$Cache');
	var routeOptions = {
		onlyUpdate: false,
		autoScroll: false,
		allowSPA: false,
		documentView: null
	};

	beforeEach(function() {
		response.init(expressResponse);
		pageRenderer = oc.create('ima.page.renderer.ServerPageRenderer', [rendererFactory, $Helper, ReactDOMServer, settings, response, cache]);
	});

	it('should be wrap each key to promise', function() {
		spyOn(Promise, 'resolve')
			.and
			.callThrough();

		pageRenderer._wrapEachKeyToPromise(params);

		expect(Promise.resolve).toHaveBeenCalledWith(param1);
		expect(Promise.resolve.calls.count()).toEqual(1);
	});

	describe('update method', function() {

		it('should reject promise with error', function(done) {
			spyOn(pageRenderer, 'mount')
				.and
				.stub();

			pageRenderer
				.update(controller, params)
				.catch(function(error) {
					expect(error instanceof ns.ima.error.GenericError).toEqual(true);
					done();
				});
		});

	});

	describe('mount method', function() {

		var loadedPageState = {
			param1: 'param1',
			param2: Promise.resolve('param2')
		};

		it('should return already sent data to the client', function(done) {
			var responseParams = {
				content: '',
				status: 200,
				pageState: loadedPageState
			};

			spyOn(response, 'isResponseSent')
				.and
				.returnValue(true);
			spyOn(response, 'getResponseParams')
				.and
				.returnValue(responseParams);

			pageRenderer
				.mount(controller, view, loadedPageState, routeOptions)
				.then(function(page) {
					expect(page).toEqual(responseParams);
					done();
				});
		});

		it('should call _renderPage method', function(done) {
			spyOn(pageRenderer, '_renderPage')
				.and
				.stub();

			pageRenderer
				.mount(controller, view, loadedPageState, routeOptions)
				.then(function(page) {
					expect(pageRenderer._renderPage).toHaveBeenCalled();
					done();
				});
		});

	});

	describe('_renderPage method', function() {
		var fetchedResource = {
			resource: 'json'
		};

		it('should return already sent data to client', function() {
			var responseParams = {
				content: '',
				status: 200,
				pageState: fetchedResource
			};

			spyOn(response, 'isResponseSent')
				.and
				.returnValue(true);
			spyOn(response, 'getResponseParams')
				.and
				.returnValue(responseParams);

			expect(pageRenderer._renderPage(controller, view, fetchedResource)).toEqual(responseParams);
		});

		describe('render new page', function() {

			var responseParams = { status: 200, content: '', pageState: {} };
			var pageRenderResponse = null;

			beforeEach(function() {
				spyOn(controller, 'setState')
					.and
					.stub();
				spyOn(controller, 'setMetaParams')
					.and
					.stub();
				spyOn(controller, 'getHttpStatus')
					.and
					.stub();
				spyOn(pageRenderer, '_renderPageContentToString')
					.and
					.stub();
				spyOn(response, 'status')
					.and
					.returnValue(response);
				spyOn(response, 'setPageState')
						.and
						.returnValue(response);
				spyOn(response, 'send')
					.and
					.returnValue(response);
				spyOn(response, 'getResponseParams')
					.and
					.returnValue(responseParams);

				pageRenderResponse = pageRenderer._renderPage(controller, view, fetchedResource, routeOptions);
			});

			it('should set controller state', function() {
				expect(controller.setState).toHaveBeenCalledWith(fetchedResource);
			});

			it('should set meta params', function() {
				expect(controller.setMetaParams).toHaveBeenCalledWith(fetchedResource);
			});

			it('should send response for request', function() {
				expect(response.status).toHaveBeenCalled();
				expect(response.setPageState).toHaveBeenCalled();
				expect(response.send).toHaveBeenCalled();
				expect(controller.getHttpStatus).toHaveBeenCalled();
				expect(pageRenderer._renderPageContentToString).toHaveBeenCalledWith(controller, view, routeOptions);
			});

			it('should return response params', function() {
				expect(pageRenderResponse).toEqual(responseParams);
			});
		});
	});

	describe('_renderPageContentToString method', function() {

		var utils = { $Utils: 'utils' };
		var state = { state: 'state', $pageView: view };
		var propsView = { view: view };
		var props = Object.assign({}, state, utils, propsView);
		var wrapedPageViewElement = { wrapElementView: 'wrapedPageViewElement' };
		var pageMarkup = '<body></body>';
		var managedRootView = function() {};
		var documentView = function() {};
		var documentViewElement = function() {};
		var documentViewFactory = function() {
			return documentViewElement;
		};
		var appMarkup = '<html>' + pageMarkup + '</html>';
		var revivalSettings = { revivalSettings: 'revivalSettings' };
		var metaManager = { metaManager: 'metaManager' };
		var pageContent = null;

		beforeEach(function() {
			spyOn(pageRenderer, '_generateViewProps')
				.and
				.returnValue(props);
			spyOn(controller, 'getState')
				.and
				.returnValue(state);
			spyOn(rendererFactory, 'wrapView')
				.and
				.returnValue(wrapedPageViewElement);
			spyOn(ReactDOMServer, 'renderToString')
				.and
				.returnValue(pageMarkup);
			spyOn(rendererFactory, 'reactCreateFactory')
				.and
				.returnValue(documentViewFactory);
			spyOn(rendererFactory, 'getDocumentView')
				.and
				.returnValue(documentView);
			spyOn(rendererFactory, 'getManagedRootView')
				.and
				.returnValue(managedRootView);
			spyOn(ReactDOMServer, 'renderToStaticMarkup')
				.and
				.returnValue(appMarkup);
			spyOn(pageRenderer, '_getRevivalSettings')
				.and
				.returnValue(revivalSettings);
			spyOn(controller, 'getMetaManager')
				.and
				.returnValue(metaManager);
			spyOn(rendererFactory, 'getUtils')
				.and
				.returnValue(utils);

			pageContent = pageRenderer._renderPageContentToString(controller, view, routeOptions);
		});

		it('should generate view props from controller state', function() {
			expect(pageRenderer._generateViewProps).toHaveBeenCalledWith(managedRootView, state);
		});

		it('should wrap page view', function() {
			expect(rendererFactory.wrapView).toHaveBeenCalledWith(props);
		});

		it('should render page view to string', function() {
			expect(ReactDOMServer.renderToString).toHaveBeenCalledWith(wrapedPageViewElement);
		});

		it('should create factory for creating React element from document view', function() {
			expect(rendererFactory.reactCreateFactory).toHaveBeenCalledWith(documentView);
		});

		it('should return React Component for managedRootView from route options managedRootView property', function() {
			var routeOptionsWithDocument = Object.assign({}, routeOptions, { managedRootView: ns.ima.page.renderer.BlankManagedRootView });
			pageContent = pageRenderer._renderPageContentToString(controller, view, routeOptionsWithDocument);

			expect(rendererFactory.getManagedRootView).toHaveBeenCalledWith(ns.ima.page.renderer.BlankManagedRootView);
		});

		it('should create factory for creating React element from route options documentView property', function() {
			var routeOptionsWithDocument = Object.assign({}, routeOptions, { documentView: ns.ima.page.AbstractDocumentView });
			pageContent = pageRenderer._renderPageContentToString(controller, view, routeOptionsWithDocument);

			expect(rendererFactory.getDocumentView).toHaveBeenCalledWith(ns.ima.page.AbstractDocumentView);
		});

		it('should render static markup from document view', function() {
			expect(rendererFactory.getUtils).toHaveBeenCalled();
			expect(controller.getMetaManager).toHaveBeenCalled();
			expect(pageRenderer._getRevivalSettings).toHaveBeenCalled();
			expect(ReactDOMServer.renderToStaticMarkup).toHaveBeenCalledWith(documentViewElement);
		});

		it('should return page content', function() {
			expect(pageContent).toEqual('<!doctype html>\n' + appMarkup);
		});
	});

});
