var chai = require('chai');
chai.should();
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

require('mocha-as-promised')();

var SourceMapConsumer = require('source-map').SourceMapConsumer;


var Resource = require('plumber').Resource;
var SourceMap = require('mercator').SourceMap;

var uglifyjs = require('..');

function createResource(params) {
    return new Resource(params);
}


describe('uglifyjs', function(){
    var firstSource = '/* source */\nvar answer = 42;\nvar added = addOne(answer);\nfunction addOne(number) {\n  return number + 1;\n}\n';
    var firstSourceUglified = 'function addOne(d){return d+1}var answer=42,added=addOne(answer);';
    var secondSource = 'var one = 1;\n/* 2 */\nvar two = one + one;\n';
    var secondSourceUglified = 'var one=1,two=one+one;';


    it('should be a function', function(){
        uglifyjs.should.be.a('function');
    });

    it('should return a function', function(){
        uglifyjs().should.be.a('function');
    });


    describe('when passed a single resource with no source map', function() {
        var uglifiedResources;

        beforeEach(function() {
            uglifiedResources = uglifyjs()([
                createResource({path: 'path/to/file.js', type: 'javascript', data: firstSource})
            ]);
        });

        it('should return a single resource with uglified content', function(){
            return uglifiedResources.then(function(resources) {
                resources.length.should.equal(1);
                resources[0].data().should.equal(firstSourceUglified);
            });
        });

        it('should return a resource with .min filename', function(){
            return uglifiedResources.then(function(resources) {
                resources[0].filename().should.equal('file.min.js');
            });
        });

        it('should return a resource with a source map for the minimisation', function(){
            return uglifiedResources.then(function(resources) {
                var sourceMap = resources[0].sourceMap();
                sourceMap.sources.should.deep.equal(['path/to/file.js']);
                // sourceMap.sourcesContent.should.deep.equal([firstSource]);

                // check mappings
                var map = new SourceMapConsumer(sourceMap);
                /*
                 function addOne(d){return d+1}var answer=42,added=addOne(answer);
                 ^
                 */
                map.originalPositionFor({line: 1, column: 0}).should.deep.equal({
                    source: 'path/to/file.js',
                    line: 4,
                    column: 0,
                    name: null
                });
                /*
                 function addOne(d){return d+1}var answer=42,added=addOne(answer);
                                 ^
                 */
                map.originalPositionFor({line: 1, column: 16}).should.deep.equal({
                    source: 'path/to/file.js',
                    line: 4,
                    column: 16,
                    name: "number"
                });
                /*
                 function addOne(d){return d+1}var answer=42,added=addOne(answer);
                                    ^
                 */
                map.originalPositionFor({line: 1, column: 19}).should.deep.equal({
                    source: 'path/to/file.js',
                    line: 5,
                    column: 2,
                    name: null
                });
                /*
                 function addOne(d){return d+1}var answer=42,added=addOne(answer);
                                               ^
                 */
                map.originalPositionFor({line: 1, column: 30}).should.deep.equal({
                    source: 'path/to/file.js',
                    line: 2,
                    column: 0,
                    name: null
                });
                /*
                 function addOne(d){return d+1}var answer=42,added=addOne(answer);
                                                   ^
                 */
                map.originalPositionFor({line: 1, column: 34}).should.deep.equal({
                    source: 'path/to/file.js',
                    line: 2,
                    column: 4,
                    name: "answer"
                });
                /*
                 function addOne(d){return d+1}var answer=42,added=addOne(answer);
                                                             ^
                 */
                map.originalPositionFor({line: 1, column: 44}).should.deep.equal({
                    source: 'path/to/file.js',
                    line: 3,
                    column: 4,
                    name: "added"
                });
            });
        });
    });


    describe('when passed a single resource with a source map', function() {
        var uglifiedResources;
        // source map as concatenation of two files
        var concatMap = SourceMap.fromMapData('{"version":3,"file":"concatenated.js","mappings":"AAAA;AACA;ACDA;AACA;AACA;AACA;AACA","sources":["path/to/one.js","path/to/two.js"],"sourcesContent":["/* source */\\nvar answer = 42;\\n","var added = addOne(answer);\\nfunction addOne(number) {\\n  return number + 1;\\n}\\n"],"names":[]}');

        beforeEach(function() {
            uglifiedResources = uglifyjs()([
                createResource({path: 'path/to/concatenated.js', type: 'javascript', data: firstSource, sourceMap: concatMap})
            ]);
        });

        it('should return a resource with a source map for the minimisation combined with the input source map', function(){
            return uglifiedResources.then(function(resources) {
                var sourceMap = resources[0].sourceMap();

                sourceMap.sources.should.deep.equal([
                    'path/to/two.js',
                    'path/to/one.js'
                ]);
                // FIXME: sources content lost in remapping?
                // sourceMap.sourcesContent.should.deep.equal([
                //     "var added = addOne(answer);\nfunction addOne(number) {\n  return number + 1;\n}\n",
                //     "/* source */\nvar answer = 42;\n"
                // ]);

                var map = new SourceMapConsumer(sourceMap);
                /*
                 function addOne(d){return d+1}var answer=42,added=addOne(answer);
                 ^
                 */
                map.originalPositionFor({line: 1, column: 0}).should.deep.equal({
                    source: 'path/to/two.js',
                    line: 2,
                    column: 0,
                    name: null
                });
                /*
                 function addOne(d){return d+1}var answer=42,added=addOne(answer);
                                 ^
                 */
                map.originalPositionFor({line: 1, column: 16}).should.deep.equal({
                    source: 'path/to/two.js',
                    line: 2,
                    column: 0,
                    name: null
                    // FIXME: name lost in remapping?
                    // column: 16,
                    // name: "number"
                });
                /*
                 function addOne(d){return d+1}var answer=42,added=addOne(answer);
                                    ^
                 */
                map.originalPositionFor({line: 1, column: 19}).should.deep.equal({
                    source: 'path/to/two.js',
                    line: 3,
                    column: 0,
                    // FIXME: column lost in remapping?
                    // column: 2,
                    name: null
                });
                /*
                 function addOne(d){return d+1}var answer=42,added=addOne(answer);
                                               ^
                 */
                map.originalPositionFor({line: 1, column: 30}).should.deep.equal({
                    source: 'path/to/one.js',
                    line: 2,
                    column: 0,
                    name: null
                });
                /*
                 function addOne(d){return d+1}var answer=42,added=addOne(answer);
                                                   ^
                 */
                map.originalPositionFor({line: 1, column: 34}).should.deep.equal({
                    source: 'path/to/one.js',
                    line: 2,
                    column: 0,
                    name: null
                    // FIXME: name lost in remapping?
                    // column: 4,
                    // name: "answer"
                });
                /*
                 function addOne(d){return d+1}var answer=42,added=addOne(answer);
                                                             ^
                 */
                map.originalPositionFor({line: 1, column: 44}).should.deep.equal({
                    source: 'path/to/two.js',
                    line: 1,
                    column: 0,
                    name: null
                    // FIXME: name lost in remapping?
                    // column: 4,
                    // name: "added"
                });
            });
        });

    });


    describe('when passed two resources', function() {
        var uglifiedResources;

        beforeEach(function() {
            uglifiedResources = uglifyjs()([
                createResource({path: 'path/to/first.js', type: 'javascript', data: firstSource}),
                createResource({path: 'path/to/second.js', type: 'javascript', data: secondSource})
            ]);
        });

        it('should return two uglified resource', function(){
            return uglifiedResources.then(function(resources) {
                resources.length.should.equal(2);
                resources[0].data().should.equal(firstSourceUglified);
                resources[1].data().should.equal(secondSourceUglified);
            });
        });

    });
});
