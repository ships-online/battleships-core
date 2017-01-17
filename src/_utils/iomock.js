class IoMock {
	constructor() {
		this._events = {};
	}

	/**
	 * Registers a callback function to be executed when an event is emitted.
	 *
	 * @method utils.EmitterMixin#on
	 * @param {String} event The name of the event.
	 * @param {Function} callback The function to be called on event.
	 */
	on( event, callback ) {
		if ( !Array.isArray( this._events[ event ] ) ) {
			this._events[ event ] = [];
		}

		this._events[ event ].push( callback );
	}

	once( ...args ) {
		this.on( ...args );
	}

	/**
	 * Stops executing the callback on the given event.
	 *
	 * @method utils.EmitterMixin#off
	 * @param {String} event The name of the event.
	 * @param {Function} callback The function to stop being called.
	 */
	off( event, callback ) {
		if ( typeof this._events[ event ] === 'object' ) {
			const index = this._events[ event ].indexOf( callback );

			if ( index > -1 ) {
				this._events[ event ].splice( index, 1 );
			}
		}
	}

	/**
	 * Fires an event, executing all callbacks registered for it.
	 *
	 * @method utils.EmitterMixin#emit
	 * @param {String} event The name of the event.
	 * @param {...*} [args] Additional arguments to be passed to the callbacks.
	 */
	emit( event, ...args ) {
		if ( typeof this._events[ event ] === 'object' ) {
			const callbacks = this._events[ event ].slice();
			const length = callbacks.length;

			for ( let i = 0; i < length; i++ ) {
				callbacks[ i ].call( this, ...args );
			}
		}
	}
}

const ioMockInstance = new IoMock();

export default function () {
	return ioMockInstance;
}
