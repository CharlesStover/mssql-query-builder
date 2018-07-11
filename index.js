"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var mssql_1 = require("mssql");
var is_order_by_clause_1 = require("./is-order-by-clause");
var sql_1 = require("./sql");
var clauses = function () {
    var c = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        c[_i] = arguments[_i];
    }
    return c.map(function (a) { return '(?:(?:^| )?' + a + ')?'; }).join('');
};
var QueryBuilder = /** @class */ (function (_super) {
    __extends(QueryBuilder, _super);
    /**
     * Creates an instance of QueryBuilder.
     * @param {config} [c] MSSQL config
     * @memberof QueryBuilder
     */
    function QueryBuilder(c) {
        var _this = _super.call(this) || this;
        _this.inputBit = function (value, name) { return _this.input(value, name, mssql_1.Bit); };
        _this.inputBoolean = function (value, name) { return _this.inputBit(value, name); };
        _this.inputBuffer = function (value, name) { return _this.inputVarBinary(value, name); };
        _this.inputDate = function (value, name) { return _this.inputDateTime(value, name); };
        _this.inputDateTime = function (value, name) { return _this.input(value, name, mssql_1.DateTime); };
        _this.inputInt = function (value, name) { return _this.input(value, name, mssql_1.Int); };
        _this.inputNumber = function (value, name) { return _this.inputInt(value, name); };
        _this.inputNVarChar = function (value, name) { return _this.input(value, name, mssql_1.NVarChar); };
        _this.inputString = function (value, name) { return _this.inputNVarChar(value, name); };
        _this.inputVarBinary = function (value, name) { return _this.input(value, name, mssql_1.VarBinary); };
        _this._all = true;
        _this._fetch = 0;
        _this._from = null;
        _this._groupBy = [];
        _this._input = new Map();
        _this._offset = 0;
        _this._orderBy = [];
        _this._recordSet = null;
        _this._select = new Map();
        _this._timeEnd = 0;
        _this._timeStart = 0;
        _this._top = 0;
        _this._where = [];
        _this._vars = 0;
        _this._request = sql_1.sqlRequest(c);
        return _this;
    }
    /**
     * Specifies that duplicate rows can appear in the result set.
     * @param {boolean} [all=true] whether duplicate rows can appear in the result set
     * @returns {this} this
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.all = function (all) {
        if (all === void 0) { all = true; }
        this._all = all;
        return this;
    };
    // Build the query.
    QueryBuilder.prototype.buildQuery = function () {
        return (this.buildSelect() +
            this.buildFrom() +
            this.buildWhere() +
            this.buildGroupBy() +
            this.buildOrderBy() +
            this.buildOffset() +
            ';');
    };
    /**
     * DISTINCT
     */
    QueryBuilder.prototype.distinct = function (distinct) {
        if (distinct === void 0) { distinct = true; }
        var e_1, _a, e_2, _b;
        // Toggle SELECT ALL versus SELECT DISTINCT.
        if (typeof distinct === 'boolean') {
            this._all = !distinct;
            return this;
        }
        // SELECT DISTINCT
        if (typeof distinct === 'string') {
            var d = this.getExpressionForAlias(distinct);
            var q = new QueryBuilder()
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
                .recordSet(function (rows) {
                return rows.map(function (row) {
                    return row.distinct;
                });
            });
            try {
                for (var _c = __values(this._input), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var _e = __read(_d.value, 2), key = _e[0], input = _e[1];
                    q.input(input.value, key, input.type);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return q.execute();
        }
        // SELECT an array of DISTINCT
        var results = [];
        try {
            for (var distinct_1 = __values(distinct), distinct_1_1 = distinct_1.next(); !distinct_1_1.done; distinct_1_1 = distinct_1.next()) {
                var d = distinct_1_1.value;
                results.push(this.distinct(d));
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (distinct_1_1 && !distinct_1_1.done && (_b = distinct_1.return)) _b.call(distinct_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return Promise.all(results);
    };
    // Execute a query.
    QueryBuilder.prototype.execute = function (q) {
        return __awaiter(this, void 0, void 0, function () {
            var e_3, _a, query, request, _b, _c, _d, key, input, result, error_1;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        // Build the query.
                        if (q) {
                            this.query(q);
                        }
                        query = this.buildQuery();
                        return [4 /*yield*/, this._request];
                    case 1:
                        request = _e.sent();
                        try {
                            for (_b = __values(this._input), _c = _b.next(); !_c.done; _c = _b.next()) {
                                _d = __read(_c.value, 2), key = _d[0], input = _d[1];
                                request.input(key, input.type, input.value);
                            }
                        }
                        catch (e_3_1) { e_3 = { error: e_3_1 }; }
                        finally {
                            try {
                                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                            }
                            finally { if (e_3) throw e_3.error; }
                        }
                        // Execute the query.
                        this._timeStart = Date.now();
                        _e.label = 2;
                    case 2:
                        _e.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, request.query(query)];
                    case 3:
                        result = _e.sent();
                        this._timeEnd = Date.now();
                        // Format the result.
                        return [2 /*return*/, (typeof this._recordSet === 'number'
                                ? result.recordsets[this._recordSet]
                                : (typeof this._recordSet === 'function'
                                    ? this._recordSet(result.recordset)
                                    : result.recordset))];
                    case 4:
                        error_1 = _e.sent();
                        this._timeEnd = Date.now();
                        throw new Error(error_1.message);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Specifies the number of rows to return, after processing the OFFSET clause.
     * The argument for the FETCH clause can be an integer or expression that is greater than or equal to one.
     * @param {number} f rowcount expression
     * @returns {this} this
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.fetch = function (f) {
        this._fetch = f;
        return this;
    };
    /**
     * Specifies the tables from which to retrieve rows.
     * @param {(null | string)} f table source
     * @returns {this} this
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.from = function (f) {
        this._from = f;
        return this;
    };
    /**
     * Get the expression value for a column alias.
     * @param {string} alias alias
     * @returns {string} expression
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.getExpressionForAlias = function (alias) {
        return this._select.get(alias) || alias;
    };
    /**
     * Specifies the groups (equivalence classes) that output rows are to be placed in.
     * If aggregate functions are included in the SELECT clause <select list>, the GROUP BY clause calculates a summary value for each group.
     * @param {(string | string[])} g An expression that grouping is performed on.
     * @returns {this} this
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.groupBy = function (g) {
        if (typeof g === 'string') {
            this._groupBy.push(g);
        }
        else {
            this._groupBy = this._groupBy.concat(g);
        }
        return this;
    };
    /**
     * SQL variable inputs
     * @param {string} name variable name
     * @param {ISqlTypeFactoryWithNoParams} type variable type
     * @param {*} value variable value
     * @returns {this} this
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.input = function (value, name, type) {
        // input('my variable') => 'variable_name'
        if (name === undefined) {
            var n = '__QB_INPUT_' + ++this._vars + '__';
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
        this._input.set(name, { type: type, value: value });
        return this;
    };
    /**
     * Specifies the number of rows to skip, before starting to return rows from the query expression.
     * The argument for the OFFSET clause can be an integer or expression that is greater than or equal to zero.
     * @param {number} o integer_constant | offset_row_count_expression
     * @returns {this} this
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.offset = function (o) {
        this._offset = o;
        return this;
    };
    /**
     * Specifies the sort order for the result set.
     * The ORDER BY clause is not valid in subqueries.
     * You also have an option to fetch only a window or page of results from the resultset using OFFSET-FETCH clause.
     * @param {(string | string[])} o order by expression
     * @returns {this} this
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.orderBy = function (o) {
        var e_4, _a;
        if (Array.isArray(o)) {
            try {
                for (var o_1 = __values(o), o_1_1 = o_1.next(); !o_1_1.done; o_1_1 = o_1.next()) {
                    var orderBy = o_1_1.value;
                    this.orderBy(orderBy);
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (o_1_1 && !o_1_1.done && (_a = o_1.return)) _a.call(o_1);
                }
                finally { if (e_4) throw e_4.error; }
            }
        }
        else if (typeof o === 'object') {
            if (is_order_by_clause_1.default(o)) {
                this.orderBy(o.by + ' ' + o.order);
            }
            else {
                throw new Error('Invalid ORDER BY clause object supplied to method `orderBy`.');
            }
        }
        else {
            // Get column/expression ORDER.
            var newOrder_1 = o.replace(/(?: ASC| DESC)$/, '');
            // Find previous ORDER BY instances of this column/expression.
            var previousOrderByIndex = this._orderBy.findIndex(function (previousOrderBy) {
                return previousOrderBy.substr(0, newOrder_1.length) === newOrder_1;
            });
            // Strip previous instances of this column/expression from the ORDER BY clause.
            if (previousOrderByIndex > -1) {
                this._orderBy.splice(previousOrderByIndex, 1);
            }
            // Append this column/expression to the ORDER BY clause.
            this._orderBy.push(o);
        }
        return this;
    };
    /**
     * Convert a string into a QueryBuilder object.
     * @param {string} q query
     * @returns {this} this
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.query = function (q) {
        q = q.replace(/[\n\r\s\t]+/g, ' ');
        var query = q.match(new RegExp(clauses('SELECT(?: (ALL|DISTINCT))?(?: TOP (\d+))? (.+?)', 'FROM (.+?)', 'WHERE (.+?)', 'ORDER BY (.+?)', 'OFFSET (\d+) ROWS?(?: FETCH (?:FIRST|NEXT) (\d+) ROWS? ONLY)?') +
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
    };
    // Parse the record set.
    QueryBuilder.prototype.recordSet = function (r) {
        this._recordSet = r;
        return this;
    };
    /**
     * Returns the total possible row count for a query.
     * @returns {Promise<number>} promise of row count
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.rowCount = function () {
        var e_5, _a;
        var q = new QueryBuilder()
            .select('COUNT(*) AS "rows"')
            .all(this._all)
            .from(this._from)
            .where(this._where)
            .groupBy(this._groupBy)
            .recordSet(function (r) {
            return r[0].rows;
        });
        try {
            for (var _b = __values(this._input), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), key = _d[0], input = _d[1];
                q.input(input.value, key, input.type);
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
        return q.execute();
    };
    /**
     * Specifies the columns to be returned by the query.
     * @param {(Select | string | string[])} s select list
     * @returns {this} this
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.select = function (s) {
        var e_6, _a;
        // Comma-separated column names.
        if (typeof s === 'string') {
            // Loop each character.
            var expressions = s;
            var openParentheses = 0;
            var openQuote = '';
            for (var x = 0; x <= expressions.length; ++x) {
                var char = expressions.charAt(x);
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
                                var expression = expressions.substring(0, x).trim();
                                this._select.set(expression, expression);
                                // Reset the expression finder.
                                expressions = expressions.substring(x + 1);
                                x = 0;
                            }
                            // Expression alias.
                            else if (expressions.substring(x, x + 4).toUpperCase() === ' AS ') {
                                // Add this expression to the SELECT clause.
                                var expression = expressions.substring(x + 4).match(/^\s*(?:\"([^\"]*)\"|([\w\d]+))/i);
                                if (expression) {
                                    var alias = expression[1] || expression[2];
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
            try {
                for (var _b = __values(Object.keys(s)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var key = _c.value;
                    this._select.set(key, s[key]);
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_6) throw e_6.error; }
            }
        }
        return this;
    };
    /**
     * Time it took to execute the query.
     * Returns 0 if the query has no begun executing.
     * Returns negative if the query is still executing.
     * @returns {number} time to execute the query
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.time = function () {
        return this._timeEnd - this._timeStart;
    };
    /**
     * Specifies that only the first set of rows will be returned from the query result.
     * The set of rows can be either a number, or a percent of the rows.
     * @param {number} n expression
     * @returns {this} this
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.top = function (n) {
        this._top = n;
        return this;
    };
    /**
     * Specifies a search condition to restrict the rows returned.
     * @param {(string | string[])} w search condition
     * @returns {this} this
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.where = function (w) {
        if (typeof w === 'string') {
            this._where.push(w);
        }
        else {
            this._where = this._where.concat(w);
        }
        return this;
    };
    /**
     * Species a search condition to restrict the rows returned using an Array.
     * WHERE column IN array
     * @param {string} w column or expression
     * @param {(number | number[] | string | string[])} i array of values
     * @returns {this} this
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.whereIn = function (columnOrExpression, input) {
        var _this = this;
        if (!Array.isArray(input)) {
            return this.where(columnOrExpression + ' = ' + this.input(input));
        }
        return this.where(columnOrExpression + ' IN (' + input.map(function (value) { return _this.input(value); }).join(', ') + ')');
    };
    /**
     * Constructs the FROM clause.
     * @private
     * @returns {string} the FROM clause
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.buildFrom = function () {
        if (this._from) {
            return ' FROM ' + this._from;
        }
        return '';
    };
    /**
     * Constructs the GROUP BY clause.
     * @private
     * @returns {string} the GROUP BY clause
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.buildGroupBy = function () {
        var _this = this;
        if (this._groupBy.length) {
            return ' GROUP BY ' + this._groupBy.map(function (expression) { return _this.getExpressionForAlias(expression); }).join(', ');
        }
        return '';
    };
    /**
     * Constructs the OFFSET FETCH clause.
     * @private
     * @returns {string} the OFFSET FETCH clause
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.buildOffset = function () {
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
    };
    /**
     * Constructs the ORDER BY clause.
     * @private
     * @returns {string} the ORDER BY clause
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.buildOrderBy = function () {
        if (this._orderBy.length) {
            return ' ORDER BY ' + this._orderBy.join(', ');
        }
        return '';
    };
    /**
     * Constructs the SELECT clause.
     * @private
     * @returns {string} the SELECT clause
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.buildSelect = function () {
        if (this._select.size) {
            return ('SELECT ' + (this._all
                ? 'ALL'
                : 'DISTINCT') + (this._top !== 0
                ? ' TOP ' + this._top
                : '') + ' ' +
                (
                // Convert entries from an IterableIterator to an Array, so that it can be mapped.
                (function (entries) {
                    var e_7, _a;
                    var e = [];
                    try {
                        for (var entries_1 = __values(entries), entries_1_1 = entries_1.next(); !entries_1_1.done; entries_1_1 = entries_1.next()) {
                            var entry = entries_1_1.value;
                            e.push(entry);
                        }
                    }
                    catch (e_7_1) { e_7 = { error: e_7_1 }; }
                    finally {
                        try {
                            if (entries_1_1 && !entries_1_1.done && (_a = entries_1.return)) _a.call(entries_1);
                        }
                        finally { if (e_7) throw e_7.error; }
                    }
                    return e;
                })(this._select.entries()))
                    .map(function (_a) {
                    var _b = __read(_a, 2), key = _b[0], value = _b[1];
                    return value + ' AS "' + key.replace(/\"/g, '\\\"') + '"';
                })
                    .join(', '));
        }
        return '';
    };
    /**
     * Constructs the WHERE clause.
     * @private
     * @returns {string} the WHERE clause
     * @memberof QueryBuilder
     */
    QueryBuilder.prototype.buildWhere = function () {
        if (this._where.length) {
            return ' WHERE ' + this._where.join(' AND ');
        }
        return '';
    };
    QueryBuilder.default = QueryBuilder;
    return QueryBuilder;
}(events_1.EventEmitter));
module.exports = QueryBuilder;
