import Game from 'src/game.js';

describe( 'Game', () => {
	describe( 'constructor()', () => {
		it( 'should create an Game instance with specified properties', () => {
			const game = new Game( 10 );

			expect( game ).to.have.property( 'size' ).to.equal( 10 );
		} );
	} );
} );
