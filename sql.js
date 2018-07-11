var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ConnectionPool } from 'mssql';
const defaultConfig = {
    database: process.env.database || '',
    password: process.env.password || '',
    server: process.env.server || 'localhost',
    user: process.env.user || ''
};
const sqlPools = {};
// Return a pool from the cache if one exists.
// Otherwise, create and cache that pool.
export const sqlPool = (c = defaultConfig) => __awaiter(this, void 0, void 0, function* () {
    // Create an object key for connections that do not have usernames.
    const poolUsername = c.user || Symbol.for('undefined');
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
        sqlPools[c.server][poolUsername][c.database] = new Promise((resolve, reject) => {
            const pool = new ConnectionPool(c, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(pool);
                }
            });
        })
            .catch((error) => {
            throw error;
        });
    }
    // Return the pool for this database for this user on this server.
    return sqlPools[c.server][poolUsername][c.database];
});
export const sqlRequest = (c = defaultConfig) => __awaiter(this, void 0, void 0, function* () {
    return (yield sqlPool(c)).request();
});
