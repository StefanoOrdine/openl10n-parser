"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _es6Promisify = require('es6-promisify');

var _es6Promisify2 = _interopRequireDefault(_es6Promisify);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function parseString() {
    parseString = (0, _es6Promisify2.default)(require('xml2js').parseString);
    return parseString.apply(null, arguments);
}

/**
 * Parser for open l10n xlf translations files
 */

var OpenL10nParser = (function () {
    function OpenL10nParser() {
        _classCallCheck(this, OpenL10nParser);

        this.getDirReader = _lodash2.default.once(function () {
            return (0, _es6Promisify2.default)(_fs2.default.readdir);
        });
        this.getFileReader = _lodash2.default.once(function () {
            return (0, _es6Promisify2.default)(_fs2.default.readFile);
        });
    }

    _createClass(OpenL10nParser, [{
        key: 'parseFolder',

        /**
         * Parse all the files of a folder
         */
        value: function parseFolder(folderPath) {

            var self = this;

            return this.getDirReader()(folderPath).then(function (files) {
                return Promise.all(files.map(self.parseFile.bind(self, folderPath)));
            }).then(self.bundleCollectionsByLanguage.bind(self));
        }

        /**
         * Parse a single file
         */

    }, {
        key: 'parseFile',
        value: function parseFile(folderPath, fileName) {

            return this.getFileReader()(_path2.default.join(process.cwd(), folderPath, fileName), { encoding: 'utf8' }).then(this.getContentToJsonParser(fileName)).then(this.getTransUnitsIntoMetaCollectionWrapper(fileName));
        }

        /**
         * Get the function that reads a folder as a promise resolved with the file names
         */

        /**
         * Get the function that reads a file as a promise resolved with the file content
         */

    }, {
        key: 'getContentToJsonParser',

        /**
         * Get the function that parses file content to json
         */
        value: function getContentToJsonParser(fileName) {

            return function (content) {
                return parseString(content);
            };
        }

        /**
         * Get the function that transforms a json document root into an OpenL10nMetaCollection
         * which stores the translations, and the domainName and targetLanguageName as descriptors
         */

    }, {
        key: 'getTransUnitsIntoMetaCollectionWrapper',
        value: function getTransUnitsIntoMetaCollectionWrapper(fileName) {

            var self = this;

            return function (root) {
                var translations = self.getTranslations(root, fileName);
                var meta = self.getMeta(root, fileName);
                return {
                    domainName: meta.domainName,
                    targetLanguageName: meta.targetLanguageName,
                    translations: translations
                };
            };
        }

        /**
         * Get the translations from the json document root.
         * fileName is provided to determine the path dynamically if needed
         */

    }, {
        key: 'getTranslations',
        value: function getTranslations(root, fileName) {

            var originalTransUnitsArray = root.xliff.file[0].body[0]['trans-unit'];

            return _lodash2.default.transform(originalTransUnitsArray, function (result, transUnit) {
                result[transUnit.source[0]] = transUnit.target[0];
            }, {});
        }

        /**
         * Get the meta information (domain name and target language name from the json document root and fileName
         */

    }, {
        key: 'getMeta',
        value: function getMeta(root, fileName) {

            var match = fileName.match(/^(.*)\.([^\.]+)\.xlf$/);

            return {
                domainName: match[1],
                targetLanguageName: match[2]
            };
        }

        /**
         * Bundle a set of OpenL10nMetaCollection objects into a set of OpenL10nLanguage by target language name
         *
         * @param {Object<OpenL10nMetaCollection>} wrappedTranslationObjects
         * @returns {{bundledTranslations: Object<OpenL10nLanguage>}}
         */

    }, {
        key: 'bundleCollectionsByLanguage',
        value: function bundleCollectionsByLanguage(wrappedTranslationObjects) {

            return {
                bundledTranslations: _lodash2.default.transform(wrappedTranslationObjects, function (result, value) {
                    result[value.targetLanguageName] = result[value.targetLanguageName] || {};
                    result[value.targetLanguageName][value.domainName] = value.translations;
                }, {})
            };
        }
    }]);

    return OpenL10nParser;
})();

exports.default = OpenL10nParser;
module.exports = exports['default'];