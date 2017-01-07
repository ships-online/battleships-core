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

// Build game dependency.
gulp.task( 'build:engine', () => compileTasks.buildDependency( 'engine' ) );
gulp.task( 'build:utils', () => compileTasks.buildDependency( 'utils' ) );
gulp.task( 'build:ui', () => compileTasks.buildDependency( 'ui-vanilla' ) );
gulp.task( 'build', [ 'build:engine', 'build:utils', 'build:ui' ] );

// JS code sniffer.
const jsFiles = [ path.join( config.ROOT_PATH, '**', '*.js' ) ];

gulp.task( 'lint', () => lintTasks.lint( jsFiles ) );
gulp.task( 'pre-commit', () => lintTasks.lintStaged( jsFiles ) );

gulp.task( 'test', ( done ) => testTasks.test( options, done ) );
