/* global BareKit */
// The Bare worklet entry. Synchronous by contract (rn-bare-kit#1) — no top-level
// await. This minimal worker proves the runtime boots and the IPC round-trips:
// it answers a single PING command over bare-rpc, which self-frames the raw IPC.
// Grow it into a real app by requiring Holepunch modules here (corestore,
// hyperswarm, hyperblobs, …); react-native-bare-kit links their native addons
// from THIS package's dependency tree — see the README.

const RPC = require('bare-rpc')
const b4a = require('b4a')

// Commands are uints on the wire (bare-rpc encodes them with c.uint), not strings.
const CMD = { PING: 1 }

// eslint-disable-next-line no-new
new RPC(BareKit.IPC, (req) => {
  if (req.command === CMD.PING) {
    req.reply(b4a.from(JSON.stringify({ ok: true, runtime: 'bare', echo: b4a.toString(req.data) })))
  }
})
