// Checklist rendering: the trophy list, its filters, the spoiler rule and the
// detail pane that shows one trophy's official text, guide and sources.
import { saveEarned } from './store.js';

export const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  completion: 'Completion',
  online: 'Online',
};

export function gradeBadge(grade) {
  const span = document.createElement('span');
  span.className = 'badge ' + grade;
  span.textContent = grade;
  return span;
}

export function kindBadge(kind) {
  const span = document.createElement('span');
  span.className = 'badge kind';
  span.textContent = KIND_LABELS[kind] ?? kind;
  return span;
}

function isSpoiled(trophy, spoilersHidden, earned) {
  // The spoiler setting hides story trophies until they are earned.
  return spoilersHidden && trophy.kind === 'story' && !earned.has(trophy.id);
}

export function filterTrophies(trophies, filters, earned) {
  const q = filters.query.trim().toLowerCase();
  return trophies.filter((t) => {
    if (filters.kind === 'online') return false; // GTA 6 has no online trophies.
    if (filters.kind === 'missable') {
      if (!t.missable) return false;
    } else if (filters.kind !== 'all' && t.kind !== filters.kind) {
      return false;
    }
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.status === 'earned' && !earned.has(t.id)) return false;
    if (filters.status === 'remaining' && earned.has(t.id)) return false;
    if (q) {
      const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function renderChecklist(listEl, countEl, emptyEl, trophies, filters, earned, selectedId, onSelect, onToggle) {
  const shown = filterTrophies(trophies, filters, earned);
  countEl.textContent = `Showing ${shown.length} of ${trophies.length} trophies` +
    (filters.kind === 'online' ? ' — no online trophies in GTA 6; all 55 are offline single-player.' : '');
  emptyEl.hidden = shown.length !== 0;
  listEl.replaceChildren();
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = 'trophyRow' + (earned.has(t.id) ? ' earned' : '') + (t.id === selectedId ? ' selected' : '');
    li.dataset.id = String(t.id);

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => onToggle(t.id, box.checked));

    const body = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'tName';
    const desc = document.createElement('div');
    desc.className = 'tDesc';
    if (isSpoiled(t, filters.spoilersHidden, earned)) {
      name.textContent = 'Hidden story trophy — earn it to reveal';
      name.classList.add('spoiled');
      desc.textContent = 'Spoiler hidden. Tick it earned (or turn the spoiler setting off) to see its name and description.';
    } else {
      name.textContent = t.name;
      desc.textContent = t.description;
    }
    const meta = document.createElement('div');
    meta.className = 'tMeta';
    meta.append(gradeBadge(t.grade), kindBadge(t.kind));
    if (t.missable) {
      const b = document.createElement('span');
      b.className = 'badge miss';
      b.textContent = 'Missable';
      meta.append(b);
    }
    if (t.hidden) {
      const b = document.createElement('span');
      b.className = 'badge hiddenFlag';
      b.textContent = 'Hidden on PSN';
      meta.append(b);
    }
    if (t.unconfirmed) {
      const b = document.createElement('span');
      b.className = 'badge unconf';
      b.textContent = 'Unconfirmed';
      meta.append(b);
    }
    if (earned.has(t.id)) {
      const b = document.createElement('span');
      b.className = 'badge earnedFlag';
      b.textContent = 'Earned';
      meta.append(b);
    }
    body.append(name, desc, meta);
    li.append(box, body);
    li.addEventListener('click', () => onSelect(t.id));
    listEl.append(li);
  }
}

function sourceList(sources) {
  const ul = document.createElement('ul');
  ul.className = 'sources';
  for (const s of sources ?? []) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.name;
    li.append(a);
    ul.append(li);
  }
  return ul;
}

export function renderDetail(detailEl, trophy, earned, spoilersHidden, onToggle) {
  detailEl.replaceChildren();
  if (!trophy) {
    const p = document.createElement('p');
    p.textContent = 'Pick a trophy from the list to see its guide and sources.';
    detailEl.append(p);
    return;
  }
  const spoiled = isSpoiled(trophy, spoilersHidden, earned);
  const meta = document.createElement('div');
  meta.className = 'tMeta';
  meta.append(gradeBadge(trophy.grade), kindBadge(trophy.kind));
  if (trophy.missable) {
    const b = document.createElement('span');
    b.className = 'badge miss';
    b.textContent = 'Missable — read before Chapter 1 ends';
    meta.append(b);
  }
  if (trophy.unconfirmed) {
    const b = document.createElement('span');
    b.className = 'badge unconf';
    b.textContent = 'Unconfirmed';
    meta.append(b);
  }
  detailEl.append(meta);

  const title = document.createElement('h2');
  title.textContent = spoiled ? 'Hidden story trophy' : trophy.name;
  detailEl.append(title);

  if (spoiled) {
    const box = document.createElement('div');
    box.className = 'spoilerBox';
    box.textContent = 'This is a story trophy and the spoiler setting is on, so its name, description and guide stay hidden until you earn it. Tick it earned below, or turn “Hide story spoilers” off in the toolbar, to reveal it.';
    detailEl.append(box);
  } else {
    const official = document.createElement('p');
    official.className = 'official';
    official.textContent = 'Official: “' + trophy.description + '”';
    detailEl.append(official);
    if (trophy.count != null) {
      const count = document.createElement('p');
      count.textContent = 'PSN tracks a count for this one: ' + trophy.count.toLocaleString('en-US') +
        (trophy.count_note ? ' — ' + trophy.count_note : '') + '.';
      detailEl.append(count);
    }
    const guide = document.createElement('p');
    guide.className = 'guideText';
    guide.textContent = trophy.guide;
    detailEl.append(guide);
    const srcTitle = document.createElement('p');
    srcTitle.className = 'srcTitle';
    srcTitle.textContent = 'Sources — where each fact above comes from';
    detailEl.append(srcTitle);
    detailEl.append(sourceList(trophy.sources));
  }

  const row = document.createElement('div');
  row.className = 'earnRow';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.id = 'detailEarned';
  box.checked = earned.has(trophy.id);
  box.addEventListener('change', () => onToggle(trophy.id, box.checked));
  const label = document.createElement('label');
  label.htmlFor = 'detailEarned';
  label.textContent = earned.has(trophy.id) ? 'Earned — ticked in your tracker' : 'Mark as earned';
  row.append(box, label);
  detailEl.append(row);
}
