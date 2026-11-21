# TODO

- [ ] Add `Logger.isEnabled(level)` to check global and level settings before expensive work.
- [ ] Add `Logger.setConsoleEnabled(enabled)` to control console output independently of listeners.
- [ ] Add `Logger.scope(name)` to attach module context to messages and listener payloads.
- [ ] Add `Logger.debugLazy(factory)` to evaluate arguments only when debug logging is enabled.
- [ ] Add an optional bounded log history with retrieval and clearing.
