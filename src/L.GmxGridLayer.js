(function() {

var CanvasLayer = L.GridLayer.extend({
    createTile: function(coords, done){
        var error;
        // create a <canvas> element for drawing
        var canvas = L.DomUtil.create('canvas', 'leaflet-tile'),
			_this = this,
            tkey = this._tileCoordsToKey(coords);

		var size = this.getTileSize();
        canvas.width = size.x;
        canvas.height = size.y;
        // draw something asynchronously and pass the tile to the done() callback
        setTimeout(function() {
			//this._tiles[key] = {
			var ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.rect(0, 0, 255, 255);
			
			ctx.strokeText(tkey, 50, 50);
			ctx.stroke();
            
			done(error, canvas);
        }, 1000);
        return canvas;
    }
});

L.gmxGridLayer = function (options) {
    return new CanvasLayer(options);
};

/*
var ExtendMethods = {
    _drawTileInternal: function (tilePoint, callback) {
        var _this = this;

        setTimeout(function () {
            var skipKeys = {        // For some reason we don't want create tile.el for those grid cells
                '77:39:7': true,
                '154:79:8': true
            };
            var tkey = _this._tileCoordsToKey(tilePoint),
                tile = _this._tiles[tkey],
                skip = skipKeys[tkey] || !tile || _this._tileZoom !== tilePoint.z;
            if (!skip) {
                console.log('draw tile');
                _this._initTile(tilePoint);
                var canvas = tile.el,
                    ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.rect(0, 0, 255, 255);
                ctx.strokeText(tkey, 50, 50);
                ctx.stroke();
            }
            callback();
        }, 700);
    }
};
//L.gmx.VectorLayer = L.TileLayer.Canvas.extend(

L.GmxGridLayer = L.GridLayer.extend({
    options: {
    },
    includes: ExtendMethods,
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
                        count++;
                        arr.push(it.el.childElementCount);
                        if (count > 1) {
                            console.log('Error not prune tiles:', arr, this._levels);
                            // this._pruneTiles();
                            break;
                        }
                    }
                }
            }
            console.log('all done levels:', Object.keys(this._levels).length, 'tiles:', Object.keys(this._tiles).length);
            
        }, this);
    },
    
    createTile: function(coords, done){
        this._drawTileInternal(coords, L.bind(done, this, coords));
        return null;
    },

    _initTile: function (coords) {
        var tkey = this._tileCoordsToKey(coords),
            cell = this._tiles[tkey];

        if (!cell.el) {
            cell.el = L.DomUtil.create('canvas',
                'leaflet-tile',
                this._levels[coords.z].el
            );
        }

        var cellNode = cell.el,
            tileSize = this.getTileSize(),
            tilePos = this._getTilePos(coords);

        cellNode.width = tileSize.x;
        cellNode.height = tileSize.y;
        L.DomUtil.setPosition(cellNode, tilePos);

        // update opacity on tiles in IE7-8 because of filter inheritance problems
        if (L.Browser.ielt9 && this.options.opacity < 1) {
            L.DomUtil.setOpacity(cellNode, this.options.opacity);
        }

        // without this hack, tiles disappear after zoom on Chrome for Android
        // https://github.com/Leaflet/Leaflet/issues/2078
        if (L.Browser.android && !L.Browser.android23) {
            cellNode.style.WebkitBackfaceVisibility = 'hidden';
        }
    },

    _addTile: function (coords, container) {
        this.createTile(this._wrapCoords(coords), L.bind(this._tileReady, this, coords));
        // if createTile is defined with a second argument ("done" callback),
        // we know that tile is async and will be ready later; otherwise
        // if (this.createTile.length < 2) {
            // mark tile as ready, but delay one frame for opacity animation to happen
            // L.Util.requestAnimFrame(L.bind(this._tileReady, this, coords));
        // }

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

L.gmxGridLayer = function (options) {
    return new L.GmxGridLayer(options);
};
*/
})();
