"use strict"

const JSONStream = require('JSONStream');
const PassThrough = require('stream').PassThrough;
const concat = require('concat-stream');

exports.combine = (args, data, callback) => {

    for (let key in args) {

        if (!data[key]) {
            return callback(new Error('Flow-streams.combine: No streams to found.'));
        }

        if (data[key].pipe) {
            return callback(null, data);
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

    return callback ? callback(null, data) : data;
};

exports.concat = (args, data, callback) => {

    if (!args.stream || !data[args.stream]) {
        return callback();
    }

    data[args.stream].pipe(concat(chunk => {
        data[args.to] = chunk;
        callback();
    }));

    data[args.stream].on('error', callback);
};

exports.json = {

    parse: (args, data, callback) => {

        for (let key in args) {

            if (!data[key]) {
                return callback(new Error('Flow-streams.parse: No streams to found.'));
            }

            if (data[key] instanceof Array) {
                data[key].forEach((stream, index) => {
                    data[key][index] = stream.pipe(JSONStream.parse(args[key]));
                });
            } else {
                data[key] = data[key].pipe(JSONStream.parse(args[key]));
            }
        }

        return callback ? callback(null, data) : data;
    },

    stringify: (scope, inst, args, data, callback) => {

        for (let key in args) {

            if (!data[key]) {
                return callback(new Error('Flow-streams.stringify: No streams to found.'));
            }
            if (data[key] instanceof Array) {
                data[key].forEach((stream, index) => {
                    data[key][index] = stream.pipe(JSONStream.stringify(args[key][0], args[key][1], args[key][2]));
                });
            } else {
                data[key] = data[key].pipe(JSONStream.stringify(args[key][0], args[key][1], args[key][2]));
            }
        }

        callback(null, data);
    }
};
