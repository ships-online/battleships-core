import ObservableMixin from '@ckeditor/ckeditor5-utils/src/observablemixin';
import mix from '@ckeditor/ckeditor5-utils/src/mix';

/**
 * Class for representing player and opponent.
 *
 * @mixes ObservableMixin
 */
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
		 * Defines if player is a host.
		 *
		 * @type {Boolean}
		 */
		this.isHost = false;

		/**
		 * Defines if player is in game (player can enter on game page but not join to the game).
		 *
		 * @observable
		 * @member {Boolean} #isInGame
		 */
		this.set( 'isInGame', false );

		/**
		 * Defines if player is ready (player has arranged his battlefield and is ready for the battle).
		 *
		 * @observable
		 * @member {Boolean} #isReady
		 */
		this.set( 'isReady', false );

		/**
		 * Defines if player requested rematch and is waiting for it.
		 *
		 * @observable
		 * @member {Boolean} #isWaitingForRematch
		 */
		this.set( 'isWaitingForRematch', false );

		// Lock battlefield when player is ready (can't rearrange ships).
		this.battlefield.bind( 'isLocked' ).to( this, 'isReady' );
	}

	/**
	 * Resets player data to default values.
	 */
	reset() {
		this.battlefield.reset();
		this.isReady = false;
		this.isWaitingForRematch = false;
	}
}

mix( Player, ObservableMixin );
