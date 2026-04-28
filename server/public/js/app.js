/* ================================================
   AROMA A CAFÉ — app.js
   Sistema de Gestión Frontend
   ================================================ */

const API = '/api';

// =============================================
// ESTADO GLOBAL
// =============================================
let state = {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    panelActivo: null,
    productos: [],       // cache local de productos
    pedidoItems: [],     // items del modal de pedido en curso
    confirmCallback: null,
};

// =============================================
// MAPEO DE ROLES → MENÚ Y PERMISOS
// =============================================
const ROL_MENU = {
    administrador: [
        { id: 'pedidos',      icon: '📋', label: 'Pedidos' },
        { id: 'productos',    icon: '☕', label: 'Catálogo de Productos' },
        { id: 'usuarios',     icon: '👥', label: 'Usuarios' },
        { id: 'insumos',      icon: '📦', label: 'Inventario' },
        { id: 'mermas',       icon: '🗑️', label: 'Mermas' },
        { id: 'caja',         icon: '💰', label: 'Caja' },
        { id: 'movimientos',  icon: '💳', label: 'Movimientos' },
        { id: 'reportes',     icon: '📊', label: 'Reportes' },
    ],
    cajero: [
        { id: 'pedidos', icon: '📋', label: 'Pedidos' },
        { id: 'caja',    icon: '💰', label: 'Caja' },
    ],
    mesero: [
        { id: 'pedidos', icon: '📋', label: 'Pedidos / Mesas' },
    ],
    barra: [
        { id: 'produccion', icon: '🍵', label: 'Comandas — Barra' },
    ],
    cocina: [
        { id: 'produccion', icon: '🍳', label: 'Comandas — Cocina' },
    ],
};

// Qué estados puede cambiar cada rol en pedidos
const ACCIONES_ROL = {
    administrador: ['en preparación', 'listo', 'entregado'],
    cajero:        ['entregado'],
    mesero:        ['entregado'],
    barra:         ['en preparación', 'listo'],
    cocina:        ['en preparación', 'listo'],
};

// Categorías visibles por rol en producción
const CATEGORIAS_ROL = {
    barra:  ['Bebidas Calientes', 'Bebidas Frías'],
    cocina: ['Alimentos'],
};

// =============================================
// UTILIDADES
// =============================================
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function fmt(n) {
    return '$' + parseFloat(n || 0).toFixed(2);
}

function fmtFecha(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
}

function iniciales(nombre) {
    return (nombre || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// =============================================
// TOAST NOTIFICATIONS
// =============================================
function toast(msg, tipo = 'default', duracion = 3000) {
    const cont = $('#toast-container');
    const el = document.createElement('div');
    el.className = `toast toast--${tipo}`;
    el.textContent = msg;
    cont.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(12px)';
        el.style.transition = '0.3s ease';
        setTimeout(() => el.remove(), 300);
    }, duracion);
}

// =============================================
// API FETCH HELPER
// =============================================
async function apiFetch(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

    const res = await fetch(API + endpoint, { ...options, headers });

    if (res.status === 401) {
        logout();
        throw new Error('Sesión expirada');
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.message || data.error || `Error ${res.status}`);
    }
    return data;
}

// =============================================
// MODALES
// =============================================
function abrirModal(id) {
    $('#modal-overlay').classList.remove('hidden');
    $('#modal-overlay').classList.add('active');
    $(`#${id}`).classList.remove('hidden');
}

function cerrarModal(id) {
    $(`#${id}`).classList.add('hidden');
    // Si no hay ningún modal visible, ocultamos el overlay
    const abiertos = $$('.modal:not(.hidden)', $('#modal-overlay'));
    if (abiertos.length === 0) {
        $('#modal-overlay').classList.add('hidden');
        $('#modal-overlay').classList.remove('active');
    }
}

function cerrarTodosModales() {
    $$('.modal').forEach(m => m.classList.add('hidden'));
    $('#modal-overlay').classList.add('hidden');
    $('#modal-overlay').classList.remove('active');
}

function confirmar(titulo, mensaje, callback) {
    $('#confirm-title').textContent = titulo;
    $('#confirm-message').textContent = mensaje;
    state.confirmCallback = callback;
    abrirModal('modal-confirm');
}

// =============================================
// AUTENTICACIÓN
// =============================================
async function login() {
    const usuario   = $('#input-usuario').value.trim();
    const contrasena = $('#input-contrasena').value;
    const errEl     = $('#login-error');
    const btnEl     = $('#btn-login');
    const txtEl     = $('.btn-text', btnEl);
    const spinEl    = $('.btn-spinner', btnEl);

    if (!usuario || !contrasena) {
        errEl.textContent = 'Por favor completa todos los campos.';
        errEl.classList.remove('hidden');
        return;
    }

    errEl.classList.add('hidden');
    txtEl.classList.add('hidden');
    spinEl.classList.remove('hidden');
    btnEl.disabled = true;

    try {
        const data = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ nombre_usuario: usuario, contrasena }),
        });

        state.token = data.token;
        state.user  = data.user;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        iniciarApp();
    } catch (err) {
        errEl.textContent = err.message || 'Credenciales incorrectas.';
        errEl.classList.remove('hidden');
    } finally {
        txtEl.classList.remove('hidden');
        spinEl.classList.add('hidden');
        btnEl.disabled = false;
    }
}

function logout() {
    state.token = null;
    state.user  = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    $('#screen-app').classList.add('hidden');
    $('#screen-app').classList.remove('active');
    $('#screen-login').classList.remove('hidden');
    $('#screen-login').classList.add('active');
    $('#input-usuario').value = '';
    $('#input-contrasena').value = '';
}

// =============================================
// INICIAR APP TRAS LOGIN
// =============================================
function iniciarApp() {
    $('#screen-login').classList.add('hidden');
    $('#screen-login').classList.remove('active');
    $('#screen-app').classList.remove('hidden');
    $('#screen-app').classList.add('active');

    const { user } = state;
    const rol = user.rol;

    // Rellenar sidebar info
    $('#sidebar-rol').textContent  = rol;
    $('#sidebar-nombre').textContent = user.nombre;
    $('#sidebar-rol-badge').textContent = rol;
    $('#sidebar-avatar').textContent = iniciales(user.nombre);
    $('#topbar-avatar').textContent  = iniciales(user.nombre);

    // Construir menú según rol
    construirMenu(rol);

    // Navegar al primer panel disponible
    const items = ROL_MENU[rol] || [];
    if (items.length > 0) navegarPanel(items[0].id);
}

function construirMenu(rol) {
    const nav   = $('#sidebar-nav');
    nav.innerHTML = '';
    const items = ROL_MENU[rol] || [];

    items.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'nav-item';
        btn.dataset.panel = item.id;
        btn.innerHTML = `<span class="nav-item__icon">${item.icon}</span><span>${item.label}</span>`;
        btn.addEventListener('click', () => navegarPanel(item.id));
        nav.appendChild(btn);
    });
}

// =============================================
// NAVEGACIÓN DE PANELES
// =============================================
function navegarPanel(id) {
    // Ocultar todos los paneles
    $$('.panel').forEach(p => p.classList.add('hidden'));

    // Mostrar panel objetivo
    const panel = $(`#panel-${id}`);
    if (panel) panel.classList.remove('hidden');

    // Actualizar nav activo
    $$('.nav-item').forEach(btn => {
        btn.classList.toggle('nav-item--active', btn.dataset.panel === id);
    });

    // Cerrar sidebar en móvil
    $('#sidebar').classList.remove('sidebar--open');

    // Actualizar título topbar
    const menuItems = ROL_MENU[state.user?.rol] || [];
    const item = menuItems.find(i => i.id === id);
    $('#topbar-title').textContent = item?.label || 'Panel';

    state.panelActivo = id;

    // Cargar datos del panel
    cargarPanel(id);
}

async function cargarPanel(id) {
    try {
        switch (id) {
            case 'pedidos':     await cargarPedidos(); break;
            case 'produccion':  await cargarProduccion(); break;
            case 'productos':   await cargarProductos(); break;
            case 'usuarios':    await cargarUsuarios(); break;
            case 'insumos':     await cargarInsumos(); break;
            case 'mermas':      await cargarMermas(); break;
            case 'caja':        await cargarCaja(); break;
            case 'movimientos': await cargarMovimientos(); break;
            case 'reportes':    await cargarReportes(); break;
        }
    } catch (err) {
        toast(err.message, 'error');
    }
}

// =============================================
// PANEL: PEDIDOS
// =============================================
let filtroEstado = 'todos';

async function cargarPedidos() {
    const pedidos = await apiFetch('/pedidos');
    renderPedidos(pedidos);

    // Mesero ve las mesas, cajero la lista
    const rol = state.user.rol;
    if (rol === 'mesero') {
        $('#vista-mesas').classList.remove('hidden');
        $('#lista-pedidos').classList.add('hidden');
        renderMesas(pedidos);
    } else {
        $('#vista-mesas').classList.add('hidden');
        $('#lista-pedidos').classList.remove('hidden');
    }
}

function renderPedidos(pedidos) {
    const lista = $('#lista-pedidos');
    const empty = $('#pedidos-empty');

    // Filtrar
    const filtrados = filtroEstado === 'todos'
        ? pedidos
        : pedidos.filter(p => p.estado === filtroEstado);

    // Limpiar (excepto empty state)
    $$('.pedido-card').forEach(el => el.remove());

    if (filtrados.length === 0) {
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');

    const rol = state.user.rol;
    const accionesDisponibles = ACCIONES_ROL[rol] || [];

    filtrados.forEach(p => {
        const card = document.createElement('div');
        card.className = 'pedido-card';

        const estadoClass = {
            'pendiente':       'estado--pendiente',
            'en preparación':  'estado--preparacion',
            'listo':           'estado--listo',
            'entregado':       'estado--entregado',
        }[p.estado] || 'estado--pendiente';

        const estadoLabel = p.estado.replace('en preparación', 'En Prep.');

        // Botones de estado según rol
        let botonesHTML = '';
        if (p.estado !== 'entregado') {
            accionesDisponibles.forEach(nuevoEstado => {
                if (nuevoEstado !== p.estado) {
                    const labels = {
                        'en preparación': 'Iniciar Prep.',
                        'listo':          'Marcar Listo',
                        'entregado':      'Entregar',
                    };
                    botonesHTML += `<button class="btn btn--sm btn--ghost" data-pedido="${p.id_pedido}" data-estado="${nuevoEstado}">${labels[nuevoEstado] || nuevoEstado}</button>`;
                }
            });
        }

        card.innerHTML = `
            <div>
                <span class="pedido-card__estado ${estadoClass}">${estadoLabel}</span>
            </div>
            <div class="pedido-card__info">
                <p class="pedido-card__mesa">${p.mesa || 'Sin mesa'}</p>
                <p class="pedido-card__meta">${fmtFecha(p.hora_registro)} · ${p.nombre_usuario || ''}</p>
            </div>
            <div class="pedido-card__actions">
                ${botonesHTML}
                <span class="pedido-card__total">${fmt(p.monto_total)}</span>
            </div>
        `;

        // Eventos de cambio de estado
        $$('[data-estado]', card).forEach(btn => {
            btn.addEventListener('click', () => cambiarEstadoPedido(btn.dataset.pedido, btn.dataset.estado));
        });

        lista.appendChild(card);
    });
}

function renderMesas(pedidos) {
    const grid = $('#vista-mesas');
    grid.innerHTML = '';

    // Generar mesas del 1 al 10
    for (let i = 1; i <= 10; i++) {
        const mesaNombre = `Mesa ${i}`;
        const pedidoMesa = pedidos.find(p => p.mesa === mesaNombre && p.estado !== 'entregado');
        const tile = document.createElement('div');
        tile.className = `mesa-tile ${pedidoMesa ? 'mesa--ocupada' : ''}`;
        tile.innerHTML = `
            <div class="mesa-tile__num">${i}</div>
            <div class="mesa-tile__status ${pedidoMesa ? 'estado--' + (pedidoMesa.estado === 'en preparación' ? 'preparacion' : pedidoMesa.estado) : ''}">${pedidoMesa ? pedidoMesa.estado : 'Libre'}</div>
        `;
        if (pedidoMesa) {
            tile.title = `Pedido #${pedidoMesa.id_pedido} · ${fmt(pedidoMesa.monto_total)}`;
        }
        grid.appendChild(tile);
    }
}

async function cambiarEstadoPedido(idPedido, nuevoEstado) {
    try {
        await apiFetch(`/pedidos/${idPedido}/estado`, {
            method: 'PATCH',
            body: JSON.stringify({ estado: nuevoEstado }),
        });
        toast(`Pedido actualizado a "${nuevoEstado}"`, 'success');
        await cargarPedidos();
    } catch (err) {
        toast(err.message, 'error');
    }
}

// Nuevo pedido
function abrirModalPedido() {
    state.pedidoItems = [];
    $('#pedido-mesa').value = '';
    $('#pedido-buscar-producto').value = '';
    $('#producto-results').classList.add('hidden');
    renderPedidoItems();
    abrirModal('modal-pedido');
}

function renderPedidoItems() {
    const cont  = $('#pedido-items');
    const empty = $('#pedido-empty-items');

    $$('.pedido-item-row').forEach(el => el.remove());

    if (state.pedidoItems.length === 0) {
        empty.classList.remove('hidden');
    } else {
        empty.classList.add('hidden');
        state.pedidoItems.forEach((item, idx) => {
            const row = document.createElement('div');
            row.className = 'pedido-item-row';
            row.innerHTML = `
                <span class="pedido-item-row__name">${item.nombre_producto}</span>
                <div class="pedido-item-row__qty">
                    <button class="qty-btn" data-idx="${idx}" data-op="dec">−</button>
                    <span>${item.cantidad}</span>
                    <button class="qty-btn" data-idx="${idx}" data-op="inc">+</button>
                </div>
                <span class="pedido-item-row__subtotal">${fmt(item.precio * item.cantidad)}</span>
            `;
            $$('[data-op]', row).forEach(btn => {
                btn.addEventListener('click', () => {
                    const i = parseInt(btn.dataset.idx);
                    if (btn.dataset.op === 'inc') {
                        state.pedidoItems[i].cantidad++;
                    } else {
                        state.pedidoItems[i].cantidad--;
                        if (state.pedidoItems[i].cantidad <= 0) state.pedidoItems.splice(i, 1);
                    }
                    renderPedidoItems();
                });
            });
            cont.appendChild(row);
        });
    }

    const total = state.pedidoItems.reduce((s, it) => s + it.precio * it.cantidad, 0);
    $('#pedido-total-display').textContent = fmt(total);
}

async function buscarProductos(q) {
    if (!q.trim()) { $('#producto-results').classList.add('hidden'); return; }
    const productos = state.productos.length ? state.productos : await apiFetch('/productos');
    state.productos = productos;

    const res = productos.filter(p =>
        p.disponible === 'activo' &&
        p.nombre_producto.toLowerCase().includes(q.toLowerCase())
    );

    const cont = $('#producto-results');
    cont.innerHTML = '';
    if (res.length === 0) { cont.classList.add('hidden'); return; }
    cont.classList.remove('hidden');

    res.forEach(p => {
        const item = document.createElement('div');
        item.className = 'producto-result-item';
        item.innerHTML = `<span>${p.nombre_producto}</span><span class="producto-result-item__cat">${p.categoria} · ${fmt(p.precio)}</span>`;
        item.addEventListener('click', () => {
            const existing = state.pedidoItems.find(i => i.id_producto === p.id_producto);
            if (existing) {
                existing.cantidad++;
            } else {
                state.pedidoItems.push({ id_producto: p.id_producto, nombre_producto: p.nombre_producto, precio: parseFloat(p.precio), cantidad: 1 });
            }
            renderPedidoItems();
            cont.classList.add('hidden');
            $('#pedido-buscar-producto').value = '';
        });
        cont.appendChild(item);
    });
}

async function confirmarPedido() {
    const mesa = $('#pedido-mesa').value.trim();
    if (!mesa) { toast('Indica la mesa o identificador del pedido', 'warning'); return; }
    if (state.pedidoItems.length === 0) { toast('Agrega al menos un producto', 'warning'); return; }

    const productos = state.pedidoItems.map(i => ({
        id_producto: i.id_producto,
        cantidad: i.cantidad,
        precio_unitario: i.precio,
    }));

    try {
        await apiFetch('/pedidos', {
            method: 'POST',
            body: JSON.stringify({ mesa, productos }),
        });
        toast('Pedido registrado con éxito', 'success');
        cerrarModal('modal-pedido');
        await cargarPedidos();
    } catch (err) {
        toast(err.message, 'error');
    }
}

// =============================================
// PANEL: PRODUCCIÓN (Barra / Cocina)
// =============================================
async function cargarProduccion() {
    const rol     = state.user.rol;
    const titulo  = rol === 'barra' ? 'Comandas — Barra' : 'Comandas — Cocina';
    $('#produccion-title').textContent = titulo;

    const pedidos = await apiFetch('/pedidos');
    const cats    = CATEGORIAS_ROL[rol] || [];

    // Filtrar solo los pedidos que contienen ítems de las categorías del rol
    // Nota: la API devuelve pedidos sin detalle; para producción se necesita el detalle.
    // Por ahora mostramos todos los pedidos no entregados y se filtra visualmente.
    const activos = pedidos.filter(p => p.estado !== 'entregado');

    renderComandas(activos, rol);
}

function renderComandas(pedidos, rol) {
    const pendList = $('#comandas-pendiente');
    const prepList = $('#comandas-preparacion');
    const listoList= $('#comandas-listo');

    [pendList, prepList, listoList].forEach(el => el.innerHTML = '');

    const porEstado = { 'pendiente': pendList, 'en preparación': prepList, 'listo': listoList };

    pedidos.forEach(p => {
        const cont = porEstado[p.estado];
        if (!cont) return;

        const card = document.createElement('div');
        card.className = 'comanda-card';

        let accionHTML = '';
        if (p.estado === 'pendiente') {
            accionHTML = `<button class="btn btn--sm btn--primary comanda-action" data-id="${p.id_pedido}" data-estado="en preparación">Iniciar Preparación</button>`;
        } else if (p.estado === 'en preparación') {
            accionHTML = `<button class="btn btn--sm btn--primary comanda-action" data-id="${p.id_pedido}" data-estado="listo">Marcar como Listo</button>`;
        }

        card.innerHTML = `
            <div class="comanda-card__header">
                <span class="comanda-card__mesa">${p.mesa || 'Sin mesa'}</span>
                <span class="comanda-card__time">${fmtFecha(p.hora_registro)}</span>
            </div>
            <div class="comanda-card__item"><strong>#${p.id_pedido}</strong> · ${fmt(p.monto_total)}</div>
            ${accionHTML ? `<div class="comanda-card__action">${accionHTML}</div>` : ''}
        `;

        $$('.comanda-action', card).forEach(btn => {
            btn.addEventListener('click', () => cambiarEstadoPedido(btn.dataset.id, btn.dataset.estado));
        });

        cont.appendChild(card);
    });
}

// =============================================
// PANEL: PRODUCTOS
// =============================================
async function cargarProductos() {
    const productos = await apiFetch('/productos');
    state.productos = productos;
    const tbody = $('#tbody-productos');
    tbody.innerHTML = '';

    if (productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No hay productos registrados</td></tr>';
        return;
    }

    productos.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.id_producto}</td>
            <td><strong>${p.nombre_producto}</strong><br><small style="color:var(--text-secondary)">${p.descripcion || ''}</small></td>
            <td>${p.categoria}</td>
            <td>${fmt(p.precio)}</td>
            <td><span class="badge badge--${p.disponible}">${p.disponible}</span></td>
            <td>
                <button class="btn btn--sm btn--ghost" data-action="edit-producto" data-id="${p.id_producto}">Editar</button>
                <button class="btn btn--sm btn--danger" data-action="del-producto" data-id="${p.id_producto}" style="margin-left:4px">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Eventos
    $$('[data-action="edit-producto"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const prod = state.productos.find(p => p.id_producto == btn.dataset.id);
            if (prod) abrirModalProducto(prod);
        });
    });
    $$('[data-action="del-producto"]').forEach(btn => {
        btn.addEventListener('click', () => {
            confirmar('Eliminar producto', '¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.', async () => {
                try {
                    await apiFetch(`/productos/${btn.dataset.id}`, { method: 'DELETE' });
                    toast('Producto eliminado', 'success');
                    await cargarProductos();
                } catch (err) { toast(err.message, 'error'); }
            });
        });
    });
}

function abrirModalProducto(prod = null) {
    $('#modal-producto-title').textContent = prod ? 'Editar Producto' : 'Nuevo Producto';
    $('#producto-id').value            = prod?.id_producto || '';
    $('#producto-nombre').value        = prod?.nombre_producto || '';
    $('#producto-descripcion').value   = prod?.descripcion || '';
    $('#producto-precio').value        = prod?.precio || '';
    $('#producto-categoria').value     = prod?.categoria || '';
    $('#producto-disponible').value    = prod?.disponible || 'activo';
    abrirModal('modal-producto');
}

async function confirmarProducto() {
    const id          = $('#producto-id').value;
    const nombre      = $('#producto-nombre').value.trim();
    const descripcion = $('#producto-descripcion').value.trim();
    const precio      = parseFloat($('#producto-precio').value);
    const categoria   = $('#producto-categoria').value;
    const disponible  = $('#producto-disponible').value;

    if (!nombre || !precio || !categoria) { toast('Completa todos los campos requeridos', 'warning'); return; }

    const body = { nombre_producto: nombre, descripcion, precio, categoria, disponible };

    try {
        if (id) {
            await apiFetch(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(body) });
            toast('Producto actualizado', 'success');
        } else {
            await apiFetch('/productos', { method: 'POST', body: JSON.stringify(body) });
            toast('Producto creado', 'success');
        }
        cerrarModal('modal-producto');
        await cargarProductos();
    } catch (err) { toast(err.message, 'error'); }
}

// =============================================
// PANEL: USUARIOS
// =============================================
async function cargarUsuarios() {
    const usuarios = await apiFetch('/usuarios');
    const tbody = $('#tbody-usuarios');
    tbody.innerHTML = '';

    if (usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No hay usuarios registrados</td></tr>';
        return;
    }

    usuarios.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${u.id_usuario}</td>
            <td>${u.nombre_completo}</td>
            <td><strong>${u.nombre_usuario}</strong></td>
            <td>${u.rol}</td>
            <td><span class="badge badge--${u.estado}">${u.estado}</span></td>
            <td>${u.fecha_alta ? new Date(u.fecha_alta).toLocaleDateString('es-MX') : '—'}</td>
            <td>
                <button class="btn btn--sm btn--ghost" data-action="edit-usuario" data-id="${u.id_usuario}">Editar</button>
                <button class="btn btn--sm btn--danger" data-action="del-usuario" data-id="${u.id_usuario}" style="margin-left:4px">Dar de baja</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    $$('[data-action="edit-usuario"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const u = usuarios.find(x => x.id_usuario == btn.dataset.id);
            if (u) abrirModalUsuario(u);
        });
    });
    $$('[data-action="del-usuario"]').forEach(btn => {
        btn.addEventListener('click', () => {
            confirmar('Dar de baja usuario', '¿Confirmas dar de baja a este usuario?', async () => {
                try {
                    await apiFetch(`/usuarios/${btn.dataset.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({ estado: 'inactivo' }),
                    });
                    toast('Usuario dado de baja', 'success');
                    await cargarUsuarios();
                } catch (err) { toast(err.message, 'error'); }
            });
        });
    });
}

function abrirModalUsuario(u = null) {
    $('#modal-usuario-title').textContent     = u ? 'Editar Usuario' : 'Nuevo Usuario';
    $('#usuario-id').value                    = u?.id_usuario || '';
    $('#usuario-nombre-completo').value       = u?.nombre_completo || '';
    $('#usuario-nombre').value                = u?.nombre_usuario || '';
    $('#usuario-contrasena').value            = '';
    $('#usuario-rol').value                   = u?.rol || '';
    $('#usuario-estado').value                = u?.estado || 'activo';
    // En edición, contraseña es opcional
    $('#usuario-contrasena').placeholder      = u ? 'Dejar vacío para no cambiar' : '••••••••';
    abrirModal('modal-usuario');
}

async function confirmarUsuario() {
    const id              = $('#usuario-id').value;
    const nombre_completo = $('#usuario-nombre-completo').value.trim();
    const nombre_usuario  = $('#usuario-nombre').value.trim();
    const contrasena      = $('#usuario-contrasena').value;
    const rol             = $('#usuario-rol').value;
    const estado          = $('#usuario-estado').value;

    if (!nombre_completo || !nombre_usuario || !rol) { toast('Completa todos los campos requeridos', 'warning'); return; }
    if (!id && !contrasena) { toast('La contraseña es requerida para usuarios nuevos', 'warning'); return; }

    const body = { nombre_completo, nombre_usuario, rol, estado };
    if (contrasena) body.contrasena = contrasena;

    try {
        if (id) {
            await apiFetch(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(body) });
            toast('Usuario actualizado', 'success');
        } else {
            await apiFetch('/usuarios', { method: 'POST', body: JSON.stringify(body) });
            toast('Usuario creado', 'success');
        }
        cerrarModal('modal-usuario');
        await cargarUsuarios();
    } catch (err) { toast(err.message, 'error'); }
}

// =============================================
// PANEL: INSUMOS
// =============================================
async function cargarInsumos() {
    const insumos = await apiFetch('/insumos');
    const tbody = $('#tbody-insumos');
    tbody.innerHTML = '';

    if (insumos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No hay insumos registrados</td></tr>';
        return;
    }

    insumos.forEach(i => {
        const bajo = parseFloat(i.existencia_actual) <= parseFloat(i.nivel_minimo);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${i.nombre_insumo}</strong></td>
            <td>${i.unidad_medida}</td>
            <td style="color:${bajo ? 'var(--danger)' : 'inherit'};font-weight:${bajo ? '700' : 'normal'}">${i.existencia_actual}${bajo ? ' ⚠️' : ''}</td>
            <td>${i.nivel_minimo}</td>
            <td><span class="badge badge--${bajo ? 'inactivo' : 'activo'}">${bajo ? 'Stock bajo' : 'Normal'}</span></td>
            <td>
                <button class="btn btn--sm btn--ghost" data-action="edit-insumo" data-id="${i.id_insumo}">Editar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    $$('[data-action="edit-insumo"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const ins = insumos.find(x => x.id_insumo == btn.dataset.id);
            if (ins) abrirModalInsumo(ins);
        });
    });
}

function abrirModalInsumo(ins = null) {
    $('#modal-insumo-title').textContent  = ins ? 'Editar Insumo' : 'Nuevo Insumo';
    $('#insumo-id').value                 = ins?.id_insumo || '';
    $('#insumo-nombre').value             = ins?.nombre_insumo || '';
    $('#insumo-unidad').value             = ins?.unidad_medida || '';
    $('#insumo-existencia').value         = ins?.existencia_actual || '';
    $('#insumo-minimo').value             = ins?.nivel_minimo || '';
    abrirModal('modal-insumo');
}

async function confirmarInsumo() {
    const id              = $('#insumo-id').value;
    const nombre_insumo   = $('#insumo-nombre').value.trim();
    const unidad_medida   = $('#insumo-unidad').value.trim();
    const existencia_actual = parseFloat($('#insumo-existencia').value);
    const nivel_minimo    = parseFloat($('#insumo-minimo').value);

    if (!nombre_insumo || !unidad_medida || isNaN(existencia_actual) || isNaN(nivel_minimo)) {
        toast('Completa todos los campos', 'warning'); return;
    }

    const body = { nombre_insumo, unidad_medida, existencia_actual, nivel_minimo };

    try {
        if (id) {
            await apiFetch(`/insumos/${id}`, { method: 'PUT', body: JSON.stringify(body) });
            toast('Insumo actualizado', 'success');
        } else {
            await apiFetch('/insumos', { method: 'POST', body: JSON.stringify(body) });
            toast('Insumo creado', 'success');
        }
        cerrarModal('modal-insumo');
        await cargarInsumos();
    } catch (err) { toast(err.message, 'error'); }
}

// =============================================
// PANEL: MERMAS
// =============================================
async function cargarMermas() {
    const mermas = await apiFetch('/mermas');
    const tbody = $('#tbody-mermas');
    tbody.innerHTML = '';

    if (mermas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Sin registros de merma</td></tr>';
        return;
    }

    mermas.forEach(m => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${fmtFecha(m.fecha_hora)}</td>
            <td><strong>${m.nombre_producto}</strong></td>
            <td>${m.cantidad}</td>
            <td>${m.motivo}</td>
            <td>${m.nombre_usuario}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function abrirModalMerma() {
    // Cargar productos en el select
    const productos = state.productos.length ? state.productos : await apiFetch('/productos');
    state.productos = productos;
    const sel = $('#merma-producto');
    sel.innerHTML = productos.filter(p => p.disponible === 'activo').map(p =>
        `<option value="${p.id_producto}">${p.nombre_producto}</option>`
    ).join('');
    $('#merma-cantidad').value = '';
    $('#merma-motivo').value = '';
    abrirModal('modal-merma');
}

async function confirmarMerma() {
    const id_producto = parseInt($('#merma-producto').value);
    const cantidad    = parseInt($('#merma-cantidad').value);
    const motivo      = $('#merma-motivo').value.trim();

    if (!id_producto || !cantidad || !motivo) { toast('Completa todos los campos', 'warning'); return; }

    try {
        await apiFetch('/mermas', {
            method: 'POST',
            body: JSON.stringify({ id_producto, cantidad, motivo }),
        });
        toast('Merma registrada', 'success');
        cerrarModal('modal-merma');
        await cargarMermas();
    } catch (err) { toast(err.message, 'error'); }
}

// =============================================
// PANEL: CAJA
// =============================================
async function cargarCaja() {
    // Obtener total ingresos del día desde pedidos
    try {
        const pedidos = await apiFetch('/pedidos');
        const hoy = new Date().toDateString();
        const ingresos = pedidos
            .filter(p => new Date(p.hora_registro).toDateString() === hoy)
            .reduce((s, p) => s + parseFloat(p.monto_total || 0), 0);
        $('#caja-ingresos').textContent = fmt(ingresos);
        actualizarSaldoCaja();
    } catch (_) {}

    // Historial de cierres
    const cierres = await apiFetch('/caja/historial');
    const tbody = $('#tbody-cierres');
    tbody.innerHTML = '';

    if (cierres.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Sin cierres registrados</td></tr>';
        return;
    }

    cierres.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${fmtFecha(c.fecha_cierre)}</td>
            <td>${fmt(c.total_ingresos)}</td>
            <td>${fmt(c.total_egresos)}</td>
            <td><strong style="color:${parseFloat(c.saldo) >= 0 ? 'var(--kombu-green)' : 'var(--danger)'}">${fmt(c.saldo)}</strong></td>
            <td>${c.nombre_usuario}</td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarSaldoCaja() {
    const ingresos = parseFloat($('#caja-ingresos').textContent.replace('$', '')) || 0;
    const egresos  = parseFloat($('#caja-egresos-input').value) || 0;
    $('#caja-saldo').textContent = fmt(ingresos - egresos);
}

async function ejecutarCierreCaja() {
    const total_egresos = parseFloat($('#caja-egresos-input').value) || 0;
    confirmar('Cierre de Caja', `¿Ejecutar el cierre de caja con $${total_egresos.toFixed(2)} en egresos?`, async () => {
        try {
            await apiFetch('/caja/cierre', {
                method: 'POST',
                body: JSON.stringify({ total_egresos }),
            });
            toast('Cierre de caja ejecutado con éxito', 'success');
            $('#caja-egresos-input').value = '';
            await cargarCaja();
        } catch (err) { toast(err.message, 'error'); }
    });
}

// =============================================
// PANEL: MOVIMIENTOS FINANCIEROS
// =============================================
async function cargarMovimientos() {
    const movs = await apiFetch('/movimientos');
    const tbody = $('#tbody-movimientos');
    tbody.innerHTML = '';

    if (movs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Sin movimientos registrados</td></tr>';
        return;
    }

    movs.forEach(m => {
        const tr = document.createElement('tr');
        const color = m.tipo === 'ingreso' ? 'var(--kombu-green)' : 'var(--danger)';
        tr.innerHTML = `
            <td>${fmtFecha(m.fecha_hora)}</td>
            <td><span class="badge badge--${m.tipo === 'ingreso' ? 'activo' : 'inactivo'}">${m.tipo}</span></td>
            <td>${m.concepto}</td>
            <td style="color:${color};font-weight:700">${m.tipo === 'egreso' ? '-' : '+'}${fmt(m.monto)}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function confirmarMovimiento() {
    const tipo    = $('#movimiento-tipo').value;
    const monto   = parseFloat($('#movimiento-monto').value);
    const concepto= $('#movimiento-concepto').value.trim();

    if (!tipo || isNaN(monto) || !concepto) { toast('Completa todos los campos', 'warning'); return; }

    try {
        await apiFetch('/movimientos', {
            method: 'POST',
            body: JSON.stringify({ tipo, monto, concepto }),
        });
        toast('Movimiento registrado', 'success');
        cerrarModal('modal-movimiento');
        await cargarMovimientos();
    } catch (err) { toast(err.message, 'error'); }
}

// =============================================
// PANEL: REPORTES
// =============================================
async function cargarReportes() {
    const data = await apiFetch('/reportes/resumen');

    // Resumen financiero
    if (data.resumenFinanciero) {
        const r = data.resumenFinanciero;
        $('#rep-ingresos').textContent = fmt(r.total_ingresos);
        $('#rep-egresos').textContent  = fmt(r.total_egresos);
        $('#rep-saldo').textContent    = fmt(r.saldo);
        $('#rep-fecha').textContent    = 'Último cierre: ' + fmtFecha(r.fecha_cierre);
    }

    // Top productos
    const ranking = $('#reporte-top-productos');
    ranking.innerHTML = '';
    (data.productosPopulares || []).forEach((p, i) => {
        const div = document.createElement('div');
        div.className = 'ranking-item';
        div.innerHTML = `
            <span class="ranking-num">${i + 1}</span>
            <span class="ranking-nombre">${p.nombre_producto}</span>
            <span class="ranking-qty">${p.cantidad_vendida} vendidos</span>
        `;
        ranking.appendChild(div);
    });
    if (!data.productosPopulares?.length) ranking.innerHTML = '<p class="empty-state">Sin datos</p>';

    // Gráfica de ventas por día
    const grafica = $('#reporte-ventas-dias');
    grafica.innerHTML = '';
    const dias = data.graficaVentas || [];
    if (dias.length === 0) {
        grafica.innerHTML = '<p class="empty-state">Sin datos</p>';
        return;
    }
    const maxVal = Math.max(...dias.map(d => parseFloat(d.total || 0)));
    dias.forEach(d => {
        const pct = maxVal > 0 ? (parseFloat(d.total) / maxVal) * 100 : 0;
        const label = d.fecha ? new Date(d.fecha).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }) : '—';
        const item = document.createElement('div');
        item.className = 'bar-item';
        item.innerHTML = `
            <span class="bar-item__val">${fmt(d.total)}</span>
            <div class="bar-item__bar" style="height:${Math.max(pct, 4)}%"></div>
            <span class="bar-item__label">${label}</span>
        `;
        grafica.appendChild(item);
    });
}

// =============================================
// INICIALIZACIÓN DE EVENTOS
// =============================================
document.addEventListener('DOMContentLoaded', () => {

    // ---- LOGIN ----
    $('#btn-login').addEventListener('click', login);
    $('#input-contrasena').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });

    // ---- LOGOUT ----
    $('#btn-logout').addEventListener('click', () => {
        confirmar('Cerrar sesión', '¿Deseas cerrar la sesión?', logout);
    });

    // ---- MENÚ MÓVIL ----
    $('#btn-menu-toggle').addEventListener('click', () => {
        $('#sidebar').classList.toggle('sidebar--open');
    });

    // Cerrar sidebar al hacer clic fuera en móvil
    $('#main-content').addEventListener('click', () => {
        $('#sidebar').classList.remove('sidebar--open');
    });

    // ---- CERRAR MODALES ----
    $$('.modal-close, [data-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.modal;
            if (id) cerrarModal(id);
        });
    });
    $('#modal-overlay').addEventListener('click', e => {
        if (e.target === $('#modal-overlay')) cerrarTodosModales();
    });

    // ---- CONFIRMAR ----
    $('#btn-confirm-ok').addEventListener('click', () => {
        cerrarModal('modal-confirm');
        if (typeof state.confirmCallback === 'function') {
            state.confirmCallback();
            state.confirmCallback = null;
        }
    });

    // ---- PEDIDOS ----
    $('#btn-nuevo-pedido')?.addEventListener('click', abrirModalPedido);
    $('#btn-confirmar-pedido')?.addEventListener('click', confirmarPedido);
    $('#pedido-buscar-producto')?.addEventListener('input', e => buscarProductos(e.target.value));

    // Filtros de estado pedidos
    $$('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtroEstado = btn.dataset.estado;
            cargarPanel('pedidos');
        });
    });

    // ---- PRODUCTOS ----
    $('#btn-nuevo-producto')?.addEventListener('click', () => abrirModalProducto());
    $('#btn-confirmar-producto')?.addEventListener('click', confirmarProducto);

    // ---- USUARIOS ----
    $('#btn-nuevo-usuario')?.addEventListener('click', () => abrirModalUsuario());
    $('#btn-confirmar-usuario')?.addEventListener('click', confirmarUsuario);

    // ---- INSUMOS ----
    $('#btn-nuevo-insumo')?.addEventListener('click', () => abrirModalInsumo());
    $('#btn-confirmar-insumo')?.addEventListener('click', confirmarInsumo);

    // ---- MERMAS ----
    $('#btn-nueva-merma')?.addEventListener('click', abrirModalMerma);
    $('#btn-confirmar-merma')?.addEventListener('click', confirmarMerma);

    // ---- CAJA ----
    $('#btn-cierre-caja')?.addEventListener('click', ejecutarCierreCaja);
    $('#caja-egresos-input')?.addEventListener('input', actualizarSaldoCaja);

    // ---- MOVIMIENTOS ----
    $('#btn-nuevo-movimiento')?.addEventListener('click', () => {
        $('#movimiento-tipo').value    = 'ingreso';
        $('#movimiento-monto').value   = '';
        $('#movimiento-concepto').value= '';
        abrirModal('modal-movimiento');
    });
    $('#btn-confirmar-movimiento')?.addEventListener('click', confirmarMovimiento);

    // ---- AUTO-LOGIN si hay token ----
    if (state.token && state.user) {
        iniciarApp();
    }
});
