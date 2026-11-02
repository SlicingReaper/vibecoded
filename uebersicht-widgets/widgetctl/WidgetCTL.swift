// WIDGET//CTL — settings app for the Übersicht widgets (WALLET//Ð, 75//HARD, STUDY//TERM, QUOTE//DAY, NOTE//PAD).
// Menu-bar app (no Dock icon while running). ⌃⌥⌘S opens/closes the window; ✕ (top left) or Esc closes it.
// The UI is ctl.html (in the app's Resources). Everything it changes is written to
//   ~/Library/Application Support/STUDYTERM/widgets.json
// which every widget reads on its next refresh; after each save Übersicht is told to refresh, so changes show at once.
// Built + installed by "Install WIDGETCTL.command" (00 — Meta). Carbon RegisterEventHotKey needs no Accessibility permission.
import Cocoa
import WebKit
import Carbon

let supportDir = NSHomeDirectory() + "/Library/Application Support/STUDYTERM"
let configPath = supportDir + "/widgets.json"
let hiddenFlag = supportDir + "/hidden"        // same flag ⌃⌥⌘W toggles

final class Panel: NSPanel {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { true }
}

final class Web: WKWebView {
    override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }
}

final class App: NSObject, NSApplicationDelegate, WKScriptMessageHandler {
    var panel: Panel!
    var web: Web!
    var item: NSStatusItem!
    var hotKey: EventHotKeyRef?
    var pageReady = false
    var placedOnce = false

    func applicationDidFinishLaunching(_ note: Notification) {
        try? FileManager.default.createDirectory(atPath: supportDir, withIntermediateDirectories: true)
        buildPanel()
        buildMenuBarItem()
        registerHotKey()
        startWatchdog()
        if CommandLine.arguments.contains("--show") { show() }
    }

    // MARK: Übersicht watchdog
    // Keeps the widgets on screen: starts Übersicht if it isn't running (its own login item can be switched off
    // in System Settings), and unhides it if ⌘H / "Hide Others" hid it. ⌃⌥⌘W (the hidden flag) still hides them on purpose.
    let uebersichtID = "tracesOf.Uebersicht"
    var lastLaunch = Date.distantPast

    func startWatchdog() {
        checkUebersicht()
        Timer.scheduledTimer(withTimeInterval: 3, repeats: true) { [weak self] _ in self?.checkUebersicht() }
        NSWorkspace.shared.notificationCenter.addObserver(forName: NSWorkspace.didHideApplicationNotification, object: nil, queue: .main) { [weak self] n in
            guard let self = self, let app = n.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication,
                  app.bundleIdentifier == self.uebersichtID else { return }
            app.unhide()
        }
    }

    func checkUebersicht() {
        if let app = NSRunningApplication.runningApplications(withBundleIdentifier: uebersichtID).first {
            if app.isHidden { app.unhide() }
            return
        }
        guard Date().timeIntervalSince(lastLaunch) > 30,
              let url = NSWorkspace.shared.urlForApplication(withBundleIdentifier: uebersichtID) else { return }
        lastLaunch = Date()
        let cfg = NSWorkspace.OpenConfiguration()
        cfg.activates = false
        NSWorkspace.shared.openApplication(at: url, configuration: cfg, completionHandler: nil)
    }

    // Double-clicking the app (Finder, Launchpad, Spotlight, Dock) while it runs opens the window.
    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        show()
        return true
    }

    // MARK: window

    func buildPanel() {
        let rect = NSRect(x: 0, y: 0, width: 1040, height: 740)
        panel = Panel(contentRect: rect, styleMask: [.borderless], backing: .buffered, defer: false)
        panel.isFloatingPanel = true
        panel.level = .floating
        panel.backgroundColor = .clear
        panel.isOpaque = false
        panel.hasShadow = true
        panel.hidesOnDeactivate = false
        panel.isReleasedWhenClosed = false
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]

        let ucc = WKUserContentController()
        ucc.add(self, name: "ctl")
        let conf = WKWebViewConfiguration()
        conf.userContentController = ucc
        web = Web(frame: rect, configuration: conf)
        web.setValue(false, forKey: "drawsBackground")
        web.autoresizingMask = [.width, .height]
        web.wantsLayer = true
        web.layer?.cornerRadius = 14
        web.layer?.masksToBounds = true
        panel.contentView = web

        if let url = Bundle.main.url(forResource: "ctl", withExtension: "html") {
            web.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        } else {
            web.loadHTMLString("<body style='background:#040914;color:#ff5f6d;font:13px Menlo;padding:30px'>ctl.html missing from the app bundle — re-run Install WIDGETCTL.command</body>", baseURL: nil)
        }
    }

    @objc func toggle() {
        if panel.isVisible { hide() } else { show() }
    }

    @objc func show() {
        if !placedOnce { panel.center(); placedOnce = true }
        if pageReady { boot() }
        if #available(macOS 14.0, *) { NSApp.activate() } else { NSApp.activate(ignoringOtherApps: true) }
        panel.makeKeyAndOrderFront(nil)
        panel.makeFirstResponder(web)
    }

    func hide() {
        panel.orderOut(nil)
    }

    // MARK: bridge to ctl.html

    func userContentController(_ c: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
        switch type {
        case "ready":
            pageReady = true
            boot()
        case "save":
            if let json = body["config"] as? String { save(json) }
        case "close":
            hide()
        case "move":
            let dx = (body["dx"] as? NSNumber)?.doubleValue ?? 0
            let dy = (body["dy"] as? NSNumber)?.doubleValue ?? 0
            var o = panel.frame.origin
            o.x += CGFloat(dx)
            o.y -= CGFloat(dy)
            panel.setFrameOrigin(o)
        case "toggleHidden":
            toggleHidden()
        case "refresh":
            refreshUebersicht()
        default:
            break
        }
    }

    func boot() {
        // Übersicht draws on the primary display; the grid is laid out on it.
        let screen = NSScreen.screens.first ?? NSScreen.main
        let frame = screen?.frame ?? NSRect(x: 0, y: 0, width: 1470, height: 956)
        // Übersicht's canvas starts under the menu bar, so the grid uses the height below it (Dock ignored).
        let menuBar = screen.map { $0.frame.maxY - $0.visibleFrame.maxY } ?? 37
        var payload: [String: Any] = [
            "screen": ["w": Double(frame.width), "h": Double(frame.height - menuBar)],
            "hidden": FileManager.default.fileExists(atPath: hiddenFlag),
        ]
        if let saved = try? String(contentsOfFile: configPath, encoding: .utf8) { payload["config"] = saved }
        else { payload["config"] = NSNull() }
        guard let data = try? JSONSerialization.data(withJSONObject: payload),
              let text = String(data: data, encoding: .utf8) else { return }
        web.evaluateJavaScript("WCTL.boot(\(text))", completionHandler: nil)
    }

    func save(_ json: String) {
        do {
            try json.write(toFile: configPath, atomically: true, encoding: .utf8)
            refreshUebersicht()
        } catch {
            let msg = error.localizedDescription.replacingOccurrences(of: "\"", with: "'")
            web.evaluateJavaScript("WCTL.error(\"SAVE FAILED: \(msg)\")", completionHandler: nil)
        }
    }

    @objc func toggleHidden() {
        let fm = FileManager.default
        if fm.fileExists(atPath: hiddenFlag) { try? fm.removeItem(atPath: hiddenFlag) }
        else { fm.createFile(atPath: hiddenFlag, contents: nil) }
        refreshUebersicht()
        let hidden = fm.fileExists(atPath: hiddenFlag)
        if pageReady { web.evaluateJavaScript("WCTL.setHidden(\(hidden))", completionHandler: nil) }
    }

    @objc func refreshUebersicht() {
        let p = Process()
        p.executableURL = URL(fileURLWithPath: "/usr/bin/osascript")
        p.arguments = ["-e", "tell application id \"tracesOf.Uebersicht\" to refresh"]
        try? p.run()
    }

    // MARK: menu bar + hotkey

    func buildMenuBarItem() {
        item = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        if let b = item.button {
            if let img = NSImage(systemSymbolName: "square.grid.2x2", accessibilityDescription: "WIDGET//CTL") {
                img.isTemplate = true
                b.image = img
            } else {
                b.title = "◫"
            }
            b.toolTip = "WIDGET//CTL — ⌃⌥⌘S"
        }
        let menu = NSMenu()
        let open = NSMenuItem(title: "Open WIDGET//CTL", action: #selector(show), keyEquivalent: "s")
        open.keyEquivalentModifierMask = [.control, .option, .command]
        let hide = NSMenuItem(title: "Show / Hide All Widgets", action: #selector(toggleHidden), keyEquivalent: "w")
        hide.keyEquivalentModifierMask = [.control, .option, .command]
        let sync = NSMenuItem(title: "Sync Widgets Now", action: #selector(refreshUebersicht), keyEquivalent: "")
        let quit = NSMenuItem(title: "Quit WIDGET//CTL", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        for m in [open, hide, sync] { m.target = self }
        menu.addItem(open)
        menu.addItem(hide)
        menu.addItem(sync)
        menu.addItem(.separator())
        menu.addItem(quit)
        item.menu = menu
    }

    func registerHotKey() {
        var spec = EventTypeSpec(eventClass: OSType(kEventClassKeyboard), eventKind: UInt32(kEventHotKeyPressed))
        InstallEventHandler(GetApplicationEventTarget(), { _, _, _ in
            DispatchQueue.main.async { (NSApp.delegate as? App)?.toggle() }
            return noErr
        }, 1, &spec, nil, nil)
        let st = RegisterEventHotKey(UInt32(kVK_ANSI_S), UInt32(cmdKey | optionKey | controlKey),
                                     EventHotKeyID(signature: OSType(0x5743_544C), id: 1),   // 'WCTL'
                                     GetApplicationEventTarget(), 0, &hotKey)
        if st != noErr { NSLog("WIDGET//CTL: ⌃⌥⌘S register failed (\(st)) — another app owns it") }
    }
}

let app = NSApplication.shared
let delegate = App()
app.delegate = delegate
app.setActivationPolicy(.accessory)
app.run()
