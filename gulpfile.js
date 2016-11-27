'use strict';

const config = {
	ROOT_PATH: __dirname
};

const path = require( 'path' );
const gulp = require( 'gulp' );

const utils = require( 'battleships-dev-tools/lib/utils.js' );
const linkTasks = require( 'battleships-dev-tools/lib/tasks/relink.js' )( config );
const lintTasks = require( 'battleships-dev-tools/lib/tasks/lint.js' )( config );
const testTasks = require( 'battleships-dev-tools/lib/tasks/test.js' )( config );
const compileTasks = require( 'battleships-dev-tools/lib/tasks/compile.js' )( config );

const options = utils.parseArgs( process.argv.slice( 3 ) );

gulp.task( 'relink', linkTasks.relink );

// Compile engine and utils to esnext format.
gulp.task( 'clean:build:engine', () => utils.del( './lib/engine' ) );
gulp.task( 'clean:build:utils', () => utils.del( './lib/utils' ) );

gulp.task( 'build:engine', [ 'clean:build:engine' ], () => {
	compileTasks.build( 'node_modules/battleships-engine/src', './lib/engine' )
} );
gulp.task( 'build:utils', [ 'clean:build:utils' ], () => {
	compileTasks.build( 'node_modules/battleships-utils/src', './lib/utils' )
} );
gulp.task( 'build', [ 'build:engine', 'build:utils' ], ( done ) => done() );

// JS code sniffer.
const jsFiles = [ path.join( config.ROOT_PATH, '**', '*.js' ) ];

gulp.task( 'lint', () => lintTasks.lint( jsFiles ) );
gulp.task( 'pre-commit', () => lintTasks.lintStaged( jsFiles ) );

gulp.task( 'test', ( done ) => testTasks.test( options, done ) );
