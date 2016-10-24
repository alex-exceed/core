import ns from '../namespace';

ns.namespace('ima.http');

/**
 * Utility for transforming URLs according to the configured replacement rules.
 *
 * @class UrlTransformer
 * @namespace ima.http
 * @module ima
 * @submodule ima.http
 */
export default class UrlTransformer {

	static get $dependencies() {
		return [];
	}

	/**
	 * Initializes the URL transformer.
	 *
	 * @method constructor
	 * @constructor
	 */
	constructor() {

		/**
		 * @property _rules
		 * @private
		 * @type {Object<string, string>}
		 */
		this._rules = {};
	}

	/**
	 * Adds the provided replacement rule to the rules used by this URL
	 * transformer.
	 *
	 * @method addRule
	 * @chainable
	 * @param {string} pattern Regexp patter to look for (must be escaped as if
	 *        for use in the {@linkcode Regexp} constructor).
	 * @param {string} replacement The replacement of the matched patter in any
	 *        matched URL.
	 * @return {UrlTransformer} This transformer.
	 */
	addRule(pattern, replacement) {
		this._rules[pattern] = replacement;

		return this;
	}

	/**
	 * Clears all rules.
	 *
	 * @method clear
	 * @chainable
	 * @return {UrlTransformer} This transformer.
	 */
	clear() {
		this._rules = {};

		return this;
	}

	/**
	 * Applies all rules registered with this URL transformer to the provided
	 * URL and returns the result. The rules will be applied in the order they
	 * were registered.
	 *
	 * @method transform
	 * @param {string} str The URL for transformation.
	 * @return {string} Transformed URL.
	 */
	transform(str) {
		let rulesKey = Object.keys(this._rules);

		if (rulesKey.length === 0) {
			return str;
		}

		let reg =  new RegExp(rulesKey.join('|'), 'g');

		return str.replace(reg, (ruleKey) => this._rules[ruleKey]);
	}
}

ns.ima.http.UrlTransformer = UrlTransformer;
