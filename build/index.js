"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forEachAsyncParallel = exports.roundToDecimal = exports.shiftDocs = exports.getTableNames = exports.hashBuilder = exports.createMongoSearchQuery = exports.HASH_PLACEHOLDER = exports.normalizeObjectForDB = exports.translateRecordForDB = exports.normalizeAccessorName = exports.accessorNameToColumnName = exports.transformValue = exports.transformValueToDefault = exports.setDefaultValues = exports.convertMinsToHrsMins24 = exports.convertMinsToHrsMins12 = exports.convertTimeHHMMToMinutes = exports.convertToType = exports.checkStringForDatabase = exports.alphanumericWithSpaceHyphen = exports.shallowCompare = exports.isValidHttpUrl = exports.clearArray = exports.clearObject = exports.pullNumberFromString = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const isFinite_1 = __importDefault(require("lodash/isFinite"));
const isString_1 = __importDefault(require("lodash/isString"));
const isNumber_1 = __importDefault(require("lodash/isNumber"));
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const capitalize_1 = __importDefault(require("lodash/capitalize"));
const isObject_1 = __importDefault(require("lodash/isObject"));
const isArray_1 = __importDefault(require("lodash/isArray"));
const crypto_hash_1 = require("crypto-hash");
const axios_1 = __importDefault(require("axios"));
try {
    dayjs_1.default.utc().isUTC();
}
catch (e) {
    dayjs_1.default.extend(utc_1.default);
}
const pullNumberFromString = (in_str) => isString_1.default(in_str) ? Number(in_str.replace(/\D/g, "")) : 0;
exports.pullNumberFromString = pullNumberFromString;
const clearObject = (obj) => {
    Object.keys(obj).forEach(k => delete obj[k]);
    return obj;
};
exports.clearObject = clearObject;
const clearArray = (arr) => {
    arr.length = 0;
    return arr;
};
exports.clearArray = clearArray;
function isValidHttpUrl(string) {
    let url;
    try {
        url = new URL(string);
    }
    catch (_) {
        return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
}
exports.isValidHttpUrl = isValidHttpUrl;
const shallowCompare = (obj1, obj2) => Object.keys(obj1).length === Object.keys(obj2).length &&
    Object.keys(obj1).every(key => Object.prototype.hasOwnProperty.call(obj2, key) && obj1[key] === obj2[key]);
exports.shallowCompare = shallowCompare;
exports.alphanumericWithSpaceHyphen = /^([-A-Za-z0-9 ]){0,40}$/; // Alhpanumber, allowing for spaces and hyphens
const checkStringForDatabase = (potential_name) => {
    if (potential_name.includes("_"))
        return "Cannot have '_' in name, use '-' instead";
    if (potential_name.trim() === '')
        return "Cannot have empty name";
    if (potential_name.length > 40)
        return "Names cannot be longer 40 characters";
    if (!exports.alphanumericWithSpaceHyphen.test(potential_name))
        return "Names can only contain a-Z, 0-9, ' ', -";
    if (potential_name.trim().toUpperCase() === 'CHECKBOX')
        return "Cannot have name 'Checkbox'";
    if (potential_name.trim().toUpperCase() === 'LIMIT')
        return "Cannot have name 'Limit'";
    if (potential_name.trim().toUpperCase() === 'OFFSET')
        return "Cannot have name 'Offset'";
    if (potential_name.trim().toUpperCase() === 'INSERTATEND')
        return "Cannot have name 'INSERTATEND'";
    if (potential_name.trim().toUpperCase() === 'SEARCHSTRING')
        return "Cannot have name 'SearchString'";
    if (potential_name.trim().toUpperCase() === 'ORDER')
        return "Cannot have name 'Order'";
    if (potential_name.trim().toUpperCase() === 'JUSTCOLUMNS')
        return "Cannot have name 'JustColumns'";
    if (!isNaN(parseFloat(potential_name.trim())) && isFinite_1.default(+(potential_name.trim())))
        return "Cannot have numeric name";
    else
        return true;
};
exports.checkStringForDatabase = checkStringForDatabase;
function convertToType(initialValue, easybaseType) {
    if (initialValue === null)
        return null;
    switch (easybaseType) {
        case "time":
            if (isFinite_1.default(initialValue))
                return Number(initialValue); // isFinite is like isNumber with strings
            else
                return convertTimeHHMMToMinutes(initialValue);
        case "number":
            return Number(initialValue);
        case "boolean":
            if (isString_1.default(initialValue)) {
                if (initialValue === "true")
                    return true;
                if (initialValue === "false")
                    return false;
                if (initialValue === "1")
                    return true;
                if (initialValue === "0")
                    return false;
            }
            else if (isNumber_1.default(initialValue)) {
                if (initialValue === 1)
                    return true;
                else
                    return false;
            }
            return !!initialValue;
        case "richtext":
        case "text":
            return initialValue;
        case "date":
            return new Date(initialValue);
        case "location":
            if (isString_1.default(initialValue))
                return { type: "Point", coordinates: [exports.pullNumberFromString(initialValue.split(",")[0]), exports.pullNumberFromString(initialValue.split(",")[1])] };
            else if (isArray_1.default(initialValue) && initialValue.length >= 2) // Order is important here
                return { type: "Point", coordinates: [Number(initialValue[0]), Number(initialValue[1])] };
            else if (isObject_1.default(initialValue))
                return initialValue;
            break;
        case "image":
        case "video":
        case "file":
            return `${initialValue}`;
        default:
            break;
    }
}
exports.convertToType = convertToType;
function convertTimeHHMMToMinutes(timeString) {
    const durArr = timeString.split(':');
    const hours = Number(durArr[0].match(/\d+/));
    const mintues = Number(durArr[1].match(/\d+/));
    const bareMins = (hours * 60) + mintues;
    if (`${timeString}`.toUpperCase().includes("PM")) {
        if (hours === 12)
            return bareMins;
        else
            return bareMins + (12 * 60);
    }
    else if (`${timeString}`.toUpperCase().includes("AM")) {
        if (hours === 12)
            return mintues; // 12 AM denotes midnight
        else
            return bareMins;
    }
    else {
        return bareMins;
    }
}
exports.convertTimeHHMMToMinutes = convertTimeHHMMToMinutes;
function convertMinsToHrsMins12(mins) {
    let h = Math.floor(mins / 60);
    let m = mins % 60;
    h = h < 10 ? '0' + h : h;
    m = m < 10 ? '0' + m : m;
    const suffix = (h >= 12) ? 'pm' : 'am';
    h = (h > 12) ? h - 12 : h;
    h = (h == '00') ? 12 : h;
    return `${h}:${m} ${suffix}`;
}
exports.convertMinsToHrsMins12 = convertMinsToHrsMins12;
function convertMinsToHrsMins24(mins) {
    let h = Math.floor(mins / 60);
    let m = mins % 60;
    h = h < 10 ? '0' + h : h;
    m = m < 10 ? '0' + m : m;
    return `${h}:${m}`;
}
exports.convertMinsToHrsMins24 = convertMinsToHrsMins24;
const _MAP_KEY = "AtcgB6PwQI98qt8NDJmQ41izRoqbvNUJaWywL5-Cu7wqt7Pmypc8tMv-VftCeppV";
async function _getLocationInformation(lat, lon) {
    try {
        const res = await axios_1.default.get(`http://dev.virtualearth.net/REST/v1/Locations/${lat},${lon}?key=${_MAP_KEY}`);
        if (res.data.statusCode === 200)
            return res.data.resourceSets.resources[0];
        else
            throw new Error("Status error");
    }
    catch (e) {
        return {};
    }
}
function setDefaultValues(initialObj, mongoColTypesArr) {
    let accessorToTypeMap = mongoColTypesArr.reduce((a, key) => Object.assign(a, { [key.column_accessor]: key.column_type }), {});
    const convertToDefault = (val, easybaseType) => {
        switch (easybaseType) {
            case "time":
                return convertMinsToHrsMins24(val);
            case "boolean":
                return val;
            case "file":
            case "number":
            case "video":
            case "image":
            case "text":
                return val;
            case "richtext":
                return val;
            case "date":
                return val;
            case 'location':
                return val.coordinates;
            default:
                break;
        }
    };
    if (isArray_1.default(initialObj)) {
        for (const currRecord of initialObj) {
            for (const [currKey, currValue] of Object.entries(currRecord)) {
                if (currKey === "_id") {
                    currRecord._key = currValue;
                }
                else if (currValue !== null) {
                    currRecord[currKey] = convertToDefault(currValue, accessorToTypeMap[currKey]);
                }
            }
            delete currRecord._id;
            delete currRecord._position;
        }
    }
    else {
        for (const [currKey, currValue] of Object.entries(initialObj)) {
            if (currKey === "_id") {
                initialObj._key = currValue;
            }
            else if (currValue !== null) {
                initialObj[currKey] = convertToDefault(currValue, accessorToTypeMap[currKey]);
            }
        }
        delete initialObj._id;
        delete initialObj._position;
    }
}
exports.setDefaultValues = setDefaultValues;
async function transformValueToDefault(initialValue, easybaseType) {
    switch (easybaseType) {
        case "time":
            return convertMinsToHrsMins24(initialValue);
        case "boolean":
            return initialValue;
        case "file":
        case "number":
        case "video":
        case "image":
        case "text":
            return initialValue;
        case "richtext":
            return initialValue;
        case "date":
            return initialValue;
        case 'location':
            return initialValue.coordinates;
        default:
            break;
    }
}
exports.transformValueToDefault = transformValueToDefault;
async function transformValue(initialValue, easybaseType, transformTo) {
    switch (easybaseType) {
        case "time":
            switch (transformTo) {
                case 'HH:MM 12h':
                    return convertMinsToHrsMins12(initialValue);
                case 'HH:MM 24h':
                    return convertMinsToHrsMins24(initialValue);
                case 'Total Minutes':
                    return Number(initialValue);
                default:
                    break;
            }
            break;
        case "boolean":
            switch (transformTo) {
                case 'T/F':
                    return initialValue;
                case '1/0':
                    return Number(initialValue);
                default:
                    break;
            }
            break;
        case "file":
        case "number":
        case "video":
        case "image":
        case "text":
            return initialValue;
        case "richtext":
            return initialValue;
        case "date":
            switch (transformTo) {
                case 'MM/DD/YYYY':
                    return dayjs_1.default.utc(initialValue).format('MM/DD/YYYY');
                case 'YYYY/MM/DD':
                    return dayjs_1.default.utc(initialValue).format('YYYY/MM/DD');
                case 'dd-mmm-yyyy':
                    return dayjs_1.default.utc(initialValue).format('DD-MMM-YYYY');
                case 'dd.mm.yyyy':
                    return dayjs_1.default.utc(initialValue).format('DD.MM.YYYY');
                case 'UNIX Stamp':
                    return dayjs_1.default.utc(initialValue).unix();
                case 'ISO String':
                    return dayjs_1.default.utc(initialValue).toISOString();
                case 'Object':
                    return initialValue;
                default:
                    break;
            }
            break;
        case 'location':
            switch (transformTo) {
                case "Location Info":
                    {
                        const map_info_res = await _getLocationInformation(initialValue.coordinates[0], initialValue.coordinates[1]);
                        return JSON.stringify(map_info_res);
                    }
                case "Array":
                    return initialValue.coordinates;
                case "String":
                    return initialValue.coordinates.join(", ");
                default:
                    break;
            }
            break;
        default:
            break;
    }
}
exports.transformValue = transformValue;
const accessorNameToColumnName = (given_key) => capitalize_1.default(given_key.replace(/_/g, ' '));
exports.accessorNameToColumnName = accessorNameToColumnName;
const normalizeAccessorName = (given_key) => given_key.toLowerCase().trim().replace(/ /g, '_');
exports.normalizeAccessorName = normalizeAccessorName;
function hasWhiteSpace(s) {
    const whitespaceChars = [' ', '\t', '\n'];
    return whitespaceChars.some(char => s.includes(char));
}
/*
    1. normalize object keys for proper db format
    2. delete keys that dont exist
    3. add null for keys that are not present
    4. cast all values to proper db format based on type
    
    will return an empty object if there are no valid keys
*/
const translateRecordForDB = (initialObject, mongoColTypesArr, addNulls = false) => {
    let obj = { ...initialObject };
    let accessorToTypeMap = {};
    let accessorToNullMap = {};
    mongoColTypesArr.forEach(ele => {
        accessorToTypeMap[ele.column_accessor] = ele.column_type;
        accessorToNullMap[ele.column_accessor] = null;
    });
    Object.entries(obj).forEach(([key, val]) => {
        let new_key = key;
        if (hasWhiteSpace(key) || key.toLowerCase() !== key) {
            new_key = exports.normalizeAccessorName(key);
            delete obj[key];
        }
        if (!Object.prototype.hasOwnProperty.call(accessorToTypeMap, new_key))
            delete obj[new_key];
        else
            obj[new_key] = convertToType(val, accessorToTypeMap[new_key]);
    });
    if (!isEmpty_1.default(obj) && addNulls) {
        obj = { ...accessorToNullMap, ...obj };
    }
    return obj;
};
exports.translateRecordForDB = translateRecordForDB;
/*
    DEPRECATED: USE translateRecordForDB instead
    1. normalize object keys for proper db format
    2. delete keys that dont exist
    3. add null for keys that are not present
    4. cast all values to proper db format based on type
    
    will return an empty object if there are no valid keys
*/
const normalizeObjectForDB = (obj, valid_keys_arr, accessorToTypeMap, addNulls = true) => {
    Object.entries(obj).forEach(([key, val]) => {
        let new_key = key;
        if (hasWhiteSpace(key) || key.toLowerCase() !== key) {
            new_key = exports.normalizeAccessorName(key);
            delete obj[key];
            obj[new_key] = val;
        }
        if (!valid_keys_arr.includes(new_key))
            delete obj[new_key];
        else
            obj[new_key] = convertToType(val, accessorToTypeMap[new_key]);
    });
    if (!isEmpty_1.default(obj) && addNulls) {
        // Add null to missing keys
        let keysToNullify = valid_keys_arr.filter(x => !(x in obj));
        for (const key of keysToNullify)
            obj[key] = null;
    }
    return obj;
};
exports.normalizeObjectForDB = normalizeObjectForDB;
exports.HASH_PLACEHOLDER = "??????????";
const createMongoSearchQuery = (column_accessors, search_str) => {
    const matchOrOptions = [];
    column_accessors.forEach(ele => {
        const new_obj = {};
        new_obj[ele] = new RegExp(search_str, "i");
        matchOrOptions.push(new_obj);
    });
    if (isNumber_1.default(search_str)) {
        column_accessors.forEach(ele => {
            const new_obj = {};
            new_obj[ele] = { $eq: Number(search_str) };
            matchOrOptions.push(new_obj);
        });
    }
    return { $or: matchOrOptions };
};
exports.createMongoSearchQuery = createMongoSearchQuery;
async function hashBuilder(inputsToHash, inputsToNotHash = []) {
    let final_string = "";
    for (const curr_in of inputsToHash) {
        const res = await crypto_hash_1.sha256(curr_in);
        final_string += res.slice(0, 9);
    }
    for (const curr_in of inputsToNotHash) {
        final_string += curr_in;
    }
    return final_string;
}
exports.hashBuilder = hashBuilder;
async function getTableNames(db) {
    const collectionNames = [];
    const currCollectionNames = await db.listCollections({}, { nameOnly: true }).toArray();
    if (currCollectionNames !== undefined && currCollectionNames.length !== 0) {
        const _filtered_names = currCollectionNames.reduce((newArr, ele) => {
            if (!ele.name.includes('.') && ele.name.charAt(0) !== "_")
                newArr.push(ele.name);
            return newArr;
        }, []);
        collectionNames.push(..._filtered_names);
    }
    return collectionNames;
}
exports.getTableNames = getTableNames;
async function shiftDocs(db, collection, startIndex, shiftBy) {
    const docsToChange = await db.collection(collection).find({ _position: { $gte: startIndex } }, { projection: { _id: 1 } }).toArray();
    if (docsToChange.length > 0) {
        await db.collection(collection).bulkWrite(docsToChange.map((ele, i) => ({
            updateOne: {
                filter: { _id: ele._id },
                update: { $set: { _position: startIndex + i + shiftBy } }
            }
        })));
    }
}
exports.shiftDocs = shiftDocs;
function roundToDecimal(number, places) {
    const multiplier = Math.pow(10, places); // For our example the multiplier will be 10 * 10 * 10 = 1000.
    return Math.round(number * multiplier) / multiplier;
}
exports.roundToDecimal = roundToDecimal;
const forEachAsyncParallel = async (array, callback, thisArg) => {
    const promiseArray = [];
    for (let i = 0; i < array.length; i++) {
        if (i in array) {
            const p = Promise.resolve(array[i]).then((currentValue) => {
                return callback.call(thisArg || this, currentValue, i, array);
            });
            promiseArray.push(p);
        }
    }
    await Promise.all(promiseArray);
};
exports.forEachAsyncParallel = forEachAsyncParallel;
//# sourceMappingURL=index.js.map