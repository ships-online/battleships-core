'use strict';

const config = {
	ROOT_PATH: __dirname
};

const path = require( 'path' );
const gulp = require( 'gulp' );
const del = require( 'del' );
const utils = require( 'battleships-engine/dev/utils.js' )( config );
const lintTasks = require( 'battleships-engine/dev/tasks/lint.js' )( config );
const testTasks = require( 'battleships-engine/dev/tasks/test.js' )( config );
const engineCompileTasks = require( 'battleships-engine/dev/tasks/compile.js' )( config );

const options = utils.parseArgs( process.argv.slice( 3 ) );

// Compile engine to esnext format.
gulp.task( 'clean:compile', () => del( './engine' ) );
gulp.task( 'compile:engine', [ 'clean:compile' ], () => {
	engineCompileTasks.compile( '../battle-ships-engine/src', './engine' )
} );

// JS code sniffer.
const jsFiles = [ path.join( config.ROOT_PATH, '**', '*.js' ) ];

gulp.task( 'lint', () => lintTasks.lint( jsFiles ) );
gulp.task( 'pre-commit', () => lintTasks.lintStaged( jsFiles ) );

gulp.task( 'test', ( done ) => testTasks.test( options, done ) );
