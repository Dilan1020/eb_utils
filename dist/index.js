"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isValidHttpUrl = isValidHttpUrl;
exports.convertToType = convertToType;
exports.convertTimeHHMMToMinutes = convertTimeHHMMToMinutes;
exports.convertMinsToHrsMins12 = convertMinsToHrsMins12;
exports.convertMinsToHrsMins24 = convertMinsToHrsMins24;
exports.transformValue = transformValue;
exports.hashBuilder = hashBuilder;
exports.createMongoSearchQuery = exports.HASH_PLACEHOLDER = exports.normalizeObjectForDB = exports.normalizeAccessorName = exports.accessorNameToColumnName = exports.checkStringForDatabase = exports.alphanumericWithSpaceHyphen = exports.shallowCompare = exports.clearArray = exports.clearObject = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _dayjs = _interopRequireDefault(require("dayjs"));

var _utc = _interopRequireDefault(require("dayjs/plugin/utc"));

var _lodash = require("lodash");

var _cryptoHash = require("crypto-hash");

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

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
  if (!alphanumericWithSpaceHyphen.test(potential_name)) return "Names can only contain a-Z, 0-9, ' ', -";
  if (potential_name.trim().toUpperCase() === 'CHECKBOX') return "Cannot have name 'Checkbox'";
  if (potential_name.trim().toUpperCase() === 'LIMIT') return "Cannot have name 'Limit'";
  if (potential_name.trim().toUpperCase() === 'OFFSET') return "Cannot have name 'Offset'";
  if (potential_name.trim().toUpperCase() === 'INSERTATEND') return "Cannot have name 'INSERTATEND'";
  if (potential_name.trim().toUpperCase() === 'SEARCHSTRING') return "Cannot have name 'SearchString'";
  if (potential_name.trim().toUpperCase() === 'ORDER') return "Cannot have name 'Order'";
  if (potential_name.trim().toUpperCase() === 'JUSTCOLUMNS') return "Cannot have name 'JustColumns'";
  if (!isNaN(parseFloat(potential_name.trim())) && (0, _lodash.isFinite)(+potential_name.trim())) return "Cannot have numeric name";else return true;
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
      return "".concat(initialValue);

    default:
      break;
  }
}

function convertTimeHHMMToMinutes(timeString) {
  var durArr = timeString.split(':');
  var hours = Number(durArr[0].replace(/(^.+)(\w\d+\w)(.+$)/i, '$1'));
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

var accessorNameToColumnName = function accessorNameToColumnName(given_key) {
  return (0, _lodash.capitalize)(given_key.replace(/_/g, ' '));
};

exports.accessorNameToColumnName = accessorNameToColumnName;

var normalizeAccessorName = function normalizeAccessorName(given_key) {
  return given_key.toLowerCase().trim().replace(/ /g, '_');
};

exports.normalizeAccessorName = normalizeAccessorName;

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
  var addNulls = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
  Object.entries(obj).forEach(function (_ref) {
    var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
        key = _ref2[0],
        val = _ref2[1];

    var new_key = key;

    if (hasWhiteSpace(key) || key.toLowerCase() !== key) {
      new_key = normalizeAccessorName(key);
      delete obj[key];
      obj[new_key] = val;
    }

    if (!valid_keys_arr.includes(new_key)) delete obj[new_key];else obj[new_key] = convertToType(val, accessorToTypeMap[new_key]);
  });

  if (!(0, _lodash.isEmpty)(obj) && addNulls) {
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
var HASH_PLACEHOLDER = "??????????";
exports.HASH_PLACEHOLDER = HASH_PLACEHOLDER;

var createMongoSearchQuery = function createMongoSearchQuery(column_accessors, search_str) {
  var matchOrOptions = [];
  column_accessors.forEach(function (ele) {
    var new_obj = {};
    new_obj[ele] = new RegExp(search_str, "i");
    matchOrOptions.push(new_obj);
  });

  if ((0, _lodash.isNumber)(search_str)) {
    column_accessors.forEach(function (ele) {
      var new_obj = {};
      new_obj[ele] = {
        $eq: Number(search_str)
      };
      matchOrOptions.push(new_obj);
    });
  }

  return {
    $or: matchOrOptions
  };
};

exports.createMongoSearchQuery = createMongoSearchQuery;

function hashBuilder(_x) {
  return _hashBuilder.apply(this, arguments);
}

function _hashBuilder() {
  _hashBuilder = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(inputsToHash) {
    var inputsToNotHash,
        final_string,
        _iterator2,
        _step2,
        curr_in,
        res,
        _iterator3,
        _step3,
        _curr_in,
        _args = arguments;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            inputsToNotHash = _args.length > 1 && _args[1] !== undefined ? _args[1] : [];
            final_string = "";
            _iterator2 = _createForOfIteratorHelper(inputsToHash);
            _context.prev = 3;

            _iterator2.s();

          case 5:
            if ((_step2 = _iterator2.n()).done) {
              _context.next = 13;
              break;
            }

            curr_in = _step2.value;
            _context.next = 9;
            return (0, _cryptoHash.sha256)(curr_in);

          case 9:
            res = _context.sent;
            final_string += res.slice(0, 9);

          case 11:
            _context.next = 5;
            break;

          case 13:
            _context.next = 18;
            break;

          case 15:
            _context.prev = 15;
            _context.t0 = _context["catch"](3);

            _iterator2.e(_context.t0);

          case 18:
            _context.prev = 18;

            _iterator2.f();

            return _context.finish(18);

          case 21:
            _iterator3 = _createForOfIteratorHelper(inputsToNotHash);

            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                _curr_in = _step3.value;
                final_string += _curr_in;
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }

            return _context.abrupt("return", final_string);

          case 24:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[3, 15, 18, 21]]);
  }));
  return _hashBuilder.apply(this, arguments);
}