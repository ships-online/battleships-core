import SocketGateway from '../src/socketgateway';
import { ioMock, socketMock } from './_utils/iomock';

describe( 'SocketGateway', () => {
	let socketGateway, emitSpy;

	beforeEach( () => {
		window.io = ioMock;
		socketGateway = new SocketGateway();
		emitSpy = sinon.spy( socketMock, 'emit' );
	} );

	afterEach( () => {
		window.io = undefined;
		emitSpy.restore();
	} );

	describe( 'connect()', () => {
		it( 'should return promise and resolve with gameId', done => {
			socketGateway.create( 'url', { foo: 'bar' } ).then( gameId => {
				expect( emitSpy.calledTwice ).to.true;

				expect( emitSpy.firstCall.args[ 0 ] ).to.equal( 'create' );
				expect( emitSpy.firstCall.args[ 1 ] ).to.deep.equal( { foo: 'bar' } );

				expect( gameId ).to.equal( 'someId' );
				done();
			} );

			socketMock.emit( 'createResponse', { response: 'someId' } );
		} );

		it( 'should return promise and reject with error', done => {
			socketGateway.create( 'url', { foo: 'bar' } ).catch( error => {
				expect( emitSpy.calledTwice ).to.true;

				expect( emitSpy.firstCall.args[ 0 ] ).to.equal( 'create' );
				expect( emitSpy.firstCall.args[ 1 ] ).to.deep.equal( { foo: 'bar' } );

				expect( error ).to.equal( 'error' );
				done();
			} );

			socketMock.emit( 'createResponse', { error: 'error' } );
		} );

		it( 'should delegate socket events', done => {
			socketGateway.create( 'url', { foo: 'bar' } ).then( () => {
				const spy = sinon.spy();

				socketGateway.on( 'interestedPlayerJoined', spy );
				socketGateway.on( 'interestedPlayerAccepted', spy );
				socketGateway.on( 'playerLeft', spy );
				socketGateway.on( 'playerReady', spy );
				socketGateway.on( 'playerShoot', spy );
				socketGateway.on( 'playerRequestRematch', spy );
				socketGateway.on( 'battleStarted', spy );
				socketGateway.on( 'gameOver', spy );
				socketGateway.on( 'rematch', spy );

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
			socketGateway.join( 'url', 'someId' ).then( settings => {
				expect( emitSpy.calledTwice ).to.true;

				expect( emitSpy.firstCall.args[ 0 ] ).to.equal( 'join' );
				expect( emitSpy.firstCall.args[ 1 ] ).to.deep.equal( 'someId' );

				expect( settings ).to.deep.equal( { foo: 'bar' } );
				done();
			} );

			socketMock.emit( 'joinResponse', { response: { foo: 'bar' } } );
		} );

		it( 'should return promise and reject with error', done => {
			socketGateway.join( 'url', 'someId' ).catch( error => {
				expect( emitSpy.calledTwice ).to.true;

				expect( emitSpy.firstCall.args[ 0 ] ).to.equal( 'join' );
				expect( emitSpy.firstCall.args[ 1 ] ).to.deep.equal( 'someId' );

				expect( error ).to.deep.equal( 'error' );
				done();
			} );

			socketMock.emit( 'joinResponse', { error: 'error' } );
		} );

		it( 'should delegate socket events', done => {
			socketGateway.join( 'url', 'someId' ).then( () => {
				const spy = sinon.spy();

				socketGateway.on( 'interestedPlayerJoined', spy );
				socketGateway.on( 'interestedPlayerAccepted', spy );
				socketGateway.on( 'playerLeft', spy );
				socketGateway.on( 'playerReady', spy );
				socketGateway.on( 'playerShoot', spy );
				socketGateway.on( 'playerRequestRematch', spy );
				socketGateway.on( 'battleStarted', spy );
				socketGateway.on( 'gameOver', spy );
				socketGateway.on( 'rematch', spy );

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
			socketGateway.create().then( () => {
				emitSpy.reset();
				done();
			} );
			socketMock.emit( 'createResponse', { response: 'someId' } );
		} );

		it( 'should emit event to the socketGateway, return promise and resolve with response', done => {
			const requestData = { foo: 'bar' };
			const responseData = { lorem: 'ipsum' };

			socketGateway.request( 'doSomething', requestData ).then( response => {
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

			socketGateway.request( 'doSomething', requestData ).then( response => {
				expect( emitSpy.calledTwice ).to.true;

				expect( emitSpy.firstCall.args[ 0 ] ).to.equal( 'doSomething' );
				expect( emitSpy.firstCall.args[ 1 ] ).to.equal( requestData );

				expect( response ).to.undefined;
				done();
			} );

			socketMock.emit( 'doSomethingResponse' );
		} );

		it( 'should emit event to the socketGateway, return promise and reject with error', done => {
			const requestData = { foo: 'bar' };
			const error = 'error';

			socketGateway.request( 'doSomething', requestData ).catch( error => {
				expect( emitSpy.calledTwice ).to.true;

				expect( emitSpy.firstCall.args[ 0 ] ).to.equal( 'doSomething' );
				expect( emitSpy.firstCall.args[ 1 ] ).to.deep.equal( requestData );

				expect( error ).to.equal( error );
				done();
			} );

			socketMock.emit( 'doSomethingResponse', { error } );
		} );
	} );

	describe( 'destroy()', () => {
		it( 'should stop listen to events', done => {
			socketGateway.create( 'url', { foo: 'bar' } ).then( () => {
				const spy = sinon.spy( socketGateway, 'stopListening' );

				socketGateway.destroy();

				sinon.assert.calledOnce( spy );

				done();
			} );

			socketMock.emit( 'createResponse', { response: 'someId' } );
		} );

		it( 'should disconnect websocket', done => {
			socketGateway.create( 'url', { foo: 'bar' } ).then( () => {
				const spy = sinon.spy( socketMock, 'disconnect' );

				socketGateway.destroy();

				sinon.assert.calledOnce( spy );

				done();
			} );

			socketMock.emit( 'createResponse', { response: 'someId' } );
		} );
	} );
} );
