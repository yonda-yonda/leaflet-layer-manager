import extend from 'jquery-extend';
import {
    version
} from '../package.json';

const nameChain = (name) => {
    /**
     * @param {string} name - layerのname(chained)
     * @return {string[]} nameの配列
     */
    const separator = '.'
    return name.split(separator);
}

const adjustIndex = (list, index) => {
    /**
     * @param {number} index - 添字
     * @param {*[]} list - 配列
     * @return {number} 配列の範囲に収まった添字、範囲外の場合list.length(末尾)
     */
    if (typeof index !== 'number' || index > list.length || index < 0) {
        index = list.length;
    }
    return index
}

const addList = (target, list, index = undefined) => {
    /**
     * 配列に対象を加える(破壊的)
     * @param {*} target - 対象
     * @param {*[]} list - 配列
     * @param {number} index - 添字 範囲外または未指定の場合末尾に加えられる
     */
    index = adjustIndex(list, index);
    list.splice(index, 0, target);
}

const removeList = (target, list) => {
    /**
     * 対象が配列に含まれていた場合削除する(破壊的)
     * @param {number} target - 対象
     * @param {*[]} list - 配列
     */
    if (list.includes(target))
        return list.splice(list.indexOf(target), 1);
}

class LyrObj {
    constructor(name, layer, props = {}) {
        if (typeof name !== 'string' || name.length === 0) {
            throw new Error('The provided name must be string (at least one character).');
        }
        if (name.includes('.')) {
            throw new Error('The provided name must not contain ".", it is a separator.');
        }

        this.name = name;
        this.layer = layer;
        this.props = props;
    }

    _setPane(map, pane) {
        const overwritePane = (map, layer, pane) => {
            /**
             * paneを上書きする。子要素も全て
             * @param {LayerManager|L.Layer} layer - 対象
             * @param {string} pane - paneName
             */
            if (layer.options && layer.options.pane !== pane) {
                layer.options.pane = pane;
                layer.removeFrom(map)
            }
            if (typeof layer._layers !== 'undefined') {
                Object.keys(layer._layers).forEach((key) => {
                    overwritePane(map, layer._layers[key], pane);
                })
            }
        }
        overwritePane(map, this.layer, pane);
    }

    _addTo(map) {
        this.layer.addTo(map);
    }

    _removeFrom(map) {
        this.layer.removeFrom(map);
    }

    _bringToFront() {
        /**
         * https: //github.com/Leaflet/Leaflet/blob/f8e09f993292579a1af88261c9b461730f22e4e6/src/layer/tile/GridLayer.js#L285
         * tile系は同パネル内のlayerのうち、styleで直接指定されているzIndexの最大値を取得し+1することでbringToFrontを実現する。
         * svg or canvasはデフォルトではcssによりzIndexが指定されている(200など)ため、この動作に影響しない。
         */
        const invoke = (layer) => {
            if (typeof layer.bringToFront !== 'undefined') {
                layer.bringToFront();
            } else if (typeof layer._layers !== 'undefined') {
                Object.keys(layer._layers).forEach((key) => {
                    invoke(layer._layers[key]);
                })
            };
        }
        invoke(this.layer);
    }

    _setStyle(style) {
        const invoke = (layer, style) => {
            if (typeof layer.setStyle !== 'undefined') {
                layer.setStyle(style);
            } else if (typeof layer._layers !== 'undefined') {
                Object.keys(layer._layers).forEach((key) => {
                    invoke(layer._layers[key], style);
                })
            };
        }
        invoke(this.layer, style);
    }

    _setOpacity(opacity) {
        const invoke = (layer, opacity) => {
            if (typeof layer.setOpacity !== 'undefined') {
                layer.setOpacity(opacity);
            } else if ('_layers' in layer) {
                Object.keys(layer._layers).forEach((key) => {
                    invoke(layer._layers[key], opacity);
                })
            };
        }
        invoke(this.layer, opacity);
    }

    _setZIndex(zIndex) {
        const invoke = (layer, zIndex) => {
            if (typeof layer.setZIndex !== 'undefined') {
                layer.setZIndex(zIndex);
            } else if ('_layers' in layer) {
                Object.keys(layer._layers).forEach((key) => {
                    invoke(layer._layers[key], zIndex);
                })
            };
        }
        invoke(this.layer, zIndex);
        return ++zIndex;
    }
}

class GrpObj {
    constructor(name, lyrs, props = {}) {
        if (typeof name !== 'string' || name.length === 0) {
            throw new Error('The provided name must be String (at least one character).');
        }
        if (name.includes('.')) {
            throw new Error('The provided name must not contain ".", it is a separator.');
        }
        if (Array.isArray(lyrs) && !lyrs.every((lyr) => {
                return (lyr instanceof GrpObj) || (lyr instanceof LyrObj)
            })) {
            throw new Error('The provided array must be Array of LyrObj or GrpObj.');
        }

        this.name = name;
        this._lyrs = lyrs;
        this.props = props;
    }

    getIndexByName(name) {
        /**
         * 名前で検索し直下のObjのインデックスを返す
         */
        for (let i = 0; i < this._lyrs.length; i++) {
            if (this._lyrs[i].name === name) return i;
        }
        return -1;
    }

    findByName(name) {
        /**
         * 名前で検索し直下のObjを返す
         */
        const index = this.getIndexByName(name);
        if (index >= 0) return this._lyrs[index];
    }

    hasLayer(name) {
        /**
         * nameのObjを直下の要素に持つか判定する
         * @param {string} name - レイヤー名
         * @return {boolean} 有無
         */
        return this.getIndexByName(name) >= 0
    }

    _setPane(map, pane) {
        this._lyrs.forEach((lyr) => {
            lyr._setPane(map, pane);
        })
    }

    _bringToFront(map) {
        this._lyrs.forEach((lyr) => {
            lyr._bringToFront(map);
        })
    }

    _setStyle(style) {
        this._lyrs.forEach((lyr) => {
            lyr._setStyle(style);
        })
    }

    _setOpacity(opacity) {
        this._lyrs.forEach((lyr) => {
            lyr._setOpacity(opacity);
        })
    }

    _setZIndex(zIndex) {
        this._lyrs.forEach((lyr) => {
            zIndex = lyr._setZIndex(zIndex);
        })
        return zIndex;
    }

    _addTo(map) {
        this._lyrs.forEach((lyr) => {
            lyr._addTo(map);
        })
    }

    _removeFrom(map) {
        this._lyrs.forEach((lyr) => {
            lyr._removeFrom(map);
        })
    }
}

/*
 * LyrObj, GrpObj共通
 * - _setPane
 * - _addTo
 * - _removeFrom
 * - _bringToFront
 * - _setZIndex
 * - _setStyle
 * - _setOpacity
 */

/*
 * GrpObj, LayerManager共通
 * - getIndexByName
 * - findByName
 * - hasLayer
 */

class LayerManager {
    constructor(map, pane = undefined) {
        this._map = map;
        this._lyrs = [];
        this._pane = typeof pane === 'string' ? pane : 'overlayPane';
        if (typeof this._map.getPane(this._pane) === 'undefined') {
            this._map.createPane(this._pane);
        }

        return this;
    }

    _createChild(name, layer, props) {
        if (Array.isArray(layer)) {
            const lyrs = layer.map(({
                name,
                layer,
                props
            }) => {
                return this._createChild(name, layer, props)
            })
            const lyr = new GrpObj(name, lyrs, props);
            lyr._setPane(this._map, this._pane);
            // https://github.com/Leaflet/Leaflet/blob/master/src/layer/Layer.js#L163
            // 重複チェックはmap.addLayer側で行っている。
            lyr._addTo(this._map);
            return lyr;
        }

        const lyr = new LyrObj(name, layer, props);
        lyr._setPane(this._map, this._pane);
        lyr._addTo(this._map);
        return lyr;
    }

    _getParent(parentName) {
        /**
         * parentNameで指定された親要素(LayerManger or GrpObj)を探索する
         * 経路上にLyrObjがあった場合はundefinedを返す
         */
        if (parentName === '') return this;

        const names = nameChain(parentName);
        let parent = this;

        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            let child;
            for (let i = 0; i < parent._lyrs.length; i++) {
                if (parent._lyrs[i].name === name) {
                    child = parent._lyrs[i];
                    break;
                }
            }

            if (child instanceof GrpObj) {
                parent = child;
            } else {
                return;
            }
        }
        return parent;
    }

    getIndexByName(name, options = {}) {
        /**
         * 名前で検索し直下のObjのインデックスを返す
         */
        options = extend(true, {
            parentName: ''
        }, options);

        const parent = this._getParent(options.parentName);
        if (typeof parent === 'undefined') return -1;

        for (let i = 0; i < parent._lyrs.length; i++) {
            if (parent._lyrs[i].name === name) return i;
        }
        return -1;
    }

    findByName(name, options = {}) {
        /**
         * 名前で検索しObjを返す
         */
        options = extend(true, {
            parentName: ''
        }, options);

        const parent = this._getParent(options.parentName);
        if (typeof parent === 'undefined') return;

        const index = parent.getIndexByName(name);
        if (index >= 0) return parent._lyrs[index];
    }

    hasLayer(name, options = {}) {
        /**
         * nameのObjを要素に持つか判定する
         * @param {string} name - レイヤー名
         * @return {boolean} 有無
         */
        options = extend(true, {
            parentName: ''
        }, options);

        const parent = this._getParent(options.parentName);
        if (typeof parent === 'undefined') return;

        const index = parent.getIndexByName(name);
        return index >= 0;
    }

    add(layerParam = {}, options = {}) {
        /**
         * Objを追加する
         */
        options = extend(true, {
            parentName: '',
            index: -1
        }, options);

        const parent = this._getParent(options.parentName);
        if (typeof parent === 'undefined') return;

        if (!parent.hasLayer(layerParam.name)) {
            const lyr = this._createChild(layerParam.name, layerParam.layer, layerParam.props);
            addList(lyr, parent._lyrs, options.index);
            this._update();
        }
    }

    remove(name, options = {}) {
        /**
         * 配下のObjを削除する
         * 地図からも削除
         */
        options = extend(true, {
            parentName: ''
        }, options);

        const parent = this._getParent(options.parentName);
        if (typeof parent === 'undefined') return;

        const lyr = parent.findByName(name);
        if (lyr) {
            lyr._removeFrom(this._map);
            removeList(lyr, parent._lyrs);
        }
    }

    reset(options) {
        /**
         * 配下の全要素削除
         */
        options = extend(true, {
            parentName: ''
        }, options);

        const parent = this._getParent(options.parentName);
        if (typeof parent === 'undefined') return;

        parent._lyrs.forEach((lyr) => {
            lyr._removeFrom(this._map);
        });
        parent._lyrs = [];
    }

    replaceLayer(layerParam = {}, options = {}) {
        /**
         * 指定されたnameの要素を置き換える
         */
        options = extend(true, {
            parentName: ''
        }, options);

        const parent = this._getParent(options.parentName);
        if (typeof parent === 'undefined') return;

        const index = parent.getIndexByName(layerParam.name);
        if (index >= 0) {
            const lyr = this._createChild(layerParam.name, layerParam.layer, layerParam.props);
            parent._lyrs[index]._removeFrom(this._map);
            parent._lyrs[index] = lyr;
            this._update();
        }
    }

    setLayers(layerParams, options = {}) {
        /**
         * 親要素(LayerManger or GrpObj)のlysを書き換える。
         * force = falseの場合、すでに持っているlayerを再利用する(リロードされない)
         */
        options = extend(true, {
            parentName: '',
            forse: false
        }, options);
        const parent = this._getParent(options.parentName);
        if (typeof parent === 'undefined') return;
        const newLyrs = [];
        layerParams.forEach((layerParam) => {
            layerParam = extend(true, {
                name: '',
                layer: undefined,
                props: undefined
            }, layerParam);

            let lyr;
            if (options.force === true) {
                lyr = this._createChild(layerParam.name, layerParam.layer, layerParam.props);
            } else {
                lyr = parent.findByName(layerParam.name);
                if (lyr) {
                    removeList(lyr, parent._lyrs);
                } else {
                    lyr = this._createChild(layerParam.name, layerParam.layer, layerParam.props);
                }
            }
            newLyrs.push(lyr);
        });
        parent._lyrs.forEach((lyr) => {
            lyr._removeFrom(this._map);
        });
        parent._lyrs = newLyrs;
        this._update();
    }

    sort(sortFunc, options = {}) {
        /**
         * レイヤーのソート
         */
        options = extend(true, {
            parentName: ''
        }, options);

        if (typeof sortFunc === 'function') {
            const parent = this._getParent(options.parentName);
            if (typeof parent === 'undefined') return;
            parent._lyrs.sort(sortFunc);
            this._update();
        }
    }

    move(from, to, options = {}) {
        /**
         * レイヤーの並び順を変更する
         */
        options = extend(true, {
            parentName: ''
        }, options);

        const parent = this._getParent(options.parentName);
        if (typeof parent === 'undefined') return;

        from = adjustIndex(parent._lyrs, from);
        to = adjustIndex(parent._lyrs, to);
        if (to === parent._lyrs.length) to -= 1;

        if (from !== to && from < parent._lyrs.length && to < parent._lyrs.length) {
            const lyr = parent._lyrs.splice(from, 1)[0];

            parent._lyrs.splice(to, 0, lyr);
            this._update();
        }
    }

    bringToFront(name, options = {}) {
        /**
         * 所属するグループ内で最前面にする
         */
        options = extend(true, {
            parentName: ''
        }, options);

        const parent = this._getParent(options.parentName);
        if (typeof parent === 'undefined') return;

        const index = parent.getIndexByName(name);
        this.move(index, -1, {
            parentName: options.parentName
        });
    }

    bringToBack(name, options = {}) {
        /**
         * 所属するグループ内で最背面にする
         */
        options = extend(true, {
            parentName: ''
        }, options);

        const parent = this._getParent(options.parentName);
        if (typeof parent === 'undefined') return;

        const index = parent.getIndexByName(name);
        this.move(index, 0, {
            parentName: options.parentName
        });
    }
}

class RasterLayerManager extends LayerManager {
    _update() {
        /**
         * 表示状態を更新する
         */
        let zIndex = 0;
        this._lyrs.forEach((lyr) => {
            zIndex = lyr._setZIndex(zIndex);
        });

        // 同paneにベクター要素があった場合、最前面にする
        var vectors = [].slice.call(this._map.getPane(this._pane).querySelectorAll('svg, canvas'));
        vectors.forEach(function (el) {
            el.style.zIndex = zIndex;
        });
    }

    setOpacity(name, opacity, options = {}) {
        /**
         * 透過度を設定
         */
        options = extend(true, {
            parentName: ''
        }, options);

        const parent = this._getParent(options.parentName);
        if (typeof parent === 'undefined') return;

        const lyr = parent.findByName(name);
        if (lyr)
            lyr._setOpacity(opacity);
    }
}
class VectorLayerManager extends LayerManager {
    _update() {
        /**
         * 表示状態を更新する
         */
        this._lyrs.forEach((lyr) => {
            lyr._bringToFront();
        })
    }

    setStyle(name, style, options = {}) {
        /**
         * styleを設定
         */
        options = extend(true, {
            parentName: ''
        }, options);

        const parent = this._getParent(options.parentName);
        if (typeof parent === 'undefined') return;

        const lyr = parent.findByName(name);
        if (lyr)
            lyr._setStyle(style);
    }

    setOpacity(name, opacity, options = {}) {
        /**
         * 透過度を設定
         */
        this.setStyle(name, {
            opacity: opacity,
            fillOpacity: opacity
        }, options)
    }
}
export default {
    version: version,
    raster: (...args) => {
        return new RasterLayerManager(...args)
    },
    vector: (...args) => {
        return new VectorLayerManager(...args)
    },
};