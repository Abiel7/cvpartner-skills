# CV Partner skills

This repository is an agent plugin for updating a consultant's own CV in CV Partner (now called Flowcase), in English and the CV's local language. The skill is in `skills/cvpartner/`; the root holds the plugin manifests and marketplace files for each agent, listed in the README.

- CV content is personal data. Commits to this repository contain only the skill and its setup, with no real names of people, customers or companies, and no CV exports, drafts or browser profiles.
- When you change the skill, keep `references/api.md` limited to behaviour verified against a live CV, and test with the read-only calls `cvp.summary()`, `cvp.audit()`, `cvp.lint()` and `upsertProject` dry runs first.
- Keep `version` the same in `plugin.json`, `.claude-plugin/plugin.json` and every marketplace entry, and run `claude plugin validate .` after changing a manifest.
