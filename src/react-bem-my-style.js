/*global console */
const CHILD_TYPE_ELEMENT = 1;
const CHILD_TYPE_MODIFIER = 2;
const MODIFIER_SEPARATOR = "--";
const ELEMENT_SEPARATOR = "__";
const NAME_FIELD_NAME = "__name";

const getSeparator = (value)=>isModifier(value) ? MODIFIER_SEPARATOR : ELEMENT_SEPARATOR;

const logError = (errorMsg) => {
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
const camelCaseToDashed = (txt) =>
    txt.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

/**
 * Returns object, ready for JSX destruction
 *
 * @param {string|string[]} classes - single className or an array of classNames
 * @return {{className:string}}
 */
const wrapWithClassName = (classes) =>
    ({className: typeof classes === "string" ? classes : classes.join(" ")});

/**
 *
 * @param {CHILD_TYPE_MODIFIER}  value
 * @return {boolean}
 */
const isModifier = (value) => value === CHILD_TYPE_MODIFIER;

/**
 *
 * @param {CHILD_TYPE_ELEMENT}  value
 * @return {boolean}
 */
const isElement = (value) => value === CHILD_TYPE_ELEMENT;

/**
 * Returns Element BEM Generator function
 *
 * @param {string} name - name of the element
 * @param {string[]} allModifiers - array of names of element's modifiers
 * @return {Function}
 */
const makeElementGenerator = (name, allModifiers) =>
    (...rest) => {
        if (rest.length > 0) {
            const modifiers = rest[0];

            if (typeof modifiers !== "object") {
                logError(`Object expected ${modifiers} received`);
            }

            const keys = Object.keys(modifiers);
            const missingModifiers = allModifiers.filter(modifier => keys.indexOf(modifier) === -1);

            if (missingModifiers.length > 0) {
                logError(`${name} is missing modifiers: ${missingModifiers.join(",")}`);
            }

            return wrapWithClassName([name, ...keys.filter(key => modifiers[key]).map(key => modifiers[key])]);
        } else if (allModifiers.length) {
            logError(`${name} is missing modifiers: ${allModifiers.join(",")}`);
        }
        return wrapWithClassName(camelCaseToDashed(name));
    };

/**
 * Returns BEM Generator for Element and it's Child elements and modifiers
 *
 * @param {string} name - name of element
 * @param {{name:object}} block - child elements and modifiers of the element
 * @param {string[]} allModifiers - array of names of element's modifiers
 * @return {Function}
 */
const makeElement = (name, block, allModifiers) =>
    Object.assign(
        makeElementGenerator(name, allModifiers),
        Object.keys(block).reduce((mem, childName) => {
            if ((childName) !== NAME_FIELD_NAME) {
                const fullName = `${name}${getSeparator(block[childName])}${camelCaseToDashed(childName)}`;

                if (isModifier(block[childName])) {
                    mem[childName] = (s) => ({[childName]: s === true && fullName});
                } else if (isElement(block[childName])) {
                    mem[childName] = () => wrapWithClassName(fullName);
                } else if (typeof block[childName] === "object") {
                    mem[childName] = makeBem(fullName, block[childName]);
                } else {
                    logError(`Unexpected value for ${name}(${childName}:${block[childName]})`);
                }
            }
            return mem;
        }, {})
    );

/**
 * Returns BEM Generator for Elementand it's Child elements and modifiers
 *
 * @param {string} name - name of the element
 * @param {{name:object}} block - child elements and modifiers of the element
 */
const makeBem = (name, block) =>
    makeElement(name, block, Object.keys(block).filter(childName => block[childName] === CHILD_TYPE_MODIFIER));

/**
 * Proxies return to makeBem
 *
 * @param {{name:object}} block - child elements and modifiers of the element
 */
export default (block) =>
    makeBem(camelCaseToDashed(block[NAME_FIELD_NAME]), block);
