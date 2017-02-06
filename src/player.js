import ObservableMixin from '@ckeditor/ckeditor5-utils/src/observablemixin.js';
import mix from '@ckeditor/ckeditor5-utils/src/mix.js';

export default class Player {
	/**
	 * @param {Battlefield} battlefield Battlefield instance.
	 */
	constructor( battlefield ) {
		/**
		 * Player id.
		 *
		 * @type {String}
		 */
		this.id = null;

		/**
		 * Player battlefield.
		 *
		 * @type {Battlefield}
		 */
		this.battlefield = battlefield;

		/**
		 * Defines if players is a host.
		 *
		 * @type {Boolean}
		 */
		this.isHost = false;

		/**
		 * Defines if player is in game.
		 *
		 * @observable
		 * @type {Boolean}
		 */
		this.set( 'isInGame', false );

		/**
		 * Defines if player is ready.
		 *
		 * @observable
		 * @type {Boolean}
		 */
		this.set( 'isReady', false );

		/**
		 * Defines if player requested rematch and waiting for it.
		 *
		 * @observable
		 * @type {Boolean}
		 */
		this.set( 'isWaitingForRematch', false );

		// Lock battlefield when player is ready (can't rearrange ships).
		this.battlefield.bind( 'isLocked' ).to( this, 'isReady' );
	}

	/**
	 * Reset player data to default values.
	 */
	reset() {
		this.battlefield.reset();
		this.isReady = false;
		this.isWaitingForRematch = false;
	}
}

mix( Player, ObservableMixin );
