import ObservableMixin from '@ckeditor/ckeditor5-utils/src/observablemixin.js';
import mix from '@ckeditor/ckeditor5-utils/src/mix.js';

export default class Player {
	constructor( data ) {
		this.battlefield = data.battlefield;

		this.isHost = false;

		this.set( 'isPresent', false );

		this.set( 'isReady', false );

		this.on( 'change:isReady', ( evt, name, value ) => this.battlefield.isLocked = value );
	}
}

mix( Player, ObservableMixin );
