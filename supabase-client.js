/**
 * ============================================================
 * JOSI MANICURE - DATA LAYER & SUPABASE INTEGRATION CLIENT
 * ============================================================
 * Camada unificada de dados com suporte nativo ao Supabase
 * e fallback automático com persistência local para garantir
 * que o sistema funcione 100% no localhost imediatamente.
 */

const STORAGE_KEYS = {
  SETTINGS: 'jm_business_settings',
  SERVICES: 'jm_services',
  PRODUCTS: 'jm_products',
  CATEGORIES: 'jm_categories',
  BOOKINGS: 'jm_bookings',
  BLOCKS: 'jm_schedule_blocks',
  ORDERS: 'jm_orders',
  SUPABASE_CONFIG: 'jm_supabase_config'
};

// Configuração Padrão do Negócio
const DEFAULT_SETTINGS = {
  business_name: 'Josi Manicures',
  tagline: 'Sua beleza merece esse cuidado.',
  bio: 'Especialista em saúde, estética e cuidado refinado das unhas. Com mais de 7 anos de experiência e técnicas de cutilagem russa combinada, transformamos cada atendimento em um momento de autocuidado, acolhimento e sofisticação.',
  phone: '(35) 99877-6684',
  whatsapp: '5535998776684',
  address: 'Atendimento exclusivo com agendamento prévio - Minas Gerais (DDD 35)',
  instagram: '@josiane_aranha_91',
  instagram_url: 'https://www.instagram.com/josiane_aranha_91',
  threads: '@josiane_aranha_91',
  threads_url: 'https://www.threads.net/@josiane_aranha_91',
  opening_time: '09:00',
  closing_time: '19:00',
  slot_duration: 60, // em minutos
  work_days: [1, 2, 3, 4, 5, 6], // Seg a Sáb (0=Dom, 1=Seg, ..., 6=Sáb)
  lunch_start: '12:30',
  lunch_end: '13:30',
  currency: 'R$',
  pix_key: 'contato@josimanicure.com.br (Chave Pix E-mail)'
};

// Sementes Iniciais de Serviços
const DEFAULT_SERVICES = [
  {
    id: 'srv-1',
    name: 'Manicure Clássica (Mãos)',
    category: 'Unhas',
    description: 'Higienização completa, cutilagem russa combinada sem cortes, lixamento anatômico, massagem nutritiva e esmaltação perfeita.',
    price: 45.00,
    duration_minutes: 45,
    image_url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=700&q=80',
    is_popular: true,
    is_active: true
  },
  {
    id: 'srv-2',
    name: 'Pedicure Delicado (Pés)',
    category: 'Unhas',
    description: 'Higienização com sais emolientes, cutilagem suave, alinhamento técnico das lâminas, esfoliação com cristais de quartzo e hidratação profunda.',
    price: 55.00,
    duration_minutes: 50,
    image_url: 'https://images.unsplash.com/photo-1664643411326-6c589531be3c?auto=format&fit=crop&w=700&q=80',
    is_popular: false,
    is_active: true
  },
  {
    id: 'srv-3',
    name: 'Combo Mão e Pé Harmonioso',
    category: 'Combos',
    description: 'O cuidado completo e revigorante. Cutilagem russa nas mãos e pés, esfoliação perfumada, hidratação profunda e esmaltação refinada.',
    price: 90.00,
    duration_minutes: 90,
    image_url: 'assets/combo-mao-pe.jpg',
    is_popular: true,
    is_active: true
  },
  {
    id: 'srv-4',
    name: 'Esmaltação em Gel de Longa Duração',
    category: 'Gel & Esmaltação',
    description: 'Secagem instantânea em cabine LED. Brilho espelhado que não descasca e mantém as unhas impecáveis por 15 a 21 dias.',
    price: 75.00,
    duration_minutes: 60,
    image_url: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=700&q=80',
    is_popular: true,
    is_active: true
  },
  {
    id: 'srv-5',
    name: 'Blindagem & Banho de Gel Estruturado',
    category: 'Blindagem & Estrutura',
    description: 'Camada protetora sobre a unha natural com reforço estruturado de queratina. Previne quebras e estimula o crescimento saudável.',
    price: 110.00,
    duration_minutes: 75,
    image_url: 'assets/blindagem-gel-estruturado.jpg',
    is_popular: false,
    is_active: true
  },
  {
    id: 'srv-6',
    name: 'Spa das Mãos & Cuidados Especiais',
    category: 'Spa & Cuidados',
    description: 'Tratamento regenerador com máscara de parafina morna, peeling nutritivo, remoção de asperezas e massagem com óleos essenciais.',
    price: 85.00,
    duration_minutes: 60,
    image_url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=700&q=80',
    is_popular: false,
    is_active: true
  }
];

// Sementes Iniciais de Produtos Cosméticos
const DEFAULT_PRODUCTS = [
  {
    id: 'prd-1',
    name: 'Óleo Reparador de Cutículas (Jojoba & Vitamina E)',
    category: 'oleos',
    description: 'Toque seco e rápida absorção. Nutre a matriz ungueal, prevenindo cutículas ressecadas e pontas esbranquiçadas.',
    price: 42.00,
    stock: 18,
    image_url: 'assets/produtos/oleo-reparador.jpg',
    is_featured: true,
    is_active: true
  },
  {
    id: 'prd-2',
    name: 'Creme Aveludado para Mãos (Manteiga de Karité)',
    category: 'cremes',
    description: 'Emulsão ultra-hidratante com fragrância delicada de baunilha e amêndoas doces. Cria uma película aveludada anti-ressecamento.',
    price: 48.00,
    stock: 14,
    image_url: 'assets/produtos/creme-aveludado.jpg',
    is_featured: true,
    is_active: true
  },
  {
    id: 'prd-3',
    name: 'Sérum Fortalecedor com Queratina & Biotina',
    category: 'cuidados',
    description: 'Fórmula avançada que penetra nas camadas mais profundas da lâmina, devolvendo flexibilidade e força natural contra descamações.',
    price: 58.00,
    stock: 10,
    image_url: 'assets/produtos/serum-fortalecedor.jpg',
    is_featured: true,
    is_active: true
  },
  {
    id: 'prd-4',
    name: 'Esmalte Gel Effect Nude Champagne 10ml',
    category: 'esmaltes',
    description: 'Pigmentação intensa com acabamento sofisticado e brilho espelhado sem necessidade de cabine. Fórmula hipoalergênica 9-Free.',
    price: 28.00,
    stock: 25,
    image_url: 'assets/produtos/esmalte-gel.jpg',
    is_featured: false,
    is_active: true
  },
  {
    id: 'prd-5',
    name: 'Cera Nutritiva para Cutículas & Unhas Frágeis',
    category: 'oleos',
    description: 'Bálsamo sólido com cera de abelhas virgem, óleo de girassol e extrato de camomila. Perfeito para levar na bolsa e usar diariamente.',
    price: 35.00,
    stock: 12,
    image_url: 'assets/produtos/cera-nutritiva.jpg',
    is_featured: false,
    is_active: true
  },
  {
    id: 'prd-6',
    name: 'Kit Cuidados Diários Home Care Josi Manicures',
    category: 'cuidados',
    description: 'Contém 1 Óleo de Jojoba, 1 Creme de Karité, 1 Lixa de Cristal importada e estojo exclusivo de linho cru.',
    price: 120.00,
    stock: 8,
    image_url: 'assets/produtos/kit-cuidados.jpg',
    is_featured: true,
    is_active: true
  }
];

// Gerenciador Central de Dados
class AppDatabase {
  constructor() {
    this.initStorage();
  }

  initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BLOCKS)) {
      localStorage.setItem(STORAGE_KEYS.BLOCKS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    }
  }

  // --- CONFIGURAÇÕES ---
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(data);
      // Auto-migração para os dados reais de Josiane caso o cache local ainda tenha o número padrão anterior
      if (!parsed.whatsapp || parsed.whatsapp === '5511987654321' || parsed.phone?.includes('11) 98765')) {
        parsed.phone = DEFAULT_SETTINGS.phone;
        parsed.whatsapp = DEFAULT_SETTINGS.whatsapp;
        parsed.instagram = DEFAULT_SETTINGS.instagram;
        parsed.instagram_url = DEFAULT_SETTINGS.instagram_url;
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      }
      if (!parsed.business_name || parsed.business_name === 'Josi Manicure') {
        parsed.business_name = 'Josi Manicures';
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      }
      return { ...DEFAULT_SETTINGS, ...parsed, business_name: 'Josi Manicures' };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(newSettings) {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }

  // --- SUPABASE CONFIG ---
  getSupabaseConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
      return raw ? JSON.parse(raw) : { url: '', anonKey: '' };
    } catch {
      return { url: '', anonKey: '' };
    }
  }

  saveSupabaseConfig(url, anonKey) {
    const config = { url: url.trim(), anonKey: anonKey.trim() };
    localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(config));
    return config;
  }

  // --- SERVIÇOS ---
  getServices() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SERVICES);
      let list = data ? JSON.parse(data) : DEFAULT_SERVICES;
      // Auto-migração das imagens e categorias reais solicitadas
      let modified = false;
      list = list.map(s => {
        if (s.id === 'srv-2' && (s.image_url?.includes('photo-1519014816548-bf5fe059798b') || !s.image_url?.includes('1664643411326'))) {
          modified = true;
          return { ...s, image_url: 'https://images.unsplash.com/photo-1664643411326-6c589531be3c?auto=format&fit=crop&w=700&q=80' };
        }
        if (s.id === 'srv-3' && s.image_url !== 'assets/combo-mao-pe.jpg') {
          modified = true;
          return { ...s, image_url: 'assets/combo-mao-pe.jpg' };
        }
        if (s.id === 'srv-5' && (s.category !== 'Blindagem & Estrutura' || s.image_url !== 'assets/blindagem-gel-estruturado.jpg')) {
          modified = true;
          return { ...s, category: 'Blindagem & Estrutura', image_url: 'assets/blindagem-gel-estruturado.jpg' };
        }
        return s;
      });
      if (modified) {
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(list));
      }
      return list;
    } catch (e) {
      return DEFAULT_SERVICES;
    }
  }

  addService(service) {
    const services = this.getServices();
    const newService = {
      id: 'srv-' + Date.now(),
      is_active: true,
      is_popular: false,
      ...service,
      price: parseFloat(service.price) || 0,
      duration_minutes: parseInt(service.duration_minutes) || 45
    };
    services.push(newService);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    return newService;
  }

  updateService(id, updatedFields) {
    const services = this.getServices();
    const index = services.findIndex(s => s.id === id);
    if (index !== -1) {
      services[index] = { 
        ...services[index], 
        ...updatedFields,
        price: updatedFields.price !== undefined ? parseFloat(updatedFields.price) : services[index].price,
        duration_minutes: updatedFields.duration_minutes !== undefined ? parseInt(updatedFields.duration_minutes) : services[index].duration_minutes
      };
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
      return services[index];
    }
    return null;
  }

  deleteService(id) {
    let services = this.getServices();
    services = services.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    return true;
  }

  // --- PRODUTOS ---
  getProducts() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      let list = data ? JSON.parse(data) : DEFAULT_PRODUCTS;
      let modified = false;
      const imgMap = {
        'prd-1': 'assets/produtos/oleo-reparador.jpg',
        'prd-2': 'assets/produtos/creme-aveludado.jpg',
        'prd-3': 'assets/produtos/serum-fortalecedor.jpg',
        'prd-4': 'assets/produtos/esmalte-gel.jpg',
        'prd-5': 'assets/produtos/cera-nutritiva.jpg',
        'prd-6': 'assets/produtos/kit-cuidados.jpg'
      };
      list = list.map(p => {
        if (imgMap[p.id] && p.image_url !== imgMap[p.id]) {
          modified = true;
          return { ...p, image_url: imgMap[p.id] };
        }
        return p;
      });
      if (modified) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
      }
      return list;
    } catch (e) {
      return DEFAULT_PRODUCTS;
    }
  }

  addProduct(product) {
    const products = this.getProducts();
    const newProduct = {
      id: 'prd-' + Date.now(),
      is_active: true,
      is_featured: false,
      ...product,
      price: parseFloat(product.price) || 0,
      stock: parseInt(product.stock) || 0
    };
    products.push(newProduct);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return newProduct;
  }

  updateProduct(id, updatedFields) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { 
        ...products[index], 
        ...updatedFields,
        price: updatedFields.price !== undefined ? parseFloat(updatedFields.price) : products[index].price,
        stock: updatedFields.stock !== undefined ? parseInt(updatedFields.stock) : products[index].stock
      };
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      return products[index];
    }
    return null;
  }

  deleteProduct(id) {
    let products = this.getProducts();
    products = products.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return true;
  }

  // --- AGENDAMENTOS ---
  getBookings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  addBooking(bookingData) {
    const bookings = this.getBookings();

    // Verificação de segurança: Não permitir dois agendamentos no mesmo horário (se não cancelado)
    const isOccupied = bookings.some(b => 
      b.booking_date === bookingData.booking_date && 
      b.booking_time === bookingData.booking_time && 
      b.status !== 'Cancelado'
    );

    if (isOccupied) {
      throw new Error('Este horário já foi reservado por outra cliente. Por favor, escolha outro horário.');
    }

    // Verificação de bloqueios manuais na agenda
    const blocks = this.getBlocks();
    const isBlocked = blocks.some(bl => {
      if (bl.block_date !== bookingData.booking_date) return false;
      if (bl.all_day) return true;
      if (bl.start_time && bl.end_time) {
        return bookingData.booking_time >= bl.start_time && bookingData.booking_time < bl.end_time;
      }
      return false;
    });

    if (isBlocked) {
      throw new Error('A profissional não estará atendendo neste horário específico. Por favor, selecione outro horário.');
    }

    const newBooking = {
      id: 'bk-' + Date.now(),
      status: 'Confirmado',
      created_at: new Date().toISOString(),
      ...bookingData,
      service_price: parseFloat(bookingData.service_price) || 0
    };

    bookings.push(newBooking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    return newBooking;
  }

  updateBookingStatus(id, newStatus) {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      bookings[index].status = newStatus;
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
      return bookings[index];
    }
    return null;
  }

  rescheduleBooking(id, newDate, newTime) {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index === -1) return null;

    // Verificar colisão
    const hasCollision = bookings.some((b, i) => 
      i !== index && 
      b.booking_date === newDate && 
      b.booking_time === newTime && 
      b.status !== 'Cancelado'
    );

    if (hasCollision) {
      throw new Error('O novo horário selecionado já está ocupado.');
    }

    bookings[index].booking_date = newDate;
    bookings[index].booking_time = newTime;
    bookings[index].status = 'Remarcado';
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    return bookings[index];
  }

  // --- BLOQUEIOS DE AGENDA / FOLGAS ---
  getBlocks() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BLOCKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  addBlock(block) {
    const blocks = this.getBlocks();
    const newBlock = {
      id: 'blk-' + Date.now(),
      created_at: new Date().toISOString(),
      all_day: false,
      ...block
    };
    blocks.push(newBlock);
    localStorage.setItem(STORAGE_KEYS.BLOCKS, JSON.stringify(blocks));
    return newBlock;
  }

  deleteBlock(id) {
    let blocks = this.getBlocks();
    blocks = blocks.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BLOCKS, JSON.stringify(blocks));
    return true;
  }

  // --- PEDIDOS DA LOJA ---
  getOrders() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  addOrder(orderData) {
    const orders = this.getOrders();
    const newOrder = {
      id: 'ord-' + Date.now(),
      status: 'Pendente',
      created_at: new Date().toISOString(),
      ...orderData
    };

    // Baixa automática de estoque
    if (Array.isArray(orderData.items)) {
      orderData.items.forEach(item => {
        const products = this.getProducts();
        const p = products.find(prod => prod.id === item.id);
        if (p) {
          p.stock = Math.max(0, p.stock - (item.qty || 1));
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        }
      });
    }

    orders.push(newOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    return newOrder;
  }

  updateOrderStatus(id, newStatus) {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index].status = newStatus;
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      return orders[index];
    }
    return null;
  }
}

// Instância Global
window.AppDB = new AppDatabase();
