import { PropTypes } from 'react';
import ns from '../namespace';
import AbstractPureComponent from './AbstractPureComponent';
import MetaManager from '../meta/MetaManager';

ns.namespace('ima.page');

const PRIVATE = {
	masterElementId: Symbol('masterElementId')
};
if ($Debug) {
	Object.freeze(PRIVATE);
}

/**
 * The base class for document view components. The document view components
 * create the basic markup, i.e. the {@code html} or {@code head} elements,
 * along with an element that will contain the view associated with the current
 * route.
 *
 * Note that the document views are always rendered only at the server-side and
 * cannot be switched at the client-side. Because of this, the document view
 * component must be pure and cannot contain a state.
 *
 * @abstract
 */
export default class AbstractDocumentView extends AbstractPureComponent {

	/**
	 * Returns the ID of the element (the value of the {@code id} attribute)
	 * generated by this component that will contain the rendered page view.
	 *
	 * @abstract
	 * @return {string} The ID of the element generated by this component that
	 *         will contain the rendered page view.
	 */
	static get masterElementId() {
		if (this[PRIVATE.masterElementId] !== undefined) {
			return this[PRIVATE.masterElementId];
		}

		throw new Error(
			'The masterElementId getter is abstract and must be overridden'
		);
	}

	/**
	 * Setter for the ID of the element (the value of the {@code id} attribute)
	 * generated by this component that will contain the rendered page view.
	 *
	 * This setter is used only for compatibility with the public class fields
	 * and can only be used once per component.
	 *
	 * @param {string} masterElementId The ID of the element generated by this
	 *        component that will contain the rendered page view.
	 */
	static set masterElementId(masterElementId) {
		if ($Debug) {
			if (this[PRIVATE.masterElementId] !== undefined) {
				throw new Error(
					'The masterElementId can be set only once and cannot be ' +
					'reconfigured'
				);
			}
		}

		this[PRIVATE.masterElementId] = masterElementId
	}

	/**
	 * Returns the expected types of the props passed to this component.
	 *
	 * The {@code metaManager} is used to generate the {@code meta} tags in the
	 * {@code head} and the content of the {@code title} element. The
	 * {@code page} contains the rendered HTML of the current view. The
	 * {@code revivalSettings} contains a JavaScript snippet that initializes
	 * the configuration of the IMA platform at the client-side.
	 *
	 * @return {{metaManager: *, page: *, revivalSettings: *}} The expected
	 *         types of the props passed to this component.
	 */
	static get propTypes() {
		return {
			metaManager: PropTypes.instanceOf(MetaManager).isRequired,
			page: PropTypes.string.isRequired,
			revivalSettings: PropTypes.string.isRequired
		};
	}
}

ns.ima.page.AbstractDocumentView = AbstractDocumentView;
