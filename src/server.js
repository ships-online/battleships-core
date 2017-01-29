import EmitterMixin from '@ckeditor/ckeditor5-utils/src/emittermixin.js';
import mix from '@ckeditor/ckeditor5-utils/src/mix.js';

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
	create( gameSettings ) {
		return this._connect( 'create', gameSettings );
	}

	join( gameId ) {
		return this._connect( 'join', gameId );
	}

	_connect( action, data ) {
		return new Promise( ( resolve ) => {
			this._socket = io( window.location.hostname + ':8080' );

			this._socket.on( 'connect', () => {
				this.request( action, data ).then( ( response ) => {
					[ 'joined', 'left', 'accepted', 'gameOver', 'ready', 'started', 'shoot' ].forEach( ( name ) => {
						this._socket.on( name, data => this.fire( name, data ) );
					} );
					resolve( response );
				} );
			} );
		} );
	}

	/**
	 * Emits event to the socket server and wait for immediate response.
	 *
	 * @param {String} eventName
	 * @param {Array<*>} args Additional data.
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
}

mix( Server, EmitterMixin );
