'use strict'

/**
 * Globals for benchmark.js
 */
const { prefixLengthFromSubnetMask } = require('../lib/prefix-length-from-subnet-mask')

/**
 * Module dependencies.
 */
const benchmark = require('benchmark')

const suite = new benchmark.Suite()

const ip = '255.255.254.0'

suite.add('prefixLengthFromSubnetMask', function () {
  prefixLengthFromSubnetMask(ip)
})

suite.on('cycle', function onCycle (event) {
  console.log(String(event.target))
})

suite.run({ async: false })
