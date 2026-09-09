# One page skill, many templates

Sixteen skills that each made one kind of HTML page became one skill, `create-page`, holding sixteen templates.

## What forced it

The agent's skill catalog has a fixed character budget. Past it, `renderSkillCatalog` does not drop the longest descriptions, it cuts **every** description to one fair-share length. So the catalog is a commons: a new document kind did not cost its own line, it shortened `pdf`, `ffmpeg`, and `agent-browser` too.

Measured on this repo before the change, with no third-party skills installed at all:

| Skills in catalog | Cost against budget | Description cap |
| ----------------- | ------------------- | --------------- |
| 32 (16 ideas)     | 151%                | 170 characters  |
| 40 (24 ideas)     | 182%                | 115 characters  |
| 48 (32 ideas)     | 212%                | 80 characters   |

Thirty-one of thirty-two descriptions were being truncated mid-word. The curve had no top, because it was set by how many document kinds we wanted rather than by anything we could tune.

After: **16 skills, 89% of budget, every description shown in full**, and the number of templates no longer affects it at all.

## Why the seam is the medium, not the topic

The `idea.json` tags — decide, learn, do, persuade — look like a grouping and are the wrong one. They cut across the method rather than along it. Measured pairwise across the sixteen SKILL.md files, the process sections overlapped 66% by word, the fixed-and-free contract 49%, and the refusals 43%, while the sections that carry the actual document kind overlapped 21-24%. Three quarters of every `starter.html` was an identical shell.

That gap is the seam. Splitting by tag would have copied the shared method four times and left the same drift in four places instead of sixteen.

Grouping is by **medium and method**: one skill per thing you produce and the way you produce it. The test for whether a new artifact joins `create-page` or starts a sibling skill is whether it copies the same `starter.html` and carries `skin/theme.css` verbatim. A deck or a spreadsheet model needs its own refusals, its own fixed-and-free contract, and a different file to hand over, so it would be a sibling.

## What drift looked like

The evidence that a rule with no home decays, found while splitting:

- Nine different wordings of the one sentence naming what stays fixed, across sixteen files that were meant to state the same rule.
- Six of the sixteen had lost part of the shared refusal tail.
- The 200 KB inline-image ceiling existed only inside a CI failure message. Fifteen of the sixteen stated the size refusal while saying nothing about how to meet it, and the one recipe that existed sat in a single template's patterns file where the other fifteen could not see it.

`references/images.md` now holds the ceiling, the recipe, and the fallback for when there is no photo. A template may go stricter and says why.

## Constraints the runtime imposes

Two things about how skills are loaded shaped the layout, and both survive any future change to how skills are delivered:

- **Discovery is one directory deep.** The runtime reads `skills/<name>/SKILL.md` and no further, so grouping had to happen inside one skill directory. Nested skill folders would be invisible.
- **The file listing stops at fifty entries**, walked depth-first. With about 160 files here, the last templates never appear in the listing an agent is handed. So nothing may depend on that listing: the router names every template's exact path, and each `template.md` names its own example files.

A full load also copies about 3 MB into the task. That was accepted rather than designed around, because FP1287 removes skill copying in favor of running them in place. The fifty-file limit is the part that does not expire.

## What was removed

`visual-answer` was deleted rather than kept beside this. It was the skill that taught us the shape, and sixteen templates plus a shared method is what it taught; its description also claimed ground the templates now cover and was the second largest in the catalog. Its vocabulary survives as `create-page/references`, adapted where it described machinery only its own shell had — an orientation strip, copy buttons on every `pre`, a width attribute, automatic syntax highlighting — none of which exists here.

## Names

Three levels, deliberately not the same word:

- **`create-page`** is the skill. A verb, because it makes something, and it leaves `create-deck` and `create-sheet` free as siblings.
- **Template** is one document kind, to the agent and in the registry. Not "shape", and not "starter": `starter.html` is the thing that gets **copied**, `template.md` is the thing that gets **read**, and an agent that confuses the two fills in the wrong file.
- **Idea** is the same folder on the website, and stays. It was chosen so non-technical visitors are not confused, and it is baked into URLs, components, and analytics. `idea.json` keeps its name because every field in it is Discover presentation. `scripts/ideas.ts` is the seam and the only place both names appear.
