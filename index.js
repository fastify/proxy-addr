/*!
 * proxy-addr
 * Copyright(c) 2021 Fastify collaborators
 * Copyright(c) 2014-2016 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @private
 */

const forwarded = require('@fastify/forwarded')
const ipaddr = require('ipaddr.js')
const { isIP } = require('net')

/**
 * Variables.
 * @private
 */

const DIGIT_REGEXP = /^[0-9]+$/
const parseIp = ipaddr.parse

/**
 * Pre-defined IP ranges.
 * @private
 */

const IP_RANGES = {
  __proto__: null,
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
  if (!trust) {
    // Return all addresses
    return forwarded(req)
  }

  typeof trust !== 'function' && (trust = compile(trust))

  // get addresses
  const addrs = forwarded(req)

  const len = addrs.length - 1
  /* eslint-disable no-var */
  for (var i = 0; i < len; i++) {
    if (trust(addrs[i], i) === false) {
      addrs.length = i + 1
      break
    }
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

  /* eslint-disable no-var */
  for (var i = 0; i < trust.length; i++) {
    val = trust[i]

    if (val in IP_RANGES) {
      // Splice in pre-defined range
      val = IP_RANGES[val]
      trust.splice.apply(trust, [i, 1].concat(val))
      i += val.length - 1
    }
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

  /* eslint-disable no-var */
  for (var i = 0; i < arr.length; i++) {
    rangeSubnets[i] = parseIpNotation(arr[i])
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

function parseIpNotation (note) {
  const pos = note.lastIndexOf('/')
  const str = pos !== -1
    ? note.substring(0, pos)
    : note

  if (isIP(str) === 0) {
    throw new TypeError('invalid IP address: ' + str)
  }

  let ip = parseIp(str)

  if (pos === -1 && ip.kind() === 'ipv6' && isIPv4MappedIPv6Address(str)) {
    // Store as IPv4
    ip = ip.toIPv4Address()
  }

  const kind = ip.kind()

  const max = kind === 'ipv6'
    ? 128
    : 32

  let range = pos !== -1
    ? note.substring(pos + 1, note.length)
    : null

  if (range === null) {
    range = max
  } else if (DIGIT_REGEXP.test(range)) {
    range = parseInt(range, 10)
  } else if (kind === 'ipv4' && isIP(range) === 4) {
    range = prefixLengthFromSubnetMask(range)
  } else {
    range = null
  }

  if (range <= 0 || range > max) {
    throw new TypeError('invalid range on address: ' + note)
  }

  return [ip, range, kind]
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

  typeof trust !== 'function' && (trust = compile(trust))

  // get addresses
  const addrs = forwarded(req)

  switch (addrs.length) {
    case 1:
      return addrs[0]
    case 2:
      return trust(addrs[0], 0)
        ? addrs[1]
        : addrs[0]
    default: {
      /* eslint-disable no-var */
      for (var i = 0; i < addrs.length - 1; i++) {
        if (trust(addrs[i], i) === false) {
          return addrs[i]
        }
      }

      return addrs[addrs.length - 1]
    }
  }
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
    if (isIP(addr) === 0) return false

    const ip = parseIp(addr)
    let ipconv
    const kind = ip.kind()
    const isIPv4MappedAddress = kind === 'ipv6'
      ? isIPv4MappedIPv6Address(addr)
      : false

    /* eslint-disable no-var */
    for (var i = 0; i < subnets.length; i++) {
      const subnet = subnets[i]
      const subnetip = subnet[0]
      const subnetrange = subnet[1]
      const subnetkind = subnet[2]
      let trusted = ip

      if (kind !== subnetkind) {
        if (subnetkind === 'ipv4' && !isIPv4MappedAddress) {
          // Incompatible IP addresses
          continue
        }

        if (!ipconv) {
          // Convert IP to match subnet IP kind
          ipconv = subnetkind === 'ipv4'
            ? ip.toIPv4Address()
            : ip.toIPv4MappedAddress()
        }

        trusted = ipconv
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
  const subnetrange = subnet[1]
  const subnetkind = subnet[2]
  const subnetisipv4 = subnetkind === 'ipv4'

  return function trust (addr) {
    if (isIP(addr) === 0) return false

    let ip = parseIp(addr)
    const kind = ip.kind()
    const isIPv4MappedAddress = kind === 'ipv6'
      ? isIPv4MappedIPv6Address(addr)
      : false

    if (kind !== subnetkind) {
      if (subnetisipv4 && !isIPv4MappedAddress) {
        // Incompatible IP addresses
        return false
      }

      // Convert IP to match subnet IP kind
      ip = subnetisipv4
        ? ip.toIPv4Address()
        : ip.toIPv4MappedAddress()
    }

    return ip.match(subnetip, subnetrange)
  }
}

function octetToZeros (ip, start, end) {
  return (
    (ip[start] === '0' && 9) ||
    ((end - start) === 3 && (
      (ip[start] === '1' && (
        (ip[start + 1] === '2' && ip[start + 2] === '8' && 8) ||
        (ip[start + 1] === '9' && ip[start + 2] === '2' && 7)
      )) ||
      (ip[start] === '2' && (
        (ip[start + 1] === '2' && ip[start + 2] === '4' && 6) ||
        (ip[start + 1] === '4' && (
          (ip[start + 2] === '0' && 5) ||
          (ip[start + 2] === '8' && 4)
        )) ||
        (ip[start + 1] === '5' && (
          (ip[start + 2] === '2' && 3) ||
          (ip[start + 2] === '4' && 2) ||
          (ip[start + 2] === '5' && 1)
        ))
      ))
    ))
  ) || 0
}

/**
 * Parse netmask string into CIDR range.
 *
 * @param {String} netmask
 * @private
 */
function prefixLengthFromSubnetMask (netmask) {
  let stop = false
  let cidr = 0

  let end = netmask.length
  let start = netmask.lastIndexOf('.', end - 1)
  let zeros = octetToZeros(netmask, start + 1, end)
  if (zeros === 0) return null
  zeros !== 9 && (stop = true)
  cidr += zeros

  end = start
  start = netmask.lastIndexOf('.', end - 1)
  zeros = octetToZeros(netmask, start + 1, end)
  if (zeros !== 1 && (stop === true || zeros === 0)) return null
  stop === false && zeros !== 9 && (stop = true)
  cidr += zeros

  end = start
  start = netmask.lastIndexOf('.', end - 1)
  zeros = octetToZeros(netmask, start + 1, end)
  if (zeros !== 1 && (stop === true || zeros === 0)) return null
  stop === false && zeros !== 9 && (stop = true)
  cidr += zeros

  end = start
  zeros = octetToZeros(netmask, 0, end)
  if (zeros !== 1 && (stop === true || zeros === 0)) return null
  stop === false && zeros !== 9 && (stop = true)
  cidr += zeros

  return 36 - cidr
}

function isIPv4MappedIPv6Address (addr) {
  if (
    addr[0] === ':' &&
    addr[1] === ':'
  ) {
    if (
      addr[2] === 'f' &&
      addr[3] === 'f' &&
      addr[4] === 'f' &&
      addr[5] === 'f' &&
      addr[6] === ':'
    ) {
      return true
    } else if (isIP(addr.slice(2)) === 4) {
      return true
    }
  }

  let group = 0
  for (var i = 0; i < addr.length; ++i) {
    switch (addr[i]) {
      case ':':
        if (group === 5) {
          return true
        }
        ++group
        break
      case '0':
        if (group === 5) {
          return false
        }
        break
      case 'f':
        if (group !== 5) {
          return false
        }
        break
      default:
        return false
    }
  }

  return false
}

/**
 * Module exports.
 * @public
 */

module.exports = proxyaddr
module.exports.default = proxyaddr
module.exports.proxyaddr = proxyaddr
module.exports.all = alladdrs
module.exports.compile = compile
module.exports.prefixLengthFromSubnetMask = prefixLengthFromSubnetMask
module.exports.isIPv4MappedIPv6Address = isIPv4MappedIPv6Address
