import IoMock from 'src/_utils/iomock.js';

describe( '_utils', () => {
	describe( 'IoMock', () => {
		let ioInstance;

		beforeEach( () => {
			ioInstance = new IoMock();
		} );

		describe( 'on()', () => {
			it( 'should store event with a callback', () => {
				const expectedEvent = 'someEvent';
				const expectedCallback = sinon.spy();

				ioInstance.on( expectedEvent, expectedCallback );

				expect( ioInstance._events[ expectedEvent ] ).to.include( expectedCallback );
			} );

			it( 'should store multiple events with multiple callbacks', () => {
				const expectedEvent = 'someEvent';
				const expectedCallback = sinon.spy();
				const otherExpectedEvent = 'otherEvent';
				const otherExpectedCallback = sinon.spy();

				ioInstance.on( expectedEvent, expectedCallback );
				ioInstance.on( expectedEvent, otherExpectedCallback );
				ioInstance.on( otherExpectedEvent, expectedCallback );
				ioInstance.on( otherExpectedEvent, otherExpectedCallback );

				expect( ioInstance._events[ expectedEvent ] ).to.include.members( [ expectedCallback, otherExpectedCallback ] );
				expect( ioInstance._events[ otherExpectedEvent ] ).to.include.members( [ expectedCallback, otherExpectedCallback ] );
			} );
		} );

		describe( 'off()', () => {
			it( 'should remove callback from event', () => {
				const expectedEvent = 'someEvent';
				const expectedCallback = sinon.spy();
				const otherExpectedCallback = sinon.spy();

				ioInstance._events = {
					[expectedEvent]: [ expectedCallback, otherExpectedCallback ]
				};

				ioInstance.off( expectedEvent, expectedCallback );

				expect( ioInstance._events[ expectedEvent ] ).to.include.members( [ otherExpectedCallback ] );
			} );

			it( 'should do nothing if callback is not attached to event', () => {
				const expectedEvent = 'someEvent';
				const expectedCallback = sinon.spy();
				const fakeCallback = sinon.spy();

				ioInstance._events = {
					[expectedEvent]: [ expectedCallback ]
				};

				ioInstance.off( expectedEvent, fakeCallback );

				expect( ioInstance._events[ expectedEvent ] ).to.include.members( [ expectedCallback ] );
			} );

			it( 'should do nothing if event does not exist', () => {
				const expectedEvent = 'someEvent';
				const expectedCallback = sinon.spy();
				const fakeEvent = 'fakeEvent';

				ioInstance._events = {
					[expectedEvent]: [ expectedCallback ]
				};

				ioInstance.off( fakeEvent, expectedCallback );

				expect( ioInstance._events[ expectedEvent ] ).to.include.members( [ expectedCallback ] );
			} );
		} );

		describe( 'emit()', () => {
			it( 'should fire all callback attached to event', () => {
				const expectedEvent = 'someEvent';
				const expectedCallback = sinon.spy();
				const otherExpectedCallback = sinon.spy();
				const unexpectedCallback = sinon.spy();

				ioInstance._events = {
					[expectedEvent]: [ expectedCallback, otherExpectedCallback ],
					'otherEvent': [ unexpectedCallback ]
				};

				ioInstance.emit( expectedEvent );

				expect( expectedCallback ).to.be.called;
				expect( otherExpectedCallback ).to.be.called;
				expect( unexpectedCallback ).to.be.not.called;
			} );

			it( 'should pass additional parameters to the callback', () => {
				const expectedEvent = 'someEvent';
				const expectedCallback = sinon.spy();

				ioInstance._events = {
					[expectedEvent]: [ expectedCallback ]
				};

				ioInstance.emit( expectedEvent, 'param1', 'param2' );

				sinon.assert.calledWithExactly( expectedCallback, 'param1', 'param2' );
			} );
		} );
	} );
} );
