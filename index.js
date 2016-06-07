//
// copy and modify from `html-webpack-plugin`
//
var path = require('path');
var urlModule = require('url');
var _ = require('lodash');


module.exports = function(compilation) {

    var webpackStatsJson = compilation.getStats().toJson();

    // Use the configured public path or build a relative path
    var publicPath = compilation.mainTemplate.getPublicPath({hash: webpackStatsJson.hash});

    if (publicPath.length && publicPath.substr(-1, 1) !== '/') {
        publicPath += '/';
    }

    var assets = {
        // Will contain all js & css files by chunk
        chunks: {},
        // Will contain all js files
        js: [],
        // Will contain all css files
        css: [],
        // Will contain the html5 appcache manifest files if it exists
        manifest: Object.keys(compilation.assets).filter(function(assetFile){
            return path.extname(assetFile) === '.appcache';
        })[0]
    };

    // Get sorted chunks
    var chunks = sortChunks(webpackStatsJson.chunks);

    for (var i = 0; i < chunks.length; i++) {
        var chunk = chunks[i];
        var chunkName = chunk.names[0];

        // This chunk doesn't have a name. This script can't handled it.
        if(chunkName === undefined) {
            continue;
        }

        // Skip not initial chunks
        if (!chunk.initial) {
            continue;
        }

        assets.chunks[chunkName] = {};

        // Prepend the public path to all chunk files
        var chunkFiles = [].concat(chunk.files).map(function(chunkFile) {
            return publicPath + chunkFile;
        });

        // Append a hash for cache busting
        // if (this.options.hash) {
        //     chunkFiles = chunkFiles.map(function(chunkFile) {
        //         return self.appendHash(chunkFile, webpackStatsJson.hash);
        //     });
        // }

        // Webpack outputs an array for each chunk when using sourcemaps
        // But we need only the entry file
        var entry = chunkFiles[0];
        assets.chunks[chunkName].size = chunk.size;
        assets.chunks[chunkName].entry = entry;
        assets.js.push(entry);

        // Gather all css files
        var css = chunkFiles.filter(function(chunkFile){
            // Some chunks may contain content hash in their names, for ex. 'main.css?1e7cac4e4d8b52fd5ccd2541146ef03f'.
            // We must proper handle such cases, so we use regexp testing here
            return /^.css($|\?)/.test(path.extname(chunkFile));
        });
        assets.chunks[chunkName].css = css;
        assets.css = assets.css.concat(css);
    }

    // Duplicate css assets can occur on occasion if more than one chunk
    // requires the same css.
    assets.css = _.uniq(assets.css);

    return assets;
};

function sortChunks(chunks, sortMode) {
  // Sort mode auto by default:
  if (typeof sortMode === 'undefined' || sortMode === 'auto') {
    return chunks.sort(function orderEntryLast(a, b) {
      if (a.entry !== b.entry) {
        return b.entry ? 1 : -1;
      } else {
        return b.id - a.id;
      }
    });
  }
  // Disabled sorting:
  if (sortMode === 'none') {
    return chunks;
  }
  // Custom function
  if (typeof sortMode === 'function') {
    return chunks.sort(sortMode);
  }
  // Invalid sort mode
  throw new Error('"' + sortMode + '" is not a valid chunk sort mode');
};
