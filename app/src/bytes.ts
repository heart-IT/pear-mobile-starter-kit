import { NitroModules } from 'react-native-nitro-modules'
import type { PearStarterBytes } from './specs/pearstarter-bytes.nitro'

/**
 * The hand-rolled C++ mmap module (Movement 3). Same visible-failure contract
 * as the other accessors: null if the native side isn't registered.
 */
export function bytesModule(): PearStarterBytes | null {
  try {
    return NitroModules.createHybridObject<PearStarterBytes>('PearStarterBytes')
  } catch {
    return null
  }
}
