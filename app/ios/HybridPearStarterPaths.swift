import Foundation

class HybridPearStarterPaths: HybridPearStarterPathsSpec {
  func getDocumentsPath() throws -> String {
    return NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)[0]
  }
}
