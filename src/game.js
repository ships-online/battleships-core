import Server from './server.js';
import Player from './player.js';
import PlayerBattlefield from 'battleships-engine/src/playerbattlefield.js';
import OpponentBattlefield from 'battleships-engine/src/opponentbattlefield.js';
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
		this.gameData = { size, shipsConfig };

		this.set( 'gameId' );

		this.set( 'interestedPlayers', 0 );

		this.set( 'isStarted', false );

		this.size = size;

		this.player = new Player( {
			battlefield: new PlayerBattlefield( size, shipsConfig )
		} );

		this.opponent = new Player( {
			battlefield: new OpponentBattlefield( size, shipsConfig )
		} );

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
		if ( this.player.isPresent ) {
			throw new Error( 'Game is full.' );
		}

		this._server.request( 'accept' )
			.then( () => this.player.isPresent = true )
			.catch( ( error ) => alert( error ) );
	}

	ready() {
		if ( this.player.isReady ) {
			throw new Error( 'You are ready already.' );
		}

		if ( !this.player.isPresent ) {
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

	static create( element, size, shipsConfig ) {
		return new Promise( ( resolve ) => {
			const server = new Server();
			const game = new Game( server, size, shipsConfig );

			game.player.battlefield.random();
			game.player.isPresent = true;
			game.player.isHost = true;

			game._attachEvents();
			server.on( 'accepted', () => game.opponent.isPresent = true );
			server.on( 'left', ( event, data ) => {
				if ( game.opponent.isReady || game.opponent.isPresent ) {
					game.opponent.isReady = false;
					game.opponent.isPresent = false;
				}

				game.interestedPlayers = data.interestedPlayers;
			} );

			server.create( game.gameData ).then( ( gameId ) => game.gameId = gameId );
			element.appendChild( game.view.render() );
			resolve( game );
		} );
	}

	static join( element, gameId ) {
		const server = new Server();
		let game;

		return server.join( gameId ).then( ( data ) => {
			if ( data.status == 'started' ) {
				alert( 'Sorry this game has already started.' );
			} else if ( data.status != 'available' ) {
				alert( 'Sorry this game not exist.' );
			} else {
				game = new Game( server, data.gameData.size, data.gameData.shipsConfig );

				game.player.battlefield.random();
				game.player.isPresent = false;
				game.opponent.isReady = data.opponentIsReady;
				game.interestedPlayers = data.interestedPlayers;

				game._attachEvents();
				server.on( 'accepted', () => alert( 'Game is started.' ) );
				server.on( 'left', ( event, data ) => game.interestedPlayers = data.interestedPlayers );

				element.appendChild( game.view.render() );
			}

			return game;
		} );
	}

	_attachEvents(  ) {
		this._server.on( 'joined', ( event, data ) => this.interestedPlayers = data.interestedPlayers );
		this._server.on( 'ready', () => this.opponent.isReady = true );
		this._server.on( 'started', () => this.isStarted = true );
		this._server.on( 'gameOver', () => alert( 'Game is over.' ) );
	}

	destroy() {
	}
}

mix( Game, ObservableMixin );
