import EmitterMixin from '@ckeditor/ckeditor5-utils/src/emittermixin.js';
import mix from '@ckeditor/ckeditor5-utils/src/mix.js';

/* global io */

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
		 * Socket.io socket.
		 *
		 * @private
		 * @type {socket}
		 */
		this._socket = null;
	}

	/**
	 * @param {Object} settings Game settings.
	 * @param {Number} [settings.size] Size of the battlefield - how many fields long height will be.
	 * @param {Object} [settings.shipsSchema] Schema with ships allowed on the battlefield.
	 * @returns {Promise<String>} Promise that returns gameId when is resolved.
	 */
	create( settings ) {
		return this._connect( 'create', settings );
	}

	/**
	 * @param {String} gameId Game id.
	 * @returns {Promise<Object>} Promise that returns settings when is resolved.
	 */
	join( gameId ) {
		return this._connect( 'join', gameId );
	}

	/**
	 * Creates connection with the socket server and delegates socket events to this class.
	 *
	 * @private
	 * @param {'create'|'join'} action Type of connection.
	 * @param {Object|String} data Additional connection data.
	 * @returns {Promise}
	 */
	_connect( action, data ) {
		return new Promise( ( resolve, reject ) => {
			this._socket = io( window.location.hostname + ':8080' );

			this.request( action, data )
				.then( ( response ) => {
					eventsToDelegate.forEach( ( name ) => {
						this._socket.on( name, data => this.fire( name, data ) );
					} );

					resolve( response );
				} )
				.catch( reject );
		} );
	}

	/**
	 * Emits event to the socket server and wait for immediate response.
	 *
	 * @param {String} eventName
	 * @param {Array<*>} args Additional data.
	 * @returns {Promise<response, error>}
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
