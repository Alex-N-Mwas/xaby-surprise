const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const story = [
  { date: 'THE BEGINNING', title: 'When our story began', caption: 'The first page of our story. Some beginnings stay tender.' },
  { date: 'OUR TIME TOGETHER', title: 'A chapter worth keeping', caption: 'The moments we shared will always mean something to me.' },
  { date: 'THE LITTLE THINGS', title: 'The ordinary, made lovely', caption: 'Sometimes the little things were the lovely part.' },
  { date: 'AS THIS CHAPTER TURNS', title: 'Wishing you well', caption: 'I hope the road ahead brings you gentleness, laughter, and good things.' }
];
const reasons = [
  ['Because you were Xaby, and that was already something special.', 'You never had to be anyone else to matter.i still love you'],
  ['Because I was lucky to love you.', 'That will always be true of the chapter we shared.'],
  ['Because the time we shared mattered to me.', 'I hold it with care and gratitude.'],
  ['Because you were the best.', 'Those are your words, Erlex. I believe them.'],
  ['Because your place in my story is real.', 'Some people leave a lovely mark just by being themselves.'],
  ['Because some goodbyes deserve a thank-you.', 'Thank you for letting our paths meet.']
];
const littleWishes = [
  ['☀', 'Gentle mornings', 'May the days ahead feel kind.'],
  ['✿', 'Reasons to smile', 'May joy find you in little, unexpected ways.'],
  ['✧', 'A bright next chapter', 'May it hold all the good things you deserve.'],
  ['♡', 'A little peace', 'Wishing you calm, warmth, and room to grow.']
];
const quizItems = [
  { question: 'What do I hope life brings you next?', answers: ['Peace and good things', 'Every reason to smile', 'A beautiful new chapter'] },
  { question: 'How many wrong answers are there in this quiz?', answers: ['None at all', 'Not a single one', 'All of these'] },
  { question: 'What do I hope you remember?', answers: ['You mattered to me', 'You were the best', 'You were loved'] }
];
const places = [
  ['A beginning', 'Every story starts somewhere.'],
  ['The memories', 'The moments we shared are yours to keep.'],
  ['The good days', 'I am grateful for the good we had.'],
  ['Your next chapter', 'May the path ahead be kind to you.']
];
let quizIndex = 0;
let musicContext;
let musicMaster;
let musicTimer;
let musicBeat = 0;
let musicIsOn = false;
let musicPlaylist = [];
let playlistIndex = 0;
let toastTimer;
const customAudio = new Audio();
customAudio.loop = false;
customAudio.volume = 0.42;

function toast(message) {
  const node = $('#toast'); node.textContent = message; node.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 2600);
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function prettyFileName(name) {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function renderStory(photoFiles = []) {
  const entries = photoFiles.length ? photoFiles.map((file, index) => ({ date: `A MEMORY · ${String(index + 1).padStart(2, '0')}`, title: file.caption || prettyFileName(file.name), caption: 'A little piece of our story, held with care.', image: `/photos/${encodeURIComponent(file.name)}` })) : story;
  $('#timeline').innerHTML = entries.map(item => `<article class="timeline-item"><div class="timeline-card"><span class="timeline-date">${escapeHtml(item.date)}</span><h3>${escapeHtml(item.title)}</h3>${item.image ? `<figure class="moment-photo"><img src="${item.image}" alt="${escapeHtml(item.title)}" loading="lazy"></figure>` : ''}<p>${escapeHtml(item.caption)}</p></div></article>`).join('');
}
function renderReasons() {
  $('#reasonGrid').innerHTML = reasons.map(([front, back], index) => `<button class="reason-card" aria-label="Turn over reason ${index + 1}" aria-pressed="false"><span class="reason-inner"><span class="reason-face"><span class="reason-num">A REASON TO REMEMBER · ${String(index + 1).padStart(2, '0')}</span><span class="reason-prompt">${escapeHtml(front)}</span><span class="reason-hint">tap to turn this little card ↻</span></span><span class="reason-face reason-back"><span class="reason-num">A LITTLE NOTE</span><span class="reason-prompt">${escapeHtml(back)}</span><span class="reason-hint">tap to turn back ↻</span></span></span></button>`).join('');
  $$('.reason-card').forEach(card => card.addEventListener('click', () => {
    card.classList.toggle('flipped'); card.setAttribute('aria-pressed', String(card.classList.contains('flipped')));
  }));
}
function renderWishes() {
  $('#couponGrid').innerHTML = littleWishes.map(([icon, title, detail]) => `<article class="coupon"><span class="coupon-icon">${icon}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(detail)}</p></article>`).join('');
}
function renderPlaces() {
  $('#placeList').innerHTML = places.map(([name, caption]) => `<div><span class="place-name">${escapeHtml(name)}</span><p class="place-caption-text">${escapeHtml(caption)}</p></div>`).join('');
  $$('.map-marker').forEach((marker, index) => { marker.querySelector('small').textContent = places[index][0]; });
}
function renderQuiz() {
  const item = quizItems[quizIndex];
  $('#quizNumber').textContent = `A LITTLE QUIZ · ${String(quizIndex + 1).padStart(2, '0')} / ${String(quizItems.length).padStart(2, '0')}`;
  $('#quizQuestion').textContent = item.question;
  $('#quizFeedback').textContent = '';
  $('#quizNext').hidden = true;
  $('#quizAnswers').innerHTML = item.answers.map((answer, index) => `<button class="quiz-answer" data-answer="${index}">${escapeHtml(answer)}</button>`).join('');
  $$('.quiz-answer').forEach(answer => answer.addEventListener('click', () => {
    $$('.quiz-answer').forEach(choice => { choice.disabled = true; choice.classList.add('correct'); });
    $('#quizFeedback').textContent = 'Every answer is right. I just hope the good things find you. ♡';
    $('#quizNext').hidden = false;
  }));
}
function renderAll() {
  $('#letterText').textContent = 'Xaby, I wanted to leave you with a few kind words. Being able to love you was a part of my life I will always be grateful for. You were the best, and I hope the days ahead bring you peace, laughter, and all the lovely things you deserve. You do not owe me; I just wanted you to know that the good we shared mattered to me.\n\nWith love, Erlex';
  $('#secretNote').textContent = 'I hope life is gentle with you, Xaby. Thank you for being part of my story. No reply needed—just a little wish for your happiness. ♡ wish you were here, but I hope the days ahead are kind to you. I will always remember you with care.in my heart';
  $('#finalMessage').textContent = 'You will always be part of a chapter I remember with care. my heart is full of light for you darlling.';
  renderStory(); renderReasons(); renderWishes(); renderPlaces(); renderQuiz();
}

// Music from the music/ folder takes priority. The built-in instrumental is a fallback.
const musicChords = [
  [261.63, 329.63, 392.00, 493.88],
  [220.00, 261.63, 329.63, 392.00],
  [174.61, 220.00, 261.63, 329.63],
  [196.00, 246.94, 293.66, 392.00]
];
function setMusicButton(isOn) {
  const button = $('#musicToggle');
  button.setAttribute('aria-pressed', String(isOn));
  button.setAttribute('aria-label', isOn ? 'Turn background music off' : 'Turn background music on');
  button.innerHTML = `♫ <span>${isOn ? 'Sound on' : 'Sound off'}</span>`;
}
function playMusicNote(frequency, at, duration, volume, wave = 'sine') {
  const oscillator = musicContext.createOscillator(); const envelope = musicContext.createGain();
  oscillator.type = wave; oscillator.frequency.setValueAtTime(frequency, at);
  envelope.gain.setValueAtTime(0.0001, at); envelope.gain.exponentialRampToValueAtTime(volume, at + 0.08); envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  oscillator.connect(envelope); envelope.connect(musicMaster); oscillator.start(at); oscillator.stop(at + duration + 0.04);
}
function scheduleMusicBeat() {
  const now = musicContext.currentTime; const at = Math.max(now + 0.04, scheduleMusicBeat.nextAt || now + 0.06);
  const chord = musicChords[Math.floor(musicBeat / 4) % musicChords.length]; const note = musicBeat % 4;
  playMusicNote(chord[note], at, 0.72, 0.075, 'triangle'); playMusicNote(chord[note] * 2, at, 0.48, 0.018);
  if (note === 0) chord.slice(0, 3).forEach((frequency, index) => playMusicNote(frequency / 2, at, 2.45, index === 0 ? 0.012 : 0.008));
  musicBeat += 1; scheduleMusicBeat.nextAt = at + 0.68;
}
async function loadFolderMusic() {
  try {
    const response = await fetch('/api/music-list'); if (!response.ok) return;
    const tracks = await response.json();
    musicPlaylist = tracks.map(track => ({ name: track.name, url: `/music/${encodeURIComponent(track.name)}` }));
    $('#musicStatus').textContent = musicPlaylist.length ? `${musicPlaylist.length} track${musicPlaylist.length === 1 ? '' : 's'} in music/` : 'built-in music';
  } catch { $('#musicStatus').textContent = 'built-in music'; }
}
function playFolderTrack() {
  if (!musicPlaylist.length) return Promise.resolve(false);
  const track = musicPlaylist[playlistIndex % musicPlaylist.length];
  customAudio.src = track.url; customAudio.load();
  return customAudio.play().then(() => true);
}
customAudio.addEventListener('ended', async () => {
  if (!musicIsOn || !musicPlaylist.length) return;
  playlistIndex = (playlistIndex + 1) % musicPlaylist.length;
  try { await playFolderTrack(); } catch { stopMusic(); }
});
async function startMusic() {
  if (musicPlaylist.length) {
    try {
      if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
      if (musicContext?.state === 'running') { musicMaster.gain.setTargetAtTime(0.0001, musicContext.currentTime, 0.15); await musicContext.suspend(); }
      await playFolderTrack(); musicIsOn = true; setMusicButton(true); return;
    } catch { toast('The music file could not be played in this browser.'); }
  }
  try {
    const AudioApi = window.AudioContext || window.webkitAudioContext;
    if (!AudioApi) { toast('This browser does not support background music.'); return; }
    if (!musicContext) { musicContext = new AudioApi(); musicMaster = musicContext.createGain(); musicMaster.gain.value = 0.0001; musicMaster.connect(musicContext.destination); }
    await musicContext.resume(); musicMaster.gain.cancelScheduledValues(musicContext.currentTime); musicMaster.gain.setTargetAtTime(0.36, musicContext.currentTime, 0.8);
    if (!musicTimer) { musicBeat = 0; scheduleMusicBeat.nextAt = musicContext.currentTime + 0.08; scheduleMusicBeat(); musicTimer = setInterval(scheduleMusicBeat, 680); }
    musicIsOn = true; setMusicButton(true);
  } catch { toast('Music could not start in this browser.'); }
}
async function stopMusic() {
  clearInterval(musicTimer); musicTimer = null; customAudio.pause();
  if (musicContext && musicMaster) {
    musicMaster.gain.cancelScheduledValues(musicContext.currentTime); musicMaster.gain.setTargetAtTime(0.0001, musicContext.currentTime, 0.15);
    setTimeout(() => { if (!musicTimer && musicContext?.state === 'running') musicContext.suspend(); }, 700);
  }
  musicIsOn = false; setMusicButton(false);
}

function setupPhotoCarousel(files) {
  const viewport = $('#photoViewport');
  const slides = $$('.photo-tile', viewport);
  const dots = $('#photoDots');
  const previous = $('#photoPrev');
  const next = $('#photoNext');
  slides.forEach(slide => slide.classList.add('photo-slide'));
  dots.innerHTML = files.map((_, index) => `<button class="photo-dot${index === 0 ? ' active' : ''}" type="button" aria-label="Show photo ${index + 1}" aria-current="${index === 0 ? 'true' : 'false'}"></button>`).join('');
  const dotButtons = $$('.photo-dot', dots);
  const goTo = index => viewport.scrollTo({ left: index * viewport.clientWidth, behavior: 'smooth' });
  previous.hidden = next.hidden = files.length < 2;
  previous.addEventListener('click', () => goTo(Math.max(0, Math.round(viewport.scrollLeft / viewport.clientWidth) - 1)));
  next.addEventListener('click', () => goTo(Math.min(files.length - 1, Math.round(viewport.scrollLeft / viewport.clientWidth) + 1)));
  dotButtons.forEach((dot, index) => dot.addEventListener('click', () => goTo(index)));
  let scrollTimer;
  viewport.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const index = Math.max(0, Math.min(files.length - 1, Math.round(viewport.scrollLeft / viewport.clientWidth)));
      $('#photoCounter').textContent = `${String(index + 1).padStart(2, '0')} / ${String(files.length).padStart(2, '0')}`;
      dotButtons.forEach((dot, i) => { dot.classList.toggle('active', i === index); dot.setAttribute('aria-current', String(i === index)); });
    }, 70);
  }, { passive: true });
}

async function loadFolderPhotos() {
  const grid = $('#photoGrid');
  try {
    const response = await fetch('/api/photos'); if (!response.ok) throw new Error('Photo folder unavailable');
    const files = await response.json();
    renderStory(files);
    if (!files.length) { grid.innerHTML = '<div class="photo-empty"><span>♡</span><strong>Your little memories will appear here.</strong><small>Drop photo files into the project’s photos/ folder.</small></div>'; return; }
    grid.innerHTML = files.map(file => `<figure class="photo-tile"><img src="/photos/${encodeURIComponent(file.name)}" alt="${escapeHtml(file.caption)}" loading="lazy"><figcaption class="photo-caption">${escapeHtml(file.caption)}</figcaption></figure>`).join('');
    setupPhotoCarousel(files);
  } catch { grid.innerHTML = '<div class="photo-empty"><span>♡</span><strong>Photos from the folder will appear here.</strong></div>'; }
}

async function loadFolderCutouts() {
  const layer = $('#cutoutLayer');
  if (!layer) return;
  try {
    const response = await fetch('/api/cutouts'); if (!response.ok) return;
    const files = await response.json();
    layer.innerHTML = files.map((file, index) => `<img class="cutout ${index % 2 ? 'cutout-right' : 'cutout-left'}" style="--cutout-top:${files.length === 1 ? 5 : 4 + (index / (files.length - 1)) * 92}%" src="/cutouts/${encodeURIComponent(file.name)}" alt="" aria-hidden="true" loading="lazy">`).join('');
    const cutouts = $$('.cutout', layer);
    if (!cutouts.length) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('is-active', entry.isIntersecting)), { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    cutouts.forEach(image => observer.observe(image));
  } catch { /* Empty cutouts folder is fine. */ }
}

$('#openSurprise').addEventListener('click', () => {
  startMusic(); $('#intro').classList.add('leaving');
  setTimeout(() => { $('#intro').classList.add('hidden'); $('#site').classList.remove('hidden'); window.scrollTo(0, 0); }, 760);
});
$('#replay').addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); $('#intro').classList.remove('hidden'); requestAnimationFrame(() => $('#intro').classList.remove('leaving')); });
$('#musicToggle').addEventListener('click', () => musicIsOn ? stopMusic() : startMusic());
$('#pickDate').addEventListener('click', () => { $('#dateOptions').hidden = false; $('#dateOptions').classList.add('date-options-show'); $('#pickDate').textContent = 'A few good things, just for you ♡'; });
$('#secretHeart').addEventListener('click', () => { const note = $('#secretNote'); note.hidden = !note.hidden; $('#secretHeart').setAttribute('aria-expanded', String(!note.hidden)); });
$('#finalReveal').addEventListener('click', () => { $('#finalMessage').hidden = !$('#finalMessage').hidden; $('#finalReveal').innerHTML = $('#finalMessage').hidden ? 'One more thing <span>♡</span>' : 'Keep this one close <span>♥</span>'; });
$('#quizNext').addEventListener('click', () => { quizIndex = (quizIndex + 1) % quizItems.length; renderQuiz(); });
$('#moreReason').addEventListener('click', () => { const cards = $$('.reason-card'); const next = cards.find(card => !card.classList.contains('flipped')) || cards[0]; if (next) { next.scrollIntoView({ behavior: 'smooth', block: 'center' }); next.classList.add('flipped'); next.setAttribute('aria-pressed', 'true'); } });
window.addEventListener('scroll', () => $('#backTop').classList.toggle('visible', window.scrollY > 500), { passive: true });
$('#backTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

renderAll(); loadFolderMusic(); loadFolderPhotos(); loadFolderCutouts();
