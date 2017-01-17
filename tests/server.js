import Server from 'src/server.js';
import ioMock from 'src/_utils/iomock.js';
import EmitterMixin from 'battleships-utils/src/emittermixin.js';

describe( 'Server', () => {
	let server, gameEmitter, ioInstance;

	beforeEach( () => {
		ioInstance = ioMock();
		window.io = ioMock;

		gameEmitter = Object.create( EmitterMixin );
		server = new Server( gameEmitter );
	} );

	describe( 'create()', () => {
		it( 'should return Promise with game id', ( done ) => {
			server.create().then( ( gameID ) => {
				expect( gameID ).to.equal( 123 );
				done();
			} ).catch( ( err ) => done( err ) );

			ioInstance.emit( 'connect' );
			ioInstance.emit( 'create' );
			ioInstance.emit( 'createResponse', 123 );
		} );
	} );

	describe( 'fire', () => {
		it( 'should emit socket event', ( done ) => {
			server.create().then( () => {
				const spy = sinon.spy( ioInstance, 'emit' );

				server.fire( 'eventName', 'foo', 'bar' );

				expect( spy.calledOnce ).to.true;
				expect( spy.calledWithExactly( 'eventName', 'foo', 'bar' ) ).to.true;

				done();
			} ).catch( ( err ) => done( err ) );

			ioInstance.emit( 'connect' );
			ioInstance.emit( 'create' );
			ioInstance.emit( 'createResponse' );
		} );
	} );
} );
