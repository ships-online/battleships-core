import Player from '../src/player';
import Battlefield from 'battleships-engine/src/battlefield';

describe( 'Player', () => {
	let player, battlefield;

	beforeEach( () => {
		battlefield = new Battlefield();
		player = new Player( battlefield );
	} );

	describe( 'constructor()', () => {
		it( 'should create class instance', () => {
			expect( player ).to.have.property( 'id', null );
			expect( player ).to.have.property( 'battlefield', battlefield );
			expect( player ).to.have.property( 'isHost', false );
			expect( player ).to.have.property( 'isInGame', false );
			expect( player ).to.have.property( 'isReady', false );
			expect( player ).to.have.property( 'isWaitingForRematch', false );
		} );

		it( 'should bind battlefield#isLocked to player#isReady', () => {
			expect( battlefield.isLocked ).to.false;

			player.isReady = true;

			expect( battlefield.isLocked ).to.true;

			player.isReady = false;

			expect( battlefield.isLocked ).to.false;
		} );
	} );

	describe( 'reset()', () => {
		it( 'should reset player to default values but keep player in the game', () => {
			player.isReady = true;
			player.isWaitingForRematch = true;
			player.isInGame = true;

			player.reset();

			expect( player.isReady ).to.false;
			expect( player.isWaitingForRematch ).to.false;
			expect( player.isInGame ).to.true;
		} );
	} );

	describe( 'quit()', () => {
		it( 'should reset player to default values but and quit from the game', () => {
			player.isReady = true;
			player.isWaitingForRematch = true;
			player.isInGame = true;
			player.id = 'some-id';

			player.quit();

			expect( player.isReady ).to.false;
			expect( player.isWaitingForRematch ).to.false;
			expect( player.isInGame ).to.false;
			expect( player.id ).to.null;
		} );
	} );

	describe( 'destroy()', () => {
		it( 'should destroy battlefield', () => {
			const spy = sinon.spy( battlefield, 'destroy' );

			player.destroy();

			sinon.assert.calledOnce( spy );
		} );
	} );
} );
