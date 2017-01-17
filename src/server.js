/**
 * Class for communication between client and server.
 */
export default class Server {
	/**
	 * Creates instance of Server class.
	 *
	 * @param {utils.EmitterMixin} gameEmitter Game emitter.
	 */
	constructor() {
		/**
		 * Web sockets instance.
		 *
		 * @private
		 * @type {io.socket}
		 */
		this._socket = null;
	}

	/**
	 * Creates connection with socket server.
	 *
	 * @returns {Promise<String>} gameID Game id.
	 */
	create( size, shipsConfig ) {
		return new Promise( ( resolve ) => {
			this._socket = window.io( 'localhost:8080' );

			this._socket.on( 'connect', () => {
				this._request( 'create', { size, shipsConfig } ).then( ( gameID ) => resolve( gameID ) );
			} );
		} );
	}

	join( gameId ) {
		return new Promise( ( resolve ) => {
			this._socket = window.io( 'localhost:8080' );

			this._socket.on( 'connect', () => {
				this._request( 'join', gameId ).then( data => resolve( data ) );
			} );
		} );
	}

	/**
	 * Emits event to server and wait for immediate response.
	 *
	 * @private
	 * @param {String} eventName
	 * @param {Object} data Additional data.
	 * @returns {Promise<data>}
	 */
	_request( eventName, ...args ) {
		return new Promise( ( resolve ) => {
			this._socket.once( `${ eventName }Response`, data => resolve( data ) );
			this._socket.emit( eventName, ...args  );
		} );
	}
}
