var mapEachResource = require('plumber').mapEachResource;

var UglifyJS = require('uglify-js');


module.exports = function(/* no options */) {
    return mapEachResource(function(resource) {
        // TODO: filename, based on output spec? on input filename?
        var minResource = resource.withTransformation('minimised', 'min');

        var sourceMapData = UglifyJS.SourceMap();
        var result = UglifyJS.minify(resource.path().absolute(), {
            outSourceMap: minResource.sourceMapFilename(),
            source_map: sourceMapData
        });

        return minResource.
            withData(result.code).
            withSourceMap(sourceMapData.toString());
    });
};
