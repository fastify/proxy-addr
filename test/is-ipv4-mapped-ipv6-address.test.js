'use strict'

const { test } = require('tap')
const { isIPv4MappedIPv6Address } = require('../lib/is-ipv4-mapped-ipv6-address.js')

test('isIPv4MappedIPv6Address', (t) => {
  t.plan(23)

  // positive cases
  t.equal(isIPv4MappedIPv6Address('::ffff:'), true)
  t.equal(isIPv4MappedIPv6Address('::ffff:192.168.1.10'), true)
  t.equal(isIPv4MappedIPv6Address('::ffff:101:101'), true)
  t.equal(isIPv4MappedIPv6Address('0:0:0:0:0:ffff:0101:0101'), true)
  t.equal(isIPv4MappedIPv6Address('0000:0000:0000:0000:0000:ffff:0101:0101'), true)
  t.equal(isIPv4MappedIPv6Address('::8.8.8.8'), true)
  t.equal(isIPv4MappedIPv6Address('0:0:0:0:0:ffff:0:0'), true)
  t.equal(isIPv4MappedIPv6Address('::ffff:c0a8:101'), true)
  t.equal(isIPv4MappedIPv6Address('::ffff:192.168.1.1'), true)

  // negative cases
  t.equal(isIPv4MappedIPv6Address('0000:0000:0000:0000:ffff:ffff:0101:0101'), false)
  t.equal(isIPv4MappedIPv6Address('0000:0000:0000:ffff:ffff:ffff:0101:0101'), false)
  t.equal(isIPv4MappedIPv6Address('f000:0000:0000:ffff:ffff:ffff:0101:0101'), false)
  t.equal(isIPv4MappedIPv6Address('2001:0db8:85a3:0000:0000:8a2e:0370:7334'), false)
  t.equal(isIPv4MappedIPv6Address('2001:db8:ff:abc:def:123b:456c:78d'), false)
  t.equal(isIPv4MappedIPv6Address('invalid'), false)
  t.equal(isIPv4MappedIPv6Address(''), false)
  t.equal(isIPv4MappedIPv6Address('::'), false)
  t.equal(isIPv4MappedIPv6Address('::1'), false)
  t.equal(isIPv4MappedIPv6Address('0:ff::'), false)
  t.equal(isIPv4MappedIPv6Address('::ff:0'), false)
  t.equal(isIPv4MappedIPv6Address('::ff:0:0'), false)
  t.equal(isIPv4MappedIPv6Address('0:0:0:0:0:0:ffff:0'), false)
  t.equal(isIPv4MappedIPv6Address('::ff:ff:0:0:0'), false)
})
