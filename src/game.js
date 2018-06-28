import SocketGateway from './socketgateway';
import Player from './player';
import PlayerBattlefield from 'battleships-engine/src/playerbattlefield';
import OpponentBattlefield from 'battleships-engine/src/opponentbattlefield';
import ShipsCollection from 'battleships-engine/src/shipscollection';
import Ship from 'battleships-engine/src/ship';
import ObservableMixin from '@ckeditor/ckeditor5-utils/src/observablemixin';
import mix from '@ckeditor/ckeditor5-utils/src/mix';

const _connection = Symbol( 'SocketGateway' );

/**
 * @mixes ObservableMixin
 */
export default class Game {
	/**
	 * @param {SocketGateway} socketGateway Socket gateway instance.
	 * @param {Object} [settings={}] Game settings.
	 * @param {Number} [settings.size=10] Size of the battlefield.
	 * @param {Object} [settings.shipsSchema={1:4,2:3,3:2,4:1}] Defines how many ships of specific length will be in the game.
	 */
	constructor( socketGateway, { size = 10, shipsSchema = { 1: 4, 2: 3, 3: 2, 4: 1 } } = {} ) {
		/**
		 * Player.
		 *
		 * @type {Player}
		 */
		this.player = new Player( new PlayerBattlefield( size, shipsSchema ) );

		/**
		 * Opponent.
		 *
		 * @type {Player}
		 */
		this.opponent = new Player( new OpponentBattlefield( size, shipsSchema ) );

		/**
		 * Id of player that has wont the game.
		 * Is defined only when #status is 'over'.
		 *
		 * @type {null|String}
		 */
		this.winnerId = null;

		/**
		 * Game id, used e.g. to create share url.
		 *
		 * @observable
		 * @member {String} #gameId
		 */
		this.set( 'gameId', null );

		/**
		 * Number of interested players - players that entered the invitation link.
		 *
		 * @observable
		 * @member {Number} #guestsNumber
		 */
		this.set( 'guestsNumber', 0 );

		/**
		 * Game status.
		 *
		 * @observable
		 * @member {'available'|'full'|'battle'|'over'} #status
		 */
		this.set( 'status', 'available' );

		/**
		 * Id of active player.
		 *
		 * @observable
		 * @member {null|String} #activePlayerId
		 */
		this.set( 'activePlayerId', null );

		/**
		 * Server instance. Handles Client <-> Server communication.
		 *
		 * @private
		 * @type {SocketGateway}
		 */
		this[ _connection ] = socketGateway;
	}

	/**
	 * Defines if current game is owned by a host.
	 *
	 * @returns {Boolean}
	 */
	get isHost() {
		return this.player.isHost;
	}

	/**
	 * Returns invite url.
	 *
	 * @returns {String}
	 */
	get inviteUrl() {
		const { protocol, host, pathname } = window.location;

		return `${ protocol }//${ host }${ pathname }#${ this.gameId }`;
	}

	/**
	 * Creates the new game and sets the initial states.
	 *
	 * @static
	 * @param {String} webSocketUrl Socket url.
	 * @param {Object} [settings={}] Game settings.
	 * @param {Number} [settings.size=10] Size of the battlefield. How many fields width and height will be battlefield.
	 * @param {Object} [settings.shipsSchema={4:4,3:2,2:3,1:4}] Defines how many ships of specified types will be in the game.
	 * @returns {Promise} Promise that returns game instance on resolve.
	 */
	static create( webSocketUrl, settings ) {
		const socketGateway = new SocketGateway( webSocketUrl );
		const game = new Game( socketGateway, settings );

		game.player.isInGame = true;
		game.player.isHost = true;
		game.player.battlefield.random();

		game._listenToTheServerEvents();

		// One of guests have joined the game.
		game.listenTo( game[ _connection ], 'guestAccepted', ( evt, data ) => {
			game.opponent.id = data.id;
			game.opponent.isInGame = true;
			game.status = 'full';
		} );

		// Connect player to the server.
		socketGateway.connect( game.player.battlefield.settings ).then( gameData => {
			game.gameId = gameData.gameId;
			game.player.id = gameData.playerId;
		} );

		return Promise.resolve( game );
	}

	/**
	 * Joins the game of the given id and sets the initial states.
	 *
	 * @static
	 * @param {String} webSocketUrl Socket url.
	 * @param {String} gameId Id of the game you want to join.
	 * @returns {Promise} Promise that returns game instance when on resolve and errorName on reject.
	 */
	static join( webSocketUrl, gameId ) {
		const socketGateway = new SocketGateway( webSocketUrl );

		return socketGateway.connect( gameId ).then( gameData => {
			const game = new Game( socketGateway, gameData.settings );

			game.guestsNumber = gameData.guestsNumber;

			game.player.id = gameData.playerId;
			game.player.battlefield.random();

			game.opponent.id = gameData.opponentId;
			game.opponent.isHost = true;
			game.opponent.isInGame = true;
			game.opponent.isReady = gameData.isOpponentReady;

			// One of the guests have joined the game, so the game is over for the other guests.
			game.listenTo( socketGateway, 'guestAccepted', () => game._handleServerError( 'started' ) );

			game._listenToTheServerEvents();

			return game;
		} );
	}

	/**
	 * Joins the battle.
	 */
	accept() {
		if ( this.player.isInGame ) {
			throw new Error( 'You are already in game.' );
		}

		if ( this.status != 'available' ) {
			throw new Error( 'Not available.' );
		}

		this[ _connection ].request( 'accept' )
			.then( () => {
				this.player.isInGame = true;
				this.status = 'full';
			} )
			.catch( error => this._handleServerError( error ) );
	}

	/**
	 * Informs the opponent that you have arranged your ships and you are ready for the battle.
	 */
	ready() {
		if ( this.player.isReady ) {
			throw new Error( 'You are ready already.' );
		}

		if ( !this.player.isInGame ) {
			throw new Error( 'You need to join the game first.' );
		}

		const { isCollision, shipsCollection } = this.player.battlefield;

		if ( isCollision ) {
			throw new Error( 'Invalid ships configuration.' );
		}

		this.player.isReady = true;

		this[ _connection ].request( 'ready', shipsCollection.toJSON() )
			.catch( error => this._handleServerError( error ) );
	}

	/**
	 * Shot the field of the given position.
	 *
	 * @param {Array<Number, Number>} position Position on the battlefield.
	 * @returns {Promise} Promise resolved when the request is finished.
	 */
	shoot( position ) {
		if ( this.status != 'battle' ) {
			throw new Error( 'Invalid game status.' );
		}

		if ( this.activePlayerId != this.player.id ) {
			throw new Error( 'Not your turn.' );
		}

		return this[ _connection ].request( 'shoot', position ).then( data => {
			this.opponent.battlefield.markAs( data.position, data.type );

			if ( data.sunk ) {
				this.opponent.battlefield.shipsCollection.add( new Ship( data.sunk ) );
			}

			if ( data.winnerId ) {
				this._setWinner( data.winnerId );
			} else {
				this.activePlayerId = data.activePlayerId;
			}
		} );
	}

	/**
	 * Informs the opponent that you want a rematch.
	 */
	requestRematch() {
		if ( this.status != 'over' ) {
			throw new Error( 'Invalid game status.' );
		}

		this.player.isWaitingForRematch = true;
		this[ _connection ].request( 'requestRematch' );
	}

	/**
	 * Destroys the game, detach listeners.
	 */
	destroy() {
		this.stopListening();
		this[ _connection ].destroy();
	}

	/**
	 * Handles common server events.
	 *
	 * @private
	 */
	_listenToTheServerEvents() {
		// Guest entered the game URL but does not accepted the game yet.
		this.listenTo( this[ _connection ], 'guestJoined', ( evt, data ) => {
			this.guestsNumber = data.guestsNumber;
		} );

		// Opponent left the game before the battle has started.
		this.listenTo( this[ _connection ], 'playerLeft', ( event, data ) => {
			if ( data.opponentId == this.opponent.id ) {
				this.opponent.quit();
				this.status = 'available';
			}

			this.guestsNumber = data.guestsNumber;
		} );

		// Opponent is ready for the battle.
		this.listenTo( this[ _connection ], 'playerReady', () => {
			this.opponent.isReady = true;
		} );

		// The battle has started.
		this.listenTo( this[ _connection ], 'battleStarted', ( evt, data ) => {
			this.activePlayerId = data.activePlayerId;
			this.status = 'battle';
		} );

		// Opponent shot.
		this.listenTo( this[ _connection ], 'playerShoot', ( evt, data ) => {
			this.player.battlefield.markAs( data.position, data.type );

			if ( data.winnerId ) {
				this._setWinner( data.winnerId, data.winnerShips );
			} else {
				this.activePlayerId = data.activePlayerId;
			}
		} );

		// Opponent has requested a rematch.
		this.listenTo( this[ _connection ], 'playerRequestRematch', ( evt, data ) => {
			if ( this.player.id == data.playerId ) {
				this.player.isWaitingForRematch = true;
			} else {
				this.opponent.isWaitingForRematch = true;
			}
		} );

		// Both players requested a rematch.
		this.listenTo( this[ _connection ], 'rematch', () => {
			this.status = 'full';
			this.winnerId = null;

			this.player.battlefield.reset();
			this.player.battlefield.random();
			this.player.reset();

			this.opponent.battlefield.clear();
			this.opponent.reset();
		} );

		// Game is over.
		this.listenTo( this[ _connection ], 'gameOver', ( evt, data ) => this._handleServerError( data ) );
	}

	/**
	 * Finishes the battle, sets the winner and show the opponent ships when you have lost.
	 *
	 * @private
	 * @param {String} id Winner id.
	 * @param {Array.<Object>} [winnerShips]
	 */
	_setWinner( id, winnerShips ) {
		this.status = 'over';
		this.winnerId = id;
		this.activePlayerId = null;

		if ( this.opponent.id === id ) {
			const ships = ShipsCollection.createShipsFromJSON( winnerShips );

			this.opponent.battlefield.shipsCollection.add( ships );

			ships.forEach( ship => ( ship.isCollision = true ) );
		}
	}

	/**
	 * Fires error event when server respond with an error.
	 *
	 * @private
	 * @param {String} errorName Name of the error.
	 */
	_handleServerError( errorName ) {
		this.fire( 'error', errorName );
	}
}

mix( Game, ObservableMixin );
