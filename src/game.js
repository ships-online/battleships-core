import Server from './server.js';
import Player from './player.js';
import PlayerBattlefield from 'battleships-engine/src/playerbattlefield.js';
import OpponentBattlefield from 'battleships-engine/src/opponentbattlefield.js';
import Ship from 'battleships-engine/src/ship.js';
import GameView from 'battleships-ui-vanilla/src/gameview.js';
import ObservableMixin from '@ckeditor/ckeditor5-utils/src/observablemixin.js';
import mix from '@ckeditor/ckeditor5-utils/src/mix.js';

/**
 * Game interface.
 *
 * @memberOf game
 */
export default class Game {
	/**
	 * @param {Number} [size=10] Size of the battlefield.
	 * @param {Object} [shipsSchema={ 1: 4, 2: 3, 3: 2, 4: 1 }] Defines how many ships of specified length will be in the game.
	 */
	constructor( server, size = 10, shipsSchema = { 1: 4, 2: 3, 3: 2, 4: 1 } ) {
		/**
		 * Game settings.
		 *
		 * @type {Object}
		 */
		this.gameSettings = { size, shipsSchema };

		/**
		 * Game id.
		 *
		 * @observable
		 * @type {String}
		 */
		this.set( 'gameId' );

		/**
		 * Number of interested players - players who have entered the invitation link.
		 *
		 * @observable
		 * @type {Number}
		 */
		this.set( 'interestedPlayersNumber', 0 );

		/**
		 * Game status.
		 *
		 * @observable
		 * @type {'available'|'full'|'battle'|'over'}
		 */
		this.set( 'status', 'available' );

		/**
		 * Id of active player.
		 *
		 * @observable
		 * @type {String}
		 */
		this.set( 'activePlayer', false );

		/**
		 * Stores server error as observable property to reject `#start()` promise when error will be set.
		 *
		 * @private
		 * @observable
		 * @type {String}
		 */
		this.set( '_serverErrorName', null );

		this.player = new Player( PlayerBattlefield.createWithShips( size, shipsSchema ) );

		this.opponent = new Player( new OpponentBattlefield( size, shipsSchema ) );

		/**
		 * Game view.
		 *
		 * @type {GameView}
		 */
		this.view = new GameView( this );

		/**
		 * @private
		 * @type {Server}
		 */
		this._server = server;
	}

	/**
	 * Defines is current game is owned by a host.
	 *
	 * @returns {Boolean}
	 */
	get isHost() {
		return this.player.isHost;
	}

	/**
	 * Gets invite url.
	 *
	 * @returns {String}
	 */
	get inviteUrl() {
		return `${ document.URL }#${ this.gameId }`;
	}

	/**
	 * Starts listen on errors from socket server.
	 *
	 * @returns {Promise<null, error>} Promise that returns error on reject.
	 */
	start() {
		return new Promise( ( resolve, reject ) => {
			this.once( 'change:_serverErrorName', ( evt, name, value ) => reject( value ) );
		} );
	}

	/**
	 * Accepts the game. Player who is interested in the game can accept it and finally join the game.
	 */
	accept() {
		if ( this.player.isInGame ) {
			throw new Error( 'You are already in game.' );
		}

		if ( this.status != 'available' ) {
			throw new Error( 'Not available.' );
		}

		this._server.request( 'accept' )
			.then( () => {
				this.player.isInGame = true;
				this.status = 'full';
			} )
			.catch( ( error ) => this._finishGame( error ) );
	}

	/**
	 * Let know other players in game that you have arranged your ships and you are ready to the battle.
	 */
	ready() {
		if ( this.player.isReady ) {
			throw new Error( 'You are ready already.' );
		}

		if ( !this.player.isInGame ) {
			throw new Error( 'You need to join the game first.' );
		}

		const ships = this.player.battlefield.shipsCollection.toJSON();

		if ( !this.player.battlefield.validateShips( ships ) ) {
			throw new Error( 'Invalid ships configuration.' );
		}

		this.player.isReady = true;

		this._server.request( 'ready', ships ).catch( ( error ) => this._finishGame( error ) );
	}

	/**
	 * Takes a shoot to specified position.
	 *
	 * @param {Array<Number, Number>} position Position on the battlefield.
	 */
	shoot( position ) {
		if ( this.status != 'battle' ) {
			throw new Error( 'Invalid game status.' );
		}

		if ( this.activePlayer != this.player.id ) {
			throw new Error( 'Not your turn.' );
		}

		this._server.request( 'shoot', position ).then( ( data ) => {
			this.opponent.battlefield.setField( data.position, data.type );

			if ( data.sunk ) {
				this.opponent.battlefield.shipsCollection.add( new Ship( data.sunk ) );
			}

			if ( data.winner ) {
				this.status = 'over';
				this.activePlayer = null;
			} else {
				this.activePlayer = data.activePlayer;
			}
		} );
	}

	/**
	 * Lest know other players in the game that you wan't a rematch.
	 */
	requestRematch() {
		this._server.request( 'requestRematch' );
		this.player.isWaitingForRematch = true;
	}

	/**
	 * Render game view to the given element.
	 *
	 * @param {HTMLElement} element
	 * @returns {Game}
	 */
	renderGameToElement( element ) {
		element.appendChild( this.view.render() );

		return this;
	}

	/**
	 * Destroy the game, detach listeners.
	 */
	destroy() {
		this.stopListening();
	}

	_listenToTheServerEvents() {
		// Player enter on the game URL but not accept the game yet.
		this.listenTo( this._server, 'interestedPlayerJoined', ( evt, data ) => {
			this.interestedPlayersNumber = data.interestedPlayersNumber;
		} );

		// Player left the game before battle started.
		this.listenTo( this._server, 'playerLeft', ( event, data ) => {
			if ( data.opponentId == this.opponent.id ) {
				this.opponent.isReady = false;
				this.opponent.isInGame = false;
				this.status = 'available';
			}

			this.interestedPlayersNumber = data.interestedPlayersNumber;
		} );

		// Player is ready to the battle.
		this.listenTo( this._server, 'playerReady', () => {
			this.opponent.isReady = true;
		} );

		// The battle is started.
		this.listenTo( this._server, 'battleStarted', ( evt, data ) => {
			this.activePlayer = data.activePlayer;
			this.status = 'battle';
		} );

		// Player shoot.
		this.listenTo( this._server, 'playerShoot', ( evt, data ) => {
			this.player.battlefield.setField( data.position, data.type );

			if ( data.winner ) {
				this.status = 'over';
				this.activePlayer = null;
			} else {
				this.activePlayer = data.activePlayer;
			}
		} );

		// Game is over, one of the players left the game after the battle was started.
		this.listenTo( this._server, 'gameOver', ( evt, data ) => {
			this._finishGame( data );
		} );

		// Both players requested rematch.
		this.listenTo( this._server, 'rematch', () => {
			this.status = 'full';
			this.opponent.reset();
			this.player.reset();
			this.player.battlefield.random();
		} );
	}

	/**
	 * Finishes the game by rejecting `start()` promise. This happens when server respond error.
	 *
	 * @private
	 * @param {String} errorName Name of the error.
	 */
	_finishGame( errorName ) {
		this._serverErrorName = errorName;
		this.destroy();
	}

	/**
	 * Create the game.
	 *
	 * @static
	 * @param {Number} size Size of the battlefield. How many fields width and height will be battlefield.
	 * @param {Object} shipsSchema Defines how mety ships of specified types will be allowed in the game.
	 * @returns {Promise} Promise that returns game instance when is resolved.
	 */
	static create( size, shipsSchema ) {
		return new Promise( ( resolve ) => {
			const server = new Server();
			const game = new Game( server, size, shipsSchema );

			game.player.isInGame = true;
			game.player.isHost = true;
			game.player.battlefield.random();

			// One of interested players have joined the game.
			game.listenTo( server, 'interestedPlayerAccepted', ( evt, data ) => {
				game.opponent.id = data.id;
				game.opponent.isInGame = true;
				game.status = 'full';
			} );

			game._listenToTheServerEvents();

			server.create( game.gameSettings ).then( ( data ) => {
				game.gameId = data.gameId;
				game.player.id = data.playerId;
			} );

			resolve( game );
		} );
	}

	/**
	 * Join the game of given id.
	 *
	 * @static
	 * @param {String} gameId Id of game you want to join.
	 * @returns {Promise} Promise that returns game instance when is resolved and errorName when is rejected.
	 */
	static join( gameId ) {
		const server = new Server();

		return server.join( gameId )
			.then( ( data ) => {
				const game = new Game( server, data.gameSettings.size, data.gameSettings.shipsSchema );

				game.player.id = data.playerId;
				game.opponent.id = data.opponentId;
				game.opponent.isReady = data.isOpponentReady;
				game.interestedPlayersNumber = data.interestedPlayersNumber;
				game.player.battlefield.random();

				// One of the interested players have joined the game, so the game is over other interested players.
				game.listenTo( server, 'interestedPlayerAccepted', () => this._finishGame( 'started' ) );

				game._listenToTheServerEvents();

				return game;
			} );
	}
}

mix( Game, ObservableMixin );
