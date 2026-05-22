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
    },

    calculadora: { title:'Calculadora', w:300, h:400,
        html: `<div style="display:flex;flex-direction:column;height:100%;background:#222;color:white;border-radius:0 0 10px 10px;padding:15px;box-sizing:border-box;">
            <div id="calc-display" style="flex:1;display:flex;align-items:flex-end;justify-content:flex-end;font-size:36px;padding:10px;margin-bottom:10px;overflow:hidden;background:rgba(255,255,255,0.05);border-radius:8px;">0</div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
                <button class="calc-btn" onclick="calcPress('C')" style="background:#ff3b30;color:white;border:none;border-radius:8px;padding:15px;font-size:18px;cursor:pointer;">C</button>
                <button class="calc-btn" onclick="calcPress('/')" style="background:#ff9500;color:white;border:none;border-radius:8px;padding:15px;font-size:18px;cursor:pointer;">/</button>
                <button class="calc-btn" onclick="calcPress('*')" style="background:#ff9500;color:white;border:none;border-radius:8px;padding:15px;font-size:18px;cursor:pointer;">x</button>
                <button class="calc-btn" onclick="calcPress('-')" style="background:#ff9500;color:white;border:none;border-radius:8px;padding:15px;font-size:18px;cursor:pointer;">-</button>
                <button class="calc-btn" onclick="calcPress('7')" style="background:#333;color:white;border:none;border-radius:8px;padding:15px;font-size:18px;cursor:pointer;">7</button>
                <button class="calc-btn" onclick="calcPress('8')" style="background:#333;color:white;border:none;border-radius:8px;padding:15px;font-size:18px;cursor:pointer;">8</button>
                <button class="calc-btn" onclick="calcPress('9')" style="background:#333;color:white;border:none;border-radius:8px;padding:15px;font-size:18px;cursor:pointer;">9</button>
                <button class="calc-btn" onclick="calcPress('+')" style="background:#ff9500;color:white;border:none;border-radius:8px;padding:15px;font-size:18px;cursor:pointer;grid-row:span 2">+</button>
                <button class="calc-btn" onclick="calcPress('4')" style="background:#333;color:white;border:none;border-radius:8px;padding:15px;font-size:18px;cursor:pointer;">4</button>
                <button class="calc-btn" onclick="calcPress('5')" style="background:#333;color:white;border:none;border-radius:8px;padding:15px;font-size:18px;cursor:pointer;">5</button>
                <button class="calc-btn" onclick="calcPress('6')" style="background:#333;color:white;border:none;border-radius:8px;padding:15px;font-size:18px;cursor:pointer;">6</button>
                <button class="calc-btn" onclick="calcPress('1')" style="background:#333;color:white;border:none;border-radius:8px;padding:15px;font-size:18px;cursor:pointer;">1</button>
                <button class="calc-btn" onclick="calcPress('2')" style="background:#333;color:white;border:none;border-radius:8px;padding:15px;font-size:18px;cursor:pointer;">2</button>
                <button class="calc-btn" onclick="calcPress('3')" style="background:#333;color:white;border:none;border-radius:8px;padding:15px;font-size:18px;cursor:pointer;">3</button>
                <button class="calc-btn" onclick="calcPress('=')" style="background:#ff9500;color:white;border:none;border-radius:8px;padding:15px;font-size:18px;cursor:pointer;grid-row:span 2">=</button>
                <button class="calc-btn" onclick="calcPress('0')" style="background:#333;color:white;border:none;border-radius:8px;padding:15px;font-size:18px;cursor:pointer;grid-column:span 2">0</button>
                <button class="calc-btn" onclick="calcPress('.')" style="background:#333;color:white;border:none;border-radius:8px;padding:15px;font-size:18px;cursor:pointer;">.</button>
            </div>
        </div>`,
        onOpen: () => {
            window.calcExpr = '';
            window.calcPress = (v) => {
                const d = document.getElementById('calc-display');
                if(!d) return;
                if(v === 'C') { window.calcExpr = ''; d.textContent = '0'; }
                else if(v === '=') {
                    try { 
                        window.calcExpr = eval(window.calcExpr).toString(); 
                        d.textContent = window.calcExpr;
                    } catch(e) { d.textContent = 'Error'; window.calcExpr = ''; }
                } else {
                    if(window.calcExpr === '0' && v !== '.') window.calcExpr = '';
                    window.calcExpr += v;
                    d.textContent = window.calcExpr;
                }
            };
        }
    },

    reproductor: { title:'Media Player', w:400, h:500,
        html: `<div style="display:flex;flex-direction:column;height:100%;background:#111;color:white;border-radius:0 0 10px 10px;">
            <div style="flex:1;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg, #1e1e1e, #000);position:relative;overflow:hidden;">
                <i class="fa-solid fa-music" style="font-size:80px;color:var(--accent-primary);filter:drop-shadow(0 0 20px var(--accent-primary));"></i>
            </div>
            <div style="padding:20px;">
                <div style="font-size:18px;font-weight:bold;margin-bottom:5px;">DeskGo Tunes</div>
                <div style="font-size:12px;color:#aaa;margin-bottom:20px;">No hay música reproduciéndose</div>
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:15px;">
                    <span style="font-size:10px;color:#888;">0:00</span>
                    <input type="range" min="0" max="100" value="0" style="flex:1;height:4px;border-radius:2px;appearance:none;background:#333;outline:none;">
                    <span style="font-size:10px;color:#888;">0:00</span>
                </div>
                <div style="display:flex;justify-content:center;gap:30px;align-items:center;">
                    <button style="background:none;border:none;color:white;font-size:20px;cursor:pointer;"><i class="fa-solid fa-backward-step"></i></button>
                    <button style="background:white;border:none;color:black;font-size:24px;cursor:pointer;width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;" onclick="alert('Selecciona un archivo de audio con el explorador para reproducir.')"><i class="fa-solid fa-play"></i></button>
                    <button style="background:none;border:none;color:white;font-size:20px;cursor:pointer;"><i class="fa-solid fa-forward-step"></i></button>
                </div>
            </div>
        </div>`,
        onOpen: () => {}
    },

    reloj: { title:'Reloj Mundial', w:350, h:450,
        html: `<div style="display:flex;flex-direction:column;height:100%;border-radius:0 0 10px 10px;background:var(--glass-bg);padding:20px;">
            <div style="text-align:center;margin-bottom:30px;margin-top:20px;">
                <div id="reloj-grande" style="font-size:48px;font-weight:300;font-variant-numeric:tabular-nums;">--:--:--</div>
                <div id="reloj-fecha" style="font-size:14px;color:var(--text-secondary);margin-top:5px;">Cargando...</div>
            </div>
            <div style="font-weight:bold;margin-bottom:15px;font-size:14px;">Zonas Horarias</div>
            <div style="display:flex;justify-content:space-between;padding:10px;background:rgba(255,255,255,0.05);border-radius:8px;margin-bottom:10px;">
                <div><div>Nueva York</div><div style="font-size:11px;color:var(--text-tertiary)">Hoy</div></div>
                <div id="tz-ny" style="font-size:18px;">--:--</div>
            </div>
            <div style="display:flex;justify-content:space-between;padding:10px;background:rgba(255,255,255,0.05);border-radius:8px;margin-bottom:10px;">
                <div><div>Londres</div><div style="font-size:11px;color:var(--text-tertiary)">Hoy</div></div>
                <div id="tz-lon" style="font-size:18px;">--:--</div>
            </div>
            <div style="display:flex;justify-content:space-between;padding:10px;background:rgba(255,255,255,0.05);border-radius:8px;">
                <div><div>Tokio</div><div style="font-size:11px;color:var(--text-tertiary)">Mañana</div></div>
                <div id="tz-tok" style="font-size:18px;">--:--</div>
            </div>
        </div>`,
        onOpen: () => {
            const updateReloj = () => {
                if(!document.getElementById('reloj-grande')) return;
                const d = new Date();
                document.getElementById('reloj-grande').textContent = d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
                document.getElementById('reloj-fecha').textContent = d.toLocaleDateString([], {weekday:'long', year:'numeric', month:'long', day:'numeric'});
                
                document.getElementById('tz-ny').textContent = d.toLocaleTimeString('en-US', {timeZone:'America/New_York', hour:'2-digit', minute:'2-digit', hour12:false});
                document.getElementById('tz-lon').textContent = d.toLocaleTimeString('en-GB', {timeZone:'Europe/London', hour:'2-digit', minute:'2-digit', hour12:false});
                document.getElementById('tz-tok').textContent = d.toLocaleTimeString('ja-JP', {timeZone:'Asia/Tokyo', hour:'2-digit', minute:'2-digit', hour12:false});
            };
            updateReloj();
            if(window.relojInterval) clearInterval(window.relojInterval);
            window.relojInterval = setInterval(updateReloj, 1000);
        }
    },

    monitor: { title:'Monitor de Recursos', w:400, h:300,
        html: `<div style="padding:20px;height:100%;box-sizing:border-box;">
            <div style="margin-bottom:20px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:5px;font-size:14px;"><span>Uso de CPU</span><span id="cpu-val">--%</span></div>
                <div style="width:100%;height:10px;background:rgba(255,255,255,0.1);border-radius:5px;overflow:hidden;">
                    <div id="cpu-bar" style="height:100%;background:var(--accent-primary);width:0%;transition:width 0.5s ease;"></div>
                </div>
            </div>
            <div style="margin-bottom:20px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:5px;font-size:14px;"><span>Uso de RAM</span><span id="ram-val">--%</span></div>
                <div style="width:100%;height:10px;background:rgba(255,255,255,0.1);border-radius:5px;overflow:hidden;">
                    <div id="ram-bar" style="height:100%;background:#34e89e;width:0%;transition:width 0.5s ease;"></div>
                </div>
            </div>
            <div style="font-size:12px;color:var(--text-secondary);">Simulando carga de sistema. La API de navegador no permite leer la CPU real.</div>
        </div>`,
        onOpen: () => {
            const updateMonitor = () => {
                if(!document.getElementById('cpu-bar')) return;
                const cpu = Math.floor(Math.random() * 20) + 5; // 5-25%
                const ram = Math.floor(Math.random() * 10) + 40; // 40-50%
                document.getElementById('cpu-bar').style.width = cpu + '%';
                document.getElementById('cpu-val').textContent = cpu + '%';
                document.getElementById('ram-bar').style.width = ram + '%';
                document.getElementById('ram-val').textContent = ram + '%';
            };
            updateMonitor();
            if(window.monitorInterval) clearInterval(window.monitorInterval);
            window.monitorInterval = setInterval(updateMonitor, 2000);
        }
    },

    grabadora: { title:'Grabadora de Voz', w:350, h:250,
        html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:#1a1a1a;">
            <div id="rec-time" style="font-size:36px;font-weight:300;margin-bottom:20px;font-variant-numeric:tabular-nums;color:white;">00:00</div>
            <button id="rec-btn" style="width:60px;height:60px;border-radius:50%;background:#ff3b30;border:4px solid white;cursor:pointer;outline:none;" onclick="toggleRecord()"></button>
            <div style="margin-top:20px;font-size:12px;color:#aaa;">Haz clic para grabar</div>
        </div>`,
        onOpen: () => {
            window.recSeconds = 0;
            window.isRecording = false;
            window.recInterval = null;
            window.toggleRecord = () => {
                const btn = document.getElementById('rec-btn');
                const time = document.getElementById('rec-time');
                if(!window.isRecording) {
                    window.isRecording = true;
                    btn.style.borderRadius = '20%';
                    window.recSeconds = 0;
                    window.recInterval = setInterval(() => {
                        window.recSeconds++;
                        const m = String(Math.floor(window.recSeconds / 60)).padStart(2, '0');
                        const s = String(window.recSeconds % 60).padStart(2, '0');
                        time.textContent = m + ':' + s;
                    }, 1000);
                    if(window.showNotification) showNotification('Grabando', 'La grabadora ha iniciado.', 'fa-microphone');
                } else {
                    window.isRecording = false;
                    btn.style.borderRadius = '50%';
                    clearInterval(window.recInterval);
                    if(window.showNotification) showNotification('Grabación Detenida', 'Audio guardado (simulado).', 'fa-check');
                }
            };
        }
    },

    juego: { title:'Snake Retro', w:400, h:450,
        html: `<div style="display:flex;flex-direction:column;align-items:center;background:#222;height:100%;padding-top:20px;">
            <div style="color:#0f0;font-family:monospace;font-size:24px;margin-bottom:10px;">SNAKE</div>
            <canvas id="snake-canvas" width="300" height="300" style="background:#000;border:2px solid #0f0;"></canvas>
            <div style="color:white;font-size:12px;margin-top:15px;">Usa las flechas del teclado para jugar.</div>
        </div>`,
        onOpen: () => {
            const canvas = document.getElementById('snake-canvas');
            if(!canvas) return;
            const ctx = canvas.getContext('2d');
            const box = 15;
            let snake = [{x: 9 * box, y: 10 * box}];
            let food = {x: Math.floor(Math.random()*19+1)*box, y: Math.floor(Math.random()*19+1)*box};
            let d;
            let score = 0;
            
            const keyHandler = (e) => {
                if(e.keyCode === 37 && d !== 'RIGHT') d = 'LEFT';
                else if(e.keyCode === 38 && d !== 'DOWN') d = 'UP';
                else if(e.keyCode === 39 && d !== 'LEFT') d = 'RIGHT';
                else if(e.keyCode === 40 && d !== 'UP') d = 'DOWN';
            };
            document.addEventListener('keydown', keyHandler);
            
            const draw = () => {
                if(!document.getElementById('snake-canvas')) {
                    clearInterval(window.snakeGame);
                    document.removeEventListener('keydown', keyHandler);
                    return;
                }
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, 300, 300);
                
                for(let i = 0; i < snake.length; i++) {
                    ctx.fillStyle = (i === 0) ? '#0f0' : '#0a0';
                    ctx.fillRect(snake[i].x, snake[i].y, box, box);
                }
                
                ctx.fillStyle = 'red';
                ctx.fillRect(food.x, food.y, box, box);
                
                let snakeX = snake[0].x;
                let snakeY = snake[0].y;
                
                if(d === 'LEFT') snakeX -= box;
                if(d === 'UP') snakeY -= box;
                if(d === 'RIGHT') snakeX += box;
                if(d === 'DOWN') snakeY += box;
                
                if(snakeX === food.x && snakeY === food.y) {
                    score++;
                    food = {x: Math.floor(Math.random()*19+1)*box, y: Math.floor(Math.random()*19+1)*box};
                } else {
                    snake.pop();
                }
                
                let newHead = {x: snakeX, y: snakeY};
                
                if(snakeX < 0 || snakeX >= 300 || snakeY < 0 || snakeY >= 300) {
                    clearInterval(window.snakeGame);
                    ctx.fillStyle = 'white';
                    ctx.font = '20px monospace';
                    ctx.fillText('Game Over', 100, 150);
                    return;
                }
                
                snake.unshift(newHead);
            };
            
            if(window.snakeGame) clearInterval(window.snakeGame);
            window.snakeGame = setInterval(draw, 120);
        }
    },

    galeria: { title:'Galería', w:600, h:450,
        html: `<div style="display:flex;flex-direction:column;height:100%;background:var(--glass-bg);">
            <div class="toolbar" style="border-bottom:1px solid var(--glass-border);">
                <span class="toolbar-info" style="font-weight:600">Mis Fotos</span>
            </div>
            <div style="padding:15px;display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:15px;overflow-y:auto;height:calc(100% - 40px);">
                <div style="height:120px;border-radius:8px;background:url('wallpaper.png') center/cover;box-shadow:var(--shadow-sm);"></div>
                <div style="height:120px;border-radius:8px;background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);box-shadow:var(--shadow-sm);"></div>
                <div style="height:120px;border-radius:8px;background:linear-gradient(135deg,#1a2a6c,#b21f1f,#fdbb2d);box-shadow:var(--shadow-sm);"></div>
                <div style="height:120px;border-radius:8px;background:linear-gradient(135deg,#11998e,#38ef7d);box-shadow:var(--shadow-sm);"></div>
                <div style="height:120px;border-radius:8px;background:#ddd;display:flex;align-items:center;justify-content:center;color:#888;"><i class="fa-solid fa-plus fa-2x"></i></div>
            </div>
        </div>`,
        onOpen: () => {}
    },

    calendario: { title:'Calendario', w:400, h:450,
        html: `<div style="display:flex;flex-direction:column;height:100%;background:var(--glass-bg);color:var(--text-primary);padding:15px;box-sizing:border-box;">
            <div style="text-align:center;font-size:24px;font-weight:600;margin-bottom:15px;color:var(--accent-primary);" id="cal-month">Mes Año</div>
            <div style="display:grid;grid-template-columns:repeat(7,1fr);text-align:center;font-weight:bold;margin-bottom:10px;font-size:12px;color:var(--text-secondary);">
                <div>L</div><div>M</div><div>X</div><div>J</div><div>V</div><div>S</div><div>D</div>
            </div>
            <div id="cal-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px;text-align:center;font-size:14px;"></div>
        </div>`,
        onOpen: () => {
            const grid = document.getElementById('cal-grid');
            if(!grid) return;
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            document.getElementById('cal-month').textContent = monthNames[month] + ' ' + year;
            
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const startDay = firstDay === 0 ? 6 : firstDay - 1;
            
            grid.innerHTML = '';
            for(let i = 0; i < startDay; i++) {
                grid.innerHTML += '<div></div>';
            }
            for(let i = 1; i <= daysInMonth; i++) {
                const isToday = i === now.getDate() ? 'background:var(--accent-primary);color:white;border-radius:50%;' : 'background:rgba(255,255,255,0.05);border-radius:50%;';
                grid.innerHTML += `<div style="padding:10px 0;cursor:pointer;${isToday}">${i}</div>`;
            }
        }
    },

    tiempo: { title:'Clima', w:350, h:400,
        html: `<div style="display:flex;flex-direction:column;align-items:center;height:100%;background:linear-gradient(to bottom, #4facfe 0%, #00f2fe 100%);color:white;padding:30px;box-sizing:border-box;">
            <div style="font-size:24px;font-weight:600;margin-bottom:5px;">Madrid</div>
            <div style="font-size:14px;margin-bottom:20px;opacity:0.9;">Cielo despejado</div>
            <i class="fa-solid fa-sun" style="font-size:72px;color:#FFD700;margin-bottom:20px;filter:drop-shadow(0 0 20px rgba(255,215,0,0.5));"></i>
            <div style="font-size:64px;font-weight:300;margin-bottom:30px;">22°</div>
            <div style="display:flex;justify-content:space-between;width:100%;font-size:14px;background:rgba(0,0,0,0.2);padding:15px;border-radius:12px;">
                <div style="text-align:center;"><i class="fa-solid fa-wind" style="margin-bottom:5px;display:block;"></i>12 km/h</div>
                <div style="text-align:center;"><i class="fa-solid fa-droplet" style="margin-bottom:5px;display:block;"></i>45%</div>
                <div style="text-align:center;"><i class="fa-solid fa-temperature-half" style="margin-bottom:5px;display:block;"></i>Max 25°</div>
            </div>
            <div style="font-size:10px;margin-top:20px;opacity:0.6;">Datos simulados</div>
        </div>`,
        onOpen: () => {}
    },

    terminal: { title:'Terminal', w:550, h:400,
        html: `<div style="display:flex;flex-direction:column;height:100%;background:#0c0c0c;color:#0f0;font-family:monospace;font-size:14px;padding:10px;box-sizing:border-box;border-radius:0 0 8px 8px;">
            <div id="term-output" style="flex:1;overflow-y:auto;white-space:pre-wrap;margin-bottom:10px;">DeskGo OS Terminal v1.0.0
Type 'help' for a list of available commands.
</div>
            <div style="display:flex;">
                <span style="color:#0f0;margin-right:8px;">C:\\DeskGo&gt;</span>
                <input type="text" id="term-input" style="flex:1;background:transparent;border:none;color:#0f0;font-family:monospace;font-size:14px;outline:none;" onkeydown="if(event.key==='Enter') executeCommand(this.value)" autocomplete="off">
            </div>
        </div>`,
        onOpen: () => {
            document.getElementById('term-input').focus();
            window.executeCommand = (cmd) => {
                const out = document.getElementById('term-output');
                const input = document.getElementById('term-input');
                if(!out || !input) return;
                
                out.innerHTML += \`\\nC:\\\\DeskGo&gt; \${cmd}\\n\`;
                
                const c = cmd.trim().toLowerCase();
                if(c === 'help') {
                    out.innerHTML += 'Available commands: help, clear, date, echo [text], whoami, ver\\n';
                } else if(c === 'clear' || c === 'cls') {
                    out.innerHTML = 'DeskGo OS Terminal v1.0.0\\n';
                } else if(c === 'date') {
                    out.innerHTML += new Date().toString() + '\\n';
                } else if(c.startsWith('echo ')) {
                    out.innerHTML += cmd.substring(5) + '\\n';
                } else if(c === 'whoami') {
                    out.innerHTML += (window.userSettings && window.userSettings.name ? window.userSettings.name : 'user') + '\\n';
                } else if(c === 'ver') {
                    out.innerHTML += 'DeskGo OS Version 1.0\\n';
                } else if(c !== '') {
                    out.innerHTML += \`'\${c}' is not recognized as an internal or external command.\\n\`;
                }
                
                input.value = '';
                out.scrollTop = out.scrollHeight;
            };
        }
    },

    pintar: { title:'Pintar', w:600, h:500,
        html: `<div style="display:flex;flex-direction:column;height:100%;background:#f0f0f0;border-radius:0 0 10px 10px;overflow:hidden;">
            <div class="toolbar" style="background:white;border-bottom:1px solid #ccc;gap:10px;padding:10px;">
                <input type="color" id="paint-color" value="#000000" style="width:30px;height:30px;padding:0;border:none;cursor:pointer;">
                <input type="range" id="paint-size" min="1" max="20" value="3" style="width:80px;">
                <button class="toolbar-btn" onclick="clearCanvas()"><i class="fa-solid fa-eraser"></i> Limpiar</button>
            </div>
            <canvas id="paint-canvas" style="flex:1;background:white;cursor:crosshair;"></canvas>
        </div>`,
        onOpen: () => {
            const canvas = document.getElementById('paint-canvas');
            if(!canvas) return;
            // Set actual size
            setTimeout(() => {
                const rect = canvas.parentElement.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height - 50; 
                
                const ctx = canvas.getContext('2d');
                let isDrawing = false;
                let lastX = 0;
                let lastY = 0;
                
                const draw = (e) => {
                    if(!isDrawing) return;
                    const color = document.getElementById('paint-color').value;
                    const size = document.getElementById('paint-size').value;
                    const cRect = canvas.getBoundingClientRect();
                    const x = e.clientX - cRect.left;
                    const y = e.clientY - cRect.top;
                    
                    ctx.beginPath();
                    ctx.moveTo(lastX, lastY);
                    ctx.lineTo(x, y);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = size;
                    ctx.lineCap = 'round';
                    ctx.stroke();
                    
                    lastX = x;
                    lastY = y;
                };
                
                canvas.addEventListener('mousedown', (e) => {
                    isDrawing = true;
                    const cRect = canvas.getBoundingClientRect();
                    lastX = e.clientX - cRect.left;
                    lastY = e.clientY - cRect.top;
                });
                canvas.addEventListener('mousemove', draw);
                canvas.addEventListener('mouseup', () => isDrawing = false);
                canvas.addEventListener('mouseout', () => isDrawing = false);
                
                window.clearCanvas = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); };
            }, 100);
        }
    },

    tresenraya: { title:'Tres en Raya', w:350, h:400,
        html: `<div style="display:flex;flex-direction:column;align-items:center;background:#1e1e1e;color:white;height:100%;padding:20px;box-sizing:border-box;border-radius:0 0 10px 10px;">
            <div style="font-size:24px;font-weight:bold;margin-bottom:20px;color:var(--accent-primary);">Tic Tac Toe</div>
            <div id="ttt-status" style="margin-bottom:15px;font-size:16px;">Turno de: <span style="color:#ff3b30">X</span></div>
            <div id="ttt-board" style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;background:#444;padding:5px;border-radius:10px;">
                \${Array(9).fill().map((_,i) => \`<div class="ttt-cell" onclick="tttClick(\${i})" style="width:80px;height:80px;background:#222;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:48px;font-weight:bold;cursor:pointer;transition:background 0.2s;"></div>\`).join('')}
            </div>
            <button onclick="tttReset()" style="margin-top:20px;padding:10px 20px;background:var(--accent-primary);color:white;border:none;border-radius:20px;cursor:pointer;font-weight:bold;">Reiniciar</button>
        </div>`,
        onOpen: () => {
            window.tttBoard = Array(9).fill('');
            window.tttCurrent = 'X';
            window.tttActive = true;
            
            window.tttClick = (i) => {
                if(!window.tttActive || window.tttBoard[i] !== '') return;
                
                window.tttBoard[i] = window.tttCurrent;
                const cells = document.querySelectorAll('.ttt-cell');
                cells[i].textContent = window.tttCurrent;
                cells[i].style.color = window.tttCurrent === 'X' ? '#ff3b30' : '#34c759';
                
                checkWin();
            };
            
            const checkWin = () => {
                const winCond = [
                    [0,1,2], [3,4,5], [6,7,8],
                    [0,3,6], [1,4,7], [2,5,8],
                    [0,4,8], [2,4,6]
                ];
                let won = false;
                for(let c of winCond) {
                    if(window.tttBoard[c[0]] && window.tttBoard[c[0]] === window.tttBoard[c[1]] && window.tttBoard[c[0]] === window.tttBoard[c[2]]) {
                        won = true; break;
                    }
                }
                
                const status = document.getElementById('ttt-status');
                if(won) {
                    status.innerHTML = \`¡Ganador: <span style="color:\${window.tttCurrent === 'X' ? '#ff3b30' : '#34c759'}">\${window.tttCurrent}</span>!\`;
                    window.tttActive = false;
                } else if(!window.tttBoard.includes('')) {
                    status.textContent = '¡Empate!';
                    window.tttActive = false;
                } else {
                    window.tttCurrent = window.tttCurrent === 'X' ? 'O' : 'X';
                    status.innerHTML = \`Turno de: <span style="color:\${window.tttCurrent === 'X' ? '#ff3b30' : '#34c759'}">\${window.tttCurrent}</span>\`;
                }
            };
            
            window.tttReset = () => {
                window.tttBoard = Array(9).fill('');
                window.tttCurrent = 'X';
                window.tttActive = true;
                document.querySelectorAll('.ttt-cell').forEach(c => c.textContent = '');
                document.getElementById('ttt-status').innerHTML = \`Turno de: <span style="color:#ff3b30">X</span>\`;
            };
        }
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
