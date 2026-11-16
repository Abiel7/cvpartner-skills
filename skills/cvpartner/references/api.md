# CV Partner API reference

These are the endpoints the CV Partner (Flowcase) web app itself uses, learned from it and tested against a live CV. CV Partner does not publish them as a contract, so read before you write and check every status code.

Use the `cvp` helper from [`../scripts/cvp.js`](../scripts/cvp.js). It adds the session's CSRF token and the CV base path for you. Paths below are relative to the CV base `/api/v3/cvs/<userId>/<cvId>`.

## Rules that apply to every write

- **Two languages.** Text fields are objects keyed by language: `int` is English, and the local language has its own key such as `no`, `se`, `dk` or `fi`, for example `{"int": "Developer", "no": "Utvikler"}`. Always send English and the CV's local language (`cvp.local`). Leave other language keys as they are.
- **Wrapper key.** Each section wraps its body in a singular key: `{"project_experience": {...}}`.
- **Version.** On PUT, include the entry's current `version` from a fresh read.
- **Partial update.** PUT changes only the fields you send.
- **Dates** are strings: `"month_from": "02", "year_from": "2026"`. Leave `year_to` empty for ongoing work.
- **Batches.** Keep one evaluation to about twenty calls. Calls run one after another in the page, and a long batch can outlast the agent's timeout while it keeps running in the tab.
- **Hidden entries.** Every entry has a `disabled` flag; `true` hides it from exports, and CV Partner shows it as "Will not be exported". The flag stays when you rename or reuse an entry, so when you repurpose one, check it and send `disabled: false` if the content should show. `cvp.audit()` lists hidden entries with content.

## Sections

| Section path | Wrapper key | Notes |
|---|---|---|
| `key_qualifications` | `key_qualification` | Profile summary in `long_description` |
| `work_experiences` | `work_experience` | `employer`, `description` (job title), `long_description` |
| `project_experiences` | `project_experience` | See projects below |
| `certifications` | `certification` | `name`, `organiser`, `month`, `year`, `month_expire`, `year_expire` |
| `presentations` | `presentation` | `description` (title), `long_description`, `month`, `year` |
| `educations` | `education` | `school`, `degree`, `year_from`, `year_to` |
| `languages` | `language` | `name`, `level` |
| `technologies` | `technology` | Skill categories; see skills below |
| `cv_roles` | `cv_role` | The CV's list of role names |

- Create: `cvp.post('<section>', {<wrapper>: {...}})` returns the new entry with `_id`.
- Update: `cvp.put('<section>/<id>', {<wrapper>: {version, ...fields}})`.
- Delete: `cvp.del('<section>/<id>')` returns 204.
- CV title: `cvp.put('', {cv: {title: {int, <local>}}})`.

## Projects

Fields: `customer`, `description` (project name), `long_description` (project text), `customer_description`, `industry`, dates, `percent_allocated`.

Write projects with `cvp.upsertProject`. It finds the project by English customer and project name, updates it or creates it, adds the role and any missing skills, and re-sorts the list, so running it twice changes nothing more. Run it first with `{dryRun: true}` to see the plan:

```js
cvp.upsertProject({
  customer: 'Example Logistics AS',
  name: { int: 'Route planning tool', no: 'Verktøy for ruteplanlegging' },
  from: '2024-03', to: '2025-01',
  description: { int: '…', no: '…' },
  customerDescription: { int: '…', no: '…' },
  industry: { int: 'Transport and logistics', no: 'Transport og logistikk' },
  role: { name: 'Lead Developer', nameLocal: 'Hovedutvikler', text: { int: '…', no: '…' } },
  skills: [['Route optimisation', 'Ruteoptimalisering'], 'Azure Functions'],
}, { dryRun: true })
```

`role.name` matches an existing CV role by its English name; `nameLocal` is used only when the CV does not have that role yet. On a project that already has a role, `upsertProject` updates that role's text and leaves its name; change the name with the calls below.

The lower-level calls, for edits `upsertProject` does not cover:

Roles and skills are separate sub-resources. CV Partner ignores `roles` and `project_experience_skills` sent inside the project body, so create the project first and then add them:

- Role: `cvp.addRole(projectId, "Lead Architect and Developer", {int, <local>})`. Update the text with `cvp.put('project_experiences/<pid>/roles/<roleId>', {role: {long_description: {int, <local>}}})`.
- Skills: `cvp.addSkills(projectId, [["Project management", "Prosjektledelse"], "SharePoint"])`. Rename one with `cvp.put('project_experiences/<pid>/project_experience_skills/<skillId>', {project_experience_skill: {tags: {int, <local>}}})`.
- Order: `cvp.sortProjects()` puts ongoing projects first, then the rest newest first.

### Role linking

A project role links to an entry in `cv_roles` only when its `name` object matches that entry's name exactly, in every language key. A partial match creates a second CV role with the same English name. Setting `cv_role_id` has no effect.

`cvp.addRole` copies the existing role's full name object for you. To fix a duplicate, PUT the project role's `name` with the original role's full name object; the duplicate disappears once nothing uses it.

To rename a role everywhere, for example its local-language name, use `cvp.put('cv_roles/<id>', {cv_role: {version, name: {...}}})`. Every project using it follows.

## Skills section

Each `technologies` entry is a category with a `category` name and a list of `technology_skills`:

- Add: `cvp.post('technologies/<catId>/technology_skills', {technology_skill: {tags: {int, <local>}}})`
- Remove: `cvp.del('technologies/<catId>/technology_skills/<skillId>')`
- Rename a category: `cvp.put('technologies/<catId>', {technology: {category: {int, <local>}}})`
- Order categories: `cvp.put('technologies', {reordered: [{_id, order}, ...]})`. New categories start at order 0, so set the order after creating one.

Years of experience on a skill are computed from the projects that list it, so you can move or rebuild skills freely. The entry flagged `uncategorized` is CV Partner's default bucket; leave it in place even when empty.
