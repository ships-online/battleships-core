import Game from '../src/game';
import Player from '../src/player';
import Server from '../src/server';
import GameView from 'battleships-ui-vanilla/src/gameview';
import { ioMock, socketMock } from './_utils/iomock';

describe( 'Game', () => {
	let server, game, sandbox;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
		window.io = ioMock;
		server = new Server();
		game = new Game( server, 5, { 1: 2 } );
	} );

	afterEach( () => {
		sandbox.restore();
		game.destroy();
		delete window.io;
	} );

	describe( 'constructor()', () => {
		it( 'should create an Game instance with given data', () => {
			expect( game ).to.have.property( 'settings' ).to.deep.equal( { size: 5, shipsSchema: { 1: 2 } } );
			expect( game ).to.have.property( 'gameId', null );
			expect( game ).to.have.property( 'interestedPlayersNumber', 0 );
			expect( game ).to.have.property( 'status', 'available' );
			expect( game ).to.have.property( 'activePlayer', null );
			expect( game ).to.have.property( 'winner', null );
			expect( game ).to.have.property( 'player' ).to.instanceof( Player );
			expect( game ).to.have.property( 'opponent' ).to.instanceof( Player );
			expect( game ).to.have.property( 'view' ).to.instanceof( GameView );

			expect( game.player.battlefield ).to.have.property( 'size', 5 );
			expect( game.player.battlefield ).to.have.property( 'shipsSchema' ).to.deep.equal( { 1: 2 } );
			expect( game.player.battlefield.shipsCollection ).to.have.property( 'length' ).to.equal( 2 );

			expect( game.opponent.battlefield ).to.have.property( 'size', 5 );
			expect( game.opponent.battlefield ).to.have.property( 'shipsSchema' ).to.deep.equal( { 1: 2 } );
			expect( game.opponent.battlefield.shipsCollection ).to.have.property( 'length' ).to.equal( 0 );
		} );

		it( 'should create an Game instance with default data', () => {
			const schema = { 1: 4, 2: 3, 3: 2, 4: 1 };

			game = new Game( server );

			expect( game ).to.have.property( 'settings' ).to.deep.equal( {
				size: 10,
				shipsSchema: schema
			} );

			expect( game.player.battlefield ).to.have.property( 'size', 10 );
			expect( game.player.battlefield ).to.have.property( 'shipsSchema' ).to.deep.equal( schema );
			expect( game.player.battlefield.shipsCollection ).to.have.property( 'length' ).to.equal( 10 );

			expect( game.opponent.battlefield ).to.have.property( 'size', 10 );
			expect( game.opponent.battlefield ).to.have.property( 'shipsSchema' ).to.deep.equal( schema );
			expect( game.opponent.battlefield.shipsCollection ).to.have.property( 'length' ).to.equal( 0 );
		} );
	} );

	describe( 'isHost', () => {
		it( 'should return information if player is a host', () => {
			game.player.isHost = true;

			expect( game.isHost ).to.true;

			game.player.isHost = false;

			expect( game.isHost ).to.false;
		} );
	} );

	describe( 'inviteUrl', () => {
		it( 'should return url with game id', () => {
			game.gameId = 'someId';

			expect( game.inviteUrl.endsWith( '#someId' ) ).to.true;
		} );
	} );

	describe( 'static create()', () => {
		let game;

		beforeEach( () => {
			return Game.create().then( ( gameInstance ) => {
				game = gameInstance;
			} );
		} );

		it( 'should return promise which returns game instance on resolve', () => {
			expect( game ).instanceof( Game );
		} );

		it( 'should return promise which returns game instance with given data on resolve', () => {
			return Game.create().then( ( game ) => {
				expect( game ).instanceof( Game );
				expect( game.settings ).to.deep.equal( {
					size: 10,
					shipsSchema: { 1: 4, 2: 3, 3: 2, 4: 1 }
				} );
			} );
		} );

		it( 'should set player into the game and randomize player ships', () => {
			expect( game.player.isInGame ).to.true;
			expect( game.player.isHost ).to.true;

			for ( const ship of game.player.battlefield.shipsCollection ) {
				expect( ship.position ).to.not.deep.equal( [ null, null ] );
			}
		} );

		it( 'should set gameId and playerId when game will connect to the socket server', ( done ) => {
			expect( game.gameId ).to.not.ok;
			expect( game.player.id ).to.not.ok;

			socketMock.emit( 'createResponse', { response: {
				gameId: 'gameId',
				playerId: 'playerId'
			} } );

			// Promise is resolved in the next event loop.
			setTimeout( () => {
				expect( game.gameId ).to.equal( 'gameId' );
				expect( game.player.id ).to.equal( 'playerId' );
				done();
			}, 0 );
		} );

		it( 'should set opponent into the game and change game status when opponent accept the game', ( done ) => {
			socketMock.emit( 'createResponse', { response: {
				gameId: 'gameId',
				playerId: 'playerId'
			} } );

			// Promise is resolved in the next event loop.
			setTimeout( () => {
				socketMock.emit( 'interestedPlayerAccepted', {
					id: 'opponentId'
				} );

				expect( game.opponent.id ).to.equal( 'opponentId' );
				expect( game.opponent.isInGame ).to.true;
				expect( game.status ).to.equal( 'full' );
				done();
			}, 0 );
		} );
	} );

	describe( 'static join()', () => {
		it( 'should emit socket event with game id', () => {
			const emitSpy = sandbox.spy( socketMock, 'emit' );

			Game.join( 'gameId' );

			expect( emitSpy.calledOnce ).to.true;
			expect( emitSpy.firstCall.calledWithExactly( 'join', 'gameId' ) ).to.true;
		} );

		it( 'should return promise which returns game instance on resolve', ( done ) => {
			Game.join( 'gameId' )
				.then( ( game ) => {
					expect( game ).to.instanceof( Game );
					expect( game.settings ).to.deep.equal( {
						size: 5,
						shipsSchema: { 3: 3 }
					} );
					expect( game.player.id ).to.equal( 'playerId' );
					expect( game.opponent.id ).to.equal( 'opponentId' );
					expect( game.opponent.isReady ).to.true;
					expect( game.interestedPlayersNumber ).to.equal( 10 );

					for ( const ship of game.player.battlefield.shipsCollection ) {
						expect( ship.position ).to.not.deep.equal( [ null, null ] );
					}

					done();
				} )
				.catch( done );

			setTimeout( () => {
				socketMock.emit( 'joinResponse', {
					response: {
						settings: {
							size: 5,
							shipsSchema: { 3: 3 }
						},
						playerId: 'playerId',
						opponentId: 'opponentId',
						isOpponentReady: true,
						interestedPlayersNumber: 10
					}
				} );
			}, 10 );
		} );

		it( 'should return promise which returns error on reject', ( done ) => {
			Game.join( 'gameId' )
				.catch( ( error ) => {
					expect( error ).to.equal( 'foo-bar' );
					done();
				} );

			setTimeout( () => {
				socketMock.emit( 'joinResponse', {
					error: 'foo-bar'
				} );
			}, 10 );
		} );

		it( 'should over the game when other player accepts the game', ( done ) => {
			Game.join( 'gameId' )
				.then( game => game.start() )
				.catch( ( error ) => {
					expect( error ).to.equal( 'started' );
					done();
				} );

			setTimeout( () => {
				socketMock.emit( 'joinResponse', {
					response: {
						settings: {
							size: 5,
							shipsSchema: { 3: 3 }
						}
					}
				} );

				setTimeout( () => {
					socketMock.emit( 'interestedPlayerAccepted' );
				}, 10 );
			}, 10 );
		} );
	} );

	describe( 'game events', () => {
		let game;

		beforeEach( ( done ) => {
			Game.create().then( ( instance ) => {
				game = instance;

				socketMock.emit( 'createResponse', { response: {
					gameId: 'gameId',
					playerId: 'playerId'
				} } );

				// Promise is resolved in the next event loop.
				setTimeout( done, 0 );
			} );
		} );

		describe( 'interestedPlayerJoined', () => {
			it( 'should update number of interested players', () => {
				socketMock.emit( 'interestedPlayerJoined', {
					interestedPlayersNumber: 10
				} );

				expect( game.interestedPlayersNumber ).to.equal( 10 );
			} );
		} );

		describe( 'playerLeft', () => {
			it( 'should update number of interested players', () => {
				socketMock.emit( 'playerLeft', {
					interestedPlayersNumber: 10,
					opponentId: 'someId'
				} );

				expect( game.interestedPlayersNumber ).to.equal( 10 );
			} );

			it( 'should reset game game status and opponent data when opponent has accepted the game and left', () => {
				game.opponent.id = 'opponentId';
				game.opponent.isReady = true;
				game.opponent.isInGame = true;
				game.status = 'full';

				socketMock.emit( 'playerLeft', {
					interestedPlayersNumber: 10,
					opponentId: 'opponentId'
				} );

				expect( game.opponent.id ).to.null;
				expect( game.opponent.isInGame ).to.false;
				expect( game.opponent.isReady ).to.false;
				expect( game.status ).to.equal( 'available' );
			} );
		} );

		describe( 'playerReady', () => {
			it( 'should mark opponent as ready', () => {
				socketMock.emit( 'playerReady' );

				expect( game.opponent.isReady ).to.true;
			} );
		} );

		describe( 'battleStarted', () => {
			it( 'should set active player and change game status', () => {
				socketMock.emit( 'battleStarted', {
					activePlayer: 'playerId'
				} );

				expect( game.activePlayer ).to.equal( 'playerId' );
				expect( game.status ).to.equal( 'battle' );
			} );
		} );

		describe( 'playerShoot', () => {
			it( 'should mark given field as hit', () => {
				socketMock.emit( 'playerShoot', {
					position: [ 2, 2 ],
					type: 'hit'
				} );

				expect( game.player.battlefield.getField( [ 2, 2 ] ).isHit ).to.true;
			} );

			it( 'should mark given field as missed', () => {
				socketMock.emit( 'playerShoot', {
					position: [ 2, 2 ],
					type: 'missed'
				} );

				expect( game.player.battlefield.getField( [ 2, 2 ] ).isMissed ).to.true;
			} );

			it( 'should set active player', () => {
				socketMock.emit( 'playerShoot', {
					position: [ 2, 2 ],
					type: 'missed',
					activePlayer: 'someId'
				} );

				expect( game.activePlayer ).to.equal( 'someId' );
			} );

			it( 'should over the game when one of the player has won', () => {
				socketMock.emit( 'playerShoot', {
					position: [ 2, 2 ],
					type: 'hit',
					winner: 'someId'
				} );

				expect( game.activePlayer ).to.null;
				expect( game.status ).to.equal( 'over' );
			} );
		} );

		describe( 'playerShoot', () => {
			it( 'should mark given field as hit', () => {
				socketMock.emit( 'playerShoot', {
					position: [ 2, 2 ],
					type: 'hit'
				} );

				expect( game.player.battlefield.getField( [ 2, 2 ] ).isHit ).to.true;
			} );

			it( 'should mark given field as missed', () => {
				socketMock.emit( 'playerShoot', {
					position: [ 2, 2 ],
					type: 'missed'
				} );

				expect( game.player.battlefield.getField( [ 2, 2 ] ).isMissed ).to.true;
			} );

			it( 'should set active player', () => {
				socketMock.emit( 'playerShoot', {
					position: [ 2, 2 ],
					type: 'missed',
					activePlayer: 'someId'
				} );

				expect( game.activePlayer ).to.equal( 'someId' );
			} );

			it( 'should over the game when one of the player has won', () => {
				socketMock.emit( 'playerShoot', {
					position: [ 2, 2 ],
					type: 'hit',
					winner: 'someId'
				} );

				expect( game.activePlayer ).to.null;
				expect( game.status ).to.equal( 'over' );
			} );
		} );

		describe( 'rematch', () => {
			it( 'should change game status, reset both players and randomize player battlefield', () => {
				const playerResetSpy = sandbox.spy( game.player, 'reset' );
				const opponentResetSpy = sandbox.spy( game.opponent, 'reset' );
				const randomSpy = sandbox.spy( game.player.battlefield, 'random' );

				game.winner = 'someId';

				socketMock.emit( 'rematch' );

				expect( playerResetSpy.calledOnce ).to.true;
				expect( opponentResetSpy.calledOnce ).to.true;
				expect( randomSpy.calledOnce ).to.true;
				expect( game.status ).to.equal( 'full' );
				expect( game.winner ).to.equal( null );
			} );
		} );

		describe( 'gameOver', () => {
			it( 'should reject game promise', ( done ) => {
				game.start().catch( ( error ) => {
					expect( error ).to.equal( 'foo-bar' );
					done();
				} );

				setTimeout( () => {
					socketMock.emit( 'gameOver', 'foo-bar' );
				}, 0 );
			} );
		} );
	} );

	describe( 'renderGameToElement()', () => {
		it( 'should render game into given element', () => {
			return Game.create().then( ( game ) => {
				const element = document.createElement( 'div' );

				game.renderGameToElement( element );

				expect( element.childElementCount ).to.equal( 1 );
			} );
		} );
	} );

	describe( 'accept()', () => {
		let game;

		beforeEach( ( done ) => {
			Game.join( 'gameId' ).then( ( instance ) => {
				game = instance;
				done();
			} );

			socketMock.emit( 'joinResponse', {
				response: {
					settings: {}
				}
			} );
		} );

		it( 'should throw an error when player is in game already', () => {
			game.player.isInGame = true;

			expect( () => {
				game.accept();
			} ).to.throw( Error, 'You are already in game.' );

		} );

		it( 'should throw an error when game status is not available', () => {
			game.status = 'full';

			expect( () => {
				game.accept();
			} ).to.throw( Error, 'Not available.' );
		} );

		it( 'should set player in the game and change status to `full`', ( done ) => {
			game.status = 'available';

			game.accept();

			socketMock.emit( 'acceptResponse' );

			setTimeout( () => {
				expect( game.player.isInGame ).to.true;
				expect( game.status ).to.equal( 'full' );
				done();
			}, 0 );
		} );

		it( 'should over the game when server response with error', ( done ) => {
			game.start().catch( ( error ) => {
				expect( error ).to.equal( 'foo-bar' );
				done();
			} );

			game.accept();

			socketMock.emit( 'acceptResponse', {
				error: 'foo-bar'
			} );
		} );
	} );

	describe( 'ready()', () => {
		let game;

		beforeEach( () => {
			return Game.create().then( instance => game = instance );
		} );

		it( 'should throw an error when player is ready', () => {
			game.player.isReady = true;

			expect( () => {
				game.ready();
			} ).to.throw( Error, 'You are ready already.' );
		} );

		it( 'should throw an error when player is not in game', () => {
			game.player.isReady = false;
			game.player.isInGame = false;

			expect( () => {
				game.ready();
			} ).to.throw( Error, 'You need to join the game first.' );
		} );

		it( 'should throw an error when player is not in game', () => {
			game.player.isReady = false;
			game.player.isInGame = false;

			expect( () => {
				game.ready();
			} ).to.throw( Error, 'You need to join the game first.' );
		} );

		it( 'should throw an error when ships configuration is invalid', () => {
			const ships = Array.from( game.player.battlefield.shipsCollection );

			game.player.isReady = false;
			game.player.isInGame = true;

			game.player.battlefield.moveShip( ships[ 0 ], [ 0, 0 ] );
			game.player.battlefield.moveShip( ships[ 1 ], [ 0, 0 ] );

			expect( () => {
				game.ready();
			} ).to.throw( Error, 'Invalid ships configuration.' );
		} );

		it( 'should send serialized ships to the server and mark player as ready', () => {
			const emitSpy = sandbox.spy( socketMock, 'emit' );

			game.player.isReady = false;
			game.player.isInGame = true;

			game.ready();

			expect( game.player.isReady ).to.true;
			expect( emitSpy.firstCall.args[ 0 ] ).to.equal( 'ready' );
			expect( emitSpy.firstCall.args[ 1 ] ).to.deep.equal( game.player.battlefield.shipsCollection.toJSON() );

			emitSpy.restore();
		} );

		it( 'should over the game when server response with error', ( done ) => {
			game.player.isReady = false;
			game.player.isInGame = true;

			game.start().catch( ( error ) => {
				expect( error ).to.equal( 'foo-bar' );
				done();
			} );

			game.ready();

			socketMock.emit( 'readyResponse', { error: 'foo-bar' } );
		} );
	} );

	describe( 'shoot()', () => {
		let game;

		beforeEach( () => {
			return Game.create().then( instance => game = instance );
		} );

		it( 'should throw an error when game status is invalid', () => {
			game.status = 'available';

			expect( () => {
				game.shoot();
			} ).to.throw( Error, 'Invalid game status.' );
		} );

		it( 'should throw an error when this is not player turn', () => {
			game.status = 'battle';
			game.player.id = 'playerId';
			game.activePlayer = 'opponentId';

			expect( () => {
				game.shoot();
			} ).to.throw( Error, 'Not your turn.' );
		} );

		it( 'should sent position to the server', () => {
			const emitSpy = sandbox.spy( socketMock, 'emit' );

			game.status = 'battle';
			game.player.id = 'playerId';
			game.activePlayer = 'playerId';

			game.shoot( [ 1, 1 ] );

			sinon.assert.calledWithExactly( emitSpy, 'shoot', [ 1, 1 ] );
		} );

		it( 'should mark field base on type returned by the server and set activePlayer', ( done ) => {
			game.status = 'battle';
			game.player.id = 'playerId';
			game.activePlayer = 'playerId';

			game.shoot( [ 1, 1 ] );

			socketMock.emit( 'shootResponse', {
				response: {
					position: [ 1, 1 ],
					type: 'missed',
					activePlayer: 'opponentId'
				}
			} );

			setTimeout( () => {
				expect( game.opponent.battlefield.getField( [ 1, 1 ] ).isMissed ).to.true;
				expect( game.activePlayer ).to.equal( 'opponentId' );
				done();
			}, 0 );
		} );

		it( 'should set ship on the battlefield when ship is destroyed', ( done ) => {
			game.status = 'battle';
			game.player.id = 'playerId';
			game.activePlayer = 'playerId';

			game.shoot( [ 1, 1 ] );

			socketMock.emit( 'shootResponse', {
				response: {
					position: [ 1, 1 ],
					type: 'hit',
					sunk: {
						id: '1',
						position: [ 1, 1 ],
						length: 1
					}
				}
			} );

			setTimeout( () => {
				expect( game.opponent.battlefield.getField( [ 1, 1 ] ).getFirstShip().toJSON() ).to.deep.equal( {
					id: '1',
					position: [ 1, 1 ],
					tail: [ 1, 1 ],
					length: 1,
					isRotated: false
				} );
				done();
			}, 0 );
		} );

		it( 'should over the game when player won', ( done ) => {
			game.status = 'battle';
			game.player.id = 'playerId';
			game.activePlayer = 'playerId';

			game.shoot( [ 1, 1 ] );

			socketMock.emit( 'shootResponse', {
				response: {
					position: [ 1, 1 ],
					type: 'hit',
					winner: {
						id: 'playerId'
					}
				}
			} );

			setTimeout( () => {
				expect( game.status ).to.equal( 'over' );
				expect( game.winner ).to.equal( 'playerId' );
				expect( game.activePlayer ).to.null;
				done();
			}, 0 );
		} );
	} );

	describe( 'requestRematch()', () => {
		let game;

		beforeEach( () => {
			return Game.create().then( instance => game = instance );
		} );

		it( 'should throw an error when game status is invalid', () => {
			game.status = 'battle';

			expect( () => {
				game.requestRematch();
			} ).to.throw( Error, 'Invalid game status.' );
		} );

		it( 'should mark player as waiting', () => {
			game.status = 'over';

			game.requestRematch();

			expect( game.player.isWaitingForRematch ).to.true;
		} );
	} );
} );
