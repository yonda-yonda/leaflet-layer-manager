function assertLayers(actual, expected) {
	// インスタンス内で正しい順序となっているか確認
	for (let i = 0; i < expected.length; i++) {
		chai.assert.equal(actual[i].name, expected[i].name);

		if (typeof expected[i].props !== 'undefined') {
			chai.assert.deepEqual(actual[i].props, expected[i].props);
		}

		if (Array.isArray(expected[i].layer)) {
			assertLayers(actual[i]._lyrs, expected[i].layer)
		} else {
			chai.assert.strictEqual(actual[i].layer, expected[i].layer)
		}
	}
}

function assertPanes(paneElement, expected) {
	// 実際にインスタンスのpaneに追加されているか確認
	function assertPane(paneElement, layer) {
		chai.assert.strictEqual(paneElement, layer.getPane());
	}

	for (let i = 0; i < expected.length; i++) {
		if (Array.isArray(expected[i].layer)) {
			assertPanes(paneElement, expected[i].layer);
		} else if (typeof expected[i].layer._layers !== 'undefined') {
			const layers = expected[i].layer._layers;
			const keys = Object.keys(layers);
			for (let j = 0; j < keys.length; j++) {
				assertPane(paneElement, layers[keys[j]]);
			}
		} else {
			assertPane(paneElement, expected[i].layer);
		}
	}
}

function assertProperties(actual, propName, value) {
	// インスタンス内で正しい順序となっているか確認
	if (Array.isArray(actual._lyrs)) {
		for (let i = 0; i < actual._lyrs.length; i++) {
			assertProperties(actual._lyrs[i], propName, value)
		}
	} else if (typeof actual.layer._layers !== 'undefined') {
		const layers = actual.layer._layers;
		const keys = Object.keys(layers);
		for (let i = 0; i < keys.length; i++) {
			chai.assert.strictEqual(layers[keys[i]].options[propName], value)
		}
	} else {
		chai.assert.strictEqual(actual.layer.options[propName], value)
	}
}


const vectorLayerParams = [{
	name: "line",
	layer: L.geoJSON({
		"type": "LineString",
		"coordinates": [
			[139.7021484375, 35.71083783530008],
			[139.7900390625, 35.63944106897394]
		]
	}, {
		"color": "#ff7800",
		"weight": 5,
		"opacity": 0.65
	}),
	props: {
		date: new Date(1990, 1, 1)
	}
}, {
	name: "circle",
	layer: L.circle([35.71083783530008, 139.7021484375], {
		radius: 5000,
		fillColor: "red",
		fillOpacity: 1,
		color: "transpalent",
		opacity: 0
	}),
	props: {
		date: new Date(1999, 1, 1)
	}
}, {
	name: "features",
	layer: L.featureGroup([L.circle([35.71083783530008, 139.7021484375], {
		radius: 2000,
		fillColor: "blue",
		fillOpacity: 1,
		color: "transpalent",
		opacity: 0
	}), L.circle([35.71083783530008, 139.7021484375], {
		radius: 1000,
		fillColor: "green",
		fillOpacity: 1,
		color: "transpalent",
		opacity: 0
	})]),
	props: {
		date: new Date(1970, 1, 1)
	}
}, {
	name: "circles",
	layer: [{
		name: "circle1",
		layer: L.circle([35.63944106897394, 139.8779296875], {
			radius: 5000,
			fillColor: "red",
			fillOpacity: 1,
			color: "transpalent",
			opacity: 0
		}),
		props: {
			date: new Date(1989, 1, 1)
		}
	}, {
		name: "circle2",
		layer: L.circle([35.63944106897394, 139.8779296875], {
			radius: 5000,
			fillColor: "red",
			fillOpacity: 1,
			color: "transpalent",
			opacity: 0
		}),
		props: {
			date: new Date(1988, 1, 1)
		}
	}, {
		name: "circle3",
		layer: [{
			name: "circle4",
			layer: L.circle([35.63944106897394, 139.8779296875], {
				radius: 5000,
				fillColor: "red",
				fillOpacity: 1,
				color: "transpalent",
				opacity: 0
			}),
			props: {
				date: new Date(1989, 1, 1)
			}
		}, {
			name: "circle5",
			layer: L.circle([35.63944106897394, 139.8779296875], {
				radius: 5000,
				fillColor: "red",
				fillOpacity: 1,
				color: "transpalent",
				opacity: 0
			}),
			props: {
				date: new Date(1988, 1, 1)
			}
		}],
		props: {
			date: new Date(1987, 1, 1)
		}
	}],
	props: {
		date: new Date(1999, 1, 1)
	}
}];

const rasterLayerParams = [{
	name: "raster1",
	layer: L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png", {
		attribution: "<a href='http: //maps.gsi.go.jp/development/ichiran.html'>地理院タイル</a>"
	}),
	props: {
		date: new Date(2020, 1, 1)
	}
}, {
	name: "raster2",
	layer: L.layerGroup([L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png", {
		attribution: "<a href='http: //maps.gsi.go.jp/development/ichiran.html'>地理院タイル</a>"
	}), L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg", {
		attribution: "<a href='http: //maps.gsi.go.jp/development/ichiran.html'>地理院タイル</a>"
	})]),
	props: {
		date: new Date(2010, 1, 1)
	}
}, {
	name: "raster3",
	layer: [{
		name: "OpenStratMap",
		layer: L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
			attribution: "&copy; <a href='http: //osm.org/copyright'>OpenStreetMap</a> contributors"
		}),
		props: {
			date: new Date(2015, 1, 1)
		}
	}, {
		name: "png1",
		layer: L.imageOverlay("./dummy.png", L.latLngBounds(
			[35.67514743608467, 139.74609375],
			[35.6037187406973, 139.833984375]
		)),
		props: {
			date: new Date(2005, 1, 1)
		}
	}, {
		name: "group",
		layer: [{
			name: 'png2',
			layer: L.imageOverlay("./dummy.png", L.latLngBounds(
				[35.63944106897394, 139.7900390625],
				[35.56798045801208, 139.8779296875]
			))
		}, {
			name: 'png3',
			layer: L.imageOverlay("./dummy.png", L.latLngBounds(
				[35.63944106897394, 139.74609375],
				[35.56798045801208, 139.833984375]
			))
		}],
		props: {
			date: new Date(1995, 1, 1)
		}
	}],
	props: {
		date: new Date(2000, 1, 1)
	}
}];

describe('初期化', () => {
	let map, mapElement, manager;
	const pane = 'custom';
	beforeEach(function () {
		mapElement = document.createElement('div');
		mapElement.setAttribute('id', 'map');
		document.querySelector('body').append(mapElement);
		map = L.map('map').setView([35.681236, 139.767125], 10);
	});

	afterEach(function () {
		mapElement.parentNode.removeChild(mapElement);
	})

	it('init', () => {
		manager = LeafletLayerManager.raster(map, pane);
		chai.assert.strictEqual(manager._map, map);
		chai.assert.isTrue(typeof map.getPane(pane) !== 'undefined');
	})
});


describe('追加', () => {
	let map, mapElement, manager;
	const pane = 'custom';
	beforeEach(function () {
		mapElement = document.createElement('div');
		mapElement.setAttribute('id', 'map');
		document.querySelector('body').append(mapElement);
		map = L.map('map').setView([35.681236, 139.767125], 10);
	});

	afterEach(function () {
		mapElement.parentNode.removeChild(mapElement);
	});

	it('add(raster)', () => {
		manager = LeafletLayerManager.raster(map, pane);

		for (let i = 0; i < rasterLayerParams.length; i++) {
			manager.add(rasterLayerParams[i]);
		}
		assertLayers(manager._lyrs, rasterLayerParams)
		assertPanes(map.getPane(pane), rasterLayerParams)
	});

	it('add(vector)', () => {
		manager = LeafletLayerManager.vector(map, pane);

		for (let i = 0; i < vectorLayerParams.length; i++) {
			manager.add(vectorLayerParams[i]);
		}

		assertLayers(manager._lyrs, vectorLayerParams)
		assertPanes(map.getPane(pane), vectorLayerParams)
	});

	it('setLayers(raster)', () => {
		manager = LeafletLayerManager.raster(map, pane);
		manager.add(rasterLayerParams[rasterLayerParams.length - 1]); // すでに存在するレイヤーはsetLayersで再利用される
		manager.setLayers(rasterLayerParams);
		assertLayers(manager._lyrs, rasterLayerParams)
		assertPanes(map.getPane(pane), rasterLayerParams)
	});

	it('setLayers(vector)', () => {
		manager = LeafletLayerManager.vector(map, pane);
		manager.add(vectorLayerParams[vectorLayerParams.length - 1]); // すでに存在するレイヤーはsetLayersで再利用される
		manager.setLayers(vectorLayerParams);

		assertLayers(manager._lyrs, vectorLayerParams)
		assertPanes(map.getPane(pane), vectorLayerParams)
	});
});

describe('削除', () => {
	let map, mapElement, manager;
	const pane = 'custom';
	beforeEach(function () {
		mapElement = document.createElement('div');
		mapElement.setAttribute('id', 'map');
		document.querySelector('body').append(mapElement);
		map = L.map('map').setView([35.681236, 139.767125], 10);
	});

	afterEach(function () {
		mapElement.parentNode.removeChild(mapElement);
	});

	it('remove(raster)', () => {
		manager = LeafletLayerManager.raster(map, pane);
		manager.setLayers(rasterLayerParams);
		const raster1 = manager.findByName('raster1');
		chai.assert.isTrue(raster1.layer._map !== null);
		manager.remove('raster1');
		chai.assert.isTrue(raster1.layer._map === null);

		const png2 = manager.findByName('png2', {
			parentName: 'raster3.group'
		});
		chai.assert.isTrue(png2.layer._map !== null);
		manager.remove('png2', {
			parentName: 'raster3.group'
		});
		chai.assert.isTrue(png2.layer._map === null);
	});

	it('remove(vector)', () => {
		manager = LeafletLayerManager.vector(map, pane);
		manager.setLayers(vectorLayerParams);
		const line = manager.findByName('line');
		chai.assert.isTrue(line.layer._map !== null);
		manager.remove('line');
		chai.assert.isTrue(line.layer._map === null);

		const png2 = manager.findByName('circle4', {
			parentName: 'circles.circle3'
		});
		chai.assert.isTrue(png2.layer._map !== null);
		manager.remove('circle4', {
			parentName: 'circles.circle3'
		});
		chai.assert.isTrue(png2.layer._map === null);
	});

	it('reset(raster)', () => {
		manager = LeafletLayerManager.raster(map, pane);

		function getLayers(arr, params) {
			for (let i = 0; i < params.length; i++) {
				if (Array.isArray(params[i].layer)) {
					getLayers(arr, params[i].layer)
				} else if (typeof params[i].layer._layers !== 'undefined') {
					const layers = params[i].layer._layers;
					const keys = Object.keys(layers);
					for (let j = 0; j < keys.length; j++) {
						arr.push(layers[keys[j]]);
					}
				} else {
					arr.push(params[i].layer)
				}
			}
			return arr;
		}
		const layers = getLayers([], rasterLayerParams);
		manager.setLayers(rasterLayerParams);
		for (let i = 0; i < layers.length; i++) {
			chai.assert.isTrue(layers[i]._map !== null);
		}
		manager.reset();
		for (let i = 0; i < layers.length; i++) {
			chai.assert.isTrue(layers[i]._map === null);
		}
	});
	it('reset(vector)', () => {
		manager = LeafletLayerManager.vector(map, pane);

		function getLayers(arr, params) {
			for (let i = 0; i < params.length; i++) {
				if (Array.isArray(params[i].layer)) {
					getLayers(arr, params[i].layer)
				} else if (typeof params[i].layer._layers !== 'undefined') {
					const layers = params[i].layer._layers;
					const keys = Object.keys(layers);
					for (let j = 0; j < keys.length; j++) {
						arr.push(layers[keys[j]]);
					}
				} else {
					arr.push(params[i].layer)
				}
			}
			return arr;
		}
		const layers = getLayers([], vectorLayerParams);
		manager.setLayers(vectorLayerParams);
		for (let i = 0; i < layers.length; i++) {
			chai.assert.isTrue(layers[i]._map !== null);
		}
		manager.reset();
		for (let i = 0; i < layers.length; i++) {
			chai.assert.isTrue(layers[i]._map === null);
		}
	});
});

describe('入れ替え', () => {
	let map, mapElement, manager;
	const pane = 'custom';
	beforeEach(function () {
		mapElement = document.createElement('div');
		mapElement.setAttribute('id', 'map');
		document.querySelector('body').append(mapElement);
		map = L.map('map').setView([35.681236, 139.767125], 10);
	});

	afterEach(function () {
		mapElement.parentNode.removeChild(mapElement);
	});

	it('replaceLayer(raster)', () => {
		manager = LeafletLayerManager.raster(map, pane);
		manager.setLayers(rasterLayerParams);

		const replaceParam1 = {
			name: 'raster1',
			layer: L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg", {
				attribution: "<a href='http: //maps.gsi.go.jp/development/ichiran.html'>地理院タイル</a>"
			})
		}
		chai.assert.isTrue(manager._lyrs[0].layer === rasterLayerParams[0].layer); // before
		manager.replaceLayer(replaceParam1);
		chai.assert.isTrue(manager._lyrs[0].layer !== rasterLayerParams[0].layer); // after
		chai.assert.isTrue(manager._lyrs[0].layer === replaceParam1.layer);


		const replaceParam2 = {
			name: 'png3',
			layer: L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg", {
				attribution: "<a href='http: //maps.gsi.go.jp/development/ichiran.html'>地理院タイル</a>"
			})
		}
		chai.assert.isTrue(manager._lyrs[2]._lyrs[2]._lyrs[1].layer === rasterLayerParams[2].layer[2].layer[1].layer); // before
		manager.replaceLayer(replaceParam2, {
			parentName: 'raster3.group'
		});
		chai.assert.isTrue(manager._lyrs[2]._lyrs[2]._lyrs[1].layer !== rasterLayerParams[2].layer[2].layer[1].layer); // after
		chai.assert.isTrue(manager._lyrs[2]._lyrs[2]._lyrs[1].layer === replaceParam2.layer);
	});

	it('replaceLayer(vector)', () => {
		manager = LeafletLayerManager.vector(map, pane);
		manager.setLayers(vectorLayerParams);


		const replaceParam1 = {
			name: 'line',
			layer: L.geoJSON({
				"type": "LineString",
				"coordinates": [
					[0, 0],
					[90, 45]
				]
			})
		}
		chai.assert.isTrue(manager._lyrs[0].layer === vectorLayerParams[0].layer); // before
		manager.replaceLayer(replaceParam1);
		chai.assert.isTrue(manager._lyrs[0].layer !== vectorLayerParams[0].layer); // after
		chai.assert.isTrue(manager._lyrs[0].layer === replaceParam1.layer);

		const replaceParam2 = {
			name: "circle5",
			layer: L.circle([35, 139], {
				radius: 1000
			})
		}
		chai.assert.isTrue(manager._lyrs[3]._lyrs[2]._lyrs[1].layer === vectorLayerParams[3].layer[2].layer[1].layer); // before
		manager.replaceLayer(replaceParam2, {
			parentName: 'circles.circle3'
		});
		chai.assert.isTrue(manager._lyrs[3]._lyrs[2]._lyrs[1].layer !== vectorLayerParams[3].layer[2].layer[1].layer); // after
		chai.assert.isTrue(manager._lyrs[3]._lyrs[2]._lyrs[1].layer === replaceParam2.layer);
	});
});

describe('移動', () => {
	let map, mapElement, manager;
	const pane = 'custom';
	beforeEach(function () {
		mapElement = document.createElement('div');
		mapElement.setAttribute('id', 'map');
		document.querySelector('body').append(mapElement);
		map = L.map('map').setView([35.681236, 139.767125], 10);
	});

	afterEach(function () {
		mapElement.parentNode.removeChild(mapElement);
	});

	it('move', () => {
		manager = LeafletLayerManager.raster(map, pane);
		manager.setLayers(rasterLayerParams);

		chai.assert.isTrue(manager._lyrs[0].layer === rasterLayerParams[0].layer); // before
		chai.assert.isTrue(manager._lyrs[2]._lyrs[0].layer === rasterLayerParams[2].layer[0].layer);
		manager.move(0, 2);
		chai.assert.isTrue(manager._lyrs[2].layer === rasterLayerParams[0].layer); // after
		chai.assert.isTrue(manager._lyrs[1]._lyrs[0].layer === rasterLayerParams[2].layer[0].layer);
	});

	it('sort(root)', () => {
		manager = LeafletLayerManager.raster(map, pane);
		const sorted = $.extend(true, [], rasterLayerParams);

		manager.setLayers(sorted);
		manager.sort(function (a, b) {
			if (a.props.date < b.props.date) {
				return -1;
			}
			if (a.props.date > b.props.date) {
				return 1;
			}
			return 0;
		});
		sorted.sort(function (a, b) {
			if (a.props.date < b.props.date) {
				return -1;
			}
			if (a.props.date > b.props.date) {
				return 1;
			}
			return 0;
		});
		assertLayers(manager._lyrs, sorted);
	});

	it('sort(child)', () => {
		manager = LeafletLayerManager.raster(map, pane);
		const sorted = $.extend(true, [], rasterLayerParams);
		manager.setLayers(sorted);
		manager.sort(function (a, b) {
			if (a.props.date < b.props.date) {
				return -1;
			}
			if (a.props.date > b.props.date) {
				return 1;
			}
			return 0;
		}, {
			parentName: 'raster3'
		});
		sorted[2].layer.sort(function (a, b) {
			if (a.props.date < b.props.date) {
				return -1;
			}
			if (a.props.date > b.props.date) {
				return 1;
			}
			return 0;
		});
		assertLayers(manager._lyrs, sorted);
	});

	it('bringToFront(root)', () => {
		manager = LeafletLayerManager.vector(map, pane);
		manager.setLayers(vectorLayerParams);
		chai.assert.isTrue(manager._lyrs[0].layer === vectorLayerParams[0].layer); // before
		manager.bringToFront('line');
		chai.assert.isTrue(manager._lyrs[manager._lyrs.length - 1].layer === vectorLayerParams[0].layer); // after
	});

	it('bringToFront(child)', () => {
		manager = LeafletLayerManager.vector(map, pane);
		manager.setLayers(vectorLayerParams);

		chai.assert.isTrue(manager._lyrs[3]._lyrs[2]._lyrs[0].layer === vectorLayerParams[3].layer[2].layer[0].layer); // before
		manager.bringToFront('circle4', {
			parentName: 'circles.circle3'
		});
		chai.assert.isTrue(manager._lyrs[3]._lyrs[2]._lyrs[1].layer === vectorLayerParams[3].layer[2].layer[0].layer); // before
	});
});

describe('プロパティ', () => {
	let map, mapElement, manager;
	const pane = 'custom';
	beforeEach(function () {
		mapElement = document.createElement('div');
		mapElement.setAttribute('id', 'map');
		document.querySelector('body').append(mapElement);
		map = L.map('map').setView([35.681236, 139.767125], 10);
	});

	afterEach(function () {
		mapElement.parentNode.removeChild(mapElement);
	});

	it('setOpacity', () => {
		manager = LeafletLayerManager.raster(map, pane);
		manager.setLayers(rasterLayerParams);
		manager.setOpacity('raster1', 0.3);
		chai.assert.isTrue(manager._lyrs[0].layer.options.opacity === 0.3);
		manager.setOpacity('raster2', 0.3);
		assertProperties(manager._lyrs[1], 'opacity', 0.3);
		manager.setOpacity('raster3', 0.3);
		assertProperties(manager._lyrs[2], 'opacity', 0.3);

		manager.setOpacity('group', 0.1, {
			parentName: 'raster3'
		});
		assertProperties(manager._lyrs[2]._lyrs[2], 'opacity', 0.1);
	});

	it('setStyle', () => {
		manager = LeafletLayerManager.vector(map, pane);
		manager.setLayers(vectorLayerParams);
		manager.setStyle('line', {
			color: 'red'
		});
		assertProperties(manager._lyrs[0], 'color', 'red');

		manager.setStyle('circle', {
			color: 'red'
		});
		chai.assert.isTrue(manager._lyrs[1].layer.options.color === 'red');

		manager.setStyle('features', {
			color: 'red'
		});
		assertProperties(manager._lyrs[2], 'color', 'red');

		manager.setStyle('circle3', {
			color: 'red'
		}, {
			parentName: 'circles'
		});
		assertProperties(manager._lyrs[3]._lyrs[2], 'color', 'red');
	});
});