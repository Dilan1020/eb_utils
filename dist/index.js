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
exports.transformValueToDefault = transformValueToDefault;
exports.transformValue = transformValue;
exports.hashBuilder = hashBuilder;
exports.getTableNames = getTableNames;
exports.roundToDecimal = roundToDecimal;
exports.forEachAsyncParallel = exports.createMongoSearchQuery = exports.HASH_PLACEHOLDER = exports.normalizeObjectForDB = exports.normalizeAccessorName = exports.accessorNameToColumnName = exports.checkStringForDatabase = exports.alphanumericWithSpaceHyphen = exports.shallowCompare = exports.clearArray = exports.clearObject = exports.pullNumberFromString = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _dayjs = _interopRequireDefault(require("dayjs"));

var _utc = _interopRequireDefault(require("dayjs/plugin/utc"));

var _lodash = require("lodash");

var _cryptoHash = require("crypto-hash");

var _axios = _interopRequireDefault(require("axios"));

var _this = void 0;

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

try {
  _dayjs["default"].utc().isUTC();
} catch (e) {
  _dayjs["default"].extend(_utc["default"]);
}

var pullNumberFromString = function pullNumberFromString(in_str) {
  return (0, _lodash.isString)(in_str) ? Number(in_str.replace(/\D/g, "")) : 0;
};

exports.pullNumberFromString = pullNumberFromString;

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
      if ((0, _lodash.isString)(initialValue)) return {
        type: "Point",
        coordinates: [pullNumberFromString(initialValue.split(",")[0]), pullNumberFromString(initialValue.split(",")[1])]
      };else if ((0, _lodash.isObject)(initialValue)) return initialValue;else if ((0, _lodash.isArray)(initialValue) && initialValue.length >= 2) return {
        type: "Point",
        coordinates: [Number(initialValue[0]), Number(initialValue[1])]
      };
      break;

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
  var hours = Number(durArr[0].match(/\d+/));
  var mintues = Number(durArr[1].match(/\d+/));
  var bareMins = hours * 60 + mintues;

  if ("".concat(timeString).toUpperCase().includes("PM")) {
    if (hours === 12) return bareMins;else return bareMins + 12 * 60;
  } else if ("".concat(timeString).toUpperCase().includes("AM")) {
    if (hours === 12) return mintues; // 12 AM denotes midnight
    else return bareMins;
  } else {
    return bareMins;
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

var _MAP_KEY = "AtcgB6PwQI98qt8NDJmQ41izRoqbvNUJaWywL5-Cu7wqt7Pmypc8tMv-VftCeppV";

function _getLocationInformation(_x, _x2) {
  return _getLocationInformation2.apply(this, arguments);
}

function _getLocationInformation2() {
  _getLocationInformation2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(lat, lon) {
    var res;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            _context2.next = 3;
            return _axios["default"].get("http://dev.virtualearth.net/REST/v1/Locations/".concat(lat, ",").concat(lon, "?key=").concat(_MAP_KEY));

          case 3:
            res = _context2.sent;

            if (!(res.data.statusCode === 200)) {
              _context2.next = 8;
              break;
            }

            return _context2.abrupt("return", res.data.resourceSets.resources[0]);

          case 8:
            throw new Error("Status error");

          case 9:
            _context2.next = 14;
            break;

          case 11:
            _context2.prev = 11;
            _context2.t0 = _context2["catch"](0);
            return _context2.abrupt("return", {});

          case 14:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[0, 11]]);
  }));
  return _getLocationInformation2.apply(this, arguments);
}

function transformValueToDefault(_x3, _x4) {
  return _transformValueToDefault.apply(this, arguments);
}

function _transformValueToDefault() {
  _transformValueToDefault = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(initialValue, easybaseType) {
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.t0 = easybaseType;
            _context3.next = _context3.t0 === "time" ? 3 : _context3.t0 === "boolean" ? 4 : _context3.t0 === "file" ? 5 : _context3.t0 === "number" ? 5 : _context3.t0 === "video" ? 5 : _context3.t0 === "image" ? 5 : _context3.t0 === "text" ? 5 : _context3.t0 === "richtext" ? 6 : _context3.t0 === "date" ? 7 : _context3.t0 === 'location' ? 8 : 9;
            break;

          case 3:
            return _context3.abrupt("return", convertMinsToHrsMins24(initialValue));

          case 4:
            return _context3.abrupt("return", initialValue);

          case 5:
            return _context3.abrupt("return", initialValue);

          case 6:
            return _context3.abrupt("return", initialValue);

          case 7:
            return _context3.abrupt("return", initialValue);

          case 8:
            return _context3.abrupt("return", initialValue.coordinates);

          case 9:
            return _context3.abrupt("break", 10);

          case 10:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _transformValueToDefault.apply(this, arguments);
}

function transformValue(_x5, _x6, _x7) {
  return _transformValue.apply(this, arguments);
}

function _transformValue() {
  _transformValue = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(initialValue, easybaseType, transformTo) {
    var map_info_res;
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.t0 = easybaseType;
            _context4.next = _context4.t0 === "time" ? 3 : _context4.t0 === "boolean" ? 11 : _context4.t0 === "file" ? 18 : _context4.t0 === "number" ? 18 : _context4.t0 === "video" ? 18 : _context4.t0 === "image" ? 18 : _context4.t0 === "text" ? 18 : _context4.t0 === "richtext" ? 19 : _context4.t0 === "date" ? 20 : _context4.t0 === 'location' ? 32 : 43;
            break;

          case 3:
            _context4.t1 = transformTo;
            _context4.next = _context4.t1 === 'HH:MM 12h' ? 6 : _context4.t1 === 'HH:MM 24h' ? 7 : _context4.t1 === 'Total Minutes' ? 8 : 9;
            break;

          case 6:
            return _context4.abrupt("return", convertMinsToHrsMins12(initialValue));

          case 7:
            return _context4.abrupt("return", convertMinsToHrsMins24(initialValue));

          case 8:
            return _context4.abrupt("return", Number(initialValue));

          case 9:
            return _context4.abrupt("break", 10);

          case 10:
            return _context4.abrupt("break", 44);

          case 11:
            _context4.t2 = transformTo;
            _context4.next = _context4.t2 === 'T/F' ? 14 : _context4.t2 === '1/0' ? 15 : 16;
            break;

          case 14:
            return _context4.abrupt("return", initialValue);

          case 15:
            return _context4.abrupt("return", Number(initialValue));

          case 16:
            return _context4.abrupt("break", 17);

          case 17:
            return _context4.abrupt("break", 44);

          case 18:
            return _context4.abrupt("return", initialValue);

          case 19:
            return _context4.abrupt("return", initialValue);

          case 20:
            _context4.t3 = transformTo;
            _context4.next = _context4.t3 === 'MM/DD/YYYY' ? 23 : _context4.t3 === 'YYYY/MM/DD' ? 24 : _context4.t3 === 'dd-mmm-yyyy' ? 25 : _context4.t3 === 'dd.mm.yyyy' ? 26 : _context4.t3 === 'UNIX Stamp' ? 27 : _context4.t3 === 'ISO String' ? 28 : _context4.t3 === 'Object' ? 29 : 30;
            break;

          case 23:
            return _context4.abrupt("return", _dayjs["default"].utc(initialValue).format('MM/DD/YYYY'));

          case 24:
            return _context4.abrupt("return", _dayjs["default"].utc(initialValue).format('YYYY/MM/DD'));

          case 25:
            return _context4.abrupt("return", _dayjs["default"].utc(initialValue).format('DD-MMM-YYYY'));

          case 26:
            return _context4.abrupt("return", _dayjs["default"].utc(initialValue).format('DD.MM.YYYY'));

          case 27:
            return _context4.abrupt("return", _dayjs["default"].utc(initialValue).unix());

          case 28:
            return _context4.abrupt("return", _dayjs["default"].utc(initialValue).toISOString());

          case 29:
            return _context4.abrupt("return", initialValue);

          case 30:
            return _context4.abrupt("break", 31);

          case 31:
            return _context4.abrupt("break", 44);

          case 32:
            _context4.t4 = transformTo;
            _context4.next = _context4.t4 === "Location Info" ? 35 : _context4.t4 === "Array" ? 39 : _context4.t4 === "String" ? 40 : 41;
            break;

          case 35:
            _context4.next = 37;
            return _getLocationInformation(initialValue.coordinates[0], initialValue.coordinates[1]);

          case 37:
            map_info_res = _context4.sent;
            return _context4.abrupt("return", JSON.stringify(map_info_res));

          case 39:
            return _context4.abrupt("return", initialValue.coordinates);

          case 40:
            return _context4.abrupt("return", initialValue.coordinates.join(", "));

          case 41:
            return _context4.abrupt("break", 42);

          case 42:
            return _context4.abrupt("break", 44);

          case 43:
            return _context4.abrupt("break", 44);

          case 44:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return _transformValue.apply(this, arguments);
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

function hashBuilder(_x8) {
  return _hashBuilder.apply(this, arguments);
}

function _hashBuilder() {
  _hashBuilder = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(inputsToHash) {
    var inputsToNotHash,
        final_string,
        _iterator2,
        _step2,
        curr_in,
        res,
        _iterator3,
        _step3,
        _curr_in,
        _args5 = arguments;

    return _regenerator["default"].wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            inputsToNotHash = _args5.length > 1 && _args5[1] !== undefined ? _args5[1] : [];
            final_string = "";
            _iterator2 = _createForOfIteratorHelper(inputsToHash);
            _context5.prev = 3;

            _iterator2.s();

          case 5:
            if ((_step2 = _iterator2.n()).done) {
              _context5.next = 13;
              break;
            }

            curr_in = _step2.value;
            _context5.next = 9;
            return (0, _cryptoHash.sha256)(curr_in);

          case 9:
            res = _context5.sent;
            final_string += res.slice(0, 9);

          case 11:
            _context5.next = 5;
            break;

          case 13:
            _context5.next = 18;
            break;

          case 15:
            _context5.prev = 15;
            _context5.t0 = _context5["catch"](3);

            _iterator2.e(_context5.t0);

          case 18:
            _context5.prev = 18;

            _iterator2.f();

            return _context5.finish(18);

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

            return _context5.abrupt("return", final_string);

          case 24:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, null, [[3, 15, 18, 21]]);
  }));
  return _hashBuilder.apply(this, arguments);
}

function getTableNames(_x9) {
  return _getTableNames.apply(this, arguments);
}

function _getTableNames() {
  _getTableNames = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(db) {
    var collectionNames, currCollectionNames, _filtered_names;

    return _regenerator["default"].wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            collectionNames = [];
            _context6.next = 3;
            return db.listCollections({}, {
              nameOnly: true
            }).toArray();

          case 3:
            currCollectionNames = _context6.sent;

            if (currCollectionNames !== undefined && currCollectionNames.length !== 0) {
              _filtered_names = currCollectionNames.reduce(function (newArr, ele) {
                if (!ele.name.includes('.')) newArr.push(ele.name);
                return newArr;
              }, []);
              collectionNames.push.apply(collectionNames, (0, _toConsumableArray2["default"])(_filtered_names));
            }

            return _context6.abrupt("return", collectionNames);

          case 6:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  }));
  return _getTableNames.apply(this, arguments);
}

function roundToDecimal(number, places) {
  var multiplier = Math.pow(10, places); // For our example the multiplier will be 10 * 10 * 10 = 1000.

  return Math.round(number * multiplier) / multiplier;
}

var forEachAsyncParallel = /*#__PURE__*/function () {
  var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(array, callback, thisArg) {
    var promiseArray, _loop, i;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            promiseArray = [];

            _loop = function _loop(i) {
              if (i in array) {
                var p = Promise.resolve(array[i]).then(function (currentValue) {
                  return callback.call(thisArg || _this, currentValue, i, array);
                });
                promiseArray.push(p);
              }
            };

            for (i = 0; i < array.length; i++) {
              _loop(i);
            }

            _context.next = 5;
            return Promise.all(promiseArray);

          case 5:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function forEachAsyncParallel(_x10, _x11, _x12) {
    return _ref3.apply(this, arguments);
  };
}();

exports.forEachAsyncParallel = forEachAsyncParallel;