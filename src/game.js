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
		this.gameSettings = { size, shipsSchema };

		this.set( 'gameId' );

		this.set( 'interestedPlayers', 0 );

		/**
		 * @type {'available'|'battle'|'over'}
		 */
		this.set( 'status', 'available' );

		this.set( 'activePlayer', false );

		this.size = size;

		this.player = new Player( PlayerBattlefield.createWithShips( size, shipsSchema ) );

		this.opponent = new Player( new OpponentBattlefield( size, shipsSchema ) );

		this.view = new GameView( this );

		this._server = server;
	}

	get isHost() {
		return this.player.isHost;
	}

	get inviteUrl() {
		return document.URL + '#' + this.gameId;
	}

	accept() {
		if ( this.player.isInGame ) {
			throw new Error( 'You are already in game.' );
		}

		if ( this.status != 'available' ) {
			throw new Error( 'Not available.' );
		}

		this._server.request( 'accept' )
			.then( () => this.player.isInGame = true )
			.catch( ( error ) => alert( error ) );
	}

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

		this._server.request( 'ready', ships )
			.catch( ( error ) => {
				this.player.isReady = false;
				alert( error );
			} );
	}

	shoot( [ x, y ] ) {
		if ( this.status != 'battle' ) {
			throw new Error( 'Invalid game status.' );
		}

		if ( this.activePlayer != this.player.id ) {
			throw new Error( 'Not your turn.' );
		}

		this._server.request( 'shoot', [ x, y ] ).then( ( data ) => {
			this.opponent.battlefield.setField( data.position, data.type );

			if ( data.sunk ) {
				this.opponent.battlefield.shipsCollection.add( new Ship( data.sunk ) );
			}

			this.activePlayer = data.activePlayer;
		} );
	}

	destroy() {
	}

	_attachEvents() {
		this._server.on( 'joined', ( event, data ) => this.interestedPlayers = data.interestedPlayers );
		this._server.on( 'ready', () => this.opponent.isReady = true );
		this._server.on( 'gameOver', () => {
			this.status = 'over';
			alert( 'Game over' );
		} );

		this._server.on( 'shoot', ( evt, data ) => {
			this.player.battlefield.setField( data.position, data.type );
			this.activePlayer = data.activePlayer;
		} );

		this._server.on( 'started', ( evt, data ) => {
			this.activePlayer = data.activePlayer;
			this.status = 'battle';
		} );
	}

	static create( element, size, shipsSchema ) {
		return new Promise( ( resolve ) => {
			const server = new Server();
			const game = new Game( server, size, shipsSchema );

			game.player.isInGame = true;
			game.player.isHost = true;
			game.player.battlefield.random();

			game._attachEvents();

			// @TODO: Rename event name to `opponentAccepted` and property id to `opponentId`.
			server.on( 'accepted', ( evt, data ) => {
				game.opponent.id = data.id;
				game.opponent.isInGame = true;
			} );

			// @TODO: Rename event name to `opponentLeft`.
			server.on( 'left', ( event, data ) => {
				if ( data.opponentId == game.opponent.id ) {
					game.opponent.isReady = false;
					game.opponent.isInGame = false;
					game.status = 'available';
				}

				game.interestedPlayers = data.interestedPlayers;
			} );

			server.create( game.gameSettings ).then( ( data ) => {
				game.gameId = data.gameId;
				game.player.id = data.playerId;
			} );

			element.appendChild( game.view.render() );

			resolve( game );
		} );
	}

	static join( element, gameId ) {
		const server = new Server();

		return server.join( gameId )
			.then( ( data ) => {
				const game = new Game( server, data.gameSettings.size, data.gameSettings.shipsSchema );

				game.player.id = data.playerId;
				game.opponent.id = data.opponentId;
				game.opponent.isReady = data.isOpponentReady;
				game.interestedPlayers = data.interestedPlayers;
				game.player.battlefield.random();

				game._attachEvents();

				server.on( 'left', ( event, data ) => game.interestedPlayers = data.interestedPlayers );

				// When player join the game it doesn't start the game yet.
				// Player need to accept the game to start it.
				// This event is fired when other player has accepted the game first.
				server.on( 'accepted', () => this.status = 'over' );

				element.appendChild( game.view.render() );

				return game;
			} );
	}
}

mix( Game, ObservableMixin );
