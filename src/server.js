import EmitterMixin from '@ckeditor/ckeditor5-utils/src/emittermixin.js';
import mix from '@ckeditor/ckeditor5-utils/src/mix.js';

/* global io, SOCKET_URL */

const _socket = Symbol( 'socket' );

/**
 * This events will be delegates to server class from the socket instance.
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
 * Class for communication between client and server.
 *
 * @mixes EmitterMixin
 */
export default class Server {
	constructor() {
		/**
		 * Socket instance.
		 *
		 * @private
		 * @type {socket}
		 */
		this[ _socket ] = null;
	}

	/**
	 * Connects to the socket server and creates new game on the server side.
	 *
	 * @param {Object} settings Game settings.
	 * @param {Number} [settings.size] Size of the battlefield - how many fields long height will be.
	 * @param {Object} [settings.shipsSchema] Schema with ships allowed on the battlefield.
	 * @returns {Promise<String>} Promise that returns gameId when is resolved.
	 */
	create( settings ) {
		return this._connect( 'create', settings );
	}

	/**
	 * Connects to the socket server and joins to the existing game.
	 *
	 * @param {String} gameId Game id.
	 * @returns {Promise<Object>} Promise that returns settings when is resolved.
	 */
	join( gameId ) {
		return this._connect( 'join', gameId );
	}

	/**
	 * Connects to the socket server and delegates socket events to this class.
	 *
	 * @private
	 * @param {'create'|'join'} action Type of connection.
	 * @param {Object|String} data Additional connection data.
	 * @returns {Promise}
	 */
	_connect( action, data ) {
		return new Promise( ( resolve, reject ) => {
			this[ _socket ] = io( SOCKET_URL );

			this.request( action, data )
				.then( ( response ) => {
					eventsToDelegate.forEach( ( name ) => {
						this[ _socket ].on( name, data => this.fire( name, data ) );
					} );

					resolve( response );
				} )
				.catch( reject );
		} );
	}

	/**
	 * Emits event to the socket server and waits for immediate response.
	 *
	 * @param {String} eventName
	 * @param {Array<*>} args Additional data.
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

			this[ _socket ].emit( eventName, ...args  );
		} );
	}

	destroy() {
		this.stopListening();
		this[ _socket ].disconnect();
	}
}

mix( Server, EmitterMixin );
