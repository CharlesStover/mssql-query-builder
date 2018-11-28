# mssql-query-builder
Dynamically build Microsoft SQL Server queries using JavaScript.

[![package](https://img.shields.io/github/package-json/v/CharlesStover/mssql-query-builder.svg)](https://github.com/CharlesStover/mssql-query-builder/)
[![build](https://travis-ci.com/CharlesStover/mssql-query-builder.svg)](https://travis-ci.com/CharlesStover/mssql-query-builder/)
[![downloads](https://img.shields.io/npm/dt/mssql-query-builder.svg)](https://www.npmjs.com/package/mssql-query-builder)
[![minified size](https://img.shields.io/bundlephobia/min/mssql-query-builder.svg)](https://www.npmjs.com/package/mssql-query-builder)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/mssql-query-builder.svg)](https://www.npmjs.com/package/mssql-query-builder)

## Install
* `npm install mssql-query-builder --save` or
* `yarn add mssql-query-builder`

## Use
Note: All methods can be chained together. Each method call returns the original QueryBuilder instance.

```JS
import QueryBuilder from 'mssql-query-builder';

// Provide an optional MSSQL_CONFIG parameter to include server, user, password, database, etc.
// If you do not include one, it will default to environment variables.
const query = new QueryBuilder(MSSQL_CONFIG);

// Seed the query builder with some literal SQL.
query.query('SELECT a WHERE b = c');

// Conditionally write part of the query.
query.from(
  process.env.flag ?
    'table_x' :
    'table_y'
);

if (today === 'Monday') {
  query.whereIn('birthDay', [ 1, 2, 3 ]);
}

// Skip the first 100 rows, then fetch the next 25.
// Useful for pagination.
query.offset(100).fetch(25);

// Output the query thus far as a string (for debugging).
console.log(query.buildQuery());

// Execute the query (returns a Promise).
query.execute().then(
  (result) => {
    console.log(result);
  }
);
```

## Methods

### all(all?: boolean)

Specifies that duplicate rows can appear in the result set.

This is the opposite of `distinct(boolean)`.

### distinct(distinct?: boolean)

Specifies that only unique rows can appear in the result set.

Null values are considered equal for the purposes of the DISTINCT keyword.

### distinct(selectItem: string)

Returns all distinct values of the single select item.

### distinct(selectList: string[])

Returns all distinct values of the select list.

### execute()

Executes the query as built thus far. Returns a Promise of a result.

### execute(query: string)

Executes the query string provided. Returns a Promise of a result.

### fetch(n: number)

Specifies the number of rows to return, after processing the OFFSET clause.

The argument for the FETCH clause can be an integer or expression that is greater than or equal to one.

### from(table: string)

Specifies the tables from which to retrieve rows.

### groupBy(column: string)

Specifies the groups (equivalence classes) that output rows are to be placed in.

If aggregate functions are included in the SELECT clause's select list, the GROUP BY clause calculates a summary value for each group.

### having(...having: string[])

Specifies a search condition for a group or an aggregate. HAVING can be used only with the SELECT statement. HAVING is typically used with a GROUP BY clause. When GROUP BY is not used, there is an implicit single, aggregated group.

### input(value: Input)

Inputs a SQL variable and returns its generated variable name.

```JS
const myVar = query.input('Bob');
query.where('name = ' + myVar); // WHERE name = @__QB_INPUT_1__
```

### input(value: Input, name: string, type: ISqlTypeFactoryWithNoParams)

Inputs a SQL variable.

```JS
query
  .input(1, 'myNumber', Int)
  .input('password', 'userPass', NVarChar)
```

Supported `Input` types and their respective `ISqlTypeFactoryWithNoParams` types are are boolean (Bit), number (Int), string (NVarChar), Buffer (VarBinary), and Date (DateTime).

Omitting the `ISqlTypeFactoryWithNoParams` type will result in the QueryBuilder determining the type on its own.

### inputBit and inputBoolean(value: boolean, name: string)

Inputs a boolean SQL variable. Shorthand for `input(value, name, Bit)`.

### inputBuffer and inputVarBinary(value: Buffer, name: string)

Inputs a Buffer SQL variable. Shorthand for `input(value, name, VarBinary)`.

### inputDate and inputDateTime(value: Date, name: string)

Inputs a Date SQL variable. Shorthand for `input(value, name, DateTime)`.

### inputInt and inputNumber(value: number, name: string)

Inputs a number SQL variable. Shorthand for `input(value, name, Int)`.

### inputNVarChar and inputString(value: string, name: string)

Inputs a string SQL variable. Shorthand for `input(value, name, NVarChar)`.

### offset(n: number)

Specifies the number of rows to skip, before starting to return rows from the query expression.

The argument for the OFFSET clause can be an integer or expression that is greater than or equal to zero.

### orderBy(o: string | OrderBy | Array<string | OrderBy>)

Specifies the sort order for the result set.

The ORDER BY clause is not valid in subqueries.

You also have an option to fetch only a window or page of results from the resultset using OFFSET-FETCH clause.

You may pass a string literal, an object (`{ order: 'ASC' | 'DESC', by: 'string literal' }`), or an array that contains any number of either.

```JS
query.orderBy('column_name');
query.orderBy('column_name ASC');
query.orderBy({ by: 'column_name', order: 'ASC' });
query.orderBy([
  'column_name',
  { by: 'column2_name', order: 'DESC' }
]);
```

### query(q: string)

Convert a string into a QueryBuilder object.

Sometimes it's easier to start your query building process with an incomplete SQL query instead of building it from scratch.

```JS
const query1 = new QueryBuilder().select('a').where('b = 1');
const query2 = new QueryBuilder().query('SELECT a WHERE b = 1');
query1.from('c');
query2.from('d');
```

### recordSet(set: number)

Returns the given record set (default `0`).

### recordSet(f: function)

Passes the query result through the given function before returning it.

### rowCount()

Returns the total possible row count for a query.

```JS
const MY_VALUE = 1;
new QueryBuilder()
  .input(MY_VALUE, 'value')
  .select('a')
  .from('b')
  .where('a = @value')
  .rowCount()
  .then(
    (rows) => {
      console.log(`There are ${rows} rows where a equals ${MY_VALUE}.`);
  );
```

### select(...s: Array<Aliases | string>)

Specifies the columns to be returned by the query.
  
As strings, `query.select('column_name')` or `query.select('column1_name', 'column2_name')`.

To use aliases, pass an object where the object keys are column aliases and values are their expressions.

```JS
query.select({
  column: 'column',                                        // no alias
  expression: 'MAX(column1 + column2, column3 / column4)', // alias is `expression`
  Two: '1 + 1'
});
```

### time()

Time it took to execute the query.

Returns 0 if the query has no begun executing.

Returns negative if the query is still executing.

```JS
// Zero because the query has not begun to execute:
console.log(query.time());

query
  .select('a')
  .from('b')
  .execute()
  .then(
    (result) => {

      // Time it took the execute:
      console.log(query.time());
    }
  );

// Negative, because the query is still executing asynchronously:
console.log(query.time());
```

### top(n: number)

Specifies that only the first set of rows will be returned from the query result.

The set of rows can be either a number, or a percent of the rows.

### where(...conditions: string[])

Specifies search conditions to restrict the rows returned.

### whereIn(columnOrExpression: string, input: Input | Input[])

Species a search condition to restrict the rows returned using an Array. To see supported Input types, check the documentation for the `input()` method.

```JS
// Select all users who are 3 or 4 feet tall.
query.select('username').from('users').whereIn('FLOOR(height / 12)', [ 3, 4 ]);

// Select all users who are named Bob or Tim.
query.select('username').from('users').whereIn('name', [ 'Bob', 'Tim' ]);
```
