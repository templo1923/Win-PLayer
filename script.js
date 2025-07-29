document.addEventListener('DOMContentLoaded', () => {
    // --- SELECCIÓN DE ELEMENTOS DEL DOM ---
    const loginScreen = document.getElementById('login-screen');
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    const appContainer = document.getElementById('app-container');
    const btnLogout = document.getElementById('btn-logout');
    const modal = document.getElementById('client-modal');
    const btnAddClient = document.getElementById('btn-add-client');
    const closeModalBtn = document.querySelector('.close-button');
    const clientForm = document.getElementById('client-form');
    const clientTableBody = document.getElementById('client-table-body');
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('filter-select');
    const notificationBanner = document.getElementById('admin-notification');
    const notificationText = document.getElementById('notification-text');
    const closeAlertBtn = document.querySelector('.close-alert');

    // --- LÓGICA DE LOGIN Y LOGOUT ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = passwordInput.value;
            if (password === 'panelpro') {
            sessionStorage.setItem('isLoggedIn', 'true');
            mostrarApp();
        } else {
            loginError.style.display = 'block';
            loginForm.classList.add('shake');
            setTimeout(() => loginForm.classList.remove('shake'), 500);
        }
    });

    btnLogout.addEventListener('click', () => {
        sessionStorage.removeItem('isLoggedIn');
        document.title = '⚡ Panel De Control ⚡';
        mostrarLogin();
    });

    const mostrarApp = () => {
        loginScreen.style.display = 'none';
        appContainer.style.display = 'block';
        iniciarApp();
    };

    const mostrarLogin = () => {
        loginScreen.style.display = 'flex';
        appContainer.style.display = 'none';
        passwordInput.value = '';
        loginError.style.display = 'none';
    };
    
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        mostrarApp();
    } else {
        mostrarLogin();
    }

    // --- LÓGICA PRINCIPAL DE LA APP ---
    function iniciarApp() {
        let clientes = JSON.parse(localStorage.getItem('iptv_clientes_pro')) || [];

        const guardarClientes = () => localStorage.setItem('iptv_clientes_pro', JSON.stringify(clientes));

        // --- NUEVA FUNCIÓN: ENVIAR MENSAJE DE BIENVENIDA POR WHATSAPP ---
        const enviarMensajeBienvenida = (cliente) => {
            const fechaVencimientoFormateada = new Date(cliente.fecha_vencimiento).toLocaleDateString('es-ES', { timeZone: 'UTC' });

            const mensaje = `*¡Bienvenido/a, ${cliente.nombre_completo}!* 🎉\n\nGracias por tu confianza. Aquí tienes tus datos de acceso para el servicio de *${cliente.plataforma}*:\n\n👤 *Usuario/Email:*\n\`${cliente.usuario_iptv}\`\n\n🔑 *Contraseña:*\n\`${cliente.password_iptv}\`\n\n🗓️ *Tu servicio vence el día:*\n*${fechaVencimientoFormateada}*\n\nGuarda este mensaje. ¡A disfrutar!`;
            
            const whatsappUrl = `https://wa.me/${cliente.whatsapp}?text=${encodeURIComponent(mensaje)}`;
            
            window.open(whatsappUrl, '_blank');
        };

        const calcularEstado = (vencimiento) => {
            const hoy = new Date();
            const hoyUTC = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
            const fechaVencimiento = new Date(vencimiento);
            const diffTime = fechaVencimiento - hoyUTC;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 0) return { estado: 'Vencido', clase: 'status-vencido', dias: diffDays };
            if (diffDays <= 3) return { estado: 'Por Vencer', clase: 'status-por-vencer', dias: diffDays };
            return { estado: 'Activo', clase: 'status-activo', dias: diffDays };
        };

        const checkForNotifications = () => {
            const clientesPorVencer = clientes.filter(c => {
                const status = calcularEstado(c.fecha_vencimiento);
                return status.estado === 'Por Vencer';
            });

            if (clientesPorVencer.length > 0) {
                const count = clientesPorVencer.length;
                notificationText.textContent = `🔔 Tienes ${count} cliente(s) a punto de vencer. ¡Notifícales ahora!`;
                notificationBanner.style.display = 'block';
                document.title = `(${count}) ⚡ Panel De Control ⚡`;
            } else {
                notificationBanner.style.display = 'none';
                document.title = '⚡ Panel De Control ⚡';
            }
        };
        
        const renderizarTabla = () => {
            clientTableBody.innerHTML = '';
            const searchTerm = searchInput.value.toLowerCase();
            const filterStatus = filterSelect.value;
            
            clientes.sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento));

            const clientesFiltrados = clientes.filter(cliente => {
                const statusInfo = calcularEstado(cliente.fecha_vencimiento);
                const estadoNormalizado = statusInfo.estado.toLowerCase().replace(/\s+/g, '_').replace('ó', 'o');
                const matchesSearch = (cliente.nombre_completo || '').toLowerCase().includes(searchTerm) || 
                                      (cliente.usuario_iptv || '').toLowerCase().includes(searchTerm) ||
                                      (cliente.plataforma || '').toLowerCase().includes(searchTerm);
                const matchesFilter = filterStatus === 'todos' || estadoNormalizado === filterStatus;
                return matchesSearch && matchesFilter;
            });

            if(clientesFiltrados.length === 0){
                clientTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">No hay clientes que coincidan.</td></tr>`;
            } else {
                clientesFiltrados.forEach(cliente => {
                    const statusInfo = calcularEstado(cliente.fecha_vencimiento);
                    const tr = document.createElement('tr');
                    tr.dataset.id = cliente.id;

                    const mensajeRecordatorio = encodeURIComponent(`Hola ${cliente.nombre_completo}, te recuerdo que tu servicio de ${cliente.plataforma} vence en ${statusInfo.dias} día(s). Para renovar, contáctame. ¡Gracias!`);
                    const whatsappLink = `https://wa.me/${cliente.whatsapp}?text=${mensajeRecordatorio}`;

                    tr.innerHTML = `
                        <td data-label="Nombre">${cliente.nombre_completo}</td>
                        <td data-label="Plataforma">${cliente.plataforma || 'N/A'}</td>
                        <td data-label="Usuario">${cliente.usuario_iptv}</td>
                        <td data-label="Vencimiento">${new Date(cliente.fecha_vencimiento).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</td>
                        <td data-label="Días Rest.">${statusInfo.dias}</td>
                        <td data-label="Estado"><span class="status ${statusInfo.clase}">${statusInfo.estado}</span></td>
                        <td data-label="Acciones">
                            <div class="actions-cell">
                                ${(statusInfo.dias > 0 && statusInfo.dias <= 3) ? 
                                    `<a href="${whatsappLink}" target="_blank" class="btn-whatsapp" title="Enviar Recordatorio">💬</a>` : 
                                    `<a class="btn-whatsapp disabled" title="Notificación no disponible">💬</a>`
                                }
                                <button class="btn-icon" data-action="edit" title="Editar">✏️</button>
                                <button class="btn-icon" data-action="delete" title="Eliminar">🗑️</button>
                            </div>
                        </td>
                    `;
                    clientTableBody.appendChild(tr);
                });
            }
            actualizarEstadisticas();
        };

        const actualizarEstadisticas = () => {
            document.getElementById('stat-total').textContent = clientes.length;
            document.getElementById('stat-activos').textContent = clientes.filter(c => calcularEstado(c.fecha_vencimiento).estado === 'Activo').length;
            document.getElementById('stat-por-vencer').textContent = clientes.filter(c => calcularEstado(c.fecha_vencimiento).estado === 'Por Vencer').length;
            document.getElementById('stat-vencidos').textContent = clientes.filter(c => calcularEstado(c.fecha_vencimiento).estado === 'Vencido').length;
        };

        const abrirModal = (modo = 'agregar', id = null) => {
            clientForm.reset();
            document.getElementById('cliente_id').value = '';
            const modalTitle = document.getElementById('modal-title');
            
            if (modo === 'editar') {
                modalTitle.textContent = 'Editar Cliente';
                const cliente = clientes.find(c => c.id == id);
                if (!cliente) return;
                Object.keys(cliente).forEach(key => {
                    const input = document.getElementById(key);
                    if (input) input.value = cliente[key];
                });
            } else {
                modalTitle.textContent = 'Agregar Nuevo Cliente';
                document.getElementById('fecha_inicio').value = new Date().toISOString().split('T')[0];
                document.getElementById('dias_contratados').value = 30;
            }
            actualizarVencimientoDisplay();
            modal.style.display = 'flex';
        };

        const cerrarModal = () => modal.style.display = 'none';

        const actualizarVencimientoDisplay = () => {
            const fechaInicio = document.getElementById('fecha_inicio').value;
            const dias = parseInt(document.getElementById('dias_contratados').value, 10);
            const display = document.getElementById('fecha_vencimiento_display');
            if (fechaInicio && !isNaN(dias) && dias > 0) {
                const date = new Date(fechaInicio);
                date.setUTCDate(date.getUTCDate() + dias);
                display.textContent = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });
            } else {
                display.textContent = '---';
            }
        };

        clientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('cliente_id').value;
            const dias = parseInt(document.getElementById('dias_contratados').value, 10);
            const fecha_inicio = document.getElementById('fecha_inicio').value;
            
            if (dias < 1 || dias > 30) {
                alert('Los días contratados deben estar entre 1 y 30.');
                return;
            }

            const vencimientoDate = new Date(fecha_inicio);
            vencimientoDate.setUTCDate(vencimientoDate.getUTCDate() + dias);
            
            const datosCliente = {
                nombre_completo: document.getElementById('nombre_completo').value,
                whatsapp: document.getElementById('whatsapp').value.replace(/\s+/g, ''),
                plataforma: document.getElementById('plataforma').value,
                usuario_iptv: document.getElementById('usuario_iptv').value,
                password_iptv: document.getElementById('password_iptv').value,
                fecha_inicio,
                dias_contratados: dias,
                fecha_vencimiento: vencimientoDate.toISOString().split('T')[0]
            };

            if (id) {
                const index = clientes.findIndex(c => c.id == id);
                clientes[index] = { ...clientes[index], ...datosCliente };
            } else {
                datosCliente.id = Date.now();
                clientes.push(datosCliente);
                // ¡AQUÍ SE ACTIVA LA NUEVA FUNCIÓN!
                enviarMensajeBienvenida(datosCliente);
            }
            guardarClientes();
            renderizarTabla();
            checkForNotifications();
            cerrarModal();
        });

        // --- LISTENERS DE EVENTOS ---
        btnAddClient.addEventListener('click', () => abrirModal('agregar'));
        closeModalBtn.addEventListener('click', cerrarModal);
        window.addEventListener('click', (e) => (e.target === modal) && cerrarModal());
        closeAlertBtn.addEventListener('click', () => {
            notificationBanner.style.display = 'none';
        });
        
        ['change', 'input'].forEach(evt => {
            document.getElementById('fecha_inicio').addEventListener(evt, actualizarVencimientoDisplay);
            document.getElementById('dias_contratados').addEventListener(evt, actualizarVencimientoDisplay);
        });

        clientTableBody.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            
            const action = target.dataset.action;
            const id = target.closest('tr').dataset.id;

            if (action === 'edit') abrirModal('editar', id);
            if (action === 'delete') {
                if (confirm('¿Estás seguro de que quieres eliminar a este cliente?')) {
                    clientes = clientes.filter(c => c.id != id);
                    guardarClientes();
                    renderizarTabla();
                    checkForNotifications();
                }
            }
        });

        searchInput.addEventListener('keyup', renderizarTabla);
        filterSelect.addEventListener('change', renderizarTabla);

        // --- INICIALIZACIÓN DE LA APP ---
        renderizarTabla();
        checkForNotifications();
    }
});
