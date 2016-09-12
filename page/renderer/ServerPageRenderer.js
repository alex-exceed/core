// @server-side

import ns from '../../namespace';
import AbstractPageRenderer from './AbstractPageRenderer';
import PageRenderer from './PageRenderer';
import PageRendererFactory from './PageRendererFactory';
import Cache from '../../cache/Cache';
import AbstractController from '../../controller/AbstractController';
import GenericError from '../../error/GenericError';
import Response from '../../router/Response';

ns.namespace('ima.page.renderer');

/**
 * Server-side page renderer. The renderer renders the page into the HTML
 * markup and sends it to the client.
 *
 * @class ServerPageRenderer
 * @extends AbstractPageRenderer
 * @implements PageRenderer
 * @namespace ima.page.renderer
 * @module ima
 * @submodule ima.page
 */
export default class ServerPageRenderer extends AbstractPageRenderer {

	/**
	 * Initializes the server-side page renderer.
	 *
	 * @method contructor
	 * @constructor
	 * @param {PageRendererFactory} factory Factory for receive $Utils to view.
	 * @param {vendor.$Helper} Helper The IMA.js helper methods.
	 * @param {vendor.ReactDOMServer} ReactDOMServer React framework instance
	 *        to use to render the page on the server side.
	 * @param {Object<string, *>} settings Application setting for the current
	 *        application environment.
	 * @param {Response} response Utility for sending the page markup to the
	 *        client as a response to the current HTTP request.
	 * @param {Cache} cache Resource cache caching the results of HTTP requests
	 *        made by services used by the rendered page.
	 */
	constructor(factory, Helper, ReactDOMServer, settings, response, cache) {
		super(factory, Helper, ReactDOMServer, settings);

		/**
		 * Utility for sending the page markup to the client as a response to
		 * the current HTTP request.
		 *
		 * @private
		 * @property _response
		 * @type {Response}
		 */
		this._response = response;

		/**
		 * The resource cache, caching the results of all HTTP requests made by
		 * the services using by the rendered page. The state of the cache will
		 * then be serialized and sent to the client to re-initialize the page
		 * at the client side.
		 *
		 * @private
		 * @property _cache
		 * @type {Cache}
		 */
		this._cache = cache;

	}

	/**
	 * @inheritdoc
	 * @abstract
	 * @method mount
	 */
	mount(controller, view, pageResources, routeOptions) {
		if (this._response.isResponseSent()) {
			return Promise.resolve(this._response.getResponseParams());
		}

		return this._Helper
			.allPromiseHash(pageResources)
			.then(fetchedResources => this._renderPage(
				controller,
				view,
				fetchedResources,
				routeOptions
			));
	}

	/**
	 * @inheritdoc
	 * @method update
	 */
	update(controller, resourcesUpdate) {
		return Promise.reject(new GenericError(
			'The update() is denied on server side.'
		));
	}

	/**
	 * @inheritdoc
	 * @method unmount
	 */
	unmount() {
		// nothing to do
	}

	/**
	 * The javascript code will include a settings the "revival" data for the
	 * application at the client-side.
	 *
	 * @private
	 * @method _getRevivalSettings
	 * @return {string} The javascript code to include into the
	 *         rendered page.
	 */
	_getRevivalSettings() {
		return (
			`
			(function(root) {
				root.$IMA = root.$IMA || {};
				$IMA.Cache = ${this._cache.serialize()};
				$IMA.$Language = "${this._settings.$Language}";
				$IMA.$Env = "${this._settings.$Env}";
				$IMA.$Debug = ${this._settings.$Debug};
				$IMA.$Version = "${this._settings.$Version}";
				$IMA.$App = ${JSON.stringify(this._settings.$App)};
				$IMA.$Protocol = "${this._settings.$Protocol}";
				$IMA.$Host = "${this._settings.$Host}";
				$IMA.$Root = "${this._settings.$Root}";
				$IMA.$LanguagePartPath = "${this._settings.$LanguagePartPath}";
			})(typeof window !== 'undefined' && window !== null ? window : global);

			(function(root) {
				root.$IMA = root.$IMA || {};
				root.$IMA.Runner = root.$IMA.Runner || {
					scripts: [],
					loadedScripts: [],
					load: function(script) {
						this.loadedScripts.push(script.src);
						if (this.scripts.length === this.loadedScripts.length) {
							this.run();
						}
					},
					run: function() {
						root.$IMA.Loader.initAllModules()
							.then(function() {
								return root.$IMA.Loader.import("app/main");
							})
							.catch(function(error) {
								console.error(error);
							});
					}
				};
			})(typeof window !== 'undefined' && window !== null ? window : global);
			`
		);
	}

	/**
	 * Creates a copy of the provided data map object that has the values of
	 * its fields wrapped into Promises.
	 *
	 * The the values that are already Promises will referenced directly
	 * without wrapping then into another Promise.
	 *
	 * @protected
	 * @method _wrapEachKeyToPromise
	 * @param {Object<string, *>=} [dataMap={}] A map of data that should have
	 *        its values wrapped into Promises.
	 * @return {Object<string, Promise>} A copy of the provided data map that
	 *         has all its values wrapped into promises.
	 */
	_wrapEachKeyToPromise(dataMap = {}) {
		let copy = {};

		for (let field of Object.keys(dataMap)) {
			let value = dataMap[field];

			if (value instanceof Promise) {
				copy[field] = value;
			} else {
				copy[field] = Promise.resolve(value);
			}
		}

		return copy;
	}

	/**
	 * Render page after all promises from loaded resources is resolved.
	 *
	 * @private
	 * @method _renderPage
	 * @param {AbstractController} controller
	 * @param {React.Component} view
	 * @param {Object<string, *>} fetchedResources
	 * @param {Object<string, *>} routeOptions
	 * @return {{content: string, status: number}}
	 */
	_renderPage(controller, view, fetchedResources, routeOptions) {
		if (!this._response.isResponseSent()) {
			controller.setState(fetchedResources);
			controller.setMetaParams(fetchedResources);

			this._response
				.status(controller.getHttpStatus())
				.send(this._renderPageContentToString(
					controller,
					view,
					routeOptions
				));
		}

		return this._response.getResponseParams();
	}

	/**
	 * Render page content to a string containing HTML markup.
	 *
	 * @private
	 * @method _renderPageContentToString
	 * @param {AbstractController} controller
	 * @param {React.Component} view
	 * @param {Object<string, *>} routeOptions
	 * @return {string}
	 */
	_renderPageContentToString(controller, view, routeOptions) {
		const ReactDOM = this._ReactDOM;
		let factory = this._factory;
		let props = this._generateViewProps(view, controller.getState());
		let wrappedPageViewElement = factory.wrapView(props);
		let pageMarkup = ReactDOM.renderToString(wrappedPageViewElement);

		let documentView = factory.getDocumentView(
			routeOptions.documentView ||
			this._settings.$Page.$Render.documentView
		);
		let documentViewFactory = factory.reactCreateFactory(documentView);
		let appMarkup = ReactDOM.renderToStaticMarkup(documentViewFactory({
			page: pageMarkup,
			revivalSettings: this._getRevivalSettings(),
			metaManager: controller.getMetaManager(),
			$Utils: factory.getUtils()
		}));

		return '<!doctype html>\n' + appMarkup;
	}
}

ns.ima.page.renderer.ServerPageRenderer = ServerPageRenderer;
