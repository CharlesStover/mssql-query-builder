"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var mssql_1 = require("mssql");
var defaultConfig = {
    database: process.env.database || '',
    password: process.env.password || '',
    server: process.env.server || 'localhost',
    user: process.env.user || ''
};
var sqlPools = {};
// Return a pool from the cache if one exists.
// Otherwise, create and cache that pool.
exports.sqlPool = function (c) {
    if (c === void 0) { c = defaultConfig; }
    return __awaiter(_this, void 0, void 0, function () {
        var poolUsername;
        return __generator(this, function (_a) {
            poolUsername = c.user || Symbol.for('undefined');
            // Create a cache for this server.
            if (!Object.prototype.hasOwnProperty.call(sqlPools, c.server)) {
                sqlPools[c.server] = Object.create(null);
            }
            // Create a cache for this user on this server.
            if (!Object.prototype.hasOwnProperty.call(sqlPools[c.server], poolUsername)) {
                sqlPools[c.server][poolUsername] = Object.create(null);
            }
            // Create the pool for this database for this user on this server.
            if (!Object.prototype.hasOwnProperty.call(sqlPools[c.server][poolUsername], c.database)) {
                sqlPools[c.server][poolUsername][c.database] = new Promise(function (resolve, reject) {
                    var pool = new mssql_1.ConnectionPool(c, function (error) {
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve(pool);
                        }
                    });
                })
                    .catch(function (error) {
                    throw error;
                });
            }
            // Return the pool for this database for this user on this server.
            return [2 /*return*/, sqlPools[c.server][poolUsername][c.database]];
        });
    });
};
exports.sqlRequest = function (c) {
    if (c === void 0) { c = defaultConfig; }
    return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.sqlPool(c)];
                case 1: return [2 /*return*/, (_a.sent()).request()];
            }
        });
    });
};
