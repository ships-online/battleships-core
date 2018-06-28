import EmitterMixin from '@ckeditor/ckeditor5-utils/src/emittermixin';
import mix from '@ckeditor/ckeditor5-utils/src/mix';

/* global io */

const _socket = Symbol( 'socket' );

/**
 * This events will be delegates to SocketGateway class from the socket instance.
 */
const eventsToDelegate = [
	'guestJoined',
	'guestAccepted',
	'playerLeft',
	'playerReady',
	'playerShoot',
	'playerRequestRematch',
	'battleStarted',
	'gameOver',
	'rematch'
];

/**
 * Class for communication between client and server through web sockets.
 *
 * @mixes EmitterMixin
 */
export default class SocketGateway {
	constructor( webSocketUrl ) {
		/**
		 * Socket instance.
		 *
		 * @private
		 * @type {socket}
		 */
		this[ _socket ] = null;

		/**
		 * Socket url.
		 *
		 * @protected
		 * @type {String}
		 */
		this._webSocketUrl = webSocketUrl;
	}

	/**
	 * Connects to the socket server and creates or joins the game on the server side.
	 *
	 * @param {String|Object} idOrSettings Game id or settings.
	 * @param {Object} [options={}] Additional options.
	 * @param {Boolean} [options.ai=false] Defines whether the connection is created for the human player or for the AI.
	 * @returns {Promise<String>} Promise that returns gameId when is resolved.
	 */
	connect( idOrSettings, options = {} ) {
		return new Promise( ( resolve, reject ) => {
			this[ _socket ] = io( this._webSocketUrl );
			const action = typeof idOrSettings === 'string' ? 'join' : 'create';

			this.request( action, idOrSettings, options )
				.then( response => {
					eventsToDelegate.forEach( name => {
						this[ _socket ].on( name, data => this.fire( name, data ) );
					} );

					resolve( response );
				} )
				.catch( reject );
		} );
	}

	/**
	 * Emits event to the socket server and waits for the response.
	 *
	 * @param {String} eventName
	 * @param {*|Array<*>} args Additional data.
	 * @returns {Promise<response, error>}
	 */
	request( eventName, ...args ) {
		return new Promise( ( resolve, reject ) => {
			this[ _socket ].once( `response-${ eventName }`, ( data = {} ) => {
				if ( data.error ) {
					reject( data.error );
				} else {
					resolve( data.response );
				}
			} );

			this[ _socket ].emit( eventName, ...args );
		} );
	}

	/**
	 * Destroys the connection.
	 */
	destroy() {
		this.stopListening();

		if ( this[ _socket ] ) {
			this[ _socket ].disconnect();
		}
	}
}

mix( SocketGateway, EmitterMixin );
