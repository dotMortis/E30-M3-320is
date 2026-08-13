var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/main.js
var main_exports = {};
__export(main_exports, {
  default: () => VaultSearchPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// node_modules/@orama/orama/dist/browser/components/tokenizer/languages.js
var STEMMERS = {
  arabic: "ar",
  armenian: "am",
  bulgarian: "bg",
  czech: "cz",
  danish: "dk",
  dutch: "nl",
  english: "en",
  finnish: "fi",
  french: "fr",
  german: "de",
  greek: "gr",
  hungarian: "hu",
  indian: "in",
  indonesian: "id",
  irish: "ie",
  italian: "it",
  lithuanian: "lt",
  nepali: "np",
  norwegian: "no",
  portuguese: "pt",
  romanian: "ro",
  russian: "ru",
  serbian: "rs",
  slovenian: "ru",
  spanish: "es",
  swedish: "se",
  tamil: "ta",
  turkish: "tr",
  ukrainian: "uk",
  sanskrit: "sk"
};
var SPLITTERS = {
  dutch: /[^A-Za-zàèéìòóù0-9_'-]+/gim,
  english: /[^A-Za-zàèéìòóù0-9_'-]+/gim,
  french: /[^a-z0-9äâàéèëêïîöôùüûœç-]+/gim,
  italian: /[^A-Za-zàèéìòóù0-9_'-]+/gim,
  norwegian: /[^a-z0-9_æøåÆØÅäÄöÖüÜ]+/gim,
  portuguese: /[^a-z0-9à-úÀ-Ú]/gim,
  russian: /[^a-z0-9а-яА-ЯёЁ]+/gim,
  spanish: /[^a-z0-9A-Zá-úÁ-ÚñÑüÜ]+/gim,
  swedish: /[^a-z0-9_åÅäÄöÖüÜ-]+/gim,
  german: /[^a-z0-9A-ZäöüÄÖÜß]+/gim,
  finnish: /[^a-z0-9äöÄÖ]+/gim,
  danish: /[^a-z0-9æøåÆØÅ]+/gim,
  hungarian: /[^a-z0-9áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+/gim,
  romanian: /[^a-z0-9ăâîșțĂÂÎȘȚ]+/gim,
  serbian: /[^a-z0-9čćžšđČĆŽŠĐ]+/gim,
  turkish: /[^a-z0-9çÇğĞıİöÖşŞüÜ]+/gim,
  lithuanian: /[^a-z0-9ąčęėįšųūžĄČĘĖĮŠŲŪŽ]+/gim,
  arabic: /[^a-z0-9أ-ي]+/gim,
  nepali: /[^a-z0-9अ-ह]+/gim,
  irish: /[^a-z0-9áéíóúÁÉÍÓÚ]+/gim,
  indian: /[^a-z0-9अ-ह]+/gim,
  armenian: /[^a-z0-9ա-ֆ]+/gim,
  greek: /[^a-z0-9α-ωά-ώ]+/gim,
  indonesian: /[^a-z0-9]+/gim,
  ukrainian: /[^a-z0-9а-яА-ЯіїєІЇЄ]+/gim,
  slovenian: /[^a-z0-9čžšČŽŠ]+/gim,
  bulgarian: /[^a-z0-9а-яА-Я]+/gim,
  tamil: /[^a-z0-9அ-ஹ]+/gim,
  sanskrit: /[^a-z0-9A-Zāīūṛḷṃṁḥśṣṭḍṇṅñḻḹṝ]+/gim,
  czech: /[^A-Z0-9a-zěščřžýáíéúůóťďĚŠČŘŽÝÁÍÉÓÚŮŤĎ-]+/gim
};
var SUPPORTED_LANGUAGES = Object.keys(STEMMERS);
function getLocale(language2) {
  return language2 !== void 0 && SUPPORTED_LANGUAGES.includes(language2) ? STEMMERS[language2] : void 0;
}

// node_modules/@orama/orama/dist/browser/utils.js
var baseId = Date.now().toString().slice(5);
var lastId = 0;
var nano = BigInt(1e3);
var milli = BigInt(1e6);
var second = BigInt(1e9);
var MAX_ARGUMENT_FOR_STACK = 65535;
function safeArrayPush(arr, newArr) {
  if (newArr.length < MAX_ARGUMENT_FOR_STACK) {
    Array.prototype.push.apply(arr, newArr);
  } else {
    const newArrLength = newArr.length;
    for (let i = 0; i < newArrLength; i += MAX_ARGUMENT_FOR_STACK) {
      Array.prototype.push.apply(arr, newArr.slice(i, i + MAX_ARGUMENT_FOR_STACK));
    }
  }
}
function sprintf(template, ...args) {
  return template.replace(/%(?:(?<position>\d+)\$)?(?<width>-?\d*\.?\d*)(?<type>[dfs])/g, function(...replaceArgs) {
    const groups = replaceArgs[replaceArgs.length - 1];
    const { width: rawWidth, type, position } = groups;
    const replacement = position ? args[Number.parseInt(position) - 1] : args.shift();
    const width = rawWidth === "" ? 0 : Number.parseInt(rawWidth);
    switch (type) {
      case "d":
        return replacement.toString().padStart(width, "0");
      case "f": {
        let value = replacement;
        const [padding, precision] = rawWidth.split(".").map((w) => Number.parseFloat(w));
        if (typeof precision === "number" && precision >= 0) {
          value = value.toFixed(precision);
        }
        return typeof padding === "number" && padding >= 0 ? value.toString().padStart(width, "0") : value.toString();
      }
      case "s":
        return width < 0 ? replacement.toString().padEnd(-width, " ") : replacement.toString().padStart(width, " ");
      default:
        return replacement;
    }
  });
}
function isInsideWebWorker() {
  return typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
}
function isInsideNode() {
  return typeof process !== "undefined" && process.release && process.release.name === "node";
}
function getNanosecondTimeViaPerformance() {
  return BigInt(Math.floor(performance.now() * 1e6));
}
function formatNanoseconds(value) {
  if (typeof value === "number") {
    value = BigInt(value);
  }
  if (value < nano) {
    return `${value}ns`;
  } else if (value < milli) {
    return `${value / nano}\u03BCs`;
  } else if (value < second) {
    return `${value / milli}ms`;
  }
  return `${value / second}s`;
}
function getNanosecondsTime() {
  if (isInsideWebWorker()) {
    return getNanosecondTimeViaPerformance();
  }
  if (isInsideNode()) {
    return process.hrtime.bigint();
  }
  if (typeof process !== "undefined" && typeof process?.hrtime?.bigint === "function") {
    return process.hrtime.bigint();
  }
  if (typeof performance !== "undefined") {
    return getNanosecondTimeViaPerformance();
  }
  return BigInt(0);
}
function uniqueId() {
  return `${baseId}-${lastId++}`;
}
function getOwnProperty(object, property) {
  if (Object.hasOwn === void 0) {
    return Object.prototype.hasOwnProperty.call(object, property) ? object[property] : void 0;
  }
  return Object.hasOwn(object, property) ? object[property] : void 0;
}
function sortTokenScorePredicate(a, b) {
  if (b[1] === a[1]) {
    return a[0] - b[0];
  }
  return b[1] - a[1];
}
function intersect(arrays) {
  if (arrays.length === 0) {
    return [];
  } else if (arrays.length === 1) {
    return arrays[0];
  }
  for (let i = 1; i < arrays.length; i++) {
    if (arrays[i].length < arrays[0].length) {
      const tmp = arrays[0];
      arrays[0] = arrays[i];
      arrays[i] = tmp;
    }
  }
  const set = /* @__PURE__ */ new Map();
  for (const elem of arrays[0]) {
    set.set(elem, 1);
  }
  for (let i = 1; i < arrays.length; i++) {
    let found = 0;
    for (const elem of arrays[i]) {
      const count3 = set.get(elem);
      if (count3 === i) {
        set.set(elem, count3 + 1);
        found++;
      }
    }
    if (found === 0)
      return [];
  }
  return arrays[0].filter((e) => {
    const count3 = set.get(e);
    if (count3 !== void 0)
      set.set(e, 0);
    return count3 === arrays.length;
  });
}
function getDocumentProperties(doc, paths) {
  const properties = {};
  const pathsLength = paths.length;
  for (let i = 0; i < pathsLength; i++) {
    const path = paths[i];
    const pathTokens = path.split(".");
    let current = doc;
    const pathTokensLength = pathTokens.length;
    for (let j = 0; j < pathTokensLength; j++) {
      current = current[pathTokens[j]];
      if (typeof current === "object") {
        if (current !== null && "lat" in current && "lon" in current && typeof current.lat === "number" && typeof current.lon === "number") {
          current = properties[path] = current;
          break;
        } else if (!Array.isArray(current) && current !== null && j === pathTokensLength - 1) {
          current = void 0;
          break;
        }
      } else if ((current === null || typeof current !== "object") && j < pathTokensLength - 1) {
        current = void 0;
        break;
      }
    }
    if (typeof current !== "undefined") {
      properties[path] = current;
    }
  }
  return properties;
}
function getNested(obj, path) {
  const props = getDocumentProperties(obj, [path]);
  return props[path];
}
var mapDistanceToMeters = {
  cm: 0.01,
  m: 1,
  km: 1e3,
  ft: 0.3048,
  yd: 0.9144,
  mi: 1609.344
};
function convertDistanceToMeters(distance, unit) {
  const ratio = mapDistanceToMeters[unit];
  if (ratio === void 0) {
    throw new Error(createError("INVALID_DISTANCE_SUFFIX", distance).message);
  }
  return distance * ratio;
}
function removeVectorsFromHits(searchResult, vectorProperties) {
  searchResult.hits = searchResult.hits.map((result) => ({
    ...result,
    document: {
      ...result.document,
      // Remove embeddings from the result
      ...vectorProperties.reduce((acc, prop) => {
        const path = prop.split(".");
        const lastKey = path.pop();
        let obj = acc;
        for (const key of path) {
          obj[key] = obj[key] ?? {};
          obj = obj[key];
        }
        obj[lastKey] = null;
        return acc;
      }, result.document)
    }
  }));
}
function isAsyncFunction(func) {
  if (Array.isArray(func)) {
    return func.some((item) => isAsyncFunction(item));
  }
  return func?.constructor?.name === "AsyncFunction";
}
var withIntersection = "intersection" in /* @__PURE__ */ new Set();
function setIntersection(...sets) {
  if (sets.length === 0) {
    return /* @__PURE__ */ new Set();
  }
  if (sets.length === 1) {
    return sets[0];
  }
  if (sets.length === 2) {
    const set1 = sets[0];
    const set2 = sets[1];
    if (withIntersection) {
      return set1.intersection(set2);
    }
    const result = /* @__PURE__ */ new Set();
    const base2 = set1.size < set2.size ? set1 : set2;
    const other = base2 === set1 ? set2 : set1;
    for (const value of base2) {
      if (other.has(value)) {
        result.add(value);
      }
    }
    return result;
  }
  const min = {
    index: 0,
    size: sets[0].size
  };
  for (let i = 1; i < sets.length; i++) {
    if (sets[i].size < min.size) {
      min.index = i;
      min.size = sets[i].size;
    }
  }
  if (withIntersection) {
    let base2 = sets[min.index];
    for (let i = 0; i < sets.length; i++) {
      if (i === min.index) {
        continue;
      }
      base2 = base2.intersection(sets[i]);
    }
    return base2;
  }
  const base = sets[min.index];
  for (let i = 0; i < sets.length; i++) {
    if (i === min.index) {
      continue;
    }
    const other = sets[i];
    for (const value of base) {
      if (!other.has(value)) {
        base.delete(value);
      }
    }
  }
  return base;
}
var withUnion = "union" in /* @__PURE__ */ new Set();
function setUnion(set1, set2) {
  if (withUnion) {
    if (set1) {
      return set1.union(set2);
    }
    return set2;
  }
  if (!set1) {
    return new Set(set2);
  }
  return /* @__PURE__ */ new Set([...set1, ...set2]);
}
function setDifference(set1, set2) {
  const result = /* @__PURE__ */ new Set();
  for (const value of set1) {
    if (!set2.has(value)) {
      result.add(value);
    }
  }
  return result;
}
function sleep(ms) {
  if (typeof SharedArrayBuffer !== "undefined" && typeof Atomics !== "undefined") {
    const nil = new Int32Array(new SharedArrayBuffer(4));
    const valid = ms > 0 && ms < Infinity;
    if (valid === false) {
      if (typeof ms !== "number" && typeof ms !== "bigint") {
        throw TypeError("sleep: ms must be a number");
      }
      throw RangeError("sleep: ms must be a number that is greater than 0 but less than Infinity");
    }
    Atomics.wait(nil, 0, 0, Number(ms));
  } else {
    const valid = ms > 0 && ms < Infinity;
    if (valid === false) {
      if (typeof ms !== "number" && typeof ms !== "bigint") {
        throw TypeError("sleep: ms must be a number");
      }
      throw RangeError("sleep: ms must be a number that is greater than 0 but less than Infinity");
    }
    const target = Date.now() + Number(ms);
    while (target > Date.now()) {
    }
  }
}

// node_modules/@orama/orama/dist/browser/errors.js
var allLanguages = SUPPORTED_LANGUAGES.join("\n - ");
var errors = {
  NO_LANGUAGE_WITH_CUSTOM_TOKENIZER: "Do not pass the language option to create when using a custom tokenizer.",
  LANGUAGE_NOT_SUPPORTED: `Language "%s" is not supported.
Supported languages are:
 - ${allLanguages}`,
  INVALID_STEMMER_FUNCTION_TYPE: `config.stemmer property must be a function.`,
  MISSING_STEMMER: `As of version 1.0.0 @orama/orama does not ship non English stemmers by default. To solve this, please explicitly import and specify the "%s" stemmer from the package @orama/stemmers. See https://docs.orama.com/docs/orama-js/text-analysis/stemming for more information.`,
  CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY: "Custom stop words array must only contain strings.",
  UNSUPPORTED_COMPONENT: `Unsupported component "%s".`,
  COMPONENT_MUST_BE_FUNCTION: `The component "%s" must be a function.`,
  COMPONENT_MUST_BE_FUNCTION_OR_ARRAY_FUNCTIONS: `The component "%s" must be a function or an array of functions.`,
  INVALID_SCHEMA_TYPE: `Unsupported schema type "%s" at "%s". Expected "string", "boolean" or "number" or array of them.`,
  DOCUMENT_ID_MUST_BE_STRING: `Document id must be of type "string". Got "%s" instead.`,
  DOCUMENT_ALREADY_EXISTS: `A document with id "%s" already exists.`,
  DOCUMENT_DOES_NOT_EXIST: `A document with id "%s" does not exists.`,
  MISSING_DOCUMENT_PROPERTY: `Missing searchable property "%s".`,
  INVALID_DOCUMENT_PROPERTY: `Invalid document property "%s": expected "%s", got "%s"`,
  UNKNOWN_INDEX: `Invalid property name "%s". Expected a wildcard string ("*") or array containing one of the following properties: %s`,
  INVALID_BOOST_VALUE: `Boost value must be a number greater than, or less than 0.`,
  INVALID_FILTER_OPERATION: `You can only use one operation per filter, you requested %d.`,
  SCHEMA_VALIDATION_FAILURE: `Cannot insert document due schema validation failure on "%s" property.`,
  INVALID_SORT_SCHEMA_TYPE: `Unsupported sort schema type "%s" at "%s". Expected "string" or "number".`,
  CANNOT_SORT_BY_ARRAY: `Cannot configure sort for "%s" because it is an array (%s).`,
  UNABLE_TO_SORT_ON_UNKNOWN_FIELD: `Unable to sort on unknown field "%s". Allowed fields: %s`,
  SORT_DISABLED: `Sort is disabled. Please read the documentation at https://docs.orama.com/docs/orama-js for more information.`,
  UNKNOWN_GROUP_BY_PROPERTY: `Unknown groupBy property "%s".`,
  INVALID_GROUP_BY_PROPERTY: `Invalid groupBy property "%s". Allowed types: "%s", but given "%s".`,
  UNKNOWN_FILTER_PROPERTY: `Unknown filter property "%s".`,
  UNKNOWN_VECTOR_PROPERTY: `Unknown vector property "%s". Make sure the property exists in the schema and is configured as a vector.`,
  INVALID_VECTOR_SIZE: `Vector size must be a number greater than 0. Got "%s" instead.`,
  INVALID_VECTOR_VALUE: `Vector value must be a number greater than 0. Got "%s" instead.`,
  INVALID_INPUT_VECTOR: `Property "%s" was declared as a %s-dimensional vector, but got a %s-dimensional vector instead.
Input vectors must be of the size declared in the schema, as calculating similarity between vectors of different sizes can lead to unexpected results.`,
  WRONG_SEARCH_PROPERTY_TYPE: `Property "%s" is not searchable. Only "string" properties are searchable.`,
  FACET_NOT_SUPPORTED: `Facet doens't support the type "%s".`,
  INVALID_DISTANCE_SUFFIX: `Invalid distance suffix "%s". Valid suffixes are: cm, m, km, mi, yd, ft.`,
  INVALID_SEARCH_MODE: `Invalid search mode "%s". Valid modes are: "fulltext", "vector", "hybrid".`,
  MISSING_VECTOR_AND_SECURE_PROXY: `No vector was provided and no secure proxy was configured. Please provide a vector or configure an Orama Secure Proxy to perform hybrid search.`,
  MISSING_TERM: `"term" is a required parameter when performing hybrid search. Please provide a search term.`,
  INVALID_VECTOR_INPUT: `Invalid "vector" property. Expected an object with "value" and "property" properties, but got "%s" instead.`,
  PLUGIN_CRASHED: `A plugin crashed during initialization. Please check the error message for more information:`,
  PLUGIN_SECURE_PROXY_NOT_FOUND: `Could not find '@orama/secure-proxy-plugin' installed in your Orama instance.
Please install it before proceeding with creating an answer session.
Read more at https://docs.orama.com/docs/orama-js/plugins/plugin-secure-proxy#plugin-secure-proxy
`,
  PLUGIN_SECURE_PROXY_MISSING_CHAT_MODEL: `Could not find a chat model defined in the secure proxy plugin configuration.
Please provide a chat model before proceeding with creating an answer session.
Read more at https://docs.orama.com/docs/orama-js/plugins/plugin-secure-proxy#plugin-secure-proxy
`,
  ANSWER_SESSION_LAST_MESSAGE_IS_NOT_ASSISTANT: `The last message in the session is not an assistant message. Cannot regenerate non-assistant messages.`,
  PLUGIN_COMPONENT_CONFLICT: `The component "%s" is already defined. The plugin "%s" is trying to redefine it.`
};
function createError(code, ...args) {
  const error = new Error(sprintf(errors[code] ?? `Unsupported Orama Error code: ${code}`, ...args));
  error.code = code;
  if ("captureStackTrace" in Error.prototype) {
    Error.captureStackTrace(error);
  }
  return error;
}

// node_modules/@orama/orama/dist/browser/components/defaults.js
function formatElapsedTime(n) {
  return {
    raw: Number(n),
    formatted: formatNanoseconds(n)
  };
}
function getDocumentIndexId(doc) {
  if (doc.id) {
    if (typeof doc.id !== "string") {
      throw createError("DOCUMENT_ID_MUST_BE_STRING", typeof doc.id);
    }
    return doc.id;
  }
  return uniqueId();
}
function validateSchema(doc, schema) {
  for (const [prop, type] of Object.entries(schema)) {
    const value = doc[prop];
    if (typeof value === "undefined") {
      continue;
    }
    if (type === "geopoint" && typeof value === "object" && typeof value.lon === "number" && typeof value.lat === "number") {
      continue;
    }
    if (type === "enum" && (typeof value === "string" || typeof value === "number")) {
      continue;
    }
    if (type === "enum[]" && Array.isArray(value)) {
      const valueLength = value.length;
      for (let i = 0; i < valueLength; i++) {
        if (typeof value[i] !== "string" && typeof value[i] !== "number") {
          return prop + "." + i;
        }
      }
      continue;
    }
    if (isVectorType(type)) {
      const vectorSize = getVectorSize(type);
      if (!Array.isArray(value) || value.length !== vectorSize) {
        throw createError("INVALID_INPUT_VECTOR", prop, vectorSize, value.length);
      }
      continue;
    }
    if (isArrayType(type)) {
      if (!Array.isArray(value)) {
        return prop;
      }
      const expectedType = getInnerType(type);
      const valueLength = value.length;
      for (let i = 0; i < valueLength; i++) {
        if (typeof value[i] !== expectedType) {
          return prop + "." + i;
        }
      }
      continue;
    }
    if (typeof type === "object") {
      if (!value || typeof value !== "object") {
        return prop;
      }
      const subProp = validateSchema(value, type);
      if (subProp) {
        return prop + "." + subProp;
      }
      continue;
    }
    if (typeof value !== type) {
      return prop;
    }
  }
  return void 0;
}
var IS_ARRAY_TYPE = {
  string: false,
  number: false,
  boolean: false,
  enum: false,
  geopoint: false,
  "string[]": true,
  "number[]": true,
  "boolean[]": true,
  "enum[]": true
};
var INNER_TYPE = {
  "string[]": "string",
  "number[]": "number",
  "boolean[]": "boolean",
  "enum[]": "enum"
};
function isGeoPointType(type) {
  return type === "geopoint";
}
function isVectorType(type) {
  return typeof type === "string" && /^vector\[\d+\]$/.test(type);
}
function isArrayType(type) {
  return typeof type === "string" && IS_ARRAY_TYPE[type];
}
function getInnerType(type) {
  return INNER_TYPE[type];
}
function getVectorSize(type) {
  const size = Number(type.slice(7, -1));
  switch (true) {
    case isNaN(size):
      throw createError("INVALID_VECTOR_VALUE", type);
    case size <= 0:
      throw createError("INVALID_VECTOR_SIZE", type);
    default:
      return size;
  }
}

// node_modules/@orama/orama/dist/browser/components/internal-document-id-store.js
function createInternalDocumentIDStore() {
  return {
    idToInternalId: /* @__PURE__ */ new Map(),
    internalIdToId: [],
    save,
    load
  };
}
function save(store2) {
  return {
    internalIdToId: store2.internalIdToId
  };
}
function load(orama, raw) {
  const { internalIdToId } = raw;
  orama.internalDocumentIDStore.idToInternalId.clear();
  orama.internalDocumentIDStore.internalIdToId = [];
  const internalIdToIdLength = internalIdToId.length;
  for (let i = 0; i < internalIdToIdLength; i++) {
    const internalIdItem = internalIdToId[i];
    orama.internalDocumentIDStore.idToInternalId.set(internalIdItem, i + 1);
    orama.internalDocumentIDStore.internalIdToId.push(internalIdItem);
  }
}
function getInternalDocumentId(store2, id) {
  if (typeof id === "string") {
    const internalId = store2.idToInternalId.get(id);
    if (internalId) {
      return internalId;
    }
    const currentId = store2.idToInternalId.size + 1;
    store2.idToInternalId.set(id, currentId);
    store2.internalIdToId.push(id);
    return currentId;
  }
  if (id > store2.internalIdToId.length) {
    return getInternalDocumentId(store2, id.toString());
  }
  return id;
}
function getDocumentIdFromInternalId(store2, internalId) {
  if (store2.internalIdToId.length < internalId) {
    throw new Error(`Invalid internalId ${internalId}`);
  }
  return store2.internalIdToId[internalId - 1];
}

// node_modules/@orama/orama/dist/browser/components/documents-store.js
function create(_, sharedInternalDocumentStore) {
  return {
    sharedInternalDocumentStore,
    docs: {},
    count: 0
  };
}
function get(store2, id) {
  const internalId = getInternalDocumentId(store2.sharedInternalDocumentStore, id);
  return store2.docs[internalId];
}
function getMultiple(store2, ids) {
  const idsLength = ids.length;
  const found = Array.from({ length: idsLength });
  for (let i = 0; i < idsLength; i++) {
    const internalId = getInternalDocumentId(store2.sharedInternalDocumentStore, ids[i]);
    found[i] = store2.docs[internalId];
  }
  return found;
}
function getAll(store2) {
  return store2.docs;
}
function store(store2, id, internalId, doc) {
  if (typeof store2.docs[internalId] !== "undefined") {
    return false;
  }
  store2.docs[internalId] = doc;
  store2.count++;
  return true;
}
function remove(store2, id) {
  const internalId = getInternalDocumentId(store2.sharedInternalDocumentStore, id);
  if (typeof store2.docs[internalId] === "undefined") {
    return false;
  }
  delete store2.docs[internalId];
  store2.count--;
  return true;
}
function count(store2) {
  return store2.count;
}
function load2(sharedInternalDocumentStore, raw) {
  const rawDocument = raw;
  return {
    docs: rawDocument.docs,
    count: rawDocument.count,
    sharedInternalDocumentStore
  };
}
function save2(store2) {
  return {
    docs: store2.docs,
    count: store2.count
  };
}
function createDocumentsStore() {
  return {
    create,
    get,
    getMultiple,
    getAll,
    store,
    remove,
    count,
    load: load2,
    save: save2
  };
}

// node_modules/@orama/orama/dist/browser/components/plugins.js
var AVAILABLE_PLUGIN_HOOKS = [
  "beforeInsert",
  "afterInsert",
  "beforeRemove",
  "afterRemove",
  "beforeUpdate",
  "afterUpdate",
  "beforeUpsert",
  "afterUpsert",
  "beforeSearch",
  "afterSearch",
  "beforeInsertMultiple",
  "afterInsertMultiple",
  "beforeRemoveMultiple",
  "afterRemoveMultiple",
  "beforeUpdateMultiple",
  "afterUpdateMultiple",
  "beforeUpsertMultiple",
  "afterUpsertMultiple",
  "beforeLoad",
  "afterLoad",
  "afterCreate"
];
function getAllPluginsByHook(orama, hook) {
  const pluginsToRun = [];
  const pluginsLength = orama.plugins?.length;
  if (!pluginsLength) {
    return pluginsToRun;
  }
  for (let i = 0; i < pluginsLength; i++) {
    try {
      const plugin = orama.plugins[i];
      if (typeof plugin[hook] === "function") {
        pluginsToRun.push(plugin[hook]);
      }
    } catch (error) {
      console.error("Caught error in getAllPluginsByHook:", error);
      throw createError("PLUGIN_CRASHED");
    }
  }
  return pluginsToRun;
}

// node_modules/@orama/orama/dist/browser/components/hooks.js
var OBJECT_COMPONENTS = ["tokenizer", "index", "documentsStore", "sorter", "pinning"];
var FUNCTION_COMPONENTS = [
  "validateSchema",
  "getDocumentIndexId",
  "getDocumentProperties",
  "formatElapsedTime"
];
function runSingleHook(hooks, orama, id, doc) {
  const needAsync = hooks.some(isAsyncFunction);
  if (needAsync) {
    return (async () => {
      for (const hook of hooks) {
        await hook(orama, id, doc);
      }
    })();
  } else {
    for (const hook of hooks) {
      hook(orama, id, doc);
    }
  }
}
function runMultipleHook(hooks, orama, docsOrIds) {
  const needAsync = hooks.some(isAsyncFunction);
  if (needAsync) {
    return (async () => {
      for (const hook of hooks) {
        await hook(orama, docsOrIds);
      }
    })();
  } else {
    for (const hook of hooks) {
      hook(orama, docsOrIds);
    }
  }
}
function runAfterSearch(hooks, db, params, language2, results) {
  const needAsync = hooks.some(isAsyncFunction);
  if (needAsync) {
    return (async () => {
      for (const hook of hooks) {
        await hook(db, params, language2, results);
      }
    })();
  } else {
    for (const hook of hooks) {
      hook(db, params, language2, results);
    }
  }
}
function runBeforeSearch(hooks, db, params, language2) {
  const needAsync = hooks.some(isAsyncFunction);
  if (needAsync) {
    return (async () => {
      for (const hook of hooks) {
        await hook(db, params, language2);
      }
    })();
  } else {
    for (const hook of hooks) {
      hook(db, params, language2);
    }
  }
}
function runAfterCreate(hooks, db) {
  const needAsync = hooks.some(isAsyncFunction);
  if (needAsync) {
    return (async () => {
      for (const hook of hooks) {
        await hook(db);
      }
    })();
  } else {
    for (const hook of hooks) {
      hook(db);
    }
  }
}

// node_modules/@orama/orama/dist/browser/trees/avl.js
var AVLNode = class _AVLNode {
  constructor(key, value) {
    __publicField(this, "k");
    __publicField(this, "v");
    __publicField(this, "l", null);
    __publicField(this, "r", null);
    __publicField(this, "h", 1);
    this.k = key;
    this.v = new Set(value);
  }
  updateHeight() {
    this.h = Math.max(_AVLNode.getHeight(this.l), _AVLNode.getHeight(this.r)) + 1;
  }
  static getHeight(node) {
    return node ? node.h : 0;
  }
  getBalanceFactor() {
    return _AVLNode.getHeight(this.l) - _AVLNode.getHeight(this.r);
  }
  rotateLeft() {
    const newRoot = this.r;
    this.r = newRoot.l;
    newRoot.l = this;
    this.updateHeight();
    newRoot.updateHeight();
    return newRoot;
  }
  rotateRight() {
    const newRoot = this.l;
    this.l = newRoot.r;
    newRoot.r = this;
    this.updateHeight();
    newRoot.updateHeight();
    return newRoot;
  }
  toJSON() {
    return {
      k: this.k,
      v: Array.from(this.v),
      l: this.l ? this.l.toJSON() : null,
      r: this.r ? this.r.toJSON() : null,
      h: this.h
    };
  }
  static fromJSON(json) {
    const node = new _AVLNode(json.k, json.v);
    node.l = json.l ? _AVLNode.fromJSON(json.l) : null;
    node.r = json.r ? _AVLNode.fromJSON(json.r) : null;
    node.h = json.h;
    return node;
  }
};
var AVLTree = class _AVLTree {
  constructor(key, value) {
    __publicField(this, "root", null);
    __publicField(this, "insertCount", 0);
    if (key !== void 0 && value !== void 0) {
      this.root = new AVLNode(key, value);
    }
  }
  insert(key, value, rebalanceThreshold = 1e3) {
    this.root = this.insertNode(this.root, key, value, rebalanceThreshold);
  }
  insertMultiple(key, value, rebalanceThreshold = 1e3) {
    for (const v2 of value) {
      this.insert(key, v2, rebalanceThreshold);
    }
  }
  // Rebalance the tree if the insert count reaches the threshold.
  // This will improve insertion performance since we won't be rebalancing the tree on every insert.
  // When inserting docs using `insertMultiple`, the threshold will be set to the number of docs being inserted.
  // We can force rebalancing the tree by setting the threshold to 1 (default).
  rebalance() {
    if (this.root) {
      this.root = this.rebalanceNode(this.root);
    }
  }
  toJSON() {
    return {
      root: this.root ? this.root.toJSON() : null,
      insertCount: this.insertCount
    };
  }
  static fromJSON(json) {
    const tree = new _AVLTree();
    tree.root = json.root ? AVLNode.fromJSON(json.root) : null;
    tree.insertCount = json.insertCount || 0;
    return tree;
  }
  insertNode(node, key, value, rebalanceThreshold) {
    if (node === null) {
      return new AVLNode(key, [value]);
    }
    const path = [];
    let current = node;
    let parent = null;
    while (current !== null) {
      path.push({ parent, node: current });
      if (key < current.k) {
        if (current.l === null) {
          current.l = new AVLNode(key, [value]);
          path.push({ parent: current, node: current.l });
          break;
        } else {
          parent = current;
          current = current.l;
        }
      } else if (key > current.k) {
        if (current.r === null) {
          current.r = new AVLNode(key, [value]);
          path.push({ parent: current, node: current.r });
          break;
        } else {
          parent = current;
          current = current.r;
        }
      } else {
        current.v.add(value);
        return node;
      }
    }
    let needRebalance = false;
    if (this.insertCount++ % rebalanceThreshold === 0) {
      needRebalance = true;
    }
    for (let i = path.length - 1; i >= 0; i--) {
      const { parent: parent2, node: currentNode } = path[i];
      currentNode.updateHeight();
      if (needRebalance) {
        const rebalancedNode = this.rebalanceNode(currentNode);
        if (parent2) {
          if (parent2.l === currentNode) {
            parent2.l = rebalancedNode;
          } else if (parent2.r === currentNode) {
            parent2.r = rebalancedNode;
          }
        } else {
          node = rebalancedNode;
        }
      }
    }
    return node;
  }
  rebalanceNode(node) {
    const balanceFactor = node.getBalanceFactor();
    if (balanceFactor > 1) {
      if (node.l && node.l.getBalanceFactor() >= 0) {
        return node.rotateRight();
      } else if (node.l) {
        node.l = node.l.rotateLeft();
        return node.rotateRight();
      }
    }
    if (balanceFactor < -1) {
      if (node.r && node.r.getBalanceFactor() <= 0) {
        return node.rotateLeft();
      } else if (node.r) {
        node.r = node.r.rotateRight();
        return node.rotateLeft();
      }
    }
    return node;
  }
  find(key) {
    const node = this.findNodeByKey(key);
    return node ? node.v : null;
  }
  contains(key) {
    return this.find(key) !== null;
  }
  getSize() {
    let count3 = 0;
    const stack = [];
    let current = this.root;
    while (current || stack.length > 0) {
      while (current) {
        stack.push(current);
        current = current.l;
      }
      current = stack.pop();
      count3++;
      current = current.r;
    }
    return count3;
  }
  isBalanced() {
    if (!this.root)
      return true;
    const stack = [this.root];
    while (stack.length > 0) {
      const node = stack.pop();
      const balanceFactor = node.getBalanceFactor();
      if (Math.abs(balanceFactor) > 1) {
        return false;
      }
      if (node.l)
        stack.push(node.l);
      if (node.r)
        stack.push(node.r);
    }
    return true;
  }
  remove(key) {
    this.root = this.removeNode(this.root, key);
  }
  removeDocument(key, id) {
    const node = this.findNodeByKey(key);
    if (!node) {
      return;
    }
    if (node.v.size === 1) {
      this.root = this.removeNode(this.root, key);
    } else {
      node.v = new Set([...node.v.values()].filter((v2) => v2 !== id));
    }
  }
  findNodeByKey(key) {
    let node = this.root;
    while (node) {
      if (key < node.k) {
        node = node.l;
      } else if (key > node.k) {
        node = node.r;
      } else {
        return node;
      }
    }
    return null;
  }
  removeNode(node, key) {
    if (node === null)
      return null;
    const path = [];
    let current = node;
    while (current !== null && current.k !== key) {
      path.push(current);
      if (key < current.k) {
        current = current.l;
      } else {
        current = current.r;
      }
    }
    if (current === null) {
      return node;
    }
    if (current.l === null || current.r === null) {
      const child = current.l ? current.l : current.r;
      if (path.length === 0) {
        node = child;
      } else {
        const parent = path[path.length - 1];
        if (parent.l === current) {
          parent.l = child;
        } else {
          parent.r = child;
        }
      }
    } else {
      let successorParent = current;
      let successor = current.r;
      while (successor.l !== null) {
        successorParent = successor;
        successor = successor.l;
      }
      current.k = successor.k;
      current.v = successor.v;
      if (successorParent.l === successor) {
        successorParent.l = successor.r;
      } else {
        successorParent.r = successor.r;
      }
      current = successorParent;
    }
    path.push(current);
    for (let i = path.length - 1; i >= 0; i--) {
      const currentNode = path[i];
      currentNode.updateHeight();
      const rebalancedNode = this.rebalanceNode(currentNode);
      if (i > 0) {
        const parent = path[i - 1];
        if (parent.l === currentNode) {
          parent.l = rebalancedNode;
        } else if (parent.r === currentNode) {
          parent.r = rebalancedNode;
        }
      } else {
        node = rebalancedNode;
      }
    }
    return node;
  }
  rangeSearch(min, max) {
    const result = /* @__PURE__ */ new Set();
    const stack = [];
    let current = this.root;
    while (current || stack.length > 0) {
      while (current) {
        stack.push(current);
        current = current.l;
      }
      current = stack.pop();
      if (current.k >= min && current.k <= max) {
        for (const value of current.v) {
          result.add(value);
        }
      }
      if (current.k > max) {
        break;
      }
      current = current.r;
    }
    return result;
  }
  greaterThan(key, inclusive = false) {
    const result = /* @__PURE__ */ new Set();
    const stack = [];
    let current = this.root;
    while (current || stack.length > 0) {
      while (current) {
        stack.push(current);
        current = current.r;
      }
      current = stack.pop();
      if (inclusive && current.k >= key || !inclusive && current.k > key) {
        for (const value of current.v) {
          result.add(value);
        }
      } else if (current.k <= key) {
        break;
      }
      current = current.l;
    }
    return result;
  }
  lessThan(key, inclusive = false) {
    const result = /* @__PURE__ */ new Set();
    const stack = [];
    let current = this.root;
    while (current || stack.length > 0) {
      while (current) {
        stack.push(current);
        current = current.l;
      }
      current = stack.pop();
      if (inclusive && current.k <= key || !inclusive && current.k < key) {
        for (const value of current.v) {
          result.add(value);
        }
      } else if (current.k > key) {
        break;
      }
      current = current.r;
    }
    return result;
  }
};

// node_modules/@orama/orama/dist/browser/trees/flat.js
var FlatTree = class _FlatTree {
  constructor() {
    __publicField(this, "numberToDocumentId");
    this.numberToDocumentId = /* @__PURE__ */ new Map();
  }
  insert(key, value) {
    if (this.numberToDocumentId.has(key)) {
      this.numberToDocumentId.get(key).add(value);
    } else {
      this.numberToDocumentId.set(key, /* @__PURE__ */ new Set([value]));
    }
  }
  find(key) {
    const idSet = this.numberToDocumentId.get(key);
    return idSet ? Array.from(idSet) : null;
  }
  remove(key) {
    this.numberToDocumentId.delete(key);
  }
  removeDocument(id, key) {
    const idSet = this.numberToDocumentId.get(key);
    if (idSet) {
      idSet.delete(id);
      if (idSet.size === 0) {
        this.numberToDocumentId.delete(key);
      }
    }
  }
  contains(key) {
    return this.numberToDocumentId.has(key);
  }
  getSize() {
    let size = 0;
    for (const idSet of this.numberToDocumentId.values()) {
      size += idSet.size;
    }
    return size;
  }
  filter(operation) {
    const operationKeys = Object.keys(operation);
    if (operationKeys.length !== 1) {
      throw new Error("Invalid operation");
    }
    const operationType = operationKeys[0];
    switch (operationType) {
      case "eq": {
        const value = operation[operationType];
        const idSet = this.numberToDocumentId.get(value);
        return idSet ? Array.from(idSet) : [];
      }
      case "in": {
        const values = operation[operationType];
        const resultSet = /* @__PURE__ */ new Set();
        for (const value of values) {
          const idSet = this.numberToDocumentId.get(value);
          if (idSet) {
            for (const id of idSet) {
              resultSet.add(id);
            }
          }
        }
        return Array.from(resultSet);
      }
      case "nin": {
        const excludeValues = new Set(operation[operationType]);
        const resultSet = /* @__PURE__ */ new Set();
        for (const [key, idSet] of this.numberToDocumentId.entries()) {
          if (!excludeValues.has(key)) {
            for (const id of idSet) {
              resultSet.add(id);
            }
          }
        }
        return Array.from(resultSet);
      }
      default:
        throw new Error("Invalid operation");
    }
  }
  filterArr(operation) {
    const operationKeys = Object.keys(operation);
    if (operationKeys.length !== 1) {
      throw new Error("Invalid operation");
    }
    const operationType = operationKeys[0];
    switch (operationType) {
      case "containsAll": {
        const values = operation[operationType];
        const idSets = values.map((value) => this.numberToDocumentId.get(value) ?? /* @__PURE__ */ new Set());
        if (idSets.length === 0)
          return [];
        const intersection = idSets.reduce((prev, curr) => {
          return new Set([...prev].filter((id) => curr.has(id)));
        });
        return Array.from(intersection);
      }
      case "containsAny": {
        const values = operation[operationType];
        const idSets = values.map((value) => this.numberToDocumentId.get(value) ?? /* @__PURE__ */ new Set());
        if (idSets.length === 0)
          return [];
        const union = idSets.reduce((prev, curr) => {
          return /* @__PURE__ */ new Set([...prev, ...curr]);
        });
        return Array.from(union);
      }
      default:
        throw new Error("Invalid operation");
    }
  }
  static fromJSON(json) {
    if (!json.numberToDocumentId) {
      throw new Error("Invalid Flat Tree JSON");
    }
    const tree = new _FlatTree();
    for (const [key, ids] of json.numberToDocumentId) {
      tree.numberToDocumentId.set(key, new Set(ids));
    }
    return tree;
  }
  toJSON() {
    return {
      numberToDocumentId: Array.from(this.numberToDocumentId.entries()).map(([key, idSet]) => [key, Array.from(idSet)])
    };
  }
};

// node_modules/@orama/orama/dist/browser/components/levenshtein.js
function _boundedLevenshtein(term, word, tolerance) {
  if (tolerance < 0)
    return -1;
  if (term === word)
    return 0;
  const m = term.length;
  const n = word.length;
  if (m === 0)
    return n <= tolerance ? n : -1;
  if (n === 0)
    return m <= tolerance ? m : -1;
  const diff = Math.abs(m - n);
  if (term.startsWith(word)) {
    return diff <= tolerance ? diff : -1;
  }
  if (word.startsWith(term)) {
    return 0;
  }
  if (diff > tolerance)
    return -1;
  const matrix = [];
  for (let i = 0; i <= m; i++) {
    matrix[i] = [i];
    for (let j = 1; j <= n; j++) {
      matrix[i][j] = i === 0 ? j : 0;
    }
  }
  for (let i = 1; i <= m; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= n; j++) {
      if (term[i - 1] === word[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          // deletion
          matrix[i][j - 1] + 1,
          // insertion
          matrix[i - 1][j - 1] + 1
          // substitution
        );
      }
      rowMin = Math.min(rowMin, matrix[i][j]);
    }
    if (rowMin > tolerance) {
      return -1;
    }
  }
  return matrix[m][n] <= tolerance ? matrix[m][n] : -1;
}
function syncBoundedLevenshtein(term, w, tolerance) {
  const distance = _boundedLevenshtein(term, w, tolerance);
  return {
    distance,
    isBounded: distance >= 0
  };
}

// node_modules/@orama/orama/dist/browser/trees/radix.js
var RadixNode = class _RadixNode {
  constructor(key, subWord, end) {
    // Node key
    __publicField(this, "k");
    // Node subword
    __publicField(this, "s");
    // Node children
    __publicField(this, "c", /* @__PURE__ */ new Map());
    // Node documents
    __publicField(this, "d", /* @__PURE__ */ new Set());
    // Node end
    __publicField(this, "e");
    // Node word
    __publicField(this, "w", "");
    this.k = key;
    this.s = subWord;
    this.e = end;
  }
  updateParent(parent) {
    this.w = parent.w + this.s;
  }
  addDocument(docID) {
    this.d.add(docID);
  }
  removeDocument(docID) {
    return this.d.delete(docID);
  }
  findAllWords(output, term, exact, tolerance) {
    const stack = [this];
    while (stack.length > 0) {
      const node = stack.pop();
      if (node.e) {
        const { w, d: docIDs } = node;
        if (exact && w !== term) {
          continue;
        }
        if (getOwnProperty(output, w) !== null) {
          if (tolerance) {
            const difference = Math.abs(term.length - w.length);
            if (difference <= tolerance && syncBoundedLevenshtein(term, w, tolerance).isBounded) {
              output[w] = [];
            } else {
              continue;
            }
          } else {
            output[w] = [];
          }
        }
        if (getOwnProperty(output, w) != null && docIDs.size > 0) {
          const docs = output[w];
          for (const docID of docIDs) {
            if (!docs.includes(docID)) {
              docs.push(docID);
            }
          }
        }
      }
      if (node.c.size > 0) {
        stack.push(...node.c.values());
      }
    }
    return output;
  }
  insert(word, docId) {
    let node = this;
    let i = 0;
    const wordLength = word.length;
    while (i < wordLength) {
      const currentCharacter = word[i];
      const childNode = node.c.get(currentCharacter);
      if (childNode) {
        const edgeLabel = childNode.s;
        const edgeLabelLength = edgeLabel.length;
        let j = 0;
        while (j < edgeLabelLength && i + j < wordLength && edgeLabel[j] === word[i + j]) {
          j++;
        }
        if (j === edgeLabelLength) {
          node = childNode;
          i += j;
          if (i === wordLength) {
            if (!childNode.e) {
              childNode.e = true;
            }
            childNode.addDocument(docId);
            return;
          }
          continue;
        }
        const commonPrefix = edgeLabel.slice(0, j);
        const newEdgeLabel = edgeLabel.slice(j);
        const newWordLabel = word.slice(i + j);
        const inbetweenNode = new _RadixNode(commonPrefix[0], commonPrefix, false);
        node.c.set(commonPrefix[0], inbetweenNode);
        inbetweenNode.updateParent(node);
        childNode.s = newEdgeLabel;
        childNode.k = newEdgeLabel[0];
        inbetweenNode.c.set(newEdgeLabel[0], childNode);
        childNode.updateParent(inbetweenNode);
        if (newWordLabel) {
          const newNode = new _RadixNode(newWordLabel[0], newWordLabel, true);
          newNode.addDocument(docId);
          inbetweenNode.c.set(newWordLabel[0], newNode);
          newNode.updateParent(inbetweenNode);
        } else {
          inbetweenNode.e = true;
          inbetweenNode.addDocument(docId);
        }
        return;
      } else {
        const newNode = new _RadixNode(currentCharacter, word.slice(i), true);
        newNode.addDocument(docId);
        node.c.set(currentCharacter, newNode);
        newNode.updateParent(node);
        return;
      }
    }
    if (!node.e) {
      node.e = true;
    }
    node.addDocument(docId);
  }
  _findLevenshtein(term, index, tolerance, originalTolerance, output) {
    const stack = [{ node: this, index, tolerance }];
    while (stack.length > 0) {
      const { node, index: index2, tolerance: tolerance2 } = stack.pop();
      if (node.w.startsWith(term)) {
        node.findAllWords(output, term, false, 0);
        continue;
      }
      if (tolerance2 < 0) {
        continue;
      }
      if (node.e) {
        const { w, d: docIDs } = node;
        if (w) {
          if (syncBoundedLevenshtein(term, w, originalTolerance).isBounded) {
            output[w] = [];
          }
          if (getOwnProperty(output, w) !== void 0 && docIDs.size > 0) {
            const docs = new Set(output[w]);
            for (const docID of docIDs) {
              docs.add(docID);
            }
            output[w] = Array.from(docs);
          }
        }
      }
      if (index2 >= term.length) {
        continue;
      }
      const currentChar = term[index2];
      if (node.c.has(currentChar)) {
        const childNode = node.c.get(currentChar);
        stack.push({ node: childNode, index: index2 + 1, tolerance: tolerance2 });
      }
      stack.push({ node, index: index2 + 1, tolerance: tolerance2 - 1 });
      for (const [character, childNode] of node.c) {
        stack.push({ node: childNode, index: index2, tolerance: tolerance2 - 1 });
        if (character !== currentChar) {
          stack.push({ node: childNode, index: index2 + 1, tolerance: tolerance2 - 1 });
        }
      }
    }
  }
  find(params) {
    const { term, exact, tolerance } = params;
    if (tolerance && !exact) {
      const output = {};
      this._findLevenshtein(term, 0, tolerance, tolerance, output);
      return output;
    } else {
      let node = this;
      let i = 0;
      const termLength = term.length;
      while (i < termLength) {
        const character = term[i];
        const childNode = node.c.get(character);
        if (childNode) {
          const edgeLabel = childNode.s;
          const edgeLabelLength = edgeLabel.length;
          let j = 0;
          while (j < edgeLabelLength && i + j < termLength && edgeLabel[j] === term[i + j]) {
            j++;
          }
          if (j === edgeLabelLength) {
            node = childNode;
            i += j;
          } else if (i + j === termLength) {
            if (j === termLength - i) {
              if (exact) {
                return {};
              } else {
                const output2 = {};
                childNode.findAllWords(output2, term, exact, tolerance);
                return output2;
              }
            } else {
              return {};
            }
          } else {
            return {};
          }
        } else {
          return {};
        }
      }
      const output = {};
      node.findAllWords(output, term, exact, tolerance);
      return output;
    }
  }
  contains(term) {
    let node = this;
    let i = 0;
    const termLength = term.length;
    while (i < termLength) {
      const character = term[i];
      const childNode = node.c.get(character);
      if (childNode) {
        const edgeLabel = childNode.s;
        const edgeLabelLength = edgeLabel.length;
        let j = 0;
        while (j < edgeLabelLength && i + j < termLength && edgeLabel[j] === term[i + j]) {
          j++;
        }
        if (j < edgeLabelLength) {
          return false;
        }
        i += edgeLabelLength;
        node = childNode;
      } else {
        return false;
      }
    }
    return true;
  }
  removeWord(term) {
    if (!term) {
      return false;
    }
    let node = this;
    const termLength = term.length;
    const stack = [];
    for (let i = 0; i < termLength; i++) {
      const character = term[i];
      if (node.c.has(character)) {
        const childNode = node.c.get(character);
        stack.push({ parent: node, character });
        i += childNode.s.length - 1;
        node = childNode;
      } else {
        return false;
      }
    }
    node.d.clear();
    node.e = false;
    while (stack.length > 0 && node.c.size === 0 && !node.e && node.d.size === 0) {
      const { parent, character } = stack.pop();
      parent.c.delete(character);
      node = parent;
    }
    return true;
  }
  removeDocumentByWord(term, docID, exact = true) {
    if (!term) {
      return true;
    }
    let node = this;
    const termLength = term.length;
    for (let i = 0; i < termLength; i++) {
      const character = term[i];
      if (node.c.has(character)) {
        const childNode = node.c.get(character);
        i += childNode.s.length - 1;
        node = childNode;
        if (exact && node.w !== term) {
        } else {
          node.removeDocument(docID);
        }
      } else {
        return false;
      }
    }
    return true;
  }
  static getCommonPrefix(a, b) {
    const len = Math.min(a.length, b.length);
    let i = 0;
    while (i < len && a.charCodeAt(i) === b.charCodeAt(i)) {
      i++;
    }
    return a.slice(0, i);
  }
  toJSON() {
    return {
      w: this.w,
      s: this.s,
      e: this.e,
      k: this.k,
      d: Array.from(this.d),
      c: Array.from(this.c?.entries())?.map(([key, node]) => [key, node.toJSON()])
    };
  }
  static fromJSON(json) {
    const node = new _RadixNode(json.k, json.s, json.e);
    node.w = json.w;
    node.d = new Set(json.d);
    node.c = new Map(json?.c?.map(([key, nodeJson]) => [key, _RadixNode.fromJSON(nodeJson)]) || []);
    return node;
  }
};
var RadixTree = class _RadixTree extends RadixNode {
  constructor() {
    super("", "", false);
  }
  static fromJSON(json) {
    const tree = new _RadixTree();
    tree.w = json.w;
    tree.s = json.s;
    tree.e = json.e;
    tree.k = json.k;
    tree.d = new Set(json.d);
    tree.c = new Map(json?.c?.map(([key, nodeJson]) => [key, RadixNode.fromJSON(nodeJson)]) || []);
    return tree;
  }
  toJSON() {
    return super.toJSON();
  }
};

// node_modules/@orama/orama/dist/browser/trees/bkd.js
var K = 2;
var EARTH_RADIUS = 6371e3;
var BKDNode = class _BKDNode {
  constructor(point, docIDs) {
    __publicField(this, "point");
    __publicField(this, "docIDs");
    __publicField(this, "left");
    __publicField(this, "right");
    __publicField(this, "parent");
    this.point = point;
    this.docIDs = new Set(docIDs);
    this.left = null;
    this.right = null;
    this.parent = null;
  }
  toJSON() {
    return {
      point: this.point,
      docIDs: Array.from(this.docIDs),
      left: this.left ? this.left.toJSON() : null,
      right: this.right ? this.right.toJSON() : null
    };
  }
  static fromJSON(json, parent = null) {
    const node = new _BKDNode(json.point, json.docIDs);
    node.parent = parent;
    if (json.left) {
      node.left = _BKDNode.fromJSON(json.left, node);
    }
    if (json.right) {
      node.right = _BKDNode.fromJSON(json.right, node);
    }
    return node;
  }
};
var BKDTree = class _BKDTree {
  constructor() {
    __publicField(this, "root");
    __publicField(this, "nodeMap");
    this.root = null;
    this.nodeMap = /* @__PURE__ */ new Map();
  }
  getPointKey(point) {
    return `${point.lon},${point.lat}`;
  }
  insert(point, docIDs) {
    const pointKey = this.getPointKey(point);
    const existingNode = this.nodeMap.get(pointKey);
    if (existingNode) {
      docIDs.forEach((id) => existingNode.docIDs.add(id));
      return;
    }
    const newNode = new BKDNode(point, docIDs);
    this.nodeMap.set(pointKey, newNode);
    if (this.root == null) {
      this.root = newNode;
      return;
    }
    let node = this.root;
    let depth = 0;
    while (true) {
      const axis = depth % K;
      if (axis === 0) {
        if (point.lon < node.point.lon) {
          if (node.left == null) {
            node.left = newNode;
            newNode.parent = node;
            return;
          }
          node = node.left;
        } else {
          if (node.right == null) {
            node.right = newNode;
            newNode.parent = node;
            return;
          }
          node = node.right;
        }
      } else {
        if (point.lat < node.point.lat) {
          if (node.left == null) {
            node.left = newNode;
            newNode.parent = node;
            return;
          }
          node = node.left;
        } else {
          if (node.right == null) {
            node.right = newNode;
            newNode.parent = node;
            return;
          }
          node = node.right;
        }
      }
      depth++;
    }
  }
  contains(point) {
    const pointKey = this.getPointKey(point);
    return this.nodeMap.has(pointKey);
  }
  getDocIDsByCoordinates(point) {
    const pointKey = this.getPointKey(point);
    const node = this.nodeMap.get(pointKey);
    if (node) {
      return Array.from(node.docIDs);
    }
    return null;
  }
  removeDocByID(point, docID) {
    const pointKey = this.getPointKey(point);
    const node = this.nodeMap.get(pointKey);
    if (node) {
      node.docIDs.delete(docID);
      if (node.docIDs.size === 0) {
        this.nodeMap.delete(pointKey);
        this.deleteNode(node);
      }
    }
  }
  deleteNode(node) {
    const parent = node.parent;
    const child = node.left ? node.left : node.right;
    if (child) {
      child.parent = parent;
    }
    if (parent) {
      if (parent.left === node) {
        parent.left = child;
      } else if (parent.right === node) {
        parent.right = child;
      }
    } else {
      this.root = child;
      if (this.root) {
        this.root.parent = null;
      }
    }
  }
  searchByRadius(center, radius, inclusive = true, sort = "asc", highPrecision = false) {
    const distanceFn = highPrecision ? _BKDTree.vincentyDistance : _BKDTree.haversineDistance;
    const stack = [{ node: this.root, depth: 0 }];
    const result = [];
    while (stack.length > 0) {
      const { node, depth } = stack.pop();
      if (node == null)
        continue;
      const dist = distanceFn(center, node.point);
      if (inclusive ? dist <= radius : dist > radius) {
        result.push({ point: node.point, docIDs: Array.from(node.docIDs) });
      }
      if (node.left != null) {
        stack.push({ node: node.left, depth: depth + 1 });
      }
      if (node.right != null) {
        stack.push({ node: node.right, depth: depth + 1 });
      }
    }
    if (sort) {
      result.sort((a, b) => {
        const distA = distanceFn(center, a.point);
        const distB = distanceFn(center, b.point);
        return sort.toLowerCase() === "asc" ? distA - distB : distB - distA;
      });
    }
    return result;
  }
  searchByPolygon(polygon, inclusive = true, sort = null, highPrecision = false) {
    const stack = [{ node: this.root, depth: 0 }];
    const result = [];
    while (stack.length > 0) {
      const { node, depth } = stack.pop();
      if (node == null)
        continue;
      if (node.left != null) {
        stack.push({ node: node.left, depth: depth + 1 });
      }
      if (node.right != null) {
        stack.push({ node: node.right, depth: depth + 1 });
      }
      const isInsidePolygon = _BKDTree.isPointInPolygon(polygon, node.point);
      if (isInsidePolygon && inclusive || !isInsidePolygon && !inclusive) {
        result.push({ point: node.point, docIDs: Array.from(node.docIDs) });
      }
    }
    const centroid = _BKDTree.calculatePolygonCentroid(polygon);
    if (sort) {
      const distanceFn = highPrecision ? _BKDTree.vincentyDistance : _BKDTree.haversineDistance;
      result.sort((a, b) => {
        const distA = distanceFn(centroid, a.point);
        const distB = distanceFn(centroid, b.point);
        return sort.toLowerCase() === "asc" ? distA - distB : distB - distA;
      });
    }
    return result;
  }
  toJSON() {
    return {
      root: this.root ? this.root.toJSON() : null
    };
  }
  static fromJSON(json) {
    const tree = new _BKDTree();
    if (json.root) {
      tree.root = BKDNode.fromJSON(json.root);
      tree.buildNodeMap(tree.root);
    }
    return tree;
  }
  buildNodeMap(node) {
    if (node == null)
      return;
    const pointKey = this.getPointKey(node.point);
    this.nodeMap.set(pointKey, node);
    if (node.left) {
      this.buildNodeMap(node.left);
    }
    if (node.right) {
      this.buildNodeMap(node.right);
    }
  }
  static calculatePolygonCentroid(polygon) {
    let totalArea = 0;
    let centroidX = 0;
    let centroidY = 0;
    const polygonLength = polygon.length;
    for (let i = 0, j = polygonLength - 1; i < polygonLength; j = i++) {
      const xi = polygon[i].lon;
      const yi = polygon[i].lat;
      const xj = polygon[j].lon;
      const yj = polygon[j].lat;
      const areaSegment = xi * yj - xj * yi;
      totalArea += areaSegment;
      centroidX += (xi + xj) * areaSegment;
      centroidY += (yi + yj) * areaSegment;
    }
    totalArea /= 2;
    const centroidCoordinate = 6 * totalArea;
    centroidX /= centroidCoordinate;
    centroidY /= centroidCoordinate;
    return { lon: centroidX, lat: centroidY };
  }
  static isPointInPolygon(polygon, point) {
    let isInside = false;
    const x = point.lon;
    const y = point.lat;
    const polygonLength = polygon.length;
    for (let i = 0, j = polygonLength - 1; i < polygonLength; j = i++) {
      const xi = polygon[i].lon;
      const yi = polygon[i].lat;
      const xj = polygon[j].lon;
      const yj = polygon[j].lat;
      const intersect2 = yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
      if (intersect2)
        isInside = !isInside;
    }
    return isInside;
  }
  static haversineDistance(coord1, coord2) {
    const P = Math.PI / 180;
    const lat1 = coord1.lat * P;
    const lat2 = coord2.lat * P;
    const deltaLat = (coord2.lat - coord1.lat) * P;
    const deltaLon = (coord2.lon - coord1.lon) * P;
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c2 = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS * c2;
  }
  static vincentyDistance(coord1, coord2) {
    const a = 6378137;
    const f = 1 / 298.257223563;
    const b = (1 - f) * a;
    const P = Math.PI / 180;
    const lat1 = coord1.lat * P;
    const lat2 = coord2.lat * P;
    const deltaLon = (coord2.lon - coord1.lon) * P;
    const U1 = Math.atan((1 - f) * Math.tan(lat1));
    const U2 = Math.atan((1 - f) * Math.tan(lat2));
    const sinU1 = Math.sin(U1);
    const cosU1 = Math.cos(U1);
    const sinU2 = Math.sin(U2);
    const cosU2 = Math.cos(U2);
    let lambda = deltaLon;
    let prevLambda;
    let iterationLimit = 1e3;
    let sinSigma;
    let cosSigma;
    let sigma;
    let sinAlpha;
    let cos2Alpha;
    let cos2SigmaM;
    do {
      const sinLambda = Math.sin(lambda);
      const cosLambda = Math.cos(lambda);
      sinSigma = Math.sqrt(cosU2 * sinLambda * (cosU2 * sinLambda) + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
      if (sinSigma === 0)
        return 0;
      cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
      sigma = Math.atan2(sinSigma, cosSigma);
      sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
      cos2Alpha = 1 - sinAlpha * sinAlpha;
      cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cos2Alpha;
      if (isNaN(cos2SigmaM))
        cos2SigmaM = 0;
      const C2 = f / 16 * cos2Alpha * (4 + f * (4 - 3 * cos2Alpha));
      prevLambda = lambda;
      lambda = deltaLon + (1 - C2) * f * sinAlpha * (sigma + C2 * sinSigma * (cos2SigmaM + C2 * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    } while (Math.abs(lambda - prevLambda) > 1e-12 && --iterationLimit > 0);
    if (iterationLimit === 0) {
      return NaN;
    }
    const uSquared = cos2Alpha * (a * a - b * b) / (b * b);
    const A = 1 + uSquared / 16384 * (4096 + uSquared * (-768 + uSquared * (320 - 175 * uSquared)));
    const B = uSquared / 1024 * (256 + uSquared * (-128 + uSquared * (74 - 47 * uSquared)));
    const deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
    const s2 = b * A * (sigma - deltaSigma);
    return s2;
  }
};

// node_modules/@orama/orama/dist/browser/trees/bool.js
var BoolNode = class _BoolNode {
  constructor() {
    __publicField(this, "true");
    __publicField(this, "false");
    this.true = /* @__PURE__ */ new Set();
    this.false = /* @__PURE__ */ new Set();
  }
  insert(value, bool) {
    if (bool) {
      this.true.add(value);
    } else {
      this.false.add(value);
    }
  }
  delete(value, bool) {
    if (bool) {
      this.true.delete(value);
    } else {
      this.false.delete(value);
    }
  }
  getSize() {
    return this.true.size + this.false.size;
  }
  toJSON() {
    return {
      true: Array.from(this.true),
      false: Array.from(this.false)
    };
  }
  static fromJSON(json) {
    const node = new _BoolNode();
    node.true = new Set(json.true);
    node.false = new Set(json.false);
    return node;
  }
};

// node_modules/@orama/orama/dist/browser/components/algorithms.js
function BM25(tf, matchingCount, docsCount, fieldLength, averageFieldLength, { k, b, d }) {
  const idf = Math.log(1 + (docsCount - matchingCount + 0.5) / (matchingCount + 0.5));
  return idf * (d + tf * (k + 1)) / (tf + k * (1 - b + b * fieldLength / averageFieldLength));
}

// node_modules/@orama/orama/dist/browser/trees/vector.js
var DEFAULT_SIMILARITY = 0.8;
var VectorIndex = class _VectorIndex {
  constructor(size) {
    __publicField(this, "size");
    __publicField(this, "vectors", /* @__PURE__ */ new Map());
    this.size = size;
  }
  add(internalDocumentId, value) {
    if (!(value instanceof Float32Array)) {
      value = new Float32Array(value);
    }
    const magnitude = getMagnitude(value, this.size);
    this.vectors.set(internalDocumentId, [magnitude, value]);
  }
  remove(internalDocumentId) {
    this.vectors.delete(internalDocumentId);
  }
  find(vector, similarity, whereFiltersIDs) {
    if (!(vector instanceof Float32Array)) {
      vector = new Float32Array(vector);
    }
    const results = findSimilarVectors(vector, whereFiltersIDs, this.vectors, this.size, similarity);
    return results;
  }
  toJSON() {
    const vectors = [];
    for (const [id, [magnitude, vector]] of this.vectors) {
      vectors.push([id, [magnitude, Array.from(vector)]]);
    }
    return {
      size: this.size,
      vectors
    };
  }
  static fromJSON(json) {
    const raw = json;
    const index = new _VectorIndex(raw.size);
    for (const [id, [magnitude, vector]] of raw.vectors) {
      index.vectors.set(id, [magnitude, new Float32Array(vector)]);
    }
    return index;
  }
};
function getMagnitude(vector, vectorLength) {
  let magnitude = 0;
  for (let i = 0; i < vectorLength; i++) {
    magnitude += vector[i] * vector[i];
  }
  return Math.sqrt(magnitude);
}
function findSimilarVectors(targetVector, keys, vectors, length, threshold) {
  const targetMagnitude = getMagnitude(targetVector, length);
  const similarVectors = [];
  const base = keys ? keys : vectors.keys();
  for (const vectorId of base) {
    const entry = vectors.get(vectorId);
    if (!entry) {
      continue;
    }
    const magnitude = entry[0];
    const vector = entry[1];
    let dotProduct = 0;
    for (let i = 0; i < length; i++) {
      dotProduct += targetVector[i] * vector[i];
    }
    const similarity = dotProduct / (targetMagnitude * magnitude);
    if (similarity >= threshold) {
      similarVectors.push([vectorId, similarity]);
    }
  }
  return similarVectors;
}

// node_modules/@orama/orama/dist/browser/components/index.js
function insertDocumentScoreParameters(index, prop, id, tokens, docsCount) {
  const internalId = getInternalDocumentId(index.sharedInternalDocumentStore, id);
  index.avgFieldLength[prop] = ((index.avgFieldLength[prop] ?? 0) * (docsCount - 1) + tokens.length) / docsCount;
  index.fieldLengths[prop][internalId] = tokens.length;
  index.frequencies[prop][internalId] = {};
}
function insertTokenScoreParameters(index, prop, id, tokens, token) {
  let tokenFrequency = 0;
  for (const t of tokens) {
    if (t === token) {
      tokenFrequency++;
    }
  }
  const internalId = getInternalDocumentId(index.sharedInternalDocumentStore, id);
  const tf = tokenFrequency / tokens.length;
  index.frequencies[prop][internalId][token] = tf;
  if (!(token in index.tokenOccurrences[prop])) {
    index.tokenOccurrences[prop][token] = 0;
  }
  index.tokenOccurrences[prop][token] = (index.tokenOccurrences[prop][token] ?? 0) + 1;
}
function removeDocumentScoreParameters(index, prop, id, docsCount) {
  const internalId = getInternalDocumentId(index.sharedInternalDocumentStore, id);
  if (docsCount > 1) {
    index.avgFieldLength[prop] = (index.avgFieldLength[prop] * docsCount - index.fieldLengths[prop][internalId]) / (docsCount - 1);
  } else {
    index.avgFieldLength[prop] = void 0;
  }
  index.fieldLengths[prop][internalId] = void 0;
  index.frequencies[prop][internalId] = void 0;
}
function removeTokenScoreParameters(index, prop, token) {
  index.tokenOccurrences[prop][token]--;
}
function create2(orama, sharedInternalDocumentStore, schema, index, prefix = "") {
  if (!index) {
    index = {
      sharedInternalDocumentStore,
      indexes: {},
      vectorIndexes: {},
      searchableProperties: [],
      searchablePropertiesWithTypes: {},
      frequencies: {},
      tokenOccurrences: {},
      avgFieldLength: {},
      fieldLengths: {}
    };
  }
  for (const [prop, type] of Object.entries(schema)) {
    const path = `${prefix}${prefix ? "." : ""}${prop}`;
    if (typeof type === "object" && !Array.isArray(type)) {
      create2(orama, sharedInternalDocumentStore, type, index, path);
      continue;
    }
    if (isVectorType(type)) {
      index.searchableProperties.push(path);
      index.searchablePropertiesWithTypes[path] = type;
      index.vectorIndexes[path] = {
        type: "Vector",
        node: new VectorIndex(getVectorSize(type)),
        isArray: false
      };
    } else {
      const isArray = /\[/.test(type);
      switch (type) {
        case "boolean":
        case "boolean[]":
          index.indexes[path] = { type: "Bool", node: new BoolNode(), isArray };
          break;
        case "number":
        case "number[]":
          index.indexes[path] = { type: "AVL", node: new AVLTree(0, []), isArray };
          break;
        case "string":
        case "string[]":
          index.indexes[path] = { type: "Radix", node: new RadixTree(), isArray };
          index.avgFieldLength[path] = 0;
          index.frequencies[path] = {};
          index.tokenOccurrences[path] = {};
          index.fieldLengths[path] = {};
          break;
        case "enum":
        case "enum[]":
          index.indexes[path] = { type: "Flat", node: new FlatTree(), isArray };
          break;
        case "geopoint":
          index.indexes[path] = { type: "BKD", node: new BKDTree(), isArray };
          break;
        default:
          throw createError("INVALID_SCHEMA_TYPE", Array.isArray(type) ? "array" : type, path);
      }
      index.searchableProperties.push(path);
      index.searchablePropertiesWithTypes[path] = type;
    }
  }
  return index;
}
function insertScalarBuilder(implementation, index, prop, internalId, language2, tokenizer, docsCount, options) {
  return (value) => {
    const { type, node } = index.indexes[prop];
    switch (type) {
      case "Bool": {
        node[value ? "true" : "false"].add(internalId);
        break;
      }
      case "AVL": {
        const avlRebalanceThreshold = options?.avlRebalanceThreshold ?? 1;
        node.insert(value, internalId, avlRebalanceThreshold);
        break;
      }
      case "Radix": {
        const tokens = tokenizer.tokenize(value, language2, prop, false);
        implementation.insertDocumentScoreParameters(index, prop, internalId, tokens, docsCount);
        for (const token of tokens) {
          implementation.insertTokenScoreParameters(index, prop, internalId, tokens, token);
          node.insert(token, internalId);
        }
        break;
      }
      case "Flat": {
        node.insert(value, internalId);
        break;
      }
      case "BKD": {
        node.insert(value, [internalId]);
        break;
      }
    }
  };
}
function insert(implementation, index, prop, id, internalId, value, schemaType, language2, tokenizer, docsCount, options) {
  if (isVectorType(schemaType)) {
    return insertVector(index, prop, value, id, internalId);
  }
  const insertScalar = insertScalarBuilder(implementation, index, prop, internalId, language2, tokenizer, docsCount, options);
  if (!isArrayType(schemaType)) {
    return insertScalar(value);
  }
  const elements = value;
  const elementsLength = elements.length;
  for (let i = 0; i < elementsLength; i++) {
    insertScalar(elements[i]);
  }
}
function insertVector(index, prop, value, id, internalDocumentId) {
  index.vectorIndexes[prop].node.add(internalDocumentId, value);
}
function removeScalar(implementation, index, prop, id, internalId, value, schemaType, language2, tokenizer, docsCount) {
  if (isVectorType(schemaType)) {
    index.vectorIndexes[prop].node.remove(internalId);
    return true;
  }
  const { type, node } = index.indexes[prop];
  switch (type) {
    case "AVL": {
      node.removeDocument(value, internalId);
      return true;
    }
    case "Bool": {
      node[value ? "true" : "false"].delete(internalId);
      return true;
    }
    case "Radix": {
      const tokens = tokenizer.tokenize(value, language2, prop);
      implementation.removeDocumentScoreParameters(index, prop, id, docsCount);
      for (const token of tokens) {
        implementation.removeTokenScoreParameters(index, prop, token);
        node.removeDocumentByWord(token, internalId);
      }
      return true;
    }
    case "Flat": {
      node.removeDocument(internalId, value);
      return true;
    }
    case "BKD": {
      node.removeDocByID(value, internalId);
      return false;
    }
  }
}
function remove2(implementation, index, prop, id, internalId, value, schemaType, language2, tokenizer, docsCount) {
  if (!isArrayType(schemaType)) {
    return removeScalar(implementation, index, prop, id, internalId, value, schemaType, language2, tokenizer, docsCount);
  }
  const innerSchemaType = getInnerType(schemaType);
  const elements = value;
  const elementsLength = elements.length;
  for (let i = 0; i < elementsLength; i++) {
    removeScalar(implementation, index, prop, id, internalId, elements[i], innerSchemaType, language2, tokenizer, docsCount);
  }
  return true;
}
function calculateResultScores(index, prop, term, ids, docsCount, bm25Relevance, resultsMap, boostPerProperty, whereFiltersIDs, keywordMatchesMap) {
  const documentIDs = Array.from(ids);
  const avgFieldLength = index.avgFieldLength[prop];
  const fieldLengths = index.fieldLengths[prop];
  const oramaOccurrences = index.tokenOccurrences[prop];
  const oramaFrequencies = index.frequencies[prop];
  const termOccurrences = typeof oramaOccurrences[term] === "number" ? oramaOccurrences[term] ?? 0 : 0;
  const documentIDsLength = documentIDs.length;
  for (let k = 0; k < documentIDsLength; k++) {
    const internalId = documentIDs[k];
    if (whereFiltersIDs && !whereFiltersIDs.has(internalId)) {
      continue;
    }
    if (!keywordMatchesMap.has(internalId)) {
      keywordMatchesMap.set(internalId, /* @__PURE__ */ new Map());
    }
    const propertyMatches = keywordMatchesMap.get(internalId);
    propertyMatches.set(prop, (propertyMatches.get(prop) || 0) + 1);
    const tf = oramaFrequencies?.[internalId]?.[term] ?? 0;
    const bm25 = BM25(tf, termOccurrences, docsCount, fieldLengths[internalId], avgFieldLength, bm25Relevance);
    if (resultsMap.has(internalId)) {
      resultsMap.set(internalId, resultsMap.get(internalId) + bm25 * boostPerProperty);
    } else {
      resultsMap.set(internalId, bm25 * boostPerProperty);
    }
  }
}
function search(index, term, tokenizer, language2, propertiesToSearch, exact, tolerance, boost, relevance, docsCount, whereFiltersIDs, threshold = 0) {
  const tokens = tokenizer.tokenize(term, language2);
  const keywordsCount = tokens.length || 1;
  const keywordMatchesMap = /* @__PURE__ */ new Map();
  const tokenFoundMap = /* @__PURE__ */ new Map();
  const resultsMap = /* @__PURE__ */ new Map();
  for (const prop of propertiesToSearch) {
    if (!(prop in index.indexes)) {
      continue;
    }
    const tree = index.indexes[prop];
    const { type } = tree;
    if (type !== "Radix") {
      throw createError("WRONG_SEARCH_PROPERTY_TYPE", prop);
    }
    const boostPerProperty = boost[prop] ?? 1;
    if (boostPerProperty <= 0) {
      throw createError("INVALID_BOOST_VALUE", boostPerProperty);
    }
    if (tokens.length === 0 && !term) {
      tokens.push("");
    }
    const tokenLength = tokens.length;
    for (let i = 0; i < tokenLength; i++) {
      const token = tokens[i];
      const searchResult = tree.node.find({ term: token, exact, tolerance });
      const termsFound = Object.keys(searchResult);
      if (termsFound.length > 0) {
        tokenFoundMap.set(token, true);
      }
      const termsFoundLength = termsFound.length;
      for (let j = 0; j < termsFoundLength; j++) {
        const word = termsFound[j];
        const ids = searchResult[word];
        calculateResultScores(index, prop, word, ids, docsCount, relevance, resultsMap, boostPerProperty, whereFiltersIDs, keywordMatchesMap);
      }
    }
  }
  const results = Array.from(resultsMap.entries()).map(([id, score]) => [id, score]).sort((a, b) => b[1] - a[1]);
  if (results.length === 0) {
    return [];
  }
  if (threshold === 1) {
    return results;
  }
  if (threshold === 0) {
    if (keywordsCount === 1) {
      return results;
    }
    for (const token of tokens) {
      if (!tokenFoundMap.get(token)) {
        return [];
      }
    }
    const fullMatches2 = results.filter(([id]) => {
      const propertyMatches = keywordMatchesMap.get(id);
      if (!propertyMatches)
        return false;
      return Array.from(propertyMatches.values()).some((matches) => matches === keywordsCount);
    });
    return fullMatches2;
  }
  const fullMatches = results.filter(([id]) => {
    const propertyMatches = keywordMatchesMap.get(id);
    if (!propertyMatches)
      return false;
    return Array.from(propertyMatches.values()).some((matches) => matches === keywordsCount);
  });
  if (fullMatches.length > 0) {
    const remainingResults = results.filter(([id]) => !fullMatches.some(([fid]) => fid === id));
    const additionalResults = Math.ceil(remainingResults.length * threshold);
    return [...fullMatches, ...remainingResults.slice(0, additionalResults)];
  }
  return results;
}
function searchByWhereClause(index, tokenizer, filters, language2) {
  if ("and" in filters && filters.and && Array.isArray(filters.and)) {
    const andFilters = filters.and;
    if (andFilters.length === 0) {
      return /* @__PURE__ */ new Set();
    }
    const results = andFilters.map((filter) => searchByWhereClause(index, tokenizer, filter, language2));
    return setIntersection(...results);
  }
  if ("or" in filters && filters.or && Array.isArray(filters.or)) {
    const orFilters = filters.or;
    if (orFilters.length === 0) {
      return /* @__PURE__ */ new Set();
    }
    const results = orFilters.map((filter) => searchByWhereClause(index, tokenizer, filter, language2));
    return results.reduce((acc, set) => setUnion(acc, set), /* @__PURE__ */ new Set());
  }
  if ("not" in filters && filters.not) {
    const notFilter = filters.not;
    const allDocs = /* @__PURE__ */ new Set();
    const docsStore = index.sharedInternalDocumentStore;
    for (let i = 1; i <= docsStore.internalIdToId.length; i++) {
      allDocs.add(i);
    }
    const notResult = searchByWhereClause(index, tokenizer, notFilter, language2);
    return setDifference(allDocs, notResult);
  }
  const filterKeys = Object.keys(filters);
  const filtersMap = filterKeys.reduce((acc, key) => ({
    [key]: /* @__PURE__ */ new Set(),
    ...acc
  }), {});
  for (const param of filterKeys) {
    const operation = filters[param];
    if (typeof index.indexes[param] === "undefined") {
      throw createError("UNKNOWN_FILTER_PROPERTY", param);
    }
    const { node, type, isArray } = index.indexes[param];
    if (type === "Bool") {
      const idx = node;
      const filteredIDs = operation ? idx.true : idx.false;
      filtersMap[param] = setUnion(filtersMap[param], filteredIDs);
      continue;
    }
    if (type === "BKD") {
      let reqOperation;
      if ("radius" in operation) {
        reqOperation = "radius";
      } else if ("polygon" in operation) {
        reqOperation = "polygon";
      } else {
        throw new Error(`Invalid operation ${operation}`);
      }
      if (reqOperation === "radius") {
        const { value, coordinates, unit = "m", inside = true, highPrecision = false } = operation[reqOperation];
        const distanceInMeters = convertDistanceToMeters(value, unit);
        const ids = node.searchByRadius(coordinates, distanceInMeters, inside, void 0, highPrecision);
        filtersMap[param] = addGeoResult(filtersMap[param], ids);
      } else {
        const { coordinates, inside = true, highPrecision = false } = operation[reqOperation];
        const ids = node.searchByPolygon(coordinates, inside, void 0, highPrecision);
        filtersMap[param] = addGeoResult(filtersMap[param], ids);
      }
      continue;
    }
    if (type === "Radix" && (typeof operation === "string" || Array.isArray(operation))) {
      for (const raw of [operation].flat()) {
        const term = tokenizer.tokenize(raw, language2, param);
        for (const t of term) {
          const filteredIDsResults = node.find({ term: t, exact: true });
          filtersMap[param] = addFindResult(filtersMap[param], filteredIDsResults);
        }
      }
      continue;
    }
    const operationKeys = Object.keys(operation);
    if (operationKeys.length > 1) {
      throw createError("INVALID_FILTER_OPERATION", operationKeys.length);
    }
    if (type === "Flat") {
      const results = new Set(isArray ? node.filterArr(operation) : node.filter(operation));
      filtersMap[param] = setUnion(filtersMap[param], results);
      continue;
    }
    if (type === "AVL") {
      const operationOpt = operationKeys[0];
      const operationValue = operation[operationOpt];
      let filteredIDs;
      switch (operationOpt) {
        case "gt": {
          filteredIDs = node.greaterThan(operationValue, false);
          break;
        }
        case "gte": {
          filteredIDs = node.greaterThan(operationValue, true);
          break;
        }
        case "lt": {
          filteredIDs = node.lessThan(operationValue, false);
          break;
        }
        case "lte": {
          filteredIDs = node.lessThan(operationValue, true);
          break;
        }
        case "eq": {
          const ret = node.find(operationValue);
          filteredIDs = ret ?? /* @__PURE__ */ new Set();
          break;
        }
        case "between": {
          const [min, max] = operationValue;
          filteredIDs = node.rangeSearch(min, max);
          break;
        }
        default:
          throw createError("INVALID_FILTER_OPERATION", operationOpt);
      }
      filtersMap[param] = setUnion(filtersMap[param], filteredIDs);
    }
  }
  return setIntersection(...Object.values(filtersMap));
}
function getSearchableProperties(index) {
  return index.searchableProperties;
}
function getSearchablePropertiesWithTypes(index) {
  return index.searchablePropertiesWithTypes;
}
function load3(sharedInternalDocumentStore, raw) {
  const { indexes: rawIndexes, vectorIndexes: rawVectorIndexes, searchableProperties, searchablePropertiesWithTypes, frequencies, tokenOccurrences, avgFieldLength, fieldLengths } = raw;
  const indexes = {};
  const vectorIndexes = {};
  for (const prop of Object.keys(rawIndexes)) {
    const { node, type, isArray } = rawIndexes[prop];
    switch (type) {
      case "Radix":
        indexes[prop] = {
          type: "Radix",
          node: RadixTree.fromJSON(node),
          isArray
        };
        break;
      case "Flat":
        indexes[prop] = {
          type: "Flat",
          node: FlatTree.fromJSON(node),
          isArray
        };
        break;
      case "AVL":
        indexes[prop] = {
          type: "AVL",
          node: AVLTree.fromJSON(node),
          isArray
        };
        break;
      case "BKD":
        indexes[prop] = {
          type: "BKD",
          node: BKDTree.fromJSON(node),
          isArray
        };
        break;
      case "Bool":
        indexes[prop] = {
          type: "Bool",
          node: BoolNode.fromJSON(node),
          isArray
        };
        break;
      default:
        indexes[prop] = rawIndexes[prop];
    }
  }
  for (const idx of Object.keys(rawVectorIndexes)) {
    vectorIndexes[idx] = {
      type: "Vector",
      isArray: false,
      node: VectorIndex.fromJSON(rawVectorIndexes[idx])
    };
  }
  return {
    sharedInternalDocumentStore,
    indexes,
    vectorIndexes,
    searchableProperties,
    searchablePropertiesWithTypes,
    frequencies,
    tokenOccurrences,
    avgFieldLength,
    fieldLengths
  };
}
function save3(index) {
  const { indexes, vectorIndexes, searchableProperties, searchablePropertiesWithTypes, frequencies, tokenOccurrences, avgFieldLength, fieldLengths } = index;
  const dumpVectorIndexes = {};
  for (const idx of Object.keys(vectorIndexes)) {
    dumpVectorIndexes[idx] = vectorIndexes[idx].node.toJSON();
  }
  const savedIndexes = {};
  for (const name of Object.keys(indexes)) {
    const { type, node, isArray } = indexes[name];
    if (type === "Flat" || type === "Radix" || type === "AVL" || type === "BKD" || type === "Bool") {
      savedIndexes[name] = {
        type,
        node: node.toJSON(),
        isArray
      };
    } else {
      savedIndexes[name] = indexes[name];
      savedIndexes[name].node = savedIndexes[name].node.toJSON();
    }
  }
  return {
    indexes: savedIndexes,
    vectorIndexes: dumpVectorIndexes,
    searchableProperties,
    searchablePropertiesWithTypes,
    frequencies,
    tokenOccurrences,
    avgFieldLength,
    fieldLengths
  };
}
function createIndex() {
  return {
    create: create2,
    insert,
    remove: remove2,
    insertDocumentScoreParameters,
    insertTokenScoreParameters,
    removeDocumentScoreParameters,
    removeTokenScoreParameters,
    calculateResultScores,
    search,
    searchByWhereClause,
    getSearchableProperties,
    getSearchablePropertiesWithTypes,
    load: load3,
    save: save3
  };
}
function addGeoResult(set, ids) {
  if (!set) {
    set = /* @__PURE__ */ new Set();
  }
  const idsLength = ids.length;
  for (let i = 0; i < idsLength; i++) {
    const entry = ids[i].docIDs;
    const idsLength2 = entry.length;
    for (let j = 0; j < idsLength2; j++) {
      set.add(entry[j]);
    }
  }
  return set;
}
function createGeoTokenScores(ids, centerPoint, highPrecision = false) {
  const distanceFn = highPrecision ? BKDTree.vincentyDistance : BKDTree.haversineDistance;
  const results = [];
  const distances = [];
  for (const { point } of ids) {
    distances.push(distanceFn(centerPoint, point));
  }
  const maxDistance = Math.max(...distances);
  let index = 0;
  for (const { docIDs } of ids) {
    const distance = distances[index];
    const score = maxDistance - distance + 1;
    for (const docID of docIDs) {
      results.push([docID, score]);
    }
    index++;
  }
  results.sort((a, b) => b[1] - a[1]);
  return results;
}
function isGeosearchOnlyQuery(filters, index) {
  const filterKeys = Object.keys(filters);
  if (filterKeys.length !== 1) {
    return { isGeoOnly: false };
  }
  const param = filterKeys[0];
  const operation = filters[param];
  if (typeof index.indexes[param] === "undefined") {
    return { isGeoOnly: false };
  }
  const { type } = index.indexes[param];
  if (type === "BKD" && operation && ("radius" in operation || "polygon" in operation)) {
    return { isGeoOnly: true, geoProperty: param, geoOperation: operation };
  }
  return { isGeoOnly: false };
}
function searchByGeoWhereClause(index, filters) {
  const indexTyped = index;
  const geoInfo = isGeosearchOnlyQuery(filters, indexTyped);
  if (!geoInfo.isGeoOnly || !geoInfo.geoProperty || !geoInfo.geoOperation) {
    return null;
  }
  const { node } = indexTyped.indexes[geoInfo.geoProperty];
  const operation = geoInfo.geoOperation;
  const bkdNode = node;
  let results;
  if ("radius" in operation) {
    const { value, coordinates, unit = "m", inside = true, highPrecision = false } = operation.radius;
    const centerPoint = coordinates;
    const distanceInMeters = convertDistanceToMeters(value, unit);
    results = bkdNode.searchByRadius(centerPoint, distanceInMeters, inside, "asc", highPrecision);
    return createGeoTokenScores(results, centerPoint, highPrecision);
  } else if ("polygon" in operation) {
    const { coordinates, inside = true, highPrecision = false } = operation.polygon;
    results = bkdNode.searchByPolygon(coordinates, inside, "asc", highPrecision);
    const centroid = BKDTree.calculatePolygonCentroid(coordinates);
    return createGeoTokenScores(results, centroid, highPrecision);
  }
  return null;
}
function addFindResult(set, filteredIDsResults) {
  if (!set) {
    set = /* @__PURE__ */ new Set();
  }
  const keys = Object.keys(filteredIDsResults);
  const keysLength = keys.length;
  for (let i = 0; i < keysLength; i++) {
    const ids = filteredIDsResults[keys[i]];
    const idsLength = ids.length;
    for (let j = 0; j < idsLength; j++) {
      set.add(ids[j]);
    }
  }
  return set;
}

// node_modules/@orama/orama/dist/browser/components/sorter.js
function innerCreate(orama, sharedInternalDocumentStore, schema, sortableDeniedProperties, prefix) {
  const sorter = {
    language: orama.tokenizer.language,
    sharedInternalDocumentStore,
    enabled: true,
    isSorted: true,
    sortableProperties: [],
    sortablePropertiesWithTypes: {},
    sorts: {}
  };
  for (const [prop, type] of Object.entries(schema)) {
    const path = `${prefix}${prefix ? "." : ""}${prop}`;
    if (sortableDeniedProperties.includes(path)) {
      continue;
    }
    if (typeof type === "object" && !Array.isArray(type)) {
      const ret = innerCreate(orama, sharedInternalDocumentStore, type, sortableDeniedProperties, path);
      safeArrayPush(sorter.sortableProperties, ret.sortableProperties);
      sorter.sorts = {
        ...sorter.sorts,
        ...ret.sorts
      };
      sorter.sortablePropertiesWithTypes = {
        ...sorter.sortablePropertiesWithTypes,
        ...ret.sortablePropertiesWithTypes
      };
      continue;
    }
    if (!isVectorType(type)) {
      switch (type) {
        case "boolean":
        case "number":
        case "string":
          sorter.sortableProperties.push(path);
          sorter.sortablePropertiesWithTypes[path] = type;
          sorter.sorts[path] = {
            docs: /* @__PURE__ */ new Map(),
            orderedDocsToRemove: /* @__PURE__ */ new Map(),
            orderedDocs: [],
            type
          };
          break;
        case "geopoint":
        case "enum":
          continue;
        case "enum[]":
        case "boolean[]":
        case "number[]":
        case "string[]":
          continue;
        default:
          throw createError("INVALID_SORT_SCHEMA_TYPE", Array.isArray(type) ? "array" : type, path);
      }
    }
  }
  return sorter;
}
function create3(orama, sharedInternalDocumentStore, schema, config) {
  const isSortEnabled = config?.enabled !== false;
  if (!isSortEnabled) {
    return {
      disabled: true
    };
  }
  return innerCreate(orama, sharedInternalDocumentStore, schema, (config || {}).unsortableProperties || [], "");
}
function insert2(sorter, prop, id, value) {
  if (!sorter.enabled) {
    return;
  }
  sorter.isSorted = false;
  const internalId = getInternalDocumentId(sorter.sharedInternalDocumentStore, id);
  const s2 = sorter.sorts[prop];
  if (s2.orderedDocsToRemove.has(internalId)) {
    ensureOrderedDocsAreDeletedByProperty(sorter, prop);
  }
  s2.docs.set(internalId, s2.orderedDocs.length);
  s2.orderedDocs.push([internalId, value]);
}
function ensureIsSorted(sorter) {
  if (sorter.isSorted || !sorter.enabled) {
    return;
  }
  const properties = Object.keys(sorter.sorts);
  for (const prop of properties) {
    ensurePropertyIsSorted(sorter, prop);
  }
  sorter.isSorted = true;
}
function stringSort(language2, value, d) {
  return value[1].localeCompare(d[1], getLocale(language2));
}
function numberSort(value, d) {
  return value[1] - d[1];
}
function booleanSort(value, d) {
  return d[1] ? -1 : 1;
}
function ensurePropertyIsSorted(sorter, prop) {
  const s2 = sorter.sorts[prop];
  let predicate;
  switch (s2.type) {
    case "string":
      predicate = stringSort.bind(null, sorter.language);
      break;
    case "number":
      predicate = numberSort.bind(null);
      break;
    case "boolean":
      predicate = booleanSort.bind(null);
      break;
  }
  s2.orderedDocs.sort(predicate);
  const orderedDocsLength = s2.orderedDocs.length;
  for (let i = 0; i < orderedDocsLength; i++) {
    const docId = s2.orderedDocs[i][0];
    s2.docs.set(docId, i);
  }
}
function ensureOrderedDocsAreDeleted(sorter) {
  const properties = Object.keys(sorter.sorts);
  for (const prop of properties) {
    ensureOrderedDocsAreDeletedByProperty(sorter, prop);
  }
}
function ensureOrderedDocsAreDeletedByProperty(sorter, prop) {
  const s2 = sorter.sorts[prop];
  if (!s2.orderedDocsToRemove.size)
    return;
  s2.orderedDocs = s2.orderedDocs.filter((doc) => !s2.orderedDocsToRemove.has(doc[0]));
  s2.orderedDocsToRemove.clear();
}
function remove3(sorter, prop, id) {
  if (!sorter.enabled) {
    return;
  }
  const s2 = sorter.sorts[prop];
  const internalId = getInternalDocumentId(sorter.sharedInternalDocumentStore, id);
  const index = s2.docs.get(internalId);
  if (!index)
    return;
  s2.docs.delete(internalId);
  s2.orderedDocsToRemove.set(internalId, true);
}
function sortBy(sorter, docIds, by) {
  if (!sorter.enabled) {
    throw createError("SORT_DISABLED");
  }
  const property = by.property;
  const isDesc = by.order === "DESC";
  const s2 = sorter.sorts[property];
  if (!s2) {
    throw createError("UNABLE_TO_SORT_ON_UNKNOWN_FIELD", property, sorter.sortableProperties.join(", "));
  }
  ensureOrderedDocsAreDeletedByProperty(sorter, property);
  ensureIsSorted(sorter);
  docIds.sort((a, b) => {
    const indexOfA = s2.docs.get(getInternalDocumentId(sorter.sharedInternalDocumentStore, a[0]));
    const indexOfB = s2.docs.get(getInternalDocumentId(sorter.sharedInternalDocumentStore, b[0]));
    const isAIndexed = typeof indexOfA !== "undefined";
    const isBIndexed = typeof indexOfB !== "undefined";
    if (!isAIndexed && !isBIndexed) {
      return 0;
    }
    if (!isAIndexed) {
      return 1;
    }
    if (!isBIndexed) {
      return -1;
    }
    return isDesc ? indexOfB - indexOfA : indexOfA - indexOfB;
  });
  return docIds;
}
function getSortableProperties(sorter) {
  if (!sorter.enabled) {
    return [];
  }
  return sorter.sortableProperties;
}
function getSortablePropertiesWithTypes(sorter) {
  if (!sorter.enabled) {
    return {};
  }
  return sorter.sortablePropertiesWithTypes;
}
function load4(sharedInternalDocumentStore, raw) {
  const rawDocument = raw;
  if (!rawDocument.enabled) {
    return {
      enabled: false
    };
  }
  const sorts = Object.keys(rawDocument.sorts).reduce((acc, prop) => {
    const { docs, orderedDocs, type } = rawDocument.sorts[prop];
    acc[prop] = {
      docs: new Map(Object.entries(docs).map(([k, v2]) => [+k, v2])),
      orderedDocsToRemove: /* @__PURE__ */ new Map(),
      orderedDocs,
      type
    };
    return acc;
  }, {});
  return {
    sharedInternalDocumentStore,
    language: rawDocument.language,
    sortableProperties: rawDocument.sortableProperties,
    sortablePropertiesWithTypes: rawDocument.sortablePropertiesWithTypes,
    sorts,
    enabled: true,
    isSorted: rawDocument.isSorted
  };
}
function save4(sorter) {
  if (!sorter.enabled) {
    return {
      enabled: false
    };
  }
  ensureOrderedDocsAreDeleted(sorter);
  ensureIsSorted(sorter);
  const sorts = Object.keys(sorter.sorts).reduce((acc, prop) => {
    const { docs, orderedDocs, type } = sorter.sorts[prop];
    acc[prop] = {
      docs: Object.fromEntries(docs.entries()),
      orderedDocs,
      type
    };
    return acc;
  }, {});
  return {
    language: sorter.language,
    sortableProperties: sorter.sortableProperties,
    sortablePropertiesWithTypes: sorter.sortablePropertiesWithTypes,
    sorts,
    enabled: sorter.enabled,
    isSorted: sorter.isSorted
  };
}
function createSorter() {
  return {
    create: create3,
    insert: insert2,
    remove: remove3,
    save: save4,
    load: load4,
    sortBy,
    getSortableProperties,
    getSortablePropertiesWithTypes
  };
}

// node_modules/@orama/orama/dist/browser/components/tokenizer/diacritics.js
var DIACRITICS_CHARCODE_START = 192;
var DIACRITICS_CHARCODE_END = 383;
var CHARCODE_REPLACE_MAPPING = [
  65,
  65,
  65,
  65,
  65,
  65,
  65,
  67,
  69,
  69,
  69,
  69,
  73,
  73,
  73,
  73,
  69,
  78,
  79,
  79,
  79,
  79,
  79,
  null,
  79,
  85,
  85,
  85,
  85,
  89,
  80,
  115,
  97,
  97,
  97,
  97,
  97,
  97,
  97,
  99,
  101,
  101,
  101,
  101,
  105,
  105,
  105,
  105,
  101,
  110,
  111,
  111,
  111,
  111,
  111,
  null,
  111,
  117,
  117,
  117,
  117,
  121,
  112,
  121,
  65,
  97,
  65,
  97,
  65,
  97,
  67,
  99,
  67,
  99,
  67,
  99,
  67,
  99,
  68,
  100,
  68,
  100,
  69,
  101,
  69,
  101,
  69,
  101,
  69,
  101,
  69,
  101,
  71,
  103,
  71,
  103,
  71,
  103,
  71,
  103,
  72,
  104,
  72,
  104,
  73,
  105,
  73,
  105,
  73,
  105,
  73,
  105,
  73,
  105,
  73,
  105,
  74,
  106,
  75,
  107,
  107,
  76,
  108,
  76,
  108,
  76,
  108,
  76,
  108,
  76,
  108,
  78,
  110,
  78,
  110,
  78,
  110,
  110,
  78,
  110,
  79,
  111,
  79,
  111,
  79,
  111,
  79,
  111,
  82,
  114,
  82,
  114,
  82,
  114,
  83,
  115,
  83,
  115,
  83,
  115,
  83,
  115,
  84,
  116,
  84,
  116,
  84,
  116,
  85,
  117,
  85,
  117,
  85,
  117,
  85,
  117,
  85,
  117,
  85,
  117,
  87,
  119,
  89,
  121,
  89,
  90,
  122,
  90,
  122,
  90,
  122,
  115
];
function replaceChar(charCode) {
  if (charCode < DIACRITICS_CHARCODE_START || charCode > DIACRITICS_CHARCODE_END)
    return charCode;
  return CHARCODE_REPLACE_MAPPING[charCode - DIACRITICS_CHARCODE_START] || charCode;
}
function replaceDiacritics(str) {
  const stringCharCode = [];
  for (let idx = 0; idx < str.length; idx++) {
    stringCharCode[idx] = replaceChar(str.charCodeAt(idx));
  }
  return String.fromCharCode(...stringCharCode);
}

// node_modules/@orama/orama/dist/browser/components/tokenizer/english-stemmer.js
var step2List = {
  ational: "ate",
  tional: "tion",
  enci: "ence",
  anci: "ance",
  izer: "ize",
  bli: "ble",
  alli: "al",
  entli: "ent",
  eli: "e",
  ousli: "ous",
  ization: "ize",
  ation: "ate",
  ator: "ate",
  alism: "al",
  iveness: "ive",
  fulness: "ful",
  ousness: "ous",
  aliti: "al",
  iviti: "ive",
  biliti: "ble",
  logi: "log"
};
var step3List = {
  icate: "ic",
  ative: "",
  alize: "al",
  iciti: "ic",
  ical: "ic",
  ful: "",
  ness: ""
};
var c = "[^aeiou]";
var v = "[aeiouy]";
var C = c + "[^aeiouy]*";
var V = v + "[aeiou]*";
var mgr0 = "^(" + C + ")?" + V + C;
var meq1 = "^(" + C + ")?" + V + C + "(" + V + ")?$";
var mgr1 = "^(" + C + ")?" + V + C + V + C;
var s_v = "^(" + C + ")?" + v;
function stemmer(w) {
  let stem;
  let suffix;
  let re;
  let re2;
  let re3;
  let re4;
  if (w.length < 3) {
    return w;
  }
  const firstch = w.substring(0, 1);
  if (firstch == "y") {
    w = firstch.toUpperCase() + w.substring(1);
  }
  re = /^(.+?)(ss|i)es$/;
  re2 = /^(.+?)([^s])s$/;
  if (re.test(w)) {
    w = w.replace(re, "$1$2");
  } else if (re2.test(w)) {
    w = w.replace(re2, "$1$2");
  }
  re = /^(.+?)eed$/;
  re2 = /^(.+?)(ed|ing)$/;
  if (re.test(w)) {
    const fp = re.exec(w);
    re = new RegExp(mgr0);
    if (re.test(fp[1])) {
      re = /.$/;
      w = w.replace(re, "");
    }
  } else if (re2.test(w)) {
    const fp = re2.exec(w);
    stem = fp[1];
    re2 = new RegExp(s_v);
    if (re2.test(stem)) {
      w = stem;
      re2 = /(at|bl|iz)$/;
      re3 = new RegExp("([^aeiouylsz])\\1$");
      re4 = new RegExp("^" + C + v + "[^aeiouwxy]$");
      if (re2.test(w)) {
        w = w + "e";
      } else if (re3.test(w)) {
        re = /.$/;
        w = w.replace(re, "");
      } else if (re4.test(w)) {
        w = w + "e";
      }
    }
  }
  re = /^(.+?)y$/;
  if (re.test(w)) {
    const fp = re.exec(w);
    stem = fp?.[1];
    re = new RegExp(s_v);
    if (stem && re.test(stem)) {
      w = stem + "i";
    }
  }
  re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
  if (re.test(w)) {
    const fp = re.exec(w);
    stem = fp?.[1];
    suffix = fp?.[2];
    re = new RegExp(mgr0);
    if (stem && re.test(stem)) {
      w = stem + step2List[suffix];
    }
  }
  re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
  if (re.test(w)) {
    const fp = re.exec(w);
    stem = fp?.[1];
    suffix = fp?.[2];
    re = new RegExp(mgr0);
    if (stem && re.test(stem)) {
      w = stem + step3List[suffix];
    }
  }
  re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
  re2 = /^(.+?)(s|t)(ion)$/;
  if (re.test(w)) {
    const fp = re.exec(w);
    stem = fp?.[1];
    re = new RegExp(mgr1);
    if (stem && re.test(stem)) {
      w = stem;
    }
  } else if (re2.test(w)) {
    const fp = re2.exec(w);
    stem = fp?.[1] ?? "" + fp?.[2] ?? "";
    re2 = new RegExp(mgr1);
    if (re2.test(stem)) {
      w = stem;
    }
  }
  re = /^(.+?)e$/;
  if (re.test(w)) {
    const fp = re.exec(w);
    stem = fp?.[1];
    re = new RegExp(mgr1);
    re2 = new RegExp(meq1);
    re3 = new RegExp("^" + C + v + "[^aeiouwxy]$");
    if (stem && (re.test(stem) || re2.test(stem) && !re3.test(stem))) {
      w = stem;
    }
  }
  re = /ll$/;
  re2 = new RegExp(mgr1);
  if (re.test(w) && re2.test(w)) {
    re = /.$/;
    w = w.replace(re, "");
  }
  if (firstch == "y") {
    w = firstch.toLowerCase() + w.substring(1);
  }
  return w;
}

// node_modules/@orama/orama/dist/browser/components/tokenizer/index.js
function normalizeToken(prop, token, withCache = true) {
  const key = `${this.language}:${prop}:${token}`;
  if (withCache && this.normalizationCache.has(key)) {
    return this.normalizationCache.get(key);
  }
  if (this.stopWords?.includes(token)) {
    if (withCache) {
      this.normalizationCache.set(key, "");
    }
    return "";
  }
  if (this.stemmer && !this.stemmerSkipProperties.has(prop)) {
    token = this.stemmer(token);
  }
  token = replaceDiacritics(token);
  if (withCache) {
    this.normalizationCache.set(key, token);
  }
  return token;
}
function trim(text) {
  while (text[text.length - 1] === "") {
    text.pop();
  }
  while (text[0] === "") {
    text.shift();
  }
  return text;
}
function tokenize(input, language2, prop, withCache = true) {
  if (language2 && language2 !== this.language) {
    throw createError("LANGUAGE_NOT_SUPPORTED", language2);
  }
  if (typeof input !== "string") {
    return [input];
  }
  const normalizeToken2 = this.normalizeToken.bind(this, prop ?? "");
  let tokens;
  if (prop && this.tokenizeSkipProperties.has(prop)) {
    tokens = [normalizeToken2(input, withCache)];
  } else {
    const splitRule = SPLITTERS[this.language];
    tokens = input.toLowerCase().split(splitRule).map((t) => normalizeToken2(t, withCache)).filter(Boolean);
  }
  const trimTokens = trim(tokens);
  if (!this.allowDuplicates) {
    return Array.from(new Set(trimTokens));
  }
  return trimTokens;
}
function createTokenizer(config = {}) {
  if (!config.language) {
    config.language = "english";
  } else if (!SUPPORTED_LANGUAGES.includes(config.language)) {
    throw createError("LANGUAGE_NOT_SUPPORTED", config.language);
  }
  let stemmer3;
  if (config.stemming || config.stemmer && !("stemming" in config)) {
    if (config.stemmer) {
      if (typeof config.stemmer !== "function") {
        throw createError("INVALID_STEMMER_FUNCTION_TYPE");
      }
      stemmer3 = config.stemmer;
    } else {
      if (config.language === "english") {
        stemmer3 = stemmer;
      } else {
        throw createError("MISSING_STEMMER", config.language);
      }
    }
  }
  let stopWords;
  if (config.stopWords !== false) {
    stopWords = [];
    if (Array.isArray(config.stopWords)) {
      stopWords = config.stopWords;
    } else if (typeof config.stopWords === "function") {
      stopWords = config.stopWords(stopWords);
    } else if (config.stopWords) {
      throw createError("CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY");
    }
    if (!Array.isArray(stopWords)) {
      throw createError("CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY");
    }
    for (const s2 of stopWords) {
      if (typeof s2 !== "string") {
        throw createError("CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY");
      }
    }
  }
  const tokenizer = {
    tokenize,
    language: config.language,
    stemmer: stemmer3,
    stemmerSkipProperties: new Set(config.stemmerSkipProperties ? [config.stemmerSkipProperties].flat() : []),
    tokenizeSkipProperties: new Set(config.tokenizeSkipProperties ? [config.tokenizeSkipProperties].flat() : []),
    stopWords,
    allowDuplicates: Boolean(config.allowDuplicates),
    normalizeToken,
    normalizationCache: /* @__PURE__ */ new Map()
  };
  tokenizer.tokenize = tokenize.bind(tokenizer);
  tokenizer.normalizeToken = normalizeToken;
  return tokenizer;
}

// node_modules/@orama/orama/dist/browser/components/pinning.js
function create4(sharedInternalDocumentStore) {
  return {
    sharedInternalDocumentStore,
    rules: /* @__PURE__ */ new Map()
  };
}
function addRule(store2, rule) {
  if (store2.rules.has(rule.id)) {
    throw new Error(`PINNING_RULE_ALREADY_EXISTS: A pinning rule with id "${rule.id}" already exists. Use updateRule to modify it.`);
  }
  store2.rules.set(rule.id, rule);
}
function updateRule(store2, rule) {
  if (!store2.rules.has(rule.id)) {
    throw new Error(`PINNING_RULE_NOT_FOUND: Cannot update pinning rule with id "${rule.id}" because it does not exist. Use addRule to create it.`);
  }
  store2.rules.set(rule.id, rule);
}
function removeRule(store2, ruleId) {
  return store2.rules.delete(ruleId);
}
function getRule(store2, ruleId) {
  return store2.rules.get(ruleId);
}
function getAllRules(store2) {
  return Array.from(store2.rules.values());
}
function matchesCondition(term, condition) {
  const normalizedTerm = term.toLowerCase().trim();
  const normalizedPattern = condition.pattern.toLowerCase().trim();
  switch (condition.anchoring) {
    case "is":
      return normalizedTerm === normalizedPattern;
    case "starts_with":
      return normalizedTerm.startsWith(normalizedPattern);
    case "contains":
      return normalizedTerm.includes(normalizedPattern);
    default:
      return false;
  }
}
function matchesRule(term, rule) {
  if (!term) {
    return false;
  }
  return rule.conditions.every((condition) => matchesCondition(term, condition));
}
function getMatchingRules(store2, term) {
  if (!term) {
    return [];
  }
  const matchingRules = [];
  for (const rule of store2.rules.values()) {
    if (matchesRule(term, rule)) {
      matchingRules.push(rule);
    }
  }
  return matchingRules;
}
function load5(sharedInternalDocumentStore, raw) {
  const rawStore = raw;
  return {
    sharedInternalDocumentStore,
    rules: new Map(rawStore?.rules ?? [])
  };
}
function save5(store2) {
  return {
    rules: Array.from(store2.rules.entries())
  };
}
function createPinning() {
  return {
    create: create4,
    addRule,
    updateRule,
    removeRule,
    getRule,
    getAllRules,
    getMatchingRules,
    load: load5,
    save: save5
  };
}

// node_modules/@orama/orama/dist/browser/methods/create.js
function validateComponents(components) {
  const defaultComponents = {
    formatElapsedTime,
    getDocumentIndexId,
    getDocumentProperties,
    validateSchema
  };
  for (const rawKey of FUNCTION_COMPONENTS) {
    const key = rawKey;
    if (components[key]) {
      if (typeof components[key] !== "function") {
        throw createError("COMPONENT_MUST_BE_FUNCTION", key);
      }
    } else {
      components[key] = defaultComponents[key];
    }
  }
  for (const rawKey of Object.keys(components)) {
    if (!OBJECT_COMPONENTS.includes(rawKey) && !FUNCTION_COMPONENTS.includes(rawKey)) {
      throw createError("UNSUPPORTED_COMPONENT", rawKey);
    }
  }
}
function create5({ schema, sort, language: language2, components, id, plugins }) {
  if (!components) {
    components = {};
  }
  for (const plugin of plugins ?? []) {
    if (!("getComponents" in plugin)) {
      continue;
    }
    if (typeof plugin.getComponents !== "function") {
      continue;
    }
    const pluginComponents = plugin.getComponents(schema);
    const keys = Object.keys(pluginComponents);
    for (const key of keys) {
      if (components[key]) {
        throw createError("PLUGIN_COMPONENT_CONFLICT", key, plugin.name);
      }
    }
    components = {
      ...components,
      ...pluginComponents
    };
  }
  if (!id) {
    id = uniqueId();
  }
  let tokenizer = components.tokenizer;
  let index = components.index;
  let documentsStore = components.documentsStore;
  let sorter = components.sorter;
  let pinning = components.pinning;
  if (!tokenizer) {
    tokenizer = createTokenizer({ language: language2 ?? "english" });
  } else if (!tokenizer.tokenize) {
    tokenizer = createTokenizer(tokenizer);
  } else {
    const customTokenizer = tokenizer;
    tokenizer = customTokenizer;
  }
  if (components.tokenizer && language2) {
    throw createError("NO_LANGUAGE_WITH_CUSTOM_TOKENIZER");
  }
  const internalDocumentStore = createInternalDocumentIDStore();
  index || (index = createIndex());
  sorter || (sorter = createSorter());
  documentsStore || (documentsStore = createDocumentsStore());
  pinning || (pinning = createPinning());
  validateComponents(components);
  const { getDocumentProperties: getDocumentProperties2, getDocumentIndexId: getDocumentIndexId2, validateSchema: validateSchema2, formatElapsedTime: formatElapsedTime2 } = components;
  const orama = {
    data: {},
    caches: {},
    schema,
    tokenizer,
    index,
    sorter,
    documentsStore,
    pinning,
    internalDocumentIDStore: internalDocumentStore,
    getDocumentProperties: getDocumentProperties2,
    getDocumentIndexId: getDocumentIndexId2,
    validateSchema: validateSchema2,
    beforeInsert: [],
    afterInsert: [],
    beforeRemove: [],
    afterRemove: [],
    beforeUpdate: [],
    afterUpdate: [],
    beforeUpsert: [],
    afterUpsert: [],
    beforeSearch: [],
    afterSearch: [],
    beforeInsertMultiple: [],
    afterInsertMultiple: [],
    beforeRemoveMultiple: [],
    afterRemoveMultiple: [],
    beforeUpdateMultiple: [],
    afterUpdateMultiple: [],
    beforeUpsertMultiple: [],
    afterUpsertMultiple: [],
    afterCreate: [],
    formatElapsedTime: formatElapsedTime2,
    id,
    plugins,
    version: getVersion()
  };
  orama.data = {
    index: orama.index.create(orama, internalDocumentStore, schema),
    docs: orama.documentsStore.create(orama, internalDocumentStore),
    sorting: orama.sorter.create(orama, internalDocumentStore, schema, sort),
    pinning: orama.pinning.create(internalDocumentStore)
  };
  for (const hook of AVAILABLE_PLUGIN_HOOKS) {
    orama[hook] = (orama[hook] ?? []).concat(getAllPluginsByHook(orama, hook));
  }
  const afterCreate = orama["afterCreate"];
  if (afterCreate) {
    runAfterCreate(afterCreate, orama);
  }
  return orama;
}
function getVersion() {
  return "{{VERSION}}";
}

// node_modules/@orama/orama/dist/browser/methods/docs.js
function count2(db) {
  return db.documentsStore.count(db.data.docs);
}

// node_modules/@orama/orama/dist/browser/methods/insert.js
function insert3(orama, doc, language2, skipHooks, options) {
  const errorProperty = orama.validateSchema(doc, orama.schema);
  if (errorProperty) {
    throw createError("SCHEMA_VALIDATION_FAILURE", errorProperty);
  }
  const asyncNeeded = isAsyncFunction(orama.beforeInsert) || isAsyncFunction(orama.afterInsert) || isAsyncFunction(orama.index.beforeInsert) || isAsyncFunction(orama.index.insert) || isAsyncFunction(orama.index.afterInsert);
  if (asyncNeeded) {
    return innerInsertAsync(orama, doc, language2, skipHooks, options);
  }
  return innerInsertSync(orama, doc, language2, skipHooks, options);
}
var ENUM_TYPE = /* @__PURE__ */ new Set(["enum", "enum[]"]);
var STRING_NUMBER_TYPE = /* @__PURE__ */ new Set(["string", "number"]);
async function innerInsertAsync(orama, doc, language2, skipHooks, options) {
  const { index, docs } = orama.data;
  const id = orama.getDocumentIndexId(doc);
  if (typeof id !== "string") {
    throw createError("DOCUMENT_ID_MUST_BE_STRING", typeof id);
  }
  const internalId = getInternalDocumentId(orama.internalDocumentIDStore, id);
  if (!skipHooks) {
    await runSingleHook(orama.beforeInsert, orama, id, doc);
  }
  if (!orama.documentsStore.store(docs, id, internalId, doc)) {
    throw createError("DOCUMENT_ALREADY_EXISTS", id);
  }
  const docsCount = orama.documentsStore.count(docs);
  const indexableProperties = orama.index.getSearchableProperties(index);
  const indexablePropertiesWithTypes = orama.index.getSearchablePropertiesWithTypes(index);
  const indexableValues = orama.getDocumentProperties(doc, indexableProperties);
  for (const [key, value] of Object.entries(indexableValues)) {
    if (typeof value === "undefined")
      continue;
    const actualType = typeof value;
    const expectedType = indexablePropertiesWithTypes[key];
    validateDocumentProperty(actualType, expectedType, key, value);
  }
  await indexAndSortDocument(orama, id, indexableProperties, indexableValues, docsCount, language2, doc, options);
  if (!skipHooks) {
    await runSingleHook(orama.afterInsert, orama, id, doc);
  }
  return id;
}
function innerInsertSync(orama, doc, language2, skipHooks, options) {
  const { index, docs } = orama.data;
  const id = orama.getDocumentIndexId(doc);
  if (typeof id !== "string") {
    throw createError("DOCUMENT_ID_MUST_BE_STRING", typeof id);
  }
  const internalId = getInternalDocumentId(orama.internalDocumentIDStore, id);
  if (!skipHooks) {
    runSingleHook(orama.beforeInsert, orama, id, doc);
  }
  if (!orama.documentsStore.store(docs, id, internalId, doc)) {
    throw createError("DOCUMENT_ALREADY_EXISTS", id);
  }
  const docsCount = orama.documentsStore.count(docs);
  const indexableProperties = orama.index.getSearchableProperties(index);
  const indexablePropertiesWithTypes = orama.index.getSearchablePropertiesWithTypes(index);
  const indexableValues = orama.getDocumentProperties(doc, indexableProperties);
  for (const [key, value] of Object.entries(indexableValues)) {
    if (typeof value === "undefined")
      continue;
    const actualType = typeof value;
    const expectedType = indexablePropertiesWithTypes[key];
    validateDocumentProperty(actualType, expectedType, key, value);
  }
  indexAndSortDocumentSync(orama, id, indexableProperties, indexableValues, docsCount, language2, doc, options);
  if (!skipHooks) {
    runSingleHook(orama.afterInsert, orama, id, doc);
  }
  return id;
}
function validateDocumentProperty(actualType, expectedType, key, value) {
  if (isGeoPointType(expectedType) && typeof value === "object" && typeof value.lon === "number" && typeof value.lat === "number") {
    return;
  }
  if (isVectorType(expectedType) && Array.isArray(value))
    return;
  if (isArrayType(expectedType) && Array.isArray(value))
    return;
  if (ENUM_TYPE.has(expectedType) && STRING_NUMBER_TYPE.has(actualType))
    return;
  if (actualType !== expectedType) {
    throw createError("INVALID_DOCUMENT_PROPERTY", key, expectedType, actualType);
  }
}
async function indexAndSortDocument(orama, id, indexableProperties, indexableValues, docsCount, language2, doc, options) {
  for (const prop of indexableProperties) {
    const value = indexableValues[prop];
    if (typeof value === "undefined")
      continue;
    const expectedType = orama.index.getSearchablePropertiesWithTypes(orama.data.index)[prop];
    await orama.index.beforeInsert?.(orama.data.index, prop, id, value, expectedType, language2, orama.tokenizer, docsCount);
    const internalId = orama.internalDocumentIDStore.idToInternalId.get(id);
    await orama.index.insert(orama.index, orama.data.index, prop, id, internalId, value, expectedType, language2, orama.tokenizer, docsCount, options);
    await orama.index.afterInsert?.(orama.data.index, prop, id, value, expectedType, language2, orama.tokenizer, docsCount);
  }
  const sortableProperties = orama.sorter.getSortableProperties(orama.data.sorting);
  const sortableValues = orama.getDocumentProperties(doc, sortableProperties);
  for (const prop of sortableProperties) {
    const value = sortableValues[prop];
    if (typeof value === "undefined")
      continue;
    const expectedType = orama.sorter.getSortablePropertiesWithTypes(orama.data.sorting)[prop];
    orama.sorter.insert(orama.data.sorting, prop, id, value, expectedType, language2);
  }
}
function indexAndSortDocumentSync(orama, id, indexableProperties, indexableValues, docsCount, language2, doc, options) {
  for (const prop of indexableProperties) {
    const value = indexableValues[prop];
    if (typeof value === "undefined")
      continue;
    const expectedType = orama.index.getSearchablePropertiesWithTypes(orama.data.index)[prop];
    const internalDocumentId = getInternalDocumentId(orama.internalDocumentIDStore, id);
    orama.index.beforeInsert?.(orama.data.index, prop, id, value, expectedType, language2, orama.tokenizer, docsCount);
    orama.index.insert(orama.index, orama.data.index, prop, id, internalDocumentId, value, expectedType, language2, orama.tokenizer, docsCount, options);
    orama.index.afterInsert?.(orama.data.index, prop, id, value, expectedType, language2, orama.tokenizer, docsCount);
  }
  const sortableProperties = orama.sorter.getSortableProperties(orama.data.sorting);
  const sortableValues = orama.getDocumentProperties(doc, sortableProperties);
  for (const prop of sortableProperties) {
    const value = sortableValues[prop];
    if (typeof value === "undefined")
      continue;
    const expectedType = orama.sorter.getSortablePropertiesWithTypes(orama.data.sorting)[prop];
    orama.sorter.insert(orama.data.sorting, prop, id, value, expectedType, language2);
  }
}
function insertMultiple(orama, docs, batchSize, language2, skipHooks, timeout) {
  const asyncNeeded = isAsyncFunction(orama.afterInsertMultiple) || isAsyncFunction(orama.beforeInsertMultiple) || isAsyncFunction(orama.index.beforeInsert) || isAsyncFunction(orama.index.insert) || isAsyncFunction(orama.index.afterInsert);
  if (asyncNeeded) {
    return innerInsertMultipleAsync(orama, docs, batchSize, language2, skipHooks, timeout);
  }
  return innerInsertMultipleSync(orama, docs, batchSize, language2, skipHooks, timeout);
}
async function innerInsertMultipleAsync(orama, docs, batchSize = 1e3, language2, skipHooks, timeout = 0) {
  const ids = [];
  const processNextBatch = async (startIndex) => {
    const endIndex = Math.min(startIndex + batchSize, docs.length);
    const batch = docs.slice(startIndex, endIndex);
    for (const doc of batch) {
      const options = { avlRebalanceThreshold: batch.length };
      const id = await insert3(orama, doc, language2, skipHooks, options);
      ids.push(id);
    }
    return endIndex;
  };
  const processAllBatches = async () => {
    let currentIndex = 0;
    while (currentIndex < docs.length) {
      const startTime = Date.now();
      currentIndex = await processNextBatch(currentIndex);
      if (timeout > 0) {
        const elapsedTime = Date.now() - startTime;
        const waitTime = timeout - elapsedTime;
        if (waitTime > 0) {
          sleep(waitTime);
        }
      }
    }
  };
  await processAllBatches();
  if (!skipHooks) {
    await runMultipleHook(orama.afterInsertMultiple, orama, docs);
  }
  return ids;
}
function innerInsertMultipleSync(orama, docs, batchSize = 1e3, language2, skipHooks, timeout = 0) {
  const ids = [];
  let i = 0;
  function processNextBatch() {
    const batch = docs.slice(i * batchSize, (i + 1) * batchSize);
    if (batch.length === 0)
      return false;
    for (const doc of batch) {
      const options = { avlRebalanceThreshold: batch.length };
      const id = insert3(orama, doc, language2, skipHooks, options);
      ids.push(id);
    }
    i++;
    return true;
  }
  function processAllBatches() {
    const startTime = Date.now();
    while (true) {
      const hasMoreBatches = processNextBatch();
      if (!hasMoreBatches)
        break;
      if (timeout > 0) {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= timeout) {
          const remainingTime = timeout - elapsedTime % timeout;
          if (remainingTime > 0) {
            sleep(remainingTime);
          }
        }
      }
    }
  }
  processAllBatches();
  if (!skipHooks) {
    runMultipleHook(orama.afterInsertMultiple, orama, docs);
  }
  return ids;
}

// node_modules/@orama/orama/dist/browser/constants.js
var MODE_FULLTEXT_SEARCH = "fulltext";
var MODE_HYBRID_SEARCH = "hybrid";
var MODE_VECTOR_SEARCH = "vector";

// node_modules/@orama/orama/dist/browser/components/facets.js
function sortAsc(a, b) {
  return a[1] - b[1];
}
function sortDesc(a, b) {
  return b[1] - a[1];
}
function sortingPredicateBuilder(order = "desc") {
  return order.toLowerCase() === "asc" ? sortAsc : sortDesc;
}
function getFacets(orama, results, facetsConfig) {
  const facets = {};
  const allIDs = results.map(([id]) => id);
  const allDocs = orama.documentsStore.getMultiple(orama.data.docs, allIDs);
  const facetKeys = Object.keys(facetsConfig);
  const properties = orama.index.getSearchablePropertiesWithTypes(orama.data.index);
  for (const facet of facetKeys) {
    let values;
    if (properties[facet] === "number") {
      const { ranges } = facetsConfig[facet];
      const rangesLength = ranges.length;
      const tmp = Array.from({ length: rangesLength });
      for (let i = 0; i < rangesLength; i++) {
        const range = ranges[i];
        tmp[i] = [`${range.from}-${range.to}`, 0];
      }
      values = Object.fromEntries(tmp);
    }
    facets[facet] = {
      count: 0,
      values: values ?? {}
    };
  }
  const allDocsLength = allDocs.length;
  for (let i = 0; i < allDocsLength; i++) {
    const doc = allDocs[i];
    for (const facet of facetKeys) {
      const facetValue = facet.includes(".") ? getNested(doc, facet) : doc[facet];
      const propertyType = properties[facet];
      const facetValues = facets[facet].values;
      switch (propertyType) {
        case "number": {
          const ranges = facetsConfig[facet].ranges;
          calculateNumberFacetBuilder(ranges, facetValues)(facetValue);
          break;
        }
        case "number[]": {
          const alreadyInsertedValues = /* @__PURE__ */ new Set();
          const ranges = facetsConfig[facet].ranges;
          const calculateNumberFacet = calculateNumberFacetBuilder(ranges, facetValues, alreadyInsertedValues);
          for (const v2 of facetValue) {
            calculateNumberFacet(v2);
          }
          break;
        }
        case "boolean":
        case "enum":
        case "string": {
          calculateBooleanStringOrEnumFacetBuilder(facetValues, propertyType)(facetValue);
          break;
        }
        case "boolean[]":
        case "enum[]":
        case "string[]": {
          const alreadyInsertedValues = /* @__PURE__ */ new Set();
          const innerType = propertyType === "boolean[]" ? "boolean" : "string";
          const calculateBooleanStringOrEnumFacet = calculateBooleanStringOrEnumFacetBuilder(facetValues, innerType, alreadyInsertedValues);
          for (const v2 of facetValue) {
            calculateBooleanStringOrEnumFacet(v2);
          }
          break;
        }
        default:
          throw createError("FACET_NOT_SUPPORTED", propertyType);
      }
    }
  }
  for (const facet of facetKeys) {
    const currentFacet = facets[facet];
    currentFacet.count = Object.keys(currentFacet.values).length;
    if (properties[facet] === "string") {
      const stringFacetDefinition = facetsConfig[facet];
      const sortingPredicate = sortingPredicateBuilder(stringFacetDefinition.sort);
      currentFacet.values = Object.fromEntries(Object.entries(currentFacet.values).sort(sortingPredicate).slice(stringFacetDefinition.offset ?? 0, stringFacetDefinition.limit ?? 10));
    }
  }
  return facets;
}
function calculateNumberFacetBuilder(ranges, values, alreadyInsertedValues) {
  return (facetValue) => {
    for (const range of ranges) {
      const value = `${range.from}-${range.to}`;
      if (alreadyInsertedValues?.has(value)) {
        continue;
      }
      if (facetValue >= range.from && facetValue <= range.to) {
        if (values[value] === void 0) {
          values[value] = 1;
        } else {
          values[value]++;
          alreadyInsertedValues?.add(value);
        }
      }
    }
  };
}
function calculateBooleanStringOrEnumFacetBuilder(values, propertyType, alreadyInsertedValues) {
  const defaultValue = propertyType === "boolean" ? "false" : "";
  return (facetValue) => {
    const value = facetValue?.toString() ?? defaultValue;
    if (alreadyInsertedValues?.has(value)) {
      return;
    }
    values[value] = (values[value] ?? 0) + 1;
    alreadyInsertedValues?.add(value);
  };
}

// node_modules/@orama/orama/dist/browser/components/groups.js
var DEFAULT_REDUCE = {
  reducer: (_, acc, res, index) => {
    acc[index] = res;
    return acc;
  },
  getInitialValue: (length) => Array.from({ length })
};
var ALLOWED_TYPES = ["string", "number", "boolean"];
function getGroups(orama, results, groupBy) {
  const properties = groupBy.properties;
  const propertiesLength = properties.length;
  const schemaProperties = orama.index.getSearchablePropertiesWithTypes(orama.data.index);
  for (let i = 0; i < propertiesLength; i++) {
    const property = properties[i];
    if (typeof schemaProperties[property] === "undefined") {
      throw createError("UNKNOWN_GROUP_BY_PROPERTY", property);
    }
    if (!ALLOWED_TYPES.includes(schemaProperties[property])) {
      throw createError("INVALID_GROUP_BY_PROPERTY", property, ALLOWED_TYPES.join(", "), schemaProperties[property]);
    }
  }
  const allIDs = results.map(([id]) => getDocumentIdFromInternalId(orama.internalDocumentIDStore, id));
  const allDocs = orama.documentsStore.getMultiple(orama.data.docs, allIDs);
  const allDocsLength = allDocs.length;
  const returnedCount = groupBy.maxResult || Number.MAX_SAFE_INTEGER;
  const listOfValues = [];
  const g = {};
  for (let i = 0; i < propertiesLength; i++) {
    const groupByKey = properties[i];
    const group = {
      property: groupByKey,
      perValue: {}
    };
    const values = /* @__PURE__ */ new Set();
    for (let j = 0; j < allDocsLength; j++) {
      const doc = allDocs[j];
      const value = getNested(doc, groupByKey);
      if (typeof value === "undefined") {
        continue;
      }
      const keyValue = typeof value !== "boolean" ? value : "" + value;
      const perValue = group.perValue[keyValue] ?? {
        indexes: [],
        count: 0
      };
      if (perValue.count >= returnedCount) {
        continue;
      }
      perValue.indexes.push(j);
      perValue.count++;
      group.perValue[keyValue] = perValue;
      values.add(value);
    }
    listOfValues.push(Array.from(values));
    g[groupByKey] = group;
  }
  const combinations = calculateCombination(listOfValues);
  const combinationsLength = combinations.length;
  const groups = [];
  for (let i = 0; i < combinationsLength; i++) {
    const combination = combinations[i];
    const combinationLength = combination.length;
    const group = {
      values: [],
      indexes: []
    };
    const indexes = [];
    for (let j = 0; j < combinationLength; j++) {
      const value = combination[j];
      const property = properties[j];
      indexes.push(g[property].perValue[typeof value !== "boolean" ? value : "" + value].indexes);
      group.values.push(value);
    }
    group.indexes = intersect(indexes).sort((a, b) => a - b);
    if (group.indexes.length === 0) {
      continue;
    }
    groups.push(group);
  }
  const groupsLength = groups.length;
  const res = Array.from({ length: groupsLength });
  for (let i = 0; i < groupsLength; i++) {
    const group = groups[i];
    const reduce = groupBy.reduce || DEFAULT_REDUCE;
    const docs = group.indexes.map((index) => {
      return {
        id: allIDs[index],
        score: results[index][1],
        document: allDocs[index]
      };
    });
    const func = reduce.reducer.bind(null, group.values);
    const initialValue = reduce.getInitialValue(group.indexes.length);
    const aggregationValue = docs.reduce(func, initialValue);
    res[i] = {
      values: group.values,
      result: aggregationValue
    };
  }
  return res;
}
function calculateCombination(arrs, index = 0) {
  if (index + 1 === arrs.length)
    return arrs[index].map((item) => [item]);
  const head = arrs[index];
  const c2 = calculateCombination(arrs, index + 1);
  const combinations = [];
  for (const value of head) {
    for (const combination of c2) {
      const result = [value];
      safeArrayPush(result, combination);
      combinations.push(result);
    }
  }
  return combinations;
}

// node_modules/@orama/orama/dist/browser/components/pinning-manager.js
function applyPinningRules(orama, pinningStore, uniqueDocsArray, searchTerm) {
  const matchingRules = getMatchingRules(pinningStore, searchTerm);
  if (matchingRules.length === 0) {
    return uniqueDocsArray;
  }
  const allPromotions = matchingRules.flatMap((rule) => rule.consequence.promote);
  allPromotions.sort((a, b) => a.position - b.position);
  const pinnedInternalIds = /* @__PURE__ */ new Set();
  const promotionsMap = /* @__PURE__ */ new Map();
  const positionsTaken = /* @__PURE__ */ new Set();
  for (const promotion of allPromotions) {
    const internalId = getInternalDocumentId(orama.internalDocumentIDStore, promotion.doc_id);
    if (internalId === void 0) {
      continue;
    }
    if (promotionsMap.has(internalId)) {
      const existingPosition = promotionsMap.get(internalId);
      if (promotion.position < existingPosition) {
        promotionsMap.set(internalId, promotion.position);
      }
      continue;
    }
    if (positionsTaken.has(promotion.position)) {
      continue;
    }
    pinnedInternalIds.add(internalId);
    promotionsMap.set(internalId, promotion.position);
    positionsTaken.add(promotion.position);
  }
  if (promotionsMap.size === 0) {
    return uniqueDocsArray;
  }
  const unpinnedResults = uniqueDocsArray.filter(([id]) => !pinnedInternalIds.has(id));
  const BASE_PIN_SCORE = 1e6;
  const pinnedResults = [];
  for (const [internalId, position] of promotionsMap.entries()) {
    const existingResult = uniqueDocsArray.find(([id]) => id === internalId);
    if (existingResult) {
      pinnedResults.push([internalId, BASE_PIN_SCORE - position]);
    } else {
      const doc = orama.documentsStore.get(orama.data.docs, internalId);
      if (doc) {
        pinnedResults.push([internalId, 0]);
      }
    }
  }
  pinnedResults.sort((a, b) => {
    const posA = promotionsMap.get(a[0]) ?? Infinity;
    const posB = promotionsMap.get(b[0]) ?? Infinity;
    return posA - posB;
  });
  const finalResults = [];
  const pinnedByPosition = /* @__PURE__ */ new Map();
  for (const pinnedResult of pinnedResults) {
    const position = promotionsMap.get(pinnedResult[0]);
    pinnedByPosition.set(position, pinnedResult);
  }
  let unpinnedIndex = 0;
  let currentPosition = 0;
  while (currentPosition < unpinnedResults.length + pinnedResults.length) {
    if (pinnedByPosition.has(currentPosition)) {
      finalResults.push(pinnedByPosition.get(currentPosition));
      currentPosition++;
    } else if (unpinnedIndex < unpinnedResults.length) {
      finalResults.push(unpinnedResults[unpinnedIndex]);
      unpinnedIndex++;
      currentPosition++;
    } else {
      break;
    }
  }
  for (const [position, pinnedResult] of pinnedByPosition.entries()) {
    if (position >= finalResults.length) {
      finalResults.push(pinnedResult);
    }
  }
  return finalResults;
}

// node_modules/@orama/orama/dist/browser/methods/search-fulltext.js
function innerFullTextSearch(orama, params, language2) {
  const { term, properties } = params;
  const index = orama.data.index;
  let propertiesToSearch = orama.caches["propertiesToSearch"];
  if (!propertiesToSearch) {
    const propertiesToSearchWithTypes = orama.index.getSearchablePropertiesWithTypes(index);
    propertiesToSearch = orama.index.getSearchableProperties(index);
    propertiesToSearch = propertiesToSearch.filter((prop) => propertiesToSearchWithTypes[prop].startsWith("string"));
    orama.caches["propertiesToSearch"] = propertiesToSearch;
  }
  if (properties && properties !== "*") {
    for (const prop of properties) {
      if (!propertiesToSearch.includes(prop)) {
        throw createError("UNKNOWN_INDEX", prop, propertiesToSearch.join(", "));
      }
    }
    propertiesToSearch = propertiesToSearch.filter((prop) => properties.includes(prop));
  }
  const hasFilters = Object.keys(params.where ?? {}).length > 0;
  let whereFiltersIDs;
  if (hasFilters) {
    whereFiltersIDs = orama.index.searchByWhereClause(index, orama.tokenizer, params.where, language2);
  }
  let uniqueDocsIDs;
  const threshold = params.threshold !== void 0 && params.threshold !== null ? params.threshold : 1;
  if (term || properties) {
    const docsCount = count2(orama);
    uniqueDocsIDs = orama.index.search(index, term || "", orama.tokenizer, language2, propertiesToSearch, params.exact || false, params.tolerance || 0, params.boost || {}, applyDefault(params.relevance), docsCount, whereFiltersIDs, threshold);
    if (params.exact && term) {
      const searchTerms = term.trim().split(/\s+/);
      uniqueDocsIDs = uniqueDocsIDs.filter(([docId]) => {
        const doc = orama.documentsStore.get(orama.data.docs, docId);
        if (!doc)
          return false;
        for (const prop of propertiesToSearch) {
          const propValue = getPropValue(doc, prop);
          if (typeof propValue === "string") {
            const hasAllTerms = searchTerms.every((searchTerm) => {
              const regex = new RegExp(`\\b${escapeRegex(searchTerm)}\\b`);
              return regex.test(propValue);
            });
            if (hasAllTerms) {
              return true;
            }
          }
        }
        return false;
      });
    }
  } else {
    if (hasFilters) {
      const geoResults = searchByGeoWhereClause(index, params.where);
      if (geoResults) {
        uniqueDocsIDs = geoResults;
      } else {
        const docIds = whereFiltersIDs ? Array.from(whereFiltersIDs) : [];
        uniqueDocsIDs = docIds.map((k) => [+k, 0]);
      }
    } else {
      const docIds = Object.keys(orama.documentsStore.getAll(orama.data.docs));
      uniqueDocsIDs = docIds.map((k) => [+k, 0]);
    }
  }
  return uniqueDocsIDs;
}
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function getPropValue(obj, path) {
  const keys = path.split(".");
  let value = obj;
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key];
    } else {
      return void 0;
    }
  }
  return value;
}
function fullTextSearch(orama, params, language2) {
  const timeStart = getNanosecondsTime();
  function performSearchLogic() {
    const vectorProperties = Object.keys(orama.data.index.vectorIndexes);
    const shouldCalculateFacets = params.facets && Object.keys(params.facets).length > 0;
    const { limit = 10, offset = 0, distinctOn, includeVectors = false } = params;
    const isPreflight = params.preflight === true;
    let uniqueDocsArray = innerFullTextSearch(orama, params, language2);
    if (params.sortBy) {
      if (typeof params.sortBy === "function") {
        const ids = uniqueDocsArray.map(([id]) => id);
        const docs = orama.documentsStore.getMultiple(orama.data.docs, ids);
        const docsWithIdAndScore = docs.map((d, i) => [
          uniqueDocsArray[i][0],
          uniqueDocsArray[i][1],
          d
        ]);
        docsWithIdAndScore.sort(params.sortBy);
        uniqueDocsArray = docsWithIdAndScore.map(([id, score]) => [id, score]);
      } else {
        uniqueDocsArray = orama.sorter.sortBy(orama.data.sorting, uniqueDocsArray, params.sortBy).map(([id, score]) => [getInternalDocumentId(orama.internalDocumentIDStore, id), score]);
      }
    } else {
      uniqueDocsArray = uniqueDocsArray.sort(sortTokenScorePredicate);
    }
    uniqueDocsArray = applyPinningRules(orama, orama.data.pinning, uniqueDocsArray, params.term);
    let results;
    if (!isPreflight) {
      results = distinctOn ? fetchDocumentsWithDistinct(orama, uniqueDocsArray, offset, limit, distinctOn) : fetchDocuments(orama, uniqueDocsArray, offset, limit);
    }
    const searchResult = {
      elapsed: {
        formatted: "",
        raw: 0
      },
      hits: [],
      count: uniqueDocsArray.length
    };
    if (typeof results !== "undefined") {
      searchResult.hits = results.filter(Boolean);
      if (!includeVectors) {
        removeVectorsFromHits(searchResult, vectorProperties);
      }
    }
    if (shouldCalculateFacets) {
      const facets = getFacets(orama, uniqueDocsArray, params.facets);
      searchResult.facets = facets;
    }
    if (params.groupBy) {
      searchResult.groups = getGroups(orama, uniqueDocsArray, params.groupBy);
    }
    searchResult.elapsed = orama.formatElapsedTime(getNanosecondsTime() - timeStart);
    return searchResult;
  }
  async function executeSearchAsync() {
    if (orama.beforeSearch) {
      await runBeforeSearch(orama.beforeSearch, orama, params, language2);
    }
    const searchResult = performSearchLogic();
    if (orama.afterSearch) {
      await runAfterSearch(orama.afterSearch, orama, params, language2, searchResult);
    }
    return searchResult;
  }
  const asyncNeeded = orama.beforeSearch?.length || orama.afterSearch?.length;
  if (asyncNeeded) {
    return executeSearchAsync();
  }
  return performSearchLogic();
}
var defaultBM25Params = {
  k: 1.2,
  b: 0.75,
  d: 0.5
};
function applyDefault(bm25Relevance) {
  const r2 = bm25Relevance ?? {};
  r2.k = r2.k ?? defaultBM25Params.k;
  r2.b = r2.b ?? defaultBM25Params.b;
  r2.d = r2.d ?? defaultBM25Params.d;
  return r2;
}

// node_modules/@orama/orama/dist/browser/methods/search-vector.js
function innerVectorSearch(orama, params, language2) {
  const vector = params.vector;
  if (vector && (!("value" in vector) || !("property" in vector))) {
    throw createError("INVALID_VECTOR_INPUT", Object.keys(vector).join(", "));
  }
  const vectorIndex = orama.data.index.vectorIndexes[vector.property];
  if (!vectorIndex) {
    throw createError("UNKNOWN_VECTOR_PROPERTY", vector.property);
  }
  const vectorSize = vectorIndex.node.size;
  if (vector?.value.length !== vectorSize) {
    if (vector?.property === void 0 || vector?.value.length === void 0) {
      throw createError("INVALID_INPUT_VECTOR", "undefined", vectorSize, "undefined");
    }
    throw createError("INVALID_INPUT_VECTOR", vector.property, vectorSize, vector.value.length);
  }
  const index = orama.data.index;
  let whereFiltersIDs;
  const hasFilters = Object.keys(params.where ?? {}).length > 0;
  if (hasFilters) {
    whereFiltersIDs = orama.index.searchByWhereClause(index, orama.tokenizer, params.where, language2);
  }
  return vectorIndex.node.find(vector.value, params.similarity ?? DEFAULT_SIMILARITY, whereFiltersIDs);
}
function searchVector(orama, params, language2 = "english") {
  const timeStart = getNanosecondsTime();
  function performSearchLogic() {
    let results = innerVectorSearch(orama, params, language2).sort(sortTokenScorePredicate);
    results = applyPinningRules(orama, orama.data.pinning, results, void 0);
    let facetsResults = [];
    const shouldCalculateFacets = params.facets && Object.keys(params.facets).length > 0;
    if (shouldCalculateFacets) {
      const facets = getFacets(orama, results, params.facets);
      facetsResults = facets;
    }
    const vectorProperty = params.vector.property;
    const includeVectors = params.includeVectors ?? false;
    const limit = params.limit ?? 10;
    const offset = params.offset ?? 0;
    const docs = Array.from({ length: limit });
    for (let i = 0; i < limit; i++) {
      const result = results[i + offset];
      if (!result) {
        break;
      }
      const doc = orama.data.docs.docs[result[0]];
      if (doc) {
        if (!includeVectors) {
          doc[vectorProperty] = null;
        }
        const newDoc = {
          id: getDocumentIdFromInternalId(orama.internalDocumentIDStore, result[0]),
          score: result[1],
          document: doc
        };
        docs[i] = newDoc;
      }
    }
    let groups = [];
    if (params.groupBy) {
      groups = getGroups(orama, results, params.groupBy);
    }
    const timeEnd = getNanosecondsTime();
    const elapsedTime = timeEnd - timeStart;
    return {
      count: results.length,
      hits: docs.filter(Boolean),
      elapsed: {
        raw: Number(elapsedTime),
        formatted: formatNanoseconds(elapsedTime)
      },
      ...facetsResults ? { facets: facetsResults } : {},
      ...groups ? { groups } : {}
    };
  }
  async function executeSearchAsync() {
    if (orama.beforeSearch) {
      await runBeforeSearch(orama.beforeSearch, orama, params, language2);
    }
    const results = performSearchLogic();
    if (orama.afterSearch) {
      await runAfterSearch(orama.afterSearch, orama, params, language2, results);
    }
    return results;
  }
  const asyncNeeded = orama.beforeSearch?.length || orama.afterSearch?.length;
  if (asyncNeeded) {
    return executeSearchAsync();
  }
  return performSearchLogic();
}

// node_modules/@orama/orama/dist/browser/methods/search-hybrid.js
function innerHybridSearch(orama, params, language2) {
  const fullTextIDs = minMaxScoreNormalization(innerFullTextSearch(orama, params, language2));
  const vectorIDs = innerVectorSearch(orama, params, language2);
  const hybridWeights = params.hybridWeights;
  return mergeAndRankResults(fullTextIDs, vectorIDs, params.term ?? "", hybridWeights);
}
function hybridSearch(orama, params, language2) {
  const timeStart = getNanosecondsTime();
  function performSearchLogic() {
    let uniqueTokenScores = innerHybridSearch(orama, params, language2);
    uniqueTokenScores = applyPinningRules(orama, orama.data.pinning, uniqueTokenScores, params.term);
    let facetsResults;
    const shouldCalculateFacets = params.facets && Object.keys(params.facets).length > 0;
    if (shouldCalculateFacets) {
      facetsResults = getFacets(orama, uniqueTokenScores, params.facets);
    }
    let groups;
    if (params.groupBy) {
      groups = getGroups(orama, uniqueTokenScores, params.groupBy);
    }
    const offset = params.offset ?? 0;
    const limit = params.limit ?? 10;
    const results = fetchDocuments(orama, uniqueTokenScores, offset, limit).filter(Boolean);
    const timeEnd = getNanosecondsTime();
    const returningResults = {
      count: uniqueTokenScores.length,
      elapsed: {
        raw: Number(timeEnd - timeStart),
        formatted: formatNanoseconds(timeEnd - timeStart)
      },
      hits: results,
      ...facetsResults ? { facets: facetsResults } : {},
      ...groups ? { groups } : {}
    };
    const includeVectors = params.includeVectors ?? false;
    if (!includeVectors) {
      const vectorProperties = Object.keys(orama.data.index.vectorIndexes);
      removeVectorsFromHits(returningResults, vectorProperties);
    }
    return returningResults;
  }
  async function executeSearchAsync() {
    if (orama.beforeSearch) {
      await runBeforeSearch(orama.beforeSearch, orama, params, language2);
    }
    const results = performSearchLogic();
    if (orama.afterSearch) {
      await runAfterSearch(orama.afterSearch, orama, params, language2, results);
    }
    return results;
  }
  const asyncNeeded = orama.beforeSearch?.length || orama.afterSearch?.length;
  if (asyncNeeded) {
    return executeSearchAsync();
  }
  return performSearchLogic();
}
function extractScore(token) {
  return token[1];
}
function minMaxScoreNormalization(results) {
  const maxScore = Math.max.apply(Math, results.map(extractScore));
  return results.map(([id, score]) => [id, score / maxScore]);
}
function normalizeScore(score, maxScore) {
  return score / maxScore;
}
function hybridScoreBuilder(textWeight, vectorWeight) {
  return (textScore, vectorScore) => textScore * textWeight + vectorScore * vectorWeight;
}
function mergeAndRankResults(textResults, vectorResults, query, hybridWeights) {
  const maxTextScore = Math.max.apply(Math, textResults.map(extractScore));
  const maxVectorScore = Math.max.apply(Math, vectorResults.map(extractScore));
  const hasHybridWeights = hybridWeights && hybridWeights.text && hybridWeights.vector;
  const { text: textWeight, vector: vectorWeight } = hasHybridWeights ? hybridWeights : getQueryWeights(query);
  const mergedResults = /* @__PURE__ */ new Map();
  const textResultsLength = textResults.length;
  const hybridScore = hybridScoreBuilder(textWeight, vectorWeight);
  for (let i = 0; i < textResultsLength; i++) {
    const [id, score] = textResults[i];
    const normalizedScore = normalizeScore(score, maxTextScore);
    const hybridScoreValue = hybridScore(normalizedScore, 0);
    mergedResults.set(id, hybridScoreValue);
  }
  const vectorResultsLength = vectorResults.length;
  for (let i = 0; i < vectorResultsLength; i++) {
    const [resultId, score] = vectorResults[i];
    const normalizedScore = normalizeScore(score, maxVectorScore);
    const existingRes = mergedResults.get(resultId) ?? 0;
    mergedResults.set(resultId, existingRes + hybridScore(0, normalizedScore));
  }
  return [...mergedResults].sort((a, b) => b[1] - a[1]);
}
function getQueryWeights(query) {
  return {
    text: 0.5,
    vector: 0.5
  };
}

// node_modules/@orama/orama/dist/browser/methods/search.js
function search2(orama, params, language2) {
  const mode = params.mode ?? MODE_FULLTEXT_SEARCH;
  if (mode === MODE_FULLTEXT_SEARCH) {
    return fullTextSearch(orama, params, language2);
  }
  if (mode === MODE_VECTOR_SEARCH) {
    return searchVector(orama, params);
  }
  if (mode === MODE_HYBRID_SEARCH) {
    return hybridSearch(orama, params);
  }
  throw createError("INVALID_SEARCH_MODE", mode);
}
function fetchDocumentsWithDistinct(orama, uniqueDocsArray, offset, limit, distinctOn) {
  const docs = orama.data.docs;
  const values = /* @__PURE__ */ new Map();
  const results = [];
  const resultIDs = /* @__PURE__ */ new Set();
  const uniqueDocsArrayLength = uniqueDocsArray.length;
  let count3 = 0;
  for (let i = 0; i < uniqueDocsArrayLength; i++) {
    const idAndScore = uniqueDocsArray[i];
    if (typeof idAndScore === "undefined") {
      continue;
    }
    const [id, score] = idAndScore;
    if (resultIDs.has(id)) {
      continue;
    }
    const doc = orama.documentsStore.get(docs, id);
    const value = getNested(doc, distinctOn);
    if (typeof value === "undefined" || values.has(value)) {
      continue;
    }
    values.set(value, true);
    count3++;
    if (count3 <= offset) {
      continue;
    }
    results.push({ id: getDocumentIdFromInternalId(orama.internalDocumentIDStore, id), score, document: doc });
    resultIDs.add(id);
    if (count3 >= offset + limit) {
      break;
    }
  }
  return results;
}
function fetchDocuments(orama, uniqueDocsArray, offset, limit) {
  const docs = orama.data.docs;
  const results = Array.from({
    length: limit
  });
  const resultIDs = /* @__PURE__ */ new Set();
  for (let i = offset; i < limit + offset; i++) {
    const idAndScore = uniqueDocsArray[i];
    if (typeof idAndScore === "undefined") {
      break;
    }
    const [id, score] = idAndScore;
    if (!resultIDs.has(id)) {
      const fullDoc = orama.documentsStore.get(docs, id);
      results[i] = { id: getDocumentIdFromInternalId(orama.internalDocumentIDStore, id), score, document: fullDoc };
      resultIDs.add(id);
    }
  }
  return results;
}

// node_modules/@orama/orama/dist/browser/types.js
var kInsertions = Symbol("orama.insertions");
var kRemovals = Symbol("orama.removals");

// node_modules/@orama/stemmers/dist/de.js
function r() {
  this.p = function(r2) {
    this.j = r2, this.cursor = 0, this.a = this.j.length, this.f = 0, this.c = this.cursor, this.d = this.a;
  }, this.z = function() {
    return this.j;
  }, this.w = function(r2) {
    this.j = r2.j, this.cursor = r2.cursor, this.a = r2.a, this.f = r2.f, this.c = r2.c, this.d = r2.d;
  }, this.i = function(r2, s2, t) {
    if (this.cursor >= this.a) return false;
    var i = this.j.charCodeAt(this.cursor);
    return !(i > t) && !(i < s2) && 0 != (r2[(i -= s2) >>> 3] & 1 << (7 & i)) && (this.cursor++, true);
  }, this.n = function(r2, s2, t) {
    if (this.cursor <= this.f) return false;
    var i = this.j.charCodeAt(this.cursor - 1);
    return !(i > t) && !(i < s2) && 0 != (r2[(i -= s2) >>> 3] & 1 << (7 & i)) && (this.cursor--, true);
  }, this.k = function(r2, s2, t) {
    if (this.cursor >= this.a) return false;
    var i = this.j.charCodeAt(this.cursor);
    return i > t || i < s2 ? (this.cursor++, true) : 0 == (r2[(i -= s2) >>> 3] & 1 << (7 & i)) && (this.cursor++, true);
  }, this.q = function(r2, s2, t) {
    if (this.cursor <= this.f) return false;
    var i = this.j.charCodeAt(this.cursor - 1);
    return i > t || i < s2 ? (this.cursor--, true) : 0 == (r2[(i -= s2) >>> 3] & 1 << (7 & i)) && (this.cursor--, true);
  }, this.m = function(r2) {
    return !(this.a - this.cursor < r2.length) && this.j.slice(this.cursor, this.cursor + r2.length) == r2 && (this.cursor += r2.length, true);
  }, this.g = function(r2) {
    return !(this.cursor - this.f < r2.length) && this.j.slice(this.cursor - r2.length, this.cursor) == r2 && (this.cursor -= r2.length, true);
  }, this.o = function(r2) {
    for (var s2 = 0, t = r2.length, i = this.cursor, c2 = this.a, u = 0, o = 0, e = false; ; ) {
      var h, n = s2 + (t - s2 >>> 1), a = 0, f = u < o ? u : o, b = r2[n];
      for (h = f; h < b[0].length; h++) {
        if (i + f == c2) {
          a = -1;
          break;
        }
        if (0 != (a = this.j.charCodeAt(i + f) - b[0].charCodeAt(h))) break;
        f++;
      }
      if (0 > a ? (t = n, o = f) : (s2 = n, u = f), 1 >= t - s2) {
        if (0 < s2 || t == s2 || e) break;
        e = true;
      }
    }
    for (; ; ) {
      if (u >= (b = r2[s2])[0].length && (this.cursor = i + b[0].length, 4 > b.length || (s2 = b[3](this), this.cursor = i + b[0].length, s2))) return b[2];
      if (0 > (s2 = b[1])) return 0;
    }
  }, this.h = function(r2) {
    for (var s2 = 0, t = r2.length, i = this.cursor, c2 = this.f, u = 0, o = 0, e = false; ; ) {
      var h, n = s2 + (t - s2 >> 1), a = 0, f = u < o ? u : o, b = r2[n];
      for (h = b[0].length - 1 - f; 0 <= h; h--) {
        if (i - f == c2) {
          a = -1;
          break;
        }
        if (0 != (a = this.j.charCodeAt(i - 1 - f) - b[0].charCodeAt(h))) break;
        f++;
      }
      if (0 > a ? (t = n, o = f) : (s2 = n, u = f), 1 >= t - s2) {
        if (0 < s2 || t == s2 || e) break;
        e = true;
      }
    }
    for (; ; ) {
      if (u >= (b = r2[s2])[0].length && (this.cursor = i - b[0].length, 4 > b.length || (s2 = b[3](this), this.cursor = i - b[0].length, s2))) return b[2];
      if (0 > (s2 = b[1])) return 0;
    }
  }, this.s = function(r2, s2, t) {
    var i = t.length - (s2 - r2);
    return this.j = this.j.slice(0, r2) + t + this.j.slice(s2), this.a += i, this.cursor >= s2 ? this.cursor += i : this.cursor > r2 && (this.cursor = r2), i;
  }, this.t = function() {
    return !(0 > this.c) && !(this.c > this.d) && !(this.d > this.a) && !(this.a > this.j.length);
  }, this.b = function(r2) {
    var s2 = false;
    return this.t() && (this.s(this.c, this.d, r2), s2 = true), s2;
  }, this.e = function() {
    return this.b("");
  }, this.r = function(r2, s2, t) {
    s2 = this.s(r2, s2, t), r2 <= this.c && (this.c += s2), r2 <= this.d && (this.d += s2);
  }, this.u = function() {
    var r2 = "";
    return this.t() && (r2 = this.j.slice(this.c, this.d)), r2;
  }, this.v = function() {
    return this.j.slice(0, this.a);
  };
}
var s = new function() {
  var s2 = new r(), t = [["", -1, 5], ["U", 0, 2], ["Y", 0, 1], ["\xE4", 0, 3], ["\xF6", 0, 4], ["\xFC", 0, 2]], i = [["e", -1, 2], ["em", -1, 1], ["en", -1, 2], ["ern", -1, 1], ["er", -1, 1], ["s", -1, 3], ["es", 5, 2]], c2 = [["en", -1, 1], ["er", -1, 1], ["st", -1, 2], ["est", 2, 1]], u = [["ig", -1, 1], ["lich", -1, 1]], o = [["end", -1, 1], ["ig", -1, 2], ["ung", -1, 1], ["lich", -1, 3], ["isch", -1, 2], ["ik", -1, 2], ["heit", -1, 3], ["keit", -1, 4]], e = [17, 65, 16, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 32, 8], h = [117, 30, 5], n = [117, 30, 4], a = 0, f = 0, b = 0;
  this.l = function() {
    var r2 = s2.cursor;
    return !function() {
      for (var r3 = s2.cursor; ; ) {
        var t2 = s2.cursor;
        r: {
          s: {
            var i2 = s2.cursor;
            if (s2.c = s2.cursor, s2.m("\xDF")) {
              if (s2.d = s2.cursor, !s2.b("ss")) return;
              break s;
            }
            if (s2.cursor = i2, s2.cursor >= s2.a) break r;
            s2.cursor++;
          }
          continue;
        }
        s2.cursor = t2;
        break;
      }
      for (s2.cursor = r3; ; ) {
        r3 = s2.cursor;
        r: {
          for (; ; ) {
            t2 = s2.cursor;
            t: if (s2.i(e, 97, 252)) {
              s2.c = s2.cursor;
              i: {
                if (i2 = s2.cursor, s2.m("u") && (s2.d = s2.cursor, s2.i(e, 97, 252))) {
                  if (!s2.b("U")) return;
                  break i;
                }
                if (s2.cursor = i2, !s2.m("y") || (s2.d = s2.cursor, !s2.i(e, 97, 252))) break t;
                if (!s2.b("Y")) return;
              }
              s2.cursor = t2;
              break;
            }
            if (s2.cursor = t2, s2.cursor >= s2.a) break r;
            s2.cursor++;
          }
          continue;
        }
        s2.cursor = r3;
        break;
      }
    }(), s2.cursor = r2, r2 = s2.cursor, !function() {
      f = b = s2.a;
      var r3 = s2.cursor, t2 = s2.cursor + 3;
      if (!(t2 > s2.a)) {
        for (s2.cursor = t2, a = s2.cursor, s2.cursor = r3; !s2.i(e, 97, 252); ) {
          if (s2.cursor >= s2.a) return;
          s2.cursor++;
        }
        for (; !s2.k(e, 97, 252); ) {
          if (s2.cursor >= s2.a) return;
          s2.cursor++;
        }
        for ((b = s2.cursor) < a && (b = a); !s2.i(e, 97, 252); ) {
          if (s2.cursor >= s2.a) return;
          s2.cursor++;
        }
        for (; !s2.k(e, 97, 252); ) {
          if (s2.cursor >= s2.a) return;
          s2.cursor++;
        }
        f = s2.cursor;
      }
    }(), s2.cursor = r2, s2.f = s2.cursor, s2.cursor = s2.a, !function() {
      var r3, t2 = s2.a - s2.cursor;
      r: if (s2.d = s2.cursor, 0 != (r3 = s2.h(i)) && (s2.c = s2.cursor, b <= s2.cursor)) switch (r3) {
        case 1:
          if (!s2.e()) return;
          break;
        case 2:
          if (!s2.e()) return;
          if (r3 = s2.a - s2.cursor, s2.d = s2.cursor, s2.g("s")) if (s2.c = s2.cursor, s2.g("nis")) {
            if (!s2.e()) return;
          } else s2.cursor = s2.a - r3;
          else s2.cursor = s2.a - r3;
          break;
        case 3:
          if (!s2.n(h, 98, 116)) break r;
          if (!s2.e()) return;
      }
      s2.cursor = s2.a - t2, t2 = s2.a - s2.cursor;
      r: if (s2.d = s2.cursor, 0 != (r3 = s2.h(c2)) && (s2.c = s2.cursor, b <= s2.cursor)) switch (r3) {
        case 1:
          if (!s2.e()) return;
          break;
        case 2:
          if (!s2.n(n, 98, 116) || (r3 = s2.cursor - 3) < s2.f) break r;
          if (s2.cursor = r3, !s2.e()) return;
      }
      s2.cursor = s2.a - t2, t2 = s2.a - s2.cursor;
      r: if (s2.d = s2.cursor, 0 != (r3 = s2.h(o)) && (s2.c = s2.cursor, f <= s2.cursor)) switch (r3) {
        case 1:
          if (!s2.e()) return;
          r3 = s2.a - s2.cursor;
          s: if (s2.d = s2.cursor, s2.g("ig")) {
            s2.c = s2.cursor;
            var e2 = s2.a - s2.cursor;
            if (s2.g("e")) {
              s2.cursor = s2.a - r3;
              break s;
            }
            if (s2.cursor = s2.a - e2, f <= s2.cursor) {
              if (!s2.e()) return;
            } else s2.cursor = s2.a - r3;
          } else s2.cursor = s2.a - r3;
          break;
        case 2:
          if (r3 = s2.a - s2.cursor, s2.g("e")) break r;
          if (s2.cursor = s2.a - r3, !s2.e()) return;
          break;
        case 3:
          if (!s2.e()) return;
          r3 = s2.a - s2.cursor;
          s: {
            if ((s2.d = s2.cursor, e2 = s2.a - s2.cursor, !s2.g("er")) && (s2.cursor = s2.a - e2, !s2.g("en"))) {
              s2.cursor = s2.a - r3;
              break s;
            }
            if (s2.c = s2.cursor, b <= s2.cursor) {
              if (!s2.e()) return;
            } else s2.cursor = s2.a - r3;
          }
          break;
        case 4:
          if (!s2.e()) return;
          if (r3 = s2.a - s2.cursor, s2.d = s2.cursor, 0 == s2.h(u)) s2.cursor = s2.a - r3;
          else if (s2.c = s2.cursor, f <= s2.cursor) {
            if (!s2.e()) return;
          } else s2.cursor = s2.a - r3;
      }
      s2.cursor = s2.a - t2;
    }(), s2.cursor = s2.f, r2 = s2.cursor, !function() {
      for (var r3; ; ) {
        var i2 = s2.cursor;
        r: if (s2.c = s2.cursor, 0 != (r3 = s2.o(t))) {
          switch (s2.d = s2.cursor, r3) {
            case 1:
              if (!s2.b("y")) return;
              break;
            case 2:
              if (!s2.b("u")) return;
              break;
            case 3:
              if (!s2.b("a")) return;
              break;
            case 4:
              if (!s2.b("o")) return;
              break;
            case 5:
              if (s2.cursor >= s2.a) break r;
              s2.cursor++;
          }
          continue;
        }
        s2.cursor = i2;
        break;
      }
    }(), s2.cursor = r2, true;
  }, this.stemWord = function(r2) {
    return s2.p(r2), this.l(), s2.j;
  };
}();
function stemmer2(r2) {
  return s.stemWord(r2);
}
var language = "german";

// src/german.js
var COLLOQUIAL_GROUPS = [
  ["benzin", "sprit", "treibstoff", "kraftstoff", "gasoline", "fuel"],
  ["auspuff", "abgasanlage", "schalldaempfer", "exhaust"],
  ["blinker", "fahrtrichtungsanzeiger", "richtungsanzeiger"],
  ["scheibenwischer", "wischer", "scheibenwischanlage"],
  ["kupplung", "clutch"],
  ["getriebe", "schaltgetriebe", "gearbox", "transmission"],
  ["stossdaempfer", "daempfer", "federbein", "shock"],
  ["zuendkerze", "kerze", "spark plug"],
  ["batterie", "akku", "battery"],
  ["kuehler", "kuehlung", "radiator", "cooling"],
  ["lichtmaschine", "generator", "alternator"],
  ["anlasser", "starter"],
  ["reifen", "raeder", "rad", "tire", "wheel"],
  ["bremse", "bremsen", "brake"],
  ["scheinwerfer", "licht", "beleuchtung", "lampe", "headlight", "light"],
  ["tuere", "tuer", "tueren", "door"],
  ["sitz", "sitze", "seat"],
  ["tank", "kraftstofftank", "kraftstoffbehaelter", "fuel tank"],
  // NEW (found via Stage 2 benchmarking, see PLAN.md): the manual exclusively
  // uses "Antriebsriemen" for what everyday German calls "Keilriemen" - it
  // never once uses the word "Keilriemen" itself, confirmed by grepping the
  // relevant pages. Without this link, no amount of typo tolerance or
  // decompounding bridges the gap (they're simply different words).
  // NOTE: deliberately no English/hyphenated entries here (e.g. "v-belt") -
  // Orama's own tokenizer splits on hyphens (SPLITTERS.german in
  // @orama/orama treats "-" as a separator, unlike our tokenize() which
  // preserves it for note codes), so a hyphenated synonym silently becomes
  // two separate single-token search terms at query time. This exact bug
  // was caught during Stage 2 benchmarking: "v-belt" became bare "v",
  // matching hundreds of unrelated pages via single-letter measurement
  // labels like `„V" Einlassventil: 36,6mm`.
  ["keilriemen", "antriebsriemen", "riemen"]
];
var STOPWORDS = /* @__PURE__ */ new Set([
  "und",
  "oder",
  "der",
  "die",
  "das",
  "den",
  "dem",
  "des",
  "ein",
  "eine",
  "einer",
  "eines",
  "einem",
  "einen",
  "im",
  "in",
  "am",
  "an",
  "auf",
  "aus",
  "bei",
  "mit",
  "von",
  "vor",
  "zur",
  "zum",
  "fuer",
  "bzw",
  "beziehungsweise",
  "the",
  "and",
  "for",
  "to",
  "of",
  "on",
  "at",
  "with",
  "or",
  "a",
  "an",
  // German prepositions - CRITICAL (see orama-schema.ts's own note on the
  // RAG side): without these, a bare preposition like "hinter" (behind)
  // prefix/substring-matches every "Hinterachse..." (rear axle) page and
  // badly pollutes scoring for perfectly ordinary sentences. Confirmed via
  // benchmarking to also cause nonsense synthesized-join candidates (see
  // synthesizeJoinedCompounds) when left unfiltered.
  "hinter",
  "ueber",
  "unter",
  "zwischen",
  "neben",
  "durch",
  "gegen",
  "ohne",
  "bis",
  "seit",
  "waehrend",
  "wegen",
  "trotz",
  "innerhalb",
  "ausserhalb",
  "oberhalb",
  "unterhalb",
  "sowie",
  "sowohl",
  "weder",
  "noch",
  // interrogatives
  "wie",
  "was",
  "wer",
  "wo",
  "wann",
  "warum",
  "wieso",
  "weshalb",
  "welche",
  "welcher",
  "welches",
  "welchen",
  "welchem",
  // personal pronouns / possessives
  "ich",
  "du",
  "er",
  "sie",
  "es",
  "wir",
  "ihr",
  "mein",
  "meine",
  "meinen",
  "meinem",
  "meiner",
  "meines",
  "dein",
  "deine",
  "deinen",
  "sein",
  "seine",
  "seinen",
  // modal / auxiliary verbs and other high-frequency filler words
  "kann",
  "kannst",
  "koennen",
  "muss",
  "musst",
  "muessen",
  "soll",
  "sollst",
  "sollen",
  "will",
  "willst",
  "wollen",
  "geht",
  "gehts",
  "macht",
  "mache",
  "machst",
  "nicht",
  "kein",
  "keine",
  "auch",
  "noch",
  "schon",
  "sehr",
  "viel",
  "viele",
  "komisch",
  "einfach",
  "immer",
  "gerade",
  "diese",
  "dieser",
  "dieses",
  "diesen",
  "diesem",
  "hier",
  "dort",
  "dann",
  "beim",
  "denn",
  "doch",
  "mal"
]);
var SPLIT_PREFIX_DENY = /* @__PURE__ */ new Set([
  "aus",
  "ein",
  "um",
  "an",
  "ab",
  "auf",
  "vor",
  "nach",
  "zu",
  "bei",
  "mit",
  "durch",
  "ueber",
  "unter",
  "be",
  "ver",
  "ent",
  "er",
  "ge",
  "zer",
  "wieder"
]);
var FUGEN = ["ens", "ns", "es", "en", "s", "n", ""];
var MIN_PART_LEN = 4;
var MIN_TOKEN_TO_SPLIT = 8;
var MAX_PARTS = 3;
function fold(s2) {
  return (s2 || "").toLowerCase().replace(/ü/g, "ue").replace(/ö/g, "oe").replace(/ä/g, "ae").replace(/ß/g, "ss").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function tokenize2(text) {
  if (!text) return [];
  const folded = fold(text);
  const out = [];
  const re = /[a-z0-9]+(?:-[a-z0-9]+)*/g;
  let m;
  while ((m = re.exec(folded)) !== null) {
    out.push(m[0]);
  }
  return out;
}
function stripForContent(raw) {
  let text = raw;
  if (text.startsWith("---")) {
    const end = text.indexOf("\n---", 3);
    if (end !== -1) {
      const after = text.indexOf("\n", end + 1);
      text = after !== -1 ? text.slice(after + 1) : "";
    }
  }
  text = text.replace(/!\[\[[^\]]*\]\]/g, " ").replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2").replace(/[#>*_`|]/g, " ");
  return text;
}
function dictBase(w, dict) {
  if (dict.has(w)) return w;
  for (const suf of ["en", "e", "n", "s"]) {
    if (w.length - suf.length >= MIN_PART_LEN && w.endsWith(suf)) {
      const stem = w.slice(0, w.length - suf.length);
      if (dict.has(stem)) return stem;
    }
  }
  return null;
}
function decompound(token, dict, depth = MAX_PARTS - 1) {
  if (token.length < MIN_TOKEN_TO_SPLIT) return null;
  if (depth <= 0) return null;
  let best = null;
  for (let i = MIN_PART_LEN; i <= token.length - MIN_PART_LEN; i++) {
    const left = token.slice(0, i);
    if (left.length < MIN_PART_LEN) continue;
    if (!dict.has(left)) continue;
    if (SPLIT_PREFIX_DENY.has(left)) continue;
    for (const fug of FUGEN) {
      const rest = token.slice(i + fug.length);
      if (rest.length < MIN_PART_LEN) continue;
      if (token.slice(i, i + fug.length) !== fug) continue;
      let parts = null;
      const restBase = dictBase(rest, dict);
      if (restBase) {
        parts = [left, restBase];
      } else if (depth > 1) {
        const sub = decompound(rest, dict, depth - 1);
        if (sub) parts = [left, ...sub];
      }
      if (!parts) continue;
      if (parts.length > MAX_PARTS) continue;
      const minLen = Math.min(...parts.map((p) => p.length));
      if (!best || parts.length < best.parts.length || parts.length === best.parts.length && minLen > best.minLen) {
        best = { parts, minLen };
      }
    }
  }
  return best ? best.parts : null;
}
function synthesizeSeparableVerbs(queryTokens, vocabulary) {
  const prefixes = queryTokens.filter((t) => SPLIT_PREFIX_DENY.has(t));
  if (prefixes.length === 0) return [];
  const verbish = queryTokens.filter((t) => t.length >= 3 && !SPLIT_PREFIX_DENY.has(t) && !STOPWORDS.has(t));
  const candidates = /* @__PURE__ */ new Set();
  for (const prefix of prefixes) {
    for (const word of verbish) {
      for (const stem of verbStemCandidates(word)) {
        const candidate = prefix + stem + "en";
        if (vocabulary.has(candidate)) candidates.add(candidate);
      }
    }
  }
  return [...candidates];
}
function verbStemCandidates(word) {
  const stems = /* @__PURE__ */ new Set([word]);
  for (const suf of ["est", "st", "et", "en", "e", "t"]) {
    if (word.length - suf.length >= 3 && word.endsWith(suf)) {
      stems.add(word.slice(0, word.length - suf.length));
    }
  }
  return stems;
}
function synthesizeJoinedCompounds(contentWordsInOrder, vocabulary) {
  const candidates = /* @__PURE__ */ new Set();
  for (let i = 0; i < contentWordsInOrder.length - 1; i++) {
    const a = contentWordsInOrder[i];
    const b = contentWordsInOrder[i + 1];
    if (a.length < MIN_PART_LEN || b.length < MIN_PART_LEN) continue;
    for (const fug of FUGEN) {
      const candidate = a + fug + b;
      if (vocabulary.has(candidate)) candidates.add(candidate);
    }
  }
  return [...candidates];
}
function buildSynonymMap(glossaryTerms, openThesaurusPairs) {
  const synonyms = /* @__PURE__ */ new Map();
  const add = (a, b) => {
    const fa = fold(a);
    const fb = fold(b);
    if (!fa || !fb || fa === fb) return;
    if (fa.length < 3 || fb.length < 3) return;
    if (STOPWORDS.has(fa) || STOPWORDS.has(fb)) return;
    if (!synonyms.has(fa)) synonyms.set(fa, /* @__PURE__ */ new Set());
    synonyms.get(fa).add(fb);
  };
  const singleTokenOf = (phrase) => {
    const toks = tokenize2(phrase).filter((t) => !STOPWORDS.has(t) && t.length >= 3);
    return toks.length === 1 ? toks[0] : null;
  };
  const linkColloquial = (a, b) => {
    const ta = singleTokenOf(a);
    const tb = singleTokenOf(b);
    if (ta && tb) {
      add(ta, tb);
      add(tb, ta);
    }
  };
  const linkGlossary = (a, b) => {
    const ta = tokenize2(a);
    const tb = tokenize2(b);
    if (ta.length === 1 && tb.length === 1) {
      add(ta[0], tb[0]);
      add(tb[0], ta[0]);
    }
  };
  for (const group of COLLOQUIAL_GROUPS) {
    for (let i = 0; i < group.length; i++) {
      for (let j = 0; j < group.length; j++) {
        if (i !== j) linkColloquial(group[i], group[j]);
      }
    }
  }
  for (const t of glossaryTerms || []) {
    const de = t.de || "";
    const en = t.en || "";
    const variants = Array.isArray(t.variants) ? t.variants : [];
    if (de && en) linkGlossary(de, en);
    for (const v2 of variants) {
      if (de) linkGlossary(de, v2);
      if (en) linkGlossary(en, v2);
    }
  }
  for (const [a, b] of openThesaurusPairs || []) {
    add(a, b);
    add(b, a);
  }
  return synonyms;
}
function expandSynonyms(synonymMap, tok) {
  const set = synonymMap.get(tok);
  return set ? [...set] : [];
}
function buildDictionary(titleAndTagTokenLists, synonymMap) {
  const dict = /* @__PURE__ */ new Set();
  const addDict = (tok) => {
    if (tok.length < MIN_PART_LEN) return;
    if (STOPWORDS.has(tok)) return;
    dict.add(tok);
  };
  for (const tokens of titleAndTagTokenLists) {
    for (const t of tokens) addDict(t);
  }
  for (const [w] of synonymMap) addDict(w);
  return dict;
}
function expandQuery(rawQuery, synonymMap, dict, vocabulary, compoundParts) {
  const allTokens = tokenize2(rawQuery);
  const content = allTokens.filter((t) => !STOPWORDS.has(t));
  const expanded = new Set(content);
  const vocab = vocabulary || /* @__PURE__ */ new Set();
  const precomputed = compoundParts || {};
  for (const tok of content) {
    const synonyms = expandSynonyms(synonymMap, tok);
    for (const syn of synonyms) expanded.add(syn);
    if (synonyms.length === 0) {
      const parts = precomputed[tok] || decompound(tok, dict);
      if (parts) for (const p of parts) expanded.add(p);
    }
  }
  for (const v2 of synthesizeSeparableVerbs(allTokens, vocab)) expanded.add(v2);
  for (const v2 of synthesizeJoinedCompounds(content, vocab)) expanded.add(v2);
  return [...expanded];
}

// src/schema.js
var FIELD_BOOST = {
  code: 15,
  titel: 10,
  titleEn: 6,
  tags: 4,
  notePath: 3,
  section: 2,
  content: 1
};
var SCHEMA = {
  rowId: "string",
  notePath: "string",
  code: "string",
  titel: "string",
  titleEn: "string",
  section: "string",
  tags: "string[]",
  content: "string"
};
var GERMAN_SPLIT_RULE = /[^a-z0-9A-ZäöüÄÖÜß-]+/gim;
function normalizeGermanToken(prop, token) {
  const key = `${language}:${prop}:${token}`;
  if (this.normalizationCache.has(key)) return this.normalizationCache.get(key);
  if (this.stopWords.includes(token)) {
    this.normalizationCache.set(key, "");
    return "";
  }
  const stemmed = stemmer2(token);
  this.normalizationCache.set(key, stemmed);
  return stemmed;
}
function tokenizeGerman(input) {
  if (typeof input !== "string") return [input];
  const rawTokens = input.toLowerCase().split(GERMAN_SPLIT_RULE).map((t) => t.replace(/^-+|-+$/g, "")).filter(Boolean).map((t) => normalizeGermanToken.call(this, "", t)).filter(Boolean);
  return Array.from(new Set(rawTokens));
}
function createGermanTokenizer() {
  const tokenizer = {
    language,
    stopWords: [...STOPWORDS],
    normalizationCache: /* @__PURE__ */ new Map()
  };
  tokenizer.tokenize = tokenizeGerman.bind(tokenizer);
  return tokenizer;
}
async function createIndex2() {
  return create5({ schema: SCHEMA, components: { tokenizer: createGermanTokenizer() } });
}
async function insertDocs(db, docs) {
  await insertMultiple(db, docs);
}

// src/search.js
function maxJustifiedTolerance(contentWords) {
  const longest = contentWords.reduce((m, w) => Math.max(m, w.length), 0);
  if (longest <= 3) return 0;
  if (longest <= 6) return 1;
  return 2;
}
async function runOnce(db, term, tolerance) {
  return search2(db, {
    term,
    tolerance,
    boost: FIELD_BOOST,
    properties: ["code", "titel", "titleEn", "tags", "notePath", "section", "content"],
    limit: 50
  });
}
async function escalatingSearch(db, term, cap) {
  let result = await runOnce(db, term, 0);
  let toleranceUsed = 0;
  for (let t = 1; t <= cap && result.hits.length < 5; t++) {
    const widened = await runOnce(db, term, t);
    if (widened.hits.length > result.hits.length) {
      result = widened;
      toleranceUsed = t;
    }
  }
  return { result, toleranceUsed };
}
function snippetFor(content, expandedTerms) {
  if (!content) return "";
  const folded = fold(content);
  let pos = -1;
  for (const term of expandedTerms) {
    if (term.length < 3) continue;
    const p = folded.indexOf(term);
    if (p !== -1 && (pos === -1 || p < pos)) pos = p;
  }
  if (pos === -1) return "";
  const start = Math.max(0, pos - 40);
  const end = Math.min(content.length, pos + 80);
  let snip = content.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) snip = "\u2026 " + snip;
  if (end < content.length) snip = snip + " \u2026";
  return snip;
}
function correctionHint(rawQuery, toleranceUsed, vocabulary) {
  if (toleranceUsed === 0) return null;
  const tokens = tokenize2(rawQuery);
  for (const tok of tokens) {
    if (tok.length >= 4 && !vocabulary.has(tok)) {
      return { from: tok, to: `${tok} (tippfehlertolerant gesucht)` };
    }
  }
  return null;
}
async function runSearch(db, rawQuery, limit, vocabulary, contentByRowId, synonymMap, dict, compoundParts) {
  const query = (rawQuery || "").trim();
  if (!query) return { results: [], correction: null, expandedTerms: [] };
  const contentWords = tokenize2(query).filter((t) => t.length >= 3);
  const expanded = expandQuery(query, synonymMap, dict, vocabulary, compoundParts);
  const term = expanded.join(" ");
  const cap = maxJustifiedTolerance(contentWords);
  const { result, toleranceUsed } = await escalatingSearch(db, term, cap);
  const results = result.hits.slice(0, limit).map((hit, i) => {
    const doc = hit.document;
    return {
      notePath: doc.notePath,
      seitencode: doc.code,
      sektion: doc.section,
      titel: doc.titel,
      rank: i,
      score: hit.score,
      snippet: snippetFor(contentByRowId.get(doc.rowId) || "", expanded)
    };
  });
  return {
    results,
    correction: correctionHint(query, toleranceUsed, vocabulary),
    expandedTerms: expanded
  };
}

// src/highlight.js
var FOLD_EXPAND = { \u00FC: "ue", \u00F6: "oe", \u00E4: "ae", \u00DF: "ss" };
function foldWithMap(s2) {
  s2 = s2 || "";
  let folded = "";
  const map = [];
  for (let i = 0; i < s2.length; i++) {
    const ch = s2[i];
    const lower = ch.toLowerCase();
    const expanded = FOLD_EXPAND[lower] !== void 0 ? FOLD_EXPAND[lower] : lower;
    const norm = expanded.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (let k = 0; k < norm.length; k++) {
      folded += norm[k];
      map.push(i);
    }
  }
  return { folded, map };
}
function findTermRanges(text, terms) {
  if (!text || !terms || terms.length === 0) return [];
  const { folded, map } = foldWithMap(text);
  if (!folded) return [];
  const ranges = [];
  for (const term of terms) {
    if (!term || term.length < 2) continue;
    let from = 0;
    let pos;
    while ((pos = folded.indexOf(term, from)) !== -1) {
      const startOrig = map[pos];
      const lastFolded = pos + term.length - 1;
      const endOrig = map[lastFolded] + 1;
      ranges.push([startOrig, endOrig]);
      from = pos + term.length;
    }
  }
  if (ranges.length === 0) return [];
  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const prev = merged[merged.length - 1];
    const cur = ranges[i];
    if (cur[0] <= prev[1]) {
      if (cur[1] > prev[1]) prev[1] = cur[1];
    } else {
      merged.push(cur);
    }
  }
  return merged;
}

// data/synonyms.json
var synonyms_default = [["kurs", "seminar"], ["schulung", "seminar"], ["seminar", "weiterbildung"], ["seminar", "training"], ["lehrgang", "seminar"], ["kursus", "seminar"], ["seminar", "workshop"], ["kurs", "schulung"], ["kurs", "weiterbildung"], ["kurs", "training"], ["kurs", "lehrgang"], ["kurs", "kursus"], ["kurs", "workshop"], ["schulung", "weiterbildung"], ["schulung", "training"], ["lehrgang", "schulung"], ["kursus", "schulung"], ["schulung", "workshop"], ["training", "weiterbildung"], ["lehrgang", "weiterbildung"], ["kursus", "weiterbildung"], ["weiterbildung", "workshop"], ["lehrgang", "training"], ["kursus", "training"], ["training", "workshop"], ["kursus", "lehrgang"], ["lehrgang", "workshop"], ["kursus", "workshop"], ["haben", "muessen"], ["haube", "kamm"], ["fruchttraube", "kamm"], ["fruchttraube", "haube"], ["messen", "messung"], ["messung", "vermessung"], ["messen", "vermessung"], ["lager", "stuetzpunkt"], ["basis", "stuetzpunkt"], ["basis", "lager"], ["schritt", "schritttempo"], ["schritt", "schrittgeschwindigkeit"], ["schrittgeschwindigkeit", "schritttempo"], ["angeschlossen", "ansprechbar"], ["angeschlossen", "online"], ["angeschlossen", "erreichbar"], ["angeschlossen", "zugaenglich"], ["angeschlossen", "zugreifbar"], ["angeschlossen", "verbunden"], ["ansprechbar", "online"], ["ansprechbar", "erreichbar"], ["ansprechbar", "zugaenglich"], ["ansprechbar", "zugreifbar"], ["ansprechbar", "verbunden"], ["erreichbar", "online"], ["online", "zugaenglich"], ["online", "zugreifbar"], ["online", "verbunden"], ["erreichbar", "zugaenglich"], ["erreichbar", "zugreifbar"], ["erreichbar", "verbunden"], ["zugaenglich", "zugreifbar"], ["verbunden", "zugaenglich"], ["verbunden", "zugreifbar"], ["nachsehen", "vergewissern"], ["kontrollieren", "nachsehen"], ["nachschauen", "nachsehen"], ["nachsehen", "sichergehen"], ["kontrollieren", "vergewissern"], ["nachschauen", "vergewissern"], ["sichergehen", "vergewissern"], ["kontrollieren", "nachschauen"], ["kontrollieren", "sichergehen"], ["nachschauen", "sichergehen"], ["alignment", "ausrichten"], ["alignieren", "alignment"], ["alignieren", "ausrichten"], ["wahrhaft", "wirklich"], ["praktisch", "wirklich"], ["realiter", "wirklich"], ["tatsaechlich", "wirklich"], ["wahrlich", "wirklich"], ["faktisch", "wirklich"], ["praktisch", "wahrhaft"], ["realiter", "wahrhaft"], ["tatsaechlich", "wahrhaft"], ["wahrhaft", "wahrlich"], ["faktisch", "wahrhaft"], ["praktisch", "realiter"], ["praktisch", "tatsaechlich"], ["praktisch", "wahrlich"], ["faktisch", "praktisch"], ["realiter", "tatsaechlich"], ["realiter", "wahrlich"], ["faktisch", "realiter"], ["tatsaechlich", "wahrlich"], ["faktisch", "tatsaechlich"], ["faktisch", "wahrlich"], ["innerer", "intern"], ["innerer", "inwendig"], ["innere", "innerer"], ["intern", "inwendig"], ["innere", "intern"], ["innere", "inwendig"], ["ausfuehren", "verwirklichen"], ["ausfuehren", "vornehmen"], ["ausfuehren", "realisieren"], ["ausfuehren", "durchfuehren"], ["ausfuehren", "umsetzen"], ["ausfuehren", "effektuieren"], ["verwirklichen", "vornehmen"], ["realisieren", "verwirklichen"], ["durchfuehren", "verwirklichen"], ["umsetzen", "verwirklichen"], ["effektuieren", "verwirklichen"], ["realisieren", "vornehmen"], ["durchfuehren", "vornehmen"], ["umsetzen", "vornehmen"], ["effektuieren", "vornehmen"], ["durchfuehren", "realisieren"], ["realisieren", "umsetzen"], ["effektuieren", "realisieren"], ["durchfuehren", "umsetzen"], ["durchfuehren", "effektuieren"], ["effektuieren", "umsetzen"], ["einbrechen", "knacken"], ["hacken", "knacken"], ["aufbrechen", "knacken"], ["einbrechen", "hacken"], ["aufbrechen", "einbrechen"], ["aufbrechen", "hacken"], ["definitiv", "letztgueltig"], ["endgueltig", "letztgueltig"], ["fix", "letztgueltig"], ["abschliessend", "letztgueltig"], ["definitiv", "endgueltig"], ["definitiv", "fix"], ["abschliessend", "definitiv"], ["endgueltig", "fix"], ["abschliessend", "endgueltig"], ["abschliessend", "fix"], ["blockierung", "obstruktion"], ["blockierung", "stoerung"], ["blockierung", "verzoegerung"], ["behinderung", "blockierung"], ["blockierung", "widerstand"], ["obstruktion", "stoerung"], ["obstruktion", "verzoegerung"], ["behinderung", "obstruktion"], ["obstruktion", "widerstand"], ["stoerung", "verzoegerung"], ["behinderung", "stoerung"], ["stoerung", "widerstand"], ["behinderung", "verzoegerung"], ["verzoegerung", "widerstand"], ["behinderung", "widerstand"], ["ausdehnung", "expansion"], ["ausdehnung", "ausweitung"], ["ausdehnung", "zuwachs"], ["ausdehnung", "extension"], ["ausweitung", "expansion"], ["expansion", "zuwachs"], ["expansion", "extension"], ["ausweitung", "zuwachs"], ["ausweitung", "extension"], ["extension", "zuwachs"], ["ausdruecken", "auspressen"], ["ausdruecken", "auswringen"], ["ausdruecken", "ausquetschen"], ["ausdruecken", "exprimieren"], ["auspressen", "auswringen"], ["auspressen", "ausquetschen"], ["auspressen", "exprimieren"], ["ausquetschen", "auswringen"], ["auswringen", "exprimieren"], ["ausquetschen", "exprimieren"], ["geringer", "weniger"], ["geringer", "kleiner"], ["geringer", "minder"], ["kleiner", "weniger"], ["minder", "weniger"], ["kleiner", "minder"], ["aktivierung", "beginn"], ["anbruch", "beginn"], ["beginn", "in-kraft-treten"], ["aktivierung", "anbruch"], ["aktivierung", "in-kraft-treten"], ["anbruch", "in-kraft-treten"], ["fassung", "interpretation"], ["interpretation", "version"], ["ausgabe", "interpretation"], ["fassung", "version"], ["ausgabe", "fassung"], ["ausgabe", "version"], ["bilanz", "bilanzaufstellung"], ["bilanzaufstellung", "jahresabschluss"], ["bilanzaufstellung", "ergebnis"], ["bilanzaufstellung", "erfolg"], ["bilanz", "jahresabschluss"], ["bilanz", "ergebnis"], ["bilanz", "erfolg"], ["ergebnis", "jahresabschluss"], ["erfolg", "jahresabschluss"], ["erfolg", "ergebnis"], ["test", "versuch"], ["erprobung", "versuch"], ["probe", "versuch"], ["pruefung", "versuch"], ["erprobung", "test"], ["probe", "test"], ["pruefung", "test"], ["erprobung", "probe"], ["erprobung", "pruefung"], ["probe", "pruefung"], ["band", "musikkapelle"], ["band", "ensemble"], ["band", "kapelle"], ["band", "formation"], ["band", "musikgruppe"], ["band", "combo"], ["band", "gruppe"], ["ensemble", "musikkapelle"], ["kapelle", "musikkapelle"], ["formation", "musikkapelle"], ["musikgruppe", "musikkapelle"], ["combo", "musikkapelle"], ["gruppe", "musikkapelle"], ["ensemble", "kapelle"], ["ensemble", "formation"], ["ensemble", "musikgruppe"], ["combo", "ensemble"], ["ensemble", "gruppe"], ["formation", "kapelle"], ["kapelle", "musikgruppe"], ["combo", "kapelle"], ["gruppe", "kapelle"], ["formation", "musikgruppe"], ["combo", "formation"], ["formation", "gruppe"], ["combo", "musikgruppe"], ["gruppe", "musikgruppe"], ["combo", "gruppe"], ["gewissheit", "zuverlaessigkeit"], ["gewissheit", "klarheit"], ["gewissheit", "sicherheit"], ["gewissheit", "unzweifelhaftigkeit"], ["klarheit", "zuverlaessigkeit"], ["sicherheit", "zuverlaessigkeit"], ["unzweifelhaftigkeit", "zuverlaessigkeit"], ["klarheit", "sicherheit"], ["klarheit", "unzweifelhaftigkeit"], ["sicherheit", "unzweifelhaftigkeit"], ["markenname", "schutzmarke"], ["schutzmarke", "warenzeichen"], ["marke", "schutzmarke"], ["brand", "schutzmarke"], ["markenname", "warenzeichen"], ["marke", "markenname"], ["brand", "markenname"], ["marke", "warenzeichen"], ["brand", "warenzeichen"], ["brand", "marke"], ["bleiben", "verbleiben"], ["bleiben", "verweilen"], ["bleiben", "herumstehen"], ["bleiben", "weilen"], ["verbleiben", "verweilen"], ["herumstehen", "verbleiben"], ["verbleiben", "weilen"], ["herumstehen", "verweilen"], ["verweilen", "weilen"], ["herumstehen", "weilen"], ["anbindung", "bindung"], ["bindung", "verbindung"], ["bindung", "bruecke"], ["bindung", "buendnis"], ["anbindung", "verbindung"], ["anbindung", "bruecke"], ["anbindung", "buendnis"], ["bruecke", "verbindung"], ["buendnis", "verbindung"], ["bruecke", "buendnis"], ["gruendlich", "haarklein"], ["differenziert", "gruendlich"], ["erschoepfend", "gruendlich"], ["ausfuehrlich", "gruendlich"], ["detailliert", "gruendlich"], ["eingehend", "gruendlich"], ["detailgenau", "gruendlich"], ["differenziert", "haarklein"], ["erschoepfend", "haarklein"], ["ausfuehrlich", "haarklein"], ["detailliert", "haarklein"], ["eingehend", "haarklein"], ["detailgenau", "haarklein"], ["differenziert", "erschoepfend"], ["ausfuehrlich", "differenziert"], ["detailliert", "differenziert"], ["differenziert", "eingehend"], ["detailgenau", "differenziert"], ["ausfuehrlich", "erschoepfend"], ["detailliert", "erschoepfend"], ["eingehend", "erschoepfend"], ["detailgenau", "erschoepfend"], ["ausfuehrlich", "detailliert"], ["ausfuehrlich", "eingehend"], ["ausfuehrlich", "detailgenau"], ["detailliert", "eingehend"], ["detailgenau", "detailliert"], ["detailgenau", "eingehend"], ["aufnehmen", "einleiten"], ["antreten", "aufnehmen"], ["anpacken", "aufnehmen"], ["aufnehmen", "einsteigen"], ["antreten", "einleiten"], ["anpacken", "einleiten"], ["einleiten", "einsteigen"], ["anpacken", "antreten"], ["antreten", "einsteigen"], ["anpacken", "einsteigen"], ["nackt", "unverhuellt"], ["bloss", "nackt"], ["kahl", "nackt"], ["blank", "nackt"], ["nackt", "offen"], ["bloss", "unverhuellt"], ["kahl", "unverhuellt"], ["blank", "unverhuellt"], ["offen", "unverhuellt"], ["bloss", "kahl"], ["blank", "bloss"], ["bloss", "offen"], ["blank", "kahl"], ["kahl", "offen"], ["blank", "offen"], ["befuerworten", "engagieren"], ["engagieren", "unterstuetzen"], ["einsetzen", "engagieren"], ["anpreisen", "engagieren"], ["empfehlen", "engagieren"], ["eintreten", "engagieren"], ["engagieren", "sekundieren"], ["befuerworten", "unterstuetzen"], ["befuerworten", "einsetzen"], ["anpreisen", "befuerworten"], ["befuerworten", "empfehlen"], ["befuerworten", "eintreten"], ["befuerworten", "sekundieren"], ["einsetzen", "unterstuetzen"], ["anpreisen", "unterstuetzen"], ["empfehlen", "unterstuetzen"], ["eintreten", "unterstuetzen"], ["sekundieren", "unterstuetzen"], ["anpreisen", "einsetzen"], ["einsetzen", "empfehlen"], ["einsetzen", "eintreten"], ["einsetzen", "sekundieren"], ["anpreisen", "empfehlen"], ["anpreisen", "eintreten"], ["anpreisen", "sekundieren"], ["eintreten", "empfehlen"], ["empfehlen", "sekundieren"], ["eintreten", "sekundieren"], ["anmerken", "notieren"], ["anmerken", "protokollieren"], ["anmerken", "niederschreiben"], ["anmerken", "vermerken"], ["notieren", "protokollieren"], ["niederschreiben", "notieren"], ["notieren", "vermerken"], ["niederschreiben", "protokollieren"], ["protokollieren", "vermerken"], ["niederschreiben", "vermerken"], ["halter", "konsole"], ["grund", "ursache"], ["anlass", "grund"], ["grund", "schuld"], ["anlass", "ursache"], ["schuld", "ursache"], ["anlass", "schuld"], ["adjazieren", "angrenzen"], ["angrenzen", "anstossen"], ["angrenzen", "grenzen"], ["angrenzen", "anliegen"], ["adjazieren", "anstossen"], ["adjazieren", "grenzen"], ["adjazieren", "anliegen"], ["anstossen", "grenzen"], ["anliegen", "anstossen"], ["anliegen", "grenzen"], ["profil", "silhouette"], ["kontur", "silhouette"], ["silhouette", "umrisslinie"], ["silhouette", "umriss"], ["kontur", "profil"], ["profil", "umrisslinie"], ["profil", "umriss"], ["kontur", "umrisslinie"], ["kontur", "umriss"], ["umriss", "umrisslinie"], ["anhaengen", "festheften"], ["festhaengen", "festheften"], ["festheften", "stecken"], ["anfuegen", "festheften"], ["befestigen", "festheften"], ["anhaengen", "festhaengen"], ["anhaengen", "stecken"], ["anfuegen", "anhaengen"], ["anhaengen", "befestigen"], ["festhaengen", "stecken"], ["anfuegen", "festhaengen"], ["befestigen", "festhaengen"], ["anfuegen", "stecken"], ["befestigen", "stecken"], ["anfuegen", "befestigen"], ["deutschmark", "mark"], ["dem", "mark"], ["d-mark", "mark"], ["dem", "deutschmark"], ["d-mark", "deutschmark"], ["d-mark", "dem"], ["betriebsart", "betriebsmodus"], ["betriebsmodus", "verfahren"], ["betriebsmodus", "modus"], ["art", "betriebsmodus"], ["betriebsart", "verfahren"], ["betriebsart", "modus"], ["art", "betriebsart"], ["modus", "verfahren"], ["art", "verfahren"], ["art", "modus"], ["einziehen", "konfiszieren"], ["konfiszieren", "sicherstellen"], ["konfiszieren", "sequestrieren"], ["konfiszieren", "sichern"], ["konfiszieren", "requirieren"], ["beschlagnahmen", "konfiszieren"], ["einziehen", "sicherstellen"], ["einziehen", "sequestrieren"], ["einziehen", "sichern"], ["einziehen", "requirieren"], ["beschlagnahmen", "einziehen"], ["sequestrieren", "sicherstellen"], ["sichern", "sicherstellen"], ["requirieren", "sicherstellen"], ["beschlagnahmen", "sicherstellen"], ["sequestrieren", "sichern"], ["requirieren", "sequestrieren"], ["beschlagnahmen", "sequestrieren"], ["requirieren", "sichern"], ["beschlagnahmen", "sichern"], ["beschlagnahmen", "requirieren"], ["riss", "spalte"], ["kluft", "riss"], ["kluft", "spalte"], ["transfer", "uebermittlung"], ["transfer", "uebertragung"], ["uebermittlung", "uebertragung"], ["arbeiten", "funktionieren"], ["einlagern", "legen"], ["einbetten", "einlagern"], ["betten", "einlagern"], ["eingliedern", "einlagern"], ["einbinden", "einlagern"], ["einlagern", "lagern"], ["einbetten", "legen"], ["betten", "legen"], ["eingliedern", "legen"], ["einbinden", "legen"], ["lagern", "legen"], ["betten", "einbetten"], ["einbetten", "eingliedern"], ["einbetten", "einbinden"], ["einbetten", "lagern"], ["betten", "eingliedern"], ["betten", "einbinden"], ["betten", "lagern"], ["einbinden", "eingliedern"], ["eingliedern", "lagern"], ["einbinden", "lagern"], ["dissemination", "streuung"], ["dissemination", "verbreitung"], ["dissemination", "verteilung"], ["ausbreitung", "dissemination"], ["streuung", "verbreitung"], ["streuung", "verteilung"], ["ausbreitung", "streuung"], ["verbreitung", "verteilung"], ["ausbreitung", "verbreitung"], ["ausbreitung", "verteilung"], ["lauf", "laufschiene"], ["laufrad", "laufschiene"], ["lauf", "laufrad"], ["bevoelkerungsschicht", "gesellschaftsschicht"], ["bevoelkerungsschicht", "gesellschaftsklasse"], ["bevoelkerungsschicht", "kaste"], ["bevoelkerungsschicht", "schicht"], ["bevoelkerungsschicht", "stand"], ["bevoelkerungsschicht", "klasse"], ["bevoelkerungsschicht", "gruppe"], ["gesellschaftsklasse", "gesellschaftsschicht"], ["gesellschaftsschicht", "kaste"], ["gesellschaftsschicht", "schicht"], ["gesellschaftsschicht", "stand"], ["gesellschaftsschicht", "klasse"], ["gesellschaftsschicht", "gruppe"], ["gesellschaftsklasse", "kaste"], ["gesellschaftsklasse", "schicht"], ["gesellschaftsklasse", "stand"], ["gesellschaftsklasse", "klasse"], ["gesellschaftsklasse", "gruppe"], ["kaste", "schicht"], ["kaste", "stand"], ["kaste", "klasse"], ["gruppe", "kaste"], ["schicht", "stand"], ["klasse", "schicht"], ["gruppe", "schicht"], ["klasse", "stand"], ["gruppe", "stand"], ["gruppe", "klasse"], ["abschluss", "finitum"], ["apolexis", "finitum"], ["ende", "finitum"], ["ausklang", "finitum"], ["finitum", "schluss"], ["ausgang", "finitum"], ["abschluss", "apolexis"], ["abschluss", "ende"], ["abschluss", "ausklang"], ["abschluss", "schluss"], ["abschluss", "ausgang"], ["apolexis", "ende"], ["apolexis", "ausklang"], ["apolexis", "schluss"], ["apolexis", "ausgang"], ["ausklang", "ende"], ["ende", "schluss"], ["ausgang", "ende"], ["ausklang", "schluss"], ["ausgang", "ausklang"], ["ausgang", "schluss"], ["schaltskizze", "stromlaufplan"], ["schaltbild", "schaltskizze"], ["schaltplan", "schaltskizze"], ["schaltbild", "stromlaufplan"], ["schaltplan", "stromlaufplan"], ["schaltbild", "schaltplan"], ["leistungsschild", "typschild"], ["leistungsschild", "typenschild"], ["typenschild", "typschild"], ["frei", "unausgefuellt"], ["frei", "leer"], ["leer", "unausgefuellt"], ["endgueltig", "irreversibel"], ["endgueltig", "final"], ["endgueltig", "unwiderruflich"], ["endgueltig", "unumkehrbar"], ["endgueltig", "unwiederbringlich"], ["final", "irreversibel"], ["irreversibel", "unwiderruflich"], ["irreversibel", "unumkehrbar"], ["irreversibel", "unwiederbringlich"], ["final", "unwiderruflich"], ["final", "unumkehrbar"], ["final", "unwiederbringlich"], ["unumkehrbar", "unwiderruflich"], ["unwiderruflich", "unwiederbringlich"], ["unumkehrbar", "unwiederbringlich"], ["durchdringung", "penetration"], ["durchdringung", "eindringen"], ["eindringen", "penetration"], ["gefuellt", "voll"], ["ablauf", "hergang"], ["hergang", "prozess"], ["hergang", "vorgang"], ["hergang", "verfolg"], ["hergang", "verlauf"], ["ablauf", "prozess"], ["ablauf", "vorgang"], ["ablauf", "verfolg"], ["ablauf", "verlauf"], ["prozess", "vorgang"], ["prozess", "verfolg"], ["prozess", "verlauf"], ["verfolg", "vorgang"], ["verlauf", "vorgang"], ["verfolg", "verlauf"], ["abgrenzung", "umgrenzung"], ["abgrenzung", "saum"], ["abgrenzung", "einfassung"], ["abgrenzung", "umrandung"], ["abgrenzung", "begrenzung"], ["abgrenzung", "rand"], ["abgrenzung", "rain"], ["saum", "umgrenzung"], ["einfassung", "umgrenzung"], ["umgrenzung", "umrandung"], ["begrenzung", "umgrenzung"], ["rand", "umgrenzung"], ["rain", "umgrenzung"], ["einfassung", "saum"], ["saum", "umrandung"], ["begrenzung", "saum"], ["rand", "saum"], ["rain", "saum"], ["einfassung", "umrandung"], ["begrenzung", "einfassung"], ["einfassung", "rand"], ["einfassung", "rain"], ["begrenzung", "umrandung"], ["rand", "umrandung"], ["rain", "umrandung"], ["begrenzung", "rand"], ["begrenzung", "rain"], ["rain", "rand"], ["geneigt", "offen"], ["geneigt", "gespraechsbereit"], ["geneigt", "interessiert"], ["geneigt", "zugaenglich"], ["empfaenglich", "geneigt"], ["geneigt", "offenohrig"], ["aufgeschlossen", "geneigt"], ["gespraechsbereit", "offen"], ["interessiert", "offen"], ["offen", "zugaenglich"], ["empfaenglich", "offen"], ["offen", "offenohrig"], ["aufgeschlossen", "offen"], ["gespraechsbereit", "interessiert"], ["gespraechsbereit", "zugaenglich"], ["empfaenglich", "gespraechsbereit"], ["gespraechsbereit", "offenohrig"], ["aufgeschlossen", "gespraechsbereit"], ["interessiert", "zugaenglich"], ["empfaenglich", "interessiert"], ["interessiert", "offenohrig"], ["aufgeschlossen", "interessiert"], ["empfaenglich", "zugaenglich"], ["offenohrig", "zugaenglich"], ["aufgeschlossen", "zugaenglich"], ["empfaenglich", "offenohrig"], ["aufgeschlossen", "empfaenglich"], ["aufgeschlossen", "offenohrig"], ["datei", "file"], ["radieren", "zuruecksetzen"], ["entfernen", "radieren"], ["loeschen", "radieren"], ["radieren", "reinigen"], ["eliminieren", "radieren"], ["entfernen", "zuruecksetzen"], ["loeschen", "zuruecksetzen"], ["reinigen", "zuruecksetzen"], ["eliminieren", "zuruecksetzen"], ["entfernen", "loeschen"], ["entfernen", "reinigen"], ["eliminieren", "entfernen"], ["loeschen", "reinigen"], ["eliminieren", "loeschen"], ["eliminieren", "reinigen"], ["auskehrung", "zuweisung"], ["auskehrung", "zuordnung"], ["auskehrung", "verbreitung"], ["auskehrung", "verteilung"], ["zuordnung", "zuweisung"], ["verbreitung", "zuweisung"], ["verteilung", "zuweisung"], ["verbreitung", "zuordnung"], ["verteilung", "zuordnung"], ["kraftstoff", "sprit"], ["sprit", "treibstoff"], ["kraftstoff", "treibstoff"], ["ausgehen", "gutgehen"], ["gutgehen", "hinhauen"], ["gelingen", "gutgehen"], ["gluecken", "gutgehen"], ["funktionieren", "gutgehen"], ["aufgehen", "gutgehen"], ["gutgehen", "klappen"], ["ausgehen", "hinhauen"], ["ausgehen", "gelingen"], ["ausgehen", "gluecken"], ["ausgehen", "funktionieren"], ["aufgehen", "ausgehen"], ["ausgehen", "klappen"], ["gelingen", "hinhauen"], ["gluecken", "hinhauen"], ["funktionieren", "hinhauen"], ["aufgehen", "hinhauen"], ["hinhauen", "klappen"], ["gelingen", "gluecken"], ["funktionieren", "gelingen"], ["aufgehen", "gelingen"], ["gelingen", "klappen"], ["funktionieren", "gluecken"], ["aufgehen", "gluecken"], ["gluecken", "klappen"], ["aufgehen", "funktionieren"], ["funktionieren", "klappen"], ["aufgehen", "klappen"], ["reiflich", "sorgfaeltig"], ["genau", "sorgfaeltig"], ["gruendlich", "sorgfaeltig"], ["genau", "reiflich"], ["gruendlich", "reiflich"], ["genau", "gruendlich"], ["anschmeissen", "hochfahren"], ["hochfahren", "starten"], ["anwerfen", "hochfahren"], ["booten", "hochfahren"], ["hochfahren", "initialisieren"], ["hochfahren", "urladen"], ["anschmeissen", "starten"], ["anschmeissen", "anwerfen"], ["anschmeissen", "booten"], ["anschmeissen", "initialisieren"], ["anschmeissen", "urladen"], ["anwerfen", "starten"], ["booten", "starten"], ["initialisieren", "starten"], ["starten", "urladen"], ["anwerfen", "booten"], ["anwerfen", "initialisieren"], ["anwerfen", "urladen"], ["booten", "initialisieren"], ["booten", "urladen"], ["initialisieren", "urladen"], ["das", "die"], ["die", "per"], ["die", "pro"], ["die", "fuer"], ["das", "per"], ["das", "pro"], ["das", "fuer"], ["per", "pro"], ["fuer", "per"], ["fuer", "pro"], ["muster", "warenmuster"], ["muster", "probe"], ["probe", "warenmuster"], ["codierung", "kodierung"], ["erschweren", "verschaerfen"], ["behindern", "erschweren"], ["beeintraechtigen", "erschweren"], ["behindern", "verschaerfen"], ["beeintraechtigen", "verschaerfen"], ["beeintraechtigen", "behindern"], ["auftragen", "verteilen"], ["auftragen", "verschmieren"], ["verschmieren", "verteilen"], ["schaffen", "werken"], ["schaffen", "wirken"], ["arbeiten", "schaffen"], ["betaetigen", "schaffen"], ["werken", "wirken"], ["arbeiten", "werken"], ["betaetigen", "werken"], ["arbeiten", "wirken"], ["betaetigen", "wirken"], ["arbeiten", "betaetigen"], ["figur", "part"], ["figur", "rolle"], ["figur", "partie"], ["part", "rolle"], ["part", "partie"], ["partie", "rolle"], ["fixieren", "zusammenziehen"], ["festziehen", "fixieren"], ["festigen", "fixieren"], ["festziehen", "zusammenziehen"], ["festigen", "zusammenziehen"], ["festigen", "festziehen"], ["regelung", "regulation"], ["regulation", "regulierung"], ["regulation", "steuerung"], ["regelung", "regulierung"], ["regelung", "steuerung"], ["regulierung", "steuerung"], ["abmessung", "dimension"], ["abmessung", "ausdehnung"], ["abmessung", "magnitude"], ["abmessung", "ausmass"], ["abmessung", "groesse"], ["abmessung", "format"], ["abmessung", "groessenordnung"], ["ausdehnung", "dimension"], ["dimension", "magnitude"], ["ausmass", "dimension"], ["dimension", "groesse"], ["dimension", "format"], ["dimension", "groessenordnung"], ["ausdehnung", "magnitude"], ["ausdehnung", "ausmass"], ["ausdehnung", "groesse"], ["ausdehnung", "format"], ["ausdehnung", "groessenordnung"], ["ausmass", "magnitude"], ["groesse", "magnitude"], ["format", "magnitude"], ["groessenordnung", "magnitude"], ["ausmass", "groesse"], ["ausmass", "format"], ["ausmass", "groessenordnung"], ["format", "groesse"], ["groesse", "groessenordnung"], ["format", "groessenordnung"], ["abspannung", "laeufer"], ["abspannung", "anker"], ["anker", "laeufer"], ["ablaufdiagramm", "flussdiagramm"], ["beachten", "beruecksichtigen"], ["achten", "beachten"], ["beachten", "denken"], ["beachten", "beherzigen"], ["beachten", "bedenken"], ["achten", "beruecksichtigen"], ["beruecksichtigen", "denken"], ["beherzigen", "beruecksichtigen"], ["bedenken", "beruecksichtigen"], ["achten", "denken"], ["achten", "beherzigen"], ["achten", "bedenken"], ["beherzigen", "denken"], ["bedenken", "denken"], ["bedenken", "beherzigen"], ["anlegen", "anwenden"], ["anwenden", "auflegen"], ["anlegen", "auflegen"], ["loesen", "trennung"], ["detachement", "loesen"], ["abloesung", "loesen"], ["abtrennung", "loesen"], ["detachement", "trennung"], ["abloesung", "trennung"], ["abtrennung", "trennung"], ["abloesung", "detachement"], ["abtrennung", "detachement"], ["abloesung", "abtrennung"], ["knistern", "rascheln"], ["krispeln", "rascheln"], ["kruspeln", "rascheln"], ["rascheln", "rauschen"], ["knistern", "krispeln"], ["knistern", "kruspeln"], ["knistern", "rauschen"], ["krispeln", "kruspeln"], ["krispeln", "rauschen"], ["kruspeln", "rauschen"], ["dateiverzeichnis", "verzeichnis"], ["dateiverzeichnis", "ordner"], ["ordner", "verzeichnis"], ["abgekackt", "defekt"], ["abgekackt", "funktionsuntuechtig"], ["abgekackt", "kaputt"], ["abgekackt", "funktionsunfaehig"], ["abgekackt", "fratze"], ["abgekackt", "verreckt"], ["abgekackt", "hin"], ["defekt", "funktionsuntuechtig"], ["defekt", "kaputt"], ["defekt", "funktionsunfaehig"], ["defekt", "fratze"], ["defekt", "verreckt"], ["defekt", "hin"], ["funktionsuntuechtig", "kaputt"], ["funktionsunfaehig", "funktionsuntuechtig"], ["fratze", "funktionsuntuechtig"], ["funktionsuntuechtig", "verreckt"], ["funktionsuntuechtig", "hin"], ["funktionsunfaehig", "kaputt"], ["fratze", "kaputt"], ["kaputt", "verreckt"], ["hin", "kaputt"], ["fratze", "funktionsunfaehig"], ["funktionsunfaehig", "verreckt"], ["funktionsunfaehig", "hin"], ["fratze", "verreckt"], ["fratze", "hin"], ["hin", "verreckt"], ["beengen", "einengen"], ["behindern", "einengen"], ["beschraenken", "einengen"], ["beengen", "behindern"], ["beengen", "beschraenken"], ["behindern", "beschraenken"], ["angrapschen", "anruehren"], ["anfassen", "angrapschen"], ["angrapschen", "anpacken"], ["angrapschen", "anlangen"], ["angrapschen", "beruehren"], ["anfassen", "anruehren"], ["anpacken", "anruehren"], ["anlangen", "anruehren"], ["anruehren", "beruehren"], ["anfassen", "anpacken"], ["anfassen", "anlangen"], ["anfassen", "beruehren"], ["anlangen", "anpacken"], ["anpacken", "beruehren"], ["anlangen", "beruehren"], ["gewebe", "stoff"], ["gewebe", "textilie"], ["gewebe", "tuch"], ["stoff", "textilie"], ["stoff", "tuch"], ["textilie", "tuch"], ["natuerlich", "unveraendert"], ["natuerlich", "unberuehrt"], ["jungfraeulich", "natuerlich"], ["natuerlich", "unverfaelscht"], ["natuerlich", "urspruenglich"], ["unberuehrt", "unveraendert"], ["jungfraeulich", "unveraendert"], ["unveraendert", "unverfaelscht"], ["unveraendert", "urspruenglich"], ["jungfraeulich", "unberuehrt"], ["unberuehrt", "unverfaelscht"], ["unberuehrt", "urspruenglich"], ["jungfraeulich", "unverfaelscht"], ["jungfraeulich", "urspruenglich"], ["unverfaelscht", "urspruenglich"], ["unabdingbarkeit", "voraussetzung"], ["erfordernis", "voraussetzung"], ["anforderung", "voraussetzung"], ["notwendigkeit", "voraussetzung"], ["erfordernis", "unabdingbarkeit"], ["anforderung", "unabdingbarkeit"], ["notwendigkeit", "unabdingbarkeit"], ["anforderung", "erfordernis"], ["erfordernis", "notwendigkeit"], ["anforderung", "notwendigkeit"], ["sicherungsring", "sprengring"], ["hissen", "hochziehen"], ["hochziehen", "setzen"], ["aufziehen", "hochziehen"], ["hissen", "setzen"], ["aufziehen", "hissen"], ["aufziehen", "setzen"], ["ankunft", "auftreten"], ["auftreten", "erscheinen"], ["auftreten", "eintreffen"], ["ankunft", "erscheinen"], ["ankunft", "eintreffen"], ["eintreffen", "erscheinen"], ["emotionslos", "kaltherzig"], ["gefuehllos", "kaltherzig"], ["kalt", "kaltherzig"], ["hart", "kaltherzig"], ["hartherzig", "kaltherzig"], ["emotionslos", "gefuehllos"], ["emotionslos", "kalt"], ["emotionslos", "hart"], ["emotionslos", "hartherzig"], ["gefuehllos", "kalt"], ["gefuehllos", "hart"], ["gefuehllos", "hartherzig"], ["hart", "kalt"], ["hartherzig", "kalt"], ["hart", "hartherzig"], ["katalysieren", "unterstuetzen"], ["katalysieren", "mittragen"], ["abstuetzen", "katalysieren"], ["katalysieren", "stuetzen"], ["katalysieren", "tragen"], ["mittragen", "unterstuetzen"], ["abstuetzen", "unterstuetzen"], ["stuetzen", "unterstuetzen"], ["tragen", "unterstuetzen"], ["abstuetzen", "mittragen"], ["mittragen", "stuetzen"], ["mittragen", "tragen"], ["abstuetzen", "stuetzen"], ["abstuetzen", "tragen"], ["stuetzen", "tragen"], ["falls", "wenn"], ["vorbehaltlich", "wenn"], ["sofern", "wenn"], ["solange", "wenn"], ["sollte", "wenn"], ["soweit", "wenn"], ["falls", "vorbehaltlich"], ["falls", "sofern"], ["falls", "solange"], ["falls", "sollte"], ["falls", "soweit"], ["sofern", "vorbehaltlich"], ["solange", "vorbehaltlich"], ["sollte", "vorbehaltlich"], ["soweit", "vorbehaltlich"], ["sofern", "solange"], ["sofern", "sollte"], ["sofern", "soweit"], ["solange", "sollte"], ["solange", "soweit"], ["sollte", "soweit"], ["absetzen", "niederstellen"], ["absetzen", "abstellen"], ["absetzen", "hinstellen"], ["absetzen", "lassen"], ["abstellen", "niederstellen"], ["hinstellen", "niederstellen"], ["lassen", "niederstellen"], ["abstellen", "hinstellen"], ["abstellen", "lassen"], ["hinstellen", "lassen"], ["bereich", "cluster"], ["bereich", "rubrik"], ["bereich", "kategorie"], ["bereich", "feld"], ["cluster", "rubrik"], ["cluster", "kategorie"], ["cluster", "feld"], ["kategorie", "rubrik"], ["feld", "rubrik"], ["feld", "kategorie"], ["decke", "schale"], ["huelse", "schale"], ["huelle", "schale"], ["schale", "schicht"], ["lage", "schale"], ["decke", "huelse"], ["decke", "huelle"], ["decke", "schicht"], ["decke", "lage"], ["huelle", "huelse"], ["huelse", "schicht"], ["huelse", "lage"], ["huelle", "schicht"], ["huelle", "lage"], ["lage", "schicht"], ["bestand", "verbleib"], ["bestand", "fortbestand"], ["bestand", "bleiben"], ["bestand", "fortdauer"], ["bestand", "verbleiben"], ["fortbestand", "verbleib"], ["bleiben", "verbleib"], ["fortdauer", "verbleib"], ["verbleib", "verbleiben"], ["bleiben", "fortbestand"], ["fortbestand", "fortdauer"], ["fortbestand", "verbleiben"], ["bleiben", "fortdauer"], ["fortdauer", "verbleiben"], ["lang", "weit"], ["modulator", "regulator"], ["modulator", "regler"], ["regler", "regulator"], ["cabrio", "kabriolett"], ["kabrio", "kabriolett"], ["cabriolet", "kabriolett"], ["cabrio", "kabrio"], ["cabrio", "cabriolet"], ["cabriolet", "kabrio"], ["sprayen", "spruehen"], ["sprayen", "spritzen"], ["spritzen", "spruehen"], ["absicherung", "wahrung"], ["sicherung", "wahrung"], ["absicherung", "sicherung"], ["passstift", "zylinderstift"], ["transition", "uebergang"], ["transition", "wandlung"], ["transformation", "transition"], ["transition", "wandel"], ["uebergang", "wandlung"], ["transformation", "uebergang"], ["uebergang", "wandel"], ["transformation", "wandlung"], ["wandel", "wandlung"], ["transformation", "wandel"], ["masse", "umfang"], ["umfang", "weite"], ["groesse", "umfang"], ["ausdehnung", "umfang"], ["abstufung", "umfang"], ["mass", "umfang"], ["ausmass", "umfang"], ["masse", "weite"], ["groesse", "masse"], ["ausdehnung", "masse"], ["abstufung", "masse"], ["mass", "masse"], ["ausmass", "masse"], ["groesse", "weite"], ["ausdehnung", "weite"], ["abstufung", "weite"], ["mass", "weite"], ["ausmass", "weite"], ["abstufung", "groesse"], ["groesse", "mass"], ["abstufung", "ausdehnung"], ["ausdehnung", "mass"], ["abstufung", "mass"], ["abstufung", "ausmass"], ["ausmass", "mass"], ["gegenmutter", "klemmmutter"], ["gegenmutter", "kontermutter"], ["klemmmutter", "kontermutter"], ["ergaenzen", "erweitern"], ["erweitern", "nachruesten"], ["ausbauen", "erweitern"], ["ergaenzen", "nachruesten"], ["ausbauen", "ergaenzen"], ["ausbauen", "nachruesten"], ["abdeckplatte", "deckblech"], ["deckblech", "deckplatte"], ["abdeckplatte", "deckplatte"], ["eigenverantwortlich", "selbstbestimmt"], ["eigenstaendig", "eigenverantwortlich"], ["eigenverantwortlich", "selbstaendig"], ["autonom", "eigenverantwortlich"], ["eigenverantwortlich", "unabhaengig"], ["eigenverantwortlich", "selbstverantwortlich"], ["eigenverantwortlich", "selbststaendig"], ["eigenstaendig", "selbstbestimmt"], ["selbstaendig", "selbstbestimmt"], ["autonom", "selbstbestimmt"], ["selbstbestimmt", "unabhaengig"], ["selbstbestimmt", "selbstverantwortlich"], ["selbstbestimmt", "selbststaendig"], ["eigenstaendig", "selbstaendig"], ["autonom", "eigenstaendig"], ["eigenstaendig", "unabhaengig"], ["eigenstaendig", "selbstverantwortlich"], ["eigenstaendig", "selbststaendig"], ["autonom", "selbstaendig"], ["selbstaendig", "unabhaengig"], ["selbstaendig", "selbstverantwortlich"], ["selbstaendig", "selbststaendig"], ["autonom", "unabhaengig"], ["autonom", "selbstverantwortlich"], ["autonom", "selbststaendig"], ["selbstverantwortlich", "unabhaengig"], ["selbststaendig", "unabhaengig"], ["selbststaendig", "selbstverantwortlich"], ["anschlagen", "aushaengen"], ["fuge", "spalt"], ["fuge", "schlitz"], ["fuge", "spalte"], ["fuge", "ritze"], ["schlitz", "spalt"], ["spalt", "spalte"], ["ritze", "spalt"], ["schlitz", "spalte"], ["ritze", "schlitz"], ["ritze", "spalte"], ["leisten", "schmeissen"], ["ausfuehren", "schmeissen"], ["fahren", "schmeissen"], ["durchfuehren", "schmeissen"], ["ausfuehren", "leisten"], ["fahren", "leisten"], ["durchfuehren", "leisten"], ["ausfuehren", "fahren"], ["durchfuehren", "fahren"], ["abschrauben", "demontieren"], ["abbauen", "demontieren"], ["abbauen", "abschrauben"], ["anstatt", "anstelle"], ["anstatt", "fuer"], ["anstatt", "statt"], ["anstelle", "fuer"], ["anstelle", "statt"], ["fuer", "statt"], ["ergaenzen", "hinzunehmen"], ["addieren", "hinzunehmen"], ["hinzufuegen", "hinzunehmen"], ["hinzunehmen", "hinzurechnen"], ["hinzukommen", "hinzunehmen"], ["beifuegen", "hinzunehmen"], ["addieren", "ergaenzen"], ["ergaenzen", "hinzufuegen"], ["ergaenzen", "hinzurechnen"], ["ergaenzen", "hinzukommen"], ["beifuegen", "ergaenzen"], ["addieren", "hinzufuegen"], ["addieren", "hinzurechnen"], ["addieren", "hinzukommen"], ["addieren", "beifuegen"], ["hinzufuegen", "hinzurechnen"], ["hinzufuegen", "hinzukommen"], ["beifuegen", "hinzufuegen"], ["hinzukommen", "hinzurechnen"], ["beifuegen", "hinzurechnen"], ["beifuegen", "hinzukommen"], ["anreissen", "streifen"], ["anreissen", "ansprechen"], ["anreissen", "erwaehnen"], ["anreissen", "beruehren"], ["andeuten", "anreissen"], ["anreissen", "antoenen"], ["ansprechen", "streifen"], ["erwaehnen", "streifen"], ["beruehren", "streifen"], ["andeuten", "streifen"], ["antoenen", "streifen"], ["ansprechen", "erwaehnen"], ["ansprechen", "beruehren"], ["andeuten", "ansprechen"], ["ansprechen", "antoenen"], ["beruehren", "erwaehnen"], ["andeuten", "erwaehnen"], ["antoenen", "erwaehnen"], ["andeuten", "beruehren"], ["antoenen", "beruehren"], ["andeuten", "antoenen"], ["abwandeln", "modifizieren"], ["abwandeln", "bearbeiten"], ["abwandeln", "aendern"], ["abaendern", "abwandeln"], ["abwandeln", "veraendern"], ["abwandeln", "editieren"], ["bearbeiten", "modifizieren"], ["aendern", "modifizieren"], ["abaendern", "modifizieren"], ["modifizieren", "veraendern"], ["editieren", "modifizieren"], ["aendern", "bearbeiten"], ["abaendern", "bearbeiten"], ["bearbeiten", "veraendern"], ["bearbeiten", "editieren"], ["abaendern", "aendern"], ["aendern", "veraendern"], ["aendern", "editieren"], ["abaendern", "veraendern"], ["abaendern", "editieren"], ["editieren", "veraendern"], ["aufprall", "auftreffen"], ["auftreffen", "einschlag"], ["aufprall", "einschlag"], ["bereich", "rayon"], ["rayon", "zone"], ["rayon", "sektor"], ["gebiet", "rayon"], ["rayon", "region"], ["areal", "rayon"], ["bereich", "zone"], ["bereich", "sektor"], ["bereich", "gebiet"], ["bereich", "region"], ["areal", "bereich"], ["sektor", "zone"], ["gebiet", "zone"], ["region", "zone"], ["areal", "zone"], ["gebiet", "sektor"], ["region", "sektor"], ["areal", "sektor"], ["gebiet", "region"], ["areal", "gebiet"], ["areal", "region"], ["bspw", "meinetwegen"], ["bspw", "wie"], ["bspw", "exemplarisch"], ["bspw", "etwa"], ["beispielsweise", "bspw"], ["meinetwegen", "wie"], ["exemplarisch", "meinetwegen"], ["etwa", "meinetwegen"], ["beispielsweise", "meinetwegen"], ["exemplarisch", "wie"], ["etwa", "wie"], ["beispielsweise", "wie"], ["etwa", "exemplarisch"], ["beispielsweise", "exemplarisch"], ["beispielsweise", "etwa"], ["geraet", "laufwerk"], ["einheit", "geraet"], ["einheit", "laufwerk"], ["spuelen", "waschen"], ["auflistung", "tabelle"], ["tabelle", "verzeichnis"], ["aufstellung", "tabelle"], ["liste", "tabelle"], ["aufzaehlung", "tabelle"], ["katalog", "tabelle"], ["syllabus", "tabelle"], ["auflistung", "verzeichnis"], ["auflistung", "aufstellung"], ["auflistung", "liste"], ["auflistung", "aufzaehlung"], ["auflistung", "katalog"], ["auflistung", "syllabus"], ["aufstellung", "verzeichnis"], ["liste", "verzeichnis"], ["aufzaehlung", "verzeichnis"], ["katalog", "verzeichnis"], ["syllabus", "verzeichnis"], ["aufstellung", "liste"], ["aufstellung", "aufzaehlung"], ["aufstellung", "katalog"], ["aufstellung", "syllabus"], ["aufzaehlung", "liste"], ["katalog", "liste"], ["liste", "syllabus"], ["aufzaehlung", "katalog"], ["aufzaehlung", "syllabus"], ["katalog", "syllabus"], ["ueblicherweise", "zusammenfassend"], ["gewoehnlich", "zusammenfassend"], ["weitgehend", "zusammenfassend"], ["grundsaetzlich", "zusammenfassend"], ["gesamthaft", "zusammenfassend"], ["generell", "zusammenfassend"], ["insgesamt", "zusammenfassend"], ["gewoehnlich", "ueblicherweise"], ["ueblicherweise", "weitgehend"], ["grundsaetzlich", "ueblicherweise"], ["gesamthaft", "ueblicherweise"], ["generell", "ueblicherweise"], ["insgesamt", "ueblicherweise"], ["gewoehnlich", "weitgehend"], ["gewoehnlich", "grundsaetzlich"], ["gesamthaft", "gewoehnlich"], ["generell", "gewoehnlich"], ["gewoehnlich", "insgesamt"], ["grundsaetzlich", "weitgehend"], ["gesamthaft", "weitgehend"], ["generell", "weitgehend"], ["insgesamt", "weitgehend"], ["gesamthaft", "grundsaetzlich"], ["generell", "grundsaetzlich"], ["grundsaetzlich", "insgesamt"], ["generell", "gesamthaft"], ["gesamthaft", "insgesamt"], ["generell", "insgesamt"], ["bolzen", "nase"], ["bolzen", "keil"], ["keil", "nase"], ["biegung", "kurve"], ["biegung", "knick"], ["biegung", "schleife"], ["biegung", "inkurvation"], ["biegung", "kruemmung"], ["knick", "kurve"], ["kurve", "schleife"], ["inkurvation", "kurve"], ["kruemmung", "kurve"], ["knick", "schleife"], ["inkurvation", "knick"], ["knick", "kruemmung"], ["inkurvation", "schleife"], ["kruemmung", "schleife"], ["inkurvation", "kruemmung"], ["indoktrinieren", "persuadieren"], ["erwaermen", "persuadieren"], ["beeinflussen", "persuadieren"], ["bewegen", "persuadieren"], ["persuadieren", "ueberzeugen"], ["einnehmen", "persuadieren"], ["erwaermen", "indoktrinieren"], ["beeinflussen", "indoktrinieren"], ["bewegen", "indoktrinieren"], ["indoktrinieren", "ueberzeugen"], ["einnehmen", "indoktrinieren"], ["beeinflussen", "erwaermen"], ["bewegen", "erwaermen"], ["erwaermen", "ueberzeugen"], ["einnehmen", "erwaermen"], ["beeinflussen", "bewegen"], ["beeinflussen", "ueberzeugen"], ["beeinflussen", "einnehmen"], ["bewegen", "ueberzeugen"], ["bewegen", "einnehmen"], ["einnehmen", "ueberzeugen"], ["abwaschen", "waschen"], ["durchsichtig", "transparent"], ["klar", "transparent"], ["durchscheinend", "transparent"], ["transparent", "ungetruebt"], ["durchsichtig", "klar"], ["durchscheinend", "durchsichtig"], ["durchsichtig", "ungetruebt"], ["durchscheinend", "klar"], ["klar", "ungetruebt"], ["durchscheinend", "ungetruebt"], ["arbeitsgeraet", "instrument"], ["arbeitsgeraet", "utensil"], ["arbeitsgeraet", "betriebsmittel"], ["arbeitsgeraet", "hilfsmittel"], ["instrument", "utensil"], ["betriebsmittel", "instrument"], ["hilfsmittel", "instrument"], ["betriebsmittel", "utensil"], ["hilfsmittel", "utensil"], ["betriebsmittel", "hilfsmittel"], ["ausstatten", "bestuecken"], ["ausstatten", "befuellen"], ["ausstatten", "wappnen"], ["ausstaffieren", "ausstatten"], ["ausstatten", "versehen"], ["ausruesten", "ausstatten"], ["befuellen", "bestuecken"], ["bestuecken", "wappnen"], ["ausstaffieren", "bestuecken"], ["bestuecken", "versehen"], ["ausruesten", "bestuecken"], ["befuellen", "wappnen"], ["ausstaffieren", "befuellen"], ["befuellen", "versehen"], ["ausruesten", "befuellen"], ["ausstaffieren", "wappnen"], ["versehen", "wappnen"], ["ausruesten", "wappnen"], ["ausstaffieren", "versehen"], ["ausruesten", "ausstaffieren"], ["ausruesten", "versehen"], ["schwach", "uebel"], ["bescheiden", "schwach"], ["mau", "schwach"], ["nichtrosig", "schwach"], ["mies", "schwach"], ["schlecht", "schwach"], ["bescheiden", "uebel"], ["mau", "uebel"], ["nichtrosig", "uebel"], ["mies", "uebel"], ["schlecht", "uebel"], ["bescheiden", "mau"], ["bescheiden", "nichtrosig"], ["bescheiden", "mies"], ["bescheiden", "schlecht"], ["mau", "nichtrosig"], ["mau", "mies"], ["mau", "schlecht"], ["mies", "nichtrosig"], ["nichtrosig", "schlecht"], ["mies", "schlecht"], ["direkt", "geradlinig"], ["geradeaus", "geradlinig"], ["frontal", "geradlinig"], ["direkt", "geradeaus"], ["direkt", "frontal"], ["frontal", "geradeaus"], ["aktualisierung", "renovierung"], ["modernisierung", "renovierung"], ["ajourierung", "renovierung"], ["renovation", "renovierung"], ["aufarbeitung", "renovierung"], ["erneuerung", "renovierung"], ["aktualisierung", "modernisierung"], ["ajourierung", "aktualisierung"], ["aktualisierung", "renovation"], ["aktualisierung", "aufarbeitung"], ["aktualisierung", "erneuerung"], ["ajourierung", "modernisierung"], ["modernisierung", "renovation"], ["aufarbeitung", "modernisierung"], ["erneuerung", "modernisierung"], ["ajourierung", "renovation"], ["ajourierung", "aufarbeitung"], ["ajourierung", "erneuerung"], ["aufarbeitung", "renovation"], ["erneuerung", "renovation"], ["aufarbeitung", "erneuerung"], ["bahn", "schienenstrang"], ["bahn", "trasse"], ["bahn", "spur"], ["bahn", "fahrweg"], ["bahn", "trassee"], ["bahn", "fahrbahn"], ["schienenstrang", "trasse"], ["schienenstrang", "spur"], ["fahrweg", "schienenstrang"], ["schienenstrang", "trassee"], ["fahrbahn", "schienenstrang"], ["spur", "trasse"], ["fahrweg", "trasse"], ["trasse", "trassee"], ["fahrbahn", "trasse"], ["fahrweg", "spur"], ["spur", "trassee"], ["fahrbahn", "spur"], ["fahrweg", "trassee"], ["fahrbahn", "fahrweg"], ["fahrbahn", "trassee"], ["schlagen", "toppen"], ["brechen", "schlagen"], ["schlagen", "uebertreffen"], ["schlagen", "ueberbieten"], ["brechen", "toppen"], ["toppen", "uebertreffen"], ["toppen", "ueberbieten"], ["brechen", "uebertreffen"], ["brechen", "ueberbieten"], ["ueberbieten", "uebertreffen"], ["huelle", "verkleidung"], ["abdeckung", "huelle"], ["case", "huelle"], ["huelle", "schalung"], ["abdeckung", "verkleidung"], ["case", "verkleidung"], ["schalung", "verkleidung"], ["abdeckung", "case"], ["abdeckung", "schalung"], ["case", "schalung"], ["abdichten", "ausfugen"], ["abdichten", "verstreichen"], ["abdichten", "fugen"], ["ausfugen", "verstreichen"], ["ausfugen", "fugen"], ["fugen", "verstreichen"], ["hinweis", "indikator"], ["beleg", "hinweis"], ["hinweis", "zeichen"], ["gradmesser", "hinweis"], ["beleg", "indikator"], ["indikator", "zeichen"], ["gradmesser", "indikator"], ["beleg", "zeichen"], ["beleg", "gradmesser"], ["gradmesser", "zeichen"], ["lassen", "parken"], ["parken", "stehenlassen"], ["parken", "parkieren"], ["abstellen", "parken"], ["lassen", "stehenlassen"], ["lassen", "parkieren"], ["parkieren", "stehenlassen"], ["abstellen", "stehenlassen"], ["abstellen", "parkieren"], ["headline", "ueberschrift"], ["headline", "kopfzeile"], ["headline", "titel"], ["kopfzeile", "ueberschrift"], ["titel", "ueberschrift"], ["kopfzeile", "titel"], ["seitdem", "seither"], ["danach", "seither"], ["nach", "seither"], ["hinfort", "seither"], ["fortan", "seither"], ["fuerderhin", "seither"], ["danach", "seitdem"], ["nach", "seitdem"], ["hinfort", "seitdem"], ["fortan", "seitdem"], ["fuerderhin", "seitdem"], ["danach", "nach"], ["danach", "hinfort"], ["danach", "fortan"], ["danach", "fuerderhin"], ["hinfort", "nach"], ["fortan", "nach"], ["fuerderhin", "nach"], ["fortan", "hinfort"], ["fuerderhin", "hinfort"], ["fortan", "fuerderhin"], ["antenne", "fuehler"], ["anfeuchten", "befeuchten"], ["anfeuchten", "naessen"], ["anfeuchten", "netzen"], ["anfeuchten", "waessern"], ["befeuchten", "naessen"], ["befeuchten", "netzen"], ["befeuchten", "waessern"], ["naessen", "netzen"], ["naessen", "waessern"], ["netzen", "waessern"], ["schmiermittel", "schmierstoff"], ["durchbiegung", "verbiegung"], ["deformation", "durchbiegung"], ["durchbiegung", "verformung"], ["deformierung", "durchbiegung"], ["deformation", "verbiegung"], ["verbiegung", "verformung"], ["deformierung", "verbiegung"], ["deformation", "verformung"], ["deformation", "deformierung"], ["deformierung", "verformung"], ["knacks", "sprung"], ["riss", "sprung"], ["spalt", "sprung"], ["knacks", "riss"], ["knacks", "spalt"], ["riss", "spalt"], ["gleichartig", "homogen"], ["gleichartig", "gleichfoermig"], ["gleich", "gleichartig"], ["ebenmaessig", "gleichartig"], ["einheitlich", "gleichartig"], ["gleichartig", "identisch"], ["gleichfoermig", "homogen"], ["gleich", "homogen"], ["ebenmaessig", "homogen"], ["einheitlich", "homogen"], ["homogen", "identisch"], ["gleich", "gleichfoermig"], ["ebenmaessig", "gleichfoermig"], ["einheitlich", "gleichfoermig"], ["gleichfoermig", "identisch"], ["ebenmaessig", "gleich"], ["einheitlich", "gleich"], ["gleich", "identisch"], ["ebenmaessig", "einheitlich"], ["ebenmaessig", "identisch"], ["einheitlich", "identisch"], ["fluessig", "waesserig"], ["fluessig", "nichtviskos"], ["fluessig", "fluid"], ["fliessfaehig", "fluessig"], ["fluessig", "waessrig"], ["duennfluessig", "fluessig"], ["nichtviskos", "waesserig"], ["fluid", "waesserig"], ["fliessfaehig", "waesserig"], ["waesserig", "waessrig"], ["duennfluessig", "waesserig"], ["fluid", "nichtviskos"], ["fliessfaehig", "nichtviskos"], ["nichtviskos", "waessrig"], ["duennfluessig", "nichtviskos"], ["fliessfaehig", "fluid"], ["fluid", "waessrig"], ["duennfluessig", "fluid"], ["fliessfaehig", "waessrig"], ["duennfluessig", "fliessfaehig"], ["duennfluessig", "waessrig"], ["einbringen", "erwirtschaften"], ["einfahren", "erwirtschaften"], ["bringen", "erwirtschaften"], ["einbringen", "einfahren"], ["bringen", "einbringen"], ["bringen", "einfahren"], ["feststecken", "fixieren"], ["einspannen", "fixieren"], ["fixieren", "klammern"], ["befestigen", "fixieren"], ["einspannen", "feststecken"], ["feststecken", "klammern"], ["befestigen", "feststecken"], ["einspannen", "klammern"], ["befestigen", "einspannen"], ["befestigen", "klammern"], ["rechtwinklig", "senkrecht"], ["lotrecht", "rechtwinklig"], ["lotrecht", "senkrecht"], ["angrenzend", "daneben"], ["benachbart", "daneben"], ["anliegend", "daneben"], ["daneben", "nachbar"], ["daneben", "nahegelegen"], ["angrenzend", "benachbart"], ["angrenzend", "anliegend"], ["angrenzend", "nachbar"], ["angrenzend", "nahegelegen"], ["anliegend", "benachbart"], ["benachbart", "nachbar"], ["benachbart", "nahegelegen"], ["anliegend", "nachbar"], ["anliegend", "nahegelegen"], ["nachbar", "nahegelegen"], ["anschalten", "anstellen"], ["anmachen", "anstellen"], ["anstellen", "einschalten"], ["aktivieren", "anstellen"], ["anknipsen", "anstellen"], ["anmachen", "anschalten"], ["anschalten", "einschalten"], ["aktivieren", "anschalten"], ["anknipsen", "anschalten"], ["anmachen", "einschalten"], ["aktivieren", "anmachen"], ["anknipsen", "anmachen"], ["aktivieren", "einschalten"], ["anknipsen", "einschalten"], ["aktivieren", "anknipsen"], ["domaene", "zustaendigkeitsbereich"], ["umfeld", "zustaendigkeitsbereich"], ["sphaere", "zustaendigkeitsbereich"], ["bereich", "zustaendigkeitsbereich"], ["einflussbereich", "zustaendigkeitsbereich"], ["segment", "zustaendigkeitsbereich"], ["domaene", "umfeld"], ["domaene", "sphaere"], ["bereich", "domaene"], ["domaene", "einflussbereich"], ["domaene", "segment"], ["sphaere", "umfeld"], ["bereich", "umfeld"], ["einflussbereich", "umfeld"], ["segment", "umfeld"], ["bereich", "sphaere"], ["einflussbereich", "sphaere"], ["segment", "sphaere"], ["bereich", "einflussbereich"], ["bereich", "segment"], ["einflussbereich", "segment"], ["einzeln", "unabhaengig"], ["einzeln", "individuell"], ["abgetrennt", "einzeln"], ["einzeln", "separat"], ["abgesondert", "einzeln"], ["einzeln", "geteilt"], ["einzeln", "getrennt"], ["individuell", "unabhaengig"], ["abgetrennt", "unabhaengig"], ["separat", "unabhaengig"], ["abgesondert", "unabhaengig"], ["geteilt", "unabhaengig"], ["getrennt", "unabhaengig"], ["abgetrennt", "individuell"], ["individuell", "separat"], ["abgesondert", "individuell"], ["geteilt", "individuell"], ["getrennt", "individuell"], ["abgetrennt", "separat"], ["abgesondert", "abgetrennt"], ["abgetrennt", "geteilt"], ["abgetrennt", "getrennt"], ["abgesondert", "separat"], ["geteilt", "separat"], ["getrennt", "separat"], ["abgesondert", "geteilt"], ["abgesondert", "getrennt"], ["geteilt", "getrennt"], ["schriftstueck", "unterlage"], ["dokument", "schriftstueck"], ["archivale", "schriftstueck"], ["beleg", "schriftstueck"], ["schriftstueck", "urkunde"], ["dokument", "unterlage"], ["archivale", "unterlage"], ["beleg", "unterlage"], ["unterlage", "urkunde"], ["archivale", "dokument"], ["beleg", "dokument"], ["dokument", "urkunde"], ["archivale", "beleg"], ["archivale", "urkunde"], ["beleg", "urkunde"], ["einschlagen", "ramponieren"], ["beschaedigen", "ramponieren"], ["laedieren", "ramponieren"], ["ramponieren", "verbeulen"], ["beschaedigen", "einschlagen"], ["einschlagen", "laedieren"], ["einschlagen", "verbeulen"], ["beschaedigen", "laedieren"], ["beschaedigen", "verbeulen"], ["laedieren", "verbeulen"], ["gewicht", "sprengkraft"], ["bedeutung", "gewicht"], ["bedeutung", "sprengkraft"], ["index", "kennziffer"], ["index", "verzeichnis"], ["hinweis", "index"], ["index", "zeiger"], ["index", "tabelle"], ["kennziffer", "verzeichnis"], ["hinweis", "kennziffer"], ["kennziffer", "zeiger"], ["kennziffer", "tabelle"], ["hinweis", "verzeichnis"], ["verzeichnis", "zeiger"], ["hinweis", "zeiger"], ["hinweis", "tabelle"], ["tabelle", "zeiger"], ["sichtung", "ueberpruefung"], ["inspektion", "sichtung"], ["screening", "sichtung"], ["begehung", "sichtung"], ["kontrolle", "sichtung"], ["bemusterung", "sichtung"], ["inspektion", "ueberpruefung"], ["screening", "ueberpruefung"], ["begehung", "ueberpruefung"], ["kontrolle", "ueberpruefung"], ["bemusterung", "ueberpruefung"], ["inspektion", "screening"], ["begehung", "inspektion"], ["inspektion", "kontrolle"], ["bemusterung", "inspektion"], ["begehung", "screening"], ["kontrolle", "screening"], ["bemusterung", "screening"], ["begehung", "kontrolle"], ["begehung", "bemusterung"], ["bemusterung", "kontrolle"], ["ablegen", "ausziehen"], ["auskleiden", "ausziehen"], ["abstreifen", "ausziehen"], ["ausziehen", "enthuellen"], ["ausziehen", "entledigen"], ["ausziehen", "freimachen"], ["ausziehen", "entkleiden"], ["ablegen", "auskleiden"], ["ablegen", "abstreifen"], ["ablegen", "enthuellen"], ["ablegen", "entledigen"], ["ablegen", "freimachen"], ["ablegen", "entkleiden"], ["abstreifen", "auskleiden"], ["auskleiden", "enthuellen"], ["auskleiden", "entledigen"], ["auskleiden", "freimachen"], ["auskleiden", "entkleiden"], ["abstreifen", "enthuellen"], ["abstreifen", "entledigen"], ["abstreifen", "freimachen"], ["abstreifen", "entkleiden"], ["enthuellen", "entledigen"], ["enthuellen", "freimachen"], ["enthuellen", "entkleiden"], ["entledigen", "freimachen"], ["entkleiden", "entledigen"], ["entkleiden", "freimachen"], ["mahnung", "vorwarnung"], ["vorwarnung", "warnung"], ["vorwarnung", "warnhinweis"], ["mahnung", "warnung"], ["mahnung", "warnhinweis"], ["warnhinweis", "warnung"], ["geordnet", "planmaessig"], ["methodisch", "planmaessig"], ["planmaessig", "systematisch"], ["planmaessig", "planvoll"], ["planmaessig", "regelhaft"], ["geordnet", "methodisch"], ["geordnet", "systematisch"], ["geordnet", "planvoll"], ["geordnet", "regelhaft"], ["methodisch", "systematisch"], ["methodisch", "planvoll"], ["methodisch", "regelhaft"], ["planvoll", "systematisch"], ["regelhaft", "systematisch"], ["planvoll", "regelhaft"], ["haemmern", "pochen"], ["pochen", "pulsieren"], ["klopfen", "pochen"], ["bumpern", "pochen"], ["pochen", "schlagen"], ["haemmern", "pulsieren"], ["haemmern", "klopfen"], ["bumpern", "haemmern"], ["haemmern", "schlagen"], ["klopfen", "pulsieren"], ["bumpern", "pulsieren"], ["pulsieren", "schlagen"], ["bumpern", "klopfen"], ["klopfen", "schlagen"], ["bumpern", "schlagen"], ["waagerecht", "waagrecht"], ["horizontal", "waagerecht"], ["horizontal", "waagrecht"], ["gedrungen", "massiv"], ["kompakt", "massiv"], ["handlich", "massiv"], ["massiv", "zusammengedraengt"], ["klein", "massiv"], ["gedrungen", "kompakt"], ["gedrungen", "handlich"], ["gedrungen", "zusammengedraengt"], ["gedrungen", "klein"], ["handlich", "kompakt"], ["kompakt", "zusammengedraengt"], ["klein", "kompakt"], ["handlich", "zusammengedraengt"], ["handlich", "klein"], ["klein", "zusammengedraengt"], ["band", "gurt"], ["band", "streifen"], ["baendel", "band"], ["gurt", "streifen"], ["baendel", "gurt"], ["baendel", "streifen"], ["aufwand", "kostenaufwand"], ["kostenaufwand", "unkosten"], ["kostenaufwand", "spesen"], ["aufwendung", "kostenaufwand"], ["kosten", "kostenaufwand"], ["kapitalaufwand", "kostenaufwand"], ["ausgabe", "kostenaufwand"], ["aufwand", "unkosten"], ["aufwand", "spesen"], ["aufwand", "aufwendung"], ["aufwand", "kosten"], ["aufwand", "kapitalaufwand"], ["aufwand", "ausgabe"], ["spesen", "unkosten"], ["aufwendung", "unkosten"], ["kosten", "unkosten"], ["kapitalaufwand", "unkosten"], ["ausgabe", "unkosten"], ["aufwendung", "spesen"], ["kosten", "spesen"], ["kapitalaufwand", "spesen"], ["ausgabe", "spesen"], ["aufwendung", "kosten"], ["aufwendung", "kapitalaufwand"], ["aufwendung", "ausgabe"], ["kapitalaufwand", "kosten"], ["ausgabe", "kosten"], ["ausgabe", "kapitalaufwand"], ["kollern", "kullern"], ["kollern", "rollen"], ["kollern", "kugeln"], ["kullern", "rollen"], ["kugeln", "kullern"], ["kugeln", "rollen"], ["elektronenhirn", "universalrechner"], ["datenverarbeitungsanlage", "universalrechner"], ["elektronengehirn", "universalrechner"], ["computer", "universalrechner"], ["rechenknecht", "universalrechner"], ["rechner", "universalrechner"], ["datenverarbeitungsanlage", "elektronenhirn"], ["elektronengehirn", "elektronenhirn"], ["computer", "elektronenhirn"], ["elektronenhirn", "rechenknecht"], ["elektronenhirn", "rechner"], ["datenverarbeitungsanlage", "elektronengehirn"], ["computer", "datenverarbeitungsanlage"], ["datenverarbeitungsanlage", "rechenknecht"], ["datenverarbeitungsanlage", "rechner"], ["computer", "elektronengehirn"], ["elektronengehirn", "rechenknecht"], ["elektronengehirn", "rechner"], ["computer", "rechenknecht"], ["computer", "rechner"], ["rechenknecht", "rechner"], ["gemeinsam", "geschlossen"], ["anruf", "telefonanruf"], ["anruf", "telefonat"], ["anruf", "telefongespraech"], ["anruf", "call"], ["anruf", "telefon"], ["anruf", "telefonkontakt"], ["telefonanruf", "telefonat"], ["telefonanruf", "telefongespraech"], ["call", "telefonanruf"], ["telefon", "telefonanruf"], ["telefonanruf", "telefonkontakt"], ["telefonat", "telefongespraech"], ["call", "telefonat"], ["telefon", "telefonat"], ["telefonat", "telefonkontakt"], ["call", "telefongespraech"], ["telefon", "telefongespraech"], ["telefongespraech", "telefonkontakt"], ["call", "telefon"], ["call", "telefonkontakt"], ["telefon", "telefonkontakt"], ["geblaese", "luefter"], ["gasfoerderer", "luefter"], ["exhaustor", "luefter"], ["luefter", "ventilator"], ["luefter", "miefquirl"], ["gasfoerderer", "geblaese"], ["exhaustor", "geblaese"], ["geblaese", "ventilator"], ["geblaese", "miefquirl"], ["exhaustor", "gasfoerderer"], ["gasfoerderer", "ventilator"], ["gasfoerderer", "miefquirl"], ["exhaustor", "ventilator"], ["exhaustor", "miefquirl"], ["miefquirl", "ventilator"], ["synkretisch", "vermischt"], ["synkretisch", "zusammengesetzt"], ["synkretisch", "unrein"], ["gemischt", "synkretisch"], ["vermischt", "zusammengesetzt"], ["unrein", "vermischt"], ["gemischt", "vermischt"], ["unrein", "zusammengesetzt"], ["gemischt", "zusammengesetzt"], ["gemischt", "unrein"], ["angewiesen", "dependent"], ["abhaengig", "dependent"], ["abhaengig", "angewiesen"], ["ablage", "azimut"], ["ablage", "abweichung"], ["abweichung", "azimut"], ["kuenstlich", "synthetisch"], ["kuenstlich", "unecht"], ["falsch", "kuenstlich"], ["kuenstlich", "synthetisiert"], ["kuenstlich", "nachgebildet"], ["artifiziell", "kuenstlich"], ["kuenstlich", "pseudo"], ["synthetisch", "unecht"], ["falsch", "synthetisch"], ["synthetisch", "synthetisiert"], ["nachgebildet", "synthetisch"], ["artifiziell", "synthetisch"], ["pseudo", "synthetisch"], ["falsch", "unecht"], ["synthetisiert", "unecht"], ["nachgebildet", "unecht"], ["artifiziell", "unecht"], ["pseudo", "unecht"], ["falsch", "synthetisiert"], ["falsch", "nachgebildet"], ["artifiziell", "falsch"], ["falsch", "pseudo"], ["nachgebildet", "synthetisiert"], ["artifiziell", "synthetisiert"], ["pseudo", "synthetisiert"], ["artifiziell", "nachgebildet"], ["nachgebildet", "pseudo"], ["artifiziell", "pseudo"], ["mannequin", "modell"], ["mannequin", "model"], ["mannequin", "vorfuehrdame"], ["fotomodell", "mannequin"], ["model", "modell"], ["modell", "vorfuehrdame"], ["fotomodell", "modell"], ["model", "vorfuehrdame"], ["fotomodell", "model"], ["fotomodell", "vorfuehrdame"], ["mehrzweck", "multifunktions"], ["mehrzweck", "universal"], ["allzweck", "mehrzweck"], ["multifunktions", "universal"], ["allzweck", "multifunktions"], ["allzweck", "universal"], ["identifikation", "kennung"], ["freigeben", "freilegen"], ["dichte", "wichte"], ["dichtheit", "wichte"], ["dichte", "dichtheit"], ["inkrementell", "stufenweise"], ["diskontinuierlich", "inkrementell"], ["inkrementell", "schrittweise"], ["diskret", "inkrementell"], ["diskontinuierlich", "stufenweise"], ["schrittweise", "stufenweise"], ["diskret", "stufenweise"], ["diskontinuierlich", "schrittweise"], ["diskontinuierlich", "diskret"], ["diskret", "schrittweise"], ["flicken", "patch"], ["flecken", "patch"], ["aufnaeher", "patch"], ["fleck", "patch"], ["flecken", "flicken"], ["aufnaeher", "flicken"], ["fleck", "flicken"], ["aufnaeher", "flecken"], ["fleck", "flecken"], ["aufnaeher", "fleck"], ["beaufsichtigen", "ueberwachen"], ["beobachten", "ueberwachen"], ["checken", "ueberwachen"], ["kontrollieren", "ueberwachen"], ["nachhalten", "ueberwachen"], ["aufpassen", "ueberwachen"], ["beaufsichtigen", "beobachten"], ["beaufsichtigen", "checken"], ["beaufsichtigen", "kontrollieren"], ["beaufsichtigen", "nachhalten"], ["aufpassen", "beaufsichtigen"], ["beobachten", "checken"], ["beobachten", "kontrollieren"], ["beobachten", "nachhalten"], ["aufpassen", "beobachten"], ["checken", "kontrollieren"], ["checken", "nachhalten"], ["aufpassen", "checken"], ["kontrollieren", "nachhalten"], ["aufpassen", "kontrollieren"], ["aufpassen", "nachhalten"], ["voraus", "vorwaerts"], ["voran", "vorwaerts"], ["voran", "voraus"], ["beigabe", "ingrediens"], ["ingrediens", "zutat"], ["ingrediens", "ingredienz"], ["ergaenzung", "ingrediens"], ["ingrediens", "zugabe"], ["beigabe", "zutat"], ["beigabe", "ingredienz"], ["beigabe", "ergaenzung"], ["beigabe", "zugabe"], ["ingredienz", "zutat"], ["ergaenzung", "zutat"], ["zugabe", "zutat"], ["ergaenzung", "ingredienz"], ["ingredienz", "zugabe"], ["ergaenzung", "zugabe"], ["ansatzpunkt", "ausgangspunkt"], ["verrammeln", "zusperren"], ["sperren", "verrammeln"], ["barrikadieren", "verrammeln"], ["verbarrikadieren", "verrammeln"], ["verrammeln", "versperren"], ["abblocken", "verrammeln"], ["verrammeln", "verriegeln"], ["sperren", "zusperren"], ["barrikadieren", "zusperren"], ["verbarrikadieren", "zusperren"], ["versperren", "zusperren"], ["abblocken", "zusperren"], ["verriegeln", "zusperren"], ["barrikadieren", "sperren"], ["sperren", "verbarrikadieren"], ["sperren", "versperren"], ["abblocken", "sperren"], ["sperren", "verriegeln"], ["barrikadieren", "verbarrikadieren"], ["barrikadieren", "versperren"], ["abblocken", "barrikadieren"], ["barrikadieren", "verriegeln"], ["verbarrikadieren", "versperren"], ["abblocken", "verbarrikadieren"], ["verbarrikadieren", "verriegeln"], ["abblocken", "versperren"], ["verriegeln", "versperren"], ["abblocken", "verriegeln"], ["ermittlung", "untersuchung"], ["ermittlung", "pruefung"], ["pruefung", "untersuchung"], ["vermindert", "zusammengestrichen"], ["verringert", "zusammengestrichen"], ["zusammengeschrumpft", "zusammengestrichen"], ["reduziert", "zusammengestrichen"], ["eingegangen", "zusammengestrichen"], ["geschrumpft", "zusammengestrichen"], ["vermindert", "verringert"], ["vermindert", "zusammengeschrumpft"], ["reduziert", "vermindert"], ["eingegangen", "vermindert"], ["geschrumpft", "vermindert"], ["verringert", "zusammengeschrumpft"], ["reduziert", "verringert"], ["eingegangen", "verringert"], ["geschrumpft", "verringert"], ["reduziert", "zusammengeschrumpft"], ["eingegangen", "zusammengeschrumpft"], ["geschrumpft", "zusammengeschrumpft"], ["eingegangen", "reduziert"], ["geschrumpft", "reduziert"], ["eingegangen", "geschrumpft"], ["fuge", "sprung"], ["sprung", "verbindungsstelle"], ["falz", "sprung"], ["fuge", "verbindungsstelle"], ["falz", "fuge"], ["falz", "verbindungsstelle"], ["aufstellung", "einsatz"], ["einsatz", "stationierung"], ["aufstellung", "stationierung"], ["einfluss", "rang"], ["geltung", "rang"], ["bedeutung", "rang"], ["rang", "wert"], ["rang", "wichtigkeit"], ["einfluss", "geltung"], ["bedeutung", "einfluss"], ["einfluss", "wert"], ["einfluss", "wichtigkeit"], ["bedeutung", "geltung"], ["geltung", "wert"], ["geltung", "wichtigkeit"], ["bedeutung", "wert"], ["bedeutung", "wichtigkeit"], ["wert", "wichtigkeit"], ["gegen", "versus"], ["gegen", "kontra"], ["gegen", "wider"], ["contra", "gegen"], ["kontra", "versus"], ["versus", "wider"], ["contra", "versus"], ["kontra", "wider"], ["contra", "kontra"], ["contra", "wider"], ["seiten", "seitlich"], ["stachelrad", "zahnkranz"], ["sprossenrad", "stachelrad"], ["stachelrad", "zahn"], ["sprossenrad", "zahnkranz"], ["zahn", "zahnkranz"], ["sprossenrad", "zahn"], ["ecke", "kante"], ["kante", "winkel"], ["ecke", "winkel"], ["fest", "stramm"], ["straff", "stramm"], ["fest", "straff"], ["geschlossen", "verbunden"], ["gemein", "geschlossen"], ["gemeinschaftlich", "geschlossen"], ["geschlossen", "kompakt"], ["geschlossen", "zusammen"], ["gemeinsam", "verbunden"], ["gemein", "gemeinsam"], ["gemeinsam", "gemeinschaftlich"], ["gemeinsam", "kompakt"], ["gemeinsam", "zusammen"], ["gemein", "verbunden"], ["gemeinschaftlich", "verbunden"], ["kompakt", "verbunden"], ["verbunden", "zusammen"], ["gemein", "gemeinschaftlich"], ["gemein", "kompakt"], ["gemein", "zusammen"], ["gemeinschaftlich", "kompakt"], ["gemeinschaftlich", "zusammen"], ["kompakt", "zusammen"], ["besprengen", "bespritzen"], ["benetzen", "bespritzen"], ["berieseln", "bespritzen"], ["besprenkeln", "bespritzen"], ["bespritzen", "bespruehen"], ["beregnen", "bespritzen"], ["benetzen", "besprengen"], ["berieseln", "besprengen"], ["besprengen", "besprenkeln"], ["besprengen", "bespruehen"], ["beregnen", "besprengen"], ["benetzen", "berieseln"], ["benetzen", "besprenkeln"], ["benetzen", "bespruehen"], ["benetzen", "beregnen"], ["berieseln", "besprenkeln"], ["berieseln", "bespruehen"], ["beregnen", "berieseln"], ["besprenkeln", "bespruehen"], ["beregnen", "besprenkeln"], ["beregnen", "bespruehen"], ["bedingt", "gekoppelt"], ["bedingt", "gepaart"], ["abhaengig", "bedingt"], ["bedingt", "verbunden"], ["bedingt", "kombiniert"], ["gekoppelt", "gepaart"], ["abhaengig", "gekoppelt"], ["gekoppelt", "verbunden"], ["gekoppelt", "kombiniert"], ["abhaengig", "gepaart"], ["gepaart", "verbunden"], ["gepaart", "kombiniert"], ["abhaengig", "verbunden"], ["abhaengig", "kombiniert"], ["kombiniert", "verbunden"], ["timer", "zeitgeber"], ["nummer", "zahl"], ["nummer", "vielheit"], ["menge", "nummer"], ["kennziffer", "nummer"], ["nummer", "ziffer"], ["vielheit", "zahl"], ["menge", "zahl"], ["kennziffer", "zahl"], ["zahl", "ziffer"], ["menge", "vielheit"], ["kennziffer", "vielheit"], ["vielheit", "ziffer"], ["kennziffer", "menge"], ["menge", "ziffer"], ["kennziffer", "ziffer"], ["meist", "vorwiegend"], ["normalerweise", "vorwiegend"], ["vornehmlich", "vorwiegend"], ["groesstenteils", "vorwiegend"], ["ueberwiegend", "vorwiegend"], ["mehrheitlich", "vorwiegend"], ["meist", "normalerweise"], ["meist", "vornehmlich"], ["groesstenteils", "meist"], ["meist", "ueberwiegend"], ["mehrheitlich", "meist"], ["normalerweise", "vornehmlich"], ["groesstenteils", "normalerweise"], ["normalerweise", "ueberwiegend"], ["mehrheitlich", "normalerweise"], ["groesstenteils", "vornehmlich"], ["ueberwiegend", "vornehmlich"], ["mehrheitlich", "vornehmlich"], ["groesstenteils", "ueberwiegend"], ["groesstenteils", "mehrheitlich"], ["mehrheitlich", "ueberwiegend"], ["spulen", "wickeln"], ["aufwickeln", "spulen"], ["aufwickeln", "wickeln"], ["plus", "ueber"], ["funktionuckeln", "gehen"], ["funzen", "gehen"], ["gehen", "tun"], ["gehen", "klappen"], ["funktionieren", "gehen"], ["gehen", "laufen"], ["funktionuckeln", "funzen"], ["funktionuckeln", "tun"], ["funktionuckeln", "klappen"], ["funktionieren", "funktionuckeln"], ["funktionuckeln", "laufen"], ["funzen", "tun"], ["funzen", "klappen"], ["funktionieren", "funzen"], ["funzen", "laufen"], ["klappen", "tun"], ["funktionieren", "tun"], ["laufen", "tun"], ["klappen", "laufen"], ["funktionieren", "laufen"], ["spannung", "zug"], ["zug", "zugbelastung"], ["belastung", "zug"], ["druckbelastung", "zug"], ["spannungszustand", "zug"], ["spannung", "zugbelastung"], ["belastung", "spannung"], ["druckbelastung", "spannung"], ["spannung", "spannungszustand"], ["belastung", "zugbelastung"], ["druckbelastung", "zugbelastung"], ["spannungszustand", "zugbelastung"], ["belastung", "druckbelastung"], ["belastung", "spannungszustand"], ["druckbelastung", "spannungszustand"], ["gepflegt", "gewienert"], ["gewienert", "poliert"], ["geputzt", "gewienert"], ["gereinigt", "gewienert"], ["gesaeubert", "gewienert"], ["gepflegt", "poliert"], ["gepflegt", "geputzt"], ["gepflegt", "gereinigt"], ["gepflegt", "gesaeubert"], ["geputzt", "poliert"], ["gereinigt", "poliert"], ["gesaeubert", "poliert"], ["geputzt", "gereinigt"], ["geputzt", "gesaeubert"], ["gereinigt", "gesaeubert"], ["belag", "ueberzug"], ["kruste", "ueberzug"], ["schicht", "ueberzug"], ["beschichtung", "ueberzug"], ["belag", "kruste"], ["belag", "schicht"], ["belag", "beschichtung"], ["kruste", "schicht"], ["beschichtung", "kruste"], ["beschichtung", "schicht"], ["falten", "knicken"], ["knicken", "zusammenklappen"], ["falten", "zusammenklappen"], ["kick", "stoss"], ["kick", "tritt"], ["stoss", "tritt"], ["ausdauernd", "nachhaltig"], ["dauerhaft", "nachhaltig"], ["anhaltend", "nachhaltig"], ["nachhaltig", "persistent"], ["hartnaeckig", "nachhaltig"], ["nachhaltig", "permanent"], ["bestaendig", "nachhaltig"], ["ausdauernd", "dauerhaft"], ["anhaltend", "ausdauernd"], ["ausdauernd", "persistent"], ["ausdauernd", "hartnaeckig"], ["ausdauernd", "permanent"], ["ausdauernd", "bestaendig"], ["anhaltend", "dauerhaft"], ["dauerhaft", "persistent"], ["dauerhaft", "hartnaeckig"], ["dauerhaft", "permanent"], ["bestaendig", "dauerhaft"], ["anhaltend", "persistent"], ["anhaltend", "hartnaeckig"], ["anhaltend", "permanent"], ["anhaltend", "bestaendig"], ["hartnaeckig", "persistent"], ["permanent", "persistent"], ["bestaendig", "persistent"], ["hartnaeckig", "permanent"], ["bestaendig", "hartnaeckig"], ["bestaendig", "permanent"], ["neigung", "tendenz"], ["einschlag", "neigung"], ["faerbung", "neigung"], ["ausrichtung", "neigung"], ["neigung", "verzerrung"], ["einschlag", "tendenz"], ["faerbung", "tendenz"], ["ausrichtung", "tendenz"], ["tendenz", "verzerrung"], ["einschlag", "faerbung"], ["ausrichtung", "einschlag"], ["einschlag", "verzerrung"], ["ausrichtung", "faerbung"], ["faerbung", "verzerrung"], ["ausrichtung", "verzerrung"], ["auskunft", "auskunftsschalter"], ["auskunftsschalter", "information"], ["auskunftsschalter", "schalter"], ["auskunft", "information"], ["auskunft", "schalter"], ["information", "schalter"], ["register", "schlagwortverzeichnis"], ["register", "stichwortliste"], ["index", "register"], ["register", "stichwortverzeichnis"], ["referenz", "register"], ["schlagwortverzeichnis", "stichwortliste"], ["index", "schlagwortverzeichnis"], ["schlagwortverzeichnis", "stichwortverzeichnis"], ["referenz", "schlagwortverzeichnis"], ["index", "stichwortliste"], ["stichwortliste", "stichwortverzeichnis"], ["referenz", "stichwortliste"], ["index", "stichwortverzeichnis"], ["index", "referenz"], ["referenz", "stichwortverzeichnis"], ["kalorienreduziert", "light"], ["leicht", "light"], ["kalorienreduziert", "leicht"], ["ungezwungen", "zwanglos"], ["offen", "ungezwungen"], ["ungehemmt", "ungezwungen"], ["frei", "ungezwungen"], ["offen", "zwanglos"], ["ungehemmt", "zwanglos"], ["frei", "zwanglos"], ["offen", "ungehemmt"], ["frei", "offen"], ["frei", "ungehemmt"], ["gebirgsgrat", "hoehenruecken"], ["hoehenruecken", "kamm"], ["hoehenruecken", "naht"], ["bergruecken", "hoehenruecken"], ["bergzug", "hoehenruecken"], ["grat", "hoehenruecken"], ["gebirgsgrat", "kamm"], ["gebirgsgrat", "naht"], ["bergruecken", "gebirgsgrat"], ["bergzug", "gebirgsgrat"], ["gebirgsgrat", "grat"], ["kamm", "naht"], ["bergruecken", "kamm"], ["bergzug", "kamm"], ["grat", "kamm"], ["bergruecken", "naht"], ["bergzug", "naht"], ["grat", "naht"], ["bergruecken", "bergzug"], ["bergruecken", "grat"], ["bergzug", "grat"], ["korrektheit", "richtigkeit"], ["genauigkeit", "richtigkeit"], ["genauigkeit", "korrektheit"], ["bildschirmfenster", "window"], ["fenster", "window"], ["bildschirmfenster", "fenster"], ["dienen", "servieren"], ["bewirten", "dienen"], ["bedienen", "dienen"], ["bewirten", "servieren"], ["bedienen", "servieren"], ["bedienen", "bewirten"], ["gitter", "raster"], ["gitternetz", "raster"], ["raster", "rastermuster"], ["gitter", "gitternetz"], ["gitter", "rastermuster"], ["gitternetz", "rastermuster"], ["schlag", "typ"], ["schlagmenschen", "typ"], ["menschenschlag", "typ"], ["schlag", "schlagmenschen"], ["menschenschlag", "schlag"], ["menschenschlag", "schlagmenschen"], ["lokalisation", "position"], ["position", "stelle"], ["lokalitaet", "position"], ["oertlichkeit", "position"], ["ortsangabe", "position"], ["lokalisation", "stelle"], ["lokalisation", "lokalitaet"], ["lokalisation", "oertlichkeit"], ["lokalisation", "ortsangabe"], ["lokalitaet", "stelle"], ["oertlichkeit", "stelle"], ["ortsangabe", "stelle"], ["lokalitaet", "oertlichkeit"], ["lokalitaet", "ortsangabe"], ["oertlichkeit", "ortsangabe"], ["schuetzen", "sichern"], ["beschuetzen", "sichern"], ["beschuetzen", "schuetzen"], ["perspektive", "weg"], ["chance", "weg"], ["option", "weg"], ["moeglichkeit", "weg"], ["gelegenheit", "weg"], ["aussicht", "weg"], ["chance", "perspektive"], ["option", "perspektive"], ["moeglichkeit", "perspektive"], ["gelegenheit", "perspektive"], ["aussicht", "perspektive"], ["chance", "option"], ["chance", "moeglichkeit"], ["chance", "gelegenheit"], ["aussicht", "chance"], ["moeglichkeit", "option"], ["gelegenheit", "option"], ["aussicht", "option"], ["gelegenheit", "moeglichkeit"], ["aussicht", "moeglichkeit"], ["aussicht", "gelegenheit"], ["abstimmung", "synchronisierung"], ["synchronisation", "synchronisierung"], ["abstimmung", "synchronisation"], ["regelrecht", "reglementarisch"], ["regelrecht", "vorschriftsmaessig"], ["ordnungsmaessig", "regelrecht"], ["regelgemaess", "regelrecht"], ["regelrecht", "regulaer"], ["regelrecht", "vorgeschrieben"], ["ordnungsgemaess", "regelrecht"], ["reglementarisch", "vorschriftsmaessig"], ["ordnungsmaessig", "reglementarisch"], ["regelgemaess", "reglementarisch"], ["reglementarisch", "regulaer"], ["reglementarisch", "vorgeschrieben"], ["ordnungsgemaess", "reglementarisch"], ["ordnungsmaessig", "vorschriftsmaessig"], ["regelgemaess", "vorschriftsmaessig"], ["regulaer", "vorschriftsmaessig"], ["vorgeschrieben", "vorschriftsmaessig"], ["ordnungsgemaess", "vorschriftsmaessig"], ["ordnungsmaessig", "regelgemaess"], ["ordnungsmaessig", "regulaer"], ["ordnungsmaessig", "vorgeschrieben"], ["ordnungsgemaess", "ordnungsmaessig"], ["regelgemaess", "regulaer"], ["regelgemaess", "vorgeschrieben"], ["ordnungsgemaess", "regelgemaess"], ["regulaer", "vorgeschrieben"], ["ordnungsgemaess", "regulaer"], ["ordnungsgemaess", "vorgeschrieben"], ["bombieren", "verbiegen"], ["biegen", "verbiegen"], ["biegen", "bombieren"], ["betrag", "summe"], ["abbilden", "praesentieren"], ["abbilden", "vorfuehren"], ["abbilden", "darstellen"], ["abbilden", "vorstellen"], ["abbilden", "demonstrieren"], ["abbilden", "vorzeigen"], ["abbilden", "zeigen"], ["praesentieren", "vorfuehren"], ["darstellen", "praesentieren"], ["praesentieren", "vorstellen"], ["demonstrieren", "praesentieren"], ["praesentieren", "vorzeigen"], ["praesentieren", "zeigen"], ["darstellen", "vorfuehren"], ["vorfuehren", "vorstellen"], ["demonstrieren", "vorfuehren"], ["vorfuehren", "vorzeigen"], ["vorfuehren", "zeigen"], ["darstellen", "vorstellen"], ["darstellen", "demonstrieren"], ["darstellen", "vorzeigen"], ["darstellen", "zeigen"], ["demonstrieren", "vorstellen"], ["vorstellen", "vorzeigen"], ["vorstellen", "zeigen"], ["demonstrieren", "vorzeigen"], ["demonstrieren", "zeigen"], ["vorzeigen", "zeigen"], ["vor", "vorher"], ["vor", "voraus"], ["vor", "vorab"], ["vor", "vorweg"], ["vor", "zuvor"], ["voraus", "vorher"], ["vorab", "vorher"], ["vorher", "vorweg"], ["vorher", "zuvor"], ["vorab", "voraus"], ["voraus", "vorweg"], ["voraus", "zuvor"], ["vorab", "vorweg"], ["vorab", "zuvor"], ["vorweg", "zuvor"], ["aufscheinen", "erglimmen"], ["erglimmen", "erstrahlen"], ["aufleuchten", "erglimmen"], ["erglimmen", "erscheinen"], ["aufblenden", "erglimmen"], ["aufscheinen", "erstrahlen"], ["aufleuchten", "aufscheinen"], ["aufscheinen", "erscheinen"], ["aufblenden", "aufscheinen"], ["aufleuchten", "erstrahlen"], ["erscheinen", "erstrahlen"], ["aufblenden", "erstrahlen"], ["aufleuchten", "erscheinen"], ["aufblenden", "aufleuchten"], ["aufblenden", "erscheinen"], ["verschliessen", "zuschliessen"], ["verriegeln", "zuschliessen"], ["abschliessen", "zuschliessen"], ["zuschliessen", "zusperren"], ["absperren", "zuschliessen"], ["verriegeln", "verschliessen"], ["abschliessen", "verschliessen"], ["verschliessen", "zusperren"], ["absperren", "verschliessen"], ["abschliessen", "verriegeln"], ["absperren", "verriegeln"], ["abschliessen", "zusperren"], ["abschliessen", "absperren"], ["absperren", "zusperren"], ["ausbildung", "berufsausbildung"], ["berufsausbildung", "lehre"], ["berufsausbildung", "berufslehre"], ["ausbildung", "lehre"], ["ausbildung", "berufslehre"], ["berufslehre", "lehre"], ["umtauschen", "zurueckgeben"], ["reklamieren", "zurueckgeben"], ["austauschen", "zurueckgeben"], ["tauschen", "zurueckgeben"], ["eintauschen", "zurueckgeben"], ["reklamieren", "umtauschen"], ["austauschen", "umtauschen"], ["tauschen", "umtauschen"], ["eintauschen", "umtauschen"], ["austauschen", "reklamieren"], ["reklamieren", "tauschen"], ["eintauschen", "reklamieren"], ["austauschen", "tauschen"], ["austauschen", "eintauschen"], ["eintauschen", "tauschen"], ["bedienen", "betaetigen"], ["bedienen", "handhaben"], ["ausloesen", "bedienen"], ["bedienen", "druecken"], ["betaetigen", "handhaben"], ["ausloesen", "betaetigen"], ["betaetigen", "druecken"], ["ausloesen", "handhaben"], ["druecken", "handhaben"], ["ausloesen", "druecken"], ["aufhalten", "verzoegern"], ["aufhalten", "behindern"], ["anhalten", "aufhalten"], ["behindern", "verzoegern"], ["anhalten", "verzoegern"], ["anhalten", "behindern"], ["anordnung", "ordnung"], ["anordnung", "regelmaessigkeit"], ["ordnung", "regelmaessigkeit"], ["anmoderation", "eroeffnung"], ["einfuehrung", "eroeffnung"], ["einleitung", "eroeffnung"], ["anmoderation", "einfuehrung"], ["anmoderation", "einleitung"], ["einfuehrung", "einleitung"], ["durchloechert", "zerloechert"], ["durchloechert", "undicht"], ["durchloechert", "poroes"], ["durchloechert", "loechrig"], ["durchloechert", "loecherig"], ["durchloechert", "leck"], ["undicht", "zerloechert"], ["poroes", "zerloechert"], ["loechrig", "zerloechert"], ["loecherig", "zerloechert"], ["leck", "zerloechert"], ["poroes", "undicht"], ["loechrig", "undicht"], ["loecherig", "undicht"], ["leck", "undicht"], ["loechrig", "poroes"], ["loecherig", "poroes"], ["leck", "poroes"], ["loecherig", "loechrig"], ["leck", "loechrig"], ["leck", "loecherig"], ["aufeinanderfolge", "folge"], ["aufeinanderfolge", "reihe"], ["aufeinanderfolge", "chronologie"], ["ablauf", "aufeinanderfolge"], ["abfolge", "aufeinanderfolge"], ["aufeinanderfolge", "nacheinander"], ["folge", "reihe"], ["chronologie", "folge"], ["ablauf", "folge"], ["abfolge", "folge"], ["folge", "nacheinander"], ["chronologie", "reihe"], ["ablauf", "reihe"], ["abfolge", "reihe"], ["nacheinander", "reihe"], ["ablauf", "chronologie"], ["abfolge", "chronologie"], ["chronologie", "nacheinander"], ["abfolge", "ablauf"], ["ablauf", "nacheinander"], ["abfolge", "nacheinander"], ["bezueglich", "wegen"], ["technisch", "wegen"], ["bzgl", "wegen"], ["betreffend", "wegen"], ["hinsichtlich", "wegen"], ["maessig", "wegen"], ["wasangeht", "wegen"], ["bezueglich", "technisch"], ["bezueglich", "bzgl"], ["betreffend", "bezueglich"], ["bezueglich", "hinsichtlich"], ["bezueglich", "maessig"], ["bezueglich", "wasangeht"], ["bzgl", "technisch"], ["betreffend", "technisch"], ["hinsichtlich", "technisch"], ["maessig", "technisch"], ["technisch", "wasangeht"], ["betreffend", "bzgl"], ["bzgl", "hinsichtlich"], ["bzgl", "maessig"], ["bzgl", "wasangeht"], ["betreffend", "hinsichtlich"], ["betreffend", "maessig"], ["betreffend", "wasangeht"], ["hinsichtlich", "maessig"], ["hinsichtlich", "wasangeht"], ["maessig", "wasangeht"], ["pin", "pin-nummer"], ["geheimzahl", "pin-nummer"], ["geheimzahl", "pin"], ["gewaehrleisten", "sorgen"], ["sichern", "sorgen"], ["angeloben", "sorgen"], ["sicherstellen", "sorgen"], ["garantieren", "sorgen"], ["gewaehrleisten", "sichern"], ["angeloben", "gewaehrleisten"], ["gewaehrleisten", "sicherstellen"], ["garantieren", "gewaehrleisten"], ["angeloben", "sichern"], ["garantieren", "sichern"], ["angeloben", "sicherstellen"], ["angeloben", "garantieren"], ["garantieren", "sicherstellen"], ["bergen", "verlegen"], ["abtransportieren", "bergen"], ["bergen", "evakuieren"], ["abtransportieren", "verlegen"], ["evakuieren", "verlegen"], ["abtransportieren", "evakuieren"], ["kommen", "sichbegeben"], ["besuchen", "sichbegeben"], ["aufsuchen", "sichbegeben"], ["sichbegeben", "visitieren"], ["besuchen", "kommen"], ["aufsuchen", "kommen"], ["kommen", "visitieren"], ["aufsuchen", "besuchen"], ["besuchen", "visitieren"], ["aufsuchen", "visitieren"], ["rueckbank", "ruecksitz"], ["rueckbank", "ruecksitzbank"], ["fond", "rueckbank"], ["fondsitz", "rueckbank"], ["ruecksitz", "ruecksitzbank"], ["fond", "ruecksitz"], ["fondsitz", "ruecksitz"], ["fond", "ruecksitzbank"], ["fondsitz", "ruecksitzbank"], ["fond", "fondsitz"], ["hut", "muetze"], ["haube", "muetze"], ["kappe", "muetze"], ["cap", "muetze"], ["haube", "hut"], ["hut", "kappe"], ["cap", "hut"], ["haube", "kappe"], ["cap", "haube"], ["cap", "kappe"], ["kuchenstueck", "stueck"], ["kuchenstueck", "schnitte"], ["kuchenstueck", "tortenstueck"], ["ecke", "kuchenstueck"], ["schnitte", "stueck"], ["stueck", "tortenstueck"], ["ecke", "stueck"], ["schnitte", "tortenstueck"], ["ecke", "schnitte"], ["ecke", "tortenstueck"], ["schwund", "verminderung"], ["verlust", "verminderung"], ["schlupf", "verminderung"], ["entweichen", "verminderung"], ["verminderung", "verschwinden"], ["schwund", "verlust"], ["schlupf", "schwund"], ["entweichen", "schwund"], ["schwund", "verschwinden"], ["schlupf", "verlust"], ["entweichen", "verlust"], ["verlust", "verschwinden"], ["entweichen", "schlupf"], ["schlupf", "verschwinden"], ["entweichen", "verschwinden"], ["eintritt", "zufahrt"], ["eingang", "zufahrt"], ["einfahrt", "zufahrt"], ["zufahrt", "zugang"], ["eingang", "eintritt"], ["einfahrt", "eintritt"], ["eintritt", "zugang"], ["einfahrt", "eingang"], ["eingang", "zugang"], ["einfahrt", "zugang"], ["festdrehen", "festschrauben"], ["festschrauben", "festziehen"], ["anziehen", "festschrauben"], ["festdrehen", "festziehen"], ["anziehen", "festdrehen"], ["anziehen", "festziehen"], ["arbeitsablauf", "arbeitsfolge"], ["arbeitsfolge", "geschaeftsprozess"], ["arbeitsfolge", "workflow"], ["arbeitsfolge", "arbeitsgang"], ["arbeitsablauf", "geschaeftsprozess"], ["arbeitsablauf", "workflow"], ["arbeitsablauf", "arbeitsgang"], ["geschaeftsprozess", "workflow"], ["arbeitsgang", "geschaeftsprozess"], ["arbeitsgang", "workflow"], ["schalten", "veroeffentlichen"], ["inserieren", "schalten"], ["annoncieren", "schalten"], ["anzeigen", "schalten"], ["aufgeben", "schalten"], ["inserieren", "veroeffentlichen"], ["annoncieren", "veroeffentlichen"], ["anzeigen", "veroeffentlichen"], ["aufgeben", "veroeffentlichen"], ["annoncieren", "inserieren"], ["anzeigen", "inserieren"], ["aufgeben", "inserieren"], ["annoncieren", "anzeigen"], ["annoncieren", "aufgeben"], ["anzeigen", "aufgeben"], ["nieten", "vernieten"], ["ausbauen", "ausdehnen"], ["aufstocken", "ausdehnen"], ["ausdehnen", "hinzugewinnen"], ["ausdehnen", "dazugewinnen"], ["ausdehnen", "vergroessern"], ["ausdehnen", "zulegen"], ["aufstocken", "ausbauen"], ["ausbauen", "hinzugewinnen"], ["ausbauen", "dazugewinnen"], ["ausbauen", "vergroessern"], ["ausbauen", "zulegen"], ["aufstocken", "hinzugewinnen"], ["aufstocken", "dazugewinnen"], ["aufstocken", "vergroessern"], ["aufstocken", "zulegen"], ["dazugewinnen", "hinzugewinnen"], ["hinzugewinnen", "vergroessern"], ["hinzugewinnen", "zulegen"], ["dazugewinnen", "vergroessern"], ["dazugewinnen", "zulegen"], ["vergroessern", "zulegen"], ["entblockung", "oeffnung"], ["entblockung", "freigabe"], ["freigabe", "oeffnung"], ["taxativ", "vollstaendig"], ["flaechendeckend", "vollstaendig"], ["abstandslos", "vollstaendig"], ["integral", "vollstaendig"], ["lueckenlos", "vollstaendig"], ["flaechendeckend", "taxativ"], ["abstandslos", "taxativ"], ["integral", "taxativ"], ["lueckenlos", "taxativ"], ["abstandslos", "flaechendeckend"], ["flaechendeckend", "integral"], ["flaechendeckend", "lueckenlos"], ["abstandslos", "integral"], ["abstandslos", "lueckenlos"], ["integral", "lueckenlos"], ["schauspiel", "spiel"], ["schauspiel", "stueck"], ["repertoirestueck", "schauspiel"], ["buehnenstueck", "schauspiel"], ["schauspiel", "theaterstueck"], ["drama", "schauspiel"], ["spiel", "stueck"], ["repertoirestueck", "spiel"], ["buehnenstueck", "spiel"], ["spiel", "theaterstueck"], ["drama", "spiel"], ["repertoirestueck", "stueck"], ["buehnenstueck", "stueck"], ["stueck", "theaterstueck"], ["drama", "stueck"], ["buehnenstueck", "repertoirestueck"], ["repertoirestueck", "theaterstueck"], ["drama", "repertoirestueck"], ["buehnenstueck", "theaterstueck"], ["buehnenstueck", "drama"], ["drama", "theaterstueck"], ["referat", "sektion"], ["abteilung", "sektion"], ["division", "sektion"], ["ressort", "sektion"], ["sachgebiet", "sektion"], ["gebiet", "sektion"], ["abteilung", "referat"], ["division", "referat"], ["referat", "ressort"], ["referat", "sachgebiet"], ["gebiet", "referat"], ["abteilung", "division"], ["abteilung", "ressort"], ["abteilung", "sachgebiet"], ["abteilung", "gebiet"], ["division", "ressort"], ["division", "sachgebiet"], ["division", "gebiet"], ["ressort", "sachgebiet"], ["gebiet", "ressort"], ["gebiet", "sachgebiet"], ["aeusseres", "aussenseite"], ["operation", "verfahren"], ["arbeitsgang", "verfahren"], ["arbeitsvorgang", "verfahren"], ["arbeitsgang", "operation"], ["arbeitsvorgang", "operation"], ["arbeitsgang", "arbeitsvorgang"], ["entourage", "milieu"], ["connection", "milieu"], ["milieu", "peripherie"], ["milieu", "umgebung"], ["milieu", "umfeld"], ["dunstkreis", "milieu"], ["connection", "entourage"], ["entourage", "peripherie"], ["entourage", "umgebung"], ["entourage", "umfeld"], ["dunstkreis", "entourage"], ["connection", "peripherie"], ["connection", "umgebung"], ["connection", "umfeld"], ["connection", "dunstkreis"], ["peripherie", "umgebung"], ["peripherie", "umfeld"], ["dunstkreis", "peripherie"], ["umfeld", "umgebung"], ["dunstkreis", "umgebung"], ["dunstkreis", "umfeld"], ["berechnen", "kalkulieren"], ["berechnen", "rechnen"], ["berechnen", "ermitteln"], ["kalkulieren", "rechnen"], ["ermitteln", "kalkulieren"], ["ermitteln", "rechnen"], ["lauf", "stroemung"], ["lauf", "strom"], ["stroemung", "strom"], ["anbinden", "verknuepfen"], ["anstoepseln", "verknuepfen"], ["verknuepfen", "vernetzen"], ["anklemmen", "verknuepfen"], ["verbinden", "verknuepfen"], ["konnektieren", "verknuepfen"], ["anschliessen", "verknuepfen"], ["anbinden", "anstoepseln"], ["anbinden", "vernetzen"], ["anbinden", "anklemmen"], ["anbinden", "verbinden"], ["anbinden", "konnektieren"], ["anbinden", "anschliessen"], ["anstoepseln", "vernetzen"], ["anklemmen", "anstoepseln"], ["anstoepseln", "verbinden"], ["anstoepseln", "konnektieren"], ["anschliessen", "anstoepseln"], ["anklemmen", "vernetzen"], ["verbinden", "vernetzen"], ["konnektieren", "vernetzen"], ["anschliessen", "vernetzen"], ["anklemmen", "verbinden"], ["anklemmen", "konnektieren"], ["anklemmen", "anschliessen"], ["konnektieren", "verbinden"], ["anschliessen", "verbinden"], ["anschliessen", "konnektieren"], ["gewaehrleistung", "sicherung"], ["gewaehrleistung", "sicherstellung"], ["sicherstellung", "sicherung"], ["entfernen", "liquidieren"], ["entfernen", "vernichten"], ["dahinraffen", "entfernen"], ["ausradieren", "entfernen"], ["ausloeschen", "entfernen"], ["aufreiben", "entfernen"], ["entfernen", "zerschlagen"], ["liquidieren", "vernichten"], ["dahinraffen", "liquidieren"], ["ausradieren", "liquidieren"], ["ausloeschen", "liquidieren"], ["aufreiben", "liquidieren"], ["liquidieren", "zerschlagen"], ["dahinraffen", "vernichten"], ["ausradieren", "vernichten"], ["ausloeschen", "vernichten"], ["aufreiben", "vernichten"], ["vernichten", "zerschlagen"], ["ausradieren", "dahinraffen"], ["ausloeschen", "dahinraffen"], ["aufreiben", "dahinraffen"], ["dahinraffen", "zerschlagen"], ["ausloeschen", "ausradieren"], ["aufreiben", "ausradieren"], ["ausradieren", "zerschlagen"], ["aufreiben", "ausloeschen"], ["ausloeschen", "zerschlagen"], ["aufreiben", "zerschlagen"], ["oben", "ueber"], ["ueber", "ueberhalb"], ["oberhalb", "ueber"], ["oben", "ueberhalb"], ["oben", "oberhalb"], ["oberhalb", "ueberhalb"], ["ausfolgen", "rueberschieben"], ["ausfolgen", "geben"], ["ausfolgen", "reichen"], ["ausfolgen", "ueberreichen"], ["ausfolgen", "uebergeben"], ["ausfolgen", "aushaendigen"], ["geben", "rueberschieben"], ["reichen", "rueberschieben"], ["rueberschieben", "ueberreichen"], ["rueberschieben", "uebergeben"], ["aushaendigen", "rueberschieben"], ["geben", "reichen"], ["geben", "ueberreichen"], ["geben", "uebergeben"], ["aushaendigen", "geben"], ["reichen", "ueberreichen"], ["reichen", "uebergeben"], ["aushaendigen", "reichen"], ["uebergeben", "ueberreichen"], ["aushaendigen", "ueberreichen"], ["aushaendigen", "uebergeben"], ["hinausgehen", "ueberschreiten"], ["hinausgehen", "knacken"], ["hinausgehen", "uebersteigen"], ["hinausgehen", "transzendieren"], ["knacken", "ueberschreiten"], ["ueberschreiten", "uebersteigen"], ["transzendieren", "ueberschreiten"], ["knacken", "uebersteigen"], ["knacken", "transzendieren"], ["transzendieren", "uebersteigen"], ["ganz", "saemtliche"], ["alle", "ganz"], ["allesamt", "ganz"], ["alle", "saemtliche"], ["allesamt", "saemtliche"], ["alle", "allesamt"], ["erhitzen", "heizen"], ["erhitzen", "erwaermen"], ["erwaermen", "heizen"], ["projekt", "vorhaben"], ["projekt", "unterfangen"], ["ansinnen", "projekt"], ["projekt", "unternehmung"], ["projekt", "streben"], ["projekt", "unternehmen"], ["unterfangen", "vorhaben"], ["ansinnen", "vorhaben"], ["unternehmung", "vorhaben"], ["streben", "vorhaben"], ["unternehmen", "vorhaben"], ["ansinnen", "unterfangen"], ["unterfangen", "unternehmung"], ["streben", "unterfangen"], ["unterfangen", "unternehmen"], ["ansinnen", "unternehmung"], ["ansinnen", "streben"], ["ansinnen", "unternehmen"], ["streben", "unternehmung"], ["unternehmen", "unternehmung"], ["streben", "unternehmen"], ["kalt", "kuehl"], ["frostig", "kalt"], ["frisch", "kalt"], ["frostig", "kuehl"], ["frisch", "kuehl"], ["frisch", "frostig"], ["ortsfest", "unbewegt"], ["ortsfest", "ruhig"], ["ortsfest", "ruhend"], ["ortsfest", "stationaer"], ["bewegungslos", "ortsfest"], ["ortsfest", "starr"], ["ruhig", "unbewegt"], ["ruhend", "unbewegt"], ["stationaer", "unbewegt"], ["bewegungslos", "unbewegt"], ["starr", "unbewegt"], ["ruhend", "ruhig"], ["ruhig", "stationaer"], ["bewegungslos", "ruhig"], ["ruhig", "starr"], ["ruhend", "stationaer"], ["bewegungslos", "ruhend"], ["ruhend", "starr"], ["bewegungslos", "stationaer"], ["starr", "stationaer"], ["bewegungslos", "starr"], ["anfangs", "erst"], ["erst", "initial"], ["erst", "zuerst"], ["erst", "zunaechst"], ["anfaenglich", "erst"], ["einleitend", "erst"], ["eingangs", "erst"], ["anfangs", "initial"], ["anfangs", "zuerst"], ["anfangs", "zunaechst"], ["anfaenglich", "anfangs"], ["anfangs", "einleitend"], ["anfangs", "eingangs"], ["initial", "zuerst"], ["initial", "zunaechst"], ["anfaenglich", "initial"], ["einleitend", "initial"], ["eingangs", "initial"], ["zuerst", "zunaechst"], ["anfaenglich", "zuerst"], ["einleitend", "zuerst"], ["eingangs", "zuerst"], ["anfaenglich", "zunaechst"], ["einleitend", "zunaechst"], ["eingangs", "zunaechst"], ["anfaenglich", "einleitend"], ["anfaenglich", "eingangs"], ["eingangs", "einleitend"], ["fressalien", "nahrungsmittel"], ["essen", "fressalien"], ["fressalien", "nahrung"], ["fressalien", "viktualien"], ["esswaren", "fressalien"], ["esssachen", "fressalien"], ["fressalien", "lebensmittel"], ["essen", "nahrungsmittel"], ["nahrung", "nahrungsmittel"], ["nahrungsmittel", "viktualien"], ["esswaren", "nahrungsmittel"], ["esssachen", "nahrungsmittel"], ["lebensmittel", "nahrungsmittel"], ["essen", "nahrung"], ["essen", "viktualien"], ["essen", "esswaren"], ["essen", "esssachen"], ["essen", "lebensmittel"], ["nahrung", "viktualien"], ["esswaren", "nahrung"], ["esssachen", "nahrung"], ["lebensmittel", "nahrung"], ["esswaren", "viktualien"], ["esssachen", "viktualien"], ["lebensmittel", "viktualien"], ["esssachen", "esswaren"], ["esswaren", "lebensmittel"], ["esssachen", "lebensmittel"], ["minus", "negativ"], ["challenge", "herausforderung"], ["herausforderung", "pruefung"], ["aufgabe", "herausforderung"], ["challenge", "pruefung"], ["aufgabe", "challenge"], ["aufgabe", "pruefung"], ["belag", "film"], ["film", "verguetung"], ["film", "schicht"], ["belag", "verguetung"], ["schicht", "verguetung"], ["schrift", "schriftart"], ["font", "schriftart"], ["schriftart", "type"], ["font", "schrift"], ["schrift", "type"], ["font", "type"], ["belasten", "berechnen"], ["lateral", "seitlich"], ["abbildung", "schaubild"], ["kurvenblatt", "schaubild"], ["schaubild", "tabelle"], ["diagramm", "schaubild"], ["abbildung", "kurvenblatt"], ["abbildung", "tabelle"], ["abbildung", "diagramm"], ["kurvenblatt", "tabelle"], ["diagramm", "kurvenblatt"], ["diagramm", "tabelle"], ["abtransport", "beseitigung"], ["abtransport", "entfernung"], ["abfuhr", "abtransport"], ["abtransport", "fortschaffung"], ["beseitigung", "entfernung"], ["abfuhr", "beseitigung"], ["beseitigung", "fortschaffung"], ["abfuhr", "entfernung"], ["entfernung", "fortschaffung"], ["abfuhr", "fortschaffung"], ["empfehlung", "zeugnis"], ["empfehlung", "empfehlungsschreiben"], ["empfehlung", "empfehlungsbrief"], ["empfehlung", "referenz"], ["empfehlung", "referenzschreiben"], ["empfehlungsschreiben", "zeugnis"], ["empfehlungsbrief", "zeugnis"], ["referenz", "zeugnis"], ["referenzschreiben", "zeugnis"], ["empfehlungsbrief", "empfehlungsschreiben"], ["empfehlungsschreiben", "referenz"], ["empfehlungsschreiben", "referenzschreiben"], ["empfehlungsbrief", "referenz"], ["empfehlungsbrief", "referenzschreiben"], ["referenz", "referenzschreiben"], ["teilen", "zerstueckeln"], ["aufteilen", "teilen"], ["spalten", "teilen"], ["aufspalten", "teilen"], ["aufteilen", "zerstueckeln"], ["spalten", "zerstueckeln"], ["aufspalten", "zerstueckeln"], ["aufteilen", "spalten"], ["aufspalten", "aufteilen"], ["aufspalten", "spalten"], ["assimilieren", "gleichmachen"], ["fluchten", "gleichmachen"], ["anpassen", "gleichmachen"], ["gleichmachen", "nivellieren"], ["ausgleichen", "gleichmachen"], ["assimilieren", "fluchten"], ["anpassen", "assimilieren"], ["assimilieren", "nivellieren"], ["assimilieren", "ausgleichen"], ["anpassen", "fluchten"], ["fluchten", "nivellieren"], ["ausgleichen", "fluchten"], ["anpassen", "nivellieren"], ["anpassen", "ausgleichen"], ["ausgleichen", "nivellieren"], ["beendung", "terminierung"], ["abschluss", "terminierung"], ["erledigung", "terminierung"], ["beendigung", "terminierung"], ["einstellung", "terminierung"], ["abschluss", "beendung"], ["beendung", "erledigung"], ["beendigung", "beendung"], ["beendung", "einstellung"], ["abschluss", "erledigung"], ["abschluss", "beendigung"], ["abschluss", "einstellung"], ["beendigung", "erledigung"], ["einstellung", "erledigung"], ["beendigung", "einstellung"], ["spruchbanner", "transparent"], ["banner", "spruchbanner"], ["banner", "transparent"], ["diagonal", "zwerch"], ["schraeg", "zwerch"], ["diagonal", "schraeg"], ["abziehen", "kopieren"], ["klonieren", "kopieren"], ["klonen", "kopieren"], ["kopieren", "vervielfaeltigen"], ["duplizieren", "kopieren"], ["kopieren", "replizieren"], ["abziehen", "klonieren"], ["abziehen", "klonen"], ["abziehen", "vervielfaeltigen"], ["abziehen", "duplizieren"], ["abziehen", "replizieren"], ["klonen", "klonieren"], ["klonieren", "vervielfaeltigen"], ["duplizieren", "klonieren"], ["klonieren", "replizieren"], ["klonen", "vervielfaeltigen"], ["duplizieren", "klonen"], ["klonen", "replizieren"], ["duplizieren", "vervielfaeltigen"], ["replizieren", "vervielfaeltigen"], ["duplizieren", "replizieren"], ["eingreifen", "intervention"], ["eingreifen", "eingriff"], ["eingreifen", "einmischung"], ["eingriff", "intervention"], ["einmischung", "intervention"], ["eingriff", "einmischung"], ["austritt", "trennung"], ["auseinandergehen", "austritt"], ["abschied", "austritt"], ["ausscheiden", "austritt"], ["austritt", "weggang"], ["austritt", "lebewohl"], ["auseinandergehen", "trennung"], ["abschied", "trennung"], ["ausscheiden", "trennung"], ["trennung", "weggang"], ["lebewohl", "trennung"], ["abschied", "auseinandergehen"], ["auseinandergehen", "ausscheiden"], ["auseinandergehen", "weggang"], ["auseinandergehen", "lebewohl"], ["abschied", "ausscheiden"], ["abschied", "weggang"], ["abschied", "lebewohl"], ["ausscheiden", "weggang"], ["ausscheiden", "lebewohl"], ["lebewohl", "weggang"], ["kuerzel", "zeichen"], ["beschraenkung", "deckelung"], ["beschraenkung", "zwang"], ["beschraenkung", "einengung"], ["beschraenkung", "restriktion"], ["begrenzung", "beschraenkung"], ["beschraenkung", "einschraenkung"], ["deckelung", "zwang"], ["deckelung", "einengung"], ["deckelung", "restriktion"], ["begrenzung", "deckelung"], ["deckelung", "einschraenkung"], ["einengung", "zwang"], ["restriktion", "zwang"], ["begrenzung", "zwang"], ["einschraenkung", "zwang"], ["einengung", "restriktion"], ["begrenzung", "einengung"], ["einengung", "einschraenkung"], ["begrenzung", "restriktion"], ["einschraenkung", "restriktion"], ["begrenzung", "einschraenkung"], ["fuellung", "ladung"], ["bestueckung", "fuellung"], ["bestueckung", "ladung"], ["kraeftig", "kraftvoll"], ["kaempferisch", "kraftvoll"], ["kraftvoll", "machtvoll"], ["kraftvoll", "stark"], ["baerenstark", "kraftvoll"], ["kraftstrotzend", "kraftvoll"], ["kaempferisch", "kraeftig"], ["kraeftig", "machtvoll"], ["kraeftig", "stark"], ["baerenstark", "kraeftig"], ["kraeftig", "kraftstrotzend"], ["kaempferisch", "machtvoll"], ["kaempferisch", "stark"], ["baerenstark", "kaempferisch"], ["kaempferisch", "kraftstrotzend"], ["machtvoll", "stark"], ["baerenstark", "machtvoll"], ["kraftstrotzend", "machtvoll"], ["baerenstark", "stark"], ["kraftstrotzend", "stark"], ["baerenstark", "kraftstrotzend"], ["kraft", "staerke"], ["einfluss", "staerke"], ["einfluss", "kraft"], ["stecker", "steckkontakt"], ["anschluss", "steckkontakt"], ["buchse", "steckkontakt"], ["anschluss", "stecker"], ["buchse", "stecker"], ["anschluss", "buchse"], ["scheinwerfer", "scheinwerferlicht"], ["eingabe", "input"], ["eintrag", "input"], ["eingabe", "eintrag"], ["anleitung", "leitfaden"], ["anleitung", "richtschnur"], ["anleitung", "handbuch"], ["anleitung", "manual"], ["anleitung", "benutzerhandbuch"], ["anleitung", "ariadnefaden"], ["leitfaden", "richtschnur"], ["handbuch", "leitfaden"], ["leitfaden", "manual"], ["benutzerhandbuch", "leitfaden"], ["ariadnefaden", "leitfaden"], ["handbuch", "richtschnur"], ["manual", "richtschnur"], ["benutzerhandbuch", "richtschnur"], ["ariadnefaden", "richtschnur"], ["handbuch", "manual"], ["benutzerhandbuch", "handbuch"], ["ariadnefaden", "handbuch"], ["benutzerhandbuch", "manual"], ["ariadnefaden", "manual"], ["ariadnefaden", "benutzerhandbuch"], ["extra", "gesondert"], ["extra", "gewidmet"], ["extra", "spezifisch"], ["extra", "speziell"], ["dediziert", "extra"], ["gesondert", "gewidmet"], ["gesondert", "spezifisch"], ["gesondert", "speziell"], ["dediziert", "gesondert"], ["gewidmet", "spezifisch"], ["gewidmet", "speziell"], ["dediziert", "gewidmet"], ["speziell", "spezifisch"], ["dediziert", "spezifisch"], ["dediziert", "speziell"], ["erstmal", "primaer"], ["erstmal", "zuvoerderst"], ["erstmal", "zuerst"], ["erstmal", "zunaechst"], ["erstmal", "vorrangig"], ["primaer", "zuvoerderst"], ["primaer", "zuerst"], ["primaer", "zunaechst"], ["primaer", "vorrangig"], ["zuerst", "zuvoerderst"], ["zunaechst", "zuvoerderst"], ["vorrangig", "zuvoerderst"], ["vorrangig", "zuerst"], ["vorrangig", "zunaechst"], ["hoer", "ton"], ["langen", "ueberbekommen"], ["langen", "muede"], ["langen", "reichen"], ["muede", "ueberbekommen"], ["reichen", "ueberbekommen"], ["muede", "reichen"], ["fokus", "mittelpunkt"], ["fokus", "hauptaugenmerk"], ["fokus", "kern"], ["fokus", "schwerpunkt"], ["fokus", "wesentliche"], ["hauptaugenmerk", "mittelpunkt"], ["kern", "mittelpunkt"], ["mittelpunkt", "schwerpunkt"], ["mittelpunkt", "wesentliche"], ["hauptaugenmerk", "kern"], ["hauptaugenmerk", "schwerpunkt"], ["hauptaugenmerk", "wesentliche"], ["kern", "schwerpunkt"], ["kern", "wesentliche"], ["schwerpunkt", "wesentliche"], ["verschlossen", "versperrt"], ["abgeschlossen", "versperrt"], ["abgesperrt", "versperrt"], ["verriegelt", "versperrt"], ["dicht", "versperrt"], ["abgeschlossen", "verschlossen"], ["abgesperrt", "verschlossen"], ["verriegelt", "verschlossen"], ["dicht", "verschlossen"], ["abgeschlossen", "abgesperrt"], ["abgeschlossen", "verriegelt"], ["abgeschlossen", "dicht"], ["abgesperrt", "verriegelt"], ["abgesperrt", "dicht"], ["dicht", "verriegelt"], ["leistungsnachweis", "pruefung"], ["leistungsnachweis", "test"], ["auffinden", "finden"], ["finden", "vorfinden"], ["antreffen", "finden"], ["begegnen", "finden"], ["entdecken", "finden"], ["auffinden", "vorfinden"], ["antreffen", "auffinden"], ["auffinden", "begegnen"], ["auffinden", "entdecken"], ["antreffen", "vorfinden"], ["begegnen", "vorfinden"], ["entdecken", "vorfinden"], ["antreffen", "begegnen"], ["antreffen", "entdecken"], ["begegnen", "entdecken"], ["note", "schulnote"], ["note", "zensur"], ["beurteilung", "note"], ["note", "zeugniszensur"], ["schulnote", "zensur"], ["beurteilung", "schulnote"], ["schulnote", "zeugniszensur"], ["beurteilung", "zensur"], ["zensur", "zeugniszensur"], ["beurteilung", "zeugniszensur"], ["selbst", "sogar"], ["auch", "sogar"], ["auch", "selbst"], ["angleichung", "optimierung"], ["angleichung", "aussteuerung"], ["angleichung", "steuerung"], ["aussteuerung", "optimierung"], ["optimierung", "steuerung"], ["aussteuerung", "steuerung"], ["gross", "weit"], ["ausgedehnt", "gross"], ["gross", "weitlaeufig"], ["ausgedehnt", "weit"], ["weit", "weitlaeufig"], ["ausgedehnt", "weitlaeufig"], ["abrufbar", "zugaenglich"], ["abrufbar", "erhaeltlich"], ["abrufbar", "verfuegbar"], ["erhaeltlich", "zugaenglich"], ["verfuegbar", "zugaenglich"], ["erhaeltlich", "verfuegbar"], ["scharte", "spalt"], ["inzision", "scharte"], ["scharte", "spalte"], ["einschnitt", "scharte"], ["kerbe", "scharte"], ["inzision", "spalt"], ["einschnitt", "spalt"], ["kerbe", "spalt"], ["inzision", "spalte"], ["einschnitt", "inzision"], ["inzision", "kerbe"], ["einschnitt", "spalte"], ["kerbe", "spalte"], ["einschnitt", "kerbe"], ["ursprung", "wurzel"], ["herkunft", "wurzel"], ["quell", "wurzel"], ["quelle", "wurzel"], ["ursache", "wurzel"], ["herkunft", "ursprung"], ["quell", "ursprung"], ["quelle", "ursprung"], ["ursache", "ursprung"], ["herkunft", "quell"], ["herkunft", "quelle"], ["herkunft", "ursache"], ["quell", "quelle"], ["quell", "ursache"], ["quelle", "ursache"], ["anzahl", "zahl"], ["befoerderer", "beschleuniger"], ["befoerderer", "katalysator"], ["befoerderer", "kat"], ["beschleuniger", "katalysator"], ["beschleuniger", "kat"], ["kat", "katalysator"], ["avanti", "schnell"], ["avanti", "beeilung"], ["avanti", "mach"], ["avanti", "los"], ["avanti", "yallah"], ["avanti", "vamos"], ["avanti", "bewegung"], ["beeilung", "schnell"], ["mach", "schnell"], ["los", "schnell"], ["schnell", "yallah"], ["schnell", "vamos"], ["bewegung", "schnell"], ["beeilung", "mach"], ["beeilung", "los"], ["beeilung", "yallah"], ["beeilung", "vamos"], ["beeilung", "bewegung"], ["los", "mach"], ["mach", "yallah"], ["mach", "vamos"], ["bewegung", "mach"], ["los", "yallah"], ["los", "vamos"], ["bewegung", "los"], ["vamos", "yallah"], ["bewegung", "yallah"], ["bewegung", "vamos"], ["mutieren", "veraendern"], ["mutieren", "verwandeln"], ["drehen", "mutieren"], ["aendern", "mutieren"], ["mutieren", "wandeln"], ["mutieren", "wechseln"], ["veraendern", "verwandeln"], ["drehen", "veraendern"], ["veraendern", "wandeln"], ["veraendern", "wechseln"], ["drehen", "verwandeln"], ["aendern", "verwandeln"], ["verwandeln", "wandeln"], ["verwandeln", "wechseln"], ["aendern", "drehen"], ["drehen", "wandeln"], ["drehen", "wechseln"], ["aendern", "wandeln"], ["aendern", "wechseln"], ["wandeln", "wechseln"], ["regenerierung", "ueberholung"], ["recovery", "ueberholung"], ["erneuerung", "ueberholung"], ["ueberholung", "wiederherstellung"], ["neuerstellung", "ueberholung"], ["aufarbeitung", "ueberholung"], ["remanufacturing", "ueberholung"], ["recovery", "regenerierung"], ["erneuerung", "regenerierung"], ["regenerierung", "wiederherstellung"], ["neuerstellung", "regenerierung"], ["aufarbeitung", "regenerierung"], ["regenerierung", "remanufacturing"], ["erneuerung", "recovery"], ["recovery", "wiederherstellung"], ["neuerstellung", "recovery"], ["aufarbeitung", "recovery"], ["recovery", "remanufacturing"], ["erneuerung", "wiederherstellung"], ["erneuerung", "neuerstellung"], ["erneuerung", "remanufacturing"], ["neuerstellung", "wiederherstellung"], ["aufarbeitung", "wiederherstellung"], ["remanufacturing", "wiederherstellung"], ["aufarbeitung", "neuerstellung"], ["neuerstellung", "remanufacturing"], ["aufarbeitung", "remanufacturing"], ["mitarbeit", "mithilfe"], ["kooperation", "mitarbeit"], ["mitarbeit", "zusammenwirken"], ["mitarbeit", "zusammenspiel"], ["mitarbeit", "zusammenarbeit"], ["mitarbeit", "unterstuetzung"], ["kooperation", "mithilfe"], ["mithilfe", "zusammenwirken"], ["mithilfe", "zusammenspiel"], ["mithilfe", "zusammenarbeit"], ["mithilfe", "unterstuetzung"], ["kooperation", "zusammenwirken"], ["kooperation", "zusammenspiel"], ["kooperation", "zusammenarbeit"], ["kooperation", "unterstuetzung"], ["zusammenspiel", "zusammenwirken"], ["zusammenarbeit", "zusammenwirken"], ["unterstuetzung", "zusammenwirken"], ["zusammenarbeit", "zusammenspiel"], ["unterstuetzung", "zusammenspiel"], ["unterstuetzung", "zusammenarbeit"], ["versehen", "versehentlich"], ["unachtsamerweise", "versehen"], ["unachtsamerweise", "versehentlich"], ["meiden", "vermeiden"], ["meiden", "vermeidung"], ["meiden", "umgehung"], ["bypass", "meiden"], ["vermeiden", "vermeidung"], ["umgehung", "vermeiden"], ["bypass", "vermeiden"], ["umgehung", "vermeidung"], ["bypass", "vermeidung"], ["bypass", "umgehung"], ["diameter", "durchmesser"], ["anbringen", "festmachen"], ["befestigen", "festmachen"], ["festmachen", "montieren"], ["anfuegen", "festmachen"], ["anbringen", "befestigen"], ["anbringen", "montieren"], ["anbringen", "anfuegen"], ["befestigen", "montieren"], ["anfuegen", "montieren"], ["herzeigen", "praesentieren"], ["praesentieren", "spazierenfuehren"], ["herzeigen", "spazierenfuehren"], ["herzeigen", "zeigen"], ["spazierenfuehren", "zeigen"], ["auspraegen", "formen"], ["bilden", "formen"], ["fassonieren", "formen"], ["ausbilden", "formen"], ["formen", "gestalten"], ["formen", "praegen"], ["auspraegen", "bilden"], ["auspraegen", "fassonieren"], ["ausbilden", "auspraegen"], ["auspraegen", "gestalten"], ["auspraegen", "praegen"], ["bilden", "fassonieren"], ["ausbilden", "bilden"], ["bilden", "gestalten"], ["bilden", "praegen"], ["ausbilden", "fassonieren"], ["fassonieren", "gestalten"], ["fassonieren", "praegen"], ["ausbilden", "gestalten"], ["ausbilden", "praegen"], ["gestalten", "praegen"], ["verfuegung", "verordnung"], ["verordnung", "vorgabe"], ["verordnung", "vorschrift"], ["order", "verordnung"], ["regel", "verordnung"], ["richtlinie", "verordnung"], ["verfuegung", "vorgabe"], ["verfuegung", "vorschrift"], ["order", "verfuegung"], ["regel", "verfuegung"], ["richtlinie", "verfuegung"], ["vorgabe", "vorschrift"], ["order", "vorgabe"], ["regel", "vorgabe"], ["richtlinie", "vorgabe"], ["order", "vorschrift"], ["regel", "vorschrift"], ["richtlinie", "vorschrift"], ["order", "regel"], ["order", "richtlinie"], ["regel", "richtlinie"], ["griff", "handgriff"], ["haltegriff", "handgriff"], ["griff", "haltegriff"], ["korrekt", "salonfaehig"], ["anstaendig", "korrekt"], ["einwandfrei", "korrekt"], ["anstaendig", "salonfaehig"], ["einwandfrei", "salonfaehig"], ["anstaendig", "einwandfrei"], ["abliefern", "versorgen"], ["einkoppeln", "versorgen"], ["liefern", "versorgen"], ["einspeisen", "versorgen"], ["abliefern", "einkoppeln"], ["abliefern", "liefern"], ["abliefern", "einspeisen"], ["einkoppeln", "liefern"], ["einkoppeln", "einspeisen"], ["einspeisen", "liefern"], ["aroma", "duft"], ["duft", "odeur"], ["duft", "odor"], ["duft", "geruch"], ["ausduenstung", "duft"], ["aroma", "odeur"], ["aroma", "odor"], ["aroma", "geruch"], ["aroma", "ausduenstung"], ["odeur", "odor"], ["geruch", "odeur"], ["ausduenstung", "odeur"], ["geruch", "odor"], ["ausduenstung", "odor"], ["ausduenstung", "geruch"], ["nachschauen", "nachschlagen"], ["nachlesen", "nachschauen"], ["nachblaettern", "nachschauen"], ["nachschlagen", "nachsehen"], ["nachlesen", "nachschlagen"], ["nachblaettern", "nachschlagen"], ["nachlesen", "nachsehen"], ["nachblaettern", "nachsehen"], ["nachblaettern", "nachlesen"], ["anschliessen", "einiggehen"], ["anschliessen", "unterschreiben"], ["anschliessen", "zustimmen"], ["anschliessen", "uebereinstimmen"], ["anschliessen", "beipflichten"], ["anschliessen", "konformgehen"], ["einiggehen", "unterschreiben"], ["einiggehen", "zustimmen"], ["einiggehen", "uebereinstimmen"], ["beipflichten", "einiggehen"], ["einiggehen", "konformgehen"], ["unterschreiben", "zustimmen"], ["uebereinstimmen", "unterschreiben"], ["beipflichten", "unterschreiben"], ["konformgehen", "unterschreiben"], ["uebereinstimmen", "zustimmen"], ["beipflichten", "zustimmen"], ["konformgehen", "zustimmen"], ["beipflichten", "uebereinstimmen"], ["konformgehen", "uebereinstimmen"], ["beipflichten", "konformgehen"], ["eine", "jemand"], ["jemand", "wer"], ["jemand", "unbekannter"], ["einer", "jemand"], ["irgendeiner", "jemand"], ["irgendwer", "jemand"], ["irgendjemand", "jemand"], ["eine", "wer"], ["eine", "unbekannter"], ["eine", "einer"], ["eine", "irgendeiner"], ["eine", "irgendwer"], ["eine", "irgendjemand"], ["unbekannter", "wer"], ["einer", "wer"], ["irgendeiner", "wer"], ["irgendwer", "wer"], ["irgendjemand", "wer"], ["einer", "unbekannter"], ["irgendeiner", "unbekannter"], ["irgendwer", "unbekannter"], ["irgendjemand", "unbekannter"], ["einer", "irgendeiner"], ["einer", "irgendwer"], ["einer", "irgendjemand"], ["irgendeiner", "irgendwer"], ["irgendeiner", "irgendjemand"], ["irgendjemand", "irgendwer"], ["frontpage", "leitseite"], ["homepage", "leitseite"], ["indexseite", "leitseite"], ["leitseite", "startseite"], ["einstiegsseite", "leitseite"], ["hauptseite", "leitseite"], ["leitseite", "titelseite"], ["frontpage", "homepage"], ["frontpage", "indexseite"], ["frontpage", "startseite"], ["einstiegsseite", "frontpage"], ["frontpage", "hauptseite"], ["frontpage", "titelseite"], ["homepage", "indexseite"], ["homepage", "startseite"], ["einstiegsseite", "homepage"], ["hauptseite", "homepage"], ["homepage", "titelseite"], ["indexseite", "startseite"], ["einstiegsseite", "indexseite"], ["hauptseite", "indexseite"], ["indexseite", "titelseite"], ["einstiegsseite", "startseite"], ["hauptseite", "startseite"], ["startseite", "titelseite"], ["einstiegsseite", "hauptseite"], ["einstiegsseite", "titelseite"], ["hauptseite", "titelseite"], ["zuordnung", "zuteilung"], ["belegung", "zuordnung"], ["zuteilung", "zuweisung"], ["belegung", "zuteilung"], ["belegung", "zuweisung"], ["hinweis", "proposition"], ["proposition", "vorschlag"], ["proposition", "ratschlag"], ["proposition", "rat"], ["proposition", "tipp"], ["empfehlung", "proposition"], ["hinweis", "vorschlag"], ["hinweis", "ratschlag"], ["hinweis", "rat"], ["hinweis", "tipp"], ["empfehlung", "hinweis"], ["ratschlag", "vorschlag"], ["rat", "vorschlag"], ["tipp", "vorschlag"], ["empfehlung", "vorschlag"], ["rat", "ratschlag"], ["ratschlag", "tipp"], ["empfehlung", "ratschlag"], ["rat", "tipp"], ["empfehlung", "rat"], ["empfehlung", "tipp"], ["analysieren", "aufgliedern"], ["aufgliedern", "zergliedern"], ["aufgliedern", "zerlegen"], ["analysieren", "zergliedern"], ["analysieren", "zerlegen"], ["zergliedern", "zerlegen"], ["beschreiben", "darlegen"], ["ausfuehren", "darlegen"], ["darlegen", "resuemieren"], ["darlegen", "referieren"], ["darlegen", "darstellen"], ["ausfuehren", "beschreiben"], ["beschreiben", "resuemieren"], ["beschreiben", "referieren"], ["beschreiben", "darstellen"], ["ausfuehren", "resuemieren"], ["ausfuehren", "referieren"], ["ausfuehren", "darstellen"], ["referieren", "resuemieren"], ["darstellen", "resuemieren"], ["darstellen", "referieren"], ["abmontieren", "losschrauben"], ["abschrauben", "losschrauben"], ["abmontieren", "abschrauben"], ["ueberaus", "uebertrieben"], ["allzu", "uebertrieben"], ["uebermaessig", "uebertrieben"], ["ueber", "uebertrieben"], ["uebertrieben", "unverhaeltnismaessig"], ["allzu", "ueberaus"], ["ueberaus", "uebermaessig"], ["ueber", "ueberaus"], ["ueberaus", "unverhaeltnismaessig"], ["allzu", "uebermaessig"], ["allzu", "ueber"], ["allzu", "unverhaeltnismaessig"], ["ueber", "uebermaessig"], ["uebermaessig", "unverhaeltnismaessig"], ["ueber", "unverhaeltnismaessig"], ["eben", "frisch"], ["eben", "just"], ["eben", "justament"], ["eben", "gerade"], ["eben", "soeben"], ["eben", "grade"], ["frisch", "just"], ["frisch", "justament"], ["frisch", "gerade"], ["frisch", "soeben"], ["frisch", "grade"], ["just", "justament"], ["gerade", "just"], ["just", "soeben"], ["grade", "just"], ["gerade", "justament"], ["justament", "soeben"], ["grade", "justament"], ["gerade", "soeben"], ["gerade", "grade"], ["grade", "soeben"], ["behaeltnis", "gefaess"], ["behaelter", "behaeltnis"], ["aufbewahrungsloesung", "behaeltnis"], ["behaeltnis", "container"], ["behaelter", "gefaess"], ["aufbewahrungsloesung", "gefaess"], ["container", "gefaess"], ["aufbewahrungsloesung", "behaelter"], ["behaelter", "container"], ["aufbewahrungsloesung", "container"], ["abfall", "sinken"], ["fallen", "sinken"], ["niedergang", "sinken"], ["sinken", "untergang"], ["fall", "sinken"], ["sinken", "sturz"], ["abfall", "fallen"], ["abfall", "niedergang"], ["abfall", "untergang"], ["abfall", "fall"], ["abfall", "sturz"], ["fallen", "niedergang"], ["fallen", "untergang"], ["fall", "fallen"], ["fallen", "sturz"], ["niedergang", "untergang"], ["fall", "niedergang"], ["niedergang", "sturz"], ["fall", "untergang"], ["sturz", "untergang"], ["fall", "sturz"], ["anlasser", "starter"], ["abspeichern", "speichern"], ["sichern", "speichern"], ["speichern", "zwischenspeichern"], ["abspeichern", "sichern"], ["abspeichern", "zwischenspeichern"], ["sichern", "zwischenspeichern"], ["verzogen", "windschief"], ["krumm", "verzogen"], ["verzogen", "wellig"], ["verbogen", "verzogen"], ["schief", "verzogen"], ["krumm", "windschief"], ["wellig", "windschief"], ["verbogen", "windschief"], ["schief", "windschief"], ["krumm", "wellig"], ["krumm", "verbogen"], ["krumm", "schief"], ["verbogen", "wellig"], ["schief", "wellig"], ["schief", "verbogen"], ["moeglichkeit", "opportunitaet"], ["anlass", "moeglichkeit"], ["gelegenheit", "opportunitaet"], ["anlass", "opportunitaet"], ["anlass", "gelegenheit"], ["achten", "erfuellen"], ["achten", "nachkommen"], ["achten", "einhalten"], ["beachten", "erfuellen"], ["erfuellen", "nachkommen"], ["einhalten", "erfuellen"], ["beachten", "nachkommen"], ["beachten", "einhalten"], ["einhalten", "nachkommen"], ["abwaschen", "aufwaschen"], ["abwaschen", "spuelen"], ["aufwaschen", "spuelen"], ["zugleich", "zusammen"], ["ablagerung", "ablegen"], ["abheften", "ablagerung"], ["ablage", "ablagerung"], ["ablagerung", "aufstapeln"], ["ablagerung", "kellern"], ["ablagekasten", "ablagerung"], ["abheften", "ablegen"], ["ablage", "ablegen"], ["ablegen", "aufstapeln"], ["ablegen", "kellern"], ["ablagekasten", "ablegen"], ["abheften", "ablage"], ["abheften", "aufstapeln"], ["abheften", "kellern"], ["abheften", "ablagekasten"], ["ablage", "aufstapeln"], ["ablage", "kellern"], ["ablage", "ablagekasten"], ["aufstapeln", "kellern"], ["ablagekasten", "aufstapeln"], ["ablagekasten", "kellern"], ["bleiben", "festhalten"], ["ebene", "flaeche"], ["einbringen", "hereinholen"], ["einspielen", "hereinholen"], ["abfallen", "hereinholen"], ["einfahren", "hereinholen"], ["abwerfen", "hereinholen"], ["erbringen", "hereinholen"], ["einbringen", "einspielen"], ["abfallen", "einbringen"], ["abwerfen", "einbringen"], ["einbringen", "erbringen"], ["abfallen", "einspielen"], ["einfahren", "einspielen"], ["abwerfen", "einspielen"], ["einspielen", "erbringen"], ["abfallen", "einfahren"], ["abfallen", "abwerfen"], ["abfallen", "erbringen"], ["abwerfen", "einfahren"], ["einfahren", "erbringen"], ["abwerfen", "erbringen"], ["verriegelung", "verschluss"], ["schliessmechanismus", "verriegelung"], ["schliessmechanismus", "verschluss"], ["hilfsmittel", "vorschub"], ["beihilfe", "vorschub"], ["beihilfe", "hilfsmittel"], ["innovativ", "neuartig"], ["neuartig", "originell"], ["neu", "neuartig"], ["frisch", "neuartig"], ["neo", "neuartig"], ["innovativ", "originell"], ["innovativ", "neu"], ["frisch", "innovativ"], ["innovativ", "neo"], ["neu", "originell"], ["frisch", "originell"], ["neo", "originell"], ["frisch", "neu"], ["neo", "neu"], ["frisch", "neo"], ["begrenzung", "limitierung"], ["begrenzung", "limitation"], ["limitation", "limitierung"], ["beschraenkung", "limitierung"], ["beschraenkung", "limitation"], ["einhuellen", "einwickeln"], ["einhuellen", "umlegen"], ["einhuellen", "umhuellen"], ["einhuellen", "huellen"], ["einhuellen", "wickeln"], ["einwickeln", "umlegen"], ["einwickeln", "umhuellen"], ["einwickeln", "huellen"], ["einwickeln", "wickeln"], ["umhuellen", "umlegen"], ["huellen", "umlegen"], ["umlegen", "wickeln"], ["huellen", "umhuellen"], ["umhuellen", "wickeln"], ["huellen", "wickeln"], ["abmagern", "abnehmen"], ["abnehmen", "entfetten"], ["abmagern", "entfetten"], ["motivation", "neigung"], ["hang", "motivation"], ["lust", "motivation"], ["interesse", "motivation"], ["drang", "motivation"], ["hang", "neigung"], ["lust", "neigung"], ["interesse", "neigung"], ["drang", "neigung"], ["hang", "lust"], ["hang", "interesse"], ["drang", "hang"], ["interesse", "lust"], ["drang", "lust"], ["drang", "interesse"], ["hauptsaechlich", "insbesondere"], ["groesstenteils", "insbesondere"], ["insbesondere", "vorrangig"], ["insbesondere", "vorwiegend"], ["insbesondere", "primaer"], ["insbesondere", "ueberwiegend"], ["insbesondere", "schwerpunktmaessig"], ["groesstenteils", "hauptsaechlich"], ["hauptsaechlich", "vorrangig"], ["hauptsaechlich", "vorwiegend"], ["hauptsaechlich", "primaer"], ["hauptsaechlich", "ueberwiegend"], ["hauptsaechlich", "schwerpunktmaessig"], ["groesstenteils", "vorrangig"], ["groesstenteils", "primaer"], ["groesstenteils", "schwerpunktmaessig"], ["vorrangig", "vorwiegend"], ["ueberwiegend", "vorrangig"], ["schwerpunktmaessig", "vorrangig"], ["primaer", "vorwiegend"], ["schwerpunktmaessig", "vorwiegend"], ["primaer", "ueberwiegend"], ["primaer", "schwerpunktmaessig"], ["schwerpunktmaessig", "ueberwiegend"], ["gemaess", "wie"], ["gemaess", "konform"], ["entsprechend", "gemaess"], ["gemaess", "nach"], ["gemaess", "zufolge"], ["konform", "wie"], ["entsprechend", "wie"], ["nach", "wie"], ["wie", "zufolge"], ["entsprechend", "konform"], ["konform", "nach"], ["konform", "zufolge"], ["entsprechend", "nach"], ["entsprechend", "zufolge"], ["nach", "zufolge"], ["verspaetung", "verzug"], ["verspaetung", "zeitverzoegerung"], ["verspaetung", "verzoegerung"], ["verzug", "zeitverzoegerung"], ["verzoegerung", "verzug"], ["verzoegerung", "zeitverzoegerung"], ["verdonnern", "vergattern"], ["anhalten", "verdonnern"], ["bestimmen", "verdonnern"], ["verdonnern", "verhaften"], ["einspannen", "verdonnern"], ["veranlassen", "verdonnern"], ["anhalten", "vergattern"], ["bestimmen", "vergattern"], ["vergattern", "verhaften"], ["einspannen", "vergattern"], ["veranlassen", "vergattern"], ["anhalten", "bestimmen"], ["anhalten", "verhaften"], ["anhalten", "einspannen"], ["anhalten", "veranlassen"], ["bestimmen", "verhaften"], ["bestimmen", "einspannen"], ["bestimmen", "veranlassen"], ["einspannen", "verhaften"], ["veranlassen", "verhaften"], ["einspannen", "veranlassen"], ["lueftung", "ventilierung"], ["belueftung", "ventilierung"], ["ventilation", "ventilierung"], ["luftzufuhr", "ventilierung"], ["lufterneuerung", "ventilierung"], ["entlueftung", "ventilierung"], ["luftversorgung", "ventilierung"], ["belueftung", "lueftung"], ["lueftung", "ventilation"], ["lueftung", "luftzufuhr"], ["lueftung", "lufterneuerung"], ["entlueftung", "lueftung"], ["lueftung", "luftversorgung"], ["belueftung", "ventilation"], ["belueftung", "luftzufuhr"], ["belueftung", "lufterneuerung"], ["belueftung", "entlueftung"], ["belueftung", "luftversorgung"], ["luftzufuhr", "ventilation"], ["lufterneuerung", "ventilation"], ["entlueftung", "ventilation"], ["luftversorgung", "ventilation"], ["lufterneuerung", "luftzufuhr"], ["entlueftung", "luftzufuhr"], ["luftversorgung", "luftzufuhr"], ["entlueftung", "lufterneuerung"], ["lufterneuerung", "luftversorgung"], ["entlueftung", "luftversorgung"], ["form", "gestalt"], ["aeusseres", "form"], ["aussehen", "form"], ["fasson", "form"], ["aeusseres", "gestalt"], ["aussehen", "gestalt"], ["fasson", "gestalt"], ["aeusseres", "aussehen"], ["aeusseres", "fasson"], ["aussehen", "fasson"], ["hoechstens", "max"], ["max", "maximal"], ["hoechstens", "maximal"], ["rand", "seite"], ["fluegel", "seite"], ["flanke", "seite"], ["fluegel", "rand"], ["flanke", "rand"], ["flanke", "fluegel"], ["abstimmen", "entscheidung"], ["abstimmung", "entscheidung"], ["entscheidung", "urteilsfindung"], ["abstimmen", "abstimmung"], ["abstimmen", "urteilsfindung"], ["abstimmung", "urteilsfindung"], ["schlecht", "unguenstig"], ["schaedlich", "unguenstig"], ["unguenstig", "widrig"], ["unguenstig", "ungut"], ["nachteilig", "unguenstig"], ["negativ", "unguenstig"], ["schaedlich", "schlecht"], ["schlecht", "widrig"], ["schlecht", "ungut"], ["nachteilig", "schlecht"], ["negativ", "schlecht"], ["schaedlich", "widrig"], ["schaedlich", "ungut"], ["nachteilig", "schaedlich"], ["negativ", "schaedlich"], ["ungut", "widrig"], ["nachteilig", "widrig"], ["negativ", "widrig"], ["nachteilig", "ungut"], ["negativ", "ungut"], ["nachteilig", "negativ"], ["kasten", "paeckchen"], ["kasten", "schachtel"], ["box", "kasten"], ["kasten", "packung"], ["paeckchen", "schachtel"], ["box", "paeckchen"], ["packung", "paeckchen"], ["box", "schachtel"], ["packung", "schachtel"], ["box", "packung"], ["ausgangspunkt", "startpunkt"], ["keimzelle", "startpunkt"], ["start", "startpunkt"], ["anlaufstelle", "startpunkt"], ["ausgangspunkt", "keimzelle"], ["ausgangspunkt", "start"], ["anlaufstelle", "ausgangspunkt"], ["keimzelle", "start"], ["anlaufstelle", "keimzelle"], ["anlaufstelle", "start"], ["geladen", "voll"], ["aufgeladen", "voll"], ["aufgeladen", "geladen"], ["auslese", "wahl"], ["auslese", "selektion"], ["auslese", "koerung"], ["auslese", "auswahl"], ["auslese", "bluetenlese"], ["selektion", "wahl"], ["koerung", "wahl"], ["auswahl", "wahl"], ["bluetenlese", "wahl"], ["koerung", "selektion"], ["auswahl", "selektion"], ["bluetenlese", "selektion"], ["auswahl", "koerung"], ["bluetenlese", "koerung"], ["auswahl", "bluetenlese"], ["holzleiste", "profilleiste"], ["holzleiste", "leiste"], ["holzleiste", "zierleiste"], ["holzleiste", "latte"], ["leiste", "profilleiste"], ["profilleiste", "zierleiste"], ["latte", "profilleiste"], ["leiste", "zierleiste"], ["latte", "leiste"], ["latte", "zierleiste"], ["beachten", "mitverfolgen"], ["beachten", "beobachten"], ["beachten", "hueten"], ["beachten", "bewachen"], ["beobachten", "mitverfolgen"], ["hueten", "mitverfolgen"], ["bewachen", "mitverfolgen"], ["beobachten", "hueten"], ["beobachten", "bewachen"], ["bewachen", "hueten"], ["automagisch", "selbstbeweglich"], ["automatisch", "selbstbeweglich"], ["selbstbeweglich", "selbsttaetig"], ["automagisch", "automatisch"], ["automagisch", "selbsttaetig"], ["automatisch", "selbsttaetig"], ["min", "mindestens"], ["min", "minimal"], ["min", "wenigstens"], ["min", "minimum"], ["mindestens", "minimal"], ["mindestens", "wenigstens"], ["mindestens", "minimum"], ["minimal", "wenigstens"], ["minimal", "minimum"], ["minimum", "wenigstens"], ["einleitung", "vorwort"], ["geleitwort", "vorwort"], ["praeambel", "vorwort"], ["einleitung", "geleitwort"], ["einleitung", "praeambel"], ["geleitwort", "praeambel"], ["belasten", "laden"], ["beladen", "laden"], ["beladen", "belasten"], ["drehstange", "welle"], ["achse", "drehstange"], ["achse", "welle"], ["knarren", "knarzen"], ["knarzen", "knirschen"], ["knarzen", "schnarren"], ["knarzen", "quietschen"], ["knarzen", "kratzen"], ["aechzen", "knarzen"], ["knarren", "knirschen"], ["knarren", "schnarren"], ["knarren", "quietschen"], ["knarren", "kratzen"], ["aechzen", "knarren"], ["knirschen", "schnarren"], ["knirschen", "quietschen"], ["knirschen", "kratzen"], ["aechzen", "knirschen"], ["quietschen", "schnarren"], ["kratzen", "schnarren"], ["aechzen", "schnarren"], ["kratzen", "quietschen"], ["aechzen", "quietschen"], ["aechzen", "kratzen"], ["steg", "trampelpfad"], ["steg", "weg"], ["steg", "steig"], ["pfad", "steg"], ["trampelpfad", "weg"], ["steig", "trampelpfad"], ["pfad", "trampelpfad"], ["steig", "weg"], ["pfad", "weg"], ["pfad", "steig"], ["einzelfall", "sonderfall"], ["ausnahme", "sonderfall"], ["ausnahmefall", "sonderfall"], ["ausnahme", "einzelfall"], ["ausnahmefall", "einzelfall"], ["ausnahme", "ausnahmefall"], ["celsius", "grad"], ["fuehrung", "spitze"], ["fuehrung", "vorhut"], ["spitze", "vorhut"], ["abwehren", "supprimieren"], ["abwehren", "unterdruecken"], ["abwehren", "ersticken"], ["abwehren", "verdraengen"], ["abwehren", "ausblenden"], ["abwehren", "niederdruecken"], ["supprimieren", "unterdruecken"], ["ersticken", "supprimieren"], ["supprimieren", "verdraengen"], ["ausblenden", "supprimieren"], ["niederdruecken", "supprimieren"], ["ersticken", "unterdruecken"], ["unterdruecken", "verdraengen"], ["ausblenden", "unterdruecken"], ["niederdruecken", "unterdruecken"], ["ersticken", "verdraengen"], ["ausblenden", "ersticken"], ["ersticken", "niederdruecken"], ["ausblenden", "verdraengen"], ["niederdruecken", "verdraengen"], ["ausblenden", "niederdruecken"], ["belastung", "buerde"], ["belastung", "last"], ["belastung", "beschwerlichkeit"], ["buerde", "last"], ["beschwerlichkeit", "buerde"], ["beschwerlichkeit", "last"], ["bildschirm", "monitor"], ["bildschirm", "schirm"], ["anzeige", "bildschirm"], ["anzeigegeraet", "bildschirm"], ["bildschirm", "display"], ["monitor", "schirm"], ["anzeige", "monitor"], ["anzeigegeraet", "monitor"], ["display", "monitor"], ["anzeige", "schirm"], ["anzeigegeraet", "schirm"], ["display", "schirm"], ["anzeige", "anzeigegeraet"], ["anzeige", "display"], ["anzeigegeraet", "display"], ["richtig", "zutreffend"], ["korrekt", "richtig"], ["exakt", "richtig"], ["korrekt", "zutreffend"], ["exakt", "zutreffend"], ["exakt", "korrekt"], ["ausnutzung", "verwendung"], ["ausnutzung", "auswertung"], ["ausnutzung", "nutzbarmachung"], ["ausnutzung", "verwertung"], ["auswertung", "verwendung"], ["nutzbarmachung", "verwendung"], ["verwendung", "verwertung"], ["auswertung", "nutzbarmachung"], ["auswertung", "verwertung"], ["nutzbarmachung", "verwertung"], ["alljaehrlich", "jaehrlich"], ["alljaehrlich", "annual"], ["alljaehrlich", "annuell"], ["annual", "jaehrlich"], ["annuell", "jaehrlich"], ["annual", "annuell"], ["dahinter", "hinten"], ["dahinter", "rueckseitig"], ["dahinter", "endend"], ["hinten", "rueckseitig"], ["endend", "hinten"], ["endend", "rueckseitig"], ["dicht", "fest"], ["dicht", "massiv"], ["dicht", "eng"], ["dicht", "gedraengt"], ["fest", "massiv"], ["eng", "fest"], ["fest", "gedraengt"], ["eng", "massiv"], ["gedraengt", "massiv"], ["eng", "gedraengt"], ["bonus", "extra"], ["extra", "nachschlag"], ["extra", "special"], ["extra", "zusatzbonbon"], ["draufgabe", "extra"], ["dreingabe", "extra"], ["extra", "zugabe"], ["bonus", "nachschlag"], ["bonus", "special"], ["bonus", "zusatzbonbon"], ["bonus", "draufgabe"], ["bonus", "dreingabe"], ["bonus", "zugabe"], ["nachschlag", "special"], ["nachschlag", "zusatzbonbon"], ["draufgabe", "nachschlag"], ["dreingabe", "nachschlag"], ["nachschlag", "zugabe"], ["special", "zusatzbonbon"], ["draufgabe", "special"], ["dreingabe", "special"], ["special", "zugabe"], ["draufgabe", "zusatzbonbon"], ["dreingabe", "zusatzbonbon"], ["zugabe", "zusatzbonbon"], ["draufgabe", "dreingabe"], ["draufgabe", "zugabe"], ["dreingabe", "zugabe"], ["kontrollieren", "leiten"], ["fuehren", "kontrollieren"], ["kontrollieren", "vorangehen"], ["kontrollieren", "lenken"], ["dominieren", "kontrollieren"], ["fuehren", "leiten"], ["leiten", "vorangehen"], ["leiten", "lenken"], ["dominieren", "leiten"], ["fuehren", "vorangehen"], ["fuehren", "lenken"], ["dominieren", "fuehren"], ["lenken", "vorangehen"], ["dominieren", "vorangehen"], ["dominieren", "lenken"], ["loetung", "loetverbindung"], ["loetnaht", "loetverbindung"], ["loetstelle", "loetverbindung"], ["loetnaht", "loetung"], ["loetstelle", "loetung"], ["loetnaht", "loetstelle"], ["abbildung", "illustration"], ["abbildung", "bild"], ["abbildung", "ebenbild"], ["abbildung", "darstellung"], ["abbildung", "bildnis"], ["bild", "illustration"], ["ebenbild", "illustration"], ["darstellung", "illustration"], ["bildnis", "illustration"], ["bild", "ebenbild"], ["bild", "darstellung"], ["bild", "bildnis"], ["darstellung", "ebenbild"], ["bildnis", "ebenbild"], ["bildnis", "darstellung"], ["alternative", "andere"], ["andere", "uebrige"], ["andere", "weitere"], ["andere", "zusaetzliche"], ["andere", "sonstige"], ["alternative", "uebrige"], ["alternative", "weitere"], ["alternative", "zusaetzliche"], ["alternative", "sonstige"], ["uebrige", "weitere"], ["uebrige", "zusaetzliche"], ["sonstige", "uebrige"], ["weitere", "zusaetzliche"], ["sonstige", "weitere"], ["sonstige", "zusaetzliche"], ["fern", "weit"], ["entfernt", "fern"], ["entfernt", "weit"], ["spuerbar", "tastbar"], ["fuehlbar", "tastbar"], ["palpabel", "tastbar"], ["fuehlbar", "spuerbar"], ["palpabel", "spuerbar"], ["fuehlbar", "palpabel"], ["clipschelle", "taschenklemme"], ["schelle", "taschenklemme"], ["klemme", "taschenklemme"], ["clipschelle", "schelle"], ["clipschelle", "klemme"], ["klemme", "schelle"], ["kleber", "klebstoff"], ["adhesiv", "klebstoff"], ["klebe", "klebstoff"], ["klebstoff", "leim"], ["adhesiv", "kleber"], ["klebe", "kleber"], ["kleber", "leim"], ["adhesiv", "klebe"], ["adhesiv", "leim"], ["klebe", "leim"], ["festkleben", "kleben"], ["kleben", "verkleben"], ["festkleben", "verkleben"], ["fuehler", "sensor"], ["messwertgeber", "sensor"], ["messfuehler", "sensor"], ["detektor", "sensor"], ["fuehler", "messwertgeber"], ["fuehler", "messfuehler"], ["detektor", "fuehler"], ["messfuehler", "messwertgeber"], ["detektor", "messwertgeber"], ["detektor", "messfuehler"], ["beide", "zwei"], ["dicke", "festigkeit"], ["festigkeit", "steifigkeit"], ["festigkeit", "festigkeitsgrad"], ["dicke", "steifigkeit"], ["dicke", "festigkeitsgrad"], ["festigkeitsgrad", "steifigkeit"], ["aktivierung", "start"], ["aktivierung", "einschaltung"], ["aktivierung", "inbetriebnahme"], ["aktivierung", "anschaltung"], ["einschaltung", "start"], ["inbetriebnahme", "start"], ["anschaltung", "start"], ["einschaltung", "inbetriebnahme"], ["anschaltung", "einschaltung"], ["anschaltung", "inbetriebnahme"], ["inaktivieren", "passivieren"], ["ausschalten", "passivieren"], ["deaktivieren", "passivieren"], ["abschalten", "passivieren"], ["passivieren", "stilllegen"], ["ausschalten", "inaktivieren"], ["deaktivieren", "inaktivieren"], ["abschalten", "inaktivieren"], ["inaktivieren", "stilllegen"], ["ausschalten", "deaktivieren"], ["abschalten", "ausschalten"], ["ausschalten", "stilllegen"], ["abschalten", "deaktivieren"], ["deaktivieren", "stilllegen"], ["abschalten", "stilllegen"], ["ausschnitt", "notch"], ["ausschnitt", "einkerbung"], ["ausschnitt", "einbuchtung"], ["ausschnitt", "einschnitt"], ["ausschnitt", "aussparung"], ["einkerbung", "notch"], ["einbuchtung", "notch"], ["einschnitt", "notch"], ["aussparung", "notch"], ["einbuchtung", "einkerbung"], ["einkerbung", "einschnitt"], ["aussparung", "einkerbung"], ["einbuchtung", "einschnitt"], ["aussparung", "einbuchtung"], ["aussparung", "einschnitt"], ["breite", "weite"], ["staerke", "weite"], ["dicke", "weite"], ["breite", "umfang"], ["staerke", "umfang"], ["dicke", "umfang"], ["breite", "staerke"], ["breite", "dicke"], ["dicke", "staerke"], ["nase", "vorsprung"], ["lange", "nachhaltig"], ["nachhaltig", "tief"], ["nachhaltig", "stark"], ["lange", "tief"], ["lange", "stark"], ["stark", "tief"], ["eintauchen", "tauchen"], ["eintauchen", "tunken"], ["eintauchen", "stippen"], ["eintauchen", "eintunken"], ["tauchen", "tunken"], ["stippen", "tauchen"], ["eintunken", "tauchen"], ["stippen", "tunken"], ["eintunken", "tunken"], ["eintunken", "stippen"], ["aufgabe", "zweck"], ["rolle", "zweck"], ["funktion", "zweck"], ["aufgabe", "rolle"], ["aufgabe", "funktion"], ["funktion", "rolle"], ["leute", "personen"], ["personen", "volk"], ["menschen", "personen"], ["leute", "volk"], ["leute", "menschen"], ["menschen", "volk"], ["geschwindigkeitsmessgeraet", "tacho"], ["geschwindigkeitsmessgeraet", "tachometer"], ["geschwindigkeitsmesser", "geschwindigkeitsmessgeraet"], ["tacho", "tachometer"], ["geschwindigkeitsmesser", "tacho"], ["geschwindigkeitsmesser", "tachometer"], ["extrudierung", "verformung"], ["umformung", "verformung"], ["extrudierung", "umformung"], ["signal", "zeichen"], ["signal", "symbol"], ["symbol", "zeichen"], ["etwas", "sache"], ["sache", "teil"], ["gizmo", "sache"], ["ding", "sache"], ["gegenstand", "sache"], ["objekt", "sache"], ["etwas", "teil"], ["etwas", "gizmo"], ["ding", "etwas"], ["etwas", "gegenstand"], ["etwas", "objekt"], ["gizmo", "teil"], ["ding", "teil"], ["gegenstand", "teil"], ["objekt", "teil"], ["ding", "gizmo"], ["gegenstand", "gizmo"], ["gizmo", "objekt"], ["ding", "gegenstand"], ["ding", "objekt"], ["gegenstand", "objekt"], ["allgemeinheit", "menschen"], ["alle", "menschen"], ["alle", "allgemeinheit"], ["allgemeinheit", "leute"], ["alle", "leute"], ["differenzial", "differenziell"], ["differential", "differenziell"], ["differential", "differenzial"], ["aufspannen", "aufziehen"], ["aufziehen", "spannen"], ["aufspannen", "spannen"], ["profilbild", "seitenriss"], ["profil", "profilbild"], ["profilbild", "seitenprojektion"], ["profilbild", "seitenansicht"], ["profil", "seitenriss"], ["seitenprojektion", "seitenriss"], ["seitenansicht", "seitenriss"], ["profil", "seitenprojektion"], ["profil", "seitenansicht"], ["seitenansicht", "seitenprojektion"], ["niedrig", "tief"], ["flach", "tief"], ["flach", "niedrig"], ["heben", "hochziehen"], ["heben", "hebung"], ["hebung", "hochziehen"], ["trueb", "wolkig"], ["trueb", "truebe"], ["bezogen", "trueb"], ["bewoelkt", "trueb"], ["bedeckt", "trueb"], ["truebe", "wolkig"], ["bezogen", "wolkig"], ["bewoelkt", "wolkig"], ["bedeckt", "wolkig"], ["bezogen", "truebe"], ["bewoelkt", "truebe"], ["bedeckt", "truebe"], ["bewoelkt", "bezogen"], ["bedeckt", "bezogen"], ["bedeckt", "bewoelkt"], ["protektion", "schutz"], ["abschirmung", "protektion"], ["abschirmung", "schutz"], ["strecke", "strich"], ["gerade", "strecke"], ["linie", "strecke"], ["gerade", "strich"], ["linie", "strich"], ["gerade", "linie"], ["pfropfen", "stoppel"], ["stoppel", "zapfen"], ["stoppel", "verschlussstopfen"], ["korken", "stoppel"], ["stopfen", "stoppel"], ["proppen", "stoppel"], ["stoepsel", "stoppel"], ["pfropfen", "zapfen"], ["pfropfen", "verschlussstopfen"], ["korken", "pfropfen"], ["pfropfen", "stopfen"], ["pfropfen", "proppen"], ["pfropfen", "stoepsel"], ["verschlussstopfen", "zapfen"], ["korken", "zapfen"], ["stopfen", "zapfen"], ["proppen", "zapfen"], ["stoepsel", "zapfen"], ["korken", "verschlussstopfen"], ["stopfen", "verschlussstopfen"], ["proppen", "verschlussstopfen"], ["stoepsel", "verschlussstopfen"], ["korken", "stopfen"], ["korken", "proppen"], ["korken", "stoepsel"], ["proppen", "stopfen"], ["stoepsel", "stopfen"], ["proppen", "stoepsel"], ["belichtung", "helligkeit"], ["helligkeit", "licht"], ["beleuchtung", "helligkeit"], ["belichtung", "licht"], ["beleuchtung", "belichtung"], ["beleuchtung", "licht"], ["blache", "plane"], ["plane", "tuch"], ["oeltuch", "plane"], ["persenning", "plane"], ["plache", "plane"], ["blache", "tuch"], ["blache", "oeltuch"], ["blache", "persenning"], ["blache", "plache"], ["oeltuch", "tuch"], ["persenning", "tuch"], ["plache", "tuch"], ["oeltuch", "persenning"], ["oeltuch", "plache"], ["persenning", "plache"], ["einklemmen", "einzwicken"], ["einklemmen", "spiessen"], ["einklemmen", "klemmen"], ["einzwicken", "spiessen"], ["einzwicken", "klemmen"], ["klemmen", "spiessen"], ["einrichten", "hinstellen"], ["hinstellen", "ordnen"], ["einrichten", "ordnen"], ["loesen", "trennen"], ["lockern", "loesen"], ["loesen", "losmachen"], ["lockern", "trennen"], ["losmachen", "trennen"], ["lockern", "losmachen"], ["ausgeglichen", "moderat"], ["ausgeglichen", "maessig"], ["ausgeglichen", "massvoll"], ["ausgeglichen", "gemaessigt"], ["ausgeglichen", "verhalten"], ["apollinisch", "ausgeglichen"], ["maessig", "moderat"], ["massvoll", "moderat"], ["gemaessigt", "moderat"], ["moderat", "verhalten"], ["apollinisch", "moderat"], ["maessig", "massvoll"], ["gemaessigt", "maessig"], ["maessig", "verhalten"], ["apollinisch", "maessig"], ["gemaessigt", "massvoll"], ["massvoll", "verhalten"], ["apollinisch", "massvoll"], ["gemaessigt", "verhalten"], ["apollinisch", "gemaessigt"], ["apollinisch", "verhalten"], ["schnelligkeit", "zahn"], ["hurtigkeit", "zahn"], ["schwuppdizitaet", "zahn"], ["tempo", "zahn"], ["zahn", "zuegigkeit"], ["takt", "zahn"], ["geschwindigkeit", "zahn"], ["hurtigkeit", "schnelligkeit"], ["schnelligkeit", "schwuppdizitaet"], ["schnelligkeit", "tempo"], ["schnelligkeit", "zuegigkeit"], ["schnelligkeit", "takt"], ["geschwindigkeit", "schnelligkeit"], ["hurtigkeit", "schwuppdizitaet"], ["hurtigkeit", "tempo"], ["hurtigkeit", "zuegigkeit"], ["hurtigkeit", "takt"], ["geschwindigkeit", "hurtigkeit"], ["schwuppdizitaet", "tempo"], ["schwuppdizitaet", "zuegigkeit"], ["schwuppdizitaet", "takt"], ["geschwindigkeit", "schwuppdizitaet"], ["tempo", "zuegigkeit"], ["takt", "tempo"], ["geschwindigkeit", "tempo"], ["takt", "zuegigkeit"], ["geschwindigkeit", "zuegigkeit"], ["geschwindigkeit", "takt"], ["synchronisieren", "vereinheitlichen"], ["abgleichen", "vereinheitlichen"], ["angleichen", "vereinheitlichen"], ["abgleichen", "synchronisieren"], ["angleichen", "synchronisieren"], ["abgleichen", "angleichen"], ["entlasten", "erloesen"], ["entlasten", "saeubern"], ["befreien", "entlasten"], ["erloesen", "saeubern"], ["befreien", "erloesen"], ["befreien", "saeubern"], ["markierung", "symbol"], ["merkmal", "symbol"], ["markierung", "merkmal"], ["markierung", "zeichen"], ["merkmal", "zeichen"], ["einander", "sich"], ["benutzt", "getragen"], ["benutzt", "secondhand"], ["benutzt", "gebraucht"], ["benutzt", "second-hand"], ["getragen", "secondhand"], ["gebraucht", "getragen"], ["getragen", "second-hand"], ["gebraucht", "secondhand"], ["second-hand", "secondhand"], ["gebraucht", "second-hand"], ["einsatz", "verwendung"], ["anwendung", "verwendung"], ["applikation", "verwendung"], ["anwendung", "einsatz"], ["applikation", "einsatz"], ["anwendung", "applikation"], ["notwendig", "obligat"], ["erforderlich", "notwendig"], ["notwendig", "unerlaesslich"], ["noetig", "notwendig"], ["notwendig", "vonnoeten"], ["erforderlich", "obligat"], ["obligat", "unerlaesslich"], ["noetig", "obligat"], ["obligat", "vonnoeten"], ["erforderlich", "unerlaesslich"], ["erforderlich", "noetig"], ["erforderlich", "vonnoeten"], ["noetig", "unerlaesslich"], ["unerlaesslich", "vonnoeten"], ["noetig", "vonnoeten"], ["betreffen", "beziehen"], ["betreffen", "topikal"], ["beziehen", "topikal"], ["druck", "fassung"], ["auflage", "fassung"], ["edition", "fassung"], ["abdruck", "fassung"], ["ausgabe", "druck"], ["auflage", "druck"], ["druck", "edition"], ["abdruck", "druck"], ["auflage", "ausgabe"], ["ausgabe", "edition"], ["abdruck", "ausgabe"], ["auflage", "edition"], ["abdruck", "auflage"], ["abdruck", "edition"], ["kuehlmittel", "kuehlwasser"], ["kaeltemittel", "kuehlmittel"], ["kuehlmittel", "schmiermittel"], ["kuehlmittel", "kuehlschmiermittel"], ["kaeltemittel", "kuehlwasser"], ["kuehlwasser", "schmiermittel"], ["kuehlschmiermittel", "kuehlwasser"], ["kaeltemittel", "schmiermittel"], ["kaeltemittel", "kuehlschmiermittel"], ["kuehlschmiermittel", "schmiermittel"], ["schaltung", "verdrahtung"], ["bescheid", "mitteilung"], ["mitteilung", "schreiben"], ["mitteilung", "wisch"], ["mitteilung", "verfuegung"], ["mitteilung", "verwaltungsakt"], ["anordnung", "mitteilung"], ["bescheid", "schreiben"], ["bescheid", "wisch"], ["bescheid", "verfuegung"], ["bescheid", "verwaltungsakt"], ["anordnung", "bescheid"], ["schreiben", "wisch"], ["schreiben", "verfuegung"], ["schreiben", "verwaltungsakt"], ["anordnung", "schreiben"], ["verfuegung", "wisch"], ["verwaltungsakt", "wisch"], ["anordnung", "wisch"], ["verfuegung", "verwaltungsakt"], ["anordnung", "verfuegung"], ["anordnung", "verwaltungsakt"], ["formation", "reihung"], ["aufstellung", "formation"], ["abfolge", "formation"], ["anordnung", "formation"], ["formation", "hintereinanderstellung"], ["aufstellung", "reihung"], ["abfolge", "reihung"], ["anordnung", "reihung"], ["hintereinanderstellung", "reihung"], ["abfolge", "aufstellung"], ["anordnung", "aufstellung"], ["aufstellung", "hintereinanderstellung"], ["abfolge", "anordnung"], ["abfolge", "hintereinanderstellung"], ["anordnung", "hintereinanderstellung"], ["gruppe", "zusammenfassung"], ["gruppe", "sammlung"], ["gruppe", "kollektion"], ["sammlung", "zusammenfassung"], ["kollektion", "zusammenfassung"], ["kollektion", "sammlung"], ["multiplikator", "vorwiderstand"], ["multiplikator", "verstaerker"], ["verstaerker", "vorwiderstand"], ["aufbauanleitung", "montageanweisung"], ["montageanleitung", "montageanweisung"], ["aufbauanleitung", "montageanleitung"], ["meistens", "ueberwiegend"], ["meist", "meistens"], ["meistens", "zumeist"], ["mehrheitlich", "meistens"], ["hauptsaechlich", "meistens"], ["haeufig", "meistens"], ["groesstenteils", "meistens"], ["ueberwiegend", "zumeist"], ["haeufig", "ueberwiegend"], ["meist", "zumeist"], ["hauptsaechlich", "meist"], ["haeufig", "meist"], ["mehrheitlich", "zumeist"], ["hauptsaechlich", "zumeist"], ["haeufig", "zumeist"], ["groesstenteils", "zumeist"], ["hauptsaechlich", "mehrheitlich"], ["haeufig", "mehrheitlich"], ["haeufig", "hauptsaechlich"], ["groesstenteils", "haeufig"], ["aufweisen", "verfuegen"], ["haben", "verfuegen"], ["bieten", "verfuegen"], ["aufwartenmit", "verfuegen"], ["besitzen", "verfuegen"], ["aufweisen", "haben"], ["aufweisen", "bieten"], ["aufwartenmit", "aufweisen"], ["aufweisen", "besitzen"], ["bieten", "haben"], ["aufwartenmit", "haben"], ["besitzen", "haben"], ["aufwartenmit", "bieten"], ["besitzen", "bieten"], ["aufwartenmit", "besitzen"], ["ordentlich", "systematisch"], ["ordentlich", "planvoll"], ["ordentlich", "sortiert"], ["ordentlich", "strukturiert"], ["geordnet", "ordentlich"], ["sortiert", "systematisch"], ["strukturiert", "systematisch"], ["planvoll", "sortiert"], ["planvoll", "strukturiert"], ["sortiert", "strukturiert"], ["geordnet", "sortiert"], ["geordnet", "strukturiert"], ["fern", "weg"], ["muster", "normal"], ["modell", "normal"], ["normal", "prototyp"], ["modell", "muster"], ["muster", "prototyp"], ["modell", "prototyp"], ["individualisiert", "passgenau"], ["individuell", "passgenau"], ["passgenau", "zugeschnitten"], ["angepasst", "passgenau"], ["customized", "passgenau"], ["massgeschneidert", "passgenau"], ["individualisiert", "individuell"], ["individualisiert", "zugeschnitten"], ["angepasst", "individualisiert"], ["customized", "individualisiert"], ["individualisiert", "massgeschneidert"], ["individuell", "zugeschnitten"], ["angepasst", "individuell"], ["customized", "individuell"], ["individuell", "massgeschneidert"], ["angepasst", "zugeschnitten"], ["customized", "zugeschnitten"], ["massgeschneidert", "zugeschnitten"], ["angepasst", "customized"], ["angepasst", "massgeschneidert"], ["customized", "massgeschneidert"], ["bullern", "prasseln"], ["bullern", "knistern"], ["bullern", "knacken"], ["knistern", "prasseln"], ["knacken", "prasseln"], ["knacken", "knistern"], ["fixieren", "heften"], ["heften", "richten"], ["fixieren", "richten"], ["bestellen", "ernennen"], ["bestellen", "einsetzen"], ["bestellen", "installieren"], ["bestallen", "bestellen"], ["bestellen", "bestimmen"], ["berufen", "bestellen"], ["einsetzen", "ernennen"], ["ernennen", "installieren"], ["bestallen", "ernennen"], ["bestimmen", "ernennen"], ["berufen", "ernennen"], ["einsetzen", "installieren"], ["bestallen", "einsetzen"], ["bestimmen", "einsetzen"], ["berufen", "einsetzen"], ["bestallen", "installieren"], ["bestimmen", "installieren"], ["berufen", "installieren"], ["bestallen", "bestimmen"], ["berufen", "bestallen"], ["berufen", "bestimmen"], ["uebersicht", "zusammenfassung"], ["zusammenfassung", "zusammenschau"], ["gesamtschau", "zusammenfassung"], ["ueberblick", "zusammenfassung"], ["syllabus", "zusammenfassung"], ["uebersicht", "zusammenschau"], ["gesamtschau", "uebersicht"], ["ueberblick", "uebersicht"], ["syllabus", "uebersicht"], ["gesamtschau", "zusammenschau"], ["ueberblick", "zusammenschau"], ["syllabus", "zusammenschau"], ["gesamtschau", "ueberblick"], ["gesamtschau", "syllabus"], ["syllabus", "ueberblick"], ["stuetzen", "verspannen"], ["stuetzen", "verstreben"], ["festmachen", "stuetzen"], ["stuetzen", "versteifen"], ["stuetzen", "verankern"], ["befestigen", "stuetzen"], ["verspannen", "verstreben"], ["festmachen", "verspannen"], ["verspannen", "versteifen"], ["abstuetzen", "verspannen"], ["verankern", "verspannen"], ["befestigen", "verspannen"], ["festmachen", "verstreben"], ["versteifen", "verstreben"], ["abstuetzen", "verstreben"], ["verankern", "verstreben"], ["befestigen", "verstreben"], ["festmachen", "versteifen"], ["abstuetzen", "festmachen"], ["festmachen", "verankern"], ["abstuetzen", "versteifen"], ["verankern", "versteifen"], ["befestigen", "versteifen"], ["abstuetzen", "verankern"], ["abstuetzen", "befestigen"], ["befestigen", "verankern"], ["betreiben", "verrichten"], ["praktizieren", "verrichten"], ["abwickeln", "verrichten"], ["nachgehen", "verrichten"], ["ausueben", "verrichten"], ["betreiben", "praktizieren"], ["abwickeln", "betreiben"], ["betreiben", "nachgehen"], ["ausueben", "betreiben"], ["abwickeln", "praktizieren"], ["nachgehen", "praktizieren"], ["ausueben", "praktizieren"], ["abwickeln", "nachgehen"], ["abwickeln", "ausueben"], ["ausueben", "nachgehen"], ["rezept", "strickmuster"], ["anleitung", "rezept"], ["rezept", "schema"], ["formel", "rezept"], ["muster", "rezept"], ["anleitung", "strickmuster"], ["schema", "strickmuster"], ["formel", "strickmuster"], ["muster", "strickmuster"], ["anleitung", "schema"], ["anleitung", "formel"], ["anleitung", "muster"], ["formel", "schema"], ["muster", "schema"], ["formel", "muster"], ["regler", "steuergeraet"], ["regler", "regulierer"], ["regulierer", "steuergeraet"], ["regulator", "steuergeraet"], ["regulator", "regulierer"], ["angebracht", "tunlich"], ["angebracht", "angezeigt"], ["angebracht", "geraten"], ["angebracht", "ratsam"], ["angezeigt", "tunlich"], ["geraten", "tunlich"], ["ratsam", "tunlich"], ["angezeigt", "geraten"], ["angezeigt", "ratsam"], ["geraten", "ratsam"], ["zubehoer", "zubehoerteile"], ["firma", "laden"], ["betrieb", "laden"], ["laden", "unternehmen"], ["betrieb", "firma"], ["firma", "unternehmen"], ["betrieb", "unternehmen"], ["gegenstand", "sujet"], ["gegenstand", "stoff"], ["gegenstand", "inhalt"], ["gegenstand", "gehalt"], ["gegenstand", "thema"], ["stoff", "sujet"], ["inhalt", "sujet"], ["gehalt", "sujet"], ["sujet", "thema"], ["inhalt", "stoff"], ["gehalt", "stoff"], ["stoff", "thema"], ["gehalt", "inhalt"], ["inhalt", "thema"], ["gehalt", "thema"], ["abgesehen", "ausser"], ["allerhoechstens", "ausser"], ["ausser", "hoechstens"], ["ausgenommen", "ausser"], ["abgesehen", "allerhoechstens"], ["abgesehen", "hoechstens"], ["abgesehen", "ausgenommen"], ["allerhoechstens", "hoechstens"], ["allerhoechstens", "ausgenommen"], ["ausgenommen", "hoechstens"], ["entschieden", "gruendlich"], ["entschieden", "radikal"], ["entschieden", "rigoros"], ["gruendlich", "radikal"], ["gruendlich", "rigoros"], ["radikal", "rigoros"], ["farbe", "farbton"], ["diverse", "verschiedene"], ["diverse", "unterschiedliche"], ["ausgewaehlte", "diverse"], ["unterschiedliche", "verschiedene"], ["ausgewaehlte", "verschiedene"], ["ausgewaehlte", "unterschiedliche"], ["seitennummer", "seitenzahl"], ["fluten", "stroemen"], ["rauschen", "stroemen"], ["quellen", "stroemen"], ["rinnen", "stroemen"], ["fliessen", "stroemen"], ["fluten", "rauschen"], ["fluten", "quellen"], ["fluten", "rinnen"], ["fliessen", "fluten"], ["quellen", "rauschen"], ["rauschen", "rinnen"], ["fliessen", "rauschen"], ["quellen", "rinnen"], ["fliessen", "quellen"], ["fliessen", "rinnen"], ["durchschnitt", "schnitt"], ["durchschnitt", "durchschnittswert"], ["durchschnitt", "mittel"], ["durchschnitt", "mittelwert"], ["durchschnitt", "mittelmass"], ["durchschnittswert", "schnitt"], ["mittel", "schnitt"], ["mittelwert", "schnitt"], ["mittelmass", "schnitt"], ["durchschnittswert", "mittel"], ["durchschnittswert", "mittelwert"], ["durchschnittswert", "mittelmass"], ["mittel", "mittelwert"], ["mittel", "mittelmass"], ["mittelmass", "mittelwert"], ["kuemmerlich", "wenig"], ["kuemmerlich", "schwach"], ["gering", "kuemmerlich"], ["schwach", "wenig"], ["gering", "wenig"], ["gering", "schwach"], ["gelegentlich", "wenig"], ["gelegentlich", "selten"], ["gelegentlich", "rar"], ["gelegentlich", "punktuell"], ["gelegentlich", "kaum"], ["selten", "wenig"], ["rar", "wenig"], ["punktuell", "wenig"], ["kaum", "wenig"], ["rar", "selten"], ["punktuell", "selten"], ["kaum", "selten"], ["punktuell", "rar"], ["kaum", "rar"], ["kaum", "punktuell"], ["gitter", "mikrostruktur"], ["gitter", "gittergefuege"], ["gitter", "matrix"], ["gitter", "gitterstruktur"], ["gittergefuege", "mikrostruktur"], ["matrix", "mikrostruktur"], ["gitterstruktur", "mikrostruktur"], ["gittergefuege", "matrix"], ["gittergefuege", "gitterstruktur"], ["gitterstruktur", "matrix"], ["einstellen", "platzieren"], ["einstellen", "positionieren"], ["einstellen", "stellen"], ["einstellen", "setzen"], ["einstellen", "legen"], ["einstellen", "tun"], ["platzieren", "positionieren"], ["platzieren", "stellen"], ["platzieren", "setzen"], ["legen", "platzieren"], ["platzieren", "tun"], ["positionieren", "stellen"], ["positionieren", "setzen"], ["legen", "positionieren"], ["positionieren", "tun"], ["setzen", "stellen"], ["legen", "stellen"], ["stellen", "tun"], ["legen", "setzen"], ["setzen", "tun"], ["legen", "tun"], ["geschlossen", "gesperrt"], ["dicht", "gesperrt"], ["dicht", "geschlossen"], ["anfuehrung", "fuehrung"], ["fuehrung", "leitung"], ["anfuehrung", "leitung"], ["lage", "stellung"], ["lage", "standpunkt"], ["lage", "position"], ["standpunkt", "stellung"], ["position", "stellung"], ["position", "standpunkt"], ["wert", "wuerdig"], ["entsprechend", "wert"], ["entsprechend", "wuerdig"], ["geraet", "vorrichtung"], ["apparat", "geraet"], ["geraet", "geraetschaft"], ["apparatur", "geraet"], ["apparat", "vorrichtung"], ["geraetschaft", "vorrichtung"], ["apparatur", "vorrichtung"], ["apparat", "geraetschaft"], ["apparat", "apparatur"], ["apparatur", "geraetschaft"], ["ablauf", "vorgehen"], ["ablauf", "akt"], ["vorgang", "vorgehen"], ["akt", "vorgang"], ["akt", "vorgehen"], ["inklusive", "mit"], ["inkl", "mit"], ["mit", "samt"], ["mit", "mitsamt"], ["mit", "nebst"], ["eingeschlossen", "mit"], ["einschliesslich", "mit"], ["inkl", "inklusive"], ["inklusive", "samt"], ["inklusive", "mitsamt"], ["inklusive", "nebst"], ["eingeschlossen", "inklusive"], ["einschliesslich", "inklusive"], ["inkl", "samt"], ["inkl", "mitsamt"], ["inkl", "nebst"], ["eingeschlossen", "inkl"], ["einschliesslich", "inkl"], ["mitsamt", "samt"], ["nebst", "samt"], ["eingeschlossen", "samt"], ["einschliesslich", "samt"], ["mitsamt", "nebst"], ["eingeschlossen", "mitsamt"], ["einschliesslich", "mitsamt"], ["eingeschlossen", "nebst"], ["einschliesslich", "nebst"], ["eingeschlossen", "einschliesslich"], ["verbunden", "zugehoerig"], ["angegliedert", "verbunden"], ["einig", "verbunden"], ["angegliedert", "zugehoerig"], ["einig", "zugehoerig"], ["angeschlossen", "zugehoerig"], ["angegliedert", "einig"], ["angegliedert", "angeschlossen"], ["angeschlossen", "einig"], ["traeger", "tragbalken"], ["abgleichen", "auswuchten"], ["dampf", "energie"], ["energie", "leistungsabgabe"], ["energie", "leistung"], ["energie", "kraft"], ["energie", "leistungsfaehigkeit"], ["energie", "schwung"], ["dampf", "leistungsabgabe"], ["dampf", "leistung"], ["dampf", "kraft"], ["dampf", "leistungsfaehigkeit"], ["dampf", "schwung"], ["leistung", "leistungsabgabe"], ["kraft", "leistungsabgabe"], ["leistungsabgabe", "leistungsfaehigkeit"], ["leistungsabgabe", "schwung"], ["kraft", "leistung"], ["leistung", "leistungsfaehigkeit"], ["leistung", "schwung"], ["kraft", "leistungsfaehigkeit"], ["kraft", "schwung"], ["leistungsfaehigkeit", "schwung"], ["allenfalls", "bestenfalls"], ["bestenfalls", "hoechstenfalls"], ["aeusserstenfalls", "bestenfalls"], ["bestenfalls", "guenstigstenfalls"], ["bestenfalls", "hoechstens"], ["bestenfalls", "maximal"], ["bestenfalls", "max"], ["allenfalls", "hoechstenfalls"], ["aeusserstenfalls", "allenfalls"], ["allenfalls", "guenstigstenfalls"], ["allenfalls", "hoechstens"], ["allenfalls", "maximal"], ["allenfalls", "max"], ["aeusserstenfalls", "hoechstenfalls"], ["guenstigstenfalls", "hoechstenfalls"], ["hoechstenfalls", "hoechstens"], ["hoechstenfalls", "maximal"], ["hoechstenfalls", "max"], ["aeusserstenfalls", "guenstigstenfalls"], ["aeusserstenfalls", "hoechstens"], ["aeusserstenfalls", "maximal"], ["aeusserstenfalls", "max"], ["guenstigstenfalls", "hoechstens"], ["guenstigstenfalls", "maximal"], ["guenstigstenfalls", "max"], ["mal", "zeichen"], ["fleck", "mal"], ["fleck", "zeichen"], ["bestaendigkeit", "stabilitaet"], ["bestaendigkeit", "verlaesslichkeit"], ["bestaendigkeit", "systemstabilitaet"], ["bestaendigkeit", "reliabilitaet"], ["bestaendigkeit", "zuverlaessigkeit"], ["stabilitaet", "verlaesslichkeit"], ["stabilitaet", "systemstabilitaet"], ["reliabilitaet", "stabilitaet"], ["stabilitaet", "zuverlaessigkeit"], ["systemstabilitaet", "verlaesslichkeit"], ["reliabilitaet", "verlaesslichkeit"], ["verlaesslichkeit", "zuverlaessigkeit"], ["reliabilitaet", "systemstabilitaet"], ["systemstabilitaet", "zuverlaessigkeit"], ["reliabilitaet", "zuverlaessigkeit"], ["ausborgen", "pumpen"], ["borgen", "pumpen"], ["ausleihen", "pumpen"], ["leihen", "pumpen"], ["entlehnen", "pumpen"], ["ausborgen", "borgen"], ["ausborgen", "ausleihen"], ["ausborgen", "leihen"], ["ausborgen", "entlehnen"], ["ausleihen", "borgen"], ["borgen", "leihen"], ["borgen", "entlehnen"], ["ausleihen", "leihen"], ["ausleihen", "entlehnen"], ["entlehnen", "leihen"], ["entsprechend", "getreu"], ["entsprechend", "qua"], ["entsprechend", "laut"], ["getreu", "nach"], ["nach", "qua"], ["laut", "nach"], ["gemaess", "getreu"], ["gemaess", "qua"], ["gemaess", "laut"], ["getreu", "qua"], ["getreu", "zufolge"], ["getreu", "laut"], ["qua", "zufolge"], ["laut", "qua"], ["laut", "zufolge"], ["falz", "stemmloch"], ["falz", "spalt"], ["falz", "nut"], ["falz", "zapfenloch"], ["falz", "spalte"], ["spalt", "stemmloch"], ["nut", "stemmloch"], ["fuge", "stemmloch"], ["stemmloch", "zapfenloch"], ["spalte", "stemmloch"], ["nut", "spalt"], ["spalt", "zapfenloch"], ["fuge", "nut"], ["nut", "zapfenloch"], ["nut", "spalte"], ["fuge", "zapfenloch"], ["spalte", "zapfenloch"], ["beachten", "einplanen"], ["beruecksichtigen", "einplanen"], ["gleichmaessig", "regulaer"], ["gleichmaessig", "regelmaessig"], ["regelmaessig", "regulaer"], ["schutzvorrichtung", "sicherung"], ["null", "referenzpunkt"], ["bezugspunkt", "referenzpunkt"], ["koordinatenursprung", "referenzpunkt"], ["ausgangspunkt", "referenzpunkt"], ["nullpunkt", "referenzpunkt"], ["bezugspunkt", "null"], ["koordinatenursprung", "null"], ["ausgangspunkt", "null"], ["null", "nullpunkt"], ["bezugspunkt", "koordinatenursprung"], ["ausgangspunkt", "bezugspunkt"], ["bezugspunkt", "nullpunkt"], ["ausgangspunkt", "koordinatenursprung"], ["koordinatenursprung", "nullpunkt"], ["ausgangspunkt", "nullpunkt"], ["gesundheitszustand", "status"], ["befinden", "status"], ["status", "verfassung"], ["status", "zustand"], ["befinden", "gesundheitszustand"], ["gesundheitszustand", "verfassung"], ["gesundheitszustand", "zustand"], ["befinden", "verfassung"], ["befinden", "zustand"], ["verfassung", "zustand"], ["aufpflegen", "bemuttern"], ["aufziehen", "bemuttern"], ["bemuttern", "grossziehen"], ["bemuttern", "pflegen"], ["bemuttern", "heranziehen"], ["aufpflegen", "aufziehen"], ["aufpflegen", "grossziehen"], ["aufpflegen", "pflegen"], ["aufpflegen", "heranziehen"], ["aufziehen", "grossziehen"], ["aufziehen", "pflegen"], ["aufziehen", "heranziehen"], ["grossziehen", "pflegen"], ["grossziehen", "heranziehen"], ["heranziehen", "pflegen"], ["nebst", "zwischen"], ["bei", "nebst"], ["nebst", "unter"], ["bei", "zwischen"], ["unter", "zwischen"], ["bei", "unter"], ["umschwung", "wechsel"], ["neuausrichtung", "wechsel"], ["umbruch", "wechsel"], ["aenderung", "wechsel"], ["umschwenken", "wechsel"], ["neuausrichtung", "umschwung"], ["umbruch", "umschwung"], ["aenderung", "umschwung"], ["umschwenken", "umschwung"], ["neuausrichtung", "umbruch"], ["aenderung", "neuausrichtung"], ["neuausrichtung", "umschwenken"], ["aenderung", "umbruch"], ["umbruch", "umschwenken"], ["aenderung", "umschwenken"], ["effektivitaet", "wirksamkeit"], ["effektivitaet", "leistungsfaehigkeit"], ["effektivitaet", "wirkungsgrad"], ["leistungsfaehigkeit", "wirksamkeit"], ["wirksamkeit", "wirkungsgrad"], ["leistungsfaehigkeit", "wirkungsgrad"], ["entstehen", "zustandekommen"], ["anfang", "entstehen"], ["entstehen", "herkunft"], ["entstehen", "werden"], ["entstehen", "ursprung"], ["anfang", "zustandekommen"], ["herkunft", "zustandekommen"], ["werden", "zustandekommen"], ["ursprung", "zustandekommen"], ["anfang", "herkunft"], ["anfang", "werden"], ["anfang", "ursprung"], ["herkunft", "werden"], ["ursprung", "werden"], ["dies", "dieses"], ["dasjenige", "dieses"], ["das", "dieses"], ["dieses", "jenes"], ["dieses", "welches"], ["dasjenige", "dies"], ["das", "dies"], ["dies", "jenes"], ["dies", "welches"], ["das", "dasjenige"], ["dasjenige", "jenes"], ["dasjenige", "welches"], ["das", "jenes"], ["das", "welches"], ["jenes", "welches"], ["spule", "wendel"], ["wendel", "wicklung"], ["spule", "wicklung"], ["verschrotten", "verschrottung"], ["abwracken", "verschrotten"], ["abwrackung", "verschrotten"], ["abwracken", "verschrottung"], ["abwrackung", "verschrottung"], ["abwracken", "abwrackung"], ["fassung", "halterung"], ["umschliessen", "umschlingen"], ["umarmen", "umschlingen"], ["druecken", "umschlingen"], ["umfassen", "umschlingen"], ["umfangen", "umschlingen"], ["umklammern", "umschlingen"], ["umarmen", "umschliessen"], ["druecken", "umschliessen"], ["umfassen", "umschliessen"], ["umfangen", "umschliessen"], ["umklammern", "umschliessen"], ["druecken", "umarmen"], ["umarmen", "umfassen"], ["umarmen", "umfangen"], ["umarmen", "umklammern"], ["druecken", "umfassen"], ["druecken", "umfangen"], ["druecken", "umklammern"], ["umfangen", "umfassen"], ["umfassen", "umklammern"], ["umfangen", "umklammern"], ["geduld", "nachsichtigkeit"], ["nachsichtigkeit", "verstaendnis"], ["nachsicht", "nachsichtigkeit"], ["nachsichtigkeit", "toleranz"], ["konnivenz", "nachsichtigkeit"], ["duldsamkeit", "nachsichtigkeit"], ["nachsichtigkeit", "permissivitaet"], ["geduld", "verstaendnis"], ["geduld", "nachsicht"], ["geduld", "toleranz"], ["geduld", "konnivenz"], ["duldsamkeit", "geduld"], ["geduld", "permissivitaet"], ["nachsicht", "verstaendnis"], ["toleranz", "verstaendnis"], ["konnivenz", "verstaendnis"], ["duldsamkeit", "verstaendnis"], ["permissivitaet", "verstaendnis"], ["nachsicht", "toleranz"], ["konnivenz", "nachsicht"], ["duldsamkeit", "nachsicht"], ["nachsicht", "permissivitaet"], ["konnivenz", "toleranz"], ["duldsamkeit", "toleranz"], ["permissivitaet", "toleranz"], ["duldsamkeit", "konnivenz"], ["konnivenz", "permissivitaet"], ["duldsamkeit", "permissivitaet"], ["verbindung", "verhaeltnis"], ["beziehung", "verbindung"], ["nexus", "verbindung"], ["relation", "verbindung"], ["verbindung", "zusammenhang"], ["bezug", "verbindung"], ["beziehung", "verhaeltnis"], ["nexus", "verhaeltnis"], ["relation", "verhaeltnis"], ["verhaeltnis", "zusammenhang"], ["bezug", "verhaeltnis"], ["beziehung", "nexus"], ["beziehung", "relation"], ["beziehung", "zusammenhang"], ["beziehung", "bezug"], ["nexus", "relation"], ["nexus", "zusammenhang"], ["bezug", "nexus"], ["relation", "zusammenhang"], ["bezug", "relation"], ["bezug", "zusammenhang"], ["aufwaermen", "erwaermen"], ["aufwaermen", "waermen"], ["erwaermen", "waermen"], ["bessern", "bestmoeglich"], ["bestmoeglich", "veredeln"], ["anpassen", "bestmoeglich"], ["bestmoeglich", "verbessern"], ["aufbessern", "bestmoeglich"], ["bestmoeglich", "steigern"], ["bestmoeglich", "optimieren"], ["bessern", "veredeln"], ["anpassen", "bessern"], ["bessern", "verbessern"], ["aufbessern", "bessern"], ["bessern", "steigern"], ["bessern", "optimieren"], ["anpassen", "veredeln"], ["verbessern", "veredeln"], ["aufbessern", "veredeln"], ["steigern", "veredeln"], ["optimieren", "veredeln"], ["anpassen", "verbessern"], ["anpassen", "aufbessern"], ["anpassen", "steigern"], ["anpassen", "optimieren"], ["aufbessern", "verbessern"], ["steigern", "verbessern"], ["optimieren", "verbessern"], ["aufbessern", "steigern"], ["aufbessern", "optimieren"], ["optimieren", "steigern"], ["lasche", "oese"], ["oese", "schlaufe"], ["lasche", "schlaufe"], ["neuausrichtung", "neuorientierung"], ["neuorientierung", "reformation"], ["erneuerung", "neuorientierung"], ["neuorientierung", "umorientierung"], ["neuorientierung", "verbesserung"], ["neuausrichtung", "reformation"], ["erneuerung", "neuausrichtung"], ["neuausrichtung", "umorientierung"], ["neuausrichtung", "verbesserung"], ["erneuerung", "reformation"], ["reformation", "umorientierung"], ["reformation", "verbesserung"], ["erneuerung", "umorientierung"], ["erneuerung", "verbesserung"], ["umorientierung", "verbesserung"], ["fest", "konsistent"], ["dicht", "konsistent"], ["blockieren", "versperren"], ["blockieren", "sperren"], ["verkettung", "zusammenhang"], ["vernetzung", "zusammenhang"], ["verbindung", "verkettung"], ["verbindung", "vernetzung"], ["verkettung", "vernetzung"], ["vorn", "vorne"], ["aendern", "bessern"], ["abaendern", "bessern"], ["berichtigen", "bessern"], ["aendern", "berichtigen"], ["abaendern", "berichtigen"], ["distanz", "entfernung"], ["abstand", "distanz"], ["abstand", "entfernung"], ["liquide", "zahlungsfaehig"], ["liquide", "zahlungskraeftig"], ["fluessig", "liquide"], ["liquide", "schuldenfrei"], ["liquide", "solvent"], ["liquid", "liquide"], ["zahlungsfaehig", "zahlungskraeftig"], ["fluessig", "zahlungsfaehig"], ["schuldenfrei", "zahlungsfaehig"], ["solvent", "zahlungsfaehig"], ["liquid", "zahlungsfaehig"], ["fluessig", "zahlungskraeftig"], ["schuldenfrei", "zahlungskraeftig"], ["solvent", "zahlungskraeftig"], ["liquid", "zahlungskraeftig"], ["fluessig", "schuldenfrei"], ["fluessig", "solvent"], ["fluessig", "liquid"], ["schuldenfrei", "solvent"], ["liquid", "schuldenfrei"], ["liquid", "solvent"], ["abfallen", "abstuerzen"], ["abfallen", "niedergehen"], ["abfallen", "fallen"], ["abfallen", "absinken"], ["abstuerzen", "niedergehen"], ["abstuerzen", "fallen"], ["absinken", "abstuerzen"], ["fallen", "niedergehen"], ["absinken", "niedergehen"], ["absinken", "fallen"], ["akkommodieren", "einstellen"], ["anpassen", "einstellen"], ["einrichten", "einstellen"], ["akkommodieren", "anpassen"], ["akkommodieren", "einrichten"], ["anpassen", "einrichten"], ["dasselbe", "ident"], ["dasselbe", "genauso"], ["dasselbe", "gleichartig"], ["dasselbe", "wie"], ["dasselbe", "ebenso"], ["dasselbe", "gleich"], ["dasselbe", "identisch"], ["genauso", "ident"], ["gleichartig", "ident"], ["ident", "wie"], ["ebenso", "ident"], ["gleich", "ident"], ["ident", "identisch"], ["genauso", "gleichartig"], ["genauso", "wie"], ["ebenso", "genauso"], ["genauso", "gleich"], ["genauso", "identisch"], ["gleichartig", "wie"], ["ebenso", "gleichartig"], ["ebenso", "wie"], ["gleich", "wie"], ["identisch", "wie"], ["ebenso", "gleich"], ["ebenso", "identisch"], ["ausgeglichen", "geglaettet"], ["ausgeglichen", "ausgewuchtet"], ["ausgewuchtet", "geglaettet"], ["aufstemmen", "knacken"], ["aufhebeln", "knacken"], ["aufbrechen", "aufstemmen"], ["aufbrechen", "aufhebeln"], ["aufhebeln", "aufstemmen"], ["niet", "niete"], ["funktionspruefung", "funktionstest"], ["roesch", "trocken"], ["roesch", "sproede"], ["sproede", "trocken"], ["laufen", "vorgehen"], ["laufen", "verlaufen"], ["laufen", "vonstattengehen"], ["ablaufen", "laufen"], ["verlaufen", "vorgehen"], ["vonstattengehen", "vorgehen"], ["gehen", "vorgehen"], ["ablaufen", "vorgehen"], ["verlaufen", "vonstattengehen"], ["gehen", "verlaufen"], ["ablaufen", "verlaufen"], ["gehen", "vonstattengehen"], ["ablaufen", "vonstattengehen"], ["ablaufen", "gehen"], ["ansturm", "zustrom"], ["ansturm", "zulauf"], ["ansturm", "run"], ["andrang", "ansturm"], ["zulauf", "zustrom"], ["run", "zustrom"], ["andrang", "zustrom"], ["run", "zulauf"], ["andrang", "zulauf"], ["andrang", "run"], ["absolutbetrag", "betrag"], ["betrag", "menge"], ["absolutbetrag", "menge"], ["absolutbetrag", "summe"], ["menge", "summe"], ["instrument", "werkzeug"], ["geraet", "instrument"], ["geraetschaft", "instrument"], ["geraet", "werkzeug"], ["geraetschaft", "werkzeug"], ["durstloescher", "gesoeff"], ["gesoeff", "trank"], ["gesoeff", "getraenk"], ["gesoeff", "trunk"], ["gesoeff", "tropfen"], ["gesoeff", "trinken"], ["drink", "gesoeff"], ["durstloescher", "trank"], ["durstloescher", "getraenk"], ["durstloescher", "trunk"], ["durstloescher", "tropfen"], ["durstloescher", "trinken"], ["drink", "durstloescher"], ["getraenk", "trank"], ["trank", "trunk"], ["trank", "tropfen"], ["trank", "trinken"], ["drink", "trank"], ["getraenk", "trunk"], ["getraenk", "tropfen"], ["getraenk", "trinken"], ["drink", "getraenk"], ["tropfen", "trunk"], ["trinken", "trunk"], ["drink", "trunk"], ["trinken", "tropfen"], ["drink", "tropfen"], ["drink", "trinken"], ["gering", "winzig"], ["gering", "mikroskopisch"], ["gering", "klitzeklein"], ["gering", "infinitesimal"], ["gering", "nano"], ["gering", "mikro"], ["gering", "klein"], ["mikroskopisch", "winzig"], ["klitzeklein", "winzig"], ["infinitesimal", "winzig"], ["nano", "winzig"], ["mikro", "winzig"], ["klein", "winzig"], ["klitzeklein", "mikroskopisch"], ["infinitesimal", "mikroskopisch"], ["mikroskopisch", "nano"], ["mikro", "mikroskopisch"], ["klein", "mikroskopisch"], ["infinitesimal", "klitzeklein"], ["klitzeklein", "nano"], ["klitzeklein", "mikro"], ["klein", "klitzeklein"], ["infinitesimal", "nano"], ["infinitesimal", "mikro"], ["infinitesimal", "klein"], ["mikro", "nano"], ["klein", "nano"], ["klein", "mikro"], ["durch", "nacheinander"], ["hintereinander", "nacheinander"], ["hintereinanderweg", "nacheinander"], ["durch", "hintereinander"], ["durch", "hintereinanderweg"], ["hintereinander", "hintereinanderweg"], ["emblem", "symbol"], ["kompression", "komprimierung"], ["kompression", "zusammendrueckung"], ["druck", "kompression"], ["kompression", "pressung"], ["kompression", "verdichtung"], ["komprimierung", "zusammendrueckung"], ["druck", "komprimierung"], ["komprimierung", "pressung"], ["komprimierung", "verdichtung"], ["druck", "zusammendrueckung"], ["pressung", "zusammendrueckung"], ["verdichtung", "zusammendrueckung"], ["druck", "pressung"], ["druck", "verdichtung"], ["pressung", "verdichtung"], ["abstimmen", "voten"], ["voten", "votieren"], ["stimmen", "voten"], ["voten", "waehlen"], ["abstimmen", "votieren"], ["abstimmen", "stimmen"], ["abstimmen", "waehlen"], ["stimmen", "votieren"], ["votieren", "waehlen"], ["stimmen", "waehlen"], ["mitreissen", "reissen"], ["mitreissen", "zerren"], ["mitreissen", "ziehen"], ["mitreissen", "schleppen"], ["mitreissen", "trecken"], ["abschleppen", "mitreissen"], ["reissen", "zerren"], ["reissen", "ziehen"], ["reissen", "schleppen"], ["reissen", "trecken"], ["abschleppen", "reissen"], ["zerren", "ziehen"], ["schleppen", "zerren"], ["trecken", "zerren"], ["abschleppen", "zerren"], ["schleppen", "ziehen"], ["trecken", "ziehen"], ["abschleppen", "ziehen"], ["schleppen", "trecken"], ["abschleppen", "schleppen"], ["abschleppen", "trecken"], ["druck", "hektik"], ["aufregung", "hektik"], ["hektik", "stress"], ["hektik", "nervositaet"], ["belastung", "hektik"], ["aufregung", "druck"], ["druck", "stress"], ["druck", "nervositaet"], ["belastung", "druck"], ["aufregung", "stress"], ["aufregung", "nervositaet"], ["aufregung", "belastung"], ["nervositaet", "stress"], ["belastung", "stress"], ["belastung", "nervositaet"], ["initiative", "schritte"], ["schritte", "taetigwerden"], ["massnahme", "schritte"], ["move", "schritte"], ["aktion", "schritte"], ["initiative", "taetigwerden"], ["initiative", "massnahme"], ["initiative", "move"], ["aktion", "initiative"], ["massnahme", "taetigwerden"], ["move", "taetigwerden"], ["aktion", "taetigwerden"], ["massnahme", "move"], ["aktion", "massnahme"], ["aktion", "move"], ["lagerstaette", "quelle"], ["quelle", "vorkommen"], ["lagerstaette", "vorkommen"], ["nutzen", "pluspunkt"], ["pluspunkt", "vorteil"], ["gewinn", "pluspunkt"], ["pluspunkt", "vorzug"], ["benefit", "pluspunkt"], ["nutzeffekt", "pluspunkt"], ["plus", "pluspunkt"], ["nutzen", "vorteil"], ["gewinn", "nutzen"], ["nutzen", "vorzug"], ["benefit", "nutzen"], ["nutzeffekt", "nutzen"], ["nutzen", "plus"], ["gewinn", "vorteil"], ["vorteil", "vorzug"], ["benefit", "vorteil"], ["nutzeffekt", "vorteil"], ["plus", "vorteil"], ["gewinn", "vorzug"], ["benefit", "gewinn"], ["gewinn", "nutzeffekt"], ["gewinn", "plus"], ["benefit", "vorzug"], ["nutzeffekt", "vorzug"], ["plus", "vorzug"], ["benefit", "nutzeffekt"], ["benefit", "plus"], ["nutzeffekt", "plus"], ["sendeplatz", "sender"], ["kanal", "sendeplatz"], ["kanal", "sender"], ["abstecken", "bestimmen"], ["bestimmen", "definieren"], ["abgrenzen", "bestimmen"], ["bestimmen", "festlegen"], ["abstecken", "definieren"], ["abgrenzen", "abstecken"], ["abstecken", "festlegen"], ["abgrenzen", "definieren"], ["definieren", "festlegen"], ["abgrenzen", "festlegen"], ["aenderung", "redigieren"], ["aenderung", "revision"], ["aenderung", "durchsicht"], ["aenderung", "veraenderung"], ["abaenderung", "aenderung"], ["redigieren", "revision"], ["durchsicht", "redigieren"], ["redigieren", "veraenderung"], ["abaenderung", "redigieren"], ["durchsicht", "revision"], ["revision", "veraenderung"], ["abaenderung", "revision"], ["durchsicht", "veraenderung"], ["abaenderung", "durchsicht"], ["abaenderung", "veraenderung"], ["ablegen", "ausrichten"], ["ausrichten", "hinstellen"], ["ausrichten", "zurechtruecken"], ["abstellen", "ausrichten"], ["ausrichten", "positionieren"], ["ausrichten", "platzieren"], ["ablegen", "hinstellen"], ["ablegen", "zurechtruecken"], ["ablegen", "abstellen"], ["ablegen", "positionieren"], ["ablegen", "platzieren"], ["hinstellen", "zurechtruecken"], ["hinstellen", "positionieren"], ["hinstellen", "platzieren"], ["abstellen", "zurechtruecken"], ["positionieren", "zurechtruecken"], ["platzieren", "zurechtruecken"], ["abstellen", "positionieren"], ["abstellen", "platzieren"], ["kippen", "neigen"], ["vorsprung", "zinke"], ["ecke", "zinke"], ["spitze", "zinke"], ["zacke", "zinke"], ["kante", "zinke"], ["ecke", "vorsprung"], ["spitze", "vorsprung"], ["vorsprung", "zacke"], ["kante", "vorsprung"], ["ecke", "spitze"], ["ecke", "zacke"], ["spitze", "zacke"], ["kante", "spitze"], ["kante", "zacke"], ["abnahme", "gestattung"], ["erlaubnis", "gestattung"], ["bewilligung", "gestattung"], ["gestattung", "zustimmung"], ["freigabe", "gestattung"], ["abnahme", "erlaubnis"], ["abnahme", "bewilligung"], ["abnahme", "zustimmung"], ["abnahme", "freigabe"], ["bewilligung", "erlaubnis"], ["erlaubnis", "zustimmung"], ["erlaubnis", "freigabe"], ["bewilligung", "zustimmung"], ["bewilligung", "freigabe"], ["freigabe", "zustimmung"], ["erteilung", "verteilung"], ["ausgabe", "verteilung"], ["aushaendigung", "verteilung"], ["herausgabe", "verteilung"], ["ausgabe", "erteilung"], ["aushaendigung", "erteilung"], ["erteilung", "herausgabe"], ["ausgabe", "aushaendigung"], ["ausgabe", "herausgabe"], ["aushaendigung", "herausgabe"], ["entlang", "vorwaerts"], ["fuerbass", "vorwaerts"], ["vorwaerts", "weiter"], ["entlang", "fuerbass"], ["entlang", "weiter"], ["fuerbass", "weiter"], ["schwingung", "vibration"], ["erschuetterung", "vibration"], ["geruettel", "vibration"], ["stoss", "vibration"], ["erschuetterung", "schwingung"], ["geruettel", "schwingung"], ["schwingung", "stoss"], ["erschuetterung", "geruettel"], ["erschuetterung", "stoss"], ["geruettel", "stoss"], ["arrangement", "komposition"], ["aufstellung", "komposition"], ["anordnung", "komposition"], ["arrangement", "aufstellung"], ["anordnung", "arrangement"], ["chiffre", "kennung"], ["identifikator", "kennung"], ["identifikationsnummer", "kennung"], ["identifizierungszeichen", "kennung"], ["kennung", "schluessel"], ["geheimzeichen", "kennung"], ["code", "kennung"], ["chiffre", "identifikator"], ["chiffre", "identifikationsnummer"], ["chiffre", "identifizierungszeichen"], ["chiffre", "schluessel"], ["chiffre", "geheimzeichen"], ["chiffre", "code"], ["identifikationsnummer", "identifikator"], ["identifikator", "identifizierungszeichen"], ["identifikator", "schluessel"], ["geheimzeichen", "identifikator"], ["code", "identifikator"], ["identifikationsnummer", "identifizierungszeichen"], ["identifikationsnummer", "schluessel"], ["geheimzeichen", "identifikationsnummer"], ["code", "identifikationsnummer"], ["identifizierungszeichen", "schluessel"], ["geheimzeichen", "identifizierungszeichen"], ["code", "identifizierungszeichen"], ["geheimzeichen", "schluessel"], ["code", "schluessel"], ["code", "geheimzeichen"], ["beinahe", "nahezu"], ["bald", "beinahe"], ["beinahe", "fast"], ["beinahe", "knapp"], ["annaehernd", "beinahe"], ["bald", "nahezu"], ["fast", "nahezu"], ["knapp", "nahezu"], ["annaehernd", "nahezu"], ["bald", "fast"], ["bald", "knapp"], ["annaehernd", "bald"], ["fast", "knapp"], ["annaehernd", "fast"], ["annaehernd", "knapp"], ["anprall", "zusammenstoss"], ["aufprall", "zusammenstoss"], ["zusammenprall", "zusammenstoss"], ["auffahrunfall", "zusammenstoss"], ["kollision", "zusammenstoss"], ["karambolage", "zusammenstoss"], ["anprall", "aufprall"], ["anprall", "zusammenprall"], ["anprall", "auffahrunfall"], ["anprall", "kollision"], ["anprall", "karambolage"], ["aufprall", "zusammenprall"], ["auffahrunfall", "aufprall"], ["aufprall", "kollision"], ["aufprall", "karambolage"], ["auffahrunfall", "zusammenprall"], ["kollision", "zusammenprall"], ["karambolage", "zusammenprall"], ["auffahrunfall", "kollision"], ["auffahrunfall", "karambolage"], ["karambolage", "kollision"], ["schritt", "stufen"], ["umhuellung", "verpackung"], ["drumherum", "umhuellung"], ["umhuellung", "umverpackung"], ["huelle", "umhuellung"], ["drumherum", "verpackung"], ["umverpackung", "verpackung"], ["huelle", "verpackung"], ["drumherum", "umverpackung"], ["drumherum", "huelle"], ["huelle", "umverpackung"], ["innen", "innerhalb"], ["innerhalb", "innerlich"], ["drin", "innerhalb"], ["innen", "innerlich"], ["drin", "innen"], ["drin", "innerlich"], ["dazu", "diesbezwecks"], ["diesbezwecks", "hierfuer"], ["dafuer", "diesbezwecks"], ["dazu", "hierfuer"], ["dafuer", "dazu"], ["dafuer", "hierfuer"], ["offline", "unangeschlossen"], ["getrennt", "offline"], ["offline", "rechnerunabhaengig"], ["getrennt", "unangeschlossen"], ["rechnerunabhaengig", "unangeschlossen"], ["getrennt", "rechnerunabhaengig"], ["lagern", "setzen"], ["bestehen", "dokument"], ["bestehen", "existenz"], ["bestehen", "vorhandensein"], ["dokument", "existenz"], ["dokument", "vorhandensein"], ["existenz", "vorhandensein"], ["auftritt", "gig"], ["gig", "spieleinsatz"], ["einsatz", "gig"], ["gig", "performance"], ["auftritt", "spieleinsatz"], ["auftritt", "einsatz"], ["auftritt", "performance"], ["einsatz", "spieleinsatz"], ["performance", "spieleinsatz"], ["einsatz", "performance"], ["fase", "knie"], ["fase", "winkel"], ["knie", "winkel"], ["nichts", "vakuum"], ["luecke", "nichts"], ["leere", "nichts"], ["luecke", "vakuum"], ["leere", "vakuum"], ["leere", "luecke"], ["energie", "staerke"], ["dynamik", "energie"], ["dynamik", "staerke"], ["design", "plan"], ["konzeption", "plan"], ["konzept", "plan"], ["entwurf", "plan"], ["design", "konzeption"], ["design", "konzept"], ["design", "entwurf"], ["konzept", "konzeption"], ["entwurf", "konzeption"], ["entwurf", "konzept"], ["datum", "zeitangabe"], ["zeitangabe", "zeitpunkt"], ["datum", "zeitpunkt"], ["alternativ", "andernfalls"], ["andernfalls", "widrigenfalls"], ["anderenfalls", "andernfalls"], ["andernfalls", "ansonsten"], ["andernfalls", "sonst"], ["alternativ", "widrigenfalls"], ["alternativ", "anderenfalls"], ["alternativ", "ansonsten"], ["alternativ", "sonst"], ["anderenfalls", "widrigenfalls"], ["ansonsten", "widrigenfalls"], ["sonst", "widrigenfalls"], ["anderenfalls", "ansonsten"], ["anderenfalls", "sonst"], ["ansonsten", "sonst"], ["entree", "pforte"], ["einlass", "entree"], ["entree", "portal"], ["entree", "tor"], ["eingang", "entree"], ["einlass", "pforte"], ["pforte", "portal"], ["pforte", "tor"], ["eingang", "pforte"], ["einlass", "portal"], ["einlass", "tor"], ["eingang", "einlass"], ["portal", "tor"], ["eingang", "portal"], ["eingang", "tor"], ["hieb", "stoss"], ["schlag", "stoss"], ["hieb", "schlag"], ["verruecken", "versetzen"], ["umstellen", "versetzen"], ["versetzen", "wegschieben"], ["versetzen", "verstellen"], ["verschieben", "versetzen"], ["umsetzen", "versetzen"], ["verfrachten", "versetzen"], ["umstellen", "verruecken"], ["verruecken", "wegschieben"], ["verruecken", "verstellen"], ["verruecken", "verschieben"], ["umsetzen", "verruecken"], ["verfrachten", "verruecken"], ["umstellen", "wegschieben"], ["umstellen", "verstellen"], ["umstellen", "verschieben"], ["umsetzen", "umstellen"], ["umstellen", "verfrachten"], ["verstellen", "wegschieben"], ["verschieben", "wegschieben"], ["umsetzen", "wegschieben"], ["verfrachten", "wegschieben"], ["verschieben", "verstellen"], ["umsetzen", "verstellen"], ["verfrachten", "verstellen"], ["umsetzen", "verschieben"], ["verfrachten", "verschieben"], ["umsetzen", "verfrachten"], ["unten", "unterhalb"], ["darunter", "unten"], ["herunten", "unten"], ["darunter", "unterhalb"], ["herunten", "unterhalb"], ["darunter", "herunten"], ["heizkoerper", "radiator"], ["heizung", "radiator"], ["heizkoerper", "heizung"], ["messeinheit", "messer"], ["messapparat", "messeinheit"], ["messeinheit", "messinstrument"], ["messeinheit", "messgeraet"], ["messapparat", "messer"], ["messer", "messinstrument"], ["messer", "messgeraet"], ["messapparat", "messinstrument"], ["messapparat", "messgeraet"], ["messgeraet", "messinstrument"], ["horn", "hupe"], ["hupe", "troete"], ["hupe", "sirene"], ["horn", "troete"], ["horn", "sirene"], ["sirene", "troete"], ["eingebaut", "eingebettet"], ["eingebaut", "integriert"], ["eingebettet", "integriert"], ["abnutzung", "verbrauch"], ["abnutzung", "verschleiss"], ["verbrauch", "verschleiss"], ["dynamik", "tonstaerke"], ["geraeuschpegel", "tonstaerke"], ["lautstaerke", "tonstaerke"], ["dynamik", "geraeuschpegel"], ["dynamik", "lautstaerke"], ["geraeuschpegel", "lautstaerke"], ["klar", "wahrhaftig"], ["klar", "tatsaechlich"], ["fuerwahr", "klar"], ["tatsaechlich", "wahrhaftig"], ["fuerwahr", "wahrhaftig"], ["fuerwahr", "tatsaechlich"], ["retrograd", "zurueck"], ["retrograd", "rueckwaerts"], ["retour", "retrograd"], ["rueckwaerts", "zurueck"], ["retour", "zurueck"], ["retour", "rueckwaerts"], ["norm", "regel"], ["annaeherung", "herangehensweise"], ["ansatz", "herangehensweise"], ["approach", "herangehensweise"], ["herangehensweise", "vorgehensweise"], ["herangehensweise", "vorgangsweise"], ["annaeherung", "ansatz"], ["annaeherung", "approach"], ["annaeherung", "vorgehensweise"], ["annaeherung", "vorgangsweise"], ["ansatz", "approach"], ["ansatz", "vorgehensweise"], ["ansatz", "vorgangsweise"], ["approach", "vorgehensweise"], ["approach", "vorgangsweise"], ["vorgangsweise", "vorgehensweise"], ["beiseitelegen", "zurueckhalten"], ["hinterlegen", "zurueckhalten"], ["zurueckhalten", "zuruecklegen"], ["reservieren", "zurueckhalten"], ["beiseitelegen", "hinterlegen"], ["beiseitelegen", "zuruecklegen"], ["beiseitelegen", "reservieren"], ["hinterlegen", "zuruecklegen"], ["hinterlegen", "reservieren"], ["reservieren", "zuruecklegen"], ["fuss", "postument"], ["fundation", "fuss"], ["fundament", "fuss"], ["fuss", "sockel"], ["fuss", "grundmauer"], ["basis", "fuss"], ["fuss", "postament"], ["fundation", "postument"], ["fundament", "postument"], ["postument", "sockel"], ["grundmauer", "postument"], ["basis", "postument"], ["postament", "postument"], ["fundament", "fundation"], ["fundation", "sockel"], ["fundation", "grundmauer"], ["basis", "fundation"], ["fundation", "postament"], ["fundament", "sockel"], ["fundament", "grundmauer"], ["basis", "fundament"], ["fundament", "postament"], ["grundmauer", "sockel"], ["basis", "sockel"], ["postament", "sockel"], ["basis", "grundmauer"], ["grundmauer", "postament"], ["basis", "postament"], ["aufzeichnen", "speichern"], ["aufzeichnen", "festhalten"], ["festhalten", "speichern"], ["achsen", "axial"], ["behuf", "intention"], ["ansinnen", "behuf"], ["behuf", "dessein"], ["behuf", "vorhaben"], ["absicht", "behuf"], ["behuf", "plan"], ["behuf", "zweck"], ["ansinnen", "intention"], ["dessein", "intention"], ["intention", "vorhaben"], ["absicht", "intention"], ["intention", "plan"], ["intention", "zweck"], ["ansinnen", "dessein"], ["absicht", "ansinnen"], ["ansinnen", "plan"], ["ansinnen", "zweck"], ["dessein", "vorhaben"], ["absicht", "dessein"], ["dessein", "plan"], ["dessein", "zweck"], ["absicht", "vorhaben"], ["plan", "vorhaben"], ["vorhaben", "zweck"], ["absicht", "plan"], ["absicht", "zweck"], ["plan", "zweck"], ["aussentemperatur", "umgebungstemperatur"], ["hart", "unnachsichtig"], ["autoritaer", "unnachsichtig"], ["streng", "unnachsichtig"], ["katonisch", "unnachsichtig"], ["strikt", "unnachsichtig"], ["autoritaer", "hart"], ["hart", "streng"], ["hart", "katonisch"], ["hart", "strikt"], ["autoritaer", "streng"], ["autoritaer", "katonisch"], ["autoritaer", "strikt"], ["katonisch", "streng"], ["streng", "strikt"], ["katonisch", "strikt"], ["grad", "rang"], ["klasse", "rang"], ["rang", "stufe"], ["qualitaet", "rang"], ["grad", "klasse"], ["grad", "stufe"], ["grad", "qualitaet"], ["klasse", "stufe"], ["klasse", "qualitaet"], ["qualitaet", "stufe"], ["alarmsignal", "warnton"], ["alarmsignal", "notruf"], ["alarmruf", "alarmsignal"], ["alarmsignal", "warnsignal"], ["alarm", "alarmsignal"], ["alarmsignal", "gefahrenmeldung"], ["notruf", "warnton"], ["alarmruf", "warnton"], ["warnsignal", "warnton"], ["alarm", "warnton"], ["gefahrenmeldung", "warnton"], ["alarmruf", "notruf"], ["notruf", "warnsignal"], ["alarm", "notruf"], ["gefahrenmeldung", "notruf"], ["alarmruf", "warnsignal"], ["alarm", "alarmruf"], ["alarmruf", "gefahrenmeldung"], ["alarm", "warnsignal"], ["gefahrenmeldung", "warnsignal"], ["alarm", "gefahrenmeldung"], ["elektromagnet", "hubmagnet"], ["hubmagnet", "spule"], ["elektromagnet", "spule"], ["assimilation", "assimilierung"], ["angleichung", "assimilation"], ["anpassung", "assimilation"], ["angleichung", "assimilierung"], ["anpassung", "assimilierung"], ["angleichung", "anpassung"], ["einrichtung", "vorfeldarbeiten"], ["vorbereitung", "vorfeldarbeiten"], ["vorarbeiten", "vorfeldarbeiten"], ["einrichtung", "vorbereitung"], ["einrichtung", "vorarbeiten"], ["vorarbeiten", "vorbereitung"], ["druecken", "pferchen"], ["pferchen", "schieben"], ["draengen", "pferchen"], ["draengeln", "pferchen"], ["druecken", "schieben"], ["draengen", "druecken"], ["draengeln", "druecken"], ["draengen", "schieben"], ["draengeln", "schieben"], ["draengeln", "draengen"], ["regeln", "steuern"], ["regeln", "schalten"], ["regeln", "reglementieren"], ["regeln", "regulieren"], ["schalten", "steuern"], ["reglementieren", "steuern"], ["regulieren", "steuern"], ["reglementieren", "schalten"], ["regulieren", "schalten"], ["reglementieren", "regulieren"], ["gelenk", "scharniergelenk"], ["scharnier", "scharniergelenk"], ["gelenk", "scharnier"], ["aktiv", "eingeschaltet"], ["aktiv", "angeschaltet"], ["angeschaltet", "eingeschaltet"], ["detergens", "reinigungsmittel"], ["reinigungsmittel", "tensid"], ["reinigungsmittel", "seife"], ["putzmittel", "reinigungsmittel"], ["reiniger", "reinigungsmittel"], ["detergenz", "reinigungsmittel"], ["detergens", "tensid"], ["detergens", "seife"], ["detergens", "putzmittel"], ["detergens", "reiniger"], ["detergens", "detergenz"], ["seife", "tensid"], ["putzmittel", "tensid"], ["reiniger", "tensid"], ["detergenz", "tensid"], ["putzmittel", "seife"], ["reiniger", "seife"], ["detergenz", "seife"], ["putzmittel", "reiniger"], ["detergenz", "putzmittel"], ["detergenz", "reiniger"], ["sobald", "sowie"], ["gelenkwelle", "kardanwelle"], ["druecken", "herabsetzen"], ["hermetisch", "impermeabel"], ["hermetisch", "undurchdringlich"], ["hermetisch", "undurchlaessig"], ["hermetisch", "undurchdringbar"], ["dicht", "hermetisch"], ["hermetisch", "luftdicht"], ["geschuetzt", "hermetisch"], ["impermeabel", "undurchdringlich"], ["impermeabel", "undurchlaessig"], ["impermeabel", "undurchdringbar"], ["dicht", "impermeabel"], ["impermeabel", "luftdicht"], ["geschuetzt", "impermeabel"], ["undurchdringlich", "undurchlaessig"], ["undurchdringbar", "undurchdringlich"], ["dicht", "undurchdringlich"], ["luftdicht", "undurchdringlich"], ["geschuetzt", "undurchdringlich"], ["undurchdringbar", "undurchlaessig"], ["dicht", "undurchlaessig"], ["luftdicht", "undurchlaessig"], ["geschuetzt", "undurchlaessig"], ["dicht", "undurchdringbar"], ["luftdicht", "undurchdringbar"], ["geschuetzt", "undurchdringbar"], ["dicht", "luftdicht"], ["dicht", "geschuetzt"], ["geschuetzt", "luftdicht"], ["beigabe", "paraphernalie"], ["beigabe", "zusatz"], ["beigabe", "zubehoer"], ["paraphernalie", "zusatz"], ["paraphernalie", "zubehoer"], ["zubehoer", "zusatz"], ["abgeschlossen", "separat"], ["arbeitsweise", "methode"], ["arbeitsweise", "praktik"], ["arbeitsweise", "verfahren"], ["arbeitsweise", "vorgehen"], ["arbeitsweise", "verfahrensweise"], ["methode", "praktik"], ["methode", "verfahren"], ["methode", "vorgehen"], ["methode", "verfahrensweise"], ["praktik", "verfahren"], ["praktik", "vorgehen"], ["praktik", "verfahrensweise"], ["verfahren", "vorgehen"], ["verfahren", "verfahrensweise"], ["verfahrensweise", "vorgehen"], ["handlungsspielraum", "puffer"], ["platz", "puffer"], ["puffer", "spielraum"], ["freiraum", "puffer"], ["luft", "puffer"], ["handlungsspielraum", "platz"], ["handlungsspielraum", "spielraum"], ["freiraum", "handlungsspielraum"], ["handlungsspielraum", "luft"], ["platz", "spielraum"], ["freiraum", "platz"], ["luft", "platz"], ["freiraum", "spielraum"], ["luft", "spielraum"], ["freiraum", "luft"], ["einzeln", "isoliert"], ["einzeln", "einzig"], ["einzeln", "extra"], ["abseits", "einzeln"], ["alleinig", "einzeln"], ["einzeln", "monadisch"], ["einzig", "isoliert"], ["extra", "isoliert"], ["abseits", "isoliert"], ["alleinig", "isoliert"], ["isoliert", "monadisch"], ["einzig", "extra"], ["abseits", "einzig"], ["alleinig", "einzig"], ["einzig", "monadisch"], ["abseits", "extra"], ["alleinig", "extra"], ["extra", "monadisch"], ["abseits", "alleinig"], ["abseits", "monadisch"], ["alleinig", "monadisch"], ["etikette", "label"], ["etikett", "label"], ["aufdruck", "label"], ["etikett", "etikette"], ["aufdruck", "etikette"], ["aufdruck", "etikett"], ["assistenz", "mitarbeit"], ["assistenz", "hilfe"], ["assistenz", "unterstuetzung"], ["assistenz", "mithilfe"], ["assistenz", "beihilfe"], ["assistenz", "zuarbeit"], ["hilfe", "mitarbeit"], ["beihilfe", "mitarbeit"], ["mitarbeit", "zuarbeit"], ["hilfe", "unterstuetzung"], ["hilfe", "mithilfe"], ["beihilfe", "hilfe"], ["hilfe", "zuarbeit"], ["beihilfe", "unterstuetzung"], ["unterstuetzung", "zuarbeit"], ["beihilfe", "mithilfe"], ["mithilfe", "zuarbeit"], ["beihilfe", "zuarbeit"], ["progressiv", "vorwaerts"], ["progressiv", "weiter"], ["progressiv", "voran"], ["voran", "weiter"], ["gleichmaessig", "symmetrisch"], ["gleichfoermig", "gleichmaessig"], ["ausgeglichen", "gleichmaessig"], ["gleichfoermig", "symmetrisch"], ["ausgeglichen", "symmetrisch"], ["ausgeglichen", "gleichfoermig"], ["absetzen", "desertieren"], ["abfallen", "absetzen"], ["absetzen", "ueberlaufen"], ["absetzen", "desziszieren"], ["abfallen", "desertieren"], ["desertieren", "ueberlaufen"], ["desertieren", "desziszieren"], ["abfallen", "ueberlaufen"], ["abfallen", "desziszieren"], ["desziszieren", "ueberlaufen"], ["kratzer", "striegel"], ["kratzer", "schaber"], ["schaber", "striegel"], ["auftreten", "ausbrechen"], ["ausbrechen", "entstehen"], ["aufkommen", "ausbrechen"], ["ausbrechen", "eintreten"], ["ausbrechen", "einsetzen"], ["auftreten", "entstehen"], ["aufkommen", "auftreten"], ["auftreten", "eintreten"], ["auftreten", "einsetzen"], ["aufkommen", "entstehen"], ["eintreten", "entstehen"], ["einsetzen", "entstehen"], ["aufkommen", "eintreten"], ["aufkommen", "einsetzen"], ["auffuellen", "ergaenzen"], ["ergaenzen", "fuellen"], ["ergaenzen", "nachschenken"], ["ergaenzen", "nachfuellen"], ["ergaenzen", "vollmachen"], ["auffuellen", "fuellen"], ["auffuellen", "nachschenken"], ["auffuellen", "nachfuellen"], ["auffuellen", "vollmachen"], ["fuellen", "nachschenken"], ["fuellen", "nachfuellen"], ["fuellen", "vollmachen"], ["nachfuellen", "nachschenken"], ["nachschenken", "vollmachen"], ["nachfuellen", "vollmachen"], ["senkrechte", "vertikale"], ["senkwaage", "vertikale"], ["lot", "vertikale"], ["normale", "vertikale"], ["senkrechte", "senkwaage"], ["lot", "senkrechte"], ["normale", "senkrechte"], ["lot", "senkwaage"], ["normale", "senkwaage"], ["lot", "normale"], ["fetten", "oelen"], ["durchschmieren", "fetten"], ["abschmieren", "fetten"], ["fetten", "schmieren"], ["durchschmieren", "oelen"], ["abschmieren", "oelen"], ["oelen", "schmieren"], ["abschmieren", "durchschmieren"], ["durchschmieren", "schmieren"], ["abschmieren", "schmieren"], ["arbeitsgang", "runde"], ["durchlauf", "runde"], ["durchgang", "runde"], ["arbeitsgang", "durchlauf"], ["arbeitsgang", "durchgang"], ["durchgang", "durchlauf"], ["lauern", "vorliegen"], ["lauern", "sein"], ["lauern", "vorkommen"], ["geben", "lauern"], ["existieren", "lauern"], ["bestehen", "lauern"], ["sein", "vorliegen"], ["vorkommen", "vorliegen"], ["geben", "vorliegen"], ["existieren", "vorliegen"], ["bestehen", "vorliegen"], ["sein", "vorkommen"], ["geben", "sein"], ["existieren", "sein"], ["bestehen", "sein"], ["geben", "vorkommen"], ["existieren", "vorkommen"], ["bestehen", "vorkommen"], ["existieren", "geben"], ["bestehen", "geben"], ["bestehen", "existieren"], ["bloss", "nur"], ["allein", "nur"], ["ausschliesslich", "nur"], ["einzig", "nur"], ["alleinig", "nur"], ["lediglich", "nur"], ["nur", "schier"], ["allein", "bloss"], ["ausschliesslich", "bloss"], ["bloss", "einzig"], ["alleinig", "bloss"], ["bloss", "lediglich"], ["bloss", "schier"], ["allein", "ausschliesslich"], ["allein", "einzig"], ["allein", "alleinig"], ["allein", "lediglich"], ["allein", "schier"], ["ausschliesslich", "einzig"], ["alleinig", "ausschliesslich"], ["ausschliesslich", "lediglich"], ["ausschliesslich", "schier"], ["einzig", "lediglich"], ["einzig", "schier"], ["alleinig", "lediglich"], ["alleinig", "schier"], ["lediglich", "schier"], ["exzidieren", "herausschneiden"], ["ausschneiden", "exzidieren"], ["entfernen", "exzidieren"], ["exzidieren", "herausnehmen"], ["dekupieren", "exzidieren"], ["ausschneiden", "herausschneiden"], ["entfernen", "herausschneiden"], ["herausnehmen", "herausschneiden"], ["dekupieren", "herausschneiden"], ["ausschneiden", "entfernen"], ["ausschneiden", "herausnehmen"], ["ausschneiden", "dekupieren"], ["entfernen", "herausnehmen"], ["dekupieren", "entfernen"], ["dekupieren", "herausnehmen"], ["bumper", "stossfaenger"], ["schubstange", "stossfaenger"], ["stossfaenger", "stossstange"], ["bumper", "schubstange"], ["bumper", "stossstange"], ["schubstange", "stossstange"], ["beziehungsweise", "eigentlich"], ["beziehungsweise", "vielmehr"], ["beziehungsweise", "bzw"], ["beziehungsweise", "genauer"], ["beziehungsweise", "respektive"], ["beziehungsweise", "eher"], ["beziehungsweise", "resp"], ["eigentlich", "vielmehr"], ["bzw", "eigentlich"], ["eigentlich", "genauer"], ["eigentlich", "respektive"], ["eher", "eigentlich"], ["eigentlich", "resp"], ["bzw", "vielmehr"], ["genauer", "vielmehr"], ["respektive", "vielmehr"], ["eher", "vielmehr"], ["resp", "vielmehr"], ["bzw", "genauer"], ["bzw", "respektive"], ["bzw", "eher"], ["bzw", "resp"], ["genauer", "respektive"], ["eher", "genauer"], ["genauer", "resp"], ["eher", "respektive"], ["resp", "respektive"], ["eher", "resp"], ["abschliessend", "buendig"], ["abschliessend", "eben"], ["buendig", "eben"], ["anpeilen", "einschlagen"], ["anpeilen", "streben"], ["einschlagen", "streben"], ["abreiben", "feilen"], ["abreiben", "abschmirgeln"], ["abreiben", "glaetten"], ["abreiben", "schmirgeln"], ["abreiben", "abschaben"], ["abfeilen", "abreiben"], ["abreiben", "abschleifen"], ["abschmirgeln", "feilen"], ["feilen", "glaetten"], ["feilen", "schmirgeln"], ["abschaben", "feilen"], ["abfeilen", "feilen"], ["abschleifen", "feilen"], ["abschmirgeln", "glaetten"], ["abschmirgeln", "schmirgeln"], ["abschaben", "abschmirgeln"], ["abfeilen", "abschmirgeln"], ["abschleifen", "abschmirgeln"], ["glaetten", "schmirgeln"], ["abschaben", "glaetten"], ["abfeilen", "glaetten"], ["abschleifen", "glaetten"], ["abschaben", "schmirgeln"], ["abfeilen", "schmirgeln"], ["abschleifen", "schmirgeln"], ["abfeilen", "abschaben"], ["abschaben", "abschleifen"], ["abfeilen", "abschleifen"], ["schaff", "schrank"], ["schrank", "spind"], ["schapp", "schrank"], ["kasten", "schrank"], ["schaft", "schrank"], ["schaff", "spind"], ["schaff", "schapp"], ["kasten", "schaff"], ["schaff", "schaft"], ["schapp", "spind"], ["kasten", "spind"], ["schaft", "spind"], ["kasten", "schapp"], ["schaft", "schapp"], ["kasten", "schaft"], ["nebst", "sowohl"], ["neben", "sowohl"], ["sowohl", "wie"], ["sowohl", "zuzueglich"], ["sowie", "sowohl"], ["plus", "sowohl"], ["sowohl", "und"], ["neben", "nebst"], ["nebst", "wie"], ["nebst", "zuzueglich"], ["nebst", "sowie"], ["nebst", "plus"], ["nebst", "und"], ["neben", "wie"], ["neben", "zuzueglich"], ["neben", "sowie"], ["neben", "plus"], ["neben", "und"], ["wie", "zuzueglich"], ["sowie", "wie"], ["plus", "wie"], ["und", "wie"], ["sowie", "zuzueglich"], ["plus", "zuzueglich"], ["und", "zuzueglich"], ["plus", "sowie"], ["sowie", "und"], ["plus", "und"], ["einbau", "installation"], ["installation", "zusammenbau"], ["installation", "montage"], ["installation", "zusammensetzen"], ["befestigung", "installation"], ["einbau", "zusammenbau"], ["einbau", "montage"], ["einbau", "zusammensetzen"], ["befestigung", "einbau"], ["montage", "zusammenbau"], ["zusammenbau", "zusammensetzen"], ["befestigung", "zusammenbau"], ["montage", "zusammensetzen"], ["befestigung", "montage"], ["befestigung", "zusammensetzen"], ["definitiv", "entschieden"], ["definitiv", "geklaert"], ["definitiv", "geregelt"], ["definitiv", "unumstoesslich"], ["definitiv", "offiziell"], ["entschieden", "geklaert"], ["entschieden", "geregelt"], ["entschieden", "unumstoesslich"], ["endgueltig", "entschieden"], ["entschieden", "offiziell"], ["geklaert", "geregelt"], ["geklaert", "unumstoesslich"], ["endgueltig", "geklaert"], ["geklaert", "offiziell"], ["geregelt", "unumstoesslich"], ["endgueltig", "geregelt"], ["geregelt", "offiziell"], ["endgueltig", "unumstoesslich"], ["offiziell", "unumstoesslich"], ["endgueltig", "offiziell"], ["abkuehlung", "kuehlung"], ["buchen", "reservierung"], ["buchen", "order"], ["bestellung", "buchen"], ["buchen", "buchung"], ["order", "reservierung"], ["bestellung", "reservierung"], ["buchung", "reservierung"], ["bestellung", "order"], ["buchung", "order"], ["bestellung", "buchung"], ["dazugehoerend", "dazugehoerig"], ["dazu", "dazugehoerig"], ["dazugehoerig", "hierzu"], ["dazugehoerig", "diesbezueglich"], ["dazu", "dazugehoerend"], ["dazugehoerend", "hierzu"], ["dazugehoerend", "diesbezueglich"], ["dazu", "hierzu"], ["dazu", "diesbezueglich"], ["diesbezueglich", "hierzu"], ["bezeichner", "name"], ["bezeichner", "designator"], ["bezeichner", "bezeichnung"], ["begriff", "bezeichner"], ["begrifflichkeit", "bezeichner"], ["designator", "name"], ["bezeichnung", "name"], ["begriff", "name"], ["begrifflichkeit", "name"], ["bezeichnung", "designator"], ["begriff", "designator"], ["begrifflichkeit", "designator"], ["begriff", "bezeichnung"], ["begrifflichkeit", "bezeichnung"], ["begriff", "begrifflichkeit"], ["verlassen", "zaehlen"], ["bauen", "verlassen"], ["verlassen", "vertrauen"], ["gehennach", "verlassen"], ["bauen", "zaehlen"], ["vertrauen", "zaehlen"], ["gehennach", "zaehlen"], ["bauen", "vertrauen"], ["bauen", "gehennach"], ["gehennach", "vertrauen"], ["box", "kiste"], ["kasten", "kiste"], ["evaluation", "pruefung"], ["bewertung", "evaluation"], ["einstufung", "evaluation"], ["beurteilung", "evaluation"], ["assessment", "evaluation"], ["evaluation", "evaluierung"], ["bewertung", "pruefung"], ["einstufung", "pruefung"], ["beurteilung", "pruefung"], ["assessment", "pruefung"], ["evaluierung", "pruefung"], ["bewertung", "einstufung"], ["beurteilung", "bewertung"], ["assessment", "bewertung"], ["bewertung", "evaluierung"], ["beurteilung", "einstufung"], ["assessment", "einstufung"], ["einstufung", "evaluierung"], ["assessment", "beurteilung"], ["beurteilung", "evaluierung"], ["assessment", "evaluierung"], ["einlass", "zugang"], ["einlass", "eintritt"], ["einlass", "zutritt"], ["zugang", "zutritt"], ["eintritt", "zutritt"], ["auswechseln", "tauschen"], ["ersetzen", "tauschen"], ["tauschen", "transferieren"], ["abloesen", "tauschen"], ["substituieren", "tauschen"], ["austauschen", "auswechseln"], ["austauschen", "ersetzen"], ["austauschen", "transferieren"], ["abloesen", "austauschen"], ["austauschen", "substituieren"], ["auswechseln", "ersetzen"], ["auswechseln", "transferieren"], ["abloesen", "auswechseln"], ["auswechseln", "substituieren"], ["ersetzen", "transferieren"], ["abloesen", "ersetzen"], ["ersetzen", "substituieren"], ["abloesen", "transferieren"], ["substituieren", "transferieren"], ["abloesen", "substituieren"], ["immer", "jeweils"], ["norm", "normalitaet"], ["normalitaet", "regel"], ["determinieren", "festlegen"], ["determinieren", "festsetzen"], ["determinieren", "entscheiden"], ["bestimmen", "determinieren"], ["determinieren", "stipulieren"], ["beschliessen", "determinieren"], ["festlegen", "festsetzen"], ["entscheiden", "festlegen"], ["festlegen", "stipulieren"], ["beschliessen", "festlegen"], ["entscheiden", "festsetzen"], ["bestimmen", "festsetzen"], ["festsetzen", "stipulieren"], ["beschliessen", "festsetzen"], ["bestimmen", "entscheiden"], ["entscheiden", "stipulieren"], ["beschliessen", "entscheiden"], ["bestimmen", "stipulieren"], ["beschliessen", "bestimmen"], ["beschliessen", "stipulieren"], ["netz", "web"], ["internet", "netz"], ["netz", "www"], ["internet", "web"], ["web", "www"], ["internet", "www"], ["ausblick", "blick"], ["ansicht", "blick"], ["anblick", "blick"], ["aussicht", "blick"], ["blick", "sicht"], ["ansicht", "ausblick"], ["anblick", "ausblick"], ["ausblick", "aussicht"], ["ausblick", "sicht"], ["anblick", "ansicht"], ["ansicht", "aussicht"], ["ansicht", "sicht"], ["anblick", "aussicht"], ["anblick", "sicht"], ["aussicht", "sicht"], ["klapperig", "klapprig"], ["klapprig", "locker"], ["klapprig", "wacklig"], ["klapprig", "wackelig"], ["geloest", "klapprig"], ["klapprig", "lose"], ["klapperig", "locker"], ["klapperig", "wacklig"], ["klapperig", "wackelig"], ["geloest", "klapperig"], ["klapperig", "lose"], ["locker", "wacklig"], ["locker", "wackelig"], ["geloest", "locker"], ["locker", "lose"], ["wackelig", "wacklig"], ["geloest", "wacklig"], ["lose", "wacklig"], ["geloest", "wackelig"], ["lose", "wackelig"], ["geloest", "lose"], ["querverweis", "verknuepfung"], ["hyperlink", "verknuepfung"], ["link", "verknuepfung"], ["hyperlink", "querverweis"], ["link", "querverweis"], ["hyperlink", "link"], ["kabel", "leitung"], ["beherbergen", "einquartieren"], ["aufnehmen", "beherbergen"], ["beherbergen", "unterbringen"], ["beherbergen", "unterkriegen"], ["aufnehmen", "einquartieren"], ["einquartieren", "unterbringen"], ["einquartieren", "unterkriegen"], ["aufnehmen", "unterbringen"], ["aufnehmen", "unterkriegen"], ["unterbringen", "unterkriegen"], ["blank", "leer"], ["glaetten", "polieren"], ["abschleifen", "polieren"], ["master", "schablone"], ["master", "template"], ["master", "vorlage"], ["schablone", "template"], ["schablone", "vorlage"], ["template", "vorlage"], ["frontscheibe", "windschutzscheibe"], ["distribution", "verteilung"], ["austeilung", "distribution"], ["austeilung", "verteilung"], ["breitenmass", "profil"], ["mittelmass", "profil"], ["durchschnitt", "profil"], ["laengsschnitt", "profil"], ["profil", "querschnitt"], ["profil", "quere"], ["breitenmass", "mittelmass"], ["breitenmass", "durchschnitt"], ["breitenmass", "laengsschnitt"], ["breitenmass", "querschnitt"], ["breitenmass", "quere"], ["laengsschnitt", "mittelmass"], ["mittelmass", "querschnitt"], ["mittelmass", "quere"], ["durchschnitt", "laengsschnitt"], ["durchschnitt", "querschnitt"], ["durchschnitt", "quere"], ["laengsschnitt", "querschnitt"], ["laengsschnitt", "quere"], ["quere", "querschnitt"], ["gerade", "insbesondere"], ["insbesondere", "speziell"], ["besonders", "insbesondere"], ["insbesondere", "namentlich"], ["gerade", "speziell"], ["besonders", "gerade"], ["gerade", "namentlich"], ["besonders", "speziell"], ["namentlich", "speziell"], ["besonders", "namentlich"], ["auszucken", "explodieren"], ["ausrasten", "auszucken"], ["abgehen", "auszucken"], ["auszucken", "durchdrehen"], ["austicken", "auszucken"], ["auszucken", "toben"], ["ausflippen", "auszucken"], ["ausrasten", "explodieren"], ["abgehen", "explodieren"], ["durchdrehen", "explodieren"], ["austicken", "explodieren"], ["explodieren", "toben"], ["ausflippen", "explodieren"], ["abgehen", "ausrasten"], ["ausrasten", "durchdrehen"], ["ausrasten", "austicken"], ["ausrasten", "toben"], ["ausflippen", "ausrasten"], ["abgehen", "durchdrehen"], ["abgehen", "austicken"], ["abgehen", "toben"], ["abgehen", "ausflippen"], ["austicken", "durchdrehen"], ["durchdrehen", "toben"], ["ausflippen", "durchdrehen"], ["austicken", "toben"], ["ausflippen", "austicken"], ["ausflippen", "toben"], ["geschenkt", "unproblematisch"], ["geschenkt", "leicht"], ["geschenkt", "unkompliziert"], ["geschenkt", "simpel"], ["banal", "geschenkt"], ["einfach", "geschenkt"], ["leicht", "unproblematisch"], ["unkompliziert", "unproblematisch"], ["simpel", "unproblematisch"], ["banal", "unproblematisch"], ["einfach", "unproblematisch"], ["leicht", "unkompliziert"], ["leicht", "simpel"], ["banal", "leicht"], ["einfach", "leicht"], ["simpel", "unkompliziert"], ["banal", "unkompliziert"], ["einfach", "unkompliziert"], ["banal", "simpel"], ["einfach", "simpel"], ["banal", "einfach"], ["bedachtsam", "sachtemang"], ["behutsam", "sachtemang"], ["sachtemang", "sorgsam"], ["sachtemang", "sorglich"], ["sacht", "sachtemang"], ["sachtemang", "vorsichtig"], ["sachtemang", "sorgfaeltig"], ["bedachtsam", "behutsam"], ["bedachtsam", "sorgsam"], ["bedachtsam", "sorglich"], ["bedachtsam", "sacht"], ["bedachtsam", "vorsichtig"], ["bedachtsam", "sorgfaeltig"], ["behutsam", "sorgsam"], ["behutsam", "sorglich"], ["behutsam", "sacht"], ["behutsam", "vorsichtig"], ["behutsam", "sorgfaeltig"], ["sorglich", "sorgsam"], ["sacht", "sorgsam"], ["sorgsam", "vorsichtig"], ["sorgfaeltig", "sorgsam"], ["sacht", "sorglich"], ["sorglich", "vorsichtig"], ["sorgfaeltig", "sorglich"], ["sacht", "vorsichtig"], ["sacht", "sorgfaeltig"], ["sorgfaeltig", "vorsichtig"], ["faktor", "gegebenheit"], ["faktor", "konstellation"], ["faktor", "tatsache"], ["faktor", "faktum"], ["faktor", "fall"], ["faktor", "rahmenbedingung"], ["faktor", "umstand"], ["gegebenheit", "konstellation"], ["gegebenheit", "tatsache"], ["faktum", "gegebenheit"], ["fall", "gegebenheit"], ["gegebenheit", "rahmenbedingung"], ["gegebenheit", "umstand"], ["konstellation", "tatsache"], ["faktum", "konstellation"], ["fall", "konstellation"], ["konstellation", "rahmenbedingung"], ["konstellation", "umstand"], ["faktum", "tatsache"], ["fall", "tatsache"], ["rahmenbedingung", "tatsache"], ["tatsache", "umstand"], ["faktum", "fall"], ["faktum", "rahmenbedingung"], ["faktum", "umstand"], ["fall", "rahmenbedingung"], ["fall", "umstand"], ["rahmenbedingung", "umstand"], ["fahne", "oese"], ["fahne", "nase"], ["nase", "oese"], ["bestaerken", "staerken"], ["bestaerken", "verstaerken"], ["staerken", "verstaerken"], ["detonation", "schlag"], ["explosion", "schlag"], ["detonation", "explosion"], ["einspritzen", "injizieren"], ["injizieren", "spritzen"], ["einspritzen", "spritzen"], ["huelse", "manschette"], ["manschette", "muffe"], ["huelse", "muffe"], ["speicher", "vorrat"], ["ruecklage", "speicher"], ["redundanz", "speicher"], ["reservoir", "speicher"], ["reserve", "speicher"], ["repositorium", "speicher"], ["lager", "speicher"], ["ruecklage", "vorrat"], ["redundanz", "vorrat"], ["reservoir", "vorrat"], ["reserve", "vorrat"], ["repositorium", "vorrat"], ["lager", "vorrat"], ["redundanz", "ruecklage"], ["reservoir", "ruecklage"], ["reserve", "ruecklage"], ["repositorium", "ruecklage"], ["lager", "ruecklage"], ["redundanz", "reservoir"], ["redundanz", "reserve"], ["redundanz", "repositorium"], ["lager", "redundanz"], ["reserve", "reservoir"], ["repositorium", "reservoir"], ["lager", "reservoir"], ["repositorium", "reserve"], ["lager", "reserve"], ["lager", "repositorium"], ["isolation", "isolierung"], ["daemmung", "isolierung"], ["daemmung", "isolation"], ["alte", "mam"], ["alte", "mama"], ["alte", "mutter"], ["alte", "mutti"], ["alte", "muddern"], ["alte", "mami"], ["mam", "mama"], ["mam", "mutter"], ["mam", "mutti"], ["mam", "muddern"], ["mam", "mami"], ["mama", "mutter"], ["mama", "mutti"], ["mama", "muddern"], ["mama", "mami"], ["mutter", "mutti"], ["muddern", "mutter"], ["mami", "mutter"], ["muddern", "mutti"], ["mami", "mutti"], ["mami", "muddern"], ["ausser", "sonder"], ["mangels", "sonder"], ["bar", "sonder"], ["exklusive", "sonder"], ["abzueglich", "sonder"], ["ausgenommen", "sonder"], ["ohne", "sonder"], ["ausser", "mangels"], ["ausser", "bar"], ["ausser", "exklusive"], ["abzueglich", "ausser"], ["ausser", "ohne"], ["bar", "mangels"], ["exklusive", "mangels"], ["abzueglich", "mangels"], ["ausgenommen", "mangels"], ["mangels", "ohne"], ["bar", "exklusive"], ["abzueglich", "bar"], ["ausgenommen", "bar"], ["bar", "ohne"], ["abzueglich", "exklusive"], ["ausgenommen", "exklusive"], ["exklusive", "ohne"], ["abzueglich", "ausgenommen"], ["abzueglich", "ohne"], ["ausgenommen", "ohne"], ["gegenstimme", "kontrapunkt"], ["antithese", "gegenstimme"], ["gegenstimme", "unterschied"], ["gegenstimme", "gegenthese"], ["gegensatz", "gegenstimme"], ["antithese", "kontrapunkt"], ["kontrapunkt", "unterschied"], ["gegenthese", "kontrapunkt"], ["gegensatz", "kontrapunkt"], ["antithese", "unterschied"], ["antithese", "gegenthese"], ["antithese", "gegensatz"], ["gegenthese", "unterschied"], ["gegensatz", "unterschied"], ["gegensatz", "gegenthese"], ["raum", "weltall"], ["all", "weltall"], ["weltall", "weltraum"], ["sphaere", "weltall"], ["universum", "weltall"], ["weltall", "weltenraum"], ["kosmos", "weltall"], ["all", "raum"], ["raum", "weltraum"], ["raum", "sphaere"], ["raum", "universum"], ["raum", "weltenraum"], ["kosmos", "raum"], ["all", "weltraum"], ["all", "sphaere"], ["all", "universum"], ["all", "weltenraum"], ["all", "kosmos"], ["sphaere", "weltraum"], ["universum", "weltraum"], ["weltenraum", "weltraum"], ["kosmos", "weltraum"], ["sphaere", "universum"], ["sphaere", "weltenraum"], ["kosmos", "sphaere"], ["universum", "weltenraum"], ["kosmos", "universum"], ["kosmos", "weltenraum"], ["feinheiten", "werte"], ["feinheiten", "kleinigkeiten"], ["einzelheiten", "feinheiten"], ["feinheiten", "spezifikationen"], ["feinheiten", "parameter"], ["feinheiten", "finessen"], ["details", "feinheiten"], ["kleinigkeiten", "werte"], ["einzelheiten", "werte"], ["spezifikationen", "werte"], ["parameter", "werte"], ["finessen", "werte"], ["details", "werte"], ["einzelheiten", "kleinigkeiten"], ["kleinigkeiten", "spezifikationen"], ["kleinigkeiten", "parameter"], ["finessen", "kleinigkeiten"], ["details", "kleinigkeiten"], ["einzelheiten", "spezifikationen"], ["einzelheiten", "parameter"], ["einzelheiten", "finessen"], ["details", "einzelheiten"], ["parameter", "spezifikationen"], ["finessen", "spezifikationen"], ["details", "spezifikationen"], ["finessen", "parameter"], ["details", "parameter"], ["details", "finessen"], ["kuer", "stimmungstest"], ["stimmungstest", "wahl"], ["stimmabgabe", "stimmungstest"], ["stimmungstest", "urnengang"], ["stimmungstest", "votum"], ["abstimmung", "stimmungstest"], ["stimmungstest", "wahlgang"], ["kuer", "wahl"], ["kuer", "stimmabgabe"], ["kuer", "urnengang"], ["kuer", "votum"], ["abstimmung", "kuer"], ["kuer", "wahlgang"], ["stimmabgabe", "wahl"], ["urnengang", "wahl"], ["votum", "wahl"], ["abstimmung", "wahl"], ["wahl", "wahlgang"], ["stimmabgabe", "urnengang"], ["stimmabgabe", "votum"], ["abstimmung", "stimmabgabe"], ["stimmabgabe", "wahlgang"], ["urnengang", "votum"], ["abstimmung", "urnengang"], ["urnengang", "wahlgang"], ["abstimmung", "votum"], ["votum", "wahlgang"], ["abstimmung", "wahlgang"], ["aufnehmen", "uebernehmen"], ["haftstrafe", "uebernehmen"], ["aufnehmen", "haftstrafe"], ["fahrradnabe", "nabe"], ["nabe", "radnabe"], ["fahrradnabe", "radnabe"], ["ausloesen", "bewirken"], ["bewirken", "hervorrufen"], ["bewirken", "erwecken"], ["bewirken", "fuehren"], ["bewirken", "sorgen"], ["bewirken", "verursachen"], ["ausloesen", "hervorrufen"], ["ausloesen", "erwecken"], ["ausloesen", "fuehren"], ["ausloesen", "sorgen"], ["ausloesen", "verursachen"], ["erwecken", "hervorrufen"], ["fuehren", "hervorrufen"], ["hervorrufen", "sorgen"], ["hervorrufen", "verursachen"], ["erwecken", "fuehren"], ["erwecken", "sorgen"], ["erwecken", "verursachen"], ["fuehren", "sorgen"], ["fuehren", "verursachen"], ["sorgen", "verursachen"], ["eigentlich", "praktisch"], ["eigentlich", "weitestgehend"], ["eigentlich", "quasi"], ["eigentlich", "sozusagen"], ["eigentlich", "fast"], ["eigentlich", "gewissermassen"], ["eigentlich", "gleichsam"], ["praktisch", "weitestgehend"], ["praktisch", "quasi"], ["praktisch", "sozusagen"], ["fast", "praktisch"], ["gewissermassen", "praktisch"], ["gleichsam", "praktisch"], ["quasi", "weitestgehend"], ["sozusagen", "weitestgehend"], ["fast", "weitestgehend"], ["gewissermassen", "weitestgehend"], ["gleichsam", "weitestgehend"], ["quasi", "sozusagen"], ["fast", "quasi"], ["gewissermassen", "quasi"], ["gleichsam", "quasi"], ["fast", "sozusagen"], ["gewissermassen", "sozusagen"], ["gleichsam", "sozusagen"], ["fast", "gewissermassen"], ["fast", "gleichsam"], ["gewissermassen", "gleichsam"], ["aufbieten", "daransetzen"], ["aktivieren", "aufbieten"], ["aufbieten", "mobilisieren"], ["aufbieten", "einsetzen"], ["aufbieten", "hineinstecken"], ["aktivieren", "daransetzen"], ["daransetzen", "mobilisieren"], ["daransetzen", "einsetzen"], ["daransetzen", "hineinstecken"], ["aktivieren", "mobilisieren"], ["aktivieren", "einsetzen"], ["aktivieren", "hineinstecken"], ["einsetzen", "mobilisieren"], ["hineinstecken", "mobilisieren"], ["einsetzen", "hineinstecken"], ["kuerzen", "verkuerzen"], ["abkuerzen", "verkuerzen"], ["raffen", "verkuerzen"], ["stutzen", "verkuerzen"], ["abbreviieren", "verkuerzen"], ["kappen", "verkuerzen"], ["abkuerzen", "kuerzen"], ["kuerzen", "raffen"], ["kuerzen", "stutzen"], ["abbreviieren", "kuerzen"], ["kappen", "kuerzen"], ["abkuerzen", "raffen"], ["abkuerzen", "stutzen"], ["abbreviieren", "abkuerzen"], ["abkuerzen", "kappen"], ["raffen", "stutzen"], ["abbreviieren", "raffen"], ["kappen", "raffen"], ["abbreviieren", "stutzen"], ["kappen", "stutzen"], ["abbreviieren", "kappen"], ["verformen", "werfen"], ["verbiegen", "verformen"], ["verformen", "verziehen"], ["arbeiten", "verformen"], ["verbiegen", "werfen"], ["verziehen", "werfen"], ["arbeiten", "werfen"], ["verbiegen", "verziehen"], ["arbeiten", "verbiegen"], ["arbeiten", "verziehen"], ["fusseln", "laufen"], ["latschen", "laufen"], ["fusseln", "latschen"], ["fusseln", "gehen"], ["gehen", "latschen"], ["limitiert", "reduziert"], ["beschraenkt", "limitiert"], ["heruntergefahren", "limitiert"], ["abgespeckt", "limitiert"], ["eingeschraenkt", "limitiert"], ["begrenzt", "limitiert"], ["beschraenkt", "reduziert"], ["heruntergefahren", "reduziert"], ["abgespeckt", "reduziert"], ["eingeschraenkt", "reduziert"], ["begrenzt", "reduziert"], ["beschraenkt", "heruntergefahren"], ["abgespeckt", "beschraenkt"], ["beschraenkt", "eingeschraenkt"], ["begrenzt", "beschraenkt"], ["abgespeckt", "heruntergefahren"], ["eingeschraenkt", "heruntergefahren"], ["begrenzt", "heruntergefahren"], ["abgespeckt", "eingeschraenkt"], ["abgespeckt", "begrenzt"], ["begrenzt", "eingeschraenkt"], ["ueberbleiben", "verbleiben"], ["bleiben", "ueberbleiben"], ["ueberbleiben", "zurueckbleiben"], ["ueberbleiben", "uebrigbleiben"], ["verbleiben", "zurueckbleiben"], ["uebrigbleiben", "verbleiben"], ["bleiben", "zurueckbleiben"], ["bleiben", "uebrigbleiben"], ["uebrigbleiben", "zurueckbleiben"], ["einschlagen", "wickeln"], ["einschlagen", "pucken"], ["einschlagen", "fatschen"], ["einschlagen", "windeln"], ["pucken", "wickeln"], ["fatschen", "wickeln"], ["wickeln", "windeln"], ["fatschen", "pucken"], ["pucken", "windeln"], ["fatschen", "windeln"], ["schreiben", "zuschrift"], ["brief", "schreiben"], ["schreiben", "schrieb"], ["liebesbrief", "schreiben"], ["anschreiben", "schreiben"], ["epistel", "schreiben"], ["wisch", "zuschrift"], ["brief", "wisch"], ["schrieb", "wisch"], ["liebesbrief", "wisch"], ["anschreiben", "wisch"], ["epistel", "wisch"], ["brief", "zuschrift"], ["schrieb", "zuschrift"], ["liebesbrief", "zuschrift"], ["anschreiben", "zuschrift"], ["epistel", "zuschrift"], ["brief", "schrieb"], ["brief", "liebesbrief"], ["anschreiben", "brief"], ["brief", "epistel"], ["liebesbrief", "schrieb"], ["anschreiben", "schrieb"], ["epistel", "schrieb"], ["anschreiben", "liebesbrief"], ["epistel", "liebesbrief"], ["anschreiben", "epistel"], ["klar", "unzweifelhaft"], ["eindeutig", "klar"], ["klar", "unmissverstaendlich"], ["eindeutig", "unzweifelhaft"], ["unmissverstaendlich", "unzweifelhaft"], ["eindeutig", "unmissverstaendlich"], ["knopf", "schalter"], ["knopf", "taster"], ["knopf", "taste"], ["druckschalter", "knopf"], ["schalter", "taster"], ["schalter", "taste"], ["druckschalter", "schalter"], ["taste", "taster"], ["druckschalter", "taster"], ["druckschalter", "taste"], ["wiederherstellen", "zuruecksetzen"], ["reponieren", "wiederherstellen"], ["wiederherstellen", "zurueckstellen"], ["wiederherstellen", "zurueckfuehren"], ["reponieren", "zuruecksetzen"], ["zuruecksetzen", "zurueckstellen"], ["zurueckfuehren", "zuruecksetzen"], ["reponieren", "zurueckstellen"], ["reponieren", "zurueckfuehren"], ["zurueckfuehren", "zurueckstellen"], ["obig", "ueber"], ["hoch", "obig"], ["droben", "obig"], ["oben", "obig"], ["hoch", "ueber"], ["droben", "ueber"], ["droben", "hoch"], ["hoch", "oben"], ["droben", "oben"], ["pfosten", "stuetze"], ["pfosten", "saeule"], ["pfosten", "strebe"], ["pfeiler", "pfosten"], ["saeule", "stuetze"], ["strebe", "stuetze"], ["pfeiler", "stuetze"], ["saeule", "strebe"], ["pfeiler", "saeule"], ["pfeiler", "strebe"], ["unverschlossen", "unversperrt"], ["aufgesperrt", "unversperrt"], ["unverriegelt", "unversperrt"], ["auf", "unversperrt"], ["offen", "unversperrt"], ["unabgeschlossen", "unversperrt"], ["aufgesperrt", "unverschlossen"], ["unverriegelt", "unverschlossen"], ["auf", "unverschlossen"], ["offen", "unverschlossen"], ["unabgeschlossen", "unverschlossen"], ["aufgesperrt", "unverriegelt"], ["auf", "aufgesperrt"], ["aufgesperrt", "offen"], ["aufgesperrt", "unabgeschlossen"], ["auf", "unverriegelt"], ["offen", "unverriegelt"], ["unabgeschlossen", "unverriegelt"], ["auf", "offen"], ["auf", "unabgeschlossen"], ["offen", "unabgeschlossen"], ["uebertragung", "verzicht"], ["aufgabe", "uebertragung"], ["preisgabe", "uebertragung"], ["dereliktion", "uebertragung"], ["aufgabe", "verzicht"], ["preisgabe", "verzicht"], ["dereliktion", "verzicht"], ["aufgabe", "preisgabe"], ["aufgabe", "dereliktion"], ["dereliktion", "preisgabe"], ["frei", "vakant"], ["offen", "vakant"], ["unbesetzt", "vakant"], ["ausgeschrieben", "vakant"], ["frei", "unbesetzt"], ["ausgeschrieben", "frei"], ["offen", "unbesetzt"], ["ausgeschrieben", "offen"], ["ausgeschrieben", "unbesetzt"], ["relaxen", "verschnaufen"], ["sichausruhen", "verschnaufen"], ["ausspannen", "verschnaufen"], ["pausieren", "verschnaufen"], ["rasten", "verschnaufen"], ["erholen", "verschnaufen"], ["entspannen", "verschnaufen"], ["relaxen", "sichausruhen"], ["ausspannen", "relaxen"], ["pausieren", "relaxen"], ["rasten", "relaxen"], ["erholen", "relaxen"], ["entspannen", "relaxen"], ["ausspannen", "sichausruhen"], ["pausieren", "sichausruhen"], ["rasten", "sichausruhen"], ["erholen", "sichausruhen"], ["entspannen", "sichausruhen"], ["ausspannen", "pausieren"], ["ausspannen", "rasten"], ["ausspannen", "erholen"], ["ausspannen", "entspannen"], ["pausieren", "rasten"], ["erholen", "pausieren"], ["entspannen", "pausieren"], ["erholen", "rasten"], ["entspannen", "rasten"], ["entspannen", "erholen"], ["doppelt", "gedoppelt"], ["gedoppelt", "zweifach"], ["gedoppelt", "zweimal"], ["gedoppelt", "zwiefach"], ["doppelt", "zweifach"], ["doppelt", "zweimal"], ["doppelt", "zwiefach"], ["zweifach", "zweimal"], ["zweifach", "zwiefach"], ["zweimal", "zwiefach"], ["einarbeiten", "einbauen"], ["einarbeiten", "einpassen"], ["einarbeiten", "einsetzen"], ["einarbeiten", "hineinarbeiten"], ["einarbeiten", "einweben"], ["einbauen", "einpassen"], ["einbauen", "einsetzen"], ["einbauen", "hineinarbeiten"], ["einbauen", "einweben"], ["einpassen", "einsetzen"], ["einpassen", "hineinarbeiten"], ["einpassen", "einweben"], ["einsetzen", "hineinarbeiten"], ["einsetzen", "einweben"], ["einweben", "hineinarbeiten"], ["absetzen", "abziehen"], ["absetzen", "subtrahieren"], ["abrechnen", "absetzen"], ["abziehen", "subtrahieren"], ["abrechnen", "abziehen"], ["abrechnen", "subtrahieren"], ["aufrecht", "vertikal"], ["lotrecht", "vertikal"], ["stehend", "vertikal"], ["senkrecht", "vertikal"], ["aufrecht", "lotrecht"], ["aufrecht", "stehend"], ["aufrecht", "senkrecht"], ["lotrecht", "stehend"], ["senkrecht", "stehend"], ["anlehnen", "ausrichten"], ["ausrichten", "gehen"], ["ausrichten", "orientieren"], ["anlehnen", "gehen"], ["anlehnen", "orientieren"], ["gehen", "orientieren"], ["lasche", "zunge"], ["hinweis", "indiz"], ["indiz", "verdachtsgrund"], ["anzeichen", "indiz"], ["indiz", "verdachtsmoment"], ["anhaltspunkt", "indiz"], ["hinweis", "verdachtsgrund"], ["anzeichen", "hinweis"], ["hinweis", "verdachtsmoment"], ["anhaltspunkt", "hinweis"], ["anzeichen", "verdachtsgrund"], ["verdachtsgrund", "verdachtsmoment"], ["anhaltspunkt", "verdachtsgrund"], ["anzeichen", "verdachtsmoment"], ["anhaltspunkt", "anzeichen"], ["anhaltspunkt", "verdachtsmoment"], ["naehrtoffreich", "schwer"], ["fett", "naehrtoffreich"], ["fett", "schwer"], ["wodurch", "womit"], ["wobei", "womit"], ["wobei", "wodurch"], ["stellenweise", "teilweise"], ["fallweise", "teilweise"], ["selektiv", "teilweise"], ["teils", "teilweise"], ["partiell", "teilweise"], ["mitunter", "teilweise"], ["fallweise", "stellenweise"], ["selektiv", "stellenweise"], ["stellenweise", "teils"], ["partiell", "stellenweise"], ["mitunter", "stellenweise"], ["fallweise", "selektiv"], ["fallweise", "teils"], ["fallweise", "partiell"], ["fallweise", "mitunter"], ["selektiv", "teils"], ["partiell", "selektiv"], ["mitunter", "selektiv"], ["partiell", "teils"], ["mitunter", "teils"], ["mitunter", "partiell"], ["amplifikation", "ausbau"], ["amplifikation", "vergroesserung"], ["amplifikation", "ausdehnung"], ["amplifikation", "zuwachs"], ["amplifikation", "aufwuchs"], ["amplifikation", "aufstockung"], ["amplifikation", "erweiterung"], ["ausbau", "vergroesserung"], ["ausbau", "ausdehnung"], ["ausbau", "zuwachs"], ["aufwuchs", "ausbau"], ["aufstockung", "ausbau"], ["ausbau", "erweiterung"], ["ausdehnung", "vergroesserung"], ["vergroesserung", "zuwachs"], ["aufwuchs", "vergroesserung"], ["aufstockung", "vergroesserung"], ["erweiterung", "vergroesserung"], ["aufwuchs", "ausdehnung"], ["aufstockung", "ausdehnung"], ["ausdehnung", "erweiterung"], ["aufwuchs", "zuwachs"], ["aufstockung", "zuwachs"], ["erweiterung", "zuwachs"], ["aufstockung", "aufwuchs"], ["aufwuchs", "erweiterung"], ["aufstockung", "erweiterung"], ["generator", "lichtmaschine"], ["erzeuger", "generator"], ["dynamo", "generator"], ["generator", "stromerzeuger"], ["generator", "stromgenerator"], ["erzeuger", "lichtmaschine"], ["dynamo", "lichtmaschine"], ["lichtmaschine", "stromerzeuger"], ["lichtmaschine", "stromgenerator"], ["dynamo", "erzeuger"], ["erzeuger", "stromerzeuger"], ["erzeuger", "stromgenerator"], ["dynamo", "stromerzeuger"], ["dynamo", "stromgenerator"], ["stromerzeuger", "stromgenerator"], ["einkopieren", "zusammenschneiden"], ["mischen", "zusammenschneiden"], ["ueberlagern", "zusammenschneiden"], ["mengen", "zusammenschneiden"], ["einblenden", "zusammenschneiden"], ["einkopieren", "mischen"], ["einkopieren", "ueberlagern"], ["einkopieren", "mengen"], ["einblenden", "einkopieren"], ["mischen", "ueberlagern"], ["mengen", "mischen"], ["einblenden", "mischen"], ["mengen", "ueberlagern"], ["einblenden", "ueberlagern"], ["einblenden", "mengen"], ["abolieren", "aufloesen"], ["aufloesen", "beseitigen"], ["abbauen", "aufloesen"], ["aufheben", "aufloesen"], ["abschaffen", "aufloesen"], ["abolieren", "beseitigen"], ["abbauen", "abolieren"], ["abolieren", "aufheben"], ["abolieren", "abschaffen"], ["abbauen", "beseitigen"], ["aufheben", "beseitigen"], ["abschaffen", "beseitigen"], ["abbauen", "aufheben"], ["abbauen", "abschaffen"], ["abschaffen", "aufheben"], ["aufhoeren", "enden"], ["abreissen", "aufhoeren"], ["abreissen", "enden"], ["arbeitsanweisung", "auftrag"], ["arbeitsanweisung", "arbeitsauftrag"], ["arbeitsanweisung", "aufgabenstellung"], ["arbeitsauftrag", "auftrag"], ["aufgabenstellung", "auftrag"], ["arbeitsauftrag", "aufgabenstellung"], ["anlage", "disposition"], ["disposition", "neigung"], ["disposition", "veranlagung"], ["anlage", "neigung"], ["anlage", "veranlagung"], ["neigung", "veranlagung"], ["anschluss", "verbindung"], ["schnittstelle", "verbindung"], ["interface", "verbindung"], ["anschluss", "schnittstelle"], ["anschluss", "interface"], ["interface", "schnittstelle"], ["begleitend", "gleichzeitig"], ["gleichzeitig", "konkomitierend"], ["gleichzeitig", "parallel"], ["begleitend", "konkomitierend"], ["begleitend", "parallel"], ["konkomitierend", "parallel"], ["trockner", "tumbler"], ["trockner", "waeschetrockner"], ["tumbler", "waeschetrockner"], ["loesungsansatz", "modell"], ["loesungsmodell", "modell"], ["modell", "problemloesung"], ["loesungskonzept", "modell"], ["antwort", "modell"], ["loesung", "modell"], ["loesungsansatz", "loesungsmodell"], ["loesungsansatz", "problemloesung"], ["loesungsansatz", "loesungskonzept"], ["antwort", "loesungsansatz"], ["loesung", "loesungsansatz"], ["loesungsmodell", "problemloesung"], ["loesungskonzept", "loesungsmodell"], ["antwort", "loesungsmodell"], ["loesung", "loesungsmodell"], ["loesungskonzept", "problemloesung"], ["antwort", "problemloesung"], ["loesung", "problemloesung"], ["antwort", "loesungskonzept"], ["loesung", "loesungskonzept"], ["antwort", "loesung"], ["laufrad", "spule"], ["laufrad", "trommel"], ["laufrad", "zylinder"], ["laufrad", "walze"], ["laufrad", "rolle"], ["spule", "trommel"], ["spule", "zylinder"], ["spule", "walze"], ["rolle", "spule"], ["trommel", "zylinder"], ["trommel", "walze"], ["rolle", "trommel"], ["walze", "zylinder"], ["rolle", "zylinder"], ["rolle", "walze"], ["geben", "versorgen"], ["beliefern", "geben"], ["geben", "verschaffen"], ["besorgen", "geben"], ["beliefern", "versorgen"], ["verschaffen", "versorgen"], ["besorgen", "versorgen"], ["beliefern", "verschaffen"], ["beliefern", "besorgen"], ["besorgen", "verschaffen"], ["anpassen", "zuschneiden"], ["tief", "tiefdruckgebiet"], ["stoerung", "tief"], ["stoerung", "tiefdruckgebiet"], ["chiffre", "nummer"], ["nummer", "zahlzeichen"], ["chiffre", "zahl"], ["zahl", "zahlzeichen"], ["chiffre", "ziffer"], ["zahlzeichen", "ziffer"], ["chiffre", "zahlzeichen"], ["bezugsquelle", "lieferquelle"], ["abgewinnen", "gewichten"], ["einschaetzen", "gewichten"], ["befinden", "gewichten"], ["finden", "gewichten"], ["abgewinnen", "einschaetzen"], ["abgewinnen", "befinden"], ["abgewinnen", "finden"], ["befinden", "einschaetzen"], ["einschaetzen", "finden"], ["befinden", "finden"], ["abreibung", "reiben"], ["abreibung", "reibung"], ["abreibung", "scheuern"], ["reiben", "reibung"], ["reiben", "scheuern"], ["reibung", "scheuern"], ["baumeln", "herunterhaengen"], ["haengen", "herunterhaengen"], ["baumeln", "haengen"], ["temperaturregler", "thermostat"], ["positionierung", "verortung"], ["positionsbestimmung", "verortung"], ["ortsbestimmung", "verortung"], ["lokalisation", "verortung"], ["lokalisierung", "verortung"], ["positionierung", "positionsbestimmung"], ["ortsbestimmung", "positionierung"], ["lokalisation", "positionierung"], ["lokalisierung", "positionierung"], ["ortsbestimmung", "positionsbestimmung"], ["lokalisation", "positionsbestimmung"], ["lokalisierung", "positionsbestimmung"], ["lokalisation", "ortsbestimmung"], ["lokalisierung", "ortsbestimmung"], ["lokalisation", "lokalisierung"], ["halt", "nur"], ["halt", "meinetwegen"], ["halt", "ruhig"], ["halt", "meinethalben"], ["meinetwegen", "nur"], ["nur", "ruhig"], ["meinethalben", "nur"], ["meinetwegen", "ruhig"], ["meinethalben", "meinetwegen"], ["meinethalben", "ruhig"], ["abtrennen", "loesen"], ["uebergang", "vererbung"], ["uebergang", "uebertragung"], ["uebertragung", "vererbung"], ["ausweisung", "identifikation"], ["ausweisung", "identifizierung"], ["identifikation", "identifizierung"], ["aehnlich", "uebereinstimmend"], ["entsprechend", "uebereinstimmend"], ["gleichliegend", "uebereinstimmend"], ["homolog", "uebereinstimmend"], ["aehnlich", "entsprechend"], ["aehnlich", "gleichliegend"], ["aehnlich", "homolog"], ["entsprechend", "gleichliegend"], ["entsprechend", "homolog"], ["gleichliegend", "homolog"], ["evaluation", "ueberpruefung"], ["beurteilung", "ueberpruefung"], ["satt", "ueber"], ["gut", "satt"], ["gut", "ueber"], ["brand", "feuer"], ["benzin", "sprit"], ["benzin", "ottokraftstoff"], ["benzin", "vergaserkraftstoff"], ["benzin", "otto-kraftstoff"], ["ottokraftstoff", "sprit"], ["sprit", "vergaserkraftstoff"], ["otto-kraftstoff", "sprit"], ["ottokraftstoff", "vergaserkraftstoff"], ["otto-kraftstoff", "ottokraftstoff"], ["otto-kraftstoff", "vergaserkraftstoff"], ["bogen", "zettel"], ["bogen", "seite"], ["bogen", "papier"], ["blatt", "bogen"], ["bogen", "papierblatt"], ["bogen", "wisch"], ["seite", "zettel"], ["papier", "zettel"], ["blatt", "zettel"], ["papierblatt", "zettel"], ["wisch", "zettel"], ["papier", "seite"], ["blatt", "seite"], ["papierblatt", "seite"], ["seite", "wisch"], ["blatt", "papier"], ["papier", "papierblatt"], ["papier", "wisch"], ["blatt", "papierblatt"], ["blatt", "wisch"], ["papierblatt", "wisch"], ["ausdruck", "term"], ["ausdruck", "bezeichnung"], ["bezeichnung", "term"], ["ermittlung", "recherche"], ["ermittlung", "suche"], ["ermittlung", "nachforschung"], ["ermittlung", "retrieval"], ["recherche", "suche"], ["nachforschung", "recherche"], ["recherche", "retrieval"], ["nachforschung", "suche"], ["retrieval", "suche"], ["nachforschung", "retrieval"], ["hoerfunk", "rundfunk"], ["radio", "rundfunk"], ["funk", "rundfunk"], ["aether", "rundfunk"], ["hoerfunk", "radio"], ["funk", "hoerfunk"], ["aether", "hoerfunk"], ["funk", "radio"], ["aether", "radio"], ["aether", "funk"], ["ausreichen", "langen"], ["ausreichen", "hinkommen"], ["ausreichen", "reichen"], ["ausreichen", "genuegen"], ["hinkommen", "langen"], ["genuegen", "langen"], ["hinkommen", "reichen"], ["genuegen", "hinkommen"], ["genuegen", "reichen"], ["bandagieren", "verbinden"], ["umwickeln", "verbinden"], ["bandagieren", "umwickeln"], ["edikt", "gebot"], ["edikt", "erlass"], ["anordnung", "edikt"], ["edikt", "verordnung"], ["edikt", "verfuegung"], ["dekret", "edikt"], ["erlass", "gebot"], ["anordnung", "gebot"], ["gebot", "verordnung"], ["gebot", "verfuegung"], ["dekret", "gebot"], ["anordnung", "erlass"], ["erlass", "verordnung"], ["erlass", "verfuegung"], ["dekret", "erlass"], ["anordnung", "verordnung"], ["anordnung", "dekret"], ["dekret", "verordnung"], ["dekret", "verfuegung"], ["ausgang", "fazit"], ["ausgang", "resultat"], ["ausgang", "endergebnis"], ["ausgang", "quintessenz"], ["ausgang", "ergebnis"], ["fazit", "resultat"], ["endergebnis", "fazit"], ["fazit", "quintessenz"], ["ergebnis", "fazit"], ["endergebnis", "resultat"], ["quintessenz", "resultat"], ["ergebnis", "resultat"], ["endergebnis", "quintessenz"], ["endergebnis", "ergebnis"], ["ergebnis", "quintessenz"], ["asteriskus", "sternchen"], ["asterisk", "asteriskus"], ["asteriskus", "stern"], ["asterisk", "sternchen"], ["stern", "sternchen"], ["asterisk", "stern"], ["abdichtung", "dichtung"], ["boden", "erdboden"], ["boden", "pedosphaere"], ["boden", "erdreich"], ["boden", "untergrund"], ["boden", "erde"], ["erdboden", "pedosphaere"], ["erdboden", "erdreich"], ["erdboden", "untergrund"], ["erdboden", "erde"], ["erdreich", "pedosphaere"], ["pedosphaere", "untergrund"], ["erde", "pedosphaere"], ["erdreich", "untergrund"], ["erde", "erdreich"], ["erde", "untergrund"], ["ausgangspunkt", "grundstein"], ["grundstein", "grundstock"], ["grundlage", "grundstein"], ["ausgangspunkt", "grundstock"], ["ausgangspunkt", "grundlage"], ["grundlage", "grundstock"], ["unterschied", "verschiedenheit"], ["differenz", "unterschied"], ["abweichung", "unterschied"], ["differenz", "verschiedenheit"], ["abweichung", "verschiedenheit"], ["abweichung", "differenz"], ["amt", "posten"], ["amt", "aufgabe"], ["amt", "job"], ["aufgabe", "posten"], ["job", "posten"], ["aufgabe", "job"], ["abgehoben", "elitaer"], ["abgehoben", "elfenbeinturm"], ["abgehoben", "ausgewaehlt"], ["elfenbeinturm", "elitaer"], ["ausgewaehlt", "elitaer"], ["ausgewaehlt", "elfenbeinturm"], ["finale", "schlusspunkt"], ["ende", "schlusspunkt"], ["ende", "finale"], ["exercitium", "training"], ["exercitium", "uebung"], ["exercitium", "exerzitium"], ["exercitium", "voruebung"], ["exercitium", "probe"], ["training", "uebung"], ["exerzitium", "training"], ["training", "voruebung"], ["probe", "training"], ["exerzitium", "uebung"], ["uebung", "voruebung"], ["probe", "uebung"], ["exerzitium", "voruebung"], ["exerzitium", "probe"], ["probe", "voruebung"], ["aus", "gar"], ["aus", "fehlen"], ["aus", "leer"], ["aufgebraucht", "aus"], ["alleweg", "aus"], ["alle", "aus"], ["fehlen", "gar"], ["gar", "leer"], ["aufgebraucht", "gar"], ["alleweg", "gar"], ["alle", "gar"], ["fehlen", "leer"], ["aufgebraucht", "fehlen"], ["alleweg", "fehlen"], ["alle", "fehlen"], ["aufgebraucht", "leer"], ["alleweg", "leer"], ["alle", "leer"], ["alleweg", "aufgebraucht"], ["alle", "aufgebraucht"], ["alle", "alleweg"], ["bestimmt", "festgelegt"], ["bestimmt", "determiniert"], ["besiegelt", "bestimmt"], ["determiniert", "festgelegt"], ["besiegelt", "festgelegt"], ["besiegelt", "determiniert"], ["belegt", "besetzt"], ["ausverkauft", "besetzt"], ["ausgebucht", "besetzt"], ["besetzt", "voll"], ["ausverkauft", "belegt"], ["ausgebucht", "belegt"], ["belegt", "voll"], ["ausgebucht", "ausverkauft"], ["ausverkauft", "voll"], ["ausgebucht", "voll"], ["nachvollziehen", "wiederholen"], ["nachvollziehen", "reproduzieren"], ["nachstellen", "nachvollziehen"], ["reproduzieren", "wiederholen"], ["nachstellen", "wiederholen"], ["nachstellen", "reproduzieren"], ["abbild", "visualisierung"], ["abbildung", "visualisierung"], ["darstellung", "visualisierung"], ["spiegelbild", "visualisierung"], ["visualisierung", "wiedergabe"], ["illustration", "visualisierung"], ["abbild", "abbildung"], ["abbild", "darstellung"], ["abbild", "spiegelbild"], ["abbild", "wiedergabe"], ["abbild", "illustration"], ["abbildung", "spiegelbild"], ["abbildung", "wiedergabe"], ["darstellung", "spiegelbild"], ["darstellung", "wiedergabe"], ["spiegelbild", "wiedergabe"], ["illustration", "spiegelbild"], ["illustration", "wiedergabe"], ["abdrehen", "abstellen"], ["abdrehen", "ausschalten"], ["abdrehen", "ausmachen"], ["abdrehen", "ausknipsen"], ["abdrehen", "abschalten"], ["abstellen", "ausschalten"], ["abstellen", "ausmachen"], ["abstellen", "ausknipsen"], ["abschalten", "abstellen"], ["ausmachen", "ausschalten"], ["ausknipsen", "ausschalten"], ["ausknipsen", "ausmachen"], ["abschalten", "ausmachen"], ["abschalten", "ausknipsen"], ["abebben", "abklingen"], ["abebben", "abschwaechen"], ["abebben", "abnehmen"], ["abebben", "abflauen"], ["abebben", "nachlassen"], ["abebben", "zurueckgehen"], ["abebben", "abflachen"], ["abklingen", "abschwaechen"], ["abklingen", "abnehmen"], ["abflauen", "abklingen"], ["abklingen", "nachlassen"], ["abklingen", "zurueckgehen"], ["abflachen", "abklingen"], ["abnehmen", "abschwaechen"], ["abflauen", "abschwaechen"], ["abschwaechen", "nachlassen"], ["abschwaechen", "zurueckgehen"], ["abflachen", "abschwaechen"], ["abflauen", "abnehmen"], ["abnehmen", "nachlassen"], ["abnehmen", "zurueckgehen"], ["abflachen", "abnehmen"], ["abflauen", "nachlassen"], ["abflauen", "zurueckgehen"], ["abflachen", "abflauen"], ["nachlassen", "zurueckgehen"], ["abflachen", "nachlassen"], ["abflachen", "zurueckgehen"], ["begrenzung", "grenze"], ["begrenzung", "grenzlinie"], ["grenze", "grenzlinie"], ["abgrenzung", "grenze"], ["abgrenzung", "grenzlinie"], ["unfrei", "untergeordnet"], ["abhaengig", "unfrei"], ["unfrei", "unmuendig"], ["unfrei", "unselbstaendig"], ["gebunden", "unfrei"], ["abhaengig", "untergeordnet"], ["unmuendig", "untergeordnet"], ["unselbstaendig", "untergeordnet"], ["gebunden", "untergeordnet"], ["abhaengig", "unmuendig"], ["abhaengig", "unselbstaendig"], ["abhaengig", "gebunden"], ["unmuendig", "unselbstaendig"], ["gebunden", "unmuendig"], ["gebunden", "unselbstaendig"], ["faellen", "umsaegen"], ["faellen", "roden"], ["faellen", "schlaegern"], ["faellen", "umhauen"], ["faellen", "schlagen"], ["roden", "umsaegen"], ["schlaegern", "umsaegen"], ["umhauen", "umsaegen"], ["schlagen", "umsaegen"], ["roden", "schlaegern"], ["roden", "umhauen"], ["roden", "schlagen"], ["schlaegern", "umhauen"], ["schlaegern", "schlagen"], ["schlagen", "umhauen"], ["gesichtserker", "gewuerzpruefer"], ["gesichtserker", "riechkolben"], ["gesichtserker", "zinken"], ["gesichtserker", "riecher"], ["gesichtserker", "riechorgan"], ["gesichtserker", "kolben"], ["gesichtserker", "nase"], ["gewuerzpruefer", "riechkolben"], ["gewuerzpruefer", "zinken"], ["gewuerzpruefer", "riecher"], ["gewuerzpruefer", "riechorgan"], ["gewuerzpruefer", "kolben"], ["gewuerzpruefer", "nase"], ["riechkolben", "zinken"], ["riecher", "riechkolben"], ["riechkolben", "riechorgan"], ["kolben", "riechkolben"], ["nase", "riechkolben"], ["riecher", "zinken"], ["riechorgan", "zinken"], ["kolben", "zinken"], ["nase", "zinken"], ["riecher", "riechorgan"], ["kolben", "riecher"], ["nase", "riecher"], ["kolben", "riechorgan"], ["nase", "riechorgan"], ["kolben", "nase"], ["anlage", "potenzial"], ["anlage", "moeglichkeiten"], ["anlage", "potential"], ["anlage", "gegebenheit"], ["moeglichkeiten", "potenzial"], ["potential", "potenzial"], ["gegebenheit", "potenzial"], ["moeglichkeiten", "potential"], ["gegebenheit", "moeglichkeiten"], ["gegebenheit", "potential"], ["organismus", "struktur"], ["anlage", "organismus"], ["organismus", "system"], ["organisation", "organismus"], ["gebilde", "organismus"], ["anlage", "struktur"], ["struktur", "system"], ["organisation", "struktur"], ["gebilde", "struktur"], ["anlage", "system"], ["anlage", "organisation"], ["anlage", "gebilde"], ["organisation", "system"], ["gebilde", "system"], ["gebilde", "organisation"], ["observierung", "ueberwachung"], ["beobachtung", "observierung"], ["observation", "observierung"], ["beschattung", "observierung"], ["beobachtung", "ueberwachung"], ["observation", "ueberwachung"], ["beschattung", "ueberwachung"], ["beobachtung", "observation"], ["beobachtung", "beschattung"], ["beschattung", "observation"], ["dadurch", "hiermit"], ["dadurch", "damit"], ["dadurch", "indem"], ["dadurch", "darueber"], ["dadurch", "hierbei"], ["dadurch", "hierdurch"], ["dabei", "dadurch"], ["damit", "hiermit"], ["hiermit", "indem"], ["darueber", "hiermit"], ["hierbei", "hiermit"], ["hierdurch", "hiermit"], ["dabei", "hiermit"], ["damit", "indem"], ["damit", "darueber"], ["damit", "hierbei"], ["damit", "hierdurch"], ["dabei", "damit"], ["darueber", "indem"], ["hierbei", "indem"], ["hierdurch", "indem"], ["dabei", "indem"], ["darueber", "hierbei"], ["darueber", "hierdurch"], ["dabei", "darueber"], ["hierbei", "hierdurch"], ["dabei", "hierbei"], ["dabei", "hierdurch"], ["fein", "manierlich"], ["manierlich", "schoen"], ["manierlich", "positiv"], ["gut", "manierlich"], ["fein", "schoen"], ["fein", "positiv"], ["fein", "gut"], ["positiv", "schoen"], ["gut", "schoen"], ["gut", "positiv"], ["beseitigen", "entfernen"], ["entfernen", "loswerden"], ["beseitigen", "loswerden"], ["reifen", "schluffen"], ["bereifung", "reifen"], ["luftreifen", "reifen"], ["pneu", "reifen"], ["rad", "reifen"], ["bereifung", "schluffen"], ["luftreifen", "schluffen"], ["pneu", "schluffen"], ["rad", "schluffen"], ["bereifung", "luftreifen"], ["bereifung", "pneu"], ["bereifung", "rad"], ["luftreifen", "pneu"], ["luftreifen", "rad"], ["pneu", "rad"], ["ruecksicht", "toleranz"], ["ruecksicht", "verstaendnis"], ["umdrehung", "umkreisung"], ["rotationsbewegung", "umdrehung"], ["drehbewegung", "umdrehung"], ["umdrehung", "umlauf"], ["drehung", "umdrehung"], ["kreisbewegung", "umdrehung"], ["rotation", "umdrehung"], ["rotationsbewegung", "umkreisung"], ["drehbewegung", "umkreisung"], ["umkreisung", "umlauf"], ["drehung", "umkreisung"], ["kreisbewegung", "umkreisung"], ["rotation", "umkreisung"], ["drehbewegung", "rotationsbewegung"], ["rotationsbewegung", "umlauf"], ["drehung", "rotationsbewegung"], ["kreisbewegung", "rotationsbewegung"], ["rotation", "rotationsbewegung"], ["drehbewegung", "umlauf"], ["drehbewegung", "drehung"], ["drehbewegung", "kreisbewegung"], ["drehbewegung", "rotation"], ["drehung", "umlauf"], ["kreisbewegung", "umlauf"], ["rotation", "umlauf"], ["drehung", "kreisbewegung"], ["drehung", "rotation"], ["kreisbewegung", "rotation"], ["beschwerden", "krankheitszeichen"], ["beschwerden", "symptom"], ["beschwerden", "krankheitssymptom"], ["krankheitszeichen", "symptom"], ["krankheitssymptom", "krankheitszeichen"], ["krankheitssymptom", "symptom"], ["sorte", "typ"], ["schlag", "sorte"], ["kaliber", "sorte"], ["kaliber", "typ"], ["kaliber", "schlag"], ["belasten", "beruehren"], ["bedruecken", "beruehren"], ["beruehren", "lasten"], ["bedruecken", "belasten"], ["belasten", "lasten"], ["bedruecken", "lasten"], ["investieren", "reinbuttern"], ["investieren", "stecken"], ["hineinstecken", "investieren"], ["investieren", "veranlagen"], ["anlegen", "investieren"], ["reinbuttern", "stecken"], ["hineinstecken", "reinbuttern"], ["reinbuttern", "veranlagen"], ["anlegen", "reinbuttern"], ["hineinstecken", "stecken"], ["stecken", "veranlagen"], ["anlegen", "stecken"], ["hineinstecken", "veranlagen"], ["anlegen", "hineinstecken"], ["anlegen", "veranlagen"], ["endverstaerker", "leistungsverstaerker"], ["endstufe", "leistungsverstaerker"], ["leistungsverstaerker", "verstaerker"], ["endstufe", "endverstaerker"], ["endverstaerker", "verstaerker"], ["endstufe", "verstaerker"], ["gemeinsam", "vereint"], ["vereint", "zusammen"], ["miteinander", "vereint"], ["beisammen", "vereint"], ["beieinander", "vereint"], ["mitsammen", "vereint"], ["gemeinsam", "miteinander"], ["beisammen", "gemeinsam"], ["beieinander", "gemeinsam"], ["gemeinsam", "mitsammen"], ["miteinander", "zusammen"], ["beisammen", "zusammen"], ["beieinander", "zusammen"], ["mitsammen", "zusammen"], ["beisammen", "miteinander"], ["beieinander", "miteinander"], ["miteinander", "mitsammen"], ["beieinander", "beisammen"], ["beisammen", "mitsammen"], ["beieinander", "mitsammen"], ["braunes", "shit"], ["braunes", "haschisch"], ["braunes", "piece"], ["braunes", "hasch"], ["braunes", "dope"], ["haschisch", "shit"], ["piece", "shit"], ["hasch", "shit"], ["dope", "shit"], ["haschisch", "piece"], ["hasch", "haschisch"], ["dope", "haschisch"], ["hasch", "piece"], ["dope", "piece"], ["dope", "hasch"], ["injektionsspritze", "pumpe"], ["pumpe", "spritze"], ["injektionsspritze", "spritze"], ["anzeigen", "signifizieren"], ["anzeigen", "bezeichnen"], ["anzeigen", "darstellen"], ["anzeigen", "titulieren"], ["bezeichnen", "signifizieren"], ["darstellen", "signifizieren"], ["signifizieren", "titulieren"], ["bezeichnen", "darstellen"], ["bezeichnen", "titulieren"], ["darstellen", "titulieren"], ["kennzeichen", "zeichen"], ["stigma", "zeichen"], ["kennzeichen", "merkmal"], ["merkmal", "stigma"], ["kennzeichen", "stigma"], ["gewissenhaftigkeit", "sorgfalt"], ["genauigkeit", "sorgfalt"], ["genauigkeit", "gewissenhaftigkeit"], ["darlegung", "erlaeuterung"], ["auslassung", "erlaeuterung"], ["aeusserung", "erlaeuterung"], ["ausfuehrung", "erlaeuterung"], ["erklaerung", "erlaeuterung"], ["darstellung", "erlaeuterung"], ["erlaeuterung", "explikation"], ["auslassung", "darlegung"], ["aeusserung", "darlegung"], ["ausfuehrung", "darlegung"], ["darlegung", "erklaerung"], ["darlegung", "darstellung"], ["darlegung", "explikation"], ["aeusserung", "auslassung"], ["ausfuehrung", "auslassung"], ["auslassung", "erklaerung"], ["auslassung", "darstellung"], ["auslassung", "explikation"], ["aeusserung", "ausfuehrung"], ["aeusserung", "erklaerung"], ["aeusserung", "darstellung"], ["aeusserung", "explikation"], ["ausfuehrung", "erklaerung"], ["ausfuehrung", "darstellung"], ["ausfuehrung", "explikation"], ["darstellung", "erklaerung"], ["erklaerung", "explikation"], ["darstellung", "explikation"], ["belegen", "erhaerten"], ["erhaerten", "stuetzen"], ["erhaerten", "staerken"], ["erhaerten", "untermauern"], ["bestaetigen", "erhaerten"], ["belegen", "stuetzen"], ["belegen", "staerken"], ["belegen", "untermauern"], ["belegen", "bestaetigen"], ["staerken", "stuetzen"], ["stuetzen", "untermauern"], ["bestaetigen", "stuetzen"], ["staerken", "untermauern"], ["bestaetigen", "staerken"], ["bestaetigen", "untermauern"], ["ausgehen", "erloeschen"], ["abfahren", "losfahren"], ["abfahren", "anfahren"], ["abfahren", "gehen"], ["abfahren", "abgehen"], ["abfahren", "fahren"], ["anfahren", "losfahren"], ["gehen", "losfahren"], ["abgehen", "losfahren"], ["fahren", "losfahren"], ["anfahren", "gehen"], ["abgehen", "anfahren"], ["anfahren", "fahren"], ["abgehen", "gehen"], ["fahren", "gehen"], ["abgehen", "fahren"], ["nachsetzen", "verfolgen"], ["nachjagen", "verfolgen"], ["nachsprengen", "verfolgen"], ["folgen", "verfolgen"], ["nachsteigen", "verfolgen"], ["nachstellen", "verfolgen"], ["nachjagen", "nachsetzen"], ["nachsetzen", "nachsprengen"], ["folgen", "nachsetzen"], ["nachsetzen", "nachsteigen"], ["nachsetzen", "nachstellen"], ["nachjagen", "nachsprengen"], ["folgen", "nachjagen"], ["nachjagen", "nachsteigen"], ["nachjagen", "nachstellen"], ["folgen", "nachsprengen"], ["nachsprengen", "nachsteigen"], ["nachsprengen", "nachstellen"], ["folgen", "nachsteigen"], ["folgen", "nachstellen"], ["nachsteigen", "nachstellen"], ["herunterlassen", "heruntersetzen"], ["ablassen", "heruntersetzen"], ["abaissieren", "heruntersetzen"], ["absenken", "heruntersetzen"], ["herabsetzen", "heruntersetzen"], ["heruntersetzen", "senken"], ["erniedrigen", "heruntersetzen"], ["ablassen", "herunterlassen"], ["abaissieren", "herunterlassen"], ["absenken", "herunterlassen"], ["herabsetzen", "herunterlassen"], ["herunterlassen", "senken"], ["erniedrigen", "herunterlassen"], ["abaissieren", "ablassen"], ["ablassen", "absenken"], ["ablassen", "herabsetzen"], ["ablassen", "senken"], ["ablassen", "erniedrigen"], ["abaissieren", "absenken"], ["abaissieren", "herabsetzen"], ["abaissieren", "senken"], ["abaissieren", "erniedrigen"], ["absenken", "herabsetzen"], ["absenken", "senken"], ["absenken", "erniedrigen"], ["herabsetzen", "senken"], ["erniedrigen", "herabsetzen"], ["erniedrigen", "senken"], ["einfluss", "wirkung"], ["auswirkung", "wirkung"], ["folge", "wirkung"], ["effekt", "wirkung"], ["auswirkung", "einfluss"], ["einfluss", "folge"], ["effekt", "einfluss"], ["auswirkung", "folge"], ["auswirkung", "effekt"], ["effekt", "folge"], ["bauart", "muster"], ["bauart", "typ"], ["bauart", "modell"], ["bauart", "fabrikat"], ["muster", "typ"], ["fabrikat", "muster"], ["modell", "typ"], ["fabrikat", "typ"], ["fabrikat", "modell"], ["beeinflusst", "gepraegt"], ["beeinflusst", "gefaerbt"], ["beeinflusst", "gelenkt"], ["gefaerbt", "gepraegt"], ["gelenkt", "gepraegt"], ["gefaerbt", "gelenkt"], ["kennzeichen", "parameter"], ["kriterium", "parameter"], ["faktor", "parameter"], ["merkmal", "parameter"], ["kennzeichen", "kriterium"], ["faktor", "kennzeichen"], ["faktor", "kriterium"], ["kriterium", "merkmal"], ["faktor", "merkmal"], ["checkliste", "pruefliste"], ["abhakliste", "pruefliste"], ["klarliste", "pruefliste"], ["kontrollliste", "pruefliste"], ["abhakliste", "checkliste"], ["checkliste", "klarliste"], ["checkliste", "kontrollliste"], ["abhakliste", "klarliste"], ["abhakliste", "kontrollliste"], ["klarliste", "kontrollliste"], ["abhaengigkeit", "sucht"], ["sucht", "suchtverhalten"], ["abhaengigkeitserkrankung", "sucht"], ["abhaengigkeitssyndrom", "sucht"], ["laster", "sucht"], ["sucht", "suchterkrankung"], ["abhaengigkeit", "suchtverhalten"], ["abhaengigkeit", "abhaengigkeitserkrankung"], ["abhaengigkeit", "abhaengigkeitssyndrom"], ["abhaengigkeit", "laster"], ["abhaengigkeit", "suchterkrankung"], ["abhaengigkeitserkrankung", "suchtverhalten"], ["abhaengigkeitssyndrom", "suchtverhalten"], ["laster", "suchtverhalten"], ["suchterkrankung", "suchtverhalten"], ["abhaengigkeitserkrankung", "abhaengigkeitssyndrom"], ["abhaengigkeitserkrankung", "laster"], ["abhaengigkeitserkrankung", "suchterkrankung"], ["abhaengigkeitssyndrom", "laster"], ["abhaengigkeitssyndrom", "suchterkrankung"], ["laster", "suchterkrankung"], ["andauernd", "dauerhaft"], ["dauer", "dauerhaft"], ["bleibend", "dauerhaft"], ["chronisch", "dauerhaft"], ["dauerhaft", "langwierig"], ["andauernd", "dauer"], ["andauernd", "bleibend"], ["andauernd", "anhaltend"], ["andauernd", "chronisch"], ["andauernd", "langwierig"], ["bleibend", "dauer"], ["anhaltend", "dauer"], ["chronisch", "dauer"], ["dauer", "langwierig"], ["anhaltend", "bleibend"], ["bleibend", "chronisch"], ["bleibend", "langwierig"], ["anhaltend", "chronisch"], ["anhaltend", "langwierig"], ["chronisch", "langwierig"], ["entfernung", "ferne"], ["ferne", "weite"], ["distanz", "ferne"], ["entfernung", "weite"], ["distanz", "weite"], ["ergaenzen", "verbessern"], ["ergaenzen", "updaten"], ["abaendern", "ergaenzen"], ["ergaenzen", "novellieren"], ["ergaenzen", "ueberarbeiten"], ["updaten", "verbessern"], ["abaendern", "verbessern"], ["novellieren", "verbessern"], ["ueberarbeiten", "verbessern"], ["abaendern", "updaten"], ["novellieren", "updaten"], ["ueberarbeiten", "updaten"], ["abaendern", "novellieren"], ["abaendern", "ueberarbeiten"], ["novellieren", "ueberarbeiten"], ["aushorchen", "urgieren"], ["loechern", "urgieren"], ["nachbohren", "urgieren"], ["insistieren", "urgieren"], ["nachhaken", "urgieren"], ["ausfragen", "urgieren"], ["bohren", "urgieren"], ["aushorchen", "loechern"], ["aushorchen", "nachbohren"], ["aushorchen", "insistieren"], ["aushorchen", "nachhaken"], ["ausfragen", "aushorchen"], ["aushorchen", "bohren"], ["loechern", "nachbohren"], ["insistieren", "loechern"], ["loechern", "nachhaken"], ["ausfragen", "loechern"], ["bohren", "loechern"], ["insistieren", "nachbohren"], ["nachbohren", "nachhaken"], ["ausfragen", "nachbohren"], ["bohren", "nachbohren"], ["insistieren", "nachhaken"], ["ausfragen", "insistieren"], ["bohren", "insistieren"], ["ausfragen", "nachhaken"], ["bohren", "nachhaken"], ["ausfragen", "bohren"], ["abrufbereit", "disponibel"], ["disponibel", "verfuegbar"], ["betriebsbereit", "disponibel"], ["abrufbereit", "verfuegbar"], ["abrufbereit", "betriebsbereit"], ["betriebsbereit", "verfuegbar"], ["gegensatz", "kontrast"], ["kontrast", "unterschied"], ["durchschaubar", "transparent"], ["offen", "transparent"], ["durchschaubar", "offen"], ["antagonismus", "gegensatz"], ["gegeneinander", "gegensatz"], ["gegeneinanderstehen", "gegensatz"], ["antagonismus", "gegeneinander"], ["antagonismus", "gegeneinanderstehen"], ["gegeneinander", "gegeneinanderstehen"], ["assoziation", "verknuepfung"], ["verbindung", "verknuepfung"], ["konnotation", "verknuepfung"], ["gedankenverbindung", "verknuepfung"], ["assoziation", "verbindung"], ["assoziation", "konnotation"], ["assoziation", "gedankenverbindung"], ["konnotation", "verbindung"], ["gedankenverbindung", "verbindung"], ["gedankenverbindung", "konnotation"], ["moeglichst", "tunlichst"], ["lieber", "moeglichst"], ["besser", "moeglichst"], ["lieber", "tunlichst"], ["besser", "tunlichst"], ["besser", "lieber"], ["abreissen", "sitzen"], ["einsitzen", "sitzen"], ["absitzen", "sitzen"], ["sitzen", "verbuessen"], ["abbrummen", "sitzen"], ["abreissen", "einsitzen"], ["abreissen", "absitzen"], ["abreissen", "verbuessen"], ["abbrummen", "abreissen"], ["absitzen", "einsitzen"], ["einsitzen", "verbuessen"], ["abbrummen", "einsitzen"], ["absitzen", "verbuessen"], ["abbrummen", "absitzen"], ["abbrummen", "verbuessen"], ["fanal", "zeichen"], ["fanal", "signal"], ["kick", "thrill"], ["kick", "wuerze"], ["gespanntheit", "kick"], ["kick", "suspense"], ["kick", "nervenkitzel"], ["kick", "spannung"], ["thrill", "wuerze"], ["gespanntheit", "thrill"], ["suspense", "thrill"], ["nervenkitzel", "thrill"], ["spannung", "thrill"], ["gespanntheit", "wuerze"], ["suspense", "wuerze"], ["nervenkitzel", "wuerze"], ["spannung", "wuerze"], ["gespanntheit", "suspense"], ["gespanntheit", "nervenkitzel"], ["gespanntheit", "spannung"], ["nervenkitzel", "suspense"], ["spannung", "suspense"], ["nervenkitzel", "spannung"], ["ebene", "schicht"], ["ebene", "lage"], ["band", "schinken"], ["buch", "schinken"], ["schinken", "titel"], ["schinken", "schmoeker"], ["lektuere", "schinken"], ["band", "buch"], ["band", "titel"], ["band", "schmoeker"], ["band", "lektuere"], ["buch", "titel"], ["buch", "schmoeker"], ["buch", "lektuere"], ["schmoeker", "titel"], ["lektuere", "titel"], ["lektuere", "schmoeker"], ["bruecke", "ueberfuehrung"], ["bruecke", "uebergang"], ["bruecke", "viadukt"], ["bruecke", "querung"], ["ueberfuehrung", "uebergang"], ["ueberfuehrung", "viadukt"], ["querung", "ueberfuehrung"], ["uebergang", "viadukt"], ["querung", "uebergang"], ["querung", "viadukt"], ["referenz", "verweis"], ["einschnitt", "unterbrechung"], ["unterbrechung", "wendepunkt"], ["bruch", "unterbrechung"], ["unterbrechung", "zaesur"], ["disruption", "unterbrechung"], ["einschnitt", "wendepunkt"], ["bruch", "einschnitt"], ["einschnitt", "zaesur"], ["disruption", "einschnitt"], ["bruch", "wendepunkt"], ["wendepunkt", "zaesur"], ["disruption", "wendepunkt"], ["bruch", "zaesur"], ["bruch", "disruption"], ["disruption", "zaesur"], ["plan", "zusammenfassung"], ["plan", "skizze"], ["exposee", "plan"], ["expose", "plan"], ["skizze", "zusammenfassung"], ["exposee", "zusammenfassung"], ["expose", "zusammenfassung"], ["exposee", "skizze"], ["expose", "skizze"], ["expose", "exposee"], ["mass", "masseinheit"], ["einheit", "masseinheit"], ["einheit", "mass"], ["fernsehprogramm", "tv-sender"], ["fernsehkanal", "fernsehprogramm"], ["fernsehprogramm", "fernsehsender"], ["fernsehprogramm", "sender"], ["fernsehprogramm", "programm"], ["fernsehkanal", "tv-sender"], ["fernsehsender", "tv-sender"], ["sender", "tv-sender"], ["programm", "tv-sender"], ["fernsehkanal", "fernsehsender"], ["fernsehkanal", "sender"], ["fernsehkanal", "programm"], ["fernsehsender", "sender"], ["fernsehsender", "programm"], ["programm", "sender"], ["agent", "automat"], ["automat", "roboter"], ["automat", "blechkamerad"], ["automat", "maschine"], ["agent", "roboter"], ["agent", "blechkamerad"], ["agent", "maschine"], ["blechkamerad", "roboter"], ["maschine", "roboter"], ["blechkamerad", "maschine"], ["aufhebung", "streichung"], ["aufloesung", "streichung"], ["einstellung", "streichung"], ["abschaffung", "streichung"], ["beseitigung", "streichung"], ["annullierung", "streichung"], ["aufhebung", "aufloesung"], ["aufhebung", "einstellung"], ["abschaffung", "aufhebung"], ["aufhebung", "beseitigung"], ["annullierung", "aufhebung"], ["aufloesung", "einstellung"], ["abschaffung", "aufloesung"], ["aufloesung", "beseitigung"], ["annullierung", "aufloesung"], ["abschaffung", "einstellung"], ["beseitigung", "einstellung"], ["annullierung", "einstellung"], ["abschaffung", "beseitigung"], ["abschaffung", "annullierung"], ["annullierung", "beseitigung"], ["aderlass", "schaden"], ["aderlass", "verlust"], ["aderlass", "schaedigung"], ["schaden", "verlust"], ["schaden", "schaedigung"], ["schaedigung", "verlust"], ["block", "gruppe"], ["block", "spektrum"], ["block", "gruppierung"], ["block", "fluegel"], ["block", "lager"], ["gruppe", "spektrum"], ["gruppe", "gruppierung"], ["fluegel", "gruppe"], ["gruppe", "lager"], ["gruppierung", "spektrum"], ["fluegel", "spektrum"], ["lager", "spektrum"], ["fluegel", "gruppierung"], ["gruppierung", "lager"], ["fluegel", "lager"], ["fensterglas", "glas"], ["dieserfalls", "hier"], ["dieserfalls", "hierbei"], ["dieserfalls", "unterdies"], ["dazu", "dieserfalls"], ["dabei", "dieserfalls"], ["derbei", "dieserfalls"], ["dieserfalls", "nun"], ["hier", "hierbei"], ["hier", "unterdies"], ["dazu", "hier"], ["dabei", "hier"], ["derbei", "hier"], ["hier", "nun"], ["hierbei", "unterdies"], ["dazu", "hierbei"], ["derbei", "hierbei"], ["hierbei", "nun"], ["dazu", "unterdies"], ["dabei", "unterdies"], ["derbei", "unterdies"], ["nun", "unterdies"], ["dabei", "dazu"], ["dazu", "derbei"], ["dazu", "nun"], ["dabei", "derbei"], ["dabei", "nun"], ["derbei", "nun"], ["knacken", "unterlaufen"], ["aushebeln", "unterlaufen"], ["aufbrechen", "unterlaufen"], ["umgehen", "unterlaufen"], ["aushebeln", "knacken"], ["knacken", "umgehen"], ["aufbrechen", "aushebeln"], ["aushebeln", "umgehen"], ["aufbrechen", "umgehen"], ["welle", "zunehmend"], ["gehaeuft", "welle"], ["verstaerkt", "welle"], ["vermehrt", "welle"], ["gehaeuft", "zunehmend"], ["verstaerkt", "zunehmend"], ["vermehrt", "zunehmend"], ["gehaeuft", "verstaerkt"], ["gehaeuft", "vermehrt"], ["vermehrt", "verstaerkt"], ["charakterisieren", "kennzeichnen"], ["beschreiben", "charakterisieren"], ["beschreiben", "kennzeichnen"], ["ermitteln", "feststellen"], ["diagnostizieren", "ermitteln"], ["bestimmen", "ermitteln"], ["diagnostizieren", "feststellen"], ["bestimmen", "feststellen"], ["bestimmen", "diagnostizieren"], ["sicherheit", "versatzstueck"], ["sicherheitsleistung", "versatzstueck"], ["kaution", "versatzstueck"], ["pfand", "versatzstueck"], ["hinterlegung", "versatzstueck"], ["einsatz", "versatzstueck"], ["depot", "versatzstueck"], ["sicherheit", "sicherheitsleistung"], ["kaution", "sicherheit"], ["pfand", "sicherheit"], ["hinterlegung", "sicherheit"], ["einsatz", "sicherheit"], ["depot", "sicherheit"], ["kaution", "sicherheitsleistung"], ["pfand", "sicherheitsleistung"], ["hinterlegung", "sicherheitsleistung"], ["einsatz", "sicherheitsleistung"], ["depot", "sicherheitsleistung"], ["kaution", "pfand"], ["hinterlegung", "kaution"], ["einsatz", "kaution"], ["depot", "kaution"], ["hinterlegung", "pfand"], ["einsatz", "pfand"], ["depot", "pfand"], ["einsatz", "hinterlegung"], ["depot", "hinterlegung"], ["depot", "einsatz"], ["bein", "lauf"], ["bein", "pinn"], ["bein", "kackstelze"], ["bein", "fuss"], ["lauf", "pinn"], ["kackstelze", "lauf"], ["fuss", "lauf"], ["kackstelze", "pinn"], ["fuss", "pinn"], ["fuss", "kackstelze"], ["ablegen", "bereithalten"], ["ablegen", "speichern"], ["bereithalten", "speichern"], ["anregung", "kommentar"], ["kommentar", "rueckmeldung"], ["feedback", "kommentar"], ["kommentar", "stellungnahme"], ["kommentar", "resonanz"], ["anregung", "rueckmeldung"], ["anregung", "feedback"], ["anregung", "stellungnahme"], ["anregung", "resonanz"], ["feedback", "rueckmeldung"], ["rueckmeldung", "stellungnahme"], ["resonanz", "rueckmeldung"], ["feedback", "stellungnahme"], ["feedback", "resonanz"], ["resonanz", "stellungnahme"], ["funkeln", "leuchten"], ["glanz", "leuchten"], ["leuchten", "strahlung"], ["brillanz", "leuchten"], ["funkeln", "glanz"], ["funkeln", "strahlung"], ["brillanz", "funkeln"], ["glanz", "strahlung"], ["brillanz", "glanz"], ["brillanz", "strahlung"], ["anpassung", "einstellung"], ["anpassung", "konfiguration"], ["einstellung", "konfiguration"], ["anlage", "maschine"], ["geraet", "maschine"], ["apparat", "maschine"], ["aggregat", "maschine"], ["apparatur", "maschine"], ["anlage", "geraet"], ["anlage", "apparat"], ["aggregat", "anlage"], ["anlage", "automat"], ["anlage", "apparatur"], ["aggregat", "geraet"], ["automat", "geraet"], ["aggregat", "apparat"], ["apparat", "automat"], ["aggregat", "automat"], ["aggregat", "apparatur"], ["apparatur", "automat"], ["datenansammlung", "wissen"], ["datenansammlung", "kenntnis"], ["daten", "datenansammlung"], ["datenansammlung", "information"], ["datenansammlung", "fakten"], ["kenntnis", "wissen"], ["daten", "wissen"], ["information", "wissen"], ["fakten", "wissen"], ["daten", "kenntnis"], ["information", "kenntnis"], ["fakten", "kenntnis"], ["daten", "information"], ["daten", "fakten"], ["fakten", "information"], ["ausfuehrung", "exekution"], ["ausfuehrung", "durchfuehrung"], ["ausfuehrung", "vollstreckung"], ["ausfuehrung", "vollziehung"], ["durchfuehrung", "exekution"], ["exekution", "vollstreckung"], ["exekution", "vollziehung"], ["durchfuehrung", "vollstreckung"], ["durchfuehrung", "vollziehung"], ["vollstreckung", "vollziehung"], ["drum", "trommel"], ["segment", "teilgebiet"], ["feld", "segment"], ["segment", "teilbereich"], ["segment", "sparte"], ["arbeitsgebiet", "segment"], ["bereich", "teilgebiet"], ["bereich", "teilbereich"], ["bereich", "sparte"], ["arbeitsgebiet", "bereich"], ["feld", "teilgebiet"], ["teilbereich", "teilgebiet"], ["sparte", "teilgebiet"], ["arbeitsgebiet", "teilgebiet"], ["feld", "teilbereich"], ["feld", "sparte"], ["arbeitsgebiet", "feld"], ["sparte", "teilbereich"], ["arbeitsgebiet", "teilbereich"], ["arbeitsgebiet", "sparte"], ["geplant", "intendiert"], ["angelegt", "intendiert"], ["eingeplant", "intendiert"], ["beabsichtigt", "intendiert"], ["intendiert", "vorgesehen"], ["angelegt", "geplant"], ["eingeplant", "geplant"], ["beabsichtigt", "geplant"], ["geplant", "vorgesehen"], ["angelegt", "eingeplant"], ["angelegt", "beabsichtigt"], ["angelegt", "vorgesehen"], ["beabsichtigt", "eingeplant"], ["eingeplant", "vorgesehen"], ["beabsichtigt", "vorgesehen"], ["entfallen", "vergessen"], ["aufsetzen", "installieren"], ["aufspielen", "installieren"], ["einspielen", "installieren"], ["ausrollen", "installieren"], ["bespielen", "installieren"], ["draufbuegeln", "installieren"], ["aufsetzen", "aufspielen"], ["aufsetzen", "einspielen"], ["aufsetzen", "ausrollen"], ["aufsetzen", "bespielen"], ["aufsetzen", "draufbuegeln"], ["aufspielen", "einspielen"], ["aufspielen", "ausrollen"], ["aufspielen", "bespielen"], ["aufspielen", "draufbuegeln"], ["ausrollen", "einspielen"], ["bespielen", "einspielen"], ["draufbuegeln", "einspielen"], ["ausrollen", "bespielen"], ["ausrollen", "draufbuegeln"], ["bespielen", "draufbuegeln"], ["eingriff", "operation"], ["drehen", "umdrehen"], ["drehen", "wenden"], ["umdrehen", "wenden"], ["wegpacken", "wegraeumen"], ["versorgen", "wegpacken"], ["verstauen", "wegpacken"], ["einsortieren", "wegpacken"], ["einraeumen", "wegpacken"], ["unterbringen", "wegpacken"], ["verraeumen", "wegpacken"], ["versorgen", "wegraeumen"], ["verstauen", "wegraeumen"], ["einsortieren", "wegraeumen"], ["einraeumen", "wegraeumen"], ["unterbringen", "wegraeumen"], ["verraeumen", "wegraeumen"], ["versorgen", "verstauen"], ["einsortieren", "versorgen"], ["einraeumen", "versorgen"], ["unterbringen", "versorgen"], ["verraeumen", "versorgen"], ["einsortieren", "verstauen"], ["einraeumen", "verstauen"], ["unterbringen", "verstauen"], ["verraeumen", "verstauen"], ["einraeumen", "einsortieren"], ["einsortieren", "unterbringen"], ["einsortieren", "verraeumen"], ["einraeumen", "unterbringen"], ["einraeumen", "verraeumen"], ["unterbringen", "verraeumen"], ["schaffen", "wissenzu"], ["bringen", "schaffen"], ["koennen", "schaffen"], ["bringen", "wissenzu"], ["koennen", "wissenzu"], ["bringen", "koennen"], ["fernbleiben", "schwaenzen"], ["abwesend", "fernbleiben"], ["fernbleiben", "wegbleiben"], ["fehlen", "fernbleiben"], ["druecken", "fernbleiben"], ["fernbleiben", "sausenlassen"], ["blaumachen", "fernbleiben"], ["abwesend", "schwaenzen"], ["schwaenzen", "wegbleiben"], ["fehlen", "schwaenzen"], ["druecken", "schwaenzen"], ["sausenlassen", "schwaenzen"], ["blaumachen", "schwaenzen"], ["abwesend", "wegbleiben"], ["abwesend", "fehlen"], ["abwesend", "druecken"], ["abwesend", "sausenlassen"], ["abwesend", "blaumachen"], ["fehlen", "wegbleiben"], ["druecken", "wegbleiben"], ["sausenlassen", "wegbleiben"], ["blaumachen", "wegbleiben"], ["druecken", "fehlen"], ["fehlen", "sausenlassen"], ["blaumachen", "fehlen"], ["druecken", "sausenlassen"], ["blaumachen", "druecken"], ["blaumachen", "sausenlassen"], ["festlegen", "setzen"], ["festlegen", "vorgeben"], ["setzen", "vorgeben"], ["bestimmen", "setzen"], ["festsetzen", "setzen"], ["bestimmen", "vorgeben"], ["festsetzen", "vorgeben"], ["beeinflussen", "beherrschen"], ["beeinflussen", "lenken"], ["beeinflussen", "veraendern"], ["beeinflussen", "steuern"], ["beeinflussen", "manipulieren"], ["beherrschen", "lenken"], ["beherrschen", "veraendern"], ["beherrschen", "steuern"], ["beherrschen", "manipulieren"], ["lenken", "veraendern"], ["lenken", "steuern"], ["lenken", "manipulieren"], ["steuern", "veraendern"], ["manipulieren", "veraendern"], ["manipulieren", "steuern"], ["kalendertag", "tag"], ["fruchten", "greifen"], ["auswirken", "fruchten"], ["fruchten", "wirken"], ["fruchten", "funktionieren"], ["auswirken", "greifen"], ["greifen", "wirken"], ["funktionieren", "greifen"], ["auswirken", "wirken"], ["auswirken", "funktionieren"], ["funktionieren", "wirken"], ["hygiene", "koerperpflege"], ["gesundheitspflege", "hygiene"], ["hygiene", "sauberkeit"], ["gesundheitspflege", "koerperpflege"], ["koerperpflege", "sauberkeit"], ["gesundheitspflege", "sauberkeit"], ["abbildung", "funktion"], ["original", "type"], ["sonderling", "type"], ["type", "unikum"], ["type", "vogel"], ["freak", "type"], ["type", "urvieh"], ["type", "wunderling"], ["original", "sonderling"], ["original", "unikum"], ["original", "vogel"], ["freak", "original"], ["original", "urvieh"], ["original", "wunderling"], ["sonderling", "unikum"], ["sonderling", "vogel"], ["freak", "sonderling"], ["sonderling", "urvieh"], ["sonderling", "wunderling"], ["unikum", "vogel"], ["freak", "unikum"], ["unikum", "urvieh"], ["unikum", "wunderling"], ["freak", "vogel"], ["urvieh", "vogel"], ["vogel", "wunderling"], ["freak", "urvieh"], ["freak", "wunderling"], ["urvieh", "wunderling"], ["hinsichtlich", "wie"], ["entsprechend", "hinsichtlich"], ["falten", "kniffen"], ["knicken", "kniffen"], ["falzen", "kniffen"], ["falten", "falzen"], ["falzen", "knicken"], ["hiatus", "unterbrechung"], ["hiatus", "luecke"], ["hiatus", "pause"], ["hiatus", "zwischenzeit"], ["hiatus", "interim"], ["hiatus", "zwischenphase"], ["auszeit", "hiatus"], ["luecke", "unterbrechung"], ["pause", "unterbrechung"], ["unterbrechung", "zwischenzeit"], ["interim", "unterbrechung"], ["unterbrechung", "zwischenphase"], ["auszeit", "unterbrechung"], ["luecke", "pause"], ["luecke", "zwischenzeit"], ["interim", "luecke"], ["luecke", "zwischenphase"], ["auszeit", "luecke"], ["pause", "zwischenzeit"], ["interim", "pause"], ["pause", "zwischenphase"], ["auszeit", "pause"], ["interim", "zwischenzeit"], ["zwischenphase", "zwischenzeit"], ["auszeit", "zwischenzeit"], ["interim", "zwischenphase"], ["auszeit", "interim"], ["auszeit", "zwischenphase"], ["angabe", "eintragung"], ["angabe", "daten"], ["daten", "eintragung"], ["bindeglied", "verbindung"], ["anschluss", "bindeglied"], ["umsteigemoeglichkeit", "verbindung"], ["anschluss", "umsteigemoeglichkeit"], ["oppositionell", "oppositiv"], ["adversativ", "oppositiv"], ["gegenueber", "oppositiv"], ["kontrastiv", "oppositiv"], ["gegenuebergestellt", "oppositiv"], ["adversativ", "oppositionell"], ["gegenueber", "oppositionell"], ["kontrastiv", "oppositionell"], ["gegenuebergestellt", "oppositionell"], ["adversativ", "gegenueber"], ["adversativ", "kontrastiv"], ["adversativ", "gegenuebergestellt"], ["gegenueber", "kontrastiv"], ["gegenueber", "gegenuebergestellt"], ["gegenuebergestellt", "kontrastiv"], ["aluminium", "aluminum"], ["alaun", "aluminum"], ["alu", "aluminum"], ["alaun", "aluminium"], ["alu", "aluminium"], ["alaun", "alu"], ["melodie", "tonfolge"], ["melodei", "melodie"], ["melodie", "weise"], ["linie", "melodie"], ["melodei", "tonfolge"], ["tonfolge", "weise"], ["linie", "tonfolge"], ["melodei", "weise"], ["linie", "melodei"], ["linie", "weise"], ["haftgrund", "putzgrund"], ["grundierung", "putzgrund"], ["putzgrund", "untergrund"], ["grundierung", "haftgrund"], ["haftgrund", "untergrund"], ["grundierung", "untergrund"], ["schutz", "sicherheit"], ["maschine", "personalcomputer"], ["komplettsystem", "personalcomputer"], ["personalcomputer", "rechner"], ["kiste", "personalcomputer"], ["personalcomputer", "system"], ["komplettsystem", "maschine"], ["maschine", "rechner"], ["kiste", "maschine"], ["maschine", "system"], ["komplettsystem", "rechner"], ["kiste", "komplettsystem"], ["komplettsystem", "system"], ["kiste", "rechner"], ["rechner", "system"], ["kiste", "system"], ["engineering-arbeit", "entwicklung"], ["engineering-arbeit", "programmierung"], ["engineering-arbeit", "implementation"], ["codierung", "engineering-arbeit"], ["coding", "engineering-arbeit"], ["engineering-arbeit", "softwareentwicklung"], ["entwicklung", "programmierung"], ["entwicklung", "implementation"], ["codierung", "entwicklung"], ["coding", "entwicklung"], ["entwicklung", "softwareentwicklung"], ["implementation", "programmierung"], ["codierung", "programmierung"], ["coding", "programmierung"], ["programmierung", "softwareentwicklung"], ["codierung", "implementation"], ["coding", "implementation"], ["implementation", "softwareentwicklung"], ["codierung", "coding"], ["codierung", "softwareentwicklung"], ["coding", "softwareentwicklung"], ["kilometer", "klick"], ["gleichen", "uebereinstimmen"], ["impuls", "initiierung"], ["anstoss", "impuls"], ["impuls", "stoss"], ["anstoss", "initiierung"], ["initiierung", "stoss"], ["anstoss", "stoss"], ["indem", "waehrend"], ["dann", "dannzumal"], ["dann", "hier"], ["dann", "hierbei"], ["dann", "diesfalls"], ["dannzumal", "hier"], ["dannzumal", "hierbei"], ["dannzumal", "diesfalls"], ["diesfalls", "hier"], ["diesfalls", "hierbei"], ["aufnehmen", "festhalten"], ["erfassen", "festhalten"], ["festhalten", "verbuchen"], ["buchen", "festhalten"], ["eintragen", "festhalten"], ["aufnehmen", "erfassen"], ["aufnehmen", "verbuchen"], ["aufnehmen", "speichern"], ["aufnehmen", "buchen"], ["aufnehmen", "eintragen"], ["erfassen", "verbuchen"], ["erfassen", "speichern"], ["buchen", "erfassen"], ["eintragen", "erfassen"], ["speichern", "verbuchen"], ["buchen", "verbuchen"], ["eintragen", "verbuchen"], ["buchen", "speichern"], ["eintragen", "speichern"], ["buchen", "eintragen"], ["induktivitaet", "spule"], ["ausarbeiten", "besprechen"], ["ausarbeiten", "behandeln"], ["ausarbeiten", "eroertern"], ["abhandeln", "ausarbeiten"], ["abfassen", "ausarbeiten"], ["behandeln", "besprechen"], ["besprechen", "eroertern"], ["abhandeln", "besprechen"], ["abfassen", "besprechen"], ["behandeln", "eroertern"], ["abhandeln", "behandeln"], ["abfassen", "behandeln"], ["abhandeln", "eroertern"], ["abfassen", "eroertern"], ["abfassen", "abhandeln"], ["feststehend", "gottgegeben"], ["feststehend", "gegeben"], ["feststehend", "vorgegeben"], ["feststehend", "vorbestimmt"], ["gegeben", "gottgegeben"], ["gottgegeben", "vorgegeben"], ["gottgegeben", "vorbestimmt"], ["gegeben", "vorgegeben"], ["gegeben", "vorbestimmt"], ["vorbestimmt", "vorgegeben"], ["anmuten", "erscheinen"], ["anmuten", "duenken"], ["anmuten", "wirken"], ["anmuten", "praesentieren"], ["anmuten", "vorkommen"], ["anmuten", "darstellen"], ["duenken", "erscheinen"], ["erscheinen", "wirken"], ["erscheinen", "praesentieren"], ["erscheinen", "vorkommen"], ["darstellen", "erscheinen"], ["duenken", "wirken"], ["duenken", "praesentieren"], ["duenken", "vorkommen"], ["darstellen", "duenken"], ["praesentieren", "wirken"], ["vorkommen", "wirken"], ["darstellen", "wirken"], ["praesentieren", "vorkommen"], ["darstellen", "vorkommen"], ["darstellen", "figurieren"], ["bezeichnungtragen", "figurieren"], ["figurieren", "firmieren"], ["figurieren", "sein"], ["figurieren", "heissen"], ["figurieren", "fungieren"], ["bezeichnungtragen", "darstellen"], ["darstellen", "firmieren"], ["darstellen", "sein"], ["darstellen", "heissen"], ["darstellen", "fungieren"], ["bezeichnungtragen", "firmieren"], ["bezeichnungtragen", "sein"], ["bezeichnungtragen", "heissen"], ["bezeichnungtragen", "fungieren"], ["firmieren", "sein"], ["firmieren", "heissen"], ["firmieren", "fungieren"], ["heissen", "sein"], ["fungieren", "sein"], ["fungieren", "heissen"], ["hand", "manuell"], ["haendisch", "hand"], ["haendisch", "manuell"], ["ausrechnen", "errechnen"], ["ausrechnen", "ermitteln"], ["ausrechnen", "kalkulieren"], ["ausrechnen", "berechnen"], ["ausrechnen", "bestimmen"], ["ermitteln", "errechnen"], ["errechnen", "kalkulieren"], ["berechnen", "errechnen"], ["bestimmen", "errechnen"], ["bestimmen", "kalkulieren"], ["berechnen", "bestimmen"], ["bild", "grafik"], ["grafik", "graphik"], ["bild", "graphik"], ["kennzeichnen", "markieren"], ["anmarkern", "kennzeichnen"], ["einmalen", "kennzeichnen"], ["einzeichnen", "kennzeichnen"], ["anmarkern", "markieren"], ["einmalen", "markieren"], ["einzeichnen", "markieren"], ["anmarkern", "einmalen"], ["anmarkern", "einzeichnen"], ["einmalen", "einzeichnen"], ["dabei", "zeigen"], ["dabei", "praesent"], ["anwesend", "dabei"], ["dabei", "zugegen"], ["praesent", "zeigen"], ["anwesend", "zeigen"], ["zeigen", "zugegen"], ["anwesend", "praesent"], ["praesent", "zugegen"], ["anwesend", "zugegen"], ["auflegen", "einhaengen"], ["assoziieren", "einsetzen"], ["assoziieren", "ersetzen"], ["assoziieren", "zuweisen"], ["assoziieren", "uebergeben"], ["einsetzen", "ersetzen"], ["einsetzen", "zuweisen"], ["einsetzen", "uebergeben"], ["ersetzen", "zuweisen"], ["ersetzen", "uebergeben"], ["uebergeben", "zuweisen"], ["sinn", "sinnhaftigkeit"], ["sinnhaftigkeit", "ziel"], ["sinnhaftigkeit", "zweckhaftigkeit"], ["nutzen", "sinnhaftigkeit"], ["sinnhaftigkeit", "zweck"], ["sinn", "ziel"], ["sinn", "zweckhaftigkeit"], ["nutzen", "sinn"], ["sinn", "zweck"], ["ziel", "zweckhaftigkeit"], ["nutzen", "ziel"], ["ziel", "zweck"], ["nutzen", "zweckhaftigkeit"], ["zweck", "zweckhaftigkeit"], ["nutzen", "zweck"], ["aeusserlich", "ausserhalb"], ["aeusserlich", "extrinsisch"], ["aeusserlich", "external"], ["ausserhalb", "extrinsisch"], ["ausserhalb", "external"], ["external", "extrinsisch"], ["bruchstelle", "leckage"], ["bruchstelle", "oeffnung"], ["bruchstelle", "leck"], ["leckage", "oeffnung"], ["leck", "leckage"], ["leck", "oeffnung"], ["bestehen", "zusammensetzen"], ["bestehen", "enthalten"], ["enthalten", "zusammensetzen"], ["anliegen", "anstehen"], ["erscheinen", "visite"], ["besuch", "visite"], ["kommen", "visite"], ["besuch", "erscheinen"], ["erscheinen", "kommen"], ["besuch", "kommen"], ["folgsam", "gehorchen"], ["gehorchen", "hoeren"], ["folgen", "gehorchen"], ["brav", "gehorchen"], ["folgsam", "hoeren"], ["folgen", "folgsam"], ["brav", "folgsam"], ["folgen", "hoeren"], ["brav", "hoeren"], ["brav", "folgen"], ["beides", "neben"], ["bestimmt", "eindeutig"], ["bestimmt", "eigen"], ["bestimmt", "spezifisch"], ["bestimmt", "charakteristisch"], ["eigen", "eindeutig"], ["eindeutig", "spezifisch"], ["charakteristisch", "eindeutig"], ["eigen", "spezifisch"], ["charakteristisch", "eigen"], ["charakteristisch", "spezifisch"], ["austauschen", "umstellen"], ["permutieren", "umstellen"], ["kommutieren", "umstellen"], ["umstellen", "vertauschen"], ["austauschen", "permutieren"], ["austauschen", "kommutieren"], ["austauschen", "vertauschen"], ["kommutieren", "permutieren"], ["permutieren", "vertauschen"], ["kommutieren", "vertauschen"], ["portieren", "umsetzen"], ["anpassen", "portieren"], ["portieren", "uebertragen"], ["anpassen", "umsetzen"], ["uebertragen", "umsetzen"], ["anpassen", "uebertragen"], ["aufbauen", "etablieren"], ["aufbauen", "gruenden"], ["aufbauen", "starten"], ["etablieren", "gruenden"], ["etablieren", "starten"], ["gruenden", "starten"], ["flugsteig", "gate"], ["ausgang", "flugsteig"], ["ausgang", "gate"], ["drehscheibe", "knotenpunkt"], ["knoten", "knotenpunkt"], ["knotenpunkt", "umschlagpunkt"], ["drehkreuz", "knotenpunkt"], ["hub", "knotenpunkt"], ["knotenpunkt", "verkehrsknotenpunkt"], ["drehscheibe", "knoten"], ["drehscheibe", "umschlagpunkt"], ["drehkreuz", "drehscheibe"], ["drehscheibe", "hub"], ["drehscheibe", "verkehrsknotenpunkt"], ["knoten", "umschlagpunkt"], ["drehkreuz", "knoten"], ["hub", "knoten"], ["knoten", "verkehrsknotenpunkt"], ["drehkreuz", "umschlagpunkt"], ["hub", "umschlagpunkt"], ["umschlagpunkt", "verkehrsknotenpunkt"], ["drehkreuz", "hub"], ["drehkreuz", "verkehrsknotenpunkt"], ["hub", "verkehrsknotenpunkt"], ["reif", "ring"], ["ergebnis", "wert"], ["auspraegung", "wert"], ["auspraegung", "ergebnis"], ["wert", "zahl"], ["abschneiden", "wegkommen"], ["abschneiden", "schlagen"], ["schlagen", "wegkommen"], ["methode", "werkzeug"], ["instrument", "methode"], ["ansatz", "methode"], ["methode", "mittel"], ["massnahme", "methode"], ["handhabe", "methode"], ["format", "methode"], ["ansatz", "werkzeug"], ["mittel", "werkzeug"], ["massnahme", "werkzeug"], ["handhabe", "werkzeug"], ["format", "werkzeug"], ["ansatz", "instrument"], ["instrument", "mittel"], ["instrument", "massnahme"], ["handhabe", "instrument"], ["format", "instrument"], ["ansatz", "mittel"], ["ansatz", "massnahme"], ["ansatz", "handhabe"], ["ansatz", "format"], ["massnahme", "mittel"], ["handhabe", "mittel"], ["format", "mittel"], ["handhabe", "massnahme"], ["format", "massnahme"], ["format", "handhabe"], ["luftstroemung", "luftstrom"], ["luftstrom", "wind"], ["luftbewegung", "luftstrom"], ["luftdruckausgleich", "luftstrom"], ["luftstroemung", "wind"], ["luftbewegung", "luftstroemung"], ["luftdruckausgleich", "luftstroemung"], ["luftbewegung", "wind"], ["luftdruckausgleich", "wind"], ["luftbewegung", "luftdruckausgleich"], ["abtragung", "erosion"], ["ablation", "erosion"], ["abrasion", "erosion"], ["ablation", "abtragung"], ["abrasion", "abtragung"], ["ablation", "abrasion"], ["durchgang", "halbzeit"], ["durchgang", "partie"], ["durchgang", "erstesrennen"], ["drittel", "durchgang"], ["durchgang", "ersterlauf"], ["durchgang", "spielabschnitt"], ["halbzeit", "partie"], ["erstesrennen", "halbzeit"], ["halbzeit", "runde"], ["drittel", "halbzeit"], ["ersterlauf", "halbzeit"], ["halbzeit", "spielabschnitt"], ["erstesrennen", "partie"], ["partie", "runde"], ["drittel", "partie"], ["ersterlauf", "partie"], ["partie", "spielabschnitt"], ["erstesrennen", "runde"], ["drittel", "erstesrennen"], ["ersterlauf", "erstesrennen"], ["erstesrennen", "spielabschnitt"], ["drittel", "runde"], ["ersterlauf", "runde"], ["runde", "spielabschnitt"], ["drittel", "ersterlauf"], ["drittel", "spielabschnitt"], ["ersterlauf", "spielabschnitt"], ["eichung", "justierung"], ["eichung", "messung"], ["eichung", "justage"], ["eichung", "kalibration"], ["justierung", "messung"], ["justage", "justierung"], ["justierung", "kalibration"], ["justage", "messung"], ["kalibration", "messung"], ["justage", "kalibration"], ["fernbedienung", "fernsteuerung"], ["fernsteuerung", "umschalter"], ["commander", "fernsteuerung"], ["fernbedienung", "umschalter"], ["commander", "fernbedienung"], ["commander", "umschalter"], ["adjustieren", "eichen"], ["ausrichten", "eichen"], ["eichen", "einstellen"], ["anpassen", "eichen"], ["adjustieren", "ausrichten"], ["adjustieren", "einstellen"], ["adjustieren", "anpassen"], ["ausrichten", "einstellen"], ["anpassen", "ausrichten"], ["ersatzrad", "reservereifen"], ["reserverad", "reservereifen"], ["notrad", "reservereifen"], ["reservepneu", "reservereifen"], ["ersatzreifen", "reservereifen"], ["ersatzrad", "reserverad"], ["ersatzrad", "notrad"], ["ersatzrad", "reservepneu"], ["ersatzrad", "ersatzreifen"], ["notrad", "reserverad"], ["reservepneu", "reserverad"], ["ersatzreifen", "reserverad"], ["notrad", "reservepneu"], ["ersatzreifen", "notrad"], ["ersatzreifen", "reservepneu"], ["corner", "eckstoss"], ["corner", "eckball"], ["corner", "ecke"], ["eckball", "eckstoss"], ["ecke", "eckstoss"], ["eckball", "ecke"], ["blinklicht", "fahrtrichtungsanzeiger"], ["blinklicht", "richtungsanzeiger"], ["blinker", "blinklicht"], ["blinkleuchte", "blinklicht"], ["fahrtrichtungsanzeiger", "richtungsanzeiger"], ["blinker", "fahrtrichtungsanzeiger"], ["blinkleuchte", "fahrtrichtungsanzeiger"], ["blinker", "richtungsanzeiger"], ["blinkleuchte", "richtungsanzeiger"], ["blinker", "blinkleuchte"], ["aufhebung", "suspension"], ["aussetzung", "suspension"], ["suspension", "unterbrechung"], ["aufhebung", "aussetzung"], ["aufhebung", "unterbrechung"], ["aussetzung", "unterbrechung"], ["led", "leuchtdiode"], ["leuchtdiode", "lumineszenzdiode"], ["led", "lumineszenzdiode"], ["abgegrenzt", "unterscheidbar"], ["getrennt", "unterscheidbar"], ["distinkt", "unterscheidbar"], ["diskret", "unterscheidbar"], ["differenzierbar", "unterscheidbar"], ["abgrenzbar", "unterscheidbar"], ["abgegrenzt", "getrennt"], ["abgegrenzt", "distinkt"], ["abgegrenzt", "diskret"], ["abgegrenzt", "differenzierbar"], ["abgegrenzt", "abgrenzbar"], ["distinkt", "getrennt"], ["diskret", "getrennt"], ["differenzierbar", "getrennt"], ["abgrenzbar", "getrennt"], ["diskret", "distinkt"], ["differenzierbar", "distinkt"], ["abgrenzbar", "distinkt"], ["differenzierbar", "diskret"], ["abgrenzbar", "diskret"], ["abgrenzbar", "differenzierbar"], ["eingriff", "veraenderung"], ["abdeckung", "absicherung"], ["abdeckung", "sicherheiten"], ["absicherung", "sicherheiten"], ["durchschlag", "sieb"], ["durchschlag", "seiher"], ["abtropfsieb", "durchschlag"], ["durchschlag", "kuechensieb"], ["durchschlag", "seicher"], ["durchschlag", "seihe"], ["seiher", "sieb"], ["abtropfsieb", "sieb"], ["kuechensieb", "sieb"], ["seicher", "sieb"], ["seihe", "sieb"], ["abtropfsieb", "seiher"], ["kuechensieb", "seiher"], ["seicher", "seiher"], ["seihe", "seiher"], ["abtropfsieb", "kuechensieb"], ["abtropfsieb", "seicher"], ["abtropfsieb", "seihe"], ["kuechensieb", "seicher"], ["kuechensieb", "seihe"], ["seicher", "seihe"], ["anknuepfend", "nachfolgend"], ["nachfolgend", "nachkommend"], ["nachfolgend", "nachgelagert"], ["folgend", "nachfolgend"], ["anschliessend", "nachfolgend"], ["anknuepfend", "nachkommend"], ["anknuepfend", "nachgelagert"], ["anknuepfend", "folgend"], ["anknuepfend", "anschliessend"], ["nachgelagert", "nachkommend"], ["folgend", "nachkommend"], ["anschliessend", "nachkommend"], ["folgend", "nachgelagert"], ["anschliessend", "nachgelagert"], ["anschliessend", "folgend"], ["uv-lampe", "uv-leuchte"], ["ultraviolettleuchte", "uv-lampe"], ["ultraviolettlampe", "uv-lampe"], ["schwarzlichtlampe", "uv-lampe"], ["schwarzlichtleuchte", "uv-lampe"], ["ultraviolettleuchte", "uv-leuchte"], ["ultraviolettlampe", "uv-leuchte"], ["schwarzlichtlampe", "uv-leuchte"], ["schwarzlichtleuchte", "uv-leuchte"], ["ultraviolettlampe", "ultraviolettleuchte"], ["schwarzlichtlampe", "ultraviolettleuchte"], ["schwarzlichtleuchte", "ultraviolettleuchte"], ["schwarzlichtlampe", "ultraviolettlampe"], ["schwarzlichtleuchte", "ultraviolettlampe"], ["schwarzlichtlampe", "schwarzlichtleuchte"], ["anbringen", "platzieren"], ["anbringen", "stellen"], ["beweglich", "freigaengig"], ["beweglich", "verschiebbar"], ["bewegbar", "beweglich"], ["beweglich", "platzierbar"], ["freigaengig", "verschiebbar"], ["bewegbar", "freigaengig"], ["freigaengig", "platzierbar"], ["bewegbar", "verschiebbar"], ["platzierbar", "verschiebbar"], ["bewegbar", "platzierbar"], ["aufgeschlossen", "erreichbar"], ["ansprechbar", "aufgeschlossen"], ["erreichbar", "offen"], ["ansprechbar", "offen"], ["empfaenglich", "erreichbar"], ["ansprechbar", "empfaenglich"], ["mergen", "vereinigen"], ["vereinigen", "zusammenfuehren"], ["kombinieren", "vereinigen"], ["abgleichen", "vereinigen"], ["mergen", "zusammenfuehren"], ["kombinieren", "mergen"], ["abgleichen", "mergen"], ["kombinieren", "zusammenfuehren"], ["abgleichen", "zusammenfuehren"], ["abgleichen", "kombinieren"], ["austausch", "transfer"], ["synchronisation", "transfer"], ["austausch", "uebertragung"], ["austausch", "synchronisation"], ["synchronisation", "uebertragung"], ["bedeckt", "gespickt"], ["bedeckt", "prallvoll"], ["bedeckt", "voll"], ["bedeckt", "uebersaet"], ["bedeckt", "voller"], ["gespickt", "prallvoll"], ["gespickt", "voll"], ["gespickt", "uebersaet"], ["gespickt", "voller"], ["prallvoll", "voll"], ["prallvoll", "uebersaet"], ["prallvoll", "voller"], ["uebersaet", "voll"], ["voll", "voller"], ["uebersaet", "voller"], ["beobachten", "verzeichnen"], ["aufnehmen", "verzeichnen"], ["erfassen", "verzeichnen"], ["aufzeichnen", "verzeichnen"], ["skizzieren", "verzeichnen"], ["aufnehmen", "beobachten"], ["beobachten", "erfassen"], ["aufzeichnen", "beobachten"], ["beobachten", "skizzieren"], ["aufnehmen", "aufzeichnen"], ["aufnehmen", "skizzieren"], ["aufzeichnen", "erfassen"], ["erfassen", "skizzieren"], ["aufzeichnen", "skizzieren"], ["dokumentierung", "erfassung"], ["beobachtung", "erfassung"], ["dokumentation", "erfassung"], ["aufnahme", "erfassung"], ["aufzeichnung", "erfassung"], ["beobachtung", "dokumentierung"], ["dokumentation", "dokumentierung"], ["aufnahme", "dokumentierung"], ["aufzeichnung", "dokumentierung"], ["beobachtung", "dokumentation"], ["aufnahme", "beobachtung"], ["aufzeichnung", "beobachtung"], ["aufnahme", "dokumentation"], ["aufzeichnung", "dokumentation"], ["aufnahme", "aufzeichnung"], ["abschnitt", "stufe"], ["phase", "stufe"], ["schritt", "stufe"], ["abschnitt", "phase"], ["abschnitt", "schritt"], ["phase", "schritt"], ["einheit", "komponente"], ["komponente", "modul"], ["bauteil", "komponente"], ["bauelement", "komponente"], ["element", "komponente"], ["baugruppe", "komponente"], ["einheit", "modul"], ["bauteil", "einheit"], ["bauelement", "einheit"], ["einheit", "element"], ["baugruppe", "einheit"], ["bauteil", "modul"], ["bauelement", "modul"], ["element", "modul"], ["baugruppe", "modul"], ["bauelement", "bauteil"], ["bauteil", "element"], ["baugruppe", "bauteil"], ["bauelement", "element"], ["bauelement", "baugruppe"], ["baugruppe", "element"], ["daten", "statistik"], ["empirie", "statistik"], ["statistik", "zahlen"], ["erhebung", "statistik"], ["datenmaterial", "statistik"], ["daten", "empirie"], ["daten", "zahlen"], ["daten", "erhebung"], ["daten", "datenmaterial"], ["empirie", "zahlen"], ["empirie", "erhebung"], ["datenmaterial", "empirie"], ["erhebung", "zahlen"], ["datenmaterial", "zahlen"], ["datenmaterial", "erhebung"], ["acht", "achter"], ["achter", "seitenschlag"], ["acht", "seitenschlag"], ["leiter", "sprossenstiege"], ["sprossenleiter", "sprossenstiege"], ["fahrt", "sprossenstiege"], ["leiter", "sprossenleiter"], ["fahrt", "leiter"], ["fahrt", "sprossenleiter"], ["resistor", "widerstand"], ["klaeren", "nachsehen"], ["klaeren", "schaun"], ["klaeren", "nachschauen"], ["klaeren", "ueberpruefen"], ["nachsehen", "schaun"], ["nachsehen", "ueberpruefen"], ["nachschauen", "schaun"], ["schaun", "ueberpruefen"], ["nachschauen", "ueberpruefen"], ["eintrag", "element"], ["eintrag", "item"], ["element", "item"], ["amt", "rang"], ["amt", "stellung"], ["amt", "stelle"], ["amt", "dienstgrad"], ["amt", "charge"], ["posten", "rang"], ["rang", "stellung"], ["rang", "stelle"], ["dienstgrad", "rang"], ["charge", "rang"], ["posten", "stellung"], ["posten", "stelle"], ["dienstgrad", "posten"], ["charge", "posten"], ["stelle", "stellung"], ["dienstgrad", "stellung"], ["charge", "stellung"], ["dienstgrad", "stelle"], ["charge", "stelle"], ["charge", "dienstgrad"], ["bewertung", "priorisierung"], ["ordnung", "priorisierung"], ["bewertung", "ordnung"], ["lesen", "stehen"], ["beruecksichtigung", "betrachtung"], ["beachtung", "betrachtung"], ["betrachtung", "zuwendung"], ["betrachtung", "hinsicht"], ["betrachtung", "hinblick"], ["betrachtung", "fixation"], ["aufmerksamkeit", "betrachtung"], ["beachtung", "beruecksichtigung"], ["beruecksichtigung", "zuwendung"], ["beruecksichtigung", "hinsicht"], ["beruecksichtigung", "hinblick"], ["beruecksichtigung", "fixation"], ["aufmerksamkeit", "beruecksichtigung"], ["beachtung", "zuwendung"], ["beachtung", "hinsicht"], ["beachtung", "hinblick"], ["beachtung", "fixation"], ["aufmerksamkeit", "beachtung"], ["hinsicht", "zuwendung"], ["hinblick", "zuwendung"], ["fixation", "zuwendung"], ["aufmerksamkeit", "zuwendung"], ["hinblick", "hinsicht"], ["fixation", "hinsicht"], ["aufmerksamkeit", "hinsicht"], ["fixation", "hinblick"], ["aufmerksamkeit", "hinblick"], ["aufmerksamkeit", "fixation"], ["entitaet", "objekt"], ["entitaet", "symbol"], ["entitaet", "symbolfigur"], ["entitaet", "groesse"], ["objekt", "symbol"], ["objekt", "symbolfigur"], ["groesse", "objekt"], ["symbol", "symbolfigur"], ["groesse", "symbol"], ["groesse", "symbolfigur"], ["abgasturbolader", "turbo"], ["turbo", "turbolader"], ["abgasturbolader", "turbolader"], ["alternativ", "anders"], ["aussen", "lateral"], ["anboeschen", "aufstocken"], ["aufstocken", "erhoehen"], ["anheben", "aufstocken"], ["anboeschen", "erhoehen"], ["anboeschen", "anheben"], ["anheben", "erhoehen"], ["aufhoeren", "unterlassen"], ["beherrschen", "unterlassen"], ["lassen", "unterlassen"], ["absehen", "unterlassen"], ["bleibenlassen", "unterlassen"], ["unterlassen", "verkneifen"], ["fernhalten", "unterlassen"], ["aufhoeren", "beherrschen"], ["aufhoeren", "lassen"], ["absehen", "aufhoeren"], ["aufhoeren", "bleibenlassen"], ["aufhoeren", "verkneifen"], ["aufhoeren", "fernhalten"], ["beherrschen", "lassen"], ["absehen", "beherrschen"], ["beherrschen", "bleibenlassen"], ["beherrschen", "verkneifen"], ["beherrschen", "fernhalten"], ["absehen", "lassen"], ["bleibenlassen", "lassen"], ["lassen", "verkneifen"], ["fernhalten", "lassen"], ["absehen", "bleibenlassen"], ["absehen", "verkneifen"], ["absehen", "fernhalten"], ["bleibenlassen", "verkneifen"], ["bleibenlassen", "fernhalten"], ["fernhalten", "verkneifen"], ["anheben", "beginnen"], ["hintergrund", "kulisse"], ["folie", "kulisse"], ["folie", "hintergrund"], ["fenster", "scheibe"], ["luke", "scheibe"], ["fenster", "luke"], ["festhalten", "klammern"], ["eingriff", "hosenladen"], ["eingriff", "hosenstall"], ["eingriff", "schlitz"], ["eingriff", "hosenschlitz"], ["eingriff", "hosenlatz"], ["hosenladen", "hosenstall"], ["hosenladen", "schlitz"], ["hosenladen", "hosenschlitz"], ["hosenladen", "hosenlatz"], ["hosenstall", "schlitz"], ["hosenschlitz", "hosenstall"], ["hosenlatz", "hosenstall"], ["hosenschlitz", "schlitz"], ["hosenlatz", "schlitz"], ["hosenlatz", "hosenschlitz"], ["binnen", "waehrend"], ["binnen", "innerhalb"], ["binnen", "innert"], ["innerhalb", "waehrend"], ["innert", "waehrend"], ["innerhalb", "innert"], ["ausgebessert", "verbessert"], ["ausgebessert", "berichtigt"], ["ausgebessert", "korrigiert"], ["berichtigt", "verbessert"], ["korrigiert", "verbessert"], ["berichtigt", "korrigiert"], ["tippo", "vertipper"], ["tippo", "typo"], ["tippfehler", "tippo"], ["schreibfehler", "tippo"], ["tippo", "verschreiber"], ["typo", "vertipper"], ["tippfehler", "vertipper"], ["schreibfehler", "vertipper"], ["verschreiber", "vertipper"], ["tippfehler", "typo"], ["schreibfehler", "typo"], ["typo", "verschreiber"], ["schreibfehler", "tippfehler"], ["tippfehler", "verschreiber"], ["schreibfehler", "verschreiber"], ["fest", "verkrampft"], ["fest", "starr"], ["fest", "verspannt"], ["fest", "steif"], ["starr", "verkrampft"], ["verkrampft", "verspannt"], ["steif", "verkrampft"], ["starr", "verspannt"], ["starr", "steif"], ["steif", "verspannt"], ["eben", "nun"], ["halt", "nun"], ["eben", "halt"], ["duenn", "schuetter"], ["schuetter", "spaerlich"], ["licht", "schuetter"], ["ausgeduennt", "schuetter"], ["duenn", "spaerlich"], ["duenn", "licht"], ["ausgeduennt", "duenn"], ["licht", "spaerlich"], ["ausgeduennt", "spaerlich"], ["ausgeduennt", "licht"], ["aufknuepfen", "haengen"], ["aufhaengen", "aufknuepfen"], ["aufknuepfen", "erhaengen"], ["aufknuepfen", "henken"], ["aufhaengen", "haengen"], ["erhaengen", "haengen"], ["haengen", "henken"], ["aufhaengen", "erhaengen"], ["aufhaengen", "henken"], ["erhaengen", "henken"], ["ausserhalb", "draussen"], ["auswaertig", "draussen"], ["draussen", "extern"], ["aussen", "draussen"], ["ausserhalb", "auswaertig"], ["ausserhalb", "extern"], ["aussen", "ausserhalb"], ["auswaertig", "extern"], ["aussen", "auswaertig"], ["aussen", "extern"], ["ansammlung", "konzentration"], ["ansammlung", "batterie"], ["batterie", "konzentration"], ["streifen", "tangieren"], ["kommen", "streifen"], ["streifen", "touchieren"], ["kommen", "tangieren"], ["beruehren", "tangieren"], ["tangieren", "touchieren"], ["beruehren", "kommen"], ["kommen", "touchieren"], ["beruehren", "touchieren"], ["abv", "antiblockiersystem"], ["abs", "abv"], ["abv", "antiblockiervorrichtung"], ["abs", "antiblockiersystem"], ["antiblockiersystem", "antiblockiervorrichtung"], ["abs", "antiblockiervorrichtung"], ["getraut", "verheiratet"], ["verehelicht", "verheiratet"], ["vergeben", "verheiratet"], ["gebunden", "verheiratet"], ["verheiratet", "zusammen"], ["verheiratet", "vermaehlt"], ["getraut", "verehelicht"], ["getraut", "vergeben"], ["gebunden", "getraut"], ["getraut", "zusammen"], ["getraut", "vermaehlt"], ["verehelicht", "vergeben"], ["gebunden", "verehelicht"], ["verehelicht", "zusammen"], ["verehelicht", "vermaehlt"], ["gebunden", "vergeben"], ["vergeben", "zusammen"], ["vergeben", "vermaehlt"], ["gebunden", "zusammen"], ["gebunden", "vermaehlt"], ["vermaehlt", "zusammen"], ["pleuel", "treibstange"], ["pleuel", "schubstange"], ["pleuel", "pleuelstange"], ["schubstange", "treibstange"], ["pleuelstange", "treibstange"], ["pleuelstange", "schubstange"], ["warnblinkleuchte", "warnleuchte"], ["warnlampe", "warnleuchte"], ["warnblinkleuchte", "warnlampe"], ["dimension", "facette"], ["aspekt", "dimension"], ["dimension", "faktor"], ["dimension", "richtung"], ["aspekt", "facette"], ["facette", "faktor"], ["facette", "richtung"], ["aspekt", "faktor"], ["aspekt", "richtung"], ["faktor", "richtung"], ["abbau", "foerderung"], ["entnahme", "foerderung"], ["foerderung", "gewinnung"], ["abbau", "entnahme"], ["abbau", "gewinnung"], ["entnahme", "gewinnung"], ["angehen", "beruehren"], ["beruehren", "betreffen"], ["angehen", "tangieren"], ["angehen", "betreffen"], ["betreffen", "tangieren"], ["hochziehen", "vergroessern"], ["heranholen", "vergroessern"], ["vergroessern", "zoomen"], ["heranholen", "hochziehen"], ["hochziehen", "zoomen"], ["heranholen", "zoomen"], ["ausfuehrung", "modell"], ["ausfuehrung", "variante"], ["ausfuehrung", "version"], ["ausfuehrung", "ausgabe"], ["ausfuehrung", "revision"], ["modell", "variante"], ["modell", "version"], ["ausgabe", "modell"], ["modell", "revision"], ["variante", "version"], ["ausgabe", "variante"], ["revision", "variante"], ["revision", "version"], ["ausgabe", "revision"], ["abstoppen", "bremsen"], ["abbremsen", "abstoppen"], ["abstoppen", "verlangsamen"], ["abbremsen", "bremsen"], ["bremsen", "verlangsamen"], ["abbremsen", "verlangsamen"], ["direkt", "unveraendert"], ["spiegelbildlich", "unveraendert"], ["eins-zu-eins", "unveraendert"], ["direkt", "spiegelbildlich"], ["direkt", "eins-zu-eins"], ["eins-zu-eins", "spiegelbildlich"], ["pointer", "referenz"], ["alias", "referenz"], ["referenz", "zeiger"], ["alias", "pointer"], ["pointer", "zeiger"], ["alias", "zeiger"], ["entsprechen", "korrespondieren"], ["entsprechen", "gleichkommen"], ["entsprechen", "uebereinstimmen"], ["gleichkommen", "korrespondieren"], ["korrespondieren", "uebereinstimmen"], ["gleichkommen", "uebereinstimmen"], ["auftauchen", "auftreten"], ["auftreten", "vorkommen"], ["auftauchen", "vorkommen"], ["anfangsbuchstabe", "initial"], ["ausgewischt", "gestrichen"], ["ausgeloescht", "ausgewischt"], ["ausgewischt", "geloescht"], ["ausgewischt", "beseitigt"], ["ausgewischt", "weggelassen"], ["ausgeloescht", "gestrichen"], ["geloescht", "gestrichen"], ["beseitigt", "gestrichen"], ["gestrichen", "weggelassen"], ["ausgeloescht", "geloescht"], ["ausgeloescht", "beseitigt"], ["ausgeloescht", "weggelassen"], ["beseitigt", "geloescht"], ["geloescht", "weggelassen"], ["beseitigt", "weggelassen"], ["diverse", "vielfaeltige"], ["verschiedenartige", "vielfaeltige"], ["unterschiedliche", "vielfaeltige"], ["verschiedene", "vielfaeltige"], ["verschiedenerlei", "vielfaeltige"], ["diverse", "verschiedenartige"], ["diverse", "verschiedenerlei"], ["unterschiedliche", "verschiedenartige"], ["verschiedenartige", "verschiedene"], ["verschiedenartige", "verschiedenerlei"], ["unterschiedliche", "verschiedenerlei"], ["verschiedene", "verschiedenerlei"], ["hervorragen", "hervorstechen"], ["einzigartig", "hervorragen"], ["einmalig", "hervorragen"], ["hervorragen", "jahrhundert"], ["ausnahme", "hervorragen"], ["beispiellos", "hervorragen"], ["einzigartig", "hervorstechen"], ["einmalig", "hervorstechen"], ["hervorstechen", "jahrhundert"], ["ausnahme", "hervorstechen"], ["beispiellos", "hervorstechen"], ["einmalig", "einzigartig"], ["einzigartig", "jahrhundert"], ["ausnahme", "einzigartig"], ["beispiellos", "einzigartig"], ["einmalig", "jahrhundert"], ["ausnahme", "einmalig"], ["beispiellos", "einmalig"], ["ausnahme", "jahrhundert"], ["beispiellos", "jahrhundert"], ["ausnahme", "beispiellos"], ["beseitigung", "remedur"], ["behebung", "beseitigung"], ["abhilfe", "beseitigung"], ["behebung", "remedur"], ["abhilfe", "remedur"], ["abhilfe", "behebung"], ["mehrfachverteiler", "steckerleiste"], ["mehrfachsteckdose", "steckerleiste"], ["steckdosenverteiler", "steckerleiste"], ["mehrfachstecker", "steckerleiste"], ["steckdosenleiste", "steckerleiste"], ["mehrfachsteckdose", "mehrfachverteiler"], ["mehrfachverteiler", "steckdosenverteiler"], ["mehrfachstecker", "mehrfachverteiler"], ["mehrfachverteiler", "steckdosenleiste"], ["mehrfachsteckdose", "steckdosenverteiler"], ["mehrfachsteckdose", "mehrfachstecker"], ["mehrfachsteckdose", "steckdosenleiste"], ["mehrfachstecker", "steckdosenverteiler"], ["steckdosenleiste", "steckdosenverteiler"], ["mehrfachstecker", "steckdosenleiste"], ["abarbeiten", "verarbeiten"], ["ausfuehren", "verarbeiten"], ["durchfuehren", "verarbeiten"], ["abarbeiten", "ausfuehren"], ["abarbeiten", "durchfuehren"], ["handschalthebel", "schalthebel"], ["gangwahlhebel", "handschalthebel"], ["handschalthebel", "schaltknauf"], ["ganghebel", "handschalthebel"], ["handschalthebel", "waehlhebel"], ["handschalthebel", "schaltknueppel"], ["gangwahlschalter", "handschalthebel"], ["gangwahlhebel", "schalthebel"], ["schalthebel", "schaltknauf"], ["ganghebel", "schalthebel"], ["schalthebel", "waehlhebel"], ["schalthebel", "schaltknueppel"], ["gangwahlschalter", "schalthebel"], ["gangwahlhebel", "schaltknauf"], ["ganghebel", "gangwahlhebel"], ["gangwahlhebel", "waehlhebel"], ["gangwahlhebel", "schaltknueppel"], ["gangwahlhebel", "gangwahlschalter"], ["ganghebel", "schaltknauf"], ["schaltknauf", "waehlhebel"], ["schaltknauf", "schaltknueppel"], ["gangwahlschalter", "schaltknauf"], ["ganghebel", "waehlhebel"], ["ganghebel", "schaltknueppel"], ["ganghebel", "gangwahlschalter"], ["schaltknueppel", "waehlhebel"], ["gangwahlschalter", "waehlhebel"], ["gangwahlschalter", "schaltknueppel"], ["folgend", "nachstehend"], ["folgend", "spaeter"], ["nachstehend", "spaeter"], ["nachfolgend", "nachstehend"], ["nachfolgend", "spaeter"], ["angelegentlich", "aufgrund"], ["angelegentlich", "gelegentlich"], ["angelegentlich", "anlaesslich"], ["aufgrund", "gelegentlich"], ["anlaesslich", "aufgrund"], ["anlaesslich", "gelegentlich"], ["asset", "sonderausstattung"], ["sonderausstattung", "zusatzposten"], ["extra", "sonderausstattung"], ["asset", "zusatzposten"], ["asset", "extra"], ["extra", "zusatzposten"], ["nackt", "ohne"], ["blank", "ohne"], ["frei", "ohne"], ["bloss", "ohne"], ["frei", "nackt"], ["bar", "nackt"], ["blank", "frei"], ["bar", "blank"], ["bar", "frei"], ["bloss", "frei"], ["bar", "bloss"], ["dieser", "jener"], ["jener", "solcher"], ["jener", "welcher"], ["der", "jener"], ["dieser", "solcher"], ["dieser", "welcher"], ["der", "dieser"], ["solcher", "welcher"], ["der", "solcher"], ["der", "welcher"], ["ballast", "gewicht"], ["henkel", "knauf"], ["handgriff", "henkel"], ["henkel", "schaft"], ["heft", "henkel"], ["griff", "henkel"], ["griffstueck", "henkel"], ["anfasser", "henkel"], ["handgriff", "knauf"], ["knauf", "schaft"], ["heft", "knauf"], ["griff", "knauf"], ["griffstueck", "knauf"], ["anfasser", "knauf"], ["handgriff", "schaft"], ["handgriff", "heft"], ["griffstueck", "handgriff"], ["anfasser", "handgriff"], ["heft", "schaft"], ["griff", "schaft"], ["griffstueck", "schaft"], ["anfasser", "schaft"], ["griff", "heft"], ["griffstueck", "heft"], ["anfasser", "heft"], ["griff", "griffstueck"], ["anfasser", "griff"], ["anfasser", "griffstueck"], ["handlungsprodukt", "machwerk"], ["arbeit", "machwerk"], ["machwerk", "opus"], ["kreation", "machwerk"], ["machwerk", "schoepfung"], ["machwerk", "werk"], ["arbeit", "handlungsprodukt"], ["handlungsprodukt", "opus"], ["handlungsprodukt", "kreation"], ["handlungsprodukt", "schoepfung"], ["handlungsprodukt", "werk"], ["arbeit", "opus"], ["arbeit", "kreation"], ["arbeit", "schoepfung"], ["arbeit", "werk"], ["kreation", "opus"], ["opus", "schoepfung"], ["opus", "werk"], ["kreation", "schoepfung"], ["kreation", "werk"], ["schoepfung", "werk"], ["vorbild", "vorlage"], ["modell", "vorbild"], ["schema", "vorbild"], ["modell", "vorlage"], ["schema", "vorlage"], ["modell", "schema"], ["potenziometer", "poti"], ["potentiometer", "poti"], ["poti", "trimmer"], ["potentiometer", "potenziometer"], ["potenziometer", "trimmer"], ["potentiometer", "trimmer"], ["ausfuehrung", "execution"], ["ausfuehrung", "verarbeitung"], ["abarbeitung", "ausfuehrung"], ["ablauf", "ausfuehrung"], ["execution", "verarbeitung"], ["abarbeitung", "execution"], ["ablauf", "execution"], ["abarbeitung", "verarbeitung"], ["ablauf", "verarbeitung"], ["abarbeitung", "ablauf"], ["erscheinen", "hervortreten"], ["hervortreten", "zeigen"], ["erscheinen", "zeigen"], ["grossenteils", "grossteils"], ["groesstenteils", "grossteils"], ["grossteils", "ueberwiegend"], ["grossteils", "weitgehend"], ["grossteils", "gutenteils"], ["groesstenteils", "grossenteils"], ["grossenteils", "ueberwiegend"], ["grossenteils", "weitgehend"], ["grossenteils", "gutenteils"], ["groesstenteils", "weitgehend"], ["groesstenteils", "gutenteils"], ["ueberwiegend", "weitgehend"], ["gutenteils", "ueberwiegend"], ["gutenteils", "weitgehend"], ["anspruch", "bedarf"], ["anspruch", "erfordernis"], ["anspruch", "forderung"], ["anforderung", "anspruch"], ["anspruch", "funktionalitaet"], ["bedarf", "erfordernis"], ["bedarf", "forderung"], ["anforderung", "bedarf"], ["bedarf", "funktionalitaet"], ["erfordernis", "forderung"], ["erfordernis", "funktionalitaet"], ["anforderung", "forderung"], ["forderung", "funktionalitaet"], ["anforderung", "funktionalitaet"], ["apparatur", "mechanismus"], ["apparatur", "einrichtung"], ["mechanismus", "vorrichtung"], ["einrichtung", "vorrichtung"], ["einrichtung", "mechanismus"], ["dafuer", "wiederum"], ["umgekehrt", "wiederum"], ["entsprechend", "wiederum"], ["hingegen", "wiederum"], ["dagegen", "wiederum"], ["andersrum", "wiederum"], ["andersherum", "wiederum"], ["dafuer", "umgekehrt"], ["dafuer", "entsprechend"], ["dafuer", "hingegen"], ["dafuer", "dagegen"], ["andersrum", "dafuer"], ["andersherum", "dafuer"], ["entsprechend", "umgekehrt"], ["hingegen", "umgekehrt"], ["dagegen", "umgekehrt"], ["andersrum", "umgekehrt"], ["andersherum", "umgekehrt"], ["entsprechend", "hingegen"], ["dagegen", "entsprechend"], ["andersrum", "entsprechend"], ["andersherum", "entsprechend"], ["dagegen", "hingegen"], ["andersrum", "hingegen"], ["andersherum", "hingegen"], ["andersrum", "dagegen"], ["andersherum", "dagegen"], ["andersherum", "andersrum"], ["geben", "zuteilen"], ["ermoeglichen", "zuteilen"], ["ermoeglichen", "geben"], ["oder", "sonst"], ["beziehungsweise", "sonst"], ["andernfalls", "oder"], ["andernfalls", "beziehungsweise"], ["beziehungsweise", "oder"], ["abarbeitung", "bearbeitung"], ["bearbeitung", "verarbeitung"], ["leicht", "trivial"], ["einfach", "trivial"], ["simpel", "trivial"], ["kann", "mag"], ["kann", "moeglich"], ["kann", "moeglicherweise"], ["mag", "moeglich"], ["mag", "moeglicherweise"], ["moeglich", "moeglicherweise"], ["laut", "ohrenfaellig"], ["laut", "vernehmlich"], ["laut", "unueberhoerbar"], ["hoerbar", "laut"], ["ohrenfaellig", "vernehmlich"], ["ohrenfaellig", "unueberhoerbar"], ["hoerbar", "ohrenfaellig"], ["unueberhoerbar", "vernehmlich"], ["hoerbar", "vernehmlich"], ["hoerbar", "unueberhoerbar"], ["produktion", "verarbeitung"], ["bearbeitung", "produktion"], ["was", "welches"], ["obendrein", "ueberdies"], ["ueberdies", "und"], ["auch", "ueberdies"], ["fuerderhin", "ueberdies"], ["ueberdies", "zusaetzlich"], ["ausserdem", "ueberdies"], ["obendrein", "und"], ["auch", "obendrein"], ["fuerderhin", "obendrein"], ["obendrein", "zusaetzlich"], ["ausserdem", "obendrein"], ["auch", "und"], ["fuerderhin", "und"], ["und", "zusaetzlich"], ["ausserdem", "und"], ["auch", "fuerderhin"], ["auch", "zusaetzlich"], ["auch", "ausserdem"], ["fuerderhin", "zusaetzlich"], ["ausserdem", "fuerderhin"], ["ausserdem", "zusaetzlich"], ["leistung", "performanz"], ["geschwindigkeit", "leistung"], ["leistungsfaehigkeit", "performanz"], ["geschwindigkeit", "performanz"], ["geschwindigkeit", "leistungsfaehigkeit"], ["durch", "seitens"], ["seitens", "vonseiten"], ["seitens", "von"], ["durch", "vonseiten"], ["durch", "von"], ["von", "vonseiten"], ["zusammenbauen", "zusammenschreiben"], ["bilden", "zusammenschreiben"], ["zusammenschreiben", "zusammentragen"], ["zusammenfuegen", "zusammenschreiben"], ["bilden", "zusammenbauen"], ["zusammenbauen", "zusammentragen"], ["zusammenbauen", "zusammenfuegen"], ["bilden", "zusammentragen"], ["bilden", "zusammenfuegen"], ["zusammenfuegen", "zusammentragen"], ["ausdruck", "ausgabe"], ["bei", "fuer"], ["fuehrer", "handbuch"], ["anweisung", "handbuch"], ["fuehrer", "leitfaden"], ["anweisung", "leitfaden"], ["anleitung", "fuehrer"], ["anweisung", "fuehrer"], ["anleitung", "anweisung"], ["hintanhalten", "verzoegern"], ["verhindern", "verzoegern"], ["hintansetzen", "verzoegern"], ["hintanhalten", "verhindern"], ["hintanhalten", "hintansetzen"], ["hintansetzen", "verhindern"], ["chauffieren", "lenken"], ["chauffieren", "steuern"], ["chauffieren", "kutschieren"], ["chauffieren", "fahren"], ["kutschieren", "lenken"], ["fahren", "lenken"], ["kutschieren", "steuern"], ["fahren", "steuern"], ["fahren", "kutschieren"], ["aufrecht", "schnurgerade"], ["aufrecht", "gerade"], ["aufrecht", "pfeilgerade"], ["aufrecht", "kerzengerade"], ["gerade", "schnurgerade"], ["pfeilgerade", "schnurgerade"], ["kerzengerade", "schnurgerade"], ["gerade", "pfeilgerade"], ["gerade", "kerzengerade"], ["kerzengerade", "pfeilgerade"], ["brauchen", "erfordern"], ["braucht", "erfordern"], ["bedarf", "erfordern"], ["beduerfen", "erfordern"], ["erfordern", "nottun"], ["brauchen", "braucht"], ["bedarf", "brauchen"], ["beduerfen", "brauchen"], ["brauchen", "nottun"], ["bedarf", "braucht"], ["beduerfen", "braucht"], ["braucht", "nottun"], ["bedarf", "beduerfen"], ["bedarf", "nottun"], ["beduerfen", "nottun"], ["kurzum", "zusammengefasst"], ["kurz", "zusammengefasst"], ["zusammengefasst", "zusammengenommen"], ["kurz", "kurzum"], ["kurzum", "zusammengenommen"], ["kurz", "zusammengenommen"], ["genosse", "linker"], ["genosse", "sozialist"], ["genosse", "roter"], ["genosse", "kommunist"], ["linker", "sozialist"], ["linker", "roter"], ["kommunist", "linker"], ["roter", "sozialist"], ["kommunist", "sozialist"], ["kommunist", "roter"], ["position", "status"], ["funktionsweise", "mechanismus"], ["funktionsweise", "system"], ["funktionsweise", "zusammenspiel"], ["mechanismus", "system"], ["mechanismus", "zusammenspiel"], ["system", "zusammenspiel"], ["inertia", "masse"], ["gewicht", "inertia"], ["gewicht", "masse"], ["leiter", "phase"], ["phase", "winkel"], ["kanal", "schifffahrtsstrasse"], ["belt", "kanal"], ["kanal", "meeresstrasse"], ["kanal", "sund"], ["kanal", "meerenge"], ["kanal", "strasse"], ["belt", "schifffahrtsstrasse"], ["meeresstrasse", "schifffahrtsstrasse"], ["schifffahrtsstrasse", "sund"], ["meerenge", "schifffahrtsstrasse"], ["schifffahrtsstrasse", "strasse"], ["belt", "meeresstrasse"], ["belt", "sund"], ["belt", "meerenge"], ["belt", "strasse"], ["meeresstrasse", "sund"], ["meerenge", "meeresstrasse"], ["meeresstrasse", "strasse"], ["meerenge", "sund"], ["strasse", "sund"], ["meerenge", "strasse"], ["muessen", "sollen"], ["freiheitskampf", "untergrundkampf"], ["freiheitskampf", "partisanenkrieg"], ["freiheitskampf", "widerstand"], ["freiheitskampf", "resistance"], ["partisanenkrieg", "untergrundkampf"], ["untergrundkampf", "widerstand"], ["resistance", "untergrundkampf"], ["partisanenkrieg", "widerstand"], ["partisanenkrieg", "resistance"], ["resistance", "widerstand"], ["bolzen", "nagel"], ["bolzen", "stift"], ["bolzen", "drahtstift"], ["nagel", "stift"], ["drahtstift", "nagel"], ["drahtstift", "stift"], ["erforderlichenfalls", "noetigenfalls"], ["bedarfsweise", "noetigenfalls"], ["gegebenenfalls", "noetigenfalls"], ["bedarfsweise", "erforderlichenfalls"], ["erforderlichenfalls", "gegebenenfalls"], ["bedarfsweise", "gegebenenfalls"], ["repetieren", "umlaufen"], ["rollieren", "umlaufen"], ["iterieren", "umlaufen"], ["umlaufen", "wiederholen"], ["durchlaufen", "umlaufen"], ["repetieren", "rollieren"], ["iterieren", "repetieren"], ["repetieren", "wiederholen"], ["durchlaufen", "repetieren"], ["iterieren", "rollieren"], ["rollieren", "wiederholen"], ["durchlaufen", "rollieren"], ["iterieren", "wiederholen"], ["durchlaufen", "iterieren"], ["durchlaufen", "wiederholen"], ["abseite", "rueckseite"], ["abseite", "links"], ["links", "rueckseite"], ["ausschliessen", "disqualifizieren"], ["ausschliessen", "sperren"], ["ausschliessen", "verweisen"], ["disqualifizieren", "sperren"], ["disqualifizieren", "verweisen"], ["sperren", "verweisen"], ["anpassen", "verbiegen"], ["berichtigen", "richtigstellen"], ["berichtigen", "klarstellen"], ["berichtigen", "rektifizieren"], ["berichtigen", "korrigieren"], ["berichtigen", "klaeren"], ["klarstellen", "richtigstellen"], ["rektifizieren", "richtigstellen"], ["korrigieren", "richtigstellen"], ["klaeren", "richtigstellen"], ["klarstellen", "rektifizieren"], ["klarstellen", "korrigieren"], ["klaeren", "klarstellen"], ["korrigieren", "rektifizieren"], ["klaeren", "rektifizieren"], ["klaeren", "korrigieren"], ["ausmass", "staerke"], ["grad", "staerke"], ["intensitaet", "staerke"], ["ausmass", "grad"], ["ausmass", "intensitaet"], ["grad", "intensitaet"], ["kurzen", "kurzschluss"], ["kurzen", "kurzer"], ["kurzer", "kurzschluss"], ["gedankenlos", "seelenlos"], ["gedankenlos", "unwillkuerlich"], ["gedankenlos", "unbewusst"], ["gedankenlos", "routinemaessig"], ["gedankenlos", "schematisch"], ["gedankenlos", "mechanisch"], ["seelenlos", "unwillkuerlich"], ["seelenlos", "unbewusst"], ["routinemaessig", "seelenlos"], ["schematisch", "seelenlos"], ["mechanisch", "seelenlos"], ["unbewusst", "unwillkuerlich"], ["routinemaessig", "unwillkuerlich"], ["schematisch", "unwillkuerlich"], ["mechanisch", "unwillkuerlich"], ["routinemaessig", "unbewusst"], ["schematisch", "unbewusst"], ["mechanisch", "unbewusst"], ["routinemaessig", "schematisch"], ["mechanisch", "routinemaessig"], ["mechanisch", "schematisch"], ["erkennen", "ersehen"], ["ablesen", "erkennen"], ["ablesen", "ersehen"], ["fuchteln", "herumfuchteln"], ["fahren", "herumfuchteln"], ["gestikulieren", "herumfuchteln"], ["herumfuchteln", "schwenken"], ["herumfuchteln", "rumfuchteln"], ["fahren", "fuchteln"], ["fuchteln", "gestikulieren"], ["fuchteln", "schwenken"], ["fuchteln", "rumfuchteln"], ["fahren", "gestikulieren"], ["fahren", "schwenken"], ["fahren", "rumfuchteln"], ["gestikulieren", "schwenken"], ["gestikulieren", "rumfuchteln"], ["rumfuchteln", "schwenken"], ["abklemmen", "durchschneiden"], ["durchschneiden", "kappen"], ["abknipsen", "durchschneiden"], ["durchschneiden", "durchtrennen"], ["abzwicken", "durchschneiden"], ["abklemmen", "kappen"], ["abklemmen", "abknipsen"], ["abklemmen", "durchtrennen"], ["abklemmen", "abzwicken"], ["abknipsen", "kappen"], ["durchtrennen", "kappen"], ["abzwicken", "kappen"], ["abknipsen", "durchtrennen"], ["abknipsen", "abzwicken"], ["abzwicken", "durchtrennen"], ["lateral", "schlaefenwaerts"], ["lateral", "temporal"], ["schlaefenwaerts", "seitlich"], ["seitlich", "temporal"], ["schlaefenwaerts", "temporal"], ["distanzhuelse", "distanzroehrchen"], ["distanzring", "distanzroehrchen"], ["distanzroehrchen", "distanzrohr"], ["distanzhuelse", "distanzring"], ["distanzhuelse", "distanzrohr"], ["distanzring", "distanzrohr"], ["erhoben", "erhoeht"], ["angehoben", "erhoben"], ["angehoben", "erhoeht"], ["chassis", "fahrgestell"], ["fahrgestell", "rahmen"], ["chassis", "rahmen"], ["einlage", "einsatz"], ["einlage", "einlagekapital"], ["einlage", "kapitalanlage"], ["einlagekapital", "einsatz"], ["einsatz", "kapitalanlage"], ["einlagekapital", "kapitalanlage"], ["insbesondere", "vornehmlich"], ["besonders", "vornehmlich"], ["beziehen", "einziehen"], ["inhaltsuebersicht", "inhaltsverzeichnis"], ["eingabeaufforderung", "terminal"], ["eingabeaufforderung", "textkonsole"], ["eingabeaufforderung", "eingabekonsole"], ["eingabeaufforderung", "kommandozeile"], ["eingabeaufforderung", "konsole"], ["befehlszeile", "eingabeaufforderung"], ["terminal", "textkonsole"], ["eingabekonsole", "terminal"], ["kommandozeile", "terminal"], ["konsole", "terminal"], ["befehlszeile", "terminal"], ["eingabekonsole", "textkonsole"], ["kommandozeile", "textkonsole"], ["konsole", "textkonsole"], ["befehlszeile", "textkonsole"], ["eingabekonsole", "kommandozeile"], ["eingabekonsole", "konsole"], ["befehlszeile", "eingabekonsole"], ["kommandozeile", "konsole"], ["befehlszeile", "kommandozeile"], ["befehlszeile", "konsole"], ["abblendlicht", "fahrlicht"], ["ansicht", "durchsicht"], ["durchschau", "durchsicht"], ["ansicht", "durchschau"], ["motorsteuergeraet", "motorsteuerung"], ["fahrfusshebel", "strompedal"], ["fahrfusshebel", "fahrpedal"], ["fahrfusshebel", "gaspedal"], ["fahrpedal", "strompedal"], ["gaspedal", "strompedal"], ["fahrpedal", "gaspedal"], ["kennzeichnung", "markierung"], ["beschilderung", "kennzeichnung"], ["ausschilderung", "kennzeichnung"], ["beschilderung", "markierung"], ["ausschilderung", "markierung"], ["ausschilderung", "beschilderung"], ["belaestigung", "nachstellung"], ["nachstellen", "nachstellung"], ["nachstellung", "stalking"], ["belaestigung", "nachstellen"], ["belaestigung", "stalking"], ["nachstellen", "stalking"], ["fluessig", "zerflossen"], ["aufgetaut", "fluessig"], ["fluessig", "geschmolzen"], ["aufgetaut", "zerflossen"], ["geschmolzen", "zerflossen"], ["liquid", "zerflossen"], ["aufgetaut", "geschmolzen"], ["aufgetaut", "liquid"], ["geschmolzen", "liquid"], ["umprogrammieren", "verstellen"], ["umprogrammieren", "umstellen"], ["umkonfigurieren", "umprogrammieren"], ["umkonfigurieren", "verstellen"], ["umkonfigurieren", "umstellen"], ["mitnehmen", "nutzen"], ["ausueben", "nutzen"], ["ergreifen", "nutzen"], ["nutzen", "zuschlagen"], ["nutzen", "wahrnehmen"], ["nutzen", "zugreifen"], ["ausueben", "mitnehmen"], ["ergreifen", "mitnehmen"], ["mitnehmen", "zuschlagen"], ["mitnehmen", "wahrnehmen"], ["mitnehmen", "zugreifen"], ["ausueben", "ergreifen"], ["ausueben", "zuschlagen"], ["ausueben", "wahrnehmen"], ["ausueben", "zugreifen"], ["ergreifen", "zuschlagen"], ["ergreifen", "wahrnehmen"], ["ergreifen", "zugreifen"], ["wahrnehmen", "zuschlagen"], ["zugreifen", "zuschlagen"], ["wahrnehmen", "zugreifen"], ["abteilung", "bereich"], ["bereich", "sektion"], ["bereich", "departement"], ["abteilung", "departement"], ["departement", "sektion"], ["handling", "umgang"], ["handhabung", "umgang"], ["bedienung", "umgang"], ["handhabung", "handling"], ["bedienung", "handling"], ["bedienung", "handhabung"], ["geschwindigkeitsregelanlage", "tempostat"], ["geschwindigkeitsregelanlage", "tempomat"], ["tempomat", "tempostat"], ["fuehrungscrew", "fuehrungsteam"], ["fuehrungscrew", "spitze"], ["fuehrungscrew", "fuehrungsmannschaft"], ["fuehrungscrew", "fuehrungsriege"], ["fuehrung", "fuehrungscrew"], ["fuehrungscrew", "leitung"], ["fuehrungsteam", "spitze"], ["fuehrungsmannschaft", "fuehrungsteam"], ["fuehrungsriege", "fuehrungsteam"], ["fuehrung", "fuehrungsteam"], ["fuehrungsteam", "leitung"], ["fuehrungsmannschaft", "spitze"], ["fuehrungsriege", "spitze"], ["leitung", "spitze"], ["fuehrungsmannschaft", "fuehrungsriege"], ["fuehrung", "fuehrungsmannschaft"], ["fuehrungsmannschaft", "leitung"], ["fuehrung", "fuehrungsriege"], ["fuehrungsriege", "leitung"], ["gross", "makro"], ["makro", "weit"], ["jeder", "jedermann"], ["alle", "jedermann"], ["alle", "jeder"], ["brechen", "rauschen"], ["branden", "brechen"], ["branden", "rauschen"], ["bestimmen", "vorschreiben"], ["festlegen", "vorschreiben"], ["befehlen", "vorschreiben"], ["verfuegen", "vorschreiben"], ["reglementieren", "vorschreiben"], ["befehlen", "bestimmen"], ["bestimmen", "verfuegen"], ["bestimmen", "reglementieren"], ["befehlen", "festlegen"], ["festlegen", "verfuegen"], ["festlegen", "reglementieren"], ["befehlen", "verfuegen"], ["befehlen", "reglementieren"], ["reglementieren", "verfuegen"], ["anstecken", "uebertragen"], ["anstecken", "infizieren"], ["infizieren", "uebertragen"], ["portionsweise", "stueckweise"], ["ratenweise", "stueckweise"], ["schrittweise", "stueckweise"], ["etappenweise", "stueckweise"], ["stueckweise", "stufenweise"], ["abschnittweise", "stueckweise"], ["portionsweise", "ratenweise"], ["portionsweise", "schrittweise"], ["etappenweise", "portionsweise"], ["portionsweise", "stufenweise"], ["abschnittweise", "portionsweise"], ["ratenweise", "schrittweise"], ["etappenweise", "ratenweise"], ["ratenweise", "stufenweise"], ["abschnittweise", "ratenweise"], ["etappenweise", "schrittweise"], ["abschnittweise", "schrittweise"], ["etappenweise", "stufenweise"], ["abschnittweise", "etappenweise"], ["abschnittweise", "stufenweise"], ["effizienz", "leistungsfaehigkeit"], ["effizienz", "wirkungsgrad"], ["effizienz", "wirksamkeit"], ["effizienz", "energieeffizienz"], ["effizienz", "eta"], ["energieeffizienz", "leistungsfaehigkeit"], ["eta", "leistungsfaehigkeit"], ["energieeffizienz", "wirkungsgrad"], ["eta", "wirkungsgrad"], ["energieeffizienz", "wirksamkeit"], ["eta", "wirksamkeit"], ["energieeffizienz", "eta"], ["antezedens", "grund"], ["antezedens", "voraussetzung"], ["antezedens", "antezedenz"], ["antezedens", "ursache"], ["grund", "voraussetzung"], ["antezedenz", "grund"], ["antezedenz", "voraussetzung"], ["ursache", "voraussetzung"], ["antezedenz", "ursache"], ["nullen", "resetten"], ["resetten", "ruecksetzen"], ["resetten", "zuruecksetzen"], ["nullen", "ruecksetzen"], ["nullen", "zuruecksetzen"], ["ruecksetzen", "zuruecksetzen"], ["eindringen", "einfallen"], ["einfallen", "einstroemen"], ["einfallen", "invadieren"], ["einfallen", "einmarschieren"], ["eindringen", "einstroemen"], ["eindringen", "invadieren"], ["eindringen", "einmarschieren"], ["einstroemen", "invadieren"], ["einmarschieren", "einstroemen"], ["einmarschieren", "invadieren"], ["elevation", "hoehe"], ["elevation", "hoehenwinkel"], ["altitude", "elevation"], ["hoehe", "hoehenwinkel"], ["altitude", "hoehe"], ["altitude", "hoehenwinkel"], ["ausgleichsgetriebe", "differenzial"], ["ausgleichsgetriebe", "differentialgetriebe"], ["ausgleichsgetriebe", "differential"], ["ausgleichsgetriebe", "differenzialgetriebe"], ["differentialgetriebe", "differenzial"], ["differenzial", "differenzialgetriebe"], ["differential", "differentialgetriebe"], ["differentialgetriebe", "differenzialgetriebe"], ["differential", "differenzialgetriebe"], ["hineinschieben", "stecken"], ["einfuehren", "hineinschieben"], ["einschieben", "hineinschieben"], ["hineinschieben", "zusammenfuehren"], ["hineinschieben", "introduzieren"], ["hineinschieben", "schieben"], ["einfuehren", "stecken"], ["einschieben", "stecken"], ["stecken", "zusammenfuehren"], ["introduzieren", "stecken"], ["schieben", "stecken"], ["einfuehren", "einschieben"], ["einfuehren", "zusammenfuehren"], ["einfuehren", "introduzieren"], ["einfuehren", "schieben"], ["einschieben", "zusammenfuehren"], ["einschieben", "introduzieren"], ["einschieben", "schieben"], ["introduzieren", "zusammenfuehren"], ["schieben", "zusammenfuehren"], ["introduzieren", "schieben"], ["allradfahrzeug", "allradler"], ["allrad", "allradler"], ["allrad", "allradfahrzeug"], ["abgestimmt", "zugeschnitten"], ["optimiert", "zugeschnitten"], ["abgestimmt", "optimiert"], ["abgestimmt", "angepasst"], ["angepasst", "optimiert"], ["versperren", "verstellen"], ["blockieren", "verstellen"], ["verstellen", "zustellen"], ["versperren", "zustellen"], ["blockieren", "zustellen"], ["aufgestellt", "beleuchtet"], ["aufgestellt", "aufgezeigt"], ["aufgestellt", "zusammengestellt"], ["aufgestellt", "extrahiert"], ["aufgeschluesselt", "aufgestellt"], ["aufgestellt", "erhellt"], ["aufgestellt", "herausgestellt"], ["aufgezeigt", "beleuchtet"], ["beleuchtet", "zusammengestellt"], ["beleuchtet", "extrahiert"], ["aufgeschluesselt", "beleuchtet"], ["beleuchtet", "erhellt"], ["beleuchtet", "herausgestellt"], ["aufgezeigt", "zusammengestellt"], ["aufgezeigt", "extrahiert"], ["aufgeschluesselt", "aufgezeigt"], ["aufgezeigt", "erhellt"], ["aufgezeigt", "herausgestellt"], ["extrahiert", "zusammengestellt"], ["aufgeschluesselt", "zusammengestellt"], ["erhellt", "zusammengestellt"], ["herausgestellt", "zusammengestellt"], ["aufgeschluesselt", "extrahiert"], ["erhellt", "extrahiert"], ["extrahiert", "herausgestellt"], ["aufgeschluesselt", "erhellt"], ["aufgeschluesselt", "herausgestellt"], ["erhellt", "herausgestellt"], ["egalisierung", "gleichstellung"], ["angleichung", "egalisierung"], ["anpassung", "egalisierung"], ["angleichung", "gleichstellung"], ["anpassung", "gleichstellung"], ["kommen", "kostenpunkt"], ["kommen", "machen"], ["kommen", "kosten"], ["kostenpunkt", "machen"], ["kosten", "kostenpunkt"], ["kosten", "machen"], ["ausgehen", "ausklingen"], ["ablaufen", "ausgehen"], ["ausgehen", "auslaufen"], ["aufhoeren", "ausgehen"], ["ausgehen", "enden"], ["ausgehen", "verfallen"], ["ausgehen", "schliessen"], ["ablaufen", "ausklingen"], ["ausklingen", "auslaufen"], ["aufhoeren", "ausklingen"], ["ausklingen", "enden"], ["ausklingen", "verfallen"], ["ausklingen", "schliessen"], ["ablaufen", "auslaufen"], ["ablaufen", "aufhoeren"], ["ablaufen", "enden"], ["ablaufen", "verfallen"], ["ablaufen", "schliessen"], ["aufhoeren", "auslaufen"], ["auslaufen", "enden"], ["auslaufen", "verfallen"], ["auslaufen", "schliessen"], ["aufhoeren", "verfallen"], ["aufhoeren", "schliessen"], ["enden", "verfallen"], ["enden", "schliessen"], ["schliessen", "verfallen"], ["datenmaske", "textmaske"], ["datenmaske", "eingabefeld"], ["datenmaske", "vorlage"], ["datenmaske", "maske"], ["eingabefeld", "textmaske"], ["textmaske", "vorlage"], ["maske", "textmaske"], ["eingabefeld", "vorlage"], ["eingabefeld", "maske"], ["maske", "vorlage"], ["kehrtmachen", "zuruecklaufen"], ["umkehren", "zuruecklaufen"], ["umdrehen", "zuruecklaufen"], ["kehrtmachen", "umkehren"], ["kehrtmachen", "umdrehen"], ["umdrehen", "umkehren"], ["gestellt", "inszeniert"], ["arrangiert", "inszeniert"], ["inszeniert", "vorbereitet"], ["arrangiert", "gestellt"], ["gestellt", "vorbereitet"], ["arrangiert", "vorbereitet"], ["division", "teilen"], ["abweichen", "unterscheiden"], ["abweichen", "herausfallen"], ["abweichen", "differieren"], ["abweichen", "divergieren"], ["abweichen", "deviieren"], ["herausfallen", "unterscheiden"], ["differieren", "unterscheiden"], ["divergieren", "unterscheiden"], ["deviieren", "unterscheiden"], ["differieren", "herausfallen"], ["divergieren", "herausfallen"], ["deviieren", "herausfallen"], ["differieren", "divergieren"], ["deviieren", "differieren"], ["deviieren", "divergieren"], ["form", "praegung"], ["bestimmen", "einrichten"], ["bestimmen", "konstituieren"], ["aufstellen", "bestimmen"], ["bedingen", "bestimmen"], ["einrichten", "festsetzen"], ["einrichten", "konstituieren"], ["aufstellen", "einrichten"], ["bedingen", "einrichten"], ["festsetzen", "konstituieren"], ["aufstellen", "festsetzen"], ["bedingen", "festsetzen"], ["aufstellen", "konstituieren"], ["bedingen", "konstituieren"], ["aufstellen", "bedingen"], ["hinter", "nach"], ["hinschleppen", "ziehen"], ["dauern", "ziehen"], ["hinziehen", "ziehen"], ["dauern", "hinschleppen"], ["hinschleppen", "hinziehen"], ["dauern", "hinziehen"], ["hochheben", "lupfen"], ["luepfen", "lupfen"], ["anheben", "lupfen"], ["hochziehen", "lupfen"], ["hochheben", "luepfen"], ["anheben", "hochheben"], ["hochheben", "hochziehen"], ["anheben", "luepfen"], ["hochziehen", "luepfen"], ["anheben", "hochziehen"], ["perforation", "perforierung"], ["loch", "perforierung"], ["loch", "perforation"], ["beiblatt", "beiheft"], ["beiblatt", "ergaenzung"], ["beiblatt", "supplement"], ["beiblatt", "einlage"], ["beiblatt", "beigabe"], ["beiheft", "ergaenzung"], ["beiheft", "supplement"], ["beiheft", "einlage"], ["beigabe", "beiheft"], ["ergaenzung", "supplement"], ["einlage", "ergaenzung"], ["einlage", "supplement"], ["beigabe", "supplement"], ["beigabe", "einlage"], ["messschraube", "mikrometerschraube"], ["messschraube", "mikrometer"], ["mikrometer", "mikrometerschraube"], ["hart", "harz"], ["geruhsam", "langsam"], ["gemach", "geruhsam"], ["gemaechlich", "geruhsam"], ["allmaehlich", "geruhsam"], ["geruhsam", "seelenruhig"], ["geruhsam", "ruhig"], ["gemuetlich", "geruhsam"], ["gemach", "langsam"], ["gemaechlich", "langsam"], ["allmaehlich", "langsam"], ["langsam", "seelenruhig"], ["langsam", "ruhig"], ["gemuetlich", "langsam"], ["gemach", "gemaechlich"], ["allmaehlich", "gemach"], ["gemach", "seelenruhig"], ["gemach", "ruhig"], ["gemach", "gemuetlich"], ["allmaehlich", "gemaechlich"], ["gemaechlich", "seelenruhig"], ["gemaechlich", "ruhig"], ["gemaechlich", "gemuetlich"], ["allmaehlich", "seelenruhig"], ["allmaehlich", "ruhig"], ["allmaehlich", "gemuetlich"], ["ruhig", "seelenruhig"], ["gemuetlich", "seelenruhig"], ["gemuetlich", "ruhig"], ["kaum", "schlecht"], ["schlecht", "wenig"], ["schlecht", "schwerlich"], ["kaum", "schwerlich"], ["schwerlich", "wenig"], ["kennzahl", "messgroesse"], ["grob", "soweit"], ["absperren", "sichern"], ["absichern", "sichern"], ["absichern", "absperren"], ["uebermittelt", "uebertragen"], ["abgegeben", "uebermittelt"], ["abgegeben", "uebertragen"], ["schauplatz", "situation"], ["rahmen", "schauplatz"], ["schauplatz", "setting"], ["drumherum", "schauplatz"], ["schauplatz", "umgebung"], ["rahmen", "situation"], ["setting", "situation"], ["drumherum", "situation"], ["situation", "umgebung"], ["rahmen", "setting"], ["drumherum", "rahmen"], ["rahmen", "umgebung"], ["drumherum", "setting"], ["setting", "umgebung"], ["drumherum", "umgebung"], ["liefern", "performen"], ["liefern", "schaffen"], ["leisten", "liefern"], ["performen", "schaffen"], ["leisten", "performen"], ["leisten", "schaffen"], ["registrieren", "sensen"], ["messen", "registrieren"], ["aufnehmen", "registrieren"], ["registrieren", "sampeln"], ["detektieren", "registrieren"], ["messen", "sensen"], ["aufnehmen", "sensen"], ["sampeln", "sensen"], ["detektieren", "sensen"], ["aufnehmen", "messen"], ["messen", "sampeln"], ["detektieren", "messen"], ["aufnehmen", "sampeln"], ["aufnehmen", "detektieren"], ["detektieren", "sampeln"], ["drehen", "lagern"], ["drehen", "umlagern"], ["dekubitusprophylaxe", "drehen"], ["betten", "drehen"], ["lagern", "umlagern"], ["dekubitusprophylaxe", "lagern"], ["dekubitusprophylaxe", "umlagern"], ["betten", "umlagern"], ["betten", "dekubitusprophylaxe"], ["verlangt", "vorgeschrieben"], ["angeordnet", "verlangt"], ["gefordert", "verlangt"], ["befohlen", "verlangt"], ["angeordnet", "vorgeschrieben"], ["gefordert", "vorgeschrieben"], ["befohlen", "vorgeschrieben"], ["angeordnet", "gefordert"], ["angeordnet", "befohlen"], ["befohlen", "gefordert"], ["deckel", "klappe"], ["klappe", "verschluss"], ["deckel", "verschluss"], ["anderweitig", "weiterer"], ["sonstig", "weiterer"], ["anderer", "weiterer"], ["anderweitig", "sonstig"], ["anderer", "anderweitig"], ["anderer", "sonstig"], ["erreichen", "schaffen"], ["erlangen", "schaffen"], ["erzielen", "schaffen"], ["einfahren", "schaffen"], ["gewinnen", "schaffen"], ["erringen", "schaffen"], ["erlangen", "erreichen"], ["erreichen", "erzielen"], ["einfahren", "erreichen"], ["erreichen", "gewinnen"], ["erreichen", "erringen"], ["erlangen", "erzielen"], ["einfahren", "erlangen"], ["erlangen", "gewinnen"], ["erlangen", "erringen"], ["einfahren", "erzielen"], ["erzielen", "gewinnen"], ["erringen", "erzielen"], ["einfahren", "gewinnen"], ["einfahren", "erringen"], ["erringen", "gewinnen"], ["einfangen", "knipsen"], ["fotografieren", "knipsen"], ["ablichten", "knipsen"], ["festhalten", "knipsen"], ["abfotografieren", "knipsen"], ["aufnehmen", "knipsen"], ["einfangen", "fotografieren"], ["ablichten", "einfangen"], ["einfangen", "festhalten"], ["abfotografieren", "einfangen"], ["aufnehmen", "einfangen"], ["ablichten", "fotografieren"], ["festhalten", "fotografieren"], ["abfotografieren", "fotografieren"], ["aufnehmen", "fotografieren"], ["ablichten", "festhalten"], ["abfotografieren", "ablichten"], ["ablichten", "aufnehmen"], ["abfotografieren", "festhalten"], ["abfotografieren", "aufnehmen"], ["ueberschwaenglich", "unendlich"], ["rasend", "unendlich"], ["blind", "unendlich"], ["abgoettisch", "unendlich"], ["rasend", "ueberschwaenglich"], ["blind", "ueberschwaenglich"], ["abgoettisch", "ueberschwaenglich"], ["blind", "rasend"], ["abgoettisch", "rasend"], ["abgoettisch", "blind"], ["arten", "nachschlagen"], ["nacharten", "nachschlagen"], ["aehneln", "nachschlagen"], ["nachgeraten", "nachschlagen"], ["geraten", "nachschlagen"], ["nachschlagen", "schlagen"], ["arten", "nacharten"], ["aehneln", "arten"], ["arten", "nachgeraten"], ["arten", "geraten"], ["arten", "schlagen"], ["aehneln", "nacharten"], ["nacharten", "nachgeraten"], ["geraten", "nacharten"], ["nacharten", "schlagen"], ["aehneln", "nachgeraten"], ["aehneln", "geraten"], ["aehneln", "schlagen"], ["geraten", "nachgeraten"], ["nachgeraten", "schlagen"], ["geraten", "schlagen"], ["korridor", "luecke"], ["durchlass", "korridor"], ["gasse", "korridor"], ["gang", "korridor"], ["durchgang", "korridor"], ["korridor", "passage"], ["durchlass", "luecke"], ["gasse", "luecke"], ["gang", "luecke"], ["durchgang", "luecke"], ["luecke", "passage"], ["durchlass", "gasse"], ["durchlass", "gang"], ["durchgang", "durchlass"], ["durchlass", "passage"], ["gang", "gasse"], ["durchgang", "gasse"], ["gasse", "passage"], ["durchgang", "gang"], ["gang", "passage"], ["durchgang", "passage"], ["verkauf", "vertrieb"], ["auslieferung", "verkauf"], ["abgabe", "verkauf"], ["veraeusserung", "verkauf"], ["ausgabe", "verkauf"], ["absatz", "verkauf"], ["auslieferung", "vertrieb"], ["abgabe", "vertrieb"], ["veraeusserung", "vertrieb"], ["ausgabe", "vertrieb"], ["absatz", "vertrieb"], ["abgabe", "auslieferung"], ["auslieferung", "veraeusserung"], ["ausgabe", "auslieferung"], ["absatz", "auslieferung"], ["abgabe", "veraeusserung"], ["abgabe", "ausgabe"], ["abgabe", "absatz"], ["ausgabe", "veraeusserung"], ["absatz", "veraeusserung"], ["absatz", "ausgabe"], ["kraftstoffanzeige", "tankanzeige"], ["kraftstoffanzeige", "treibstoffanzeige"], ["kraftstoffanzeige", "spritanzeige"], ["kraftstoffanzeige", "tankuhr"], ["tankanzeige", "treibstoffanzeige"], ["spritanzeige", "tankanzeige"], ["tankanzeige", "tankuhr"], ["spritanzeige", "treibstoffanzeige"], ["tankuhr", "treibstoffanzeige"], ["spritanzeige", "tankuhr"], ["ventilsteuerung", "ventiltrieb"], ["innentemperatur", "raumlufttemperatur"], ["raumlufttemperatur", "zimmertemperatur"], ["lufttemperatur", "raumlufttemperatur"], ["raumlufttemperatur", "raumtemperatur"], ["innentemperatur", "zimmertemperatur"], ["innentemperatur", "lufttemperatur"], ["innentemperatur", "raumtemperatur"], ["lufttemperatur", "zimmertemperatur"], ["raumtemperatur", "zimmertemperatur"], ["lufttemperatur", "raumtemperatur"], ["weisen", "zeigen"], ["deuten", "weisen"], ["deuten", "zeigen"], ["ausgestattet", "versehen"], ["ausgestattet", "bestueckt"], ["ausgeruestet", "ausgestattet"], ["bestueckt", "versehen"], ["ausgeruestet", "versehen"], ["ausgeruestet", "bestueckt"], ["punktschweissen", "widerstandspunktschweissen"], ["aufgrund", "kraft"], ["kraft", "vermoege"], ["durch", "kraft"], ["aufgrund", "vermoege"], ["aufgrund", "durch"], ["durch", "vermoege"], ["duenn", "schwach"], ["piepsig", "schwach"], ["schwach", "stimmchen"], ["kraftlos", "schwach"], ["leise", "schwach"], ["duenn", "piepsig"], ["duenn", "stimmchen"], ["duenn", "kraftlos"], ["duenn", "leise"], ["piepsig", "stimmchen"], ["kraftlos", "piepsig"], ["leise", "piepsig"], ["kraftlos", "stimmchen"], ["leise", "stimmchen"], ["kraftlos", "leise"], ["geringfuegig", "leicht"], ["dezent", "geringfuegig"], ["dezent", "leicht"], ["anfahren", "starten"], ["anfahren", "hochfahren"], ["brd", "westdeutschland"], ["brd", "bundesrepublik"], ["brd", "bunzreplik"], ["brd", "deutschland"], ["bundesrepublik", "westdeutschland"], ["bunzreplik", "westdeutschland"], ["deutschland", "westdeutschland"], ["bundesrepublik", "bunzreplik"], ["bundesrepublik", "deutschland"], ["bunzreplik", "deutschland"], ["polyvinylchlorid", "pvc"], ["leitungsschutzschalter", "ls-schalter"], ["leitungsschutzschalter", "sicherung"], ["leitungsschutzschalter", "sicherungsautomat"], ["automat", "leitungsschutzschalter"], ["ls-schalter", "sicherung"], ["ls-schalter", "sicherungsautomat"], ["automat", "ls-schalter"], ["sicherung", "sicherungsautomat"], ["automat", "sicherung"], ["automat", "sicherungsautomat"], ["ordnungsmaessig", "regelkonform"], ["ordnungsmaessig", "regelgerecht"], ["gebuehrend", "ordnungsmaessig"], ["korrekt", "ordnungsmaessig"], ["ordnungsmaessig", "sauber"], ["regelgerecht", "regelkonform"], ["ordnungsgemaess", "regelkonform"], ["regelkonform", "vorschriftsmaessig"], ["gebuehrend", "regelkonform"], ["korrekt", "regelkonform"], ["regelkonform", "sauber"], ["ordnungsgemaess", "regelgerecht"], ["regelgerecht", "vorschriftsmaessig"], ["gebuehrend", "regelgerecht"], ["korrekt", "regelgerecht"], ["regelgerecht", "sauber"], ["gebuehrend", "ordnungsgemaess"], ["korrekt", "ordnungsgemaess"], ["ordnungsgemaess", "sauber"], ["gebuehrend", "vorschriftsmaessig"], ["korrekt", "vorschriftsmaessig"], ["sauber", "vorschriftsmaessig"], ["gebuehrend", "korrekt"], ["gebuehrend", "sauber"], ["korrekt", "sauber"], ["abstandhalter", "distanzscheibe"], ["distanzscheibe", "passscheibe"], ["distanzscheibe", "distanzstueck"], ["distanzscheibe", "passstueck"], ["abstandhalter", "passscheibe"], ["abstandhalter", "distanzstueck"], ["abstandhalter", "passstueck"], ["distanzstueck", "passscheibe"], ["passscheibe", "passstueck"], ["distanzstueck", "passstueck"], ["mehr", "weiteres"], ["mehr", "sonstiges"], ["sonstiges", "weiteres"], ["aufsperren", "oeffnen"], ["entriegeln", "oeffnen"], ["aufschliessen", "oeffnen"], ["aufsperren", "entriegeln"], ["aufschliessen", "aufsperren"], ["aufschliessen", "entriegeln"], ["sein", "seine"], ["hauchduenn", "keine"], ["keine", "nur"], ["kaum", "keine"], ["keine", "knapp"], ["hauchduenn", "nur"], ["hauchduenn", "kaum"], ["hauchduenn", "knapp"], ["kaum", "nur"], ["knapp", "nur"], ["kaum", "knapp"], ["auseinandernehmen", "pruefen"], ["examinieren", "pruefen"], ["auseinandernehmen", "examinieren"], ["einschlagen", "eintreten"], ["eindruecken", "einschlagen"], ["einschlagen", "einwerfen"], ["eindruecken", "eintreten"], ["eintreten", "einwerfen"], ["eindruecken", "einwerfen"], ["anhaltspunkt", "groessenordnung"], ["bereich", "groessenordnung"], ["groessenordnung", "hausnummer"], ["anhaltspunkt", "bereich"], ["anhaltspunkt", "hausnummer"], ["bereich", "hausnummer"], ["roadmap", "zeitplan"], ["choreografie", "zeitplan"], ["programm", "zeitplan"], ["ablaufplan", "zeitplan"], ["terminplan", "zeitplan"], ["fahrplan", "zeitplan"], ["choreografie", "roadmap"], ["programm", "roadmap"], ["ablaufplan", "roadmap"], ["roadmap", "terminplan"], ["fahrplan", "roadmap"], ["choreografie", "programm"], ["ablaufplan", "choreografie"], ["choreografie", "terminplan"], ["choreografie", "fahrplan"], ["ablaufplan", "programm"], ["programm", "terminplan"], ["fahrplan", "programm"], ["ablaufplan", "terminplan"], ["ablaufplan", "fahrplan"], ["fahrplan", "terminplan"], ["mass", "messwert"], ["kommen", "verdanken"], ["entstammen", "verdanken"], ["liegen", "verdanken"], ["verdanken", "zurueckgehen"], ["erklaeren", "verdanken"], ["herruehren", "verdanken"], ["resultatsein", "verdanken"], ["entstammen", "kommen"], ["kommen", "liegen"], ["kommen", "zurueckgehen"], ["erklaeren", "kommen"], ["herruehren", "kommen"], ["kommen", "resultatsein"], ["entstammen", "liegen"], ["entstammen", "zurueckgehen"], ["entstammen", "erklaeren"], ["entstammen", "herruehren"], ["entstammen", "resultatsein"], ["liegen", "zurueckgehen"], ["erklaeren", "liegen"], ["herruehren", "liegen"], ["liegen", "resultatsein"], ["erklaeren", "zurueckgehen"], ["herruehren", "zurueckgehen"], ["resultatsein", "zurueckgehen"], ["erklaeren", "herruehren"], ["erklaeren", "resultatsein"], ["herruehren", "resultatsein"], ["aus", "daemmerung"], ["daemmerung", "goetterdaemmerung"], ["daemmerung", "ende"], ["aus", "goetterdaemmerung"], ["aus", "ende"], ["ende", "goetterdaemmerung"], ["dauernd", "wiederholt"], ["laufend", "wiederholt"], ["ewig", "wiederholt"], ["endlos", "wiederholt"], ["andauernd", "wiederholt"], ["staendig", "wiederholt"], ["dauernd", "laufend"], ["dauernd", "ewig"], ["dauernd", "endlos"], ["andauernd", "dauernd"], ["dauernd", "staendig"], ["ewig", "laufend"], ["endlos", "laufend"], ["andauernd", "laufend"], ["laufend", "staendig"], ["endlos", "ewig"], ["andauernd", "ewig"], ["ewig", "staendig"], ["andauernd", "endlos"], ["endlos", "staendig"], ["andauernd", "staendig"], ["nennwert", "nominale"], ["nominale", "nominalwert"], ["nennwert", "nominalwert"], ["allrad", "allradantrieb"], ["duerfen", "muessen"], ["koennen", "muessen"], ["muessen", "obliegen"], ["duerfen", "koennen"], ["duerfen", "obliegen"], ["duerfen", "sollen"], ["koennen", "obliegen"], ["koennen", "sollen"], ["obliegen", "sollen"], ["glas", "obsidian"], ["knoten", "kreuz"], ["autobahnkreuz", "knoten"], ["autobahnknoten", "knoten"], ["autobahnkreuz", "kreuz"], ["autobahnknoten", "kreuz"], ["autobahnknoten", "autobahnkreuz"], ["vordem", "vorher"], ["eher", "vorher"], ["davor", "vorher"], ["frueher", "vorher"], ["eher", "vordem"], ["davor", "vordem"], ["vordem", "zuvor"], ["frueher", "vordem"], ["davor", "eher"], ["eher", "zuvor"], ["eher", "frueher"], ["davor", "zuvor"], ["davor", "frueher"], ["frueher", "zuvor"], ["laengst", "schon"], ["lange", "schon"], ["bereits", "schon"], ["laengst", "lange"], ["bereits", "laengst"], ["bereits", "lange"], ["unbenommen", "ungeachtet"], ["entgegen", "ungeachtet"], ["unbeschadet", "ungeachtet"], ["trotz", "ungeachtet"], ["entgegen", "unbenommen"], ["unbenommen", "unbeschadet"], ["trotz", "unbenommen"], ["entgegen", "unbeschadet"], ["entgegen", "trotz"], ["trotz", "unbeschadet"], ["aendern", "ueberarbeiten"], ["aendern", "revidieren"], ["aendern", "korrigieren"], ["aendern", "ueberholen"], ["revidieren", "ueberarbeiten"], ["korrigieren", "ueberarbeiten"], ["ueberarbeiten", "ueberholen"], ["abaendern", "revidieren"], ["abaendern", "korrigieren"], ["abaendern", "ueberholen"], ["korrigieren", "revidieren"], ["revidieren", "ueberholen"], ["korrigieren", "ueberholen"], ["gepolt", "getrimmt"], ["eingestellt", "gepolt"], ["gepolt", "programmiert"], ["ausgerichtet", "gepolt"], ["eingestellt", "getrimmt"], ["getrimmt", "programmiert"], ["ausgerichtet", "getrimmt"], ["eingestellt", "programmiert"], ["ausgerichtet", "eingestellt"], ["ausgerichtet", "programmiert"], ["ueberholung", "ueberholvorgang"], ["ueberholen", "ueberholung"], ["ueberholen", "ueberholvorgang"], ["fassade", "vorderseite"], ["front", "vorderseite"], ["schauseite", "vorderseite"], ["exterieur", "vorderseite"], ["strassenseite", "vorderseite"], ["frontansicht", "vorderseite"], ["vorderansicht", "vorderseite"], ["fassade", "front"], ["fassade", "schauseite"], ["exterieur", "fassade"], ["fassade", "strassenseite"], ["fassade", "frontansicht"], ["fassade", "vorderansicht"], ["front", "schauseite"], ["exterieur", "front"], ["front", "strassenseite"], ["front", "frontansicht"], ["front", "vorderansicht"], ["exterieur", "schauseite"], ["schauseite", "strassenseite"], ["frontansicht", "schauseite"], ["schauseite", "vorderansicht"], ["exterieur", "strassenseite"], ["exterieur", "frontansicht"], ["exterieur", "vorderansicht"], ["frontansicht", "strassenseite"], ["strassenseite", "vorderansicht"], ["frontansicht", "vorderansicht"], ["plus", "steigerung"], ["anstieg", "plus"], ["plus", "verbesserung"], ["aufstieg", "plus"], ["mehr", "plus"], ["aufwaertsentwicklung", "plus"], ["anstieg", "steigerung"], ["steigerung", "verbesserung"], ["aufstieg", "steigerung"], ["mehr", "steigerung"], ["aufwaertsentwicklung", "steigerung"], ["anstieg", "verbesserung"], ["anstieg", "aufstieg"], ["anstieg", "mehr"], ["anstieg", "aufwaertsentwicklung"], ["aufstieg", "verbesserung"], ["mehr", "verbesserung"], ["aufwaertsentwicklung", "verbesserung"], ["aufstieg", "mehr"], ["aufstieg", "aufwaertsentwicklung"], ["aufwaertsentwicklung", "mehr"], ["wertschaetzung", "zugewandtheit"], ["interesse", "wertschaetzung"], ["aufmerksamkeit", "wertschaetzung"], ["anteilnahme", "wertschaetzung"], ["interesse", "zugewandtheit"], ["aufmerksamkeit", "zugewandtheit"], ["anteilnahme", "zugewandtheit"], ["aufmerksamkeit", "interesse"], ["anteilnahme", "interesse"], ["anteilnahme", "aufmerksamkeit"], ["abwechselnd", "einzeln"], ["abwechselnd", "nacheinander"], ["abwechselnd", "reihum"], ["einzeln", "nacheinander"], ["einzeln", "reihum"], ["nacheinander", "reihum"], ["pruefung", "schicksalsschlag"], ["geissel", "pruefung"], ["heimsuchung", "pruefung"], ["pruefung", "schlag"], ["geissel", "schicksalsschlag"], ["heimsuchung", "schicksalsschlag"], ["schicksalsschlag", "schlag"], ["geissel", "heimsuchung"], ["geissel", "schlag"], ["heimsuchung", "schlag"], ["pose", "spiel"], ["spiel", "trick"], ["masche", "spiel"], ["spiel", "vorgehensweise"], ["nummer", "spiel"], ["muster", "spiel"], ["spiel", "tour"], ["pose", "trick"], ["masche", "pose"], ["pose", "vorgehensweise"], ["nummer", "pose"], ["muster", "pose"], ["pose", "tour"], ["masche", "trick"], ["trick", "vorgehensweise"], ["nummer", "trick"], ["muster", "trick"], ["tour", "trick"], ["masche", "vorgehensweise"], ["masche", "nummer"], ["masche", "muster"], ["masche", "tour"], ["nummer", "vorgehensweise"], ["muster", "vorgehensweise"], ["tour", "vorgehensweise"], ["muster", "nummer"], ["nummer", "tour"], ["muster", "tour"], ["genau", "punkt"], ["punkt", "schlag"], ["genau", "schlag"], ["schleifmittel", "schleifscheibe"], ["schleifer", "schleifscheibe"], ["schleifkopf", "schleifscheibe"], ["schleifscheibe", "trennscheibe"], ["schleifer", "schleifmittel"], ["schleifkopf", "schleifmittel"], ["schleifmittel", "trennscheibe"], ["schleifer", "schleifkopf"], ["schleifer", "trennscheibe"], ["schleifkopf", "trennscheibe"], ["gestochen", "scharf"], ["gestochen", "klar"], ["klar", "scharf"], ["quote", "teilbetrag"], ["rate", "teilbetrag"], ["anteil", "teilbetrag"], ["quote", "rate"], ["anteil", "quote"], ["anteil", "rate"], ["absterben", "kaputtgehen"], ["absterben", "eingehen"], ["absterben", "vertrocknen"], ["absterben", "verdorren"], ["eingehen", "kaputtgehen"], ["kaputtgehen", "vertrocknen"], ["kaputtgehen", "verdorren"], ["eingehen", "vertrocknen"], ["eingehen", "verdorren"], ["verdorren", "vertrocknen"], ["seit", "seitdem"], ["seitdem", "solange"], ["seitdem", "solang"], ["seit", "solange"], ["seit", "solang"], ["solang", "solange"], ["firm", "versiert"], ["firm", "sicher"], ["firm", "sattelfest"], ["firm", "fit"], ["firm", "routiniert"], ["sicher", "versiert"], ["sattelfest", "versiert"], ["fit", "versiert"], ["routiniert", "versiert"], ["sattelfest", "sicher"], ["fit", "sicher"], ["routiniert", "sicher"], ["fit", "sattelfest"], ["routiniert", "sattelfest"], ["fit", "routiniert"], ["erreichen", "holen"], ["erzielen", "holen"], ["einfahren", "holen"], ["konturlos", "unauffaellig"], ["angepasst", "konturlos"], ["konturlos", "unscheinbar"], ["farblos", "konturlos"], ["harmlos", "konturlos"], ["konturlos", "unspektakulaer"], ["angepasst", "unauffaellig"], ["unauffaellig", "unscheinbar"], ["farblos", "unauffaellig"], ["harmlos", "unauffaellig"], ["unauffaellig", "unspektakulaer"], ["angepasst", "unscheinbar"], ["angepasst", "farblos"], ["angepasst", "harmlos"], ["angepasst", "unspektakulaer"], ["farblos", "unscheinbar"], ["harmlos", "unscheinbar"], ["unscheinbar", "unspektakulaer"], ["farblos", "harmlos"], ["farblos", "unspektakulaer"], ["harmlos", "unspektakulaer"], ["total", "zusammen"], ["saldo", "zusammen"], ["insgesamt", "zusammen"], ["saldo", "total"], ["insgesamt", "total"], ["insgesamt", "saldo"], ["arbeitsbrigade", "kolonne"], ["kolonne", "mannschaft"], ["kolonne", "team"], ["brigade", "kolonne"], ["gewerk", "kolonne"], ["gruppe", "kolonne"], ["arbeitsgruppe", "kolonne"], ["arbeitsbrigade", "mannschaft"], ["arbeitsbrigade", "team"], ["arbeitsbrigade", "brigade"], ["arbeitsbrigade", "gewerk"], ["arbeitsbrigade", "gruppe"], ["arbeitsbrigade", "arbeitsgruppe"], ["mannschaft", "team"], ["brigade", "mannschaft"], ["gewerk", "mannschaft"], ["gruppe", "mannschaft"], ["arbeitsgruppe", "mannschaft"], ["brigade", "team"], ["gewerk", "team"], ["gruppe", "team"], ["arbeitsgruppe", "team"], ["brigade", "gewerk"], ["brigade", "gruppe"], ["arbeitsgruppe", "brigade"], ["gewerk", "gruppe"], ["arbeitsgruppe", "gewerk"], ["arbeitsgruppe", "gruppe"], ["beschatten", "bespitzeln"], ["bespitzeln", "verfolgen"], ["bespitzeln", "nachstellen"], ["beschatten", "verfolgen"], ["beschatten", "nachstellen"], ["heftig", "massiv"], ["heftig", "scharf"], ["heftig", "hitzig"], ["heftig", "verbissen"], ["hart", "heftig"], ["erbittert", "heftig"], ["heftig", "vehement"], ["massiv", "scharf"], ["hitzig", "massiv"], ["massiv", "verbissen"], ["hart", "massiv"], ["erbittert", "massiv"], ["massiv", "vehement"], ["hitzig", "scharf"], ["scharf", "verbissen"], ["hart", "scharf"], ["erbittert", "scharf"], ["scharf", "vehement"], ["hitzig", "verbissen"], ["hart", "hitzig"], ["erbittert", "hitzig"], ["hitzig", "vehement"], ["hart", "verbissen"], ["erbittert", "verbissen"], ["vehement", "verbissen"], ["erbittert", "hart"], ["hart", "vehement"], ["erbittert", "vehement"], ["ausueben", "innehaben"], ["ausueben", "versehen"], ["ausueben", "wirken"], ["arbeiten", "ausueben"], ["ausueben", "geben"], ["ausueben", "bekleiden"], ["amtieren", "ausueben"], ["innehaben", "versehen"], ["innehaben", "wirken"], ["arbeiten", "innehaben"], ["geben", "innehaben"], ["bekleiden", "innehaben"], ["amtieren", "innehaben"], ["versehen", "wirken"], ["arbeiten", "versehen"], ["geben", "versehen"], ["bekleiden", "versehen"], ["amtieren", "versehen"], ["geben", "wirken"], ["bekleiden", "wirken"], ["amtieren", "wirken"], ["arbeiten", "geben"], ["arbeiten", "bekleiden"], ["amtieren", "arbeiten"], ["bekleiden", "geben"], ["amtieren", "geben"], ["amtieren", "bekleiden"], ["dagegen", "gegenueber"], ["dafuer", "gegenueber"], ["gegenueber", "neben"], ["dagegen", "neben"], ["dafuer", "neben"], ["kommen", "laufen"], ["bohnenstange", "heugeige"], ["bohnenstange", "lange"], ["bohnenstange", "hopfenstange"], ["bohnenstange", "langer"], ["heugeige", "lange"], ["heugeige", "hopfenstange"], ["heugeige", "langer"], ["hopfenstange", "lange"], ["lange", "langer"], ["hopfenstange", "langer"], ["baumlang", "lang"], ["baumlang", "riese"], ["baumlang", "hochgewachsen"], ["baumlang", "gross"], ["baumlang", "turm"], ["baumlang", "stattlich"], ["lang", "riese"], ["hochgewachsen", "lang"], ["gross", "lang"], ["lang", "turm"], ["lang", "stattlich"], ["hochgewachsen", "riese"], ["gross", "riese"], ["riese", "turm"], ["riese", "stattlich"], ["gross", "hochgewachsen"], ["hochgewachsen", "turm"], ["hochgewachsen", "stattlich"], ["gross", "turm"], ["gross", "stattlich"], ["stattlich", "turm"], ["kurzzeitig", "zuegig"], ["kurzfristig", "kurzzeitig"], ["kurzzeitig", "schnell"], ["kurzfristig", "zuegig"], ["schnell", "zuegig"], ["kurzfristig", "schnell"], ["heilmachen", "richten"], ["heilmachen", "herrichten"], ["heilmachen", "hinbekommen"], ["heilmachen", "reparieren"], ["heilmachen", "hinkriegen"], ["herrichten", "richten"], ["hinbekommen", "richten"], ["reparieren", "richten"], ["hinkriegen", "richten"], ["herrichten", "hinbekommen"], ["herrichten", "reparieren"], ["herrichten", "hinkriegen"], ["hinbekommen", "reparieren"], ["hinbekommen", "hinkriegen"], ["hinkriegen", "reparieren"], ["brouillerie", "zerwuerfnis"], ["bruch", "zerwuerfnis"], ["riss", "zerwuerfnis"], ["brouillerie", "bruch"], ["brouillerie", "riss"], ["bruch", "riss"], ["verschliessen", "zumachen"], ["abdichten", "zumachen"], ["zumachen", "zustopfen"], ["abdichten", "verschliessen"], ["verschliessen", "zustopfen"], ["abdichten", "zustopfen"], ["geziemend", "korrekt"], ["angebracht", "korrekt"], ["korrekt", "schicklich"], ["angemessen", "korrekt"], ["geboten", "korrekt"], ["gebuehrend", "geziemend"], ["angebracht", "gebuehrend"], ["gebuehrend", "schicklich"], ["angemessen", "gebuehrend"], ["geboten", "gebuehrend"], ["angebracht", "geziemend"], ["geziemend", "schicklich"], ["angemessen", "geziemend"], ["geboten", "geziemend"], ["angebracht", "schicklich"], ["angebracht", "angemessen"], ["angebracht", "geboten"], ["angemessen", "schicklich"], ["geboten", "schicklich"], ["angemessen", "geboten"], ["angeschlagen", "beeintraechtigt"], ["angeschlagen", "gespannt"], ["angeschlagen", "belastet"], ["angeschlagen", "angespannt"], ["beeintraechtigt", "gespannt"], ["beeintraechtigt", "belastet"], ["angespannt", "beeintraechtigt"], ["belastet", "gespannt"], ["angespannt", "gespannt"], ["angespannt", "belastet"], ["leute", "miteinander"], ["allerseits", "leute"], ["leute", "leuts"], ["leute", "zusammen"], ["allerseits", "miteinander"], ["leuts", "miteinander"], ["allerseits", "leuts"], ["allerseits", "zusammen"], ["leuts", "zusammen"], ["gesichert", "stichhaltig"], ["gesichert", "handfest"], ["beweiskraeftig", "gesichert"], ["belastbar", "gesichert"], ["gesichert", "wasserdicht"], ["gesichert", "nachgewiesen"], ["handfest", "stichhaltig"], ["beweiskraeftig", "stichhaltig"], ["belastbar", "stichhaltig"], ["stichhaltig", "wasserdicht"], ["nachgewiesen", "stichhaltig"], ["beweiskraeftig", "handfest"], ["belastbar", "handfest"], ["handfest", "wasserdicht"], ["handfest", "nachgewiesen"], ["belastbar", "beweiskraeftig"], ["beweiskraeftig", "wasserdicht"], ["beweiskraeftig", "nachgewiesen"], ["belastbar", "wasserdicht"], ["belastbar", "nachgewiesen"], ["nachgewiesen", "wasserdicht"], ["jedweder", "jeglicher"], ["jeder", "jeglicher"], ["jeder", "jedweder"], ["neutralisieren", "terminieren"], ["herausnehmen", "terminieren"], ["ausschalten", "terminieren"], ["eliminieren", "terminieren"], ["liquidieren", "terminieren"], ["herausnehmen", "neutralisieren"], ["ausschalten", "neutralisieren"], ["eliminieren", "neutralisieren"], ["liquidieren", "neutralisieren"], ["ausschalten", "herausnehmen"], ["eliminieren", "herausnehmen"], ["herausnehmen", "liquidieren"], ["ausschalten", "eliminieren"], ["ausschalten", "liquidieren"], ["eliminieren", "liquidieren"], ["bedingt", "dank"], ["bedingt", "infolge"], ["bedingt", "vermoege"], ["aufgrund", "bedingt"], ["bedingt", "wegen"], ["bedingt", "durch"], ["dank", "infolge"], ["dank", "vermoege"], ["aufgrund", "dank"], ["dank", "wegen"], ["dank", "durch"], ["infolge", "vermoege"], ["aufgrund", "infolge"], ["infolge", "wegen"], ["durch", "infolge"], ["vermoege", "wegen"], ["aufgrund", "wegen"], ["durch", "wegen"], ["aus", "durch"], ["aus", "wegen"], ["aus", "halber"], ["durch", "halber"], ["halber", "wegen"], ["halber", "zuliebe"], ["halber", "zugunsten"], ["halber", "umwillen"], ["fuer", "halber"], ["wegen", "zuliebe"], ["wegen", "zugunsten"], ["umwillen", "wegen"], ["fuer", "wegen"], ["zugunsten", "zuliebe"], ["umwillen", "zuliebe"], ["fuer", "zuliebe"], ["umwillen", "zugunsten"], ["fuer", "zugunsten"], ["fuer", "umwillen"], ["geben", "markieren"], ["geben", "mimen"], ["markieren", "mimen"], ["entspannung", "erloesung"], ["beruhigung", "erloesung"], ["erleichterung", "erloesung"], ["aufatmen", "erloesung"], ["beruhigung", "entspannung"], ["entspannung", "erleichterung"], ["aufatmen", "entspannung"], ["beruhigung", "erleichterung"], ["aufatmen", "beruhigung"], ["aufatmen", "erleichterung"], ["beschleunigung", "unterstuetzung"], ["unterstuetzung", "verstaerkung"], ["beguenstigung", "unterstuetzung"], ["beschleunigung", "verstaerkung"], ["beguenstigung", "beschleunigung"], ["beguenstigung", "verstaerkung"], ["gesetzt", "reif"], ["gereift", "reif"], ["gestanden", "reif"], ["erfahren", "reif"], ["gereift", "gesetzt"], ["gesetzt", "gestanden"], ["erfahren", "gesetzt"], ["gereift", "gestanden"], ["erfahren", "gereift"], ["erfahren", "gestanden"], ["doppelt", "paarweise"], ["paarweise", "zusammen"], ["paarweise", "unzertrennlich"], ["doppelt", "zusammen"], ["doppelt", "unzertrennlich"], ["unzertrennlich", "zusammen"], ["abschluss", "gesellenpruefung"], ["abschluss", "abschlusspruefung"], ["abschlusspruefung", "gesellenpruefung"], ["animieren", "motivieren"], ["animieren", "bewegen"], ["animieren", "veranlassen"], ["animieren", "bringen"], ["bewegen", "motivieren"], ["motivieren", "veranlassen"], ["bringen", "motivieren"], ["bewegen", "veranlassen"], ["bewegen", "bringen"], ["bringen", "veranlassen"], ["groesse", "wert"], ["wert", "zahlenwert"], ["groesse", "zahlenwert"], ["dementsprechendes", "entsprechendes"], ["aehnliches", "dementsprechendes"], ["dementsprechendes", "vergleichbares"], ["dementsprechendes", "sinngemaesses"], ["aehnliches", "entsprechendes"], ["entsprechendes", "vergleichbares"], ["entsprechendes", "sinngemaesses"], ["aehnliches", "vergleichbares"], ["aehnliches", "sinngemaesses"], ["sinngemaesses", "vergleichbares"], ["bedaechtig", "geruhsam"], ["bedaechtig", "langsam"], ["bedaechtig", "ruhig"], ["genauso", "geradeso"], ["genauso", "gleichermassen"], ["genauso", "sowie"], ["ebenso", "geradeso"], ["geradeso", "gleichermassen"], ["geradeso", "sowie"], ["ebenso", "gleichermassen"], ["ebenso", "sowie"], ["gleichermassen", "sowie"], ["empor", "nauf"], ["auf", "empor"], ["empor", "hoch"], ["empor", "hinauf"], ["empor", "rauf"], ["aufwaerts", "empor"], ["auf", "nauf"], ["hoch", "nauf"], ["hinauf", "nauf"], ["nauf", "rauf"], ["aufwaerts", "nauf"], ["auf", "hoch"], ["auf", "hinauf"], ["auf", "rauf"], ["auf", "aufwaerts"], ["hinauf", "hoch"], ["hoch", "rauf"], ["aufwaerts", "hoch"], ["hinauf", "rauf"], ["aufwaerts", "hinauf"], ["aufwaerts", "rauf"], ["frontpartie", "schnauze"], ["schnauze", "vorderteil"], ["front", "schnauze"], ["schnauze", "vorderseite"], ["schnauze", "vorderansicht"], ["frontpartie", "vorderteil"], ["front", "frontpartie"], ["frontpartie", "vorderseite"], ["frontpartie", "vorderansicht"], ["front", "vorderteil"], ["vorderseite", "vorderteil"], ["vorderansicht", "vorderteil"], ["heck", "hinterteil"], ["arsch", "heck"], ["heck", "rueckseite"], ["arsch", "hinterteil"], ["hinterteil", "rueckseite"], ["arsch", "rueckseite"], ["ende", "scheitern"], ["aus", "scheitern"], ["fuehrend", "renommiert"], ["erste", "fuehrend"], ["erste", "renommiert"], ["beschleunigen", "reinhauen"], ["anziehen", "beschleunigen"], ["anziehen", "reinhauen"], ["diskriminieren", "distinguieren"], ["diskriminieren", "trennen"], ["auseinanderhalten", "diskriminieren"], ["differenzieren", "diskriminieren"], ["diskriminieren", "unterscheiden"], ["distinguieren", "trennen"], ["auseinanderhalten", "distinguieren"], ["differenzieren", "distinguieren"], ["distinguieren", "unterscheiden"], ["auseinanderhalten", "trennen"], ["differenzieren", "trennen"], ["trennen", "unterscheiden"], ["auseinanderhalten", "differenzieren"], ["auseinanderhalten", "unterscheiden"], ["differenzieren", "unterscheiden"], ["jene", "sie"], ["die", "jene"], ["ebendiese", "jene"], ["jene", "selbige"], ["jene", "selbe"], ["diese", "jene"], ["die", "sie"], ["ebendiese", "sie"], ["selbige", "sie"], ["selbe", "sie"], ["diese", "sie"], ["die", "ebendiese"], ["die", "selbige"], ["die", "selbe"], ["die", "diese"], ["ebendiese", "selbige"], ["ebendiese", "selbe"], ["diese", "ebendiese"], ["selbe", "selbige"], ["diese", "selbige"], ["diese", "selbe"], ["erhaeltlich", "vorraetig"], ["erhaeltlich", "lieferbar"], ["erhaeltlich", "vorhanden"], ["verfuegbar", "vorraetig"], ["lieferbar", "vorraetig"], ["vorhanden", "vorraetig"], ["lieferbar", "verfuegbar"], ["verfuegbar", "vorhanden"], ["lieferbar", "vorhanden"], ["linksgerichtet", "sozialistisch"], ["linksgerichtet", "linksorientiert"], ["linksgerichtet", "rot"], ["links", "linksgerichtet"], ["kommunistisch", "linksgerichtet"], ["linksorientiert", "sozialistisch"], ["rot", "sozialistisch"], ["links", "sozialistisch"], ["kommunistisch", "sozialistisch"], ["linksorientiert", "rot"], ["links", "linksorientiert"], ["kommunistisch", "linksorientiert"], ["links", "rot"], ["kommunistisch", "rot"], ["kommunistisch", "links"], ["aktivieren", "ansetzen"], ["illustrierte", "journal"], ["freizeitzeitschrift", "journal"], ["journal", "magazin"], ["journal", "zeitschrift"], ["journal", "publikumszeitschrift"], ["freizeitzeitschrift", "illustrierte"], ["illustrierte", "magazin"], ["illustrierte", "zeitschrift"], ["illustrierte", "publikumszeitschrift"], ["freizeitzeitschrift", "magazin"], ["freizeitzeitschrift", "zeitschrift"], ["freizeitzeitschrift", "publikumszeitschrift"], ["magazin", "zeitschrift"], ["magazin", "publikumszeitschrift"], ["publikumszeitschrift", "zeitschrift"], ["leicht", "trefflich"], ["durchaus", "trefflich"], ["locker", "trefflich"], ["durchaus", "leicht"], ["leicht", "locker"], ["durchaus", "locker"], ["obacht", "vorsichtig"], ["obacht", "vorsicht"], ["achtung", "obacht"], ["aufpassen", "obacht"], ["aufgepasst", "obacht"], ["vorsicht", "vorsichtig"], ["achtung", "vorsichtig"], ["aufpassen", "vorsichtig"], ["aufgepasst", "vorsichtig"], ["achtung", "vorsicht"], ["aufpassen", "vorsicht"], ["aufgepasst", "vorsicht"], ["achtung", "aufpassen"], ["achtung", "aufgepasst"], ["aufgepasst", "aufpassen"], ["verfuegbar", "verfuegenueber"], ["verfuegenueber", "vorhanden"], ["merklich", "sichtlich"], ["deutlich", "merklich"], ["merklich", "spuerbar"], ["erkennbar", "merklich"], ["ersichtlich", "merklich"], ["deutlich", "sichtlich"], ["sichtlich", "spuerbar"], ["erkennbar", "sichtlich"], ["ersichtlich", "sichtlich"], ["deutlich", "spuerbar"], ["deutlich", "erkennbar"], ["deutlich", "ersichtlich"], ["erkennbar", "spuerbar"], ["ersichtlich", "spuerbar"], ["erkennbar", "ersichtlich"], ["fuehlbar", "wahrnehmbar"], ["spuerbar", "wahrnehmbar"], ["hinhauen", "langen"], ["hinhauen", "passen"], ["hinhauen", "reichen"], ["hinhauen", "hinkommen"], ["langen", "passen"], ["passen", "reichen"], ["hinkommen", "passen"], ["leit", "prominent"], ["hervorgehoben", "prominent"], ["herausragend", "prominent"], ["prominent", "wichtig"], ["hervorgehoben", "leit"], ["herausragend", "leit"], ["leit", "wichtig"], ["herausragend", "hervorgehoben"], ["hervorgehoben", "wichtig"], ["herausragend", "wichtig"], ["gesetzt", "weise"], ["vernuenftig", "weise"], ["abgeklaert", "weise"], ["reif", "weise"], ["gesetzt", "vernuenftig"], ["abgeklaert", "gesetzt"], ["abgeklaert", "vernuenftig"], ["reif", "vernuenftig"], ["abgeklaert", "reif"], ["granden", "persoenlichkeit"], ["granden", "schwergewicht"], ["granden", "instanz"], ["granden", "grosse"], ["granden", "grosser"], ["faktor", "granden"], ["entscheider", "granden"], ["persoenlichkeit", "schwergewicht"], ["instanz", "persoenlichkeit"], ["grosse", "persoenlichkeit"], ["grosser", "persoenlichkeit"], ["faktor", "persoenlichkeit"], ["entscheider", "persoenlichkeit"], ["instanz", "schwergewicht"], ["grosse", "schwergewicht"], ["grosser", "schwergewicht"], ["faktor", "schwergewicht"], ["entscheider", "schwergewicht"], ["grosse", "instanz"], ["grosser", "instanz"], ["faktor", "instanz"], ["entscheider", "instanz"], ["grosse", "grosser"], ["faktor", "grosse"], ["entscheider", "grosse"], ["faktor", "grosser"], ["entscheider", "grosser"], ["entscheider", "faktor"], ["abgenommen", "gebilligt"], ["abgesegnet", "gebilligt"], ["approbiert", "gebilligt"], ["gebilligt", "genehmigt"], ["autorisiert", "gebilligt"], ["gebilligt", "gutgeheissen"], ["freigegeben", "gebilligt"], ["abgenommen", "abgesegnet"], ["abgenommen", "approbiert"], ["abgenommen", "genehmigt"], ["abgenommen", "autorisiert"], ["abgenommen", "gutgeheissen"], ["abgenommen", "freigegeben"], ["abgesegnet", "approbiert"], ["abgesegnet", "genehmigt"], ["abgesegnet", "autorisiert"], ["abgesegnet", "gutgeheissen"], ["abgesegnet", "freigegeben"], ["approbiert", "genehmigt"], ["approbiert", "autorisiert"], ["approbiert", "gutgeheissen"], ["approbiert", "freigegeben"], ["autorisiert", "genehmigt"], ["genehmigt", "gutgeheissen"], ["freigegeben", "genehmigt"], ["autorisiert", "gutgeheissen"], ["autorisiert", "freigegeben"], ["freigegeben", "gutgeheissen"], ["bilden", "sein"], ["bedeuten", "bilden"], ["bilden", "gleichkommen"], ["bilden", "darstellen"], ["bedeuten", "sein"], ["gleichkommen", "sein"], ["bedeuten", "gleichkommen"], ["bedeuten", "darstellen"], ["darstellen", "gleichkommen"], ["stoerung", "unterbrechung"], ["lieber", "sollte"], ["besser", "sollte"], ["grundlage", "grundwortschatz"], ["basis", "grundwortschatz"], ["grundwortschatz", "kanon"], ["fundament", "grundwortschatz"], ["abc", "grundwortschatz"], ["basis", "grundlage"], ["grundlage", "kanon"], ["fundament", "grundlage"], ["abc", "grundlage"], ["basis", "kanon"], ["abc", "basis"], ["fundament", "kanon"], ["abc", "kanon"], ["abc", "fundament"], ["kategorie", "raster"], ["raster", "schablone"], ["muster", "raster"], ["raster", "syndrom"], ["raster", "schublade"], ["kategorie", "schablone"], ["kategorie", "muster"], ["kategorie", "syndrom"], ["kategorie", "schublade"], ["muster", "schablone"], ["schablone", "syndrom"], ["schablone", "schublade"], ["muster", "syndrom"], ["muster", "schublade"], ["schublade", "syndrom"], ["loesen", "weichen"], ["verschwinden", "weichen"], ["weggehen", "weichen"], ["loesen", "verschwinden"], ["loesen", "weggehen"], ["verschwinden", "weggehen"], ["zerschneiden", "zerteilen"], ["zerlegen", "zerschneiden"], ["tranchieren", "zerschneiden"], ["aufschneiden", "zerschneiden"], ["zerlegen", "zerteilen"], ["tranchieren", "zerteilen"], ["aufschneiden", "zerteilen"], ["tranchieren", "zerlegen"], ["aufschneiden", "zerlegen"], ["aufschneiden", "tranchieren"], ["anfang", "einbruch"], ["anbruch", "einbruch"], ["einbruch", "startschuss"], ["einbruch", "start"], ["beginn", "einbruch"], ["anbruch", "anfang"], ["anfang", "startschuss"], ["anfang", "start"], ["anfang", "beginn"], ["anbruch", "startschuss"], ["anbruch", "start"], ["start", "startschuss"], ["beginn", "startschuss"], ["beginn", "start"], ["sein", "weilen"], ["befinden", "weilen"], ["aufhalten", "weilen"], ["verbringen", "weilen"], ["stecken", "weilen"], ["befinden", "sein"], ["aufhalten", "sein"], ["sein", "verbringen"], ["sein", "stecken"], ["aufhalten", "befinden"], ["befinden", "verbringen"], ["befinden", "stecken"], ["aufhalten", "verbringen"], ["aufhalten", "stecken"], ["stecken", "verbringen"], ["andere", "neu"], ["neu", "ungewoehnlich"], ["fremd", "neu"], ["gewoehnungsbeduerftig", "neu"], ["andersartig", "neu"], ["neu", "ungewohnt"], ["anders", "neu"], ["andere", "ungewoehnlich"], ["andere", "fremd"], ["andere", "gewoehnungsbeduerftig"], ["andere", "andersartig"], ["andere", "ungewohnt"], ["andere", "anders"], ["fremd", "ungewoehnlich"], ["gewoehnungsbeduerftig", "ungewoehnlich"], ["andersartig", "ungewoehnlich"], ["ungewoehnlich", "ungewohnt"], ["anders", "ungewoehnlich"], ["fremd", "gewoehnungsbeduerftig"], ["andersartig", "fremd"], ["fremd", "ungewohnt"], ["anders", "fremd"], ["andersartig", "gewoehnungsbeduerftig"], ["gewoehnungsbeduerftig", "ungewohnt"], ["anders", "gewoehnungsbeduerftig"], ["andersartig", "ungewohnt"], ["anders", "andersartig"], ["anders", "ungewohnt"], ["beobachten", "observieren"], ["belauern", "beobachten"], ["belauern", "observieren"], ["observieren", "ueberwachen"], ["belauern", "ueberwachen"], ["abbruch", "schluss"], ["beendigung", "schluss"], ["einstellung", "schluss"], ["abbruch", "beendigung"], ["abbruch", "ende"], ["abbruch", "einstellung"], ["beendigung", "ende"], ["einstellung", "ende"], ["ausrichtung", "einstellung"], ["ausrichtung", "couleur"], ["couleur", "einstellung"], ["darauffolgende", "naechste"], ["darauffolgende", "folgende"], ["darauffolgende", "nachstehende"], ["anschliessende", "darauffolgende"], ["darauffolgende", "nachfolgende"], ["folgende", "naechste"], ["nachstehende", "naechste"], ["anschliessende", "naechste"], ["nachfolgende", "naechste"], ["folgende", "nachstehende"], ["anschliessende", "folgende"], ["folgende", "nachfolgende"], ["anschliessende", "nachstehende"], ["nachfolgende", "nachstehende"], ["anschliessende", "nachfolgende"], ["durch", "vorbei"], ["nach", "vorbei"], ["durch", "nach"], ["nehmen", "zugreifen"], ["nehmen", "zuschlagen"], ["nehmen", "zulangen"], ["bedienen", "nehmen"], ["zugreifen", "zulangen"], ["bedienen", "zugreifen"], ["zulangen", "zuschlagen"], ["bedienen", "zuschlagen"], ["bedienen", "zulangen"], ["nachfahren", "verfolgen"], ["hinterherfahren", "verfolgen"], ["folgen", "nachfahren"], ["hinterherfahren", "nachfahren"], ["folgen", "hinterherfahren"], ["cover", "titelbild"], ["titelbild", "titelseite"], ["deckblatt", "titelbild"], ["titelbild", "titelblatt"], ["titel", "titelbild"], ["cover", "titelseite"], ["cover", "deckblatt"], ["cover", "titelblatt"], ["cover", "titel"], ["deckblatt", "titelseite"], ["titelblatt", "titelseite"], ["titel", "titelseite"], ["deckblatt", "titelblatt"], ["deckblatt", "titel"], ["titel", "titelblatt"], ["massig", "viel"], ["etliches", "viel"], ["reichlich", "viel"], ["etliches", "massig"], ["massig", "reichlich"], ["etliches", "reichlich"], ["abheben", "hochkommen"], ["hochkommen", "starten"], ["abheben", "starten"], ["fahren", "schieben"], ["machen", "schieben"], ["leisten", "schieben"], ["ableisten", "schieben"], ["absolvieren", "schieben"], ["fahren", "machen"], ["ableisten", "fahren"], ["absolvieren", "fahren"], ["leisten", "machen"], ["ableisten", "machen"], ["absolvieren", "machen"], ["ableisten", "leisten"], ["absolvieren", "leisten"], ["ableisten", "absolvieren"], ["aufnahmestutzen", "rohrstueck"], ["aufnahmestutzen", "tuelle"], ["rohrstueck", "tuelle"], ["abspalten", "segregieren"], ["abspalten", "separieren"], ["abjungieren", "abspalten"], ["absondern", "abspalten"], ["abspalten", "isolieren"], ["abspalten", "sondern"], ["abspalten", "trennen"], ["segregieren", "separieren"], ["abjungieren", "segregieren"], ["absondern", "segregieren"], ["isolieren", "segregieren"], ["segregieren", "sondern"], ["segregieren", "trennen"], ["abjungieren", "separieren"], ["absondern", "separieren"], ["isolieren", "separieren"], ["separieren", "sondern"], ["separieren", "trennen"], ["abjungieren", "absondern"], ["abjungieren", "isolieren"], ["abjungieren", "sondern"], ["abjungieren", "trennen"], ["absondern", "isolieren"], ["absondern", "sondern"], ["absondern", "trennen"], ["isolieren", "sondern"], ["isolieren", "trennen"], ["sondern", "trennen"], ["noete", "schwierigkeiten"], ["probleme", "schwierigkeiten"], ["schwierigkeiten", "sorgen"], ["noete", "probleme"], ["noete", "sorgen"], ["probleme", "sorgen"], ["einfahren", "einziehen"], ["ausfahren", "hochfahren"], ["ausziehen", "hochfahren"], ["ausfahren", "ausziehen"], ["auf", "geoeffnet"], ["aufgesperrt", "geoeffnet"], ["geoeffnet", "offen"], ["aufgeklappt", "geoeffnet"], ["auf", "aufgeklappt"], ["aufgeklappt", "aufgesperrt"], ["aufgeklappt", "offen"], ["betreffen", "gelten"], ["angehen", "gelten"], ["gehen", "gelten"], ["betreffen", "gehen"], ["angehen", "gehen"], ["heiss", "scharf"], ["brennend", "scharf"], ["brennend", "heiss"], ["kern", "leit"], ["kern", "massgeblich"], ["haupt", "kern"], ["kern", "wesentlich"], ["bestimmend", "kern"], ["kern", "wichtigste"], ["dominant", "kern"], ["leit", "massgeblich"], ["haupt", "leit"], ["leit", "wesentlich"], ["bestimmend", "leit"], ["leit", "wichtigste"], ["dominant", "leit"], ["haupt", "massgeblich"], ["massgeblich", "wesentlich"], ["bestimmend", "massgeblich"], ["massgeblich", "wichtigste"], ["dominant", "massgeblich"], ["haupt", "wesentlich"], ["bestimmend", "haupt"], ["haupt", "wichtigste"], ["dominant", "haupt"], ["bestimmend", "wesentlich"], ["wesentlich", "wichtigste"], ["dominant", "wesentlich"], ["bestimmend", "wichtigste"], ["bestimmend", "dominant"], ["dominant", "wichtigste"], ["episode", "fortsetzung"], ["fortsetzung", "sequel"], ["fortsetzung", "weiterfuehrung"], ["episode", "sequel"], ["episode", "weiterfuehrung"], ["sequel", "weiterfuehrung"], ["festhalten", "nehmen"], ["festhalten", "greifen"], ["festhalten", "schnappen"], ["fassen", "festhalten"], ["ergreifen", "festhalten"], ["festhalten", "packen"], ["greifen", "nehmen"], ["nehmen", "schnappen"], ["fassen", "nehmen"], ["ergreifen", "nehmen"], ["nehmen", "packen"], ["greifen", "schnappen"], ["fassen", "greifen"], ["ergreifen", "greifen"], ["greifen", "packen"], ["fassen", "schnappen"], ["ergreifen", "schnappen"], ["packen", "schnappen"], ["ergreifen", "fassen"], ["fassen", "packen"], ["ergreifen", "packen"], ["fluktuieren", "wechseln"], ["flottieren", "wechseln"], ["schwanken", "wechseln"], ["fluktuieren", "veraendern"], ["flottieren", "veraendern"], ["schwanken", "veraendern"], ["flottieren", "fluktuieren"], ["fluktuieren", "schwanken"], ["flottieren", "schwanken"], ["gefaellig", "zusagen"], ["kommod", "zusagen"], ["willkommen", "zusagen"], ["passen", "zusagen"], ["konvenieren", "zusagen"], ["passend", "zusagen"], ["entgegenkommen", "zusagen"], ["gefaellig", "kommod"], ["gefaellig", "willkommen"], ["gefaellig", "passen"], ["gefaellig", "konvenieren"], ["gefaellig", "passend"], ["entgegenkommen", "gefaellig"], ["kommod", "willkommen"], ["kommod", "passen"], ["kommod", "konvenieren"], ["kommod", "passend"], ["entgegenkommen", "kommod"], ["passen", "willkommen"], ["konvenieren", "willkommen"], ["passend", "willkommen"], ["entgegenkommen", "willkommen"], ["konvenieren", "passen"], ["passen", "passend"], ["entgegenkommen", "passen"], ["konvenieren", "passend"], ["entgegenkommen", "konvenieren"], ["entgegenkommen", "passend"], ["aufbringen", "einbringen"], ["beginnen", "eroeffnen"], ["aufnehmen", "beginnen"], ["aufnehmen", "eroeffnen"], ["bezuschussen", "staerken"], ["staerken", "subventionieren"], ["foerdern", "staerken"], ["staerken", "unterstuetzen"], ["sponsern", "staerken"], ["bezuschussen", "subventionieren"], ["bezuschussen", "foerdern"], ["bezuschussen", "stuetzen"], ["bezuschussen", "unterstuetzen"], ["bezuschussen", "sponsern"], ["foerdern", "subventionieren"], ["stuetzen", "subventionieren"], ["subventionieren", "unterstuetzen"], ["sponsern", "subventionieren"], ["foerdern", "stuetzen"], ["foerdern", "unterstuetzen"], ["foerdern", "sponsern"], ["sponsern", "stuetzen"], ["sponsern", "unterstuetzen"], ["aufbewahrungsort", "lager"], ["depot", "lager"], ["ablage", "lager"], ["aufbewahrungsort", "depot"], ["ablage", "aufbewahrungsort"], ["ablage", "depot"], ["gesondert", "getrennt"], ["apart", "getrennt"], ["extra", "getrennt"], ["apart", "gesondert"], ["gesondert", "separat"], ["einzeln", "gesondert"], ["apart", "extra"], ["apart", "separat"], ["apart", "einzeln"], ["extra", "separat"], ["flutschen", "rutschen"], ["gleiten", "rutschen"], ["glitschen", "rutschen"], ["flutschen", "gleiten"], ["flutschen", "glitschen"], ["gleiten", "glitschen"], ["innerhalb", "intern"], ["inner", "innerhalb"], ["hausintern", "innerhalb"], ["inner", "intern"], ["hausintern", "intern"], ["hausintern", "inner"], ["kehrichtverbrennungsanlage", "muellverbrennungsanlage"], ["muellverbrennungsanlage", "mva"], ["kva", "muellverbrennungsanlage"], ["kehrichtverbrennungsanlage", "mva"], ["kehrichtverbrennungsanlage", "kva"], ["kva", "mva"], ["aussteigen", "nichtmitgehen"], ["aussteigen", "passen"], ["nichtmitgehen", "passen"], ["anlassen", "anschmeissen"], ["anmachen", "anschmeissen"], ["anschmeissen", "einschalten"], ["anschmeissen", "anstellen"], ["anlassen", "anwerfen"], ["anlassen", "anmachen"], ["anlassen", "starten"], ["anlassen", "einschalten"], ["anlassen", "anstellen"], ["anmachen", "anwerfen"], ["anwerfen", "einschalten"], ["anstellen", "anwerfen"], ["anmachen", "starten"], ["einschalten", "starten"], ["anstellen", "starten"], ["einschrauben", "hineinschrauben"], ["anschrauben", "hineinschrauben"], ["anschrauben", "einschrauben"], ["ausgehen", "daten"], ["fuer", "nacheinander"], ["nacheinander", "reihenweise"], ["fuer", "hintereinanderweg"], ["fuer", "reihenweise"], ["fuer", "hintereinander"], ["hintereinanderweg", "reihenweise"], ["hintereinander", "reihenweise"], ["geregelt", "kontrolliert"], ["kontrolliert", "kriteriengesteuert"], ["geregelt", "kriteriengesteuert"], ["abziehen", "berauben"], ["abziehen", "wegnehmen"], ["abnehmen", "abziehen"], ["abziehen", "rauben"], ["abziehen", "entreissen"], ["abziehen", "wegreissen"], ["berauben", "wegnehmen"], ["abnehmen", "berauben"], ["berauben", "rauben"], ["berauben", "entreissen"], ["berauben", "wegreissen"], ["abnehmen", "wegnehmen"], ["rauben", "wegnehmen"], ["entreissen", "wegnehmen"], ["wegnehmen", "wegreissen"], ["abnehmen", "rauben"], ["abnehmen", "entreissen"], ["abnehmen", "wegreissen"], ["entreissen", "rauben"], ["rauben", "wegreissen"], ["entreissen", "wegreissen"], ["ecke", "knoten"], ["ausstattung", "versorgung"], ["ausstattung", "zuwendung"], ["ausstattung", "dotation"], ["versorgung", "zuwendung"], ["dotation", "versorgung"], ["dotation", "zuwendung"], ["betraechtlich", "weitaus"], ["bedeutend", "weitaus"], ["erheblich", "weitaus"], ["viel", "weitaus"], ["weit", "weitaus"], ["bedeutend", "betraechtlich"], ["betraechtlich", "erheblich"], ["betraechtlich", "viel"], ["betraechtlich", "weit"], ["bedeutend", "erheblich"], ["bedeutend", "viel"], ["bedeutend", "weit"], ["erheblich", "viel"], ["erheblich", "weit"], ["viel", "weit"], ["daherkommen", "darstellen"], ["daherkommen", "praesentieren"], ["daherkommen", "zeigen"], ["grundfarbe", "grundierung"], ["grundfarbe", "primer"], ["grundierung", "primer"], ["plus", "positiv"], ["bestehen", "fortbestehen"], ["fortbestehen", "halten"], ["bestehen", "halten"], ["boeswillig", "sauber"], ["gemein", "sauber"], ["boesartig", "sauber"], ["boese", "sauber"], ["sauber", "uebel"], ["fies", "sauber"], ["sauber", "schlecht"], ["boeswillig", "gemein"], ["boesartig", "boeswillig"], ["boese", "boeswillig"], ["boeswillig", "uebel"], ["boeswillig", "fies"], ["boeswillig", "schlecht"], ["boesartig", "gemein"], ["boese", "gemein"], ["gemein", "uebel"], ["fies", "gemein"], ["gemein", "schlecht"], ["boesartig", "boese"], ["boesartig", "uebel"], ["boesartig", "fies"], ["boesartig", "schlecht"], ["boese", "uebel"], ["boese", "fies"], ["boese", "schlecht"], ["fies", "uebel"], ["fies", "schlecht"], ["glatt", "klar"], ["eindeutig", "glatt"], ["beleg", "fundstelle"], ["fundstelle", "referenz"], ["allegat", "fundstelle"], ["fundstelle", "quellennachweis"], ["fundstelle", "quellenangabe"], ["fundstelle", "literaturangabe"], ["beleg", "referenz"], ["allegat", "beleg"], ["beleg", "quellennachweis"], ["beleg", "quellenangabe"], ["beleg", "literaturangabe"], ["allegat", "referenz"], ["quellennachweis", "referenz"], ["quellenangabe", "referenz"], ["literaturangabe", "referenz"], ["allegat", "quellennachweis"], ["allegat", "quellenangabe"], ["allegat", "literaturangabe"], ["quellenangabe", "quellennachweis"], ["literaturangabe", "quellennachweis"], ["literaturangabe", "quellenangabe"], ["gleich", "sofort"], ["gleich", "nachher"], ["nachher", "wartekurz"], ["moment", "nachher"], ["momentchen", "nachher"], ["nachher", "sekunde"], ["gleich", "wartekurz"], ["gleich", "moment"], ["gleich", "momentchen"], ["gleich", "sekunde"], ["moment", "wartekurz"], ["momentchen", "wartekurz"], ["sekunde", "wartekurz"], ["moment", "momentchen"], ["moment", "sekunde"], ["momentchen", "sekunde"], ["aufbrechen", "ausruecken"], ["abmarschieren", "aufbrechen"], ["aufbrechen", "ausfahren"], ["abmarschieren", "ausruecken"], ["ausfahren", "ausruecken"], ["abmarschieren", "ausfahren"], ["geschlagen", "voll"], ["ganz", "geschlagen"], ["ganz", "voll"], ["triumph", "volltreffer"], ["erfolg", "volltreffer"], ["leistung", "volltreffer"], ["durchbruch", "volltreffer"], ["treffer", "volltreffer"], ["heldentat", "volltreffer"], ["erfolg", "triumph"], ["leistung", "triumph"], ["durchbruch", "triumph"], ["treffer", "triumph"], ["heldentat", "triumph"], ["erfolg", "leistung"], ["durchbruch", "erfolg"], ["erfolg", "treffer"], ["erfolg", "heldentat"], ["durchbruch", "leistung"], ["leistung", "treffer"], ["heldentat", "leistung"], ["durchbruch", "treffer"], ["durchbruch", "heldentat"], ["heldentat", "treffer"], ["ueppig", "voll"], ["dicht", "ueppig"], ["dicht", "voll"], ["amtseinfuehrung", "inauguration"], ["amtseinfuehrung", "besetzung"], ["amtseinfuehrung", "einsetzung"], ["amtseinfuehrung", "amtseinsetzung"], ["amtseinfuehrung", "investitur"], ["amtseinfuehrung", "installation"], ["amtseinfuehrung", "einfuehrung"], ["besetzung", "inauguration"], ["einsetzung", "inauguration"], ["amtseinsetzung", "inauguration"], ["inauguration", "investitur"], ["inauguration", "installation"], ["einfuehrung", "inauguration"], ["besetzung", "einsetzung"], ["amtseinsetzung", "besetzung"], ["besetzung", "investitur"], ["besetzung", "installation"], ["besetzung", "einfuehrung"], ["amtseinsetzung", "einsetzung"], ["einsetzung", "investitur"], ["einsetzung", "installation"], ["einfuehrung", "einsetzung"], ["amtseinsetzung", "investitur"], ["amtseinsetzung", "installation"], ["amtseinsetzung", "einfuehrung"], ["installation", "investitur"], ["einfuehrung", "investitur"], ["einfuehrung", "installation"], ["handhaben", "laufen"], ["handhaben", "verfahren"], ["laufen", "verfahren"], ["kennzahl", "softwaremetrik"], ["metrik", "softwaremetrik"], ["messgroesse", "softwaremetrik"], ["kennzahl", "metrik"], ["messgroesse", "metrik"], ["leicht", "spielend"], ["gaebig", "spielend"], ["muehelos", "spielend"], ["bequem", "spielend"], ["spielend", "unschwer"], ["einfach", "spielend"], ["gaebig", "leicht"], ["leicht", "muehelos"], ["bequem", "leicht"], ["leicht", "unschwer"], ["gaebig", "muehelos"], ["bequem", "gaebig"], ["gaebig", "unschwer"], ["einfach", "gaebig"], ["bequem", "muehelos"], ["muehelos", "unschwer"], ["einfach", "muehelos"], ["bequem", "unschwer"], ["bequem", "einfach"], ["einfach", "unschwer"], ["blaupause", "vorlage"], ["blaupause", "modell"], ["blaupause", "muster"], ["muster", "vorlage"], ["kontext", "rahmenbedingungen"], ["landschaft", "rahmenbedingungen"], ["rahmenbedingungen", "voraussetzungen"], ["rahmenbedingungen", "umfeld"], ["kontext", "landschaft"], ["kontext", "voraussetzungen"], ["kontext", "umfeld"], ["landschaft", "voraussetzungen"], ["landschaft", "umfeld"], ["umfeld", "voraussetzungen"], ["aktivposten", "plus"], ["aktivposten", "guthaben"], ["aktivposten", "haben"], ["guthaben", "plus"], ["haben", "plus"], ["guthaben", "haben"], ["bierchen", "schoppen"], ["bierchen", "humpen"], ["bierchen", "mass"], ["bierchen", "halbe"], ["bier", "bierchen"], ["humpen", "schoppen"], ["mass", "schoppen"], ["halbe", "schoppen"], ["bier", "schoppen"], ["humpen", "mass"], ["halbe", "humpen"], ["bier", "humpen"], ["halbe", "mass"], ["bier", "mass"], ["bier", "halbe"], ["kennzeichenbeleuchtung", "kontrollschildbeleuchtung"], ["kennzeichenleuchte", "kontrollschildbeleuchtung"], ["kennzeichenbeleuchtung", "kennzeichenleuchte"], ["einige", "gut"], ["gegebenenfalls", "moeglicherweise"], ["eventuell", "gegebenenfalls"], ["gegebenenfalls", "moeglich"], ["denkbar", "gegebenenfalls"], ["etwaig", "gegebenenfalls"], ["allfaellig", "gegebenenfalls"], ["eventuell", "moeglicherweise"], ["denkbar", "moeglicherweise"], ["etwaig", "moeglicherweise"], ["allfaellig", "moeglicherweise"], ["eventuell", "moeglich"], ["denkbar", "eventuell"], ["etwaig", "eventuell"], ["allfaellig", "eventuell"], ["denkbar", "moeglich"], ["etwaig", "moeglich"], ["allfaellig", "moeglich"], ["denkbar", "etwaig"], ["allfaellig", "denkbar"], ["allfaellig", "etwaig"], ["entlastet", "erloest"], ["entlastet", "heilfroh"], ["entlastet", "erleichtert"], ["befreit", "entlastet"], ["erloest", "heilfroh"], ["erleichtert", "erloest"], ["befreit", "erloest"], ["erleichtert", "heilfroh"], ["befreit", "heilfroh"], ["befreit", "erleichtert"], ["eingraben", "einsetzen"], ["eingraben", "einpflanzen"], ["eingraben", "setzen"], ["eingraben", "pflanzen"], ["einpflanzen", "einsetzen"], ["einsetzen", "setzen"], ["einsetzen", "pflanzen"], ["einpflanzen", "setzen"], ["einpflanzen", "pflanzen"], ["pflanzen", "setzen"], ["anpflanzen", "kultivieren"], ["kultivieren", "ziehen"], ["anbauen", "kultivieren"], ["anpflanzen", "ziehen"], ["anbauen", "anpflanzen"], ["anbauen", "ziehen"], ["autobahnknoten", "verzweigung"], ["autobahndreieck", "verzweigung"], ["knoten", "verzweigung"], ["dreieck", "verzweigung"], ["autobahndreieck", "autobahnknoten"], ["autobahnknoten", "dreieck"], ["autobahndreieck", "knoten"], ["autobahndreieck", "dreieck"], ["dreieck", "knoten"], ["dutzende", "zahlreiche"], ["reichlich", "zahlreiche"], ["vielzahl", "zahlreiche"], ["viele", "zahlreiche"], ["dutzende", "reichlich"], ["dutzende", "vielzahl"], ["dutzende", "viele"], ["reichlich", "vielzahl"], ["reichlich", "viele"], ["viele", "vielzahl"], ["beherbergen", "umfassen"], ["umfassen", "unterbringen"], ["aufnehmen", "umfassen"], ["enthalten", "umfassen"], ["beherbergen", "enthalten"], ["enthalten", "unterbringen"], ["aufnehmen", "enthalten"], ["normal", "normalbenzin"], ["freimachen", "freischaufeln"], ["freilegen", "freimachen"], ["freilegen", "freischaufeln"], ["feilhalten", "fuehren"], ["fuehren", "verkaufen"], ["dahaben", "fuehren"], ["fuehren", "liefern"], ["feilhalten", "verkaufen"], ["dahaben", "feilhalten"], ["feilhalten", "liefern"], ["dahaben", "verkaufen"], ["liefern", "verkaufen"], ["dahaben", "liefern"], ["staerker", "ueber"], ["davonlaufen", "staerker"], ["besser", "staerker"], ["staerker", "ueberlegen"], ["enteilen", "staerker"], ["davonlaufen", "ueber"], ["besser", "ueber"], ["ueber", "ueberlegen"], ["enteilen", "ueber"], ["besser", "davonlaufen"], ["davonlaufen", "ueberlegen"], ["davonlaufen", "enteilen"], ["besser", "ueberlegen"], ["besser", "enteilen"], ["enteilen", "ueberlegen"], ["sicher", "souveraen"], ["gelassen", "souveraen"], ["souveraen", "ueberlegen"], ["locker", "souveraen"], ["gelassen", "sicher"], ["sicher", "ueberlegen"], ["locker", "sicher"], ["gelassen", "ueberlegen"], ["gelassen", "locker"], ["locker", "ueberlegen"], ["capstan", "tonwelle"], ["erleben", "haben"], ["erfahren", "haben"], ["haben", "sein"], ["erfahren", "erleben"], ["erleben", "sein"], ["erfahren", "sein"], ["brauchen", "dauern"], ["dauern", "erstrecken"], ["dauern", "erfordern"], ["dauern", "waehren"], ["dauern", "gehen"], ["brauchen", "erstrecken"], ["brauchen", "waehren"], ["brauchen", "gehen"], ["erfordern", "erstrecken"], ["erstrecken", "waehren"], ["erstrecken", "gehen"], ["erfordern", "waehren"], ["erfordern", "gehen"], ["gehen", "waehren"], ["gehoeren", "kommen"], ["gehoeren", "zaehlen"], ["gehoeren", "unterfallen"], ["fallen", "gehoeren"], ["gehoeren", "rangieren"], ["unterfallen", "zaehlen"], ["fallen", "zaehlen"], ["rangieren", "zaehlen"], ["fallen", "unterfallen"], ["rangieren", "unterfallen"], ["fallen", "rangieren"], ["einzelsprache", "sprache"], ["sprache", "zunge"], ["einzelsprache", "zunge"], ["davon", "deren"], ["deren", "ihrer"], ["davon", "ihrer"], ["deren", "ihr"], ["dessen", "sein"], ["schlagwort", "zusatzinformation"], ["auszeichnung", "schlagwort"], ["etikett", "schlagwort"], ["markup", "schlagwort"], ["kennzeichnung", "schlagwort"], ["schlagwort", "tag"], ["auszeichnung", "zusatzinformation"], ["etikett", "zusatzinformation"], ["markup", "zusatzinformation"], ["kennzeichnung", "zusatzinformation"], ["tag", "zusatzinformation"], ["auszeichnung", "etikett"], ["auszeichnung", "markup"], ["auszeichnung", "kennzeichnung"], ["auszeichnung", "tag"], ["etikett", "markup"], ["etikett", "kennzeichnung"], ["etikett", "tag"], ["kennzeichnung", "markup"], ["markup", "tag"], ["kennzeichnung", "tag"], ["helfen", "unterstuetzen"], ["betreuen", "helfen"], ["helfen", "versorgen"], ["helfen", "sichkuemmern"], ["betreuen", "unterstuetzen"], ["unterstuetzen", "versorgen"], ["sichkuemmern", "unterstuetzen"], ["betreuen", "versorgen"], ["betreuen", "sichkuemmern"], ["sichkuemmern", "versorgen"], ["und", "zunehmend"], ["immer", "zunehmend"], ["immer", "und"], ["abfaerben", "haben"], ["haben", "uebernehmen"], ["abbekommen", "haben"], ["erben", "haben"], ["haben", "uebertragen"], ["abfaerben", "uebernehmen"], ["abbekommen", "abfaerben"], ["abfaerben", "erben"], ["abfaerben", "uebertragen"], ["abbekommen", "uebernehmen"], ["erben", "uebernehmen"], ["uebernehmen", "uebertragen"], ["abbekommen", "erben"], ["abbekommen", "uebertragen"], ["erben", "uebertragen"], ["ausnahmslos", "stets"], ["stets", "unbedingt"], ["ausnahmslos", "unbedingt"], ["fertig", "vorbereitet"], ["gekennzeichnet", "markiert"], ["beschildert", "markiert"], ["ausgeschildert", "markiert"], ["beschildert", "gekennzeichnet"], ["ausgeschildert", "gekennzeichnet"], ["ausgeschildert", "beschildert"], ["einfach", "nur"], ["getrost", "locker"], ["getrost", "ruhig"], ["einfach", "getrost"], ["locker", "ruhig"], ["einfach", "locker"], ["einfach", "ruhig"], ["latuechte", "licht"], ["lampe", "licht"], ["leuchte", "licht"], ["lampe", "latuechte"], ["latuechte", "leuchte"], ["lampe", "leuchte"], ["mehr", "zusaetzliche"], ["mehr", "weitere"], ["coup", "handstreich"], ["coup", "schlag"], ["coup", "operation"], ["handstreich", "schlag"], ["handstreich", "operation"], ["operation", "schlag"], ["sein", "zieren"], ["sein", "stehen"], ["stehen", "zieren"], ["andere", "gegenueber"], ["folge", "kette"], ["folge", "serie"], ["folge", "rattenschwanz"], ["folge", "sequenz"], ["abfolge", "kette"], ["abfolge", "serie"], ["abfolge", "rattenschwanz"], ["abfolge", "sequenz"], ["aufeinanderfolge", "kette"], ["kette", "serie"], ["kette", "reihe"], ["kette", "rattenschwanz"], ["kette", "sequenz"], ["aufeinanderfolge", "serie"], ["aufeinanderfolge", "rattenschwanz"], ["aufeinanderfolge", "sequenz"], ["reihe", "serie"], ["rattenschwanz", "serie"], ["sequenz", "serie"], ["rattenschwanz", "reihe"], ["reihe", "sequenz"], ["rattenschwanz", "sequenz"], ["werkzeug", "werkzeuge"], ["gezaehe", "werkzeug"], ["gezaehe", "werkzeuge"], ["reagieren", "wirken"], ["ansprechen", "wirken"], ["verfangen", "wirken"], ["anspringen", "wirken"], ["wirken", "ziehen"], ["einsteigen", "wirken"], ["ansprechen", "reagieren"], ["reagieren", "verfangen"], ["anspringen", "reagieren"], ["reagieren", "ziehen"], ["einsteigen", "reagieren"], ["ansprechen", "verfangen"], ["ansprechen", "anspringen"], ["ansprechen", "ziehen"], ["ansprechen", "einsteigen"], ["anspringen", "verfangen"], ["verfangen", "ziehen"], ["einsteigen", "verfangen"], ["anspringen", "ziehen"], ["anspringen", "einsteigen"], ["einsteigen", "ziehen"], ["arbeit", "hausarbeit"], ["darstellung", "hausarbeit"], ["hausarbeit", "referat"], ["arbeit", "darstellung"], ["arbeit", "referat"], ["darstellung", "referat"], ["frei", "ueberschuessig"], ["frei", "zusaetzlich"], ["ueberschuessig", "zusaetzlich"], ["blockiert", "dicht"], ["ablegen", "hinlegen"], ["hinlegen", "legen"], ["ablegen", "legen"], ["aufstellen", "postieren"], ["hinstellen", "postieren"], ["platzieren", "postieren"], ["postieren", "stellen"], ["aufstellen", "hinstellen"], ["aufstellen", "platzieren"], ["aufstellen", "stellen"], ["hinstellen", "stellen"], ["karg", "klein"], ["gering", "karg"], ["karg", "schmal"], ["karg", "wenig"], ["klein", "schmal"], ["klein", "wenig"], ["gering", "schmal"], ["schmal", "wenig"], ["gesichert", "glaubwuerdig"], ["gesichert", "sicher"], ["gesichert", "verlaesslich"], ["gesichert", "unzweifelhaft"], ["gesichert", "zweifelsfrei"], ["belastbar", "glaubwuerdig"], ["belastbar", "sicher"], ["belastbar", "verlaesslich"], ["belastbar", "unzweifelhaft"], ["belastbar", "zweifelsfrei"], ["glaubwuerdig", "sicher"], ["glaubwuerdig", "verlaesslich"], ["glaubwuerdig", "unzweifelhaft"], ["glaubwuerdig", "zweifelsfrei"], ["sicher", "verlaesslich"], ["sicher", "unzweifelhaft"], ["sicher", "zweifelsfrei"], ["unzweifelhaft", "verlaesslich"], ["verlaesslich", "zweifelsfrei"], ["unzweifelhaft", "zweifelsfrei"], ["beschreiben", "schildern"], ["beschreiben", "wiedergeben"], ["beschreiben", "erlaeutern"], ["beschreiben", "dartun"], ["schildern", "wiedergeben"], ["erlaeutern", "schildern"], ["darlegen", "schildern"], ["ausfuehren", "schildern"], ["darstellen", "schildern"], ["dartun", "schildern"], ["erlaeutern", "wiedergeben"], ["darlegen", "wiedergeben"], ["ausfuehren", "wiedergeben"], ["darstellen", "wiedergeben"], ["dartun", "wiedergeben"], ["darlegen", "erlaeutern"], ["ausfuehren", "erlaeutern"], ["darstellen", "erlaeutern"], ["dartun", "erlaeutern"], ["darlegen", "dartun"], ["ausfuehren", "dartun"], ["darstellen", "dartun"], ["markierstift", "signal"], ["markierstift", "textmarker"], ["marker", "markierstift"], ["leuchtstift", "markierstift"], ["signal", "textmarker"], ["marker", "signal"], ["leuchtstift", "signal"], ["marker", "textmarker"], ["leuchtstift", "textmarker"], ["leuchtstift", "marker"], ["scharf", "verschaerft"], ["eingehend", "scharf"], ["scharf", "viel"], ["intensiv", "scharf"], ["gruendlich", "scharf"], ["eingehend", "verschaerft"], ["verschaerft", "viel"], ["intensiv", "verschaerft"], ["gruendlich", "verschaerft"], ["eingehend", "viel"], ["eingehend", "intensiv"], ["intensiv", "viel"], ["gruendlich", "viel"], ["gruendlich", "intensiv"], ["anders", "sonst"], ["deklarieren", "titulieren"], ["nennen", "titulieren"], ["apostrophieren", "titulieren"], ["heissen", "titulieren"], ["deklarieren", "nennen"], ["apostrophieren", "deklarieren"], ["deklarieren", "heissen"], ["apostrophieren", "nennen"], ["heissen", "nennen"], ["apostrophieren", "heissen"], ["darob", "deswegen"], ["darob", "deshalb"], ["daher", "darob"], ["darob", "darum"], ["deshalb", "deswegen"], ["daher", "deswegen"], ["darum", "deswegen"], ["daher", "deshalb"], ["darum", "deshalb"], ["daher", "darum"], ["material", "stoff"], ["gut", "stoff"], ["gut", "material"], ["anhalten", "stehenbleiben"], ["halten", "stehenbleiben"], ["bremsen", "stehenbleiben"], ["stehenbleiben", "stoppen"], ["haltmachen", "stehenbleiben"], ["anhalten", "halten"], ["anhalten", "bremsen"], ["anhalten", "stoppen"], ["anhalten", "haltmachen"], ["bremsen", "halten"], ["halten", "stoppen"], ["halten", "haltmachen"], ["bremsen", "stoppen"], ["bremsen", "haltmachen"], ["haltmachen", "stoppen"], ["verlangsamen", "verzoegern"], ["hemmen", "verlangsamen"], ["bremsen", "verzoegern"], ["bremsen", "hemmen"], ["hemmen", "verzoegern"], ["montiereisen", "montierhebel"], ["montiereisen", "reifenheber"], ["montierhebel", "reifenheber"], ["substantiell", "umfangreich"], ["gross", "umfangreich"], ["beachtlich", "umfangreich"], ["nennenswert", "umfangreich"], ["bedeutend", "umfangreich"], ["erheblich", "umfangreich"], ["gross", "substantiell"], ["beachtlich", "substantiell"], ["nennenswert", "substantiell"], ["bedeutend", "substantiell"], ["erheblich", "substantiell"], ["beachtlich", "gross"], ["gross", "nennenswert"], ["bedeutend", "gross"], ["erheblich", "gross"], ["beachtlich", "nennenswert"], ["beachtlich", "bedeutend"], ["beachtlich", "erheblich"], ["bedeutend", "nennenswert"], ["erheblich", "nennenswert"], ["unterscheiden", "variieren"], ["geteilt", "unterscheiden"], ["geteilt", "variieren"], ["massgebend", "massgeblich"], ["massgeblich", "sehr"], ["entscheidend", "massgeblich"], ["massgebend", "sehr"], ["massgebend", "wesentlich"], ["entscheidend", "massgebend"], ["sehr", "wesentlich"], ["entscheidend", "sehr"], ["entscheidend", "wesentlich"], ["hinterherschleichen", "nachspionieren"], ["hinterherschleichen", "nachschleichen"], ["hinterherschleichen", "nachsteigen"], ["hinterherschleichen", "stalken"], ["hinterherschleichen", "nachstellen"], ["hinterherschleichen", "hinterherspionieren"], ["hinterherschleichen", "verfolgen"], ["nachschleichen", "nachspionieren"], ["nachspionieren", "nachsteigen"], ["nachspionieren", "stalken"], ["nachspionieren", "nachstellen"], ["hinterherspionieren", "nachspionieren"], ["nachspionieren", "verfolgen"], ["nachschleichen", "nachsteigen"], ["nachschleichen", "stalken"], ["nachschleichen", "nachstellen"], ["hinterherspionieren", "nachschleichen"], ["nachschleichen", "verfolgen"], ["nachsteigen", "stalken"], ["hinterherspionieren", "nachsteigen"], ["nachstellen", "stalken"], ["hinterherspionieren", "stalken"], ["stalken", "verfolgen"], ["hinterherspionieren", "nachstellen"], ["hinterherspionieren", "verfolgen"], ["reduziert", "schmalspur"], ["light", "reduziert"], ["abgespeckt", "schmalspur"], ["abgespeckt", "light"], ["light", "schmalspur"], ["einhalten", "halten"], ["translation", "uebersetzung"], ["uebersetzung", "uebertragung"], ["translation", "uebertragung"], ["translat", "uebertragung"], ["translat", "uebersetzung"], ["erziehen", "grossziehen"], ["grossziehen", "versorgen"], ["aufziehen", "erziehen"], ["aufziehen", "versorgen"], ["erziehen", "heranziehen"], ["erziehen", "versorgen"], ["heranziehen", "versorgen"], ["thema", "themenstrang"], ["erzaehlstrang", "themenstrang"], ["diskussionsfaden", "themenstrang"], ["themenstrang", "thread"], ["erzaehlstrang", "thema"], ["diskussionsfaden", "thema"], ["thema", "thread"], ["diskussionsfaden", "erzaehlstrang"], ["erzaehlstrang", "thread"], ["diskussionsfaden", "thread"], ["startsignal", "weckruf"], ["fanal", "startsignal"], ["startsignal", "warnsignal"], ["fanal", "weckruf"], ["warnsignal", "weckruf"], ["fanal", "warnsignal"], ["abschliessend", "zuletzt"], ["nichtswuerdiger", "null"], ["nichts", "nichtswuerdiger"], ["nichts", "null"], ["beschaedigen", "untergraben"], ["beschaedigen", "erschuettern"], ["beschaedigen", "schaden"], ["erschuettern", "untergraben"], ["schaden", "untergraben"], ["erschuettern", "schaden"], ["bestimmte", "manche"], ["manche", "spezielle"], ["gewisse", "manche"], ["bestimmte", "spezielle"], ["bestimmte", "gewisse"], ["gewisse", "spezielle"], ["fahrplan", "regie"], ["programm", "regie"], ["ablaufplan", "regie"], ["beistehen", "unterstuetzen"], ["beistehen", "halten"], ["halten", "unterstuetzen"], ["benehmen", "verhalten"], ["betragen", "verhalten"], ["benehmen", "betragen"], ["ausgepraegt", "heftig"], ["heftig", "intensiv"], ["heftig", "stark"], ["heftig", "kraeftig"], ["ausgepraegt", "intensiv"], ["ausgepraegt", "stark"], ["ausgepraegt", "kraeftig"], ["ausgepraegt", "scharf"], ["intensiv", "stark"], ["intensiv", "kraeftig"], ["scharf", "stark"], ["kraeftig", "scharf"], ["manche", "mehrere"], ["etwelche", "mehrere"], ["einige", "mehrere"], ["etwelche", "manche"], ["einige", "manche"], ["einige", "etwelche"], ["fahrzeugkatalysator", "katalysator"], ["fahrzeugkatalysator", "kat"], ["ergibt", "macht"], ["ergibt", "gibt"], ["ergibt", "ist"], ["ergibt", "sind"], ["gibt", "macht"], ["ist", "macht"], ["macht", "sind"], ["gibt", "ist"], ["gibt", "sind"], ["ist", "sind"], ["verorten", "zuordnen"], ["einordnen", "verorten"], ["lokalisieren", "verorten"], ["einordnen", "zuordnen"], ["lokalisieren", "zuordnen"], ["einordnen", "lokalisieren"], ["nichtsals", "rein"], ["einfach", "rein"], ["bloss", "rein"], ["nur", "rein"], ["einfach", "nichtsals"], ["bloss", "nichtsals"], ["nichtsals", "nur"], ["bloss", "einfach"], ["benannt", "bezeichnet"], ["benannt", "gekennzeichnet"], ["benamt", "benannt"], ["bezeichnet", "gekennzeichnet"], ["benamt", "bezeichnet"], ["benamt", "gekennzeichnet"], ["gekennzeichnet", "gezinkt"], ["gezinkt", "markiert"], ["erscheinungsform", "form"], ["ausrichtung", "erscheinungsform"], ["erscheinungsform", "observanz"], ["auspraegung", "erscheinungsform"], ["ausrichtung", "form"], ["form", "observanz"], ["auspraegung", "form"], ["ausrichtung", "observanz"], ["auspraegung", "ausrichtung"], ["auspraegung", "observanz"], ["schieben", "zurueckstellen"], ["verschieben", "zurueckstellen"], ["schieben", "verschieben"], ["aendern", "verschieben"], ["aendern", "verlegen"], ["aendern", "umswitchen"], ["aendern", "umlegen"], ["verlegen", "verschieben"], ["umswitchen", "verlegen"], ["umlegen", "verlegen"], ["umswitchen", "verschieben"], ["umlegen", "verschieben"], ["umlegen", "umswitchen"], ["sistieren", "zurueckstellen"], ["vertagen", "zurueckstellen"], ["unterbrechen", "zurueckstellen"], ["fristverlaengern", "zurueckstellen"], ["sistieren", "vertagen"], ["sistieren", "unterbrechen"], ["fristverlaengern", "sistieren"], ["unterbrechen", "vertagen"], ["fristverlaengern", "vertagen"], ["fristverlaengern", "unterbrechen"], ["herabbaumeln", "herabhaengen"], ["herabhaengen", "herunterbaumeln"], ["herabhaengen", "herunterpendeln"], ["herabhaengen", "herunterhaengen"], ["herabbaumeln", "herunterbaumeln"], ["herabbaumeln", "herunterpendeln"], ["herabbaumeln", "herunterhaengen"], ["herunterbaumeln", "herunterpendeln"], ["herunterbaumeln", "herunterhaengen"], ["herunterhaengen", "herunterpendeln"], ["einmal", "irgendwann"], ["einmal", "mal"], ["irgendwann", "mal"], ["egal", "und"], ["egal", "wennschon"], ["und", "wennschon"], ["vorsitzen", "vorstehen"], ["praesidieren", "vorstehen"], ["lenken", "vorstehen"], ["leiten", "vorstehen"], ["fuehren", "vorstehen"], ["praesidieren", "vorsitzen"], ["lenken", "vorsitzen"], ["leiten", "vorsitzen"], ["fuehren", "vorsitzen"], ["lenken", "praesidieren"], ["leiten", "praesidieren"], ["fuehren", "praesidieren"], ["auftreten", "performen"], ["auftreten", "praesentieren"], ["auftreten", "darstellen"], ["performen", "praesentieren"], ["darstellen", "performen"], ["akt", "werk"], ["werk", "zeichen"], ["akt", "zeichen"], ["ausrichtung", "flucht"], ["flucht", "fluchtlinie"], ["flucht", "linie"], ["flucht", "reihe"], ["ausrichtung", "fluchtlinie"], ["ausrichtung", "linie"], ["ausrichtung", "reihe"], ["fluchtlinie", "linie"], ["fluchtlinie", "reihe"], ["linie", "reihe"], ["behaupten", "trotzen"], ["behaupten", "durchsetzten"], ["behaupten", "bestehen"], ["ausrichten", "behaupten"], ["behaupten", "reissen"], ["durchsetzten", "trotzen"], ["bestehen", "trotzen"], ["ausrichten", "trotzen"], ["reissen", "trotzen"], ["bestehen", "durchsetzten"], ["ausrichten", "durchsetzten"], ["durchsetzten", "reissen"], ["ausrichten", "bestehen"], ["bestehen", "reissen"], ["ausrichten", "reissen"], ["eng", "scharf"], ["dicht", "scharf"], ["geladen", "scharf"], ["terminus", "wendung"], ["formulierung", "terminus"], ["ausdruck", "terminus"], ["formulierung", "wendung"], ["ausdruck", "wendung"], ["ausdruck", "formulierung"], ["keinerlei", "koa"], ["kein", "keinerlei"], ["keinerlei", "null"], ["kein", "koa"], ["koa", "null"], ["kein", "null"], ["ausdruecklich", "formell"], ["ausdruecklich", "gebuehrend"], ["ausdruecklich", "formgerecht"], ["formell", "gebuehrend"], ["formell", "formgerecht"], ["formgerecht", "gebuehrend"], ["heft", "nummer"], ["ausgabe", "nummer"], ["ausgabe", "heft"], ["indem", "wenn"], ["als", "indem"], ["indem", "wie"], ["als", "wenn"], ["wenn", "wie"], ["als", "wie"], ["mit", "zusammen"], ["begleitet", "mit"], ["begleitet", "zusammen"], ["auskragen", "vorkragen"], ["hervorstehen", "vorkragen"], ["vorkragen", "vorstehen"], ["ueberstehen", "vorkragen"], ["hervorragen", "vorkragen"], ["herausragen", "vorkragen"], ["herausgucken", "vorkragen"], ["auskragen", "hervorstehen"], ["auskragen", "vorstehen"], ["auskragen", "ueberstehen"], ["auskragen", "hervorragen"], ["auskragen", "herausragen"], ["auskragen", "herausgucken"], ["hervorstehen", "vorstehen"], ["hervorstehen", "ueberstehen"], ["hervorragen", "hervorstehen"], ["herausragen", "hervorstehen"], ["herausgucken", "hervorstehen"], ["ueberstehen", "vorstehen"], ["hervorragen", "vorstehen"], ["herausragen", "vorstehen"], ["herausgucken", "vorstehen"], ["hervorragen", "ueberstehen"], ["herausragen", "ueberstehen"], ["herausgucken", "ueberstehen"], ["herausragen", "hervorragen"], ["herausgucken", "hervorragen"], ["herausgucken", "herausragen"], ["entnehmen", "schlussfolgern"], ["entnehmen", "schliessen"], ["schliessen", "schlussfolgern"], ["auffuehren", "benehmen"], ["auffuehren", "leisten"], ["abziehen", "auffuehren"], ["benehmen", "leisten"], ["abziehen", "benehmen"], ["abziehen", "leisten"], ["ent", "weg"], ["davon", "weg"], ["fort", "weg"], ["davon", "ent"], ["ent", "fort"], ["davon", "fort"], ["abkratzen", "wegschaben"], ["abkratzen", "abschaben"], ["abkratzen", "kratzen"], ["abkratzen", "wegkratzen"], ["abschaben", "wegschaben"], ["kratzen", "wegschaben"], ["wegkratzen", "wegschaben"], ["abschaben", "kratzen"], ["abschaben", "wegkratzen"], ["kratzen", "wegkratzen"], ["ganze", "lediglich"], ["ganze", "nur"], ["noch", "umso"], ["umso", "zusaetzlich"], ["noch", "zusaetzlich"], ["abliefern", "bringen"], ["abliefern", "zeigen"], ["abliefern", "hinlegen"], ["bringen", "zeigen"], ["bringen", "hinlegen"], ["hinlegen", "zeigen"], ["ausrollen", "austreiben"], ["abschliessen", "eintueten"], ["eintueten", "fixieren"], ["eintueten", "finalisieren"], ["eintueten", "klarmachen"], ["abschliessen", "fixieren"], ["abschliessen", "finalisieren"], ["abschliessen", "klarmachen"], ["finalisieren", "fixieren"], ["fixieren", "klarmachen"], ["finalisieren", "klarmachen"], ["gehaltvoll", "stark"], ["gehaltvoll", "kraeftig"], ["durchspuelen", "spuelen"], ["ausspuelen", "spuelen"], ["ausspuelen", "durchspuelen"], ["feuchtigkeit", "naesse"], ["naesse", "nass"], ["feuchtigkeit", "nass"], ["kraeftig", "lebhaft"], ["kraeftig", "satt"], ["kraeftig", "strahlend"], ["kraeftig", "voll"], ["kraeftig", "leuchtend"], ["lebhaft", "stark"], ["satt", "stark"], ["stark", "strahlend"], ["stark", "voll"], ["leuchtend", "stark"], ["lebhaft", "satt"], ["intensiv", "lebhaft"], ["lebhaft", "strahlend"], ["lebhaft", "voll"], ["lebhaft", "leuchtend"], ["intensiv", "satt"], ["satt", "strahlend"], ["satt", "voll"], ["leuchtend", "satt"], ["intensiv", "strahlend"], ["intensiv", "voll"], ["intensiv", "leuchtend"], ["strahlend", "voll"], ["leuchtend", "strahlend"], ["leuchtend", "voll"], ["abmessung", "masse"], ["abmessung", "bauform"], ["abmessung", "formfaktor"], ["abmessung", "einbaugroesse"], ["abmessung", "baugroesse"], ["bauform", "masse"], ["formfaktor", "masse"], ["einbaugroesse", "masse"], ["baugroesse", "masse"], ["bauform", "formfaktor"], ["bauform", "einbaugroesse"], ["bauform", "baugroesse"], ["einbaugroesse", "formfaktor"], ["baugroesse", "formfaktor"], ["baugroesse", "einbaugroesse"], ["alzerl", "etwas"], ["etwas", "leicht"], ["etwas", "schwach"], ["alzerl", "leicht"], ["alzerl", "schwach"], ["leicht", "schwach"], ["einsatz", "operation"], ["manoever", "operation"], ["aktion", "operation"], ["einsatz", "manoever"], ["aktion", "einsatz"], ["aktion", "manoever"], ["absatz", "verteilung"], ["verteilung", "vertrieb"], ["verkauf", "verteilung"], ["kabelbaum", "kabelsatz"], ["kabelsatz", "leitungssatz"], ["kabelbaum", "leitungssatz"], ["evakuieren", "raeumen"], ["zusammenbringen", "zusammenkriegen"], ["einwerben", "zusammenkriegen"], ["aufbringen", "zusammenkriegen"], ["auftreiben", "zusammenkriegen"], ["lockermachen", "zusammenkriegen"], ["zusammenbekommen", "zusammenkriegen"], ["zusammenkratzen", "zusammenkriegen"], ["einwerben", "zusammenbringen"], ["aufbringen", "zusammenbringen"], ["auftreiben", "zusammenbringen"], ["lockermachen", "zusammenbringen"], ["zusammenbekommen", "zusammenbringen"], ["zusammenbringen", "zusammenkratzen"], ["aufbringen", "einwerben"], ["auftreiben", "einwerben"], ["einwerben", "lockermachen"], ["einwerben", "zusammenbekommen"], ["einwerben", "zusammenkratzen"], ["aufbringen", "auftreiben"], ["aufbringen", "lockermachen"], ["aufbringen", "zusammenbekommen"], ["aufbringen", "zusammenkratzen"], ["auftreiben", "lockermachen"], ["auftreiben", "zusammenbekommen"], ["auftreiben", "zusammenkratzen"], ["lockermachen", "zusammenbekommen"], ["lockermachen", "zusammenkratzen"], ["zusammenbekommen", "zusammenkratzen"], ["angemessen", "regelkonform"], ["geziemend", "regelkonform"], ["gehoerig", "regelkonform"], ["regelkonform", "zutreffend"], ["ordentlich", "regelkonform"], ["angemessen", "ordnungsgemaess"], ["angemessen", "gehoerig"], ["angemessen", "zutreffend"], ["angemessen", "ordentlich"], ["geziemend", "ordnungsgemaess"], ["gehoerig", "geziemend"], ["geziemend", "zutreffend"], ["geziemend", "ordentlich"], ["gehoerig", "ordnungsgemaess"], ["ordnungsgemaess", "zutreffend"], ["ordentlich", "ordnungsgemaess"], ["gehoerig", "zutreffend"], ["gebuehrend", "gehoerig"], ["gehoerig", "ordentlich"], ["gebuehrend", "zutreffend"], ["ordentlich", "zutreffend"], ["gebuehrend", "ordentlich"], ["blindstopfen", "verschlusskappe"], ["blindstopfen", "verschlussstopfen"], ["blindstopfen", "blindverschluss"], ["abdeckkappe", "blindstopfen"], ["verschlusskappe", "verschlussstopfen"], ["blindverschluss", "verschlusskappe"], ["abdeckkappe", "verschlusskappe"], ["blindverschluss", "verschlussstopfen"], ["abdeckkappe", "verschlussstopfen"], ["abdeckkappe", "blindverschluss"], ["fehlersuche", "troubleshooting"], ["auseinanderdriften", "entfremdung"], ["entfremdung", "sich-entfremden"], ["entfremdung", "sich-fremdwerden"], ["entfremdung", "sympathieverlust"], ["entaeusserung", "entfremdung"], ["entfremdung", "trennung"], ["abkuehlung", "entfremdung"], ["auseinanderdriften", "sich-entfremden"], ["auseinanderdriften", "sich-fremdwerden"], ["auseinanderdriften", "sympathieverlust"], ["auseinanderdriften", "entaeusserung"], ["auseinanderdriften", "trennung"], ["abkuehlung", "auseinanderdriften"], ["sich-entfremden", "sich-fremdwerden"], ["sich-entfremden", "sympathieverlust"], ["entaeusserung", "sich-entfremden"], ["sich-entfremden", "trennung"], ["abkuehlung", "sich-entfremden"], ["sich-fremdwerden", "sympathieverlust"], ["entaeusserung", "sich-fremdwerden"], ["sich-fremdwerden", "trennung"], ["abkuehlung", "sich-fremdwerden"], ["entaeusserung", "sympathieverlust"], ["sympathieverlust", "trennung"], ["abkuehlung", "sympathieverlust"], ["entaeusserung", "trennung"], ["abkuehlung", "entaeusserung"], ["abkuehlung", "trennung"], ["beeinflussen", "nachhelfen"], ["intervenieren", "nachhelfen"], ["drehen", "nachhelfen"], ["manipulieren", "nachhelfen"], ["beeinflussen", "intervenieren"], ["beeinflussen", "drehen"], ["drehen", "intervenieren"], ["intervenieren", "manipulieren"], ["drehen", "manipulieren"], ["gehoeren", "gelten"], ["bedenken", "gehoeren"], ["gehoeren", "gewaehren"], ["gehoeren", "schenken"], ["bedenken", "gelten"], ["gelten", "gewaehren"], ["gelten", "schenken"], ["bedenken", "gewaehren"], ["bedenken", "schenken"], ["gewaehren", "schenken"], ["eng", "straff"], ["eng", "knapp"], ["eng", "spack"], ["eng", "prall"], ["eng", "stramm"], ["knapp", "straff"], ["spack", "straff"], ["prall", "straff"], ["knapp", "spack"], ["knapp", "prall"], ["knapp", "stramm"], ["prall", "spack"], ["spack", "stramm"], ["prall", "stramm"], ["bewegen", "verfuegen"], ["bemuehen", "verfuegen"], ["hinbemuehen", "verfuegen"], ["hinbegeben", "verfuegen"], ["begeben", "verfuegen"], ["hingehen", "verfuegen"], ["gehen", "verfuegen"], ["bemuehen", "bewegen"], ["bewegen", "hinbemuehen"], ["bewegen", "hinbegeben"], ["begeben", "bewegen"], ["bewegen", "hingehen"], ["bewegen", "gehen"], ["bemuehen", "hinbemuehen"], ["bemuehen", "hinbegeben"], ["begeben", "bemuehen"], ["bemuehen", "hingehen"], ["bemuehen", "gehen"], ["hinbegeben", "hinbemuehen"], ["begeben", "hinbemuehen"], ["hinbemuehen", "hingehen"], ["gehen", "hinbemuehen"], ["begeben", "hinbegeben"], ["hinbegeben", "hingehen"], ["gehen", "hinbegeben"], ["begeben", "hingehen"], ["begeben", "gehen"], ["gehen", "hingehen"], ["kabel", "stromzufuehrung"], ["kabel", "stromkabel"], ["kabel", "netzkabel"], ["stromkabel", "stromzufuehrung"], ["netzkabel", "stromzufuehrung"], ["netzkabel", "stromkabel"], ["nebenbei", "parallel"], ["daneben", "parallel"], ["nebenher", "parallel"], ["daneben", "nebenbei"], ["nebenbei", "nebenher"], ["daneben", "nebenher"], ["innere", "interieur"], ["innenraum", "innere"], ["innenraum", "interieur"], ["gruene", "umwelt"], ["natur", "umwelt"], ["landschaft", "umwelt"], ["gruene", "natur"], ["gruene", "landschaft"], ["landschaft", "natur"], ["besitzen", "innehaben"], ["haben", "innehaben"], ["gehoeren", "sein"], ["gehoeren", "meinssein"], ["meinssein", "sein"], ["auszeichnen", "kennzeichnen"], ["auszeichnen", "hervorheben"], ["auszeichnen", "markieren"], ["hervorheben", "kennzeichnen"], ["hervorheben", "markieren"], ["beispielgebend", "beispielhaft"], ["beispielhaft", "mustergueltig"], ["beispielhaft", "vorbildlich"], ["beispielhaft", "musterhaft"], ["beispielhaft", "muster"], ["beispielgebend", "mustergueltig"], ["beispielgebend", "vorbildlich"], ["beispielgebend", "musterhaft"], ["beispielgebend", "muster"], ["mustergueltig", "vorbildlich"], ["mustergueltig", "musterhaft"], ["muster", "mustergueltig"], ["musterhaft", "vorbildlich"], ["muster", "vorbildlich"], ["muster", "musterhaft"], ["abwechselnd", "wahlweise"], ["passiv", "sie"], ["man", "sie"], ["die", "passiv"], ["die", "man"], ["man", "passiv"], ["befinden", "thronen"], ["stecken", "thronen"], ["sein", "thronen"], ["liegen", "thronen"], ["stehen", "thronen"], ["sitzen", "thronen"], ["befinden", "liegen"], ["befinden", "stehen"], ["befinden", "sitzen"], ["liegen", "stecken"], ["stecken", "stehen"], ["sitzen", "stecken"], ["liegen", "sein"], ["sein", "sitzen"], ["liegen", "stehen"], ["liegen", "sitzen"], ["sitzen", "stehen"], ["ausgefuehrt", "gestaltet"], ["gehalten", "gestaltet"], ["ausgefuehrt", "gehalten"], ["einrichten", "wappnen"], ["einrichten", "vorbereiten"], ["einrichten", "ruesten"], ["vorbereiten", "wappnen"], ["ruesten", "wappnen"], ["ruesten", "vorbereiten"], ["klappen", "klargehen"], ["gehen", "klargehen"], ["geraeusch", "laut"], ["laut", "mucks"], ["laut", "ton"], ["geraeusch", "mucks"], ["geraeusch", "ton"], ["mucks", "ton"], ["gehoerig", "kraeftig"], ["gehoerig", "gruendlich"], ["kraeftig", "ordentlich"], ["gruendlich", "ordentlich"], ["gruendlich", "kraeftig"], ["vertauschung", "wechsel"], ["austauschen", "vertauschung"], ["auswechseln", "vertauschung"], ["auswechselung", "vertauschung"], ["ersetzen", "vertauschung"], ["austausch", "vertauschung"], ["austauschen", "wechsel"], ["auswechseln", "wechsel"], ["auswechselung", "wechsel"], ["ersetzen", "wechsel"], ["austausch", "wechsel"], ["austauschen", "auswechselung"], ["austausch", "austauschen"], ["auswechseln", "auswechselung"], ["austausch", "auswechseln"], ["auswechselung", "ersetzen"], ["austausch", "auswechselung"], ["austausch", "ersetzen"], ["einkassieren", "kassieren"], ["einziehen", "kassieren"], ["eintreiben", "kassieren"], ["greifen", "kassieren"], ["abknoepfen", "kassieren"], ["einstreichen", "kassieren"], ["einkassieren", "einziehen"], ["einkassieren", "eintreiben"], ["einkassieren", "greifen"], ["abknoepfen", "einkassieren"], ["einkassieren", "einstreichen"], ["eintreiben", "einziehen"], ["einziehen", "greifen"], ["abknoepfen", "einziehen"], ["einstreichen", "einziehen"], ["eintreiben", "greifen"], ["abknoepfen", "eintreiben"], ["einstreichen", "eintreiben"], ["abknoepfen", "greifen"], ["einstreichen", "greifen"], ["abknoepfen", "einstreichen"], ["schwoeren", "setzen"], ["schwoeren", "stehen"], ["setzen", "stehen"], ["pfeifen", "treiben"], ["treiben", "wehen"], ["fahren", "treiben"], ["jagen", "treiben"], ["blasen", "treiben"], ["fegen", "treiben"], ["pfeifen", "wehen"], ["fahren", "pfeifen"], ["jagen", "pfeifen"], ["blasen", "pfeifen"], ["fegen", "pfeifen"], ["fahren", "wehen"], ["jagen", "wehen"], ["blasen", "wehen"], ["fegen", "wehen"], ["fahren", "jagen"], ["blasen", "fahren"], ["fahren", "fegen"], ["blasen", "jagen"], ["fegen", "jagen"], ["blasen", "fegen"], ["bedeutung", "reichweite"], ["bedeutung", "wirkung"], ["bedeutung", "strahlkraft"], ["reichweite", "wirkung"], ["reichweite", "strahlkraft"], ["strahlkraft", "wirkung"], ["abschalten", "abziehen"], ["abziehen", "deaktivieren"], ["alle", "jede"], ["alle", "lich"], ["jede", "lich"], ["abgeschaltet", "down"], ["down", "offline"], ["abgeschaltet", "offline"], ["angrenzend", "seitlich"], ["neben", "seitlich"], ["angrenzend", "neben"], ["festklemmen", "festmachen"], ["festmachen", "klemmen"], ["festmachen", "stecken"], ["festklemmen", "klemmen"], ["festklemmen", "stecken"], ["klemmen", "stecken"], ["abgedreht", "fertig"], ["fertig", "fertiggestellt"], ["beendet", "fertig"], ["abgedreht", "fertiggestellt"], ["abgedreht", "beendet"], ["beendet", "fertiggestellt"], ["lau", "leicht"], ["lau", "schwach"], ["abreissen", "sein"], ["ableisten", "sein"], ["absolvieren", "sein"], ["ableisten", "abreissen"], ["abreissen", "absolvieren"], ["belasten", "gehen"], ["gerecht", "zugeschnitten"], ["angepasst", "gerecht"], ["geeignet", "gerecht"], ["geeignet", "zugeschnitten"], ["angepasst", "geeignet"], ["anschlagen", "wirken"], ["anschlagen", "funktionieren"], ["gedaempft", "wenig"], ["gedaempft", "spaerlich"], ["gedaempft", "verhalten"], ["spaerlich", "wenig"], ["verhalten", "wenig"], ["spaerlich", "verhalten"], ["funktionieren", "regelsystem"], ["funktionieren", "grammatik"], ["grammatik", "regelsystem"], ["abschalten", "herunterfahren"], ["ausschalten", "herunterfahren"], ["auftreten", "stimmung"], ["entstehen", "stimmung"], ["kompromittiert", "tabu"], ["belastet", "tabu"], ["tabu", "verbrannt"], ["tabu", "unbenutzbar"], ["belastet", "kompromittiert"], ["kompromittiert", "verbrannt"], ["kompromittiert", "unbenutzbar"], ["belastet", "verbrannt"], ["belastet", "unbenutzbar"], ["unbenutzbar", "verbrannt"], ["gelangen", "landen"], ["gelangen", "geraten"], ["gelangen", "wandern"], ["gelangen", "kommen"], ["geraten", "landen"], ["landen", "wandern"], ["kommen", "landen"], ["geraten", "wandern"], ["geraten", "kommen"], ["kommen", "wandern"], ["absetzen", "einstellen"], ["einstellen", "streichen"], ["absetzen", "streichen"], ["kommen", "praesentieren"], ["auftischen", "kommen"], ["ankommen", "kommen"], ["auftischen", "praesentieren"], ["ankommen", "praesentieren"], ["ankommen", "auftischen"], ["los", "ohne"], ["frei", "los"], ["einfahren", "einlaufen"], ["ankommen", "einlaufen"], ["einlaufen", "erreichen"], ["ankommen", "einfahren"], ["ankommen", "erreichen"], ["groesse", "passen"], ["aufhalsen", "uebernehmen"], ["aufbuerden", "aufhalsen"], ["aufhalsen", "belasten"], ["aufbuerden", "uebernehmen"], ["belasten", "uebernehmen"], ["aufbuerden", "belasten"], ["klick", "klicken"], ["klicken", "klickgeraeusch"], ["klick", "klickgeraeusch"], ["neuankoemmling", "neuzugang"], ["neue", "neuzugang"], ["neuer", "neuzugang"], ["neuankoemmling", "neue"], ["neuankoemmling", "neuer"], ["neue", "neuer"], ["bruecke", "medium"], ["band", "bruecke"], ["bruecke", "verbindende"], ["band", "medium"], ["medium", "verbindende"], ["band", "verbindende"], ["abhaengen", "abkoppeln"], ["abkoppeln", "abkuppeln"], ["abhaengen", "abkuppeln"], ["anziehen", "umbinden"], ["anlegen", "anziehen"], ["anlegen", "umbinden"], ["ankleiden", "schluepfen"], ["anziehen", "schluepfen"], ["schluepfen", "steigen"], ["anlegen", "schluepfen"], ["schluepfen", "werfen"], ["antun", "schluepfen"], ["bekleiden", "schluepfen"], ["ankleiden", "anziehen"], ["ankleiden", "steigen"], ["ankleiden", "anlegen"], ["ankleiden", "werfen"], ["ankleiden", "antun"], ["ankleiden", "bekleiden"], ["anziehen", "steigen"], ["anziehen", "werfen"], ["antun", "anziehen"], ["anziehen", "bekleiden"], ["anlegen", "steigen"], ["steigen", "werfen"], ["antun", "steigen"], ["bekleiden", "steigen"], ["anlegen", "werfen"], ["anlegen", "antun"], ["anlegen", "bekleiden"], ["antun", "werfen"], ["bekleiden", "werfen"], ["antun", "bekleiden"], ["anziehen", "auftun"], ["aufsetzen", "auftun"], ["anziehen", "aufsetzen"], ["absetzen", "runternehmen"], ["abnehmen", "runternehmen"], ["abnehmen", "absetzen"], ["anschrauben", "schrauben"], ["festschrauben", "schrauben"], ["anschrauben", "festschrauben"], ["aufschrauben", "oeffnen"], ["aufschrauben", "schrauben"], ["sonde", "zugang"], ["katheter", "zugang"], ["katheter", "sonde"], ["geschaeftsbereich", "geschaeftszweig"], ["geschaeftsbereich", "wirtschaftlicheaktivitaeten"], ["geschaeftsbereich", "geschaeftsfeld"], ["geschaeftsbereich", "geschaeftssparte"], ["geschaeftszweig", "wirtschaftlicheaktivitaeten"], ["geschaeftsfeld", "geschaeftszweig"], ["geschaeftssparte", "geschaeftszweig"], ["geschaeftsfeld", "wirtschaftlicheaktivitaeten"], ["geschaeftssparte", "wirtschaftlicheaktivitaeten"], ["geschaeftsfeld", "geschaeftssparte"], ["fahrzeuginnere", "innenraum"], ["fahrzeuginnenraum", "innenraum"], ["fahrgastzelle", "innenraum"], ["fahrzeuginnenraum", "fahrzeuginnere"], ["fahrgastzelle", "fahrzeuginnere"], ["fahrgastzelle", "fahrzeuginnenraum"], ["gegenseitig", "gemeinsam"], ["gegenseitig", "zusammen"], ["gegenseitig", "kollektiv"], ["gegenseitig", "miteinander"], ["gegenseitig", "untereinander"], ["gemeinsam", "kollektiv"], ["gemeinsam", "untereinander"], ["kollektiv", "zusammen"], ["untereinander", "zusammen"], ["kollektiv", "miteinander"], ["kollektiv", "untereinander"], ["miteinander", "untereinander"], ["dahinterstecken", "waren"], ["dahinterstecken", "war"], ["war", "waren"], ["malgenommen", "multipliziert"], ["mal", "multipliziert"], ["mal", "malgenommen"], ["abgerechnet", "minus"], ["minus", "subtrahiert"], ["minus", "weniger"], ["abgezogen", "minus"], ["abgerechnet", "subtrahiert"], ["abgerechnet", "weniger"], ["abgerechnet", "abgezogen"], ["subtrahiert", "weniger"], ["abgezogen", "subtrahiert"], ["abgezogen", "weniger"], ["gegeben", "gewaehrleistet"], ["gesichert", "gewaehrleistet"], ["gegeben", "gesichert"], ["aufspannen", "oeffnen"], ["aufmachen", "aufspannen"], ["aufklappen", "aufspannen"], ["aufmachen", "oeffnen"], ["aufklappen", "oeffnen"], ["aufklappen", "aufmachen"], ["aufmachen", "hochklappen"], ["aufklappen", "hochklappen"], ["aufmachen", "entfernen"], ["abziehen", "aufmachen"], ["abziehen", "entfernen"], ["abnehmen", "herabnehmen"], ["abnehmen", "runterholen"], ["abhaengen", "abnehmen"], ["abnehmen", "herunternehmen"], ["abnehmen", "einholen"], ["abnehmen", "niederholen"], ["herabnehmen", "runternehmen"], ["herabnehmen", "runterholen"], ["abhaengen", "herabnehmen"], ["herabnehmen", "herunternehmen"], ["einholen", "herabnehmen"], ["herabnehmen", "niederholen"], ["runterholen", "runternehmen"], ["abhaengen", "runternehmen"], ["herunternehmen", "runternehmen"], ["einholen", "runternehmen"], ["niederholen", "runternehmen"], ["abhaengen", "runterholen"], ["herunternehmen", "runterholen"], ["einholen", "runterholen"], ["niederholen", "runterholen"], ["abhaengen", "herunternehmen"], ["abhaengen", "einholen"], ["abhaengen", "niederholen"], ["einholen", "herunternehmen"], ["herunternehmen", "niederholen"], ["einholen", "niederholen"], ["schwach", "trueb"], ["daemmrig", "schwach"], ["lichtarm", "schwach"], ["schummrig", "schwach"], ["fahl", "schwach"], ["daemmrig", "trueb"], ["schlecht", "trueb"], ["lichtarm", "trueb"], ["schummrig", "trueb"], ["fahl", "trueb"], ["daemmrig", "schlecht"], ["daemmrig", "lichtarm"], ["daemmrig", "schummrig"], ["daemmrig", "fahl"], ["lichtarm", "schlecht"], ["schlecht", "schummrig"], ["fahl", "schlecht"], ["lichtarm", "schummrig"], ["fahl", "lichtarm"], ["fahl", "schummrig"], ["einraeumen", "lassen"], ["geben", "lassen"], ["gewaehren", "lassen"], ["einraeumen", "geben"], ["einraeumen", "gewaehren"], ["geben", "gewaehren"], ["gehen", "konvenieren"], ["gehen", "zusagen"], ["gehen", "passen"], ["kontinuierlich", "linear"], ["frequenz", "haeufigkeit"], ["beherzigen", "hoeren"], ["befolgen", "hoeren"], ["befolgen", "beherzigen"], ["beherzigen", "folgen"], ["befolgen", "folgen"], ["kippen", "verschlechtern"], ["umschlagen", "verschlechtern"], ["kippen", "umschlagen"], ["auffahren", "stranden"], ["fahren", "stranden"], ["auflaufen", "stranden"], ["auffahren", "fahren"], ["auffahren", "auflaufen"], ["auflaufen", "fahren"], ["klein", "unbedeutend"], ["einfach", "unbedeutend"], ["nieder", "unbedeutend"], ["niedrig", "unbedeutend"], ["inferior", "unbedeutend"], ["geringwertig", "unbedeutend"], ["einfach", "klein"], ["klein", "nieder"], ["klein", "niedrig"], ["inferior", "klein"], ["geringwertig", "klein"], ["einfach", "nieder"], ["einfach", "niedrig"], ["einfach", "inferior"], ["einfach", "geringwertig"], ["nieder", "niedrig"], ["inferior", "nieder"], ["geringwertig", "nieder"], ["inferior", "niedrig"], ["geringwertig", "niedrig"], ["geringwertig", "inferior"], ["nach", "post"], ["wegbrechen", "wegfallen"], ["totalausfall", "wegfallen"], ["ausfallen", "wegfallen"], ["wegfallen", "zurueckgehen"], ["totalausfall", "wegbrechen"], ["ausfallen", "wegbrechen"], ["wegbrechen", "zurueckgehen"], ["ausfallen", "totalausfall"], ["totalausfall", "zurueckgehen"], ["ausfallen", "zurueckgehen"], ["hygiene", "reinheit"], ["reinheit", "sauberkeit"], ["adaptieren", "harmonisieren"], ["anpassen", "harmonisieren"], ["abstimmen", "harmonisieren"], ["adaptieren", "anpassen"], ["abstimmen", "adaptieren"], ["abstimmen", "anpassen"], ["kontext", "verhaeltnisse"], ["umstaende", "verhaeltnisse"], ["situation", "verhaeltnisse"], ["lage", "verhaeltnisse"], ["kontext", "umstaende"], ["kontext", "situation"], ["kontext", "lage"], ["situation", "umstaende"], ["lage", "umstaende"], ["lage", "situation"], ["einstieg", "umstieg"], ["einstieg", "wechsel"], ["umstieg", "wechsel"], ["haben", "kommen"], ["kommen", "verfuegen"], ["frei", "weg"], ["los", "weg"], ["fort", "frei"], ["fort", "los"], ["drehen", "umschlagen"], ["abdrehen", "drehen"], ["abdrehen", "umschlagen"], ["fuehrend", "fuehrungsrolle"], ["gehen", "klingeln"], ["bimmeln", "klingeln"], ["klingeln", "laeuten"], ["klingeln", "schellen"], ["bimmeln", "gehen"], ["gehen", "laeuten"], ["gehen", "schellen"], ["bimmeln", "laeuten"], ["bimmeln", "schellen"], ["laeuten", "schellen"], ["hinzukommen", "plus"], ["hinzukommen", "zzgl"], ["dazukommen", "hinzukommen"], ["hinzukommen", "zuzueglich"], ["plus", "zzgl"], ["dazukommen", "plus"], ["dazukommen", "zzgl"], ["zuzueglich", "zzgl"], ["dazukommen", "zuzueglich"], ["dastehen", "liegen"], ["abschneiden", "liegen"], ["abschneiden", "dastehen"], ["fuehrungsleiste", "parallelanschlag"], ["fuehrung", "fuehrungsleiste"], ["fuehrungsleiste", "seitenanschlag"], ["fuehrungsleiste", "fuehrungsschiene"], ["fuehrung", "parallelanschlag"], ["parallelanschlag", "seitenanschlag"], ["fuehrungsschiene", "parallelanschlag"], ["fuehrung", "seitenanschlag"], ["fuehrung", "fuehrungsschiene"], ["fuehrungsschiene", "seitenanschlag"], ["hindurch", "lang"], ["fuer", "lang"], ["lang", "ueber"], ["fuer", "hindurch"], ["hindurch", "ueber"], ["fuer", "ueber"], ["eintrag", "schussfaden"], ["eintrag", "schuss"], ["einschlag", "eintrag"], ["schuss", "schussfaden"], ["einschlag", "schussfaden"], ["einschlag", "schuss"], ["fassen", "langen"], ["greifen", "langen"], ["oberteil", "top"], ["entfalten", "oeffnen"], ["aufgehen", "oeffnen"], ["aufklappen", "entfalten"], ["aufgehen", "aufklappen"], ["aufgehen", "entfalten"], ["noch", "weiterhin"], ["noch", "weiter"], ["weiter", "weiterhin"], ["voll", "vollstaendig"], ["komplett", "vollstaendig"], ["gesamt", "vollstaendig"], ["exhaustiv", "vollstaendig"], ["ganz", "vollstaendig"], ["komplett", "voll"], ["gesamt", "voll"], ["exhaustiv", "voll"], ["lueckenlos", "voll"], ["gesamt", "komplett"], ["exhaustiv", "komplett"], ["komplett", "lueckenlos"], ["ganz", "komplett"], ["exhaustiv", "gesamt"], ["gesamt", "lueckenlos"], ["ganz", "gesamt"], ["exhaustiv", "lueckenlos"], ["exhaustiv", "ganz"], ["ganz", "lueckenlos"], ["auflegen", "nehmen"], ["drauftun", "nehmen"], ["auftragen", "nehmen"], ["draufhauen", "nehmen"], ["auflegen", "drauftun"], ["auflegen", "auftragen"], ["auflegen", "draufhauen"], ["auftragen", "drauftun"], ["draufhauen", "drauftun"], ["auftragen", "draufhauen"], ["oertlichkeit", "ort"], ["ort", "winkel"], ["location", "ort"], ["oertlichkeit", "winkel"], ["location", "oertlichkeit"], ["location", "winkel"], ["umgehend", "unmittelbar"], ["umgehend", "unverzueglich"], ["sofortig", "umgehend"], ["prompt", "umgehend"], ["augenblicklich", "umgehend"], ["alsbaldig", "umgehend"], ["direkt", "umgehend"], ["unmittelbar", "unverzueglich"], ["sofortig", "unmittelbar"], ["prompt", "unmittelbar"], ["augenblicklich", "unmittelbar"], ["alsbaldig", "unmittelbar"], ["direkt", "unmittelbar"], ["sofortig", "unverzueglich"], ["prompt", "unverzueglich"], ["augenblicklich", "unverzueglich"], ["alsbaldig", "unverzueglich"], ["direkt", "unverzueglich"], ["prompt", "sofortig"], ["augenblicklich", "sofortig"], ["alsbaldig", "sofortig"], ["direkt", "sofortig"], ["augenblicklich", "prompt"], ["alsbaldig", "prompt"], ["direkt", "prompt"], ["alsbaldig", "augenblicklich"], ["augenblicklich", "direkt"], ["alsbaldig", "direkt"], ["aufgabe", "sollen"], ["graben", "schaufeln"], ["ausschachten", "schaufeln"], ["machen", "schaufeln"], ["ausheben", "schaufeln"], ["ausschachten", "graben"], ["graben", "machen"], ["ausheben", "graben"], ["ausschachten", "machen"], ["ausheben", "ausschachten"], ["ausheben", "machen"], ["bestehen", "obwalten"], ["bestehen", "herrschen"], ["obwalten", "vorliegen"], ["herrschen", "obwalten"], ["herrschen", "vorliegen"], ["ette", "sie"], ["die", "ette"], ["bisschen", "etwas"], ["etwas", "geringfuegig"], ["bisschen", "leicht"], ["bisschen", "geringfuegig"], ["automatisch", "unaufgefordert"], ["unaufgefordert", "ungefragt"], ["selbsttaetig", "unaufgefordert"], ["unaufgefordert", "unverlangt"], ["automatisch", "ungefragt"], ["automatisch", "unverlangt"], ["selbsttaetig", "ungefragt"], ["ungefragt", "unverlangt"], ["selbsttaetig", "unverlangt"], ["auserlesen", "ausgesucht"], ["auserlesen", "erkoren"], ["auserkoren", "auserlesen"], ["auserlesen", "ausgewaehlt"], ["auserlesen", "gewaehlt"], ["auserlesen", "auserwaehlt"], ["auserlesen", "erwaehlt"], ["ausgesucht", "erkoren"], ["auserkoren", "ausgesucht"], ["ausgesucht", "ausgewaehlt"], ["ausgesucht", "gewaehlt"], ["auserwaehlt", "ausgesucht"], ["ausgesucht", "erwaehlt"], ["auserkoren", "erkoren"], ["ausgewaehlt", "erkoren"], ["erkoren", "gewaehlt"], ["auserwaehlt", "erkoren"], ["erkoren", "erwaehlt"], ["auserkoren", "ausgewaehlt"], ["auserkoren", "gewaehlt"], ["auserkoren", "auserwaehlt"], ["auserkoren", "erwaehlt"], ["ausgewaehlt", "gewaehlt"], ["auserwaehlt", "ausgewaehlt"], ["ausgewaehlt", "erwaehlt"], ["auserwaehlt", "gewaehlt"], ["erwaehlt", "gewaehlt"], ["auserwaehlt", "erwaehlt"], ["besondere", "eigene"], ["besondere", "spezifische"], ["besondere", "spezielle"], ["eigene", "spezifische"], ["eigene", "spezielle"], ["spezielle", "spezifische"], ["alternativ", "weitere"], ["abweichend", "weitere"], ["alternativ", "andere"], ["abweichend", "alternativ"], ["abweichend", "andere"], ["herabsetzen", "reduzieren"], ["reduzieren", "senken"], ["anheben", "verteuern"], ["anheben", "anpassen"], ["anheben", "heraufsetzen"], ["anheben", "hochsetzen"], ["erhoehen", "verteuern"], ["anpassen", "erhoehen"], ["erhoehen", "heraufsetzen"], ["erhoehen", "hochsetzen"], ["anpassen", "verteuern"], ["heraufsetzen", "verteuern"], ["hochsetzen", "verteuern"], ["anpassen", "heraufsetzen"], ["anpassen", "hochsetzen"], ["heraufsetzen", "hochsetzen"], ["auseinandernehmen", "grillen"], ["grillen", "stellen"], ["auseinandernehmen", "stellen"], ["festhalten", "feststellen"], ["rausspringen", "springen"], ["herausspringen", "rausspringen"], ["herausspringen", "springen"], ["einbauen", "verbauen"], ["einsetzen", "verbauen"], ["aufgehen", "erscheinen"], ["aufklappen", "erscheinen"], ["aufploppen", "erscheinen"], ["erscheinen", "sichoeffnen"], ["aufgehen", "aufploppen"], ["aufgehen", "sichoeffnen"], ["aufklappen", "aufploppen"], ["aufklappen", "sichoeffnen"], ["aufploppen", "sichoeffnen"], ["abziehen", "schaerfen"], ["schaerfen", "schleifen"], ["schaerfen", "wetzen"], ["abziehen", "schleifen"], ["abziehen", "wetzen"], ["schleifen", "wetzen"], ["auseinandernehmen", "zerlegen"], ["auseinanderbauen", "auseinandernehmen"], ["auseinanderbauen", "zerlegen"], ["ausbauen", "entfernen"], ["ausbauen", "herausnehmen"], ["anschlagen", "losgehen"], ["ertoenen", "losgehen"], ["anschlagen", "ertoenen"], ["befehlen", "heissen"], ["anweisen", "befehlen"], ["befehlen", "gebieten"], ["anweisen", "heissen"], ["gebieten", "heissen"], ["anweisen", "gebieten"], ["erscheinungsbild", "oberflaeche"], ["oberflaeche", "skin"], ["oberflaeche", "theme"], ["design", "oberflaeche"], ["erscheinungsbild", "skin"], ["erscheinungsbild", "theme"], ["design", "erscheinungsbild"], ["skin", "theme"], ["design", "skin"], ["design", "theme"], ["bestimmt", "gewiss"], ["gewiss", "vermutlich"], ["gewiss", "sicherlich"], ["gewiss", "safe"], ["gewiss", "zweifelsohne"], ["gewiss", "sicher"], ["bestimmt", "vermutlich"], ["bestimmt", "sicherlich"], ["bestimmt", "safe"], ["bestimmt", "zweifelsohne"], ["bestimmt", "sicher"], ["sicherlich", "vermutlich"], ["safe", "vermutlich"], ["vermutlich", "zweifelsohne"], ["sicher", "vermutlich"], ["safe", "sicherlich"], ["sicherlich", "zweifelsohne"], ["sicher", "sicherlich"], ["safe", "zweifelsohne"], ["safe", "sicher"], ["sicher", "zweifelsohne"], ["exponieren", "praesentieren"], ["ausstellen", "praesentieren"], ["exponieren", "zeigen"], ["ausstellen", "exponieren"], ["ausstellen", "zeigen"], ["tauschen", "uebernehmen"], ["unterabschnitt", "unterkapitel"], ["anbindung", "erschliessung"], ["aufschliessung", "erschliessung"], ["anschluss", "erschliessung"], ["anbindung", "aufschliessung"], ["anbindung", "anschluss"], ["anschluss", "aufschliessung"], ["bei", "nahe"], ["bei", "unweit"], ["bei", "neben"], ["nahe", "unweit"], ["nahe", "neben"], ["neben", "unweit"], ["kante", "landstrich"], ["kante", "landschaft"], ["gegend", "kante"], ["gebiet", "kante"], ["kante", "land"], ["ecke", "landstrich"], ["landschaft", "landstrich"], ["gegend", "landstrich"], ["gebiet", "landstrich"], ["land", "landstrich"], ["ecke", "landschaft"], ["ecke", "gegend"], ["ecke", "gebiet"], ["ecke", "land"], ["gegend", "landschaft"], ["gebiet", "landschaft"], ["land", "landschaft"], ["gebiet", "gegend"], ["gegend", "land"], ["gebiet", "land"], ["bringen", "kommen"], ["bringen", "laufen"], ["bringen", "uebertragen"], ["bringen", "senden"], ["kommen", "zeigen"], ["kommen", "uebertragen"], ["kommen", "senden"], ["laufen", "zeigen"], ["uebertragen", "zeigen"], ["senden", "zeigen"], ["laufen", "uebertragen"], ["laufen", "senden"], ["senden", "uebertragen"], ["richtige", "wirkliche"], ["richtige", "wahre"], ["eigentliche", "richtige"], ["echte", "richtige"], ["wahre", "wirkliche"], ["eigentliche", "wirkliche"], ["echte", "wirkliche"], ["eigentliche", "wahre"], ["echte", "wahre"], ["echte", "eigentliche"], ["schloss", "verriegelung"], ["schliessvorrichtung", "schloss"], ["schliesse", "schloss"], ["abriegelung", "schloss"], ["riegel", "schloss"], ["schliessvorrichtung", "verriegelung"], ["schliesse", "verriegelung"], ["abriegelung", "verriegelung"], ["riegel", "verriegelung"], ["schliesse", "schliessvorrichtung"], ["abriegelung", "schliessvorrichtung"], ["riegel", "schliessvorrichtung"], ["abriegelung", "schliesse"], ["riegel", "schliesse"], ["abriegelung", "riegel"], ["anzeichen", "symptom"], ["symptom", "zeiger"], ["erkennungszeichen", "symptom"], ["anzeichen", "zeiger"], ["anzeichen", "erkennungszeichen"], ["erkennungszeichen", "zeiger"], ["bewegen", "schaffen"], ["bewirken", "schaffen"], ["reissen", "schaffen"], ["bewegen", "bewirken"], ["bewegen", "erreichen"], ["bewegen", "reissen"], ["bewirken", "erreichen"], ["bewirken", "reissen"], ["erreichen", "reissen"], ["positionierung", "zuordnung"], ["einordnung", "positionierung"], ["einordnung", "zuordnung"], ["verortung", "zuordnung"], ["einordnung", "verortung"], ["einfluss", "einwirkung"], ["eigens", "speziell"], ["gezielt", "speziell"], ["nur", "speziell"], ["dediziert", "eigens"], ["dediziert", "gezielt"], ["dediziert", "nur"], ["eigens", "extra"], ["eigens", "gezielt"], ["eigens", "nur"], ["extra", "gezielt"], ["extra", "nur"], ["gezielt", "nur"], ["federkontaktstift", "pruefspitze"], ["federstift", "pruefspitze"], ["pruefspitze", "slc"], ["pruefpin", "pruefspitze"], ["pruefspitze", "testpin"], ["federkontakt", "pruefspitze"], ["federkontaktstift", "federstift"], ["federkontaktstift", "slc"], ["federkontaktstift", "pruefpin"], ["federkontaktstift", "testpin"], ["federkontakt", "federkontaktstift"], ["federstift", "slc"], ["federstift", "pruefpin"], ["federstift", "testpin"], ["federkontakt", "federstift"], ["pruefpin", "slc"], ["slc", "testpin"], ["federkontakt", "slc"], ["pruefpin", "testpin"], ["federkontakt", "pruefpin"], ["federkontakt", "testpin"], ["fuehren", "verlaufen"], ["einhalten", "respektieren"], ["bleiben", "respektieren"], ["bleiben", "einhalten"], ["grabschen", "nehmen"], ["krallen", "nehmen"], ["grabschen", "greifen"], ["greifen", "krallen"], ["grabschen", "schnappen"], ["grabschen", "krallen"], ["grabschen", "packen"], ["krallen", "schnappen"], ["krallen", "packen"], ["beschraenktheit", "einschraenkung"], ["einschraenkung", "schranke"], ["eingeschraenktheit", "einschraenkung"], ["einschraenkung", "grenze"], ["beschraenktheit", "schranke"], ["beschraenktheit", "eingeschraenktheit"], ["beschraenktheit", "beschraenkung"], ["beschraenktheit", "grenze"], ["eingeschraenktheit", "schranke"], ["beschraenkung", "schranke"], ["grenze", "schranke"], ["beschraenkung", "eingeschraenktheit"], ["eingeschraenktheit", "grenze"], ["beschraenkung", "grenze"], ["beruehrungspunkt", "schiene"], ["anknuepfungspunkt", "schiene"], ["schiene", "zugang"], ["beziehung", "schiene"], ["bezug", "schiene"], ["anknuepfungspunkt", "beruehrungspunkt"], ["beruehrungspunkt", "zugang"], ["beruehrungspunkt", "beziehung"], ["beruehrungspunkt", "bezug"], ["anknuepfungspunkt", "zugang"], ["anknuepfungspunkt", "beziehung"], ["anknuepfungspunkt", "bezug"], ["beziehung", "zugang"], ["bezug", "zugang"], ["kassette", "zahnkranz"], ["zahnkranz", "zahnkranzpaket"], ["ritzelpaket", "zahnkranz"], ["kassette", "zahnkranzpaket"], ["kassette", "ritzelpaket"], ["ritzelpaket", "zahnkranzpaket"], ["abfassen", "aufsetzen"], ["aufsetzen", "errichten"], ["aufsetzen", "machen"], ["aufsetzen", "erstellen"], ["abfassen", "errichten"], ["abfassen", "machen"], ["abfassen", "erstellen"], ["errichten", "machen"], ["errichten", "erstellen"], ["erstellen", "machen"], ["abstellenkoennen", "lassen"], ["abstellenkoennen", "bringen"], ["abstellenkoennen", "hinbringen"], ["bringen", "lassen"], ["hinbringen", "lassen"], ["bringen", "hinbringen"], ["abdecken", "erfuellen"], ["erfuellen", "genuegen"], ["entsprechen", "erfuellen"], ["abdecken", "genuegen"], ["abdecken", "entsprechen"], ["entsprechen", "genuegen"], ["durchlaufen", "durchrutschen"], ["durchrutschen", "rauschen"], ["durchrauschen", "durchrutschen"], ["ausrauschen", "durchrutschen"], ["durchlaufen", "rauschen"], ["durchlaufen", "durchrauschen"], ["ausrauschen", "durchlaufen"], ["durchrauschen", "rauschen"], ["ausrauschen", "rauschen"], ["ausrauschen", "durchrauschen"], ["beitreiben", "einziehen"], ["beitreiben", "eintreiben"], ["abschleifen", "obereschichtentfernen"], ["abziehen", "obereschichtentfernen"], ["obereschichtentfernen", "schleifen"], ["abschleifen", "abziehen"], ["abschleifen", "schleifen"], ["ausbauen", "herausziehen"], ["abziehen", "herausziehen"], ["herausziehen", "herunternehmen"], ["herausziehen", "loesen"], ["herausziehen", "rausnehmen"], ["abbekommen", "herausziehen"], ["herausziehen", "rausziehen"], ["abziehen", "ausbauen"], ["ausbauen", "herunternehmen"], ["ausbauen", "loesen"], ["ausbauen", "rausnehmen"], ["abbekommen", "ausbauen"], ["ausbauen", "rausziehen"], ["abziehen", "herunternehmen"], ["abziehen", "loesen"], ["abziehen", "rausnehmen"], ["abbekommen", "abziehen"], ["abziehen", "rausziehen"], ["herunternehmen", "loesen"], ["herunternehmen", "rausnehmen"], ["abbekommen", "herunternehmen"], ["herunternehmen", "rausziehen"], ["loesen", "rausnehmen"], ["abbekommen", "loesen"], ["loesen", "rausziehen"], ["abbekommen", "rausnehmen"], ["rausnehmen", "rausziehen"], ["abbekommen", "rausziehen"], ["einbau", "eingebaut"], ["kennzahl", "masszahl"], ["kenngroesse", "masszahl"], ["kennwert", "masszahl"], ["kennziffer", "masszahl"], ["index", "masszahl"], ["kenngroesse", "kennzahl"], ["kennwert", "kennzahl"], ["kennzahl", "kennziffer"], ["index", "kennzahl"], ["kenngroesse", "kennwert"], ["kenngroesse", "kennziffer"], ["index", "kenngroesse"], ["kennwert", "kennziffer"], ["index", "kennwert"], ["anschluss", "weiter"], ["folge", "weiter"], ["anschliessend", "weiter"], ["nachfolgend", "weiter"], ["anschluss", "folge"], ["anschliessend", "anschluss"], ["anschluss", "nachfolgend"], ["anschliessend", "folge"], ["folge", "nachfolgend"], ["braucht", "verlangt"], ["beduerftig", "braucht"], ["braucht", "erfordert"], ["beduerftig", "verlangt"], ["bedarf", "verlangt"], ["erfordert", "verlangt"], ["bedarf", "beduerftig"], ["beduerftig", "erfordert"], ["bedarf", "erfordert"], ["entstehen", "sichbilden"], ["ansetzen", "sichbilden"], ["ansetzen", "entstehen"], ["ausweislich", "nach"], ["ausweislich", "laut"], ["ausweislich", "gemaess"], ["ausweislich", "zufolge"], ["bestreichen", "einstreichen"], ["auftragen", "einstreichen"], ["einpinseln", "einstreichen"], ["bepinseln", "einstreichen"], ["auftragen", "bestreichen"], ["bestreichen", "einpinseln"], ["bepinseln", "bestreichen"], ["auftragen", "einpinseln"], ["auftragen", "bepinseln"], ["bepinseln", "einpinseln"], ["anfahren", "anlaufen"], ["anlaufen", "starten"], ["anlaufen", "hochfahren"], ["bemessen", "richten"], ["abhaengen", "richten"], ["abhaengen", "bemessen"], ["fuellstoff", "fuellung"], ["fuellgut", "fuellstoff"], ["fuellmaterial", "fuellstoff"], ["fuellgut", "fuellung"], ["fuellmaterial", "fuellung"], ["fuellgut", "fuellmaterial"], ["durchgang", "satz"], ["durchgang", "lauf"], ["lauf", "satz"], ["album-cover", "schallplattenhuelle"], ["album-cover", "cover"], ["album-cover", "huelle"], ["album-cover", "plattenhuelle"], ["cover", "schallplattenhuelle"], ["huelle", "schallplattenhuelle"], ["plattenhuelle", "schallplattenhuelle"], ["cover", "huelle"], ["cover", "plattenhuelle"], ["huelle", "plattenhuelle"], ["verlaufen", "vollziehen"], ["kommen", "verlaufen"], ["laufen", "vollziehen"], ["kommen", "vollziehen"], ["vollziehen", "vonstattengehen"], ["kommen", "vonstattengehen"], ["mittig", "zentriert"], ["gegebenenfalls", "ggf"], ["ggf", "sollte"], ["gegebenenfalls", "sollte"], ["drangeben", "lassen"], ["einstellen", "lassen"], ["aufhoeren", "drangeben"], ["drangeben", "einstellen"], ["aufhoeren", "einstellen"], ["armaturenbrett", "schalttafel"], ["armaturenbrett", "instrumententafel"], ["armaturenbrett", "instrumententraeger"], ["instrumententafel", "schalttafel"], ["instrumententraeger", "schalttafel"], ["instrumententafel", "instrumententraeger"], ["stammen", "verfertigen"], ["schaffen", "verfertigen"], ["besorgen", "verfertigen"], ["uebersetzen", "verfertigen"], ["schaffen", "stammen"], ["besorgen", "stammen"], ["stammen", "uebersetzen"], ["besorgen", "schaffen"], ["schaffen", "uebersetzen"], ["besorgen", "uebersetzen"], ["betreuung", "hege"], ["betreuung", "sorge"], ["betreuung", "versorgung"], ["betreuung", "schutz"], ["betreuung", "obhut"], ["betreuung", "fuersorge"], ["betreuung", "pflege"], ["hege", "sorge"], ["hege", "versorgung"], ["hege", "schutz"], ["hege", "obhut"], ["fuersorge", "hege"], ["hege", "pflege"], ["sorge", "versorgung"], ["schutz", "sorge"], ["obhut", "sorge"], ["fuersorge", "sorge"], ["pflege", "sorge"], ["schutz", "versorgung"], ["obhut", "versorgung"], ["fuersorge", "versorgung"], ["pflege", "versorgung"], ["obhut", "schutz"], ["fuersorge", "schutz"], ["pflege", "schutz"], ["fuersorge", "obhut"], ["obhut", "pflege"], ["fuersorge", "pflege"], ["leistung", "tat"], ["leistung", "werk"], ["tat", "werk"], ["harmonieren", "zusammenpassen"], ["harmonieren", "passen"], ["entsprechen", "harmonieren"], ["passen", "zusammenpassen"], ["entsprechen", "zusammenpassen"], ["entsprechen", "passen"], ["ausgleichen", "kompensieren"], ["auffangen", "kompensieren"], ["auffangen", "ausgleichen"], ["auffangen", "bergen"], ["bergen", "sammeln"], ["auffangen", "sammeln"], ["anstehen", "warten"], ["ausgelegt", "ermoeglichen"], ["ermoeglichen", "voraussetzungenerfuellen"], ["ermoeglichen", "vorgesehen"], ["ermoeglichen", "zugeschnitten"], ["ausgelegt", "voraussetzungenerfuellen"], ["ausgelegt", "vorgesehen"], ["ausgelegt", "zugeschnitten"], ["voraussetzungenerfuellen", "vorgesehen"], ["voraussetzungenerfuellen", "zugeschnitten"], ["vorgesehen", "zugeschnitten"], ["sie", "wir"], ["ihr", "sie"], ["ihr", "wir"], ["bessergestellt", "gehoben"], ["gehoben", "vornehm"], ["besser", "gehoben"], ["bessergestellt", "vornehm"], ["besser", "bessergestellt"], ["besser", "vornehm"], ["kaliber", "liga"], ["kaliber", "level"], ["kaliber", "klasse"], ["kaliber", "kategorie"], ["kaliber", "nummer"], ["hausnummer", "kaliber"], ["kaliber", "niveau"], ["level", "liga"], ["klasse", "liga"], ["kategorie", "liga"], ["liga", "nummer"], ["hausnummer", "liga"], ["liga", "niveau"], ["klasse", "level"], ["kategorie", "level"], ["level", "nummer"], ["hausnummer", "level"], ["level", "niveau"], ["kategorie", "klasse"], ["klasse", "nummer"], ["hausnummer", "klasse"], ["klasse", "niveau"], ["kategorie", "nummer"], ["hausnummer", "kategorie"], ["kategorie", "niveau"], ["hausnummer", "nummer"], ["niveau", "nummer"], ["hausnummer", "niveau"], ["frage", "sache"], ["sache", "thema"], ["geschichte", "sache"], ["frage", "thema"], ["frage", "geschichte"], ["geschichte", "thema"], ["abbiegen", "vermeiden"], ["frage", "vermeiden"], ["umgehen", "vermeiden"], ["abbiegen", "frage"], ["abbiegen", "umgehen"], ["frage", "umgehen"], ["eingetragen", "geschuetzt"], ["eingetragen", "registriert"], ["geschuetzt", "registriert"], ["bekommen", "bewegen"], ["bekommen", "breitschlagen"], ["bekommen", "einreden"], ["bekommen", "ueberreden"], ["bekommen", "bringen"], ["bewegen", "breitschlagen"], ["bewegen", "einreden"], ["bewegen", "ueberreden"], ["breitschlagen", "einreden"], ["breitschlagen", "ueberreden"], ["breitschlagen", "bringen"], ["einreden", "ueberreden"], ["bringen", "einreden"], ["bringen", "ueberreden"], ["aufbieten", "ausheben"], ["ausheben", "einziehen"], ["ausheben", "einberufen"], ["ausheben", "rekrutieren"], ["aufbieten", "einziehen"], ["aufbieten", "einberufen"], ["aufbieten", "rekrutieren"], ["einberufen", "einziehen"], ["einziehen", "rekrutieren"], ["einberufen", "rekrutieren"], ["fahrzeugheck", "heck"], ["beenden", "einstellen"], ["abbrechen", "beenden"], ["aufhoeren", "beenden"], ["abbrechen", "einstellen"], ["abbrechen", "aufhoeren"], ["formen", "wirken"], ["formen", "schleifen"], ["schleifen", "wirken"], ["auftreten", "ausdehnung"], ["auftreten", "verbreitung"], ["ausdehnung", "verbreitung"], ["ausdehnung", "vorkommen"], ["verbreitung", "vorkommen"], ["kraut", "laub"], ["gruen", "kraut"], ["gruene", "kraut"], ["gruen", "laub"], ["gruene", "laub"], ["gruen", "gruene"], ["bekritzeln", "verzieren"], ["bekritzeln", "beschreiben"], ["bekritzeln", "vollschreiben"], ["bekritzeln", "versehen"], ["beschreiben", "verzieren"], ["verzieren", "vollschreiben"], ["versehen", "verzieren"], ["beschreiben", "vollschreiben"], ["beschreiben", "versehen"], ["versehen", "vollschreiben"], ["aufziehen", "hinaufziehen"], ["aufziehen", "raufziehen"], ["aufziehen", "heraufziehen"], ["aufziehen", "emporziehen"], ["hinaufziehen", "raufziehen"], ["hinaufziehen", "hochziehen"], ["heraufziehen", "hinaufziehen"], ["emporziehen", "hinaufziehen"], ["hochziehen", "raufziehen"], ["heraufziehen", "raufziehen"], ["emporziehen", "raufziehen"], ["heraufziehen", "hochziehen"], ["emporziehen", "hochziehen"], ["emporziehen", "heraufziehen"], ["satz", "set"], ["garnitur", "set"], ["garnitur", "satz"], ["entlang", "laengs"], ["laengs", "lang"], ["entlang", "lang"], ["einfach", "halt"], ["urspruenglich", "zuallererst"], ["urspruenglich", "zunaechst"], ["originaer", "urspruenglich"], ["zuallererst", "zunaechst"], ["originaer", "zuallererst"], ["originaer", "zunaechst"], ["retour", "wieder"], ["wieder", "zurueck"], ["erbringen", "verhelfen"], ["bringen", "erbringen"], ["bescheren", "erbringen"], ["bringen", "verhelfen"], ["bescheren", "verhelfen"], ["bescheren", "bringen"], ["anwendung", "technik"], ["lauter", "nur"], ["bloss", "lauter"], ["ausschliesslich", "lauter"], ["sichtkontrolle", "sichtpruefung"], ["anstatt", "lieber"], ["bevor", "lieber"], ["anstatt", "bevor"], ["anstatt", "besser"], ["besser", "bevor"], ["koennen", "passen"], ["gehen", "koennen"], ["anfangen", "ansetzen"], ["ansetzen", "beginnen"], ["anfangen", "beginnen"], ["filmmontage", "filmschnitt"], ["filmschnitt", "montage"], ["filmschnitt", "schnitt"], ["filmmontage", "montage"], ["filmmontage", "schnitt"], ["montage", "schnitt"], ["spannen", "zurren"], ["spannen", "straffen"], ["spannen", "ziehen"], ["straffen", "zurren"], ["ziehen", "zurren"], ["straffen", "ziehen"], ["aufkommen", "uebernehmen"], ["aufkommen", "tragen"], ["tragen", "uebernehmen"], ["notduerftig", "probeweise"], ["hilfsweise", "notduerftig"], ["aushilfsweise", "notduerftig"], ["behelfsweise", "notduerftig"], ["ersatzweise", "notduerftig"], ["notduerftig", "provisorisch"], ["hilfsweise", "probeweise"], ["aushilfsweise", "probeweise"], ["behelfsweise", "probeweise"], ["ersatzweise", "probeweise"], ["probeweise", "provisorisch"], ["aushilfsweise", "hilfsweise"], ["behelfsweise", "hilfsweise"], ["ersatzweise", "hilfsweise"], ["hilfsweise", "provisorisch"], ["aushilfsweise", "behelfsweise"], ["aushilfsweise", "ersatzweise"], ["aushilfsweise", "provisorisch"], ["behelfsweise", "ersatzweise"], ["behelfsweise", "provisorisch"], ["ersatzweise", "provisorisch"], ["angabe", "information"], ["deutlich", "weitaus"], ["klar", "weitaus"], ["deutlich", "klar"], ["rezipieren", "sehen"], ["aufnehmen", "rezipieren"], ["hoeren", "rezipieren"], ["rezipieren", "wahrnehmen"], ["beobachten", "rezipieren"], ["aufnehmen", "sehen"], ["hoeren", "sehen"], ["sehen", "wahrnehmen"], ["beobachten", "sehen"], ["aufnehmen", "hoeren"], ["aufnehmen", "wahrnehmen"], ["hoeren", "wahrnehmen"], ["beobachten", "hoeren"], ["beobachten", "wahrnehmen"], ["abfallen", "runterfallen"], ["herabfallen", "runterfallen"], ["herunterfallen", "runterfallen"], ["fallen", "runterfallen"], ["abfallen", "herabfallen"], ["abfallen", "herunterfallen"], ["herabfallen", "herunterfallen"], ["fallen", "herabfallen"], ["fallen", "herunterfallen"], ["haengen", "hinhaengen"], ["aufhaengen", "hinhaengen"], ["haben", "stattfinden"], ["sein", "stattfinden"], ["warnschuss", "warnsignal"], ["warnsignal", "warnung"], ["warnsignal", "warnzeichen"], ["warnschuss", "warnung"], ["warnschuss", "warnzeichen"], ["warnung", "warnzeichen"], ["freischneiden", "zurueckschneiden"], ["entfernen", "freischneiden"], ["freischneiden", "wegschneiden"], ["entfernen", "zurueckschneiden"], ["wegschneiden", "zurueckschneiden"], ["entfernen", "wegschneiden"], ["kraeftig", "toenend"], ["kraftvoll", "toenend"], ["sonor", "toenend"], ["toenend", "tragend"], ["fest", "toenend"], ["kraeftig", "sonor"], ["kraeftig", "tragend"], ["fest", "kraeftig"], ["kraftvoll", "sonor"], ["kraftvoll", "tragend"], ["fest", "kraftvoll"], ["sonor", "tragend"], ["fest", "sonor"], ["fest", "tragend"], ["methodik", "vorgehensweise"], ["methode", "methodik"], ["methode", "vorgehensweise"], ["der", "selbiger"], ["der", "selber"], ["jener", "selbiger"], ["jener", "selber"], ["dieser", "selbiger"], ["dieser", "selber"], ["selber", "selbiger"], ["dafuer", "ersatzweise"], ["ersatzweise", "stattdessen"], ["ersatzweise", "hierfuer"], ["dafuer", "stattdessen"], ["hierfuer", "stattdessen"], ["dual", "zweier"], ["zwei", "zweier"], ["2er", "zweier"], ["doppel", "zweier"], ["dual", "zwei"], ["2er", "dual"], ["doppel", "dual"], ["2er", "zwei"], ["doppel", "zwei"], ["2er", "doppel"], ["fahren", "kommen"], ["anreisen", "kommen"], ["kommen", "nehmen"], ["anreisen", "fahren"], ["fahren", "nehmen"], ["anreisen", "nehmen"], ["abrufen", "zugreifen"], ["aktivieren", "zugreifen"], ["abrufen", "aktivieren"], ["ausschlachten", "bedienen"], ["ausschlachten", "operieren"], ["arbeiten", "ausschlachten"], ["ausschlachten", "bewirtschaften"], ["bedienen", "operieren"], ["arbeiten", "bedienen"], ["bedienen", "bewirtschaften"], ["arbeiten", "operieren"], ["bewirtschaften", "operieren"], ["arbeiten", "bewirtschaften"], ["anwendungsbereich", "geltungsbereich"], ["gegeben", "vorhanden"], ["bestehend", "gegeben"], ["gegeben", "herrschend"], ["gegeben", "obwaltend"], ["bestehend", "vorhanden"], ["herrschend", "vorhanden"], ["obwaltend", "vorhanden"], ["bestehend", "herrschend"], ["bestehend", "obwaltend"], ["herrschend", "obwaltend"], ["kommen", "prioritaer"], ["prioritaer", "vorgehen"], ["kommen", "vorgehen"], ["lauf", "verlauf"], ["gang", "lauf"], ["gang", "verlauf"], ["aktiv", "taetiger"], ["aktiv", "taetig"], ["aktiv", "arbeitende"], ["aktiv", "schaffender"], ["aktiv", "arbeiter"], ["aktiv", "arbeitender"], ["taetig", "taetiger"], ["arbeitende", "taetiger"], ["schaffender", "taetiger"], ["arbeiter", "taetiger"], ["arbeitender", "taetiger"], ["arbeitende", "taetig"], ["schaffender", "taetig"], ["arbeiter", "taetig"], ["arbeitender", "taetig"], ["arbeitende", "schaffender"], ["arbeitende", "arbeiter"], ["arbeitende", "arbeitender"], ["arbeiter", "schaffender"], ["arbeitender", "schaffender"], ["arbeitender", "arbeiter"], ["sie", "unbekannte"], ["sie", "welche"], ["unbekannte", "welche"], ["bedraengnis", "druck"], ["druck", "ungemach"], ["drangsal", "druck"], ["druck", "last"], ["bedraengnis", "ungemach"], ["bedraengnis", "drangsal"], ["bedraengnis", "last"], ["drangsal", "ungemach"], ["last", "ungemach"], ["drangsal", "last"], ["handeln", "verfahren"], ["handeln", "vorgehen"], ["arbeiten", "handeln"], ["arbeiten", "verfahren"], ["arbeiten", "vorgehen"], ["veraendert", "versehrt"], ["beeintraechtigt", "versehrt"], ["korrumpiert", "versehrt"], ["beeintraechtigt", "veraendert"], ["korrumpiert", "veraendert"], ["beeintraechtigt", "korrumpiert"], ["stecken", "vollziehen"], ["durchmachen", "stecken"], ["durchlaufen", "stecken"], ["durchmachen", "vollziehen"], ["durchlaufen", "vollziehen"], ["sein", "vollziehen"], ["durchlaufen", "durchmachen"], ["durchmachen", "sein"], ["durchlaufen", "sein"], ["bedingung", "vorbedingung"], ["vorbedingung", "vorbehalt"], ["voraussetzung", "vorbedingung"], ["einschraenkung", "vorbedingung"], ["bedingung", "vorbehalt"], ["bedingung", "voraussetzung"], ["bedingung", "einschraenkung"], ["voraussetzung", "vorbehalt"], ["einschraenkung", "vorbehalt"], ["einschraenkung", "voraussetzung"], ["abbauen", "entnehmen"], ["abbauen", "abziehen"], ["abziehen", "entnehmen"], ["belastet", "verunreinigt"], ["belastet", "verseucht"], ["belastet", "kontaminiert"], ["verseucht", "verunreinigt"], ["kontaminiert", "verunreinigt"], ["kontaminiert", "verseucht"], ["fensterscheibe", "glasscheibe"], ["laufrad", "rad"], ["einlage", "einschlag"], ["einschlag", "einsprengsel"], ["einlage", "einsprengsel"], ["schlossfalle", "schnapper"], ["falle", "schnapper"], ["falle", "schlossfalle"], ["begruessenswert", "gut"], ["begruessenswert", "freuen"], ["begruessenswert", "willkommen"], ["begruessenswert", "schoen"], ["begruessenswert", "erfreulich"], ["freuen", "gut"], ["gut", "willkommen"], ["erfreulich", "gut"], ["freuen", "willkommen"], ["freuen", "schoen"], ["erfreulich", "freuen"], ["schoen", "willkommen"], ["erfreulich", "willkommen"], ["erfreulich", "schoen"], ["datenpraesentation", "tabelle"], ["datenpraesentation", "infotafel"], ["datenpraesentation", "matrix"], ["infotafel", "tabelle"], ["matrix", "tabelle"], ["infotafel", "matrix"], ["zuallererst", "zuerst"], ["erstens", "zuallererst"], ["erstens", "zunaechst"], ["erstens", "zuerst"], ["einfach", "gut"], ["meinen", "zielen"], ["betreffen", "meinen"], ["abheben", "meinen"], ["betreffen", "zielen"], ["abheben", "zielen"], ["abheben", "betreffen"], ["aufeinander-einwirken", "wechselwirkung"], ["interaktion", "wechselwirkung"], ["wechselwirkung", "zusammenspiel"], ["interagieren", "wechselwirkung"], ["miteinander", "wechselwirkung"], ["wechselwirkung", "zusammenwirken"], ["aufeinander-einwirken", "interaktion"], ["aufeinander-einwirken", "zusammenspiel"], ["aufeinander-einwirken", "interagieren"], ["aufeinander-einwirken", "miteinander"], ["aufeinander-einwirken", "zusammenwirken"], ["interaktion", "zusammenspiel"], ["interagieren", "interaktion"], ["interaktion", "miteinander"], ["interaktion", "zusammenwirken"], ["interagieren", "zusammenspiel"], ["miteinander", "zusammenspiel"], ["interagieren", "miteinander"], ["interagieren", "zusammenwirken"], ["miteinander", "zusammenwirken"], ["einbauen", "installieren"], ["ausbringen", "einbauen"], ["einbauen", "verteilen"], ["ausbringen", "verteilen"], ["ausbringen", "einsetzen"], ["einsetzen", "verteilen"], ["aufgeheizt", "erregt"], ["aufgeladen", "erregt"], ["erregt", "scharf"], ["erregt", "hitzig"], ["erbittert", "erregt"], ["erregt", "heiss"], ["aufgeheizt", "aufgeladen"], ["aufgeheizt", "scharf"], ["aufgeheizt", "hitzig"], ["aufgeheizt", "erbittert"], ["aufgeheizt", "heiss"], ["aufgeladen", "scharf"], ["aufgeladen", "hitzig"], ["aufgeladen", "erbittert"], ["aufgeladen", "heiss"], ["heiss", "hitzig"], ["erbittert", "heiss"], ["das", "dat"], ["dat", "dies"], ["betonhart", "durchgehaertet"], ["betonhart", "hochfest"], ["ausgetrocknet", "betonhart"], ["ausgehaertet", "betonhart"], ["betonhart", "fest"], ["durchgehaertet", "hochfest"], ["ausgetrocknet", "durchgehaertet"], ["ausgehaertet", "durchgehaertet"], ["durchgehaertet", "fest"], ["ausgetrocknet", "hochfest"], ["ausgehaertet", "hochfest"], ["fest", "hochfest"], ["ausgehaertet", "ausgetrocknet"], ["ausgetrocknet", "fest"], ["ausgehaertet", "fest"], ["drehknopf", "drehregler"], ["drehregler", "drehsteller"], ["drehknopf", "drehsteller"], ["eindeutig", "zwangslaeufig"], ["berechenbar", "zwangslaeufig"], ["bestimmt", "zwangslaeufig"], ["deterministisch", "zwangslaeufig"], ["festgelegt", "zwangslaeufig"], ["berechenbar", "eindeutig"], ["deterministisch", "eindeutig"], ["eindeutig", "festgelegt"], ["berechenbar", "bestimmt"], ["berechenbar", "deterministisch"], ["berechenbar", "festgelegt"], ["bestimmt", "deterministisch"], ["deterministisch", "festgelegt"], ["teil", "tranche"], ["stueckelung", "tranche"], ["einheit", "tranche"], ["stueckelung", "teil"], ["einheit", "teil"], ["einheit", "stueckelung"], ["abspecken", "einschrumpfen"], ["abspecken", "reduzieren"], ["abspecken", "verkuerzen"], ["abspecken", "kuerzen"], ["abspecken", "verkleinern"], ["abspecken", "eindampfen"], ["abspecken", "straffen"], ["einschrumpfen", "reduzieren"], ["einschrumpfen", "verkuerzen"], ["einschrumpfen", "kuerzen"], ["einschrumpfen", "verkleinern"], ["eindampfen", "einschrumpfen"], ["einschrumpfen", "straffen"], ["reduzieren", "verkuerzen"], ["kuerzen", "reduzieren"], ["reduzieren", "verkleinern"], ["eindampfen", "reduzieren"], ["reduzieren", "straffen"], ["verkleinern", "verkuerzen"], ["eindampfen", "verkuerzen"], ["straffen", "verkuerzen"], ["kuerzen", "verkleinern"], ["eindampfen", "kuerzen"], ["kuerzen", "straffen"], ["eindampfen", "verkleinern"], ["straffen", "verkleinern"], ["eindampfen", "straffen"], ["gefaelle", "unterschied"], ["abstand", "unterschied"], ["abstand", "gefaelle"], ["all", "ganz"], ["all", "total"], ["all", "uebergreifend"], ["all", "gesamt"], ["all", "pan"], ["all", "omni"], ["ganz", "total"], ["ganz", "uebergreifend"], ["ganz", "pan"], ["ganz", "omni"], ["total", "uebergreifend"], ["gesamt", "total"], ["pan", "total"], ["omni", "total"], ["gesamt", "uebergreifend"], ["pan", "uebergreifend"], ["omni", "uebergreifend"], ["gesamt", "pan"], ["gesamt", "omni"], ["omni", "pan"], ["verhalten", "vorsichtig"], ["blogpost", "eintrag"], ["blog-post", "eintrag"], ["blogeintrag", "eintrag"], ["eintrag", "post"], ["blog-post", "blogpost"], ["blogeintrag", "blogpost"], ["blogpost", "post"], ["blog-post", "blogeintrag"], ["blog-post", "post"], ["blogeintrag", "post"], ["fit", "passung"]];

// data/compound-parts.json
var compound_parts_default = { inhaltsverzeichnis: ["inhalts", "verzeichnis"], seitencode: ["seit", "code"], bilddatei: ["bild", "datei"], originalseite: ["original", "seite"], originaltitel: ["original", "titel"], beschreibung: ["besch", "reibung"], vorderseite: ["vorder", "seite"], fahrzeugs: ["fahr", "zeugs"], inspektionsumfaengen: ["inspektion", "umfaengen"], seitenverweisen: ["seiten", "verweisen"], reparaturhandbuch: ["reparatur", "handbuch"], hebebuehne: ["hebe", "buehne"], vorsichtsmassnahmen: ["vorsicht", "massnahmen"], asbesthaltigen: ["asbest", "haltig"], vorabnahme: ["vorab", "ahme"], zusatzarbeiten: ["zusatz", "arbeiten"], fachbegriffe: ["fach", "begriffe"], englisch: ["engl", "isch"], asbesthaltige: ["asbest", "haltig"], jahreskontrolle: ["jahres", "kontrolle"], motoroelservice: ["motoroel", "service"], startseite: ["start", "seite"], abschnittsuebersicht: ["abschnitts", "uebersicht"], einleitungsseite: ["einleitung", "seite"], fachgerechte: ["fach", "gerechte"], instandsetzungsarbeiten: ["instandsetzung", "arbeiten"], handbuchs: ["hand", "buchs"], arbeitsnummern: ["arbeit", "nummern"], seitenzahlensystem: ["seiten", "zahlensystem"], sonderwerkzeugen: ["sonder", "werkzeugen"], einbauarbeiten: ["einbau", "arbeiten"], hauptgruppe: ["haupt", "gruppe"], seitenkennung: ["seiten", "kennung"], fachgerechten: ["fach", "gerechten"], reparaturarbeiten: ["reparatur", "arbeiten"], unterstuetzen: ["unterst", "uetze"], werkstattmeistern: ["werkstatt", "meistern"], kundendienstschulen: ["kundendienst", "schulen"], einstellwerte: ["eins", "tell", "werte"], mikrofilmen: ["mikro", "filmen"], sollwerte: ["soll", "werte"], serienmaessig: ["serien", "maessig"], fahrzeug: ["fahr", "zeug"], unfallschaeden: ["unfall", "schaeden"], baugruppensystem: ["baugruppe", "system"], uebernommen: ["uebern", "omme"], querverweise: ["quer", "verweise"], arbeitsvorgaenge: ["arbeit", "vorgaenge"], arbeitsrichtzeiten: ["arbeit", "richtzeiten"], reparaturverfahren: ["reparatur", "verfahren"], seitennummer: ["seiten", "nummer"], numerischer: ["numeri", "scher"], reihenfolge: ["reihe", "folge"], reparaturarbeit: ["reparatur", "arbeit"], sonderwerkzeuge: ["sonder", "werkzeuge"], zusammengefasst: ["zusammen", "gefasst"], beschreibungen: ["besch", "reibungen"], ausbauarbeiten: ["ausbau", "arbeiten"], handbuch: ["hand", "buch"], beschrieben: ["besch", "rieben"], arbeitsschritte: ["arbeit", "schritte"], regelmaessig: ["regel", "maessig"], herausgegebenen: ["heraus", "gegebenen"], heranzuziehen: ["heran", "zuziehen"], bayerische: ["bayer", "ische"], kundendienstabteilung: ["kundendienst", "abteilung"], deutschland: ["deut", "schland"], teilweise: ["teil", "weise"], westdeutschland: ["west", "deutschland"], werkstattmeister: ["werkstatt", "meister"], kundendienstschule: ["kundendienst", "schule"], serienfahrzeug: ["serien", "fahrzeug"], arbeitsnummer: ["arbeit", "nummer"], querverweis: ["quer", "verweis"], ansatzpunkte: ["ansatz", "punkte"], beziehungsweise: ["beziehung", "weise"], fotografien: ["foto", "grafie"], veranschaulichen: ["vera", "schau", "lichen"], aufnahmepunkte: ["aufnahme", "punkte"], laengstraegern: ["laengs", "traegern"], hebebuehnen: ["hebe", "buehnen"], gummiauflagen: ["gummi", "auflagen"], kraftstofftank: ["kraftstoff", "tank"], fahrzeugaufbau: ["fahrzeug", "aufbau"], sicherzustellen: ["sicher", "zustellen"], freiraum: ["frei", "raum"], gegebenenfalls: ["gegeben", "falls"], spritzschutz: ["spritz", "schutz"], gesetzlichen: ["gesetz", "lichen"], unfallverhuetung: ["unfall", "verhuetung"], instandhaltung: ["instand", "haltung"], rahmenteile: ["rahmen", "teile"], gummiaufsatz: ["gummi", "aufsatz"], hebebuehnenarms: ["hebebuehne", "arms"], fahrtrichtung: ["fahrt", "richtung"], verlaufenden: ["verlauf", "enden"], rahmenteils: ["rahmen", "teils"], fahrzeughebers: ["fahrzeug", "hebers"], ebenfalls: ["eben", "falls"], kraftstofftanks: ["kraftstoff", "tanks"], beschriebenen: ["besch", "rieben"], aufnahmepunkten: ["aufnahme", "punkten"], heberteller: ["heber", "teller"], zwischenlage: ["zwischen", "lage"], kunststoff: ["kunst", "stoff"], rahmenteilen: ["rahmen", "teilen"], bodenblech: ["boden", "blech"], aufnahmepunkt: ["aufnahme", "punkt"], beugewinkel: ["beuge", "winkel"], rahmenteil: ["rahm", "teil"], laengstraeger: ["laengs", "traeger"], ansatzpunkt: ["ansatz", "punkt"], halfshaft: ["half", "haft"], sicherheitshinweise: ["sicherheit", "hinweise"], zuendschluesselstellung: ["zuendschluessel", "stellung"], bremskraftverstaerkung: ["bremskraft", "verstaerkung"], fahrzeuge: ["fahr", "zeuge"], automatikgetriebe: ["automatik", "getriebe"], hoechstgeschwindigkeit: ["hoechst", "geschwindigkeit"], maximale: ["maxi", "male"], massnahmen: ["mass", "ahmen"], abschleppstrecken: ["abschleppst", "recken"], fahrzeugen: ["fahr", "zeugen"], zuendschluessel: ["zuend", "schluessel"], scheibenwischer: ["scheibe", "wischer"], bremskraftverstaerker: ["bremskraft", "verstaerker"], ziehende: ["zieh", "ende"], kunststofffaserseile: ["kunststoff", "faserseile"], verbindungsgliedern: ["verbindung", "gliedern"], kilometer: ["kilo", "meter"], gelenkwelle: ["gelenk", "welle"], transmission: ["trans", "mission"], automatikgetriebeoel: ["automatik", "getriebeoel"], sicherheitsvorkehrungen: ["sicherheit", "vorkehrungen"], fahrzeugteilen: ["fahrzeug", "teilen"], beschreibt: ["besch", "reibt"], asbestfeinstaub: ["asbest", "feinstaub"], asbeststaub: ["asbest", "staub"], handbetaetigte: ["hand", "betaetigte"], laufende: ["lauf", "ende"], erforderlichenfalls: ["erforderlich", "falls"], staubabsaugung: ["staub", "absaugung"], schnelllaufende: ["schnell", "laufende"], staubabsaugvorrichtungen: ["staub", "absaugvorrichtungen"], kupplungsteile: ["kupplung", "steile"], vollstaendig: ["voll", "staendig"], asbestabfaelle: ["asbest", "abfaelle"], staubabsauggeraet: ["staub", "absauggeraet"], bremsteile: ["bremst", "eile"], ablieferungsinspektion: ["ablieferung", "inspektion"], arbeitsanweisungen: ["arbeit", "anweisungen"], checkliste: ["check", "liste"], fahrzeuguebergabe: ["fahrzeug", "uebergabe"], kuehlsystem: ["kuehl", "system"], zuendkerzen: ["zuend", "kerzen"], kraftstoffanlage: ["kraftstoff", "anlage"], abgasanlage: ["abgas", "anlage"], serviceinformationen: ["service", "informationen"], betriebsanleitung: ["betriebs", "anleitung"], vorabinspektion: ["vorab", "inspektion"], motoroelstand: ["motor", "oelstand"], schmieroels: ["schmier", "oels"], serviceinformation: ["service", "information"], wichtiger: ["wich", "tiger"], freigegebenes: ["frei", "gegebenes"], keilriemen: ["keil", "riemen"], kuehlmittelschlaeuche: ["kuehlmittel", "schlaeuche"], sichtpruefung: ["sicht", "pruefung"], schlauchschellen: ["schlauch", "schellen"], kuehlmittelstand: ["kuehl", "mittelstand"], frostschutz: ["frost", "schutz"], korrosionsschutzmittel: ["korrosion", "schutzmittel"], batteriesaeurestand: ["batteriesaeure", "stand"], batterieklemmen: ["batterie", "klemmen"], elektrodenabstand: ["elektrode", "abstand"], einstellen: ["einst", "ellen"], kraftstoffleitungen: ["kraftstoff", "leitungen"], kraftstoffbehaelter: ["kraftstoff", "behaelter"], tankdeckel: ["tank", "deckel"], betriebsstoffdatei: ["betriebsstoff", "datei"], kuehlmittelschlauch: ["kuehlmittel", "schlauch"], schlauchschelle: ["schlauch", "schelle"], batterieklemme: ["batterie", "klemme"], zuendkerze: ["zuend", "kerze"], kraftstoffleitung: ["kraftstoff", "leitung"], kraftstofffilter: ["kraftstoff", "filter"], kraftstoffeinspritzanlage: ["kraftstoff", "einspritzanlage"], automatisch: ["automat", "isch"], wartungsplan: ["wartung", "plan"], gemeinsame: ["gemein", "same"], wartungsumfang: ["wartung", "umfang"], anzugsdrehmomente: ["anzugs", "drehmomente"], zuendanlage: ["zuend", "anlage"], fahrzeuguebergabeinspektion: ["fahrzeuguebergabe", "inspektion"], kupplungshydraulik: ["kupplung", "hydraulik"], signalhorn: ["signal", "horn"], bedienelementen: ["bedien", "elementen"], sicherungskasten: ["sicherung", "kasten"], bordcomputer: ["bord", "computer"], reparaturgruppen: ["reparatur", "gruppen"], sichtkontrolle: ["sicht", "kontrolle"], lenkungskupplung: ["lenkung", "kupplung"], spurstangen: ["spur", "tangen"], vorderachse: ["vorder", "achse"], vorhandensein: ["vorhand", "sein"], servolenkungsfluessigkeit: ["servolenkung", "fluessigkeit"], anzugsdrehmoment: ["anzugs", "drehmoment"], fluessigkeitsstand: ["fluessigkeit", "stand"], vorratsbehaelter: ["vorrats", "behaelter"], kupplungsanlage: ["kupplung", "anlage"], reifenzustand: ["reifen", "zustand"], reifengroesse: ["reifen", "groesse"], reifenfuelldruck: ["reifen", "fuelldruck"], standlicht: ["stand", "licht"], fahrtrichtungsanzeiger: ["fahrtrichtung", "anzeiger"], schlussleuchten: ["schluss", "leuchten"], fernlicht: ["fern", "licht"], seitenmarkierungsleuchten: ["seitenmarkierung", "leuchten"], kennzeichenleuchten: ["kennzeichen", "leuchten"], innenraumbeleuchtung: ["innenraum", "beleuchtung"], verzoegerungsanlage: ["verzoegerung", "anlage"], handschuhfachleuchte: ["handschuhfach", "leuchte"], kofferraumleuchte: ["kofferraum", "leuchte"], motorraumleuchte: ["motorraum", "leuchte"], scheinwerfereinstellung: ["scheinwerfer", "einstellung"], lichthupe: ["licht", "hupe"], sicherungsbestueckung: ["sicherung", "bestueckung"], ersatzsicherungen: ["ersatz", "sicherungen"], drucktastenschalters: ["drucktaste", "schalters"], betriebsstoffkartei: ["betriebsstoff", "kartei"], scheinwerfer: ["schein", "werfer"], wartungsuebersicht: ["wartung", "uebersicht"], servicearbeiten: ["service", "arbeiten"], uebergabeinspektion: ["uebergabe", "inspektion"], kennziffer: ["kenn", "ziffer"], scheibenwasch: ["scheibe", "wasch"], wischanlagen: ["wisch", "anlagen"], heckscheibenheizung: ["heckscheibe", "heizung"], zentralverriegelung: ["zentral", "verriegelung"], sicherheitsgurte: ["sicherheit", "gurte"], helligkeitsregelung: ["helligkeit", "regelung"], lichtmaschine: ["licht", "maschine"], kuehlmitteltemperatur: ["kuehlmittel", "temperatur"], lambdasonde: ["lambda", "sonde"], sicherheitsgurtleuchten: ["sicherheitsgurt", "leuchten"], kraftstoffvorrat: ["kraftstoff", "vorrat"], scheibenwaschanlage: ["scheiben", "waschanlage"], fuellstand: ["fuell", "stand"], frostschutzmittel: ["frostschutz", "mittel"], scheibenwisch: ["scheibe", "wisch"], waschanlage: ["wasch", "anlage"], spritzduesen: ["spritz", "duesen"], schutzfolien: ["schutz", "folien"], wischerblaettern: ["wischer", "blaettern"], zigarettenanzuenders: ["zigarette", "anzuender"], scheinwerferreinigungsanlage: ["scheinwerfer", "reinigungsanlage"], elektrischen: ["elektr", "isch"], verbraucher: ["verb", "raucher"], sonderausstattung: ["sonder", "ausstattung"], elektrische: ["elektr", "ische"], fensterheber: ["fenster", "heber"], schiebedach: ["schiebe", "dach"], nebelleuchten: ["nebel", "leuchten"], radioantenne: ["radio", "antenne"], faderregelung: ["fader", "regelung"], aussenspiegel: ["aussen", "spiegel"], sitzverstellung: ["sitz", "verstellung"], elektrisch: ["elektr", "isch"], instrumentenbeleuchtung: ["instrumente", "beleuchtung"], kraftstoffvorratsanzeige: ["kraftstoff", "vorratsanzeige"], zigarettenanzuender: ["zigarette", "anzuender"], arbeitsumfang: ["arbeit", "umfang"], mittelkonsole: ["mittel", "konsole"], aschenbecherkonsole: ["aschenbecher", "konsole"], auslieferungsinspektion: ["auslieferung", "inspektion"], fahrzeugdaten: ["fahrzeug", "daten"], ausstattungsmerkmale: ["ausstattung", "merkmale"], werkzeuge: ["werk", "zeuge"], kennzeichnungsaufkleber: ["kennzeichnung", "aufkleber"], bordunterlagen: ["bord", "unterlagen"], zubehoerteile: ["zubehoer", "teile"], sollwerten: ["soll", "werten"], tabellenwerte: ["tabelle", "werte"], datenplakette: ["daten", "plakette"], fahrgestell: ["fahr", "gestell"], motornummern: ["motor", "nummern"], fahrzeugausstattung: ["fahrzeug", "ausstattung"], vergleichen: ["vergl", "eichen"], zierblenden: ["zier", "blenden"], endrohrverlaengerung: ["endrohr", "verlaengerung"], bordwerkzeug: ["bord", "werkzeug"], werkzeugkasten: ["werkzeug", "kasten"], wagenheber: ["wagen", "heber"], radschraubenschluessel: ["radschraube", "schluessel"], bremsfluessigkeitswechsel: ["bremsfluessigkeit", "wechsel"], ersatzschluessel: ["ersatz", "schluessel"], schluesseltasche: ["schluessel", "tasche"], handschuhfach: ["handschuh", "fach"], garantieunterlagen: ["garantie", "unterlagen"], bedienungsanleitung: ["bedienung", "anleitung"], werksrechnung: ["werks", "rechnung"], kassettenlaufwerk: ["kassette", "laufwerk"], fahrgestellnummer: ["fahrgestell", "nummer"], motornummer: ["motor", "nummer"], probefahrt: ["probe", "fahrt"], funktionspruefung: ["funktion", "pruefung"], fahrzeugfunktionen: ["fahrzeug", "funktionen"], heranzuziehenden: ["heran", "zuziehenden"], sollwert: ["soll", "wert"], nennwert: ["nenn", "wert"], betriebsanleitungsinformationen: ["betriebsanleitung", "informationen"], nennwerte: ["nenn", "werte"], leerlaufdrehzahl: ["leerlauf", "drehzahl"], fahrverhalten: ["fahr", "verhalten"], hinterachse: ["hinter", "achse"], geradeausstellung: ["geradeaus", "stellung"], scheibenbremsen: ["scheibe", "bremsen"], feststellbremse: ["fest", "tell", "bremse"], frischluftbelueftung: ["frischluft", "belueftung"], klimaanlage: ["klima", "anlage"], geschwindigkeitsregelanlage: ["geschwindigkeit", "regelanlage"], abnahmeinspektion: ["abnahme", "inspektion"], diagnosesystems: ["diagnose", "systems"], sichtpruefungen: ["sicht", "pruefungen"], hydrauliksystemen: ["hydraulik", "systemen"], luftfilter: ["luft", "filter"], zuruecksetzen: ["zurueck", "setzen"], ruecksteller: ["rueckst", "eller"], diagnosesystem: ["diagnose", "system"], dichtheitspruefung: ["dichtheit", "pruefung"], staubschutzmanschetten: ["staubschutz", "manschetten"], abtriebswellen: ["abtrieb", "wellen"], luftfilters: ["luft", "filters"], luftansaugsystems: ["luft", "ansaugsystems"], innenraum: ["inne", "raum"], schutzabdeckungen: ["schutz", "abdeckungen"], zurueckgesetzt: ["zurueck", "gesetzt"], diagnosesteckdose: ["diagnose", "steckdose"], festhalten: ["fest", "halten"], funktionskontrolle: ["funktion", "kontrolle"], werkzeug: ["werk", "zeug"], anschlusskennzeichnungen: ["anschluss", "kennzeichnungen"], luftansaugsystem: ["luft", "ansaugsystem"], einstell: ["eins", "tell"], erneuerungsarbeiten: ["erneuerung", "arbeiten"], zugehoerigen: ["zuge", "hoerigen"], betriebsstoffen: ["betrieb", "stoffen"], anzugsdrehmomenten: ["anzugs", "drehmomenten"], sicherungselementen: ["sicherung", "elementen"], betriebswarmem: ["betrieb", "warmem"], ventilspiel: ["ventil", "spiel"], heizungsschlaeuche: ["heizung", "schlaeuche"], korrosionsschutz: ["korrosion", "schutz"], schaltgetriebe: ["schalt", "getriebe"], verteilergetriebe: ["verteiler", "getriebe"], betriebswarmer: ["betrieb", "warmer"], ordnungsgemaessen: ["ordnung", "gemaessen"], fahrwerks: ["fahr", "werks"], oelstand: ["oels", "tand"], serviceposition: ["service", "position"], kupplungssystemen: ["kupplung", "systemen"], freigegebener: ["frei", "gegebener"], betriebstemperatur: ["betriebs", "temperatur"], kupplungsanlagen: ["kupplung", "anlagen"], freigegebene: ["frei", "gegebene"], seilzuege: ["seil", "zuege"], reifenluftdruck: ["reifen", "luftdruck"], intensivwaschfluessigkeit: ["intensiv", "waschfluessigkeit"], wartungsarbeiten: ["wartung", "arbeiten"], klimaanlagen: ["klima", "anlagen"], sicherheitseinrichtungen: ["sicherheit", "einrichtungen"], reparaturhandbuchgruppen: ["reparaturhandbuch", "gruppen"], parkleuchten: ["park", "leuchten"], innenleuchten: ["innen", "leuchten"], handschuhkastenleuchte: ["handschuhkasten", "leuchte"], klimaanlagengeblaese: ["klimaanlage", "geblaese"], abschlusspruefung: ["abschluss", "pruefung"], betriebssicherheit: ["betriebs", "sicherheit"], wechselarbeiten: ["wechsel", "arbeiten"], reparaturhandbuchs: ["reparatur", "handbuchs"], fahrerhandbuch: ["fahrer", "handbuch"], freigegebenen: ["frei", "gegebenen"], wechselintervallen: ["wechsel", "intervallen"], drosselklappenhebels: ["drosselklappe", "hebels"], drosselklappe: ["drossel", "klappe"], tankverschluss: ["tank", "verschluss"], kuehlmittelkonzentration: ["kuehlmittel", "konzentration"], kuehlmittel: ["kuehl", "mittel"], drosselklappenhebel: ["drosselklappe", "hebel"], drosselklappenbetaetigung: ["drosselklappe", "betaetigung"], drosselklappenstutzen: ["drosselklappe", "stutzen"], arbeitsuebersicht: ["arbeit", "uebersicht"], fahrwerk: ["fahr", "werk"], hinterachsgetriebe: ["hinter", "achsgetriebe"], getriebeoelstand: ["getriebe", "oelstand"], schaltgetriebes: ["schalt", "getriebes"], zugstreben: ["zugs", "trebe"], scheibenbremsbelaege: ["scheiben", "bremsbelaege"], gesamtbelagdicke: ["gesamtbelag", "dicke"], oberflaechenzustand: ["oberflaeche", "zustand"], spaetestens: ["spaet", "esten"], schaltgetriebeoel: ["schalt", "getriebeoel"], nabenbereiche: ["naben", "bereiche"], aluminiumfelgen: ["aluminium", "felgen"], reifendruck: ["reife", "druck"], tuerscharniere: ["tuer", "scharniere"], motorhaubenscharniere: ["motorhaube", "scharniere"], tuerschloesser: ["tuer", "schloesser"], kaeltemittelfuellung: ["kaeltemittel", "fuellung"], dokumentationsuebersicht: ["dokumentation", "uebersicht"], wischanlage: ["wisch", "anlage"], heizungsfunktionen: ["heizung", "funktionen"], sicherheitspruefung: ["sicherheit", "pruefung"], vorgehensweise: ["vorgehe", "weise"], standlichter: ["stand", "lichter"], innenleuchte: ["innen", "leuchte"], verzoegerungssystem: ["verzoegerung", "system"], signalgeber: ["signal", "geber"], instrumententafelbedienung: ["instrumententafel", "bedienung"], abschlusskontrolle: ["abschluss", "kontrolle"], diodenleuchten: ["dioden", "leuchten"], anschlussdarstellung: ["anschluss", "darstellung"], originaltext: ["original", "text"], gegenueber: ["gegen", "ueber"], betriebsstoffauswahl: ["betriebs", "stoffauswahl"], betriebsbedingung: ["betriebs", "bedingung"], wechselintervall: ["wechsel", "intervall"], zahnriemens: ["zahn", "riemens"], antriebsriemen: ["antrieb", "riemen"], filtereinsatz: ["filter", "einsatz"], fahrzeugbetrieb: ["fahrzeug", "betrieb"], staubreichen: ["staub", "reichen"], hauptkraftstofffilter: ["haupt", "kraftstofffilter"], kraftstoffs: ["kraft", "stoffs"], wechselintervalle: ["wechsel", "intervalle"], verteilergetriebeoel: ["verteiler", "getriebeoel"], vorderradlager: ["vorder", "radlager"], automatikgetriebes: ["automatik", "getriebes"], zahnriemen: ["zahn", "riemen"], vorderachsgetriebe: ["vorder", "achsgetriebe"], belagstaerke: ["belag", "staerke"], feststellbremsbelaege: ["fest", "tell", "bremsbelaege"], kennzeichnung: ["kenn", "zeichnung"], bildnummer: ["bild", "nummer"], feststellbremsbelag: ["fest", "tell", "bremsbelag"], kuehlmittelwechsel: ["kuehlmittel", "wechsel"], rostschutzkontrolle: ["rostschutz", "kontrolle"], karosserie: ["karos", "serie"], sauerstoffsensors: ["sauerstoff", "sensors"], hauptbremszylinders: ["haupt", "bremszylinders"], bremskraftverstaerkers: ["bremskraft", "verstaerkers"], zusatzfahrleuchten: ["zusatz", "fahr", "leuchten"], frostschutzmittelzusaetze: ["frostschutzmittel", "zusaetze"], sechsjaehrigen: ["sechs", "jaehrigen"], sauerstoffsensor: ["sauerstoff", "sensor"], jahresinspektion: ["jahres", "inspektion"], hauptbremszylinder: ["haupt", "bremszylinder"], rostdurchrostungsgarantie: ["rost", "durchrostung", "garantie"], arbeitsanweisung: ["arbeit", "anweisung"], hineindruecken: ["hinein", "druecken"], serviceintervalle: ["service", "intervalle"], serviceleistung: ["service", "leistung"], arbeitsposition: ["arbeit", "position"], signalgebern: ["signal", "gebern"], sicherheitsgurten: ["sicherheit", "gurten"], sicherheitskontrolle: ["sicherheit", "kontrolle"], asbestfreien: ["asbest", "freien"], bremsfluessigkeitsstand: ["bremsfluessigkeit", "stand"], felgenpruefung: ["felgen", "pruefung"], lichtpruefung: ["licht", "pruefung"], zusatzscheinwerfer: ["zusatz", "scheinwerfer"], nebelscheinwerfer: ["nebel", "scheinwerfer"], signalbeleuchtung: ["signal", "beleuchtung"], gepaeckraumleuchten: ["gepaeckraum", "leuchten"], signalpruefung: ["signal", "pruefung"], wischerblaetter: ["wischer", "blaetter"], waschanlagenbehaelter: ["waschanlage", "behaelter"], windschutzscheibe: ["windschutz", "scheibe"], intensivreinigungsanlage: ["intensiv", "reinigungsanlage"], sicherheitsgurtpruefung: ["sicherheit", "gurtpruefung"], andruckrollen: ["andruck", "rollen"], betriebsstunden: ["betrieb", "stunden"], klangqualitaet: ["klang", "qualitaet"], sicherheitsgurt: ["sicherheit", "gurt"], vorderachstraeger: ["vorder", "achstraeger"], allradantrieb: ["allrad", "antrieb"], zylinderkopf: ["zylinder", "kopf"], steuergehaeuse: ["steuer", "gehaeuse"], kurbeltrieb: ["kurbel", "trieb"], anlasszahnkranz: ["anlass", "zahnkranz"], arbeitspositionsnummern: ["arbeitsposition", "nummern"], zylinderkopfhaube: ["zylinder", "kopfhaube"], ventilfuehrung: ["ventil", "fuehrung"], ventilsitze: ["ventil", "sitze"], dichtflaeche: ["dicht", "flaeche"], zylinderkopfes: ["zylinder", "kopfes"], oberteil: ["ober", "teil"], wellendichtring: ["wellen", "dichtring"], verteilergehaeuse: ["verteiler", "gehaeuse"], steuergehaeusedeckel: ["steuer", "gehaeusedeckel"], radialwellendichtring: ["radial", "wellendichtring"], abschlussdeckel: ["abschluss", "deckel"], kurbelwelle: ["kurbel", "welle"], kurbelwellenriemenscheibe: ["kurbelwellen", "riemenscheibe"], pilotlager: ["pilot", "lager"], passende: ["pass", "ende"], arbeitsschritt: ["arbeit", "schritt"], schwungradbefestigung: ["schwungrad", "befestigung"], nockenwelle: ["nocke", "welle"], steuerkette: ["steuer", "kette"], zugehoerige: ["zuge", "hoerige"], werkstatthandbuchseite: ["werkstatt", "handbuchseite"], pleuellagerschalen: ["pleuellager", "schalen"], kolbenringe: ["kolbe", "ringe"], steuerkettenraeder: ["steuer", "kettenraeder"], steuerkettenspanners: ["steuerkette", "spanners"], motoroeldruck: ["motor", "oeldruck"], antriebskette: ["antrieb", "kette"], hauptstromoelfilter: ["hauptstrom", "oelfilter"], fuehrungsrohr: ["fuehrung", "rohr"], wasserpumpe: ["wasser", "pumpe"], luefterkupplung: ["luefter", "kupplung"], kuehlmittelthermostat: ["kuehlmittel", "thermostat"], dipstick: ["dips", "tick"], ueberwurfmutter: ["ueberwurf", "mutter"], nockenwellenbefestigungen: ["nockenwellen", "befestigungen"], motorbaureihe: ["motor", "baureihe"], kettenspanner: ["ketten", "spanner"], oelpumpenantriebskette: ["oelpumpen", "antriebskette"], bauteiluebersicht: ["bauteil", "uebersicht"], schnittdarstellung: ["schnitt", "darstellung"], motoransicht: ["motor", "ansicht"], kompressionspruefung: ["kompression", "pruefung"], abgaskruemmer: ["abgas", "kruemmer"], einbaumasse: ["einbau", "masse"], oelwannensektion: ["oelwanne", "sektion"], motoruebersicht: ["motor", "uebersicht"], explosionsdarstellung: ["explosion", "darstellung"], sichtbaren: ["sicht", "baren"], ventiltrieb: ["ventil", "trieb"], kraftstoffeinspritzung: ["kraftstoff", "einspritzung"], steuertrieb: ["steuer", "trieb"], nebenaggregaten: ["neben", "aggregaten"], kuehlerantrieb: ["kuehler", "antrieb"], uebersichtszeichnung: ["uebersicht", "zeichnung"], motorbauteile: ["motor", "bauteile"], motordarstellung: ["motor", "darstellung"], kuehlerluefter: ["kuehler", "luefter"], schallschutzhaube: ["schall", "schutzhaube"], kompressionsdruck: ["kompression", "druck"], kompressionsdrucks: ["kompression", "drucks"], hauptrelais: ["haupt", "relais"], zuendkerzenstecker: ["zuendkerze", "stecker"], kompressionspruefadapter: ["kompression", "pruefadapter"], sollbereich: ["soll", "bereich"], verkleidungsabdeckung: ["verkleidung", "abdeckung"], zuendleitungskanal: ["zuend", "leitungskanal"], sonderwerkzeug: ["sonder", "werkzeug"], herausschrauben: ["heraus", "schrauben"], kompressionspruefer: ["kompression", "pruefer"], niederdruecken: ["nieder", "druecken"], mehreren: ["mehr", "eren"], bildfolgen: ["bild", "folgen"], kuehlmittelschlaeuchen: ["kuehlmittel", "schlaeuchen"], tempomatbetaetigung: ["tempomat", "betaetigung"], kuehlsystems: ["kuehl", "systems"], beiseitelegen: ["beiseite", "legen"], masseband: ["masse", "band"], tempomatbowdenzug: ["tempomat", "bowdenzug"], unterdruckschlauch: ["unterdruck", "schlauch"], herausheben: ["heraus", "heben"], zuendleitung: ["zuend", "leitung"], zuendspule: ["zuend", "spule"], gegenueberliegenden: ["gegenueber", "liegenden"], motorende: ["motor", "ende"], leerlaufregelventil: ["leerlauf", "regelventil"], motorraumfotos: ["motorraum", "fotos"], kraftstoff: ["kraft", "stoff"], kraftstoffdruckregler: ["kraftstoff", "druckregler"], motorkabelbaum: ["motor", "kabelbaum"], leerlaufsteller: ["leerlauf", "steller"], aktivkohlefilter: ["aktivkohle", "filter"], arbeitsbereich: ["arbeit", "bereich"], montagehinweis: ["montage", "hinweis"], kraftstoffschlaeuche: ["kraftstoff", "schlaeuche"], herausnehmen: ["heraus", "nehmen"], druckregler: ["druck", "regler"], herausziehen: ["heraus", "ziehen"], gummihalter: ["gummi", "halter"], kabelstrang: ["kabel", "strang"], steckerleiste: ["stecker", "leiste"], entlueftungsschlauch: ["entlueftung", "schlauch"], heizungsschlauch: ["heizung", "schlauch"], kraftstoffschlauch: ["kraftstoff", "schlauch"], steckerplatte: ["stecker", "platte"], servolenkungspumpe: ["servolenkung", "pumpe"], klimakompressor: ["klima", "kompressor"], motorhaube: ["motor", "haube"], motorlager: ["motor", "lager"], spezialwerkzeug: ["spezial", "werkzeug"], einbauhinweise: ["einbau", "hinweise"], antriebsriemenspannung: ["antriebsriemen", "spannung"], oelkuehlerschlaeuche: ["oelkuehler", "schlaeuche"], oelfiltergehaeuse: ["oelfilter", "gehaeuse"], masseleitung: ["masse", "leitung"], ueberwurfmuttern: ["ueberwurf", "muttern"], hydraulikschlaeuche: ["hydraulik", "schlaeuche"], kaeltemittelschlaeuche: ["kaeltemittel", "schlaeuche"], gasdruckfeder: ["gasdruck", "feder"], kunststoffteil: ["kunst", "stoffteil"], zylinderkopfdeckel: ["zylinderkopf", "deckel"], arbeitsgang: ["arbeit", "gang"], zylinderkopfdeckels: ["zylinderkopf", "deckels"], zuendkabelabdeckung: ["zuendkabel", "abdeckung"], entlueftungsleitung: ["entlueftung", "leitung"], werkstattbuchseite: ["werkstatt", "buchseite"], zylinderkopfs: ["zylinder", "kopfs"], kuehlfluessigkeit: ["kuehl", "fluessigkeit"], betaetigungszuegen: ["betaetigung", "zuegen"], unterdruckleitungen: ["unterdruck", "leitungen"], zuendleitungen: ["zuend", "leitungen"], tempomatseilzug: ["tempomat", "seilzug"], detailabbildungen: ["detail", "abbildungen"], heizungsschlaeuchen: ["heizung", "schlaeuchen"], abgasflanschschrauben: ["abgas", "flansch", "schrauben"], lambdasondenverbindung: ["lambdasonde", "verbindung"], tassenstoessel: ["tassen", "stoessel"], schlepphebel: ["schlepp", "hebel"], selbstsichernden: ["selbst", "sichernden"], gummipuffer: ["gummi", "puffer"], dahinterliegenden: ["dahinter", "liegenden"], flanschschrauben: ["flansch", "schrauben"], herausdrehen: ["heraus", "drehen"], selbstsichernde: ["selbst", "sichernde"], kuehlerschlaeuche: ["kuehler", "schlaeuche"], arbeitsvorgang: ["arbeit", "vorgang"], einbaupositionen: ["einbau", "positionen"], spannschiene: ["spann", "schiene"], flanschschraube: ["flansch", "schraube"], kuehlerschlauch: ["kuehler", "schlauch"], zylinderkopfschrauben: ["zylinderkopf", "schrauben"], anbauteile: ["anbau", "teile"], bohrungsabmessung: ["bohrung", "abmessung"], montagehinweise: ["montage", "hinweise"], dichtflaechenarbeiten: ["dichtflaeche", "arbeiten"], dreistufige: ["drei", "stufige"], wartezeit: ["warte", "zeit"], dichtflaechen: ["dicht", "flaechen"], gleichmaessig: ["gleich", "maessig"], mikrometer: ["mikro", "meter"], innenschenkelmessgeraet: ["innenschenkel", "messgeraet"], einbaumass: ["einbau", "mass"], kurbelgehaeuse: ["kurbel", "gehaeuse"], dichtungsentferner: ["dichtung", "entferner"], handelsueblichen: ["handels", "ueblichen"], stahllineal: ["stahl", "lineal"], zylinderkopfdichtung: ["zylinder", "kopfdichtung"], anzugsfolge: ["anzug", "folge"], zylinderkopfschraube: ["zylinder", "kopfschraube"], hauptlagerschrauben: ["hauptlager", "schrauben"], motoroelwanne: ["motor", "oelwanne"], montagefotos: ["montage", "fotos"], befestigungsschrauben: ["befestigung", "schrauben"], dichtmittel: ["dicht", "mittel"], oelwannenabschnitt: ["oelwannen", "abschnitt"], verstaerkungsschale: ["verstaerkung", "schale"], motoroels: ["motor", "oels"], unterschiedlichen: ["unterschied", "lichen"], oelwannenschrauben: ["oelwannen", "schrauben"], oelwannenabschnitts: ["oelwannen", "abschnitts"], oelwannendichtung: ["oelwanne", "dichtung"], stossstelle: ["stoss", "stelle"], streichfaehigen: ["streich", "faehigen"], bezugsquelle: ["bezugs", "quelle"], kraftstoffversorgung: ["kraftstoff", "versorgung"], steuerkettenantrieb: ["steuerkette", "antrieb"], nebenaggregate: ["neben", "aggregate"], drosselklappengehaeuse: ["drosselklappe", "gehaeuse"], kraftstoffverteilerrohr: ["kraftstoff", "verteiler", "rohr"], kraftstoffeinspritzventile: ["kraftstoff", "einspritzventile"], kompressionspruefers: ["kompression", "pruefers"], kompressionsmessung: ["kompression", "messung"], bezugswerte: ["bezug", "werte"], arbeitsfolge: ["arbeit", "folge"], detailfotos: ["detail", "fotos"], positionsnummern: ["position", "nummern"], unterdruckleitung: ["unterdruck", "leitung"], halterungen: ["halte", "runge"], oelwannenleitung: ["oelwanne", "leitung"], aktivkohlebehaelter: ["aktivkohle", "behaelter"], motorkabelbaums: ["motor", "kabelbaum"], oelkuehlerleitungen: ["oelkuehler", "leitungen"], unterschiedliche: ["unterschied", "lich"], hydraulikleitungen: ["hydraulik", "leitungen"], seitlich: ["seit", "lich"], antriebsriemens: ["antrieb", "riemens"], motoraufhaengung: ["motor", "aufhaengung"], zuendleitungskanals: ["zuend", "leitungskanal"], entlueftungsschlauchs: ["entlueftung", "schlauchs"], abbildungsmarkierungen: ["abbildung", "markierungen"], massebands: ["masse", "bands"], kuehlmittelausgleichsbehaelter: ["kuehlmittel", "ausgleichsbehaelter"], tempomatseil: ["tempomat", "seil"], werkstattfotos: ["werkstatt", "fotos"], weiteren: ["weit", "eren"], kuehlmittelleitungen: ["kuehlmittel", "leitungen"], abgasflanschverbindung: ["abgas", "flanschverbindung"], lambdasondenstecker: ["lambdasonde", "stecker"], einbaulage: ["einbau", "lage"], anzugsdrehmomentwert: ["anzug", "drehmoment", "wert"], steckverbinder: ["steck", "verbinder"], sauerstoffueberwachungssonde: ["sauerstoff", "ueberwachung", "sonde"], steuergehaeuseabdeckung: ["steuer", "gehaeuseabdeckung"], tassenstoesselspiels: ["tassen", "stoessel", "spiels"], tassenstoesseldurchmesser: ["tassen", "stoessel", "durchmesser"], schraubengewinde: ["schraube", "gewinde"], tassenstoesselspiel: ["tasse", "stoessel", "spiel"], mikrometerschraube: ["mikrometer", "schraube"], innenmessgeraet: ["innen", "messgeraet"], tassenstoesselbohrung: ["tassen", "stoessel", "bohrung"], hartholzschaber: ["hartholz", "schaber"], stahlmassstab: ["stahl", "massstab"], spannschienen: ["spann", "schienen"], anzugsstufe: ["anzug", "stufe"], bildkennzeichnungen: ["bild", "kennzeichnungen"], ventilfuehrungen: ["ventil", "fuehrungen"], kippspiels: ["kipp", "spiels"], ventilschaft: ["ventil", "schaft"], ventilsitzen: ["ventil", "sitzen"], verschleissgrenzen: ["verschleiss", "grenzen"], sollmasse: ["soll", "masse"], sitzbreiten: ["sitz", "breiten"], auslassventile: ["auslass", "ventile"], ventilschafts: ["ventil", "schafts"], kippspiel: ["kipp", "spiel"], einlassventil: ["einlas", "ventil"], auslassventil: ["auslas", "ventil"], uebermassventil: ["uebermass", "ventil"], schaftdurchmesser: ["schaft", "durchmesser"], ventilsitz: ["ventil", "sitz"], zurueckdrehen: ["zurueck", "drehen"], werkzeugkennzeichnung: ["werkzeug", "kennzeichnung"], ventilsitzwinkels: ["ventilsitz", "winkels"], ventilsitzdurchmesser: ["ventilsitz", "durchmesser"], sitzbreite: ["sitz", "breite"], korrekturwinkeln: ["korrektur", "winkeln"], abbildungsmasse: ["abbildung", "masse"], abbildungsnummern: ["abbildung", "nummern"], ventilsitzwinkel: ["ventilsitz", "winkel"], korrekturwinkel: ["korrektur", "winkel"], ventilsitzbreite: ["ventil", "sitzbreite"], zylinderkopfdichtflaeche: ["zylinderkopf", "dichtflaeche"], freigabe: ["frei", "gabe"], lediglich: ["ledig", "lich"], schwerpunkt: ["schwer", "punkt"], druckpruefung: ["druck", "pruefung"], zylinderkoepfen: ["zylinder", "koepfen"], kupferschraube: ["kupfer", "schraube"], oberflaechenspannung: ["oberflaeche", "spannung"], reinigungsmittels: ["reinigung", "mittels"], herabsetzen: ["herab", "setzen"], wasserbadpruefung: ["wasserbad", "pruefung"], verschlussstopfen: ["verschluss", "stopfen"], luftdruck: ["luft", "druck"], reinigungsmittel: ["reinigung", "mittel"], arbeitsschritten: ["arbeit", "schritten"], verstaerkungsplatte: ["verstaerkung", "platte"], oelwannendichtungen: ["oelwannen", "dichtungen"], stossstellen: ["stoss", "stellen"], radialwellendichtrings: ["radial", "wellendichtring"], demontage: ["demo", "tage"], verteilerkappe: ["verteiler", "kappe"], verteilerlaeufer: ["verteiler", "laeufer"], sonderwerkzeugs: ["sonder", "werkzeugs"], demontagearbeiten: ["demontage", "arbeiten"], steuergehaeusedeckels: ["steuer", "gehaeusedeckels"], riemenspannung: ["riemen", "spannung"], zuendleitungsrohr: ["zuend", "leitungsrohr"], eintreiben: ["eint", "reiben"], dichtlippe: ["dicht", "lippe"], massekabel: ["masse", "kabel"], luftmengenmesser: ["luftmenge", "messer"], oelwannenteil: ["oelwanne", "teil"], fotodarstellungen: ["foto", "darstellungen"], kettenspannerkolben: ["kettenspanner", "kolben"], riemenscheibe: ["riemen", "scheibe"], kettenspanners: ["ketten", "spanners"], passflaechen: ["pass", "flaechen"], radialwellendichtringe: ["radial", "wellendichtringe"], dichtrings: ["dicht", "rings"], schraubendreher: ["schraube", "dreher"], spezialwerkzeugen: ["spezial", "werkzeugen"], herauspressen: ["heraus", "pressen"], verbindungsstelle: ["verbindung", "stelle"], spezialwerkzeuge: ["spezial", "werkzeuge"], serienmaessigen: ["serien", "maessigen"], dichtring: ["dicht", "ring"], schwungrads: ["schwung", "rads"], riemenscheibenmutter: ["riemenscheibe", "mutter"], werkzeugkennzeichnungen: ["werkzeug", "kennzeichnungen"], schwingungsdaempfer: ["schwingung", "daempfer"], werkstattseite: ["werkstatt", "seite"], hauptlagerzapfen: ["hauptlager", "zapfen"], kettenrades: ["kette", "rades"], fuehrungslagers: ["fuehrung", "lagers"], getriebehauptwelle: ["getriebe", "hauptwelle"], lagerhalbschalen: ["lager", "halbschalen"], ersatzkurbelwelle: ["ersatz", "kurbelwelle"], pleuellager: ["pleuel", "lager"], oberflaeche: ["ober", "flaeche"], kurbelwellen: ["kurbel", "wellen"], farbstrichkennzeichnung: ["farbstrich", "kennzeichnung"], pleuellagerzapfen: ["pleuel", "lagerzapfen"], fuehrungslager: ["fuehrung", "lager"], einbaureihenfolge: ["einbau", "reihenfolge"], kugellager: ["kugel", "lager"], filzring: ["filz", "ring"], schmierfett: ["schmier", "fett"], ersatzkurbelwellen: ["ersatz", "kurbelwellen"], doppelklassifizierung: ["doppel", "klassifizierung"], lagerhalbschale: ["lager", "halbschale"], nennmass: ["nenn", "mass"], lagerdeckel: ["lager", "deckel"], hauptlager: ["haupt", "lager"], masspruefung: ["mass", "pruefung"], pleuellagerspiels: ["pleuel", "lagerspiels"], lagerschalen: ["lager", "schalen"], pleuellagerschrauben: ["pleuellager", "schrauben"], drehmoment: ["dreh", "moment"], drehwinkel: ["dreh", "winkel"], pleuellagerspiel: ["pleuel", "lagerspiel"], kurbelwellenzapfen: ["kurbelwelle", "zapfen"], hauptlagerdeckel: ["hauptlager", "deckel"], lagerspiel: ["lager", "spiel"], bearbeitungsgroesse: ["bearbeitung", "groesse"], kurbelwellendurchmesser: ["kurbelwelle", "durchmesser"], lagerschalendicke: ["lager", "schalendicke"], konsolendurchmesser: ["konsolen", "durchmesser"], pleuellagerdeckel: ["pleuel", "lagerdeckel"], paarungskennzeichnungen: ["paarung", "kennzeichnungen"], pleuelschrauben: ["pleuel", "schrauben"], anzugswinkel: ["anzugs", "winkel"], lagerschale: ["lager", "schale"], pleuelschraube: ["pleuel", "schraube"], pleuellagergehaeusedurchmesser: ["pleuellager", "gehaeusedurchmesser"], werkstattanweisung: ["werkstatt", "anweisung"], hauptlagerschalen: ["hauptlager", "schalen"], lagerspiels: ["lager", "spiels"], passenden: ["pass", "enden"], nichtdrehen: ["nicht", "drehen"], lagerstuhl: ["lager", "stuhl"], festziehen: ["fest", "ziehen"], lagerstuhldurchmesser: ["lagerstuhl", "durchmesser"], wellendurchmesser: ["wellen", "durchmesser"], bauteilen: ["baut", "eilen"], pilotlagers: ["pilot", "lagers"], kugellagers: ["kugel", "lagers"], pleueldeckel: ["pleuel", "deckel"], hauptlagerschale: ["hauptlager", "schale"], hauptlagerdeckelschraube: ["hauptlager", "deckelschraube"], anlauflager: ["anlauf", "lager"], pleuellagerschale: ["pleuel", "lagerschale"], scheibenfeder: ["scheibe", "feder"], kettenradsatz: ["ketten", "radsatz"], anlasserzahnkranz: ["anlasser", "zahnkranz"], anlasserritzelkranzes: ["anlasser", "ritzel", "kranzes"], spezialwerkzeugs: ["spezial", "werkzeugs"], gegenhalten: ["gegen", "halten"], schraubensicherung: ["schrauben", "sicherung"], schwungradrundlaufs: ["schwungrad", "rundlauf"], gewindebohrungen: ["gewinde", "bohrungen"], rundlauf: ["rund", "lauf"], flanschflaeche: ["flansch", "flaeche"], anlasserritzelkranz: ["anlasser", "ritzel", "kranz"], zahnzwischenraum: ["zahn", "zwischenraum"], zahnkranz: ["zahn", "kranz"], bohrstelle: ["bohr", "tell"], thermofarbstift: ["thermo", "farbstift"], zahnfase: ["zahn", "fase"], messingdorn: ["messing", "dorn"], arbeitsgaenge: ["arbeit", "gaenge"], gewichtsklasse: ["gewicht", "klasse"], anzugswert: ["anzug", "wert"], kolbenbolzen: ["kolben", "bolzen"], pleuelbuchse: ["pleuel", "buchse"], schieben: ["schi", "eben"], bearbeitungsmass: ["bearbeitung", "mass"], pleuellagerdurchmesser: ["pleuellager", "durchmesser"], auslassseite: ["auslas", "seite"], plattgedrueckten: ["platt", "gedrueckten"], pleuellagers: ["pleuel", "lagers"], herausdruecken: ["heraus", "druecken"], sicherungsringe: ["sicherung", "ringe"], kolbenmass: ["kolbe", "mass"], kolbenspiel: ["kolbe", "spiel"], kolbenkennzeichnung: ["kolben", "kennzeichnung"], sicherungsring: ["sicherung", "ring"], zugeordnet: ["zuge", "ordnet"], zuordnungscode: ["zuordnung", "code"], kolbenboden: ["kolbe", "boden"], kolbendurchmesser: ["kolben", "durchmesser"], kolbenbodenmarkierung: ["kolbenboden", "markierung"], zylinderbohrungsdurchmesser: ["zylinderbohrung", "durchmesser"], querrichtung: ["quer", "richtung"], gesamtverschleiss: ["gesamt", "verschleiss"], kolbenringenden: ["kolben", "ringenden"], gegeneinander: ["gegen", "einander"], zusammendruecken: ["zusammen", "druecken"], kolbenring: ["kolbe", "ring"], kolbenringstoss: ["kolbenring", "stoss"], kolbenringzange: ["kolbenring", "zange"], ringtypen: ["ring", "typen"], flankenspiel: ["flanke", "spiel"], stossspiel: ["stoss", "spiel"], rechteckiger: ["recht", "eckiger"], kompressionsring: ["kompression", "ring"], gummifeder: ["gummi", "feder"], sichtbare: ["sicht", "bare"], steuertriebs: ["steuer", "triebs"], ventilbetaetigung: ["ventil", "betaetigung"], verteilerlaeufers: ["verteiler", "laeufers"], verteileradapters: ["verteiler", "adapters"], verteilergehaeuses: ["verteiler", "gehaeuses"], masstabelle: ["mass", "tabelle"], ventilfedern: ["ventil", "federn"], einstellplaettchen: ["eins", "tell", "plaettchen"], passhuelse: ["pass", "huelse"], ventilsteuerung: ["ventils", "teuerung"], sicherungsscheibe: ["sicherung", "scheibe"], passstift: ["pass", "stift"], sicherungsblech: ["sicherung", "blech"], sechskantschraube: ["sechskant", "schraube"], uebermassventile: ["uebermass", "ventile"], schaftdurchmessern: ["schaft", "durchmessern"], ventilfederteller: ["ventil", "federteller"], ventilfeder: ["ventil", "feder"], ventilschaftabdichtung: ["ventilschaft", "abdichtung"], ventilkeil: ["ventil", "keil"], nockenwellen: ["nocken", "wellen"], kettenraedern: ["ketten", "raedern"], nockenwellenlagerdeckeln: ["nockenwellen", "lagerdeckeln"], niederhalten: ["nieder", "halten"], kettenraeder: ["ketten", "raeder"], fuehrungsschiene: ["fuehrung", "schiene"], fuehlerlehre: ["fuehler", "lehre"], sicherungsbleche: ["sicherung", "bleche"], niedergehalten: ["nieder", "gehalten"], nockenwellenlagerdeckel: ["nockenwelle", "lagerdeckel"], kennzeichnen: ["kenn", "zeichnen"], einlassseite: ["einlas", "seite"], identisch: ["iden", "tisch"], drehrichtung: ["dreh", "richtung"], auslassnockenwelle: ["auslass", "nockenwelle"], einlassnockenwelle: ["einlass", "nockenwelle"], auslasskettenraeder: ["auslass", "kettenraeder"], sicherungsblechen: ["sicherung", "blechen"], nockenmass: ["nocke", "mass"], steuerzeiten: ["steuer", "zeiten"], motordrehrichtung: ["motor", "drehrichtung"], festschrauben: ["fest", "schrauben"], kennzeichnungen: ["kenn", "zeichnungen"], kettenfuehrungs: ["ketten", "fuehrung"], bauteile: ["baut", "eile"], nadelhuelse: ["nadel", "huelse"], federscheibe: ["feder", "scheibe"], sechskantmutter: ["sechskant", "mutter"], wellenbolzen: ["wellen", "bolzen"], steuerkastendeckelabdeckung: ["steuerkasten", "deckel", "abdeckung"], kettenrads: ["kette", "rads"], fuehrungsrads: ["fuehrung", "rads"], nadellagerhuelse: ["nadellager", "huelse"], einbaurichtung: ["einbau", "richtung"], erwaermungstemperatur: ["erwaermung", "temperatur"], wellenschraube: ["wellen", "schraube"], verweisstellen: ["verweis", "stellen"], steuerkettenspannerkolben: ["steuer", "kettenspanner", "kolben"], steuerkettenspanner: ["steuerkette", "spanner"], ausbaureihenfolge: ["ausbau", "reihenfolge"], sollmass: ["soll", "mass"], federdruck: ["feder", "druck"], federende: ["feder", "ende"], kennzahl: ["kenn", "zahl"], blickrichtung: ["blick", "richtung"], kolbenoeffnung: ["kolben", "oeffnung"], bauteilnummern: ["bauteil", "nummern"], ventilspiels: ["ventil", "spiels"], ventilplaettchen: ["ventil", "plaettchen"], ausserhalb: ["ausser", "halb"], druckluft: ["druck", "luft"], ventilplaettchens: ["ventil", "plaettchens"], verbrennungsraum: ["verbrennung", "raum"], innenraeumen: ["innen", "raeumen"], brandschutzvorschriften: ["brandschutz", "vorschriften"], ventiltellern: ["ventil", "tellern"], vorbeilaeuft: ["vorbei", "laeuft"], ventilteller: ["ventil", "teller"], montagebock: ["montage", "bock"], ventilkegelstuecke: ["ventilkegel", "stuecke"], gummiteil: ["gummi", "teil"], ventilfedersatz: ["ventilfeder", "satz"], ventilschaftabdichtungen: ["ventilschaft", "abdichtungen"], ventilschaftdurchmesser: ["ventilschaft", "durchmesser"], motoroeldrucks: ["motoroel", "drucks"], oeldruckschalter: ["oeldruck", "schalter"], einstellscheibe: ["eins", "tell", "scheibe"], oelpumpenkette: ["oelpumpe", "kette"], druckpruefer: ["druck", "pruefer"], kettenspannung: ["ketten", "spannung"], druckrohr: ["druck", "rohr"], rotorverschleiss: ["rotor", "verschleiss"], drucksicherheitsventileinsatz: ["drucksicherheit", "ventileinsatz"], verschleisspruefungen: ["verschleiss", "pruefungen"], leichtgaengig: ["leicht", "gaengig"], antriebswelle: ["antrieb", "welle"], riefenbildung: ["riefen", "bildung"], drucksicherheitsventil: ["drucksicherheit", "ventil"], hauptbohrung: ["haupt", "bohrung"], leckwerden: ["leck", "werden"], stecknuss: ["steck", "nuss"], oelpumpengehaeuse: ["oelpumpe", "gehaeuse"], vollstromoelfilter: ["voll", "strom", "oelfilter"], vollstromoelfilters: ["voll", "strom", "oelfilters"], oelfiltergehaeuses: ["oelfilter", "gehaeuses"], temperaturgesteuerten: ["temperatur", "gesteuerten"], filterpatrone: ["filter", "patrone"], dichtungspflege: ["dichtung", "pflege"], oelstands: ["oels", "tands"], oeldruckaufbau: ["oeldruck", "aufbau"], filterwechsel: ["filter", "wechsel"], anlageflaeche: ["anlage", "flaeche"], oelfilterpatrone: ["oelfilter", "patrone"], gestartet: ["gest", "artet"], entlueftungsvorgang: ["entlueftung", "vorgang"], temperaturregler: ["temperatur", "regler"], fuehrungsrohrs: ["fuehrung", "rohrs"], montagearbeiten: ["montage", "arbeiten"], abbildungshinweis: ["abbildung", "hinweis"], luefterzarge: ["luefter", "zarge"], sicherungsrings: ["sicherung", "rings"], wasserpumpenlagers: ["wasserpumpe", "lagers"], schnittzeichnung: ["schnitt", "zeichnung"], wasserpumpenlager: ["wasserpumpe", "lager"], teilenummern: ["teile", "nummern"], kuehlmittelthermostats: ["kuehlmittel", "thermostats"], linksgewindes: ["links", "gewindes"], oeffnungstemperatur: ["oeffnung", "temperatur"], linksgewinde: ["links", "gewinde"], uhrzeigersinn: ["uhrzeiger", "sinn"], drehmomentschluessel: ["drehmoment", "schluessel"], festgegangen: ["fest", "gegangen"], schaltpunkte: ["schalt", "punkte"], werkstattausruestungskatalog: ["werkstatt", "ausruestung", "katalog"], spulenzuendung: ["spulen", "zuendung"], motorelektronik: ["motor", "elektronik"], hochspannungen: ["hoch", "spannungen"], anschlussverfahren: ["anschluss", "verfahren"], zuendverteilerlaeufern: ["zuendverteiler", "laeufern"], motorkompression: ["motor", "kompression"], batterieladen: ["batterie", "laden"], spannungsversorgung: ["spannung", "versorgung"], zuendsteuergeraet: ["zuend", "steuergeraet"], sekundaerspannung: ["sekundaer", "spannung"], verteilerdeckels: ["verteiler", "deckels"], diebstahlwarnanlage: ["diebstahl", "warnanlage"], steuergeraet: ["steuer", "geraet"], sekundaerseite: ["sekundaer", "seite"], hochspannungsseite: ["hochspannung", "seite"], rundfunk: ["rund", "funk"], kommunikationsgeraeten: ["kommunikation", "geraeten"], verteilerdeckel: ["verteiler", "deckel"], primaerspannung: ["primaer", "spannung"], widerstand: ["wider", "stand"], anschlussdaten: ["anschluss", "daten"], anlasserleitungen: ["anlasser", "leitungen"], werkstattarbeiten: ["werkstatt", "arbeiten"], zuendverteiler: ["zuend", "verteiler"], unterdruckverstellung: ["unterdruck", "verstellung"], spannungsregler: ["spannung", "regler"], schaltplan: ["schalt", "plan"], zuendzeitpunkt: ["zuend", "zeitpunkt"], impulsgeber: ["impuls", "geber"], unterdrucksteuerung: ["unterdruck", "steuerung"], anschlussplan: ["anschluss", "plan"], fehlersuche: ["fehler", "suche"], zusammenbauen: ["zusammen", "bauen"], diodenplatte: ["dioden", "platte"], kohlebuersten: ["kohle", "buersten"], elektronische: ["elektro", "nische"], steuergeraete: ["steuer", "geraete"], zuendverteilers: ["zuend", "verteilers"], zuendsteuergeraete: ["zuend", "steuergeraete"], transistorzuendanlage: ["transistor", "zuendanlage"], magnetschalters: ["magnet", "schalters"], anlasserbauteile: ["anlasser", "bauteile"], seitenverweise: ["seiten", "verweise"], magnetschalter: ["magnet", "schalter"], gluehkerzen: ["glueh", "kerzen"], gluehkerzenleitungen: ["gluehkerze", "leitungen"], reglerschalter: ["regler", "schalter"], steckverbindungen: ["steck", "verbindungen"], fehlersuchanleitungen: ["fehler", "ucha", "leitungen"], diagnosestecker: ["diagnose", "stecker"], relaisuebersicht: ["relais", "uebersicht"], motorstecker: ["motor", "stecker"], halteschaltplan: ["halte", "schaltplan"], schnelltest: ["schnell", "test"], hochspannungsverteiler: ["hochspannung", "verteiler"], fehlersuchtabelle: ["fehler", "uchta", "belle"], motorsteckverbindung: ["motor", "steckverbindung"], anschlussbelegung: ["anschluss", "belegung"], werkstatthandbuch: ["werkstatt", "handbuch"], zylindererkennungsgeber: ["zylinder", "erkennung", "geber"], drehzahl: ["dreh", "zahl"], bezugsmarkengeber: ["bezugsmarke", "geber"], anlassereinzelteile: ["anlasser", "einzelteile"], elektropruefung: ["elektro", "pruefung"], anlasserzwischenwelle: ["anlasser", "zwischenwelle"], zuendkerzengewinde: ["zuendkerze", "gewinde"], inhaltsuebersicht: ["inhalts", "uebersicht"], borddiagnose: ["bord", "diagnose"], leerlaufregelgeraet: ["leerlauf", "regelgeraet"], temperaturgeber: ["temperatur", "geber"], magnetventil: ["magnet", "ventil"], massepunkt: ["masse", "punkt"], motorelektrik: ["motor", "elektrik"], lagezuordnung: ["lage", "zuordnung"], leerlauf: ["leer", "lauf"], fahrzeugelektrik: ["fahrzeug", "elektrik"], kraftstoffpumpenrelais: ["kraftstoffpumpe", "relais"], getriebeausfuehrungen: ["getriebe", "ausfuehrungen"], kabelfarben: ["kabel", "farben"], automatikgetrieben: ["automatik", "getrieben"], magergemisch: ["mager", "gemisch"], schaltgetrieben: ["schalt", "getrieben"], steuergeraetecodierung: ["steuergeraete", "codierung"], kraftstoffpumpe: ["kraftstoff", "pumpe"], lambdasondenheizung: ["lambdasonde", "heizung"], leerlaufstabilisierung: ["leerlauf", "stabilisierung"], zuendungsumschaltung: ["zuendung", "umschaltung"], temperaturschalter: ["temperatur", "schalter"], leerlaufregelung: ["leerlauf", "regelung"], lufttemperaturfuehler: ["lufttemperatur", "fuehler"], switchover: ["switch", "over"], temperaturfuehler: ["temperatur", "fuehler"], motorleitungssatz: ["motor", "leitung", "satz"], einbauposition: ["einbau", "position"], zuendzeitpunkts: ["zuend", "zeitpunkts"], halteklammern: ["halte", "klammern"], staubschutzkappe: ["staub", "schutzkappe"], bildnummern: ["bild", "nummern"], impulsgebers: ["impuls", "gebers"], sicherheitsmassnahmen: ["sicherheit", "massnahmen"], widerstandspruefung: ["widerstand", "pruefung"], impulsgeberspule: ["impulsgeber", "spule"], spannungssignals: ["spannung", "signals"], multimeter: ["multi", "meter"], schrittweise: ["schritt", "weise"], unterdruckverstellers: ["unterdruck", "vers", "tellers"], impulsgeberrads: ["impulsgeber", "rads"], traegerplatte: ["traeger", "platte"], hochspannungszuendanlagen: ["hochspannung", "zuendanlagen"], schutzkappe: ["schutz", "kappe"], steckerstifte: ["stecker", "stifte"], spulenwiderstand: ["spulen", "widerstand"], steckerverbindung: ["stecker", "verbindung"], zuendsteuergeraets: ["zuend", "steuergeraets"], bildschirm: ["bild", "schirm"], skalenbeschriftungen: ["skalen", "beschriftungen"], drehwinkelachse: ["drehwinkel", "achse"], unterdruckversteller: ["unterdruck", "vers", "teller"], herunterhaengen: ["herunter", "haengen"], betaetigungsstange: ["betaetigung", "stange"], verteilerwelle: ["verteiler", "welle"], impulsgeberzahns: ["impulsgeber", "zahns"], spannstift: ["spann", "stift"], steckeraufnahme: ["stecker", "aufnahme"], zugstange: ["zugs", "tang"], zuendzeitpunktverstellung: ["zuendzeitpunkt", "verstellung"], zuendkabel: ["zuend", "kabel"], zuendkerzensteckers: ["zuendkerze", "steckers"], zerlegbaren: ["zerleg", "baren"], bildschritten: ["bild", "schritten"], zuendkabels: ["zuend", "kabels"], fuehrungshuelse: ["fuehrung", "huelse"], klemmzange: ["klemm", "zange"], steckeraufnehmers: ["stecker", "aufnehmers"], zerlegbare: ["zerleg", "bare"], leitungsquerschnitt: ["leitung", "querschnitt"], klemmbacken: ["klemm", "backen"], zusammenfuehren: ["zusammen", "fuehren"], schmiermittel: ["schmier", "mittel"], zurueckgezogen: ["zurueck", "gezogen"], steckeraufnehmer: ["stecker", "aufnehmer"], werkzeugsatz: ["werkzeug", "satz"], erhaeltlich: ["erhaelt", "lich"], stripping: ["strip", "ping"], motortestschritt: ["motortest", "schritt"], brandspuren: ["brand", "puren"], hochspannungswarnung: ["hochspannung", "warnung"], zuendspannung: ["zuend", "spannung"], zuendspannungsabweichung: ["zuendspannung", "abweichung"], uebereinstimmen: ["ueberein", "stimmen"], multimeterpruefung: ["multimeter", "pruefung"], primaerwicklung: ["primaer", "wicklung"], sekundaerwicklung: ["sekundaer", "wicklung"], haarrisse: ["haar", "risse"], herausgedruecktem: ["heraus", "gedruecktem"], hochspannung: ["hoch", "spannung"], codenummer: ["code", "nummer"], transistorzuendung: ["transistor", "zuendung"], steuergeraets: ["steuer", "geraets"], telefunken: ["tele", "funken"], steckverbindung: ["steck", "verbindung"], befestigungselemente: ["befestigung", "elemente"], anlageflaechen: ["anlage", "flaechen"], waermeableitung: ["waerme", "ableitung"], zuendanlagen: ["zuend", "anlagen"], sicherungsdraht: ["sicherung", "draht"], gewaehrleisten: ["gewaehr", "leisten"], klemmenbezeichnungen: ["klemmen", "bezeichnungen"], funktionen: ["funkt", "ionen"], anschlussfotos: ["anschluss", "fotos"], steuergeraeten: ["steuer", "geraeten"], anschlussstecker: ["anschluss", "stecker"], stromversorgung: ["strom", "versorgung"], drehzahlmesser: ["drehzahl", "messer"], anschlussnummern: ["anschluss", "nummern"], tachometer: ["tacho", "meter"], relaissteckers: ["relais", "steckers"], simulatoranschluesse: ["simulator", "anschluesse"], unterdruckverstelldose: ["unterdruck", "verstell", "dose"], unterdrucksignals: ["unterdruck", "signals"], widerstandswerte: ["widerstand", "werte"], ansauglufttemperaturgeber: ["ansauglufttemperatur", "geber"], lastsignal: ["last", "signal"], fehlersuchtafel: ["fehler", "such", "tafel"], anschlussbuchsen: ["anschluss", "buchsen"], wassertemperatur: ["wasser", "temperatur"], ansauglufttemperatur: ["ansaugluft", "temperatur"], troubleshooting: ["trouble", "shooting"], kuehlmitteltemperaturgeber: ["kuehlmitteltemperatur", "geber"], kuehlmitteltemperaturschalter: ["kuehlmittel", "temperaturschalter"], ansauglufttemperaturschalter: ["ansaugluft", "temperaturschalter"], widerstandsmessung: ["widerstand", "messung"], stoerungssuche: ["stoerung", "suche"], fehlenden: ["fehl", "enden"], zuendverstellvorgangs: ["zuend", "verstell", "vorgangs"], unterdruckschlaeuchen: ["unterdruck", "schlaeuchen"], handschuhkasten: ["handschuh", "kasten"], oberhalb: ["ober", "halb"], kabelbaum: ["kabel", "baum"], ordnungsgemaess: ["ordnung", "gemaess"], zuendverstellung: ["zuend", "verstellung"], zuendverstellgeraets: ["zuend", "verstell", "geraets"], fehlersuchablauf: ["fehler", "such", "ablauf"], steuergeraetestecker: ["steuergeraete", "stecker"], leitungsversorgung: ["leitung", "versorgung"], oktanzahl: ["oktan", "zahl"], umgebungstemperatur: ["umgebung", "temperatur"], motortest: ["motor", "test"], testschritt: ["test", "schritt"], fehlerhaft: ["fehler", "haft"], fehlzuendungen: ["fehl", "zuendungen"], betriebsbedingungen: ["betriebs", "bedingungen"], motorleistung: ["motor", "leistung"], oszilloskopbild: ["oszilloskop", "bild"], ordnungsgemaessem: ["ordnung", "gemaessem"], strompfad: ["strom", "pfad"], versorgungsspannung: ["versorgung", "spannung"], zuendanlassschalter: ["zuend", "anlass", "schalter"], starterklemme: ["starter", "klemme"], anschlussklemmen: ["anschluss", "klemmen"], luftsammler: ["luft", "sammler"], sekundaerwiderstand: ["sekundaer", "widerstand"], oszilloskoptest: ["oszilloskop", "test"], primaersignals: ["primaer", "signals"], primaerstroms: ["primaer", "stroms"], pfeilverbindungen: ["pfeil", "verbindungen"], fehlerhaften: ["fehler", "haften"], primaersignal: ["primaer", "signal"], versorgungsleitung: ["versorgung", "leitung"], masseschluss: ["masse", "schluss"], vergussmasse: ["verguss", "masse"], voraussetzung: ["voraus", "setzung"], fehlfunktion: ["fehl", "funktion"], festgestellt: ["fest", "gestellt"], primaeranzeige: ["primaer", "anzeige"], primaerstrom: ["primaer", "strom"], amperemeter: ["ampere", "meter"], betreiben: ["betr", "eiben"], primaersignalform: ["primaer", "signalform"], primaerwiderstand: ["primaer", "widerstand"], leitungsunterbrechung: ["leitung", "unterbrechung"], festgestellten: ["fest", "gestellten"], betreffenden: ["betreff", "enden"], elektrodenabbrand: ["elektrode", "abbrand"], zuendkabelanschluesse: ["zuendkabel", "anschluesse"], flussdiagramm: ["fluss", "diagramm"], zuendverteilerstellung: ["zuendverteiler", "stellung"], motorfehler: ["motor", "fehler"], fliehkraft: ["flieh", "kraft"], zuendzeitpunktkontrolle: ["zuendzeitpunkt", "kontrolle"], zuendstellung: ["zuend", "stellung"], wiederholen: ["wied", "erholen"], mikrofilm: ["mikro", "film"], nennwerten: ["nenn", "werten"], ladesystem: ["lade", "system"], ladekontrollleuchte: ["lade", "kontrollleuchte"], anschlussleitungen: ["anschluss", "leitungen"], ladestrom: ["lade", "strom"], regelspannung: ["regel", "spannung"], voraussetzungen: ["voraus", "setzungen"], sollwertangaben: ["sollwert", "angaben"], reparaturabschnitte: ["reparatur", "abschnitte"], masseverbindung: ["masse", "verbindung"], oxidationsbelag: ["oxidation", "belag"], gluehlampe: ["glueh", "lampe"], oberwellen: ["ober", "wellen"], verbrauchern: ["verb", "rauchern"], ruhestrom: ["ruhe", "strom"], lichtmaschinen: ["licht", "maschinen"], erregerdiode: ["erreger", "diode"], windungsschluss: ["windung", "schluss"], statorwicklung: ["stator", "wicklung"], ladespannung: ["lade", "spannung"], welligkeitsverhaeltnis: ["welligkeit", "verhaeltnis"], leistungsdiode: ["leistung", "diode"], bildfolge: ["bild", "folge"], massekabels: ["masse", "kabels"], spannrolle: ["spann", "rolle"], gehaeusehaelften: ["gehaeuse", "haelften"], auseinanderziehen: ["auseinander", "ziehen"], lagerdeckels: ["lager", "deckels"], befestigungsteilen: ["befestigung", "steilen"], drehstromgenerator: ["drehstrom", "generator"], anlaufscheibe: ["anlauf", "scheibe"], isolierteile: ["isoliert", "eile"], soldering: ["solde", "ring"], drehstromgenerators: ["drehstrom", "generators"], widerstands: ["wider", "tands"], durchgangspruefungen: ["durchgangs", "pruefungen"], rotorwicklung: ["rotor", "wicklung"], laeuferwelle: ["laeufer", "welle"], gleichrichterdioden: ["gleichrichter", "dioden"], einwandfreien: ["einwand", "freien"], diodendefekt: ["dioden", "defekt"], kurzschlusswindungen: ["kurzschluss", "windungen"], wicklungstraeger: ["wicklung", "traeger"], wicklungsabschnitte: ["wicklung", "abschnitte"], standardpruefgeraet: ["standard", "pruefgeraet"], diodenpruefung: ["dioden", "pruefung"], kuehlkoerper: ["kuehl", "koerper"], anschlussbolzen: ["anschluss", "bolzen"], servicepruefgeraet: ["service", "pruefgeraet"], spannungsreglers: ["spannung", "reglers"], detailaufnahmen: ["detail", "aufnahmen"], kohlebuerstenhalter: ["kohlebuerste", "halter"], federkontakte: ["feder", "kontakte"], bestandteil: ["bestand", "teil"], rundlauffehler: ["rundlauf", "fehler"], maximaler: ["maxi", "maler"], schleifrings: ["schlei", "frings"], kontaktflaechen: ["kontakt", "flaechen"], handfest: ["hand", "fest"], fehlersuchdiagramm: ["fehler", "such", "diagramm"], fehlerbilder: ["fehler", "bilder"], austauscharbeiten: ["austausch", "arbeiten"], anlassschalter: ["anlass", "schalter"], kurzschluss: ["kurz", "schluss"], zahnkranzzaehne: ["zahnkranz", "zaehne"], freilauf: ["frei", "lauf"], anlasserritzel: ["anlasser", "ritzel"], kuehlmittels: ["kuehl", "mittels"], ankerzustands: ["anker", "zustands"], kuehlmittelrohr: ["kuehl", "mittelrohr"], vollstaendige: ["voll", "staendige"], staubkappe: ["staub", "kappe"], ausgleichsscheiben: ["ausgleich", "scheiben"], gehaeusedeckel: ["gehaeuse", "deckel"], buerstenhalter: ["buerste", "halter"], schmierstellen: ["schmier", "stellen"], axialspiel: ["axial", "spiel"], lagerbuchse: ["lager", "buchse"], antriebslagertraeger: ["antrieb", "lager", "traeger"], gehaeuseschrauben: ["gehaeuse", "schrauben"], gummidichtung: ["gummi", "dichtung"], lagerlaufring: ["lager", "laufring"], rohrstueck: ["rohr", "stueck"], zurueckdruecken: ["zurueck", "druecken"], lagerflaeche: ["lager", "flaeche"], zwischenlager: ["zwischen", "lager"], buerstenhalters: ["buerste", "halters"], erregerwicklung: ["erreger", "wicklung"], kohlebuerstenhalters: ["kohlebuerste", "halters"], ankerwicklung: ["anker", "wicklung"], kohlenbuersten: ["kohlen", "buersten"], kupferlitzen: ["kupfer", "litzen"], verlaufendes: ["verlauf", "endes"], kollektorsegmenten: ["kollektor", "segmenten"], instandsetzung: ["instand", "setzung"], stromaufnahme: ["strom", "aufnahme"], haltewicklung: ["halte", "wicklung"], massekontakt: ["masse", "kontakt"], handelsuebliches: ["handels", "uebliches"], kollektorsegmente: ["kollektor", "segmente"], einzugswicklung: ["einzugs", "wicklung"], motorsteuerung: ["motors", "teuerung"], zuendspannungen: ["zuend", "spannungen"], startvorgaengen: ["start", "vorgaengen"], zuendleitungsabschirmung: ["zuend", "leitungsabschirmung"], motorstarts: ["motor", "starts"], serienmaessige: ["serien", "maessige"], motorraumaufnahmen: ["motorraum", "aufnahmen"], massepunkte: ["masse", "punkte"], motorleitungssatzes: ["motor", "leitung", "satzes"], bezugsmarken: ["bezugs", "marken"], drucksensoren: ["druck", "sensoren"], kuehlmitteltemperaturfuehler: ["kuehlmittel", "temperaturfuehler"], thermozeitschalter: ["thermo", "zeitschalter"], drehzahlgeber: ["drehzahl", "geber"], drucksensor: ["druck", "sensor"], klimaanlagenstecker: ["klimaanlage", "stecker"], steuergeraetegehaeuse: ["steuergeraete", "gehaeuse"], leerlaufsteuergeraete: ["leerlauf", "steuergeraete"], diagnoseanschluesse: ["diagnose", "anschluesse"], zwanzigpoliger: ["zwanzig", "poliger"], bezugsmarkensensor: ["bezugsmarke", "sensor"], drehzahlsensor: ["drehzahl", "sensor"], getriebestecker: ["getriebe", "stecker"], sauerstoffsensorheizung: ["sauerstoffsensor", "heizung"], steckeransicht: ["stecker", "ansicht"], steckrichtung: ["steck", "richtung"], leitungsanschluesse: ["leitung", "anschluesse"], bauzeitraeumen: ["bauzeit", "raeumen"], sicherungsschutz: ["sicherung", "schutz"], serviceanzeige: ["service", "anzeige"], diagnoseleitung: ["diagnose", "leitung"], steckerkennzeichnungen: ["stecker", "kennzeichnungen"], steckeranschluss: ["stecker", "anschluss"], kontaktstift: ["kontakt", "stift"], kreisfoermige: ["kreis", "foermige"], steckkontakten: ["steck", "kontakten"], danebenstehende: ["daneben", "stehende"], klemmenbezeichnung: ["klemmen", "bezeichnung"], temperaturanzeige: ["temperatur", "anzeige"], lambdasondensignal: ["lambdasonde", "signal"], leitungsabschirmung: ["leitung", "abschirmung"], drehzahlsignal: ["drehzahl", "signal"], steckbild: ["steck", "bild"], signalbezeichnungen: ["signal", "bezeichnungen"], einbauorte: ["einbau", "orte"], motorkabelbaumsteckers: ["motorkabelbaum", "steckers"], relaisanschlusspunkts: ["relais", "anschlusspunkt"], relaisbelegung: ["relais", "belegung"], motoranordnung: ["motor", "anordnung"], motorkabelbaumstecker: ["motorkabelbaum", "stecker"], relaisanschlusspunkt: ["relais", "anschlusspunkt"], zylindererkennung: ["zylinder", "erkennung"], kraftstoffpumpen: ["kraftstoff", "pumpen"], motorraum: ["motor", "raum"], diagnosearbeiten: ["diagnose", "arbeiten"], motoranlage: ["motor", "anlage"], fahrzeugkabelbaumstecker: ["fahrzeug", "kabelbaum", "stecker"], kraftstoffvariantenstecker: ["kraftstoff", "variant", "stecker"], tankentlueftungsrelais: ["tankentlueftung", "relais"], positionsgeberstecker: ["positionsgeber", "stecker"], bezugsmarkenstecker: ["bezugsmarke", "stecker"], drehzahlgeberstecker: ["drehzahlgeber", "stecker"], kennzeichnet: ["kenn", "zeichnet"], relaisbereich: ["relais", "bereich"], detailaufnahme: ["detail", "aufnahme"], inkrementenrads: ["inkrement", "rads"], positionsmarkierung: ["position", "markierung"], motorlauf: ["motor", "lauf"], startprobleme: ["start", "probleme"], startschwierigkeiten: ["start", "schwierigkeiten"], beschleunigungsprobleme: ["beschleunigung", "probleme"], kraftstoffverbrauch: ["kraftstoff", "verbrauch"], darunterliegende: ["darunter", "liegende"], einwandfrei: ["einwand", "frei"], fehlerfreie: ["fehler", "freie"], startanlage: ["start", "anlage"], vorausgesetzt: ["voraus", "gesetzt"], anwendungshinweise: ["anwendung", "hinweise"], einwandfreiem: ["einwand", "freiem"], betriebszustand: ["betrieb", "zustand"], batteriespannung: ["batterie", "spannung"], bleifrei: ["blei", "frei"], warmlaufphase: ["warmlauf", "phase"], schubbetrieb: ["schub", "betrieb"], zuendaussetzer: ["zuend", "aussetzer"], zuendleitungsstecker: ["zuend", "leitung", "stecker"], abgasregelung: ["abgas", "regelung"], tankentlueftung: ["tank", "entlueftung"], kurbelgehaeuseentlueftung: ["kurbelgehaeuse", "entlueftung"], luftschlaeuche: ["luft", "schlaeuche"], abgasrueckfuehrung: ["abgas", "rueckfuehrung"], tankentlueftungssystem: ["tankentlueftung", "system"], drehzahlsensors: ["drehzahl", "sensors"], bezugsmarkengebers: ["bezugsmarke", "gebers"], oszilloskopmessung: ["oszilloskop", "messung"], anwendungsinformation: ["anwendung", "information"], schnelleren: ["schnell", "eren"], fehlerursachen: ["fehler", "ursachen"], fehlfunktionsursachen: ["fehlfunktion", "ursachen"], moeglicherweise: ["moeglich", "erweise"], multimeterfunktion: ["multimeter", "funktion"], sensorstecker: ["sensor", "stecker"], universaladapter: ["universal", "adapter"], stromdurchgang: ["strom", "durchgang"], anschlussplatte: ["anschluss", "platte"], zuendkabelkontakten: ["zuendkabel", "kontakten"], kennnummer: ["kenn", "nummer"], zuendkerzentyp: ["zuend", "kerzentyp"], zuendkabelkontakte: ["zuendkabel", "kontakte"], sekundaerspulen: ["sekundaer", "spulen"], abbildungskennzeichnungen: ["abbildung", "kennzeichnungen"], primaerspule: ["primaer", "spule"], sekundaerspule: ["sekundaer", "spule"], verteilerstift: ["verteiler", "stift"], zugehoerigem: ["zuge", "hoerigem"], kabelanschluesse: ["kabel", "anschluesse"], leitungssteckverbinder: ["leitung", "steckverbinder"], zugehoeriger: ["zuge", "hoeriger"], haarriss: ["haar", "riss"], brandspur: ["brand", "spur"], teilenummer: ["teile", "nummer"], herstellungsdatum: ["herstellung", "datum"], relaisansteuerung: ["relais", "ansteuerung"], peripheriepruefung: ["peripherie", "pruefung"], fahrzeugkabelbaums: ["fahrzeug", "kabelbaum"], fahrzeugkabelbaum: ["fahrzeug", "kabelbaum"], einbauabstand: ["einbau", "abstand"], demontageschritten: ["demontage", "schritten"], anschlussdiagramm: ["anschluss", "diagramm"], positionsgeber: ["position", "geber"], halteclips: ["halte", "clips"], rundkontakte: ["rund", "kontakte"], steckgehaeuse: ["steck", "gehaeuse"], anschlussbezeichnungen: ["anschluss", "bezeichnungen"], dichtungsrings: ["dichtung", "rings"], giessharzes: ["giess", "harzes"], hingewiesen: ["hinge", "wiesen"], sicherstellen: ["sicher", "stellen"], zuendfolge: ["zuend", "folge"], kontaktpunkte: ["kontakt", "punkte"], innenseite: ["innen", "seite"], schutzkappen: ["schutz", "kappen"], hochspannungszuendanlage: ["hochspannung", "zuendanlage"], giessharz: ["giess", "harz"], brandstellen: ["brand", "stellen"], abbildungsbeschriftungen: ["abbildung", "beschriftungen"], zuendleitungsanschlusses: ["zuend", "leitungsanschlusses"], zuendleitungsschutzrohr: ["zuend", "leitung", "schutzrohr"], gummikappe: ["gummi", "kappe"], zuendleitungsanschluss: ["zuend", "leitungsanschluss"], zuendleitungskontakt: ["zuend", "leitung", "kontakt"], abschirmstecker: ["abschirmst", "ecker"], zuendleitungskontakts: ["zuend", "leitung", "kontakts"], zuendleitungskontakte: ["zuend", "leitung", "kontakte"], zuendspannungsbild: ["zuendspannung", "bild"], widerstaende: ["wider", "staende"], zuendspulengehaeuse: ["zuendspule", "gehaeuse"], motorpruefschritt: ["motor", "pruefschritt"], herausgedrueckt: ["heraus", "gedrueckt"], bildbeschriftungen: ["bild", "beschriftungen"], drehzahlgebers: ["drehzahl", "gebers"], schutzmanschette: ["schutz", "manschette"], halteklammer: ["halte", "klammer"], geberwiderstands: ["geber", "widerstands"], bezugsmarke: ["bezug", "marke"], klebeband: ["klebe", "band"], geberleitung: ["geber", "leitung"], stirnflaechen: ["stirn", "flaechen"], fernhalten: ["fern", "halten"], geberwicklung: ["geber", "wicklung"], minusanschluss: ["minus", "anschluss"], minusanschluesse: ["minus", "anschluesse"], massgebend: ["mass", "gebend"], bezugsstift: ["bezug", "stift"], bezugsmarkensignal: ["bezugsmarke", "signal"], amplitudenhoehe: ["amplitude", "hoehe"], isolationspruefung: ["isolation", "pruefung"], schwingungsdaempfers: ["schwingung", "daempfers"], schutzbuegel: ["schutz", "buegel"], zahnluecke: ["zahn", "luecke"], reparaturmassnahmen: ["reparatur", "massnahmen"], ordnungsgemaesse: ["ordnung", "gemaesse"], oberwellenverhaeltnis: ["oberwellen", "verhaeltnis"], stromlaufplan: ["stromlauf", "plan"], aussagekraeftige: ["aussage", "kraeftige"], dauerhaft: ["dauer", "haft"], oszilloskopbilder: ["oszilloskop", "bilder"], kurzgeschlossenen: ["kurz", "geschlossenen"], feinschleifen: ["fein", "schleifen"], lichtmaschinenbefestigung: ["lichtmaschine", "befestigung"], riemenspannungskontrolle: ["riemen", "spannungskontrolle"], minusklemme: ["minus", "klemme"], kofferraum: ["koffer", "raum"], ladegeraet: ["lade", "geraet"], minusleitung: ["minus", "leitung"], riemenspannungspruefgeraet: ["riemen", "spannung", "pruefgeraet"], unterbrechungspruefungen: ["unterbrechung", "pruefungen"], sollanzeigen: ["soll", "anzeigen"], wicklungsunterbrechung: ["wicklung", "unterbrechung"], rotorwelle: ["rotor", "welle"], spulentraeger: ["spulen", "traeger"], pruefgeraetkabel: ["pruefgeraet", "kabel"], unterbrechungspruefung: ["unterbrechung", "pruefung"], fehlerhafte: ["fehler", "hafte"], anlasserschalter: ["anlasser", "schalter"], schwungradzaehne: ["schwung", "radzaehne"], planetengetriebe: ["planeten", "getriebe"], anlasseranschluesse: ["anlasser", "anschluesse"], planetenraeder: ["planet", "raeder"], magnetschalterkopf: ["magnetschalter", "kopf"], befestigungsteile: ["befestigung", "steile"], werkstattanleitung: ["werkstatt", "anleitung"], plusanschlusses: ["plus", "anschlusses"], anlasserbefestigungsmuttern: ["anlasser", "befestigungsmuttern"], speziellen: ["spezi", "ellen"], anlasserschluessels: ["anlasser", "schluessels"], plusanschluss: ["plus", "anschluss"], befestigungsmuttern: ["befestigung", "muttern"], anlasserschluessel: ["anlasser", "schluessel"], betaetigungsstifts: ["betaetigung", "stifts"], anlasserteile: ["anlass", "erteile"], kabelanschluss: ["kabel", "anschluss"], kurzschlussgefahr: ["kurzschluss", "gefahr"], dauermagneten: ["dauer", "magneten"], anzugswicklung: ["anzugs", "wicklung"], dauermagnete: ["dauer", "magnete"], haltering: ["halte", "ring"], ritzeltriebs: ["ritzel", "triebs"], lagertraeger: ["lager", "traeger"], auseinanderhebeln: ["auseinander", "hebeln"], antriebsritzel: ["antrieb", "ritzel"], antriebsritzels: ["antrieb", "ritzels"], ausgleichsscheibe: ["ausgleich", "scheibe"], kohlebuerste: ["kohle", "buerste"], hitzeschutz: ["hitze", "schutz"], getriebeeinheit: ["getriebe", "einheit"], ankerwelle: ["anker", "welle"], zurueckgehalten: ["zurueck", "gehalten"], hitzeschutzblech: ["hitze", "schutzblech"], distanzstuecke: ["distanz", "stuecke"], stehbolzen: ["steh", "bolzen"], herausspringen: ["heraus", "springen"], aussendurchmesser: ["aussen", "durchmesser"], steckschluessel: ["steck", "schluessel"], getriebegehaeuse: ["getriebe", "gehaeuse"], gummiauflage: ["gummi", "auflage"], distanzstueck: ["distanz", "stueck"], arbeitsvarianten: ["arbeit", "varianten"], zwischenwelle: ["zwischen", "welle"], feingeschliffen: ["fein", "geschliffen"], kollektorlamellen: ["kollektor", "lamellen"], buerstenfedern: ["buerste", "federn"], fliessende: ["fliess", "ende"], anschlusslitzen: ["anschluss", "litzen"], werkzeugnummern: ["werkzeug", "nummern"], kohlebuerstenfedern: ["kohlebuerste", "federn"], signalnummern: ["signal", "nummern"], zuendversorgung: ["zuend", "versorgung"], anlassersignal: ["anlasser", "signal"], ladeskontrollleuchte: ["lade", "kontrollleuchte"], diagnoseleitungen: ["diagnose", "leitungen"], anschlussfunktion: ["anschluss", "funktion"], serviceintervallanzeige: ["service", "intervall", "anzeige"], diagnosesteckers: ["diagnose", "steckers"], startimpuls: ["start", "impuls"], zuendsignal: ["zuend", "signal"], fehlercodes: ["fehler", "codes"], abgasrelevanter: ["abgas", "relevanter"], kombiinstrument: ["kombi", "instrument"], lampenimpulsen: ["lampen", "impulsen"], zeitlichen: ["zeit", "lichen"], dauerhafte: ["dauer", "hafte"], fehlerspeicher: ["fehler", "speicher"], fehlerleuchte: ["fehler", "leuchte"], fehlernummer: ["fehler", "nummer"], zeitangaben: ["zeit", "angaben"], motortemperaturfuehler: ["motortemperatur", "fuehler"], leerlaufschalter: ["leerlauf", "schalter"], fehlercode: ["fehler", "code"], festgelegte: ["fest", "gelegte"], einstellbare: ["eins", "tell", "bare"], schliesswinkelregelung: ["schliess", "winkel", "regelung"], unterdruckschlauchs: ["unterdruck", "schlauchs"], schliesswinkels: ["schliess", "winkels"], schliesswinkel: ["schliess", "winkel"], festgelegt: ["fest", "gelegt"], betriebsbereit: ["betrieb", "bereit"], fruehverstellung: ["frueh", "verstellung"], befestigungsschraube: ["befestigung", "schraube"], zurueckverstellt: ["zurueck", "verstellt"], zurueckverstellter: ["zurueck", "verstellter"], nebenstehende: ["neben", "stehende"], steckkontakt: ["steck", "kontakt"], anschlussbezeichnung: ["anschluss", "bezeichnung"], kabelfarbe: ["kabel", "farbe"], kabelbaumarbeiten: ["kabelbaum", "arbeiten"], motorsteckverbindungen: ["motor", "steckverbindungen"], tachometersignal: ["tachometer", "signal"], kontaktanordnung: ["kontakt", "anordnung"], steckerkontakt: ["stecker", "kontakt"], oeldruckueberwachung: ["oeldruck", "ueberwachung"], eigendiagnose: ["eigen", "diagnose"], generators: ["genera", "tors"], kuehlmitteltemperaturanzeige: ["kuehlmittel", "temperaturanzeige"], fehleranzeige: ["fehler", "anzeige"], selbstdiagnose: ["selbst", "diagnose"], datenempfang: ["daten", "empfang"], datenuebertragung: ["daten", "uebertragung"], oeltemperaturgeber: ["oeltemperatur", "geber"], steckerkreis: ["stecker", "kreis"], kontaktpositionen: ["kontakt", "positionen"], motorsteuergeraet: ["motor", "steuergeraet"], motorsteuergeraets: ["motor", "steuergeraets"], signalrichtung: ["signal", "richtung"], sensorsignale: ["sensor", "signale"], kraftstoffventile: ["kraftstoff", "ventile"], motorfunktionen: ["motor", "funktionen"], tabellenzeilen: ["tabelle", "zeilen"], schnittstelle: ["schnitt", "stelle"], zuendungsmasse: ["zuendung", "masse"], programmierspannungseingang: ["programmierspannung", "eingang"], kurbelwellenreferenz: ["kurbelwelle", "referenz"], fahrbereichsschalter: ["fahrbereich", "schalter"], standardschnittstelle: ["standard", "schnittstelle"], lufttemperatur: ["luft", "temperatur"], motortemperatur: ["motor", "temperatur"], geschwindigkeitsgebersignal: ["geschwindigkeit", "geber", "signal"], getriebeabgriff: ["getriebe", "abgriff"], stoermeldeleuchte: ["stoer", "meldeleuchte"], kraftstoffventilgruppe: ["kraftstoff", "ventil", "gruppe"], volllastschalter: ["volllast", "schalter"], kupplungseinkupplung: ["kupplung", "sein", "kupplung"], dauerplus: ["dauer", "plus"], steuergeraetelektronik: ["steuergeraet", "elektronik"], automatische: ["automat", "ische"], doppelspulenregelung: ["doppelspule", "regelung"], induktivgeber: ["induktiv", "geber"], motorschleppmomentregelung: ["motor", "schleppmoment", "regelung"], masseeingang: ["masse", "eingang"], verdrahtungsplan: ["verdrahtung", "plan"], halteschaltung: ["halte", "schaltung"], zuendschlossklemme: ["zuendschloss", "klemme"], batterieplus: ["batterie", "plus"], schaltbilder: ["schalt", "bilder"], relaissteckerbelegung: ["relais", "steckerbelegung"], relaisvarianten: ["relais", "varianten"], lambdasondenrelais: ["lambdasonde", "relais"], relaiskontaktbild: ["relaiskontakt", "bild"], schaltbild: ["schalt", "bild"], relaissockel: ["relais", "sockel"], zuordnungstabelle: ["zuordnung", "stabelle"], steckplatznummern: ["steckplatz", "nummern"], leitungsquerschnitte: ["leitung", "querschnitte"], relaisstecker: ["relais", "stecker"], querschnitt: ["quer", "schnitt"], relaiskontaktbezeichnungen: ["relaiskontakt", "bezeichnungen"], kontaktbild: ["kontakt", "bild"], steckplatznummer: ["steckplatz", "nummer"], anschlussnummer: ["anschluss", "nummer"], relaisklemme: ["relais", "klemme"], relaiskontakt: ["relais", "kontakt"], kurzpruefung: ["kurz", "pruefung"], funktionsfaehiges: ["funktion", "faehiges"], startsystem: ["start", "system"], einwandfreie: ["einwand", "freie"], masseverbindungen: ["masse", "verbindungen"], betriebsbereiten: ["betriebs", "bereiten"], universaladapters: ["universal", "adapters"], zuendschloss: ["zuend", "schloss"], einwandfreier: ["einwand", "freier"], betriebsfaehigem: ["betriebs", "faehigem"], alternativ: ["alter", "nativ"], massepins: ["masse", "pins"], masseversorgung: ["masse", "versorgung"], abhilfemassnahmen: ["abhilfe", "massnahmen"], karosseriemasse: ["karosserie", "masse"], ablaufpfeil: ["ablauf", "pfeil"], kraftstoffzufuhr: ["kraftstoff", "zufuhr"], filtersieb: ["filter", "sieb"], kraftstoffeinlass: ["kraftstoff", "einlass"], weiterfuehrende: ["weiter", "fuehrende"], dichtheitspruefungen: ["dichtheit", "pruefungen"], kraftstoffdruck: ["kraft", "stoffdruck"], luftfiltergehaeuse: ["luftfilter", "gehaeuse"], verschlusskappen: ["verschluss", "kappen"], luftfiltereinsatz: ["luftfilter", "einsatz"], zylinderidentifikationsgeber: ["zylinder", "identifikation", "geber"], zylinderidentifikationsgebers: ["zylinder", "identifikation", "gebers"], zuendleitungssteckers: ["zuend", "leitung", "steckers"], spezielle: ["spezi", "elle"], sicherheitshinweis: ["sicherheit", "hinweis"], spannbacken: ["spann", "backen"], schmierstofffilm: ["schmierstoff", "film"], gummilager: ["gummi", "lager"], einbaulagen: ["einbau", "lagen"], gehaeuseteile: ["gehaeuse", "teile"], gehaeuseteil: ["gehaeuse", "teil"], batterieausbau: ["batterie", "ausbau"], planetengetriebes: ["planeten", "getriebes"], getriebegehaeuses: ["getriebe", "gehaeuses"], freilaufs: ["frei", "laufs"], lagerhuelsen: ["lager", "huelsen"], anlaufscheiben: ["anlauf", "scheiben"], verschleisspruefung: ["verschleiss", "pruefung"], anlaufring: ["anlauf", "ring"], zurueckschlagen: ["zurueck", "schlagen"], metallscheibe: ["metall", "scheibe"], kunststoffscheibe: ["kunststoff", "scheibe"], lagerhuelse: ["lager", "huelse"], ritzelverzahnung: ["ritzel", "verzahnung"], kraftstoffsystem: ["kraftstoff", "system"], handschuhkastens: ["handschuh", "kastens"], haltebaender: ["halte", "baender"], uebereinstimmung: ["ueberein", "stimmung"], halteband: ["halte", "band"], luftmengenmessers: ["luftmenge", "messers"], luftschlauch: ["luft", "schlauch"], modelljahr: ["modell", "jahr"], drahtband: ["draht", "band"], auseinandernehmen: ["auseinander", "nehmen"], temperaturzeitschalter: ["temperatur", "zeitschalter"], schaltkontakten: ["schalt", "kontakten"], fertigungskennzeichnung: ["fertigung", "kennzeichnung"], temperaturbereich: ["temperatur", "bereich"], oeffnungszeit: ["oeffnung", "zeit"], kaltstartventils: ["kaltstart", "ventils"], temperaturzeitschalters: ["temperatur", "zeitschalters"], sechskant: ["sech", "kant"], fertigungsdatum: ["fertigung", "datum"], temperaturbereichs: ["temperatur", "bereichs"], kaltstartventil: ["kaltstart", "ventil"], temperaturzeitschaltuhr: ["temperatur", "zeitschaltuhr"], drucksensors: ["druck", "sensors"], steckanschluss: ["steck", "anschluss"], kennzeichen: ["kenn", "zeichen"], sensorwiderstands: ["sensor", "widerstands"], anschlusskontakten: ["anschluss", "kontakten"], steckerkontakten: ["stecker", "kontakten"], steckerkontakte: ["stecker", "kontakte"], motorkuehlmitteltemperaturfuehler: ["motor", "kuehlmittel", "temperaturfuehler"], motorkuehlmitteltemperaturfuehlers: ["motor", "kuehlmittel", "temperaturfuehlers"], herstellungskennzeichnung: ["herstellung", "kennzeichnung"], kuehlmitteltemperaturfuehlers: ["kuehlmittel", "temperaturfuehlers"], widerstandswert: ["widerstand", "wert"], innerhalb: ["inner", "halb"], drosselklappenschalter: ["drosselklappe", "schalter"], drosselklappenschalters: ["drosselklappe", "schalters"], schaltbilddarstellung: ["schaltbild", "darstellung"], volllast: ["voll", "last"], einstelllage: ["eins", "tell", "lage"], anschlussklemme: ["anschluss", "klemme"], mehrfachstecker: ["mehrfach", "stecker"], anschlusskontakte: ["anschluss", "kontakte"], leckmenge: ["leck", "menge"], kraftstofffoerdermenge: ["kraftstoff", "foerdermenge"], spritzwinkel: ["spritz", "winkel"], leckpruefung: ["leck", "pruefung"], spritzwinkels: ["spritz", "winkels"], fehlerdiagnose: ["fehler", "diagnose"], leckrate: ["leck", "rate"], einspritzventilschutzes: ["einspritzventil", "schutzes"], herausgehoben: ["heraus", "gehoben"], haltebuegel: ["halte", "buegel"], einspritzventilschutz: ["einspritzventil", "schutz"], kenncode: ["kenn", "code"], steckerhalter: ["stecker", "halter"], steckerhalters: ["stecker", "halters"], ablaufdiagramm: ["ablauf", "diagramm"], elektronischen: ["elektro", "nischen"], leerlaufregelgeraets: ["leerlauf", "regelgeraet"], raumtemperatur: ["raum", "temperatur"], multimeterschritte: ["multimeter", "schritte"], leerlaufdrehzahlregelung: ["leerlauf", "drehzahlregelung"], voltmeter: ["volt", "meter"], fahrzeugmasse: ["fahrzeug", "masse"], fortfahren: ["fort", "fahren"], leerlaufdrehzahlregelgeraet: ["leerlaufdrehzahl", "regelgeraet"], warmlaufdrehzahl: ["warmlauf", "drehzahl"], leerlaufsignal: ["leerlauf", "signal"], geschwindigkeitssignals: ["geschwindigkeit", "signals"], leerlaufsignals: ["leerlauf", "signals"], diagnoseanschlusses: ["diagnose", "anschlusses"], geschwindigkeitssignal: ["geschwindigkeit", "signal"], kurzzeitig: ["kurz", "zeitig"], steckerbuchse: ["stecker", "buchse"], diagnoseanschluss: ["diagnose", "anschluss"], leerlaufregelventils: ["leerlauf", "regelventils"], pruefablaufdiagramm: ["pruefablauf", "diagramm"], motordrehzahl: ["motor", "drehzahl"], fehlerursache: ["fehler", "ursache"], bauteiltemperatur: ["bauteil", "temperatur"], leitungsstecker: ["leitung", "stecker"], codierungsnummer: ["codierung", "nummer"], nenndrehzahl: ["nenn", "drehzahl"], motoroeltemperatur: ["motoroel", "temperatur"], peripherieschaltung: ["peripherie", "schaltung"], leerlaufanhebung: ["leerlauf", "anhebung"], fahrstufe: ["fahr", "stufe"], klimaanlagendrehzahl: ["klimaanlage", "drehzahl"], leerlaufdrehzahlanhebung: ["leerlaufdrehzahl", "anhebung"], kuehlmitteltemperatursensors: ["kuehlmittel", "temperatursensors"], widerstandsmessungen: ["widerstand", "messungen"], kontaktstifte: ["kontakt", "stifte"], temperatursensors: ["temperatur", "sensors"], temperatursensor: ["temperatur", "sensor"], kuehlmitteltemperatursensor: ["kuehlmittel", "temperatursensor"], lufttemperaturschalter: ["lufttemperatur", "schalter"], voltmeters: ["volt", "meters"], temperaturabhaengige: ["temperatur", "abhaengige"], lufttemperaturen: ["luft", "temperaturen"], leitungsunterbrechungen: ["leitung", "unterbrechungen"], steckanschluessen: ["steck", "anschluessen"], lufttemperaturfuehlers: ["lufttemperatur", "fuehlers"], lufttemperaturschalters: ["lufttemperatur", "schalters"], startfreigabe: ["start", "freigabe"], spannungspruefung: ["spannung", "pruefung"], nennleerlaufdrehzahl: ["nenn", "leerlaufdrehzahl"], pruefstromkreis: ["pruefstrom", "kreis"], kommenden: ["komm", "enden"], drehzahlsignals: ["drehzahl", "signals"], leerlaufsteuergeraet: ["leerlauf", "steuergeraet"], niedertreten: ["nieder", "treten"], strommessung: ["strom", "messung"], funktionspruefungen: ["funktion", "pruefungen"], kabelstecker: ["kabel", "stecker"], drehzahlanhebung: ["drehzahl", "anhebung"], vorrangschaltung: ["vorrang", "schaltung"], widerstandspruefungen: ["widerstand", "pruefungen"], massekontakte: ["masse", "kontakte"], temperaturschalters: ["temperatur", "schalters"], steckkontakte: ["steck", "kontakte"], stiftkontakt: ["stift", "kontakt"], aussentemperatur: ["aussen", "temperatur"], schaltwiderstand: ["schalt", "widerstand"], steckanschluesse: ["steck", "anschluesse"], leitungspruefung: ["leitung", "pruefung"], fahrbereich: ["fahr", "bereich"], fahrbereichs: ["fahr", "bereichs"], stromkreis: ["strom", "kreis"], fehlerdiagnosetabelle: ["fehlerdiagnose", "tabelle"], fahrbetriebssymptome: ["fahrbetrieb", "symptome"], gegenuebergestellt: ["gegenueber", "gestellt"], betreffende: ["betreff", "ende"], betracht: ["betr", "acht"], motorleerlaufdrehzahl: ["motorleerlauf", "drehzahl"], beschleunigungsannahme: ["beschleunigung", "annahme"], motoraussetzer: ["motor", "aussetzer"], fahrzustaenden: ["fahr", "zustaenden"], grundeinstellung: ["grund", "einstellung"], zuordnungsmarkierung: ["zuordnung", "markierung"], ursachentabelle: ["ursache", "tabelle"], aufeinanderfolgenden: ["aufeinander", "folgenden"], kraftstoffpumpenstecker: ["kraftstoffpumpe", "stecker"], seitenrand: ["seit", "rand"], fortgesetzt: ["fort", "gesetzt"], instandsetzen: ["instand", "setzen"], kraftstoffpumpenbetrieb: ["kraftstoff", "pumpenbetrieb"], startvorgang: ["start", "vorgang"], startvorgangs: ["start", "vorgangs"], steuerrelais: ["steuer", "relais"], steuerrelaisstecker: ["steuerrelais", "stecker"], spannungswert: ["spannung", "wert"], steuerrelaisbuchse: ["steuerrelais", "buchse"], masseanschluss: ["masse", "anschluss"], korrekturmassnahmen: ["korrektur", "massnahmen"], kraftstoffpumpenlauf: ["kraftstoffpumpe", "lauf"], relaisfassung: ["relais", "fassung"], nadelbewegung: ["nadel", "bewegung"], korrekturschema: ["korrektur", "schema"], austauschmassnahmen: ["austausch", "massnahmen"], luftfuehrenden: ["luft", "fuehrenden"], luftfuehrende: ["luft", "fuehrende"], startsymptome: ["start", "symptome"], warmzustand: ["warm", "zustand"], testpositionen: ["test", "positionen"], anwendungsinformationen: ["anwendung", "informationen"], abgaswerte: ["abgas", "werte"], pruefstellen: ["pruefst", "ellen"], testposition: ["test", "position"], pumpendruck: ["pumpe", "druck"], drosselklappensteller: ["drosselklappe", "steller"], drosselklappengeber: ["drosselklappe", "geber"], elektrisches: ["elektr", "ische"], leitungsfuehrung: ["leitung", "fuehrung"], arbeitspositionen: ["arbeit", "positionen"], zusammengestellt: ["zusammen", "gestellt"], stromverteiler: ["strom", "verteiler"], steuerleitung: ["steuer", "leitung"], gleichzeitig: ["gleich", "zeitig"], ablaufplan: ["ablauf", "plan"], filterkomponenten: ["filter", "komponenten"], kraftstoffruecklaufleitung: ["kraftstoff", "ruecklaufleitung"], kraftstoffzulaufleitung: ["kraftstoffzulauf", "leitung"], kraftstoffvorratsgeber: ["kraftstoff", "vorratsgeber"], ventilnadelbewegung: ["ventil", "nadelbewegung"], spritzbild: ["spritz", "bild"], ventilnadeln: ["ventil", "nadeln"], unterschiedlich: ["unterschied", "lich"], kraftstofffluss: ["kraft", "stofffluss"], nominalwerttabelle: ["nominalwert", "tabelle"], luftblasen: ["luft", "blasen"], fehlercodenummer: ["fehler", "codenummer"], kuehlmittelstands: ["kuehlmittel", "stands"], widerstandswerten: ["widerstand", "werten"], fussnoten: ["fuss", "noten"], drosselklappengehaeuses: ["drosselklappe", "gehaeuses"], gaszugeinstellung: ["gaszug", "einstellung"], drosselklappenbewegung: ["drosselklappe", "bewegung"], steuergeraetesteckers: ["steuergeraete", "steckers"], steckersitz: ["stecker", "sitz"], schwenkfaehigkeit: ["schwenk", "faehigkeit"], sensorplatte: ["sensor", "platte"], universalpruefadapter: ["universal", "pruefadapter"], anschlusskabel: ["anschluss", "kabel"], massnahme: ["mass", "ahme"], schwenkbereich: ["schwenk", "bereich"], statusabrufe: ["status", "abrufe"], eingangssignale: ["eingang", "signale"], motortypen: ["motor", "typen"], diagnosegeraet: ["diagnose", "geraet"], kurztest: ["kurz", "test"], motorkennbuchstabe: ["motor", "kennbuchstabe"], kraftstoffart: ["kraft", "stoffart"], softwarenummer: ["software", "nummer"], fertigungscode: ["fertigung", "code"], auswahluebersicht: ["auswahl", "uebersicht"], testcode: ["test", "code"], statuslisten: ["status", "listen"], tankentlueftungsventil: ["tankentlueftung", "ventil"], klimaanlagenschalter: ["klimaanlage", "schalter"], zuendzeitpunktabgriff: ["zuendzeitpunkt", "abgriff"], halbsequentielle: ["halb", "sequentielle"], schalterstellung: ["schalter", "stellung"], halbsequentieller: ["halb", "sequentieller"], paralleleinspritzung: ["parallel", "einspritzung"], diagnosebetrieb: ["diagnose", "betrieb"], fehlersuchhandbuch: ["fehler", "such", "handbuch"], anschlussfunktionen: ["anschluss", "funktionen"], masseanschluessen: ["masse", "anschluessen"], verbrauchsanzeige: ["verbrauch", "anzeige"], steckerverbindungen: ["stecker", "verbindungen"], signalformen: ["signal", "formen"], signalgroessen: ["signal", "groessen"], leistungsmasse: ["leistung", "masse"], stromgeregelte: ["strom", "geregelte"], rechtecksignal: ["rechteck", "signal"], funktionsangabe: ["funktion", "angabe"], spannungsausgang: ["spannung", "ausgang"], diagnosebuchse: ["diagnose", "buchse"], buchsenkontakt: ["buchsen", "kontakt"], sauerstoffsensorrelais: ["sauerstoff", "sensorrelais"], sauerstoffsensorsignal: ["sauerstoff", "sensorsignal"], spannungsspruenge: ["spannung", "spruenge"], datenkodierung: ["daten", "kodierung"], schubabschaltung: ["schub", "abschaltung"], klopfschutzrelais: ["klopf", "schutzrelais"], anlaufsicherheitsrelais: ["anlauf", "sicherheitsrelais"], bereitschaftssignal: ["bereitschaft", "signal"], kraftstoffverbrauchsanzeige: ["kraftstoff", "verbrauchsanzeige"], hoehenkorrekturwert: ["hoehen", "korrekturwert"], luftdichte: ["luft", "dichte"], normalbetrieb: ["normal", "betrieb"], elektronikmasse: ["elektronik", "masse"], volllastsignal: ["volllast", "signal"], hoehenkorrektur: ["hoehen", "korrektur"], teilecodierung: ["teile", "codierung"], schalttemperatur: ["schalt", "temperatur"], referenznummern: ["referenz", "nummern"], einstellschraube: ["eins", "tell", "schraube"], hoehenkorrekturkasten: ["hoehen", "korrektur", "kasten"], abgasabsaugung: ["abgas", "absaugung"], zurueckgehen: ["zurueck", "gehen"], drosselklappen: ["drossel", "klappen"], einstellstellen: ["einstellst", "ellen"], ansaugrohrunterdruck: ["ansaugrohr", "unterdruck"], sauerstoffsensorstecker: ["sauerstoffsensor", "stecker"], druckstange: ["druck", "stange"], unterdruckpruefer: ["unterdruck", "pruefer"], steckschluesselweite: ["steckschluessel", "weite"], motorleerlaufs: ["motor", "leerlaufs"], unterdruckdifferenz: ["unterdruck", "differenz"], verstellen: ["vers", "tell"], einstellschrauben: ["eins", "tell", "schrauben"], schaltbereich: ["schalt", "bereich"], bauteilkennzeichnungen: ["bauteil", "kennzeichnungen"], temperaturabhaengigen: ["temperatur", "abhaengigen"], schaltzustaende: ["schalt", "zustaende"], kraftstoffdrucks: ["kraftstoff", "drucks"], foerdermengenpruefung: ["foerdermenge", "pruefung"], ruecklaufleitung: ["ruecklauf", "leitung"], relaisklemmen: ["relais", "klemmen"], kraftstofffoerderdruck: ["kraftstoff", "foerderdruck"], leitungsende: ["leitung", "sende"], motorraumseitenwand: ["motorraum", "seitenwand"], kraftstoffruecklaufschlauch: ["kraftstoff", "ruecklauf", "schlauch"], drehkolbens: ["dreh", "kolbens"], befestigungsmutter: ["befestigung", "mutter"], drehkolben: ["dreh", "kolben"], querschnitts: ["quer", "schnitts"], verbleiben: ["verb", "leiben"], kraftstoffdruckreglers: ["kraftstoff", "druckreglers"], zulaufleitung: ["zulauf", "leitung"], motorraumtrennwand: ["motorraum", "trennwand"], kraftstoffeinspritzdruck: ["kraftstoff", "einspritzdruck"], kraftstoffanschluss: ["kraftstoff", "anschluss"], unterdruckanschluss: ["unterdruck", "anschluss"], nadelgelagerten: ["nadel", "gelagerten"], verbindungsrohrs: ["verbindung", "rohrs"], nadellagern: ["nadel", "lagern"], freihalten: ["frei", "halten"], verbindungsrohr: ["verbindung", "rohr"], nadellager: ["nadel", "lager"], grundlegende: ["grund", "legende"], leerlaufanschlagschraube: ["leerlauf", "anschlagschraube"], drosselklappenkante: ["drosselklappe", "kante"], drosselklappenschrauben: ["drosselklappe", "schrauben"], hebellager: ["hebel", "lager"], vorspannen: ["vors", "pannen"], drosselklappeneinstellung: ["drosselklappe", "einstellung"], klemmschraube: ["klemm", "schraube"], einstellbedingungen: ["eins", "tell", "bedingungen"], pfeilrichtung: ["pfeil", "richtung"], messuhrspitze: ["messuhr", "spitze"], niedrigstmoeglichen: ["niedrigst", "moeglichen"], volllastanschlag: ["volllast", "anschlag"], druckstangen: ["drucks", "tangen"], volllastanschlags: ["volllast", "anschlags"], betaetigungshebel: ["betaetigung", "hebel"], leerlaufanschlag: ["leerlauf", "anschlag"], stroemungsrichtung: ["stroemung", "richtung"], volllastanschlagschraube: ["volllast", "anschlagschraube"], betaetigungshebels: ["betaetigung", "hebels"], oberkante: ["ober", "kante"], drosselklappenstutzens: ["drosselklappe", "stutzens"], anschlagschraube: ["anschlag", "schraube"], steckbruecken: ["steck", "bruecken"], kraftstoffsorte: ["kraft", "stoffsorte"], kraftstoffqualitaet: ["kraftstoff", "qualitaet"], fotografie: ["foto", "grafie"], kombinationen: ["kombi", "nationen"], steckeranschluesse: ["stecker", "anschluesse"], bleifreiem: ["blei", "freiem"], bleifreies: ["blei", "freies"], superbenzin: ["super", "benzin"], normalbenzin: ["normal", "benzin"], verbleites: ["verb", "leite"], luftfiltereinsatzes: ["luftfilter", "einsatzes"], befestigungsklammern: ["befestigung", "klammern"], luftfiltergehaeuses: ["luftfilter", "gehaeuses"], widerstandswerts: ["widerstand", "werts"], schalterkontakte: ["schalter", "kontakte"], volllaststellung: ["volllast", "stellung"], mehrfachsteckers: ["mehrfach", "steckers"], schalterkennzeichnung: ["schalter", "kennzeichnung"], herstellungsdatums: ["herstellung", "datums"], kunststoffteils: ["kunst", "stoffteils"], einstellanleitungen: ["eins", "tell", "anleitungen"], einstellarbeiten: ["eins", "tell", "arbeiten"], stellventil: ["stell", "ventil"], ansauggeraeuschdaempfer: ["ansauggeraeusch", "daempfer"], niederdruckregler: ["nieder", "druckregler"], ansaugluftventile: ["ansaugluft", "ventile"], niederdruck: ["nieder", "druck"], unterdruckschlaeuche: ["unterdruck", "schlaeuche"], abgastest: ["abgas", "test"], verschlusskappe: ["verschluss", "kappe"], luftmengenmesserschraube: ["luftmengenmesser", "schraube"], schubstangeneinstellung: ["schubstange", "einstellung"], unterdrucktester: ["unterdruck", "tester"], manipulationsschutzkappen: ["manipulation", "schutzkappen"], manipulationsschutzkappe: ["manipulation", "schutzkappe"], schematische: ["schema", "tische"], tankkammern: ["tank", "kammern"], tankgeber: ["tank", "geber"], ruecklaufleitungen: ["ruecklauf", "leitungen"], entlueftungsleitungen: ["entlueftung", "leitungen"], daempferelemente: ["daempfer", "elemente"], leitungsrichtungen: ["leitung", "richtungen"], ausdehnungsbehaelter: ["ausdehnung", "behaelter"], kraftstoffentnahme: ["kraftstoff", "entnahme"], daempferbehaelter: ["daempfer", "behaelter"], membrandaempfer: ["membran", "daempfer"], vorlaufschlauch: ["vorlauf", "schlauch"], ruecklaufschlauch: ["ruecklauf", "schlauch"], tankkammer: ["tank", "kammer"], kraftstofftankuebersicht: ["kraftstofftank", "uebersicht"], ausgleichsbehaelter: ["ausgleich", "behaelter"], kraftstoffentlueftungssystem: ["kraftstoff", "entlueftungssystem"], kraftstoffstandgeber: ["kraftstoff", "stand", "geber"], transferpumpe: ["transfer", "pumpe"], tankgebern: ["tank", "gebern"], ruecksitzbank: ["ruecksitz", "bank"], schalldaempferanlage: ["schalldaempfer", "anlage"], befestigungsbereiche: ["befestigung", "bereiche"], sicherheitsvermerk: ["sicherheit", "vermerk"], ruecksitzbankpolster: ["ruecksitzbank", "polster"], kraftstoffstandsgeber: ["kraftstoff", "tands", "geber"], sicherheitsvorschriften: ["sicherheit", "vorschriften"], kraftstofffilters: ["kraftstoff", "filters"], steinschutzbleche: ["steinschutz", "bleche"], fahrzeugseite: ["fahrzeug", "seite"], freigelegt: ["frei", "gelegt"], klebebandstreifen: ["klebeband", "streifen"], tankentlueftungsanlage: ["tankentlueftung", "anlage"], ausgleichsbehaelters: ["ausgleichs", "behaelters"], radhausverkleidung: ["radhaus", "verkleidung"], fuehrungsstift: ["fuehrung", "stift"], bildverweise: ["bild", "verweise"], tankentlueftungsleitung: ["tankentlueftung", "leitung"], tankentlueftungsventils: ["tankentlueftung", "ventils"], laengstraegers: ["laengs", "traegers"], entlueftungssystems: ["entlueftung", "systems"], rueckschlagventil: ["rueckschlag", "ventil"], bauteilanordnung: ["bauteil", "anordnung"], aktivkohlebehaelters: ["aktivkohle", "behaelters"], aufnahmenummer: ["aufnahme", "nummer"], tankentlueftungssystems: ["tankentlueftung", "systems"], vakuumpumpe: ["vakuum", "pumpe"], druckabfall: ["druck", "abfall"], vakuumschlauch: ["vakuum", "schlauch"], anschlussstutzen: ["anschluss", "stutzen"], messgeraetefunktion: ["messgeraete", "funktion"], vorratsgebers: ["vorrat", "gebers"], hochziehen: ["hoch", "ziehen"], kraftstoffsieb: ["kraftstoff", "sieb"], kraftstoffvorratsgebers: ["kraftstoff", "vorratsgebers"], widerstandskurve: ["widerstand", "kurve"], schwimmerstellung: ["schwimmer", "stellung"], geberwiderstand: ["geber", "widerstand"], einzelteile: ["einzel", "teile"], druckdaempfer: ["druck", "daempfer"], ruecksitzkissen: ["ruecksitz", "kissen"], verlaufende: ["verlauf", "ende"], kraftstofffoerderung: ["kraftstoff", "foerderung"], ueberlaufrohr: ["ueberlauf", "rohr"], detaildarstellung: ["detail", "darstellung"], funktionsprinzip: ["funktion", "prinzip"], kraftstoffruecklauf: ["kraftstoff", "ruecklauf"], kraftstoffzulauf: ["kraftstoff", "zulauf"], tankplatte: ["tank", "platte"], seitenansicht: ["seiten", "ansicht"], prallblech: ["prall", "blech"], strahlpumpe: ["strahl", "pumpe"], overflow: ["over", "flow"], einbauhinweisen: ["einbau", "hinweisen"], kraftstofffoerderpumpe: ["kraftstoff", "foerderpumpe"], befestigungsschelle: ["befestigung", "schelle"], tankgebers: ["tank", "gebers"], widerstandsaenderung: ["widerstand", "aenderung"], schwimmerbewegung: ["schwimmer", "bewegung"], vollstellung: ["voll", "stellung"], leistungseingang: ["leistung", "eingang"], tankseite: ["tank", "seite"], leerstellung: ["leer", "stellung"], kuehlkreislauf: ["kuehl", "kreislauf"], abschnittsseiten: ["abschnitt", "seiten"], verbrennungsgase: ["verbrennung", "gase"], zusatzluefter: ["zusatz", "luefter"], motoroelkuehler: ["motoroel", "kuehler"], kuehlmittelkreislauf: ["kuehlmittel", "kreislauf"], kuehlmittelkreislaufs: ["kuehlmittel", "kreislaufs"], vereinfachte: ["verein", "fachte"], flussbild: ["fluss", "bild"], kuehlmittelwege: ["kuehl", "mittelwege"], heizungswaermetauscher: ["heizung", "waermetauscher"], abzweigflansch: ["abzweig", "flansch"], heizungsruecklauf: ["heizung", "ruecklauf"], kreislauf: ["kreis", "lauf"], kuehlmittelweg: ["kuehl", "mittelweg"], nebenstroeme: ["neben", "stroeme"], thermostatgehaeuse: ["thermostat", "gehaeuse"], kuehlerzulauf: ["kuehler", "zulauf"], kuehlerablauf: ["kuehler", "ablauf"], anschlussvarianten: ["anschluss", "varianten"], oeffnungsdrucks: ["oeffnung", "drucks"], sicherheitsventils: ["sicherheit", "ventils"], kuehlerdeckel: ["kuehler", "deckel"], zylinderkopfdichtungstesters: ["zylinderkopfdichtung", "testers"], festzustellen: ["fest", "zustellen"], anschlussstueck: ["anschluss", "stueck"], oeffnungsdruck: ["oeffnung", "druck"], vakuumventil: ["vakuum", "ventil"], zylinderkopfdichtungen: ["zylinderkopf", "dichtungen"], beigefuegte: ["beige", "fuegte"], heizungsbetaetigung: ["heizung", "betaetigung"], entlueftungsschraube: ["entlueftung", "schraube"], verletzungsgefahr: ["verletzung", "gefahr"], drehenden: ["dreh", "enden"], sicherheitsventil: ["sicherheit", "ventil"], zylinderkopfdichtungstester: ["zylinderkopfdichtung", "tester"], gummilagern: ["gummi", "lagern"], verbruehungsgefahr: ["verbruehung", "gefahr"], kuehlerverschlussdeckel: ["kuehler", "verschlussdeckel"], ablassschraube: ["ablass", "schraube"], temperaturschaltern: ["temperatur", "schaltern"], oelkuehlerleitung: ["oelkuehler", "leitung"], arbeitsablauf: ["arbeit", "ablauf"], spritzschutzes: ["spritz", "schutzes"], entlueftungsschlaeuche: ["entlueftung", "schlaeuche"], verbrennungsgefahr: ["verbrennung", "gefahr"], befestigungsstopfen: ["befestigung", "stopfen"], fotoreferenzen: ["foto", "referenzen"], kuehlerbefestigungsschraube: ["kuehler", "befestigungsschraube"], hochhaengen: ["hoch", "haengen"], kuehlmittelstandsgebers: ["kuehlmittelstand", "gebers"], kuehlmittelbefuellung: ["kuehlmittel", "befuellung"], fuellstandgeber: ["fuellstand", "geber"], kuehlmittelstandsgeber: ["kuehlmittelstand", "geber"], kuehlmittelstandsmarkierung: ["kuehlmittelstand", "markierung"], gummidichtungen: ["gummi", "dichtungen"], mehrmals: ["mehr", "mals"], loesungsmittelrueckstaende: ["loesungsmittel", "rueckstaende"], oelspuren: ["oels", "puren"], zusatzlueftereinheit: ["zusatzluefter", "einheit"], fahrzeugfront: ["fahrzeug", "front"], kuehlergrillteile: ["kuehlergrill", "teile"], zusatzluefters: ["zusatz", "luefters"], verkleidungsblende: ["verkleidung", "blende"], herausgenommen: ["heraus", "genommen"], zurueckbinden: ["zurueck", "binden"], klimakondensator: ["klima", "kondensator"], arbeitsverfahren: ["arbeit", "verfahren"], drehbuchsen: ["dreh", "buchsen"], abgastraeger: ["abgas", "traeger"], aufhaengungsanordnung: ["aufhaengung", "anordnung"], montagevorgaben: ["montage", "vorgaben"], abgasrohrs: ["abgas", "rohrs"], abgasanlagenhalter: ["abgasanlage", "halter"], hinterachstraeger: ["hinter", "achstraeger"], vollstaendigen: ["voll", "staendigen"], spannungsfreie: ["spannung", "freie"], gummirings: ["gummi", "rings"], schutzrohr: ["schutz", "rohr"], abgasrohr: ["abgas", "rohr"], kupferpaste: ["kupfer", "paste"], vollstaendiger: ["voll", "staendiger"], verspannungsgefahr: ["verspannung", "gefahr"], spannungsfrei: ["spannung", "frei"], gummiring: ["gummi", "ring"], abgasanlagenaufhaengung: ["abgasanlage", "aufhaengung"], vollstaendigem: ["voll", "staendigem"], gelenkbuchsen: ["gelenk", "buchsen"], drehbuchse: ["dreh", "buchse"], gelenkbuchse: ["gelenk", "buchse"], vorspannungshinweise: ["vorspannung", "hinweise"], einstellmutter: ["eins", "tell", "mutter"], zurueckgegeben: ["zurueck", "gegeben"], gewaehrleistungsteilen: ["gewaehr", "leistungsteilen"], lambdasondensteckern: ["lambdasonde", "steckern"], kabelstraengen: ["kabelst", "raengen"], abgasrohren: ["abgas", "rohren"], abgasaufhaengung: ["abgas", "aufhaengung"], befestigungspunkte: ["befestigung", "punkte"], kontaktprobleme: ["kontakt", "probleme"], abgasrohre: ["abgas", "rohre"], spannungsfreien: ["spannung", "freien"], zweilochflansch: ["zwei", "loch", "flansch"], dreilochflansch: ["drei", "loch", "flansch"], bodenbereich: ["boden", "bereich"], spannungsgefahr: ["spannung", "gefahr"], klemmhuelsen: ["klemm", "huelsen"], umlaufendes: ["umlauf", "endes"], klemmstellen: ["klemm", "stellen"], schweisspunkten: ["schweiss", "punkten"], klemmhuelse: ["klemm", "huelse"], klemmstelle: ["klemm", "stelle"], heftschweissung: ["heft", "schweissung"], befestigungszeichnungen: ["befestigung", "zeichnungen"], auspufftraegers: ["auspuff", "traegers"], gummiaufhaengungen: ["gummi", "aufhaengungen"], festzuziehen: ["fest", "zuziehen"], gummiaufhaengungsteile: ["gummi", "aufhaengung", "steile"], funktionsweise: ["funktion", "weise"], anzeigeeinheit: ["anzeige", "einheit"], innenrueckspiegels: ["innen", "rueckspiegels"], schaltplanausschnitt: ["schaltplan", "ausschnitt"], selbstpruefung: ["selbst", "pruefung"], ueberwachungsbedingungen: ["ueberwachung", "bedingungen"], alarmindikator: ["alarm", "indikator"], zuendschalter: ["zuend", "schalter"], erstmals: ["erst", "mals"], instrumententraeger: ["instrument", "traeger"], fehlerueberwachung: ["fehler", "ueberwachung"], stromkreise: ["strom", "kreise"], bremslichtstromkreise: ["bremslicht", "stromkreise"], zuendschalterstellung: ["zuendschalter", "stellung"], waschfluessigkeit: ["wasch", "fluessigkeit"], kennzeichenleuchte: ["kennzeichen", "leuchte"], schaltplanbeschriftungen: ["schaltplan", "beschriftungen"], halbleiterschaltung: ["halbleiter", "schaltung"], stromverteilung: ["strom", "verteilung"], masseverteilung: ["masse", "verteilung"], halbleitertechnik: ["halbleiter", "technik"], beleuchtungsanlage: ["beleuchtung", "anlage"], kennzeichenbeleuchtung: ["kennzeichen", "beleuchtung"], nebelscheinwerferanlage: ["nebelscheinwerfer", "anlage"], bremslichtanlage: ["bremslicht", "anlage"], bremslichtschalter: ["bremslicht", "schalter"], bremslichtfehleranzeige: ["bremslicht", "fehleranzeige"], hochgesetzter: ["hoch", "gesetzter"], massepunkten: ["masse", "punkten"], steckverbindern: ["steck", "verbindern"], leitungsquerschnitten: ["leitung", "querschnitten"], rueckwaertsgang: ["rueckwaerts", "gang"], spannungsverteilung: ["spannung", "verteilung"], spannungsverteilungskasten: ["spannungsverteilung", "kasten"], sicherungsdetails: ["sicherung", "details"], halbleiter: ["halb", "leiter"], hochgesetzte: ["hoch", "gesetzte"], bremsleuchteneinheit: ["bremsleuchte", "einheit"], leitungsangaben: ["leitung", "angaben"], spleissverbindung: ["spleiss", "verbindung"], bremsleuchtenanlage: ["bremsleuchte", "anlage"], spannungsfuehrende: ["spannung", "fuehrende"], stromverteilerkasten: ["strom", "verteilerkasten"], schaltstellungen: ["schalt", "stellungen"], lichtschalters: ["licht", "schalters"], schlusslicht: ["schluss", "licht"], lichtschalter: ["licht", "schalter"], kabelquerschnitte: ["kabel", "querschnitte"], spannungsfuehrend: ["spannung", "fuehrend"], fahrlicht: ["fahr", "licht"], dauerlichtzustand: ["dauerlicht", "zustand"], instrumentenkombination: ["instrumente", "kombination"], scheibenwaschfluessigkeitsstand: ["scheibe", "wasch", "fluessigkeitsstand"], instrumentenwarnleuchten: ["instrumenten", "warnleuchten"], panelbeleuchtung: ["panel", "beleuchtung"], gurtwarnung: ["gurt", "warnung"], leitungsnummern: ["leitung", "nummern"], leitungsfarben: ["leitung", "farben"], dauerspeicher: ["dauer", "speicher"], speicherversorgungseingang: ["speicher", "versorgung", "eingang"], leiterplatte: ["leiter", "platte"], testschalter: ["test", "schalter"], alarmsteuerung: ["alarms", "teuerung"], fuellstandsfehleranzeige: ["fuellstand", "fehleranzeige"], kuehlmittelstandschalter: ["kuehlmittelstand", "schalter"], waschfluessigkeitsstandschalter: ["wasch", "fluessigkeitsstand", "schalter"], waschfluessigkeitsstand: ["wasch", "fluessigkeitsstand"], gurtwarnanzeige: ["gurt", "warnanzeige"], gurtwarnzeitgeber: ["gurt", "warnzeit", "geber"], leitungsfarbcodes: ["leitung", "farbcodes"], oelstandsueberwachung: ["oelstands", "ueberwachung"], seatbelts: ["seat", "belt"], seatbelt: ["seat", "belt"], motormanagementbezogener: ["motormanagement", "bezogener"], sicherungseinrichtungen: ["sicherung", "einrichtungen"], bremsfluessigkeitsstandschalter: ["bremsfluessigkeit", "stand", "schalter"], zusatzsicherung: ["zusatz", "sicherung"], scheibenwischermotor: ["scheibenwischer", "motor"], umgebungsdrucksensor: ["umgebung", "drucksensor"], seitenangaben: ["seiten", "angaben"], motorraums: ["motor", "raums"], stromverteilerkastens: ["strom", "verteilerkasten"], geblaesemotor: ["geblaese", "motor"], masseverteilungsplan: ["masse", "verteilungsplan"], sensorelektronik: ["sensor", "elektronik"], fotografischen: ["foto", "grafischen"], stossfaengerbereich: ["stossfaenger", "bereich"], frontstossfaenger: ["front", "stossfaenger"], crashsensor: ["crash", "sensor"], stellglied: ["stell", "glied"], geschwindigkeitsregelung: ["geschwindigkeit", "regelung"], frontstossfaengers: ["front", "stossfaengers"], heruntergezogen: ["herunter", "gezogen"], aussentemperaturfuehler: ["aussentemperatur", "fuehler"], komponenteneinbauorte: ["komponente", "einbauort"], hupendiode: ["hupen", "diode"], bordcomputers: ["bord", "computers"], einbauorten: ["einbau", "orten"], motornaher: ["motor", "naher"], motorvorderseite: ["motor", "vorderseite"], stossfaengers: ["stoss", "faengers"], bauteilidentifikation: ["bauteil", "identifikation"], einbauortansichten: ["einbauort", "ansichten"], bildreferenz: ["bild", "referenz"], oberseite: ["ober", "seite"], normaldrehzahl: ["normal", "drehzahl"], duesenheizung: ["duesen", "heizung"], stossfaenger: ["stoss", "faenger"], scheibenwaschduesenheizung: ["scheibenwaschduese", "heizung"], klimaanlagenbauteile: ["klimaanlage", "bauteile"], klimaanlagenbezogener: ["klimaanlage", "bezogener"], steckverbinderpositionen: ["steckverbinder", "positionen"], klimakompressorkupplung: ["klimakompressor", "kupplung"], waschwasserstandschalter: ["wasch", "wasserstand", "schalter"], kaeltemitteldruckschalter: ["kaeltemittel", "druckschalter"], bauteileinbauorte: ["bauteil", "einbauort"], doppeltemperaturschalter: ["doppel", "temperaturschalter"], klimaanlagenkomponenten: ["klimaanlage", "komponenten"], bauteilansichten: ["bauteil", "ansichten"], detailansichten: ["detail", "ansichten"], emissionsrelevanter: ["emission", "relevanter"], motorraumseite: ["motor", "raumseite"], motorraumbereich: ["motorraum", "bereich"], motorraumbereiche: ["motorraum", "bereiche"], anschlussstellen: ["anschluss", "stellen"], scheibenwaschpumpe: ["scheibe", "wasch", "pumpe"], aufprallsensor: ["aufprall", "sensor"], lambdasonden: ["lambda", "sonden"], einbauortuebersichten: ["einbauort", "uebersichten"], oeltemperaturschalter: ["oeltemperatur", "schalter"], rueckfahrlichtschalter: ["rueckfahrlicht", "schalter"], drehzahldetektor: ["drehzahl", "detektor"], zylindererkennungssensor: ["zylinder", "erkennung", "sensor"], getriebeglocke: ["getriebe", "glocke"], bremsbelagverschleisssensor: ["bremsbelag", "verschleiss", "sensor"], vordertuer: ["vorder", "tuer"], bauteilidentifizierung: ["bauteil", "identifizierung"], fahrzeugmitte: ["fahrzeug", "mitte"], motordrehzahlsensor: ["motordrehzahl", "sensor"], vorderradbremssattel: ["vorderrad", "bremssattel"], tuerrahmens: ["tuer", "rahmens"], seitenverkleidung: ["seiten", "verkleidung"], fussraum: ["fuss", "raum"], bremssattelbaugruppe: ["bremssattel", "baugruppe"], tuerrahmenbereich: ["tuerrahmen", "bereich"], fensterheberanlage: ["fensterheber", "anlage"], anschlussbelegungen: ["anschluss", "belegungen"], relaiskaesten: ["relais", "kaesten"], armaturentafel: ["armatur", "tafel"], lautsprecher: ["laut", "sprecher"], elektronisches: ["elektro", "nische"], gongmodul: ["gong", "modul"], zubehoeranschluss: ["zubehoer", "anschluss"], kupplungsschalter: ["kupplung", "schalter"], sicherheitsrelevanter: ["sicherheit", "relevanter"], instrumententafel: ["instrument", "tafel"], hupenkontakt: ["hupen", "kontakt"], kombischalter: ["kombi", "schalter"], fahrerairbag: ["fahrer", "airbag"], bauteillagebilder: ["bauteil", "lagebilder"], windschutzscheibenrahmens: ["windschutz", "scheibenrahmens"], stellmotor: ["stell", "motor"], umluftklappe: ["umluft", "klappe"], umluftrelais: ["umluft", "relais"], bordcomputermodul: ["bordcomputer", "modul"], windschutzscheibenrahmen: ["windschutz", "scheibenrahmen"], schalterbeleuchtung: ["schalter", "beleuchtung"], temperaturregelung: ["temperatur", "regelung"], einbauortuebersicht: ["einbauort", "uebersicht"], dachhimmel: ["dach", "himmel"], sicherungsautomaten: ["sicherung", "automaten"], motorrelais: ["motor", "relais"], schiebedachmotor: ["schiebedach", "motor"], schutzschalter: ["schutz", "schalter"], fensterheberstromkreis: ["fensterheber", "stromkreis"], handschuhfachleuchtenschalter: ["handschuhfach", "leuchten", "schalter"], aufladbare: ["auflad", "bare"], taschenlampe: ["tasche", "lampe"], aufnahmenummern: ["aufnahme", "nummern"], flashlight: ["flash", "light"], lageplan: ["lage", "plan"], schwarzweissfotos: ["schwarzweiss", "fotos"], zentralverriegelungs: ["zentral", "verriegelung"], fussraums: ["fuss", "raums"], tuersaeule: ["tuer", "saeule"], tuerabbildungen: ["tuer", "abbildungen"], gegenueberliegende: ["gegenueber", "liegende"], fensterhebermotor: ["fensterheber", "motor"], tuerverriegelungsmotor: ["tuerverriegelung", "motor"], tuerverkleidung: ["tuer", "verkleidung"], schlossheizung: ["schloss", "heizung"], entriegelungssperrenschalter: ["entriegelung", "sperren", "schalter"], mikroschalter: ["mikro", "schalter"], hupenanlage: ["hupen", "anlage"], tuerschlossheizung: ["tuerschloss", "heizung"], geschwindigkeitssensoren: ["geschwindigkeit", "sensoren"], sitzseiten: ["sitz", "seiten"], kraftstofftankgeber: ["kraftstofftank", "geber"], zusatzkraftstoffpumpe: ["zusatz", "kraftstoffpumpe"], hauptkraftstoffpumpe: ["haupt", "kraftstoffpumpe"], geschwindigkeitsgeber: ["geschwindigkeit", "geber"], abschnittsnummer: ["abschnitt", "nummer"], blockschaltbild: ["block", "schaltbild"], bauteillageansichten: ["bauteil", "lage", "ansichten"], kofferraumdeckel: ["kofferraum", "deckel"], elektromechanischer: ["elektro", "mechanischer"], kofferraumseite: ["koffer", "raumseite"], kofferraumbereich: ["kofferraum", "bereich"], kofferraumdeckels: ["kofferraum", "deckels"], kofferraums: ["koffer", "raums"], kofferraumleuchtenschalter: ["kofferraum", "leuchten", "schalter"], kontaktbelegung: ["kontakt", "belegung"], kontaktseite: ["kontakt", "seite"], diagnoseverbinders: ["diagnose", "verbinder"], steckeransichten: ["stecker", "ansichten"], leitungsgroesse: ["leitung", "groesse"], startsignal: ["start", "signal"], kontaktansicht: ["kontakt", "ansicht"], empfangsdatenleitung: ["empfangs", "datenleitung"], sendedatenleitung: ["sendedaten", "leitung"], steckerbelegung: ["stecker", "belegung"], zubehoersteckers: ["zubehoer", "steckers"], stromkreisen: ["strom", "kreisen"], vorderansicht: ["vorder", "ansicht"], armaturenbretts: ["armatur", "bretts"], anschlusspositionen: ["anschluss", "positionen"], zubehoerstecker: ["zubehoer", "stecker"], armaturenbrett: ["armatur", "brett"], anschlussnummerierungen: ["anschluss", "nummerierungen"], sicherungssysteme: ["sicherung", "systeme"], kontaktseiten: ["kontakt", "seiten"], kabelbaumseiten: ["kabelbaum", "seiten"], steckseite: ["steck", "seite"], kabelbaumseite: ["kabelbaum", "seite"], soundsystem: ["sound", "system"], reihenanschluesse: ["reihen", "anschluesse"], anschlussstift: ["anschluss", "stift"], barometerdrucksensor: ["barometer", "drucksensor"], geblaesestufenregler: ["geblaese", "stufen", "regler"], geblaesewiderstaende: ["geblaese", "widerstaende"], signalgebermodule: ["signalgeber", "module"], gegenseite: ["gegen", "seite"], kabelanschlussseite: ["kabel", "anschlussseite"], kontaktkennzeichnungen: ["kontakt", "kennzeichnungen"], signalgebermodul: ["signalgeber", "modul"], steckgesicht: ["steck", "gesicht"], gegenkomponente: ["gegen", "komponente"], kabelseite: ["kabel", "seite"], geblaesesteuerung: ["geblaese", "teuerung"], klimaanlagensteuerung: ["klimaanlage", "steuerung"], pinbelegungsansichten: ["pinbelegung", "ansichten"], gegensteckseite: ["gegen", "steckseite"], anschlussansichten: ["anschluss", "ansichten"], bedienungsschalter: ["bedienung", "schalter"], zylinderidentifikationssensor: ["zylinder", "identifikation", "sensor"], nebelscheinwerferschalter: ["nebelscheinwerfer", "schalter"], kontaktbelegungen: ["kontakt", "belegungen"], anschlussseite: ["anschluss", "seite"], leitungsseite: ["leitung", "seite"], frischluft: ["frisch", "luft"], zuendspulen: ["zuend", "pulen"], zeitsteuerung: ["zeit", "teuerung"], steckverbinderansichten: ["steckverbinder", "ansichten"], spiegelverstellung: ["spiegel", "verstellung"], ansichtsrichtung: ["ansicht", "richtung"], spiegelverstellschalter: ["spiegel", "verstell", "schalter"], oelstandsgeber: ["oelstand", "geber"], leitungsanschluessen: ["leitung", "anschluessen"], steckerseite: ["stecker", "seite"], zeichnungsnummern: ["zeichnung", "nummern"], bordelektrik: ["bord", "elektrik"], verstellbaren: ["verstell", "baren"], aussenspiegeln: ["aussen", "spiegeln"], fensterhebern: ["fenster", "hebern"], heckleuchten: ["heck", "leuchten"], heckscheibenheizungsschalter: ["heckscheibenheizung", "schalter"], verstellbare: ["verstell", "bare"], heckleuchteneinheit: ["heckleuchte", "einheit"], fensterheberschalter: ["fensterheber", "schalter"], bordcomputerelektronik: ["bordcomputer", "elektronik"], steckseiten: ["steck", "seiten"], steckergehaeuse: ["stecker", "gehaeuse"], kontaktbezeichnungen: ["kontakt", "bezeichnungen"], verdrahtungsseite: ["verdrahtung", "seite"], startrelais: ["start", "relais"], schiebedachschalter: ["schiebedach", "schalter"], sicherheitsrueckhaltesystem: ["sicherheit", "rueckhaltesystem"], wischermotor: ["wischer", "motor"], verdrahtungsseiten: ["verdrahtung", "seiten"], gehaeuseformen: ["gehaeuse", "formen"], steckercodes: ["stecker", "codes"], kontaktstiften: ["kontakt", "stiften"], kontaktreihen: ["kontakt", "reihen"], anschlusskontakt: ["anschluss", "kontakt"], rundsteckverbinder: ["rund", "steckverbinder"], kontaktreihe: ["kontakt", "reihe"], kontaktbezeichnung: ["kontakt", "bezeichnung"], leitungsseiten: ["leitung", "seiten"], gegensteckseiten: ["gegen", "steckseiten"], steckerform: ["stecker", "form"], steckerveransichten: ["stecker", "vera", "sichten"], titelseite: ["titel", "seite"], herausgegeben: ["heraus", "gegeben"], copyrightseite: ["copyright", "seite"], fortlaufenden: ["fortlauf", "enden"], weiterentwicklung: ["weiter", "entwicklung"], urheberrechtlichen: ["urheber", "rechtlichen"], produktspezifischen: ["produkt", "spezifischen"], weitgehend: ["weit", "gehend"], konstruktionen: ["konstrukt", "ionen"], auszugsweise: ["auszug", "weise"], schriftliche: ["schrift", "lich"], urheberrecht: ["urheber", "recht"], abschnittsnummern: ["abschnitt", "nummern"], sicherungsdaten: ["sicherung", "daten"], bauteilpositionen: ["bauteil", "positionen"], leitungsverbindungen: ["leitung", "verbindungen"], umrechnungstabelle: ["umrechnung", "stabelle"], verbindungsstellen: ["verbindung", "stellen"], versorgungskreise: ["versorgung", "kreise"], alphabetische: ["alphabet", "ische"], kraftstoffanzeige: ["kraftstoff", "anzeige"], sicherungsdatenuebersicht: ["sicherung", "daten", "uebersicht"], sitzheizung: ["sitz", "heizung"], ladekontrolle: ["lade", "kontrolle"], kraftstoffreserve: ["kraftstoff", "reserve"], oeldruckwarnung: ["oeldruck", "warnung"], waschwasser: ["wasch", "wasser"], aschenbecher: ["aschen", "becher"], seitenmarkierungsleuchte: ["seitenmarkierung", "leuchte"], standlichtleuchte: ["standlicht", "leuchte"], kartenleseleuchte: ["karten", "leseleuchte"], seitliche: ["seit", "lich"], markierungsleuchte: ["markierung", "leuchte"], geschwindigkeitsmesser: ["geschwindigkeit", "messer"], kabelverbindungsstellen: ["kabelverbindung", "stellen"], warnanzeigen: ["warna", "zeigen"], leselogik: ["lese", "logik"], schaltplaene: ["schalt", "plaene"], zusammenwirken: ["zusammen", "wirken"], gemeinsamen: ["gemein", "samen"], beispielsweise: ["beispiel", "weise"], plusversorgung: ["plus", "versorgung"], stromfluss: ["strom", "fluss"], ruhestellung: ["ruhe", "stellung"], bauteilbezeichnungen: ["bauteil", "bezeichnungen"], stromzufuehrung: ["strom", "zufuehrung"], stromkreisschaltplan: ["stromkreis", "schaltplan"], vollstaendiges: ["voll", "staendiges"], stromkreises: ["strom", "kreises"], massstabsgerecht: ["massstab", "gerecht"], leichteren: ["leicht", "eren"], vereinfacht: ["verein", "facht"], querschnittsflaeche: ["querschnitt", "flaeche"], leitungsisolierung: ["leitung", "isolierung"], amerikanische: ["amerika", "nische"], leitungsquerschnittsbezeichnung: ["leitungsquerschnitt", "bezeichnung"], grafischen: ["graf", "isch"], konventionen: ["konvent", "ionen"], masseanschluesse: ["masse", "anschluesse"], leitungsfortsetzungen: ["leitung", "fortsetzungen"], schaltungsverweise: ["schaltung", "verweise"], leitungsvarianten: ["leitung", "varianten"], halbleiterbauteil: ["halbleiter", "bauteil"], bauteilanschluss: ["bauteil", "anschluss"], bauteilgehaeuse: ["bauteil", "gehaeuse"], metallteil: ["metall", "teil"], schalterstellungen: ["schalter", "stellungen"], gesamtzahl: ["gesamt", "zahl"], wellenlinie: ["welle", "linie"], andersfarbigem: ["anders", "farbigem"], kennstreifen: ["kennst", "reifen"], sonderausstattungen: ["sonder", "ausstattungen"], schaltungsverweis: ["schaltung", "verweis"], schaltplansymbole: ["schaltplan", "symbole"], leitungsdarstellungen: ["leitung", "darstellungen"], grafische: ["graf", "ische"], stromflussrichtungen: ["stromfluss", "richtungen"], querschnitten: ["quer", "schnitten"], stromverteilungspunkten: ["stromverteilung", "punkten"], relaiskontakten: ["relais", "kontakten"], zweistelliger: ["zwei", "stelliger"], anlasserrelais: ["anlasser", "relais"], startstellung: ["start", "stellung"], abblendlichtrelais: ["abblendlicht", "relais"], stromflussrichtung: ["stromfluss", "richtung"], wiederholt: ["wied", "erholt"], zweipoliger: ["zwei", "poliger"], vierstelliger: ["vier", "stelliger"], steckverbinders: ["steck", "verbinder"], funkentstoerung: ["funk", "entstoerung"], massegefuehrt: ["masse", "gefuehrt"], relaispule: ["relais", "pule"], fahrzeugstromkreisen: ["fahrzeug", "stromkreisen"], spannungstest: ["spannung", "test"], beispielhaft: ["beispiel", "haft"], spannungsmessung: ["spannung", "messung"], fluessigkeitsmangelschalter: ["fluessigkeitsmangel", "schalter"], fluessigkeitsmangelanzeige: ["fluessigkeitsmangel", "anzeige"], fehlersuchverfahren: ["fehler", "suchverfahren"], betroffenen: ["betr", "offenen"], feststellen: ["fest", "tell"], heranziehen: ["heran", "ziehen"], funktionieren: ["funkt", "ionier"], strompfade: ["strom", "pfade"], stromkreiskomponenten: ["stromkreis", "komponenten"], grundlage: ["grund", "lage"], stromkreisfunktion: ["stromkreis", "funktion"], stromkreismessungen: ["stromkreis", "messungen"], widerlegen: ["wider", "legen"], werkzeugen: ["werk", "zeugen"], reparaturpraxis: ["reparatur", "praxis"], fehlersuchverfahrens: ["fehler", "suchverfahrens"], fahrzeugbatterie: ["fahrzeug", "batterie"], halbleiterbauteilen: ["halbleiter", "bauteilen"], plusleitung: ["plus", "leitung"], fluessigkeitsmangelschalters: ["fluessigkeitsmangel", "schalters"], fehlende: ["fehl", "ende"], spannungsabfallpruefung: ["spannungsabfall", "pruefung"], durchgangspruefung: ["durchgang", "pruefung"], kurzschlusspruefung: ["kurzschluss", "pruefung"], pruefgeraeteanschluesse: ["pruefgeraete", "anschluesse"], fluessigkeitsstandschalter: ["fluessigkeitsstand", "schalter"], fluessigkeitsstandanzeige: ["fluessigkeitsstand", "anzeige"], spannungsverlust: ["spannung", "verlust"], spannungsabfall: ["spannung", "abfall"], spannungsabfalls: ["spannung", "abfalls"], voltmeterleitungen: ["voltmeter", "leitungen"], fehlerbereichs: ["fehler", "bereichs"], stromquelle: ["strom", "quelle"], zusammengehaltenen: ["zusammen", "gehaltenen"], ohmmeterleitungen: ["ohmmeter", "leitungen"], stromkreisabschnitts: ["stromkreis", "abschnitts"], sicherungsklemmen: ["sicherung", "klemmen"], herbewegen: ["herbe", "wegen"], kabelbaums: ["kabel", "baums"], kurzschlusses: ["kurz", "schlusses"], kuehlmittelmangelschalter: ["kuehlmittel", "mangel", "schalter"], nullabgleich: ["null", "abgleich"], sicherungsanschluss: ["sicherung", "anschluss"], ohmmeterwert: ["ohmmeter", "wert"], kabelbaumverbindungsstellen: ["kabelbaum", "verbindungsstellen"], indexseite: ["index", "seite"], kabelbaeume: ["kabel", "baeume"], spleissstellen: ["spleiss", "stellen"], lageuebersicht: ["lage", "uebersicht"], hauptkabelbaum: ["haupt", "kabelbaum"], spleissstelle: ["spleiss", "stelle"], kabelbaumgruppe: ["kabelbaum", "gruppe"], handbuchseite: ["handbuch", "seite"], sitzheizungskabelbaeume: ["sitzheizung", "kabelbaeume"], tuerkabelbaum: ["tuer", "kabelbaum"], radiokabelbaum: ["radio", "kabelbaum"], uebersichtsdiagramme: ["uebersicht", "diagramme"], fahrzeugheck: ["fahrzeug", "heck"], draufsicht: ["drauf", "sicht"], massepunkts: ["masse", "punkts"], kabelverbindungsstelle: ["kabelverbindung", "stelle"], spleissverbindungen: ["spleiss", "verbindungen"], fahrzeugbereich: ["fahrzeug", "bereich"], tuersteckverbinder: ["tuer", "steckverbinder"], spleissbereiche: ["spleiss", "bereiche"], tuerkabelbaeume: ["tuer", "kabelbaeume"], spleisskennungen: ["spleiss", "kennungen"], tuerschlossmotor: ["tuerschloss", "motor"], spiegelschalter: ["spiegel", "schalter"], tuerkabelbaums: ["tuer", "kabelbaum"], kombiinstruments: ["kombi", "instruments"], schalterleiste: ["schalter", "leiste"], einbauansicht: ["einbau", "ansicht"], lagepunkten: ["lage", "punkten"], kabelbaumverbindungen: ["kabelbaum", "verbindungen"], kabelbaumreparatur: ["kabelbaum", "reparatur"], alphabetisch: ["alphabet", "isch"], abbildungsnummer: ["abbildung", "nummer"], richtungsangaben: ["richtung", "angaben"], haubenentriegelung: ["hauben", "entriegelung"], zugangsabdeckung: ["zugangs", "abdeckung"], bordcomputerhupe: ["bordcomputer", "hupe"], radhausstrebe: ["radhaus", "strebe"], stirnwand: ["stirn", "wand"], frischlufteinlasskasten: ["frisch", "lufteinlass", "kasten"], geblaesegehaeuse: ["geblaese", "gehaeuse"], bremsfluessigkeitsbehaelter: ["bremsfluessigkeit", "behaelter"], bremspedalhalterung: ["bremspedal", "halterung"], bremsbelagverschleisssensoren: ["bremsbelag", "verschleiss", "sensoren"], lautsprechers: ["laut", "sprechers"], kupplungspedalhalterung: ["kupplungspedal", "halterung"], kombinationsschalter: ["kombination", "schalter"], kompressorkupplung: ["kompressor", "kupplung"], kompressorkupplungsdiode: ["kompressor", "kupplung", "diode"], kuehlmittelverteiler: ["kuehlmittel", "verteiler"], karosseriekomponenten: ["karosserie", "komponenten"], abbildungsquerverweis: ["abbildung", "querverweis"], getriebeglockengehaeuse: ["getriebe", "glockengehaeuse"], stromverteilungskasten: ["stromverteilung", "kasten"], tuerschlossmotoren: ["tuerschloss", "motoren"], stellmotoren: ["stell", "motoren"], einlasskanal: ["einlas", "kanal"], tankklappenverriegelung: ["tankklappen", "verriegelung"], digitalradios: ["digital", "radios"], heizungswassers: ["heizung", "wassers"], drehregler: ["dreh", "regler"], zuendschlossschalter: ["zuendschloss", "schalter"], zuendschalters: ["zuend", "schalters"], seitlichen: ["seit", "lichen"], fussraumverkleidungsteil: ["fussraum", "verkleidung", "steil"], waschduese: ["wasch", "duese"], motorraumhaube: ["motorraum", "haube"], schleifringkontakte: ["schleifring", "kontakte"], fahrzeugbereichs: ["fahrzeug", "bereichs"], windschutzscheibenrahmenblende: ["windschutzscheibenrahmen", "blende"], digitalradio: ["digital", "radio"], relaiskasten: ["relais", "kasten"], nebelscheinwerfers: ["nebel", "scheinwerfers"], sicherungsautomat: ["sicherung", "automat"], schalthebels: ["schalt", "hebels"], impulsgeberraeder: ["impulsgeber", "raeder"], duesenhalter: ["duesen", "halter"], sicherheitsgurtschalter: ["sicherheitsgurt", "schalter"], fahrersitzes: ["fahrer", "sitzes"], tachometergeber: ["tachometer", "geber"], kofferraumschloss: ["kofferraum", "schloss"], kofferraumschlosses: ["kofferraum", "schlosses"], entriegelungssperrschalter: ["entriegelung", "sperrschalter"], originalhandbuch: ["original", "handbuch"], armaturenbrettbereich: ["armaturenbrett", "bereich"], abbildungsseite: ["abbildung", "seite"], englischen: ["engl", "isch"], seitenbezeichnungen: ["seiten", "bezeichnungen"], waschwasserstand: ["wasch", "wasserstand"], waschwasserbehaelter: ["waschwasser", "behaelter"], waschwasserpumpe: ["wasch", "wasserpumpe"], vorderradhaus: ["vorder", "radhaus"], wasserabsperrung: ["wasser", "absperrung"], fensterhebermotoren: ["fensterheber", "motoren"], karosseriehalter: ["karosserie", "halter"], zubehoersteckverbinder: ["zubehoer", "steckverbinder"], handschuhfachs: ["handschuh", "fachs"], ablageblech: ["ablage", "blech"], spritzwand: ["spritz", "wand"], motorbereichs: ["motor", "bereichs"], zubehoersteckverbinders: ["zubehoer", "steckverbinders"], waschwasserstandsschalter: ["waschwasser", "stands", "schalter"], ortsangaben: ["orts", "angaben"], lautsprecherverkleidung: ["lautsprecher", "verkleidung"], schalthebel: ["schalt", "hebel"], tuerkontaktschalters: ["tuerkontakt", "schalters"], fahrersitz: ["fahrer", "sitz"], beifahrersitz: ["beifahrer", "sitz"], tuerkontaktschalter: ["tuerkontakt", "schalter"], werkstatthandbuchs: ["werkstatt", "handbuchs"], innenkotfluegel: ["innen", "kotfluegel"], kupplungspedals: ["kupplung", "pedals"], kupplungspedal: ["kupplung", "pedal"], signalverbindungen: ["signal", "verbindungen"], diagnoseanschluessen: ["diagnose", "anschluessen"], ansauglufttemperaturfuehler: ["ansaugluft", "temperaturfuehler"], funktionsuebersicht: ["funktion", "uebersicht"], ausgangssignale: ["ausgang", "signale"], fahrbetrieb: ["fahr", "betrieb"], teillast: ["teil", "last"], luftstrom: ["luft", "strom"], halbleiterelektronik: ["halbleiter", "elektronik"], starteingang: ["start", "eingang"], zuendzeitpunktsteuerung: ["zuendzeitpunkt", "steuerung"], codierstecker: ["codierst", "ecker"], luftmengeneingang: ["luftmenge", "eingang"], referenzausgang: ["referenz", "ausgang"], barometerdruck: ["barometer", "druck"], motordrehzahlausgang: ["motordrehzahl", "ausgang"], lambdasondeneingang: ["lambdasonde", "eingang"], drosselklappenstellungen: ["drosselklappe", "stellungen"], relaisanschluesse: ["relais", "anschluesse"], einspritzungselektronik: ["einspritzung", "elektronik"], motorblockschaltbild: ["motorblock", "schaltbild"], dauerspannung: ["dauer", "spannung"], versorgungseingaenge: ["versorgung", "eingaenge"], kuehlmitteltemperatureingang: ["kuehlmitteltemperatur", "eingang"], sicherungsversorgung: ["sicherung", "versorgung"], zylindererkennungssensors: ["zylinder", "erkennung", "sensors"], motordrehzahlsensors: ["motordrehzahl", "sensors"], funktions: ["funkt", "ions"], leitungszuordnung: ["leitung", "zuordnung"], entlueftungsventil: ["entlueftung", "ventil"], sensorleitungen: ["sensor", "leitungen"], schaltplans: ["schalt", "plans"], weiterfuehrung: ["weiter", "fuehrung"], schaltplanseiten: ["schaltplan", "seiten"], signaltonmodul: ["signal", "tonmodul"], relaisspule: ["relais", "spule"], halbleitermodul: ["halbleiter", "modul"], anschlussangaben: ["anschluss", "angaben"], batterieanschluss: ["batterie", "anschluss"], batterieverteiler: ["batterie", "verteiler"], primaerseite: ["primaer", "seite"], leistungseingaenge: ["leistung", "eingaenge"], temperaturkoeffizienten: ["temperatur", "koeffizienten"], schaltplanseite: ["schaltplan", "seite"], versorgungsleitungen: ["versorgung", "leitungen"], leichtlast: ["leicht", "last"], originalkuerzeln: ["original", "kuerzeln"], barometerruckgeber: ["barometer", "ruck", "geber"], stromlaufplans: ["stromlauf", "plans"], momentanverbrauch: ["momentan", "verbrauch"], lambdasensor: ["lambda", "sensor"], festkoerperrelais: ["festkoerper", "relais"], querschnitte: ["quer", "schnitte"], radioanlage: ["radio", "anlage"], antennensystems: ["antenne", "systems"], symptomtabelle: ["symptom", "tabelle"], radioschalter: ["radio", "schalter"], hauptstromversorgung: ["hauptstrom", "versorgung"], speicherspannungseingang: ["speicher", "spannungseingang"], radiosignal: ["radio", "signal"], zugefuehrt: ["zuge", "fuehrt"], systempruefung: ["system", "pruefung"], speicherspannungsversorgung: ["speicher", "spannungsversorgung"], diebstahlschutz: ["diebstahl", "schutz"], radiosicherung: ["radio", "sicherung"], verstaerkersicherung: ["verstaerker", "sicherung"], nachweislich: ["nachweis", "lich"], systemprueftabelle: ["system", "prueftabelle"], diagnoseschritte: ["diagnose", "schritte"], systemdiagnose: ["system", "diagnose"], digitalanzeige: ["digital", "anzeige"], lautsprechern: ["laut", "sprechern"], lautstaerke: ["laut", "staerke"], fortsetzung: ["fort", "setzung"], verstaerkeranschluesse: ["verstaerker", "anschluesse"], spannungspruefungen: ["spannung", "pruefungen"], antennenanlage: ["antenne", "anlage"], stromversorgungstest: ["stromversorgung", "test"], sollspannungen: ["soll", "spannungen"], geraetepruefung: ["geraete", "pruefung"], stromversorgungsleitung: ["stromversorgung", "leitung"], speicherstromversorgung: ["speicher", "stromversorgung"], radiolautsprecher: ["radio", "lautsprecher"], radioverkabelung: ["radio", "verkabelung"], lautsprecherpruefung: ["lautsprecher", "pruefung"], geraeuschdiagnose: ["geraeusch", "diagnose"], massefehlern: ["masse", "fehlern"], kurzschluessen: ["kurz", "schluessen"], diodenpruefbereich: ["dioden", "pruefbereich"], lautsprecheranschluesse: ["lautsprecher", "anschluesse"], kurzschluesse: ["kurz", "schluesse"], geraeuschsymptomdiagnose: ["geraeusch", "symptom", "diagnose"], antennenfuss: ["antenne", "fuss"], antennenkabel: ["antenne", "kabel"], antennenstecker: ["antenne", "stecker"], geraeuschsymptome: ["geraeusch", "symptome"], stoergeraeusche: ["stoer", "geraeusche"], empfangsprobleme: ["empfangs", "probleme"], lichtmaschinenstoerungen: ["lichtmaschine", "stoerungen"], abhilfemassnahme: ["abhilfe", "massnahme"], zuendungsstoerung: ["zuendung", "stoerung"], zuendkerzenkabel: ["zuendkerze", "kabel"], gegenstaenden: ["gegen", "staenden"], fahrgastraum: ["fahr", "gastraum"], separates: ["sepa", "rates"], lichtmaschinenstoerung: ["lichtmaschine", "stoerung"], passenger: ["pass", "enger"], entlastungsrelais: ["entlastung", "relais"], geblaesedrehzahlschalter: ["geblaese", "drehzahlschalter"], geblaesewiderstand: ["geblaese", "widerstand"], ueberhitzungsschutz: ["ueberhitzung", "schutz"], schneeflockensymbol: ["schneeflocke", "symbol"], umluftschalter: ["umluft", "schalter"], geblaesedrehzahlregelung: ["geblaese", "drehzahlregelung"], armaturenbrettbeleuchtung: ["armaturenbrett", "beleuchtung"], lichtschalterdetails: ["lichtschalter", "details"], sicherheitsschalter: ["sicherheit", "schalter"], leitungskennzeichnungen: ["leitung", "kennzeichnungen"], schaltpunkt: ["schalt", "punkt"], wirkungsweise: ["wirkung", "weise"], geblaesestufenschalter: ["geblaese", "stufenschalter"], sicherheitsschalters: ["sicherheit", "schalters"], steuerschalter: ["steuer", "schalter"], geblaesestufensteuerung: ["geblaese", "stufensteuerung"], weiterfuehrenden: ["weiter", "fuehrenden"], schaltungsfunktion: ["schaltung", "funktion"], fliessenden: ["fliess", "enden"], diagnosepruefungen: ["diagnose", "pruefungen"], fehlerbild: ["fehler", "bild"], geblaesestellung: ["geblaese", "stellung"], betriebsarten: ["betrieb", "arten"], umluftbetrieb: ["umluft", "betrieb"], sollspannung: ["soll", "spannung"], geblaesestufe: ["geblaese", "stufe"], frischluftbetrieb: ["frischluft", "betrieb"], fehlersuchschritte: ["fehler", "suchschritte"], geblaesemotorstecker: ["geblaesemotor", "stecker"], geblaesewiderstaenden: ["geblaese", "widerstaenden"], abzweigstelle: ["abzweig", "stelle"], karosserieelektrik: ["karosserie", "elektrik"], hupensystem: ["hupen", "system"], hupenrelais: ["hupen", "relais"], hupenschalter: ["hupen", "schalter"], aussenbetaetigungsschalter: ["aussen", "betaetigung", "schalter"], stromversorgungsverteiler: ["stromversorgung", "verteiler"], hupenbuerste: ["hupen", "buerste"], innenbeleuchtung: ["innen", "beleuchtung"], tuergriff: ["tuer", "griff"], fahrertuer: ["fahrer", "tuer"], versorgungseingang: ["versorgung", "eingang"], steuereingang: ["steuer", "eingang"], zahlenangaben: ["zahlen", "angaben"], fahrertuergriffs: ["fahrer", "tuergriffs"], handschuhfachbeleuchtung: ["handschuhfach", "beleuchtung"], handschuhfachschalter: ["handschuhfach", "schalter"], leitungscodes: ["leitung", "codes"], abzweigverbindung: ["abzweig", "verbindung"], heckscheibenheizungsschalters: ["heckscheibenheizung", "schalters"], zuendplus: ["zuend", "plus"], helligkeitsregler: ["helligkeit", "regler"], geschwindigkeitssensor: ["geschwindigkeit", "sensor"], leitungsverteilung: ["leitung", "verteilung"], kontrollleuchtenfreigabe: ["kontrollleuchte", "freigabe"], festkoerperschaltung: ["festkoerper", "schaltung"], geschwindigkeitseingang: ["geschwindigkeit", "eingang"], geschwindigkeitsausgang: ["geschwindigkeit", "ausgang"], serviceintervallprozessor: ["service", "intervall", "prozessor"], drehscheibe: ["dreh", "scheibe"], magnetisch: ["magnet", "isch"], spannungsversorgungen: ["spannung", "versorgungen"], serviceintervallprozessors: ["service", "intervall", "prozessors"], temperaturgebern: ["temperatur", "gebern"], instrumentenkombiinstrument: ["instrumenten", "kombiinstrument"], leitungsverfolgung: ["leitung", "verfolgung"], serviceintervall: ["service", "intervall"], restanzeige: ["rest", "anzeige"], spannungseingang: ["spannung", "eingang"], motorcodierstecker: ["motor", "codierst", "ecker"], fahrgeschwindigkeitsausgang: ["fahrgeschwindigkeit", "ausgang"], inspektionsanzeige: ["inspektion", "anzeige"], anzeigesteuerung: ["anzeige", "teuerung"], anzeigeinstrument: ["anzeige", "instrument"], instrumentenkombiinstruments: ["instrumenten", "kombiinstruments"], oeltemperaturanzeige: ["oeltemperatur", "anzeige"], oeltemperaturfuehler: ["oeltemperatur", "fuehler"], signalwege: ["signal", "wege"], kraftstoffverbrauchsrate: ["kraftstoff", "verbrauchsrate"], fahrzeuggeschwindigkeit: ["fahrzeug", "geschwindigkeit"], geschwindigkeitsanzeige: ["geschwindigkeit", "anzeige"], drehzahlmessersteuerung: ["drehzahlmesser", "steuerung"], bordnetz: ["bord", "netz"], speicherversorgung: ["speicher", "versorgung"], anzeigelampen: ["anzeige", "lampen"], halbleiterbauelement: ["halbleiter", "bauelement"], leiterplattenanschluesse: ["leiterplatte", "anschluesse"], instrumentenclusters: ["instrument", "clusters"], druckwarnleuchte: ["druck", "warnleuchte"], massebezeichnungen: ["massebe", "zeichnungen"], instrumentenkombi: ["instrument", "kombi"], instrumentencluster: ["instrument", "cluster"], serviceintervalls: ["service", "intervalls"], motortemperatureingang: ["motortemperatur", "eingang"], kabelspleiss: ["kabel", "spleiss"], klimaanlagenanforderung: ["klimaanlage", "anforderung"], elektronisch: ["elektro", "isch"], arbeitende: ["arbeit", "ende"], weiterleitung: ["weiter", "leitung"], zusatzlueftersteuerung: ["zusatzluefter", "steuerung"], kompressorsteuerung: ["kompressor", "steuerung"], motorkuehlung: ["motor", "kuehlung"], versorgungswege: ["versorgung", "wege"], magnetkupplung: ["magnet", "kupplung"], klimakompressors: ["klima", "kompressors"], kompressorfreigabe: ["kompressor", "freigabe"], schutzabschaltungen: ["schutz", "abschaltungen"], klimakupplung: ["klima", "kupplung"], kaeltemittel: ["kaelte", "mittel"], ueberwachungseingang: ["ueberwachung", "eingang"], kupplungsdiode: ["kupplung", "diode"], diagnosetest: ["diagnose", "test"], kaeltemitteldruck: ["kaelte", "mitteldruck"], kaeltemittelverlust: ["kaeltemittel", "verlust"], kaeltemitteldruckschalters: ["kaeltemittel", "druckschalters"], ausgangsspannung: ["ausgangs", "spannung"], kompressorbelastung: ["kompressor", "belastung"], motorkuehlmitteltemperatur: ["motor", "kuehlmitteltemperatur"], zusammenbrechende: ["zusammen", "brechende"], magnetfeld: ["magnet", "feld"], motorbelastung: ["motor", "belastung"], auszugleichen: ["auszug", "leichen"], kompressorstecker: ["kompressor", "stecker"], anschlussbedingungen: ["anschluss", "bedingungen"], widerstandssollwerte: ["widerstand", "sollwerte"], sicherungsbruecke: ["sicherung", "bruecke"], sollzustand: ["soll", "zustand"], druckschalters: ["druck", "schalters"], sollwiderstand: ["soll", "widerstand"], druckschalterpruefung: ["druckschalter", "pruefung"], bedienelemente: ["bedien", "elemente"], pruefstelle: ["pruefst", "elle"], klimabedienfeld: ["klima", "bedienfeld"], bedienschalter: ["bedien", "schalter"], relaisanordnung: ["relais", "anordnung"], stromverteilungskastens: ["stromverteilung", "kastens"], relaiskastens: ["relais", "kastens"], leiterplattenunterseite: ["leiterplatte", "unterseite"], fernlichtrelais: ["fernlicht", "relais"], niedriglichtrelais: ["niedrig", "licht", "relais"], nebelscheinwerferrelais: ["nebelscheinwerfer", "relais"], sicherungsbelegung: ["sicherung", "belegung"], sicherungsnummern: ["sicherung", "nummern"], sicherungswerten: ["sicherung", "werten"], stromkreisbezeichnung: ["stromkreis", "bezeichnung"], sicherheitsgurtwarnung: ["sicherheitsgurt", "warnung"], kraftstoffverbrauchsanzeigen: ["kraftstoff", "verbrauchsanzeigen"], leuchtweitenregulierung: ["leuchtweite", "regulierung"], zuendschluesselwarnung: ["zuendschluessel", "warnung"], seitenmarkierungs: ["seiten", "markierung"], sicherungsnummer: ["sicherung", "nummer"], ladeanlage: ["lade", "anlage"], sicherungswerte: ["sicherung", "werte"], folgeseite: ["folge", "seite"], tankentlueftungs: ["tank", "entlueftung"], zuendschalterstellungen: ["zuendschalter", "stellungen"], betriebsstellung: ["betriebs", "stellung"], verbindungspunkte: ["verbindung", "punkte"], leitungsfarbkennzeichnung: ["leitung", "farbkennzeichnung"], ladesystems: ["lade", "systems"], luefterstufe: ["luefter", "stufe"], sitzheizungsschaltern: ["sitzheizung", "schaltern"], vorhergehenden: ["vorher", "gehenden"], geblaesevorwiderstand: ["geblaese", "vorwiderstand"], sitzheizungsschalter: ["sitzheizung", "schalter"], kabelfarbkodierung: ["kabel", "farbkodierung"], fernscheinwerfer: ["fern", "scheinwerfer"], masseverteilungen: ["masse", "verteilungen"], leitungsabgaenge: ["leitung", "abgaenge"], lampenueberwachung: ["lampen", "ueberwachung"], steckverbinderbezeichnungen: ["steckverbinder", "bezeichnungen"], schaltkontakte: ["schalt", "kontakte"], relaisspulen: ["relais", "spulen"], doppelscheinwerfer: ["doppel", "scheinwerfer"], anschlussstiften: ["anschluss", "stiften"], verbindungspunkt: ["verbindung", "punkt"], leitungsfarbcode: ["leitung", "farbcode"], kabelfarbcodes: ["kabel", "farbcodes"], kabelverzweigungen: ["kabel", "verzweigungen"], detailseiten: ["detail", "seiten"], aktivitaetspruefung: ["aktivitaet", "pruefung"], bremslichtschalters: ["bremslicht", "schalters"], tempomatschalter: ["tempomat", "schalter"], wischersteuergeraet: ["wischer", "steuergeraet"], kabelverzweigung: ["kabel", "verzweigung"], einspeisebedingungen: ["einspeise", "bedingungen"], zubehoerstellung: ["zubehoer", "stellung"], fahrstellung: ["fahr", "stellung"], anlassstellung: ["anlass", "stellung"], kabelfarbcode: ["kabel", "farbcode"], stromverteilungsbereich: ["stromverteilung", "bereich"], rueckfahrleuchtenschalter: ["rueckfahrleuchte", "schalter"], stromlaufdiagramm: ["stromlauf", "diagramm"], leitungsaufteilung: ["leitung", "aufteilung"], geblaesestufenregelung: ["geblaese", "stufenregelung"], warmwasserabsperrung: ["warmwasser", "absperrung"], kabelfarbkennzeichnungen: ["kabel", "farbkennzeichnungen"], kabelfarbkennzeichnung: ["kabel", "farbkennzeichnung"], verteilerpunkt: ["verteiler", "punkt"], warntonmodul: ["warnton", "modul"], aufladbarer: ["auflad", "barer"], zusatzstecker: ["zusatz", "stecker"], leitungsverteiler: ["leitung", "verteiler"], detaildarstellungen: ["detail", "darstellungen"], komfortfunktionen: ["komfort", "funktionen"], zeitrelais: ["zeit", "relais"], kabelverbindung: ["kabel", "verbindung"], massekreis: ["masse", "kreis"], masseleitungen: ["masse", "leitungen"], masseverteilungsplans: ["masse", "verteilungsplan"], beleuchtungseinrichtungen: ["beleuchtung", "einrichtungen"], waschwasserstandsschalters: ["waschwasser", "stands", "schalters"], masseverteilern: ["masse", "verteilern"], masseverteiler: ["masse", "verteiler"], nebelleuchte: ["nebel", "leuchte"], verbindungsbezeichnungen: ["verbindung", "bezeichnungen"], zahlreiche: ["zahl", "reiche"], normalgeschwindigkeitsrelais: ["normalgeschwindigkeit", "relais"], ladetaschenlampe: ["lade", "taschenlampe"], umluftklappenrelais: ["umluft", "klappe", "relais"], sitzkomponenten: ["sitz", "komponenten"], vordersitzheizung: ["vordersitz", "heizung"], vordersitze: ["vorder", "sitze"], zusammengefuehrt: ["zusammen", "gefuehrt"], vordersitz: ["vorder", "sitz"], bordnetzes: ["bord", "netzes"], kabelverbindungen: ["kabel", "verbindungen"], fahrerseite: ["fahrer", "seite"], spiegelheizung: ["spiegel", "heizung"], sperrschalter: ["sperr", "schalter"], leselampe: ["lese", "lampe"], kofferraumdeckelschloss: ["kofferraumdeckel", "schloss"], beifahrerseite: ["beifahrer", "seite"], schlossmotor: ["schloss", "motor"], innenraumleuchte: ["innenraum", "leuchte"], kennzeichenleuchteneinheit: ["kennzeichenleuchte", "einheit"], leuchteneinheit: ["leuchte", "einheit"], rueckenlehne: ["ruecke", "lehne"], konsolenschalter: ["konsolen", "schalter"], halbleiterregler: ["halbleiter", "regler"], stromverteilungen: ["strom", "verteilungen"], erregerstromkreise: ["erreger", "stromkreise"], kabelquerschnitten: ["kabel", "querschnitten"], lambdasondenanzeige: ["lambdasonde", "anzeige"], spannungsueberwachung: ["spannung", "ueberwachung"], erregerstrom: ["erreger", "strom"], zuendschaltersystems: ["zuendschalter", "systems"], schaltstellung: ["schalt", "stellung"], anlassermagnetschalter: ["anlasser", "magnetschalter"], steuerleitungen: ["steuer", "leitungen"], startkreis: ["start", "kreis"], anlassermotor: ["anlasser", "motor"], massegeschaltet: ["masse", "geschaltet"], zuendstellungen: ["zuend", "stellungen"], fahrerairbags: ["fahrer", "airbags"], kontrollleuchtenansteuerung: ["kontrollleuchte", "ansteuerung"], aufprallsensoren: ["aufprall", "sensoren"], kontaktspirale: ["kontakt", "spirale"], kurzschlussbruecken: ["kurzschluss", "bruecken"], diagnosekreise: ["diagnose", "kreise"], leitungsverbinder: ["leitung", "verbinder"], freigabeeingang: ["freigabe", "eingang"], kontrollleuchtenausgang: ["kontrollleuchte", "ausgang"], aufprallstaerke: ["aufprall", "staerke"], kurzschlussbruecke: ["kurzschluss", "bruecke"], kontaktspiralen: ["kontakt", "spiralen"], generatorleitungen: ["generator", "leitungen"], airbagsystem: ["airbag", "system"], leitungswiderstands: ["leitung", "widerstands"], zuenderwiderstands: ["zuender", "widerstands"], bremsbelagverschleissanzeige: ["bremsbelag", "verschleiss", "anzeige"], feststellbremsschalter: ["fest", "tell", "bremsschalter"], verschleisssensoren: ["verschleiss", "sensoren"], ladeanzeige: ["lade", "anzeige"], lampentest: ["lampe", "test"], schaltlogik: ["schalt", "logik"], sensoreingang: ["sensor", "eingang"], bremsbelagverschleisssensors: ["bremsbelag", "verschleiss", "sensors"], leitungsverbindung: ["leitung", "verbindung"], steckstellen: ["steck", "stellen"], leitungsquerschnittsangaben: ["leitungsquerschnitt", "angaben"], batterieanschlussblock: ["batterie", "anschlussblock"], niedergetretenem: ["nieder", "getretenem"], spannungsueberwachungseingang: ["spannung", "ueberwachung", "eingang"], bremsbetaetigungseingang: ["bremsbetaetigung", "eingang"], warnleuchtensteuerung: ["warnleuchte", "steuerung"], pumpenrelais: ["pumpen", "relais"], magnetventile: ["magnet", "ventile"], hydraulikeinheit: ["hydraulik", "einheit"], pumpenmotor: ["pumpe", "motor"], raddrehzahlsensoren: ["raddrehzahl", "sensoren"], impulsraeder: ["impuls", "raeder"], fortsetzungen: ["fort", "setzungen"], ventilrelais: ["ventil", "relais"], raddrehzahlsensor: ["raddrehzahl", "sensor"], hydrauliksystem: ["hydraulik", "system"], seitenwahlschalter: ["seitenwahl", "schalter"], kupplungsmagnete: ["kupplung", "magnete"], beifahrerspiegel: ["beifahrer", "spiegel"], richtungswahlschalter: ["richtung", "wahlschalter"], kupplungsmagnet: ["kupplung", "magnet"], kupplungsmagneten: ["kupplung", "magneten"], zentralverriegelungssteuergeraet: ["zentralverriegelung", "steuergeraet"], schlossanforderungs: ["schloss", "anforderung"], entriegelungseingaenge: ["entriegelung", "eingaenge"], vordertuerschlossmotoren: ["vordertuer", "schloss", "motoren"], schliessanforderung: ["schliess", "anforderung"], entriegelungsanforderung: ["entriegelung", "anforderung"], sicherheitsrastentaster: ["sicherheit", "rasten", "taster"], vordertuerschloss: ["vordertuer", "schloss"], seitenbereich: ["seiten", "bereich"], funktionsbeschreibung: ["funktion", "beschreibung"], traegheitsschalter: ["traegheit", "schalter"], tankklappen: ["tank", "klappen"], klemmenstellung: ["klemmen", "stellung"], entriegelungsanforderungseingang: ["entriegelung", "anforderung", "eingang"], verriegelungsanforderungseingang: ["verriegelung", "anforderung", "eingang"], verriegelungsstange: ["verriegelung", "stange"], verteilerstellen: ["verteil", "erstellen"], fensterschalter: ["fenster", "schalter"], fahrerfenster: ["fahrer", "fenster"], kabelfarbencode: ["kabelfarbe", "code"], sitzflaeche: ["sitz", "flaeche"], abzweigstellen: ["abzweig", "stellen"], lehnenheizung: ["lehnen", "heizung"], sitzflaechenheizung: ["sitzflaeche", "heizung"], rastende: ["rast", "ende"], fahrbewegung: ["fahr", "bewegung"], leitungsbezeichnungen: ["leitung", "bezeichnungen"], gurtwarnanlage: ["gurt", "warnanlage"], fahrertuerkontaktschalter: ["fahrertuer", "kontaktschalter"], gurtschalter: ["gurt", "schalter"], separate: ["sepa", "rate"], anlassbetrieb: ["anlass", "betrieb"], summermodul: ["summer", "modul"], fahrergurt: ["fahrer", "gurt"], spannungsversorgungseingang: ["spannungsversorgung", "eingang"], zeitschaltung: ["zeit", "schaltung"], zeitschaltfreigabesignal: ["zeit", "schalt", "freigabesignal"], stromkreisgruppe: ["stromkreis", "gruppe"], wischerintervall: ["wischer", "intervall"], wischstufe: ["wisch", "stufe"], parkstellung: ["park", "stellung"], scheibenwaschfunktion: ["scheiben", "waschfunktion"], langsame: ["lang", "same"], waschschalter: ["wasch", "schalter"], wischintervall: ["wisch", "intervall"], waschpumpe: ["wasch", "pumpe"], parallelschaltung: ["parallel", "schaltung"], waschduesenheizung: ["waschduese", "heizung"], waschduesenheizungen: ["waschduese", "heizungen"], aschenbecherbeleuchtung: ["aschenbecher", "beleuchtung"], armaturenbrettblende: ["armaturenbrett", "blende"], scheinwerferlicht: ["scheinwerfer", "licht"], verteilerstelle: ["verteil", "erstelle"], ablagefachbeleuchtungen: ["ablagefach", "beleuchtungen"], beleuchtungsdetails: ["beleuchtung", "details"], nebelscheinwerfern: ["nebel", "scheinwerfern"], lichtschaltern: ["licht", "schaltern"], beleuchtungssystem: ["beleuchtung", "system"], kombinations: ["kombi", "nation"], fernlichtschalter: ["fernlicht", "schalter"], lenksaeulenmasse: ["lenksaeule", "masse"], querschnittskennzeichnungen: ["querschnitts", "kennzeichnungen"], instrumentenkombis: ["instrument", "kombis"], lampenausfallueberwachung: ["lampen", "ausfall", "ueberwachung"], scheinwerferlampen: ["scheinwerfer", "lampen"], fernlichtkontrollleuchte: ["fernlicht", "kontrollleuchte"], pruefsteuergeraet: ["pruefst", "euer", "geraet"], fernlichtscheinwerfer: ["fernlicht", "scheinwerfer"], fahrtrichtungsanzeigern: ["fahrtrichtung", "anzeiger"], dauerversorgung: ["dauer", "versorgung"], schalteranschluesse: ["schalter", "anschluesse"], stromverteil: ["strom", "verteil"], blinkerschalter: ["blinker", "schalter"], blinkerkontrollleuchten: ["blinker", "kontrollleuchten"], kabelspleisse: ["kabel", "spleisse"], leitungsidentifikation: ["leitung", "identifikation"], blinkerkontrollleuchte: ["blinker", "kontrollleuchte"], parkleuchte: ["park", "leuchte"], leuchteneinheiten: ["leuchten", "einheiten"], parklicht: ["park", "licht"], schlussleuchteneinheit: ["schlussleuchte", "einheit"], begrenzungsleuchten: ["begrenzung", "leuchten"], kofferraumlichtschalter: ["kofferraum", "lichtschalter"], kofferraumleuchten: ["kofferraum", "leuchten"], parklichtkreis: ["parklicht", "kreis"], begrenzungsleuchte: ["begrenzung", "leuchte"], leitungsfarbe: ["leitung", "farbe"], beifahrertuer: ["beifahrer", "tuer"], dachleuchte: ["dach", "leuchte"], innenlicht: ["innen", "licht"], zeitverzoegerung: ["zeit", "verzoegerung"], zeitgeberfreigabe: ["zeitgeber", "freigabe"], dauerzustand: ["dauer", "zustand"], fahrertuergriffbetaetigung: ["fahrer", "tuergriff", "betaetigung"], zeitgeber: ["zeit", "geber"], zeitgesteuert: ["zeit", "gesteuert"], dauerlicht: ["dauer", "licht"], lichtsteuerung: ["lichts", "teuerung"], verteilerpunkte: ["verteiler", "punkte"], bedienhandlungen: ["bedien", "handlungen"], umluftfunktion: ["umluft", "funktion"], zusatzkuehlgeblaese: ["zusatz", "kuehlgeblaese"], gesamtpruefung: ["gesamt", "pruefung"], schieber: ["schi", "eber"], geblaesedrehzahlregler: ["geblaese", "drehzahlregler"], drucktaste: ["druck", "taste"], geblaesedrehzahl: ["geblaese", "drehzahl"], hoechstdrehzahl: ["hoechst", "drehzahl"], umlufttaste: ["umluft", "taste"], aussenluft: ["aussen", "luft"], vierteldrehung: ["viertel", "drehung"], klappenstellmotoren: ["klappen", "stellmotoren"], heisswasserregelung: ["heisswasser", "regelung"], stromlauf: ["strom", "lauf"], kuehlmitteldurchfluss: ["kuehlmittel", "durchfluss"], heisswasser: ["heiss", "wasser"], wasserzufluss: ["wasser", "zufluss"], zwischensicherung: ["zwischen", "sicherung"], heizungszulauf: ["heizung", "zulauf"], sicherungsfehlern: ["sicherung", "fehlern"], kuehlmittelfluss: ["kuehl", "mittelfluss"], klimasystem: ["klima", "system"], kuehlleistung: ["kuehl", "leistung"], fehlerkreis: ["fehler", "kreis"], mittelstellung: ["mittel", "stellung"], zusammengesteckt: ["zusammen", "gesteckt"], leitungspruefungen: ["leitung", "pruefungen"], steckerklemmen: ["stecker", "klemmen"], bedienungsschaltern: ["bedienung", "schaltern"], gesteckt: ["gest", "eckt"], umluftsteuerung: ["umluft", "teuerung"], umluftklappen: ["umluft", "klappen"], querschnittsangaben: ["querschnitt", "angaben"], luftverteilung: ["luft", "verteilung"], vorangestellte: ["voran", "gestellte"], klappenstellmotor: ["klappen", "stellmotor"], luftverteilerkasten: ["luftverteiler", "kasten"], leitungsabzweig: ["leitung", "abzweig"], umluftklappensteuerung: ["umluft", "klappensteuerung"], arbeitenden: ["arbeit", "enden"], klappenmotoren: ["klappen", "motoren"], spannungstests: ["spannung", "tests"], luftverteilungssteuerung: ["luftverteilung", "steuerung"], arbeitskontakte: ["arbeit", "kontakte"], normalerweise: ["normal", "erweise"], ruhekontakte: ["ruhe", "kontakte"], entgegengesetzter: ["entgegen", "gesetzter"], gegenrichtung: ["gegen", "richtung"], verstellwegs: ["verstell", "wegs"], luftrelais: ["luft", "relais"], klappenmotor: ["klapp", "motor"], normally: ["norm", "ally"], anschlussleitung: ["anschluss", "leitung"], zuendplusversorgung: ["zuend", "plus", "versorgung"], zweistufige: ["zwei", "stufige"], lueftervorwiderstand: ["luefter", "vorwiderstand"], zusatzlueftermotor: ["zusatzluefter", "motor"], stromversorgungsverteilungskasten: ["stromversorgung", "verteilung", "kasten"], zweistufiger: ["zwei", "stufiger"], klimaanforderung: ["klima", "anforderung"], stromversorgungsverteilerkasten: ["stromversorgung", "verteilerkasten"], dauerplusversorgung: ["dauer", "plus", "versorgung"], antenneneingang: ["antenne", "eingang"], lautsprecherausgaenge: ["lautsprecher", "ausgaenge"], gehaeusemasse: ["gehaeuse", "masse"], sicherungseinzelheiten: ["sicherung", "einzelheiten"], anschlusspunkte: ["anschluss", "punkte"], verstaerkeranschluessen: ["verstaerker", "anschluessen"], dauerstromversorgung: ["dauerstrom", "versorgung"], leistungsverstaerkers: ["leistung", "verstaerkers"], frontlautsprechern: ["front", "lautsprechern"], hecklautsprechern: ["heck", "lautsprechern"], frontlautsprecher: ["front", "lautsprecher"], hecklautsprecher: ["heck", "lautsprecher"], halbleiterverstaerker: ["halbleiter", "verstaerker"], stellglieds: ["stell", "glieds"], kupplungssolenoid: ["kupplung", "solenoid"], rueckmeldepotentiometer: ["rueckmelde", "potentiometer"], steckerbezeichnungen: ["stecker", "bezeichnungen"], wiederaufnahme: ["wiede", "rauf", "ahme"], wiederaufnehmen: ["wiede", "rauf", "nehmen"], einstellgeschwindigkeit: ["eins", "tell", "geschwindigkeit"], steuermasse: ["steuer", "masse"], rueckmeldereferenz: ["rueckmelde", "referenz"], rueckmeldeeingang: ["rueckmelde", "eingang"], kupplungssteuerung: ["kupplung", "steuerung"], stellmotorsteuerung: ["stellmotor", "steuerung"], steuereingaenge: ["steuer", "eingaenge"], kupplungsschalters: ["kupplung", "schalters"], ausgangsriemen: ["ausgang", "riemen"], feedback: ["feed", "back"], beleuchtungsleitungen: ["beleuchtung", "leitungen"], tankanzeige: ["tanka", "zeige"], ausgangssignalen: ["ausgangs", "signalen"], bordcomputermoduls: ["bordcomputer", "moduls"], tankfuellstand: ["tank", "fuellstand"], kraftstoffverbrauchssignal: ["kraftstoffverbrauch", "signal"], kraftstoffwarnung: ["kraftstoff", "warnung"], kraftstoffwarnleuchte: ["kraftstoff", "warnleuchte"], halbleiterausgang: ["halbleiter", "ausgang"], steckbezeichnungen: ["steck", "bezeichnungen"], restliche: ["rest", "lich"], gongmoduls: ["gong", "moduls"], halbleitergong: ["halbleiter", "gong"], anzeigeinstrumente: ["anzeige", "instrumente"], steckernummern: ["stecker", "nummern"], zentralverriegelungssystem: ["zentralverriegelung", "system"], doppelverriegelung: ["doppel", "verriegelung"], entriegelungssperre: ["entriegelung", "sperre"], reparaturmassnahme: ["reparatur", "massnahme"], systembauteils: ["system", "bauteils"], tuerschlossmotors: ["tuerschloss", "motors"], waagerecht: ["waage", "recht"], doppelverriegelt: ["doppel", "verriegelt"], sicherungsknoepfe: ["sicherung", "knoepfe"], hochgezogen: ["hoch", "gezogen"], sicherungsknopf: ["sicherung", "knopf"], tuerverriegelung: ["tuer", "verriegelung"], entriegelungsschalter: ["entriegelung", "schalter"], tuermikroschalter: ["tuer", "mikroschalter"], beifahrertuerschloss: ["beifahrer", "tuerschloss"], einsteigen: ["einst", "eigen"], fahrertuerschloss: ["fahrertuer", "schloss"], verriegelungsknoepfe: ["verriegelung", "knoepfe"], versorgungsspannungen: ["versorgung", "spannungen"], verriegelungsfunktion: ["verriegelung", "funktion"], schliesszylinderschalter: ["schliesszylinder", "schalter"], einstecken: ["einst", "ecken"], kofferraumschlossmotors: ["kofferraumschloss", "motors"], kofferraumschlossmotor: ["kofferraumschloss", "motor"], kofferraumschalter: ["kofferraum", "schalter"], kofferraumschalters: ["kofferraum", "schalters"], tankklappe: ["tank", "klappe"], tankklappenverriegelungsmotors: ["tankklappe", "verriegelung", "motors"], steuergeraeteverriegelung: ["steuergeraete", "verriegelung"], sollreaktion: ["soll", "reaktion"], tankklappenverriegelungsmotor: ["tankklappe", "verriegelung", "motor"], verriegelungstest: ["verriegelung", "test"], entriegelungstest: ["entriegelung", "test"], kofferraumverriegelung: ["kofferraum", "verriegelung"], stromkreisbeschreibung: ["stromkreis", "beschreibung"], zentralverriegelungsanlage: ["zentralverriegelung", "anlage"], schliessschalter: ["schliess", "schalter"], verriegelungsrelais: ["verriegelung", "relais"], verriegelungsmotor: ["verriegelung", "motor"], entriegelungsrelais: ["entriegelung", "relais"], sperrstange: ["sperr", "stange"], entriegelungssperrenmotoren: ["entriegelung", "sperren", "motoren"], schlosseinheiten: ["schloss", "einheiten"], entriegelungssperrenrelais: ["entriegelung", "sperre", "relais"], entriegelungssperrmechanismen: ["entriegelung", "sperrmechanismen"], entriegelungssperrenmotor: ["entriegelung", "sperr", "motor"], tuerschloss: ["tuer", "schloss"], arbeitsgruppen: ["arbeit", "gruppen"], seitenschlags: ["seiten", "schlags"], antriebsscheibe: ["antrieb", "scheibe"], geberzylinder: ["geber", "zylinder"], nehmerzylinder: ["nehmer", "zylinder"], kupplungsgehaeuse: ["kupplung", "gehaeuse"], kupplungsscheibe: ["kupplung", "scheibe"], seitenschlag: ["seiten", "schlag"], kupplungsausruecklager: ["kupplung", "saus", "ruecklager"], kupplungsgeberzylinder: ["kupplung", "geberzylinder"], kupplungsnehmerzylinder: ["kupplung", "nehmer", "zylinder"], kupplungsbetaetigung: ["kupplung", "betaetigung"], kupplungsgehaeuses: ["kupplung", "gehaeuses"], hervorgehoben: ["hervor", "gehoben"], montagebedingungen: ["montage", "bedingungen"], schwimmerbehaelter: ["schwimmer", "behaelter"], entlueftungsgeraet: ["entlueftung", "geraet"], blasenfrei: ["blas", "frei"], wiederholung: ["wied", "erholung"], entlueftungsvorgangs: ["entlueftung", "vorgangs"], freigeben: ["frei", "geben"], verbliebene: ["verb", "lieben"], zurueckgedrueckt: ["zurueck", "gedrueckt"], gewaehrleistet: ["gewaehr", "leistet"], kupplungsgeber: ["kupplung", "geber"], kupplungsdruckplatte: ["kupplung", "druckplatte"], torsionsdaempfer: ["torsion", "daempfer"], kupplungsbelaege: ["kupplung", "belaege"], nehmerzylinders: ["nehmer", "zylinders"], federelemente: ["feder", "elemente"], torsionsdaempfers: ["torsion", "daempfers"], zweimassenschwungrad: ["zwei", "massen", "schwungrad"], tellerfederzungen: ["teller", "federzungen"], tangentialblattfedern: ["tangential", "blattfedern"], tellerfedern: ["teller", "federn"], blattfedern: ["blatt", "federn"], druckring: ["druck", "ring"], freikommen: ["frei", "kommen"], rillenkugellager: ["rillen", "kugellager"], leichtgaengigkeit: ["leicht", "gaengigkeit"], kupplungsbelag: ["kupplung", "belag"], tellerfeder: ["teller", "feder"], kupplungsnieten: ["kupplung", "nieten"], passstiften: ["pass", "stiften"], schnittbild: ["schnitt", "bild"], druckplatte: ["druck", "platte"], verbrannte: ["verb", "rannte"], sichtpruefen: ["sicht", "pruefen"], druckkontaktflaeche: ["druckkontakt", "flaeche"], passstifte: ["pass", "stifte"], fuehrungsstifte: ["fuehrung", "stifte"], getriebeeingangswelle: ["getriebe", "eingangswelle"], kupplungsaufbau: ["kupplung", "aufbau"], mitnehmerscheibe: ["mitnehmer", "scheibe"], austauschgetriebe: ["austausch", "getriebe"], kunststoffhammer: ["kunststoff", "hammer"], einspannen: ["eins", "pannen"], schmirgelleinen: ["schmirgel", "leinen"], aussenrand: ["aussen", "rand"], auflagepunkte: ["auflage", "punkte"], nichtbeachtung: ["nicht", "beachtung"], festfressen: ["fest", "fressen"], kupplungsgeberzylinders: ["kupplung", "geberzylinders"], kupplungsnehmerzylinders: ["kupplung", "nehmer", "zylinders"], bremsfluessigkeitsstands: ["bremsfluessigkeit", "stands"], fuellleitung: ["fuell", "leitung"], kolbenstange: ["kolben", "stange"], fuehrungsnase: ["fuehrung", "nase"], pedalsockel: ["pedal", "sockel"], bildmarkierungen: ["bild", "markierungen"], kupplungshauptzylinder: ["kupplung", "hauptzylinder"], kupplungshauptzylinders: ["kupplung", "hauptzylinders"], austauschhinweise: ["austausch", "hinweise"], zusammensetzung: ["zusammen", "setzung"], reparatursaetze: ["reparatur", "saetze"], schnittdarstellungen: ["schnitt", "darstellungen"], zylinderbohrung: ["zylinder", "bohrung"], hauptzylinder: ["haupt", "zylinder"], innenteile: ["innen", "teile"], reparatursatz: ["reparatur", "satz"], kolbenbaugruppe: ["kolben", "baugruppe"], dichtstopfen: ["dicht", "topfen"], zahnscheibe: ["zahn", "scheibe"], rutschende: ["rutsch", "ende"], kupplungsgeraeusche: ["kupplung", "geraeusche"], sternvermerk: ["stern", "vermerk"], kupplungsanpressdruck: ["kupplung", "anpressdruck"], kurbelwellendichtring: ["kurbelwelle", "dichtring"], druckplattenfeder: ["druck", "plattenfeder"], getriebeaufhaengung: ["getriebe", "aufhaengung"], zentrierflaechen: ["zentrier", "flaechen"], festgerostet: ["fest", "gerostet"], festgeklemmt: ["fest", "geklemmt"], kupplungssystem: ["kupplung", "system"], belagflaechen: ["belag", "flaechen"], kupplungsniete: ["kupplung", "niete"], kupplungsgeraeusch: ["kupplung", "geraeusch"], overdrive: ["over", "drive"], baugruppenuebersicht: ["baugruppen", "uebersicht"], schaltmechanismus: ["schalt", "mechanismus"], getriebegehaeuseteil: ["getriebe", "gehaeuseteil"], abtriebsflansch: ["abtrieb", "flansch"], schaltwelle: ["schalt", "welle"], eingangswelle: ["eingang", "welle"], eingangswellen: ["eingang", "wellen"], ausgangswelle: ["ausgang", "welle"], getriebewellen: ["getriebe", "wellen"], getriebewellenlager: ["getriebe", "wellenlager"], schnellgang: ["schnell", "gang"], werkstattverfahren: ["werkstatt", "verfahren"], uebersichtszeichnungen: ["uebersicht", "zeichnungen"], getriebekomponenten: ["getriebe", "komponenten"], vorderteil: ["vorder", "teil"], abtriebswellenbaugruppe: ["abtrieb", "wellen", "baugruppe"], abtriebswelle: ["abtrieb", "welle"], inhaltsverzeichnisseite: ["inhaltsverzeichnis", "seite"], schongang: ["schon", "gang"], werkstatthandbuchseiten: ["werkstatt", "handbuchseiten"], schaltbetaetigung: ["schalt", "betaetigung"], schaltarme: ["schalt", "arme"], ausgangswellen: ["ausgang", "wellen"], getriebewelle: ["getriebe", "welle"], aufbauzeichnung: ["aufbau", "zeichnung"], zusammenbauzeichnung: ["zusammenbau", "zeichnung"], vorgelegewelle: ["vorgelege", "welle"], vorwaertsgaenge: ["vorwaerts", "gaenge"], rueckwaertsgangs: ["rueckwaerts", "gangs"], hinweislinien: ["hinweis", "linien"], gangstufen: ["gang", "stufen"], getriebeaufbau: ["getriebe", "aufbau"], montagezeichnung: ["montage", "zeichnung"], schaltteile: ["schalt", "teile"], schaltstangen: ["schalt", "tangen"], schaltgabeln: ["schalt", "gabeln"], klauenkupplung: ["klauen", "kupplung"], sperrstift: ["sperr", "stift"], schaltstange: ["schalt", "stange"], schaltgabel: ["schalt", "gabel"], laengsschnitt: ["laengs", "schnitt"], hitzeschutzblechs: ["hitzeschutz", "blechs"], mittellager: ["mittel", "lager"], hardyscheibe: ["hardy", "scheibe"], schaltkonsole: ["schalt", "konsole"], gewindering: ["gewinde", "ring"], zentrierzapfen: ["zentrier", "zapfen"], schaltgeraeusche: ["schalt", "geraeusche"], rueckwaertsgangschalter: ["rueckwaerts", "gangschalter"], lagerbolzen: ["lager", "bolzen"], getriebegehaeuseteils: ["getriebe", "gehaeuseteils"], getriebeoels: ["getriebe", "oels"], gehaeusevorderteils: ["gehaeuse", "vorderteils"], schraubenlaenge: ["schraube", "laenge"], rollenlagers: ["rollen", "lagers"], zylinderstifte: ["zylinder", "stifte"], sicherungsstift: ["sicherung", "stift"], rollenlager: ["rolle", "lager"], kleineren: ["klei", "eren"], rueckwaertsgangwelle: ["rueckwaertsgang", "welle"], zylinderstift: ["zylinder", "stift"], distanzring: ["distanz", "ring"], distanzringdicke: ["distanzring", "dicke"], schmierstoffe: ["schmier", "stoffe"], axialspiels: ["axial", "spiels"], gehaeusevorderteil: ["gehaeuse", "vorderteil"], lagerring: ["lager", "ring"], festgehen: ["fest", "gehen"], distanzrings: ["distanz", "rings"], ueberstand: ["uebers", "tand"], innenflaeche: ["innen", "flaeche"], aussenflaeche: ["aussen", "flaeche"], abtriebsflansches: ["abtriebs", "flansches"], dichtringe: ["dicht", "ringe"], sonderwerkzeugnummern: ["sonderwerkzeug", "nummern"], positionshinweise: ["position", "hinweise"], sicherungshuelse: ["sicherung", "huelse"], mittellagerung: ["mittel", "lagerung"], bundmutter: ["bund", "mutter"], schraubensicherungsmittel: ["schrauben", "sicherungsmittel"], drehmomenttabelle: ["drehmoment", "tabelle"], rueckwaertsgangrad: ["rueckwaerts", "gangrad"], abschlussplatte: ["abschluss", "platte"], sicherungsstifts: ["sicherung", "stifts"], herausgezogen: ["heraus", "gezogen"], demontagefotos: ["demontage", "fotos"], gehaeuseteils: ["gehaeuse", "teils"], schaltstifte: ["schalt", "stifte"], sperrelemente: ["sperr", "elemente"], material: ["mate", "rial"], arbeitsschritts: ["arbeit", "schritts"], sperrkugeln: ["sperr", "kugeln"], sperrhebel: ["sperr", "hebel"], montageanleitung: ["montage", "anleitung"], sicherungsstifte: ["sicherung", "stifte"], montageschritte: ["montage", "schritte"], innenring: ["inne", "ring"], rillenkugellagers: ["rillen", "kugellagers"], neutralstellung: ["neutral", "stellung"], sperrkugel: ["sperr", "kugel"], rastkugel: ["rast", "kugel"], rastkugeln: ["rast", "kugeln"], rueckwaertsgangbereich: ["rueckwaerts", "gangbereich"], dichtlippen: ["dicht", "lippen"], gehaeusebereich: ["gehaeuse", "bereich"], getriebeabtriebsseite: ["getriebe", "abtrieb", "seite"], fotosequenzen: ["foto", "sequenzen"], sicherungsblechs: ["sicherung", "blechs"], zahnraeder: ["zahn", "raeder"], synchronringe: ["synchron", "ringe"], distanzhuelse: ["distanz", "huelse"], schaltmuffe: ["schalt", "muffe"], synchronring: ["synchron", "ring"], gangzahnrad: ["gang", "zahnrad"], getriebeausgangswelle: ["getriebe", "ausgangswelle"], abtriebswellenende: ["abtriebs", "wellenende"], synchronrings: ["synchron", "rings"], rueckwaertsgangrads: ["rueckwaerts", "gangrad"], zahnraedern: ["zahn", "raedern"], synchronringen: ["synchron", "ringen"], schaltmuffen: ["schalt", "muffen"], fuehrungsmuffe: ["fuehrung", "muffe"], synchronringnasen: ["synchronring", "nasen"], spielfest: ["spiel", "fest"], nickelbeschichteten: ["nickel", "beschichteten"], heissluftgeblaese: ["heissluft", "geblaese"], laengsschnitte: ["laengs", "schnitte"], einfuehrungsdatum: ["einfuehrung", "datum"], schaltsteine: ["schalt", "steine"], schulterende: ["schulter", "ende"], schaltstein: ["schalt", "stein"], zahnradsatz: ["zahn", "radsatz"], teilelegende: ["teile", "legende"], getriebezahnraeder: ["getriebe", "zahnraeder"], sicherungselemente: ["sicherung", "elemente"], schaltklaue: ["schalt", "klaue"], schiebemuffe: ["schiebe", "muffe"], tachometerantriebsrad: ["tachometer", "antriebsrad"], vorgelegeflansch: ["vorgelege", "flansch"], eingangswellenlagers: ["eingangs", "wellenlagers"], federvorspannung: ["feder", "vorspannung"], kupplungsende: ["kupplung", "sende"], schaltfingers: ["schalt", "fingers"], innensechskantschraube: ["innensechskant", "schraube"], schaltfinger: ["schalt", "finger"], getriebemechanismus: ["getriebe", "mechanismus"], lagerhalter: ["lager", "halter"], sperrhebels: ["sperr", "hebels"], druckstifts: ["druck", "stifts"], ausgleichsscheibendicke: ["ausgleichsscheibe", "dicke"], druckstift: ["druck", "stift"], distanzscheibe: ["distanz", "scheibe"], verdrehsicherungssteg: ["verdreh", "sicherung", "steg"], distanzscheiben: ["distanz", "scheiben"], rollenlagern: ["rollen", "lagern"], zahnradsatzes: ["zahnrad", "satzes"], ausgleichsscheibenstaerken: ["ausgleichsscheibe", "staerken"], nochmals: ["noch", "mals"], axialspiele: ["axial", "spiele"], druckstuecken: ["drucks", "tuecken"], molybdaenbeschichtete: ["molybdaen", "beschichtete"], kupplungskoerper: ["kupplung", "koerper"], gleichzeitigem: ["gleich", "zeitigem"], zusammengedrueckt: ["zusammen", "gedrueckt"], druckstueck: ["druck", "stueck"], druckstuecke: ["drucks", "tuecke"], blattfeder: ["blatt", "feder"], anschlagstift: ["anschlag", "stift"], schaltmechanik: ["schalt", "mechanik"], getriebegehaeusevorderteil: ["getriebegehaeuse", "vorderteil"], zylinderstiften: ["zylinder", "stiften"], zuruecktreiben: ["zurueck", "treiben"], heraustreiben: ["heraus", "treiben"], lagerinnenrings: ["lager", "innenring"], aussenring: ["aussen", "ring"], lageraussenring: ["lager", "aussenring"], lagerinnenring: ["lager", "innenring"], hammerschlaegen: ["hammer", "schlaegen"], hammerschlaege: ["hammer", "schlaege"], distanzscheibenstaerke: ["distanzscheibe", "staerke"], schmierstoff: ["schmier", "stoff"], lagerstellen: ["lager", "stellen"], werkzeuganordnung: ["werkzeug", "anordnung"], federteile: ["feder", "teile"], anschlagstifte: ["anschlag", "stifte"], rueckwaertsgangfeder: ["rueckwaertsgang", "feder"], federkraft: ["feder", "kraft"], seegerringzange: ["seegerring", "zange"], schaftverriegelungen: ["schaft", "verriegelungen"], zurueckbewegen: ["zurueck", "bewegen"], herausschwenken: ["heraus", "schwenken"], herausnehmens: ["heraus", "nehmens"], getriebewellengruppe: ["getriebe", "wellengruppe"], schraubensitz: ["schraube", "sitz"], montageabbildungen: ["montage", "abbildungen"], sperrstifte: ["sperr", "stifte"], bolzensicherung: ["bolzen", "sicherung"], sicherungsmittel: ["sicherung", "mittel"], ersatzteilprogramm: ["ersatzteil", "programm"], sinterstahl: ["sinter", "stahl"], schiebehuelsen: ["schiebe", "huelsen"], schiebehuelse: ["schiebe", "huelse"], gangradbaugruppen: ["gangrad", "baugruppen"], fuehrungsnuten: ["fuehrung", "nuten"], ersatzteilen: ["ersatz", "teilen"], montageschritten: ["montage", "schritten"], schiebemuffen: ["schiebe", "muffen"], sicherungsringen: ["sicherung", "ringen"], einbauschritte: ["einbau", "schritte"], spielfrei: ["spiel", "frei"], teileverkauf: ["teile", "verkauf"], getriebesatz: ["getriebe", "satz"], fuehrungsbuchse: ["fuehrung", "buchse"], teilelieferanten: ["teile", "lieferanten"], explosionszeichnung: ["explosion", "zeichnung"], lagersatz: ["lager", "satz"], lagersatzes: ["lager", "satzes"], montagefolge: ["montage", "folge"], teilebezeichnung: ["teile", "bezeichnung"], ausgangsflansch: ["ausgang", "flansch"], lagerarbeiten: ["lager", "arbeiten"], teileprogramm: ["teile", "programm"], rollenkaefig: ["rollen", "kaefig"], lageraussenrings: ["lager", "aussenring"], flacheisen: ["flach", "eisen"], gegenstand: ["gegen", "stand"], anschlagbereichs: ["anschlag", "bereichs"], kupplungsglocke: ["kupplung", "glocke"], tachometerantrieb: ["tachometer", "antrieb"], herausspringende: ["heraus", "springende"], fuehrungsflansch: ["fuehrung", "flansch"], hinterteil: ["hinter", "teil"], oelsorte: ["oels", "orte"], schaumbildung: ["schaum", "bildung"], schwergaengiges: ["schwer", "gaengiges"], kratzendes: ["kratz", "endes"], gangwechsel: ["gang", "wechsel"], getriebegeraeusche: ["getriebe", "geraeusche"], schwergaengig: ["schwer", "gaengig"], festgeklebt: ["fest", "geklebt"], festgefressen: ["fest", "gefressen"], kupplungshydrauliksystem: ["kupplung", "hydrauliksystem"], zaehfluessiges: ["zaeh", "fluessiges"], fussmatten: ["fuss", "matten"], kugelschalen: ["kugel", "schalen"], schaltpause: ["schalt", "pause"], zahnradpaar: ["zahn", "radpaar"], kupplungstrennung: ["kupplung", "trennung"], anordnungszeichnung: ["anordnung", "zeichnung"], schaltbetaetigungsteile: ["schalt", "betaetigung", "steile"], betaetigungsteile: ["betaetigung", "steile"], schaltkulisse: ["schalt", "kulisse"], waermeschutzblech: ["waerme", "schutzblech"], gelenkscheibe: ["gelenk", "scheibe"], kardanwelle: ["kardan", "welle"], getriebequertraeger: ["getriebe", "quertraeger"], sicherungsmuttern: ["sicherung", "muttern"], konstruktionsbedingt: ["konstruktion", "bedingt"], flanschende: ["flansch", "ende"], drahtstuecken: ["draht", "tuecken"], sicherungsbuegel: ["sicherung", "buegel"], schalthebelgeraeusche: ["schalthebel", "geraeusche"], bezugsmarkengebern: ["bezugsmarke", "gebern"], getriebeoelstands: ["getriebe", "oelstands"], schaltstift: ["schalt", "stift"], entluefterschraube: ["entluefter", "schraube"], schmutzfrei: ["schmutz", "frei"], quertraeger: ["quer", "traeger"], getriebegehaeuseabschnitts: ["getriebegehaeuse", "abschnitts"], gehaeuseabschnitt: ["gehaeuse", "abschnitt"], gehaeuseabschnitts: ["gehaeuse", "abschnitts"], flaechendichtmittel: ["flaechen", "dichtmittel"], getriebegehaeuseabschnitt: ["getriebegehaeuse", "abschnitt"], zahnradwelle: ["zahnrad", "welle"], innenrings: ["innen", "rings"], gleichzeitigen: ["gleich", "zeitigen"], markierungspfeils: ["markierung", "pfeils"], reinigungsanforderungen: ["reinigung", "anforderungen"], stirnseite: ["stirn", "seite"], schalthebelwelle: ["schalthebel", "welle"], halsmutter: ["hals", "mutter"], counterholding: ["counter", "holding"], schaltgassen: ["schalt", "gassen"], sperrkomponenten: ["sperr", "komponenten"], rillenlagers: ["rillen", "lagers"], sperreinrichtung: ["sperr", "einrichtung"], rastfeder: ["rast", "feder"], rillenlager: ["rille", "lager"], montageseite: ["montage", "seite"], sicherungsstiften: ["sicherung", "stiften"], abschlusskappe: ["abschluss", "kappe"], werkstattfotografien: ["werkstatt", "fotografien"], abtriebsseite: ["abtrieb", "seite"], druckscheibe: ["druck", "scheibe"], einstellspiel: ["eins", "tell", "spiel"], fuehrungshuelsen: ["fuehrung", "huelsen"], betaetigungshuelse: ["betaetigung", "huelse"], werkzeugs: ["werk", "zeugs"], molybdaenbeschichtung: ["molybdaen", "beschichtung"], teilevertrieb: ["teile", "vertrieb"], nickelbeschichteter: ["nickel", "beschichteter"], zahnweite: ["zahn", "weite"], zeichnungsnummer: ["zeichnung", "nummer"], bundseite: ["bund", "seite"], zahnbreite: ["zahn", "breite"], schwergaengige: ["schwer", "gaengige"], getriebesatzes: ["getriebe", "satzes"], distanzringe: ["distanz", "ringe"], getriebebauteile: ["getriebe", "bauteile"], federbelasteten: ["feder", "belasteten"], schaltarms: ["schalt", "arms"], fuehlerlehrenblatt: ["fuehlerlehre", "blatt"], werkstattarbeitsanweisung: ["werkstatt", "arbeitsanweisung"], lagerhalters: ["lager", "halters"], radialdichtrings: ["radial", "dichtring"], ausgleichsplaettchens: ["ausgleichs", "plaettchens"], gegenhalteschluessel: ["gegen", "halte", "schluessel"], radialdichtring: ["radial", "dichtring"], ausgleichsplaettchen: ["ausgleichs", "plaettchen"], arbeitshinweisen: ["arbeit", "hinweisen"], lagerbestueckung: ["lager", "bestueckung"], zahnradpaket: ["zahnrad", "paket"], scheibendicke: ["scheibe", "dicke"], messuhrhalter: ["messuhr", "halter"], hartvernickelt: ["hart", "vernickelt"], molybdaenbeschichtet: ["molybdaen", "beschichtet"], aussermittiger: ["ausser", "mittiger"], aussermittige: ["ausser", "mittige"], getriebequertraegers: ["getriebe", "quertraegers"], getriebebefestigung: ["getriebe", "befestigung"], austauschgetriebes: ["austausch", "getriebes"], schaltstangengelenks: ["schaltstange", "gelenks"], getriebelagern: ["getriebe", "lagern"], auspuffhalter: ["auspuff", "halter"], getriebeidentifizierung: ["getriebe", "identifizierung"], uebertragungsfeder: ["uebertragung", "feder"], fuehrungszapfen: ["fuehrung", "zapfen"], schaltstangengelenk: ["schaltstange", "gelenk"], zurueckschieben: ["zurueck", "schieben"], anbauteilen: ["anbau", "teilen"], getriebeidentifikation: ["getriebe", "identifikation"], getriebelager: ["getriebe", "lager"], auspuffhalterung: ["auspuff", "halterung"], rueckfahrlichtschalters: ["rueckfahrlicht", "schalters"], getriebegummilager: ["getriebe", "gummilager"], abtriebsflanschseite: ["abtrieb", "flansch", "seite"], rundstahl: ["rund", "stahl"], ganggruppenbezogenen: ["gang", "gruppen", "bezogenen"], schaltfuehrung: ["schalt", "fuehrung"], rueckwaertsgangbetaetigung: ["rueckwaertsgang", "betaetigung"], sperrstueck: ["sperr", "stueck"], rueckwaertsganghebel: ["rueckwaerts", "ganghebel"], waermeschutzblechs: ["waerme", "schutzblechs"], schaltgestaenges: ["schalt", "gestaenges"], mittellagers: ["mittel", "lagers"], zentrierstift: ["zentrier", "stift"], wiedereinbauen: ["wiede", "rein", "bauen"], kupplungsausrueckteile: ["kupplung", "ausrueckt", "eile"], spezialschluessel: ["spezial", "schluessel"], getriebehuelse: ["getriebe", "huelse"], getriebefeder: ["getriebe", "feder"], fuehrungsbereich: ["fuehrung", "bereich"], zwischengehaeuse: ["zwischen", "gehaeuse"], vorschriftsmaessiger: ["vorschrift", "maessiger"], aufspannen: ["aufs", "pannen"], nutenscheiben: ["nuten", "scheiben"], federhuelse: ["feder", "huelse"], nutenscheibe: ["nuten", "scheibe"], blechschaltkonsole: ["blech", "schaltkonsole"], ersatzteile: ["ersatz", "teile"], kugellagerinnenring: ["kugellager", "innenring"], schaltgetriebegehaeuse: ["schaltgetriebe", "gehaeuse"], schaltgetriebegehaeuses: ["schaltgetriebe", "gehaeuses"], hierfuer: ["hier", "fuer"], dichtdeckels: ["dicht", "deckels"], verdrehsicherung: ["verdreh", "sicherung"], distanzscheibendicke: ["distanzscheibe", "dicke"], dichtmittels: ["dicht", "mittels"], dichtdeckel: ["dicht", "deckel"], bilddarstellungen: ["bild", "darstellungen"], kardanwellen: ["kardan", "wellen"], eingangswellenflansches: ["eingangswelle", "flansches"], schaltstangenverbindung: ["schaltstange", "verbindung"], eingangswellenflansch: ["eingangswelle", "flansch"], herausgetrieben: ["heraus", "getrieben"], getriebegehaeuseteilen: ["getriebe", "gehaeuseteilen"], gangrads: ["gang", "rads"], lagerinnenringen: ["lager", "innenring"], getriebegehaeuseteile: ["getriebe", "gehaeuseteile"], herunterfaellt: ["herunter", "faellt"], herausfallenden: ["heraus", "fallenden"], drehverriegelung: ["dreh", "verriegelung"], betaetigungsmuffe: ["betaetigung", "muffe"], herausfallen: ["heraus", "fallen"], zahnrades: ["zahn", "rades"], rueckwaertsgangkomponenten: ["rueckwaertsgang", "komponenten"], wellenvorderseite: ["wellen", "vorderseite"], stufenbund: ["stufe", "bund"], sicherungsbolzen: ["sicherung", "bolzen"], schaltarretierung: ["schalt", "arretierung"], rueckwaertsgangsbereichs: ["rueckwaertsgang", "bereichs"], rueckwaertsganghebels: ["rueckwaerts", "ganghebels"], nadellagers: ["nadel", "lagers"], zahnrads: ["zahn", "rads"], gegenueberliegen: ["gegenueber", "liegen"], drehanschlag: ["dreh", "anschlag"], montagehalter: ["montage", "halter"], ineinandergreift: ["ineinander", "greift"], lagerinnenringe: ["lager", "innenringe"], markierungslinie: ["markierung", "linie"], antriebsteilen: ["antrieb", "steilen"], drehsicherung: ["dreh", "sicherung"], lagerwelle: ["lager", "welle"], vorgelegewellenlager: ["vorgelege", "wellenlager"], lagervorsprung: ["lager", "vorsprung"], eingangswellenzapfen: ["eingangswelle", "zapfen"], lagerrings: ["lager", "rings"], vorgelegewellenzapfen: ["vorgelege", "wellen", "zapfen"], kunststoffkaefigs: ["kunststoff", "kaefigs"], kunststoffkaefig: ["kunststoff", "kaefig"], werkzeugbezeichnungen: ["werkzeug", "bezeichnungen"], schaltkupplung: ["schalt", "kupplung"], gleichmaessige: ["gleich", "maessige"], allradfahrzeuge: ["allrad", "fahrzeuge"], staubschutzmanschette: ["staubschutz", "manschette"], schaltknueppel: ["schalt", "knueppel"], schaltsack: ["schalt", "sack"], teileuebersicht: ["teile", "uebersicht"], schaltanordnung: ["schalt", "anordnung"], schmierfilz: ["schmier", "filz"], federtuelle: ["feder", "tuelle"], daempferplatte: ["daempfer", "platte"], gummimanschette: ["gummi", "manschette"], schaltknueppels: ["schalt", "knueppels"], schaltknauf: ["schalt", "knauf"], staubschutz: ["staub", "schutz"], rueckfahrlichtleitungen: ["rueckfahrlicht", "leitungen"], staubschutzbalg: ["staubschutz", "balg"], schalthebelausbau: ["schalthebel", "ausbau"], staubschutzabdeckungen: ["staubschutz", "abdeckungen"], kugelplatte: ["kugel", "platte"], kugelplattennasen: ["kugel", "platt", "nasen"], haltenasen: ["halte", "nasen"], staubschutzabdeckung: ["staubschutz", "abdeckung"], abbildungshinweise: ["abbildung", "hinweise"], allradfahrzeugen: ["allrad", "fahrzeugen"], hitzeschutzbleche: ["hitzeschutz", "bleche"], bolzenlaenge: ["bolzen", "laenge"], gewindehuelse: ["gewinde", "huelse"], veranschaulicht: ["vera", "schau", "licht"], rastnasen: ["rast", "nasen"], kipphebels: ["kipp", "hebels"], kipphebel: ["kipp", "hebel"], schalthebelteils: ["schalthebel", "teils"], fuehrungsbauteile: ["fuehrung", "bauteile"], drahtsprengring: ["draht", "sprengring"], schalthebelteil: ["schalthebel", "teil"], federhalter: ["feder", "halter"], staubmanschette: ["staub", "manschette"], hebelteils: ["hebel", "teils"], schalthebelknaufs: ["schalthebel", "knaufs"], gummiteile: ["gummi", "teile"], seifenwasser: ["seifen", "wasser"], schalthebelknauf: ["schalthebel", "knauf"], schaltschemas: ["schalt", "schemas"], schaltschema: ["schalt", "schema"], abgasstrang: ["abgas", "strang"], verstaerkungstraeger: ["verstaerkung", "traeger"], mikroverkapseltem: ["mikro", "verkapseltem"], klebstoff: ["kleb", "toff"], mikroverkapselter: ["mikro", "verkapselter"], schalthebelkonsole: ["schalthebel", "konsole"], hochklappen: ["hoch", "klappen"], einbaukontrollen: ["einbau", "kontrollen"], gummiringe: ["gummi", "ringe"], lagerflaechen: ["lager", "flaechen"], allradgetriebenen: ["allrad", "getriebenen"], sicherungshalters: ["sicherung", "halters"], sicherungshalter: ["sicherung", "halter"], mikroverkapselt: ["mikro", "verkapselt"], klebstoffbeschichteter: ["klebstoff", "beschichteter"], hebelkonsole: ["hebel", "konsole"], befestigungsbuegel: ["befestigung", "buegel"], gummiabdeckung: ["gummi", "abdeckung"], arbeitsgangnummern: ["arbeitsgang", "nummern"], schaltkonsolenbaugruppe: ["schaltkonsole", "baugruppe"], konsolenhalterung: ["konsolen", "halterung"], sicherungsclips: ["sicherung", "clips"], wellenbolzens: ["wellen", "bolzens"], vorspannmasses: ["vorspann", "masses"], hitzeschild: ["hitze", "schild"], haltezungen: ["halte", "zungen"], hochschwenken: ["hoch", "schwenken"], haltezunge: ["halte", "zunge"], druckknopf: ["druck", "knopf"], getriebeschalter: ["getriebe", "schalter"], blechschraube: ["blech", "schraube"], federelement: ["feder", "element"], wellenstift: ["welle", "stift"], linsenkopfschraube: ["linsen", "kopfschraube"], schaltseil: ["schalt", "seil"], grundplatte: ["grund", "platte"], montageuebersicht: ["montage", "uebersicht"], blechmutter: ["blech", "mutter"], passfeder: ["pass", "feder"], getriebehebel: ["getriebe", "hebel"], gummiabdichtungen: ["gummi", "abdichtungen"], seilzugs: ["seil", "zugs"], mittelkonsolenverkleidung: ["mittelkonsole", "verkleidung"], stahldraht: ["stahl", "draht"], seilhuelle: ["seil", "huelle"], schaumgummidichtung: ["schaumgummi", "dichtung"], seilstange: ["seil", "tang"], vorwaertsrichtung: ["vorwaerts", "richtung"], festklemmen: ["fest", "klemmen"], schalthebelgriffs: ["schalt", "hebelgriffs"], schalthebelbereichs: ["schalthebel", "bereichs"], getriebeschalters: ["getriebe", "schalters"], lagerbuchsen: ["lager", "buchsen"], druckknopfes: ["druck", "knopfes"], schaltskalenbeleuchtung: ["schalt", "skalen", "beleuchtung"], schalthebelsockel: ["schalthebel", "sockel"], schalthebelgriff: ["schalt", "hebelgriff"], anzeigeleuchte: ["anzeige", "leuchte"], herausklappen: ["heraus", "klappen"], gummituelle: ["gummi", "tuelle"], seilzughuelle: ["seilzug", "huelle"], seilzugstange: ["seilzug", "stange"], seilzugauge: ["seilzug", "auge"], reparaturgruppe: ["reparatur", "gruppe"], arbeitsblaettern: ["arbeit", "blaettern"], gelenkwellenvibrationen: ["gelenkwelle", "vibrationen"], gelenkwellengelenk: ["gelenkwelle", "gelenk"], mittellagerbaugruppe: ["mittellager", "baugruppe"], gelenkwellenkappe: ["gelenkwelle", "kappe"], motorneigung: ["motor", "neigung"], getriebelagerungen: ["getriebe", "lagerungen"], optischem: ["opti", "schem"], ausgleichsbleche: ["ausgleich", "bleche"], unwuchtverdacht: ["unwucht", "verdacht"], wuchtanlage: ["wucht", "anlage"], rollenpruefstand: ["rollen", "pruefstand"], motorlagerungen: ["motor", "lagerungen"], motortraeger: ["motor", "traeger"], gussrippe: ["guss", "rippe"], getriebeverlaengerung: ["getriebe", "verlaengerung"], motorflaeche: ["motor", "flaeche"], wasserwaage: ["wasser", "waage"], skalenteilung: ["skalen", "teilung"], auflageflaechen: ["auflage", "flaechen"], oelwannenflansch: ["oelwanne", "flansch"], motorlagerung: ["motor", "lagerung"], getriebelagerung: ["getriebe", "lagerung"], ausgleichsblech: ["ausgleich", "blech"], antriebsstrang: ["antrieb", "strang"], hilfsschiene: ["hilf", "schiene"], motorwinkel: ["motor", "winkel"], gelenkwellenwinkel: ["gelenkwelle", "winkel"], kreuzgelenks: ["kreuz", "gelenks"], motorneigungswinkel: ["motor", "neigungswinkel"], kreuzgelenk: ["kreuz", "gelenk"], schiebestueck: ["schiebe", "stueck"], schiebestuecks: ["schiebe", "stuecks"], gelenkwellenhaelften: ["gelenkwelle", "haelften"], zusammengebaut: ["zusammen", "gebaut"], schwergaengigkeit: ["schwer", "gaengigkeit"], zusammengebauten: ["zusammen", "gebauten"], keilwellenverzahnung: ["keilwellen", "verzahnung"], staubschutzdeckel: ["staubschutz", "deckel"], kreuzgelenke: ["kreuz", "gelenke"], positionsangaben: ["position", "angaben"], gelenkwellenabschnitt: ["gelenkwelle", "abschnitt"], klemmmutter: ["klemm", "mutter"], klemmschelle: ["klemm", "schelle"], gelenkwellenmittellager: ["gelenkwelle", "mittellager"], hitzeschutzsystem: ["hitzeschutz", "system"], fahrzeugspezifische: ["fahrzeug", "spezifische"], komplettbaugruppe: ["komplett", "baugruppe"], stoppmuttern: ["stopp", "muttern"], flanschseite: ["flansch", "seite"], schiebeverzahnung: ["schiebe", "verzahnung"], zusammenschieben: ["zusammen", "schieben"], gelenkwellen: ["gelenk", "wellen"], verbindungsleitung: ["verbindung", "leitung"], hitzeschilde: ["hitze", "schilde"], motorbetrieb: ["motor", "betrieb"], motorkraft: ["motor", "kraft"], gelenkkupplung: ["gelenk", "kupplung"], stoppmutter: ["stopp", "mutter"], demontageschritte: ["demontage", "schritte"], vorgehensweisen: ["vorgehe", "weisen"], getriebeausgang: ["getriebe", "ausgang"], getriebeausgangsflansch: ["getriebeausgang", "flansch"], schwingungstilgung: ["schwingung", "tilgung"], getriebeseite: ["getriebe", "seite"], kraftstoffbehaelters: ["kraftstoff", "behaelters"], flanscharmen: ["flansch", "armen"], flanscharme: ["flansch", "arme"], schiebestelle: ["schiebe", "stelle"], gelenkwellenstumpf: ["gelenk", "wellenstumpf"], zentrierhuelse: ["zentrier", "huelse"], zentrierstuecks: ["zentrier", "stuecks"], zaehfluessigem: ["zaeh", "fluessigem"], lagerbock: ["lager", "bock"], koernermarkierungen: ["koerner", "markierungen"], koernermarkierung: ["koerner", "markierung"], versehen: ["vers", "ehen"], gelenkwellenabschnitte: ["gelenkwelle", "abschnitte"], staubschutzring: ["staub", "schutzring"], detailabbildung: ["detail", "abbildung"], staubschutzrings: ["staub", "schutzrings"], freigang: ["frei", "gang"], mittellageraufnahme: ["mittellager", "aufnahme"], zentrierscheibe: ["zentrier", "scheibe"], einbauausrichtung: ["einbau", "ausrichtung"], mittelsperre: ["mittel", "sperre"], kraftverteiler: ["kraft", "verteiler"], flanschlasche: ["flansch", "lasche"], flanschlaschen: ["flansch", "laschen"], motoreinstellung: ["motor", "einstellung"], axialausgleich: ["axial", "ausgleich"], drumming: ["drum", "ming"], getriebeflansch: ["getriebe", "flansch"], schwingungsgeraeusche: ["schwingung", "geraeusche"], ausgleichselements: ["ausgleich", "elements"], zentrierfehler: ["zentrier", "fehler"], flanschbohrungen: ["flansch", "bohrungen"], rechtwinklig: ["recht", "winklig"], ausgleichselement: ["ausgleich", "element"], achsantriebsflansch: ["achsantrieb", "flansch"], flanschbohrung: ["flansch", "bohrung"], pruefarbeitsgaenge: ["pruefarbeit", "gaenge"], querlenker: ["quer", "lenker"], lagerungen: ["lage", "runge"], antriebsflansch: ["antrieb", "flansch"], radnabenlager: ["radnabe", "lager"], federbeine: ["feder", "beine"], stossdaempfer: ["stoss", "daempfer"], arbeitsblattseiten: ["arbeit", "blattseiten"], vorderradaufhaengung: ["vorderrad", "aufhaengung"], federbein: ["feder", "bein"], federbeinlager: ["federbein", "lager"], schraubenfeder: ["schraube", "feder"], querlenkerhalter: ["querlenker", "halter"], vorderachsaufhaengung: ["vorder", "achsaufhaengung"], stossdaempfern: ["stoss", "daempfern"], federbeins: ["feder", "beins"], fahrzeughoehe: ["fahrzeug", "hoehe"], vorderachsgetriebes: ["vorder", "achsgetriebes"], einbauzeichnung: ["einbau", "zeichnung"], kegelrads: ["kegel", "rads"], kegelradlager: ["kegel", "radlager"], gleichlaufgelenke: ["gleichlauf", "gelenke"], differentialzahnraeder: ["differential", "zahnraeder"], differentiallagerungen: ["differential", "lagerungen"], gleichlaufgelenk: ["gleichlauf", "gelenk"], velocity: ["velo", "city"], daempfereinheiten: ["daempfer", "einheiten"], schraubenfedern: ["schraube", "federn"], zahnstangenlenkung: ["zahnstange", "lenkung"], anbindungsteile: ["anbindung", "steile"], identifikationsdarstellung: ["identifikation", "darstellung"], spurstange: ["spur", "tang"], textanweisungen: ["text", "anweisungen"], servolenkungshydraulik: ["servolenkung", "hydraulik"], hydraulikfluessigkeit: ["hydraulik", "fluessigkeit"], vorderraeder: ["vorder", "raeder"], vorderradspur: ["vorder", "radspur"], druckschlauch: ["druck", "schlauch"], staubschutzkappen: ["staubschutz", "kappen"], querlenkers: ["quer", "lenkers"], vorderradachsvermessung: ["vorderrad", "achsvermessung"], daempferregelung: ["daempfer", "regelung"], hydraulikfluessigkeitsbehaelter: ["hydraulik", "fluessigkeitsbehaelter"], detailfotografien: ["detail", "fotografien"], pfeilmarkierungen: ["pfeil", "markierungen"], vorderachstraegers: ["vorder", "achstraegers"], vierzylindermodellen: ["vierzylinder", "modellen"], motordaempfers: ["motor", "daempfers"], werkstattheber: ["werkstatt", "heber"], motorlagers: ["motor", "lagers"], selbstsichernder: ["selbst", "sichernder"], vierzylindermodelle: ["vierzylinder", "modelle"], motordaempfer: ["motor", "daempfer"], seitenwandtraeger: ["seitenwand", "traeger"], kugelgelenke: ["kugel", "gelenke"], kugelgelenk: ["kugel", "gelenk"], querlenkerhaltern: ["querlenker", "haltern"], druckstreben: ["druck", "trebe"], vierzylindermotoren: ["vierzylinder", "motoren"], vorderradgeometrie: ["vorderrad", "geometrie"], sicherungsmutter: ["sicherung", "mutter"], polystyrolmutter: ["polystyrol", "mutter"], druckstrebe: ["druck", "trebe"], seitenwaende: ["seiten", "waende"], seitenwand: ["seit", "wand"], vorderrads: ["vorder", "rads"], querlenkerhalterung: ["querlenker", "halterung"], fuehrungsgelenks: ["fuehrung", "gelenks"], gelenkzapfens: ["gelenk", "zapfens"], fuehrungsgelenk: ["fuehrung", "gelenk"], fettfrei: ["fett", "frei"], gelenkzapfen: ["gelenk", "zapfen"], federbeinaggregat: ["federbein", "aggregat"], allradfahrzeug: ["allrad", "fahrzeug"], lagerbocks: ["lager", "bocks"], gummilagers: ["gummi", "lagers"], querlenkermitte: ["querlenker", "mitte"], aggregatetraeger: ["aggregate", "traeger"], fahrzeugbelastung: ["fahrzeug", "belastung"], normalstellung: ["normal", "stellung"], innenhuelse: ["innen", "huelse"], paarweise: ["paar", "weise"], querlenkerzapfen: ["querlenker", "zapfen"], zentrierbohrungen: ["zentrier", "bohrungen"], verdunstet: ["verdun", "stet"], zentrierbohrung: ["zentrier", "bohrung"], gussnase: ["guss", "nase"], spaltmasses: ["spalt", "masses"], fahrzeugstellung: ["fahrzeug", "stellung"], sechszylinder: ["sechs", "zylinder"], orangefarbenen: ["orange", "farben"], spaltmass: ["spalt", "mass"], antriebsflansches: ["antriebs", "flansches"], arbeitsablaeufe: ["arbeit", "ablaeufe"], radlagereinheit: ["radlager", "einheit"], fettkappe: ["fett", "kappe"], verbleibenden: ["verbleib", "enden"], staubschutzblech: ["staub", "schutzblech"], nichtwiederverwendung: ["nicht", "wiederverwendung"], fettkappen: ["fett", "kappen"], kreuzmeissel: ["kreuz", "meissel"], schutzblech: ["schutz", "blech"], verbleibt: ["verb", "leibt"], zurueckbiegen: ["zurueck", "biegen"], spurstangengelenk: ["spurstange", "gelenk"], sauberhalten: ["sauber", "halten"], gelenkbolzen: ["gelenk", "bolzen"], kolbenstangen: ["kolben", "tangen"], herausbewegt: ["heraus", "bewegt"], spaeteren: ["spaet", "eren"], klopfgeraeuschen: ["klopf", "geraeuschen"], herausbewegten: ["heraus", "bewegten"], federbeinaufbau: ["federbein", "aufbau"], federauflagen: ["feder", "auflagen"], federbeinrohr: ["federbein", "rohr"], stossdaempfers: ["stoss", "daempfers"], federteller: ["feder", "teller"], kolbenstangenmutter: ["kolbenstange", "mutter"], kennbuchstaben: ["kenn", "buchstaben"], stossdaempferpruefgeraet: ["stossdaempfer", "pruefgeraet"], stossdaempferpruefstand: ["stossdaempfer", "pruefstand"], gewindelaenge: ["gewinde", "laenge"], spannvorrichtung: ["spann", "vorrichtung"], federbeinlagers: ["federbein", "lagers"], federgummis: ["feder", "gummis"], federbeinrohrs: ["federbein", "rohrs"], federgummi: ["feder", "gummi"], federtellers: ["feder", "tellers"], faltenbalg: ["falte", "balg"], kolbenstangendurchmesser: ["kolbenstange", "durchmesser"], klopfgeraeusche: ["klopf", "geraeusche"], betriebsstoffe: ["betrieb", "stoffe"], korrekturlager: ["korrektur", "lager"], federenden: ["feder", "enden"], federspanner: ["feder", "spanner"], gummiringen: ["gummi", "ringen"], federtellern: ["feder", "tellern"], federbeinfeder: ["federbein", "feder"], dieselbe: ["dies", "elbe"], fahrzeugtypen: ["fahrzeug", "typen"], sportfahrwerk: ["sport", "fahrwerk"], einfuehrungsdaten: ["einfuehrung", "daten"], ersatzteilnummer: ["ersatz", "teilnummer"], fahrzeugzuordnung: ["fahrzeug", "zuordnung"], auflageschulter: ["auflage", "schulter"], demontagepunkte: ["demontage", "punkte"], koppelstangen: ["koppel", "tangen"], stabilisatorhalterungen: ["stabilisator", "halterungen"], lenkradflattern: ["lenkrad", "flattern"], lastwechselklopfen: ["lastwechsel", "klopfen"], antriebskomponenten: ["antriebs", "komponenten"], hoehenschlag: ["hoehen", "schlag"], daempfungswirkung: ["daempfung", "wirkung"], klappergeraeusch: ["klapper", "geraeusch"], stossdaempferpatrone: ["stossdaempfer", "patrone"], lastwechsel: ["last", "wechsel"], zahnflankenspiel: ["zahnflanke", "spiel"], fahrverhaltensbeanstandungen: ["fahrverhaltens", "beanstandungen"], langanhaltendes: ["lang", "anhaltendes"], fahrbahn: ["fahr", "bahn"], stossdaempferwirkung: ["stossdaempfer", "wirkung"], aufeinanderfolgender: ["aufeinander", "folgender"], fahrbahnoberflaechen: ["fahrbahn", "oberflaechen"], spurhaltung: ["spur", "haltung"], aufeinanderfolgende: ["aufeinander", "folgende"], reifenprofil: ["reifen", "profil"], wirkungsgrad: ["wirkung", "grad"], herausgefahren: ["heraus", "gefahren"], kegelritzel: ["kegel", "ritzel"], fahrzeugangaben: ["fahrzeug", "angaben"], betriebsstofftabellen: ["betriebsstoff", "tabellen"], rechtssteigende: ["rechts", "steigende"], typenschild: ["typen", "schild"], hoechstzulaessige: ["hoechst", "zulaessige"], fahrgeschwindigkeit: ["fahr", "geschwindigkeit"], oelwechselintervalle: ["oelwechsel", "intervalle"], hinweisschild: ["hinweis", "schild"], splintsicherung: ["splint", "sicherung"], dichtungserneuerung: ["dichtung", "erneuerung"], druckspindel: ["druck", "spindel"], schraubenkopf: ["schraube", "kopf"], vorderachsantrieb: ["vorder", "achsantrieb"], wellendichtrings: ["wellen", "dichtring"], triebsatzes: ["trieb", "satzes"], triebsatz: ["trieb", "satz"], gleichmaessiges: ["gleich", "maessiges"], aluminiumbacken: ["aluminium", "backen"], gleichmaessigem: ["gleich", "maessigem"], betriebsstofftabelle: ["betriebsstoff", "tabelle"], antriebssatz: ["antrieb", "satz"], flanschmutter: ["flansch", "mutter"], laufflaeche: ["lauf", "flaeche"], wellendichtringe: ["wellen", "dichtring"], eintauchen: ["eint", "auch"], antriebssatzes: ["antrieb", "satzes"], kegelrollenlager: ["kegel", "rollenlager"], arbeitsskizzen: ["arbeit", "skizzen"], differentiallager: ["differential", "lager"], montagezeichnungen: ["montage", "zeichnungen"], differentialgehaeuse: ["differential", "gehaeuse"], kegelrollenlagers: ["kegelrolle", "lagers"], lageraussenringe: ["lager", "aussenringe"], achsantriebsgehaeuse: ["achsantrieb", "gehaeuse"], kragenmutter: ["kragen", "mutter"], zahnflankentragbild: ["zahnflanke", "tragbild"], einstellvorgang: ["eins", "tell", "vorgang"], tellerrads: ["teller", "rads"], differentialkorb: ["differential", "korb"], tragbild: ["trag", "bild"], zusammengehoeriges: ["zusammen", "gehoeriges"], kegelradpaar: ["kegel", "radpaar"], kegelradsatzes: ["kegelrad", "satzes"], differenzialgehaeuse: ["differenzial", "gehaeuse"], kegelradsatz: ["kegel", "radsatz"], geraeuscharmen: ["geraeusch", "armen"], paarcode: ["paar", "code"], paarcodes: ["paar", "codes"], gleichmaessiger: ["gleich", "maessiger"], tellerradschrauben: ["teller", "radschrauben"], zahntragbild: ["zahn", "tragbild"], tragbildbeurteilung: ["tragbild", "beurteilung"], kegelradverzahnung: ["kegelrad", "verzahnung"], einstelldiagramm: ["eins", "tell", "diagramm"], sitzenden: ["sitz", "enden"], holzstueck: ["holz", "stueck"], datenschild: ["daten", "schild"], einstellscheiben: ["eins", "tell", "scheiben"], gewindebohrer: ["gewinde", "bohrer"], tellerradschraube: ["teller", "radschraube"], ausgleichskegelraeder: ["ausgleichs", "kegelraeder"], ausgleichskegelradwelle: ["ausgleich", "kegel", "radwelle"], differentialkorbs: ["differential", "korbs"], differentialraeder: ["differential", "raeder"], verbleibende: ["verbleib", "ende"], differentialradwelle: ["differential", "radwelle"], ausgleichskegelrad: ["ausgleich", "kegelrad"], seitenspiel: ["seite", "spiel"], differentialrades: ["differential", "rades"], buegelmessschraube: ["buegel", "messschraube"], differentialraedern: ["differential", "raedern"], maximalen: ["maxi", "malen"], gegenuhrzeigerrichtung: ["gegen", "uhrzeiger", "richtung"], messuhrkontakt: ["messuhr", "kontakt"], betriebsstoffspezifikationen: ["betriebsstoff", "spezifikationen"], schematisch: ["schema", "tisch"], differentialeinheit: ["differential", "einheit"], gesamtstaerke: ["gesamt", "staerke"], zahnflankenspiels: ["zahnflanke", "spiels"], beizubehalten: ["beizu", "behalten"], blockmasses: ["block", "masses"], differenziallager: ["differenzial", "lager"], addieren: ["addi", "eren"], gehaeusebezug: ["gehaeuse", "bezug"], grundmass: ["grund", "mass"], korrekturzahl: ["korrektur", "zahl"], hundertstelmillimeter: ["hundertstel", "millimeter"], blockmass: ["block", "mass"], gehaeusebohrungen: ["gehaeuse", "bohrungen"], ausgleichsscheibenstaerke: ["ausgleichsscheibe", "staerke"], rechenbeispiels: ["rechen", "beispiels"], scheibenstaerke: ["scheibe", "staerke"], staerkenabstufungen: ["staerken", "abstufungen"], flankenspiels: ["flanke", "spiels"], ausgleichrings: ["ausgleich", "rings"], gesamtdicke: ["gesamt", "dicke"], zahnflanken: ["zahn", "flanken"], zahnflanke: ["zahn", "flanke"], ausgleichringe: ["ausgleich", "ringe"], dickenabstufungen: ["dicken", "abstufungen"], dickeren: ["dick", "eren"], ausgleichring: ["ausgleich", "ring"], duenneren: ["duenn", "eren"], tragbilds: ["trag", "bilds"], druckfarbe: ["druck", "farbe"], tragbildabweichungen: ["tragbild", "abweichungen"], schematischen: ["schema", "tischen"], tragbildformen: ["tragbild", "formen"], grundinformationen: ["grund", "informationen"], hauptsaechlich: ["haupt", "saechlich"], laengslage: ["laengs", "lage"], zahnhoehe: ["zahn", "hoehe"], tragbilder: ["trag", "bilder"], zahnkopf: ["zahn", "kopf"], zahnfuss: ["zahn", "fuss"], zahnende: ["zahn", "ende"], zahnspitze: ["zahn", "spitze"], abbildungsbezeichnungen: ["abbildung", "bezeichnungen"], zahnfussseite: ["zahn", "fuss", "seite"], verzahnungsarten: ["verzahnung", "arten"], klingelnberg: ["klingel", "berg"], zahnkontakt: ["zahn", "kontakt"], innendurchmesser: ["innen", "durchmesser"], zahnlaenge: ["zahn", "laenge"], spurstangenkopf: ["spurstange", "kopf"], keilverzahnung: ["keil", "verzahnung"], druckspindeln: ["druck", "spindeln"], gleichlaufgelenks: ["gleichlauf", "gelenks"], wahlweise: ["wahl", "weise"], verzahnungssicherung: ["verzahnung", "sicherung"], fettbefuellung: ["fett", "befuellung"], fettmenge: ["fett", "menge"], schmierfetts: ["schmier", "fett"], auseinanderfallen: ["auseinander", "fallen"], querlenkerhalterungen: ["querlenker", "halterungen"], tragbalken: ["trag", "balken"], seitenteile: ["seite", "teile"], hydraulikleitung: ["hydraulik", "leitung"], fotoabbildungen: ["foto", "abbildungen"], stabilisatorhalterung: ["stabilisator", "halterung"], kegelgelenke: ["kegel", "gelenke"], kugelbolzen: ["kugel", "bolzen"], drehmomentwerte: ["drehmoment", "werte"], radnabenlagers: ["radnabe", "lagers"], spurstangenhebel: ["spurstange", "hebel"], einbauvarianten: ["einbau", "varianten"], lagereinheit: ["lager", "einheit"], achszapfenbaugruppe: ["achszapfen", "baugruppe"], schutzvorrichtung: ["schutz", "vorrichtung"], federbeinaggregats: ["federbein", "aggregats"], vorderfederbein: ["vorder", "federbein"], werkstattcode: ["werkstatt", "code"], federbeinaufnahme: ["federbein", "aufnahme"], fahrniveaus: ["fahr", "niveaus"], felgenhorn: ["felge", "horn"], korrekturfeder: ["korrektur", "feder"], hoehenabweichungen: ["hoehen", "abweichungen"], mittelwert: ["mittel", "wert"], nennhoehe: ["nenn", "hoehe"], federring: ["feder", "ring"], federringe: ["feder", "ringe"], korrekturtabelle: ["korrektur", "tabelle"], zeilenweise: ["zeile", "weise"], fahrniveauhoehe: ["fahr", "niveau", "hoehe"], sollhoehe: ["soll", "hoehe"], hoehenabweichung: ["hoehen", "abweichung"], zuordnungstabellen: ["zuordnung", "tabellen"], matrixform: ["matrix", "form"], identische: ["ident", "ische"], auswertungsrichtung: ["auswertung", "richtung"], tabellenbereich: ["tabelle", "bereich"], schraffurfeld: ["schraffur", "feld"], differenzwert: ["differenz", "wert"], korrekturwert: ["korrektur", "wert"], zuordnungsrichtungen: ["zuordnung", "richtungen"], hoehenkorrekturen: ["hoehen", "korrekturen"], kombination: ["kombi", "nation"], kennnummern: ["kenn", "nummern"], bezugsgroessen: ["bezugs", "groessen"], differenzwerte: ["differenz", "werte"], zahlenwert: ["zahl", "wert"], bezugsrichtungen: ["bezugs", "richtungen"], bezugsgroesse: ["bezugs", "groesse"], laengslenkern: ["laengs", "lenkern"], differenzialgetriebe: ["differenzial", "getriebe"], antriebswellen: ["antrieb", "wellen"], laengslenker: ["laengs", "lenker"], hinterachsantrieb: ["hinter", "achsantrieb"], seitenzahl: ["seit", "zahl"], einlaufvorschriften: ["einlauf", "vorschriften"], hinterachsgetriebes: ["hinter", "achsgetriebes"], hinterachstraegers: ["hinter", "achstraegers"], tonnenfeder: ["tonne", "feder"], hinterachsensperre: ["hinterachse", "sperre"], bremsenpruefstand: ["bremsen", "pruefstand"], pruefstandzylinders: ["pruefstand", "zylinders"], zylinderdrehzahl: ["zylinder", "drehzahl"], viskosesperre: ["viskose", "sperre"], waermeentwicklung: ["waerme", "entwicklung"], gesamtbetriebszeit: ["gesamt", "betriebszeit"], warmgefahrene: ["warm", "gefahrene"], bremsenpruefstands: ["bremsen", "pruefstand"], testprogramm: ["test", "programm"], automatikbetrieb: ["automatik", "betrieb"], hinterraedern: ["hinter", "raedern"], bestaetigungstaste: ["bestaetigung", "taste"], rollengeschwindigkeit: ["rollen", "geschwindigkeit"], sperrwirkung: ["sperr", "wirkung"], geschwindigkeitsbereich: ["geschwindigkeit", "bereich"], periodendauer: ["periode", "dauer"], impulsrades: ["impuls", "rades"], schnittpunkt: ["schnitt", "punkt"], zeitbedingungen: ["zeit", "bedingungen"], eintragen: ["eint", "ragen"], pruefstandsanzeigen: ["pruefstand", "anzeigen"], skalenwerte: ["skale", "werte"], kraftskala: ["kraft", "skala"], reifengroessen: ["reifen", "groessen"], hinterachsuebersetzung: ["hinter", "achsuebersetzung"], hinterraeder: ["hinter", "raeder"], befestigungsarbeiten: ["befestigung", "arbeiten"], verbindliche: ["verbind", "lich"], geschwindigkeitsmessers: ["geschwindigkeit", "messers"], gummilagerung: ["gummi", "lagerung"], freigegebenem: ["frei", "gegebenem"], fahrgeschwindigkeiten: ["fahr", "geschwindigkeiten"], hoechstzulaessigen: ["hoechst", "zulaessigen"], kegelrollen: ["kegel", "rollen"], fuehrungsbund: ["fuehrung", "bund"], gelenkwellenschrauben: ["gelenkwelle", "schrauben"], hinterachsgetriebeuebersetzung: ["hinter", "achsgetriebeuebersetzung"], fettfuellung: ["fett", "fuellung"], transportkappe: ["transport", "kappe"], drahtring: ["draht", "ring"], differentialgehaeuses: ["differential", "gehaeuses"], drahtrings: ["draht", "rings"], drahtringe: ["draht", "ringe"], drehzahlimpulsempfaenger: ["drehzahl", "impuls", "empfaenger"], kugelnabe: ["kugel", "nabe"], gelenkteile: ["gelenk", "teile"], dichtungsdeckel: ["dichtung", "deckel"], gegenhalteplatte: ["gegen", "halteplatte"], kugelkaefig: ["kugel", "kaefig"], kugellaufflaechen: ["kugellauf", "flaechen"], schrittfolge: ["schritt", "folge"], freimachen: ["frei", "machen"], handbremse: ["hand", "bremse"], drehmomente: ["dreh", "momente"], endschalldaempferanlage: ["endschalldaempfer", "anlage"], handbremshebel: ["hand", "bremshebel"], sitzkissen: ["sitz", "kissen"], kabelschelle: ["kabel", "schelle"], haltegurte: ["halte", "gurte"], handbremsseile: ["hand", "bremsseile"], schutzrohren: ["schutz", "rohren"], handbremsseil: ["hand", "bremsseil"], feststellbremsseil: ["fest", "tell", "bremsseil"], feststellbremsbacken: ["fest", "tell", "bremsbacken"], schraeglenkerbaugruppe: ["schraeglenker", "baugruppe"], hinterrads: ["hinter", "rads"], handbremshebels: ["hand", "bremshebels"], schraeglenkers: ["schraeg", "lenkers"], filtersiebhuelse: ["filtersieb", "huelse"], schraeglenker: ["schraeg", "lenker"], bremsfluessigkeitsvorratsbehaelter: ["bremsfluessigkeit", "vorratsbehaelter"], bundende: ["bund", "ende"], wellendichtringen: ["wellen", "dichtringen"], hinterradspur: ["hinter", "radspur"], hinterrades: ["hinter", "rades"], korrekturbereich: ["korrektur", "bereich"], unfallschaden: ["unfall", "schaden"], aufnahmebohrung: ["aufnahme", "bohrung"], winkelversatz: ["winkel", "versatz"], spurkorrektur: ["spur", "korrektur"], verstellmoeglichkeit: ["verstell", "moeglichkeit"], hinterradvermessung: ["hinterrad", "vermessung"], spureinstellung: ["spur", "einstellung"], laengslenkers: ["laengs", "lenkers"], ablesepunkte: ["ablese", "punkte"], spurvergroesserung: ["spur", "vergroesserung"], spurverringerung: ["spur", "verringerung"], einstellvorrichtung: ["eins", "tell", "vorrichtung"], zusammenhang: ["zusammen", "hang"], verstellwinkel: ["verstell", "winkel"], spuraenderung: ["spur", "aenderung"], ablesepunkt: ["ablese", "punkt"], kennlinie: ["kenn", "linie"], verstell: ["vers", "tell"], verschiebungswinkel: ["verschiebung", "winkel"], drehrichtungen: ["dreh", "richtungen"], spurverkleinerung: ["spur", "verkleinerung"], laengslenkerauge: ["laengs", "lenker", "auge"], einbauhoehe: ["einbau", "hoehe"], ruecksitzpolster: ["ruecksitz", "polster"], schiebeverkleidung: ["schiebe", "verkleidung"], lageraufnahmeoeffnung: ["lager", "aufnahme", "oeffnung"], hinterachswelle: ["hinter", "achswelle"], bremstrommel: ["bremst", "rommel"], fahrzeugausfuehrung: ["fahrzeug", "ausfuehrung"], radlagerbaugruppe: ["radlager", "baugruppe"], sicherungsplatte: ["sicherung", "platte"], arbeitsauftrag: ["arbeit", "auftrag"], niveauregulierung: ["niveau", "regulierung"], innenverkleidung: ["innen", "verkleidung"], zentrierschale: ["zentrier", "schale"], backrest: ["back", "rest"], ersatzfeder: ["ersatz", "feder"], holzkeil: ["holz", "keil"], oberflaechenbeschaedigungen: ["oberflaechen", "beschaedigungen"], druckgeraeusche: ["druck", "geraeusche"], klappergeraeusche: ["klapper", "geraeusche"], mahlende: ["mahl", "ende"], kurvenfahren: ["kurven", "fahren"], betriebsstoffangaben: ["betriebsstoff", "angaben"], druckgeraeusch: ["druck", "geraeusch"], brummendes: ["brumm", "endes"], mahlendes: ["mahl", "endes"], kurvenfahrt: ["kurve", "fahrt"], instandsetzungs: ["instand", "setzung"], niederdruckpruefungen: ["niederdruck", "pruefungen"], dickenunterschied: ["dicken", "unterschied"], schlauchfuehrung: ["schlauch", "fuehrung"], bremskraftregler: ["bremskraft", "regler"], feststellbremshebel: ["fest", "tell", "bremshebel"], kapitelgruppe: ["kapitel", "gruppe"], einbauanweisungen: ["einbau", "anweisungen"], handbuchseiten: ["handbuch", "seiten"], modelljahre: ["modell", "jahre"], beschleunigungssensor: ["beschleunigung", "sensor"], seitenangabe: ["seiten", "angabe"], betriebsbremse: ["betrieb", "bremse"], niederdruckpruefung: ["niederdruck", "pruefung"], druckverlustpruefung: ["druckverlust", "pruefung"], bremsdruckpruefer: ["bremsdruck", "pruefer"], bremsenpruefung: ["bremsen", "pruefung"], bremstrommeln: ["bremst", "rommel"], pedalstuetze: ["pedal", "stuetze"], fuenfminuetigen: ["fuenf", "minuetigen"], dynamometer: ["dynamo", "meter"], hinterradbremse: ["hinter", "radbremse"], druckbegrenzung: ["druck", "begrenzung"], entlueftergeraets: ["entluefter", "geraets"], arbeitsreihenfolge: ["arbeit", "reihenfolge"], hinterradbremsen: ["hinterrad", "bremsen"], spezielles: ["spezi", "elle"], entlueftungsreihenfolge: ["entlueftung", "reihenfolge"], entluefterschrauben: ["entluefter", "schrauben"], vorderradbremsen: ["vorderrad", "bremsen"], hygroskopisch: ["hygroskop", "isch"], entlueftungsbohrung: ["entlueftung", "bohrung"], siedepunkt: ["siede", "punkt"], entlueftergeraet: ["entluefter", "geraet"], ladedruck: ["lade", "druck"], entluefterschlauch: ["entluefter", "schlauch"], entlueftungsventile: ["entlueftung", "ventile"], trommelbremsen: ["trommel", "bremsen"], automatischen: ["automat", "isch"], feststellbremsanlage: ["fest", "tell", "bremsanlage"], betriebsbremsanlage: ["betriebs", "bremsanlage"], fahrbetriebs: ["fahr", "betriebs"], optimale: ["opti", "male"], parkplatz: ["park", "platz"], arbeitsplatz: ["arbeit", "platz"], einstellbolzen: ["eins", "tell", "bolzen"], grundspiel: ["grund", "spiel"], klickgeraeusch: ["klick", "geraeusch"], gewindebohrung: ["gewinde", "bohrung"], durchgangsbohrung: ["durchgang", "bohrung"], handbremsbacken: ["hand", "bremsbacken"], gewindegaenge: ["gewinde", "gaenge"], einstellmuttern: ["eins", "tell", "muttern"], fuehrungsbolzen: ["fuehrung", "bolzen"], entlueftungsarbeiten: ["entlueftung", "arbeiten"], einbaudrehmoment: ["einbau", "drehmoment"], bremsbelagverschleissanzeigen: ["bremsbelag", "verschleiss", "anzeigen"], kabelbinder: ["kabel", "binder"], bremsbelagverschleissanzeigers: ["bremsbelag", "verschleiss", "anzeigers"], bremsscheibenrand: ["bremsscheibe", "rand"], verschleissgrenze: ["verschleiss", "grenze"], bremsbelagverschleissanzeiger: ["bremsbelag", "verschleiss", "anzeiger"], thermoclip: ["thermo", "clip"], fabrikatsausfuehrung: ["fabrikats", "ausfuehrung"], rechtsgewinde: ["rechts", "gewinde"], grundluft: ["grund", "luft"], bremsenentlueftung: ["bremsen", "entlueftung"], feststellbremseneinstellung: ["feststellbremse", "einstellung"], kunststoffkappen: ["kunststoff", "kappen"], sicheren: ["sich", "eren"], reparatursatzes: ["reparatur", "satzes"], fuehrungsbuchsen: ["fuehrung", "buchsen"], kunststoffnadel: ["kunststoff", "nadel"], zylinderbohrungen: ["zylinder", "bohrungen"], gummischutzmanschette: ["gummischutz", "manschette"], hartholz: ["hart", "holz"], spannring: ["span", "ring"], hartfilz: ["hart", "filz"], anschlussbohrung: ["anschluss", "bohrung"], kunststoffkappe: ["kunst", "stoffkappe"], bremszylinderpaste: ["bremszylinder", "paste"], ungleichmaessige: ["ungleich", "maessige"], vollbremsungen: ["voll", "bremsungen"], bremsschlauchverlauf: ["bremsschlauch", "verlauf"], verlaufs: ["verl", "aufs"], leitungsfuehrungen: ["leitung", "fuehrungen"], bremsleitungsfuehrung: ["bremsleitung", "fuehrung"], bremsleitungsverlauf: ["bremsleitung", "verlauf"], vorderradbremse: ["vorder", "radbremse"], bremsfluessigkeitsbehaelters: ["bremsfluessigkeit", "behaelters"], primaermanschetten: ["primaer", "manschetten"], ausgleichsbohrungen: ["ausgleich", "bohrungen"], druckkammern: ["druck", "kammern"], hydraulikschlauch: ["hydraulik", "schlauch"], zweikreisanlage: ["zwei", "kreis", "anlage"], drucklosen: ["druck", "losen"], primaermanschette: ["primaer", "manschette"], ausgleichsbohrung: ["ausgleich", "bohrung"], druckkammer: ["druck", "kammer"], zylindergehaeuses: ["zylinder", "gehaeuses"], montagehuelse: ["montage", "huelse"], fuellscheibe: ["fuell", "scheibe"], zwischenkolben: ["zwischen", "kolben"], anschlaghuelse: ["anschlag", "huelse"], druckstangenkolben: ["druckstange", "kolben"], anschlagscheibe: ["anschlag", "scheibe"], sekundaermanschette: ["sekundaer", "manschette"], kunststoffbuchse: ["kunststoff", "buchse"], aluminiumdichtung: ["aluminium", "dichtung"], silikonfett: ["silikon", "fett"], huelsenabschnitt: ["huelsen", "abschnitt"], huelsenrohr: ["huelse", "rohr"], zylindergehaeuse: ["zylinder", "gehaeuse"], zulaufbohrungen: ["zulauf", "bohrungen"], separating: ["sepa", "rating"], zulaufbohrung: ["zulauf", "bohrung"], kontermutter: ["konter", "mutter"], aluminiumring: ["aluminium", "ring"], sicherungsringzange: ["sicherungsring", "zange"], zurueckkommen: ["zurueck", "kommen"], hervorstehen: ["hervor", "stehen"], zurueckziehen: ["zurueck", "ziehen"], verbindungsnippeln: ["verbindung", "nippeln"], verbindungsnippel: ["verbindung", "nippel"], motorunterdrucks: ["motor", "unterdrucks"], pedalgestaenges: ["pedal", "gestaenges"], bremskraftverstaerkerfilters: ["bremskraftverstaerker", "filters"], einstellmass: ["eins", "tell", "mass"], kolbenstangengewinde: ["kolbenstange", "gewinde"], motorunterdruck: ["motor", "unterdruck"], instrumententafelverkleidung: ["instrumententafel", "verkleidung"], grundabstandsmass: ["grund", "abstandsmass"], rueckschlagventils: ["rueckschlag", "ventils"], unterdruckschlauchschelle: ["unterdruck", "schlauchschelle"], bremskraftreglers: ["bremskraft", "reglers"], hochdruckmanometer: ["hochdruck", "manometer"], hinterradbremszylinders: ["hinterrad", "bremszylinders"], auslassdruck: ["auslas", "druck"], druckverlauf: ["druck", "verlauf"], einlassdruck: ["einlas", "druck"], beispielwerte: ["beispiel", "werte"], hinterradbremszylinder: ["hinterrad", "bremszylinder"], vorderachsdruck: ["vorder", "achsdruck"], hinterachsdruck: ["hinter", "achsdruck"], kennwerte: ["kenn", "werte"], jahreszahl: ["jahr", "zahl"], reduktionsfaktor: ["reduktion", "faktor"], seilzugmuttern: ["seilzug", "muttern"], bremsankerplatte: ["bremsanker", "platte"], sicherungsklammer: ["sicherung", "klammer"], handbremsseilen: ["hand", "bremsseilen"], feststellbremsseils: ["fest", "tell", "bremsseil"], scheibenbremse: ["scheibe", "bremse"], haltefedern: ["halte", "federn"], seilhalter: ["seil", "halter"], bremsfederzange: ["bremsfeder", "zange"], auseinanderdruecken: ["auseinander", "druecken"], stillstand: ["still", "stand"], haltefeder: ["halte", "feder"], pedalkraft: ["pedal", "kraft"], bremspedalbewegung: ["bremspedal", "bewegung"], ungleichmaessiger: ["ungleich", "maessiger"], reifenprofilverschleiss: ["reifenprofil", "verschleiss"], hinterradgeometrie: ["hinterrad", "geometrie"], querfeder: ["quer", "feder"], bremskraftverstaerkersystem: ["bremskraftverstaerker", "system"], ungleichmaessigen: ["ungleich", "maessigen"], bremsbelagverschleiss: ["bremsbelag", "verschleiss"], wassergehalt: ["wasser", "gehalt"], leckstellen: ["leckst", "ellen"], bremssattelkolbenbohrungen: ["bremssattel", "kolbenbohrungen"], staubkappen: ["staub", "kappen"], dichtungsring: ["dichtung", "ring"], radlagerspiel: ["radlager", "spiel"], winkliger: ["wink", "liger"], festsitzende: ["fest", "sitzende"], bremssattelaufnahmen: ["bremssattel", "aufnahmen"], dickenabweichung: ["dicken", "abweichung"], schlagende: ["schlag", "ende"], belagverschleiss: ["belag", "verschleiss"], rostkanten: ["rost", "kanten"], bremsscheibendicke: ["bremsscheibe", "dicke"], trommelbremse: ["trommel", "bremse"], funktionsgestoert: ["funktion", "gestoert"], seilzuegen: ["seil", "zuegen"], uebertragungselemente: ["uebertragung", "elemente"], spreizschloesser: ["spreiz", "schloesser"], bremssattelkolben: ["bremssattel", "kolben"], spreizschloss: ["spreiz", "schloss"], antiblock: ["anti", "block"], zusammenhangs: ["zusammen", "hangs"], seitenfuehrungskraft: ["seiten", "fuehrungskraft"], optimalen: ["opti", "malen"], seitenkraefte: ["seiten", "kraefte"], fahrbahnoberflaeche: ["fahrbahn", "oberflaeche"], reibungskraft: ["reibung", "kraft"], umfangsgeschwindigkeit: ["umfangs", "geschwindigkeit"], hoechstwert: ["hoechst", "wert"], regelbereich: ["regel", "bereich"], richtungsstabilitaet: ["richtung", "stabilitaet"], gummimischung: ["gummi", "mischung"], schraeglaufwinkel: ["schraeglauf", "winkel"], reibungskraefte: ["reibung", "kraefte"], verhaeltnisses: ["verhaelt", "nisse"], reibungskoeffizienten: ["reibung", "koeffizienten"], fahrbahnbedingungen: ["fahrbahn", "bedingungen"], reibungsverhaeltnisse: ["reibung", "verhaeltnisse"], fahrbahnzustands: ["fahrbahn", "zustands"], seitenkraft: ["seite", "kraft"], rollendes: ["roll", "endes"], reibungskoeffizient: ["reibung", "koeffizient"], kurvenfuehrungskraft: ["kurven", "fuehrungskraft"], betriebsbeschreibung: ["betriebs", "beschreibung"], drehzahlsensoren: ["drehzahl", "sensoren"], permanentmagnetisierten: ["permanent", "magnetisierten"], drehbewegung: ["dreh", "bewegung"], mehrkanalrechner: ["mehrkanal", "rechner"], schlupfwerte: ["schlupf", "werte"], regelanforderungen: ["regel", "anforderungen"], elektromagnetisch: ["elektro", "magnetisch"], signalverarbeitung: ["signal", "verarbeitung"], regelverhalten: ["regel", "verhalten"], hochintegrierten: ["hoch", "integrierten"], ueberwachungsschaltungen: ["ueberwachung", "schaltungen"], ueberwachungsschaltung: ["ueberwachung", "schaltung"], dreiwegeventile: ["dreiwege", "ventile"], bremsdruckzustaende: ["bremsdruck", "zustaende"], druckaufbau: ["druck", "aufbau"], druckhalten: ["druck", "halten"], druckabbau: ["druck", "abbau"], druckphasen: ["druck", "phasen"], regelcharakteristik: ["regel", "charakteristik"], kraftuebertragung: ["kraft", "uebertragung"], regelvorgaenge: ["regel", "vorgaenge"], schlupfgrenzwert: ["schlupf", "grenzwert"], regelphasen: ["regel", "phasen"], zweikolbenpumpe: ["zwei", "kolbenpumpe"], zweikreisbremsanlage: ["zwei", "kreis", "bremsanlage"], signaleingabe: ["signal", "eingabe"], steuerbefehlen: ["steuer", "befehlen"], dreiwegeventil: ["dreiwege", "ventil"], vorderradsimulation: ["vorderrad", "simulation"], magnetventilphasen: ["magnetventil", "phasen"], leitungsuebersicht: ["leitung", "uebersicht"], motorstart: ["motor", "start"], fehleranzeigen: ["fehler", "anzeigen"], hydraulikaggregats: ["hydraulik", "aggregats"], dauerhaftes: ["dauer", "hafte"], vierradantrieb: ["vierrad", "antrieb"], beschleunigungsaufnehmer: ["beschleunigung", "aufnehmer"], wartungsfrei: ["wartung", "frei"], elektroschweissen: ["elektro", "schweissen"], zeitraum: ["zeit", "raum"], festgezogen: ["fest", "gezogen"], unfallinstandsetzung: ["unfall", "instandsetzung"], hydraulikaggregat: ["hydraulik", "aggregat"], funktionsueberwachung: ["funktion", "ueberwachung"], scheinwerferabdeckung: ["scheinwerfer", "abdeckung"], bremsdruckregler: ["bremsdruck", "regler"], kleidung: ["klei", "dung"], steckhuelse: ["steck", "huelse"], ausbauschritte: ["ausbau", "schritte"], zuruecklegen: ["zurueck", "legen"], abschlusswand: ["abschluss", "wand"], kunststoffklammer: ["kunststoff", "klammer"], scheinwerferabdeckungen: ["scheinwerfer", "abdeckungen"], freilegen: ["frei", "legen"], verkleidungsteile: ["verkleidung", "steile"], lampenfassung: ["lampen", "fassung"], verkleidungsteil: ["verkleidung", "steil"], beschleunigungsaufnehmers: ["beschleunigung", "aufnehmers"], laengsrichtung: ["laengs", "richtung"], quecksilberschalter: ["quecksilber", "schalter"], rueckwaertsfahrt: ["rueckwaerts", "fahrt"], fahrzustand: ["fahr", "zustand"], strassenhaftung: ["strasse", "haftung"], datenfelder: ["daten", "felder"], ausloesewinkel: ["ausloese", "winkel"], vorwaertsschaltpunkts: ["vorwaerts", "schaltpunkt"], waagerechten: ["waage", "rechten"], waagerechter: ["waage", "rechter"], quecksilberfuellung: ["quecksilber", "fuellung"], glasrohr: ["glas", "rohr"], bremsverzoegerungswert: ["bremsverzoegerung", "wert"], vorwaertsfahrt: ["vorwaerts", "fahrt"], fahrbahnzustand: ["fahrbahn", "zustand"], schaltzustand: ["schalt", "zustand"], datenfeldern: ["daten", "feldern"], mittelachssperre: ["mitte", "lachs", "sperre"], leitungssatz: ["leitung", "satz"], schaltpunkts: ["schalt", "punkts"], montagepunkte: ["montage", "punkte"], massgebenden: ["mass", "gebenden"], werkstattboden: ["werkstatt", "boden"], sollwerttabelle: ["sollwert", "tabelle"], maximalwert: ["maximal", "wert"], minimale: ["mini", "male"], minimalwert: ["minimal", "wert"], montagepunkt: ["montage", "punkt"], schraubenkoepfe: ["schraube", "koepfe"], schaltpunkttoleranz: ["schaltpunkt", "toleranz"], ausgleichsscheibenbereichs: ["ausgleichs", "scheibenbereichs"], kabelfuehrung: ["kabel", "fuehrung"], impulsraedern: ["impuls", "raedern"], lampenhalter: ["lampen", "halter"], steuereinheit: ["steuer", "einheit"], versorgungsklemmen: ["versorgung", "klemmen"], ladekontrollsignal: ["lade", "kontrollsignal"], rueckfoerderpumpenmotor: ["rueckfoerderpumpe", "motor"], steckplatzbezeichnungen: ["steckplatz", "bezeichnungen"], raddrehzahlsensors: ["raddrehzahl", "sensors"], hydraulikventil: ["hydraulik", "ventil"], ruecklaufpumpe: ["ruecklauf", "pumpe"], schrittweiser: ["schritt", "weiser"], motordrehzahlanhebung: ["motordrehzahl", "anhebung"], beschleunigungsgeber: ["beschleunigung", "geber"], hydrauliksteuergeraet: ["hydraulik", "steuergeraet"], steuergeraeteanschluesse: ["steuergeraete", "anschluesse"], batterieanschluesse: ["batterie", "anschluesse"], sensorwiderstaende: ["sensor", "widerstaende"], fehlerzuordnungen: ["fehler", "zuordnungen"], ueberspannungsschutzrelais: ["ueberspannung", "schutzrelais"], einzelpruefungen: ["einzel", "pruefungen"], isolationswiderstand: ["isolation", "widerstand"], steckplatz: ["steck", "platz"], hydraulikventile: ["hydraulik", "ventile"], betroffener: ["betr", "offener"], ventilwiderstand: ["ventil", "widerstand"], kabelbaumadapter: ["kabelbaum", "adapter"], fehlerbehebung: ["fehler", "behebung"], zykluszeit: ["zyklus", "zeit"], impulsverhalten: ["impuls", "verhalten"], geschwindigkeitssensors: ["geschwindigkeit", "sensors"], gegenueberliegendes: ["gegenueber", "liegendes"], fehlersuch: ["fehler", "such"], spannungsabfaelle: ["spannung", "abfaelle"], sicherheitskreis: ["sicherheit", "kreis"], elektronikrelais: ["elektronik", "relais"], ruhekontakt: ["ruhe", "kontakt"], uebergangswiderstand: ["uebergangs", "widerstand"], mehrfachsteckverbindung: ["mehrfach", "steckverbindung"], arbeitskontakt: ["arbeit", "kontakt"], masseklemmen: ["masse", "klemmen"], pumpenmotors: ["pumpen", "motors"], ueberspannungsschutz: ["ueberspannung", "schutz"], testzyklus: ["test", "zyklus"], fehlersimulationspruefungen: ["fehler", "simulation", "pruefungen"], batteriekonsole: ["batterie", "konsole"], laufenden: ["lauf", "enden"], fehlersimulation: ["fehler", "simulation"], hydrauliksteuerung: ["hydraulik", "steuerung"], druckhaltephasen: ["druck", "haltephasen"], spezieller: ["spezi", "eller"], batterieladezustand: ["batterie", "ladezustand"], druckhaltepruefung: ["druck", "halte", "pruefung"], schaltphase: ["schalt", "phase"], vorausgesetzter: ["voraus", "gesetzter"], konventionellen: ["konvention", "ellen"], arbeitspositionsnummer: ["arbeit", "positionsnummer"], konventionelle: ["konvention", "elle"], bremsleitungsanschluesse: ["bremsleitung", "anschluesse"], belastungszeit: ["belastung", "zeit"], arbeitspositionscode: ["arbeit", "positionscode"], rollenpruefstands: ["rollen", "pruefstand"], gleichmaessigen: ["gleich", "maessigen"], zentraldifferenzialsperre: ["zentral", "differenzialsperre"], zeitliche: ["zeit", "lich"], wiederholtem: ["wied", "erholtem"], betriebsspannung: ["betriebs", "spannung"], magnetventilmasse: ["magnetventil", "masse"], stehenden: ["steh", "enden"], sensorkabel: ["sensor", "kabel"], beschleunigungsgebers: ["beschleunigung", "gebers"], sensorfehler: ["sensor", "fehler"], werkstatthandbuchgruppe: ["werkstatthandbuch", "gruppe"], pedaltraeger: ["pedal", "traeger"], gaspedalbetaetigung: ["gaspedal", "betaetigung"], arbeitspositions: ["arbeit", "position"], kickdown: ["kick", "down"], kickdownschalter: ["kickdown", "schalter"], masszeichnungen: ["mass", "zeichnungen"], betaetigungsgeometrie: ["betaetigung", "geometrie"], bauteillage: ["bauteil", "lage"], pedalgeometrie: ["pedal", "geometrie"], pedalabstaende: ["pedal", "abstaende"], masszeichnung: ["mass", "zeichnung"], pedalbereichs: ["pedal", "bereichs"], fahrpedal: ["fahr", "pedal"], halterungsteilen: ["halterung", "steilen"], masspfeile: ["mass", "pfeile"], pedalabstand: ["pedal", "abstand"], pedalhalterung: ["pedal", "halterung"], pedalbetaetigung: ["pedal", "betaetigung"], pedalgrundplatteneinheit: ["pedal", "grundplatte", "einheit"], fahrerfussraum: ["fahrer", "fussraum"], bremsbetaetigungswelle: ["bremsbetaetigung", "welle"], armaturenbrettverkleidung: ["armaturenbrett", "verkleidung"], gewindestift: ["gewinde", "stift"], setscrew: ["sets", "crew"], pedaltraegers: ["pedal", "traegers"], bremspedalbolzens: ["bremspedal", "bolzens"], pedalanordnung: ["pedal", "anordnung"], einstellmasse: ["eins", "tell", "masse"], ersatzweise: ["ersatz", "weise"], einstellvorschrift: ["eins", "tell", "vorschrift"], pedalwelle: ["pedal", "welle"], gegenueberliegt: ["gegenueber", "liegt"], zwischenstellung: ["zwischen", "stellung"], spritzgegossenen: ["spritz", "gegossenen"], fertigmass: ["fertig", "mass"], pedalaufnahmen: ["pedal", "aufnahmen"], buchsenlage: ["buchs", "lage"], spritzgegossener: ["spritz", "gegossener"], spritzgegossene: ["spritz", "gegossene"], gaspedalhebel: ["gaspedal", "hebel"], gaspedalhebels: ["gaspedal", "hebels"], clipverriegelung: ["clip", "verriegelung"], herausrutschen: ["heraus", "rutschen"], halteclip: ["halte", "clip"], gaspedalwelle: ["gaspedal", "welle"], teppichboden: ["teppich", "boden"], herausschieben: ["heraus", "schieben"], pedalhebel: ["pedal", "hebel"], motorraumwand: ["motorraum", "wand"], betaetigungsnippels: ["betaetigung", "nippels"], gummipuffers: ["gummi", "puffers"], betaetigungsnippel: ["betaetigung", "nippel"], kickdownschalters: ["kickdown", "schalters"], spielfreie: ["spiel", "freie"], vollgasanschlag: ["vollgas", "anschlag"], druckpunkt: ["druck", "punkt"], kontermuttern: ["konter", "muttern"], einstellvorschriften: ["eins", "tell", "vorschriften"], leerlaufstellung: ["leerlauf", "stellung"], startvorrichtung: ["start", "vorrichtung"], vollgasstellung: ["vollgas", "stellung"], gaspedalplatte: ["gaspedal", "platte"], vollgasanschlags: ["vollgas", "anschlags"], feinwuchten: ["fein", "wuchten"], haltegabel: ["halte", "gabel"], zusatzgabel: ["zusatz", "gabel"], werkstattausruestungsplanung: ["werkstatt", "ausruestungsplanung"], aussenseite: ["aussen", "seite"], kreidemarkierung: ["kreide", "markierung"], gehoerenden: ["gehoer", "enden"], betonboden: ["beton", "boden"], haltevorrichtung: ["halte", "vorrichtung"], vorderraedern: ["vorder", "raedern"], mitlaufenden: ["mitlauf", "enden"], wagenhebers: ["wagen", "hebers"], aufstellflaeche: ["aufs", "tell", "flaeche"], kofferraumklappe: ["kofferraum", "klappe"], heckabschlussblech: ["heckabschluss", "blech"], gleichartige: ["gleich", "artige"], verschiebemoeglichkeit: ["verschiebe", "moeglichkeit"], supports: ["supp", "orts"], radaufhaengungspunkten: ["radaufhaengung", "punkten"], werkstatthebern: ["werkstatt", "hebern"], hebebuehnenarme: ["hebebuehne", "arme"], keinesfalls: ["keine", "falls"], aufnahmegabeln: ["aufnahme", "gabeln"], zusatzgabeln: ["zusatz", "gabeln"], werkstattausruestung: ["werkstatt", "ausruestung"], resonanzschwingungen: ["resonanz", "schwingungen"], resonanzschwingung: ["resonanz", "schwingung"], reifenposition: ["reifen", "position"], feinwuchtgeraets: ["fein", "wucht", "geraets"], stahlseil: ["stahl", "seil"], feinwuchtgeraet: ["fein", "wucht", "geraet"], empfindlichkeitsgrad: ["empfindlichkeit", "grad"], anzeigefeld: ["anzeige", "feld"], zentriervorrichtungen: ["zentrier", "vorrichtungen"], zentriervorrichtung: ["zentrier", "vorrichtung"], grundflansch: ["grund", "flansch"], typenflansch: ["typen", "flansch"], seitenflaeche: ["seiten", "flaeche"], reifenbeschriftung: ["reifen", "beschriftung"], reifenlaufflaeche: ["reifen", "laufflaeche"], radschraubengewinden: ["radschraube", "gewinden"], kegelflaechen: ["kegel", "flaechen"], spannfehler: ["spann", "fehler"], radschraubengewinde: ["radschraube", "gewinde"], zentrierbund: ["zentrier", "bund"], stahlscheibe: ["stahl", "scheibe"], freigaengigkeit: ["frei", "gaengigkeit"], belagfederhalter: ["belag", "federhalter"], leichtmetallfelgen: ["leichtmetall", "felgen"], kegelflaeche: ["kegel", "flaeche"], wuchtgeraet: ["wucht", "geraet"], spannmittels: ["spann", "mittels"], stahlfelgen: ["stahl", "felgen"], schmutzablagerungen: ["schmutz", "ablagerungen"], standplatten: ["stand", "platten"], wuchtmaschine: ["wucht", "maschine"], zentrierstueck: ["zentrier", "stueck"], planungsunterlagen: ["planung", "unterlagen"], reifenseitenwand: ["reifen", "seitenwand"], reifenklammer: ["reifen", "klammer"], aluminiumfelge: ["aluminium", "felge"], stahlfelge: ["stahl", "felge"], felgenbett: ["felge", "bett"], hoehenschlags: ["hoehen", "schlags"], felgenhoerner: ["felgen", "hoerner"], felgenbetts: ["felge", "betts"], zentrierzubehoers: ["zentrier", "zubehoers"], spannfehlern: ["spann", "fehlern"], zentrierdorn: ["zentrier", "dorn"], felgenhoernern: ["felgen", "hoernern"], schlauchlose: ["schlauch", "lose"], stufenweisen: ["stufen", "weisen"], reifenwulstes: ["reifen", "wulstes"], reifenmontage: ["reifen", "montage"], bedienungsanweisungen: ["bedienung", "anweisungen"], reifenwulst: ["reife", "wulst"], tiefbett: ["tief", "bett"], reifenmontagepaste: ["reifen", "montagepaste"], ventileinsatz: ["ventil", "einsatz"], schlauchlosen: ["schlauch", "losen"], wulstumfangs: ["wulst", "umfangs"], wulstfusses: ["wulst", "fusses"], wulstfuss: ["wulst", "fuss"], felgenschulter: ["felgen", "schulter"], stufenweise: ["stufe", "weise"], sprungdruck: ["sprung", "druck"], fuelldrucks: ["fuell", "drucks"], reifenwuelste: ["reifen", "wuelste"], fuelldruck: ["fuell", "druck"], setzdruck: ["setz", "druck"], sonderausruestung: ["sonder", "ausruestung"], felgentypen: ["felge", "typen"], reifenschaeden: ["reifen", "schaeden"], hinweisnummern: ["hinweis", "nummern"], schlauchloser: ["schlauch", "loser"], montagekopf: ["montage", "kopf"], montagefinger: ["montage", "finger"], reifenhebern: ["reifen", "hebern"], ventilposition: ["ventil", "position"], ausgleichsgewichte: ["ausgleich", "gewichte"], montagesaeule: ["montage", "saeule"], felgenrand: ["felge", "rand"], klemmhebel: ["klemm", "hebel"], montagekopfes: ["montage", "kopfes"], reifenheber: ["reife", "heber"], zuruecklaufen: ["zurueck", "laufen"], wulstklemmen: ["wulst", "klemmen"], wulstklemme: ["wulst", "klemme"], ausgleichsgewicht: ["ausgleich", "gewicht"], montagepaste: ["montage", "paste"], setzdruecke: ["setz", "druecke"], spannklauen: ["spann", "klauen"], montagefingers: ["montage", "fingers"], stattdessen: ["statt", "dessen"], fotografisch: ["foto", "grafisch"], schweisspunkte: ["schweiss", "punkte"], fuegeflaechen: ["fuege", "flaechen"], abschlussblechs: ["abschluss", "blechs"], innenausstattungs: ["innen", "ausstattung"], dachlackierung: ["dach", "lackierung"], regenleiste: ["regen", "leiste"], hintertuer: ["hinter", "tuer"], einstiegsleisten: ["einstieg", "leisten"], bodenbelag: ["boden", "belag"], oeffnungsabschlussplatte: ["oeffnung", "abschluss", "platte"], dachlacks: ["dach", "lacks"], hitzeschutzpaste: ["hitzeschutz", "paste"], restblech: ["rest", "blech"], restlichen: ["rest", "lichen"], punktschweissen: ["punkt", "schweissen"], zinkstaubfarbe: ["zinkstaub", "farbe"], fuegestellen: ["fuege", "stellen"], dachrahmen: ["dach", "rahmen"], seitentraegern: ["seiten", "traegern"], karosserieinstandsetzung: ["karosserie", "instandsetzung"], lochpunktschweissungen: ["lochpunkt", "schweissungen"], tuerspalte: ["tuer", "spalte"], punktschweissverbindungen: ["punkt", "schweissverbindungen"], bodenanschluss: ["boden", "anschluss"], lochpunktschweissen: ["lochpunkt", "schweissen"], festspannen: ["fests", "pannen"], spaltmasse: ["spalt", "masse"], abschlussblech: ["abschluss", "blech"], schutzgasschweissen: ["schutzgas", "schweissen"], deckblech: ["deck", "blech"], seitentraegers: ["seiten", "traegers"], karosseriefuegestellen: ["karosserie", "fuege", "stellen"], seitentraeger: ["seiten", "traeger"], fugendichtmasse: ["fugen", "dichtmasse"], waermeschutzpaste: ["waermeschutz", "paste"], dachblechs: ["dach", "blechs"], hartloeten: ["hart", "loeten"], hartloetstelle: ["hart", "loetstelle"], dachblech: ["dach", "blech"], lackoberflaeche: ["lack", "oberflaeche"], dachstrebe: ["dachs", "trebe"], heraustrennen: ["heraus", "trennen"], ersatzteil: ["ersatz", "teil"], aussenteil: ["aussen", "teil"], einstiegsabdeckleisten: ["einstiegs", "abdeckleisten"], einstiegsbereich: ["einstieg", "bereich"], schweisspunkt: ["schweiss", "punkt"], lochpunkt: ["loch", "punkt"], hartloetverbindungen: ["hart", "loetverbindungen"], seitenholm: ["seit", "holm"], schutzpaste: ["schutz", "paste"], lochpunktgeschweisste: ["lochpunkt", "geschweisste"], seitenholmabdeckung: ["seitenholm", "abdeckung"], hartloetverbindung: ["hart", "loetverbindung"], formleiste: ["form", "leiste"], lochpunktschweissverbindung: ["lochpunkt", "schweissverbindung"], seitenteil: ["seit", "teil"], nahtabdichtung: ["naht", "abdichtung"], karosserieverbindung: ["karosserie", "verbindung"], blechstosses: ["blech", "stosses"], nahtabdichtmasse: ["naht", "abdichtmasse"], seitenblech: ["seite", "blech"], vorbereitungsarbeiten: ["vorbereitung", "arbeiten"], punktschweissungen: ["punkt", "schweissungen"], anschlussflaechen: ["anschluss", "flaechen"], ersatzteils: ["ersatz", "teils"], zierleiste: ["zier", "leiste"], einstiegsleistenabdeckung: ["einstiegsleiste", "abdeckung"], einstiegsleistenblech: ["einstiegsleiste", "blech"], instrumentenbrettverkleidung: ["instrumentenbrett", "verkleidung"], beifahrerfussraumabdeckung: ["beifahrer", "fussraum", "abdeckung"], wasserkastenblech: ["wasserkasten", "blech"], gummirahmen: ["gummi", "rahmen"], schweissnaehte: ["schweiss", "naehte"], punktschweissnaht: ["punkt", "schweissnaht"], punktschweissung: ["punkt", "schweissung"], korrosionsschutzbehandeln: ["korrosionsschutz", "behandeln"], tuerspalt: ["tuer", "spalt"], flaechenbuendigkeit: ["flaechen", "buendigkeit"], tueroeffnung: ["tuer", "oeffnung"], auflageflaeche: ["auflage", "flaeche"], windlaufblech: ["wind", "lauf", "blech"], fuegeflaeche: ["fuege", "flaeche"], teilersatzstueck: ["teiler", "satzstueck"], teilersatzstuecks: ["teiler", "satzstuecks"], wasserkastenblechs: ["wasserkasten", "blechs"], verbindungsbereiche: ["verbindung", "bereiche"], aussenkante: ["aussen", "kante"], teilersatz: ["teil", "ersatz"], schutzgasverfahren: ["schutzgas", "verfahren"], karosseriebereiche: ["karosserie", "bereiche"], karosseriebereichen: ["karosserie", "bereichen"], ausfuehrungshinweise: ["ausfuehrung", "hinweise"], radausschnitt: ["radau", "schnitt"], bohrarbeiten: ["bohr", "arbeiten"], dachstreben: ["dachs", "trebe"], fahrzeugteile: ["fahrzeug", "teile"], windlauf: ["wind", "lauf"], stossstange: ["stoss", "stange"], druckfrei: ["druck", "frei"], dachrahmens: ["dach", "rahmens"], deckplatte: ["deck", "platte"], hartgeloetete: ["hart", "geloetete"], aussendachblech: ["aussen", "dach", "blech"], karosserieblech: ["karosserie", "blech"], reparaturblech: ["reparatur", "blech"], reparaturfotos: ["reparatur", "fotos"], karosserieblechs: ["karosserie", "blechs"], reparaturblechs: ["reparatur", "blechs"], windlaufblechs: ["wind", "lauf", "blechs"], schweissflaechen: ["schweiss", "flaechen"], heftverschweissung: ["heft", "verschweissung"], karosserieoeffnung: ["karosserie", "oeffnung"], punktverschweissen: ["punkt", "verschweissen"], gummistuecken: ["gummis", "tuecken"], verbleibendes: ["verbleib", "endes"], heftschweissen: ["heft", "schweissen"], karosserieaufnahmen: ["karosserie", "aufnahmen"], aussendachblechs: ["aussen", "dach", "blechs"], schutzgasschweissungen: ["schutzgas", "schweissungen"], seitenrahmenbleche: ["seitenrahmen", "bleche"], karosseriefotos: ["karosserie", "fotos"], seitenrahmenblechen: ["seitenrahmen", "blechen"], hartloetungen: ["hart", "loetungen"], metallflaechen: ["metall", "flaechen"], seitenrahmen: ["seiten", "rahmen"], seitenwandblech: ["seitenwand", "blech"], metallteile: ["metall", "teile"], lochpunktschweissung: ["lochpunkt", "schweissung"], schutzgasschweissung: ["schutzgas", "schweissung"], dachhaut: ["dach", "haut"], dachrahmenbereichs: ["dachrahmen", "bereichs"], dachrahmenabschnitte: ["dachrahmen", "abschnitte"], dachrahmenabschnitten: ["dachrahmen", "abschnitten"], windschutzscheibenoeffnung: ["windschutzscheibe", "oeffnung"], dachrahmenbereiche: ["dachrahmen", "bereiche"], gummirahmens: ["gummi", "rahmens"], karosserieoeffnungsrand: ["karosserie", "oeffnung", "rand"], dachverstrebungen: ["dach", "verstrebungen"], heckscheibe: ["heck", "scheibe"], fondverkleidungen: ["fond", "verkleidungen"], seitenscheiben: ["seiten", "scheiben"], sonnenblenden: ["sonnen", "blenden"], kantenschutz: ["kanten", "schutz"], innenspiegel: ["innen", "spiegel"], haltegriffe: ["halte", "griffe"], dachzierleisten: ["dach", "zierleisten"], fensterausschnitt: ["fenster", "ausschnitt"], heckscheibenrahmen: ["heckscheibe", "rahmen"], punktgeschweisste: ["punkt", "geschweisste"], rollschweissnaht: ["roll", "schweissnaht"], blechreste: ["blech", "reste"], dachverstrebung: ["dach", "verstrebung"], dachquertraeger: ["dach", "quertraeger"], karosseriereparatur: ["karosserie", "reparatur"], windschutzscheiben: ["windschutz", "scheiben"], heckscheiben: ["heck", "scheiben"], gummirahmenstuecken: ["gummi", "rahmenstuecken"], karosserieoeffnungen: ["karosserie", "oeffnungen"], heckscheibenoeffnung: ["heckscheibe", "oeffnung"], dachleisten: ["dach", "leisten"], dachquertraegers: ["dach", "quertraegers"], windlaufverbindungen: ["wind", "lauf", "verbindungen"], schutzgasschweissgeraet: ["schutzgas", "schweissgeraet"], karosseriedichtmasse: ["karosserie", "dichtmasse"], dachleiste: ["dach", "leiste"], windlaufverbindung: ["wind", "lauf", "verbindung"], scheibenoeffnung: ["scheiben", "oeffnung"], windlaufbereichs: ["wind", "laufbereichs"], glasscheibe: ["glas", "scheibe"], punktfoermig: ["punkt", "foermig"], frontwand: ["front", "wand"], korrosionsschutzes: ["korrosion", "schutzes"], frontwandaufbau: ["frontwand", "aufbau"], scharnieren: ["schar", "nieren"], kuehlergrill: ["kuehler", "grill"], signalhoerner: ["signal", "hoerner"], haubenschloss: ["hauben", "schloss"], schweissnaht: ["schweiss", "naht"], motortraegerabschnitt: ["motortraeger", "abschnitt"], vorderwand: ["vorder", "wand"], karosseriewand: ["karosserie", "wand"], restblechen: ["rest", "blechen"], lochschweissungen: ["loch", "schweissungen"], massangabe: ["mass", "angabe"], zinkfarbe: ["zink", "farbe"], karosseriebereichs: ["karosserie", "bereichs"], lochschweissung: ["loch", "schweissung"], fotografischer: ["foto", "grafischer"], ersatzteilflaechen: ["ersatzteil", "flaechen"], alternative: ["alter", "native"], schnittfuehrung: ["schnitt", "fuehrung"], rueckleuchtenoeffnung: ["rueckleuchte", "oeffnung"], schliesszylinder: ["schliess", "zylinder"], kofferraumdeckeldichtung: ["kofferraum", "deckeldichtung"], kofferraummatte: ["kofferraum", "matte"], heckabschlussblechs: ["heckabschluss", "blechs"], zurueckschneiden: ["zurueck", "schneiden"], blechkante: ["blech", "kante"], stossfaengerhalter: ["stossfaenger", "halter"], autogenschweissungen: ["autogen", "schweissungen"], kofferraumboden: ["kofferraum", "boden"], karosserieblechen: ["karosserie", "blechen"], kofferraumbodenblech: ["kofferraum", "bodenblech"], autogenschweissgeraet: ["autogen", "schweissgeraet"], heckbereich: ["heck", "bereich"], verstaerkungsecke: ["verstaerkung", "ecke"], schweissstellen: ["schweiss", "stellen"], dachverbindung: ["dach", "verbindung"], anschlussbereichen: ["anschluss", "bereichen"], bearbeitungsschritte: ["bearbeitung", "schritte"], rueckleuchteneinheit: ["rueckleuchte", "einheit"], kofferraummatten: ["kofferraum", "matten"], kofferraumverkleidung: ["kofferraum", "verkleidung"], heckblechverkleidung: ["heckblech", "verkleidung"], ruecksitzlehne: ["ruecksitz", "lehne"], tuersaeulenverkleidung: ["tuer", "saeulen", "verkleidung"], tuerschwellerleisten: ["tuerschweller", "leisten"], tuerschliessbuegel: ["tuer", "schliess", "buegel"], luftaustrittsblende: ["luftaustritt", "blende"], radhausabdeckung: ["radhaus", "abdeckung"], heckblech: ["heck", "blech"], dachbereich: ["dach", "bereich"], arbeitsschrittfolge: ["arbeit", "schrittfolge"], schnittlinien: ["schnitt", "linien"], hartgeloeteten: ["hart", "geloeteten"], seitenteils: ["seite", "teils"], fensterrahmen: ["fenster", "rahmen"], karosserieabbildungen: ["karosserie", "abbildungen"], fensterrahmens: ["fenster", "rahmens"], tuerspalts: ["tuer", "spalts"], einstiegsverbindung: ["einstiegs", "verbindung"], seitenrahmenverstaerkung: ["seitenrahmen", "verstaerkung"], fuegeverfahren: ["fuege", "verfahren"], spaltkontrolle: ["spalt", "kontrolle"], einstiegsabdeckleiste: ["einstiegs", "abdeckleiste"], dachstoss: ["dach", "stoss"], autogenschweissarbeiten: ["autogen", "schweissarbeiten"], heckscheibenrahmens: ["heckscheibe", "rahmens"], schweissraupe: ["schweiss", "raupe"], verbindungsstueck: ["verbindung", "stueck"], radausschnitts: ["radau", "schnitts"], punktgeschweissten: ["punkt", "geschweissten"], seitenteilunterseite: ["seitenteil", "unterseite"], fuegestelle: ["fuege", "stelle"], punktgeschweisster: ["punkt", "geschweisster"], stossbearbeitung: ["stoss", "bearbeitung"], fensterlinie: ["fenster", "linie"], festzulegenden: ["fest", "zulegenden"], heckblechs: ["heck", "blechs"], kofferraumseitenwand: ["kofferraum", "seitenwand"], kofferraumwandverkleidung: ["kofferraum", "wandverkleidung"], seitenscheibe: ["seiten", "scheibe"], heckklappe: ["heck", "klappe"], einstiegsleiste: ["einstieg", "leiste"], tuerdichtung: ["tuer", "dichtung"], entlueftungsblech: ["entlueftung", "blech"], scheuerleiste: ["scheuer", "leiste"], bodenbaugruppe: ["bodenbau", "gruppe"], schnittlinie: ["schnitt", "linie"], festlegen: ["fest", "legen"], kofferraumseitenwandbereich: ["kofferraum", "seitenwand", "bereich"], fuehrungsblech: ["fuehrung", "blech"], zwangsentlueftung: ["zwangs", "entlueftung"], luftleitblechs: ["luft", "leitblech"], verstaerkungsblechs: ["verstaerkung", "blechs"], zinkstaublack: ["zinkstaub", "lack"], luftleitblech: ["luft", "leitblech"], saeulenabschnitten: ["saeulen", "abschnitten"], verstaerkungsblech: ["verstaerkung", "blech"], luftleitblechen: ["luft", "leitblechen"], tankstutzen: ["tank", "stutzen"], luftleitbleche: ["luft", "leitbleche"], tankstutzens: ["tank", "stutzens"], schweissbefestigung: ["schweiss", "befestigung"], seitenblechs: ["seiten", "blechs"], kofferraumdeckelspalt: ["kofferraumdeckel", "spalt"], schweissverbindungen: ["schweiss", "verbindungen"], einstiegskante: ["einstieg", "kante"], kofferraumoeffnung: ["kofferraum", "oeffnung"], schutzgasschweissverbindung: ["schutzgas", "schweissverbindung"], kofferraumoeffnungskante: ["kofferraum", "oeffnung", "kante"], autogenschweissung: ["autogen", "schweissung"], verbindungsblechs: ["verbindung", "blechs"], verbindungsblech: ["verbindung", "blech"], verbindungsplatte: ["verbindung", "platte"], aussenflaechen: ["aussen", "flaechen"], radhausausschnitts: ["radhaus", "ausschnitts"], karosseriedichtmittel: ["karosserie", "dichtmittel"], fotocodes: ["foto", "codes"], radhausausschnitt: ["radhaus", "ausschnitt"], teilweisen: ["teil", "weisen"], lackausbesserung: ["lack", "ausbesserung"], rueckleuchtengehaeuse: ["rueckleuchte", "gehaeuse"], tuerkantenabdeckung: ["tuer", "kanten", "abdeckung"], radhausrands: ["radhaus", "rand"], dichtmaterial: ["dicht", "material"], verstaerkungsstreifens: ["verstaerkung", "streifens"], verstaerkungsstreifen: ["verstaerkung", "streifen"], werkstattaufnahmen: ["werkstatt", "aufnahmen"], kofferraumdeckelspaltmasse: ["kofferraumdeckel", "spaltmasse"], tuerausschnitt: ["tuer", "ausschnitt"], heckfensterrahmen: ["heckfenster", "rahmen"], tuerspaltmasse: ["tuerspalt", "masse"], nachbearbeitungsschritte: ["nachbearbeitung", "schritte"], kofferraumdeckeloeffnung: ["kofferraum", "deckeloeffnung"], verstaerkungsarbeiten: ["verstaerkung", "arbeiten"], radhausoeffnung: ["radhaus", "oeffnung"], kofferraumbodens: ["kofferraum", "bodens"], blechbearbeitung: ["blech", "bearbeitung"], fotosequenz: ["foto", "sequenz"], festgelegten: ["fest", "gelegten"], herausgetrennten: ["heraus", "getrennten"], restblechs: ["rest", "blechs"], teilweiser: ["teil", "weiser"], zierblende: ["zier", "blende"], kennzeichenblende: ["kennzeichen", "blende"], tankausbau: ["tank", "ausbau"], radhausabdeckblech: ["radhaus", "abdeckblech"], tankstutzeneinfuellrohr: ["tankstutzen", "einfuellrohr"], seitenteilabschnitt: ["seitenteil", "abschnitt"], teilreparatur: ["teil", "reparatur"], anschlussbereiche: ["anschluss", "bereiche"], stossschweissung: ["stoss", "schweissung"], schweissprimer: ["schweiss", "primer"], anschlussflaeche: ["anschluss", "flaeche"], karosseriebleche: ["karosserie", "bleche"], stossschweissen: ["stoss", "schweissen"], tankstutzenbereich: ["tankstutzen", "bereich"], punktschweissfarbe: ["punkt", "schweiss", "farbe"], fuegeflaechenverbindung: ["fuege", "flaechen", "verbindung"], verstaerkungsstellen: ["verstaerkung", "stellen"], anschlussfuge: ["anschluss", "fuge"], anschlussfugen: ["anschluss", "fugen"], teilbereiche: ["teil", "bereiche"], seitenwandverstaerkung: ["seitenwand", "verstaerkung"], karosseriearbeiten: ["karosserie", "arbeiten"], blechbearbeitungen: ["blech", "bearbeitungen"], geraeuschschutzmittel: ["geraeusch", "schutzmittel"], punktschweissflansch: ["punkt", "schweiss", "flansch"], reparaturhinweise: ["reparatur", "hinweise"], glasfaserverstaerkte: ["glasfaser", "verstaerkte"], kunststoffteile: ["kunst", "stoffteile"], motortraegerabschnitte: ["motortraeger", "abschnitte"], karosserien: ["karos", "serien"], fahrgestellnummern: ["fahrgestell", "nummern"], karosserieteilen: ["karosserie", "teilen"], glasfaserverstaerktem: ["glasfaser", "verstaerktem"], glasfaserverstaerkten: ["glasfaser", "verstaerkten"], aussenblech: ["aussen", "blech"], verstaerkungsrippen: ["verstaerkung", "rippen"], teilaustausch: ["teil", "austausch"], mittelteil: ["mittel", "teil"], glasfaserverstaerkter: ["glasfaser", "verstaerkter"], laminatschaeden: ["laminat", "schaeden"], karosseriegruppe: ["karosserie", "gruppe"], aussenbereich: ["aussen", "bereich"], karosseriebauteile: ["karosserie", "bauteile"], karosseriekapitels: ["karosserie", "kapitels"], frontblech: ["front", "blech"], vorderblech: ["vorder", "blech"], tuerscharnieren: ["tuer", "scharnieren"], zugelassene: ["zuge", "lassen"], fachkraefte: ["fach", "kraefte"], gewissenhaft: ["gewiss", "haft"], verantwortungsbewusstsein: ["verantwortung", "bewusstsein"], beschraenken: ["besch", "raenke"], zusammenhaengende: ["zusammen", "haengende"], arbeitshilfen: ["arbeit", "hilfen"], reparaturabschnitten: ["reparatur", "abschnitten"], schadensumfang: ["schade", "umfang"], punktschweissnaehte: ["punkt", "schweissnaehte"], schutzgasschweissnaehte: ["schutzgas", "schweissnaehte"], punktschweissens: ["punkt", "schweissens"], reparaturbereich: ["reparatur", "bereich"], masseanschlusspunkt: ["masse", "anschlusspunkt"], schweissstelle: ["schweiss", "stelle"], autogenschweissen: ["autogen", "schweissen"], einzelfall: ["einzel", "fall"], festzulegen: ["fest", "zulegen"], qualitaetskontrolle: ["qualitaet", "kontrolle"], schweissarbeiten: ["schweiss", "arbeiten"], schutzgasschweissnaht: ["schutzgas", "schweissnaht"], linkstraeger: ["links", "traeger"], unfallaehnlichen: ["unfall", "aehnlichen"], fahrbedingungen: ["fahr", "bedingungen"], originalzustand: ["original", "zustand"], dichtnaehte: ["dicht", "naehte"], blechteile: ["blech", "teile"], hohlraeume: ["hohl", "raeume"], dichtmaterialien: ["dicht", "materialien"], klebstoffe: ["kleb", "toff"], geschaeftsbereich: ["geschaeft", "bereich"], bodyshell: ["body", "hell"], karosseriearbeit: ["karosserie", "arbeit"], dellenbeseitigung: ["dellen", "beseitigung"], stahlblechen: ["stahl", "blechen"], fahrzeugbereichen: ["fahrzeug", "bereichen"], stahlblech: ["stahl", "blech"], verfahrenshinweise: ["verfahre", "hinweise"], gesundheitsschaedlichen: ["gesundheit", "schaedlichen"], nahtabdichtungsmasse: ["naht", "abdichtungsmasse"], stahlbuerste: ["stahl", "buerste"], korrosionsfoerdernde: ["korrosion", "foerdernde"], salzsaeure: ["salz", "saeure"], gesundheitsschaedliche: ["gesundheit", "schaedliche"], freigesetzt: ["frei", "gesetzt"], unterbodenschutz: ["unterboden", "schutz"], feuerverzinktes: ["feuer", "verzinktes"], elektrolytisch: ["elektro", "lytisch"], korrosionsgefaehrdet: ["korrosion", "gefaehrdet"], zinkoxid: ["zink", "oxid"], schweissbereich: ["schweiss", "bereich"], leistungsfaehige: ["leistung", "faehige"], zinkbeschichtung: ["zink", "beschichtung"], widerstandspunktschweissen: ["widerstands", "punktschweissen"], widerstandspunktschweissverfahren: ["widerstand", "punkt", "schweissverfahren"], schweissstrom: ["schweiss", "strom"], elektrodenkontaktkraft: ["elektroden", "kontaktkraft"], probestueck: ["probe", "stueck"], punktschweissstellen: ["punkt", "schweissstellen"], geringeren: ["gering", "eren"], waermeausbreitung: ["waerme", "ausbreitung"], zinkrueckstaende: ["zink", "rueckstaende"], schweissrauch: ["schweiss", "rauch"], crashsensoren: ["crash", "sensoren"], lenkradverkleidungsteil: ["lenkradverkleidung", "steil"], laengsachse: ["laengs", "achse"], reparaturanweisungen: ["reparatur", "anweisungen"], elektroschweissgeraet: ["elektro", "schweissgeraet"], batteriepole: ["batterie", "pole"], prallschale: ["prall", "schale"], prallpolster: ["prall", "polster"], zuendpille: ["zuend", "pille"], kontaktring: ["kontakt", "ring"], sicherungsschalter: ["sicherung", "schalter"], sicherungssensor: ["sicherung", "sensor"], knieprallpolster: ["knie", "prall", "polster"], karosserieflucht: ["karosserie", "flucht"], draufsichten: ["drauf", "sichten"], massgeblichen: ["mass", "geblichen"], diagonalmassen: ["diagonal", "massen"], instandsetzungen: ["instand", "setzungen"], richtbankaufnahmen: ["richtbank", "aufnahmen"], rahmenausrichtung: ["rahmen", "ausrichtung"], fachgerecht: ["fach", "gerecht"], laengsmass: ["laengs", "mass"], quermass: ["quer", "mass"], diagonalmass: ["diagonal", "mass"], allradgetriebene: ["allrad", "getriebene"], bezugspunkten: ["bezugs", "punkten"], vorderachsaufnahme: ["vorder", "achsaufnahme"], hinterachsaufnahme: ["hinter", "achsaufnahme"], hoehenmassen: ["hoehen", "massen"], aufnahmeadaptern: ["aufnahme", "adaptern"], karosserieaufbau: ["karosserie", "aufbau"], abstandhalter: ["abstand", "halter"], nummernstempel: ["nummern", "stempel"], karosseriereparaturen: ["karosserie", "reparaturen"], heizgeblaesemotors: ["heizgeblaese", "motors"], stempelfuehrung: ["stempel", "fuehrung"], werkstatt: ["werk", "tatt"], heizgeblaesemotor: ["heizgeblaese", "motor"], karosseriebauteilen: ["karosserie", "bauteilen"], werkstoffarten: ["werkstoff", "arten"], reparaturbeispiel: ["reparatur", "beispiel"], reparatursystems: ["reparatur", "systems"], bezugsquellen: ["bezugs", "quellen"], reparaturmethode: ["reparatur", "methode"], kunststoffteilen: ["kunststoff", "teilen"], serienfertigung: ["serien", "fertigung"], verarbeitungsverfahren: ["verarbeitung", "verfahren"], polyesterharz: ["polyester", "harz"], waermeeinwirkung: ["waerme", "einwirkung"], formbare: ["form", "bare"], faserfreie: ["faser", "freie"], glasfasern: ["glas", "fasern"], fuellstoffen: ["fuell", "stoffen"], spritzpressverfahren: ["spritz", "pressverfahren"], formbares: ["form", "bares"], loesungsmitteln: ["loesung", "mitteln"], russbildung: ["russ", "bildung"], winddruck: ["wind", "druck"], tragenden: ["trag", "enden"], innenelementen: ["innen", "elementen"], gewindeeinsaetzen: ["gewinde", "einsaetzen"], zweifelsfall: ["zweifel", "fall"], schadensbereiche: ["schadens", "bereiche"], reparatursystem: ["reparatur", "system"], mischfehler: ["misch", "fehler"], verarbeitungszeit: ["verarbeitung", "zeit"], sonneneinstrahlung: ["sonnen", "einstrahlung"], glasfaserplatten: ["glasfaser", "platten"], fuellstoff: ["fuell", "stoff"], aluminiumfolie: ["aluminium", "folie"], werkzeugbedarf: ["werkzeug", "bedarf"], handwerkzeuge: ["handwerk", "zeuge"], schleifwerkzeuge: ["schleifwerk", "zeuge"], materialoberflaeche: ["material", "oberflaeche"], kunststoffmaterialien: ["kunststoff", "materialien"], geschaeftssparte: ["geschaeft", "sparte"], plattenformmasse: ["platten", "formmasse"], formpressmasse: ["form", "pressmasse"], gewindeeinsaetze: ["gewinde", "einsaetze"], aussenhaut: ["aussen", "haut"], tragende: ["trag", "ende"], innenelemente: ["innen", "elemente"], polyesterharzen: ["polyester", "harzen"], persoenliche: ["perso", "lich"], schutzausruestung: ["schutz", "ausruestung"], arbeitshygiene: ["arbeit", "hygiene"], kunststoffreste: ["kunst", "stoffreste"], staubsauger: ["staub", "sauger"], schutzbrille: ["schutz", "brille"], atemschutzmaske: ["atemschutz", "maske"], handschuhe: ["hand", "schuhe"], regelmaessiges: ["regel", "maessiges"], haendewaschen: ["haende", "waschen"], lebensmitteln: ["lebens", "mitteln"], styrolhaltige: ["styrol", "haltig"], atemwege: ["atem", "wege"], jahrzehntelanger: ["jahrzehnte", "langer"], brandfall: ["brand", "fall"], wassernebel: ["wasser", "nebel"], wasserstrahl: ["wasser", "strahl"], trinkwasserversorgungssysteme: ["trinkwasser", "versorgungssysteme"], muellverbrennungsanlage: ["muellverbrennung", "anlage"], polyesterharze: ["polyester", "harze"], thermoplastische: ["thermo", "plastische"], kunststoffstossfaenger: ["kunststoff", "stossfaenger"], tragfaehigen: ["trag", "faehigen"], verbindungsflaechen: ["verbindung", "flaechen"], haftvermittlers: ["haft", "vermittlers"], reparaturbandage: ["reparatur", "bandage"], lichtempfindlichkeit: ["licht", "empfindlichkeit"], materials: ["mate", "rial"], aluminiumverpackung: ["aluminium", "verpackung"], beschreiben: ["besch", "reiben"], faserfreies: ["faser", "freies"], auslaufenden: ["auslauf", "enden"], kunststoffoberflaeche: ["kunststoff", "oberflaeche"], graphitbeschichtung: ["graphit", "beschichtung"], haftvermittler: ["haft", "vermittler"], aluminiumbeutel: ["aluminium", "beutel"], transparente: ["tran", "spar", "ente"], kunststofffolie: ["kunststoff", "folie"], gummiwalze: ["gummi", "walze"], kunststoffstreifen: ["kunststoff", "streifen"], lichthaertendem: ["licht", "haertendem"], reparaturstelle: ["reparatur", "stelle"], schichtweise: ["schicht", "weise"], materialstaerke: ["material", "staerke"], schattenbereichen: ["schatten", "bereichen"], glasfaserspachtel: ["glasfaser", "spachtel"], aushaertezeit: ["aushaerte", "zeit"], schichtdicke: ["schicht", "dicke"], selbstzerstoerung: ["selbst", "zerstoerung"], zeitweise: ["zeit", "weise"], ultraviolette: ["ultra", "violette"], oberflaechen: ["ober", "flaechen"], reparaturmaterial: ["reparatur", "material"], reparaturgewebe: ["reparatur", "gewebe"], zwischenschleifen: ["zwischen", "schleifen"], kantenform: ["kant", "form"], papierschablone: ["papier", "schablone"], laminatstelle: ["laminat", "stelle"], reparaturflaechen: ["reparatur", "flaechen"], reparaturflickens: ["reparatur", "flicken"], innenhaut: ["inne", "haut"], reparaturflicken: ["reparatur", "flicken"], gummirolle: ["gummi", "rolle"], lichthaertenden: ["licht", "haertenden"], ultraviolettlampe: ["ultraviolett", "lampe"], plattenteil: ["platt", "teil"], metallstueck: ["metall", "stueck"], hilfsmittel: ["hilf", "mittel"], ultraviolettstrahlung: ["ultraviolett", "strahlung"], reparaturmatten: ["reparatur", "matten"], reparaturmatte: ["reparatur", "matte"], kunststoffschaeden: ["kunststoff", "schaeden"], scharnierposition: ["scharnier", "position"], sicherungselement: ["sicherung", "element"], hintertueren: ["hinter", "tueren"], tuerscharniers: ["tuer", "scharniers"], flachdruecken: ["flach", "druecken"], tuerscharnier: ["tuer", "scharnier"], tuerhoehe: ["tuer", "hoehe"], freigelegter: ["frei", "gelegter"], windgeraeuschen: ["wind", "geraeuschen"], steinschaeden: ["stein", "schaeden"], grundeinstellungen: ["grund", "einstellungen"], feineinstellung: ["fein", "einstellung"], windgeraeusche: ["wind", "geraeusche"], schliessbuegel: ["schliess", "buegel"], tueraussenhaut: ["tuer", "aussenhaut"], tuerspaltmass: ["tuer", "spaltmass"], windgeraeusch: ["wind", "geraeusch"], steinschaden: ["stein", "schaden"], tuerschliessbuegels: ["tuer", "schliess", "buegels"], schliessbuegels: ["schliess", "buegels"], steinschlag: ["stein", "schlag"], tuerschlosses: ["tuer", "schlosses"], raststellung: ["rast", "stellung"], tuerausfuehrung: ["tuer", "ausfuehrung"], scharnierteile: ["scharnier", "teile"], teilekennzeichnungen: ["teile", "kennzeichnungen"], karosseriescharnier: ["karosserie", "scharnier"], scharnierstift: ["scharnier", "stift"], tuerscheibe: ["tuer", "scheibe"], zierrahmen: ["zier", "rahmen"], aussengriff: ["aussen", "griff"], betaetigungsmechanismus: ["betaetigung", "mechanismus"], tuerbremse: ["tuer", "bremse"], scharniere: ["schar", "niere"], tueraussengriffe: ["tuer", "aussengriffe"], schliessmechanismen: ["schliess", "mechanismen"], vordertueren: ["vorder", "tueren"], scharnierbefestigungen: ["scharnier", "befestigungen"], aussenflaechenebene: ["aussenflaeche", "ebene"], einwaertsstellung: ["einwaerts", "stellung"], tuerblatts: ["tuer", "blatts"], erhaeltlichen: ["erhaelt", "lichen"], tieferstellung: ["tiefer", "stellung"], horizontally: ["horizont", "ally"], kabelplatte: ["kabel", "platte"], festgelegter: ["fest", "gelegter"], tuerbauteile: ["tuer", "bauteile"], bildausschnitte: ["bild", "ausschnitte"], tuerfensterrahmen: ["tuerfenster", "rahmen"], tuerschutzleiste: ["tuer", "schutzleiste"], tuerfeststeller: ["tuer", "feststeller"], tuerdichtungen: ["tuer", "dichtungen"], schlossbetaetigung: ["schloss", "betaetigung"], motortraegers: ["motor", "traegers"], traegerabschnitts: ["traeger", "abschnitts"], motorhaubenschloss: ["motorhaube", "schloss"], motorhaubenentriegelung: ["motorhauben", "entriegelung"], frontspoiler: ["front", "spoiler"], einstellverfahren: ["eins", "tell", "verfahren"], innenliegende: ["innen", "liegende"], schnittverlaufs: ["schnitt", "verlaufs"], planschleifen: ["plan", "schleifen"], verstaerkungsblechen: ["verstaerkung", "blechen"], massskizzen: ["mass", "skizzen"], verstaerkungsbleche: ["verstaerkung", "bleche"], blechverstaerkungen: ["blech", "verstaerkungen"], blechdicke: ["blech", "dicke"], blechverstaerkung: ["blech", "verstaerkung"], formgerecht: ["form", "gerecht"], demontageliste: ["demontage", "liste"], radhausverkleidungen: ["radhaus", "verkleidungen"], kuehlergrills: ["kuehler", "grills"], fanghaken: ["fang", "haken"], zweiklanghorn: ["zweiklang", "horn"], heizungswanddichtung: ["heizung", "wand", "dichtung"], einstiegabdeckung: ["einstieg", "abdeckung"], fussraumschutzmatte: ["fussraum", "schutz", "matte"], kuehlerblende: ["kuehler", "blende"], vorderradsturz: ["vorder", "radsturz"], fahrzeuginnenseite: ["fahrzeug", "innenseite"], reparaturabbildungen: ["reparatur", "abbildungen"], fahrgastzelle: ["fahrgast", "zelle"], dichtmasse: ["dicht", "masse"], karosserieaustausch: ["karosserie", "austausch"], motortraegerabschnitts: ["motortraeger", "abschnitts"], mittelteils: ["mittel", "teils"], mittelteilabschnitt: ["mittelteil", "abschnitt"], schlossfalle: ["schloss", "falle"], zweiklanghupen: ["zweiklang", "hupen"], heizungswandabdichtung: ["heizung", "wand", "abdichtung"], antennenabdeckung: ["antennen", "abdeckung"], frontmaske: ["front", "maske"], reparaturbereichs: ["reparatur", "bereichs"], zweiklanghoerner: ["zweiklang", "hoerner"], motortraegerbereichs: ["motortraeger", "bereichs"], vorderteils: ["vorder", "teils"], radhausstuetze: ["radhaus", "stuetze"], stopfenschweissungen: ["stopfen", "schweissungen"], radhausabstuetzung: ["radhaus", "abstuetzung"], tueroeffnungskantenschuetzer: ["tueroeffnung", "kanten", "schuetzer"], saeulenverbindungen: ["saeulen", "verbindungen"], saeulenrandes: ["saeule", "randes"], stossverbindung: ["stoss", "verbindung"], unterbodenabdeckung: ["unterboden", "abdeckung"], arbeitsbereichs: ["arbeit", "bereichs"], blechteils: ["blech", "teils"], kantenschutzleiste: ["kanten", "schutzleiste"], vordertueroeffnung: ["vordertuer", "oeffnung"], hartgeloetet: ["hart", "geloetet"], sickenblechzange: ["sicke", "blech", "zange"], positionskennzeichnungen: ["position", "kennzeichnungen"], randspalts: ["rand", "spalts"], standardbohrungen: ["standard", "bohrungen"], hartloetstellen: ["hart", "loetstellen"], umfangreiche: ["umfang", "reiche"], wandverkleidung: ["wand", "verkleidung"], fahrgastraums: ["fahrgast", "raums"], tuerschliesskeil: ["tuer", "schliess", "keil"], scheuerschutzleiste: ["scheuer", "schutzleiste"], bodenaufbau: ["boden", "aufbau"], blechabdeckung: ["blech", "abdeckung"], punktschweissabdeckung: ["punkt", "schweiss", "abdeckung"], kofferraumbodenblechs: ["kofferraum", "bodenblechs"], herausgetrennt: ["heraus", "getrennt"], schwerdaemmmatte: ["schwer", "daemmmatte"], quertraegers: ["quer", "traegers"], lochschweissen: ["loch", "schweissen"], verbindenden: ["verbind", "enden"], lochabstand: ["loch", "abstand"], karosserieteile: ["karosserie", "teile"], seitenstruktur: ["seiten", "struktur"], querblechs: ["quer", "blechs"], verstaerkungshalters: ["verstaerkung", "halters"], querblech: ["quer", "blech"], verstaerkungshalter: ["verstaerkung", "halter"], fahrzeugunterseite: ["fahrzeug", "unterseite"], reststuecke: ["rests", "tuecke"], richtbankaufsatz: ["richtbank", "aufsatz"], heizungswand: ["heizung", "wand"], einstiegsabdeckung: ["einstiegs", "abdeckung"], kuehlerverkleidung: ["kuehler", "verkleidung"], vorderradstellung: ["vorderrad", "stellung"], radhaushalter: ["radhaus", "halter"], vorderwagen: ["vorder", "wagen"], punktschweisszange: ["punkt", "schweisszange"], lochpunktgeschweisst: ["lochpunkt", "geschweisst"], motorhaubenschlosshalters: ["motorhaube", "schloss", "halters"], motorhaubenschlosshalter: ["motorhaube", "schloss", "halter"], frontblecheinbau: ["frontblech", "einbau"], arbeitsfotos: ["arbeit", "fotos"], frontblechs: ["front", "blechs"], passstiftbohrungen: ["passstift", "bohrungen"], probeweise: ["probe", "weise"], heftpunkte: ["heft", "punkte"], heftpunktschweissen: ["heft", "punktschweissen"], radhausinstandsetzung: ["radhaus", "instandsetzung"], radhausabschnitt: ["radhaus", "abschnitt"], stopfenschweissung: ["stopfen", "schweissung"], aussenabschnitt: ["aussen", "abschnitt"], scharnierhalter: ["scharnier", "halter"], tankentlueftungsrohrs: ["tankentlueftung", "rohrs"], radhausblech: ["radhaus", "blech"], innenteil: ["inne", "teil"], tankentlueftungsrohr: ["tankentlueftung", "rohr"], ersatzblechen: ["ersatz", "blechen"], karosseriebefestigungspunkte: ["karosserie", "befestigungspunkte"], hilfsstoffe: ["hilf", "stoffe"], arbeitsbeginn: ["arbeit", "beginn"], korrosionsstellen: ["korrosion", "stellen"], herausgeschnittenen: ["heraus", "geschnittenen"], anschlussflansche: ["anschluss", "flansche"], autogenschweissbrenner: ["autogen", "schweissbrenner"], hartlots: ["hart", "lots"], befestigungspunkten: ["befestigung", "punkten"], originalscheibe: ["original", "scheibe"], windschutz: ["wind", "schutz"], schutzlackierung: ["schutz", "lackierung"], schweisszangen: ["schweiss", "zangen"], waermeeinbringung: ["waerme", "einbringung"], standardverbindungen: ["standard", "verbindungen"], feinspachtel: ["fein", "spachtel"], dichtmassen: ["dicht", "massen"], motorhaubenhoehe: ["motorhaube", "hoehe"], seitenwaenden: ["seiten", "waenden"], fuehrungsrollen: ["fuehrung", "rollen"], anschlagpuffer: ["anschlag", "puffer"], fuehrungsrolle: ["fuehrung", "rolle"], hinterkante: ["hinter", "kante"], freigelegte: ["frei", "gelegte"], karosseriefarbton: ["karosserie", "farbton"], karosserielack: ["karosserie", "lack"], vorderkante: ["vorder", "kante"], schlossteil: ["schloss", "teil"], seitenteilen: ["seiten", "teilen"], ersetzungsarbeiten: ["ersetzung", "arbeiten"], seitentraegerabdeckungen: ["seiten", "traeger", "abdeckungen"], kofferraumbodenblechen: ["kofferraum", "bodenblechen"], reparaturverweisen: ["reparatur", "verweisen"], reparaturanleitung: ["reparatur", "anleitung"], schweissraupen: ["schweiss", "raupen"], deckblechs: ["deck", "blechs"], blechtafeln: ["blech", "tafeln"], einwandfreies: ["einwand", "freies"], widerstandsschweissen: ["widerstand", "schweissen"], blechtafel: ["blech", "tafel"], klemmvorrichtung: ["klemm", "vorrichtung"], schutzgasnaehten: ["schutzgas", "naehten"], korrosionsschutzarbeiten: ["korrosion", "schutzarbeiten"], seitentraegerabdeckung: ["seiten", "traeger", "abdeckung"], schutzmassnahmen: ["schutz", "massnahmen"], tuersaeulenanbindung: ["tuer", "saeulen", "anbindung"], karosserieflaechen: ["karosserie", "flaechen"], reparaturteils: ["reparatur", "teils"], wagenheberaufnahme: ["wagenheber", "aufnahme"], lochabstaende: ["loch", "abstaende"], teilblech: ["teil", "blech"], werkstattgeraeten: ["werkstatt", "geraeten"], niederklemmen: ["nieder", "klemmen"], seitenteilabschnitts: ["seitenteil", "abschnitts"], quertraegerbereich: ["quertraeger", "bereich"], zugaenglichmachen: ["zugaenglich", "machen"], laengstraegerbereichen: ["laengstraeger", "bereichen"], schweissverbindung: ["schweiss", "verbindung"], bodenblechs: ["boden", "blechs"], ersatzblechs: ["ersatz", "blechs"], ueberlappungsmass: ["ueberlappung", "mass"], uebergangslinie: ["uebergang", "linie"], teilerneuern: ["teiler", "neuern"], teilerneuerung: ["teiler", "neuerung"], lochpunktschweissoeffnungen: ["lochpunkt", "schweiss", "oeffnungen"], quertraegern: ["quer", "traegern"], verstaerkungswinkeln: ["verstaerkung", "winkeln"], teilersatzblech: ["teil", "ersatz", "blech"], verbindungsteil: ["verbindung", "steil"], verstaerkungswinkel: ["verstaerkung", "winkel"], fotokennzeichnungen: ["foto", "kennzeichnungen"], fahrzeugunterboden: ["fahrzeug", "unterboden"], karosseriebereich: ["karosserie", "bereich"], karosseriearbeitsgang: ["karosserie", "arbeitsgang"], heraustrennens: ["heraus", "trennens"], quertraegerbereiche: ["quertraeger", "bereiche"], reserveradmulde: ["reserverad", "mulde"], schrottmetall: ["schrott", "metall"], quertraegeranschluesse: ["quertraeger", "anschluesse"], kofferraumbodenplatte: ["kofferraum", "bodenplatte"], fahrzeugrohbau: ["fahrzeug", "rohbau"], bodenplatte: ["boden", "platte"], radhausabschnitts: ["radhaus", "abschnitts"], radhausblechs: ["radhaus", "blechs"], verdeckkastens: ["verdeck", "kastens"], schutzschicht: ["schutz", "schicht"], schnittflaechen: ["schnitt", "flaechen"], verdeckkasten: ["verdeck", "kasten"], schweissfolge: ["schweiss", "folge"], innenblech: ["innen", "blech"], kastenbereichs: ["kasten", "bereichs"], einstiegsabdeckstreifen: ["einstiegs", "abdeckstreifen"], radhausbodens: ["radhaus", "bodens"], kastenbereich: ["kasten", "bereich"], raupenschweissungen: ["raupen", "schweissungen"], inertgasschweissen: ["inertgas", "schweissen"], radhausboden: ["radhaus", "boden"], inertgasschweissung: ["inertgas", "schweissung"], antidrumming: ["anti", "drum", "ming"], abschlussblechen: ["abschluss", "blechen"], bauteildarstellung: ["bauteil", "darstellung"], passarbeiten: ["pass", "arbeiten"], punktschweissbohrungen: ["punkt", "schweiss", "bohrungen"], werkstattgeraet: ["werkstatt", "geraet"], dichtband: ["dicht", "band"], blechstoessen: ["blech", "stoessen"], stopfschweissung: ["stopf", "schweissung"], unterbodenschutzes: ["unterboden", "schutzes"], radhausbereich: ["radhaus", "bereich"], verbindungsbereich: ["verbindung", "bereich"], werkstattgeraete: ["werkstatt", "geraete"], karosseriestrukturen: ["karosserie", "strukturen"], deckelspaltmasse: ["deckel", "spaltmasse"], punktschweissbereiche: ["punkt", "schweissbereiche"], oberdeckel: ["ober", "deckel"], verbindungstechniken: ["verbindung", "techniken"], fuegeschritte: ["fuege", "schritte"], radhausoeffnungsausschnitt: ["radhaus", "oeffnung", "ausschnitt"], frontscheibe: ["front", "scheibe"], karosserieausstattung: ["karosserie", "ausstattung"], fuellleiste: ["fuell", "leiste"], gegensatz: ["gegen", "satz"], einbauvorgang: ["einbau", "vorgang"], scheibenglas: ["scheibe", "glas"], fussdruck: ["fuss", "druck"], kunststoffschaber: ["kunststoff", "schaber"], arbeitsabschnitt: ["arbeit", "abschnitt"], identischen: ["iden", "tischen"], glassplittern: ["glas", "splittern"], glassplitter: ["glas", "splitter"], reparaturfaelle: ["reparatur", "faelle"], klebeflaechen: ["klebe", "flaechen"], aushaertezeiten: ["aushaerte", "zeiten"], belastungsgrenzen: ["belastung", "grenzen"], kleberaupe: ["klebe", "raupe"], torsionsfestigkeit: ["torsion", "festigkeit"], gewaehrleistung: ["gewaehr", "leistung"], einbauarbeit: ["einbau", "arbeit"], schutzhandschuhe: ["schutz", "handschuhe"], randbereich: ["rand", "bereich"], glaskeramik: ["glas", "keramik"], glaskeramikflaeche: ["glaskeramik", "flaeche"], primerschicht: ["primer", "schicht"], luftfeuchtigkeit: ["luft", "feuchtigkeit"], belastet: ["bela", "stet"], randstein: ["rand", "tein"], fahrzeuginnenraum: ["fahrzeug", "innenraum"], lieferquelle: ["liefer", "quelle"], haertezeit: ["haerte", "zeit"], fahrzeugscheibe: ["fahrzeug", "scheibe"], schneidmesser: ["schneid", "messer"], reststaerke: ["rest", "staerke"], dachhimmelplatte: ["dachhimmel", "platte"], werkzeugachse: ["werkzeug", "achse"], verbliebenen: ["verb", "lieben"], karosserieausschnitts: ["karosserie", "ausschnitts"], karosserieausschnitt: ["karosserie", "ausschnitt"], kleberreste: ["kleber", "reste"], kartuschenduese: ["kartusche", "duese"], massskizze: ["mass", "skizze"], klebeflaeche: ["klebe", "flaeche"], verfallsdatum: ["verfall", "datum"], probekleberaupe: ["probe", "klebe", "raupe"], scheibenflaeche: ["scheibe", "flaeche"], materialvorschub: ["material", "vorschub"], bewegungsgeschwindigkeit: ["bewegung", "geschwindigkeit"], grundraupe: ["grund", "raupe"], kleberkartusche: ["kleber", "kartusche"], kartuschenpistole: ["kartusche", "pistole"], gummiprofils: ["gummi", "profils"], schaumstoffrollen: ["schaum", "stoffrollen"], ultraschallpruefer: ["ultraschall", "pruefer"], fahrzeuginnenraumseite: ["fahrzeuginnenraum", "seite"], zugeschnitten: ["zuge", "schnitten"], gummiprofil: ["gummi", "profil"], zierrahmens: ["zier", "rahmens"], klebeverbindung: ["klebe", "verbindung"], seitenfensters: ["seiten", "fensters"], scheibenrahmen: ["scheibe", "rahmen"], drehstaebe: ["dreh", "staebe"], seitenfenster: ["seiten", "fenster"], schneidmessers: ["schneid", "messers"], zurueckarbeiten: ["zurueck", "arbeiten"], kleberresten: ["kleber", "resten"], lackstellen: ["lack", "tell"], klebestreifen: ["klebe", "treif"], trocknungszeit: ["trocknung", "zeit"], schutzfolie: ["schutz", "folie"], fotocodierungen: ["foto", "codierungen"], bildanleitung: ["bild", "anleitung"], zierleisten: ["zier", "leisten"], einstellunterlagen: ["eins", "tell", "unterlagen"], einstellunterlage: ["eins", "tell", "unterlage"], raupenform: ["raup", "form"], kleberaupen: ["klebe", "raupen"], proberaupe: ["probe", "raupe"], scheibenoberflaeche: ["scheiben", "oberflaeche"], ziehgeschwindigkeit: ["zieh", "geschwindigkeit"], scheibenkante: ["scheibe", "kante"], schaumgummiwuelsten: ["schaumgummi", "wuelsten"], ultraschallpruefung: ["ultraschall", "pruefung"], fahrzeuginnerseite: ["fahrzeug", "inner", "seite"], schaumgummi: ["schaum", "gummi"], ultraschallpruefgeraet: ["ultraschall", "pruefgeraet"], fensterhebers: ["fenster", "hebers"], schneckenklemme: ["schnecke", "klemme"], scheibenfuehrung: ["scheiben", "fuehrung"], fensterfuehrung: ["fenster", "fuehrung"], seitenscheibeneinstellung: ["seitenscheibe", "einstellung"], dreiecksfensters: ["dreiecks", "fensters"], hochfahren: ["hoch", "fahren"], langloechern: ["lang", "loechern"], tuerschliesskeils: ["tuer", "schliess", "keils"], dreiecksfenster: ["dreieck", "fenster"], langloecher: ["lang", "loecher"], bewegungsbegrenzung: ["bewegung", "begrenzung"], fensterscheibe: ["fenster", "scheibe"], scheibenbewegung: ["scheiben", "bewegung"], fensterhebersystem: ["fensterheber", "system"], fensterfalzabdeckung: ["fensterfalz", "abdeckung"], scheibenendes: ["scheibe", "endes"], festzuhalten: ["fest", "zuhalten"], fenstereinstellung: ["fenster", "einstellung"], spreiznieten: ["spreiz", "nieten"], fensterschachtabdeckung: ["fensterschacht", "abdeckung"], befestigungsbohrungen: ["befestigung", "bohrungen"], spreizniet: ["spreiz", "niet"], befestigungsbohrung: ["befestigung", "bohrung"], feststehende: ["fest", "stehende"], feststehenden: ["fest", "stehenden"], tuerrahmen: ["tuer", "rahmen"], einbauanleitung: ["einbau", "anleitung"], tuerspezifischen: ["tuer", "spezifischen"], tuerinnenblech: ["tuer", "innen", "blech"], drahtbuegel: ["draht", "buegel"], fensterscheibeneinstellung: ["fensterscheibe", "einstellung"], fensterhebermechanik: ["fensterheber", "mechanik"], scheibenposition: ["scheiben", "position"], fensterglas: ["fenster", "glas"], fensterheberschrauben: ["fensterheber", "schrauben"], fensterschachtabdeckungen: ["fensterschacht", "abdeckungen"], heraushebeln: ["heraus", "hebeln"], herunterkurbeln: ["herunter", "kurbeln"], gummifuehrung: ["gummi", "fuehrung"], tuerfernbetaetigung: ["tuer", "fernbetaetigung"], tuerbetaetigung: ["tuerbe", "taetigung"], rastzapfen: ["rast", "zapfen"], netzmittel: ["netz", "mittel"], fondtuer: ["fond", "tuer"], wiedereinsetzen: ["wiede", "reinsetzen"], einbaubedingungen: ["einbau", "bedingungen"], hochdruecken: ["hoch", "druecken"], herabhaengen: ["herab", "haengen"], kippfensters: ["kipp", "fensters"], kippfenster: ["kipp", "fenster"], kleiderhakens: ["kleider", "hakens"], sicherheitsgurtrolle: ["sicherheit", "gurtrolle"], scheibenbruch: ["scheibe", "bruch"], kleiderhaken: ["kleider", "haken"], fensterhalter: ["fenster", "halter"], befestigungspunkt: ["befestigung", "punkt"], herunterfallen: ["herunter", "fallen"], fensterhebermotors: ["fensterheber", "motors"], einstellschritte: ["eins", "tell", "schritte"], frontspoilers: ["front", "spoilers"], kunststoffmutter: ["kunststoff", "mutter"], halteschraube: ["halte", "schraube"], dichtschnur: ["dicht", "schnur"], gummituellen: ["gummi", "tuellen"], bohrschablone: ["bohr", "schablone"], selbstschneidende: ["selbst", "schneidende"], zugangsbereich: ["zugangs", "bereich"], quadratisch: ["quadra", "tisch"], radhauskontur: ["radhaus", "kontur"], mittelpunkte: ["mittel", "punkte"], bohrungskanten: ["bohrung", "kanten"], steinschlagschutz: ["steinschlag", "schutz"], kunststoffnieten: ["kunststoff", "nieten"], kunststoffniet: ["kunststoff", "niet"], lochmitten: ["loch", "mitten"], befestigungsloecher: ["befestigung", "loecher"], befestigungsstellen: ["befestigung", "stellen"], lochkanten: ["loch", "kanten"], seitenbleche: ["seiten", "bleche"], befestigungsklemmen: ["befestigung", "klemmen"], bohrungsmitten: ["bohrung", "mitten"], montageanweisung: ["montage", "anweisung"], fahrzeugblech: ["fahrzeug", "blech"], steinschlagschutzes: ["steinschlag", "schutzes"], steinschutzblende: ["steinschutz", "blende"], dichtkordel: ["dicht", "kordel"], steinschutz: ["stein", "schutz"], schutzblende: ["schutz", "blende"], koernerpunkte: ["koerner", "punkte"], lochmittelpunkte: ["loch", "mittelpunkte"], bohrlochkanten: ["bohrloch", "kanten"], lochmittelpunkt: ["loch", "mittelpunkt"], bohrlochkante: ["bohrloch", "kante"], heckspoiler: ["heck", "spoiler"], heckspoilers: ["heck", "spoilers"], bezugspunkte: ["bezugs", "punkte"], bohrabstaende: ["bohr", "abstaende"], klebebands: ["klebe", "bands"], bohrkanten: ["bohr", "kanten"], kappenmuttern: ["kappen", "muttern"], kofferraumdeckelkante: ["kofferraumdeckel", "kante"], massband: ["mass", "band"], spoilerteils: ["spoiler", "teils"], massangaben: ["massa", "gaben"], heckspoilerteil: ["heckspoiler", "teil"], decklack: ["deck", "lack"], lackauftrag: ["lack", "auftrag"], klebeanweisungen: ["klebe", "anweisungen"], kaltreiniger: ["kalt", "reiniger"], handtemperatur: ["hand", "temperatur"], kunststoffschutzfolien: ["kunststoff", "schutzfolien"], anfangshaftung: ["anfangs", "haftung"], serienmaessigem: ["serien", "maessigem"], kunststoffmuttern: ["kunststoff", "muttern"], bohrungsmittelpunkte: ["bohrung", "mittelpunkte"], serienmaessiger: ["serien", "maessiger"], einbrenntemperatur: ["einbrenn", "temperatur"], klebeteilen: ["klebe", "teilen"], klebeteile: ["klebe", "teile"], drehverschlusses: ["dreh", "verschlusses"], fussstuetze: ["fuss", "stuetze"], befestigungslasche: ["befestigung", "lasche"], drehverschluss: ["dreh", "verschluss"], sechskantschrauben: ["sechskant", "schrauben"], fussraumverkleidung: ["fussraum", "verkleidung"], verbindungslinie: ["verbindung", "linie"], stichsaege: ["stich", "saege"], radiolautsprechern: ["radio", "lautsprechern"], abstandshalter: ["abstand", "halter"], lautsprecherhalterung: ["lautsprecher", "halterung"], positionsbezeichnungen: ["position", "bezeichnungen"], kunststoffstossfaengern: ["kunststoff", "stossfaengern"], schutzleisten: ["schutz", "leisten"], haltegriff: ["halte", "griff"], vollkunststoffausfuehrung: ["vollkunststoff", "ausfuehrung"], pralldaempfer: ["prall", "daempfer"], gummischutzleiste: ["gummischutz", "leiste"], lufteinlassgitter: ["lufteinlass", "gitter"], kuehlergrillleiste: ["kuehlergrill", "leiste"], modellschriftzug: ["modell", "schriftzug"], schutzleiste: ["schutz", "leiste"], spiegelglas: ["spiegel", "glas"], aufpralldaempfer: ["aufprall", "daempfer"], motorhauben: ["motor", "hauben"], kofferraumdeckelschloesser: ["kofferraumdeckel", "schloesser"], verdeckkastendeckel: ["verdeck", "kasten", "deckel"], zentralverriegelungsschalter: ["zentralverriegelung", "schalter"], fensterdicht: ["fenster", "dicht"], verglasungsarbeiten: ["verglasung", "arbeiten"], vordertuerschlosses: ["vordertuer", "schlosses"], aussengriffe: ["aussen", "griffe"], fensterschachtabdeckleiste: ["fensterschacht", "abdeckleiste"], hintertuerschloss: ["hintertuer", "schloss"], kofferraumdeckelschlosses: ["kofferraumdeckel", "schlosses"], torsionsstaebe: ["torsion", "staebe"], gasdruckfedern: ["gasdruck", "federn"], verriegelungselement: ["verriegelung", "element"], verdeckkastendeckels: ["verdeck", "kasten", "deckels"], hintertuerschlosses: ["hintertuer", "schlosses"], tankklappenschlosses: ["tankklappe", "schlosses"], schliessmechanismus: ["schliess", "mechanismus"], tankklappenschloss: ["tankklappe", "schloss"], frontscheiben: ["front", "scheiben"], tuerfenster: ["tuer", "fenster"], fensterheberbauteilen: ["fensterheber", "bauteilen"], heckscheibenmontage: ["heckscheibe", "montage"], steinschlagschaeden: ["steinschlag", "schaeden"], vordertuerscheibe: ["vordertuer", "scheibe"], hintertuerscheibe: ["hintertuer", "scheibe"], steinschlagschaden: ["steinschlag", "schaden"], innenraumverkleidungen: ["innenraum", "verkleidungen"], kofferraumverkleidungen: ["kofferraum", "verkleidungen"], seitenverkleidungsteilen: ["seitenverkleidung", "steilen"], dachhimmelblende: ["dachhimmel", "blende"], hutablagenverkleidung: ["hutablage", "verkleidung"], heckwand: ["heck", "wand"], trennwandverkleidung: ["trennwand", "verkleidung"], karosserieverkleidungen: ["karosserie", "verkleidungen"], diagnoseabschnitte: ["diagnose", "abschnitte"], gesamtsystem: ["gesamt", "system"], doppelverriegeln: ["doppel", "verriegeln"], sicherheitsvorgaben: ["sicherheit", "vorgaben"], thermoplastischer: ["thermo", "plastischer"], sicherheitsgruenden: ["sicherheit", "gruenden"], arbeitsschutz: ["arbeit", "schutz"], brandbekaempfung: ["brand", "bekaempfung"], bundesrepublik: ["bundes", "republik"], thermoplasten: ["thermo", "plast"], schadensarten: ["schade", "arten"], karosseriebefestigungspunkten: ["karosserie", "befestigungspunkten"], aluminiumoxid: ["aluminium", "oxid"], glasgittergewebe: ["glas", "gitter", "gewebe"], kunststoffreparaturmaterial: ["kunststoff", "reparaturmaterial"], lebensmittel: ["lebens", "mittel"], trinkwassersysteme: ["trinkwasser", "systeme"], reparaturmaterials: ["reparatur", "materials"], sonderabfall: ["sonder", "abfall"], einzelkomponenten: ["einzel", "komponenten"], abfallentsorgungsstelle: ["abfallentsorgung", "stelle"], thermoplast: ["thermo", "plast"], sandpaper: ["sand", "paper"], zehnstufiges: ["zehn", "stufiges"], kunststoffflaeche: ["kunststoff", "flaeche"], reparaturergebnisse: ["reparatur", "ergebnisse"], zemententferner: ["zement", "entferner"], reparaturflaeche: ["reparatur", "flaeche"], hindurchgeht: ["hindurch", "geht"], prallabsorbern: ["prall", "absorbern"], stossfaengertraeger: ["stossfaenger", "traeger"], stossfaengerverkleidung: ["stossfaenger", "verkleidung"], gummischutzleisten: ["gummischutz", "leisten"], abschleppoesenabdeckung: ["abschleppoese", "abdeckung"], vorderstossfaenger: ["vorder", "stossfaenger"], prallabsorber: ["prall", "absorber"], kunststoffausfuehrung: ["kunststoff", "ausfuehrung"], stossfaengereinheit: ["stossfaenger", "einheit"], schaumgummieinlage: ["schaumgummi", "einlage"], stossfaengerblende: ["stossfaenger", "blende"], batteriemasse: ["batterie", "masse"], gummileiste: ["gummi", "leiste"], verkleidungsteilen: ["verkleidung", "steilen"], stossfaengerabstaende: ["stossfaenger", "abstaende"], kunststoffniete: ["kunststoff", "niete"], standardausfuehrung: ["standard", "ausfuehrung"], rohrflansch: ["rohr", "flansch"], reparaturstellung: ["reparatur", "stellung"], kennzeichenhalter: ["kennzeichen", "halter"], schaumgummieinsatz: ["schaumgummi", "einsatz"], befestigungshalter: ["befestigung", "halter"], ersatzteilzuordnung: ["ersatzteil", "zuordnung"], stossfaengerbaugruppe: ["stossfaenger", "baugruppe"], befestigungsbolzen: ["befestigung", "bolzen"], gummischutz: ["gummi", "schutz"], seitenblende: ["seiten", "blende"], vollkunststoff: ["voll", "kunststoff"], befestigungsklammer: ["befestigung", "klammer"], stossfaengerabdeckung: ["stossfaenger", "abdeckung"], stossfaengerbefestigungen: ["stossfaenger", "befestigungen"], aufprallabsorbers: ["aufprall", "absorbers"], sonderausfuehrung: ["sonder", "ausfuehrung"], batterieabdeckung: ["batterie", "abdeckung"], aufprallabsorber: ["aufprall", "absorber"], unfallschadens: ["unfall", "schadens"], lufteinlassgitters: ["lufteinlass", "gitters"], scheibenwischerarms: ["scheiben", "wischerarms"], scheibenwischerarm: ["scheiben", "wischerarm"], regenrinne: ["regen", "rinne"], leistenendes: ["leiste", "endes"], kunststoffclips: ["kunststoff", "clips"], kunststoffclip: ["kunststoff", "clip"], schriftzugs: ["schrift", "zugs"], modellspezifischen: ["modell", "spezifischen"], bezugskanten: ["bezugs", "kanten"], massrichtungen: ["mass", "richtungen"], schriftzugvarianten: ["schriftzug", "varianten"], nylonfaden: ["nylon", "faden"], geschirrspuelmittel: ["geschirr", "spuelmittel"], klebstoffschicht: ["klebstoff", "schicht"], klebstoffreste: ["klebstoff", "reste"], modellschriftzuege: ["modell", "schriftzuege"], massbezuege: ["mass", "bezuege"], schriftzuegen: ["schrift", "zuegen"], einbrennlackieren: ["einbrenn", "lackieren"], scheuerleisten: ["scheuer", "leisten"], arbeitsanleitungen: ["arbeit", "anleitungen"], aussenspiegels: ["aussen", "spiegels"], spiegelglases: ["spiegel", "glases"], schaltgrenzen: ["schalt", "grenzen"], spiegels: ["spie", "gels"], spiegeldreieck: ["spiegel", "dreieck"], spiegeleinstellung: ["spiegelei", "stellung"], spiegelgehaeuses: ["spiegel", "gehaeuses"], flachstecker: ["flach", "stecker"], spiegelgehaeuse: ["spiegel", "gehaeuse"], innenspiegels: ["innen", "spiegels"], befestigungsarten: ["befestigung", "arten"], spiegelbasis: ["spiegel", "basis"], spiegelsockel: ["spiegel", "sockel"], hammergriff: ["hammer", "griff"], fensterheberschaltern: ["fensterheber", "schaltern"], schalthebelknopf: ["schalthebel", "knopf"], kassettenboxen: ["kassette", "boxen"], ablagefach: ["ablage", "fach"], darunterliegenden: ["darunter", "liegenden"], ablagefachs: ["ablage", "fachs"], zigarettenanzuenderleitungen: ["zigarettenanzuender", "leitungen"], haltegriffs: ["halte", "griffs"], herausgedreht: ["heraus", "gedreht"], zweituerermodellen: ["zweituerer", "modellen"], flaechenbuendige: ["flaechen", "buendige"], vordertuerkante: ["vordertuer", "kante"], seitenwandverkleidungsteil: ["seite", "wandverkleidung", "steil"], schliesskeil: ["schliess", "keil"], betaetigungsantriebs: ["betaetigung", "antriebs"], betaetigungsstangen: ["betaetigung", "stangen"], fernbetaetigung: ["fern", "betaetigung"], schliesszylinders: ["schliess", "zylinders"], schlossbetaetigungsstange: ["schloss", "betaetigung", "stange"], verbindungsstange: ["verbindung", "stange"], schliesszylinderheizung: ["schliesszylinder", "heizung"], schluesselcodenummer: ["schluessel", "codenummer"], teilewesen: ["teile", "wesen"], mikroschalterbetaetigung: ["mikroschalter", "betaetigung"], tuerschliesszylinder: ["tuer", "schliesszylinder"], tuerschliesszylindern: ["tuer", "schliesszylindern"], federsitzes: ["feder", "sitzes"], klemmbefestigung: ["klemm", "befestigung"], mikroschalters: ["mikro", "schalters"], tuerschliesszylinders: ["tuer", "schliesszylinders"], tueraussengriffs: ["tuer", "aussengriff"], schlossmechanik: ["schloss", "mechanik"], kontaktsenders: ["kontakt", "senders"], innenlichtverzoegerung: ["innenlicht", "verzoegerung"], kontaktzunge: ["kontakt", "zunge"], blechbereiche: ["blech", "bereiche"], tueraussengriff: ["tuer", "aussengriff"], tuerblech: ["tuer", "blech"], kontaktsender: ["kontakt", "sender"], fensterschachtabdeckleisten: ["fensterschacht", "abdeckleisten"], halteclipsen: ["halte", "clips"], schliesskeils: ["schliess", "keils"], seitenwandflaechen: ["seitenwand", "flaechen"], schliesskeilschrauben: ["schliess", "keil", "schrauben"], verriegelungsgestaenge: ["verriegelung", "gestaenge"], verriegelungsknopfgestaenges: ["verriegelung", "knopf", "gestaenges"], verriegelungsknopfgestaenge: ["verriegelung", "knopf", "gestaenge"], verbindungsgestaenge: ["verbindung", "gestaenge"], motorhaubenschlosses: ["motorhaube", "schlosses"], bowdenzugs: ["bowden", "zugs"], festgeschraubt: ["fest", "geschraubt"], bowdenzughalterung: ["bowdenzug", "halterung"], kofferraumplatte: ["kofferraum", "platte"], rueckwandverkleidung: ["rueckwand", "verkleidung"], ebeneneinstellung: ["ebenen", "einstellung"], herausfaellt: ["heraus", "faellt"], herabfallen: ["herab", "fallen"], scheuerstellen: ["scheuer", "stellen"], sicherungsklammern: ["sicherung", "klammern"], torsionsstab: ["torsion", "stab"], scheuerstelle: ["scheuer", "stelle"], einhaengeposition: ["einhaenge", "position"], verdeckklappe: ["verdeck", "klappe"], verriegelungselements: ["verriegelung", "elements"], beschaedigungsgefahr: ["beschaedigung", "gefahr"], kunststoffabdeckung: ["kunststoff", "abdeckung"], schlosseinstellung: ["schloss", "einstellung"], ablagefachdeckels: ["ablagefach", "deckels"], betaetigungsseilzugs: ["betaetigung", "seilzugs"], einstellmoeglichkeit: ["eins", "tell", "moeglichkeit"], deckelschlosses: ["deckel", "schlosses"], deckelschloss: ["deckel", "schloss"], schalterabschnitte: ["schalter", "abschnitte"], viertuerfahrzeugen: ["vier", "tuer", "fahrzeugen"], verbindungsschraube: ["verbindung", "schraube"], fernbetaetigungsgestaenge: ["fernbetaetigung", "gestaenge"], antriebszuordnung: ["antriebs", "zuordnung"], fernbetaetigungsstange: ["fernbetaetigung", "stange"], schlossbereichs: ["schloss", "bereichs"], antriebskennung: ["antrieb", "kennung"], rueckleuchtentraeger: ["rueckleuchte", "traeger"], verbindungsglied: ["verbindung", "glied"], armlehnenbefestigungen: ["armlehnen", "befestigungen"], verriegelungsknopf: ["verriegelung", "knopf"], fensterkurbel: ["fenster", "kurbel"], griffblende: ["griff", "blende"], ausgehebelt: ["ausgehe", "belt"], befestigungsclips: ["befestigung", "clips"], fensterschachtabdichtung: ["fensterschacht", "abdichtung"], befestigungsclip: ["befestigung", "clip"], schlossblende: ["schloss", "blende"], karosserieausfuehrung: ["karosserie", "ausfuehrung"], lautsprecherkabel: ["lautsprecher", "kabel"], bildsequenzen: ["bild", "sequenzen"], herausfuehren: ["heraus", "fuehren"], sicherheitsgurts: ["sicherheit", "gurt"], ausbauablauf: ["ausbau", "ablauf"], arbeitsschrittkennzeichnungen: ["arbeitsschritt", "kennzeichnungen"], schiebedachs: ["schiebe", "dachs"], schiebedachdeckel: ["schiebedach", "deckel"], sonnenblende: ["sonnen", "blende"], sonnenblendenhalter: ["sonnenblende", "halter"], plattenabdeckung: ["platten", "abdeckung"], lenksaeulenverkleidung: ["lenksaeulen", "verkleidung"], schaltknopf: ["schalt", "knopf"], instrumententraegers: ["instrument", "traegers"], haltebaendern: ["halte", "baendern"], kombinationssteckers: ["kombination", "steckers"], kombinationsstecker: ["kombination", "stecker"], zusatzkabelbaum: ["zusatz", "kabelbaum"], lueftungsbedienung: ["lueftung", "bedienung"], schaltereinheit: ["schalte", "reinheit"], radioblende: ["radio", "blende"], bedienblenden: ["bedien", "blenden"], geblaeseschalter: ["geblaese", "schalter"], schieberegler: ["schiebe", "regler"], schalttafel: ["schalt", "tafel"], temperaturreglergehaeuse: ["temperatur", "reglergehaeuse"], lampentraeger: ["lampen", "traeger"], bedieneinheit: ["bedien", "einheit"], fussraumlueftung: ["fussraum", "lueftung"], fensterbelueftung: ["fenster", "belueftung"], temperaturmischklappe: ["temperatur", "misch", "klappe"], zusatzblinkleuchte: ["zusatz", "blinkleuchte"], rastbuegel: ["rast", "buegel"], ausbaufolge: ["ausbau", "folge"], kantenschutzprofile: ["kantenschutz", "profile"], kabelhalterungen: ["kabel", "halterungen"], bedienhebel: ["bedien", "hebel"], gummischeiben: ["gummi", "scheiben"], tempomathebels: ["tempomat", "hebels"], luftkanaele: ["luft", "kanaele"], lenksaeulenverkleidungen: ["lenksaeulen", "verkleidungen"], kabelstraenge: ["kabelst", "raenge"], blinkerschalterhebel: ["blinker", "schalter", "hebel"], wischerhebel: ["wischer", "hebel"], tempomathebel: ["tempomat", "hebel"], instrumententafelverkleidungen: ["instrumententafel", "verkleidungen"], schraubenanordnung: ["schrauben", "anordnung"], fotoreferenznummern: ["foto", "referenznummern"], sitzkissens: ["sitz", "kissens"], lautsprecherleitungen: ["lautsprecher", "leitungen"], anzugsdrehmoments: ["anzugs", "drehmoments"], spezifikationsgruppe: ["spezifikation", "gruppe"], kofferraumtrennwand: ["kofferraum", "trennwand"], kofferraumwand: ["kofferraum", "wand"], spreizniete: ["spreiz", "niete"], seitenwandverkleidung: ["seitenwand", "verkleidung"], befestigungselements: ["befestigung", "elements"], batteriedeckel: ["batterie", "deckel"], clipstifte: ["clip", "stifte"], steinschadenreparatur: ["stein", "schaden", "reparatur"], sicherheitsglas: ["sicherheit", "glas"], reparaturbedingungen: ["reparatur", "bedingungen"], sichtfelds: ["sicht", "felds"], sichtfeld: ["sicht", "feld"], ausbruchstelle: ["ausbruch", "stelle"], gummischeibenrahmen: ["gummischeibe", "rahmen"], lichtdurchlaessig: ["licht", "durchlaessig"], skizzenbeschriftungen: ["skizzen", "beschriftungen"], wischfeld: ["wisch", "feld"], lichtdurchlaessigkeit: ["licht", "durchlaessigkeit"], fahrzeugzeichnung: ["fahrzeug", "zeichnung"], tuerkabelbaeumen: ["tuer", "kabelbaeumen"], mikroschaltern: ["mikro", "schaltern"], sonderausstattungsstecker: ["sonderausstattung", "stecker"], funktionshinweise: ["funktion", "hinweise"], ueberlastschutz: ["ueberlast", "schutz"], aufprallschalters: ["aufprall", "schalters"], aufprallschalter: ["aufprall", "schalter"], schlossstellung: ["schloss", "stellung"], entriegelungsknoepfen: ["entriegelung", "knoepfen"], zusammenstosses: ["zusammen", "stosses"], mehrfachbetaetigungssperre: ["mehrfach", "betaetigung", "sperre"], steckerabbildung: ["stecker", "abbildung"], spannungsmessungen: ["spannung", "messungen"], karosseriesteckers: ["karosserie", "steckers"], versorgungsfehlers: ["versorgung", "fehlers"], digitaltester: ["digital", "tester"], crashschalter: ["crash", "schalter"], karosseriestecker: ["karosserie", "stecker"], tuerverkabelung: ["tuer", "verkabelung"], stellantriebs: ["stella", "triebs"], schaltfunktion: ["schalt", "funktion"], stellantrieb: ["stell", "antrieb"], betaetigungsoese: ["betaetigung", "oese"], hineingedrueckt: ["hinein", "gedrueckt"], diagnoseablauf: ["diagnose", "ablauf"], fehlerfall: ["fehler", "fall"], beifahrertuerschlosses: ["beifahrer", "tuerschlosses"], tuerschlossantriebs: ["tuerschloss", "antriebs"], beweglich: ["beweg", "lich"], beifahrertuerantriebs: ["beifahrer", "tuerantriebs"], schlossantrieb: ["schloss", "antrieb"], diagnoseflussdiagramm: ["diagnose", "flussdiagramm"], steckhuelsenposition: ["steckhuelse", "position"], masseunterbrechung: ["masse", "unterbrechung"], kofferraumdeckelantriebs: ["kofferraumdeckel", "antriebs"], gestaengeverbindung: ["gestaenge", "verbindung"], hinsichtlich: ["hinsicht", "lich"], sicherheitsverriegeln: ["sicherheit", "verriegeln"], tuerantrieb: ["tuer", "antrieb"], spannungswerte: ["spannung", "werte"], doppelverriegelungsfunktion: ["doppel", "verriegelung", "funktion"], leitungsdurchgaengigkeit: ["leitung", "durchgaengigkeit"], karosseriesteckverbindungen: ["karosserie", "steckverbindungen"], schalterende: ["schalter", "ende"], masseversorgungsleitungen: ["masse", "versorgungsleitungen"], schutzschalters: ["schutz", "schalters"], beschreibungstext: ["beschreibung", "text"], bedienmoeglichkeiten: ["bedien", "moeglichkeiten"], drucktasten: ["druck", "tasten"], tuerverkleidungen: ["tuer", "verkleidungen"], kindersicherung: ["kinder", "sicherung"], totalausfall: ["total", "ausfall"], sonderausstattungsanschluss: ["sonderausstattung", "anschluss"], leitungsstrang: ["leitung", "strang"], steckverbindungspruefungen: ["steckverbindung", "pruefungen"], druckschalter: ["druck", "schalter"], schiebedachrelais: ["schiebedach", "relais"], fensterheberschalters: ["fensterheber", "schalters"], massefehler: ["masse", "fehler"], stromlaufpruefung: ["stromlauf", "pruefung"], seitenausschnitts: ["seitenaus", "schnitts"], anschlussbuchse: ["anschluss", "buchse"], diagnoseflussdiagramms: ["diagnose", "flussdiagramms"], masseansteuerung: ["masse", "ansteuerung"], leitungsdurchgang: ["leitung", "durchgang"], steckbuchsen: ["steck", "buchsen"], steckbuchse: ["steck", "buchse"], steckplaetzen: ["steck", "plaetzen"], steckplaetze: ["steck", "plaetze"], sitzschienen: ["sitz", "schienen"], lehnenverstellung: ["lehnen", "verstellung"], vordersitzlehne: ["vorder", "sitzlehne"], reparaturseiten: ["reparatur", "seiten"], vordersitzes: ["vorder", "sitzes"], lehnenverstellmechanismus: ["lehnen", "verstellmechanismus"], sitzschiene: ["sitz", "schiene"], sicherheitsgurtbefestigung: ["sicherheitsgurt", "befestigung"], steuerhebel: ["steuer", "hebel"], zurueckstellen: ["zurueck", "stellen"], vierkantoeffnung: ["vier", "kant", "oeffnung"], steuerhebels: ["steuer", "hebels"], bowdenzuege: ["bowden", "zuege"], lehnenverriegelung: ["lehnen", "verriegelung"], rueckenlehnenverkleidung: ["rueckenlehne", "verkleidung"], bowdenzugfuehrungen: ["bowdenzug", "fuehrungen"], sitzbezug: ["sitz", "bezug"], bowdenzugfuehrung: ["bowdenzug", "fuehrung"], innenhandgriff: ["innen", "handgriff"], aussenhandgriff: ["aussen", "handgriff"], sportsitz: ["sport", "sitz"], ruecksitzkissens: ["ruecksitz", "kissens"], schiebedachkurbel: ["schiebedach", "kurbel"], schiebedachgetriebe: ["schiebedach", "getriebe"], schiebedachverschluss: ["schiebedach", "verschluss"], hubdachdeckels: ["hubdach", "deckels"], aufstellen: ["aufs", "tell"], sollhoehen: ["soll", "hoehen"], samtleisten: ["samt", "leisten"], dachhimmelrahmens: ["dachhimmel", "rahmens"], schiebedaechern: ["schiebe", "daechern"], betaetigungsschalter: ["betaetigung", "schalter"], schiebedachdeckels: ["schiebedach", "deckels"], kunststofflehre: ["kunststoff", "lehre"], dachhimmelrahmen: ["dachhimmel", "rahmen"], fuehrungsstifts: ["fuehrung", "stifts"], handkurbel: ["hand", "kurbel"], vertiefungsplatte: ["vertiefung", "platte"], bewegungsrichtungen: ["bewegung", "richtungen"], verbindungsstangen: ["verbindung", "stangen"], veloursstreifen: ["velours", "streifen"], klemmleiste: ["klemm", "leiste"], kantenschutzes: ["kanten", "schutzes"], aussparungsplatte: ["aussparung", "platte"], antriebskabel: ["antrieb", "kabel"], fuehrungsrohren: ["fuehrung", "rohren"], schiebedachmechanik: ["schiebedach", "mechanik"], schiebedachkassette: ["schiebedach", "kassette"], schiebers: ["schi", "ebers"], schiebedachfuehrung: ["schiebedach", "fuehrung"], demontagebewegungen: ["demontage", "bewegungen"], randabdichtung: ["rand", "abdichtung"], steuerzahnrad: ["steuer", "zahnrad"], klemmschiene: ["klemm", "schiene"], schaltzahnrads: ["schalt", "zahnrads"], steuerzahnrads: ["steuer", "zahnrads"], hohlniete: ["hohl", "niete"], schaltzahnrad: ["schalt", "zahnrad"], knackgeraeusche: ["knack", "geraeusche"], dachbewegung: ["dach", "bewegung"], wassereintritt: ["wasser", "eintritt"], fuehrungsrohre: ["fuehrung", "rohre"], wasserablauf: ["wasser", "ablauf"], schiebedachrahmens: ["schiebe", "dachrahmens"], fuehrungsgestaenge: ["fuehrung", "gestaenge"], kulissenhaltern: ["kulisse", "haltern"], kulissenhalter: ["kulisse", "halter"], fuehrungsnasen: ["fuehrung", "nasen"], koernermarken: ["koerner", "marken"], dachhimmels: ["dach", "himmels"], ablaufschlaeuche: ["ablauf", "schlaeuche"], fuehrungsschienen: ["fuehrung", "schienen"], dachoeffnung: ["dach", "oeffnung"], dichtpaste: ["dicht", "paste"], abhilfetabelle: ["abhilfe", "tabelle"], abgasgeruch: ["abgas", "geruch"], funktionsstoerungen: ["funktion", "stoerungen"], antriebsmotor: ["antrieb", "motor"], rutschkupplung: ["rutsch", "kupplung"], fensterscheiben: ["fenster", "scheiben"], zusammenfalten: ["zusammen", "falten"], herunterklappen: ["herunter", "klappen"], verriegelungsschraube: ["verriegelung", "schraube"], ringschluessel: ["ring", "schluessel"], sicherungsschrauben: ["sicherung", "schrauben"], kontaktfett: ["kontakt", "fett"], umweltschutzmassnahmen: ["umweltschutz", "massnahmen"], wabenstruktur: ["waben", "struktur"], werkstoffe: ["werk", "toff"], brandbekaempfungs: ["brand", "bekaempfung"], entsorgungshinweise: ["entsorgung", "hinweise"], schadenszustand: ["schaden", "zustand"], erstrecken: ["erst", "recken"], glasfaserfueller: ["glasfaser", "fueller"], spachtelmesser: ["spachtel", "messer"], standardwerkzeug: ["standard", "werkzeug"], glasstab: ["glas", "stab"], seidenmatter: ["seiden", "matter"], klarlack: ["klar", "lack"], arbeitskleidung: ["arbeit", "kleidung"], augenkontakt: ["augen", "kontakt"], reichlich: ["reich", "lich"], beschwerden: ["besch", "werden"], abfallannahmestelle: ["abfall", "annahmestelle"], hartschalen: ["hart", "schalen"], faserfueller: ["faser", "fueller"], klebezement: ["klebe", "zement"], stosskanten: ["stoss", "kanten"], klarlackbeschichtung: ["klarlack", "beschichtung"], sattlermesser: ["sattler", "messer"], ultraviolettem: ["ultra", "violettem"], fuellstoffschicht: ["fuellstoff", "schicht"], tieferen: ["tief", "eren"], mischungsverhaeltnis: ["mischung", "verhaeltnis"], herausgedrueckten: ["heraus", "gedrueckten"], staubtrocken: ["staubt", "rocken"], hartdach: ["hart", "dach"], alkoholischen: ["alkohol", "isch"], seifenbasis: ["seife", "basis"], ultraviolettes: ["ultra", "violettes"], stoffverdeck: ["stoff", "verdeck"], stoffverdecks: ["stoff", "verdecks"], seitenblechen: ["seiten", "blechen"], verdeckschienen: ["verdeck", "schienen"], gewindestifte: ["gewinde", "stifte"], verdeckmuttern: ["verdeck", "muttern"], verdeckkonsole: ["verdeck", "konsole"], gewindestiften: ["gewinde", "stiften"], verdeckmutter: ["verdeck", "mutter"], cabrioverdeckbezug: ["cabrio", "verdeck", "bezug"], verdeckrahmen: ["verdeck", "rahmen"], cabrioverdeckbezugs: ["cabrio", "verdeck", "bezugs"], klebstoffresten: ["klebstoff", "resten"], loesemittel: ["loese", "mittel"], verdeckbezug: ["verdeck", "bezug"], verdeckbezugs: ["verdeck", "bezugs"], verdeckgestaenge: ["verdeck", "gestaenge"], spannseils: ["spann", "seils"], scheibenschutz: ["scheibe", "schutz"], oberkanten: ["ober", "kanten"], verdeckrahmens: ["verdeck", "rahmens"], mittelmarkierung: ["mittel", "markierung"], weiterarbeiten: ["weiter", "arbeiten"], schweissdraht: ["schweiss", "draht"], spezialgleitmittels: ["spezial", "gleitmittels"], verdeckbahn: ["verdeck", "bahn"], verdeckstoffs: ["verdeck", "stoffs"], verdeckspriegeln: ["verdeck", "spriegel"], spezialgleitmittel: ["spezial", "gleitmittel"], verdeckstoff: ["verdeck", "stoff"], verdeckspriegel: ["verdeck", "spriegel"], anzeigeninstrumenten: ["anzeigen", "instrumenten"], gluehlampen: ["glueh", "lampen"], instrumentenkombinationen: ["instrumenten", "kombinationen"], fundstelle: ["fund", "tell"], lichtleiters: ["licht", "leiters"], lichtleiter: ["licht", "leiter"], testgeraet: ["test", "geraet"], kombiinstrumente: ["kombi", "instrumente"], drehzahlmessers: ["drehzahl", "messers"], fahrzeugspezifisch: ["fahrzeug", "spezifisch"], anzeigezustand: ["anzeige", "zustand"], generation: ["gene", "ration"], anzeigeverhalten: ["anzeige", "verhalten"], anzeigeabweichungen: ["anzeige", "abweichungen"], schubphase: ["schub", "phase"], codiersteckertabelle: ["codierst", "ecker", "tabelle"], anzeigennadel: ["anzeige", "nadel"], diodenrelais: ["dioden", "relais"], fahrzeugfunktion: ["fahrzeug", "funktion"], zentralwarnleuchte: ["zentral", "warnleuchte"], eingangssignal: ["eingang", "signal"], geberueberwachung: ["geber", "ueberwachung"], bordnetzspannung: ["bordnetz", "spannung"], eingangsleitungen: ["eingangs", "leitungen"], oelstandsueberwachungssystems: ["oelstands", "ueberwachungssystems"], multimeterpruefungen: ["multimeter", "pruefungen"], oelstandgeber: ["oelstand", "geber"], lampenkontrolle: ["lampen", "kontrolle"], sicherungsueberwachung: ["sicherung", "ueberwachung"], bordspannung: ["bord", "spannung"], standlichtschalter: ["standlicht", "schalter"], kabelbezeichnungen: ["kabel", "bezeichnungen"], zuendungsplus: ["zuendung", "plus"], fluessigkeitsstandsueberwachung: ["fluessigkeitsstand", "ueberwachung"], ablaufdiagramme: ["ablauf", "diagramme"], motoroelstands: ["motoroel", "stands"], geberkabels: ["geber", "kabels"], scheibenwaschfluessigkeit: ["scheiben", "waschfluessigkeit"], frostschutzkonzentration: ["frostschutz", "konzentration"], gluehlampenpruefgeraet: ["gluehlampen", "pruefgeraet"], gluehlampenpruefgeraets: ["gluehlampen", "pruefgeraet"], ordnungsgemaesser: ["ordnung", "gemaesser"], lampenkontrollgeraet: ["lampen", "kontrollgeraet"], ausgangsbuchse: ["ausgang", "buchse"], lampenkontrollgeraets: ["lampen", "kontrollgeraets"], widerstandsvorgabe: ["widerstand", "vorgabe"], graurotes: ["grau", "rotes"], funktionierenden: ["funkt", "ionier", "enden"], abblendlichtscheinwerfern: ["abblendlicht", "scheinwerfern"], lampenpruefer: ["lampen", "pruefer"], sicherungseingaengen: ["sicherung", "eingaengen"], sicherungsausgang: ["sicherung", "ausgang"], sicherungseingang: ["sicherung", "eingang"], scheinwerfergluehlampe: ["scheinwerfer", "gluehlampe"], stromschiene: ["strom", "schiene"], elektriktafel: ["elektrik", "tafel"], zuendanlassschalters: ["zuend", "anlass", "schalters"], massesignal: ["masse", "signal"], radiostellung: ["radio", "stellung"], wahlschalter: ["wahl", "schalter"], starttaste: ["start", "taste"], drehknopf: ["dreh", "knopf"], anzeigebereichs: ["anzeige", "bereichs"], wahlschalterstellungen: ["wahlschalter", "stellungen"], kabelsatzes: ["kabel", "satzes"], kabelsatz: ["kabel", "satz"], federkontakt: ["feder", "kontakt"], tachosimulators: ["tacho", "simulators"], instrumentenkabelbaum: ["instrument", "kabelbaum"], tachometernadel: ["tachometer", "nadel"], anzeigebereich: ["anzeige", "bereich"], anzeigewerts: ["anzeige", "werts"], zurueckfaellt: ["zurueck", "faellt"], anzeigewert: ["anzeige", "wert"], geraetebeschriftungen: ["geraete", "beschriftungen"], einstellknoepfe: ["eins", "tell", "knoepfe"], motorarten: ["motor", "arten"], frequenzmessung: ["frequenz", "messung"], anschlussposition: ["anschluss", "position"], dieselmotoren: ["diesel", "motoren"], einstellknopf: ["eins", "tell", "knopf"], anzeigeverzoegerung: ["anzeige", "verzoegerung"], drehzahlbedingung: ["drehzahl", "bedingung"], zeigerauslenkung: ["zeiger", "auslenkung"], drehbereichs: ["dreh", "bereichs"], zeitpunkt: ["zeit", "punkt"], anzeigeablauf: ["anzeige", "ablauf"], punktmuster: ["punkt", "muster"], fortschreitenden: ["fort", "schreitenden"], zeitzaehler: ["zeit", "zaehler"], zeitsymbols: ["zeit", "symbols"], zeitsymbol: ["zeit", "symbol"], wegstreckenzaehler: ["wegstrecke", "zaehler"], instrumentensimulator: ["instrument", "simulator"], adapteranschluesse: ["adapter", "anschluesse"], instrumentenadapter: ["instrument", "adapter"], kodierstecker: ["kodierst", "ecker"], anschlussstelle: ["anschluss", "stelle"], arbeitsgruppe: ["arbeit", "gruppe"], scheinwerfern: ["schein", "werfern"], scheinwerfereinheit: ["scheinwerfer", "einheit"], abblendlichtscheinwerfer: ["abblendlicht", "scheinwerfer"], fahrzeugvorbereitung: ["fahrzeug", "vorbereitung"], doppelscheinwerfereinheit: ["doppelscheinwerfer", "einheit"], toleranzbereichs: ["toleranz", "bereichs"], seitenverstellung: ["seiten", "verstellung"], hoehenverstellung: ["hoehen", "verstellung"], kuehlergrillabschnitt: ["kuehlergrill", "abschnitt"], toleranzbereich: ["toleranz", "bereich"], scheinwerferstecker: ["scheinwerfer", "stecker"], fernlichtlampe: ["fernlicht", "lampe"], kugelzapfen: ["kugel", "zapfen"], abblendlichtlampe: ["abblendlicht", "lampe"], heckleuchte: ["heck", "leuchte"], bildhinweise: ["bild", "hinweise"], fahrzeugbezogene: ["fahrzeug", "bezogene"], ausbauhinweise: ["ausbau", "hinweise"], glaskolben: ["glas", "kolben"], gluehlampentyp: ["glueh", "lampentyp"], streuscheibe: ["streu", "scheibe"], lampenpositionen: ["lampen", "positionen"], heckleuchtenabdeckung: ["heckleuchte", "abdeckung"], fahrtrichtungsanzeigers: ["fahrtrichtung", "anzeigers"], zusatzbremsleuchte: ["zusatz", "bremsleuchte"], gluehlampenwechsel: ["gluehlampe", "wechsel"], hochgesetzten: ["hoch", "gesetzten"], rastlaschen: ["rast", "laschen"], inhaltsuebersichtsseite: ["inhalts", "uebersichtsseite"], klimaanlagenfunktion: ["klimaanlage", "funktion"], heizungsbauteilen: ["heizung", "bauteilen"], heckscheibengeblaese: ["heckscheibe", "geblaese"], luftstromdiagramm: ["luftstrom", "diagramm"], kaeltemittelkreislauf: ["kaeltemittel", "kreislauf"], kaeltemitteln: ["kaelte", "mitteln"], fussraumbelueftung: ["fussraum", "belueftung"], scheibenbelueftung: ["scheiben", "belueftung"], frischluftklappe: ["frisch", "luftklappe"], heizungsgehaeuse: ["heizung", "gehaeuse"], heizungsgeblaese: ["heizung", "geblaese"], heizungsgeblaesemotor: ["heizung", "geblaesemotor"], heizungsventil: ["heizung", "ventil"], kaeltemittelkreislaufs: ["kaeltemittel", "kreislaufs"], expansionsventil: ["expansion", "ventil"], frostschutzschalter: ["frostschutz", "schalter"], kompressorarbeiten: ["kompressor", "arbeiten"], motorvariante: ["motor", "variante"], klimaanlagentrockner: ["klimaanlage", "trockner"], fotografische: ["fotograf", "ische"], komponentenuebersicht: ["komponente", "uebersicht"], luftklappen: ["luft", "klappen"], bedienungselementen: ["bedienung", "elementen"], frischluftklappen: ["frischluft", "klappen"], wasserventil: ["wasser", "ventil"], fussraumklappen: ["fussraum", "klappen"], bypassklappenmotor: ["bypass", "klapp", "motor"], kondenswasserablauf: ["kondenswasser", "ablauf"], heizungswasserventil: ["heizungswasser", "ventil"], klappenbetaetigung: ["klappen", "betaetigung"], niederdrucksicherheitsschalter: ["niederdruck", "sicherheitsschalter"], bedienorgane: ["bedien", "organe"], luftmenge: ["luft", "menge"], heizungsanlage: ["heizung", "anlage"], luftaustrittsoeffnungen: ["luftaustritt", "oeffnungen"], wasserdurchfluss: ["wasser", "durchfluss"], elektromagnetischen: ["elektro", "magnetischen"], schaltstromschaltung: ["schaltstrom", "schaltung"], thermostatschalter: ["thermostat", "schalter"], stoerende: ["stoer", "ende"], hochdruck: ["hoch", "druck"], hochdruckschalter: ["hochdruck", "schalter"], niederdruckschalter: ["niederdruck", "schalter"], temperaturregelklappe: ["temperatur", "regelklappe"], oeffnungswinkel: ["oeffnung", "winkel"], luftmengenregelschalter: ["luftmengen", "regelschalter"], festwiderstaende: ["fest", "widerstaende"], drehzahlstufen: ["drehzahl", "stufen"], klimageraet: ["klima", "geraet"], unterbrechungsschalter: ["unterbrechung", "schalter"], kompressorschaltkreis: ["kompressor", "schaltkreis"], klappenoeffnung: ["klappen", "oeffnung"], fluessigkeitsschlaege: ["fluessigkeit", "schlaege"], bypassluft: ["bypass", "luft"], bypassluftstellung: ["bypass", "luft", "stellung"], elektromagnetisches: ["elektro", "magnetisches"], kaeltemitteltrockner: ["kaeltemittel", "trockner"], luftverteilungsklappe: ["luftverteilung", "klappe"], fuellstation: ["fuell", "station"], belueftungsanlage: ["belueftung", "anlage"], luftverteilungsdiagramm: ["luftverteilung", "diagramm"], belueftungssystems: ["belueftung", "systems"], luftaustrittsstellen: ["luftaustritt", "stellen"], stroemungsrichtungen: ["stroemung", "richtungen"], pfeilkennzeichnungen: ["pfeil", "kennzeichnungen"], temperaturgeregelter: ["temperatur", "geregelter"], temperaturgeregelte: ["temperatur", "geregelte"], luftaustritt: ["luft", "austritt"], belueftungssystem: ["belueftung", "system"], hauptbauteile: ["haupt", "bauteile"], elektromagnetische: ["elektro", "magnetische"], zustandsbereiche: ["zustands", "bereiche"], kaeltemittels: ["kaelte", "mittels"], vereisungsschutzschalter: ["vereisung", "schutzschalter"], kaeltemittelmenge: ["kaeltemittel", "menge"], zustandsaenderung: ["zustands", "aenderung"], getriebetunnel: ["getriebe", "tunnel"], elektromagnetischer: ["elektro", "magnetischer"], herausziehbarer: ["heraus", "zieh", "barer"], tragegriff: ["trage", "griff"], torrmeter: ["torr", "meter"], vakuummessgeraet: ["vakuum", "messgeraet"], niederdruckmanometer: ["niederdruck", "manometer"], fuellventil: ["fuell", "ventil"], gasballastventil: ["gasballast", "ventil"], fuellschlauch: ["fuell", "schlauch"], netzkabel: ["netz", "kabel"], volumenskala: ["volum", "skala"], druckmanometer: ["druck", "manometer"], fuellzylinder: ["fuell", "zylinder"], temperaturpruefung: ["temperatur", "pruefung"], sicherheitskaeltemittel: ["sicherheit", "kaeltemittel"], fuellgeraets: ["fuell", "geraets"], klimaservice: ["klima", "service"], fuellgeraet: ["fuell", "geraet"], explosionsgefaehrlich: ["explosion", "gefaehrlich"], betroffene: ["betr", "offene"], koerperstellen: ["koerper", "stellen"], montagegruben: ["montage", "gruben"], erstickungsgefahr: ["erstickung", "gefahr"], zersetzungsprodukte: ["zersetzung", "produkte"], gesundheitsschaedlich: ["gesundheit", "schaedlich"], kaeltemittelflaschen: ["kaeltemittel", "flaschen"], waermequellen: ["waerme", "quellen"], kaeltemittelflasche: ["kaeltemittel", "flasche"], sauberkeitshinweise: ["sauberkeit", "hinweise"], fuellmenge: ["fuell", "menge"], zerstoerungsgefahr: ["zerstoerung", "gefahr"], niederdruckseite: ["nieder", "druckseite"], fuellschlaeuchen: ["fuell", "schlaeuchen"], fuellvorgaenge: ["fuell", "vorgaenge"], schutzkleidung: ["schutz", "kleidung"], hochdruckseite: ["hochdruck", "seite"], volumenablesepunkt: ["volum", "ablese", "punkt"], lecksuchgeraet: ["leck", "suchgeraet"], ventilstellungen: ["ventil", "stellungen"], druckwerte: ["druck", "werte"], fuellzylinders: ["fuell", "zylinders"], fuellvorgangs: ["fuell", "vorgangs"], lecksuche: ["leck", "suche"], leckstelle: ["leck", "tell"], vakuumventile: ["vakuum", "ventile"], fluessigkeitsventil: ["fluessigkeit", "ventil"], kaeltemitteldruecke: ["kaeltemittel", "druecke"], luftaustrittstemperatur: ["luftaustritt", "temperatur"], fuellschlauchleitung: ["fuellschlauch", "leitung"], thermometers: ["thermo", "meters"], luftaustrittsgitter: ["luftaustritt", "gitter"], betriebsdrucks: ["betrieb", "drucks"], toleranzbereichen: ["toleranz", "bereichen"], luftaustritts: ["luft", "austritts"], niederdruckbereich: ["niederdruck", "bereich"], hochdruckschlauch: ["hochdruck", "schlauch"], niederdruckschlauch: ["niederdruck", "schlauch"], thermometer: ["thermo", "meter"], betriebsdruckwerte: ["betriebs", "druckwerte"], hochdruckmanometern: ["hochdruck", "manometern"], sollwertdiagramm: ["sollwert", "diagramm"], druckbereich: ["druck", "bereich"], druckskala: ["druck", "skala"], temperaturskala: ["temperatur", "skala"], hochdruckbereich: ["hochdruck", "bereich"], diagrammachsen: ["diagramm", "achsen"], betriebsdruck: ["betrieb", "druck"], ventileinsatzes: ["ventil", "einsatzes"], ventileinsatzdreher: ["ventileinsatz", "dreher"], herausgeschraubt: ["heraus", "geschraubt"], kaeltemittelbestaendige: ["kaeltemittel", "bestaendige"], ventileinsaetze: ["ventil", "einsaetze"], transparenten: ["tran", "spar", "enten"], dokumentnummern: ["dokument", "nummern"], kaeltemittelbestaendiger: ["kaeltemittel", "bestaendiger"], lueftungsbedienfeld: ["lueftung", "bedienfeld"], radiooeffnung: ["radio", "oeffnung"], bedienblende: ["bedien", "blende"], betaetigungshebeln: ["betaetigung", "hebeln"], luftklappe: ["luft", "klappe"], luftklappenhebel: ["luftklappe", "hebel"], klimabedienung: ["klima", "bedienung"], mischklappe: ["misch", "klappe"], instrumententafelblende: ["instrumententafel", "blende"], radioausschnitt: ["radio", "ausschnitt"], bowdenzughuelle: ["bowdenzug", "huelle"], schiebereglers: ["schiebe", "reglers"], anschlagstellung: ["anschlag", "stellung"], radioausschnittblende: ["radio", "ausschnitt", "blende"], stellmotors: ["stell", "motors"], bedienteils: ["bedien", "teils"], gehaeuselasche: ["gehaeuse", "lasche"], bedienteil: ["bedien", "teil"], kugelkopf: ["kugel", "kopf"], heizungsgehaeuses: ["heizung", "gehaeuses"], instrumententafelbereich: ["instrumententafel", "bereich"], luftkanaelen: ["luft", "kanaelen"], wasserschlaeuche: ["wasser", "schlaeuche"], blockventil: ["block", "ventil"], schraubenschluessel: ["schrauben", "schluessel"], luftkanal: ["luft", "kanal"], wasserschlauch: ["wasser", "schlauch"], widerstandsplatte: ["widerstand", "platte"], bypassklappen: ["bypass", "klappen"], durchfuehrungshuelse: ["durchfuehrung", "huelse"], dichtungsrahmens: ["dichtung", "rahmens"], kondenswasserablaeufe: ["kondenswasser", "ablaeufe"], heizluftkanaele: ["heizluft", "kanaele"], fondbereich: ["fond", "bereich"], passgenau: ["pass", "genau"], dichtungsrahmen: ["dichtung", "rahmen"], bypassklappe: ["bypass", "klappe"], heizluftkanal: ["heizluft", "kanal"], heizungsgeblaesemotors: ["heizung", "geblaesemotors"], luefterrads: ["luefter", "rads"], motorwelle: ["motor", "welle"], luefterraeder: ["luefter", "raeder"], geblaeseschalters: ["geblaese", "schalters"], heizungsschalters: ["heizung", "schalters"], ausstattungsvarianten: ["ausstattung", "varianten"], bedienknopf: ["bedien", "knopf"], geblaesemotors: ["geblaese", "motors"], beiseitegelegt: ["beiseite", "gelegt"], seitenausschnitt: ["seitenaus", "schnitt"], wasserventils: ["wasser", "ventils"], rohrleitungen: ["rohr", "leitungen"], heizungswaermetauschers: ["heizung", "waermetauschers"], formteile: ["form", "teile"], waermetauschers: ["waerme", "tauscher"], heckscheibenluefter: ["heckscheibe", "luefter"], heckscheibenluefters: ["heckscheibe", "luefters"], expansionsventils: ["expansion", "ventils"], kaeltemittelleitungen: ["kaeltemittel", "leitungen"], anzugsdrehzahl: ["anzugs", "drehzahl"], counterhold: ["counter", "hold"], schaumstoffabdeckung: ["schaumstoff", "abdeckung"], lamellenkamm: ["lamelle", "kamm"], frostschutzschalters: ["frostschutz", "schalters"], vereisungsschutzschalters: ["vereisung", "schutzschalters"], gleichzeitige: ["gleich", "zeitige"], drucklose: ["druck", "lose"], kuehllamellen: ["kuehl", "lamellen"], spezialkamm: ["spezial", "kamm"], arbeitsanleitung: ["arbeit", "anleitung"], temperaturfuehlers: ["temperatur", "fuehlers"], schaumgummiabdeckung: ["schaumgummi", "abdeckung"], druckentlasten: ["druck", "entlasten"], montagekontrollen: ["montage", "kontrollen"], keilriemenspannung: ["keilriemen", "spannung"], sortenangaben: ["sorten", "angaben"], teilemikrofilm: ["teile", "mikrofilm"], ventiloeffners: ["ventil", "oeffner"], elektromagneten: ["elektro", "magneten"], ventiloeffner: ["ventil", "oeffner"], elektromagnet: ["elektro", "magnet"], drucklosmachen: ["drucklos", "machen"], kompressorbefestigung: ["kompressor", "befestigung"], kompressoroels: ["kompressor", "oels"], klimaanlagentrockners: ["klimaanlage", "trockners"], druckablassen: ["druck", "ablassen"], scheibenwaschbehaelters: ["scheibe", "wasch", "behaelters"], sicherheitsschaltern: ["sicherheit", "schaltern"], scheibenwaschbehaelter: ["scheibe", "wasch", "behaelter"], kondensatorbefestigungen: ["kondensator", "befestigungen"], motorluefter: ["motor", "luefter"], kaeltemittelleitung: ["kaeltemittel", "leitung"], audioanlage: ["audio", "anlage"], kassettenfach: ["kassette", "fach"], teleskopstab: ["teleskop", "stab"], werkstattkapitels: ["werkstatt", "kapitels"], zeilenende: ["zeil", "ende"], kennziffern: ["kenn", "ziffern"], teleskopantenne: ["teleskop", "antenne"], bohrposition: ["bohr", "position"], bodenwanne: ["boden", "wanne"], rostgefahr: ["rost", "gefahr"], messingring: ["messing", "ring"], steckantenne: ["steck", "antenne"], sitzanlage: ["sitz", "anlage"], masseanschliessen: ["masse", "anschliessen"], rueckenlehnenbefestigungen: ["rueckenlehnen", "befestigungen"], dichttuelle: ["dicht", "tuelle"], innenverkleidungen: ["innen", "verkleidungen"], antennenleitungen: ["antennen", "leitungen"], antennenkabels: ["antenne", "kabels"], tuerschwellerverkleidung: ["tuerschweller", "verkleidung"], einbausatz: ["einbau", "satz"], gurthalter: ["gurt", "halter"], radioantennenbuchse: ["radioantenne", "buchse"], lautsprecherleitung: ["lautsprecher", "leitung"], antennenleitung: ["antenne", "leitung"], befestigungsoeffnung: ["befestigung", "oeffnung"], antennenteile: ["antenne", "teile"], bohrspaene: ["bohr", "spaene"], bohrungsrand: ["bohrung", "rand"], rostbildungsgefahr: ["rostbildung", "gefahr"], antennenhalter: ["antenne", "halter"], masseleitungsschraube: ["masseleitung", "schraube"], seitenverkleidungen: ["seiten", "verkleidungen"], leitungsverlaufs: ["leitung", "verlaufs"], gurtfuehrung: ["gurt", "fuehrung"], motorantenne: ["motor", "antenne"], autoradio: ["auto", "radio"], steckpositionen: ["steck", "positionen"], antennenbuchse: ["antenne", "buchse"], antennenteleskop: ["antennen", "teleskop"], kunststoffseil: ["kunststoff", "seil"], kunststoffseils: ["kunststoff", "seils"], antennenantrieb: ["antenne", "antrieb"], antennenstabs: ["antenne", "stabs"], zugespitzten: ["zuge", "spitzten"], kunststoffseilendes: ["kunststoff", "eilendes"], kontaktrolle: ["kontakt", "rolle"], selbsttaetig: ["selbst", "taetig"], zugespitzte: ["zuge", "spitzte"], kunststoffende: ["kunststoff", "ende"], antennenstab: ["antenne", "stab"], hineinragen: ["hinein", "ragen"], kontaktstifts: ["kontakt", "stifts"], zusatzkabelsatz: ["zusatz", "kabelsatz"], einbaustelle: ["einbau", "stelle"], reichweitenanzeige: ["reichweite", "anzeige"], kabelbruecke: ["kabel", "bruecke"], waehlerschalter: ["waehler", "schalter"], selbstschneidenden: ["selbst", "schneidenden"], betaetigungsmotor: ["betaetigung", "motor"], anschlussarbeiten: ["anschluss", "arbeiten"], kabelbruecken: ["kabel", "bruecken"], zurueckgebundenen: ["zurueck", "gebundenen"], kombistecker: ["kombi", "stecker"], zusatzkabelbaums: ["zusatz", "kabelbaum"], kabelbaumskizze: ["kabelbaum", "skizze"], bohrmassangaben: ["bohr", "massangaben"], schnittpunkte: ["schnitt", "punkte"], bohrungsraender: ["bohrung", "raender"], federscheiben: ["feder", "scheiben"], betaetigungsmotors: ["betaetigung", "motors"], modellspezifische: ["modell", "spezifische"], drosselklappenmechanismus: ["drosselklappe", "mechanismus"], federhalterung: ["feder", "halterung"], kabelhalter: ["kabel", "halter"], federringen: ["feder", "ringen"], betaetigungsaufnahme: ["betaetigung", "aufnahme"], nippellager: ["nippel", "lager"], bedienhebels: ["bedien", "hebels"], nippelaufnahme: ["nippel", "aufnahme"], sollgeschwindigkeit: ["soll", "geschwindigkeit"], schnellkupplung: ["schnell", "kupplung"], betaetigungsseilzug: ["betaetigung", "seilzug"], kupplungspedalschalter: ["kupplungspedal", "schalter"], instandsetzungsmassnahmen: ["instandsetzung", "massnahmen"], fortgefahren: ["fort", "gefahren"], multimeterfunktionen: ["multimeter", "funktionen"], sicherungskontakt: ["sicherung", "kontakt"], seileinstellung: ["seil", "einstellung"], halteriemen: ["halte", "riemen"], kupplungspedalschalters: ["kupplungspedal", "schalters"], bremsleuchtengluehlampen: ["bremsleuchte", "gluehlampen"], bremspedalschalter: ["bremspedal", "schalter"], frequenzsignal: ["frequenz", "signal"], geschwindigkeitssender: ["geschwindigkeit", "sender"], frequenzmessgeraet: ["frequenz", "messgeraet"], antriebsgelenks: ["antrieb", "gelenks"], unterstellboecke: ["unters", "tell", "boecke"], driveshaft: ["drive", "haft"], antriebsgelenk: ["antrieb", "gelenk"], zentralstecker: ["zentral", "stecker"], zentralsteckers: ["zentral", "steckers"], leitungsbands: ["leitung", "bands"], steckereinsatzes: ["stecker", "einsatzes"], schiebesicherung: ["schiebe", "sicherung"], kontaktkammern: ["kontakt", "kammern"], kontaktfenstern: ["kontakt", "fenstern"], leitungsband: ["leitung", "band"], steckereinsatz: ["stecker", "einsatz"], leitungsfenster: ["leitung", "fenster"], steckerkammer: ["stecker", "kammer"], codiersteckers: ["codierst", "ecker"], sinngemaess: ["sinn", "gemaess"], ansauglufttemperaturfuehlers: ["ansaugluft", "temperaturfuehlers"], lufteinlassoeffnung: ["lufteinlass", "oeffnung"], zuendschlossstellungen: ["zuendschloss", "stellungen"], anzeigezustaenden: ["anzeige", "zustaenden"], zeitanzeige: ["zeit", "anzeige"], verbindungsschalter: ["verbindung", "schalter"], kabelbaumstecker: ["kabelbaum", "stecker"], freigegeben: ["frei", "gegeben"], wegstrecke: ["wegs", "trecke"], verbrauch: ["verb", "rauch"], anlasssperre: ["anlass", "sperre"], gleichzeitiges: ["gleich", "zeitiges"], zuendschlossstellung: ["zuendschloss", "stellung"], fehlerquelle: ["fehler", "quelle"], reservevolumen: ["reserve", "volumen"], tankvolumenwerte: ["tankvolumen", "werte"], reservebereich: ["reserve", "bereich"], literwert: ["liter", "wert"], reichweite: ["reich", "weite"], tankvolumens: ["tank", "volumens"], bedienfunktionen: ["bedien", "funktionen"], fehlersuchplan: ["fehler", "such", "plan"], multifunktions: ["multi", "funktion"], bordcomputeranzeige: ["bordcomputer", "anzeige"], hintergrundbeleuchtung: ["hintergrund", "beleuchtung"], fahrzeugbeleuchtung: ["fahrzeug", "beleuchtung"], signalverfolgung: ["signal", "verfolgung"], bauteilerneuerung: ["bauteil", "erneuerung"], fehlerquellen: ["fehler", "quellen"], anzeigeplatine: ["anzeige", "platine"], zuendschlosses: ["zuend", "schlosses"], tastenbeleuchtung: ["tasten", "beleuchtung"], lichtleiste: ["licht", "leiste"], spannungsdaten: ["spannung", "daten"], verbrauchssignal: ["verbrauch", "signal"], oszilloskoppruefung: ["oszilloskop", "pruefung"], tankfuellstandsanzeige: ["tankfuellstand", "anzeige"], standheizung: ["stand", "heizung"], fahrzeugheizung: ["fahrzeug", "heizung"], sollbedingungen: ["soll", "bedingungen"], tankfuellstandsgeber: ["tankfuellstand", "geber"], signalausloeser: ["signal", "ausloeser"], hupenansteuerung: ["hupen", "ansteuerung"], hupenfunktion: ["hupen", "funktion"], warntongeber: ["warnton", "geber"], anlassersperrrelais: ["anlasser", "sperrrelais"], fernbedienung: ["fern", "bedienung"], sollvorgaben: ["soll", "vorgaben"], sollvorgabe: ["soll", "vorgabe"], anlassersperre: ["anlasser", "sperre"], lenkstockschalter: ["lenkstock", "schalter"], anzeigeinformation: ["anzeige", "information"], reichweitenfunktion: ["reichweite", "funktion"], kraftstoffgeber: ["kraftstoff", "geber"], reservekontakt: ["reserve", "kontakt"], reservevolumens: ["reserve", "volumens"], einbauorts: ["einbau", "orts"], einbauteilen: ["einbau", "teilen"], tuertraegers: ["tuer", "traegers"], radiolautsprechers: ["radio", "lautsprechers"], lautsprecherrahmens: ["lautsprecher", "rahmens"], lautsprechermaske: ["lautsprecher", "maske"], selbstschneidemutter: ["selbst", "schneide", "mutter"], lautsprecherrahmen: ["lautsprecher", "rahmen"], handbremshebelabdeckung: ["handbremshebel", "abdeckung"], kassettenhalter: ["kassette", "halter"], kassettenfachs: ["kassette", "fachs"], kassettenhalters: ["kassette", "halters"], kassetteneinsatzes: ["kassetten", "einsatzes"], herausgleiten: ["heraus", "gleiten"], kassetteneinsatz: ["kassette", "einsatz"], karosserieausruestung: ["karosserie", "ausruestung"], windabweisers: ["wind", "abweiser"], reparaturbeschreibungen: ["reparatur", "beschreibungen"], windabweiser: ["wind", "abweiser"], gurtbefestigungen: ["gurt", "befestigungen"], gurtband: ["gurt", "band"], koerpergroesse: ["koerper", "groesse"], gurtabschnitt: ["gurt", "abschnitt"], sicherheitsgurtbefestigungen: ["sicherheitsgurt", "befestigungen"], montageskizzen: ["montage", "skizzen"], montagepositionen: ["montage", "positionen"], modellaenderungen: ["modell", "aenderungen"], gurtstoppern: ["gurt", "stoppern"], bildangaben: ["bild", "angaben"], gurtstopper: ["gurt", "stopper"], gurtbuegels: ["gurt", "buegels"], gurtbefestigung: ["gurt", "befestigung"], tuergummidichtung: ["tuer", "gummidichtung"], gurtumlenkung: ["gurt", "umlenkung"], gurtbands: ["gurt", "bands"], gurtpeitsche: ["gurt", "peitsche"], ruecksitzflaeche: ["ruecksitz", "flaeche"], gurtschloss: ["gurt", "schloss"], sitzgurt: ["sitz", "gurt"], sperrfunktionen: ["sperr", "funktionen"], fahrzeugneigung: ["fahrzeug", "neigung"], traegheitsmasse: ["traegheit", "masse"], gurtaufwicklung: ["gurt", "aufwicklung"], ausloesesystem: ["ausloese", "system"], vollbremsung: ["voll", "bremsung"], sitzlehne: ["sitz", "lehne"], halteposition: ["halte", "position"], schrittgeschwindigkeit: ["schritt", "geschwindigkeit"], ruckartigen: ["ruck", "artigen"], tuerholm: ["tuer", "holm"], gurtfuehrungen: ["gurt", "fuehrungen"], verformungsbereich: ["verformung", "bereich"], sperrsystem: ["sperr", "system"], gurtschlosszunge: ["gurtschloss", "zunge"], automatikgurts: ["automatik", "gurt"], kunststofffuehrungen: ["kunststoff", "fuehrungen"], beschlagteilen: ["beschlag", "teilen"], gurtoeffnung: ["gurt", "oeffnung"], gurtschlossbeschlag: ["gurtschloss", "beschlag"], gurtschlossverkleidung: ["gurtschloss", "verkleidung"], seifenloesung: ["seifen", "loesung"], feinwaschmittel: ["fein", "waschmittel"], gurtbaender: ["gurt", "baender"], schmelzstellen: ["schmelz", "stellen"], nahtbeschaedigung: ["naht", "beschaedigung"], schwenkbefestigung: ["schwenk", "befestigung"], universalspray: ["universal", "spray"], verbessern: ["verb", "essern"], verschleissspuren: ["verschleiss", "spuren"], kunststoffhuelse: ["kunststoff", "huelse"], gurtschlossbeschlags: ["gurtschloss", "beschlags"], entscheidungsuebersicht: ["entscheidung", "uebersicht"], automatikgurte: ["automatik", "gurte"], seitenaufprall: ["seiten", "aufprall"], parkschaden: ["park", "schaden"], hinausging: ["hinaus", "ging"], gurtrolle: ["gurt", "rolle"], gurteinsteckteil: ["gurt", "einsteckteil"], gurtbandoeffnung: ["gurtband", "oeffnung"], abriebspuren: ["abrieb", "spuren"], frontalaufprall: ["frontal", "aufprall"], entscheidungsdiagramm: ["entscheidung", "diagramm"], zustandskontrolle: ["zustands", "kontrolle"], herausgezogene: ["heraus", "gezogene"], gurtbandnaht: ["gurtband", "naht"], gurtschlosses: ["gurt", "schlosses"], warnsignalfunktion: ["warnsignal", "funktion"], gurtschlossschalters: ["gurtschloss", "schalters"], befestigungslappen: ["befestigung", "lappen"], quetschstellen: ["quetschst", "ellen"], gurtstecker: ["gurt", "stecker"], senkkopfschrauben: ["senkkopf", "schrauben"], dachplatte: ["dach", "platte"], schiebedachoeffnung: ["schiebedach", "oeffnung"], fahrstrecke: ["fahr", "trecke"], hohlraeumen: ["hohl", "raeumen"], hohlraumversiegelung: ["hohlraum", "versiegelung"], karosseriehohlraeumen: ["karosserie", "hohlraeumen"], karosseriehohlraum: ["karosserie", "hohlraum"], vorbereitungsmassnahmen: ["vorbereitung", "massnahmen"], unterbodenschutzbeschichtung: ["unterbodenschutz", "beschichtung"], lackschaeden: ["lack", "schaeden"], versiegelungsmittel: ["versiegelung", "mittel"], stufenbohrer: ["stufen", "bohrer"], herabtropfendes: ["herab", "tropfendes"], unfallbeschaedigter: ["unfall", "beschaedigter"], fahrzeugkarosserie: ["fahrzeug", "karosserie"], hohlraum: ["hohl", "raum"], inspektionsblaettern: ["inspektion", "blaettern"], versiegelungsarbeiten: ["versiegelung", "arbeiten"], bodenaufbaus: ["boden", "aufbaus"], vordersitzen: ["vorder", "sitzen"], tuerverstaerkungen: ["tuer", "verstaerkungen"], federbeinaufnahmen: ["federbein", "aufnahmen"], motorhaubenstreben: ["motorhaube", "streben"], traegerprofile: ["traeger", "profile"], vorderwagens: ["vorder", "wagens"], federbeinverstaerkung: ["federbein", "verstaerkung"], radhausverstaerkungen: ["radhaus", "verstaerkungen"], wasserkastens: ["wasser", "kastens"], tuertraeger: ["tuer", "traeger"], kofferraumdeckelstreben: ["kofferraumdeckel", "streben"], hakensonde: ["haken", "sonde"], tuersonde: ["tuer", "sonde"], schlitzduese: ["schlitz", "duese"], flachduese: ["flach", "duese"], tuerverstaerkung: ["tuer", "verstaerkung"], kofferraumdeckelstrebe: ["kofferraumdeckel", "strebe"], zahlreicher: ["zahl", "reicher"], zugangsoeffnungen: ["zugangs", "oeffnungen"], versiegelungsstellen: ["versiegelung", "stellen"], radhausbereichen: ["radhaus", "bereichen"], hinterwagen: ["hinter", "wagen"], detailbilder: ["detail", "bilder"], spritzrichtungen: ["spritz", "richtungen"], materialhinweis: ["material", "hinweis"], bildseite: ["bild", "seite"], bilduebersicht: ["bild", "uebersicht"], karosserieansicht: ["karosserie", "ansicht"], einfuehrstellen: ["einfuehrst", "ellen"], hohlraumsonde: ["hohlraum", "sonde"], hohlraumschutzwachs: ["hohlraumschutz", "wachs"], einfuehrstelle: ["einfuehrst", "elle"], tuerhohlraum: ["tuer", "hohlraum"], schraubengroesse: ["schraube", "groesse"], hauptlagerschraube: ["hauptlager", "schraube"], motorblock: ["motor", "block"], aluminiumguss: ["aluminium", "guss"], gusseisen: ["guss", "eisen"], hauptlagerdeckelschrauben: ["hauptlager", "deckelschrauben"], stehende: ["steh", "ende"], bundschrauben: ["bund", "schrauben"], distanzstift: ["distanz", "stift"], gewindehuelsen: ["gewinde", "huelsen"], versteifungsschale: ["versteifung", "schale"], kuehlmittelablassschraube: ["kuehlmittel", "ablassschraube"], hauptoelbohrung: ["haupt", "oelbohrung"], bundschraube: ["bund", "schraube"], setzzeit: ["setz", "zeit"], warmlaufzeit: ["warm", "laufzeit"], anzugsmomenttabelle: ["anzugs", "moment", "tabelle"], anzugswinkeln: ["anzugs", "winkeln"], warmlauf: ["warm", "lauf"], setzzeiten: ["setz", "zeiten"], tabellenspalten: ["tabelle", "spalten"], dokumentkennung: ["dokument", "kennung"], anzugswinkeltabelle: ["anzugs", "winkel", "tabelle"], motorbaureihen: ["motorbau", "reihen"], grauguss: ["grau", "guss"], motorbereich: ["motor", "bereich"], verwendungsdaten: ["verwendung", "daten"], anzugsverfahren: ["anzugs", "verfahren"], grundanzugsmoment: ["grund", "anzugs", "moment"], drehwinkelstufen: ["drehwinkel", "stufen"], grundanzugsdrehmoment: ["grund", "anzugs", "drehmoment"], motorvarianten: ["motor", "varianten"], schraubengroessen: ["schraube", "groessen"], steuergehaeuses: ["steuer", "gehaeuses"], gewindegroesse: ["gewinde", "groesse"], festigkeitsklasse: ["festigkeit", "klasse"], gewindegroessen: ["gewinde", "groessen"], anzugsdrehmomentuebersicht: ["anzugs", "drehmoment", "uebersicht"], schraubenabmessung: ["schrauben", "abmessung"], anzugsdrehmomentangabe: ["anzugs", "drehmoment", "angabe"], schwungradschrauben: ["schwungrad", "schrauben"], mikroverkapselte: ["mikro", "verkapselte"], anzugswerte: ["anzug", "werte"], keilriemenscheibe: ["keilriemen", "scheibe"], drehmomenten: ["dreh", "momenten"], mehrstufige: ["mehr", "stufige"], schraubenguete: ["schraube", "guete"], gewindezuordnung: ["gewinde", "zuordnung"], befestigungsstelle: ["befestigung", "stelle"], pleuelstangen: ["pleuel", "tangen"], festdrehmoment: ["fest", "drehmoment"], motorfamilien: ["motor", "familien"], anzugsdaten: ["anzug", "daten"], keilrippenriemen: ["keil", "rippen", "riemen"], spannhebel: ["spann", "hebel"], anzugsdrehmomenttabelle: ["anzugs", "drehmoment", "tabelle"], durchbiegungselement: ["durchbiegung", "element"], generatorhalter: ["generator", "halter"], lagerbolzens: ["lager", "bolzens"], nockenwellenraeder: ["nockenwelle", "raeder"], nockenwellenflansch: ["nockenwelle", "flansch"], dateikennung: ["datei", "kennung"], verschlussteile: ["verschluss", "teile"], lagerflansch: ["lager", "flansch"], ziehhebel: ["zieh", "hebel"], kipphebeln: ["kipp", "hebeln"], ziehhebeln: ["zieh", "hebeln"], zahnriemenscheibe: ["zahnriemen", "scheibe"], drehmomentwert: ["drehmoment", "wert"], nockenwellensteuerung: ["nockenwelle", "steuerung"], gewindeausfuehrung: ["gewinde", "ausfuehrung"], anzugsmass: ["anzug", "mass"], arbeitsreferenz: ["arbeit", "referenz"], hohlschraube: ["hohl", "schraube"], hydraulikkolbens: ["hydraulik", "kolbens"], hydraulikkolben: ["hydraulik", "kolben"], filterschraube: ["filter", "schraube"], druckleitung: ["druck", "leitung"], druckspeicher: ["druck", "speicher"], kopfzeile: ["kopf", "zeile"], verstelleinheit: ["verstell", "einheit"], verschraubungspunkte: ["verschraubung", "punkte"], gewindeabmessungen: ["gewinde", "abmessungen"], antriebsteile: ["antrieb", "steile"], ueberdruckventil: ["ueberdruck", "ventil"], oelpumpendeckel: ["oelpumpe", "deckel"], einwegpatrone: ["einweg", "patrone"], newtonmeter: ["newton", "meter"], nockenwellenschmierung: ["nockenwelle", "schmierung"], schraubentypen: ["schraube", "typen"], aluminiumschraube: ["aluminium", "schraube"], gewindeeinsatz: ["gewinde", "einsatz"], ringanschluss: ["ring", "anschluss"], ringauge: ["ring", "auge"], turbolader: ["turbo", "lader"], anschlussgroesse: ["anschluss", "groesse"], thermostatgehaeuses: ["thermostat", "gehaeuses"], abgaskruemmers: ["abgas", "kruemmer"], einbaumasstabelle: ["einbaumass", "tabelle"], auspuffmuttern: ["auspuff", "muttern"], bypassventil: ["bypass", "ventil"], stroemungsteil: ["stroemung", "steil"], ringmutter: ["ring", "mutter"], bypassventils: ["bypass", "ventils"], ladeluftfuehrung: ["ladeluft", "fuehrung"], motorbauarten: ["motor", "bauarten"], mikroverkapselten: ["mikro", "verkapselten"], luftpumpe: ["luft", "pumpe"], steuerventile: ["steuer", "ventile"], luftansaugrohr: ["luft", "ansaugrohr"], druckschraube: ["druck", "schraube"], sauerstoffsonde: ["sauerstoff", "sonde"], gemischaufbereitungssystem: ["gemisch", "aufbereitungssystem"], leerlaufabschaltventil: ["leerlauf", "abschaltventil"], durchflussventil: ["durchfluss", "ventil"], drosselklappenbaugruppe: ["drosselklappe", "baugruppe"], schwimmergehaeuse: ["schwimmer", "gehaeuse"], warmlaufregler: ["warmlauf", "regler"], druckreglers: ["druck", "reglers"], verschraubungsbolzen: ["verschraubung", "bolzen"], filtergehaeuse: ["filter", "gehaeuse"], einspritzpumpenregelung: ["einspritzpumpe", "regelung"], gemischaufbereitung: ["gemisch", "aufbereitung"], verteilereinspritzpumpe: ["verteiler", "einspritzpumpe"], kupplungsschraube: ["kupplung", "schraube"], druckventilhalter: ["druckventil", "halter"], kraftstoffabsperrvorrichtung: ["kraftstoff", "absperrvorrichtung"], kraftstoffmengensystem: ["kraftstoff", "mengensystem"], newtonmetern: ["newton", "metern"], regelsystem: ["regel", "system"], bauteilkennungen: ["bauteil", "kennungen"], lufttemperaturgeber: ["lufttemperatur", "geber"], ladedruckgeber: ["ladedruck", "geber"], doppeltemperaturgeber: ["doppel", "temperatur", "geber"], luftmassenmesser: ["luftmasse", "messer"], systemzuordnung: ["system", "zuordnung"], niederdruckaggregat: ["niederdruck", "aggregat"], niederdruckschlaeuche: ["niederdruck", "schlaeuche"], einstellwertuebersicht: ["einstellwert", "uebersicht"], druckminderer: ["druck", "minderer"], saugrohrdrucksensor: ["saugrohr", "drucksensor"], gasdichtheitssensor: ["gasdichtheit", "sensor"], halterahmen: ["halte", "rahmen"], tuersteckverbindung: ["tuer", "steckverbindung"], plusanschluesse: ["plus", "anschluesse"], schalttemperaturen: ["schalt", "temperaturen"], instrumentenbeleuchtungs: ["instrumente", "beleuchtung"], instrumentenbrett: ["instrument", "brett"], schaltblock: ["schalt", "block"], fahrzeugtypspezifische: ["fahrzeugtyp", "spezifische"], fensterhebermodul: ["fensterheber", "modul"], scheibenwischanlage: ["scheibe", "wisch", "anlage"], wischermotors: ["wischer", "motors"], wischerkonsole: ["wischer", "konsole"], wischerwelle: ["wischer", "welle"], herstellerabhaengigen: ["hersteller", "abhaengigen"], wischerhalter: ["wischer", "halter"], kontaktdruckmotor: ["kontaktdruck", "motor"], motorkurbel: ["motor", "kurbel"], scheibenwischeranlage: ["scheibenwischer", "anlage"], heckscheibenwischer: ["heckscheibe", "wischer"], wischeranlage: ["wischer", "anlage"], einbaupositionsabhaengigen: ["einbau", "position", "abhaengigen"], wischerarme: ["wischer", "arme"], windlaufblechhalter: ["wind", "lauf", "blechhalter"], dokumentkennzeichnung: ["dokument", "kennzeichnung"], originalunterlage: ["original", "unterlage"], motorhebel: ["motor", "hebel"], spritzduese: ["spritz", "duese"], schraubenabmessungen: ["schrauben", "abmessungen"], getriebeausfuehrung: ["getriebe", "ausfuehrung"], getriebetypen: ["getriebe", "typen"], wandlerglocke: ["wandler", "glocke"], zwischenplatte: ["zwischen", "platte"], automatikgetriebetypen: ["automatikgetriebe", "typen"], oelbohrungsstopfen: ["oelbohrung", "stopfen"], daempferdeckel: ["daempfer", "deckel"], wandlerglockengehaeuse: ["wandler", "glockengehaeuse"], ausgangsflansches: ["ausgangs", "flansches"], kopfzeilen: ["kopf", "zeilen"], zentralschraube: ["zentral", "schraube"], planetengetriebeantrieb: ["planetengetriebe", "antrieb"], schraubenkopfes: ["schraube", "kopfes"], schaltkupplungen: ["schalt", "kupplungen"], steuerelemente: ["steuer", "elemente"], ventilkoerpers: ["ventil", "koerpers"], ventilgehaeuses: ["ventil", "gehaeuses"], ventilkoerper: ["ventil", "koerper"], adapterplatte: ["adapter", "platte"], schaltgeraet: ["schalt", "geraet"], ventilgehaeuse: ["ventil", "gehaeuse"], schaltventile: ["schalt", "ventile"], parksperre: ["park", "sperre"], primaerpumpe: ["primaer", "pumpe"], oelpumpengehaeuses: ["oelpumpen", "gehaeuses"], verschlussschraube: ["verschluss", "schraube"], drehmomentangaben: ["drehmoment", "angaben"], fliehkraftregler: ["fliehkraft", "regler"], fliehkraftreglers: ["fliehkraft", "reglers"], bauteilzuordnung: ["bauteil", "zuordnung"], reglerflansch: ["regler", "flansch"], gewindebolzen: ["gewinde", "bolzen"], reglergehaeuse: ["regler", "gehaeuse"], schaltaggregat: ["schalt", "aggregat"], fuehrungsplatte: ["fuehrung", "platte"], parksperrenmechanik: ["parksperre", "mechanik"], halteplatte: ["halte", "platte"], schaltelemente: ["schalt", "elemente"], getriebesteckdose: ["getriebe", "steckdose"], drehmomentwandler: ["drehmoment", "wandler"], automatikgetriebegruppe: ["automatikgetriebe", "gruppe"], drehmomentwandlers: ["drehmoment", "wandlers"], getriebefamilie: ["getriebe", "familie"], drehmomentuebersicht: ["drehmoment", "uebersicht"], aussenschaltbetaetigung: ["aussen", "schalt", "betaetigung"], anzugsmomente: ["anzugs", "momente"], innenliegenden: ["innen", "liegenden"], schaltsegment: ["schalt", "segment"], anzugsmoment: ["anzugs", "moment"], schalteinheit: ["schalt", "einheit"], halterbauteile: ["halter", "bauteile"], getriebeaufhaengungen: ["getriebe", "aufhaengungen"], traegerrohr: ["traeger", "rohr"], innensechskantschrauben: ["innensechskant", "schrauben"], handschaltgetriebe: ["hand", "schaltgetriebe"], sonderwert: ["sonder", "wert"], getriebevarianten: ["getriebe", "varianten"], getriebegehaeusehaelften: ["getriebegehaeuse", "haelften"], dichtflansch: ["dicht", "flansch"], befestigungslaschen: ["befestigung", "laschen"], countershaft: ["counter", "haft"], dichtkappen: ["dicht", "kappen"], rueckwaertsgangbolzen: ["rueckwaertsgang", "bolzen"], klemmpratzen: ["klemm", "pratzen"], lagerhalteplatten: ["lager", "halteplatten"], loesemomente: ["loese", "momente"], masseinheiten: ["mass", "einheiten"], schaltkomponenten: ["schalt", "komponenten"], schaltgetriebeeinheit: ["schaltgetriebe", "einheit"], anschlusskomponenten: ["anschluss", "komponenten"], tankbefestigungsschrauben: ["tank", "befestigungsschrauben"], pumpenaggregat: ["pumpen", "aggregat"], gummimetalllager: ["gummi", "metall", "lager"], kraftstoffdampfentlueftung: ["kraftstoffdampf", "entlueftung"], tankverschlussringe: ["tankverschluss", "ringe"], dichtungsringe: ["dichtung", "ringe"], saugpumpe: ["saug", "pumpe"], tankfuellstandgeber: ["tankfuellstand", "geber"], metalldichtring: ["metall", "dichtring"], antriebsplatte: ["antrieb", "platte"], schraubenfestigkeitsklasse: ["schraube", "festigkeit", "klasse"], kegelhuelse: ["kegel", "huelse"], anschlussverschraubungen: ["anschluss", "verschraubungen"], sicherungsschraube: ["sicherung", "schraube"], pedalbaugruppe: ["pedal", "baugruppe"], motorelektrische: ["motor", "elektrische"], primaeranschluesse: ["primaer", "anschluesse"], schraubenbezeichnungen: ["schrauben", "bezeichnungen"], schaltgeraete: ["schalt", "geraete"], klopfsensor: ["klopf", "sensor"], steuergeraetekasten: ["steuergeraete", "kasten"], winkelimpulsgeber: ["winkel", "impulsgeber"], kurbelwellensensor: ["kurbelwelle", "sensor"], zylinderkurbelgehaeuse: ["zylinder", "kurbelgehaeuse"], gluehkerzenrelais: ["gluehkerze", "relais"], gluehkerze: ["glueh", "kerze"], riemenspanner: ["riemen", "spanner"], leitungshalters: ["leitung", "halters"], leitungshalter: ["leitung", "halter"], drehzahlregler: ["drehzahl", "regler"], anlasserbefestigung: ["anlasser", "befestigung"], mutterngroessen: ["muttern", "groessen"], kabelbaumanschluss: ["kabelbaum", "anschluss"], kuehlmittelflansch: ["kuehlmittel", "flansch"], wasserflansch: ["wasser", "flansch"], lufttemperatursensor: ["lufttemperatur", "sensor"], oeltemperatursensor: ["oeltemperatur", "sensor"], pedalwertgeber: ["pedal", "wertgeber"], pedalkonsole: ["pedal", "konsole"], motorsteuergeraeten: ["motor", "steuergeraeten"], verschraubungsarten: ["verschraubung", "arten"], steuergeraetekastens: ["steuergeraete", "kastens"], fuellstandsschalter: ["fuellstand", "schalter"], schluesselweite: ["schluessel", "weite"], motoroelkuehlers: ["motoroel", "kuehler"], oelfilterkopf: ["oelfilter", "kopf"], getriebeoelkuehler: ["getriebe", "oelkuehler"], arbeitsvorgabe: ["arbeit", "vorgabe"], feingewinde: ["fein", "gewinde"], reibungsbedingungen: ["reibung", "bedingungen"], cadmiumbeschichtete: ["cadmium", "beschichtete"], verbindungselemente: ["verbindung", "elemente"], regelmaessige: ["regel", "maessige"], drehmomentschluesseln: ["drehmoment", "schluesseln"], spaltenueberschriften: ["spalten", "ueberschriften"], schaftschrauben: ["schaft", "schrauben"], schmierzustand: ["schmier", "zustand"], cadmiumbeschichteten: ["cadmium", "beschichteten"], ausnutzungsgrad: ["ausnutzung", "grad"], schraubenwerkstoffs: ["schrauben", "werkstoffs"], schmierbedingung: ["schmier", "bedingung"], werkstoffen: ["werkst", "offen"], regelmaessigen: ["regel", "maessigen"], katalogen: ["kata", "logen"], schaftschraube: ["schaft", "schraube"], regelgewinde: ["regel", "gewinde"], drehmomentpruefgeraet: ["drehmoment", "pruefgeraet"], gueltigkeitsbereich: ["gueltigkeit", "bereich"], vorgabewerte: ["vorgab", "ewert"], werksnorm: ["werk", "norm"], geltungsbereich: ["geltung", "bereich"], maximales: ["maxi", "male"], extraktorfirma: ["extraktor", "firma"], anwendungsbereich: ["anwendung", "bereich"], firmenstandard: ["firmen", "standard"], stroemungsabschnitt: ["stroemung", "abschnitt"], schalldaempfer: ["schall", "daempfer"], druckfedern: ["druck", "federn"], abgasbaugruppe: ["abgas", "baugruppe"], druckfeder: ["druck", "feder"], schaltarmkonsole: ["schalt", "armkonsole"], einstellbarer: ["eins", "tell", "barer"], konsolenteilen: ["konsole", "teilen"], schaltturm: ["schalt", "turm"], gelenkwellenzapfen: ["gelenkwelle", "zapfen"], spannmutter: ["spann", "mutter"], mittellagerzapfen: ["mittel", "lagerzapfen"], verteilergetriebes: ["verteiler", "getriebes"], verschlussschrauben: ["verschluss", "schrauben"], uebersichtsseite: ["uebersicht", "seite"], tachoantrieb: ["tacho", "antrieb"], anhaengerkupplung: ["anhaenger", "kupplung"], anzugsreihenfolge: ["anzugs", "reihenfolge"], schlitzmutter: ["schlitz", "mutter"], aufnahmerohr: ["aufnahme", "rohr"], axialstreben: ["axial", "trebe"], verstaerkungsbuegels: ["verstaerkung", "buegels"], aufnahmerohrs: ["aufnahme", "rohrs"], kopfstuetze: ["kopf", "stuetze"], gurthoehenverstellung: ["gurt", "hoehenverstellung"], rueckenlehnenverriegelung: ["rueckenlehne", "verriegelung"], rollobefestigung: ["rollo", "befestigung"], airbagmodule: ["airbag", "module"], airbagmodul: ["airbag", "modul"], stahlhalter: ["stahl", "halter"], gewindeschraube: ["gewinde", "schraube"], zusatzmaterial: ["zusatz", "material"], diagnosehandbuch: ["diagnose", "handbuch"], italienisch: ["italien", "isch"], doppelseite: ["doppel", "seite"], kenndaten: ["kenn", "daten"], diagnosehandbuchs: ["diagnose", "handbuchs"], diagnosefunktionen: ["diagnose", "funktionen"], kraftstoffvariante: ["kraftstoff", "variante"], fahrzeugmarke: ["fahrzeug", "marke"], schnellpruefungen: ["schnell", "pruefungen"], ausbauanweisungen: ["ausbau", "anweisungen"], fahrzeugmodelle: ["fahrzeug", "modelle"], variantenkodierung: ["varianten", "kodierung"], lambdaregelung: ["lambda", "regelung"], ausschaltventil: ["ausschalt", "ventil"], leerlauffuellungsregelung: ["leerlauf", "fuellung", "regelung"], fehlersuchschema: ["fehler", "suchschema"], fahrzeugspezifischen: ["fahrzeug", "spezifischen"], kundenbeanstandungen: ["kunden", "beanstandungen"], fehlersymptome: ["fehler", "symptome"], spezifisch: ["spezi", "fisch"], kundenbeanstandung: ["kunden", "beanstandung"], bauteilfehlern: ["bauteil", "fehlern"], grundanweisung: ["grund", "anweisung"], anschlussklemmenbelegungen: ["anschlussklemme", "belegungen"], verbindlich: ["verbind", "lich"], spannungsfuehrenden: ["spannung", "fuehrenden"], spannungsspitzen: ["spannung", "spitzen"], fehlersymptom: ["fehler", "symptom"], leistungsverlust: ["leistung", "verlust"], bauteilfehler: ["bauteil", "fehler"], kraftstoffabschaltung: ["kraftstoff", "abschaltung"], ansaugluftkreis: ["ansaugluft", "kreis"], zuendwinkel: ["zuend", "winkel"], fehlstellen: ["fehlst", "ellen"], schnellpruefliste: ["schnell", "pruefliste"], universaltester: ["universal", "tester"], referenzmarkengeber: ["referenzmarke", "geber"], adapterkabel: ["adapter", "kabel"], katalognummer: ["katalog", "nummer"], fahrzeugmodellen: ["fahrzeug", "modellen"], funktionstest: ["funktion", "test"], flachbatterie: ["flach", "batterie"], wicklungswiderstand: ["wicklung", "widerstand"], temperaturabhaengig: ["temperatur", "abhaengig"], fahrpedalkontakt: ["fahrpedal", "kontakt"], minimalstellung: ["minimal", "stellung"], kontaktwiderstand: ["kontakt", "widerstand"], waehlerstellungen: ["waehler", "stellungen"], referenzmarken: ["referenz", "marken"], zuendspulensignale: ["zuendspule", "signale"], waehlerstellung: ["waehler", "stellung"], hoehenlage: ["hoehe", "lage"], referenzgebers: ["referenz", "gebers"], schliesszeit: ["schliess", "zeit"], referenzmarkensignal: ["referenzmarke", "signal"], kraftstoffvariantencodierung: ["kraftstoff", "varianten", "codierung"], referenzgeber: ["referenz", "geber"], referenzbilder: ["referenz", "bilder"], drosselklappensignal: ["drosselklappe", "signal"], kraftstoffpumpensignal: ["kraftstoffpumpe", "signal"], motorbetriebs: ["motor", "betriebs"], zeitmessung: ["zeit", "messung"], zuendstufe: ["zuend", "stufe"], pumpenansteuerung: ["pumpen", "ansteuerung"], zeitmesssignal: ["zeit", "messsignal"], zeitmarkierung: ["zeit", "markierung"], signalverlaeufe: ["signal", "verlaeufe"], luftmengensignal: ["luftmenge", "signal"], motortester: ["motor", "tester"], diagnosekabel: ["diagnose", "kabel"], impulssignal: ["impuls", "signal"], motortesters: ["motor", "testers"], wiederkehrenden: ["wiederkehr", "enden"], impulssignale: ["impuls", "signale"], schnellpruefung: ["schnell", "pruefung"], messgeraeteanschluesse: ["messgeraete", "anschluesse"], signalform: ["signal", "form"], regelgrenze: ["regel", "grenze"], zeigerausschlaege: ["zeiger", "ausschlaege"], steuerwert: ["steuer", "wert"], sondenheizung: ["sonden", "heizung"], anschlussspannung: ["anschluss", "spannung"], innenwiderstand: ["innen", "widerstand"], steckerfarbe: ["stecker", "farbe"], bewegliche: ["beweg", "lich"], luftmengenmesserklappe: ["luftmengenmesser", "klappe"], auflagepunkten: ["auflage", "punkten"], luftspalt: ["luft", "spalt"], leerlaufkontakts: ["leerlauf", "kontakts"], volllastkontakts: ["volllast", "kontakts"], hochspannungsanschluesse: ["hochspannung", "anschluesse"], kennwert: ["kenn", "wert"], leerlaufpruefung: ["leerlauf", "pruefung"], hoehengeber: ["hoehe", "geber"], gemischschraube: ["gemisch", "schraube"], motordaten: ["motor", "daten"], gesamtwiderstand: ["gesamt", "widerstand"], leerlaufkontrolle: ["leerlauf", "kontrolle"], gemischeinstellung: ["gemisch", "einstellung"], bypassschraube: ["bypass", "schraube"], entnahmestelle: ["entnahme", "stelle"], autodata: ["auto", "data"], produktionsbedingten: ["produktion", "bedingten"], kurbelwellengrad: ["kurbelwelle", "grad"], stellglieder: ["stell", "glieder"], pumpensicherung: ["pumpen", "sicherung"], elektroeinspritzventil: ["elektro", "einspritzventil"], bremsvorrichtungspumpe: ["bremsvorrichtung", "pumpe"], pleuelstange: ["pleuel", "stange"], standardbegriff: ["standard", "begriff"], anfangsbuchstabe: ["anfangs", "buchstabe"], liesmich: ["lies", "mich"], willkommen: ["will", "kommen"], wissensarchiv: ["wissen", "archiv"], projektordner: ["projekt", "ordner"], drittanbietern: ["dritt", "anbietern"], betrachter: ["betr", "achter"], ausgangspunkt: ["ausgang", "punkt"], deutschem: ["deut", "schem"], dateiname: ["datei", "name"], ausbauseiten: ["ausbau", "seiten"], eigenstaendig: ["eigen", "staendig"], deutlich: ["deut", "lich"], treffsicherer: ["treff", "sicherer"], standardsuche: ["standard", "suche"], relevanteste: ["relevant", "este"], tippfehlertolerant: ["tippfehler", "tolerant"], meintest: ["mein", "test"], sinnverwandte: ["sinn", "verwandte"], alltagsbegriffe: ["alltags", "begriffe"], zusammengesetzte: ["zusammen", "gesetzte"], eintippen: ["eint", "ippen"], suchindex: ["such", "index"], zehntelsekunde: ["zehntel", "sekunde"], seitenleiste: ["seiten", "leiste"], befehlspalette: ["befehls", "palette"], volltextsuche: ["volltext", "suche"], handbuchinhalt: ["handbuch", "inhalt"], textindex: ["text", "index"], randleiste: ["rand", "leiste"], chatverlauf: ["chat", "verlauf"], handbuchsuche: ["handbuch", "suche"], tippfehlern: ["tipp", "fehlern"], umgangssprachlichen: ["umgangs", "sprachlichen"], tippfehler: ["tipp", "fehler"], synonymtolerante: ["synonym", "tolerante"], suchergebnis: ["such", "ergebnis"], antwortgenerierung: ["antwort", "generierung"], kostencheck: ["koste", "check"], einfachster: ["einfach", "ster"], lesemodus: ["lese", "modus"], abschnittsordnern: ["abschnitt", "ordnern"], kaputtgehen: ["kaputt", "gehen"], bilddateien: ["bild", "dateien"], referenzzeichnungen: ["referenz", "zeichnungen"], uebersichtsbilder: ["uebersicht", "bilder"], textstellen: ["text", "tell"], zusammenfassung: ["zusammen", "fassung"], transkriptionen: ["transkript", "ionen"], motorausbau: ["motor", "ausbau"], waehrenddessen: ["waehrend", "dessen"], deutscher: ["deut", "scher"], fachwoerterbuch: ["fach", "woerterbuch"], datenblatt: ["daten", "blatt"], quellenangabe: ["quelle", "angabe"], modellcode: ["modell", "code"], produktionszeitraum: ["produktion", "zeitraum"], motorbauart: ["motor", "bauart"], reihenvierzylinder: ["reihen", "vierzylinder"], wassergekuehlt: ["wasser", "gekuehlt"], verdichtungsverhaeltnis: ["verdichtung", "verhaeltnis"], motordrehmoment: ["motor", "drehmoment"], drehzahlbegrenzer: ["drehzahl", "begrenzer"], doppelrollenkette: ["doppel", "rollenkette"], fuenfganggetriebe: ["fuenf", "gang", "getriebe"], getriebeuebersetzungen: ["getriebe", "uebersetzungen"], hinterradaufhaengung: ["hinterrad", "aufhaengung"], schraeglenkerachse: ["schraeglenker", "achse"], radstand: ["rads", "tand"], gesamtgewicht: ["gesamt", "gewicht"], luftwiderstand: ["luft", "widerstand"], spurweite: ["spur", "weite"], leichtmetall: ["leicht", "metall"], innenbelueftet: ["innen", "belueftet"], drosselklappenpotentiometer: ["drosselklappe", "potentiometer"], generatorriemen: ["generator", "riemen"], servolenkungsriemen: ["servolenkung", "riemen"], kraftstofftankinhalt: ["kraftstoff", "tankinhalt"], einzelfassungsvermoegen: ["einzel", "fassungsvermoegen"], betriebsoeltemperatur: ["betriebs", "oeltemperatur"], getriebeoelmenge: ["getriebe", "oelmenge"], mineralisch: ["mineral", "isch"], sintofluid: ["sinto", "fluid"], sperrdifferential: ["sperr", "differential"], differentialoelmenge: ["differential", "oelmenge"], kuehlmittelmenge: ["kuehlmittel", "menge"], kupplungsfluessigkeit: ["kupplung", "fluessigkeit"], serienausstattung: ["serien", "ausstattung"], sondermodelle: ["sonder", "modelle"], anhaltspunkt: ["anhalt", "punkt"], saugrohrunterdruck: ["saugrohr", "unterdruck"], zylinderabweichung: ["zylinder", "abweichung"], gasdruckdaempfern: ["gasdruck", "daempfern"], einzelradaufhaengung: ["einzelrad", "aufhaengung"], zurueckgeschwenkten: ["zurueck", "geschwenkten"], schraeglenkern: ["schraeg", "lenkern"], nickausgleich: ["nick", "ausgleich"], kreuzspeiche: ["kreuz", "speiche"], leichtmetallraeder: ["leicht", "metallraeder"], kartenleseleuchten: ["karten", "leseleuchten"], metalliclackierung: ["metallic", "lackierung"], sportsitze: ["sport", "sitze"] };

// src/main.js
var RESULT_LIMIT = 50;
var PREVIEW_DEBOUNCE_MS = 80;
var SearchEngine = class {
  constructor(app) {
    this.app = app;
    this.db = null;
    this.vocabulary = /* @__PURE__ */ new Set();
    this.contentByRowId = /* @__PURE__ */ new Map();
    this.synonymMap = /* @__PURE__ */ new Map();
    this.dict = /* @__PURE__ */ new Set();
    this.compoundParts = {};
    this.ready = false;
    this.building = null;
  }
  async ensureBuilt() {
    if (this.ready) return;
    if (this.building) return this.building;
    this.building = this._build();
    await this.building;
    this.building = null;
  }
  async rebuild() {
    this.ready = false;
    this.db = null;
    this.vocabulary = /* @__PURE__ */ new Set();
    this.contentByRowId = /* @__PURE__ */ new Map();
    await this.ensureBuilt();
  }
  async _loadGlossaryTerms() {
    try {
      const raw = await this.app.vault.adapter.read(".pipeline/glossary.json");
      const gloss = JSON.parse(raw);
      return Array.isArray(gloss.terms) ? gloss.terms : [];
    } catch (e) {
      console.log("vault-search: glossary.json not available, using colloquial synonyms only");
      return [];
    }
  }
  async _build() {
    const t0 = Date.now();
    const glossaryTerms = await this._loadGlossaryTerms();
    this.synonymMap = buildSynonymMap(glossaryTerms, synonyms_default);
    this.compoundParts = compound_parts_default;
    const mdFiles = this.app.vault.getMarkdownFiles();
    const docs = [];
    const titleAndTagTokenLists = [];
    const rawByRowId = /* @__PURE__ */ new Map();
    for (const file of mdFiles) {
      const cache = this.app.metadataCache.getFileCache(file) || {};
      const fm = cache.frontmatter || {};
      const titel = (fm.titel || fm.title || file.basename || "").toString();
      const titleEn = (fm.titel_en || "").toString();
      const section = (fm.sektion || "").toString();
      const code = (fm.seitencode || "").toString();
      let tags = [];
      if (Array.isArray(fm.tags)) tags = fm.tags.map((x) => x.toString());
      else if (typeof fm.tags === "string") tags = fm.tags.split(/[,\s]+/);
      let raw = "";
      try {
        raw = await this.app.vault.cachedRead(file);
      } catch (e) {
        raw = "";
      }
      const content = stripForContent(raw);
      const rowId = file.path;
      docs.push({ rowId, notePath: file.path, code, titel, titleEn, section, tags, content });
      rawByRowId.set(rowId, content);
      titleAndTagTokenLists.push(tokenize2(titel));
      titleAndTagTokenLists.push(tokenize2(titleEn));
      titleAndTagTokenLists.push(tokenize2(section));
      for (const tag of tags) titleAndTagTokenLists.push(tokenize2(tag));
      for (const tok of tokenize2(titel)) this.vocabulary.add(tok);
      for (const tok of tokenize2(titleEn)) this.vocabulary.add(tok);
      for (const tag of tags) for (const tok of tokenize2(tag)) this.vocabulary.add(tok);
      for (const tok of tokenize2(content)) this.vocabulary.add(tok);
    }
    this.dict = buildDictionary(titleAndTagTokenLists, this.synonymMap);
    this.contentByRowId = rawByRowId;
    this.db = await createIndex2();
    await insertDocs(this.db, docs);
    this.ready = true;
    const ms = Date.now() - t0;
    console.log(`vault-search: indexed ${docs.length} notes, ${this.vocabulary.size} vocab tokens, ${this.dict.size} dict words in ${ms}ms`);
  }
  async search(query, limit) {
    await this.ensureBuilt();
    return runSearch(
      this.db,
      query,
      limit ?? RESULT_LIMIT,
      this.vocabulary,
      this.contentByRowId,
      this.synonymMap,
      this.dict,
      this.compoundParts
    );
  }
};
var VaultSearchModal = class extends import_obsidian.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.engine = plugin.engine;
    this.results = [];
    this.correction = null;
    this.highlightTerms = [];
    this.activeIndex = -1;
    this.rowEls = [];
    this._previewTimer = null;
    this._previewToken = 0;
    this._previewComponent = null;
    this._queryToken = 0;
  }
  onOpen() {
    this.modalEl.addClass("vault-search-modal");
    this.contentEl.addClass("vault-search-content");
    const left = this.contentEl.createDiv({ cls: "vault-search-left" });
    this.inputEl = left.createEl("input", {
      cls: "vault-search-input",
      attr: {
        type: "text",
        placeholder: "Suche im Handbuch (Titel > Tags > Inhalt, tippfehler-/leerzeichentolerant)\u2026",
        spellcheck: "false"
      }
    });
    this.listEl = left.createDiv({ cls: "vault-search-list" });
    this.previewEl = this.contentEl.createDiv({ cls: "vault-search-preview markdown-rendered" });
    this._setPreviewPlaceholder("");
    this.inputEl.addEventListener("input", () => this._onQueryChanged());
    this.scope.register([], "ArrowDown", (evt) => {
      evt.preventDefault();
      this._moveActive(1);
      return false;
    });
    this.scope.register([], "ArrowUp", (evt) => {
      evt.preventDefault();
      this._moveActive(-1);
      return false;
    });
    this.scope.register([], "Enter", (evt) => {
      evt.preventDefault();
      this._openActive();
      return false;
    });
    if (!this.engine.ready) {
      this.listEl.setText("Baue Suchindex \u2026");
      this.engine.ensureBuilt().then(() => this._onQueryChanged()).catch((e) => {
        console.error("vault-search: index build failed", e);
        this.listEl.setText("Indexaufbau fehlgeschlagen (siehe Konsole).");
      });
    } else {
      this._onQueryChanged();
    }
    window.setTimeout(() => this.inputEl.focus(), 0);
  }
  onClose() {
    if (this._previewTimer) {
      window.clearTimeout(this._previewTimer);
      this._previewTimer = null;
    }
    if (this._previewComponent) {
      this._previewComponent.unload();
      this._previewComponent = null;
    }
    this.contentEl.empty();
  }
  async _onQueryChanged() {
    if (!this.engine.ready) return;
    const raw = this.inputEl.value || "";
    const token = ++this._queryToken;
    const { results, correction, expandedTerms } = await this.engine.search(raw, RESULT_LIMIT);
    if (token !== this._queryToken) return;
    this.results = results;
    this.correction = correction;
    this.highlightTerms = expandedTerms;
    this._renderList();
    if (this.results.length > 0) {
      this._setActive(0, true);
    } else {
      this.activeIndex = -1;
      this._setPreviewPlaceholder(raw.trim() ? "Keine Treffer." : "");
    }
  }
  _renderList() {
    this.listEl.empty();
    this.rowEls = [];
    if (this.results.length === 0) return;
    this.results.forEach((doc, i) => {
      const el = this.listEl.createDiv({ cls: "vault-search-suggestion" });
      this.rowEls.push(el);
      const titleEl = el.createDiv({ cls: "vault-search-title" });
      if (doc.seitencode) {
        (0, import_obsidian.renderMatches)(titleEl, doc.seitencode, findTermRanges(doc.seitencode, this.highlightTerms));
        titleEl.appendText(" \xB7 ");
      }
      const titleText = doc.titel || doc.notePath;
      (0, import_obsidian.renderMatches)(titleEl, titleText, findTermRanges(titleText, this.highlightTerms));
      const meta = [];
      if (doc.sektion) meta.push(doc.sektion);
      if (this.correction) meta.push(`(meintest du \u201E${this.correction.to}"?)`);
      if (meta.length) el.createDiv({ cls: "vault-search-meta", text: meta.join(" \u2014 ") });
      if (doc.snippet) {
        const snEl = el.createDiv({ cls: "vault-search-snippet" });
        (0, import_obsidian.renderMatches)(snEl, doc.snippet, findTermRanges(doc.snippet, this.highlightTerms));
      }
      el.addEventListener("mouseenter", () => this._setActive(i, true));
      el.addEventListener("click", () => {
        this._setActive(i, false);
        this._openActive();
      });
    });
  }
  _moveActive(delta) {
    if (this.results.length === 0) return;
    let next = this.activeIndex + delta;
    if (next < 0) next = this.results.length - 1;
    if (next >= this.results.length) next = 0;
    this._setActive(next, true);
  }
  _setActive(i, preview) {
    if (i < 0 || i >= this.results.length) return;
    if (this.activeIndex >= 0 && this.rowEls[this.activeIndex]) {
      this.rowEls[this.activeIndex].removeClass("is-active");
    }
    this.activeIndex = i;
    const el = this.rowEls[i];
    if (el) {
      el.addClass("is-active");
      el.scrollIntoView({ block: "nearest" });
    }
    if (preview) this._schedulePreview(this.results[i]);
  }
  _schedulePreview(doc) {
    if (this._previewTimer) window.clearTimeout(this._previewTimer);
    this._previewTimer = window.setTimeout(() => {
      this._previewTimer = null;
      this._renderPreview(doc);
    }, PREVIEW_DEBOUNCE_MS);
  }
  async _renderPreview(doc) {
    if (!doc) return;
    const token = ++this._previewToken;
    const file = this.app.vault.getFileByPath(doc.notePath);
    if (!file) {
      this._setPreviewPlaceholder("Datei nicht gefunden (verschoben/gel\xF6scht?).");
      return;
    }
    if (this._previewComponent) {
      this._previewComponent.unload();
      this._previewComponent = null;
    }
    this.previewEl.empty();
    this.previewEl.removeClass("vault-search-preview-empty");
    let raw = "";
    try {
      raw = await this.app.vault.cachedRead(file);
    } catch (e) {
      raw = "";
    }
    if (token !== this._previewToken) return;
    const component = new import_obsidian.Component();
    component.load();
    this._previewComponent = component;
    try {
      await import_obsidian.MarkdownRenderer.render(this.app, raw, this.previewEl, file.path, component);
    } catch (e) {
      console.error("vault-search: preview render failed", e);
      if (token === this._previewToken) {
        this._setPreviewPlaceholder("Vorschau konnte nicht gerendert werden.");
      }
    }
  }
  _setPreviewPlaceholder(text) {
    if (this._previewComponent) {
      this._previewComponent.unload();
      this._previewComponent = null;
    }
    this.previewEl.empty();
    this.previewEl.addClass("vault-search-preview-empty");
    if (text) this.previewEl.setText(text);
  }
  _openActive() {
    if (this.activeIndex < 0 || this.activeIndex >= this.results.length) return;
    const doc = this.results[this.activeIndex];
    const file = this.app.vault.getFileByPath(doc.notePath);
    if (!file) return;
    this.close();
    this.app.workspace.getLeaf(false).openFile(file);
  }
};
var VaultSearchPlugin = class extends import_obsidian.Plugin {
  onload() {
    this.engine = new SearchEngine(this.app);
    this.api = {
      search: async (query, limit) => {
        const { results, correction } = await this.engine.search(query, limit);
        return { results, correction };
      }
    };
    this.app.workspace.onLayoutReady(() => {
      this.engine.ensureBuilt().catch((e) => console.error("vault-search: background index build failed", e));
    });
    this.addCommand({
      id: "open-vault-search",
      name: "Handbuch durchsuchen (gewichtet, tippfehler-/leerzeichentolerant)",
      hotkeys: [
        { modifiers: ["Mod", "Shift"], key: "F" },
        { modifiers: ["Ctrl"], key: "Space" }
      ],
      callback: () => {
        new VaultSearchModal(this.app, this).open();
      }
    });
    this.addCommand({
      id: "reload-vault-search-index",
      name: "Suchindex neu aufbauen",
      callback: async () => {
        const notice = new import_obsidian.Notice("Vault Search: Suchindex wird neu aufgebaut \u2026", 0);
        try {
          await this.engine.rebuild();
          notice.hide();
          new import_obsidian.Notice(`Vault Search: Suchindex neu aufgebaut (${this.engine.db ? "ok" : "?"}).`, 4e3);
        } catch (e) {
          notice.hide();
          console.error("vault-search: reload index failed", e);
          new import_obsidian.Notice("Vault Search: Neuaufbau fehlgeschlagen (siehe Konsole).", 6e3);
        }
      }
    });
  }
};
module.exports = module.exports.default;
