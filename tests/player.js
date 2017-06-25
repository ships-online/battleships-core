import Player from '../src/player.js';
import Battlefield from 'battleships-engine/src/battlefield.js';

describe( 'Player', () => {
	let player, battlefield;

	beforeEach( () => {
		battlefield = new Battlefield( 10 );
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

		it( 'should bind battlefield#locked to player#isReady', () => {
			expect( battlefield.isLocked ).to.false;

			player.isReady = true;

			expect( battlefield.isLocked ).to.true;

			player.isReady = false;

			expect( battlefield.isLocked ).to.false;
		} );
	} );

	describe( 'reset()', () => {
		it( 'should reset player to default values', () => {
			const spy = sinon.spy( battlefield, 'reset' );

			player.isReady = true;
			player.isWaitingForRematch = true;

			player.reset();

			expect( player.isReady ).to.false;
			expect( player.isWaitingForRematch ).to.false;
			expect( spy.calledOnce ).to.true;
		} );
	} );
} );
