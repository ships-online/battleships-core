/* eslint-env node */

'use strict';

const config = {
	ROOT_PATH: __dirname
};

const gulp = require( 'gulp' );
const utils = require( 'battleships-dev-tools/lib/utils.js' );
const test = require( 'battleships-dev-tools/lib/tasks/test.js' )( config );
const options = utils.parseArgs( process.argv.slice( 3 ) );

gulp.task( 'test', done => test( options, done ) );
