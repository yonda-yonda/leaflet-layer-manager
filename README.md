# LeafletLayerManager
レイヤーの表示/非表示、重なり順、透明度を管理するクラス  
ロジックのみで、表示(DOM要素の生成/操作)とは疎結合としている。

## 使い方
### 初期化
管理するレイヤーの種類(ラスター系,ベクター系)を選択する。  
ラスター系,ベクター系を混在させることはできない。  
同じpaneの内部ではベクター系が必ずラスター系のレイヤーよりも上になる。

#### raster
ラスター系のレイヤーを管理する。  
想定要素: GridLayer, TileLayer, TileLayerWMS, ImageOverlay, VideoOverlay, LayerGroup

```js
var map = L.map("map").setView([35.681236, 139.767125], 10);

var manager = LeafletLayerManager.raster(map);
```

#### vector
ベクター系のレイヤーを管理する。  
想定要素: FeatureGroup, GeoJSON, Path, Polygon, Circle, ...

```js
var map = L.map("map").setView([35.681236, 139.767125], 10);

var manager = LeafletLayerManager.vector(map);
```

### 追加(複数)
```js
manager.setLayers([{
    name: "標準地図",
    layer: L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png", {
        attribution: "<a href='http: //maps.gsi.go.jp/development/ichiran.html'>地理院タイル</a>"
    }),
    props: {
        date: new Date(2020, 1, 1)
    }
}, {
    name: "航空写真",
    layer: L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg", {
        attribution: "<a href='http: //maps.gsi.go.jp/development/ichiran.html'>地理院タイル</a>"
    }),
    props: {
        date: new Date(2010, 1, 1)
    }
}]);

// mannager._lyrs ->
//    0:
//         name: "標準地図",
//         layer: {_url: "https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png" …},
//         props:
//            {data: Tue Feb 01 2020 00:00:00 GMT+0900 (日本標準時)}
//     1:
//         name: "航空写真",
//         layer: {_url: "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg" …},
//         props:
//            {data: Tue Feb 01 2010 00:00:00 GMT+0900 (日本標準時)}
```

#### 引数
##### `layerParams`
`array` 必須
```
[{
    name: {string} レイヤー名(必須),
    layer: {L.layerオブジェクト|layerParams} (必須),
    props: {*} ユーザーが自由に設定できる要素。sortの条件としての利用を想定している。
}]
```

##### `options`
`object` オプション
```
{
    parentName: {string} レイヤーを追加する要素をnameで指定する。"."で区切ることで階層をたどって探索することができる。未指定の場合はmanager直下に要素を追加する。,
    force: {boolean} false(デフォルト)を指定すると同名の要素をすでに管理していた場合その要素をコピーして再利用する(リロードが発生しない)。trueを指定すると新しくlayerを作成、追加する。
}
```


### 追加
```js
manager.add({
    name: "OpenStratMap",
    layer: L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
        attribution: "&copy; <a href='http: //osm.org/copyright'>OpenStreetMap</a> contributors"
    }),
    props: {
        date: new Date(2000, 1, 1)
    }
})
// mannager._lyrs ->
//     0:
//         name: "標準地図"
//     1:
//         name: "航空写真"
//     2:
//         name: "OpenStratMap",
//         layer: {_url: "http://{s}.tile.osm.org/{z}/{x}/{y}.png" …},
//         props:
//            {data: Tue Feb 01 2000 00:00:00 GMT+0900 (日本標準時)}
```

#### 引数
##### `layerParam`
`object` 必須
```
{  
    name: {string} レイヤー名(必須),  
    layer: {L.layerオブジェクト} (必須),  
    props: {*} ユーザーが自由に設定できる要素。sortの条件としての利用を想定している。  
}
```

##### `options`
`object` オプション
```
{  
    parentName: {string} レイヤーを追加する要素をnameで指定する。"."で区切ることで階層をたどって探索することができる。未指定の場合はmanager直下に要素を追加する。  
}
```

### 移動
```js
manager.move(0, 1)

// mannager._lyrs ->
//     0:
//         name: "航空写真"
//     1:
//         name: "標準地図"
//     2:
//         name: "OpenStratMap"
```

#### 引数
##### `from`
`int` 移動したい要素の位置

##### `to`
`int` 新しく移動したい位置

##### `options`
`object` オプション
```
{
    parentName: {string} 移動する要素の親をnameで指定する。"."で区切ることで階層をたどって探索することができる。未指定の場合はmanager直下に要素を移動する。
}
```

### ソート
```js
manager.sort(function (a, b) {
    if (a.props.date < b.props.date) {
        return -1;
    }
    if (a.props.date > b.props.date) {
        return 1;
    }
    return 0;
})

// mannager._lyrs ->
//      0:
//         name: "OpenStratMap",
//         layer: {_url: "http://{s}.tile.osm.org/{z}/{x}/{y}.png" …},
//         props:
//            {data: Tue Feb 01 2000 00:00:00 GMT+0900 (日本標準時)}
//      1:
//         name: "航空写真",
//         layer: {_url: "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg" …},
//         props:
//            {data: Tue Feb 01 2010 00:00:00 GMT+0900 (日本標準時)}
//      2:
//         name: "標準地図",
//         layer: {_url: "https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png" …},
//         props:
//            {data: Tue Feb 01 2020 00:00:00 GMT+0900 (日本標準時)}
```

#### 引数
##### `sortFunc`
`function` ソート順を定義する関数。比較の際はnameやpropsを参照できる。 必須

##### `options`
`object` オプション
```
{
    parentName: {string} ソートする要素の親をnameで指定する。"."で区切ることで階層をたどって探索することができる。未指定の場合はmanager直下に要素をソートする。
}
```

### 最前面へ移動
```js
manager.bringToFront("標準地図")

// mannager._lyrs ->
//     0:
//         name: "航空写真"
//     1:
//         name: "OpenStratMap"
//     2:
//         name: "標準地図"
```

#### 引数
##### `name`
`string` レイヤー名 必須

##### `options`
`object` オプション
```
{
    parentName: {string} 移動する要素の親をnameで指定する。"."で区切ることで階層をたどって探索することができる。未指定の場合はmanager直下に要素を移動する。
}
```

### 最背面へ移動
```js
manager.bringToBack("標準地図")

// mannager._lyrs ->
//     0:
//         name: "標準地図"
//     1:
//         name: "航空写真"
//     2:
//         name: "OpenStratMap"
```

#### 引数
##### `name`
`string` レイヤー名 必須

##### `options`
`object` オプション
```
{
    parentName: {string} 移動する要素の親をnameで指定する。"."で区切ることで階層をたどって探索することができる。未指定の場合はmanager直下に要素を移動する。
}
```

### 置き換え
```js
manager.replaceLayer({
    name: "標準地図",
    layer: L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/english/{z}/{x}/{y}.png", {
        attribution: "<a href='http: //maps.gsi.go.jp/development/ichiran.html'>地理院タイル</a>"
    }),
    props: {
        date: new Date(1990, 1, 1)
    }
})

// mannager._lyrs ->
//     0:
//         name: "標準地図"
//         layer: {_url: "https://cyberjapandata.gsi.go.jp/xyz/english/{z}/{x}/{y}.png" …},
//         props:
//            {data: Tue Feb 01 1990 00:00:00 GMT+0900 (日本標準時)}
//     1:
//         name: "航空写真"
//     2:
//         name: "OpenStratMap"
```

#### 引数
##### `layerParam`
`object` 必須
```
{  
    name: {string} レイヤー名(必須)　この値とnameが一致する要素と入れ替える ,  
    layer: {L.layerオブジェクト} (必須),  
    props: {*} ユーザーが自由に設定できる要素。sortの条件としての利用を想定している。  
}
```

##### `options`
`object` オプション
```
{
    parentName: {string} 置き換える要素の親をnameで指定する。"."で区切ることで階層をたどって探索することができる。未指定の場合はmanager直下に要素を置き換える。
}
```

### 削除
```js
manager.remove("航空写真");
// mannager._lyrs ->
//     0:
//         name: "標準地図"
//     1:
//         name: "OpenStratMap"
```

#### 引数
##### `name`
`string` レイヤー名 必須

##### `options`
`object`
```
{
    parentName: {string} 削除する要素の親をnameで指定する。"."で区切ることで階層をたどって探索することができる。未指定の場合はmanager直下に要素を削除する。
}
```

### リセット
```js
manager.reset();

// mannager._lyrs -> 
//    []
```

#### 引数
##### `name`
`string` レイヤー名 必須

##### `options`
`object` オプション
```
{
    parentName: {string} リセットする要素をnameで指定する。"."で区切ることで階層をたどって探索することができる。未指定の場合はmanager直下をリセットする。
}
```

### 透過度
```js
manager.setOpacity("標準地図", 0.5)
```

##### `name`
`string` レイヤー名 必須

##### `name`
`number` 透過率 必須

##### `options`
`object` オプション
```
{
    parentName: {string} 透過率を変更する要素の親をnameで指定する。"."で区切ることで階層をたどって探索することができる。未指定の場合はmanager直下に要素の透過率を変更する。
}
```

### スタイル(vectorのみ)
```js
manager.setStyle("cirlce", {fillColor: "blue"})
```
##### `name`
`string` レイヤー名 必須

##### `style`
`object` スタイル設定 必須

##### `options`
`object` オプション
```
{
    parentName: {string} スタイルを変更する要素の親をnameで指定する。"."で区切ることで階層をたどって探索することができる。未指定の場合はmanager直下に要素のスタイルを変更する。
}
```
