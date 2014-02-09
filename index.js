var mapEachResource = require('plumber').mapEachResource;
var SourceMap = require('mercator').SourceMap;

var UglifyJS = require('uglify-js');


module.exports = function(/* no options */) {
    return mapEachResource(function(resource) {
        var minResource = resource.withTransformation('minimised', 'min');

        // Note: we use the more custom API so we can pass data in and
        // get source maps out

        var originalFile = resource.path() && resource.path().absolute();
        var originalData = resource.data();
        var originalSourceMap = resource.sourceMap();
        var toplevel_ast = UglifyJS.parse(originalData, {
            filename: originalFile
        });
        toplevel_ast.figure_out_scope();

        // TODO: catch and report warnings?
        var compressor = UglifyJS.Compressor({warnings: false});
        var compressed_ast = toplevel_ast.transform(compressor);

        compressed_ast.figure_out_scope();
        compressed_ast.compute_char_frequency();
        compressed_ast.mangle_names();

        var sourceMapHolder = UglifyJS.SourceMap({
            file: minResource.filename(),
            // pass through current sourcemap if any
            orig: originalSourceMap
        });

        var uglifiedData = compressed_ast.print_to_string({
            source_map: sourceMapHolder
        });

        var sourceMap = SourceMap.fromMapData(sourceMapHolder.toString());

        // Annoyingly, UglifyJS doesn't remap the sourcesContent from
        // the file or the original source map (it is done as a
        // workaround in the `minify' helper we don't use:
        // https://github.com/mishoo/UglifyJS2/blob/master/tools/node.js#L115
        if (! sourceMap.sourcesContent) {
            if (originalSourceMap) {
                // Re-apply sourcesContent (if any) from original source map
                var originalContent = originalSourceMap.sourcesContent || [];
                originalSourceMap.sources.forEach(function(source, i) {
                    sourceMap = sourceMap.withSourceContent(source, originalContent[i]);
                });
            } else {
                // Use resource data as source content
                sourceMap = sourceMap.withSourceContent(originalFile, originalData);
            }
        }

        // FIXME: using uglify's input sourcemap feature above, but it
        // seems to lose sources content, names and columns.  This
        // below, on the other hand, breaks other tests...
        // if (resource.sourceMap()) {
        //     sourceMap = resource.sourceMap().apply(sourceMap);
        // }

        return minResource.withData(uglifiedData, sourceMap);
    });
};
