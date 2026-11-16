# Connecting to CV Partner

You work through the user's signed-in CV Partner session in a browser tab. Every CV Partner call runs as JavaScript inside that tab, so no API key is needed and the user's own permissions apply.

## Option A: the `playwright` browser tools (Windows, macOS, Linux)

Installed as a plugin, this skill brings a `playwright` MCP server that opens Microsoft Edge with a saved profile, so the user signs in once. Its tools are named `browser_*`.

1. Ask the user for their company's CV Partner address, the one they sign in to (usually `https://<company>.cvpartner.com`), and call `browser_navigate` with it.
2. If the page shows a sign-in screen, ask the user to sign in in the Edge window that opened, including MFA, and tell you when done.
3. Ask the user to open **their own CV** (their name → CV). The address then contains `/cv/<userId>/<cvId>/`. Read the URL with `browser_snapshot` to confirm.
4. Load the helper: read [`../scripts/cvp.js`](../scripts/cvp.js) and pass its whole content as the `function` argument of `browser_evaluate`. It answers `cvp ready for CV …` with the CV's languages. If the local language it found is wrong, call `cvp.setLocal('<code>')`.
5. Run later calls with `browser_evaluate`, for example `() => cvp.summary()` or `() => cvp.audit()`.

The helper lives on the page. After the tab reloads or navigates, load `cvp.js` again.

### When the browser tools are missing

The skill was installed without its plugin (for example with `npx skills add`), or the server has not started. Tell the user to add the server once, with the command for their agent, then restart the agent:

- Claude Code: `claude mcp add --scope user playwright -- npx -y @playwright/mcp@latest --browser msedge --user-data-dir <home>/.cvpartner/browser-profile`
- Codex: `codex mcp add playwright -- npx -y @playwright/mcp@latest --browser msedge --user-data-dir <home>/.cvpartner/browser-profile`
- GitHub Copilot CLI: `/mcp add`, name `playwright`, command `npx`, arguments as above.
- VS Code: Command Palette → **MCP: Add Server** → command (stdio), with the same command and arguments.

Replace `<home>` with the user's home folder, for example `C:/Users/<name>` on Windows or `/Users/<name>` on macOS. Node.js 20 or newer must be installed for `npx`.

## Option B: the user's normal Edge on macOS (AppleScript)

Use this when the user prefers their everyday Edge profile and you can run shell commands.

1. The user turns on **View → Developer → Allow JavaScript from Apple Events** in Edge. The setting is per profile.
2. The user opens their CV in CV Partner and keeps that tab as the **active tab** of its window. Edge freezes background tabs (sleeping tabs), and a script sent to a frozen tab hangs and may run later.
3. Run JavaScript with `osascript`, targeting the active tab whose URL contains `cvpartner.com`:

```applescript
on run argv
  set js to read POSIX file (item 1 of argv) as «class utf8»
  tell application "Microsoft Edge"
    repeat with w in windows
      set t to active tab of w
      if URL of t contains "cvpartner.com" then
        with timeout of 600 seconds
          return execute t javascript js
        end timeout
      end if
    end repeat
  end tell
  return "NO_ACTIVE_CV_PARTNER_TAB"
end run
```

4. Load the helper by wrapping `cvp.js` as `(<content of cvp.js>)()`, then call `cvp.summary()` in the same or a later script.

AppleScript returns only strings, so return `JSON.stringify(...)` or text from your scripts.

## When a call times out

A timeout does not mean nothing happened. Re-read the CV with `cvp.summary()` before you retry, and remove any duplicate the earlier attempt created.
