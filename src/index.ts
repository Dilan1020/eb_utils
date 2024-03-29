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
import reservedWords from './reserved';
import type { Db } from 'mongodb';

try { dayjs.utc().isUTC(); } catch (e) { dayjs.extend(utc); }

export const pullNumberFromString = (in_str: string) => isString(in_str) ? Number(in_str.replace(/[^0-9\.]+/g, "")) : 0;

export const clearObject = (obj: Record<string, any>) => {
    Object.keys(obj).forEach(k => delete obj[k]);
    return obj;
}

export const clearArray = (arr: any[]) => {
    arr.length = 0;
    return arr;
}

// https://stackoverflow.com/a/43467144
export function isValidHttpUrl(string: string) {
    let url;

    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
}

export const shallowCompare = (obj1: Record<string, any>, obj2: Record<string, any>) =>
    Object.keys(obj1).length === Object.keys(obj2).length &&
    Object.keys(obj1).every(key =>
        Object.prototype.hasOwnProperty.call(obj2, key) && obj1[key] === obj2[key]
    );

export const alphanumericWithSpaceHyphen = /^([-A-Za-z0-9 ]){0,40}$/ // Alphanumber, allowing for spaces and hyphens
export const alphanumericWithUnderscoreSafeStart = /^[a-zA-Z_]([A-Za-z0-9_]){0,100}$/;

export const isValidTableName = (potential_name: string) => {
    const normalizedName = potential_name.trim().toUpperCase();

    if (normalizedName.includes("_"))
        return "Cannot have '_' in name, use '-' instead";
    if (normalizedName === '')
        return "Cannot have empty name";
    if (normalizedName.length > 40)
        return "Names cannot be longer 40 characters"
    if (!alphanumericWithSpaceHyphen.test(potential_name))
        return "Names can only contain a-Z, 0-9, ' ', -";
    if (normalizedName === 'CHECKBOX')
        return "Cannot have name 'Checkbox'";
    if (normalizedName === 'JUSTCOLUMNS')
        return "Cannot have name 'JustColumns'";
    if (normalizedName === 'INSERTATEND')
        return "Cannot have name 'INSERTATEND'";
    if (normalizedName === 'SEARCHSTRING')
        return "Cannot have name 'SearchString'";
    else
        return true;
}

export const isValidColumnName = (potential_name: string) => {
    const normalizedName = potential_name.trim().toUpperCase();

    if (normalizedName.includes("_"))
        return "Cannot have '_' in name, use '-' instead";
    if (normalizedName === '')
        return "Cannot have empty name";
    if (normalizedName.length > 40)
        return "Names cannot be longer 40 characters"
    if (!alphanumericWithSpaceHyphen.test(potential_name))
        return "Names can only contain a-Z, 0-9, ' ', -";
    if (normalizedName === 'CHECKBOX')
        return "Cannot have name 'Checkbox'";
    if (normalizedName === 'INSERTATEND')
        return "Cannot have name 'INSERTATEND'";
    if (normalizedName === 'SEARCHSTRING')
        return "Cannot have name 'SearchString'";
    if (normalizedName === 'JUSTCOLUMNS')
        return "Cannot have name 'JustColumns'";
    if (!isNaN(parseFloat(normalizedName)) && isFinite(+(normalizedName)))
        return "Cannot have numeric name";
    if (Object.values(reservedWords).includes(normalizedName))
        return `Cannot have reserved database keyword: ${normalizedName}`;
    else
        return true;
}

export const isValidNamev2 = (potential_name: string) => {
    const normalizedName = potential_name.trim().toUpperCase();

    if (normalizedName === '')
        return "Cannot have empty name";
    if (normalizedName.length > 100)
        return "Names cannot be longer 100 characters"
    if (!alphanumericWithUnderscoreSafeStart.test(potential_name))
        return "Names can only contain a-Z, 0-9, '_' and must start with a-Z";
    if (normalizedName.charAt(0) === '_')
        return "Names cannot begin with '_'";
    if (!isNaN(parseFloat(normalizedName)) && isFinite(+(normalizedName)))
        return "Cannot have numeric name";
    else
        return true;
}

export function convertToType(initialValue: any, easybaseType: any) {
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
                return { type: "Point", coordinates: [pullNumberFromString(initialValue.split(",")[0]), pullNumberFromString(initialValue.split(",")[1])] };
            else if (isArray(initialValue) && initialValue.length >= 2) // Order is important here
                return { type: "Point", coordinates: [Number(initialValue[0]), Number(initialValue[1])] };
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

export function convertTimeHHMMToMinutes(timeString: string) {
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

export function convertMinsToHrsMins12(mins: number) {
    let h: any = Math.floor(mins / 60);
    let m: any = mins % 60;
    h = h < 10 ? '0' + h : h;
    m = m < 10 ? '0' + m : m;
    const suffix = (h >= 12) ? 'pm' : 'am';
    h = (h > 12) ? h - 12 : h;
    h = (h == '00') ? 12 : h;
    return `${h}:${m} ${suffix}`;
}

export function convertMinsToHrsMins24(mins: number) {
    let h: any = Math.floor(mins / 60);
    let m: any = mins % 60;
    h = h < 10 ? '0' + h : h;
    m = m < 10 ? '0' + m : m;
    return `${h}:${m}`;
}


const _MAP_KEY = "AtcgB6PwQI98qt8NDJmQ41izRoqbvNUJaWywL5-Cu7wqt7Pmypc8tMv-VftCeppV";

async function _getLocationInformation(lat: any, lon: any) {
    try {
        const res = await axios.get(`http://dev.virtualearth.net/REST/v1/Locations/${lat},${lon}?key=${_MAP_KEY}`);
        if (res.data.statusCode === 200)
            return res.data.resourceSets.resources[0];
        else
            throw new Error("Status error");
    } catch (e) { return {} }
}


export function setDefaultValues(initialObj: any, mongoColTypesArr: any[]) {
    let accessorToTypeMap = mongoColTypesArr.reduce((a, key) => Object.assign(a, { [key.column_accessor]: key.column_type }), {});

    const convertToDefault = (val: any, easybaseType: string) => {
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
                if (currKey === "_id") {
                    currRecord._key = currValue;
                } else if (currValue !== null) {
                    currRecord[currKey] = convertToDefault(currValue, accessorToTypeMap[currKey]);
                }
            }
            delete currRecord._id;
            delete currRecord._position;
        }
    } else {
        for (const [currKey, currValue] of Object.entries(initialObj)) {
            if (currKey === "_id") {
                initialObj._key = currValue;
            } else if (currValue !== null) {
                initialObj[currKey] = convertToDefault(currValue, accessorToTypeMap[currKey]);
            }
        }
        delete initialObj._id;
        delete initialObj._position;
    }
}

export async function transformValueToDefault(initialValue: any, easybaseType: string) {
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

export async function transformValue(initialValue: any, easybaseType: string, transformTo: any) {
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

export const accessorNameToColumnName = (given_key: string) => capitalize(given_key.replace(/_/g, ' '));

export const normalizeAccessorName = (given_key: string) => given_key.toLowerCase().trim().replace(/ /g, '_');

function hasWhiteSpace(s: string) {
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
export const translateRecordForDB = (initialObject: any, mongoColTypesArr: any[], addNulls: boolean = false) => {
    let obj = { ...initialObject };

    let accessorToTypeMap: any = {};
    let accessorToNullMap: any = {};
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

    if (!isEmpty(obj) && addNulls) {
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
export const normalizeObjectForDB = (obj: any, valid_keys_arr: any[], accessorToTypeMap: Record<string, any>, addNulls: boolean = true) => {
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

    if (!isEmpty(obj) && addNulls) {
        // Add null to missing keys
        let keysToNullify = valid_keys_arr.filter(x => !(x in obj));
        for (const key of keysToNullify) obj[key] = null;
    }

    return obj;
}

export const HASH_PLACEHOLDER = "??????????";

export const createMongoSearchQuery = (column_accessors: any[], search_str: any) => {
    const matchOrOptions: any[] = [];
    column_accessors.forEach(ele => {
        const new_obj: any = {};
        new_obj[ele] = new RegExp(search_str, "i");
        matchOrOptions.push(new_obj);
    })

    if (isNumber(search_str)) {
        column_accessors.forEach(ele => {
            const new_obj: any = {};
            new_obj[ele] = { $eq: Number(search_str) };
            matchOrOptions.push(new_obj);
        })
    }

    return { $or: matchOrOptions };
}

export async function hashBuilder(inputsToHash: any[], inputsToNotHash = []) {
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

export async function getTableNames(db: Db) {
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

export async function shiftDocs(db: Db, collection: string, startIndex: number, shiftBy: number) {
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

export function roundToDecimal(number: number, places: number) {
    const multiplier = Math.pow(10, places); // For our example the multiplier will be 10 * 10 * 10 = 1000.
    return Math.round(number * multiplier) / multiplier;
}

export const forEachAsyncParallel = async (array: any[], callback: any, thisArg: any) => {
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
