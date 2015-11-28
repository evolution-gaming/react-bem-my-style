define(["exports", "module"], function (exports, module) {
    /*global console */
    "use strict";

    function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    var CHILD_TYPE_ELEMENT = 1;
    var CHILD_TYPE_MODIFIER = 2;
    var MODIFIER_SEPARATOR = "--";
    var ELEMENT_SEPARATOR = "__";
    var NAME_FIELD_NAME = "__name";

    var getSeparator = function getSeparator(value) {
        return isModifier(value) ? MODIFIER_SEPARATOR : ELEMENT_SEPARATOR;
    };

    var logError = function logError(errorMsg) {
        throw new Error(errorMsg);
    };

    /**
     *  Converts string from CamelCase to "dashed-string"
     *  @example
     *  camelCaseToDashed("thisIsCamelCasedString"); // "this-is-camel-cased-string"
     *
     * @param {string} txt - string that needs to be Dashed
     * @return {string}
     */
    var camelCaseToDashed = function camelCaseToDashed(txt) {
        return txt.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    };

    /**
     * Returns object, ready for JSX destruction
     *
     * @param {string|string[]} classes - single className or an array of classNames
     * @return {{className:string}}
     */
    var wrapWithClassName = function wrapWithClassName(classes) {
        return { className: typeof classes === "string" ? classes : classes.join(" ") };
    };

    /**
     *
     * @param {CHILD_TYPE_MODIFIER}  value
     * @return {boolean}
     */
    var isModifier = function isModifier(value) {
        return value === CHILD_TYPE_MODIFIER;
    };

    /**
     *
     * @param {CHILD_TYPE_ELEMENT}  value
     * @return {boolean}
     */
    var isElement = function isElement(value) {
        return value === CHILD_TYPE_ELEMENT;
    };

    /**
     * Returns Element BEM Generator function
     *
     * @param {string} name - name of the element
     * @param {string[]} allModifiers - array of names of element's modifiers
     * @return {Function}
     */
    var makeElementGenerator = function makeElementGenerator(name, allModifiers) {
        return function () {
            for (var _len = arguments.length, rest = Array(_len), _key = 0; _key < _len; _key++) {
                rest[_key] = arguments[_key];
            }

            if (rest.length > 0) {
                var _ret = (function () {
                    var modifiers = rest[0];

                    if (typeof modifiers !== "object") {
                        logError("Object expected " + modifiers + " received");
                    }

                    var keys = Object.keys(modifiers);
                    var missingModifiers = allModifiers.filter(function (modifier) {
                        return keys.indexOf(modifier) === -1;
                    });

                    if (missingModifiers.length > 0) {
                        logError(name + " is missing modifiers: " + missingModifiers.join(","));
                    }

                    return {
                        v: wrapWithClassName([name].concat(_toConsumableArray(keys.filter(function (key) {
                            return modifiers[key];
                        }).map(function (key) {
                            return modifiers[key];
                        }))))
                    };
                })();

                if (typeof _ret === "object") return _ret.v;
            } else if (allModifiers.length) {
                logError(name + " is missing modifiers: " + allModifiers.join(","));
            }
            return wrapWithClassName(camelCaseToDashed(name));
        };
    };

    /**
     * Returns BEM Generator for Element and it's Child elements and modifiers
     *
     * @param {string} name - name of element
     * @param {{name:object}} block - child elements and modifiers of the element
     * @param {string[]} allModifiers - array of names of element's modifiers
     * @return {Function}
     */
    var makeElement = function makeElement(name, block, allModifiers) {
        return Object.assign(makeElementGenerator(name, allModifiers), Object.keys(block).reduce(function (mem, childName) {
            if (childName !== NAME_FIELD_NAME) {
                (function () {
                    var fullName = "" + name + getSeparator(block[childName]) + camelCaseToDashed(childName);

                    if (isModifier(block[childName])) {
                        mem[childName] = function (s) {
                            return _defineProperty({}, childName, s === true && fullName);
                        };
                    } else if (isElement(block[childName])) {
                        mem[childName] = function () {
                            return wrapWithClassName(fullName);
                        };
                    } else if (typeof block[childName] === "object") {
                        mem[childName] = makeBem(fullName, block[childName]);
                    } else {
                        logError("Unexpected value for " + name + "(" + childName + ":" + block[childName] + ")");
                    }
                })();
            }
            return mem;
        }, {}));
    };

    /**
     * Returns BEM Generator for Elementand it's Child elements and modifiers
     *
     * @param {string} name - name of the element
     * @param {{name:object}} block - child elements and modifiers of the element
     */
    var makeBem = function makeBem(name, block) {
        return makeElement(name, block, Object.keys(block).filter(function (childName) {
            return block[childName] === CHILD_TYPE_MODIFIER;
        }));
    };

    /**
     * Proxies return to makeBem
     *
     * @param {{name:object}} block - child elements and modifiers of the element
     */

    module.exports = function (block) {
        return makeBem(camelCaseToDashed(block[NAME_FIELD_NAME]), block);
    };
});