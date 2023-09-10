'use strict'

const isIntegerRE = /^[0-9]+$/

/**
 * @function isInteger
 * @description Test if a string is an integer
 * @param {string} str
 * @returns {boolean}
 */
const isInteger = isIntegerRE.test.bind(isIntegerRE)

module.exports = {
  isInteger
}
