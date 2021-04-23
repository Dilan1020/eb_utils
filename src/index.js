import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isFinite from 'lodash/isFinite';
import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import isEmpty from 'lodash/isEmpty';
import capitalize from 'lodash/capitalize';
import isObject from 'lodash/isObject';
import isArray from 'lodash/isArray';
import { sha256 } from 'crypto-hash';
import axios from 'axios';

try { dayjs.utc().isUTC(); } catch (e) { dayjs.extend(utc); }

export const pullNumberFromString = (in_str) => isString(in_str) ? Number(in_str.replace(/\D/g, "")) : 0;

export const clearObject = (obj) => {
    Object.keys(obj).forEach(k => delete obj[k]);
    return obj;
}

export const clearArray = (arr) => {
    arr.length = 0;
    return arr;
}

export function isValidHttpUrl(string) {
    let url;

    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
}

export const shallowCompare = (obj1, obj2) =>
    Object.keys(obj1).length === Object.keys(obj2).length &&
    Object.keys(obj1).every(key =>
        Object.prototype.hasOwnProperty.call(obj2, key) && obj1[key] === obj2[key]
    );

export const alphanumericWithSpaceHyphen = /^([-A-Za-z0-9 ]){0,40}$/ // Alhpanumber, allowing for spaces and hyphens

export const checkStringForDatabase = (potential_name) => {
    if (potential_name.includes("_"))
        return "Cannot have '_' in name, use '-' instead";
    if (potential_name.trim() === '')
        return "Cannot have empty name";
    if (potential_name.length > 40)
        return "Names cannot be longer 40 characters"
    if (!alphanumericWithSpaceHyphen.test(potential_name))
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
    if (!isNaN(parseFloat(potential_name.trim())) && isFinite(+(potential_name.trim())))
        return "Cannot have numeric name"
    else return true;
}

export function convertToType(initialValue, easybaseType) {
    if (initialValue === null) return null;

    switch (easybaseType) {
        case "time":
            if (isFinite(initialValue)) return Number(initialValue); // isFinite is like isNumber with strings
            else return convertTimeHHMMToMinutes(initialValue);
        case "number":
            return Number(initialValue);
        case "boolean":
            if (isString(initialValue)) {
                if (initialValue === "true") return true;
                if (initialValue === "false") return false;
                if (initialValue === "1") return true;
                if (initialValue === "0") return false;
            }
            else if (isNumber(initialValue)) {
                if (initialValue === 1) return true;
                else return false;
            }
            return !!initialValue;
        case "richtext":
        case "text":
            return initialValue;
        case "date":
            return new Date(initialValue);
        case "location":
            if (isString(initialValue))
                return { type: "Point", coordinates: [ pullNumberFromString(initialValue.split(",")[0]), pullNumberFromString(initialValue.split(",")[1]) ] };
            else if (isArray(initialValue) && initialValue.length >= 2) // Order is important here
                return { type: "Point", coordinates: [ Number(initialValue[0]), Number(initialValue[1]) ] };
            else if (isObject(initialValue))
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

export function convertTimeHHMMToMinutes(timeString) {

    const durArr = timeString.split(':');
    const hours = Number(durArr[0].match(/\d+/));
    const mintues = Number(durArr[1].match(/\d+/));

    const bareMins = (hours * 60) + mintues;

    if (`${timeString}`.toUpperCase().includes("PM")) {
        if (hours === 12) return bareMins;
        else return bareMins + (12 * 60);
    }
    else if (`${timeString}`.toUpperCase().includes("AM")) {
        if (hours === 12) return mintues; // 12 AM denotes midnight
        else return bareMins;
    }
    else {
        return bareMins;
    }
}

export function convertMinsToHrsMins12(mins) {
    let h = Math.floor(mins / 60);
    let m = mins % 60;
    h = h < 10 ? '0' + h : h;
    m = m < 10 ? '0' + m : m;
    const suffix = (h >= 12) ? 'pm' : 'am';
    h = (h > 12) ? h - 12 : h;
    h = (h == '00') ? 12 : h;
    return `${h}:${m} ${suffix}`;
}

export function convertMinsToHrsMins24(mins) {
    let h = Math.floor(mins / 60);
    let m = mins % 60;
    h = h < 10 ? '0' + h : h;
    m = m < 10 ? '0' + m : m;
    return `${h}:${m}`;
}


const _MAP_KEY = "AtcgB6PwQI98qt8NDJmQ41izRoqbvNUJaWywL5-Cu7wqt7Pmypc8tMv-VftCeppV";

async function _getLocationInformation(lat, lon) {
    try {
        const res = await axios.get(`http://dev.virtualearth.net/REST/v1/Locations/${lat},${lon}?key=${_MAP_KEY}`);
        if (res.data.statusCode === 200)
            return res.data.resourceSets.resources[0];
        else
            throw new Error("Status error");
    } catch (e) { return {} }
}


export function setDefaultValues(initialObj, mongoColTypesArr) {
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
    }
    if (isArray(initialObj)) {
        for (const currRecord of initialObj) {
            for (const [currKey, currValue] of Object.entries(currRecord)) {
                if (currValue !== null && currKey !== "_id") currRecord[currKey] = convertToDefault(currValue, accessorToTypeMap[currKey]);
            }
            delete currRecord._id;
            delete currRecord._position;
        }
    } else {
        for (const [currKey, currValue] of Object.entries(initialObj)) {
            if (currValue !== null && currKey !== "_id") initialObj[currKey] = convertToDefault(currValue, accessorToTypeMap[currKey]);
        }
        delete initialObj._id;
        delete initialObj._position;
    }
}

export async function transformValueToDefault(initialValue, easybaseType) {
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

export async function transformValue(initialValue, easybaseType, transformTo) {
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
                    return dayjs.utc(initialValue).format('MM/DD/YYYY');
                case 'YYYY/MM/DD':
                    return dayjs.utc(initialValue).format('YYYY/MM/DD');
                case 'dd-mmm-yyyy':
                    return dayjs.utc(initialValue).format('DD-MMM-YYYY');
                case 'dd.mm.yyyy':
                    return dayjs.utc(initialValue).format('DD.MM.YYYY');
                case 'UNIX Stamp':
                    return dayjs.utc(initialValue).unix();
                case 'ISO String':
                    return dayjs.utc(initialValue).toISOString();
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

export const accessorNameToColumnName = given_key => capitalize(given_key.replace(/_/g, ' '));

export const normalizeAccessorName = given_key => given_key.toLowerCase().trim().replace(/ /g, '_');

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
export const translateRecordForDB = (initialObject, mongoColTypesArr, addNulls = false) => {
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
            new_key = normalizeAccessorName(key);
            delete obj[key];
        }

        if (!Object.prototype.hasOwnProperty.call(accessorToTypeMap, new_key)) delete obj[new_key];
        else obj[new_key] = convertToType(val, accessorToTypeMap[new_key]);
    });

    if (!isEmpty(obj) && addNulls)
    {
        obj = { ...accessorToNullMap, ...obj };
    }

    return obj;
}

/*
    DEPRECATED: USE translateRecordForDB instead
    1. normalize object keys for proper db format
    2. delete keys that dont exist
    3. add null for keys that are not present
    4. cast all values to proper db format based on type
    
    will return an empty object if there are no valid keys
*/
export const normalizeObjectForDB = (obj, valid_keys_arr, accessorToTypeMap, addNulls = true) => {
    Object.entries(obj).forEach(([key, val]) => {
        let new_key = key;
        if (hasWhiteSpace(key) || key.toLowerCase() !== key) {
            new_key = normalizeAccessorName(key);
            delete obj[key];
            obj[new_key] = val;
        }

        if (!valid_keys_arr.includes(new_key)) delete obj[new_key];
        else obj[new_key] = convertToType(val, accessorToTypeMap[new_key]);
    });

    if (!isEmpty(obj) && addNulls)
    {
        // Add null to missing keys
        let keysToNullify = valid_keys_arr.filter(x => !(x in obj));
        for (const key of keysToNullify) obj[key] = null;
    }
    
    return obj;
}

export const HASH_PLACEHOLDER = "??????????";

export const createMongoSearchQuery = (column_accessors, search_str) => {
    const matchOrOptions = [];
    column_accessors.forEach(ele => {
        const new_obj = {};
        new_obj[ele] = new RegExp(search_str, "i");
        matchOrOptions.push(new_obj);
    })

    if (isNumber(search_str)) {
        column_accessors.forEach(ele => {
            const new_obj = {};
            new_obj[ele] = { $eq: Number(search_str) };
            matchOrOptions.push(new_obj);
        })
    }

    return { $or: matchOrOptions };
}

export async function hashBuilder(inputsToHash, inputsToNotHash = []) {
    let final_string = "";
    for (const curr_in of inputsToHash) {
        const res = await sha256(curr_in);
        final_string += res.slice(0, 9);
    }

    for (const curr_in of inputsToNotHash) {
        final_string += curr_in;
    }
    return final_string;
}

export async function getTableNames(db) {
    const collectionNames = [];

    const currCollectionNames = await db.listCollections({}, { nameOnly: true }).toArray();
    if (currCollectionNames !== undefined && currCollectionNames.length !== 0) {
        const _filtered_names = currCollectionNames.reduce((newArr, ele) => {
            if (!ele.name.includes('.') && ele.name.charAt(0) !== "_") newArr.push(ele.name)
            return newArr
        }, []);
        collectionNames.push(..._filtered_names);
    }

    return collectionNames;
}

export async function shiftDocs(db, collection, startIndex, shiftBy) {
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

export function roundToDecimal(number, places) {
    const multiplier = Math.pow(10, places); // For our example the multiplier will be 10 * 10 * 10 = 1000.
    return Math.round(number * multiplier) / multiplier;
}

export const forEachAsyncParallel = async (array, callback, thisArg) => {
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