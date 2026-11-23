# WALLET//Ð — Obsidian edition (reference)

This is the version I run myself. It **does not keep its own data**. Once a minute it reads one line from a page in my Obsidian vault:

```
08 — Progress/Rewards System.md   →   <!-- WALLET-DATA balance=… locked=… earned=… spent=… streak=… updated=… -->
```

A build script (`build.py`, not published) regenerates that comment from `ledger.csv` whenever points are earned or spent. That build script and the vault are personal, so this copy only works for you if you recreate that line yourself.

- The vault path is set in the `command` (`V=…`). Point it at your own vault and keep a `WALLET-DATA` comment in a page.
- Want something that just works? Use the [standalone edition](..) instead.
