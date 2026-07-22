import React, { useEffect, useState } from 'react'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Worklet } from 'react-native-bare-kit'
// @ts-ignore — .mjs bundle produced by `npm run bundle:worker` (bare-pack)
import bundle from './worker.bundle.mjs'
// @ts-ignore — bare-rpc ships no types
import RPC from 'bare-rpc'
import b4a from 'b4a'
import { documentsPath } from './src/paths'

const CMD = { PING: 1 } // mirror worker/index.js

// A blank starter home screen that proves both native seams are wired:
//   1) Nitro   — a C++/Kotlin/Swift HybridObject returning a real value.
//   2) Bare    — a worklet booting and answering over bare-rpc IPC.
// Replace this with your app. Delete the example Nitro modules you don't need
// (roll / bytes / embed) and re-run `npx nitrogen`.
export default function App() {
  const [nativePath, setNativePath] = useState('…')
  const [worker, setWorker] = useState('…')

  useEffect(() => {
    // Nitro seam — verify by the VALUE it returns, never by "the app didn't crash".
    setNativePath(documentsPath() ?? '✗ PearStarterPaths native module not registered')

    // Bare seam — boot the worklet, ping it, read the reply.
    const worklet = new Worklet()
    worklet.start('/worker.bundle', bundle, [])
    const rpc = new (RPC as any)(worklet.IPC)
    const req = rpc.request(CMD.PING)
    req.send(b4a.from('hello from RN'))
    req.reply().then(
      (res: Uint8Array) => setWorker(`✓ ${b4a.toString(res)}`),
      (e: unknown) => setWorker(`✗ ${String(e)}`),
    )
    return () => worklet.terminate()
  }, [])

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Pear Mobile Starter</Text>
        <Text style={styles.sub}>React Native · Bare · Nitro — booting on device</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Nitro native module (PearStarterPaths)</Text>
          <Text style={styles.value}>{nativePath}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Bare worker (bare-rpc PING)</Text>
          <Text style={styles.value}>{worker}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 24, gap: 16, paddingTop: 64 },
  title: { fontSize: 28, fontWeight: '700' },
  sub: { fontSize: 14, color: '#888' },
  card: { gap: 4, paddingVertical: 8 },
  label: { fontSize: 12, color: '#888' },
  value: { fontSize: 14, fontFamily: 'Menlo', color: '#2b8a3e' },
})
