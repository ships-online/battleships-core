import Server from './server.js';
import PlayerBattlefield from 'battleships-engine/src/playerbattlefield.js';
import AiBattlefield from 'battleships-engine/src/aibattlefield.js';
import GameView from 'battleships-ui-vanilla/src/gameview.js';
import ObservableMixin from 'battleships-utils/src/observablemixin.js';
import mix from 'battleships-utils/src/mix.js';

/**
 * Game interface.
 *
 * @memberOf game
 */
export default class Game {
	/**
	 * @param {Number} [size=10] Size of the battlefield.
	 * @param {Object} [shipsConfig={ 1: 4, 2: 3, 3: 2, 4: 1 }] Defines how many ships of specified length will be in the game.
	 */
	constructor( server, size = 10, shipsConfig = { 1: 4, 2: 3, 3: 2, 4: 1 } ) {
		/**
		 * Size of the battlefield.
		 *
		 * @member {Number} game.Game#size
		 */
		this.size = size;

		this.set( 'gameId' );

		/**
		 * @type {game.Battlefield}
		 */
		this.playerBattlefield = new PlayerBattlefield( size, shipsConfig );

		/**
		 * @type {game.Battlefield}
		 */
		this.opponentBattlefield = new AiBattlefield( size, shipsConfig );

		this.view = new GameView( this );

		/**
		 * Instance of a class for web sockets communication.
		 *
		 * @private
		 * @type {game.Server}
		 */
		this._server = server;
	}

	/**
	 * Send to the server configuration of player ships placement and inform opponent that player is ready for the battle.
	 */
	ready() {
		if ( this.playerBattlefield.getWithCollision().length ) {
			throw new Error( 'Invalid ships configuration.' );
		}

		this._server.emit( 'playerReady', { shipsDada: this.playerBattlefield.toJSON() } );
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

	static create( element, size, shipsConfig ) {
		return new Promise( ( resolve ) => {
			const server = new Server();
			const game = new Game( server, size, shipsConfig );

			game.playerBattlefield.random();
			element.appendChild( game.view.render() );
			server.create( game.size, game.playerBattlefield.shipsCollection.shipsConfig )
				.then( ( gameId ) => game.gameId = gameId );

			resolve( game );
		} );
	}

	static join( element, gameId ) {
		const server = new Server();
		let game;

		return server.join( gameId ).then( ( response ) => {
			if ( response.status == 'available' ) {
				game = new Game( server, response.gameData.size, response.gameData.shipsConfig );
				game.playerBattlefield.random();
				element.appendChild( game.view.render() );
			} else if ( response.status == 'started' ) {
				alert( 'Sorry this game has already started.' );
			} else {
				alert( 'Sorry this game not exist.' );
			}

			return game;
		} );
	}
}

mix( Game, ObservableMixin );

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
