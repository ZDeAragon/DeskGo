// ====== RELOJ ======
function updateClock() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const el = document.getElementById('clock');
    if (el) el.textContent = `${h}:${m}`;
}
setInterval(updateClock, 1000);
updateClock();

// ====== WINDOW MANAGEMENT ======
let zIndexCounter = 100;
const windowsContainer = document.getElementById('windows-container');

function createWindow(id, title, contentHtml, width = 650, height = 450) {
    const existing = document.getElementById(`window-${id}`);
    if (existing) {
        existing.style.zIndex = ++zIndexCounter;
        return;
    }

    const win = document.createElement('div');
    win.className = 'window';
    win.id = `window-${id}`;
    win.style.width = width + 'px';
    win.style.height = height + 'px';
    win.style.zIndex = ++zIndexCounter;

    // Center with slight random offset
    const cx = (window.innerWidth - width) / 2 + (Math.random() - 0.5) * 60;
    const cy = (window.innerHeight - height) / 2 + (Math.random() - 0.5) * 40;
    win.style.left = Math.max(20, cx) + 'px';
    win.style.top = Math.max(36, cy) + 'px';

    win.innerHTML = `
        <div class="window-header">
            <div class="window-controls">
                <button class="control-btn close-btn"></button>
                <button class="control-btn min-btn"></button>
                <button class="control-btn max-btn"></button>
            </div>
            <div class="window-title">${title}</div>
        </div>
        <div class="window-content">${contentHtml}</div>
    `;

    windowsContainer.appendChild(win);

    // Mark dock item as active
    const dockItem = document.querySelector(`.dock-item[data-app="${id}"]`);
    if (dockItem && !dockItem.querySelector('.dock-dot')) {
        const dot = document.createElement('span');
        dot.className = 'dock-dot';
        dockItem.appendChild(dot);
    }

    // Close
    win.querySelector('.close-btn').addEventListener('click', () => {
        win.style.animation = 'windowClose 0.18s ease-in forwards';
        setTimeout(() => {
            win.remove();
            // Remove dock dot
            if (dockItem) {
                const dot = dockItem.querySelector('.dock-dot');
                if (dot) dot.remove();
            }
        }, 180);
    });

    // Bring to front
    win.addEventListener('mousedown', () => {
        win.style.zIndex = ++zIndexCounter;
    });

    // Maximize
    let isMaximized = false;
    let prevBounds = {};
    win.querySelector('.max-btn').addEventListener('click', () => {
        if (!isMaximized) {
            prevBounds = { top: win.style.top, left: win.style.left, width: win.style.width, height: win.style.height };
            win.style.top = '28px';
            win.style.left = '0px';
            win.style.width = '100vw';
            win.style.height = 'calc(100vh - 90px)';
            win.style.borderRadius = '0';
            isMaximized = true;
        } else {
            Object.assign(win.style, prevBounds);
            win.style.borderRadius = '12px';
            isMaximized = false;
        }
    });

    // Minimize
    win.querySelector('.min-btn').addEventListener('click', () => {
        win.style.display = win.style.display === 'none' ? 'flex' : 'none';
    });

    // Drag
    const header = win.querySelector('.window-header');
    let dragging = false, sx, sy, ix, iy;

    header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('control-btn')) return;
        dragging = true;
        sx = e.clientX; sy = e.clientY;
        ix = win.offsetLeft; iy = win.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        win.style.left = (ix + e.clientX - sx) + 'px';
        win.style.top = (iy + e.clientY - sy) + 'px';
    });

    document.addEventListener('mouseup', () => { dragging = false; });
}

// ====== UTILS ======
function formatBytes(bytes, d = 2) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const s = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(d)) + ' ' + s[i];
}

function fileIcon(name, isFolder) {
    if (isFolder) return 'fa-solid fa-folder';
    const ext = name.split('.').pop().toLowerCase();
    const map = {
        jpg: 'fa-solid fa-image', jpeg: 'fa-solid fa-image', png: 'fa-solid fa-image', gif: 'fa-solid fa-image', webp: 'fa-solid fa-image', svg: 'fa-solid fa-image', bmp: 'fa-solid fa-image',
        mp3: 'fa-solid fa-music', wav: 'fa-solid fa-music', flac: 'fa-solid fa-music', ogg: 'fa-solid fa-music', aac: 'fa-solid fa-music',
        mp4: 'fa-solid fa-film', avi: 'fa-solid fa-film', mkv: 'fa-solid fa-film', mov: 'fa-solid fa-film',
        pdf: 'fa-solid fa-file-pdf', doc: 'fa-solid fa-file-word', docx: 'fa-solid fa-file-word',
        xls: 'fa-solid fa-file-excel', xlsx: 'fa-solid fa-file-excel',
        ppt: 'fa-solid fa-file-powerpoint', pptx: 'fa-solid fa-file-powerpoint',
        zip: 'fa-solid fa-file-zipper', rar: 'fa-solid fa-file-zipper', '7z': 'fa-solid fa-file-zipper',
        exe: 'fa-solid fa-gear', msi: 'fa-solid fa-gear', bat: 'fa-solid fa-terminal', ps1: 'fa-solid fa-terminal', cmd: 'fa-solid fa-terminal',
        js: 'fa-brands fa-js', html: 'fa-brands fa-html5', css: 'fa-brands fa-css3-alt', py: 'fa-brands fa-python',
        txt: 'fa-solid fa-file-lines', log: 'fa-solid fa-file-lines', md: 'fa-solid fa-file-lines', csv: 'fa-solid fa-file-csv',
        json: 'fa-solid fa-file-code', xml: 'fa-solid fa-file-code',
        iso: 'fa-solid fa-compact-disc', img: 'fa-solid fa-compact-disc',
    };
    return map[ext] || 'fa-solid fa-file';
}

function fileIconColor(name, isFolder) {
    if (isFolder) return '#4FC3F7';
    const ext = name.split('.').pop().toLowerCase();
    const colors = {
        jpg: '#E91E63', jpeg: '#E91E63', png: '#E91E63', gif: '#E91E63', webp: '#E91E63', svg: '#E91E63',
        mp3: '#FF5722', wav: '#FF5722', flac: '#FF5722',
        mp4: '#9C27B0', avi: '#9C27B0', mkv: '#9C27B0',
        pdf: '#F44336', doc: '#2196F3', docx: '#2196F3',
        xls: '#4CAF50', xlsx: '#4CAF50',
        zip: '#FF9800', rar: '#FF9800',
        exe: '#607D8B', js: '#F7DF1E', html: '#E44D26', css: '#2196F3', py: '#3776AB',
        txt: '#9E9E9E', json: '#FFC107',
    };
    return colors[ext] || '#78909C';
}

// ====== APP CONTENTS ======
const appContents = {
    explorador: {
        title: 'Explorador',
        width: 720,
        height: 520,
        html: `
            <div style="display:flex;flex-direction:column;height:100%;gap:0;">
                <div class="toolbar">
                    <button class="nav-btn" id="nav-back" onclick="navBack()"><i class="fa-solid fa-chevron-left"></i></button>
                    <button class="nav-btn" onclick="loadFiles('')"><i class="fa-solid fa-house"></i></button>
                    <div class="breadcrumb" id="breadcrumb">/ Raíz del Pendrive</div>
                </div>
                <div id="file-grid" style="flex:1;display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:4px;align-content:flex-start;overflow-y:auto;padding-top:4px;">
                    <div style="text-align:center;padding:40px 0;color:var(--text-tertiary);grid-column:1/-1;">
                        <i class="fa-solid fa-spinner fa-spin" style="font-size:24px;"></i>
                        <div style="margin-top:8px;">Cargando archivos...</div>
                    </div>
                </div>
            </div>
        `,
        onOpen: () => {
            let history = [''];
            let hIdx = 0;

            window.navBack = () => {
                if (hIdx > 0) { hIdx--; loadFiles(history[hIdx], false); }
            };

            window.loadFiles = (path, push = true) => {
                if (push) {
                    history = history.slice(0, hIdx + 1);
                    history.push(path);
                    hIdx = history.length - 1;
                }
                const grid = document.getElementById('file-grid');
                const crumb = document.getElementById('breadcrumb');
                if (!grid) return;

                grid.innerHTML = `<div style="text-align:center;padding:40px 0;color:var(--text-tertiary);grid-column:1/-1;"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;"></i></div>`;
                crumb.textContent = path === '' ? '/ Raíz del Pendrive' : '/ ' + path.replace(/\\/g, ' / ');

                fetch('/api/files?path=' + encodeURIComponent(path))
                    .then(r => r.json())
                    .then(files => {
                        grid.innerHTML = '';
                        if (!files.length) {
                            grid.innerHTML = `<div style="text-align:center;padding:40px 0;color:var(--text-tertiary);grid-column:1/-1;"><i class="fa-regular fa-folder-open" style="font-size:32px;margin-bottom:8px;display:block;"></i>Carpeta vacía</div>`;
                            return;
                        }
                        files.sort((a, b) => (a.IsFolder === b.IsFolder) ? a.Name.localeCompare(b.Name) : (a.IsFolder ? -1 : 1));
                        files.forEach(f => {
                            const div = document.createElement('div');
                            div.className = 'file-item';
                            const iconClass = fileIcon(f.Name, f.IsFolder);
                            const color = fileIconColor(f.Name, f.IsFolder);
                            const size = f.IsFolder ? '' : `<div style="font-size:10px;color:var(--text-tertiary);margin-top:2px;">${formatBytes(f.Length)}</div>`;
                            div.innerHTML = `
                                <i class="${iconClass}" style="font-size:32px;color:${color};"></i>
                                <div style="margin-top:6px;font-size:11px;word-break:break-all;color:var(--text-primary);line-height:1.3;max-height:2.6em;overflow:hidden;">${f.Name}</div>
                                ${size}
                            `;
                            if (f.IsFolder) {
                                div.addEventListener('dblclick', () => loadFiles(path ? path + '\\' + f.Name : f.Name));
                                div.style.cursor = 'pointer';
                            }
                            grid.appendChild(div);
                        });
                    })
                    .catch(() => {
                        grid.innerHTML = `<div style="text-align:center;padding:40px 0;color:var(--danger);grid-column:1/-1;"><i class="fa-solid fa-triangle-exclamation" style="font-size:24px;margin-bottom:8px;display:block;"></i>Error al cargar</div>`;
                    });
            };
            loadFiles('');
        }
    },

    editor: {
        title: 'Editor de Texto',
        width: 620,
        height: 460,
        html: `
            <div style="display:flex;flex-direction:column;height:100%;gap:8px;">
                <div class="toolbar">
                    <button class="toolbar-btn" onclick="document.getElementById('editor-area').value=''"><i class="fa-solid fa-file"></i> Nuevo</button>
                    <button class="toolbar-btn" onclick="navigator.clipboard.writeText(document.getElementById('editor-area').value)"><i class="fa-regular fa-copy"></i> Copiar</button>
                    <span class="toolbar-info" id="char-count">0 caracteres</span>
                </div>
                <textarea id="editor-area" class="editor-textarea" placeholder="Escribe aquí..." oninput="document.getElementById('char-count').textContent=this.value.length+' caracteres'"></textarea>
            </div>
        `
    },

    calculadora: {
        title: 'Calculadora',
        width: 300,
        height: 460,
        html: `
            <div class="calc-grid">
                <div class="calc-display" id="calc-display">0</div>
                <button class="calc-btn" onclick="calc('C')">AC</button>
                <button class="calc-btn" onclick="calc('negate')">+/−</button>
                <button class="calc-btn" onclick="calc('percent')">%</button>
                <button class="calc-btn op" onclick="calc('÷')">÷</button>
                <button class="calc-btn" onclick="calc('7')">7</button>
                <button class="calc-btn" onclick="calc('8')">8</button>
                <button class="calc-btn" onclick="calc('9')">9</button>
                <button class="calc-btn op" onclick="calc('×')">×</button>
                <button class="calc-btn" onclick="calc('4')">4</button>
                <button class="calc-btn" onclick="calc('5')">5</button>
                <button class="calc-btn" onclick="calc('6')">6</button>
                <button class="calc-btn op" onclick="calc('-')">−</button>
                <button class="calc-btn" onclick="calc('1')">1</button>
                <button class="calc-btn" onclick="calc('2')">2</button>
                <button class="calc-btn" onclick="calc('3')">3</button>
                <button class="calc-btn op" onclick="calc('+')">+</button>
                <button class="calc-btn" onclick="calc('0')" style="grid-column:span 2;">0</button>
                <button class="calc-btn" onclick="calc('.')">.</button>
                <button class="calc-btn op" onclick="calc('=')">=</button>
            </div>
        `,
        onOpen: () => {
            let cur = '0', prev = '', op = '', reset = false;
            window.calc = (v) => {
                const d = document.getElementById('calc-display');
                if (!d) return;
                if (v === 'C') { cur = '0'; prev = ''; op = ''; reset = false; }
                else if (v === 'negate') { cur = String(-parseFloat(cur)); }
                else if (v === 'percent') { cur = String(parseFloat(cur) / 100); }
                else if (['+','-','×','÷'].includes(v)) { prev = cur; op = v; reset = true; }
                else if (v === '=') {
                    if (prev && op) {
                        const a = parseFloat(prev), b = parseFloat(cur);
                        if (op === '+') cur = String(a + b);
                        else if (op === '-') cur = String(a - b);
                        else if (op === '×') cur = String(a * b);
                        else if (op === '÷') cur = b !== 0 ? String(a / b) : 'Error';
                        prev = ''; op = '';
                    }
                    reset = true;
                } else {
                    if (reset) { cur = ''; reset = false; }
                    if (v === '.' && cur.includes('.')) return;
                    cur = (cur === '0' && v !== '.') ? v : cur + v;
                }
                let display = cur;
                if (display.length > 11) display = parseFloat(display).toExponential(5);
                d.textContent = display;
            };
        }
    },

    smartdisk: {
        title: 'SmartDisk',
        width: 400,
        height: 360,
        html: `
            <div class="disk-info" id="disk-info">
                <div style="text-align:center;padding:30px 0;color:var(--text-tertiary);">
                    <i class="fa-solid fa-spinner fa-spin" style="font-size:28px;"></i>
                    <div style="margin-top:10px;">Analizando pendrive...</div>
                </div>
            </div>
        `,
        onOpen: () => {
            fetch('/api/disk')
                .then(r => r.json())
                .then(d => {
                    const pct = ((d.used / d.total) * 100).toFixed(1);
                    const col = pct > 90 ? 'var(--danger)' : pct > 70 ? 'var(--warning)' : 'var(--accent)';
                    document.getElementById('disk-info').innerHTML = `
                        <div style="text-align:center;">
                            <i class="fa-solid fa-hard-drive" style="font-size:36px;color:var(--accent);"></i>
                            <h3 style="margin-top:8px;font-size:16px;">Unidad ${d.drive || ''}</h3>
                            <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">Pendrive USB</div>
                        </div>
                        <div>
                            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-secondary);margin-bottom:6px;">
                                <span>${formatBytes(d.used)} de ${formatBytes(d.total)}</span>
                                <span style="color:${col};font-weight:600;">${pct}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width:${pct}%;"></div>
                            </div>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                            <div class="stat-card">
                                <div class="stat-value" style="color:var(--accent);">${formatBytes(d.free)}</div>
                                <div class="stat-label">Disponible</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value" style="color:var(--danger);">${formatBytes(d.used)}</div>
                                <div class="stat-label">Utilizado</div>
                            </div>
                        </div>
                    `;
                })
                .catch(() => {
                    document.getElementById('disk-info').innerHTML = `
                        <div style="text-align:center;padding:30px;color:var(--danger);">
                            <i class="fa-solid fa-plug-circle-xmark" style="font-size:32px;"></i>
                            <div style="margin-top:10px;font-size:13px;">No se pudo conectar al servidor</div>
                        </div>
                    `;
                });
        }
    },

    smartapps: {
        title: 'SmartApps',
        width: 520,
        height: 400,
        html: `
            <div style="display:flex;flex-direction:column;gap:18px;">
                <div style="display:flex;align-items:center;gap:14px;">
                    <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#F48FB1,#C2185B);display:flex;align-items:center;justify-content:center;font-size:20px;color:white;"><i class="fa-solid fa-bag-shopping"></i></div>
                    <div>
                        <div style="font-size:18px;font-weight:600;">SmartApps</div>
                        <div style="font-size:12px;color:var(--text-tertiary);">Apps portables para tu DeskGo</div>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
                    <div class="store-card">
                        <div class="store-card-icon" style="background:linear-gradient(135deg,#FF5722,#E64A19);"><i class="fa-solid fa-music"></i></div>
                        <div style="font-weight:500;font-size:13px;">SmartPlay</div>
                        <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">Reproductor</div>
                        <button class="store-btn">Próximamente</button>
                    </div>
                    <div class="store-card">
                        <div class="store-card-icon" style="background:linear-gradient(135deg,#66BB6A,#2E7D32);"><i class="fa-solid fa-gamepad"></i></div>
                        <div style="font-weight:500;font-size:13px;">RetroGames</div>
                        <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">Juegos clásicos</div>
                        <button class="store-btn">Próximamente</button>
                    </div>
                    <div class="store-card">
                        <div class="store-card-icon" style="background:linear-gradient(135deg,#FFA726,#E65100);"><i class="fa-solid fa-paintbrush"></i></div>
                        <div style="font-weight:500;font-size:13px;">SmartPaint</div>
                        <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">Editor gráfico</div>
                        <button class="store-btn">Próximamente</button>
                    </div>
                </div>
            </div>
        `
    }
};

// ====== DOCK LISTENERS ======
document.querySelectorAll('.dock-item').forEach(item => {
    item.addEventListener('click', () => {
        const id = item.getAttribute('data-app');
        const app = appContents[id];
        if (app) {
            createWindow(id, app.title, app.html, app.width, app.height);
            if (app.onOpen) setTimeout(app.onOpen, 60);
        }
    });
});
