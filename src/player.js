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
		 * Defines if player is in game (player that enter the invite page is a guest until does not accept the game).
		 *
		 * @observable
		 * @member {Boolean} #isInGame
		 */
		this.set( 'isInGame', false );

		/**
		 * Defines if player is ready (player has arranged his ships and is ready for the battle).
		 *
		 * @observable
		 * @member {Boolean} #isReady
		 */
		this.set( 'isReady', false );

		/**
		 * Defines if player requested a rematch.
		 *
		 * @observable
		 * @member {Boolean} #isWaitingForRematch
		 */
		this.set( 'isWaitingForRematch', false );

		// Lock the battlefield when player is ready (can't rearrange ships).
		this.battlefield.bind( 'isLocked' ).to( this, 'isReady' );
	}

	/**
	 * Resets player data to the default values but keeps player in the game.
	 */
	reset() {
		this.isReady = false;
		this.isWaitingForRematch = false;
	}

	/**
	 * Resets player data after player quit the game.
	 */
	quit() {
		this.reset();
		this.id = null;
		this.isInGame = false;
	}

	/**
	 * Destroys the player.
	 */
	destroy() {
		this.stopListening();
		this.battlefield.destroy();
	}
}

mix( Player, ObservableMixin );
