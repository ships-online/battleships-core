import EmitterMixin from 'utils/emittermixin.js';
import Server from '../engine/server.js';
import Battlefield from '../engine/battlefield.js';

/**
 * Game interface.
 *
 * @memberOf game
 */
export default class Game {
	/**
	 * @param {Number} [size=10] Size of the battlefield.
	 * @param {Object} [ships={ 1: 4, 2: 3, 3: 2, 4: 1 }] Defines how many ships of specified length will be in the game.
	 */
	constructor( size = 10, ships = { 1: 4, 2: 3, 3: 2, 4: 1 } ) {
		/**
		 * Size of the battlefield.
		 *
		 * @member {Number} game.Game#size
		 */
		this.size = size;

		/**
		 * @private
		 * @type {game.Battlefield}
		 */
		this._playerBattlefield = new Battlefield( size, ships );

		/**
		 * @private
		 * @type {game.Battlefield}
		 */
		this._opponentBattlefield = new Battlefield( size, ships );

		/**
		 * Events emitter instance.
		 *
		 * @protected
		 * @member {utils.EmitterMixin} game.Game#_emitter
		 */
		this._emitter = Object.create( EmitterMixin );

		/**
		 * Instance of a class for web sockets communication.
		 *
		 * @private
		 * @type {game.Server}
		 */
		this._server = new Server( this._emitter );
	}

	/**
	 * Attach callbacks to the game life cycle events.
	 *
	 * @param {String} event The name of the event.
	 * @param {Function} callback The function to be called on event.
	 */
	on( event, callback ) {
		this._emitter.on( event, callback );
	}

	create() {
		return this.server.create().then( ( roomId ) => roomId );
	}

	moveShip( ship, position ) {
		// Update position of moved ship on the battlefield.
		this._playerBattlefield.move( ship, position );

		// Check if ships with collision still have a collision after one ship was moved.
		for ( let collisionShip of this._playerBattlefield.shipsCollection.getWithCollision() ) {
			this._playerBattlefield.checkShipCollision( collisionShip );
		}

		// Check if moved ship has a collision.
		this._playerBattlefield.checkShipCollision( ship );
	}

	/**
	 * Send to the server configuration of player ships placement and inform opponent that player is ready for the battle.
	 */
	ready() {
		if ( this._playerBattlefield.getWithCollision().length ) {
			throw new Error( 'Invalid ships configuration.' );
		}

		this._server.emit( 'playerReady', { shipsDada: this._playerBattlefield.toJSON() } );
	}

	/**
	 * Take a shot.
	 *
	 * @param {Number} x Position of the field in horizontal axis.
	 * @param {Number} y Position of the field in vertical axis.
	 */
	shoot( x, y ) {
		this._server.emit( 'shoot', { x, y } );
	}

	/**
	 * Send information to the opponent that player wants a rematch. If opponent will also request for a rematch then
	 * rematch process.
	 */
	requestRematch() {
		this._server.emit( 'rematch' );
	}

	/**
	 * Close connection with the server and release memory assets.
	 */
	destroy() {}
}

/**
 * Fired when the opponent leave the game or lost connection with the server.
 *
 * @event game#opponentJoin
 */

/**
 * Fired when the opponent set ships on the battlefield and is ready to the battle.
 *
 * @event game#opponentLeave
 */

/**
 * Fired when the opponent set ships on the battlefield and is ready to the battle.
 *
 * @event game#opponentReady
 */

/**
 * Fired when turn is changing from the player to the opponent or from the opponent to the player.
 *
 * @event game#changeTurn
 */

/**
 * Fired when the player win.
 *
 * @event game#win
 */

/**
 * Fired when the player lost.
 *
 * @event game#lost
 */

/**
 * Fired when the opponent wants rematch.
 *
 * @event game#rematchRequest
 */

/**
 * Fired when the game is after reset for rematch.
 *
 * @event game#rematch
 */
