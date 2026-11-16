# CV Partner skills (unofficial)

> [!IMPORTANT]
> **This is an unofficial, independent community project.** It is not made, endorsed, supported or reviewed by CV Partner, Flowcase or their owners. It is not a CV Partner or Flowcase product, and they are not responsible for it.
>
> For problems with this plugin, [open an issue here](https://github.com/Abiel7/cvpartner-skills/issues) rather than contacting CV Partner or Flowcase. For help with CV Partner or Flowcase itself, use their own support.

An unofficial agent plugin for updating your CV in **CV Partner** (now called **Flowcase**) with an AI agent. You describe your work in plain words; the agent finds the gaps in your CV, helps you collect facts, writes the text in English and your CV's local language at the level a manager reads, shows it to you for approval, saves it in CV Partner and checks the result.

It installs into **Claude Code**, **GitHub Copilot** (CLI and VS Code), **Codex** and any agent that supports [Agent Skills](https://agentskills.io), on **Windows**, **macOS** and **Linux**.

It works through your own signed-in browser session, using the same requests the CV Partner web app makes. These are not a published API, so CV Partner can change them at any time and this plugin may stop working. Check that using it fits your company's policies before you start.

## What you need

- **Microsoft Edge.** It comes with Windows.
- **Node.js 20 or newer**, which runs the browser connection.
  - Windows: `winget install OpenJS.NodeJS.LTS`
  - macOS: `brew install node`, or the installer from [nodejs.org](https://nodejs.org)
- **Your company's CV Partner address**, usually `https://<company>.cvpartner.com`.

## Install

Pick your agent. Each plugin install brings the skill and a browser connection (a [Playwright MCP](https://github.com/microsoft/playwright-mcp) server that opens Edge).

**Claude Code**

```
claude plugin marketplace add Abiel7/cvpartner-skills
claude plugin install cvpartner@cvpartner
```

**GitHub Copilot CLI**

```
copilot plugin marketplace add Abiel7/cvpartner-skills
copilot plugin install cvpartner@cvpartner
```

**GitHub Copilot in VS Code**

Open the Command Palette (`Ctrl+Shift+P`, or `Cmd+Shift+P` on a Mac), run **Chat: Install Plugin from Source**, and enter `https://github.com/Abiel7/cvpartner-skills`. Agent plugins need the `chat.plugins.enabled` setting turned on.

**Codex**

```
codex plugin marketplace add Abiel7/cvpartner-skills
codex plugin add cvpartner@cvpartner
```

**Any other agent (Cursor, Gemini CLI, OpenCode, …)**

```
npx skills add Abiel7/cvpartner-skills
```

This installs the skill only. Add the browser connection once, as described in [`connect.md`](skills/cvpartner/references/connect.md#when-the-browser-tools-are-missing).

Restart your agent after installing.

## Use it

Ask your agent, for example:

- "Review my CV Partner CV and tell me what is missing or inconsistent."
- "Add my project for <customer>. Here are my notes: …"
- "Make sure everything is in both English and Norwegian."
- "Rewrite my project descriptions so a manager sees the value."
- "Look at the repository in <path> and tell me what I did there for my CV."
- "Tailor my CV for this tender: …"

The first time, an Edge window opens on CV Partner. Sign in there as usual, including single sign-on and MFA. The plugin keeps that session, so you sign in once. Then open your own CV when the agent asks.

The agent always shows you the text before it saves anything, and it downloads a backup of your CV before the first change.

### How the agent works

- **Your CV only.** The agent reads and changes only the CV that belongs to you. If your browser shows a colleague's CV, for example while you look for inspiration, it stops and asks you to open your own.
- **Facts first.** Everything it writes comes from what you confirmed or what it found in your documents, code or mail. It keeps those facts, each with its source, in `cv-work/facts.md` on your machine, so a later session does not ask you again.
- **Written for the reader.** Each project says what the customer needed, what was delivered and what difference it made, in English and your local language, without clichés or implementation detail.
- **Honest by design.** Every line must pass an interview test: could you explain it without backtracking? Lines that stretch the truth are flagged for you to keep, soften or drop.
- **Checked twice.** A built-in check flags clichés, first person, status updates and weak verbs in both languages, and an audit finds missing translations, hidden sections, duplicate roles and dates that do not fit your employment history.

### Finding what you did

The agent starts by asking where it can look: what you are working on now, the code folders or repositories for it, any other CV you keep (PDF, Word, LinkedIn), and time sheets with dates per customer. Pointing it at your current projects is the quickest way to get them into your CV.

For mail, Teams and meetings it uses whatever your company allows:

- **Microsoft 365 Copilot Chat:** the agent gives you prompts to paste into Copilot Chat (Work mode) and you paste the answers back. Most companies with Copilot can do this.
- **Work IQ:** if your agent already has Microsoft's Work IQ tools, which need your company's admin consent, the agent can ask through them directly, with your permission.
- **Neither:** the agent tells you what to search for in your own Outlook, Teams and calendar.

Every item found this way is a lead. You confirm it before it goes in your CV.

### On a Mac with your normal Edge profile

Mac users can let the agent work in their everyday Edge window instead of the plugin's browser. See _Option B_ in [`connect.md`](skills/cvpartner/references/connect.md).

## Privacy

- Your CV text, drafts and browser session stay on your machine.
- The agent acts as you, through your own CV Partner session. It can only change what you can change yourself in the CV Partner web app.
- The requests are the CV Partner web app's own, not a published API, so they can change without notice. If something stops working, see Troubleshooting, and consider opening an issue.

## Status

| Agent              | Tested                                                                        |
| ------------------ | ----------------------------------------------------------------------------- |
| Claude Code        | Plugin installs; the skill and the browser server load                        |
| GitHub Copilot CLI | Plugin installs from the marketplace with its skill                           |
| Codex              | Plugin installs from the marketplace with its skill and browser server config |
| `npx skills add`   | Installs the skill for Codex, Copilot and Claude Code                         |
| VS Code            | Follows the VS Code documentation; not yet tried                              |

The CV Partner requests and the `cvp.js` helper are tested against a live CV. Reports and fixes from other setups are welcome.

## How it is built

One plugin folder serves every agent:

| Path                                      | For                                                                                                                                                        |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skills/cvpartner/`                       | The skill: `SKILL.md`, references and the `cvp.js` page helper                                                                                             |
| `plugin.json`, `mcp.json`                 | Portable [Agent Plugins](https://code.visualstudio.com/docs/agents/reference/agent-plugin-reference) manifest and browser server (Copilot, VS Code, Codex) |
| `.claude-plugin/plugin.json`, `.mcp.json` | Claude Code manifest and browser server                                                                                                                    |
| `.claude-plugin/marketplace.json`         | Marketplace for Claude Code and VS Code                                                                                                                    |
| `.github/plugin/marketplace.json`         | Marketplace for GitHub Copilot CLI                                                                                                                         |
| `.agents/plugins/marketplace.json`        | Marketplace for Codex                                                                                                                                      |

Inside the skill:

| File                      | Contents                                                             |
| ------------------------- | -------------------------------------------------------------------- |
| `SKILL.md`                | The steps the agent follows                                          |
| `references/connect.md`   | How the agent reaches CV Partner in the browser                      |
| `references/api.md`       | CV Partner requests and their gotchas                                |
| `references/writing.md`   | Writing style, with language-specific rules                          |
| `references/evidence.md`  | Finding facts, the facts file, and the Microsoft 365 Copilot prompts |
| `references/tailoring.md` | Tailoring the CV for a bid or a role                                 |
| `scripts/cvp.js`          | Helper the agent loads into the CV Partner page                      |

## Contributing

Pull requests are welcome, especially:

- writing rules for more languages in `references/writing.md` (Swedish, Danish, Finnish, …)
- fixes when CV Partner changes, verified against a real CV
- test reports from VS Code, Windows and other agents

Test changes with the read-only calls `cvp.summary()`, `cvp.audit()`, `cvp.lint()` and `cvp.upsertProject(…, {dryRun: true})` before trying writes, and keep real names of people, customers and companies out of examples. When you change a manifest, bump `version` in `plugin.json`, `.claude-plugin/plugin.json` and the marketplace entries together, and run `claude plugin validate .`.

## Troubleshooting

- **No browser tools in the agent.** The browser server has not started. Restart the agent, and check that `node --version` works in a new terminal. In Claude Code, `/mcp` shows the server's state.
- **Edge opens but CV Partner asks you to sign in again.** Close every Edge window the agent opened and try again; the saved profile can only be used by one window at a time.
- **A save returns 401 or 422.** The session or its security token expired. Reload the CV Partner page, sign in, and ask the agent to load the helper again.
- **Something saved twice.** Ask the agent to run the audit; it finds duplicate roles and skills and can remove them.

## Trademarks and affiliation

CV Partner and Flowcase are names and trademarks of their respective owners. They are used here only to say which product this plugin works with. This project has no affiliation, partnership or endorsement from them, and the names do not mean any such link.

## License

[MIT](LICENSE). The software is provided as is, without warranty. You are responsible for checking every change before the agent saves it to your CV.
