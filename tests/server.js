import Server from 'src/server.js';
import { ioMock, socketMock } from 'src/_utils/iomock.js';

describe( 'Server', () => {
	let server, spy;

	beforeEach( () => {
		window.io = ioMock;
		server = new Server();
		spy = sinon.spy( socketMock, 'emit' );
	} );

	afterEach( () => {
		window.io = undefined;
		spy.restore();
	} );

	describe( 'connect()', () => {
		it( 'should return promise and resolve with gameId', ( done ) => {
			server.create( { foo: 'bar' } ).then( ( gameId ) => {
				expect( spy.calledTwice ).to.true;

				expect( spy.firstCall.args[ 0 ] ).to.equal( 'create' );
				expect( spy.firstCall.args[ 1 ] ).to.deep.equal( { foo: 'bar' } );

				expect( gameId ).to.equal( 'someId' );
				done();
			} );

			socketMock.emit( 'createResponse', { response: 'someId' } );
		} );

		it( 'should return promise and reject with error', ( done ) => {
			server.create( { foo: 'bar' } ).catch( ( error ) => {
				expect( spy.calledTwice ).to.true;

				expect( spy.firstCall.args[ 0 ] ).to.equal( 'create' );
				expect( spy.firstCall.args[ 1 ] ).to.deep.equal( { foo: 'bar' } );

				expect( error ).to.equal( 'error' );
				done();
			} );

			socketMock.emit( 'createResponse', { error: 'error' } );
		} );
	} );

	describe( 'join()', () => {
		it( 'should return promise and resolve with gameId', ( done ) => {
			server.join( 'someId' ).then( ( settings ) => {
				expect( spy.calledTwice ).to.true;

				expect( spy.firstCall.args[ 0 ] ).to.equal( 'join' );
				expect( spy.firstCall.args[ 1 ] ).to.deep.equal( 'someId' );

				expect( settings ).to.deep.equal( { foo: 'bar' } );
				done();
			} );

			socketMock.emit( 'joinResponse', { response: { foo: 'bar' } } );
		} );

		it( 'should return promise and reject with error', ( done ) => {
			server.join( 'someId' ).catch( ( error ) => {
				expect( spy.calledTwice ).to.true;

				expect( spy.firstCall.args[ 0 ] ).to.equal( 'join' );
				expect( spy.firstCall.args[ 1 ] ).to.deep.equal( 'someId' );

				expect( error ).to.deep.equal( 'error' );
				done();
			} );

			socketMock.emit( 'joinResponse', { error: 'error' } );
		} );
	} );

	describe( 'request()', () => {
		beforeEach( ( done ) => {
			server.create().then( () => {
				spy.reset();
				done();
			} );
			socketMock.emit( 'createResponse', { response: 'someId' } );
		} );

		it( 'should emit event to the server, return promise and resolve with response', ( done ) => {
			const requestData = { foo: 'bar' };
			const responseData = { lorem: 'ipsum' };

			server.request( 'doSomething', requestData ).then( ( response ) => {
				expect( spy.calledTwice ).to.true;

				expect( spy.firstCall.args[ 0 ] ).to.equal( 'doSomething' );
				expect( spy.firstCall.args[ 1 ] ).to.deep.equal( requestData );

				expect( response ).to.equal( responseData );
				done();
			} );

			socketMock.emit( 'doSomethingResponse', { response: responseData } );
		} );

		it( 'should emit event to the server, return promise and reject with error', ( done ) => {
			const requestData = { foo: 'bar' };
			const error = 'error';

			server.request( 'doSomething', requestData ).catch( ( error ) => {
				expect( spy.calledTwice ).to.true;

				expect( spy.firstCall.args[ 0 ] ).to.equal( 'doSomething' );
				expect( spy.firstCall.args[ 1 ] ).to.deep.equal( requestData );

				expect( error ).to.equal( error );
				done();
			} );

			socketMock.emit( 'doSomethingResponse', { error: error } );
		} );
	} );
} );
