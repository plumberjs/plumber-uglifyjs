plumber-uglifyjs [![Build Status](https://travis-ci.org/plumberjs/plumber-uglifyjs.png?branch=master)](https://travis-ci.org/plumberjs/plumber-uglifyjs)
================

JavaScript minimisation operation for [Plumber](https://github.com/plumberjs/plumber) pipelines, using [UglifyJS2](https://github.com/mishoo/UglifyJS2).

## Example

    var uglifyjs = require('plumber-uglifyjs');

    module.exports = function(pipelines) {

        pipelines['css'] = [
            glob('scripts/**/*.js'),
            uglifyjs(),
            // ... more pipeline operations
        ];

    };


## API

### `uglifyjs()`

Minimise each input JavaScript resource.

Source maps for all input resources will be updated or generated accordingly.
