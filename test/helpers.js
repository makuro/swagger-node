/****************************************************************************
 Copyright 2016 Apigee Corporation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ****************************************************************************/

'use strict';

const fs = require('fs');
const _ = require('lodash');
const util = require('util');

module.exports.copyFile = function (source, target, cb) {
    cb = _.once(cb);

    const rd = fs.createReadStream(source);
    rd.on('error', function (err) {
        cb(err);
    });

    const wr = fs.createWriteStream(target);
    wr.on('error', function (err) {
        cb(err);
    });
    wr.on('close', function (err) {
        cb(err);
    });
    rd.pipe(wr);
};

// intercepts stdout and stderr
// returns object with methods:
//   output() : returns captured string
//   release() : must be called when done, returns captured string
module.exports.captureOutput = () => {
    const old_stdout_write = process.stdout.write;
    const old_console_error = console.error;

    let captured = '';
    const callback = function (string) {
        captured += string;
    };

    process.stdout.write = (function (write) {
        return function (string, encoding, fd) {
            const args = _.toArray(arguments);
            write.apply(process.stdout, args);

            // only intercept the string
            callback.call(callback, string);
        };
    }(process.stdout.write));

    console.error = (function () {
        return function () {
            const args = _.toArray(arguments);
            args.unshift('[ERROR]');
            console.log.apply(console.log, args);

            // string here encapsulates all the args
            callback.call(callback, util.format(args));
        };
    }(console.error));

    return {
        output() {
            return captured;
        },
        release() {
            process.stdout.write = old_stdout_write;
            console.error = old_console_error;
            return captured;
        }
    };
};
