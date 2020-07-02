"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isValidHttpUrl = isValidHttpUrl;
exports.convertToType = convertToType;
exports.convertTimeHHMMToMinutes = convertTimeHHMMToMinutes;
exports.convertMinsToHrsMins12 = convertMinsToHrsMins12;
exports.convertMinsToHrsMins24 = convertMinsToHrsMins24;
exports.transformValue = transformValue;
exports.normalizeObjectForDB = exports.checkStringForDatabase = exports.alphanumericWithSpaceHyphen = exports.shallowCompare = exports.clearArray = exports.clearObject = void 0;

var _dayjs = _interopRequireDefault(require("dayjs"));

var _utc = _interopRequireDefault(require("dayjs/plugin/utc"));

var _lodash = require("lodash");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

try {
  _dayjs["default"].utc().isUTC();
} catch (e) {
  _dayjs["default"].extend(_utc["default"]);
}

var clearObject = function clearObject(obj) {
  Object.keys(obj).forEach(function (k) {
    return delete obj[k];
  });
  return obj;
};

exports.clearObject = clearObject;

var clearArray = function clearArray(arr) {
  arr.length = 0;
  return arr;
};

exports.clearArray = clearArray;

function isValidHttpUrl(string) {
  var url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

var shallowCompare = function shallowCompare(obj1, obj2) {
  return Object.keys(obj1).length === Object.keys(obj2).length && Object.keys(obj1).every(function (key) {
    return Object.prototype.hasOwnProperty.call(obj2, key) && obj1[key] === obj2[key];
  });
};

exports.shallowCompare = shallowCompare;
var alphanumericWithSpaceHyphen = /^([-A-Za-z0-9 ]){0,20}$/; // Alhpanumber, allowing for spaces and hyphens

exports.alphanumericWithSpaceHyphen = alphanumericWithSpaceHyphen;

var checkStringForDatabase = function checkStringForDatabase(potential_name) {
  if (potential_name.includes("_")) return "Cannot have '_' in name, use '-' instead";
  if (potential_name.trim() === '') return "Cannot have empty name";
  if (potential_name.length > 20) return "Names cannot be longer 20 characters";
  if (!alphanumericWithSpaceHyphen.test(potential_name)) return "Names can only contain a-Z, 0-9, ' ', _";
  if (potential_name.trim().toUpperCase() === 'CHECKBOX') return "Cannot have name 'Checkbox'";
  if (potential_name.trim().toUpperCase() === 'LIMIT') return "Cannot have name 'Limit'";
  if (potential_name.trim().toUpperCase() === 'OFFSET') return "Cannot have name 'Offset'";
  if (potential_name.trim().toUpperCase() === 'INSERTATEND') return "Cannot have name 'INSERTATEND'";else return true;
};

exports.checkStringForDatabase = checkStringForDatabase;

function convertToType(initialValue, easybaseType) {
  if (initialValue === null) return null;

  switch (easybaseType) {
    case "time":
      if ((0, _lodash.isFinite)(initialValue)) return Number(initialValue); // isFinite is like isNumber with strings
      else return convertTimeHHMMToMinutes(initialValue);

    case "number":
      return Number(initialValue);

    case "boolean":
      if ((0, _lodash.isString)(initialValue)) {
        if (initialValue === "true") return true;
        if (initialValue === "false") return false;
        if (initialValue === "1") return true;
        if (initialValue === "0") return false;
      } else if ((0, _lodash.isNumber)(initialValue)) {
        if (initialValue === 1) return true;else return false;
      }

      return !!initialValue;

    case "richtext":
    case "text":
      return initialValue;

    case "date":
      return new Date(initialValue);

    case "location":
      return {
        type: "Point",
        coordinates: [initialValue.split(",")[0], initialValue.split(",")[1]]
      };

    case "image":
    case "video":
    case "file":
      return null;

    default:
      break;
  }
}

function convertTimeHHMMToMinutes(timeString) {
  var durArr = timeString.split(':');
  var hours = Number(durArr[0].replace(/(^.+)(\w\d+\w)(.+$)/i, '$2'));
  var mintues = Number(durArr[0].replace(/(^.+)(\w\d+\w)(.+$)/i, '$2'));

  if ("".concat(timeString).toUpperCase().includes("PM")) {
    return hours * 60 + mintues + 12 * 60;
  } else {
    // Includes AM
    return hours * 60 + mintues;
  }
}

function convertMinsToHrsMins12(mins) {
  var h = Math.floor(mins / 60);
  var m = mins % 60;
  h = h < 10 ? '0' + h : h;
  m = m < 10 ? '0' + m : m;
  var suffix = h >= 12 ? 'pm' : 'am';
  h = h > 12 ? h - 12 : h;
  h = h == '00' ? 12 : h;
  return "".concat(h, ":").concat(m, " ").concat(suffix);
}

function convertMinsToHrsMins24(mins) {
  var h = Math.floor(mins / 60);
  var m = mins % 60;
  h = h < 10 ? '0' + h : h;
  m = m < 10 ? '0' + m : m;
  return "".concat(h, ":").concat(m);
}

function transformValue(initialValue, easybaseType, tranformTo) {
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
          return _dayjs["default"].utc(initialValue).format('MM/DD/YYYY');

        case 'YYYY/MM/DD':
          return _dayjs["default"].utc(initialValue).format('YYYY/MM/DD');

        case 'dd-mmm-yyyy':
          return _dayjs["default"].utc(initialValue).format('DD-MMM-YYYY');

        case 'dd.mm.yyyy':
          return _dayjs["default"].utc(initialValue).format('DD.MM.YYYY');

        case 'UNIX Stamp':
          return _dayjs["default"].utc(initialValue).unix();

        case 'ISO String':
          return _dayjs["default"].utc(initialValue).toISOString();

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
  var whitespaceChars = [' ', '\t', '\n'];
  return whitespaceChars.some(function (_char) {
    return s.includes(_char);
  });
}
/*
    1. normalize object keys for proper db format
    2. delete keys that dont exist
    3. add null for keys that are not present
    4. cast all values to proper db format based on type
    
    will return an empty object if there are no valid keys
*/


var normalizeObjectForDB = function normalizeObjectForDB(obj, valid_keys_arr, accessorToTypeMap) {
  Object.entries(obj).forEach(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        key = _ref2[0],
        val = _ref2[1];

    var new_key = key;

    if (hasWhiteSpace(key) || key.toLowerCase() !== key) {
      new_key = key.toLowerCase().trim().replace(/ /g, '_');
      delete obj[key];
      obj[new_key] = val;
    }

    if (!valid_keys_arr.includes(new_key)) delete obj[new_key];else obj[new_key] = convertToType(val, accessorToTypeMap[new_key]);
  });

  if (!(0, _lodash.isEmpty)(obj)) {
    // Add null to missing keys
    var keysToNullify = valid_keys_arr.filter(function (x) {
      return !(x in obj);
    });

    var _iterator = _createForOfIteratorHelper(keysToNullify),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var key = _step.value;
        obj[key] = null;
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }

  return obj;
};

exports.normalizeObjectForDB = normalizeObjectForDB;