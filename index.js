/*!
 * proxy-addr
 * Copyright(c) 2021 Fastify collaborators
 * Copyright(c) 2014-2016 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module exports.
 * @public
 */

module.exports = proxyaddr
module.exports.default = proxyaddr
module.exports.proxyaddr = proxyaddr
module.exports.all = alladdrs
module.exports.compile = compile

/**
 * Module dependencies.
 * @private
 */

const forwarded = require('@fastify/forwarded')
const ipaddr = require('ipaddr.js')

/**
 * Variables.
 * @private
 */

const DIGIT_REGEXP = /^\d+$/u
const isip = ipaddr.isValid
const parseip = ipaddr.parse

/**
 * Pre-defined IP ranges.
 * @private
 */

const IP_RANGES = {
  linklocal: ['169.254.0.0/16', 'fe80::/10'],
  loopback: ['127.0.0.1/8', '::1/128'],
  uniquelocal: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', 'fc00::/7']
}

/**
 * Get all addresses in the request, optionally stopping
 * at the first untrusted.
 *
 * @param {Object} request
 * @param {Function|Array|String} [trust]
 * @public
 */

function alladdrs (req, trust) {
  // get addresses
  const addrs = forwarded(req)

  if (!trust) {
    // Return all addresses
    return addrs
  }

  if (typeof trust !== 'function') {
    trust = compile(trust)
  }

  for (let i = 0; i < addrs.length - 1; i++) {
    if (trust(addrs[i], i)) continue

    addrs.length = i + 1
  }

  return addrs
}

/**
 * Compile argument into trust function.
 *
 * @param {Array|String} val
 * @private
 */

function compile (val) {
  if (!val) {
    throw new TypeError('argument is required')
  }

  let trust

  if (typeof val === 'string') {
    trust = [val]
  } else if (Array.isArray(val)) {
    trust = val.slice()
  } else {
    throw new TypeError('unsupported trust argument')
  }

  for (let i = 0; i < trust.length; i++) {
    val = trust[i]

    if (!Object.hasOwn(IP_RANGES, val)) {
      continue
    }

    // Splice in pre-defined range
    val = IP_RANGES[val]
    trust.splice.apply(trust, [i, 1].concat(val))
    i += val.length - 1
  }

  return compileTrust(compileRangeSubnets(trust))
}

/**
 * Compile `arr` elements into range subnets.
 *
 * @param {Array} arr
 * @private
 */

function compileRangeSubnets (arr) {
  const rangeSubnets = new Array(arr.length)

  for (let i = 0; i < arr.length; i++) {
    rangeSubnets[i] = parseipNotation(arr[i])
  }

  return rangeSubnets
}

/**
 * Compile range subnet array into trust function.
 *
 * @param {Array} rangeSubnets
 * @private
 */

function compileTrust (rangeSubnets) {
  // Return optimized function based on length
  const len = rangeSubnets.length
  return len === 0
    ? trustNone
    : len === 1
      ? trustSingle(rangeSubnets[0])
      : trustMulti(rangeSubnets)
}

/**
 * Parse IP notation string into range subnet.
 *
 * @param {String} note
 * @private
 */

function parseipNotation (note) {
  const pos = note.lastIndexOf('/')
  const str = pos !== -1
    ? note.substring(0, pos)
    : note

  if (!isip(str)) {
    throw new TypeError('invalid IP address: ' + str)
  }

  let ip = parseip(str)

  if (pos === -1 && ip.kind() === 'ipv6' && ip.isIPv4MappedAddress()) {
    // Store as IPv4
    ip = ip.toIPv4Address()
  }

  const max = ip.kind() === 'ipv6'
    ? 128
    : 32

  let range = pos !== -1
    ? note.substring(pos + 1, note.length)
    : null

  if (range === null) {
    range = max
  } else if (DIGIT_REGEXP.test(range)) {
    range = parseInt(range, 10)
  } else if (ip.kind() === 'ipv4' && isip(range)) {
    range = parseNetmask(range)
  } else {
    range = null
  }

  if (range <= 0 || range > max) {
    throw new TypeError('invalid range on address: ' + note)
  }

  return [ip, range]
}

/**
 * Parse netmask string into CIDR range.
 *
 * @param {String} netmask
 * @private
 */

function parseNetmask (netmask) {
  const ip = parseip(netmask)
  const kind = ip.kind()

  return kind === 'ipv4'
    ? ip.prefixLengthFromSubnetMask()
    : null
}

/**
 * Determine address of proxied request.
 *
 * @param {Object} request
 * @param {Function|Array|String} trust
 * @public
 */

function proxyaddr (req, trust) {
  if (!req) {
    throw new TypeError('req argument is required')
  }

  if (!trust) {
    throw new TypeError('trust argument is required')
  }

  const addrs = alladdrs(req, trust)

  return addrs[addrs.length - 1]
}

/**
 * Static trust function to trust nothing.
 *
 * @private
 */

function trustNone () {
  return false
}

/**
 * Compile trust function for multiple subnets.
 *
 * @param {Array} subnets
 * @private
 */

function trustMulti (subnets) {
  return function trust (addr) {
    if (!isip(addr)) return false

    let ip = parseip(addr)

    if (ip.kind() === 'ipv6' && ip.isIPv4MappedAddress()) {
      // Canonicalize IPv4-mapped candidates to IPv4 so a mapped address
      // cannot bypass the cross-family guard via the same-family path
      ip = ip.toIPv4Address()
    }

    let ipconv
    const kind = ip.kind()

    for (let i = 0; i < subnets.length; i++) {
      const subnet = subnets[i]
      const subnetip = subnet[0]
      const subnetkind = subnetip.kind()
      const subnetrange = subnet[1]
      let trusted = ip

      if (kind !== subnetkind) {
        const subnetisipv4 = subnetkind === 'ipv4'

        if (subnetisipv4 && !ip.isIPv4MappedAddress()) {
          // Incompatible IP addresses
          continue
        }

        if (!subnetisipv4 && !(subnetrange >= 96 && subnetip.isIPv4MappedAddress())) {
          // IPv6 subnet only spans IPv4 when it is a mapped subnet whose
          // prefix covers the ::ffff: marker; otherwise it must not match IPv4
          continue
        }

        if (!ipconv) {
          // IPv4-mapped candidates were canonicalized to IPv4 above, so a
          // cross-family IPv4 subnet is handled via the same-family path and
          // this conversion only ever produces an IPv4-mapped address
          ipconv = ip.toIPv4MappedAddress()
        }

        trusted = ipconv
      } else if (kind === 'ipv6' && subnetip.isIPv4MappedAddress()) {
        // A native IPv6 candidate cannot match an IPv4-mapped subnet
        continue
      }

      if (trusted.match(subnetip, subnetrange)) {
        return true
      }
    }

    return false
  }
}

/**
 * Compile trust function for single subnet.
 *
 * @param {Object} subnet
 * @private
 */

function trustSingle (subnet) {
  const subnetip = subnet[0]
  const subnetkind = subnetip.kind()
  const subnetisipv4 = subnetkind === 'ipv4'
  const subnetrange = subnet[1]

  return function trust (addr) {
    if (!isip(addr)) return false

    let ip = parseip(addr)

    if (ip.kind() === 'ipv6' && ip.isIPv4MappedAddress()) {
      // Canonicalize IPv4-mapped candidates to IPv4 so a mapped address
      // cannot bypass the cross-family guard via the same-family path
      ip = ip.toIPv4Address()
    }

    const kind = ip.kind()

    if (kind !== subnetkind) {
      if (subnetisipv4 && !ip.isIPv4MappedAddress()) {
        // Incompatible IP addresses
        return false
      }

      if (!subnetisipv4 && !(subnetrange >= 96 && subnetip.isIPv4MappedAddress())) {
        // IPv6 subnet only spans IPv4 when it is a mapped subnet whose
        // prefix covers the ::ffff: marker; otherwise it must not match IPv4
        return false
      }

      // IPv4-mapped candidates were canonicalized to IPv4 above, so a
      // cross-family IPv4 subnet is handled via the same-family path and
      // this conversion only ever produces an IPv4-mapped address
      ip = ip.toIPv4MappedAddress()
    } else if (kind === 'ipv6' && subnetip.isIPv4MappedAddress()) {
      // A native IPv6 candidate cannot match an IPv4-mapped subnet
      return false
    }

    return ip.match(subnetip, subnetrange)
  }
}
