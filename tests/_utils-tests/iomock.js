import { socketMock } from '../_utils/iomock';

describe( '_utils', () => {
	describe( 'IoMock', () => {
		describe( 'on()', () => {
			it( 'should store event with a callback', () => {
				const expectedEvent = 'someEvent';
				const expectedCallback = sinon.spy();

				socketMock.on( expectedEvent, expectedCallback );

				expect( socketMock._events[ expectedEvent ] ).to.include( expectedCallback );
			} );

			it( 'should store multiple events with multiple callbacks', () => {
				const expectedEvent = 'someEvent';
				const expectedCallback = sinon.spy();
				const otherExpectedEvent = 'otherEvent';
				const otherExpectedCallback = sinon.spy();

				socketMock.on( expectedEvent, expectedCallback );
				socketMock.on( expectedEvent, otherExpectedCallback );
				socketMock.on( otherExpectedEvent, expectedCallback );
				socketMock.on( otherExpectedEvent, otherExpectedCallback );

				expect( socketMock._events[ expectedEvent ] ).to.include.members( [ expectedCallback, otherExpectedCallback ] );
				expect( socketMock._events[ otherExpectedEvent ] ).to.include.members( [ expectedCallback, otherExpectedCallback ] );
			} );
		} );

		describe( 'off()', () => {
			it( 'should remove callback from event', () => {
				const expectedEvent = 'someEvent';
				const expectedCallback = sinon.spy();
				const otherExpectedCallback = sinon.spy();

				socketMock._events = {
					[ expectedEvent ]: [ expectedCallback, otherExpectedCallback ]
				};

				socketMock.off( expectedEvent, expectedCallback );

				expect( socketMock._events[ expectedEvent ] ).to.include.members( [ otherExpectedCallback ] );
			} );

			it( 'should do nothing if callback is not attached to event', () => {
				const expectedEvent = 'someEvent';
				const expectedCallback = sinon.spy();
				const fakeCallback = sinon.spy();

				socketMock._events = {
					[ expectedEvent ]: [ expectedCallback ]
				};

				socketMock.off( expectedEvent, fakeCallback );

				expect( socketMock._events[ expectedEvent ] ).to.include.members( [ expectedCallback ] );
			} );

			it( 'should do nothing if event does not exist', () => {
				const expectedEvent = 'someEvent';
				const expectedCallback = sinon.spy();
				const fakeEvent = 'fakeEvent';

				socketMock._events = {
					[ expectedEvent ]: [ expectedCallback ]
				};

				socketMock.off( fakeEvent, expectedCallback );

				expect( socketMock._events[ expectedEvent ] ).to.include.members( [ expectedCallback ] );
			} );
		} );

		describe( 'emit()', () => {
			it( 'should fire all callback attached to the event', () => {
				const expectedEvent = 'someEvent';
				const expectedCallback = sinon.spy();
				const otherExpectedCallback = sinon.spy();
				const unexpectedCallback = sinon.spy();

				socketMock._events = {
					[ expectedEvent ]: [ expectedCallback, otherExpectedCallback ],
					'otherEvent': [ unexpectedCallback ]
				};

				socketMock.emit( expectedEvent );

				sinon.assert.calledOnce( expectedCallback );
				sinon.assert.calledOnce( otherExpectedCallback );
				sinon.assert.notCalled( unexpectedCallback );
			} );

			it( 'should pass additional parameters to the callback', () => {
				const expectedEvent = 'someEvent';
				const expectedCallback = sinon.spy();

				socketMock._events = {
					[ expectedEvent ]: [ expectedCallback ]
				};

				socketMock.emit( expectedEvent, 'param1', 'param2' );

				sinon.assert.calledWithExactly( expectedCallback, 'param1', 'param2' );
			} );
		} );

		describe( 'broadcast', () => {
			it( 'should return an object with to() method', () => {
				expect( socketMock.broadcast ).to.have.property( 'to' ).to.be.a( 'function' );
			} );
		} );

		describe( 'disconnect()', () => {
			it( 'should be defined', () => {
				expect( socketMock.disconnect ).to.be.a( 'function' );
			} );
		} );
	} );
} );
