'use strict'

const { test } = require('node:test')
const proxyaddr = require('..')

test('with no header should return empty array', function (t) {
  t.assert.deepStrictEqual(proxyaddr.forwarded(), [])
})

test('with no x-forwarded-for header should return empty array', function (t) {
  t.assert.deepStrictEqual(proxyaddr.forwarded(), [])
})

test('with empty x-forwarded-for header should return empty array', function (t) {
  t.assert.deepStrictEqual(proxyaddr.forwarded(' '), [])
})

test('with single valid x-forwarded-for header should return array with that address', function (t) {
  t.assert.deepStrictEqual(proxyaddr.forwarded('10.0.0.1'), ['10.0.0.1'])
})

test('with multiple x-forwarded-for header should return array with those addresses in order', function (t) {
  t.assert.deepStrictEqual(proxyaddr.forwarded('10.0.0.2, 10.0.0.1'), ['10.0.0.1', '10.0.0.2'])
})

test('with multiple x-forwarded-for header should return array with those addresses in order', function (t) {
  t.assert.deepStrictEqual(proxyaddr.forwarded('10.0.0.2, 10.0.0.1'), ['10.0.0.1', '10.0.0.2'])
})

test('with multiple including empty first x-forwarded-for header should return array with those addresses in order', function (t) {
  t.assert.deepStrictEqual(proxyaddr.forwarded(', 10.0.0.2, 10.0.0.1'), ['10.0.0.1', '10.0.0.2'])
})

test('with multiple including empty middle x-forwarded-for header should return array with those addresses in order', function (t) {
  t.assert.deepStrictEqual(proxyaddr.forwarded('10.0.0.2, , 10.0.0.1'), ['10.0.0.1', '10.0.0.2'])
})

test('with multiple including empty last x-forwarded-for header should return array with those addresses in order', function (t) {
  t.assert.deepStrictEqual(proxyaddr.forwarded('10.0.0.2, 10.0.0.1,'), ['10.0.0.1', '10.0.0.2'])
})

test('with multiple x-forwarded-for header with spaces should return array with those addresses in order', function (t) {
  t.assert.deepStrictEqual(proxyaddr.forwarded(' 10.0.0.2 , 10.0.0.1 '), ['10.0.0.1', '10.0.0.2'])
})

test('with multiple x-forwarded-for header with tabs should return array with those addresses in order', function (t) {
  t.assert.deepStrictEqual(proxyaddr.forwarded('\t10.0.0.2\t,\t10.0.0.1\t'), ['10.0.0.1', '10.0.0.2'])
})
