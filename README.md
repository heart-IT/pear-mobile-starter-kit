# Pear Mobile Starter Kit

A **React Native + Bare + Nitro** starter that boots on device — the plumbing you
need to run the [Holepunch / Pear](https://docs.pears.com/) P2P stack inside a
React Native app, with the native seam already wired and every scaffold trap
already fixed. Clone it, `npm install`, run it, and start building your app
instead of fighting Gradle, CMake, and SoLoader.

Extracted from the companion repo of the
[Shoebox local-first series](https://heartit.tech/shoebox-part-1-one-photo-no-server/),
so the first chapter can teach P2P instead of build config. Everything below the
JS layer is the device-verified scaffold from that series.

> **Status:** the native wiring is the device-verified Shoebox scaffold; the JS
> layer is a blank home screen. It's built to boot as-is — do one `npm run android`
> to confirm on your setup before you lean on it. iOS pods/build are unverified here.

---

## What you get

Two native seams, both proven by the blank home screen on first launch:

1. **Nitro** — a typed native module (`ShoeboxPaths`) crossing JS ↔ Kotlin/Swift/C++
   and returning a real value (the app documents dir). Three more example modules
   ship as references for different patterns:
   | Module | Pattern |
   |---|---|
   | `ShoeboxPaths` | the minimal seam — a value in, a value out (Kotlin/Swift) |
   | `ShoeboxRoll` | a platform API (Android MediaStore / iOS PhotoKit) |
   | `ShoeboxBytes` | a hand-rolled **C++** HybridObject (mmap → zero-copy `ArrayBuffer`) |
   | `ShoeboxEmbed` | on-device ML (TFLite + NNAPI) — **ships without its model** |
2. **Bare** — a [Bare](https://github.com/holepunchto/bare) worklet hosted by
   [react-native-bare-kit](https://github.com/holepunchto/react-native-bare-kit),
   booting `worker/index.js` and answering a `bare-rpc` PING over the IPC. This is
   where the Holepunch stack lives; the app talks to it over `bare-rpc`.

Keep the modules you want, delete the rest (see [Trimming](#trimming-the-starter)).

## Quick start

```sh
git clone https://github.com/heart-IT/pear-mobile-starter-kit
cd pear-mobile-starter-kit

# the Bare worker (its own package; RN links its native addons from here)
cd worker && npm install && cd ..

# the app
cd app && npm install
npm run bundle:worker          # bare-pack → worker.bundle.mjs (committed, rebuild after worker edits)

# Android (the verified platform)
npm run android
# iOS (pods unverified in this starter)
cd ios && pod install && cd .. && npm run ios
```

The home screen should show a real documents path (Nitro seam) and `✓ ok …` from
the worker (Bare seam). If either shows `✗`, jump to [Gotchas](#the-scaffold-gotchas).

## Versions (pinned — pre-1.0 mobile P2P tooling moves fast)

| Package | Version | Why it's pinned |
|---|---|---|
| react-native | 0.86.0 | New Architecture is required by both bare-kit and Nitro |
| react-native-bare-kit | 0.15.0 | pre-1.0; hosts the Bare worklet, links native addons |
| react-native-nitro-modules / nitrogen | 0.36.1 | must match; codegen is committed under `nitrogen/generated/` |
| bare-pack | 2.2.0 | `--preset mobile` covers all 7 mobile hosts; the 2.2 release dropped `--target` |
| bare-rpc | 1.3.8 | self-frames the raw worklet IPC (commands are **uints**, not strings) |

## The scaffold gotchas

These are the five traps that stop a fresh RN + Bare + Nitro app from booting.
They're **already fixed in this starter** — documented here so you understand what
you're standing on (and can debug if you diverge). Every one was silent: none of
the error messages named its own cause.

1. **`minSdkVersion 29`.** bare-kit 0.15's manifest merger fails against the RN
   template default of 24. Set in `android/build.gradle`.
2. **Nitrogen's generated paths assume the nitro *library* layout, not an app.**
   `android/app/build.gradle` must apply the codegen from `../../nitrogen/...` and
   add the Kotlin `srcDir` itself; the generated `${projectDir}/../nitrogen` path
   resolves to a nonexistent `android/nitrogen/`.
3. **Overriding `externalNativeBuild` replaces RN's `appmodules` build.** Bridgeless
   boot hard-requires `libappmodules.so`, so the app `CMakeLists.txt` must be
   `project(appmodules)` + `include(ReactNative-application.cmake)`, with the Nitro
   target added alongside and `CMAKE_CXX_STANDARD 20` (Nitro headers need it).
4. **`ReactNative-application.cmake` globs `*.cpp` next to the CMakeLists and, if any
   exist, DROPS its default-app-setup sources** — including the OnLoad that registers
   the TurboModule delegate. Symptom: every TurboModule missing at boot
   (`'PlatformConstants' could not be found`). Fix: keep `cpp-adapter.cpp` in
   `android/nitro/`, out of the glob's range.
5. **bare-kit's prebuilt lists `libnativehelper.so` (the ART apex) as `NEEDED`.**
   The system linker resolves it, but SoLoader's manual dependency walk only searches
   app + `/system` + `/vendor` and fails to load `libappmodules`. Fix in
   `MainApplication`: init SoLoader with RN's merged mapping, then
   `prependSoSource(DirectorySoSource("/apex/com.android.art/lib64", ON_LD_LIBRARY_PATH))`
   before `loadReactNative`.

And the one that isn't a build error but a philosophy — **the sixth trap**:

6. **Nitro generates `initializeNative()` and expects a `JNI_OnLoad`, but wires
   neither call site.** Miss it and no HybridObject is ever registered — a
   null-guarded accessor then hides the dead seam and the app "works" by luck. The
   fixes: a real `JNI_OnLoad` → `registerAllNatives()` in `android/nitro/cpp-adapter.cpp`,
   and `ShoeboxOnLoad.initializeNative()` in `MainApplication.onCreate`. **The lesson,
   which outlives every version above: verify a native module by the value it returns
   on a device, never by "the app didn't crash."**

## Adding the Holepunch stack

The Bare worker (`worker/`) is where P2P lives. Add deps there — `corestore`,
`hyperswarm`, `hyperblobs`, `hypercore`, `autobase` — and require them from
`worker/index.js`. react-native-bare-kit links their **native addons** (sodium,
udx, rocksdb) by scanning the worker's dependency tree, which is why:

- the app must depend on the worker package (`"shoebox-worker": "file:../worker"`
  in `app/package.json`) — that's how bare-kit finds the addons to vendor;
- you run `npm run bundle:worker` from `app/` (over `node_modules/shoebox-worker/`)
  after changing the worker, so the bundled addon versions match what bare-kit links.

Hand-vendoring a second copy of the natives produces "frameworks with conflicting
names" at pod install — let bare-kit do the linking.

## Trimming the starter

Keep only the Nitro modules you need:
1. Delete the spec(s) under `app/src/specs/*.nitro.ts` and their `app/src/*.ts`
   wrappers, plus the native impls (`android/.../Hybrid*.kt`, `ios/Hybrid*.swift`,
   `cpp/Hybrid*.cpp`).
2. Re-run `npx nitrogen` from `app/` to regenerate `nitrogen/generated/` and the
   registration.
3. `ShoeboxEmbed` ships **without** its `mobilenet.tflite` asset — drop your own
   model into `android/app/src/main/assets/` (with `noCompress 'tflite'`), or delete
   the module per the steps above.

## Renaming for your app

This starter keeps the `Shoebox` name and the `com.margelo.nitro.shoebox` Nitro
namespace so the verified wiring stays intact out of the box. To rebrand:
`app/app.json` (`name`/`displayName`, must match `index.js` registration),
`android` `applicationId` + package dirs + `MainApplication`/`MainActivity` package,
`ios/Shoebox/` folder + bundle id + `ShoeboxNitro.podspec`, and the
`com.margelo.nitro.shoebox` namespace across `nitro.json`, the specs, and the native
impls — then re-run `npx nitrogen`. Do it once, verify on device.

## License

MIT. Extracted from the [heart-IT/shoebox](https://github.com/heart-IT/shoebox)
companion repo.
