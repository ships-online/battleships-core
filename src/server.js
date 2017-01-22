import EmitterMixin from 'battleships-utils/src/emittermixin.js';
import mix from 'battleships-utils/src/mix.js';

/* global io */

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
	create( gameData ) {
		return new Promise( ( resolve ) => {
			this._socket = io( 'localhost:8080' );

			this._socket.on( 'connect', () => {
				this.request( 'create', gameData ).then( ( gameID ) => {
					this._catchSocketEvents( 'joined', 'left', 'accepted', 'gameOver', 'ready', 'started' );
					resolve( gameID );
				} );
			} );
		} );
	}

	join( gameId ) {
		return new Promise( ( resolve ) => {
			this._socket = io( 'localhost:8080' );

			this._socket.on( 'connect', () => {
				this.request( 'join', gameId ).then( ( data ) => {
					this._catchSocketEvents( 'joined', 'left', 'accepted', 'gameOver', 'ready', 'started' );
					resolve( data );
				} );
			} );
		} );
	}

	/**
	 * Emits event to server and wait for immediate response.
	 *
	 * @param {String} eventName
	 * @param {Object} data Additional data.
	 * @returns {Promise<data>}
	 */
	request( eventName, ...args ) {
		return new Promise( ( resolve, reject ) => {
			this._socket.once( `${ eventName }Response`, ( data ) => {
				data = data || {};

				if ( data.error ) {
					reject( data.error );
				} else {
					resolve( data.response );
				}
			} );
			this._socket.emit( eventName, ...args  );
		} );
	}

	_catchSocketEvents( ...args ) {
		args.forEach( ( eventName ) => {
			this._socket.on( eventName, ( data ) => this.fire( eventName, data ) );
		} );
	}
}

mix( Server, EmitterMixin );
