"use strict";

import fs from 'fs';
import path from 'path';
import promisify from 'es6-promisify';
import _ from 'lodash';

type OpenL10nLanguage = Object<OpenL10nDomain>;
type OpenL10nDomain = Object<string>;
type OpenL10nMetaCollection = {domainName: string, targetLanguageName: string, translations: Object<string>};

function parseString() {
    parseString = promisify(require('xml2js').parseString);
    return parseString.apply(null, arguments);
}

/**
 * Parser for open l10n xlf translations files
 */
export default class OpenL10nParser {

    /**
     * Parse all the files of a folder
     */
    parseFolder(folderPath: string): Promise<Object<{bundledTranslations: OpenL10nLanguage}>> {

        var self = this;

        return this.getDirReader()(folderPath)
            .then(function(files) {
                return Promise.all(files.map(self.parseFile.bind(self, folderPath)));
            })
            .then(self.bundleCollectionsByLanguage.bind(self))
            ;
    }

    /**
     * Parse a single file
     */
    parseFile(folderPath: string, fileName: string): Promise<OpenL10nMetaCollection> {

        return this.getFileReader()(path.join(process.cwd(), folderPath, fileName), { encoding: 'utf8' })
            .then(this.getContentToJsonParser(fileName))
            .then(this.getTransUnitsIntoMetaCollectionWrapper(fileName))
            ;
    }

    /**
     * Get the function that reads a folder as a promise resolved with the file names
     */
    getDirReader: () => Promise<string[]> = _.once(function() {
        return promisify(fs.readdir);
    });

    /**
     * Get the function that reads a file as a promise resolved with the file content
     */
    getFileReader: () => Promise<string> = _.once(function() {
        return promisify(fs.readFile);
    });

    /**
     * Get the function that parses file content to json
     */
    getContentToJsonParser(fileName: string): (content: string) => Object {

        return function (content) {
            return parseString(content);
        };
    }

    /**
     * Get the function that transforms a json document root into an OpenL10nMetaCollection
     * which stores the translations, and the domainName and targetLanguageName as descriptors
     */
    getTransUnitsIntoMetaCollectionWrapper(fileName: string): (root: Object) => OpenL10nMetaCollection {

        var self = this;

        return function(root) {
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
    getTranslations(root: any, fileName: string): Object<string> {

        var originalTransUnitsArray = root.xliff.file[0].body[0]['trans-unit'];

        return _.transform(originalTransUnitsArray, function(result, transUnit) {
            result[transUnit.source[0]] = transUnit.target[0];
        }, {});
    }

    /**
     * Get the meta information (domain name and target language name from the json document root and fileName
     */
    getMeta(root: any, fileName: string): {domainName: string, targetLanguageName: string} {

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
    bundleCollectionsByLanguage(wrappedTranslationObjects: Object<OpenL10nMetaCollection>): {bundledTranslations: Object<OpenL10nLanguage>} {

        return {
            bundledTranslations: _.transform(wrappedTranslationObjects, function(result, value) {
                result[value.targetLanguageName] = result[value.targetLanguageName] || {};
                result[value.targetLanguageName][value.domainName] = value.translations;
            }, {})
        };
    }

}
