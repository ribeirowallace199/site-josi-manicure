/**
 * ============================================================
 * JOSI MANICURE - CLIENT INTERACTION SCRIPT
 * Agendamento em Tempo Real, Loja, Carrinho, Antes & Depois
 * ============================================================
 */

// Estado do Carrinho de Compras do Cliente
let clientCart = [];

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sincronizar configurações do negócio na tela
  syncBusinessSettings();

  // 2. Renderizar Serviços da Camada de Dados
  renderClientServices();

  // 3. Renderizar Produtos da Loja
  renderClientProducts('all');
  initProductCategoryFilters();

  // 4. Inicializar Sistema de Agendamento
  initBookingSystem();

  // 5. Inicializar Sacola de Compras
  initCartDrawer();

  // 6. Inicializar Slider Antes & Depois
  initBeforeAfterSlider();

  // 7. Inicializar Galeria Mosaico 3D Scroll Reveal
  initMosaicGallery();

  // 8. Menu Mobile
  initMobileMenu();
});

// ============================================================
// 1. SINCRONIZAÇÃO DE CONFIGURAÇÕES DO NEGÓCIO
// ============================================================
function syncBusinessSettings() {
  const settings = window.AppDB.getSettings();

  // Nome do Negócio (Centralizado e fácil de alterar)
  const navBrandTitle = document.getElementById('navBrandTitle');
  const footerBrandTitle = document.getElementById('footerBrandTitle');
  const copyrightBrandName = document.getElementById('copyrightBrandName');

  if (navBrandTitle) navBrandTitle.textContent = settings.business_name;
  if (footerBrandTitle) footerBrandTitle.textContent = settings.business_name;
  if (copyrightBrandName) copyrightBrandName.textContent = settings.business_name;
  document.title = `${settings.business_name} | Ateliê de Beleza & Cuidados`;

  // Telefones, WhatsApp e Instagram Oficiais de Josiane
  const topPhoneText = document.getElementById('topPhoneText');
  const topInstaLink = document.getElementById('topInstaLink');
  const topAddressText = document.getElementById('topAddressText');
  const footerPhoneText = document.getElementById('footerPhoneText');
  const footerAddressText = document.getElementById('footerAddressText');
  const footerInstaText = document.getElementById('footerInstaText');
  const aboutBioText = document.getElementById('aboutBioText');
  const floatingWhatsAppBtn = document.getElementById('floatingWhatsAppBtn');

  const waRaw = settings.whatsapp ? settings.whatsapp.replace(/\D/g, '') : '5535998776684';
  const waUrl = `https://wa.me/${waRaw}`;
  const instaUrl = settings.instagram_url || 'https://www.instagram.com/josiane_aranha_91?utm_source=ig_web_button_share_sheet&vrfl=ZDNlZDc0MzIxNw==';

  if (topPhoneText) {
    topPhoneText.textContent = `💬 WhatsApp: ${settings.phone}`;
    if (topPhoneText.tagName === 'A') topPhoneText.href = waUrl;
  }
  if (topInstaLink) {
    topInstaLink.textContent = `📸 ${settings.instagram}`;
    topInstaLink.href = instaUrl;
  }
  if (topAddressText) topAddressText.textContent = `📍 ${settings.address.split('-')[0].trim()}`;
  if (footerPhoneText) {
    footerPhoneText.textContent = settings.phone;
    if (footerPhoneText.tagName === 'A') footerPhoneText.href = waUrl;
  }
  if (footerAddressText) footerAddressText.textContent = settings.address;
  if (footerInstaText) {
    footerInstaText.textContent = settings.instagram;
    if (footerInstaText.tagName === 'A') footerInstaText.href = instaUrl;
  }
  if (floatingWhatsAppBtn) {
    floatingWhatsAppBtn.href = waUrl;
  }
  if (aboutBioText && settings.bio) aboutBioText.textContent = settings.bio;
}

// ============================================================
// 2. RENDERIZAÇÃO DOS SERVIÇOS
// ============================================================
function renderClientServices() {
  const servicesGrid = document.getElementById('servicesGrid');
  const bookServiceSelect = document.getElementById('bookServiceSelect');
  if (!servicesGrid) return;

  const services = window.AppDB.getServices().filter(s => s.is_active);

  // Preencher grid de serviços na página
  servicesGrid.innerHTML = services.map(s => `
    <div class="service-card" data-service-id="${s.id}">
      <div class="service-thumb-wrap">
        <img src="${s.image_url || 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=700&q=80'}" 
             alt="${s.name}" class="service-thumb">
        ${s.is_popular ? '<span class="service-popular-badge">Mais Procurado</span>' : ''}
      </div>
      <div class="service-body">
        <span class="service-category">${s.category || 'Procedimento'}</span>
        <h3 class="service-name">${s.name}</h3>
        <p class="service-desc">${s.description || 'Atendimento personalizado com técnicas de cutilagem e acabamento refinado.'}</p>
        <div class="service-footer">
          <div class="service-price-box">
            <span class="service-price">R$ ${parseFloat(s.price).toFixed(2).replace('.', ',')}</span>
            <span class="service-duration">⏱️ Aprox. ${s.duration_minutes} min</span>
          </div>
          <button class="btn btn-outline btn-sm btn-quick-book" data-service-id="${s.id}">
            Agendar
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Preencher select de agendamento
  if (bookServiceSelect) {
    bookServiceSelect.innerHTML = `
      <option value="" disabled selected>Selecione o procedimento...</option>
      ${services.map(s => `
        <option value="${s.id}" data-price="${s.price}" data-duration="${s.duration_minutes}">
          ${s.name} — R$ ${parseFloat(s.price).toFixed(2).replace('.', ',')} (${s.duration_minutes} min)
        </option>
      `).join('')}
    `;
  }

  // Evento dos botões "Agendar" dos cards
  document.querySelectorAll('.btn-quick-book').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sId = e.currentTarget.getAttribute('data-service-id');
      if (bookServiceSelect) {
        bookServiceSelect.value = sId;
        bookServiceSelect.dispatchEvent(new Event('change'));
      }
      const bookingSec = document.getElementById('agendamento');
      if (bookingSec) {
        bookingSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// ============================================================
// 3. RENDERIZAÇÃO DA LOJA DE COSMÉTICOS
// ============================================================
function renderClientProducts(categoryFilter = 'all') {
  const productsGrid = document.getElementById('productsGrid');
  if (!productsGrid) return;

  let products = window.AppDB.getProducts().filter(p => p.is_active);

  if (categoryFilter !== 'all') {
    products = products.filter(p => p.category === categoryFilter);
  }

  if (products.length === 0) {
    productsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-light);">
        Nenhum produto cadastrado nesta categoria no momento.
      </div>
    `;
    return;
  }

  productsGrid.innerHTML = products.map(p => {
    const stockClass = p.stock > 5 ? 'stock-in' : (p.stock > 0 ? 'stock-low' : 'stock-out');
    const stockText = p.stock > 5 
      ? '✓ Em estoque' 
      : (p.stock > 0 ? `⚠️ Apenas ${p.stock} em estoque!` : '✕ Esgotado');

    return `
      <div class="product-card" data-product-id="${p.id}">
        ${p.is_featured ? '<span class="product-badge-featured">Edição Especial</span>' : ''}
        <div class="product-thumb-box">
          <img src="${p.image_url || 'https://images.unsplash.com/photo-1608248597359-543597d84877?auto=format&fit=crop&w=700&q=80'}" 
               alt="${p.name}" class="product-thumb" loading="lazy">
        </div>
        <div class="product-info">
          <div class="product-meta-top">
            <span class="product-cat">${formatCategoryLabel(p.category)}</span>
            <span class="product-stock-tag ${stockClass}">${stockText}</span>
          </div>
          <h4 class="product-title">${p.name}</h4>
          <p class="product-desc">${p.description ? p.description.substring(0, 95) + (p.description.length > 95 ? '...' : '') : ''}</p>
          <div class="product-footer-row">
            <div class="product-price-wrap">
              <span class="product-price-label">Preço</span>
              <span class="product-price">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</span>
            </div>
            <button class="btn-product-buy btn-add-to-cart" 
                    data-product-id="${p.id}" 
                    ${p.stock <= 0 ? 'disabled' : ''}>
              ${p.stock > 0 ? '+ Sacola' : 'Esgotado'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Eventos de adicionar ao carrinho
  document.querySelectorAll('.btn-add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pId = e.currentTarget.getAttribute('data-product-id');
      addProductToCart(pId);
    });
  });
}

function formatCategoryLabel(cat) {
  const map = {
    'cremes': 'Cremes & Hidratantes',
    'oleos': 'Óleos & Cutículas',
    'esmaltes': 'Esmaltes & Finalizadores',
    'cuidados': 'Kits & Tratamento'
  };
  return map[cat] || 'Cosméticos';
}

function initProductCategoryFilters() {
  const filterBtns = document.querySelectorAll('.store-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.getAttribute('data-category');
      renderClientProducts(category);
    });
  });
}

// ============================================================
// 4. SISTEMA DE AGENDAMENTO INTELIGENTE (HORÁRIOS EM TEMPO REAL)
// ============================================================
function initBookingSystem() {
  const bookServiceSelect = document.getElementById('bookServiceSelect');
  const bookDateInput = document.getElementById('bookDateInput');
  const timeSlotsContainer = document.getElementById('timeSlotsContainer');
  const selectedTimeValue = document.getElementById('selectedTimeValue');
  const clientBookingForm = document.getElementById('clientBookingForm');
  const dayStatusNotice = document.getElementById('dayStatusNotice');

  // Resumo
  const summaryServiceName = document.getElementById('summaryServiceName');
  const summaryDateString = document.getElementById('summaryDateString');
  const summaryDuration = document.getElementById('summaryDuration');
  const summaryPriceText = document.getElementById('summaryPriceText');

  // Configurar data mínima (amanhã)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];
  if (bookDateInput) {
    bookDateInput.min = minDateStr;
    bookDateInput.value = minDateStr;
  }

  function refreshSummary() {
    const selectedOpt = bookServiceSelect.options[bookServiceSelect.selectedIndex];
    const dateVal = bookDateInput.value;
    const timeVal = selectedTimeValue.value;

    if (selectedOpt && selectedOpt.value) {
      const price = parseFloat(selectedOpt.getAttribute('data-price') || 0);
      const duration = selectedOpt.getAttribute('data-duration') || '45';
      summaryServiceName.textContent = selectedOpt.text.split('—')[0].trim();
      summaryDuration.textContent = `${duration} minutos`;
      summaryPriceText.textContent = `R$ ${price.toFixed(2).replace('.', ',')}`;
    } else {
      summaryServiceName.textContent = 'Selecione um serviço';
      summaryDuration.textContent = '--';
      summaryPriceText.textContent = 'R$ 0,00';
    }

    if (dateVal && timeVal) {
      const [year, month, day] = dateVal.split('-');
      summaryDateString.textContent = `${day}/${month}/${year} às ${timeVal}`;
    } else if (timeVal) {
      summaryDateString.textContent = `Horário: ${timeVal}`;
    } else {
      summaryDateString.textContent = 'Selecione data e hora';
    }
  }

  function computeAvailableTimeSlots(dateString) {
    if (!dateString) return;
    const settings = window.AppDB.getSettings();

    // 1. Verificar se é dia de trabalho
    const dateObj = new Date(dateString + 'T00:00:00');
    const dayOfWeek = dateObj.getDay(); // 0 = Dom, 1 = Seg, ...
    const isWorkDay = settings.work_days.includes(dayOfWeek);

    if (!isWorkDay) {
      timeSlotsContainer.innerHTML = `
        <div class="slots-empty-notice" style="color: #A64444;">
          🛑 O ateliê não atende neste dia da semana. Por favor, selecione outro dia de Terça a Sábado.
        </div>
      `;
      if (dayStatusNotice) dayStatusNotice.textContent = 'Dia de folga do ateliê.';
      selectedTimeValue.value = '';
      refreshSummary();
      return;
    }

    // 2. Verificar se há bloqueio manual de dia inteiro
    const blocks = window.AppDB.getBlocks();
    const isDayBlocked = blocks.some(b => b.block_date === dateString && b.all_day);
    if (isDayBlocked) {
      timeSlotsContainer.innerHTML = `
        <div class="slots-empty-notice" style="color: #A64444;">
          🔒 Agenda fechada para esta data (bloqueio administrativo). Escolha outro dia.
        </div>
      `;
      if (dayStatusNotice) dayStatusNotice.textContent = 'Data bloqueada na agenda.';
      selectedTimeValue.value = '';
      refreshSummary();
      return;
    }

    // 3. Gerar slots normais
    const openParts = settings.opening_time.split(':').map(Number);
    const closeParts = settings.closing_time.split(':').map(Number);
    const lunchStartParts = settings.lunch_start.split(':').map(Number);
    const lunchEndParts = settings.lunch_end.split(':').map(Number);

    const startMinutes = openParts[0] * 60 + openParts[1];
    const endMinutes = closeParts[0] * 60 + closeParts[1];
    const lunchStart = lunchStartParts[0] * 60 + lunchStartParts[1];
    const lunchEnd = lunchEndParts[0] * 60 + lunchEndParts[1];
    const slotDuration = settings.slot_duration || 60;

    // Buscar agendamentos existentes neste dia
    const existingBookings = window.AppDB.getBookings().filter(b => 
      b.booking_date === dateString && b.status !== 'Cancelado'
    );

    const partialBlocks = blocks.filter(b => b.block_date === dateString && !b.all_day);

    let html = '';
    let currentMin = startMinutes;
    let slotCount = 0;

    while (currentMin + slotDuration <= endMinutes) {
      // Pular horário de almoço
      if (currentMin >= lunchStart && currentMin < lunchEnd) {
        currentMin += slotDuration;
        continue;
      }

      const hours = String(Math.floor(currentMin / 60)).padStart(2, '0');
      const mins = String(currentMin % 60).padStart(2, '0');
      const timeStr = `${hours}:${mins}`;

      // Verificar se este horário colide com algum agendamento existente
      const isBooked = existingBookings.some(b => b.booking_time === timeStr);

      // Verificar se colide com bloqueio manual parcial
      const isBlocked = partialBlocks.some(b => {
        if (!b.start_time || !b.end_time) return false;
        return timeStr >= b.start_time && timeStr < b.end_time;
      });

      const isOccupied = isBooked || isBlocked;

      html += `
        <button type="button" 
                class="time-slot-btn ${isOccupied ? 'occupied' : ''}" 
                data-time="${timeStr}" 
                ${isOccupied ? 'disabled' : ''}
                title="${isOccupied ? 'Horário já reservado ou indisponível' : 'Clique para selecionar'}">
          ${timeStr}
          ${isOccupied ? ' ✕' : ''}
        </button>
      `;

      slotCount++;
      currentMin += slotDuration;
    }

    timeSlotsContainer.innerHTML = html;
    if (dayStatusNotice) dayStatusNotice.textContent = `Horários de atendimento das ${settings.opening_time} às ${settings.closing_time}.`;

    // Eventos de clique nos slots
    document.querySelectorAll('.time-slot-btn:not(:disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedTimeValue.value = btn.getAttribute('data-time');
        refreshSummary();
      });
    });

    // Se já havia um horário selecionado e ele ainda é válido, reativar
    if (selectedTimeValue.value) {
      const activeBtn = document.querySelector(`.time-slot-btn[data-time="${selectedTimeValue.value}"]:not(:disabled)`);
      if (activeBtn) {
        activeBtn.classList.add('active');
      } else {
        selectedTimeValue.value = '';
      }
    }
  }

  if (bookServiceSelect) {
    bookServiceSelect.addEventListener('change', refreshSummary);
  }

  if (bookDateInput) {
    bookDateInput.addEventListener('change', () => {
      computeAvailableTimeSlots(bookDateInput.value);
      refreshSummary();
    });
  }

  // Carregar slots para o dia padrão
  if (bookDateInput && bookDateInput.value) {
    computeAvailableTimeSlots(bookDateInput.value);
  }

  // Submissão do Formulário de Agendamento
  if (clientBookingForm) {
    clientBookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const serviceOpt = bookServiceSelect.options[bookServiceSelect.selectedIndex];
      if (!serviceOpt || !serviceOpt.value) {
        showAppToast('Por favor, selecione um procedimento no menu.', '⚠️');
        bookServiceSelect.focus();
        return;
      }

      const dateVal = bookDateInput.value;
      const timeVal = selectedTimeValue.value;

      if (!dateVal || !timeVal) {
        showAppToast('Por favor, selecione uma data e um horário livre na agenda!', '⚠️');
        return;
      }

      const clientName = document.getElementById('clientFullName').value.trim();
      const clientPhone = document.getElementById('clientPhoneInput').value.trim();
      const clientNotes = document.getElementById('clientNotesInput').value.trim();

      const serviceId = serviceOpt.value;
      const serviceName = serviceOpt.text.split('—')[0].trim();
      const servicePrice = parseFloat(serviceOpt.getAttribute('data-price') || 0);
      const serviceDuration = parseInt(serviceOpt.getAttribute('data-duration') || 60);

      try {
        // Gravar no banco de dados com verificação anti-duplicidade
        const newBooking = window.AppDB.addBooking({
          service_id: serviceId,
          service_name: serviceName,
          service_price: servicePrice,
          duration_minutes: serviceDuration,
          booking_date: dateVal,
          booking_time: timeVal,
          client_name: clientName,
          client_phone: clientPhone,
          client_notes: clientNotes
        });

        // Recalcular slots para bloquear imediatamente o horário recém-agendado
        computeAvailableTimeSlots(dateVal);

        // Abrir Modal de Sucesso com dados reais
        openBookingSuccessModal(newBooking);

        // Limpar campos
        document.getElementById('clientFullName').value = '';
        document.getElementById('clientPhoneInput').value = '';
        document.getElementById('clientNotesInput').value = '';
        selectedTimeValue.value = '';
        refreshSummary();

        showAppToast('Agendamento confirmado com sucesso!');
      } catch (err) {
        alert(err.message || 'Erro ao realizar o agendamento.');
      }
    });
  }
}

function openBookingSuccessModal(booking) {
  const modal = document.getElementById('bookingConfirmModal');
  const detailsBox = document.getElementById('bookingSuccessDetails');
  const whatsappBtn = document.getElementById('sendWhatsAppConfirmationBtn');
  const closeBtn = document.getElementById('closeBookingModalBtn');
  const settings = window.AppDB.getSettings();

  if (!modal || !detailsBox) return;

  const [year, month, day] = booking.booking_date.split('-');
  const dateFormatted = `${day}/${month}/${year}`;

  detailsBox.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <p><strong>Procedimento:</strong> ${booking.service_name}</p>
      <p><strong>Data & Horário:</strong> ${dateFormatted} às ${booking.booking_time}</p>
      <p><strong>Cliente:</strong> ${booking.client_name}</p>
      <p><strong>Telefone:</strong> ${booking.client_phone}</p>
      <p><strong>Valor no Ateliê:</strong> R$ ${booking.service_price.toFixed(2).replace('.', ',')}</p>
      <p><strong>Local:</strong> ${settings.address}</p>
    </div>
  `;

  // Montar link direto do WhatsApp
  const msg = `*Olá ${settings.business_name}! Acabei de solicitar meu agendamento pelo site:*\n\n` +
              `💅 *Procedimento:* ${booking.service_name}\n` +
              `📅 *Data:* ${dateFormatted}\n` +
              `⏰ *Horário:* ${booking.booking_time}\n` +
              `👤 *Nome:* ${booking.client_name}\n` +
              `📱 *Telefone:* ${booking.client_phone}\n` +
              (booking.client_notes ? `📝 *Observação:* ${booking.client_notes}\n` : '') +
              `💰 *Valor Estimado:* R$ ${booking.service_price.toFixed(2).replace('.', ',')}\n\n` +
              `Aguardo a confirmação! Muito obrigada(o)! ✨`;

  const waUrl = `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
  if (whatsappBtn) {
    whatsappBtn.href = waUrl;
  }

  modal.classList.add('active');

  const closeModal = () => modal.classList.remove('active');
  if (closeBtn) closeBtn.onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
}

// ============================================================
// 5. SACOLA DE COMPRAS & CHECKOUT
// ============================================================
function initCartDrawer() {
  const openCartBtn = document.getElementById('openCartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const btnCheckoutCart = document.getElementById('btnCheckoutCart');
  const btnClearCartBtn = document.getElementById('btnClearCartBtn');

  const openDrawer = () => {
    cartDrawer.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    cartDrawer.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (openCartBtn) openCartBtn.addEventListener('click', openDrawer);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeDrawer);
  if (cartOverlay) cartOverlay.addEventListener('click', closeDrawer);

  if (btnClearCartBtn) {
    btnClearCartBtn.addEventListener('click', () => {
      clientCart = [];
      updateCartUI();
      showAppToast('Sacola de compras limpa!');
    });
  }

  if (btnCheckoutCart) {
    btnCheckoutCart.addEventListener('click', handleCartCheckout);
  }
}

function addProductToCart(productId) {
  const product = window.AppDB.getProducts().find(p => p.id === productId);
  if (!product) return;

  if (product.stock <= 0) {
    showAppToast('Este produto está temporariamente esgotado.', '⚠️');
    return;
  }

  const existing = clientCart.find(item => item.id === productId);
  if (existing) {
    if (existing.qty + 1 > product.stock) {
      showAppToast(`Limite de estoque atingido (${product.stock} unids disponíveis).`, '⚠️');
      return;
    }
    existing.qty += 1;
  } else {
    clientCart.push({ ...product, qty: 1 });
  }

  updateCartUI();
  showAppToast(`"${product.name}" adicionado à sacola!`);

  // Abrir sacola
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  if (cartDrawer && cartOverlay) {
    cartDrawer.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function updateCartItemQty(productId, delta) {
  const item = clientCart.find(i => i.id === productId);
  if (!item) return;

  const product = window.AppDB.getProducts().find(p => p.id === productId);
  const maxStock = product ? product.stock : 99;

  item.qty += delta;

  if (item.qty > maxStock) {
    item.qty = maxStock;
    showAppToast(`Quantidade máxima em estoque: ${maxStock}`, '⚠️');
  }

  if (item.qty <= 0) {
    clientCart = clientCart.filter(i => i.id !== productId);
  }

  updateCartUI();
}

function removeCartItem(productId) {
  clientCart = clientCart.filter(i => i.id !== productId);
  updateCartUI();
  showAppToast('Item removido da sacola.');
}

function updateCartUI() {
  const badgeCount = document.getElementById('cartBadgeCount');
  const itemsList = document.getElementById('cartItemsList');
  const subtotalText = document.getElementById('cartSubtotalText');
  const totalText = document.getElementById('cartTotalText');

  const totalItems = clientCart.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = clientCart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  if (badgeCount) badgeCount.textContent = totalItems;

  if (itemsList) {
    if (clientCart.length === 0) {
      itemsList.innerHTML = `
        <div class="empty-cart-view">
          <span>🛍️</span>
          <h4>Sua sacola está vazia</h4>
          <p>Conheça nossa linha de cosméticos e cuide das suas mãos todos os dias.</p>
        </div>
      `;
    } else {
      itemsList.innerHTML = clientCart.map(item => `
        <div class="cart-row-item">
          <img src="${item.image_url || 'https://images.unsplash.com/photo-1608248597359-543597d84877?auto=format&fit=crop&w=700&q=80'}" 
               alt="${item.name}" class="cart-row-thumb">
          <div class="cart-row-info">
            <h5 class="cart-row-title">${item.name}</h5>
            <div class="cart-row-price">R$ ${item.price.toFixed(2).replace('.', ',')}</div>
          </div>
          <div class="cart-qty-ctrl">
            <button class="cart-qty-btn" onclick="updateCartItemQty('${item.id}', -1)">−</button>
            <span class="cart-qty-val">${item.qty}</span>
            <button class="cart-qty-btn" onclick="updateCartItemQty('${item.id}', 1)">+</button>
          </div>
          <button class="cart-remove-item" onclick="removeCartItem('${item.id}')" title="Remover">&times;</button>
        </div>
      `).join('');
    }
  }

  if (subtotalText) subtotalText.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
  if (totalText) totalText.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
}

function handleCartCheckout() {
  if (clientCart.length === 0) {
    showAppToast('Sua sacola está vazia. Adicione produtos antes de finalizar!', '⚠️');
    return;
  }

  const clientName = prompt('Por favor, informe seu nome completo para o pedido:');
  if (!clientName || !clientName.trim()) return;

  const clientPhone = prompt('Informe seu WhatsApp para contato e acompanhamento:');
  if (!clientPhone || !clientPhone.trim()) return;

  const settings = window.AppDB.getSettings();
  const subtotal = clientCart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  // Registrar pedido real no banco de dados e dar baixa no estoque
  const newOrder = window.AppDB.addOrder({
    client_name: clientName.trim(),
    client_phone: clientPhone.trim(),
    delivery_type: 'Retirada no Ateliê / Envio',
    subtotal: subtotal,
    total: subtotal,
    items: clientCart
  });

  // Atualizar tela de produtos pois o estoque diminuiu!
  renderClientProducts();

  // Montar mensagem para o WhatsApp
  let message = `*Olá ${settings.business_name}! Gostaria de finalizar meu pedido de cosméticos:*\n\n`;
  message += `👤 *Cliente:* ${clientName.trim()}\n`;
  message += `📱 *Telefone:* ${clientPhone.trim()}\n`;
  message += `📦 *Pedido:* #${newOrder.id}\n\n`;
  message += `*Itens Selecionados:*\n`;

  clientCart.forEach((item, index) => {
    message += `${index + 1}. *${item.name}* (${item.qty}x) — R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')}\n`;
  });

  message += `\n*TOTAL DO PEDIDO:* R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
  message += `\n💳 Gostaria de pagar via Pix ou Cartão no Ateliê. Por favor, me confirme a disponibilidade para retirada! ✨`;

  // Limpar carrinho
  clientCart = [];
  updateCartUI();

  // Redirecionar para WhatsApp
  const waUrl = `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');
  showAppToast('Pedido registrado com sucesso no sistema!');
}

// ============================================================
// 6. ANTES E DEPOIS COM SLIDER POR ARRASTE DO MOUSE
// ============================================================
function initBeforeAfterSlider() {
  const container = document.getElementById('baContainer');
  const beforeSide = document.getElementById('baBeforeSide');
  const clippedImg = document.getElementById('baClippedImg');
  const dividerHandle = document.getElementById('baDividerHandle');
  const hint = document.querySelector('.ba-instruction-pill');

  if (!container || !beforeSide || !dividerHandle) return;

  // Sincroniza a largura real da imagem recortada para casar pixel a pixel com o fundo
  function syncClippedImageWidth() {
    if (clippedImg && container) {
      clippedImg.style.width = `${container.offsetWidth}px`;
    }
  }

  syncClippedImageWidth();
  window.addEventListener('resize', syncClippedImageWidth);

  let isDragging = false;

  function updateSlider(clientX) {
    const rect = container.getBoundingClientRect();
    let offsetX = clientX - rect.left;
    let percentage = (offsetX / rect.width) * 100;

    // Limites de 4% a 96%
    if (percentage < 4) percentage = 4;
    if (percentage > 96) percentage = 96;

    beforeSide.style.width = `${percentage}%`;
    dividerHandle.style.left = `${percentage}%`;

    if (hint && hint.style.display !== 'none') {
      hint.style.opacity = '0';
      setTimeout(() => { hint.style.display = 'none'; }, 300);
    }
  }

  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    updateSlider(e.clientX);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    updateSlider(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch para Celulares
  container.addEventListener('touchstart', (e) => {
    isDragging = true;
    if (e.touches && e.touches[0]) updateSlider(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    if (e.touches && e.touches[0]) updateSlider(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });
}

// ============================================================
// 7. MENU MOBILE & TOAST
// ============================================================
function initMobileMenu() {
  const toggleBtn = document.getElementById('menuToggleBtn');
  const navLinks = document.getElementById('navLinks');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
      });
    });
  }
}

function showAppToast(message, icon = '✓') {
  const toast = document.getElementById('appToast');
  const text = document.getElementById('toastText');
  const iconEl = document.getElementById('toastIcon');
  if (!toast || !text) return;

  text.textContent = message;
  if (iconEl) iconEl.textContent = icon;

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// ============================================================
// 8. GALERIA MOSAICO 3D - SCROLL REVEAL (FOTOS REAIS DE UNHAS)
// ============================================================
function initMosaicGallery() {
  const track = document.getElementById('mosaicTrack');
  const wrapper = document.getElementById('mosaicWrapper');
  const center = document.getElementById('mosaicCenter');
  if (!track || !wrapper) return;

  const tiles = wrapper.querySelectorAll('.mosaic-tile:not(.center)');
  const tileOffsets = [
    { x: -30, y: -20 }, // tile-1 (one)
    { x: 0,   y: -25 }, // tile-2 (two)
    { x: 25,  y: -15 }, // tile-3 (three)
    { x: 30,  y: -20 }, // tile-4 (four)
    { x: -30, y: 20 },  // tile-5 (five)
    { x: -25, y: 0 },   // tile-6 (six)
    { x: 0,   y: 25 },  // tile-7 (seven)
    { x: 30,  y: 20 }   // tile-8 (eight)
  ];

  let isTicking = false;

  function updateMosaic() {
    const rect = track.getBoundingClientRect();
    const windowH = window.innerHeight;
    const totalDist = rect.height - windowH;

    if (totalDist <= 0) {
      isTicking = false;
      return;
    }

    // Calcular progresso de rolagem de 0.0 a 1.0 dentro da faixa sticky
    let progress = (-rect.top) / totalDist;
    progress = Math.max(0, Math.min(1, progress));

    // Fator de aproximação das caixas:
    // 0% a 5%: início afastado (boxFactor = 1)
    // 5% a 45%: fecha de forma ágil e suave (boxFactor vai de 1 a 0)
    // 45% a 100%: TOTALMENTE FECHADO e ESTÁVEL (boxFactor = 0)
    // Dá o tempo ideal para admirar todas as fotos sem exigir rolagem excessiva para continuar navegando!
    let boxFactor;
    if (progress <= 0.05) {
      boxFactor = 1;
    } else if (progress <= 0.45) {
      boxFactor = (0.45 - progress) / (0.45 - 0.05);
    } else {
      boxFactor = 0; // Totalmente montado!
    }
    boxFactor = Math.max(0, Math.min(1, boxFactor));

    // Aplicar translação 3D suave aos 8 quadros de unhas
    tiles.forEach((tile, index) => {
      const offset = tileOffsets[index] || { x: 0, y: 0 };
      const curX = offset.x * boxFactor;
      const curY = offset.y * boxFactor;
      tile.style.transform = `translate3d(${curX}%, ${curY}%, 0)`;

      // Habilitar destaque e escala suave ao passar o cursor quando montado
      if (boxFactor === 0) {
        tile.classList.add('assembled');
      } else {
        tile.classList.remove('assembled');
      }
    });

    // Indicador elegante de Mosaico Montado
    const assembledPill = document.getElementById('mosaicAssembledPill');
    if (assembledPill) {
      if (progress >= 0.45 && progress < 0.94) {
        assembledPill.classList.add('show');
      } else {
        assembledPill.classList.remove('show');
      }
    }

    // Controlar transformação fluida do quadro central (.center)
    if (center) {
      const isMobile = window.innerWidth <= 768;
      const startW = isMobile ? Math.min(window.innerWidth * 0.88, 300) : 560;
      const midW = isMobile ? Math.min(window.innerWidth * 0.70, 210) : 270;
      const endW = isMobile ? 60 : 105;

      let mouseW, cx, cy, textOpacity, mouseRotate, textDisplay;

      if (progress < 0.20) {
        const p = Math.max(0, (progress - 0.05) / 0.15);
        mouseW = startW - (startW - midW) * p;
        cx = 0;
        cy = 0;
        textOpacity = Math.max(0, 1 - p);
        mouseRotate = 0;
        textDisplay = textOpacity <= 0.05 ? 'none' : 'block';
      } else if (progress < 0.45) {
        const p = (progress - 0.20) / 0.25;
        mouseW = midW - (midW - endW) * p;
        cx = 0;
        cy = 0;
        textOpacity = 0;
        mouseRotate = 180 * p;
        textDisplay = 'none';
      } else {
        // A partir de 45%, o centro fica perfeitamente alinhado e travado no grid
        mouseW = endW;
        cx = 0;
        cy = 0;
        textOpacity = 0;
        mouseRotate = 180;
        textDisplay = 'none';
      }

      if (isMobile) {
        cx = 0;
        cy = 0;
      }

      center.style.width = `${mouseW}px`;
      center.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;

      const hgroup = center.querySelector('hgroup');
      if (hgroup) {
        hgroup.style.opacity = textOpacity;
        hgroup.style.display = textDisplay;
      }

      const mouseIcon = center.querySelector('.mouse');
      if (mouseIcon) {
        mouseIcon.style.transform = `translate(-50%, 50%) rotate(${mouseRotate}deg)`;
        mouseIcon.style.opacity = progress >= 0.45 ? '0' : '1';
      }
    }

    isTicking = false;
  }

  function requestScrollUpdate() {
    if (!isTicking) {
      window.requestAnimationFrame(updateMosaic);
      isTicking = true;
    }
  }

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate, { passive: true });
  updateMosaic();
}
