const gulp = require("gulp");
const webpackStream = require("webpack-stream");
const webpack = require("webpack");

const webpackConfig = require("./webpack.config");

const process = require("process");
process.on('unhandledRejection', console.dir);
gulp.task("default", function () {
    return webpackStream(webpackConfig, webpack)
        .pipe(gulp.dest("dist"));
});