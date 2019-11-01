import 'core-js';
import 'regenerator-runtime/runtime';
import extend from 'jquery-extend';

const defaultOptions = {
    defaultSort: false,
    defaultOpacity: 1,
    defaultSortRule: function (a, b) {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    }
}
const add = (target, list) => {
    list.push(target);
}

const remove = (target, list) => {
    const index = list.indexOf(target);
    if (index >= 0) return list.splice(index, 1);
}

class LeafletLayerManager {
    static create(map, baseLayerObjs, overlayObjs, options) {
        return new LeafletLayerManager(map, options).addLayerObjs(baseLayerObjs, overlayObjs)
    }

    constructor(map, options) {
        this.map = map;
        this.options = extend(true, defaultOptions, options);
        this.baseLayerObjs = [];
        this.overlayObjs = [];
        this._showBaseLayer = null;
        this._showOverlays = [];
        this._lastZIndex = 0;

        return this;
    }

    _getLayerObjs() {
        return this.baseLayerObjs.concat(this.overlayObjs);
    }

    _getLayerId(layer) {
        return layer._leaflet_id
    }

    _isBaseLayer(layerObj) {
        return this.baseLayerObjs.indexOf(layerObj) >= 0
    }

    _sort(sortRule) {
        if (sortRule) sortRule = this.options.defaultSortRule;
        this._showOverlays.sort(sortRule);
    }

    _shown(layerObj) {
        return [this._showBaseLayer].concat(this._showOverlays).indexOf(layerObj) >= 0;
    }

    _update() {
        const layerObjs = this._getLayerObjs();

        const hiddenLayerObjs = [];
        this.baseLayerObjs.forEach((layerObj) => {
            if (layerObj !== this._showBaseLayer) {
                if (this.map.hasLayer(layerObj.layer)) {
                    this.map.removeLayer(layerObj.layer);
                }
            }
        });
        this.overlayObjs.forEach((layerObj) => {
            if (this._showOverlays.indexOf(layerObj) < 0) {
                if (this.map.hasLayer(layerObj.layer)) {
                    this.map.removeLayer(layerObj.layer);
                }
            }
        });

        this._lastZIndex = 0;
        this._showBaseLayer.layer.setZIndex(this._lastZIndex++);
        if (!this.map.hasLayer(this._showBaseLayer.layer)) {
            this.map.addLayer(this._showBaseLayer.layer);
        }
        this._showOverlays.forEach(layerObj => {
            layerObj.layer.setZIndex(this._lastZIndex++);
            this.map.addLayer(layerObj.layer);
        })
    }

    findByLayer(layer) {
        return this.findById(this._getLayerId(layer));
    }

    findById(id) {
        const layerObjs = this._getLayerObjs();
        for (var i = 0; i < layerObjs.length; i++) {
            var layerObj = layerObjs[i];
            if (layerObj && this._getLayerId(layerObj.layer) === id) {
                return layerObj
            }
        }
    }

    findByName(name) {
        const layerObjs = this._getLayerObjs();
        for (var i = 0; i < layerObjs.length; i++) {
            var layerObj = layerObjs[i];
            if (layerObj && layerObj.name === name) {
                return layerObj
            }
        }
    }

    addLayerObjs(baseLayerObjs, overlayObjs, sort) {
        if (typeof sort === 'undefined') sort = this.options.defaultSort;
        baseLayerObjs.forEach(layerObj => {
            this.addBaseLayerObj(layerObj, false);
        });
        overlayObjs.forEach(layerObj => {
            this.addOverlayObj(layerObj, false);
            add(layerObj, this._showOverlays);
        });
        this._showBaseLayer = baseLayerObjs[baseLayerObjs.length - 1];
        this._update();
        return this;
    }

    addBaseLayerObj(layerObj, show = true) {
        add(layerObj, this.baseLayerObjs);
        if (show) {
            this.selectBaseLayer(layerObj.name);
        }
        return this;
    }

    selectBaseLayer(name) {
        const layerObj = this.findByName(name);
        if (layerObj) {
            this._showBaseLayer = layerObj;
            this._update();
        }
        return this;
    }

    addOverlayObj(layerObj, show = true, sort) {
        this._setOpacity(layerObj.layer, this.options.defaultOpacity);
        add(layerObj, this.overlayObjs);
        if (show) {
            this.showOverlay(layerObj.name, sort);
        }
        return this;
    }

    showOverlay(name, sort, index) {
        if (typeof sort === 'undefined') sort = this.options.defaultSort;
        const layerObj = this.findByName(name);
        if (layerObj && !this._shown(layerObj)) {
            var index;
            if (typeof index !== 'number' || index > this._showOverlays.legth) {
                index = this._showOverlays.length;
            } else if (index < 0) {
                index = 0;
            }
            this._showOverlays.splice(index, 0, layerObj);
            if (sort) this._sort();
            this._update();
        }
        return this;
    }

    hideOverlay(name) {
        const layerObj = this.findByName(name);
        if (layerObj) {
            remove(layerObj, this._showOverlays);
            this._update();
        }
        return this;
    }

    _setOpacity(layer, opacity) {
        const setToLayer = (layer, opacity) => {
            if ('setOpacity' in layer) {
                layer.setOpacity(opacity);
            } else if (layer.hasOwnProperty('_layers')) {
                Object.values(layer._layers).forEach((childLayer) => {
                    setToLayer(childLayer, opacity);
                })
            }
        }
        setToLayer(layer, opacity);
    }

    setOpacityByName(name, opacity) {
        if (typeof opacity === 'undefined') opacity = this.options.defaultOpacity;
        this._setOpacity(this.findByName(name).layer, opacity);
        return this;
    }

    removeLayer(layer) {
        var layerObj;
        if (typeof layer === 'string') {
            layerObj = this.findByName(layer);
        } else {
            layerObj = this.findByLayer(layer);
        }

        if (layerObj) {
            if (this._isBaseLayer(layerObj)) {
                remove(layerObj, this._baseLayerObjs);
            } else {
                remove(layerObj, this._overLayObjs);
            }
        }
        return this;
    }

    fitBounds(layer) {
        var layerObj;
        if (typeof layer === 'string') {
            layerObj = this.findByName(layer);
        } else {
            layerObj = this.findByLayer(layer);
        }
        if (layerObj) {
            this.map.fitBounds(layerObj.layer.getBounds());
        }
    }

    sort(sortRule) {
        this._sort(sortRule);
        this._update();
    }
}

export default LeafletLayerManager;