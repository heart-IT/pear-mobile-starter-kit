package com.margelo.nitro.pearstarter

import com.margelo.nitro.NitroModules

class HybridPearStarterPaths : HybridPearStarterPathsSpec() {
  override fun getDocumentsPath(): String {
    return NitroModules.applicationContext?.filesDir?.absolutePath
      ?: throw Error("NitroModules.applicationContext is not available")
  }
}
