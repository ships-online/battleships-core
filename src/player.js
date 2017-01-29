import ObservableMixin from '@ckeditor/ckeditor5-utils/src/observablemixin.js';
import mix from '@ckeditor/ckeditor5-utils/src/mix.js';

export default class Player {
	constructor( battlefield ) {
		this.id = null;

		this.battlefield = battlefield;

		this.isHost = false;

		this.set( 'isInGame', false );

		this.set( 'isReady', false );

		this.battlefield.bind( 'isLocked' ).to( this, 'isReady' );
	}
}

mix( Player, ObservableMixin );
