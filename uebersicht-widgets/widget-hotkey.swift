// widget-hotkey — global ⌃⌥⌘W toggles the Übersicht widgets (doubloons, 75 Hard, STUDY//TERM, NOTE//PAD).
// Compiled + started at login by "Install STUDYTERM.command" (LaunchAgent com.example.studyterm.hotkey).
// Carbon RegisterEventHotKey needs no Accessibility permission.
import Cocoa
import Carbon

let dir = NSHomeDirectory() + "/Library/Application Support/STUDYTERM"
let flag = dir + "/hidden"

func toggle() {
    let fm = FileManager.default
    try? fm.createDirectory(atPath: dir, withIntermediateDirectories: true)
    if fm.fileExists(atPath: flag) { try? fm.removeItem(atPath: flag) } else { fm.createFile(atPath: flag, contents: nil) }
    let p = Process()
    p.executableURL = URL(fileURLWithPath: "/usr/bin/osascript")
    p.arguments = ["-e", "tell application id \"tracesOf.Uebersicht\" to refresh"]
    try? p.run()
}

var ref: EventHotKeyRef?
var spec = EventTypeSpec(eventClass: OSType(kEventClassKeyboard), eventKind: UInt32(kEventHotKeyPressed))
InstallEventHandler(GetApplicationEventTarget(), { _, _, _ in toggle(); return noErr }, 1, &spec, nil, nil)
let st = RegisterEventHotKey(UInt32(kVK_ANSI_W), UInt32(cmdKey | optionKey | controlKey),
                             EventHotKeyID(signature: OSType(0x53544D57), id: 1), GetApplicationEventTarget(), 0, &ref)
if st != noErr { FileHandle.standardError.write("hotkey register failed \(st)\n".data(using: .utf8)!) }
let app = NSApplication.shared
app.setActivationPolicy(.prohibited)
app.run()
