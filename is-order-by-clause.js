"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Checks if a value is an ORDER BY clause object.
 * @param {*} x value
 * @returns {boolean} if the value is an ORDER BY clause object
 */
var isOrderByClause = function (x) {
    return typeof x === 'object' &&
        !Array.isArray(x) &&
        x !== null &&
        x.hasOwnProperty('order') &&
        (x.order === 'ASC' ||
            x.order === 'DESC') &&
        x.hasOwnProperty('by') &&
        typeof x.by === 'string';
};
exports.default = isOrderByClause;
