import ObservableMixin from '@ckeditor/ckeditor5-utils/src/observablemixin.js';
import mix from '@ckeditor/ckeditor5-utils/src/mix.js';

export default class Player {
	constructor( battlefield ) {
		this.id = null;

		this.battlefield = battlefield;

		this.isHost = false;

		this.set( 'isPresent', false );

		this.set( 'isActive', false );

		this.set( 'isReady', false );

		this.on( 'change:isReady', ( evt, name, value ) => battlefield.isLocked = value );
	}
}

mix( Player, ObservableMixin );
