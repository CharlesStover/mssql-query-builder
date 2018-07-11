import { EventEmitter } from 'events';
import { Bit, config, DateTime, Int, IResult, ISqlTypeFactoryWithNoParams, NVarChar, Request, VarBinary } from 'mssql';
import isOrderByClause from './is-order-by-clause';
import { sqlRequest } from './sql';

export type Input = boolean | number | string | Buffer | Date;

export interface OrderBy {
  by: string;
  order: 'ASC' | 'DESC';
}

export type RecordSet<Obj extends object = { [key: string]: number | string }, Result = any> = number | ((recordset: Obj[]) => Result);

const clauses = (...c: string[]): string => {
  return c.map((a: string): string => '(?:(?:^| )?' + a + ')?').join('');
};

export default class QueryBuilder extends EventEmitter {
  private _all: boolean;
  private _fetch: number;
  private _from: null | string;
  private _groupBy: string[];
  private _input: Map<string, { type: ISqlTypeFactoryWithNoParams, value: Input }>;
  private _offset: number;
  private _orderBy: string[];
  private _recordSet: null | RecordSet<any, any>;
  private _request: Promise<Request>;
  private _select: Map<string, string>;
  private _timeEnd: number;
  private _timeStart: number;
  private _top: number;
  private _where: string[];
  private _vars: number;

  /**
   * Creates an instance of QueryBuilder.
   * @param {config} [c] MSSQL config
   * @memberof QueryBuilder
   */
  constructor(c?: config) {
    super();
    this._all = true;
    this._fetch = 0;
    this._from = null;
    this._groupBy = [];
    this._input = new Map<string, { type: ISqlTypeFactoryWithNoParams, value: Input }>();
    this._offset = 0;
    this._orderBy = [];
    this._recordSet = null;
    this._select = new Map<string, string>();
    this._timeEnd = 0;
    this._timeStart = 0;
    this._top = 0;
    this._where = [];
    this._vars = 0;
    this._request = sqlRequest(c);
    return this;
  }

  /**
   * Specifies that duplicate rows can appear in the result set.
   * @param {boolean} [all=true] whether duplicate rows can appear in the result set
   * @returns {this} this
   * @memberof QueryBuilder
   */
  public all(all: boolean = true): this {
    this._all = all;
    return this;
  }

  // Build the query.
  public buildQuery(): string {
    return (
      this.buildSelect() +
      this.buildFrom() +
      this.buildWhere() +
      this.buildGroupBy() +
      this.buildOrderBy() +
      this.buildOffset() +
      ';'
    );
  }

  /**
   * Specifies that only unique rows can appear in the result set.
   * Null values are considered equal for the purposes of the DISTINCT keyword.
   * @param {boolean} [distinct=true] whether only unique rows can appear in the result set
   * @returns {this} this
   * @memberof QueryBuilder
   */
  public distinct(distinct?: boolean): this;

  /**
   * Returns all distinct values of the select list.
   * @param {(string | string[])} selectList The columns to be selected for the result set.
   * @returns {any[]} number[] | string[]
   * @memberof QueryBuilder
   */
  public distinct(selectList: string): Promise<number[]> | Promise<string[]>;
  public distinct(selectList: string[]): Promise<Array<number[] | string[]>>;
  public distinct(selectList: string | string[]): Promise<number[]> | Promise<string[]> | Promise<Array<number[] | string[]>>;

  /**
   * DISTINCT
   */
  public distinct(distinct: boolean | string | string[] = true): Promise<Array<number[] | string[]>> | Promise<number[]> | Promise<string[]> | this {

    // Toggle SELECT ALL versus SELECT DISTINCT.
    if (typeof distinct === 'boolean') {
      this._all = !distinct;
      return this;
    }

    // SELECT DISTINCT
    if (typeof distinct === 'string') {
      const d: string = this.getExpressionForAlias(distinct);
      const q: QueryBuilder = new QueryBuilder()
        .select(d + ' AS "distinct"')
        .from(this._from)
        .where(this._where)

        /*
        TODO:
        When distinct is an expression, isolate and comma-separate its column names.
        e.g.: "RTRIM(a) + ':' + b" should become "a, b"
        Priority: Low, because this works regardless and may be algorithmically complicated, but doing so will speed up the query.
        */
        .groupBy(d)
        .orderBy('"distinct"')
        .offset(this._offset)
        .fetch(this._fetch)
        .recordSet(
          <T extends number | string>(rows: Array<{ distinct: T }>): T[] =>
            rows.map(
              (row: { distinct: T }): T =>
                row.distinct
            )
        );
      for (const [key, input] of this._input) {
        q.input(input.value, key, input.type);
      }
      return q.execute();
    }

    // SELECT an array of DISTINCT
    const results: Array<Promise<number[] | string[]>> = [];
    for (const d of distinct) {
      results.push(this.distinct(d));
    }
    return Promise.all(results);
  }

  // Execute a query.
  public async execute(q?: string): Promise<any> {

    // Build the query.
    if (q) {
      this.query(q);
    }
    const query: string = this.buildQuery();

    // Establish a request.
    const request: Request = await this._request;
    for (const [key, input] of this._input) {
      request.input(key, input.type, input.value);
    }

    // Execute the query.
    this._timeStart = Date.now();
    try {
      const result: IResult<any> = await request.query(query);
      this._timeEnd = Date.now();

      // Format the result.
      return (
        typeof this._recordSet === 'number'
        ? result.recordsets[this._recordSet]
        : (
          typeof this._recordSet === 'function'
          ? this._recordSet(result.recordset)
          : result.recordset
        )
      );
    }

    // ConnectionError | Error
    catch (error) {
      this._timeEnd = Date.now();
      throw new Error(error.message);
    }
  }

  /**
   * Specifies the number of rows to return, after processing the OFFSET clause.
   * The argument for the FETCH clause can be an integer or expression that is greater than or equal to one.
   * @param {number} f rowcount expression
   * @returns {this} this
   * @memberof QueryBuilder
   */
  public fetch(f: number): this {
    this._fetch = f;
    return this;
  }

  /**
   * Specifies the tables from which to retrieve rows.
   * @param {(null | string)} f table source
   * @returns {this} this
   * @memberof QueryBuilder
   */
  public from(f: null | string): this {
    this._from = f;
    return this;
  }

  /**
   * Get the expression value for a column alias.
   * @param {string} alias alias
   * @returns {string} expression
   * @memberof QueryBuilder
   */
  public getExpressionForAlias(alias: string): string {
    return this._select.get(alias) || alias;
  }

  /**
   * Specifies the groups (equivalence classes) that output rows are to be placed in.
   * If aggregate functions are included in the SELECT clause <select list>, the GROUP BY clause calculates a summary value for each group.
   * @param {(string | string[])} g An expression that grouping is performed on.
   * @returns {this} this
   * @memberof QueryBuilder
   */
  public groupBy(g: string | string[]): this {
    if (typeof g === 'string') {
      this._groupBy.push(g);
    }
    else {
      this._groupBy = this._groupBy.concat(g);
    }
    return this;
  }

  /**
   * Generates an input variable name.
   * @param {Input} name any input
   * @returns {string} variable name for the input
   * @memberof QueryBuilder
   */
  public input(value: Input): string;

  /**
   * Inputs a SQL variable.
   * @param {string} name the input variable name
   * @param {ISqlTypeFactoryWithNoParams} type variable type
   * @param {Input} value variable value
   * @returns {this} this
   * @memberof QueryBuilder
   */
  public input(value: Input, name: string, type?: ISqlTypeFactoryWithNoParams): this;

  /**
   * SQL variable inputs
   * @param {string} name variable name
   * @param {ISqlTypeFactoryWithNoParams} type variable type
   * @param {*} value variable value
   * @returns {this} this
   * @memberof QueryBuilder
   */
  public input(value: Input, name?: string, type?: ISqlTypeFactoryWithNoParams): string | this {

    // input('my variable') => 'variable_name'
    if (name === undefined) {
      const n: string = '__QB_INPUT_' + ++this._vars + '__';
      this.input(value, n);
      return '@' + n;
    }

    if (type === undefined) {
      if (typeof value === 'boolean') {
        return this.inputBoolean(value, name);
      }
      if (typeof value === 'number') {
        return this.inputNumber(value, name);
      }
      if (typeof value === 'string') {
        return this.inputString(value, name);
      }
      if (value instanceof Buffer) {
        return this.inputBuffer(value, name);
      }
      if (value instanceof Date) {
        return this.inputDate(value, name);
      }
      throw new Error('Only boolean, number, string, Buffer, and Date inputs are allowed.');
    }
    this._input.set(name, { type, value });
    return this;
  }
  public inputBit = (value: boolean, name: string): this => this.input(value, name, Bit);
  public inputBoolean = (value: boolean, name: string): this => this.inputBit(value, name);
  public inputBuffer = (value: Buffer, name: string): this => this.inputVarBinary(value, name);
  public inputDate = (value: Date, name: string): this => this.inputDateTime(value, name);
  public inputDateTime = (value: Date, name: string): this => this.input(value, name, DateTime);
  public inputInt = (value: number, name: string): this => this.input(value, name, Int);
  public inputNumber = (value: number, name: string): this => this.inputInt(value, name);
  public inputNVarChar = (value: string, name: string): this => this.input(value, name, NVarChar);
  public inputString = (value: string, name: string): this => this.inputNVarChar(value, name);
  public inputVarBinary = (value: Buffer, name: string): this => this.input(value, name, VarBinary);

  /**
   * Specifies the number of rows to skip, before starting to return rows from the query expression.
   * The argument for the OFFSET clause can be an integer or expression that is greater than or equal to zero.
   * @param {number} o integer_constant | offset_row_count_expression
   * @returns {this} this
   * @memberof QueryBuilder
   */
  public offset(o: number): this {
    this._offset = o;
    return this;
  }

  /**
   * Specifies the sort order for the result set.
   * The ORDER BY clause is not valid in subqueries.
   * You also have an option to fetch only a window or page of results from the resultset using OFFSET-FETCH clause.
   * @param {(string | string[])} o order by expression
   * @returns {this} this
   * @memberof QueryBuilder
   */
  public orderBy(o: Array<OrderBy | string> | string | OrderBy): this {
    if (Array.isArray(o)) {
      for (const orderBy of o) {
        this.orderBy(orderBy);
      }
    }
    else if (typeof o === 'object') {
      if (isOrderByClause(o)) {
        this.orderBy(o.by + ' ' + o.order);
      }
      else {
        throw new Error('Invalid ORDER BY clause object supplied to method `orderBy`.');
      }
    }
    else {

      // Get column/expression ORDER.
      const newOrder = o.replace(/(?: ASC| DESC)$/, '');

      // Find previous ORDER BY instances of this column/expression.
      const previousOrderByIndex = this._orderBy.findIndex(
        (previousOrderBy) =>
          previousOrderBy.substr(0, newOrder.length) === newOrder
      );

      // Strip previous instances of this column/expression from the ORDER BY clause.
      if (previousOrderByIndex > -1) {
        this._orderBy.splice(previousOrderByIndex, 1);
      }

      // Append this column/expression to the ORDER BY clause.
      this._orderBy.push(o);
    }
    return this;
  }

  /**
   * Convert a string into a QueryBuilder object.
   * @param {string} q query
   * @returns {this} this
   * @memberof QueryBuilder
   */
  public query(q: string): this {
    q = q.replace(/[\n\r\s\t]+/g, ' ');
    const query: null | RegExpMatchArray = q.match(new RegExp(
      clauses(
        'SELECT(?: (ALL|DISTINCT))?(?: TOP (\d+))? (.+?)',
        'FROM (.+?)',
        'WHERE (.+?)',
        'ORDER BY (.+?)',
        'OFFSET (\d+) ROWS?(?: FETCH (?:FIRST|NEXT) (\d+) ROWS? ONLY)?'
      ) +
      ' ?\;? ?$'
    ));
    if (query) {
      if (query[3]) {
        switch (query[1]) {
          case 'ALL':
            this.all();
            break;
          case 'DISTINCT':
            this.distinct();
            break;
        }
        if (query[2]) {
          this.top(parseInt(query[2], 10));
        }
        this.select(query[3]);
      }
      if (query[4]) {
        this.from(query[4]);
      }
      if (query[5]) {
        this.where(query[5]);
      }
      if (query[6]) {
        this.orderBy(query[6]);
      }
      if (query[7]) {
        this.offset(parseInt(query[7], 10));
        if (query[8]) {
          this.fetch(parseInt(query[8], 10));
        }
      }
    }
    else {
      throw new Error(
        'Invalid Query provided to QueryBuilder.\n' +
        '---------------------------------------\n' +
        q
      );
    }
    return this;
  }

  // Parse the record set.
  public recordSet<Obj extends object, Result>(r: RecordSet<Obj, Result>): this {
    this._recordSet = r;
    return this;
  }

  /**
   * Returns the total possible row count for a query.
   * @returns {Promise<number>} promise of row count
   * @memberof QueryBuilder
   */
  public rowCount(): Promise<number> {
    const q: QueryBuilder = new QueryBuilder()
      .select('COUNT(*) AS "rows"')
      .all(this._all)
      .from(this._from)
      .where(this._where)
      .groupBy(this._groupBy)
      .recordSet(
        (r: Array<{ rows: number }>): number =>
          r[0].rows
      );
    for (const [key, input] of this._input) {
      q.input(input.value, key, input.type);
    }
    return q.execute();
  }

  /**
   * Specifies the columns to be returned by the query.
   * @param {(Select | string | string[])} s select list
   * @returns {this} this
   * @memberof QueryBuilder
   */
  public select(s: string | string[] | { [alias: string]: string }): this {

    // Comma-separated column names.
    if (typeof s === 'string') {

      // Loop each character.
      let expressions: string = s;
      let openParentheses = 0;
      let openQuote = '';
      for (let x = 0; x <= expressions.length; ++x) {
        const char: string = expressions.charAt(x);
        switch (char) {

          // Ignore anything while quotes are open.
          case '\'':
          case '"':
            if (openQuote === char) {
              openQuote = '';
            }
            else if (
              x === 0 ||
              expressions.charAt(x - 1) !== '\\'
            ) {
              openQuote = char;
            }
            break;

          // Ignore parameters of functions.
          case '(':
            if (openQuote === '') {
              ++openParentheses;
            }
            break;
          case ')':
            if (openQuote === '') {
              --openParentheses;
            }
            break;

          // Find expression delimeters.
          // Find the " AS " in "expression AS alias"
          case ',':
          case ' ':
          case '':
            if (
              openParentheses === 0 &&
              openQuote === ''
            ) {

              // Expression delimeter.
              if (
                char === ',' ||
                char === ''
              ) {

                // Add this expression to the SELECT clause
                const expression: string = expressions.substring(0, x).trim();
                this._select.set(expression, expression);

                // Reset the expression finder.
                expressions = expressions.substring(x + 1);
                x = 0;
              }

              // Expression alias.
              else if (expressions.substring(x, x + 4).toUpperCase() === ' AS ') {

                // Add this expression to the SELECT clause.
                const expression: null | RegExpMatchArray = expressions.substring(x + 4).match(/^\s*(?:\"([^\"]*)\"|([\w\d]+))/i);
                if (expression) {
                  const alias: string = expression[1] || expression[2];
                  this._select.set(alias, expressions.substring(0, x).trim());

                  // Reset the expression finder.
                  expressions = expressions.substring(x + 4 + alias.length + (expression[1] ? 2 : 0)).replace(/^\s*\,\s*/, '');
                  x = 0;
                }
                else {
                  console.error(expressions);
                  throw new Error('Invalid column alias detected in SELECT clause.');
                }
              }
            }
            break;
        }
      }
    }

    // Array of column names
    else if (Array.isArray(s)) {
      this._select.forEach(this.select);
      // this._select = this._select.concat(s);
    }

    // Objects { [result_name]: 'Function(column)' }
    else {
      for (const key of Object.keys(s)) {
        this._select.set(key, s[key]);
      }
    }
    return this;
  }

  /**
   * Time it took to execute the query.
   * Returns 0 if the query has no begun executing.
   * Returns negative if the query is still executing.
   * @returns {number} time to execute the query
   * @memberof QueryBuilder
   */
  public time(): number {
    return this._timeEnd - this._timeStart;
  }

  /**
   * Specifies that only the first set of rows will be returned from the query result.
   * The set of rows can be either a number, or a percent of the rows.
   * @param {number} n expression
   * @returns {this} this
   * @memberof QueryBuilder
   */
  public top(n: number): this {
    this._top = n;
    return this;
  }

  /**
   * Specifies a search condition to restrict the rows returned.
   * @param {(string | string[])} w search condition
   * @returns {this} this
   * @memberof QueryBuilder
   */
  public where(w: string | string[]): this {
    if (typeof w === 'string') {
      this._where.push(w);
    }
    else {
      this._where = this._where.concat(w);
    }
    return this;
  }

  /**
   * Species a search condition to restrict the rows returned using an Array.
   * WHERE column IN array
   * @param {string} w column or expression
   * @param {(number | number[] | string | string[])} i array of values
   * @returns {this} this
   * @memberof QueryBuilder
   */
  public whereIn(columnOrExpression: string, input: Input | Input[]): this {
    if (!Array.isArray(input)) {
      return this.where(columnOrExpression + ' = ' + this.input(input));
    }
    return this.where(columnOrExpression + ' IN (' + input.map((value: Input): string => this.input(value)).join(', ') + ')');
  }

  /**
   * Constructs the FROM clause.
   * @private
   * @returns {string} the FROM clause
   * @memberof QueryBuilder
   */
  private buildFrom(): string {
    if (this._from) {
      return ' FROM ' + this._from;
    }
    return '';
  }

  /**
   * Constructs the GROUP BY clause.
   * @private
   * @returns {string} the GROUP BY clause
   * @memberof QueryBuilder
   */
  private buildGroupBy(): string {
    if (this._groupBy.length) {
      return ' GROUP BY ' + this._groupBy.map((expression: string): string => this.getExpressionForAlias(expression)).join(', ');
    }
    return '';
  }

  /**
   * Constructs the OFFSET FETCH clause.
   * @private
   * @returns {string} the OFFSET FETCH clause
   * @memberof QueryBuilder
   */
  private buildOffset(): string {
    if (
      this._offset > 0 ||
      this._fetch > 0
    ) {

      // https://technet.microsoft.com/en-us/library/gg699618(v=sql.110).aspx#Anchor_2
      if (!this._orderBy.length) {
        throw new Error('ORDER BY is mandatory to use OFFSET and FETCH clause.');
      }
      if (this._top) {
        throw new Error('TOP cannot be combined with OFFSET and FETCH in the same query expression.');
      }
      return (
        ' OFFSET ' + this._offset + ' ROWS' + (
          this._fetch > 0
          ? ' FETCH NEXT ' + this._fetch + ' ROWS ONLY'
          : ''
        )
      );
    }
    return '';
  }

  /**
   * Constructs the ORDER BY clause.
   * @private
   * @returns {string} the ORDER BY clause
   * @memberof QueryBuilder
   */
  private buildOrderBy(): string {
    if (this._orderBy.length) {
      return ' ORDER BY ' + this._orderBy.join(', ');
    }
    return '';
  }

  /**
   * Constructs the SELECT clause.
   * @private
   * @returns {string} the SELECT clause
   * @memberof QueryBuilder
   */
  private buildSelect(): string {
    if (this._select.size) {
      return (
        'SELECT ' + (
          this._all
          ? 'ALL'
          : 'DISTINCT'
        ) + (
          this._top !== 0
          ? ' TOP ' + this._top
          : ''
        ) + ' ' +
        (

          // Convert entries from an IterableIterator to an Array, so that it can be mapped.
          ((entries: IterableIterator<[string, string]>): Array<[string, string]> => {
            const e: Array<[string, string]> = [];
            for (const entry of entries) {
              e.push(entry);
            }
            return e;
          })(this._select.entries())
        )
        .map(
          ([ key, value ]): string =>
            value + ' AS "' + key.replace(/\"/g, '\\\"') + '"'
        )
        .join(', ')
      );
    }
    return '';
  }

  /**
   * Constructs the WHERE clause.
   * @private
   * @returns {string} the WHERE clause
   * @memberof QueryBuilder
   */
  private buildWhere(): string {
    if (this._where.length) {
      return ' WHERE ' + this._where.join(' AND ');
    }
    return '';
  }
}
