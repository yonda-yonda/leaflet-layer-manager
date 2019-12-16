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

const setOpacityToLayer = (layer, opacity) => {
    if ('setOpacity' in layer) {
        layer.setOpacity(opacity);
    } else if (layer.hasOwnProperty('_layers')) {
        // グループレイヤーのための処理
        Object.values(layer._layers).forEach((childLayer) => {
            setOpacityToLayer(childLayer, opacity);
        })
    }
}

/*
    # レイヤーオブジェ
    ## ユーザーが指定する要素
    name: 識別するための名称
    layer: leafletのレイヤー(レイヤーグループも可、 ただしレイヤーグループ内の重なり順は制御できない）
    
    ## マネージャー側で指定する要素
    _opacity: 透過率(保存用)
    _added: 追加済みかのフラグ

    ## サンプル
    {
        name: "test",
        layer: L.imageOverlay(image_url, L.latLngBounds(
            [35.681236, 139.767125],
            [35.581236, 139.867125]
        ))
    }
*/

class LeafletLayerManager {
    static create(map, baseLayerObjs, overlayObjs, options) {
        let leafletOptions = options.hasOwnProperty('leaflet') ? options.leaflet : {};
        let showOverlayNames = options.hasOwnProperty('showOverlayNames') ? options.showOverlayNames : [];
        let showBaseLayerName = options.hasOwnProperty('showBaseLayerName') ? options.showBaseLayerName : '';

        return new LeafletLayerManager(map, options).addLayerObjs(baseLayerObjs, overlayObjs, showBaseLayerName, showOverlayNames)
    }

    constructor(map, options) {
        this.map = map;
        this.options = extend(true, defaultOptions, options);
        this.baseLayerObjs = [];
        this.overlayObjs = [];
        this._shownBaseLayerObj = null;
        this._shownOverlayObjs = []; // 重なり順を記録
        this._lastZIndex = 0;

        return this;
    }

    _getLayerObjs() {
        // ベース、オーバーレイ問わずレイヤーオブジェすべてを取得
        return this.baseLayerObjs.concat(this.overlayObjs);
    }

    _getLayerId(layer) {
        // レイヤーのidを取得 
        return layer._leaflet_id
    }

    _isBaseLayer(layerObj) {
        // レイヤーがベースレイヤーか判定
        return this.baseLayerObjs.indexOf(layerObj) >= 0
    }

    _sort(sortRule) {
        // ソートする（ソートアルゴリズムは引き数(func)として指定できる）
        if (!sortRule) sortRule = this.options.defaultSortRule;
        this._shownOverlayObjs = this._shownOverlayObjs.sort(sortRule);
    }

    _isShownLayerObj(layerObj) {
        // レイヤーが表示中か判定
        return [this._shownBaseLayerObj].concat(this._shownOverlayObjs).indexOf(layerObj) >= 0;
    }

    _update() {
        // 表示を更新
        this._lastZIndex = 0;
        this.baseLayerObjs.forEach((layerObj) => {
            if (layerObj !== this._shownBaseLayerObj) {
                this._setOpacity(layerObj.layer, 0);
            }
        });
        this._shownBaseLayerObj.layer.setZIndex(this._lastZIndex++);
        this._setOpacity(this._shownBaseLayerObj.layer, this._shownBaseLayerObj._opacity);
        if (!this._shownBaseLayerObj._added) {
            this._shownBaseLayerObj._added = true;
            this.map.addLayer(this._shownBaseLayerObj.layer);
        }

        this.overlayObjs.forEach((layerObj) => {
            if (this._shownOverlayObjs.indexOf(layerObj) < 0) {
                this._setOpacity(layerObj.layer, 0);
            }
        });

        this._shownOverlayObjs.forEach((layerObj) => {
            layerObj.layer.setZIndex(this._lastZIndex++);
            this._setOpacity(layerObj.layer, layerObj._opacity);
            if (!layerObj._added) {
                layerObj._added = true;
                this.map.addLayer(layerObj.layer);
            }
        });
    }

    findByLayer(layer) {
        // レイヤーからレイヤーオブジェを探索する
        return this.findById(this._getLayerId(layer));
    }

    findById(id) {
        // idからレイヤーオブジェを探索する
        const layerObjs = this._getLayerObjs();
        for (var i = 0; i < layerObjs.length; i++) {
            var layerObj = layerObjs[i];
            if (layerObj && this._getLayerId(layerObj.layer) === id) {
                return layerObj
            }
        }
    }

    findByName(name) {
        // nameからレイヤーオブジェを探索する
        const layerObjs = this._getLayerObjs();
        for (var i = 0; i < layerObjs.length; i++) {
            var layerObj = layerObjs[i];
            if (layerObj && layerObj.name === name) {
                return layerObj
            }
        }
    }

    addLayerObjs(baseLayerObjs, overlayObjs, showBaseLayerName, showOverlayNames, sort) {
        // ベースレイヤー、オーバーレイを一度に追加
        if (typeof sort === 'undefined') sort = this.options.defaultSort;
        baseLayerObjs.forEach(layerObj => {
            this.addBaseLayerObj(layerObj, false);
        });
        overlayObjs.forEach(layerObj => {
            this.addOverlayObj(layerObj, false);
            if (showOverlayNames.indexOf(layerObj.name) >= 0) {
                let obj = this.findByName(layerObj.name);
                const index = this._shownOverlayObjs.length;
                this._shownOverlayObjs.splice(index, 0, obj);
            }
        });

        const layerObj = this.findByName(showBaseLayerName);
        if (layerObj) {
            this._shownBaseLayerObj = layerObj;
        } else {
            this._shownBaseLayerObj = this.baseLayerObjs[this.baseLayerObjs.length - 1];
        }
        this._update();
        return this;
    }

    _setupLayerObj(layerObj, opacity) {
        // レイヤーオブジェに内部処理で必要な情報を付加
        return Object.assign({
            _opacity: opacity,
            _added: false
        }, layerObj);
    }

    addBaseLayerObj(layerObj, show = true) {
        // ベースレイヤーを追加
        add(this._setupLayerObj(layerObj, 1), this.baseLayerObjs);
        if (show) {
            this.selectBaseLayer(layerObj.name);
        }
        return this;
    }

    selectBaseLayer(name) {
        // ベースレイヤーを変更する
        const layerObj = this.findByName(name);
        if (layerObj) {
            this._shownBaseLayerObj = layerObj;

            this._update();
        }
        return this;
    }

    addOverlayObj(layerObj, show = true, sort) {
        // オーバーレイを追加
        add(this._setupLayerObj(layerObj, this.options.defaultOpacity), this.overlayObjs);
        if (show) {
            this.showOverlay(layerObj.name, sort);
        }
        return this;
    }

    showOverlay(name, sort, index) {
        // オーバーレイを表示する
        if (typeof sort === 'undefined') sort = this.options.defaultSort;
        let layerObj = this.findByName(name);

        if (layerObj) {
            if (typeof index !== 'number' || index > this._shownOverlayObjs.legth) {
                index = this._shownOverlayObjs.length;
            } else if (index < 0) {
                index = 0;
            }

            // 表示中であれば一度消す
            remove(layerObj, this._shownOverlayObjs);
            // 追加
            this._shownOverlayObjs.splice(index, 0, layerObj);

            if (sort) this._sort();
            this._update();
        }
        return this;
    }

    hideOverlay(name) {
        // オーバーレイを非表示にする
        const layerObj = this.findByName(name);
        if (layerObj) {
            remove(layerObj, this._shownOverlayObjs);
            this._update();
        }
        return this;
    }

    _setOpacity(layer, opacity) {
        // 透過率を変更する
        setOpacityToLayer(layer, opacity);
    }

    setOpacityByName(name, opacity) {
        // nameでレイヤーを指定して透過率を変更する
        const layerObj = this.findByName(name);
        layerObj._opacity = opacity;
        if (this._isShownLayerObj(layerObj)) {
            this._setOpacity(layerObj.layer, opacity);
        }
        return this;
    }

    removeLayer(layer) {
        // レイヤーをマネージャーから削除する
        var layerObj;
        if (typeof layer === 'string') {
            layerObj = this.findByName(layer);
        } else {
            layerObj = this.findByLayer(layer);
        }

        if (layerObj) {
            if (this._isBaseLayer(layerObj)) {
                remove(layerObj, this._baseLayerObjs);
                this._shownBaseLayerObj = this._baseLayerObjs[this._baseLayerObjs.length - 1];
            } else {
                remove(layerObj, this._overLayObjs);
                remove(layerObj, this._shownOverlayObjs);
            }
        }
        this._update();
        return this;
    }

    fitBounds(layer) {
        // レイヤーのfitBoundsを返す
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
        // ソートする
        this._sort(sortRule);
        this._update();
    }
}

export default LeafletLayerManager;