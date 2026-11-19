// Roadmap, missables and about views, built from data/roadmap.json and the
// trophy list. The roadmap order is the order the trophies are earned in:
// story first, then the 100% checklist, then cleanup.
import { gradeBadge, kindBadge } from './render.js';

function sourceLinks(sources) {
  const p = document.createElement('p');
  p.className = 'srcLine';
  p.textContent = 'Sources: ';
  (sources ?? []).forEach((s, i) => {
    if (i > 0) p.append(document.createTextNode(' · '));
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.name;
    p.append(a);
  });
  return p;
}

export function renderRoadmap(stagesEl, estEl, titleEl, nextEl, roadmap, trophies, earned, onSelect) {
  const byId = new Map(trophies.map((t) => [t.id, t]));
  titleEl.textContent = roadmap.title;
  estEl.textContent = roadmap.estimate;
  stagesEl.replaceChildren();
  for (const stage of roadmap.stages) {
    const box = document.createElement('article');
    box.className = 'stage';
    const h = document.createElement('h3');
    h.textContent = `Stage ${stage.n} — ${stage.name}`;
    const hours = document.createElement('p');
    hours.className = 'hours';
    hours.textContent = stage.hours;
    const goal = document.createElement('p');
    goal.className = 'goal';
    goal.textContent = stage.goal;
    const ul = document.createElement('ul');
    for (const step of stage.do) {
      const li = document.createElement('li');
      li.textContent = step;
      ul.append(li);
    }
    const chips = document.createElement('div');
    chips.className = 'trophyChips';
    for (const id of stage.trophies) {
      const t = byId.get(id);
      if (!t) continue;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip' + (earned.has(id) ? ' done' : '');
      chip.textContent = (earned.has(id) ? '✓ ' : '') + t.name + ' · ' + t.grade;
      chip.addEventListener('click', () => onSelect(id));
      chips.append(chip);
    }
    box.append(h, hours, goal, ul, chips, sourceLinks(stage.sources));
    stagesEl.append(box);
  }
  const remaining = trophies.filter((t) => !earned.has(t.id));
  const next = remaining.find((t) => t.missable) ??
    remaining.find((t) => t.kind === 'story') ??
    remaining[0];
  nextEl.replaceChildren();
  const h = document.createElement('h3');
  h.textContent = 'Next up';
  const p = document.createElement('p');
  if (next) {
    p.textContent = earned.size === 0
      ? 'Start with the one thing that can be missed: ' + next.name + ' — meditate with Lucia on the balcony in Chapter 1, before the chapter ends.'
      : 'Your next trophy to chase: ' + next.name + ' (' + next.grade + ') — ' + next.description;
  } else {
    p.textContent = 'Every trophy is earned. Vice Got a Price! is yours — you are a Leonida Legend.';
  }
  nextEl.append(h, p);
}

export function renderMissables(listEl, trophies, earned, onSelect) {
  listEl.replaceChildren();
  const missable = trophies.filter((t) => t.missable);
  for (const t of missable) {
    const row = document.createElement('div');
    row.className = 'trophyRow' + (earned.has(t.id) ? ' earned' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
    box.addEventListener('click', (event) => event.stopPropagation());
    const body = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'tName';
    name.textContent = '⚠ ' + t.name;
    const desc = document.createElement('div');
    desc.className = 'tDesc';
    desc.textContent = t.description;
    const guide = document.createElement('p');
    guide.textContent = t.guide;
    const meta = document.createElement('div');
    meta.className = 'tMeta';
    meta.append(gradeBadge(t.grade), kindBadge(t.kind));
    body.append(name, desc, guide, meta);
    row.append(box, body);
    row.addEventListener('click', () => onSelect(t.id));
    listEl.append(row);
  }
  const note = document.createElement('p');
  note.className = 'srcLine';
  note.textContent = 'That is the whole list: every other trophy can be earned after the story in free roam. ' +
    'The count of missable trophies is reported by PowerPyx and GTABase, which both flag only this one.';
  listEl.append(note);
}

export function renderAbout(introEl, groupsEl, sourcesEl, listEl, checklist, facts) {
  introEl.textContent = 'The 100% checklist has ' + checklist.total + ' requirements in three groups. ' +
    'It only appears after the story, under Progress > Stats > 100% Completion, but everything you do during the story already counts. ' +
    'Nothing on it is missable.';
  groupsEl.replaceChildren();
  for (const g of checklist.groups) {
    const box = document.createElement('div');
    box.className = 'group';
    const h = document.createElement('h4');
    h.textContent = g.name + ' — ' + g.count + ' requirements';
    const p = document.createElement('p');
    p.textContent = g.items;
    box.append(h, p);
    groupsEl.append(box);
  }
  sourcesEl.replaceChildren();
  sourcesEl.append(sourceLinks(checklist.sources));
  listEl.replaceChildren();
  for (const s of facts.sources) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.name;
    li.append(a);
    listEl.append(li);
  }
}
