#pragma once

#include "HybridPearStarterBytesSpec.hpp"

namespace margelo::nitro::pearstarter {

// Movement 3, hand-rolled (read-along). The whole lesson is mapFile(): mmap a
// file and hand JS an ArrayBuffer that points straight at the mapped pages —
// no copy — then munmap only when JS releases the buffer.
class HybridPearStarterBytes : public HybridPearStarterBytesSpec {
public:
  HybridPearStarterBytes() : HybridObject(TAG) {}

  std::shared_ptr<ArrayBuffer> mapFile(const std::string& path) override;
};

} // namespace margelo::nitro::pearstarter
