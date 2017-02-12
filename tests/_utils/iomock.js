import { ioMock, socketMock } from 'src/_utils/iomock.js';

describe( '_utils', () => {
	describe( 'IoMock', () => {
		it( 'should return the same socket instance', () => {
			expect( ioMock() ).to.equal( socketMock );
		} );

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
					[expectedEvent]: [ expectedCallback, otherExpectedCallback ]
				};

				socketMock.off( expectedEvent, expectedCallback );

				expect( socketMock._events[ expectedEvent ] ).to.include.members( [ otherExpectedCallback ] );
			} );

			it( 'should do nothing if callback is not attached to event', () => {
				const expectedEvent = 'someEvent';
				const expectedCallback = sinon.spy();
				const fakeCallback = sinon.spy();

				socketMock._events = {
					[expectedEvent]: [ expectedCallback ]
				};

				socketMock.off( expectedEvent, fakeCallback );

				expect( socketMock._events[ expectedEvent ] ).to.include.members( [ expectedCallback ] );
			} );

			it( 'should do nothing if event does not exist', () => {
				const expectedEvent = 'someEvent';
				const expectedCallback = sinon.spy();
				const fakeEvent = 'fakeEvent';

				socketMock._events = {
					[expectedEvent]: [ expectedCallback ]
				};

				socketMock.off( fakeEvent, expectedCallback );

				expect( socketMock._events[ expectedEvent ] ).to.include.members( [ expectedCallback ] );
			} );
		} );

		describe( 'emit()', () => {
			it( 'should fire all callback attached to event', () => {
				const expectedEvent = 'someEvent';
				const expectedCallback = sinon.spy();
				const otherExpectedCallback = sinon.spy();
				const unexpectedCallback = sinon.spy();

				socketMock._events = {
					[expectedEvent]: [ expectedCallback, otherExpectedCallback ],
					'otherEvent': [ unexpectedCallback ]
				};

				socketMock.emit( expectedEvent );

				expect( expectedCallback ).to.be.called;
				expect( otherExpectedCallback ).to.be.called;
				expect( unexpectedCallback ).to.be.not.called;
			} );

			it( 'should pass additional parameters to the callback', () => {
				const expectedEvent = 'someEvent';
				const expectedCallback = sinon.spy();

				socketMock._events = {
					[expectedEvent]: [ expectedCallback ]
				};

				socketMock.emit( expectedEvent, 'param1', 'param2' );

				sinon.assert.calledWithExactly( expectedCallback, 'param1', 'param2' );
			} );
		} );
	} );
} );
