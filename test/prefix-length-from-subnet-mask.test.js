'use strict'

const { test } = require('tap')
const { prefixLengthFromSubnetMask } = require('../lib/prefix-length-from-subnet-mask')

test('prefixLengthFromSubnetMask returns proper CIDR notation for standard IPv4 masks', (t) => {
  t.plan(44)

  // positive cases
  t.equal(prefixLengthFromSubnetMask('255.255.255.255'), 32)
  t.equal(prefixLengthFromSubnetMask('255.255.255.254'), 31)
  t.equal(prefixLengthFromSubnetMask('255.255.255.252'), 30)
  t.equal(prefixLengthFromSubnetMask('255.255.255.248'), 29)
  t.equal(prefixLengthFromSubnetMask('255.255.255.240'), 28)
  t.equal(prefixLengthFromSubnetMask('255.255.255.224'), 27)
  t.equal(prefixLengthFromSubnetMask('255.255.255.192'), 26)
  t.equal(prefixLengthFromSubnetMask('255.255.255.128'), 25)
  t.equal(prefixLengthFromSubnetMask('255.255.255.0'), 24)
  t.equal(prefixLengthFromSubnetMask('255.255.254.0'), 23)
  t.equal(prefixLengthFromSubnetMask('255.255.252.0'), 22)
  t.equal(prefixLengthFromSubnetMask('255.255.248.0'), 21)
  t.equal(prefixLengthFromSubnetMask('255.255.240.0'), 20)
  t.equal(prefixLengthFromSubnetMask('255.255.224.0'), 19)
  t.equal(prefixLengthFromSubnetMask('255.255.192.0'), 18)
  t.equal(prefixLengthFromSubnetMask('255.255.128.0'), 17)
  t.equal(prefixLengthFromSubnetMask('255.255.0.0'), 16)
  t.equal(prefixLengthFromSubnetMask('255.254.0.0'), 15)
  t.equal(prefixLengthFromSubnetMask('255.252.0.0'), 14)
  t.equal(prefixLengthFromSubnetMask('255.248.0.0'), 13)
  t.equal(prefixLengthFromSubnetMask('255.240.0.0'), 12)
  t.equal(prefixLengthFromSubnetMask('255.224.0.0'), 11)
  t.equal(prefixLengthFromSubnetMask('255.192.0.0'), 10)
  t.equal(prefixLengthFromSubnetMask('255.128.0.0'), 9)
  t.equal(prefixLengthFromSubnetMask('255.0.0.0'), 8)
  t.equal(prefixLengthFromSubnetMask('254.0.0.0'), 7)
  t.equal(prefixLengthFromSubnetMask('252.0.0.0'), 6)
  t.equal(prefixLengthFromSubnetMask('248.0.0.0'), 5)
  t.equal(prefixLengthFromSubnetMask('240.0.0.0'), 4)
  t.equal(prefixLengthFromSubnetMask('224.0.0.0'), 3)
  t.equal(prefixLengthFromSubnetMask('192.0.0.0'), 2)
  t.equal(prefixLengthFromSubnetMask('128.0.0.0'), 1)
  t.equal(prefixLengthFromSubnetMask('0.0.0.0'), 0)

  // negative cases
  t.equal(prefixLengthFromSubnetMask('255.255.255.253'), null)
  t.equal(prefixLengthFromSubnetMask('168.192.255.0'), null)
  t.equal(prefixLengthFromSubnetMask('192.168.255.0'), null)
  t.equal(prefixLengthFromSubnetMask('255.0.255.0'), null)
  t.equal(prefixLengthFromSubnetMask('255.0.255.42'), null)
  t.equal(prefixLengthFromSubnetMask('255.0.42.0'), null)
  t.equal(prefixLengthFromSubnetMask('255.42.0.0'), null)
  t.equal(prefixLengthFromSubnetMask('42.0.0.0'), null)
  t.equal(prefixLengthFromSubnetMask('255.255.42.254'), null)
  t.equal(prefixLengthFromSubnetMask('255.255.192.255'), null)
  t.equal(prefixLengthFromSubnetMask('192.255.255.255'), null)
})