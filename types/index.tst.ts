import proxyaddr from '..'
import { createServer } from 'node:http'
import { expect } from 'tstyche'

createServer((req) => {
  expect(proxyaddr(req, (addr) => addr === '127.0.0.1')).type.toBe<string>()
  expect(proxyaddr(req, (_addr, i) => i < 1)).type.toBe<string>()

  expect(proxyaddr(req, '127.0.0.1')).type.toBe<string>()
  expect(proxyaddr(req, ['127.0.0.0/8', '10.0.0.0/8'])).type.toBe<string>()
  expect(
    proxyaddr(req, ['127.0.0.0/255.0.0.0', '192.168.0.0/255.255.0.0'])
  ).type.toBe<string>()

  expect(proxyaddr(req, '::1')).type.toBe<string>()
  expect(proxyaddr(req, ['::1/128', 'fe80::/10'])).type.toBe<string>()

  expect(proxyaddr(req, 'loopback')).type.toBe<string>()
  expect(
    proxyaddr(req, ['loopback', 'fc00:ac:1ab5:fff::1/64'])
  ).type.toBe<string>()

  expect(proxyaddr.all(req)).type.toBe<string[]>()
  expect(proxyaddr.all(req, 'loopback')).type.toBe<string[]>()

  proxyaddr.compile(['localhost'])

  const trust = proxyaddr.compile('localhost')

  expect(trust).type.toBe<(addr: string, i: number) => boolean>()

  proxyaddr(req, trust)
})
