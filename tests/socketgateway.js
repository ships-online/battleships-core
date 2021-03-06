import SocketGateway from '../src/socketgateway';
import { socketMock } from './_utils/iomock';

describe( 'SocketGateway', () => {
	let socketGateway, emitSpy;

	beforeEach( () => {
		window.io = () => socketMock;
		socketGateway = new SocketGateway( 'url' );
		emitSpy = sinon.spy( socketMock, 'emit' );
	} );

	afterEach( () => {
		window.io = undefined;
		emitSpy.restore();
	} );

	describe( 'connect()', () => {
		it( 'should return promise and resolve with gameId when setting are provided', done => {
			socketGateway.connect( { foo: 'bar' } ).then( gameId => {
				expect( emitSpy.calledTwice ).to.true;

				expect( emitSpy.firstCall.args[ 0 ] ).to.equal( 'create' );
				expect( emitSpy.firstCall.args[ 1 ] ).to.deep.equal( { foo: 'bar' } );

				expect( gameId ).to.equal( 'someId' );
				done();
			} );

			socketMock.emit( 'response-create', { response: 'someId' } );
		} );

		it( 'should return promise and resolve with gameId when is is provided', done => {
			socketGateway.connect( 'someId' ).then( gameId => {
				expect( emitSpy.calledTwice ).to.true;

				expect( emitSpy.firstCall.args[ 0 ] ).to.equal( 'join' );
				expect( emitSpy.firstCall.args[ 1 ] ).to.deep.equal( 'someId' );

				expect( gameId ).to.equal( 'someId' );
				done();
			} );

			socketMock.emit( 'response-join', { response: 'someId' } );
		} );

		it( 'should return promise and reject with error when settings are provided', done => {
			socketGateway.connect( { foo: 'bar' } ).catch( error => {
				expect( emitSpy.calledTwice ).to.true;

				expect( emitSpy.firstCall.args[ 0 ] ).to.equal( 'create' );
				expect( emitSpy.firstCall.args[ 1 ] ).to.deep.equal( { foo: 'bar' } );

				expect( error ).to.equal( 'error' );
				done();
			} );

			socketMock.emit( 'response-create', { error: 'error' } );
		} );

		it( 'should return promise and reject with error when is is provided', done => {
			socketGateway.connect( 'someId' ).catch( error => {
				expect( emitSpy.calledTwice ).to.true;

				expect( emitSpy.firstCall.args[ 0 ] ).to.equal( 'join' );
				expect( emitSpy.firstCall.args[ 1 ] ).to.deep.equal( 'someId' );

				expect( error ).to.equal( 'error' );
				done();
			} );

			socketMock.emit( 'response-join', { error: 'error' } );
		} );

		it( 'should delegate socket events', done => {
			socketGateway.connect( { foo: 'bar' } ).then( () => {
				const spy = sinon.spy();

				socketGateway.on( 'guestJoined', spy );
				socketGateway.on( 'guestAccepted', spy );
				socketGateway.on( 'playerLeft', spy );
				socketGateway.on( 'opponentReady', spy );
				socketGateway.on( 'opponentShot', spy );
				socketGateway.on( 'opponentRequestRematch', spy );
				socketGateway.on( 'battleStarted', spy );
				socketGateway.on( 'gameOver', spy );
				socketGateway.on( 'rematch', spy );

				socketMock.emit( 'guestJoined' );
				socketMock.emit( 'guestAccepted' );
				socketMock.emit( 'playerLeft' );
				socketMock.emit( 'opponentReady' );
				socketMock.emit( 'opponentShot' );
				socketMock.emit( 'opponentRequestRematch' );
				socketMock.emit( 'battleStarted' );
				socketMock.emit( 'gameOver' );
				socketMock.emit( 'rematch' );

				expect( spy.callCount ).to.equal( 9 );

				socketMock.emit( 'otherEvent' );

				// Stil 9.
				expect( spy.callCount ).to.equal( 9 );

				done();
			} );

			socketMock.emit( 'response-create', { response: { foo: 'bar' } } );
		} );
	} );

	describe( 'request()', () => {
		beforeEach( done => {
			socketGateway.connect().then( () => {
				emitSpy.reset();
				done();
			} );
			socketMock.emit( 'response-create', { response: 'someId' } );
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

			socketMock.emit( 'response-doSomething', { response: responseData } );
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

			socketMock.emit( 'response-doSomething' );
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

			socketMock.emit( 'response-doSomething', { error } );
		} );
	} );

	describe( 'destroy()', () => {
		it( 'should stop listen to events', done => {
			socketGateway.connect( { foo: 'bar' } ).then( () => {
				const spy = sinon.spy( socketGateway, 'stopListening' );

				socketGateway.destroy();

				sinon.assert.calledOnce( spy );

				done();
			} );

			socketMock.emit( 'response-create', { response: 'someId' } );
		} );

		it( 'should disconnect websocket', done => {
			socketGateway.connect( { foo: 'bar' } ).then( () => {
				const spy = sinon.spy( socketMock, 'disconnect' );

				socketGateway.destroy();

				sinon.assert.calledOnce( spy );

				done();
			} );

			socketMock.emit( 'response-create', { response: 'someId' } );
		} );

		it( 'should destroy before making connection without an error', () => {
			expect( () => {
				socketGateway.destroy();
			} ).to.not.throw();
		} );
	} );
} );
