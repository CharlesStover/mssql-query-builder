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
type SqlDatabases = Map<string, Promise<ConnectionPool>>;
type SqlPools = Map<string, SqlUsers>;
type SqlUsers = Map<string | symbol, SqlDatabases>;

const sqlPools: SqlPools = new Map<string, SqlUsers>();

// Return a pool from the cache if one exists.
// Otherwise, create and cache that pool.
export const sqlPool = async (c: config = defaultConfig): Promise<ConnectionPool> => {

  // Create a cache for this server.
  if (!sqlPools.has(c.server)) {
    sqlPools.set(c.server, new Map<string | symbol, SqlDatabases>());
  }

  const users = sqlPools.get(c.server);
  if (!users) {
    throw new Error('Could not allocate SQL user.');
  }

  // Create an object key for connections that do not have usernames.
  const poolUsername: string | symbol = c.user || Symbol.for('undefined');

  // Create a cache for this user on this server.
  if (!users.has(poolUsername)) {
    users.set(poolUsername, new Map<string, Promise<ConnectionPool>>());
  }

  const connections = users.get(poolUsername);
  if (!connections) {
    throw new Error('Could not allocation SQL connection.');
  }

  // Create the pool for this database for this user on this server.
  if (!connections.has(c.database)) {
    connections.set(
      c.database,
      new Promise(
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
      })
    );
  }

  // Return the pool for this database for this user on this server.
  const pool = connections.get(c.database);
  if (!pool) {
    throw new Error('Could not allocate SQL pool.');
  }
  return pool;
};

export const sqlRequest = async (c: config = defaultConfig): Promise<Request> => {
  return (await sqlPool(c)).request();
};
