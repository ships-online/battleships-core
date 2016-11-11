import Game from '../src/game.js';

describe( 'Game:', () => {
	describe( 'constructor()', () => {
		it( 'should create an instance of Game with specified properties', () => {
			let game = new Game( 10 );

			expect( game ).to.have.property( 'size' ).to.equal( 10 );
		} );
	} );
} );
