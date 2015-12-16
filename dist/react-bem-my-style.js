define(["exports", "module"], function (exports, module) {
    /*global console */
    "use strict";

    var _childTypeToModifier;

    function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    var CHILD_TYPE_ELEMENT = 1;
    var CHILD_TYPE_MODIFIER = 2;
    var CHILD_TYPE_REQUIRED_MODIFIER = 3;
    var MODIFIER_SEPARATOR = "--";
    var ELEMENT_SEPARATOR = "__";
    var REQUIRED_MODIFIER_SEPARATOR = "---";
    var NAME_FIELD_NAME = "__name";

    var childTypeToModifier = (_childTypeToModifier = {}, _defineProperty(_childTypeToModifier, CHILD_TYPE_ELEMENT, ELEMENT_SEPARATOR), _defineProperty(_childTypeToModifier, CHILD_TYPE_MODIFIER, MODIFIER_SEPARATOR), _defineProperty(_childTypeToModifier, CHILD_TYPE_REQUIRED_MODIFIER, REQUIRED_MODIFIER_SEPARATOR), _childTypeToModifier);

    var getElementSeparator = function getElementSeparator(element) {
        return childTypeToModifier[element] || ELEMENT_SEPARATOR;
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
     * Returns Element BEM Generator function
     *
     * @param {string} name - name of the element
     * @param {string[]} optionalModifiers - array of names of element's optional modifiers
     * @param {string[]} requiredModifiers - array of names of element's required modifiers
     * @return {Function}
     */
    var makeElementGenerator = function makeElementGenerator(name, optionalModifiers, requiredModifiers) {
        var nameDashed = camelCaseToDashed(name);
        var wrappedClassName = wrapWithClassName(nameDashed);

        //If element has no modifiers, return a simple generator function
        if (optionalModifiers.length === 0 && requiredModifiers.length === 0) {
            return function () {
                return wrappedClassName;
            };
        }

        //If element has no required modifiers, return generator with optional modifiers only
        if (requiredModifiers.length === 0) {
            return function () {
                for (var _len = arguments.length, rest = Array(_len), _key = 0; _key < _len; _key++) {
                    rest[_key] = arguments[_key];
                }

                return rest.length === 0 ? wrappedClassName : wrapWithClassName([nameDashed].concat(rest));
            };
        }
        //Otherwise return complex generator
        /**
         * Expecting rest to be {String:Boolean}[]
         */
        return function () {
            for (var _len2 = arguments.length, rest = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                rest[_key2] = arguments[_key2];
            }

            if (rest.length === 0) {
                logError(name + " is missing modifiers: " + requiredModifiers.join(","));
            } else {
                var _ret = (function () {
                    var stringModifiers = rest.filter(function (modifier) {
                        return typeof modifier === "string";
                    });
                    var objectModifiers = rest.filter(function (modifier) {
                        return typeof modifier === "object";
                    });
                    //merging {String:Boolean}[] into single object
                    var modifiers = Object.assign.apply(Object, [{}].concat(_toConsumableArray(objectModifiers)));
                    if (typeof modifiers !== "object") {
                        logError("Object expected " + modifiers + " received");
                    }

                    var keys = Object.keys(modifiers);
                    var missingModifiers = requiredModifiers.filter(function (modifier) {
                        return keys.indexOf(modifier) === -1;
                    });

                    if (missingModifiers.length > 0) {
                        logError(name + " is missing modifiers: " + missingModifiers.join(","));
                    }

                    return {
                        v: wrapWithClassName([nameDashed].concat(stringModifiers).concat(keys.filter(function (key) {
                            return modifiers[key];
                        }).map(function (key) {
                            return modifiers[key];
                        })))
                    };
                })();

                if (typeof _ret === "object") return _ret.v;
            }
            return wrappedClassName;
        };
    };

    var reduceBlockChild = function reduceBlockChild(mem, name, childName, child) {
        if (childName !== NAME_FIELD_NAME) {
            (function () {
                var fullName = "" + name + getElementSeparator(child) + camelCaseToDashed(childName);

                switch (child) {
                    case CHILD_TYPE_MODIFIER:
                        mem[childName] = function (s) {
                            return s === true && fullName;
                        };
                        break;
                    case CHILD_TYPE_REQUIRED_MODIFIER:
                        var requiredValueTrue = _defineProperty({}, childName, fullName);
                        var requiredValueFalse = _defineProperty({}, childName, false);
                        mem[childName] = function (s) {
                            return s === true ? requiredValueTrue : requiredValueFalse;
                        };
                        break;
                    case CHILD_TYPE_ELEMENT:
                        var classNameWrapped = wrapWithClassName(fullName);
                        mem[childName] = function () {
                            return classNameWrapped;
                        };
                        break;
                    default:
                        if (typeof child === "object") {
                            mem[childName] = makeBem(fullName, child);
                        } else {
                            logError("Unexpected value for " + name + "(" + childName + ":" + child + ")");
                        }
                        break;
                }
            })();
        }
        return mem;
    };
    /**
     * Returns BEM Generator for Element and it's Child elements and modifiers
     *
     * @param {function} element - element generator
     * @param {string} name - name of element
     * @param {{name:object}} block - child elements and modifiers of the element
     * @return {Function}
     */
    var makeElement = function makeElement(element, name, block) {
        return Object.assign(element, Object.keys(block).reduce(function (mem, childName) {
            return reduceBlockChild(mem, name, childName, block[childName]);
        }, {}));
    };

    /**
     * Returns BEM Generator for Elementand it's Child elements and modifiers
     *
     * @param {string} name - name of the element
     * @param {{name:object}} block - child elements and modifiers of the element
     */
    var makeBem = function makeBem(name, block) {
        var element = makeElementGenerator(name, Object.keys(block).filter(function (childName) {
            return block[childName] === CHILD_TYPE_MODIFIER;
        }), Object.keys(block).filter(function (childName) {
            return block[childName] === CHILD_TYPE_REQUIRED_MODIFIER;
        }));
        return makeElement(element, name, block);
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