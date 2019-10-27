import 'core-js';
import 'regenerator-runtime/runtime';
import * as parse_georaster from "georaster";
import GeoRasterLayer from "georaster-layer-for-leaflet";
import chroma from "chroma-js";

const colorScale = (userOptions) => {
    const defaultOptions = {
        range: [0, 1],
        scale: 'RdYlBu',
        nodata: 'rgba(0,0,0,0)'
    }
    const options = Object.assign({}, defaultOptions, userOptions);

    const colorScale = chroma.scale(options.scale).domain(options.range);
    if (options.nodata) {
        colorScale.nodata(options.nodata);
    }

    return colorScale
}

const geotiff = {
    leafletLayer: (url, userOptions, callback) => {
        const defaultOptions = {
            opacity: 1.0,
            debugLevel: -1
        };
        const options = Object.assign({}, defaultOptions, userOptions);

        fetch(url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => parse_georaster(arrayBuffer)).then(georaster => {
                var layer = new GeoRasterLayer(Object.assign({}, {
                    georaster: georaster,
                }, options));
                callback(layer);
            });;
    }
}

if (typeof window !== 'undefined') {
    window['RawImage'] = {
        colorScale,
        geotiff
    };
}