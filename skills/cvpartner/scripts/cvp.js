() => {
  // CV Partner (now called Flowcase) helper. Load it into the signed-in CV Partner tab, then call window.cvp.*
  // from later evaluations. It uses the same endpoints and session as the CV Partner web app. Calls are
  // synchronous so the same file works with Playwright MCP (browser_evaluate) and with macOS AppleScript.
  // Text fields hold one value per language: `int` is English, plus one local language (no, se, dk, fi, ...).
  const m = location.hash.match(/\/cv\/([0-9a-f]{24})\/([0-9a-f]{24})/);
  const state = { ids: m ? { userId: m[1], cvId: m[2] } : null, csrf: null, local: null };

  function xhr(method, url, body, headers) {
    const x = new XMLHttpRequest();
    x.open(method, url, false);
    x.setRequestHeader('Accept', 'application/json');
    if (body !== undefined) x.setRequestHeader('Content-Type', 'application/json');
    Object.entries(headers || {}).forEach(([k, v]) => x.setRequestHeader(k, v));
    x.send(body === undefined ? null : JSON.stringify(body));
    let data = x.responseText;
    try { data = JSON.parse(x.responseText); } catch (e) { /* keep text */ }
    return { status: x.status, data };
  }
  function csrf(refresh) {
    if (!state.csrf || refresh) state.csrf = xhr('GET', '/bootstrap').data.csrf_token;
    return state.csrf;
  }
  function base() {
    if (!state.ids) throw new Error('No CV selected. Open your CV in CV Partner or call cvp.use(userId, cvId).');
    return `/api/v3/cvs/${state.ids.userId}/${state.ids.cvId}`;
  }
  function req(method, path, body) {
    const url = path.startsWith('/') ? path : `${base()}${path ? '/' + path : ''}`;
    if (method === 'GET') return xhr('GET', url);
    let r = xhr(method, url, body, { 'X-CSRF-Token': csrf() });
    if (r.status === 401 || r.status === 422) r = xhr(method, url, body, { 'X-CSRF-Token': csrf(true) });
    return r;
  }
  const t = (v) => (v && (v.int || (state.local && v[state.local]) || Object.values(v).find((x) => typeof x === 'string' && x))) || '';
  const ym = (y, mo) => (y ? Number(y) * 12 + Number(mo || 1) : null);

  // The local language is the most used non-English key across the CV's text fields.
  function detectLocal(c) {
    const count = {};
    (function walk(o) {
      if (Array.isArray(o)) return o.forEach(walk);
      if (!o || typeof o !== 'object') return;
      if ('int' in o && Object.values(o).every((x) => typeof x === 'string')) {
        Object.entries(o).forEach(([k, v]) => { if (k !== 'int' && v.trim()) count[k] = (count[k] || 0) + 1; });
        return;
      }
      Object.values(o).forEach(walk);
    })(c);
    return Object.entries(count).sort((a, b) => b[1] - a[1]).map(([k]) => k)[0] || 'no';
  }

  const fc_cv = () => cvp.cv();
  const cvp = {
    get ids() { return state.ids; },
    get local() { return state.local; },
    use(userId, cvId) { state.ids = { userId, cvId }; return base(); },
    setLocal(code) { state.local = code; return code; },
    req,
    get: (p) => req('GET', p || ''),
    post: (p, b) => req('POST', p, b),
    put: (p, b) => req('PUT', p, b),
    del: (p) => req('DELETE', p),
    cv() {
      const r = req('GET', '');
      if (r.status !== 200) throw new Error('Read failed: ' + r.status);
      if (!state.local) state.local = detectLocal(r.data);
      return r.data;
    },

    // Compact overview for the agent: enough to plan edits without loading the full JSON.
    summary() {
      const c = cvp.cv();
      const L = state.local.toUpperCase();
      const both = (v) => `${v && v.int ? 'EN' : '--'}/${v && v[state.local] ? L : '--'}`;
      const out = [`Name: ${c.name} | Languages: English (int) + ${state.local} | Title: ${t(c.title)} (${both(c.title)})`];
      (c.key_qualifications || []).forEach((k) => out.push(`Profile ${both(k.long_description)}: ${(t(k.long_description)).slice(0, 160)}`));
      (c.work_experiences || []).forEach((w) => out.push(`Work ${w._id}: ${t(w.employer)} | ${t(w.description)} | ${w.month_from}/${w.year_from}-${w.year_to ? w.month_to + '/' + w.year_to : 'now'} | text ${both(w.long_description)}`));
      [...(c.project_experiences || [])].sort((a, b) => a.order - b.order).forEach((p) => {
        const r = (p.roles || [])[0];
        out.push(`Project ${p._id}: ${t(p.customer)} – ${t(p.description)} | ${p.month_from}/${p.year_from}-${p.year_to ? p.month_to + '/' + p.year_to : 'now'} | desc ${both(p.long_description)} | role ${r ? t(r.name) + ' ' + both(r.long_description) : 'NONE'} | skills ${(p.project_experience_skills || []).length}${p.disabled ? ' | HIDDEN' : ''}`);
      });
      out.push('CV roles: ' + (c.cv_roles || []).map((r) => `${r._id}=${t(r.name)}`).join('; '));
      out.push('Skills: ' + (c.technologies || []).map((s) => `${t(s.category) || '(uncategorised)'}${s.disabled ? ' (HIDDEN)' : ''} [${(s.technology_skills || []).map((k) => t(k.tags)).join(', ')}]`).join(' | '));
      out.push('Certifications: ' + (c.certifications || []).map((x) => `${t(x.name)} ${x.month || ''}/${x.year || ''}${x.is_expired ? ' (expired)' : ''}`).join('; '));
      out.push('Courses: ' + (c.courses || []).map((x) => `${t(x.name)} ${x.year || ''}`).join('; '));
      out.push('Presentations: ' + (c.presentations || []).map((x) => `${x.month}/${x.year} ${t(x.description)}`).join('; '));
      out.push('Education: ' + (c.educations || []).map((x) => `${t(x.degree)}, ${t(x.school)} ${x.year_from}-${x.year_to}`).join('; '));
      out.push('Languages: ' + (c.languages || []).map((x) => `${t(x.name)} (${t(x.level)})`).join('; '));
      return out.join('\n');
    },

    // Lists text that exists in only one of English (int) and the local language, duplicate CV roles and duplicate skills.
    audit() {
      const c = cvp.cv(); const issues = [];
      const isML = (v) => v && typeof v === 'object' && !Array.isArray(v) && ('int' in v || 'no' in v) && Object.values(v).every((x) => typeof x === 'string');
      (function walk(o, path) {
        if (Array.isArray(o)) return o.forEach((x, i) => walk(x, `${path}[${t(x && (x.customer || x.name || x.employer || x.tags || x.category || x.description)) || i}]`));
        if (!o || typeof o !== 'object') return;
        Object.entries(o).forEach(([k, v]) => {
          if (k.endsWith('_anonymized') || k === 'name_multilang') return;
          if (isML(v)) {
            const en = (v.int || '').trim(); const lo = (v[state.local] || '').trim();
            if ((en || lo) && !(en && lo)) issues.push(`${en ? 'Missing ' + state.local : 'Missing English'}: ${path}.${k} = "${(en || lo).slice(0, 60)}"`);
          } else walk(v, `${path}.${k}`);
        });
      })(c, 'cv');
      const roleNames = {}; (c.cv_roles || []).forEach((r) => { const n = t(r.name).toLowerCase(); roleNames[n] = (roleNames[n] || 0) + 1; });
      Object.entries(roleNames).filter(([, n]) => n > 1).forEach(([name]) => issues.push(`Duplicate CV role: ${name}`));
      const seen = {}; (c.technologies || []).forEach((s) => (s.technology_skills || []).forEach((k) => { const n = t(k.tags).toLowerCase(); if (seen[n]) issues.push(`Duplicate skill: ${t(k.tags)}`); seen[n] = 1; }));
      // Hidden entries show as "Will not be exported". Flag every hidden entry that has content.
      Object.entries(c).forEach(([section, list]) => {
        if (!Array.isArray(list)) return;
        list.forEach((e) => {
          if (!e || e.disabled !== true || e.uncategorized) return;
          issues.push(`Hidden, will not be exported: ${section} "${t(e.customer || e.name || e.category || e.description || e.employer || e.school) || e._id}"`);
        });
      });
      // A project should start inside some job period; one that does not usually has a wrong year.
      const jobs = (c.work_experiences || []).filter((w) => !w.disabled).map((w) => [ym(w.year_from, w.month_from), ym(w.year_to, w.month_to) || 1e9]);
      if (jobs.length) (c.project_experiences || []).forEach((p) => {
        const s = ym(p.year_from, p.month_from);
        if (s && !jobs.some(([a, b]) => s >= a && s <= b)) issues.push(`Project starts outside every job period: ${t(p.customer)} – ${t(p.description)} (${p.month_from}/${p.year_from})`);
      });
      (c.project_experiences || []).forEach((p) => {
        if (!(p.roles || []).length) issues.push(`Project without role: ${t(p.customer)} – ${t(p.description)}`);
        if (!t(p.long_description)) issues.push(`Project without description: ${t(p.customer)} – ${t(p.description)}`);
      });
      return issues.length ? issues.join('\n') : 'No issues found.';
    },

    // Downloads the full CV as a JSON file. Run before any write.
    backup() {
      const c = cvp.cv();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(c, null, 1)], { type: 'application/json' }));
      a.download = `cvpartner-cv-backup-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '')}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      return `Backup downloaded as ${a.download}`;
    },

    // Adds a role to a project and links it to an existing CV role by copying that role's exact name object.
    // Passing only {int, no} for an existing role creates a duplicate CV role.
    // longDescription: {int: '...', <local>: '...'}. newRoleNameLocal names a role the CV does not have yet.
    addRole(projectId, roleNameEn, longDescription, newRoleNameLocal) {
      const c = cvp.cv();
      const existing = (c.cv_roles || []).find((r) => (r.name.int || '').toLowerCase() === roleNameEn.toLowerCase());
      const name = existing ? existing.name : { int: roleNameEn, [state.local]: newRoleNameLocal || roleNameEn };
      return req('POST', `project_experiences/${projectId}/roles`, { role: { name, long_description: longDescription } }).status;
    },

    // Adds skills to a project, skipping ones already there. skills: [["English", "Local"], ...] or ["Same in both"].
    addSkills(projectId, skills) {
      const p = cvp.cv().project_experiences.find((x) => x._id === projectId);
      const have = new Set((p.project_experience_skills || []).map((s) => t(s.tags).toLowerCase()));
      return skills.map((s) => [].concat(s)).filter(([en]) => !have.has(en.toLowerCase())).map(([en, lo]) =>
        `${en}: ${req('POST', `project_experiences/${projectId}/project_experience_skills`, { project_experience_skill: { tags: { int: en, [state.local]: lo || en } } }).status}`).join(', ') || 'nothing to add';
    },

    // Checks wording against references/writing.md in English and the local language. With no argument it
    // checks every text in the CV; pass [{label, int, <local>}] to check drafts. Each issue is a line to fix or confirm.
    lint(items) {
      const L = () => state.local;
      if (!items) {
        const c = fc_cv(); items = [];
        const add = (label, v) => { if (v && (v.int || v[L()])) items.push({ label, ...v }); };
        (c.key_qualifications || []).forEach((k) => add('Profile', k.long_description));
        (c.work_experiences || []).forEach((w) => add(`Work ${t(w.employer)}`, w.long_description));
        (c.project_experiences || []).forEach((p) => {
          const n = `${t(p.customer)} – ${t(p.description)}`;
          add(`${n} (project)`, p.long_description); add(`${n} (customer)`, p.customer_description);
          (p.roles || []).forEach((r) => add(`${n} (role)`, r.long_description));
        });
        (c.presentations || []).forEach((x) => add(`Presentation ${t(x.description)}`, x.long_description));
      }
      const R = {
        cliche: /\b(passionate|results[- ]driven|results[- ]oriented|proven track record|leverag\w*|utili[sz]\w*|spearhead\w*|orchestrat\w*|champion(ed|ing)|synerg\w*|robust|seamless\w*|cutting[- ]edge|innovative|best practices?|pivotal|significant impact|fast[- ]paced|team player|go[- ]getter|lidenskapelig|brenner for|resultatorientert|synergi\w*|banebrytende|sømløs\w*|innovativ\w*|beste praksis|passionerad|resultatinriktad|banbrytande|sömlös\w*|passioneret|resultatorienteret|banebrydende)\b/gi,
        first: /\b(me|my|mine|jeg|meg|min|mitt|jag|mig)\b/gi, // plus a capital "I", checked separately: Norwegian "i" means "in"
        status: /\b(pilot|currently|on its way|in progress|phase \d+ (starts|will)|foreløpig|på vei mot|pågående|piloten|for närvarande|på väg mot)\b/gi,
        time: /(\d+\s?%\s?of (my|the) time|on and off|av og på|av och på|af og til)/gi,
        weak: /^(helped|assisted|worked on|responsible for|was involved|participated|supported|hjalp|bisto|jobbet med|var ansvarlig|deltok|hjälpte|arbetade med|var ansvarig|hjalp til)\b/i,
      };
      const out = [];
      items.forEach((it) => ['int', L()].forEach((lang) => {
        const text = it[lang]; if (!text) return;
        const at = `${it.label} [${lang}]`;
        const hit = (re, kind) => { (text.match(re) || []).forEach((m) => out.push(`${kind}: ${at}: "${m}"`)); };
        hit(R.cliche, 'Cliché'); hit(R.status, 'Status wording'); hit(R.time, 'Time accounting');
        (text.match(R.first) || []).forEach((m) => out.push(`First person: ${at}: "${m}"`));
        if (lang === 'int') (text.replace(/\bI\/O\b/g, '').match(/\bI\b/g) || []).forEach(() => out.push(`First person: ${at}: "I"`));
        (text.match(/\S ?[—–] ?\S/g) || []).forEach((m) => { if (!/\d ?[—–] ?\d/.test(m)) out.push(`Long dash in a sentence: ${at}: "${m}"`); });
        const bullets = text.split('\n').filter((l) => /^\s*[-•]\s/.test(l)).map((l) => l.replace(/^\s*[-•]\s+/, ''));
        bullets.filter((b) => R.weak.test(b)).forEach((b) => out.push(`Weak opener, check ownership: ${at}: "${b.slice(0, 50)}"`));
        const verbs = bullets.map((b) => (b.split(/\s+/)[0] || '').toLowerCase());
        [...new Set(verbs.filter((v, i) => v && verbs.indexOf(v) !== i))].forEach((v) => out.push(`Repeated opening verb: ${at}: "${v}"`));
      }));
      return out.length ? out.join('\n') : 'No wording issues found.';
    },

    // Creates or updates one project with its role and skills, matched on English customer + project name, so it is
    // safe to run twice. spec: {customer, name, from: 'YYYY-MM', to: 'YYYY-MM' | null, description, customerDescription,
    // industry, role: {name, nameLocal, text}, skills: [["English", "Local"] | "Same"]}. Text values are {int, <local>}
    // or a plain string used for both. With {dryRun: true} it returns the plan and writes nothing.
    upsertProject(spec, opts) {
      const dry = opts && opts.dryRun; const lo = state.local; const plan = [];
      const ml = (v) => (v == null ? undefined : typeof v === 'string' ? { int: v, [lo]: v } : v);
      const c = fc_cv();
      const key = (v) => (t(ml(v)) || '').trim().toLowerCase();
      let p = (c.project_experiences || []).find((x) => key(x.customer) === key(spec.customer) && key(x.description) === key(spec.name));
      const body = {};
      if (spec.customer) body.customer = ml(spec.customer);
      if (spec.name) body.description = ml(spec.name);
      if (spec.from) { const [y, m] = spec.from.split('-'); body.year_from = y; body.month_from = m; }
      if (spec.to !== undefined) { const [y, m] = spec.to ? spec.to.split('-') : ['', '']; body.year_to = y; body.month_to = m; }
      if (spec.description) body.long_description = ml(spec.description);
      if (spec.customerDescription) body.customer_description = ml(spec.customerDescription);
      if (spec.industry) body.industry = ml(spec.industry);
      if (p) {
        plan.push(`update project ${p._id}`);
        if (!dry) { const r = req('PUT', `project_experiences/${p._id}`, { project_experience: { version: p.version, ...body } }); if (r.status >= 300) throw new Error('Project update failed: ' + r.status); }
      } else {
        plan.push('create project');
        if (!dry) { const r = req('POST', 'project_experiences', { project_experience: body }); if (r.status >= 300) throw new Error('Project create failed: ' + r.status); p = r.data; }
      }
      if (spec.role) {
        const role = p && (p.roles || [])[0];
        if (role) {
          plan.push(`update role text on ${t(role.name)}`);
          if (!dry) req('PUT', `project_experiences/${p._id}/roles/${role._id}`, { role: { long_description: ml(spec.role.text) } });
        } else {
          plan.push(`add role ${spec.role.name}`);
          if (!dry) cvp.addRole(p._id, spec.role.name, ml(spec.role.text), spec.role.nameLocal);
        }
      }
      if (spec.skills && spec.skills.length) {
        plan.push(`add missing skills from ${spec.skills.length}`);
        if (!dry) plan.push(cvp.addSkills(p._id, spec.skills));
      }
      if (!dry) plan.push(`sort: ${cvp.sortProjects()}`);
      return plan.join('\n');
    },

    // Orders projects: ongoing first, then by end date, newest first; ties by start date.
    sortProjects() {
      const ps = [...cvp.cv().project_experiences].sort((a, b) => ((ym(b.year_to, b.month_to) || 1e9) - (ym(a.year_to, a.month_to) || 1e9)) || ((ym(b.year_from, b.month_from) || 0) - (ym(a.year_from, a.month_from) || 0)));
      return req('PUT', 'project_experiences', { reordered: ps.map((p, i) => ({ _id: p._id, order: i + 1 })) }).status;
    },
  };
  window.cvp = cvp;
  if (!state.ids) return 'cvp loaded. Open your own CV in CV Partner, then load cvp again (or call cvp.use(userId, cvId)).';
  cvp.cv();
  return `cvp ready for CV ${state.ids.userId}/${state.ids.cvId}, languages: English (int) + ${state.local}`;
}
