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
		this.gameData = { size, shipsSchema };

		this.set( 'gameId' );

		this.set( 'interestedPlayers', 0 );

		this.set( 'isStarted', false );

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

	shoot( [ x, y ] ) {
		if ( this.activePlayer != this.player.id ) {
			return;
		}

		this._server.request( 'shoot', [ x, y ] ).then( ( data ) => {
			this.opponent.battlefield.setField( data.position, data.type );

			if ( data.sunk ) {
				this.opponent.battlefield.shipsCollection.add( new Ship( data.sunk ) );
			}

			this.activePlayer = data.activePlayer;
		} );
	}

	_attachEvents() {
		this._server.on( 'joined', ( event, data ) => this.interestedPlayers = data.interestedPlayers );
		this._server.on( 'ready', () => this.opponent.isReady = true );
		this._server.on( 'gameOver', () => alert( 'Game is over.' ) );

		this._server.on( 'shoot', ( evt, data ) => {
			this.player.battlefield.setField( data.position, data.type );
			this.activePlayer = data.activePlayer;
		} );

		this._server.on( 'started', ( evt, data ) => {
			this.activePlayer = data.activePlayer;
			this.isStarted = true;
		} );
	}

	destroy() {
	}

	static create( element, size, shipsSchema ) {
		return new Promise( ( resolve ) => {
			const server = new Server();
			const game = new Game( server, size, shipsSchema );

			game.player.isPresent = true;
			game.player.isHost = true;
			game.player.battlefield.random();

			game._attachEvents();

			server.on( 'accepted', ( evt, data ) => {
				game.opponent.id = data.id;
				game.opponent.isPresent = true;
			} );

			server.on( 'left', ( event, data ) => {
				if ( game.opponent.isReady || game.opponent.isPresent ) {
					game.opponent.isReady = false;
					game.opponent.isPresent = false;
				}

				game.interestedPlayers = data.interestedPlayers;
			} );

			server.create( game.gameData ).then( ( data ) => {
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
				const game = new Game( server, data.gameData.size, data.gameData.shipsSchema );

				game.player.id = data.playerId;
				game.opponent.id = data.opponentId;
				game.opponent.isReady = data.isOpponentReady;
				game.interestedPlayers = data.interestedPlayers;
				game.player.battlefield.random();

				game._attachEvents();
				server.on( 'accepted', () => alert( 'Game is started.' ) );
				server.on( 'left', ( event, data ) => game.interestedPlayers = data.interestedPlayers );

				element.appendChild( game.view.render() );

				return game;
			} )
			.catch( error => alert( error ) );
	}
}

mix( Game, ObservableMixin );
