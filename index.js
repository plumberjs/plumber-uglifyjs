var mapEachResource = require('plumber').mapEachResource;

var UglifyJS = require('uglify-js');


module.exports = function(/* no options */) {
    return mapEachResource(function(resource) {
        var minResource = resource.withTransformation('minimised', 'min');

        // Note: we use the more custom API so we can pass data in and
        // get source maps out

        var toplevel_ast = UglifyJS.parse(resource.data(), {
            // TODO: or relative?
            filename: resource.path().absolute()
        });
        toplevel_ast.figure_out_scope();

        // TODO: catch and report warnings?
        var compressor = UglifyJS.Compressor({warnings: false});
        var compressed_ast = toplevel_ast.transform(compressor);

        compressed_ast.figure_out_scope();
        compressed_ast.compute_char_frequency();
        compressed_ast.mangle_names();

        var sourceMapData = UglifyJS.SourceMap({
            file: minResource.filename(),
            // pass through current sourcemap if any
            orig: resource.sourceMap()
        });

        var uglifiedData = compressed_ast.print_to_string({
            source_map: sourceMapData
        });

        return minResource.
            withData(uglifiedData).
            withSourceMap(sourceMapData.toString());
    });
};
