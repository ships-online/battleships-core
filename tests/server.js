import Server from '../src/server';
import { ioMock, socketMock } from './_utils/iomock';

describe( 'Server', () => {
	let server, emitSpy;

	beforeEach( () => {
		window.io = ioMock;
		server = new Server();
		emitSpy = sinon.spy( socketMock, 'emit' );
	} );

	afterEach( () => {
		window.io = undefined;
		emitSpy.restore();
	} );

	describe( 'connect()', () => {
		it( 'should return promise and resolve with gameId', done => {
			server.create( { foo: 'bar' } ).then( gameId => {
				expect( emitSpy.calledTwice ).to.true;

				expect( emitSpy.firstCall.args[ 0 ] ).to.equal( 'create' );
				expect( emitSpy.firstCall.args[ 1 ] ).to.deep.equal( { foo: 'bar' } );

				expect( gameId ).to.equal( 'someId' );
				done();
			} );

			socketMock.emit( 'createResponse', { response: 'someId' } );
		} );

		it( 'should return promise and reject with error', done => {
			server.create( { foo: 'bar' } ).catch( error => {
				expect( emitSpy.calledTwice ).to.true;

				expect( emitSpy.firstCall.args[ 0 ] ).to.equal( 'create' );
				expect( emitSpy.firstCall.args[ 1 ] ).to.deep.equal( { foo: 'bar' } );

				expect( error ).to.equal( 'error' );
				done();
			} );

			socketMock.emit( 'createResponse', { error: 'error' } );
		} );

		it( 'should delegate socket events', done => {
			server.create( { foo: 'bar' } ).then( () => {
				const spy = sinon.spy();

				server.on( 'interestedPlayerJoined', spy );
				server.on( 'interestedPlayerAccepted', spy );
				server.on( 'playerLeft', spy );
				server.on( 'playerReady', spy );
				server.on( 'playerShoot', spy );
				server.on( 'playerRequestRematch', spy );
				server.on( 'battleStarted', spy );
				server.on( 'gameOver', spy );
				server.on( 'rematch', spy );

				socketMock.emit( 'interestedPlayerJoined' );
				socketMock.emit( 'interestedPlayerAccepted' );
				socketMock.emit( 'playerLeft' );
				socketMock.emit( 'playerReady' );
				socketMock.emit( 'playerShoot' );
				socketMock.emit( 'playerRequestRematch' );
				socketMock.emit( 'battleStarted' );
				socketMock.emit( 'gameOver' );
				socketMock.emit( 'rematch' );

				expect( spy.callCount ).to.equal( 9 );

				socketMock.emit( 'otherEvent' );

				// Stil 9.
				expect( spy.callCount ).to.equal( 9 );

				done();
			} );

			socketMock.emit( 'createResponse', { response: { foo: 'bar' } } );
		} );
	} );

	describe( 'join()', () => {
		it( 'should return promise and resolve with gameId', done => {
			server.join( 'someId' ).then( settings => {
				expect( emitSpy.calledTwice ).to.true;

				expect( emitSpy.firstCall.args[ 0 ] ).to.equal( 'join' );
				expect( emitSpy.firstCall.args[ 1 ] ).to.deep.equal( 'someId' );

				expect( settings ).to.deep.equal( { foo: 'bar' } );
				done();
			} );

			socketMock.emit( 'joinResponse', { response: { foo: 'bar' } } );
		} );

		it( 'should return promise and reject with error', done => {
			server.join( 'someId' ).catch( error => {
				expect( emitSpy.calledTwice ).to.true;

				expect( emitSpy.firstCall.args[ 0 ] ).to.equal( 'join' );
				expect( emitSpy.firstCall.args[ 1 ] ).to.deep.equal( 'someId' );

				expect( error ).to.deep.equal( 'error' );
				done();
			} );

			socketMock.emit( 'joinResponse', { error: 'error' } );
		} );

		it( 'should delegate socket events', done => {
			server.join( 'someId' ).then( () => {
				const spy = sinon.spy();

				server.on( 'interestedPlayerJoined', spy );
				server.on( 'interestedPlayerAccepted', spy );
				server.on( 'playerLeft', spy );
				server.on( 'playerReady', spy );
				server.on( 'playerShoot', spy );
				server.on( 'playerRequestRematch', spy );
				server.on( 'battleStarted', spy );
				server.on( 'gameOver', spy );
				server.on( 'rematch', spy );

				socketMock.emit( 'interestedPlayerJoined' );
				socketMock.emit( 'interestedPlayerAccepted' );
				socketMock.emit( 'playerLeft' );
				socketMock.emit( 'playerReady' );
				socketMock.emit( 'playerShoot' );
				socketMock.emit( 'playerRequestRematch' );
				socketMock.emit( 'battleStarted' );
				socketMock.emit( 'gameOver' );
				socketMock.emit( 'rematch' );

				expect( spy.callCount ).to.equal( 9 );

				socketMock.emit( 'otherEvent' );

				// Stil 9.
				expect( spy.callCount ).to.equal( 9 );

				done();
			} );

			socketMock.emit( 'joinResponse', { response: { foo: 'bar' } } );
		} );
	} );

	describe( 'request()', () => {
		beforeEach( done => {
			server.create().then( () => {
				emitSpy.reset();
				done();
			} );
			socketMock.emit( 'createResponse', { response: 'someId' } );
		} );

		it( 'should emit event to the server, return promise and resolve with response', done => {
			const requestData = { foo: 'bar' };
			const responseData = { lorem: 'ipsum' };

			server.request( 'doSomething', requestData ).then( response => {
				expect( emitSpy.calledTwice ).to.true;

				expect( emitSpy.firstCall.args[ 0 ] ).to.equal( 'doSomething' );
				expect( emitSpy.firstCall.args[ 1 ] ).to.deep.equal( requestData );

				expect( response ).to.equal( responseData );
				done();
			} );

			socketMock.emit( 'doSomethingResponse', { response: responseData } );
		} );

		it( 'should return promise and resolve when there is no response data', done => {
			const requestData = { foo: 'bar' };

			server.request( 'doSomething', requestData ).then( response => {
				expect( emitSpy.calledTwice ).to.true;

				expect( emitSpy.firstCall.args[ 0 ] ).to.equal( 'doSomething' );
				expect( emitSpy.firstCall.args[ 1 ] ).to.equal( requestData );

				expect( response ).to.undefined;
				done();
			} );

			socketMock.emit( 'doSomethingResponse' );
		} );

		it( 'should emit event to the server, return promise and reject with error', done => {
			const requestData = { foo: 'bar' };
			const error = 'error';

			server.request( 'doSomething', requestData ).catch( error => {
				expect( emitSpy.calledTwice ).to.true;

				expect( emitSpy.firstCall.args[ 0 ] ).to.equal( 'doSomething' );
				expect( emitSpy.firstCall.args[ 1 ] ).to.deep.equal( requestData );

				expect( error ).to.equal( error );
				done();
			} );

			socketMock.emit( 'doSomethingResponse', { error } );
		} );
	} );
} );
