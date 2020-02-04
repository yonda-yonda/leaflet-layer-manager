import 'core-js/stable';
import 'regenerator-runtime/runtime';
import extend from 'jquery-extend';

const VERSION = '0.0.1';

const defaultOptions = {
    defaultOpacity: 1,
    defaultSortRule: function (a, b) {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    },
    baseZIndex: 0
}

const adjustIndex = (index, list) => {
    if (typeof index !== 'number' || index > list.length) {
        index = list.length;
    } else if (index < 0) {
        index = 0;
    }
    return index
}

const add = (target, list, index = undefined) => {
    list.splice(adjustIndex(index, list), 0, target);
}

const remove = (target, list) => {
    if (list.includes(target)) list.splice(list.indexOf(target), 1);
}

class Lyr {
    constructor(name, layer, params = {}) {
        this.name = name;
        this.layer = layer;
        this.params = params;

        this._opacity = 1;
        this._hidden = true;
        this._map = null;
    }

    isShown() {
        // 表示状態にあるかのチェック
        return this._hidden === false;
    }

    isAdded() {
        // 地図に追加済みかのチェック
        return this._map !== null;
    }

    getLayerId() {
        // レイヤーのidを取得
        return this.layer._leaflet_id
    }

    setOpacity(opacity) {
        // opacityの値を保持し、表示状態の場合opacityを変更
        this._opacity = opacity;
        if (!this._hidden && typeof this.layer.setOpacity === 'function') {
            this.layer.setOpacity(this._opacity);
        }
    }

    setZIndex(zIndex) {
        // zIndexを設定し、加算して返却
        // レイヤーは以下のグループがあり、 マネージャーはグループを区別しない。
        // 1. tilePane(ex: TileLayer)
        // 2. overlayPane(ex: Layer, ImageOverlay, VideoOverlay, SVG)
        // 3. markerPane(ex: Marker)
        // 4. tooltipPane(ex: Tooltip)
        // 5. popupPane(ex: Popup)
        // 数字が大きいほど上に重なる。
        // zIndexを設定してもLeafletの各グループ内の重なり順しか制御することはできない。
        // https://github.com/Leaflet/Leaflet/blob/3b9fe956e2d972b4f60ec1476e3f574d8ce549c3/src/map/Map.js#L1136
        if (typeof this.layer.setZIndex === 'function') {
            // GridLayer, ImageOverlay, LayerGroup, 
            this.layer.setZIndex(zIndex);
            return zIndex + 1
        } else if (typeof this.layer.setZIndexOffset === 'function') {
            // Marker
            this.layer.setZIndexOffset(zIndex);
            return zIndex + 1
        }
        return zIndex
    }

    show() {
        // 表示状態に変更し、opacityを保持していた値に設定
        this._hidden = false;
        if (typeof this.layer.setOpacity === 'function') {
            this.layer.setOpacity(this._opacity);
        }
    }

    hide() {
        // 非表示状態に変更し、opacityを0に設定
        this._hidden = true;
        if (typeof this.layer.setOpacity === 'function') {
            this.layer.setOpacity(0);
        }
    }

    addToMap(map) {
        // 地図に追加
        if (map && !this.isAdded()) {
            this.layer.addTo(map);
            this._map = map;
        }
    }

    removeFromMap() {
        // 地図から削除
        if (this.isAdded()) {
            this.layer.removeLayer(this._map);
            this._map = null;
        }
    }
}

class LyrGroup {
    constructor(name, lyrs = [], params = {}) {
        this.name = name;
        this._lyrs = lyrs; //表示順
        this.params = params;
        this._shownLyrNames = lyrs.map((lyr) => {
            return lyr.name;
        }); // 表示状態を保持
        this._opacity = 1;
        this._hidden = true;
        this._map = null;
        this._minZIndex = 0;
        this._maxZIndex = 0;
    }

    setOpacity(opacity) {
        // opacityの値を保持し、表示状態の場合全レイヤーのopacityを変更
        this._opacity = opacity;
        if (!this._hidden) {
            this._lyrs.forEach((lyr) => {
                lyr.setOpacity(opacity);
            })
        }
    }

    setZIndex(zIndex, all = false) {
        // 表示順通りに重なり順を更新する、レイヤー数分加算したzIndexを返却する
        this._minZIndex = zIndex;
        this._maxZIndex = zIndex + this._shownLyrNames.length;
        let z = zIndex;

        this._lyrs.forEach((lyr) => {
            if (all === true || this._shownLyrNames.includes(lyr.name)) {
                z = lyr.setZIndex(z);
            }
        });
        return z;
    }

    isShown(name) {
        // 表示状態か判定、引数にnameが指定されている場合、子要素の表示状態を判定
        if (typeof name === 'string') {
            const lyr = this.findByName(name);
            return lyr.isShown();
        } else {
            return this._hidden === false;
        }
    }

    isAdded(name) {
        // 地図に追加済みか判定、引数にnameが指定されている場合、子要素が追加済みかを判定
        if (typeof name === 'string') {
            const lyr = this.findByName(name);
            return lyr.isAdded();
        } else {
            return this._map !== null;
        }
    }

    _update() {
        // 重なり順と表示を制御
        // zIndexは事前にsetZIndexで設定したmax値を越えることはできない。
        let zIndex = this._minZIndex;
        if (this.isShown()) {
            this._lyrs.forEach((lyr) => {
                if (!this._shownLyrNames.includes(lyr.name)) {
                    lyr.hide();
                } else {
                    if (zIndex > this._maxZIndex) zIndex = this._maxZIndex;
                    lyr.setZIndex(zIndex++);

                    if (!lyr.isAdded()) {
                        lyr.addToMap(this._map);
                    }
                    lyr.show();
                }
            });
        }
    }

    show() {
        // グループを表示状態にする
        // 保存していた子要素の重なり順と表示順を再現する
        this._hidden = false;
        this._update();
    }

    hide() {
        // グループを非表示状態にする
        // 子要素をすべて非表示にする
        this._hidden = true;
        this._shownLyrNames.forEach((name) => {
            const lyr = this.findByName(name);
            lyr.hide();
        })
    }

    addToMap(map) {
        // グループを地図に追加する
        // 子要素すべてが対象
        if (map && !this.isAdded()) {
            this._lyrs.forEach((lyr) => {
                lyr.addToMap(map);
            });
            this._map = map;
        }
    }

    removeFromMap() {
        // グループを地図から削除する
        // 子要素すべてが対象
        if (this.isAdded()) {
            this._lyrs.forEach((lyr) => {
                lyr.removeFromMap();
            });
            this._map = null;
        }
    }

    addLyr(lyr, show = true, index = undefined) {
        // レイヤーをグループに加える
        // showフラグが立っているときは追加と同時に表示する、また表示順を指定できる
        add(lyr, this._lyrs, index);
        lyr.setOpacity(this._opacity);
        if (show === true) {
            this.showLyr(lyr.name)
        }
    }

    showLyr(name, toFront = false) {
        // レイヤーを表示する
        // また最前面に移動することができる
        const lyr = this.findByName(name);

        if (lyr && !this._shownLyrNames.includes(name)) {
            add(name, this._shownLyrNames);
            if (toFront === true) {
                const before = this.getIndexByName(name);
                const after = this._lyrs.length;
                this.move(before, after)
            }
            this._update();
        }
    }

    hideLyr(name) {
        // レイヤーを非表示にする(表示リストから削除し更新)
        const lyr = this.findByName(name);
        if (lyr) {
            remove(name, this._shownLyrNames);
            this._update();
        }
    }

    removeLyr(name) {
        // レイヤーをグループから削除する
        // 地図からも削除
        const lyr = this.findByName(name);

        if (lyr) {
            remove(lyr, this._lyrs);
            remove(lyr.name, this._shownLyrNames);
            lyr.removeFromMap();
        }
    }

    move(from, to) {
        // レイヤーの並び順を変更する
        from = adjustIndex(from, this._lyrs);
        to = adjustIndex(to, this._lyrs);
        if (from < this._lyrs.length) {
            const lyr = this._lyrs.splice(from, 1)[0];

            this._lyrs.splice(to, 0, lyr);
            this._update();
        }
    }

    _sort(sortRule) {
        // レイヤーをLyrオブジェクトの情報を元に並び替え
        if (sortRule) {
            this._lyrs.sort(sortRule);
        }
    }

    sort(sortRule = undefined) {
        // 表示レイヤーの重なり順をソートする
        if (sortRule) {
            this._sort(sortRule);
            this._update();
        }
    }

    getIndexByName(name) {
        for (let i = 0; i < this._lyrs.length; i++) {
            if (this._lyrs[i].name === name) return i;
        }
        return -1;
    }

    getIndexByLayer(layer) {
        for (let i = 0; i < this._lyrs.length; i++) {
            if (this._lyrs[i].layer === layer) return i;
        }
        return -1;
    }

    findByName(name) {
        // 名前で検索し子要素のレイヤーを返す
        const index = this.getIndexByName(name);
        if (index >= 0) return this._lyrs[index];
    }

    findByLayer(layer) {
        // オブジェクトで検索し子要素のレイヤーを返す
        const index = this.getIndexByName(layer);
        if (index >= 0) return this._lyrs[index];
    }
}

class LeafletLayerManager {
    static create(map, params) {
        const baseLyrs = typeof params !== 'undefined' && typeof params.baseLyrs !== 'undefined' ? params.baseLyrs : [];
        const lyrs = typeof params !== 'undefined' && typeof params.lyrs !== 'undefined' ? params.lyrs : [];
        const managerOptions = typeof params !== 'undefined' && typeof params.managerOptions !== 'undefined' ? params.managerOptions : {};
        const showLyrNames = typeof params !== 'undefined' && typeof params.showLyrNames !== 'undefined' ? params.showLyrNames : [];
        const selectedBaseLyrName = typeof params !== 'undefined' && typeof params.selectedBaseLyrName !== 'undefined' ? params.selectedBaseLyrName : '';

        const m = new LeafletLayerManager(map, managerOptions);

        baseLyrs.forEach((lyr) => {
            m.addBaseLyr(lyr, false);
        })
        lyrs.forEach((lyr) => {
            m.addLyr(lyr, false);
        });
        m._selectedBaseLyrName = selectedBaseLyrName;
        m._shownLyrNames = showLyrNames;
        m._update();
        return m;
    }

    static createLyr(name, layer, params = {}) {
        if (Array.isArray(layer)) {
            const lyrs = layer.map((l) => {
                return new Lyr(l.name, l.layer, l.params)
            })
            return new LyrGroup(name, lyrs, params)
        } else {
            return new Lyr(name, layer, params)
        }
    }

    constructor(map, options = {}) {
        this.map = map;
        this.options = extend(true, defaultOptions, options);
        this._baseLyrs = [];
        this._lyrs = [];
        this._selectedBaseLyrName = '';
        this._shownLyrNames = [];
        this._baseZIndex = this.options.baseZIndex;
        this._lastZIndex = this.options.baseZIndex;
        this._defaultSortRule = this.defaultSortRule;
        this.ver = VERSION;
        return this;
    }

    _getLyrs() {
        // ベース、オーバーレイ問わずレイヤーすべてを取得
        return this._baseLyrs.concat(this._lyrs);
    }

    _isBaseLyr(lyr) {
        // 引数で指定されたnameのレイヤーがベースレイヤーか判定
        return this._baseLyrs.includes(lyr);
    }

    _sort(sortRule, deeply = false) {
        // 表示中のレイヤーをLyrオブジェクトの情報を元に並び替え
        if (!sortRule) sortRule = this.options.defaultSortRule;
        this._lyrs.sort(sortRule);
        if (deeply === true) {
            this._lyrs.forEach((lyr) => {
                if (lyr instanceof LyrGroup) {
                    lyr._sort(sortRule);
                }
            })
        }
    }

    _addAttribution(lyr) {
        if (lyr instanceof LyrGroup) {
            lyr._lyrs.forEach((l) => {
                this._addAttribution(l);
            })
        } else {
            if (typeof lyr.layer.options !== "undefined" && typeof lyr.layer.options.attribution !== "undefined") {
                this.map.attributionControl.addAttribution(lyr.layer.options.attribution)
            }
        }

    }

    _removeAttribution(lyr) {
        if (lyr instanceof LyrGroup) {
            lyr._lyrs.forEach((l) => {
                this._removeAttribution(l);
            })
        } else {
            if (typeof lyr.layer.options !== "undefined" && typeof lyr.layer.options.attribution !== "undefined") {
                this.map.attributionControl.removeAttribution(lyr.layer.options.attribution)
            }
        }
    }

    _update() {
        // 表示を更新、地図に追加されていないレイヤーは追加する
        this._lastZIndex = this._baseZIndex;
        this._baseLyrs.forEach((lyr) => {
            if (lyr.name !== this._selectedBaseLyrName) {
                lyr.hide();
                this._removeAttribution(lyr);
            }
        });
        const baseLyr = this.findByName(this._selectedBaseLyrName);
        if (baseLyr) {
            if (!baseLyr.isAdded()) {
                baseLyr.addToMap(this.map);
            }
            baseLyr.show();
            this._addAttribution(baseLyr);
            this._lastZIndex = baseLyr.setZIndex(this._lastZIndex);
        }

        this._lyrs.forEach((lyr) => {
            if (!this._shownLyrNames.includes(lyr.name)) {
                lyr.hide();
                this._removeAttribution(lyr);
            } else {
                if (!lyr.isAdded()) {
                    lyr.addToMap(this.map);
                }
                lyr.show();
                this._addAttribution(lyr);
                this._lastZIndex = lyr.setZIndex(this._lastZIndex);
            }
        });
    }

    move(from, to) {
        // レイヤーの並び順を変更する
        from = adjustIndex(from, this._lyrs);
        to = adjustIndex(to, this._lyrs);
        if (from < this._lyrs.length) {
            const lyr = this._lyrs.splice(from, 1)[0];

            this._lyrs.splice(to, 0, lyr);
            this._update();
        }
    }

    getIndexByName(name) {
        const lyrs = this._getLyrs();
        for (let i = 0; i < lyrs.length; i++) {
            if (lyrs[i].name === name) {
                return i
            }
        }
        return -1;
    }

    getIndexByLayer(layer) {
        const lyrs = this._getLyrs();
        for (let i = 0; i < lyrs.length; i++) {
            if (lyrs[i].layer === layer) {
                return i
            }
        }
        return -1;
    }

    findByName(name) {
        // 引数で指定されたnameのLyrを返す。
        const index = this.getIndexByName(name);
        const lyrs = this._getLyrs();
        if (index >= 0) return lyrs[index];
    }

    findByLayer(layer) {
        // 引数で指定されたlayerのLyrを返す。
        // 引数で指定されたnameのLyrを返す。
        const index = this.getIndexByLayer(layer);
        const lyrs = this._getLyrs();
        if (index >= 0) return lyrs[index];
    }

    addBaseLyr(lyr, selected = true) {
        // Lyrをベースレイヤーに追加
        add(lyr, this._baseLyrs);
        lyr.setOpacity(this.options.defaultOpacity);
        if (selected) {
            this.selectBaseLyr(lyr.name);
        }
    }

    selectBaseLyr(name) {
        // ベースレイヤーを変更する
        const lyr = this.findByName(name);
        if (this._isBaseLyr(lyr)) {
            this._selectedBaseLyrName = lyr.name;
            this._update();
        }
    }

    addLyr(lyr, show = true, index = undefined) {
        // Lyrを追加
        add(lyr, this._lyrs, index);
        lyr.setOpacity(this.options.defaultOpacity);
        if (show === true) {
            this.showLyr(lyr.name)
        }
    }

    showLyr(name, toFront = false) {
        // Lyrを表示する
        const lyr = this.findByName(name);

        if (lyr && !this._shownLyrNames.includes(name)) {
            add(name, this._shownLyrNames);
            if (toFront === true) {
                const before = this.getIndexByName(name);
                const after = this._lyrs.length;
                this.move(before, after)
            }
            this._update();
        }
    }

    hideLyr(name) {
        // Lyrを非表示にする
        const lyr = this.findByName(name);
        if (lyr) {
            remove(name, this._shownLyrNames);
            this._update();
        }
    }

    removeLyr(name) {
        // Lyrを削除にする
        const lyr = this.findByName(name);

        if (lyr) {
            if (this._isBaseLyr(lyr)) {
                remove(layerObj, this._baseLyrs);
                if (this._shownBaseLyrName === lyr.name) {
                    this._shownBaseLyrName = '';
                }
            } else {
                remove(lyr, this._lyrs);
                remove(lyr.name, this._shownLyrNames);
            }
            lyr.removeFromMap();
        }
    }

    setOpacity(name, opacity) {
        // nameでレイヤーを指定して透過率を変更する
        const lyr = this.findByName(name);
        if (lyr) {
            lyr.setOpacity(opacity);
        }
    }

    isShown(name) {
        // 引数で指定されたnameのレイヤーが表示状態か判定
        const lyr = this.findByName(name);
        return !lyr && lyr._isShown();
    }

    sort(sortRule, deeply = false) {
        // ソートする（ソートアルゴリズムは引き数(func)として指定できる）
        this._sort(sortRule, deeply);
        this._update();
    }

    group(name, methodName, ...params) {
        // nameを指定したグループレイヤーのfunctionを実行する
        const lyr = this.findByName(name);
        if (lyr instanceof LyrGroup && typeof lyr[methodName] === 'function') {
            return lyr[methodName](...params);
        }
    }
}


export default LeafletLayerManager;