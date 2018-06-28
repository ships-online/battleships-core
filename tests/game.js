import Game from '../src/game';
import Player from '../src/player';
import Ship from 'battleships-engine/src/ship';
import SocketGateway from '../src/socketgateway';
import { socketMock } from './_utils/iomock';

describe( 'Game', () => {
	let socketGateway, game, sandbox;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
		window.io = () => socketMock;

		socketGateway = new SocketGateway();
		game = new Game( socketGateway, { size: 5, shipsSchema: { 1: 2 } } );
	} );

	afterEach( () => {
		sandbox.restore();
		game.destroy();
		window.io = undefined;
	} );

	describe( 'constructor()', () => {
		it( 'should create an Game instance with given data', () => {
			expect( game ).to.have.property( 'gameId', null );
			expect( game ).to.have.property( 'guestsNumber', 0 );
			expect( game ).to.have.property( 'status', 'available' );
			expect( game ).to.have.property( 'activePlayerId', null );
			expect( game ).to.have.property( 'winnerId', null );
			expect( game ).to.have.property( 'player' ).to.instanceof( Player );
			expect( game ).to.have.property( 'opponent' ).to.instanceof( Player );

			expect( game.player.battlefield ).to.have.property( 'size', 5 );
			expect( game.player.battlefield ).to.have.property( 'shipsSchema' ).to.deep.equal( { 1: 2 } );
			expect( game.player.battlefield.shipsCollection ).to.length( 2 );

			expect( game.opponent.battlefield ).to.have.property( 'size', 5 );
			expect( game.opponent.battlefield ).to.have.property( 'shipsSchema' ).to.deep.equal( { 1: 2 } );
			expect( game.opponent.battlefield.shipsCollection ).to.length( 0 );
		} );

		it( 'should create an Game instance with default data', () => {
			const schema = { 1: 4, 2: 3, 3: 2, 4: 1 };

			game = new Game( socketGateway );

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
			return Game.create( 'url' ).then( gameInstance => ( game = gameInstance ) );
		} );

		afterEach( () => {
			game.destroy();
		} );

		it( 'should return promise that returns game instance with given data', () => {
			return Game.create( 'url', { size: 5, shipsSchema: { 1: 1 } } ).then( game => {
				expect( game ).instanceof( Game );
				expect( game.player.battlefield.settings ).to.deep.equal( {
					size: 5,
					shipsSchema: { 1: 1 }
				} );

				return game.destroy();
			} );
		} );

		it( 'should return promise that returns game instance with default data', () => {
			expect( game ).instanceof( Game );
			expect( game.player.battlefield.settings ).to.deep.equal( {
				size: 10,
				shipsSchema: { 1: 4, 2: 3, 3: 2, 4: 1 }
			} );
		} );

		it( 'should set player into the game as host and randomize player ships', () => {
			expect( game.player.isInGame ).to.true;
			expect( game.player.isHost ).to.true;

			expect( Array.from( game.player.battlefield.shipsCollection, ship => ship.position ) )
				.to.not.include( [ [ null, null ] ] );
		} );

		it( 'should set gameId and playerId when game will connect to the socketGateway', done => {
			expect( game.gameId ).to.not.ok;
			expect( game.player.id ).to.not.ok;

			socketMock.emit( 'response-create', { response: {
				gameId: 'gameId',
				playerId: 'playerId'
			} } );

			// Promise is resolved in the next event loop.
			setTimeout( () => {
				expect( game.gameId ).to.equal( 'gameId' );
				expect( game.player.id ).to.equal( 'playerId' );
				done();
			} );
		} );

		it( 'should set opponent into the game and change game status when opponent accept the game', done => {
			socketMock.emit( 'response-create', { response: {
				gameId: 'gameId',
				playerId: 'playerId'
			} } );

			// Promise is resolved in the next event loop.
			setTimeout( () => {
				socketMock.emit( 'guestAccepted', {
					id: 'opponentId'
				} );

				expect( game.opponent.id ).to.equal( 'opponentId' );
				expect( game.opponent.isInGame ).to.true;
				expect( game.status ).to.equal( 'full' );

				done();
			} );
		} );
	} );

	describe( 'static join()', () => {
		it( 'should return promise which returns game instance on resolve', done => {
			Game.join( 'url', 'gameId' )
				.then( game => {
					expect( game ).to.instanceof( Game );
					expect( game.player.battlefield.settings ).to.deep.equal( {
						size: 5,
						shipsSchema: { 3: 3 }
					} );
					expect( game.player.id ).to.equal( 'playerId' );
					expect( game.opponent.id ).to.equal( 'opponentId' );
					expect( game.opponent.isHost ).to.true;
					expect( game.opponent.isInGame ).to.true;
					expect( game.opponent.isReady ).to.true;
					expect( game.guestsNumber ).to.equal( 10 );

					for ( const ship of game.player.battlefield.shipsCollection ) {
						expect( ship.position ).to.not.deep.equal( [ null, null ] );
					}

					game.destroy();

					done();
				} )
				.catch( done );

			setTimeout( () => {
				socketMock.emit( 'response-join', {
					response: {
						settings: {
							size: 5,
							shipsSchema: { 3: 3 }
						},
						playerId: 'playerId',
						opponentId: 'opponentId',
						isOpponentReady: true,
						guestsNumber: 10
					}
				} );
			}, 10 );
		} );

		it( 'should return promise which returns error on reject', done => {
			Game.join( 'url', 'gameId' )
				.catch( error => {
					expect( error ).to.equal( 'foo-bar' );
					done();
				} );

			socketMock.emit( 'response-join', {
				error: 'foo-bar'
			} );
		} );

		it( 'should fire error event when other player accepts the game', done => {
			Game.join( 'url', 'gameId' ).then( game => {
				game.on( 'error', ( evt, error ) => {
					expect( error ).to.equal( 'started' );
					game.destroy();
					done();
				} );
			} );

			setTimeout( () => {
				socketMock.emit( 'response-join', {
					response: {
						settings: {
							size: 5,
							shipsSchema: { 3: 3 }
						}
					}
				} );

				setTimeout( () => {
					socketMock.emit( 'guestAccepted' );
				}, 5 );
			}, 5 );
		} );
	} );

	describe( 'game events', () => {
		let game;

		beforeEach( done => {
			Game.create().then( instance => {
				game = instance;

				socketMock.emit( 'response-create', { response: {
					gameId: 'gameId',
					playerId: 'playerId'
				} } );

				// Promise is resolved in the next event loop.
				setTimeout( done, 0 );
			} );
		} );

		afterEach( () => {
			game.destroy();
		} );

		describe( 'guestJoined', () => {
			it( 'should update number of interested players', () => {
				socketMock.emit( 'guestJoined', {
					guestsNumber: 10
				} );

				expect( game.guestsNumber ).to.equal( 10 );
			} );
		} );

		describe( 'playerLeft', () => {
			it( 'should update number of interested players', () => {
				socketMock.emit( 'playerLeft', {
					guestsNumber: 10,
					opponentId: 'someId'
				} );

				expect( game.guestsNumber ).to.equal( 10 );
			} );

			it( 'should reset game game status and opponent data when opponent has accepted the game and left', () => {
				game.opponent.id = 'opponentId';
				game.opponent.isReady = true;
				game.opponent.isInGame = true;
				game.status = 'full';

				socketMock.emit( 'playerLeft', {
					guestsNumber: 10,
					opponentId: 'opponentId'
				} );

				expect( game.opponent.id ).to.null;
				expect( game.opponent.isInGame ).to.false;
				expect( game.opponent.isReady ).to.false;
				expect( game.status ).to.equal( 'available' );
			} );
		} );

		describe( 'opponentReady', () => {
			it( 'should mark opponent as ready', () => {
				socketMock.emit( 'opponentReady' );

				expect( game.opponent.isReady ).to.true;
			} );
		} );

		describe( 'battleStarted', () => {
			it( 'should set active player and change game status', () => {
				socketMock.emit( 'battleStarted', {
					activePlayerId: 'playerId'
				} );

				expect( game.activePlayerId ).to.equal( 'playerId' );
				expect( game.status ).to.equal( 'battle' );
			} );
		} );

		describe( 'opponentShoot', () => {
			it( 'should mark given field as hit', () => {
				socketMock.emit( 'opponentShoot', {
					position: [ 2, 2 ],
					type: 'hit'
				} );

				expect( game.player.battlefield.getField( [ 2, 2 ] ).isHit ).to.true;
			} );

			it( 'should mark given field as missed', () => {
				socketMock.emit( 'opponentShoot', {
					position: [ 2, 2 ],
					type: 'missed'
				} );

				expect( game.player.battlefield.getField( [ 2, 2 ] ).isMissed ).to.true;
			} );

			it( 'should set active player', () => {
				socketMock.emit( 'opponentShoot', {
					position: [ 2, 2 ],
					type: 'missed',
					activePlayerId: 'someId'
				} );

				expect( game.activePlayerId ).to.equal( 'someId' );
			} );

			it( 'should over the game when one of the players has won', () => {
				socketMock.emit( 'opponentShoot', {
					position: [ 2, 2 ],
					type: 'hit',
					winnerId: 'someId'
				} );

				expect( game.activePlayerId ).to.null;
				expect( game.status ).to.equal( 'over' );
				expect( game.winnerId ).to.equal( 'someId' );
			} );

			it( 'should display not sunken ships marked as collision in opponent battlefield when player has lost', () => {
				game.opponent.id = 'someId';

				game.opponent.battlefield.shipsCollection.add( new Ship( {
					id: '1',
					length: 1,
					position: [ 0, 0 ]
				} ) );

				socketMock.emit( 'opponentShoot', {
					position: [ 0, 2 ],
					type: 'hit',
					winnerId: 'someId',
					winnerShips: [ {
						id: '2',
						length: 1,
						position: [ 0, 2 ]
					} ]
				} );

				expect( Array.from( game.opponent.battlefield.shipsCollection, ship => ship.id ) ).to.members( [ '1', '2' ] );
				expect( Array.from( game.opponent.battlefield.shipsCollection, ship => ship.isCollision ) ).to.members( [ false, true ] );
			} );
		} );

		describe( 'opponentRequestRematch', () => {
			beforeEach( () => {
				game.player.id = 'someId';
				game.opponent.id = 'otherId';
			} );

			it( 'should set player as waiting for the rematch', () => {
				socketMock.emit( 'opponentRequestRematch', {
					playerId: 'someId'
				} );

				expect( game.player.isWaitingForRematch ).to.true;
			} );

			it( 'should set opponent as waiting for the rematch', () => {
				socketMock.emit( 'opponentRequestRematch', {
					playerId: 'otherId'
				} );

				expect( game.opponent.isWaitingForRematch ).to.true;
			} );
		} );

		describe( 'rematch', () => {
			it( 'should change game status, reset both players, randomize player battlefield and remove opponent ships', () => {
				const playerResetSpy = sandbox.spy( game.player, 'reset' );
				const opponentResetSpy = sandbox.spy( game.opponent, 'reset' );
				const randomSpy = sandbox.spy( game.player.battlefield, 'random' );

				game.opponent.battlefield.shipsCollection.add( new Ship( { id: '1', length: 2 } ) );
				game.winnerId = 'someId';

				socketMock.emit( 'rematch' );

				expect( playerResetSpy.calledOnce ).to.true;
				expect( opponentResetSpy.calledOnce ).to.true;
				expect( randomSpy.calledOnce ).to.true;
				expect( game.opponent.battlefield.shipsCollection ).to.length( 0 );
				expect( game.status ).to.equal( 'full' );
				expect( game.winnerId ).to.equal( null );
			} );
		} );

		describe( 'gameOver', () => {
			it( 'should fire error event', done => {
				game.on( 'error', ( evt, error ) => {
					expect( error ).to.equal( 'foo-bar' );
					done();
				} );

				setTimeout( () => {
					socketMock.emit( 'gameOver', 'foo-bar' );
				} );
			} );
		} );
	} );

	describe( 'accept()', () => {
		let game;

		beforeEach( done => {
			Game.join( 'url', 'gameId' ).then( instance => {
				game = instance;
				done();
			} );

			socketMock.emit( 'response-join', {
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

		it( 'should set player in the game and change status to `full`', done => {
			game.status = 'available';

			game.accept();

			socketMock.emit( 'response-accept' );

			setTimeout( () => {
				expect( game.player.isInGame ).to.true;
				expect( game.status ).to.equal( 'full' );
				done();
			}, 0 );
		} );

		it( 'should over the game when socketGateway response with error', done => {
			game.on( 'error', ( evt, error ) => {
				expect( error ).to.equal( 'foo-bar' );
				done();
			} );

			game.accept();

			socketMock.emit( 'response-accept', {
				error: 'foo-bar'
			} );
		} );
	} );

	describe( 'ready()', () => {
		let game;

		beforeEach( () => {
			return Game.create().then( instance => ( game = instance ) );
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

		it( 'should send serialized ships to the socketGateway and mark player as ready', () => {
			const emitSpy = sandbox.spy( socketMock, 'emit' );

			game.player.isReady = false;
			game.player.isInGame = true;

			game.ready();

			expect( game.player.isReady ).to.true;
			expect( emitSpy.firstCall.args[ 0 ] ).to.equal( 'ready' );
			expect( emitSpy.firstCall.args[ 1 ] ).to.deep.equal( game.player.battlefield.shipsCollection.toJSON() );

			emitSpy.restore();
		} );

		it( 'should over the game when socketGateway response with error', done => {
			game.player.isReady = false;
			game.player.isInGame = true;

			game.on( 'error', ( evt, error ) => {
				expect( error ).to.equal( 'foo-bar' );
				done();
			} );

			game.ready();

			socketMock.emit( 'response-ready', { error: 'foo-bar' } );
		} );
	} );

	describe( 'shoot()', () => {
		let game;

		beforeEach( () => {
			return Game.create().then( instance => ( game = instance ) );
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
			game.activePlayerId = 'opponentId';

			expect( () => {
				game.shoot();
			} ).to.throw( Error, 'Not your turn.' );
		} );

		it( 'should sent position through web socket', () => {
			const emitSpy = sandbox.spy( socketMock, 'emit' );

			game.status = 'battle';
			game.player.id = 'playerId';
			game.activePlayerId = 'playerId';

			game.shoot( [ 1, 1 ] );

			sinon.assert.calledWithExactly( emitSpy, 'shoot', [ 1, 1 ] );
		} );

		it( 'should mark field base on type returned by the web socket and set activePlayerId', done => {
			game.status = 'battle';
			game.player.id = 'playerId';
			game.activePlayerId = 'playerId';

			game.shoot( [ 1, 1 ] );

			socketMock.emit( 'response-shoot', {
				response: {
					position: [ 1, 1 ],
					type: 'missed',
					activePlayerId: 'opponentId'
				}
			} );

			setTimeout( () => {
				expect( game.opponent.battlefield.getField( [ 1, 1 ] ).isMissed ).to.true;
				expect( game.activePlayerId ).to.equal( 'opponentId' );
				done();
			}, 0 );
		} );

		it( 'should set ship on the battlefield when ship is destroyed', done => {
			game.status = 'battle';
			game.player.id = 'playerId';
			game.activePlayerId = 'playerId';

			game.shoot( [ 1, 1 ] );

			socketMock.emit( 'response-shoot', {
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
					length: 1,
					isRotated: false
				} );

				done();
			} );
		} );

		it( 'should over the game when player won', done => {
			game.status = 'battle';
			game.player.id = 'playerId';
			game.activePlayerId = 'playerId';

			game.shoot( [ 1, 1 ] );

			socketMock.emit( 'response-shoot', {
				response: {
					position: [ 1, 1 ],
					type: 'hit',
					winnerId: 'playerId'
				}
			} );

			setTimeout( () => {
				expect( game.status ).to.equal( 'over' );
				expect( game.winnerId ).to.equal( 'playerId' );
				expect( game.activePlayerId ).to.null;
				done();
			}, 0 );
		} );
	} );

	describe( 'requestRematch()', () => {
		let game;

		beforeEach( () => {
			return Game.create().then( instance => ( game = instance ) );
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
