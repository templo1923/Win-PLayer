document.addEventListener('DOMContentLoaded', () => {
    // Selección de elementos del DOM
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

    // Configuración de la aplicación
    const APP_CONFIG = {
        PASSWORD: 'admin123',
        STORAGE_KEY: 'iptv_clientes_pro',
        SESSION_KEY: 'isLoggedIn'
    };

    // Lógica de autenticación
    const auth = {
        login: (password) => {
            if (password === APP_CONFIG.PASSWORD) {
                sessionStorage.setItem(APP_CONFIG.SESSION_KEY, 'true');
                return true;
            }
            return false;
        },
        
        logout: () => {
            sessionStorage.removeItem(APP_CONFIG.SESSION_KEY);
            document.title = '⚡ Gestor IPTV Pro ⚡';
        },
        
        isLoggedIn: () => {
            return sessionStorage.getItem(APP_CONFIG.SESSION_KEY) === 'true';
        }
    };

    // Gestión de vistas
    const views = {
        showApp: () => {
            loginScreen.style.display = 'none';
            appContainer.style.display = 'block';
            app.init();
        },
        
        showLogin: () => {
            loginScreen.style.display = 'flex';
            appContainer.style.display = 'none';
            passwordInput.value = '';
            loginError.style.display = 'none';
        }
    };

    // Utilidades
    const utils = {
        formatDate: (dateString) => {
            return new Date(dateString).toLocaleDateString('es-ES', { 
                timeZone: 'UTC',
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
            });
        },
        
        formatDateLong: (dateString) => {
            return new Date(dateString).toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric', 
                timeZone: 'UTC' 
            });
        },
        
        calculateDaysDiff: (dateString) => {
            const today = new Date();
            const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
            const targetDate = new Date(dateString);
            const diffTime = targetDate - todayUTC;
            return Math.floor(diffTime / (1000 * 60 * 60 * 24));
        },
        
        generateId: () => Date.now(),
        
        sanitizePhoneNumber: (phone) => phone.replace(/\s+/g, ''),
        
        createWhatsAppUrl: (phone, message) => {
            return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        }
    };

    // Gestión de clientes
    const clientManager = {
        clients: [],
        
        load: () => {
            const stored = localStorage.getItem(APP_CONFIG.STORAGE_KEY);
            clientManager.clients = stored ? JSON.parse(stored) : [];
        },
        
        save: () => {
            localStorage.setItem(APP_CONFIG.STORAGE_KEY, JSON.stringify(clientManager.clients));
        },
        
        add: (clientData) => {
            const client = {
                ...clientData,
                id: utils.generateId(),
                whatsapp: utils.sanitizePhoneNumber(clientData.whatsapp)
            };
            clientManager.clients.push(client);
            clientManager.save();
            return client;
        },
        
        update: (id, clientData) => {
            const index = clientManager.clients.findIndex(c => c.id == id);
            if (index !== -1) {
                clientManager.clients[index] = {
                    ...clientManager.clients[index],
                    ...clientData,
                    whatsapp: utils.sanitizePhoneNumber(clientData.whatsapp)
                };
                clientManager.save();
                return true;
            }
            return false;
        },
        
        delete: (id) => {
            const initialLength = clientManager.clients.length;
            clientManager.clients = clientManager.clients.filter(c => c.id != id);
            if (clientManager.clients.length < initialLength) {
                clientManager.save();
                return true;
            }
            return false;
        },
        
        getById: (id) => {
            return clientManager.clients.find(c => c.id == id);
        },
        
        getStatus: (expirationDate) => {
            const days = utils.calculateDaysDiff(expirationDate);
            
            if (days <= 0) return { estado: 'Vencido', clase: 'status-vencido', dias };
            if (days <= 3) return { estado: 'Por Vencer', clase: 'status-por-vencer', dias };
            return { estado: 'Activo', clase: 'status-activo', dias };
        }
    };

    // Gestión de WhatsApp
    const whatsapp = {
        sendWelcomeMessage: (client) => {
            const formattedDate = utils.formatDate(client.fecha_vencimiento);
            const message = `*¡Bienvenido/a, ${client.nombre_completo}!* 🎉\n\nGracias por tu confianza. Aquí tienes tus datos de acceso para el servicio de *${client.plataforma}*:\n\n👤 *Usuario/Email:*\n\`${client.usuario_iptv}\`\n\n🔑 *Contraseña:*\n\`${client.password_iptv}\`\n\n🗓️ *Tu servicio vence el día:*\n*${formattedDate}*\n\nGuarda este mensaje. ¡A disfrutar!`;
            
            const url = utils.createWhatsAppUrl(client.whatsapp, message);
            window.open(url, '_blank');
        },
        
        sendReminderMessage: (client, days) => {
            const message = `Hola ${client.nombre_completo}, te recuerdo que tu servicio de ${client.plataforma} vence en ${days} día(s). Para renovar, contáctame. ¡Gracias!`;
            const url = utils.createWhatsAppUrl(client.whatsapp, message);
            return url;
        }
    };

    // Gestión de notificaciones
    const notifications = {
        check: () => {
            const expiringClients = clientManager.clients.filter(client => {
                const status = clientManager.getStatus(client.fecha_vencimiento);
                return status.estado === 'Por Vencer';
            });

            if (expiringClients.length > 0) {
                notificationText.textContent = `🔔 Tienes ${expiringClients.length} cliente(s) a punto de vencer. ¡Notifícales ahora!`;
                notificationBanner.style.display = 'block';
                document.title = `(${expiringClients.length}) ⚡ Gestor IPTV Pro ⚡`;
            } else {
                notificationBanner.style.display = 'none';
                document.title = '⚡ Gestor IPTV Pro ⚡';
            }
        },
        
        hide: () => {
            notificationBanner.style.display = 'none';
        }
    };

    // Gestión de estadísticas
    const stats = {
        update: () => {
            const total = clientManager.clients.length;
            const active = clientManager.clients.filter(c => clientManager.getStatus(c.fecha_vencimiento).estado === 'Activo').length;
            const expiring = clientManager.clients.filter(c => clientManager.getStatus(c.fecha_vencimiento).estado === 'Por Vencer').length;
            const expired = clientManager.clients.filter(c => clientManager.getStatus(c.fecha_vencimiento).estado === 'Vencido').length;
            
            document.getElementById('stat-total').textContent = total;
            document.getElementById('stat-activos').textContent = active;
            document.getElementById('stat-por-vencer').textContent = expiring;
            document.getElementById('stat-vencidos').textContent = expired;
        }
    };

    // Gestión de la tabla
    const table = {
        render: () => {
            const searchTerm = searchInput.value.toLowerCase();
            const filterStatus = filterSelect.value;
            
            // Ordenar por fecha de vencimiento
            const sortedClients = [...clientManager.clients].sort((a, b) => 
                new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento)
            );

            // Filtrar clientes
            const filteredClients = sortedClients.filter(client => {
                const statusInfo = clientManager.getStatus(client.fecha_vencimiento);
                const normalizedStatus = statusInfo.estado.toLowerCase().replace(/\s+/g, '_').replace('ó', 'o');
                
                const matchesSearch = (client.nombre_completo || '').toLowerCase().includes(searchTerm) || 
                                      (client.usuario_iptv || '').toLowerCase().includes(searchTerm) ||
                                      (client.plataforma || '').toLowerCase().includes(searchTerm);
                                      
                const matchesFilter = filterStatus === 'todos' || normalizedStatus === filterStatus;
                
                return matchesSearch && matchesFilter;
            });

            // Limpiar tabla
            clientTableBody.innerHTML = '';

            if (filteredClients.length === 0) {
                clientTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align:center; color: var(--text-muted); padding: 2rem;">
                            No hay clientes que coincidan con los criterios de búsqueda.
                        </td>
                    </tr>
                `;
            } else {
                filteredClients.forEach(client => {
                    const statusInfo = clientManager.getStatus(client.fecha_vencimiento);
                    const tr = document.createElement('tr');
                    tr.dataset.id = client.id;

                    const whatsappButton = (statusInfo.dias > 0 && statusInfo.dias <= 3) ? 
                        `<a href="${whatsapp.sendReminderMessage(client, statusInfo.dias)}" target="_blank" class="btn-whatsapp" title="Enviar Recordatorio">💬</a>` : 
                        `<a class="btn-whatsapp disabled" title="Notificación no disponible">💬</a>`;

                    tr.innerHTML = `
                        <td data-label="Nombre">${client.nombre_completo}</td>
                        <td data-label="Plataforma">${client.plataforma || 'N/A'}</td>
                        <td data-label="Usuario">${client.usuario_iptv}</td>
                        <td data-label="Vencimiento">${utils.formatDate(client.fecha_vencimiento)}</td>
                        <td data-label="Días Rest.">${statusInfo.dias}</td>
                        <td data-label="Estado"><span class="status ${statusInfo.clase}">${statusInfo.estado}</span></td>
                        <td data-label="Acciones">
                            <div class="actions-cell">
                                ${whatsappButton}
                                <button class="btn-icon" data-action="edit" title="Editar">✏️</button>
                                <button class="btn-icon" data-action="delete" title="Eliminar">🗑️</button>
                            </div>
                        </td>
                    `;
                    clientTableBody.appendChild(tr);
                });
            }
            
            stats.update();
        }
    };

    // Gestión del modal
    const modalManager = {
        open: (mode = 'add', clientId = null) => {
            clientForm.reset();
            document.getElementById('cliente_id').value = '';
            const modalTitle = document.getElementById('modal-title');
            
            if (mode === 'edit' && clientId) {
                modalTitle.textContent = 'Editar Cliente';
                const client = clientManager.getById(clientId);
                if (!client) return;
                
                // Llenar formulario con datos del cliente
                Object.keys(client).forEach(key => {
                    const input = document.getElementById(key);
                    if (input) input.value = client[key];
                });
            } else {
                modalTitle.textContent = 'Agregar Nuevo Cliente';
                // Establecer fecha de inicio como hoy
                document.getElementById('fecha_inicio').value = new Date().toISOString().split('T')[0];
                document.getElementById('dias_contratados').value = 30;
            }
            
            modalManager.updateExpirationDisplay();
            modal.style.display = 'flex';
        },
        
        close: () => {
            modal.style.display = 'none';
        },
        
        updateExpirationDisplay: () => {
            const startDate = document.getElementById('fecha_inicio').value;
            const days = parseInt(document.getElementById('dias_contratados').value, 10);
            const display = document.getElementById('fecha_vencimiento_display');
            
            if (startDate && !isNaN(days) && days > 0) {
                const date = new Date(startDate);
                date.setUTCDate(date.getUTCDate() + days);
                display.textContent = utils.formatDateLong(date.toISOString().split('T')[0]);
            } else {
                display.textContent = '---';
            }
        }
    };

    // Event Listeners
    const setupEventListeners = () => {
        // Login
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = passwordInput.value;
            
            if (auth.login(password)) {
                views.showApp();
            } else {
                loginError.style.display = 'block';
                loginForm.classList.add('shake');
                setTimeout(() => loginForm.classList.remove('shake'), 500);
            }
        });

        // Logout
        btnLogout.addEventListener('click', () => {
            auth.logout();
            views.showLogin();
        });

        // Modal
        btnAddClient.addEventListener('click', () => modalManager.open('add'));
        closeModalBtn.addEventListener('click', modalManager.close);
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) modalManager.close();
        });

        // Notificaciones
        closeAlertBtn.addEventListener('click', notifications.hide);

        // Formulario de cliente
        clientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const id = document.getElementById('cliente_id').value;
            const days = parseInt(document.getElementById('dias_contratados').value, 10);
            const startDate = document.getElementById('fecha_inicio').value;
            
            if (days < 1 || days > 365) {
                alert('Los días contratados deben estar entre 1 y 365.');
                return;
            }

            const expirationDate = new Date(startDate);
            expirationDate.setUTCDate(expirationDate.getUTCDate() + days);
            
            const clientData = {
                nombre_completo: document.getElementById('nombre_completo').value,
                whatsapp: document.getElementById('whatsapp').value,
                plataforma: document.getElementById('plataforma').value,
                usuario_iptv: document.getElementById('usuario_iptv').value,
                password_iptv: document.getElementById('password_iptv').value,
                fecha_inicio: startDate,
                dias_contratados: days,
                fecha_vencimiento: expirationDate.toISOString().split('T')[0]
            };

            if (id) {
                // Editar cliente existente
                clientManager.update(id, clientData);
            } else {
                // Agregar nuevo cliente
                clientManager.add(clientData);
                whatsapp.sendWelcomeMessage(clientData);
            }
            
            table.render();
            notifications.check();
            modalManager.close();
        });

        // Actualización de fecha de vencimiento
        ['change', 'input'].forEach(eventType => {
            document.getElementById('fecha_inicio').addEventListener(eventType, modalManager.updateExpirationDisplay);
            document.getElementById('dias_contratados').addEventListener(eventType, modalManager.updateExpirationDisplay);
        });

        // Acciones de tabla
        clientTableBody.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            
            const action = target.dataset.action;
            const id = target.closest('tr').dataset.id;

            if (action === 'edit') {
                modalManager.open('edit', id);
            } else if (action === 'delete') {
                if (confirm('¿Estás seguro de que quieres eliminar a este cliente?')) {
                    clientManager.delete(id);
                    table.render();
                    notifications.check();
                }
            }
        });

        // Búsqueda y filtros
        searchInput.addEventListener('input', table.render);
        filterSelect.addEventListener('change', table.render);
    };

    // Aplicación principal
    const app = {
        init: () => {
            clientManager.load();
            table.render();
            notifications.check();
        }
    };

    // Inicialización
    setupEventListeners();
    
    if (auth.isLoggedIn()) {
        views.showApp();
    } else {
        views.showLogin();
    }
});

