/*global console */
const CHILD_TYPE_ELEMENT = 1;
const CHILD_TYPE_MODIFIER = 2;
const CHILD_TYPE_REQUIRED_MODIFIER = 3;
const MODIFIER_SEPARATOR = "--";
const ELEMENT_SEPARATOR = "__";
const REQUIRED_MODIFIER_SEPARATOR = "---";
const NAME_FIELD_NAME = "__name";

const childTypeToModifier = {
    [CHILD_TYPE_ELEMENT]: ELEMENT_SEPARATOR,
    [CHILD_TYPE_MODIFIER]: MODIFIER_SEPARATOR,
    [CHILD_TYPE_REQUIRED_MODIFIER]: REQUIRED_MODIFIER_SEPARATOR
};

const getElementSeparator = (element) => childTypeToModifier[element] || ELEMENT_SEPARATOR;

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
 * Returns Element BEM Generator function
 *
 * @param {string} name - name of the element
 * @param {string[]} optionalModifiers - array of names of element's optional modifiers
 * @param {string[]} requiredModifiers - array of names of element's required modifiers
 * @return {Function}
 */
const makeElementGenerator = (name, optionalModifiers, requiredModifiers) => {
    const nameDashed = camelCaseToDashed(name);
    const wrappedClassName = wrapWithClassName(nameDashed);

    //If element has no modifiers, return a simple generator function
    if (optionalModifiers.length === 0 && requiredModifiers.length === 0) {
        return () => wrappedClassName;
    }

    //If element has no required modifiers, return generator with optional modifiers only
    if (requiredModifiers.length === 0) {
        return (...rest) =>  rest.length === 0 ? wrappedClassName : wrapWithClassName([nameDashed].concat(rest));
    }
    //Otherwise return complex generator
    /**
     * Expecting rest to be {String:Boolean}[]
     */
    return (...rest) => {
        if (rest.length === 0) {
            logError(`${name} is missing modifiers: ${requiredModifiers.join(",")}`);
        } else {
            const stringModifiers = rest.filter(modifier => typeof modifier === "string");
            const objectModifiers = rest.filter(modifier => typeof modifier === "object");
            //merging {String:Boolean}[] into single object
            const modifiers = Object.assign({}, ...objectModifiers);
            if (typeof modifiers !== "object") {
                logError(`Object expected ${modifiers} received`);
            }

            const keys = Object.keys(modifiers);
            const missingModifiers = requiredModifiers.filter(modifier => keys.indexOf(modifier) === -1);

            if (missingModifiers.length > 0) {
                logError(`${name} is missing modifiers: ${missingModifiers.join(",")}`);
            }

            return wrapWithClassName([nameDashed].concat(stringModifiers).concat(keys.filter(key => modifiers[key]).map(key => modifiers[key])));
        }
        return wrappedClassName;
    };
};

const reduceBlockChild = (mem, name, childName, child) => {
    if ((childName) !== NAME_FIELD_NAME) {
        const fullName = `${name}${getElementSeparator(child)}${camelCaseToDashed(childName)}`;

        switch (child) {
            case CHILD_TYPE_MODIFIER:
                mem[childName] = (s) => s === true && fullName;
                break;
            case CHILD_TYPE_REQUIRED_MODIFIER:
                const requiredValueTrue = {[childName]: fullName};
                const requiredValueFalse = {[childName]: false};
                mem[childName] = (s) => s === true ? requiredValueTrue : requiredValueFalse;
                break;
            case CHILD_TYPE_ELEMENT:
                const classNameWrapped = wrapWithClassName(fullName);
                mem[childName] = () => classNameWrapped;
                break;
            default:
                if (typeof child === "object") {
                    mem[childName] = makeBem(fullName, child);
                } else {
                    logError(`Unexpected value for ${name}(${childName}:${child})`);
                }
                break;
        }
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
const makeElement = (element, name, block) =>
    Object.assign(element, Object.keys(block).reduce((mem, childName) => reduceBlockChild(mem, name, childName, block[childName]), {}));

/**
 * Returns BEM Generator for Elementand it's Child elements and modifiers
 *
 * @param {string} name - name of the element
 * @param {{name:object}} block - child elements and modifiers of the element
 */
const makeBem = (name, block) => {
    const element = makeElementGenerator(name,
        Object.keys(block).filter(childName => block[childName] === CHILD_TYPE_MODIFIER),
        Object.keys(block).filter(childName => block[childName] === CHILD_TYPE_REQUIRED_MODIFIER));
    return makeElement(element, name, block);
};

/**
 * Proxies return to makeBem
 *
 * @param {{name:object}} block - child elements and modifiers of the element
 */
export default (block) =>
    makeBem(camelCaseToDashed(block[NAME_FIELD_NAME]), block);
