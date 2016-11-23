"use strict"

const JSONStream = require('JSONStream');
const Stream = require('stream').Stream;

exports.combine = (scope, inst, args, data, next) => {

    for (let key in args) {

        if (!data[key]) {
            return next(new Error('Flow-streams.combine: No streams to found.'));
        }

        if (data[key].pipe) {
            return next(null, data);
        }

        const combinedStream = new Stream.PassThrough({objectMode: true});
        const endHandler = () => {!(--combinedStream.length) && combinedStream.end()};

        combinedStream.length = data[key].length;
        data[key].forEach((stream, index) => {
            stream.on('data', chunk => combinedStream.push(chunk));
            stream.on('error', error => combinedStrea.emit('error', error));
            stream.on('end', endHandler);
        });
        data[args[key]] = combinedStream;
    }

    next(null, data);
};

exports.transform = (scope, insta, args, data, next) => {

    const transform = new Stream.Transform({
        objectMode: true,
        transform: (chunk, enc, done) => {
            done(null, [
                chunk.subject[0] === '<' ? chunk.subject.slice(1, -1) : chunk.subject,
                chunk.predicate.slice(1, -1),
                chunk.id[0] === '<' ? chunk.id.slice(1, -1) : chunk.id
            ]);
        }
    });

    data.readable = data.readable.pipe(transform);

    next(null, data);
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

        next(null, data);
    },

    stringify: (scope, inst, args, data, next) => {

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

        next(null, data);
    }
};
