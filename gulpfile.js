'use strict';

const config = {
	ROOT_PATH: '.'
};

const gulp = require( 'gulp' );
const lintTasks = require( 'battle-ships-engine/dev/tasks/lint.js' )( config );
const engineCompileTasks = require( 'battle-ships-engine/dev/tasks/compile.js' )( config );

// Compile engine to esnext format.
gulp.task( 'compile:engine', () => engineCompileTasks.compile( './engine', 'cjs' ) );

// JS code sniffer.
gulp.task( 'lint', () => lintTasks.lint( '**/*.js' ) );
gulp.task( 'pre-commit', () => lintTasks.lintStaged( '**/*.js' ) );
