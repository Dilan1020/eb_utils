import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { isFinite, isString, isNumber, isEmpty } from 'lodash';

try { dayjs.utc().isUTC(); } catch (e) { dayjs.extend(utc); }

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

export const alphanumericWithSpaceHyphen = /^([-A-Za-z0-9 ]){0,20}$/ // Alhpanumber, allowing for spaces and hyphens

export const checkStringForDatabase = (potential_name) => {
    if (potential_name.includes("_"))
        return "Cannot have '_' in name, use '-' instead";
    if (potential_name.trim() === '')
        return "Cannot have empty name";
    if (potential_name.length > 20)
        return "Names cannot be longer 20 characters"
    if (!alphanumericWithSpaceHyphen.test(potential_name))
        return "Names can only contain a-Z, 0-9, ' ', _";
    if (potential_name.trim().toUpperCase() === 'CHECKBOX')
        return "Cannot have name 'Checkbox'";
    if (potential_name.trim().toUpperCase() === 'LIMIT')
        return "Cannot have name 'Limit'";
    if (potential_name.trim().toUpperCase() === 'OFFSET')
        return "Cannot have name 'Offset'";
    if (potential_name.trim().toUpperCase() === 'INSERTATEND')
        return "Cannot have name 'INSERTATEND'";
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
            return { type: "Point", coordinates: [initialValue.split(",")[0], initialValue.split(",")[1]] };
        case "image":
        case "video":
        case "file":
            return null;
        default:
            break;
    }
}

export function convertTimeHHMMToMinutes(timeString) {

    const durArr = timeString.split(':');
    const hours = Number(durArr[0].replace(/(^.+)(\w\d+\w)(.+$)/i, '$2'));
    const mintues = Number(durArr[0].replace(/(^.+)(\w\d+\w)(.+$)/i, '$2'));

    if (`${timeString}`.toUpperCase().includes("PM")) {
        return ((hours * 60) + mintues) + (12 * 60);
    }
    else {
        // Includes AM
        return (hours * 60) + mintues;
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

export function transformValue(initialValue, easybaseType, tranformTo) {
    // TODO: Finish these (richtext)
    switch (easybaseType) {
        case "time":
            switch (tranformTo) {
                case 'HH:MM 12h':
                    return convertMinsToHrsMins12(initialValue);
                case 'HH:MM 24h':
                    return convertMinsToHrsMins24(initialValue);
                default:
                    break;
            }
            break;
        case "boolean":
            switch (tranformTo) {
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
            switch (tranformTo) {
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
        default:
            break;
    }
}


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
export const normalizeObjectForDB = (obj, valid_keys_arr, accessorToTypeMap) => {
    Object.entries(obj).forEach(([key, val]) => {
        let new_key = key;
        if (hasWhiteSpace(key) || key.toLowerCase() !== key) {
            new_key = key.toLowerCase().trim().replace(/ /g, '_');
            delete obj[key];
            obj[new_key] = val;
        }

        if (!valid_keys_arr.includes(new_key)) delete obj[new_key];
        else obj[new_key] = convertToType(val, accessorToTypeMap[new_key]);
    });

    if (!isEmpty(obj))
    {
        // Add null to missing keys
        let keysToNullify = valid_keys_arr.filter(x => !(x in obj));
        for (const key of keysToNullify) obj[key] = null;
    }
    
    return obj;
}