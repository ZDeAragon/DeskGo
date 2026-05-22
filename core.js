// ====== SETTINGS & STATE ======
let userSettings = { name: 'Usuario', password: '', theme: 'dark', wallpaper: 'wallpaper.png', avatar: '' };
let zIndexCounter = 100;
const wc = document.getElementById('windows-container');

async function loadSettings() {
    try {
        const r = await fetch('/api/settings');
        const s = await r.json();
        if (s.name) userSettings = { ...userSettings, ...s };
    } catch(e) {}
    applySettings();
}

function applySettings() {
    document.body.classList.toggle('light', userSettings.theme === 'light');
    document.body.style.backgroundImage = `url('${userSettings.wallpaper}')`;
    const ln = document.getElementById('lock-name');
    if (ln) ln.textContent = userSettings.name;
    const la = document.getElementById('lock-avatar');
    if (la) la.innerHTML = userSettings.avatar ? `<img src="${userSettings.avatar}">` : '<i class="fa-solid fa-user"></i>';
    const lp = document.getElementById('lock-pass-container');
    if (lp) lp.style.display = userSettings.password ? 'flex' : 'none';
}

async function saveSettings() {
    try { await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userSettings) }); } catch(e) {}
}

// ====== CLOCK ======
function updateClock() {
    const n = new Date();
    const t = n.getHours().toString().padStart(2,'0') + ':' + n.getMinutes().toString().padStart(2,'0');
    const el = document.getElementById('clock');
    if (el) el.textContent = t;
    const lt = document.getElementById('lock-time');
    if (lt) lt.textContent = t;
    const ld = document.getElementById('lock-date');
    if (ld) {
        const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
        const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        ld.textContent = `${days[n.getDay()]}, ${n.getDate()} de ${months[n.getMonth()]}`;
    }
}
setInterval(updateClock, 1000);
updateClock();

// ====== LOCK SCREEN ======
window.unlockScreen = function() {
    if (userSettings.password) {
        const input = document.getElementById('lock-input');
        const err = document.getElementById('lock-error');
        if (input.value !== userSettings.password) { err.style.display = 'block'; input.value = ''; return; }
    }
    const ls = document.getElementById('lockscreen');
    ls.classList.add('unlocking');
    document.getElementById('desktop').style.display = 'flex';
    setTimeout(() => ls.remove(), 600);
};

document.addEventListener('DOMContentLoaded', () => {
    const li = document.getElementById('lock-input');
    if (li) li.addEventListener('keydown', e => { if (e.key === 'Enter') unlockScreen(); });
});

// ====== UTILS ======
function formatBytes(b, d=2) {
    if (!b || b===0) return '0 B';
    const k=1024, s=['B','KB','MB','GB','TB'], i=Math.floor(Math.log(b)/Math.log(k));
    return parseFloat((b/Math.pow(k,i)).toFixed(d))+' '+s[i];
}

function fileIcon(name, isFolder) {
    if (isFolder) return 'fa-solid fa-folder';
    const ext = name.split('.').pop().toLowerCase();
    const m = { jpg:'fa-solid fa-image', jpeg:'fa-solid fa-image', png:'fa-solid fa-image', gif:'fa-solid fa-image', webp:'fa-solid fa-image', svg:'fa-solid fa-image',
        mp3:'fa-solid fa-music', wav:'fa-solid fa-music', flac:'fa-solid fa-music', mp4:'fa-solid fa-film', avi:'fa-solid fa-film', mkv:'fa-solid fa-film',
        pdf:'fa-solid fa-file-pdf', doc:'fa-solid fa-file-word', docx:'fa-solid fa-file-word', xls:'fa-solid fa-file-excel', xlsx:'fa-solid fa-file-excel',
        zip:'fa-solid fa-file-zipper', rar:'fa-solid fa-file-zipper', exe:'fa-solid fa-gear', bat:'fa-solid fa-terminal', ps1:'fa-solid fa-terminal',
        js:'fa-brands fa-js', html:'fa-brands fa-html5', css:'fa-brands fa-css3-alt', py:'fa-brands fa-python',
        txt:'fa-solid fa-file-lines', log:'fa-solid fa-file-lines', md:'fa-solid fa-file-lines', json:'fa-solid fa-file-code' };
    return m[ext] || 'fa-solid fa-file';
}

function fileColor(name, isFolder) {
    if (isFolder) return '#4FC3F7';
    const ext = name.split('.').pop().toLowerCase();
    const c = { jpg:'#E91E63', jpeg:'#E91E63', png:'#E91E63', gif:'#E91E63', mp3:'#FF5722', wav:'#FF5722', mp4:'#9C27B0',
        pdf:'#F44336', doc:'#2196F3', docx:'#2196F3', xls:'#4CAF50', xlsx:'#4CAF50', zip:'#FF9800', exe:'#607D8B',
        js:'#F7DF1E', html:'#E44D26', css:'#2196F3', py:'#3776AB', txt:'#9E9E9E', json:'#FFC107' };
    return c[ext] || '#78909C';
}

function isTextFile(name) {
    const ext = name.split('.').pop().toLowerCase();
    return ['txt','log','md','json','js','html','css','py','xml','csv','bat','ps1','cmd','cfg','ini','yaml','yml'].includes(ext);
}

// ====== WINDOW MANAGEMENT ======
function createWindow(id, title, html, w=650, h=450) {
    const ex = document.getElementById(`window-${id}`);
    if (ex) { ex.style.zIndex = ++zIndexCounter; return; }

    const win = document.createElement('div');
    win.className = 'window'; win.id = `window-${id}`;
    win.style.width = w+'px'; win.style.height = h+'px'; win.style.zIndex = ++zIndexCounter;
    const cx = (innerWidth-w)/2 + (Math.random()-0.5)*60;
    const cy = (innerHeight-h)/2 + (Math.random()-0.5)*40;
    win.style.left = Math.max(20,cx)+'px'; win.style.top = Math.max(36,cy)+'px';

    win.innerHTML = `<div class="window-header"><div class="window-controls"><button class="control-btn close-btn"></button><button class="control-btn min-btn"></button><button class="control-btn max-btn"></button></div><div class="window-title">${title}</div></div><div class="window-content">${html}</div>`;
    wc.appendChild(win);

    const di = document.querySelector(`.dock-item[data-app="${id}"]`);
    if (di && !di.querySelector('.dock-dot')) { const d = document.createElement('span'); d.className='dock-dot'; di.appendChild(d); }

    win.querySelector('.close-btn').onclick = () => { win.style.animation='windowClose 0.18s ease-in forwards'; setTimeout(()=>{win.remove(); if(di){const d=di.querySelector('.dock-dot');if(d)d.remove();}},180); };
    win.onmousedown = () => { win.style.zIndex = ++zIndexCounter; if(win.style.display==='none')win.style.display='block'; };

    let isMin = false;
    win.querySelector('.min-btn').onclick = () => {
        win.style.animation = 'windowClose 0.2s ease-in forwards';
        setTimeout(() => { win.style.display = 'none'; win.style.animation = ''; isMin = true; }, 200);
        if(di) di.onclick = () => { if(isMin){ win.style.display = 'block'; win.style.zIndex = ++zIndexCounter; isMin=false; } };
    };

    let mx=false, pb={};
    win.querySelector('.max-btn').onclick = () => {
        if (!mx) { pb={t:win.style.top,l:win.style.left,w:win.style.width,h:win.style.height}; win.style.top='28px';win.style.left='0';win.style.width='100vw';win.style.height='calc(100vh - 90px)';win.style.borderRadius='0'; mx=true; }
        else { win.style.top=pb.t;win.style.left=pb.l;win.style.width=pb.w;win.style.height=pb.h;win.style.borderRadius='12px'; mx=false; }
    };

    const hdr = win.querySelector('.window-header');
    let dr=false, sx,sy,ix,iy;
    hdr.onmousedown = e => { if(e.target.classList.contains('control-btn'))return; dr=true;sx=e.clientX;sy=e.clientY;ix=win.offsetLeft;iy=win.offsetTop; };
    document.addEventListener('mousemove', e => { if(!dr)return; win.style.left=(ix+e.clientX-sx)+'px'; win.style.top=(iy+e.clientY-sy)+'px'; });
    document.addEventListener('mouseup', () => { dr=false; });
}

// ====== CALENDAR WIDGET ======
window.toggleCalendar = function() {
    const cw = document.getElementById('calendarWidget');
    if(cw.style.display === 'block') { cw.style.display = 'none'; return; }
    cw.style.display = 'block';
    const now = new Date();
    document.getElementById('calendar-header').textContent = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase());
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    let html = '<div style="font-weight:bold;color:var(--text-secondary)">L</div><div style="font-weight:bold;color:var(--text-secondary)">M</div><div style="font-weight:bold;color:var(--text-secondary)">X</div><div style="font-weight:bold;color:var(--text-secondary)">J</div><div style="font-weight:bold;color:var(--text-secondary)">V</div><div style="font-weight:bold;color:var(--text-secondary)">S</div><div style="font-weight:bold;color:var(--text-secondary)">D</div>';
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const blanks = firstDay === 0 ? 6 : firstDay - 1;
    for(let i=0; i<blanks; i++) html += '<div></div>';
    for(let i=1; i<=daysInMonth; i++) {
        if(i === now.getDate()) html += `<div style="background:var(--accent);color:white;border-radius:50%;width:24px;height:24px;line-height:24px;margin:auto;">${i}</div>`;
        else html += `<div style="width:24px;height:24px;line-height:24px;margin:auto;">${i}</div>`;
    }
    document.getElementById('calendar-body').innerHTML = html;
};

// ====== CONTEXT MENU ======
document.getElementById('desktop').addEventListener('contextmenu', e => {
    e.preventDefault();
    const cm = document.getElementById('context-menu');
    cm.style.display = 'block';
    cm.style.left = Math.min(e.clientX, window.innerWidth - 180) + 'px';
    cm.style.top = Math.min(e.clientY, window.innerHeight - 100) + 'px';
});
// ====== BATTERY ======
if(navigator.getBattery) {
    navigator.getBattery().then(batt => {
        const updateBatt = () => { document.getElementById('battery-status').innerHTML = `<i class="fa-solid fa-battery-${batt.level > 0.8 ? 'full' : batt.level > 0.5 ? 'three-quarters' : batt.level > 0.2 ? 'quarter' : 'empty'}"></i> ${Math.round(batt.level*100)}%`; };
        batt.addEventListener('levelchange', updateBatt); updateBatt();
    });
}

// ====== NOTIFICATIONS ======
window.showNotification = function(title, text, icon='fa-bell') {
    const cont = document.getElementById('notifications-container');
    if(!cont) return;
    const notif = document.createElement('div');
    notif.className = 'notif-toast';
    notif.style = `background:var(--glass-bg); backdrop-filter:blur(20px); border:1px solid var(--glass-border); padding:12px 15px; border-radius:10px; display:flex; align-items:center; gap:12px; box-shadow:var(--shadow-lg); width:280px; transform:translateX(120%); transition:transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);`;
    notif.innerHTML = `<div style="width:36px;height:36px;border-radius:50%;background:var(--accent-primary);display:flex;align-items:center;justify-content:center;color:white;font-size:16px;"><i class="fa-solid ${icon}"></i></div><div style="flex:1"><div style="font-weight:600;font-size:13px;margin-bottom:3px">${title}</div><div style="font-size:11px;color:var(--text-secondary);line-height:1.3">${text}</div></div>`;
    cont.appendChild(notif);
    setTimeout(() => notif.style.transform = 'translateX(0)', 10);
    setTimeout(() => {
        notif.style.transform = 'translateX(120%)';
        setTimeout(() => notif.remove(), 300);
    }, 4000);
};

// ====== CONTROL CENTER ======
window.toggleControlCenter = function() {
    const cc = document.getElementById('controlCenter');
    if(cc) {
        if(cc.style.display === 'block') cc.style.display = 'none';
        else {
            document.getElementById('calendarWidget').style.display = 'none';
            cc.style.display = 'block';
        }
    }
};

// ====== SPOTLIGHT SEARCH ======
window.toggleSpotlight = function() {
    const sp = document.getElementById('spotlight-overlay');
    if(!sp) return;
    if(sp.style.display === 'flex') {
        sp.style.display = 'none';
    } else {
        sp.style.display = 'flex';
        setTimeout(() => document.getElementById('spotlight-input').focus(), 50);
    }
};

document.addEventListener('keydown', e => {
    // Ctrl + Space to open Spotlight
    if(e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        toggleSpotlight();
    }
    // Esc to close Spotlight
    if(e.code === 'Escape') {
        const sp = document.getElementById('spotlight-overlay');
        if(sp && sp.style.display === 'flex') sp.style.display = 'none';
    }
});

document.addEventListener('click', e => {
    document.getElementById('context-menu').style.display = 'none';
    if(!e.target.closest('#calendarWidget') && e.target.id !== 'clock') document.getElementById('calendarWidget').style.display = 'none';
    if(!e.target.closest('#controlCenter') && !e.target.closest('#control-center-btn')) {
        const cc = document.getElementById('controlCenter');
        if(cc) cc.style.display = 'none';
    }
    const sp = document.getElementById('spotlight-overlay');
    if(sp && e.target === sp) sp.style.display = 'none';
});

loadSettings();
