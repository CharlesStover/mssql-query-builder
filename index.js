var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EventEmitter } from 'events';
import { Bit, DateTime, Int, NVarChar, VarBinary } from 'mssql';
import isOrderByClause from './is-order-by-clause';
import { sqlRequest } from './sql';
const clauses = (...c) => {
    return c.map((a) => '(?:(?:^| )?' + a + ')?').join('');
};
export default class QueryBuilder extends EventEmitter {
    /**
     * Creates an instance of QueryBuilder.
     * @param {config} [c] MSSQL config
     * @memberof QueryBuilder
     */
    constructor(c) {
        super();
        this.inputBit = (value, name) => this.input(value, name, Bit);
        this.inputBoolean = (value, name) => this.inputBit(value, name);
        this.inputBuffer = (value, name) => this.inputVarBinary(value, name);
        this.inputDate = (value, name) => this.inputDateTime(value, name);
        this.inputDateTime = (value, name) => this.input(value, name, DateTime);
        this.inputInt = (value, name) => this.input(value, name, Int);
        this.inputNumber = (value, name) => this.inputInt(value, name);
        this.inputNVarChar = (value, name) => this.input(value, name, NVarChar);
        this.inputString = (value, name) => this.inputNVarChar(value, name);
        this.inputVarBinary = (value, name) => this.input(value, name, VarBinary);
        this._all = true;
        this._fetch = 0;
        this._from = null;
        this._groupBy = [];
        this._input = new Map();
        this._offset = 0;
        this._orderBy = [];
        this._recordSet = null;
        this._select = new Map();
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
    all(all = true) {
        this._all = all;
        return this;
    }
    // Build the query.
    buildQuery() {
        return (this.buildSelect() +
            this.buildFrom() +
            this.buildWhere() +
            this.buildGroupBy() +
            this.buildOrderBy() +
            this.buildOffset() +
            ';');
    }
    /**
     * DISTINCT
     */
    distinct(distinct = true) {
        // Toggle SELECT ALL versus SELECT DISTINCT.
        if (typeof distinct === 'boolean') {
            this._all = !distinct;
            return this;
        }
        // SELECT DISTINCT
        if (typeof distinct === 'string') {
            const d = this.getExpressionForAlias(distinct);
            const q = new QueryBuilder()
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
                .recordSet((rows) => rows.map((row) => row.distinct));
            for (const [key, input] of this._input) {
                q.input(input.value, key, input.type);
            }
            return q.execute();
        }
        // SELECT an array of DISTINCT
        const results = [];
        for (const d of distinct) {
            results.push(this.distinct(d));
        }
        return Promise.all(results);
    }
    // Execute a query.
    execute(q) {
        return __awaiter(this, void 0, void 0, function* () {
            // Build the query.
            if (q) {
                this.query(q);
            }
            const query = this.buildQuery();
            // Establish a request.
            const request = yield this._request;
            for (const [key, input] of this._input) {
                request.input(key, input.type, input.value);
            }
            // Execute the query.
            this._timeStart = Date.now();
            try {
                const result = yield request.query(query);
                this._timeEnd = Date.now();
                // Format the result.
                return (typeof this._recordSet === 'number'
                    ? result.recordsets[this._recordSet]
                    : (typeof this._recordSet === 'function'
                        ? this._recordSet(result.recordset)
                        : result.recordset));
            }
            // ConnectionError | Error
            catch (error) {
                this._timeEnd = Date.now();
                throw new Error(error.message);
            }
        });
    }
    /**
     * Specifies the number of rows to return, after processing the OFFSET clause.
     * The argument for the FETCH clause can be an integer or expression that is greater than or equal to one.
     * @param {number} f rowcount expression
     * @returns {this} this
     * @memberof QueryBuilder
     */
    fetch(f) {
        this._fetch = f;
        return this;
    }
    /**
     * Specifies the tables from which to retrieve rows.
     * @param {(null | string)} f table source
     * @returns {this} this
     * @memberof QueryBuilder
     */
    from(f) {
        this._from = f;
        return this;
    }
    /**
     * Get the expression value for a column alias.
     * @param {string} alias alias
     * @returns {string} expression
     * @memberof QueryBuilder
     */
    getExpressionForAlias(alias) {
        return this._select.get(alias) || alias;
    }
    /**
     * Specifies the groups (equivalence classes) that output rows are to be placed in.
     * If aggregate functions are included in the SELECT clause <select list>, the GROUP BY clause calculates a summary value for each group.
     * @param {(string | string[])} g An expression that grouping is performed on.
     * @returns {this} this
     * @memberof QueryBuilder
     */
    groupBy(g) {
        if (typeof g === 'string') {
            this._groupBy.push(g);
        }
        else {
            this._groupBy = this._groupBy.concat(g);
        }
        return this;
    }
    /**
     * SQL variable inputs
     * @param {string} name variable name
     * @param {ISqlTypeFactoryWithNoParams} type variable type
     * @param {*} value variable value
     * @returns {this} this
     * @memberof QueryBuilder
     */
    input(value, name, type) {
        // input('my variable') => 'variable_name'
        if (name === undefined) {
            const n = '__QB_INPUT_' + ++this._vars + '__';
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
    /**
     * Specifies the number of rows to skip, before starting to return rows from the query expression.
     * The argument for the OFFSET clause can be an integer or expression that is greater than or equal to zero.
     * @param {number} o integer_constant | offset_row_count_expression
     * @returns {this} this
     * @memberof QueryBuilder
     */
    offset(o) {
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
    orderBy(o) {
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
            const previousOrderByIndex = this._orderBy.findIndex((previousOrderBy) => previousOrderBy.substr(0, newOrder.length) === newOrder);
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
    query(q) {
        q = q.replace(/[\n\r\s\t]+/g, ' ');
        const query = q.match(new RegExp(clauses('SELECT(?: (ALL|DISTINCT))?(?: TOP (\d+))? (.+?)', 'FROM (.+?)', 'WHERE (.+?)', 'ORDER BY (.+?)', 'OFFSET (\d+) ROWS?(?: FETCH (?:FIRST|NEXT) (\d+) ROWS? ONLY)?') +
            ' ?\;? ?$'));
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
            throw new Error('Invalid Query provided to QueryBuilder.\n' +
                '---------------------------------------\n' +
                q);
        }
        return this;
    }
    // Parse the record set.
    recordSet(r) {
        this._recordSet = r;
        return this;
    }
    /**
     * Returns the total possible row count for a query.
     * @returns {Promise<number>} promise of row count
     * @memberof QueryBuilder
     */
    rowCount() {
        const q = new QueryBuilder()
            .select('COUNT(*) AS "rows"')
            .all(this._all)
            .from(this._from)
            .where(this._where)
            .groupBy(this._groupBy)
            .recordSet((r) => r[0].rows);
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
    select(s) {
        // Comma-separated column names.
        if (typeof s === 'string') {
            // Loop each character.
            let expressions = s;
            let openParentheses = 0;
            let openQuote = '';
            for (let x = 0; x <= expressions.length; ++x) {
                const char = expressions.charAt(x);
                switch (char) {
                    // Ignore anything while quotes are open.
                    case '\'':
                    case '"':
                        if (openQuote === char) {
                            openQuote = '';
                        }
                        else if (x === 0 ||
                            expressions.charAt(x - 1) !== '\\') {
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
                        if (openParentheses === 0 &&
                            openQuote === '') {
                            // Expression delimeter.
                            if (char === ',' ||
                                char === '') {
                                // Add this expression to the SELECT clause
                                const expression = expressions.substring(0, x).trim();
                                this._select.set(expression, expression);
                                // Reset the expression finder.
                                expressions = expressions.substring(x + 1);
                                x = 0;
                            }
                            // Expression alias.
                            else if (expressions.substring(x, x + 4).toUpperCase() === ' AS ') {
                                // Add this expression to the SELECT clause.
                                const expression = expressions.substring(x + 4).match(/^\s*(?:\"([^\"]*)\"|([\w\d]+))/i);
                                if (expression) {
                                    const alias = expression[1] || expression[2];
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
    time() {
        return this._timeEnd - this._timeStart;
    }
    /**
     * Specifies that only the first set of rows will be returned from the query result.
     * The set of rows can be either a number, or a percent of the rows.
     * @param {number} n expression
     * @returns {this} this
     * @memberof QueryBuilder
     */
    top(n) {
        this._top = n;
        return this;
    }
    /**
     * Specifies a search condition to restrict the rows returned.
     * @param {(string | string[])} w search condition
     * @returns {this} this
     * @memberof QueryBuilder
     */
    where(w) {
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
    whereIn(columnOrExpression, input) {
        if (!Array.isArray(input)) {
            return this.where(columnOrExpression + ' = ' + this.input(input));
        }
        return this.where(columnOrExpression + ' IN (' + input.map((value) => this.input(value)).join(', ') + ')');
    }
    /**
     * Constructs the FROM clause.
     * @private
     * @returns {string} the FROM clause
     * @memberof QueryBuilder
     */
    buildFrom() {
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
    buildGroupBy() {
        if (this._groupBy.length) {
            return ' GROUP BY ' + this._groupBy.map((expression) => this.getExpressionForAlias(expression)).join(', ');
        }
        return '';
    }
    /**
     * Constructs the OFFSET FETCH clause.
     * @private
     * @returns {string} the OFFSET FETCH clause
     * @memberof QueryBuilder
     */
    buildOffset() {
        if (this._offset > 0 ||
            this._fetch > 0) {
            // https://technet.microsoft.com/en-us/library/gg699618(v=sql.110).aspx#Anchor_2
            if (!this._orderBy.length) {
                throw new Error('ORDER BY is mandatory to use OFFSET and FETCH clause.');
            }
            if (this._top) {
                throw new Error('TOP cannot be combined with OFFSET and FETCH in the same query expression.');
            }
            return (' OFFSET ' + this._offset + ' ROWS' + (this._fetch > 0
                ? ' FETCH NEXT ' + this._fetch + ' ROWS ONLY'
                : ''));
        }
        return '';
    }
    /**
     * Constructs the ORDER BY clause.
     * @private
     * @returns {string} the ORDER BY clause
     * @memberof QueryBuilder
     */
    buildOrderBy() {
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
    buildSelect() {
        if (this._select.size) {
            return ('SELECT ' + (this._all
                ? 'ALL'
                : 'DISTINCT') + (this._top !== 0
                ? ' TOP ' + this._top
                : '') + ' ' +
                (
                // Convert entries from an IterableIterator to an Array, so that it can be mapped.
                ((entries) => {
                    const e = [];
                    for (const entry of entries) {
                        e.push(entry);
                    }
                    return e;
                })(this._select.entries()))
                    .map(([key, value]) => value + ' AS "' + key.replace(/\"/g, '\\\"') + '"')
                    .join(', '));
        }
        return '';
    }
    /**
     * Constructs the WHERE clause.
     * @private
     * @returns {string} the WHERE clause
     * @memberof QueryBuilder
     */
    buildWhere() {
        if (this._where.length) {
            return ' WHERE ' + this._where.join(' AND ');
        }
        return '';
    }
}
