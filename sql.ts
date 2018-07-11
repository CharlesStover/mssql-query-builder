import { config, ConnectionError, ConnectionPool, Request } from 'mssql';

const defaultConfig: config = {
  database: process.env.database || '',
  password: process.env.password || '',
  server: process.env.server || 'localhost',
  user: process.env.user || ''
};

// Promise values for ConnectionPool.
type RejectPool = (error: ConnectionError | Error) => void;
type ResolvePool = (pool: ConnectionPool) => void;

// Cache of SQL Pools.
interface SqlPools {
  [server: string]: {
    [user: string]: {
      [database: string]: Promise<ConnectionPool>
    }
  };
}
const sqlPools: SqlPools = {};

// Return a pool from the cache if one exists.
// Otherwise, create and cache that pool.
export const sqlPool = async (c: config = defaultConfig): Promise<ConnectionPool> => {

  // Create an object key for connections that do not have usernames.
  const poolUsername: string | symbol = c.user || Symbol.for('undefined');

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
    sqlPools[c.server][poolUsername][c.database] = new Promise(
      (resolve: ResolvePool, reject: RejectPool) => {
        const pool: ConnectionPool = new ConnectionPool(
          c,
          (error: ConnectionError | Error | null) => {
            if (error) {
              reject(error);
            }
            else {
              resolve(pool);
            }
          }
        );
      }
    )
    .catch((error: ConnectionError | Error) => {
      throw error;
    });
  }

  // Return the pool for this database for this user on this server.
  return sqlPools[c.server][poolUsername][c.database];
};

export const sqlRequest = async (c: config = defaultConfig): Promise<Request> => {
  return (await sqlPool(c)).request();
};
