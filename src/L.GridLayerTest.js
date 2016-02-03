var arrTest = [],
    drawNow = false,
    doDraw = function() {
        arrTest.map(function(it) { it(); });
        arrTest = [];
        drawNow = true;
        map.setZoom(8);
    };

(function() {
L.GridLayerTest = L.GridLayer.extend({
    options: {
    },
    initialize: function(options) {
        L.GridLayer.prototype.initialize.call(this, null, options);
        this.on('load', function(ev) {
            var len = Object.keys(this._levels).length,
                arr = [],
                count = 0;
            if (len > 1) {
                for (var zoom in this._levels) {
                    var it = this._levels[zoom];
                    if (it.el.childElementCount) {
                        for (var i= 0, len = it.el.childNodes.length; i < len; i++) {
                            var node = it.el.childNodes[i];
                            if (node.style.opacity < 1) {
                                count++;
                                break;
                            }
                        }
                        if (count > 1) {
                            console.log('Error not prune tiles:', this._map._animatingZoom, arr, this._levels);
                            // this._pruneTiles();
                            break;
                        }
                    }
                }
            }
            // console.log('all done levels:', Object.keys(this._levels).length, 'tiles:', Object.keys(this._tiles).length);
            
        }, this);
    },
    createTile: function (coords, done) {
        var tile = document.createElement('canvas');

        // L.DomEvent.on(tile, 'load', L.bind(this._tileOnLoad, this, done, tile));
        // L.DomEvent.on(tile, 'error', L.bind(this._tileOnError, this, done, tile));

        if (this.options.crossOrigin) {
            tile.crossOrigin = '';
        }
        var tkey = this._tileCoordsToKey(coords),
            tileSize = this.getTileSize(),
            tilePos = this._getTilePos(coords);

        tile.width = tileSize.x;
        tile.height = tileSize.y;
        L.DomUtil.setPosition(tile, tilePos);

        /*
         Alt tag is set to empty string to keep screen readers from reading URL and for compliance reasons
         http://www.w3.org/TR/WCAG20-TECHS/H67
        */
        tile.alt = '';
// console.log('draw tile');
        var canvas = tile,
            ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.rect(0, 0, 255, 255);
        ctx.strokeText(tkey, 50, 50);
        ctx.stroke();
        drawNow ? done() : arrTest.push(done);
        return tile;
    },

    _initTile: function (tile) {
        // update opacity on tiles in IE7-8 because of filter inheritance problems
        if (L.Browser.ielt9 && this.options.opacity < 1) {
            L.DomUtil.setOpacity(tile, this.options.opacity);
        }

        // without this hack, tiles disappear after zoom on Chrome for Android
        // https://github.com/Leaflet/Leaflet/issues/2078
        if (L.Browser.android && !L.Browser.android23) {
            tile.style.WebkitBackfaceVisibility = 'hidden';
        }
    },
});

L.gridLayerTest = function (options) {
    return new L.GridLayerTest(options);
};

})();
