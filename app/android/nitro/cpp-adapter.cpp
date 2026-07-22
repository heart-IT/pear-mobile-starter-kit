// JNI entry point for libPearStarter. System.loadLibrary("PearStarter") (called from
// PearStarterOnLoad.initializeNative in MainApplication) triggers this, which
// registers every Nitro HybridObject into the shared registry. Without it the
// library loads but registerAllNatives never runs — createHybridObject then
// throws "not registered … []". (This file lives in nitro/ deliberately: the
// RN app CMake globs *.cpp next to CMakeLists and would swap out RN's own
// default-app-setup OnLoad — see CMakeLists.txt.)
#include <fbjni/fbjni.h>
#include <jni.h>
#include "PearStarterOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, []() {
    margelo::nitro::pearstarter::registerAllNatives();
  });
}
