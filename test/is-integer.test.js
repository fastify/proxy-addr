'use strict'

const { test } = require('tap')
const { isInteger } = require('../lib/is-integer.js')

test('isInteger', function (t) {
  t.plan(3)

  t.ok(isInteger('1'))
  t.ok(isInteger('1337'))

  t.notOk(isInteger('1.1'))
})
