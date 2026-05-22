// ====== APPS ======
const apps = {
    explorador: { title:'Explorador', w:720, h:520,
        html: `<div style="display:flex;flex-direction:column;height:100%"><div class="toolbar"><button class="nav-btn" id="nav-back" onclick="navBack()"><i class="fa-solid fa-chevron-left"></i></button><button class="nav-btn" onclick="loadFiles('')"><i class="fa-solid fa-house"></i></button><div class="breadcrumb" id="breadcrumb">/ RaÃ­z</div></div><div id="file-grid" style="flex:1;display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:4px;align-content:start;overflow-y:auto;padding-top:4px"><div style="text-align:center;padding:40px 0;color:var(--text-tertiary);grid-column:1/-1"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px"></i></div></div></div>`,
        onOpen: () => {
            let hist=[''], hi=0;
            window.navBack = ()=>{ if(hi>0){hi--;loadFiles(hist[hi],false);} };
            window.loadFiles = (p, push=true)=>{
                if(push){hist=hist.slice(0,hi+1);hist.push(p);hi=hist.length-1;}
                const g=document.getElementById('file-grid'), cr=document.getElementById('breadcrumb');
                if(!g)return;
                g.innerHTML='<div style="text-align:center;padding:40px 0;color:var(--text-tertiary);grid-column:1/-1"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px"></i></div>';
                cr.textContent = p==='' ? '/ RaÃ­z del Pendrive' : '/ '+p.replace(/\\/g,' / ');
                fetch('/api/files?path='+encodeURIComponent(p)).then(r=>r.json()).then(files=>{
                    g.innerHTML='';
                    if(!files.length){g.innerHTML='<div style="text-align:center;padding:40px 0;color:var(--text-tertiary);grid-column:1/-1"><i class="fa-regular fa-folder-open" style="font-size:32px;display:block;margin-bottom:8px"></i>Carpeta vacÃ­a</div>';return;}
                    files.sort((a,b)=>(a.IsFolder===b.IsFolder)?a.Name.localeCompare(b.Name):(a.IsFolder?-1:1));
                    files.forEach(f=>{
                        const d=document.createElement('div'); d.className='file-item';
                        const sz = f.IsFolder?'':`<div style="font-size:10px;color:var(--text-tertiary);margin-top:2px">${formatBytes(f.Length)}</div>`;
                        const fullPath = p?p+'\\'+f.Name:f.Name;
                        d.innerHTML=`<i class="${fileIcon(f.Name,f.IsFolder)}" style="font-size:32px;color:${fileColor(f.Name,f.IsFolder)}"></i><div style="margin-top:6px;font-size:11px;word-break:break-all;line-height:1.3;max-height:2.6em;overflow:hidden">${f.Name}</div>${sz}<button class="add-desktop-btn" onclick="addDesktopIcon('${fullPath.replace(/\\/g, '\\\\')}', '${f.Name.replace(/'/g, "\\'")}', ${f.IsFolder}); event.stopPropagation();" title="Añadir al escritorio"><i class="fa-solid fa-plus"></i></button>`;
                        if(f.IsFolder) { d.ondblclick=()=>loadFiles(p?p+'\\'+f.Name:f.Name); d.style.cursor='pointer'; }
                        else if(isTextFile(f.Name)) { d.ondblclick=()=>openFileInEditor(p?p+'\\'+f.Name:f.Name); d.style.cursor='pointer'; }
                        g.appendChild(d);
                    });
                }).catch(()=>{ g.innerHTML='<div style="text-align:center;padding:40px 0;color:var(--danger);grid-column:1/-1"><i class="fa-solid fa-triangle-exclamation" style="font-size:24px;display:block;margin-bottom:8px"></i>Error</div>'; });
            };
            loadFiles('');
        }
    },

    editor: { title:'Editor', w:620, h:460,
        html: `<div style="display:flex;flex-direction:column;height:100%;gap:6px"><div class="toolbar"><button class="toolbar-btn" onclick="newEditorFile()"><i class="fa-solid fa-file"></i> Nuevo</button><button class="toolbar-btn" onclick="saveEditorFile()"><i class="fa-solid fa-floppy-disk"></i> Guardar</button><button class="toolbar-btn" onclick="navigator.clipboard.writeText(document.getElementById('editor-area').value)"><i class="fa-regular fa-copy"></i> Copiar</button><span class="toolbar-info" id="editor-info">Sin archivo</span></div><textarea id="editor-area" class="editor-textarea" placeholder="Escribe aquÃ­..." oninput="updateEditorCount()"></textarea><div class="editor-status"><span id="char-count">0 caracteres</span><span id="editor-path">â€”</span></div></div>`,
        onOpen: () => {
            window._editorFilePath = null;
            window.updateEditorCount = ()=>{ const a=document.getElementById('editor-area'); if(a) document.getElementById('char-count').textContent=a.value.length+' caracteres'; };
            window.newEditorFile = ()=>{ document.getElementById('editor-area').value=''; window._editorFilePath=null; document.getElementById('editor-path').textContent='â€”'; document.getElementById('editor-info').textContent='Sin archivo'; };
            window.saveEditorFile = async ()=>{
                if(!window._editorFilePath){alert('Abre un archivo desde el Explorador primero');return;}
                const c=document.getElementById('editor-area').value;
                try{ await fetch('/api/file/write',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:window._editorFilePath,content:c})}); document.getElementById('editor-info').textContent='Guardado âœ“'; }catch(e){ document.getElementById('editor-info').textContent='Error al guardar'; }
            };
        }
    },

    calculadora: { title:'Calculadora', w:300, h:460,
        html: `<div class="calc-grid"><div class="calc-display" id="calc-display">0</div><button class="calc-btn" onclick="calc('C')">AC</button><button class="calc-btn" onclick="calc('negate')">+/âˆ’</button><button class="calc-btn" onclick="calc('percent')">%</button><button class="calc-btn op" onclick="calc('Ã·')">Ã·</button><button class="calc-btn" onclick="calc('7')">7</button><button class="calc-btn" onclick="calc('8')">8</button><button class="calc-btn" onclick="calc('9')">9</button><button class="calc-btn op" onclick="calc('Ã—')">Ã—</button><button class="calc-btn" onclick="calc('4')">4</button><button class="calc-btn" onclick="calc('5')">5</button><button class="calc-btn" onclick="calc('6')">6</button><button class="calc-btn op" onclick="calc('-')">âˆ’</button><button class="calc-btn" onclick="calc('1')">1</button><button class="calc-btn" onclick="calc('2')">2</button><button class="calc-btn" onclick="calc('3')">3</button><button class="calc-btn op" onclick="calc('+')">+</button><button class="calc-btn" onclick="calc('0')" style="grid-column:span 2">0</button><button class="calc-btn" onclick="calc('.')">.</button><button class="calc-btn op" onclick="calc('=')">=</button></div>`,
        onOpen: () => {
            let cur='0',prev='',op='',rst=false;
            window.calc = v=>{ const d=document.getElementById('calc-display'); if(!d)return;
                if(v==='C'){cur='0';prev='';op='';rst=false;}
                else if(v==='negate'){cur=String(-parseFloat(cur));}
                else if(v==='percent'){cur=String(parseFloat(cur)/100);}
                else if(['+','-','Ã—','Ã·'].includes(v)){prev=cur;op=v;rst=true;}
                else if(v==='='){if(prev&&op){const a=parseFloat(prev),b=parseFloat(cur);if(op==='+')cur=String(a+b);else if(op==='-')cur=String(a-b);else if(op==='Ã—')cur=String(a*b);else if(op==='Ã·')cur=b!==0?String(a/b):'Error';prev='';op='';}rst=true;}
                else{if(rst){cur='';rst=false;}if(v==='.'&&cur.includes('.'))return;cur=(cur==='0'&&v!=='.')?v:cur+v;}
                let dv=cur;if(dv.length>11)dv=parseFloat(dv).toExponential(5);d.textContent=dv;
            };
        }
    },

    smartdisk: { title:'SmartDisk', w:400, h:360,
        html: `<div class="disk-info" id="disk-info"><div style="text-align:center;padding:30px 0;color:var(--text-tertiary)"><i class="fa-solid fa-spinner fa-spin" style="font-size:28px"></i><div style="margin-top:10px">Analizando...</div></div></div>`,
        onOpen: () => {
            fetch('/api/disk').then(r=>r.json()).then(d=>{
                const p=((d.used/d.total)*100).toFixed(1);
                document.getElementById('disk-info').innerHTML=`
                    <div style="text-align:center"><i class="fa-solid fa-hard-drive" style="font-size:36px;color:var(--accent)"></i><h3 style="margin-top:8px;font-size:16px">Unidad ${d.drive||''}</h3><div style="font-size:11px;color:var(--text-tertiary)">Pendrive USB</div></div>
                    <div><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-secondary);margin-bottom:6px"><span>${formatBytes(d.used)} de ${formatBytes(d.total)}</span><span style="color:var(--accent);font-weight:600">${p}%</span></div><div class="progress-bar"><div class="progress-fill" style="width:${p}%"></div></div></div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="stat-card"><div class="stat-value" style="color:var(--accent)">${formatBytes(d.free)}</div><div class="stat-label">Disponible</div></div><div class="stat-card"><div class="stat-value" style="color:var(--danger)">${formatBytes(d.used)}</div><div class="stat-label">Utilizado</div></div></div>`;
            }).catch(()=>{ document.getElementById('disk-info').innerHTML='<div style="text-align:center;padding:30px;color:var(--danger)"><i class="fa-solid fa-plug-circle-xmark" style="font-size:32px"></i><div style="margin-top:10px">Sin conexiÃ³n</div></div>'; });
        }
    },

    safari: { title:'Safari', w:800, h:600,
        html: `<div style="display:flex;flex-direction:column;height:100%"><div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--glass-bg);border-bottom:1px solid var(--glass-border)"><button style="background:transparent;border:none;color:var(--text-secondary);font-size:16px;cursor:pointer" onclick="document.getElementById('browser-frame').contentWindow.history.back()"><i class="fa-solid fa-chevron-left"></i></button><button style="background:transparent;border:none;color:var(--text-secondary);font-size:16px;cursor:pointer" onclick="document.getElementById('browser-frame').contentWindow.history.forward()"><i class="fa-solid fa-chevron-right"></i></button><button style="background:transparent;border:none;color:var(--text-secondary);font-size:16px;cursor:pointer" onclick="document.getElementById('browser-frame').src=document.getElementById('browser-frame').src"><i class="fa-solid fa-rotate-right"></i></button><input type="text" id="browser-url" style="flex:1;background:rgba(0,0,0,0.05);border:1px solid rgba(0,0,0,0.1);border-radius:12px;padding:6px 12px;font-size:13px;color:var(--text-primary);outline:none" value="https://es.wikipedia.org" onkeydown="if(event.key==='Enter') window.navigateBrowser(this.value)"></div><iframe id="browser-frame" src="https://es.wikipedia.org" style="flex:1;width:100%;border:none;background:white"></iframe></div>`,
        onOpen: () => {
            window.navigateBrowser = (url) => {
                if(!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                }
                const frame = document.getElementById('browser-frame');
                if(frame) frame.src = url;
                const input = document.getElementById('browser-url');
                if(input) input.value = url;
            };
        }
    },

    ajustes: { title:'Ajustes del Sistema', w:680, h:480,
        html: `<div class="settings-container"><div class="settings-sidebar"><div class="settings-nav-item active" onclick="showSettingsTab(this,'perfil')"><i class="fa-solid fa-user"></i>Perfil</div><div class="settings-nav-item" onclick="showSettingsTab(this,'apariencia')"><i class="fa-solid fa-palette"></i>Apariencia</div><div class="settings-nav-item" onclick="showSettingsTab(this,'seguridad')"><i class="fa-solid fa-lock"></i>Seguridad</div></div><div class="settings-panel" id="settings-panel"></div></div>`,
        onOpen: () => {
            window.showSettingsTab = (el, tab) => {
                document.querySelectorAll('.settings-nav-item').forEach(n=>n.classList.remove('active'));
                if(el) el.classList.add('active');
                const p = document.getElementById('settings-panel');
                if(!p) return;

                if(tab==='perfil') {
                    p.innerHTML=`<div class="settings-section-title">Perfil</div>
                        <div class="settings-profile-section">
                            <div class="settings-avatar" id="settings-avatar" onclick="document.getElementById('avatar-input').click()">${userSettings.avatar?`<img src="${userSettings.avatar}">`:'<i class="fa-solid fa-user"></i>'}</div>
                            <input type="file" id="avatar-input" accept="image/*" style="display:none" onchange="handleAvatar(this)">
                            <div style="font-size:11px;color:var(--text-tertiary)">Haz clic para cambiar foto</div>
                        </div>
                        <div class="settings-row"><div><div class="settings-row-label">Nombre</div><div class="settings-row-desc">Se muestra en la pantalla de bloqueo</div></div><input class="settings-input" id="set-name" value="${userSettings.name}" placeholder="Tu nombre"></div>
                        <button class="save-btn" onclick="saveProfile()">Guardar perfil</button>`;
                } else if(tab==='apariencia') {
                    p.innerHTML=`<div class="settings-section-title">Apariencia</div>
                        <div class="settings-row"><div><div class="settings-row-label">Tema</div><div class="settings-row-desc">Cambia entre oscuro y claro</div></div><div class="toggle ${userSettings.theme==='light'?'on':''}" id="theme-toggle" onclick="toggleTheme()"></div></div>
                        <div style="margin-top:20px"><div class="settings-row-label" style="margin-bottom:10px">Fondo de pantalla</div>
                        <div class="wallpaper-grid">
                            <div class="wallpaper-option ${userSettings.wallpaper==='wallpaper.png'?'selected':''}" style="background:url('wallpaper.png') center/cover" onclick="setWallpaper('wallpaper.png',this)"></div>
                            <div class="wallpaper-option ${userSettings.wallpaper==='grad1'?'selected':''}" style="background:linear-gradient(135deg,#0f0c29,#302b63,#24243e)" onclick="setWallpaper('grad1',this)"></div>
                            <div class="wallpaper-option ${userSettings.wallpaper==='grad2'?'selected':''}" style="background:linear-gradient(135deg,#1a2a6c,#b21f1f,#fdbb2d)" onclick="setWallpaper('grad2',this)"></div>
                            <div class="wallpaper-option ${userSettings.wallpaper==='grad3'?'selected':''}" style="background:linear-gradient(135deg,#0F2027,#203A43,#2C5364)" onclick="setWallpaper('grad3',this)"></div>
                            <div class="wallpaper-option ${userSettings.wallpaper==='grad4'?'selected':''}" style="background:linear-gradient(135deg,#4A00E0,#8E2DE2)" onclick="setWallpaper('grad4',this)"></div>
                            <div class="wallpaper-option ${userSettings.wallpaper==='grad5'?'selected':''}" style="background:linear-gradient(135deg,#11998e,#38ef7d)" onclick="setWallpaper('grad5',this)"></div>
                        </div></div>`;
                } else if(tab==='seguridad') {
                    p.innerHTML=`<div class="settings-section-title">Seguridad</div>
                        <div class="settings-row"><div><div class="settings-row-label">ContraseÃ±a de bloqueo</div><div class="settings-row-desc">Opcional. Se pedirÃ¡ al iniciar DeskGo</div></div></div>
                        <div style="margin-top:12px;display:flex;flex-direction:column;gap:10px">
                            <input class="settings-input" id="set-pass" type="password" value="${userSettings.password}" placeholder="Dejar vacÃ­o = sin contraseÃ±a" style="width:100%">
                            <button class="save-btn" onclick="savePassword()">Guardar contraseÃ±a</button>
                        </div>`;
                }
            };

            window.handleAvatar = (input) => {
                const file = input.files[0]; if(!file) return;
                const reader = new FileReader();
                reader.onload = e => { userSettings.avatar = e.target.result; saveSettings(); const a=document.getElementById('settings-avatar'); if(a) a.innerHTML=`<img src="${e.target.result}">`; applySettings(); };
                reader.readAsDataURL(file);
            };

            window.saveProfile = () => { userSettings.name = document.getElementById('set-name').value || 'Usuario'; saveSettings(); applySettings(); };

            window.toggleTheme = () => {
                userSettings.theme = userSettings.theme==='dark'?'light':'dark';
                const t=document.getElementById('theme-toggle'); if(t) t.classList.toggle('on');
                saveSettings(); applySettings();
            };

            window.setWallpaper = (wp, el) => {
                const grads = { grad1:'linear-gradient(135deg,#0f0c29,#302b63,#24243e)', grad2:'linear-gradient(135deg,#1a2a6c,#b21f1f,#fdbb2d)', grad3:'linear-gradient(135deg,#0F2027,#203A43,#2C5364)', grad4:'linear-gradient(135deg,#4A00E0,#8E2DE2)', grad5:'linear-gradient(135deg,#11998e,#38ef7d)' };
                userSettings.wallpaper = wp;
                if(grads[wp]) { document.body.style.backgroundImage = grads[wp]; } else { document.body.style.backgroundImage = `url('${wp}')`; }
                document.querySelectorAll('.wallpaper-option').forEach(o=>o.classList.remove('selected'));
                el.classList.add('selected');
                saveSettings();
            };

            window.savePassword = () => { userSettings.password = document.getElementById('set-pass').value; saveSettings(); };

            showSettingsTab(null, 'perfil');
            document.querySelector('.settings-nav-item.active')?.click();
        }
    },
    
    notas: { title:'Notas Rápidas', w:350, h:400,
        html: `<div style="display:flex;flex-direction:column;height:100%;"><div class="toolbar" style="justify-content:space-between"><button class="toolbar-btn" onclick="document.getElementById('notas-area').value='';localStorage.removeItem('deskgo_notas')"><i class="fa-solid fa-trash"></i> Borrar</button><span class="toolbar-info" id="notas-info"></span></div><textarea id="notas-area" style="flex:1;background:#fff9c4;color:#333;border:none;padding:15px;font-family:inherit;font-size:14px;outline:none;resize:none" placeholder="Escribe tus notas aquí..." oninput="localStorage.setItem('deskgo_notas', this.value); document.getElementById('notas-info').textContent='Guardado'"></textarea></div>`,
        onOpen: () => {
            document.getElementById('notas-area').value = localStorage.getItem('deskgo_notas') || '';
            document.getElementById('notas-info').textContent = '';
        }
    },

    papelera: { title:'Papelera', w:550, h:400,
        html: `<div style="display:flex;flex-direction:column;height:100%;"><div class="toolbar"><button class="toolbar-btn" onclick="alert('La papelera está vacía');"><i class="fa-solid fa-trash-can-arrow-up"></i> Vaciar Papelera</button></div><div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);flex-direction:column"><i class="fa-solid fa-trash-can" style="font-size:48px;margin-bottom:15px;opacity:0.5"></i><div>No hay elementos en la papelera</div></div></div>`,
        onOpen: () => {}
    }
};

// ====== OPEN FILE IN EDITOR ======
window.openFileInEditor = async (path) => {
    try {
        const r = await fetch('/api/file/read?path='+encodeURIComponent(path));
        const data = await r.json();
        // Close existing editor if open
        const ex = document.getElementById('window-editor');
        if(ex) ex.remove();
        // Open editor
        createWindow('editor', 'Editor â€” '+data.name, apps.editor.html, apps.editor.w, apps.editor.h);
        if(apps.editor.onOpen) setTimeout(apps.editor.onOpen, 60);
        setTimeout(()=>{
            const area = document.getElementById('editor-area');
            if(area) area.value = data.content;
            window._editorFilePath = path;
            const info = document.getElementById('editor-info');
            if(info) info.textContent = data.name;
            const ep = document.getElementById('editor-path');
            if(ep) ep.textContent = path;
            if(window.updateEditorCount) window.updateEditorCount();
        }, 100);
    } catch(e) { console.error(e); }
};

// ====== DOCK LISTENERS ======
document.querySelectorAll('.dock-item').forEach(item => {
    item.addEventListener('click', () => {
        const id = item.getAttribute('data-app');
        if (id === 'launchpad') {
            toggleLaunchpad();
            return;
        }
        const app = apps[id];
        if(app) { createWindow(id, app.title, app.html, app.w, app.h); if(app.onOpen) setTimeout(app.onOpen, 60); }
    });
});

// ====== LAUNCHPAD OVERLAY ======
window.toggleLaunchpad = () => {
    const overlay = document.getElementById('launchpadOverlay');
    if (!overlay) return;
    
    if (overlay.classList.contains('active')) {
        overlay.classList.remove('active');
    } else {
        overlay.classList.add('active');
        document.getElementById('launchpadSearch').value = '';
        document.getElementById('launchpadSearch').focus();
        loadLaunchpadApps();
    }
};

window.loadLaunchpadApps = () => {
    const grid = document.getElementById('launchpadGrid');
    if (!grid) return;
    grid.innerHTML = '<div style="color:white;font-size:18px;grid-column:1/-1;text-align:center;margin-top:60px;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';
    
    fetch('/api/apps/scan-local').then(r=>r.json()).then(files => {
        window._launchpadFiles = files.sort((a,b) => a.name.localeCompare(b.name));
        renderLaunchpadApps(window._launchpadFiles);
    }).catch(() => {
        grid.innerHTML = '<div style="color:var(--danger);grid-column:1/-1;text-align:center;margin-top:60px;">Error al cargar apps</div>';
    });
};

window.renderLaunchpadApps = (files) => {
    const grid = document.getElementById('launchpadGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    if(!files || files.length === 0) {
        grid.innerHTML = '<div style="color:rgba(255,255,255,0.7);grid-column:1/-1;text-align:center;margin-top:60px;">No se encontraron aplicaciones</div>';
        return;
    }
    
    files.forEach(f => {
        const d = document.createElement('div');
        d.className = 'launchpad-item';
        d.onclick = async (e) => {
            e.stopPropagation();
            try {
                await fetch('/api/apps/run', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({exe: f.path})
                });
                toggleLaunchpad();
            } catch(e) {}
        };
        
        d.innerHTML = `
            <div class="launchpad-icon">
                <i class="fa-brands fa-windows"></i>
            </div>
            <div class="launchpad-name">${f.name}</div>
        `;
        grid.appendChild(d);
    });
};

// Launchpad Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const search = document.getElementById('launchpadSearch');
    if(search) {
        search.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            if(window._launchpadFiles) {
                const filtered = window._launchpadFiles.filter(f => f.name.toLowerCase().includes(q));
                renderLaunchpadApps(filtered);
            }
        });
        search.addEventListener('click', (e) => e.stopPropagation());
    }
    
    const overlay = document.getElementById('launchpadOverlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.classList.contains('launchpad-grid')) {
                toggleLaunchpad();
            }
        });
    }
});

window.toggleControlCenter = () => {
    const cc = document.getElementById('controlCenter');
    if (!cc) return;
    if (cc.classList.contains('active')) {
        cc.classList.remove('active');
    } else {
        cc.classList.add('active');
    }
};

document.addEventListener('click', (e) => {
    const cc = document.getElementById('controlCenter');
    const btn = document.getElementById('control-center-btn');
    if (cc && cc.classList.contains('active')) {
        if (!cc.contains(e.target) && btn && !btn.contains(e.target)) {
            cc.classList.remove('active');
        }
    }
});

// ====== DESKTOP ICONS LOGIC ======
window.desktopIcons = JSON.parse(localStorage.getItem('deskgo_desktop_icons') || '[]');

window.saveDesktopIcons = () => {
    localStorage.setItem('deskgo_desktop_icons', JSON.stringify(window.desktopIcons));
};

window.addDesktopIcon = (path, name, isFolder) => {
    // Check if it already exists
    if (window.desktopIcons.some(i => i.path === path)) {
        return; // Already added
    }
    window.desktopIcons.push({ path, name, isFolder });
    window.saveDesktopIcons();
    window.renderDesktopIcons();
};

window.removeDesktopIcon = (path, event) => {
    event.stopPropagation();
    window.desktopIcons = window.desktopIcons.filter(i => i.path !== path);
    window.saveDesktopIcons();
    window.renderDesktopIcons();
};

window.renderDesktopIcons = () => {
    const container = document.getElementById('desktop-icons-container');
    if (!container) return;
    container.innerHTML = '';
    
    window.desktopIcons.forEach(item => {
        const d = document.createElement('div');
        d.className = 'desktop-icon-item';
        
        // Make it clickable to open the file/folder
        d.onclick = () => {
            if (item.isFolder) {
                // Open file explorer at this path
                createWindow('explorador', apps.explorador.title, apps.explorador.html, apps.explorador.w, apps.explorador.h);
                if(apps.explorador.onOpen) setTimeout(() => {
                    apps.explorador.onOpen();
                    window.loadFiles(item.path);
                }, 60);
            } else if (isTextFile(item.name)) {
                openFileInEditor(item.path);
            } else if (item.name.toLowerCase().endsWith('.exe')) {
                // Try to run executable if it is an exe
                fetch('/api/apps/run', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({exe: item.path})
                });
            } else {
                alert('No se puede abrir este tipo de archivo directamente.');
            }
        };
        
        d.innerHTML = `
            <i class="${fileIcon(item.name, item.isFolder)}" style="font-size:36px;color:${fileColor(item.name, item.isFolder)}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));"></i>
            <div style="margin-top:6px;font-size:12px;color:white;text-align:center;word-break:break-all;line-height:1.2;text-shadow: 0 1px 3px rgba(0,0,0,0.8);">${item.name}</div>
            <button class="remove-desktop-btn" onclick="removeDesktopIcon('${item.path.replace(/\\/g, '\\\\')}', event)" title="Eliminar del escritorio"><i class="fa-solid fa-xmark"></i></button>
        `;
        container.appendChild(d);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    // Initial render of desktop icons
    window.renderDesktopIcons();
});
