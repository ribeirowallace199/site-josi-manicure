/**
 * ============================================================
 * JOSI MANICURE - ADMIN PANEL CONTROLLER
 * Dashboard, Agenda, Serviços, Cosméticos, Estoque & Pedidos
 * ============================================================
 */

const ADMIN_CREDENTIALS = {
  email: 'admin@josimanicure.com.br',
  password: 'admin123'
};

document.addEventListener('DOMContentLoaded', () => {
  initAdminAuth();
  initSidebarTabs();
  loadBusinessSettingsToForm();
  loadSupabaseConfigToForm();
  refreshAdminAllData();
});

// ============================================================
// 1. AUTENTICAÇÃO DO PAINEL
// ============================================================
function initAdminAuth() {
  const loginForm = document.getElementById('adminLoginForm');
  const loginScreen = document.getElementById('loginScreen');
  const adminLayout = document.getElementById('adminLayout');
  const logoutBtn = document.getElementById('adminLogoutBtn');

  // Verificar se já está autenticado nesta sessão
  const isAuth = sessionStorage.getItem('jm_admin_logged_in') === 'true';
  if (isAuth) {
    if (loginScreen) loginScreen.style.display = 'none';
    if (adminLayout) adminLayout.classList.add('active');
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value.trim();

      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem('jm_admin_logged_in', 'true');
        loginScreen.style.display = 'none';
        adminLayout.classList.add('active');
        refreshAdminAllData();
        showAdminToast('Login efetuado com sucesso!');
      } else {
        alert('Credenciais incorretas! Utilize admin@josimanicure.com.br e senha admin123.');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('jm_admin_logged_in');
      location.reload();
    });
  }
}

// ============================================================
// 2. NAVEGAÇÃO POR ABAS DO PAINEL
// ============================================================
function initSidebarTabs() {
  const navBtns = document.querySelectorAll('.sidebar-nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchAdminTab(tabId);
    });
  });
}

function switchAdminTab(tabId) {
  // Atualizar botões
  document.querySelectorAll('.sidebar-nav-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
  });

  // Atualizar painéis
  document.querySelectorAll('.admin-tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === tabId);
  });

  // Título e subtítulo da página
  const titles = {
    'tabDashboard': { title: 'Visão Geral', sub: 'Métricas e acompanhamento da sua agenda em tempo real' },
    'tabBookings': { title: 'Agenda & Horários', sub: 'Gerencie atendimentos, remarque e cadastre folgas/bloqueios' },
    'tabServices': { title: 'Menu de Procedimentos', sub: 'Cadastre serviços, altere preços e tempo de atendimento' },
    'tabProducts': { title: 'Boutique de Cosméticos & Estoque', sub: 'Catálogo de cosméticos e controle de estoque' },
    'tabOrders': { title: 'Pedidos da Loja', sub: 'Acompanhe as compras realizadas e status de pagamento/entrega' },
    'tabSettings': { title: 'Configurações & Supabase', sub: 'Personalize o nome do negócio, contatos e banco de dados' }
  };

  const meta = titles[tabId] || { title: 'Painel', sub: '' };
  document.getElementById('currentTabTitle').textContent = meta.title;
  document.getElementById('currentTabSubtitle').textContent = meta.sub;

  refreshAdminAllData();
}

// ============================================================
// 3. ATUALIZAÇÃO GERAL DOS DADOS
// ============================================================
function refreshAdminAllData() {
  const settings = window.AppDB.getSettings();

  // Atualizar títulos com o nome do negócio configurado
  const loginBrandName = document.getElementById('loginBrandName');
  const sidebarBrandName = document.getElementById('sidebarBrandName');
  if (loginBrandName) loginBrandName.textContent = settings.business_name;
  if (sidebarBrandName) sidebarBrandName.textContent = settings.business_name;

  // Carregar dados de cada aba
  renderDashboardMetrics();
  renderBookingsTables();
  renderBlocksTable();
  renderServicesAdminTable();
  renderProductsAdminTable();
  renderOrdersAdminTable();
}

// ============================================================
// 4. DASHBOARD & MÉTRICAS
// ============================================================
function renderDashboardMetrics() {
  const bookings = window.AppDB.getBookings();
  const orders = window.AppDB.getOrders();
  const products = window.AppDB.getProducts();

  // Faturamento estimado (serviços ativos + pedidos)
  const bookingsRevenue = bookings
    .filter(b => b.status !== 'Cancelado')
    .reduce((sum, b) => sum + (parseFloat(b.service_price) || 0), 0);

  const ordersRevenue = orders
    .filter(o => o.status !== 'Cancelado')
    .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

  const totalRevenue = bookingsRevenue + ordersRevenue;

  // Produtos com estoque baixo (menor ou igual a 5)
  const lowStockProducts = products.filter(p => p.stock <= 5);

  document.getElementById('statRevenue').textContent = `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`;
  document.getElementById('statBookingsCount').textContent = bookings.filter(b => b.status !== 'Cancelado').length;
  document.getElementById('statOrdersCount').textContent = orders.length;
  document.getElementById('statLowStockCount').textContent = lowStockProducts.length;

  // Tabela de próximos atendimentos no dashboard
  const upcomingBody = document.getElementById('dashboardUpcomingTableBody');
  if (!upcomingBody) return;

  const upcoming = bookings
    .filter(b => b.status === 'Confirmado' || b.status === 'Remarcado')
    .slice(0, 5);

  if (upcoming.length === 0) {
    upcomingBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--admin-text-muted); padding: 30px;">
          Nenhum atendimento confirmado pendente no momento.
        </td>
      </tr>
    `;
    return;
  }

  upcomingBody.innerHTML = upcoming.map(b => {
    const [y, m, d] = b.booking_date.split('-');
    return `
      <tr>
        <td><strong>${d}/${m}/${y}</strong> às ${b.booking_time}</td>
        <td>
          <strong>${b.client_name}</strong><br>
          <small style="color: var(--admin-text-muted);">${b.client_phone}</small>
        </td>
        <td>${b.service_name}</td>
        <td>R$ ${parseFloat(b.service_price).toFixed(2).replace('.', ',')}</td>
        <td><span class="status-pill ${b.status}">${b.status}</span></td>
        <td>
          <div class="table-action-btns">
            <button class="action-btn-sm" onclick="setBookingStatus('${b.id}', 'Concluído')">✓ Concluir</button>
            <button class="action-btn-sm" onclick="openRescheduleModal('${b.id}')">🗓️ Remarcar</button>
            <button class="action-btn-sm danger" onclick="setBookingStatus('${b.id}', 'Cancelado')">✕ Cancelar</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================================
// 5. GESTÃO DE AGENDAMENTOS & BLOQUEIOS DA AGENDA
// ============================================================
function renderBookingsTables() {
  const tableBody = document.getElementById('bookingsFullTableBody');
  const statusFilter = document.getElementById('bookingStatusFilter') ? document.getElementById('bookingStatusFilter').value : 'all';
  if (!tableBody) return;

  let bookings = window.AppDB.getBookings();

  if (statusFilter !== 'all') {
    bookings = bookings.filter(b => b.status === statusFilter);
  }

  // Ordenar por data decrescente
  bookings.sort((a, b) => b.booking_date.localeCompare(a.booking_date) || b.booking_time.localeCompare(a.booking_time));

  if (bookings.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--admin-text-muted); padding: 36px;">
          Nenhum agendamento encontrado com o filtro selecionado.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = bookings.map(b => {
    const [y, m, d] = b.booking_date.split('-');
    return `
      <tr>
        <td><strong>${d}/${m}/${y}</strong></td>
        <td><strong>${b.booking_time}</strong></td>
        <td>
          <strong>${b.client_name}</strong><br>
          <a href="https://wa.me/55${b.client_phone.replace(/\D/g, '')}" target="_blank" style="color: #2E7D32; font-size: 0.82rem; text-decoration: none;">
            💬 ${b.client_phone}
          </a>
        </td>
        <td>
          ${b.service_name}
          ${b.client_notes ? `<br><small style="color: var(--admin-text-muted); font-style: italic;">Obs: ${b.client_notes}</small>` : ''}
        </td>
        <td>R$ ${parseFloat(b.service_price).toFixed(2).replace('.', ',')}</td>
        <td><span class="status-pill ${b.status}">${b.status}</span></td>
        <td>
          <div class="table-action-btns">
            ${b.status !== 'Concluído' ? `<button class="action-btn-sm" onclick="setBookingStatus('${b.id}', 'Concluído')">Concluir</button>` : ''}
            ${b.status !== 'Cancelado' ? `<button class="action-btn-sm" onclick="openRescheduleModal('${b.id}')">Remarcar</button>` : ''}
            ${b.status !== 'Cancelado' ? `<button class="action-btn-sm danger" onclick="setBookingStatus('${b.id}', 'Cancelado')">Cancelar</button>` : ''}
            ${b.status === 'Cancelado' ? `<button class="action-btn-sm" onclick="setBookingStatus('${b.id}', 'Confirmado')">Reativar</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Filtro de status da tabela de agendamentos
const statusFilterEl = document.getElementById('bookingStatusFilter');
if (statusFilterEl) {
  statusFilterEl.addEventListener('change', renderBookingsTables);
}

function setBookingStatus(id, newStatus) {
  window.AppDB.updateBookingStatus(id, newStatus);
  showAdminToast(`Agendamento atualizado para "${newStatus}"!`);
  refreshAdminAllData();
}

function openRescheduleModal(bookingId) {
  const booking = window.AppDB.getBookings().find(b => b.id === bookingId);
  if (!booking) return;

  document.getElementById('rescheduleBookingId').value = booking.id;
  document.getElementById('newBookingDate').value = booking.booking_date;
  document.getElementById('newBookingTime').value = booking.booking_time;

  const infoBox = document.getElementById('rescheduleBookingInfo');
  infoBox.innerHTML = `
    <strong>Cliente:</strong> ${booking.client_name}<br>
    <strong>Procedimento:</strong> ${booking.service_name}<br>
    <strong>Agendamento Atual:</strong> ${booking.booking_date} às ${booking.booking_time}
  `;

  openAdminModal('rescheduleModal');
}

// Formulário de Remarcação
const rescheduleForm = document.getElementById('rescheduleForm');
if (rescheduleForm) {
  rescheduleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('rescheduleBookingId').value;
    const newDate = document.getElementById('newBookingDate').value;
    const newTime = document.getElementById('newBookingTime').value;

    try {
      window.AppDB.rescheduleBooking(id, newDate, newTime);
      closeAdminModal('rescheduleModal');
      showAdminToast('Agendamento remarcado com sucesso!');
      refreshAdminAllData();
    } catch (err) {
      alert(err.message || 'Erro ao remarcar.');
    }
  });
}

// Tabela de Bloqueios
function renderBlocksTable() {
  const tableBody = document.getElementById('blocksTableBody');
  if (!tableBody) return;

  const blocks = window.AppDB.getBlocks();
  if (blocks.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--admin-text-muted); padding: 24px;">
          Nenhum bloqueio ou folga cadastrada na agenda.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = blocks.map(b => {
    const [y, m, d] = b.block_date.split('-');
    const interval = b.all_day ? 'Dia Inteiro (Folga/Feriado)' : `Das ${b.start_time} às ${b.end_time}`;
    return `
      <tr>
        <td><strong>${d}/${m}/${y}</strong></td>
        <td><span style="font-weight: 600; color: #ED6C02;">${interval}</span></td>
        <td>${b.reason || 'Bloqueio'}</td>
        <td>
          <button class="action-btn-sm danger" onclick="removeBlock('${b.id}')">Excluir Bloqueio</button>
        </td>
      </tr>
    `;
  }).join('');
}

function removeBlock(blockId) {
  if (confirm('Deseja liberar este horário/dia novamente na agenda para clientes?')) {
    window.AppDB.deleteBlock(blockId);
    showAdminToast('Bloqueio removido com sucesso!');
    refreshAdminAllData();
  }
}

// Modal de Novo Bloqueio
const btnOpenBlockModal = document.getElementById('btnOpenBlockModal');
if (btnOpenBlockModal) {
  btnOpenBlockModal.addEventListener('click', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('blockDateInput').value = tomorrow.toISOString().split('T')[0];
    openAdminModal('blockModal');
  });
}

function toggleBlockTimes(isAllDay) {
  const row = document.getElementById('blockTimeRow');
  if (row) row.style.display = isAllDay ? 'none' : 'grid';
}

const blockForm = document.getElementById('blockForm');
if (blockForm) {
  blockForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const dateVal = document.getElementById('blockDateInput').value;
    const allDay = document.getElementById('blockAllDayCheck').checked;
    const startTime = allDay ? null : document.getElementById('blockStartTime').value;
    const endTime = allDay ? null : document.getElementById('blockEndTime').value;
    const reason = document.getElementById('blockReasonInput').value.trim();

    window.AppDB.addBlock({
      block_date: dateVal,
      all_day: allDay,
      start_time: startTime,
      end_time: endTime,
      reason: reason
    });

    closeAdminModal('blockModal');
    showAdminToast('Bloqueio cadastrado com sucesso!');
    refreshAdminAllData();
  });
}

// ============================================================
// 6. GESTÃO DE SERVIÇOS (CRUD COMPLETO)
// ============================================================
function renderServicesAdminTable() {
  const tbody = document.getElementById('servicesAdminTableBody');
  if (!tbody) return;

  const services = window.AppDB.getServices();

  tbody.innerHTML = services.map(s => `
    <tr>
      <td>
        <img src="${s.image_url || 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=700&q=80'}" 
             alt="${s.name}" class="table-thumb-sm">
      </td>
      <td>
        <strong>${s.name}</strong><br>
        <small style="color: var(--admin-text-muted);">${s.description ? s.description.substring(0, 50) + '...' : ''}</small>
      </td>
      <td><span style="font-size: 0.85rem; color: var(--admin-accent); font-weight: 600;">${s.category || 'Geral'}</span></td>
      <td>⏱️ ${s.duration_minutes} min</td>
      <td><strong>R$ ${parseFloat(s.price).toFixed(2).replace('.', ',')}</strong></td>
      <td>${s.is_popular ? '<span style="color: #ED6C02; font-weight: 700;">★ Destaque</span>' : 'Padrão'}</td>
      <td>
        <div class="table-action-btns">
          <button class="action-btn-sm" onclick="editService('${s.id}')">Editar</button>
          <button class="action-btn-sm danger" onclick="removeService('${s.id}')">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('');
}

const btnOpenNewServiceModal = document.getElementById('btnOpenNewServiceModal');
if (btnOpenNewServiceModal) {
  btnOpenNewServiceModal.addEventListener('click', () => {
    document.getElementById('serviceForm').reset();
    document.getElementById('serviceEditId').value = '';
    document.getElementById('serviceModalTitle').textContent = 'Cadastrar Novo Procedimento';
    document.getElementById('serviceImageUrlInput').value = 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=700&q=80';
    openAdminModal('serviceModal');
  });
}

function editService(serviceId) {
  const service = window.AppDB.getServices().find(s => s.id === serviceId);
  if (!service) return;

  document.getElementById('serviceEditId').value = service.id;
  document.getElementById('serviceNameInput').value = service.name;
  document.getElementById('serviceCategoryInput').value = service.category || 'Unhas';
  document.getElementById('serviceDurationInput').value = service.duration_minutes;
  document.getElementById('servicePriceInput').value = service.price;
  document.getElementById('servicePopularInput').value = service.is_popular ? 'true' : 'false';
  document.getElementById('serviceImageUrlInput').value = service.image_url;
  document.getElementById('serviceDescriptionInput').value = service.description || '';
  document.getElementById('serviceModalTitle').textContent = 'Editar Procedimento';

  openAdminModal('serviceModal');
}

function removeService(serviceId) {
  if (confirm('Tem certeza que deseja excluir este procedimento?')) {
    window.AppDB.deleteService(serviceId);
    showAdminToast('Procedimento excluído.');
    refreshAdminAllData();
  }
}

const serviceForm = document.getElementById('serviceForm');
if (serviceForm) {
  serviceForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('serviceEditId').value;
    const data = {
      name: document.getElementById('serviceNameInput').value.trim(),
      category: document.getElementById('serviceCategoryInput').value.trim(),
      duration_minutes: parseInt(document.getElementById('serviceDurationInput').value),
      price: parseFloat(document.getElementById('servicePriceInput').value),
      is_popular: document.getElementById('servicePopularInput').value === 'true',
      image_url: document.getElementById('serviceImageUrlInput').value.trim(),
      description: document.getElementById('serviceDescriptionInput').value.trim()
    };

    if (id) {
      window.AppDB.updateService(id, data);
      showAdminToast('Procedimento atualizado com sucesso!');
    } else {
      window.AppDB.addService(data);
      showAdminToast('Novo procedimento cadastrado com sucesso!');
    }

    closeAdminModal('serviceModal');
    refreshAdminAllData();
  });
}

// ============================================================
// 7. GESTÃO DE PRODUTOS & CONTROLE DE ESTOQUE (CRUD COMPLETO)
// ============================================================
function renderProductsAdminTable() {
  const tbody = document.getElementById('productsAdminTableBody');
  if (!tbody) return;

  const products = window.AppDB.getProducts();

  tbody.innerHTML = products.map(p => {
    const isLow = p.stock <= 5;
    return `
      <tr>
        <td>
          <img src="${p.image_url || 'https://images.unsplash.com/photo-1608248597359-543597d84877?auto=format&fit=crop&w=700&q=80'}" 
               alt="${p.name}" class="table-thumb-sm">
        </td>
        <td>
          <strong>${p.name}</strong><br>
          <small style="color: var(--admin-text-muted);">${p.description ? p.description.substring(0, 45) + '...' : ''}</small>
        </td>
        <td><span style="font-size: 0.85rem; color: var(--admin-accent); font-weight: 600;">${p.category}</span></td>
        <td><strong>R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</strong></td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="action-btn-sm" style="padding: 2px 8px;" onclick="adjustStock('${p.id}', -1)">−</button>
            <strong style="min-width: 24px; text-align: center; color: ${isLow ? '#D32F2F' : 'inherit'};">
              ${p.stock}
            </strong>
            <button class="action-btn-sm" style="padding: 2px 8px;" onclick="adjustStock('${p.id}', 1)">+</button>
          </div>
        </td>
        <td>
          ${p.stock > 5 ? '<span class="status-pill Confirmado">Em Estoque</span>' : 
            (p.stock > 0 ? '<span class="status-pill Remarcado">Estoque Baixo</span>' : '<span class="status-pill Cancelado">Esgotado</span>')}
        </td>
        <td>
          <div class="table-action-btns">
            <button class="action-btn-sm" onclick="editProduct('${p.id}')">Editar</button>
            <button class="action-btn-sm danger" onclick="removeProduct('${p.id}')">Excluir</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function adjustStock(productId, delta) {
  const p = window.AppDB.getProducts().find(prod => prod.id === productId);
  if (!p) return;
  const newStock = Math.max(0, p.stock + delta);
  window.AppDB.updateProduct(productId, { stock: newStock });
  renderProductsAdminTable();
  renderDashboardMetrics();
}

const btnOpenNewProductModal = document.getElementById('btnOpenNewProductModal');
if (btnOpenNewProductModal) {
  btnOpenNewProductModal.addEventListener('click', () => {
    document.getElementById('productForm').reset();
    document.getElementById('productEditId').value = '';
    document.getElementById('productModalTitle').textContent = 'Cadastrar Novo Cosmético';
    document.getElementById('productImageUrlInput').value = 'https://images.unsplash.com/photo-1608248597359-543597d84877?auto=format&fit=crop&w=700&q=80';
    openAdminModal('productModal');
  });
}

function editProduct(productId) {
  const p = window.AppDB.getProducts().find(prod => prod.id === productId);
  if (!p) return;

  document.getElementById('productEditId').value = p.id;
  document.getElementById('productNameInput').value = p.name;
  document.getElementById('productCategorySelect').value = p.category;
  document.getElementById('productStockInput').value = p.stock;
  document.getElementById('productPriceInput').value = p.price;
  document.getElementById('productFeaturedInput').value = p.is_featured ? 'true' : 'false';
  document.getElementById('productImageUrlInput').value = p.image_url;
  document.getElementById('productDescInput').value = p.description || '';
  document.getElementById('productModalTitle').textContent = 'Editar Cosmético';

  openAdminModal('productModal');
}

function removeProduct(productId) {
  if (confirm('Tem certeza que deseja excluir este cosmético da loja?')) {
    window.AppDB.deleteProduct(productId);
    showAdminToast('Produto excluído.');
    refreshAdminAllData();
  }
}

const productForm = document.getElementById('productForm');
if (productForm) {
  productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('productEditId').value;
    const data = {
      name: document.getElementById('productNameInput').value.trim(),
      category: document.getElementById('productCategorySelect').value,
      stock: parseInt(document.getElementById('productStockInput').value),
      price: parseFloat(document.getElementById('productPriceInput').value),
      is_featured: document.getElementById('productFeaturedInput').value === 'true',
      image_url: document.getElementById('productImageUrlInput').value.trim(),
      description: document.getElementById('productDescInput').value.trim()
    };

    if (id) {
      window.AppDB.updateProduct(id, data);
      showAdminToast('Produto atualizado com sucesso!');
    } else {
      window.AppDB.addProduct(data);
      showAdminToast('Novo produto cadastrado na boutique!');
    }

    closeAdminModal('productModal');
    refreshAdminAllData();
  });
}

// ============================================================
// 8. GESTÃO DE PEDIDOS DA LOJA
// ============================================================
function renderOrdersAdminTable() {
  const tbody = document.getElementById('ordersAdminTableBody');
  if (!tbody) return;

  const orders = window.AppDB.getOrders();
  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--admin-text-muted); padding: 36px;">
          Nenhum pedido realizado na loja de cosméticos até o momento.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const dateFormatted = new Date(o.created_at).toLocaleString('pt-BR');
    const itemsText = Array.isArray(o.items)
      ? o.items.map(i => `${i.qty}x ${i.name}`).join('<br>')
      : 'Itens diversos';

    return `
      <tr>
        <td>
          <strong>#${o.id.substring(0, 10)}</strong><br>
          <small style="color: var(--admin-text-muted);">${dateFormatted}</small>
        </td>
        <td>
          <strong>${o.client_name}</strong><br>
          <a href="https://wa.me/55${o.client_phone.replace(/\D/g, '')}" target="_blank" style="color: #2E7D32; font-size: 0.82rem; text-decoration: none;">
            💬 ${o.client_phone}
          </a>
        </td>
        <td style="font-size: 0.85rem;">${itemsText}</td>
        <td><strong>R$ ${parseFloat(o.total).toFixed(2).replace('.', ',')}</strong></td>
        <td><span class="status-pill ${o.status}">${o.status}</span></td>
        <td>
          <select onchange="changeOrderStatus('${o.id}', this.value)" class="form-control" style="width: auto; padding: 4px 8px; font-size: 0.82rem;">
            <option value="Pendente" ${o.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
            <option value="Pago" ${o.status === 'Pago' ? 'selected' : ''}>Pago</option>
            <option value="Entregue" ${o.status === 'Entregue' ? 'selected' : ''}>Entregue</option>
            <option value="Cancelado" ${o.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
          </select>
        </td>
      </tr>
    `;
  }).join('');
}

function changeOrderStatus(orderId, newStatus) {
  window.AppDB.updateOrderStatus(orderId, newStatus);
  showAdminToast(`Status do pedido atualizado para "${newStatus}"!`);
  refreshAdminAllData();
}

// ============================================================
// 9. CONFIGURAÇÕES DO NEGÓCIO & SUPABASE
// ============================================================
function loadBusinessSettingsToForm() {
  const settings = window.AppDB.getSettings();

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('settingBusinessName', settings.business_name);
  setVal('settingPhone', settings.phone);
  setVal('settingWhatsapp', settings.whatsapp);
  setVal('settingInstagram', settings.instagram);
  setVal('settingAddress', settings.address);
  setVal('settingBio', settings.bio);
  setVal('settingOpeningTime', settings.opening_time);
  setVal('settingClosingTime', settings.closing_time);
  setVal('settingLunchStart', settings.lunch_start);
  setVal('settingLunchEnd', settings.lunch_end);
}

const businessSettingsForm = document.getElementById('businessSettingsForm');
if (businessSettingsForm) {
  businessSettingsForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const updated = {
      business_name: document.getElementById('settingBusinessName').value.trim(),
      phone: document.getElementById('settingPhone').value.trim(),
      whatsapp: document.getElementById('settingWhatsapp').value.trim(),
      instagram: document.getElementById('settingInstagram').value.trim(),
      address: document.getElementById('settingAddress').value.trim(),
      bio: document.getElementById('settingBio').value.trim(),
      opening_time: document.getElementById('settingOpeningTime').value,
      closing_time: document.getElementById('settingClosingTime').value,
      lunch_start: document.getElementById('settingLunchStart').value,
      lunch_end: document.getElementById('settingLunchEnd').value
    };

    window.AppDB.saveSettings(updated);
    showAdminToast('Configurações do negócio salvas com sucesso!');
    refreshAdminAllData();
  });
}

function loadSupabaseConfigToForm() {
  const config = window.AppDB.getSupabaseConfig();
  const urlEl = document.getElementById('supabaseUrlInput');
  const keyEl = document.getElementById('supabaseAnonKeyInput');
  if (urlEl) urlEl.value = config.url || '';
  if (keyEl) keyEl.value = config.anonKey || '';
}

const supabaseConfigForm = document.getElementById('supabaseConfigForm');
if (supabaseConfigForm) {
  supabaseConfigForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = document.getElementById('supabaseUrlInput').value.trim();
    const key = document.getElementById('supabaseAnonKeyInput').value.trim();

    window.AppDB.saveSupabaseConfig(url, key);
    showAdminToast('Credenciais do Supabase configuradas com sucesso!');
  });
}

// ============================================================
// 10. MODAIS & TOAST HELPERS
// ============================================================
function openAdminModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add('active');
}

function closeAdminModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove('active');
}

function showAdminToast(message) {
  const toast = document.getElementById('adminToast');
  const text = document.getElementById('adminToastText');
  if (!toast || !text) return;

  text.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}
