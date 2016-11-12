'use strict';

const config = {
	ROOT_PATH: __dirname
};

const path = require( 'path' );
const gulp = require( 'gulp' );
const del = require( 'del' );
const utils = require( 'battleships-dev-tools/lib/utils.js' )( config );
const lintTasks = require( 'battleships-dev-tools/lib/tasks/lint.js' )( config );
const testTasks = require( 'battleships-dev-tools/lib/tasks/test.js' )( config );
const compileTasks = require( 'battleships-dev-tools/lib/tasks/compile.js' )( config );

const options = utils.parseArgs( process.argv.slice( 3 ) );

// Compile engine to esnext format.
gulp.task( 'clean:engine', () => del( './engine' ) );
gulp.task( 'clean:utils', () => del( './utils' ) );
gulp.task( 'compile:engine', [ 'clean:engine' ], () => compileTasks.compile( '../battleships-engine/src', './engine' ) );
gulp.task( 'compile:utils', [ 'clean:utils' ], () => compileTasks.compile( '../battleships-utils/src', './utils' ) );
gulp.task( 'compile', [ 'compile:engine', 'compile:utils' ], ( done ) => done() );

// JS code sniffer.
const jsFiles = [ path.join( config.ROOT_PATH, '**', '*.js' ) ];

gulp.task( 'lint', () => lintTasks.lint( jsFiles ) );
gulp.task( 'pre-commit', () => lintTasks.lintStaged( jsFiles ) );

gulp.task( 'test', ( done ) => testTasks.test( options, done ) );
