#!/usr/bin/env bash
# Pear Mobile Starter — Axis-1 (app shell) rename helper.
#
# Renames the RN *component name* (Shoebox -> your name) and the Android
# *application id* (com.shoebox -> your id), including the package-dir move.
# It does NOT touch:
#   - the display name (already neutral: "Pear Mobile Starter" — grep + edit if you want)
#   - the iOS Xcode project (rename the target from inside Xcode — see README)
#   - the Nitro module identity, Axis 2 (needs `npx nitrogen` — see README)
#
# Usage:   ./rename.sh <NewName> <com.your.appid>
# Example: ./rename.sh AwesomeApp com.acme.awesome
#
# Run from the repo root, on a CLEAN git tree. Review the diff, then VERIFY on a device.
set -euo pipefail

NEW_NAME="${1:-}"; NEW_ID="${2:-}"
[ -z "$NEW_NAME" ] || [ -z "$NEW_ID" ] && { echo "usage: ./rename.sh <NewName> <com.your.appid>"; exit 1; }
case "$NEW_ID" in *.*) : ;; *) echo "app id must be reverse-DNS, e.g. com.acme.awesome"; exit 1 ;; esac
[ -f app/app.json ] || { echo "run me from the repo root (app/ not found)"; exit 1; }

OLD_NAME="Shoebox"
OLD_DIR="app/android/app/src/main/java/com/shoebox"
NEW_DIR="app/android/app/src/main/java/$(printf '%s' "$NEW_ID" | tr '.' '/')"

echo "→ component name: $OLD_NAME → $NEW_NAME"
perl -pi -e "s/\"name\": \"\Q$OLD_NAME\E\"/\"name\": \"$NEW_NAME\"/"                                app/app.json
perl -pi -e "s/getMainComponentName\(\): String = \"\Q$OLD_NAME\E\"/getMainComponentName(): String = \"$NEW_NAME\"/" "$OLD_DIR/MainActivity.kt"
perl -pi -e "s/withModuleName: \"\Q$OLD_NAME\E\"/withModuleName: \"$NEW_NAME\"/"                     app/ios/Shoebox/AppDelegate.swift
perl -pi -e "s/rootProject.name = '\Q$OLD_NAME\E'/rootProject.name = '$NEW_NAME'/"                  app/android/settings.gradle

echo "→ android app id: com.shoebox → $NEW_ID (applicationId + namespace + package dir)"
perl -pi -e "s/applicationId \"com\.shoebox\"/applicationId \"$NEW_ID\"/"                            app/android/app/build.gradle
perl -pi -e "s/namespace \"com\.shoebox\"/namespace \"$NEW_ID\"/"                                    app/android/app/build.gradle
mkdir -p "$(dirname "$NEW_DIR")"
git mv "$OLD_DIR" "$NEW_DIR" 2>/dev/null || mv "$OLD_DIR" "$NEW_DIR"
perl -pi -e "s/^package com\.shoebox\b/package $NEW_ID/" "$NEW_DIR"/*.kt

cat <<EOF

Axis 1 done. STILL MANUAL (see README → "Renaming for your app"):
  • iOS: rename the target/scheme/folder inside Xcode, update the Podfile target +
    'pod ...', set your real bundle id (now com.example.pearstarter, in project.pbxproj
    Debug + Release), then 'pod install'.
  • Display name: still "Pear Mobile Starter" in strings.xml / Info.plist /
    LaunchScreen / app.json displayName — edit if you want it to differ.
  • Axis 2 (optional): com.margelo.nitro.shoebox + Shoebox* module names — re-run
    'npx nitrogen' after renaming (or leave them; they're internal).

Then: cd app && npm install && npm run bundle:worker && npm run android — and VERIFY on device.
EOF
