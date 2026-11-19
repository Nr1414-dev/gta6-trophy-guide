// Boot for the Leonida Trophy Guide: loads the trophy list and the roadmap,
// wires the tabs, filters, spoiler setting and progress export/import, and
// keeps the progress bar, checklist, detail pane and roadmap in sync.
//
// Screenshot helper (used only by the maker's own screenshots): query
// parameters ?view=roadmap|missables|about, ?open=<trophy id>, ?spoiler=off
// and ?demo=<n> (marks the first n trophies earned for the preview) let a
// screenshot show a chosen state. They change nothing for a normal visit.
import { loadEarned, saveEarned, loadSpoilersHidden, saveSpoilersHidden, exportProgress, importProgressFile } from './store.js';
import { renderChecklist, renderDetail } from './render.js';
import { renderRoadmap, renderMissables, renderAbout } from './roadmap.js';

const $ = (id) => document.getElementById(id);

const trophiesDoc = await (await fetch('data/trophies.json')).json();
const roadmapDoc = await (await fetch('data/roadmap.json')).json();
const trophies = trophiesDoc.trophies;
const roadmap = roadmapDoc;

let earned = loadEarned();
let spoilersHidden = loadSpoilersHidden();
let selectedId = null;
const filters = { query: '', kind: 'all', grade: 'all', status: 'all', spoilersHidden };

const params = new URLSearchParams(location.search);
if (params.get('spoiler') === 'off') spoilersHidden = false;
if (params.get('spoiler') === 'on') spoilersHidden = true;
if (params.get('demo')) {
  const n = Math.min(trophies.length, Math.max(0, Number(params.get('demo')) || 0));
  // Seed from the second dozen on, so the story trophies stay unearned and
  // the spoiler setting still has something to hide in the preview.
  earned = new Set(trophies.slice(13, 13 + n).map((t) => t.id));
  saveEarned(earned);
}
if (params.get('open')) {
  const id = Number(params.get('open'));
  if (trophies.some((t) => t.id === id)) selectedId = id;
}

function showView(name) {
  for (const view of ['checklist', 'roadmap', 'missables', 'about']) {
    $('view-' + view).classList.toggle('active', view === name);
    $('tab-' + view).classList.toggle('active', view === name);
  }
  $('toolbar').style.display = name === 'checklist' ? '' : 'none';
  $('onlineNote').style.display = name === 'checklist' ? '' : 'none';
  if (name === 'roadmap') renderRoadmap($('roadmapStages'), $('roadmapEst'), $('roadmapTitle'), $('nextUp'), roadmap, trophies, earned, selectTrophy);
  if (name === 'missables') renderMissables($('missableList'), trophies, earned, selectTrophy);
  window.__shotReady = true;
}

function refreshProgress() {
  $('earnedCount').textContent = String(earned.size);
  $('earnedPct').textContent = Math.round((earned.size / trophies.length) * 100) + '% to the platinum';
  $('progressFill').style.width = (earned.size / trophies.length) * 100 + '%';
  $('progressBar').setAttribute('aria-valuenow', String(earned.size));
  $('footCount').textContent = earned.size + ' of ' + trophies.length + ' earned · ' +
    trophies.filter((t) => t.missable).length + ' missable · ' +
    trophies.filter((t) => t.hidden).length + ' hidden on PSN.';
  $('missableCount').textContent = String(trophies.filter((t) => t.missable).length);
}

function refreshAll() {
  filters.spoilersHidden = spoilersHidden;
  refreshProgress();
  renderChecklist($('trophyList'), $('countLine'), $('emptyList'), trophies, filters, earned, selectedId, selectTrophy, toggleEarned);
  renderDetail($('detail'), trophies.find((t) => t.id === selectedId) ?? null, earned, spoilersHidden, toggleEarned);
}

function selectTrophy(id) {
  selectedId = id;
  showView('checklist');
  refreshAll();
  const row = document.querySelector(`.trophyRow[data-id="${id}"]`);
  if (row) row.scrollIntoView({ block: 'nearest' });
}

function toggleEarned(id, on) {
  if (on) earned.add(id);
  else earned.delete(id);
  saveEarned(earned);
  refreshAll();
  if ($('view-roadmap').classList.contains('active')) {
    renderRoadmap($('roadmapStages'), $('roadmapEst'), $('roadmapTitle'), $('nextUp'), roadmap, trophies, earned, selectTrophy);
  }
}

for (const view of ['checklist', 'roadmap', 'missables', 'about']) {
  $('tab-' + view).addEventListener('click', () => showView(view));
}

$('search').addEventListener('input', (e) => { filters.query = e.target.value; refreshAll(); });
$('kindFilter').addEventListener('change', (e) => { filters.kind = e.target.value; refreshAll(); });
$('gradeFilter').addEventListener('change', (e) => { filters.grade = e.target.value; refreshAll(); });
$('statusFilter').addEventListener('change', (e) => { filters.status = e.target.value; refreshAll(); });
$('spoilerToggle').checked = spoilersHidden;
$('spoilerToggle').addEventListener('change', (e) => {
  spoilersHidden = e.target.checked;
  saveSpoilersHidden(spoilersHidden);
  refreshAll();
});

$('exportBtn').addEventListener('click', () => exportProgress(earned));
$('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    earned = await importProgressFile(file, trophies.map((t) => t.id));
    saveEarned(earned);
    refreshAll();
  } catch (err) {
    alert('Could not import that file: ' + err.message);
  }
  e.target.value = '';
});
let resetArmed = false;
let resetTimer = null;
$('resetBtn').addEventListener('click', () => {
  // Two-click reset instead of a dialog: the first click arms it, the
  // second clears every earned tick in this browser.
  if (!resetArmed) {
    resetArmed = true;
    $('resetBtn').textContent = 'Click again to clear all progress';
    resetTimer = setTimeout(() => {
      resetArmed = false;
      $('resetBtn').textContent = 'Reset';
    }, 4000);
    return;
  }
  clearTimeout(resetTimer);
  resetArmed = false;
  $('resetBtn').textContent = 'Reset';
  earned = new Set();
  saveEarned(earned);
  refreshAll();
});

renderAbout($('checklistIntro'), $('checklistGroups'), $('checklistSources'), $('sourceList'), roadmap.checklist_100, trophiesDoc.facts);
refreshAll();
showView(params.get('view') ?? 'checklist');
window.__shotReady = true;
