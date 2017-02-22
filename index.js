"use strict"

const JSONStream = require('JSONStream');
const PassThrough = require('stream').PassThrough;

exports.combine = (scope, inst, args, data, next) => {

    for (let key in args) {

        if (!data[key]) {
            return next(new Error('Flow-streams.combine: No streams to found.'));
        }

        if (data[key].pipe) {
            return next(null, data);
        }

        const combinedStream = new PassThrough({objectMode: true});
        const endHandler = () => {!(--combinedStream.length) && combinedStream.end()};

        combinedStream.length = data[key].length;
        data[key].forEach((stream, index) => {
            stream.on('data', chunk => combinedStream.push(chunk));
            stream.on('error', error => combinedStream.emit('error', error));
            stream.on('end', endHandler);
        });
        data[args[key]] = combinedStream;
    }

    return next ? next(null, data) : data;
};

exports.json = {

    parse: (scope, inst, args, data, next) => {

        for (let key in args) {

            if (!data[key]) {
                return next(new Error('Flow-streams.parse: No streams to found.'));
            }

            if (data[key] instanceof Array) {
                data[key].forEach((stream, index) => {
                    data[key][index] = stream.pipe(JSONStream.parse(args[key]));
                });
            } else {
                data[key] = data[key].pipe(JSONStream.parse(args[key]));
            }
        }

        return next ? next(null, data) : data;
    },

    stringify: (scope, inst, args, data, stream, next) => {

        /*if (Object.keys(args || {}) > 0) {
            for (let key in args) {

                if (!data[key]) {
                    return next(new Error('Flow-streams.stringify: No streams to found.'));
                }

                if (data[key] instanceof Array) {
                    data[key].forEach((stream, index) => {
                        data[key][index] = stream.pipe(JSONStream.stringify(args[key][0], args[key][1], args[key][2]));
                    });
                } else {
                    data[key] = data[key].pipe(JSONStream.stringify(args[key][0], args[key][1], args[key][2]));
                }
            }
        } else {*/
        stream = stream.pipe(JSONStream.stringify(args[0], args[1], args[2]));

        next(null, data);
    }
};
