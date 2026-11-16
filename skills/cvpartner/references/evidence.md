# Gathering evidence

A CV claim needs a source: the user's own account, their documents, the code, or their mail and chat. Collect facts per entry until each has customer, dates, the user's role, the customer's need, what was delivered and the value.

## The facts file

Keep every fact in `cv-work/facts.md`, one section per entry, each line with its source and status. It is the only thing drafts may draw facts from, and it saves the user from answering the same question twice in a later session.

```markdown
## Example Logistics AS – Route planning tool
- Dates: 2024-03 to 2025-01 | user | confirmed
- Role: lead developer in a team of four | user | confirmed
- Need: dispatchers planned 400 deliveries a day in spreadsheets | project README | evidence
- Delivered: planning tool with map-based route editing | repository | evidence
- Value: planning time from hours to minutes | user, from customer feedback | confirmed
- Open: did the user own the mobile app, or a colleague?
```

Statuses: **confirmed** (the user said or approved it), **evidence** (a source shows it; confirm with the user before it goes in the CV), **open** (a question to ask). Only confirmed facts reach the CV.

## 1. Ask which sources exist

Before digging, ask the user in one message. Their answers decide which of the sections below you use, and current work is usually the part the CV is missing:

1. What are you working on now, and what since the CV was last updated?
2. Where can I look? Code folders or repositories on this machine, project documents, a PDF or Word CV, a LinkedIn profile.
3. Can you use Microsoft 365 Copilot Chat at work? If so, I will give you prompts to paste into it.
4. Does your company keep time sheets or a project register you can open? They give exact dates per customer.

Use only the sources the user names or approves. Each source below is optional; a CV built from the user's own account alone is fine.

## 2. The user's own account

The cheapest source. Per project ask: customer, start and end month, role title, team size and who owned what, the problem it solved, the result (time saved, users, adoption), and whether it is ongoing. Ask for rough notes; you write them up.

When dates disagree, for example a project dated before the user joined the employer it was done for, ask rather than pick one.

## 3. Existing CV documents

A CV the user keeps elsewhere (a PDF, a Word file, LinkedIn) is a good source of facts and of the user's preferred wording. Read it, note where it and CV Partner disagree, and ask which is right.

## 4. Code repositories

When the user points to a repository, read it without changing anything:

- `git log --all --format='%ad' --date=short | sort | sed -n '1p;$p'` gives the first and last activity.
- `git shortlog -sne --all` shows who wrote what. Group the user's several email identities together and ignore bot and AI co-author lines.
- `git log --format='%an' -- <folder> | sort | uniq -c` shows ownership of one part, for example ingestion.
- READMEs, `docs/`, architecture and decision records explain what was built and why. Front-end files often name the real user groups.

Report what the code supports, what it contradicts and what it cannot show:

- A snapshot uploaded in a few commits proves what exists, not who wrote it.
- Commit counts show activity, not ownership of a design. Ask who decided what.
- A part the user did not commit to, such as a data pipeline built by another team, is "contributed to" at most, even when the user shaped it in meetings.
- The project's own words for its users (personas, roles, permissions in the code) are often the best names for "who had the need".

Never print secrets you come across; mention that a file may hold credentials and let the user act.

## 5. Mail, Teams and meetings

Mail, chat and meeting notes hold dates, roles, presentations and feedback the user has forgotten. Pick the first route the user has; companies differ in what they allow, so never ask the user to install or request a tool for this.

- **Work IQ already available.** If your tools include Microsoft's Work IQ (an MCP server or the `workiq` command), ask the user before using it, then send it the prompts below one at a time. It needs a Microsoft 365 Copilot licence and an administrator's consent in the user's company, so most users will not have it.
- **Microsoft 365 Copilot Chat.** The common route. Give the user the prompts below to paste into Microsoft 365 Copilot Chat with the **Work** toggle on, and ask them to paste the answers back.
- **Neither.** Ask the user to search their own Outlook and Teams for each customer's name, check their calendar around the dates in question, and look in sent mail and old bids. A sentence or two per project from them is enough.

All three routes see only the current employer's data, so work for earlier employers comes from the user's memory and documents.

**Find all projects** (replace the start date):

```
I am updating my consultant CV and need an accurate, factual picture of the work I have done since <start date>. Search my Outlook emails, calendar meetings, Teams chats, channel messages and meeting recaps.

List every customer project, internal project, bid, proof of concept and assignment I have been involved in. For each give: customer, project name, period (first and last time it appears), my role based on how I am addressed and what I am asked to do, key people by role only, roughly how much of my time it took, and two or three source references (email subject and date, chat name and date, or meeting title and date).

Only report what my data supports. Mark anything uncertain as UNCERTAIN and say why. Leave out prices, rates, contract values, passwords and personal details about others. Answer in English as a table sorted by start date, newest first.
```

**Details for one project:**

```
Focus only on <project> for <customer>. Search my Outlook, Teams chats, channel messages and meeting recaps about it.

Give me: the customer's problem and why the project started; what was delivered; what I personally designed, built, decided or led, separate from the team; the main technologies; results and impact such as go-live, users, time saved or positive feedback, quoting the exact sentence and its source; team size and my position in it; and start and end dates.

Use only information found in my data, with a source for each point. Mark anything uncertain as UNCERTAIN and invent no numbers. Answer in English.
```

**Things that are easy to forget:**

```
Search my Outlook, Teams and calendar since <start date> for things that strengthen a CV but are not normal project work: presentations, talks and demos I gave, workshops I ran, courses and certifications, internal initiatives, mentoring, bids and proposals I contributed to, and praise or positive feedback I received. List each with date, a short description and its source. Mark anything uncertain. Answer in English.
```

Copilot and Work IQ sometimes credit the user with a colleague's work. Record their answers in the facts file with status **evidence**, and confirm each item with the user before it goes in the CV.
