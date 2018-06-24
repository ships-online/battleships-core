import EmitterMixin from '@ckeditor/ckeditor5-utils/src/emittermixin';
import mix from '@ckeditor/ckeditor5-utils/src/mix';

/* global io */

const _socket = Symbol( 'socket' );

/**
 * This events will be delegates to SocketGateway class from the socket instance.
 */
const eventsToDelegate = [
	'interestedPlayerJoined',
	'interestedPlayerAccepted',
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
	constructor() {
		/**
		 * Socket instance.
		 *
		 * @private
		 * @type {socket}
		 */
		this[ _socket ] = null;

		/**
		 * List of pending requests.
		 *
		 * @private
		 * @type {Set}
		 */
		this._pendingRequests = new Set();
	}

	/**
	 * Connects to the socket server and creates new game on the server side.
	 *
	 * @param {String} webSocketUrl Socket url.
	 * @param {Object} settings Game settings.
	 * @param {Number} [settings.size] Size of the battlefield - how many fields long height will be.
	 * @param {Object} [settings.shipsSchema] Schema with ships allowed on the battlefield.
	 * @returns {Promise<String>} Promise that returns gameId when is resolved.
	 */
	create( webSocketUrl, settings ) {
		return this._connect( webSocketUrl, 'create', settings );
	}

	/**
	 * Connects to the socket server and joins to the existing game.
	 *
	 * @param {String} webSocketUrl Socket url.
	 * @param {String} gameId Game id.
	 * @returns {Promise<Object>} Promise that returns settings when is resolved.
	 */
	join( webSocketUrl, gameId ) {
		return this._connect( webSocketUrl, 'join', gameId );
	}

	/**
	 * Connects to the socket server and delegates socket events to this class.
	 *
	 * @private
	 * @param {String} webSocketUrl Socket url.
	 * @param {'create'|'join'} action Type of connection.
	 * @param {Object|String} data Additional connection data.
	 * @returns {Promise}
	 */
	_connect( webSocketUrl, action, data ) {
		return new Promise( ( resolve, reject ) => {
			this[ _socket ] = io( webSocketUrl );

			this.request( action, data )
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
			this[ _socket ].once( `${ eventName }Response`, ( data = {} ) => {
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
	 * Emits event to the socket server and waits for the response.
	 * Works almost the same as #request but it prevents from sending
	 * the same request when previous one has not finished.
	 *
	 * @param {String} eventName
	 * @param {*|Array<*>} args Additional data.
	 * @returns {Promise<response, error>}
	 */
	singleRequest( eventName, ...args ) {
		if ( this._pendingRequests.has( eventName ) ) {
			return Promise.reject( `Waiting for ${ eventName } response.` );
		}

		this._pendingRequests.add( eventName );

		return this.request( eventName, ...args ).then( response => {
			this._pendingRequests.delete( eventName );

			return response;
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
