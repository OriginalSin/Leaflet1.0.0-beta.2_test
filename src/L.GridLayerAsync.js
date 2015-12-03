(function() {

var ExtendMethods = {
    _drawTileInternal: function (tilePoint, callback) {
        var _this = this;

        setTimeout(function () {
            var skipKeys = {
                '77:39:7': true,
                '154:79:8': true
            };
            var tkey = _this._tileCoordsToKey(tilePoint),
                tile = _this._tiles[tkey];
// tile.loaded = true;
// console.log('canvas', tkey, tile);
            if (tile && !skipKeys[tkey]) {
                if (!tile.el) {
                    tile.el = document.createElement('canvas');
                }
                var canvas = tile.el;
                _this._levels[tilePoint.z].el.appendChild(canvas);

                _this._initTile(canvas);
                L.DomUtil.addClass(canvas, 'leaflet-tile-loaded');
                var tilePos = _this._getTilePos(tilePoint);
                L.DomUtil.setPosition(canvas, tilePos);
                
                var ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.rect(0, 0, 255, 255);
                ctx.strokeText(tkey, 50, 50);
                ctx.stroke();
            }
            callback();
        }, 10);
    }
};

L.GridLayerAsync = L.GridLayer.extend({
    options: {
    },
    includes: ExtendMethods,
    initialize: function(options) {
        L.GridLayer.prototype.initialize.call(this, null, options);
    },
    
    createTile: function(coords, done){
        this._drawTileInternal(coords, L.bind(done, this, coords));
        return null;
    },

    _addTile: function (coords, container) {
        this.createTile(this._wrapCoords(coords), L.bind(this._tileReady, this, coords));
        // if createTile is defined with a second argument ("done" callback),
        // we know that tile is async and will be ready later; otherwise
        if (this.createTile.length < 2) {
            // mark tile as ready, but delay one frame for opacity animation to happen
            L.Util.requestAnimFrame(L.bind(this._tileReady, this, coords));
        }

        var key = this._tileCoordsToKey(coords);
        this._tiles[key] = {
            el: null,
            coords: coords,
            current: true
        };

        this.fire('tileloadstart', {
            tile: null,
            coords: coords
        });
    },

    // All other extend for async creation tile DOM node - check `tile.el` before operate in L.GridLayer
    _updateOpacity: function () {
        if (!this._map) { return; }

        // IE doesn't inherit filter opacity properly, so we're forced to set it on tiles
        if (L.Browser.ielt9 || !this._map._fadeAnimated) {
            return;
        }

        L.DomUtil.setOpacity(this._container, this.options.opacity);

        var now = +new Date(),
            nextFrame = false,
            willPrune = false;

        for (var key in this._tiles) {
            var tile = this._tiles[key];
            if (!tile.current || !tile.loaded) { continue; }

            var fade = Math.min(1, (now - tile.loaded) / 200);

if (tile.el) { L.DomUtil.setOpacity(tile.el, fade); }
            if (fade < 1) {
                nextFrame = true;
            } else {
                if (tile.active) { willPrune = true; }
                tile.active = true;
            }
        }

        if (willPrune && !this._noPrune) { this._pruneTiles(); }

        if (nextFrame) {
            L.Util.cancelAnimFrame(this._fadeFrame);
            this._fadeFrame = L.Util.requestAnimFrame(this._updateOpacity, this);
        }
    },

    _removeTile: function (key) {
        var tile = this._tiles[key];
        // console.log('_removeTile', key, tile);
        if (!tile) { return; }
if (tile.el) L.DomUtil.remove(tile.el);

        delete this._tiles[key];

        this.fire('tileunload', {
            tile: tile.el,
            coords: this._keyToTileCoords(key)
        });
    },

    _tileReady: function (coords, err, tile) {
        if (!this._map) { return; }

        if (err) {
            this.fire('tileerror', {
                error: err,
                tile: tile,
                coords: coords
            });
        }

        var key = this._tileCoordsToKey(coords);

        tile = this._tiles[key];
        if (!tile) { return; }

        tile.loaded = +new Date();
        if (this._map._fadeAnimated) {
if (tile.el) L.DomUtil.setOpacity(tile.el, 0);
            L.Util.cancelAnimFrame(this._fadeFrame);
            this._fadeFrame = L.Util.requestAnimFrame(this._updateOpacity, this);
        } else {
            tile.active = true;
            this._pruneTiles();
        }

if (tile.el) L.DomUtil.addClass(tile.el, 'leaflet-tile-loaded');

        this.fire('tileload', {
            tile: tile.el,
            coords: coords
        });

        if (this._noTilesToLoad()) {
            this._loading = false;
            this.fire('load');
        }
    }
});

L.gridLayerAsync = function (options) {
    return new L.GridLayerAsync(options);
};

})();
