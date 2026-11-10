-- ============================================================
-- SCHEMA SUPABASE: JOSI MANICURE (BOUTIQUE & ATELIER DE BELEZA)
-- ============================================================

-- 1. TABELA DE CONFIGURAÇÕES DO NEGÓCIO
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR(150) NOT NULL DEFAULT 'Josi Manicure',
  tagline VARCHAR(255) DEFAULT 'Sua beleza merece esse cuidado.',
  phone VARCHAR(30) DEFAULT '(35) 99877-6684',
  whatsapp VARCHAR(30) DEFAULT '5535998776684',
  address VARCHAR(255) DEFAULT 'Alameda dos Nobres, 850 - Sala 32, Jardins - SP',
  instagram VARCHAR(100) DEFAULT '@josiane_aranha_91',
  opening_time TIME DEFAULT '09:00',
  closing_time TIME DEFAULT '19:00',
  slot_duration INT DEFAULT 45, -- Minutos por intervalo
  work_days JSONB DEFAULT '["ter", "qua", "qui", "sex", "sab"]'::jsonb,
  lunch_start TIME DEFAULT '12:30',
  lunch_end TIME DEFAULT '13:30',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE SERVIÇOS
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  category VARCHAR(80) DEFAULT 'Unhas',
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  duration_minutes INT NOT NULL DEFAULT 60,
  image_url TEXT,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE CATEGORIAS DE COSMÉTICOS
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE PRODUTOS & COSMÉTICOS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  category_slug VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 10,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE AGENDAMENTOS ONLINE
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  service_name VARCHAR(150) NOT NULL,
  service_price DECIMAL(10, 2) NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  client_name VARCHAR(150) NOT NULL,
  client_phone VARCHAR(30) NOT NULL,
  client_notes TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'Confirmado', -- 'Confirmado', 'Concluído', 'Cancelado', 'Remarcado'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para evitar duplicidade de horários reservados
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_slot_unique 
ON bookings (booking_date, booking_time) 
WHERE (status != 'Cancelado');

-- 6. TABELA DE BLOQUEIOS DE AGENDA / INTERVALOS / FOLGAS
CREATE TABLE IF NOT EXISTS schedule_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN DEFAULT false,
  reason VARCHAR(255) DEFAULT 'Bloqueio de Agenda / Intervalo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABELA DE PEDIDOS DA LOJA
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name VARCHAR(150) NOT NULL,
  client_phone VARCHAR(30) NOT NULL,
  delivery_type VARCHAR(50) DEFAULT 'Retirada no Ateliê',
  delivery_address TEXT,
  payment_method VARCHAR(50) DEFAULT 'Pix / Cartão',
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  shipping DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(50) NOT NULL DEFAULT 'Pendente', -- 'Pendente', 'Pago', 'Entregue', 'Cancelado'
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- DADOS INICIAIS (SEED)
-- ============================================================

-- Configuração inicial
INSERT INTO business_settings (business_name, tagline, phone, whatsapp, address, instagram)
VALUES (
  'Josi Manicure',
  'Sua beleza merece esse cuidado.',
  '(35) 99877-6684',
  '5535998776684',
  'Alameda dos Nobres, 850 - Sala 32, Jardins - SP',
  '@josiane_aranha_91'
) ON CONFLICT DO NOTHING;

-- Serviços Iniciais
INSERT INTO services (name, category, description, price, duration_minutes, image_url, is_popular, sort_order)
VALUES
(
  'Manicure Clássica (Mãos)',
  'Unhas',
  'Higienização completa, cutilagem russa combinada sem cortes, lixamento anatômico, massagem nutritiva e esmaltação perfeita.',
  45.00,
  45,
  'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=700&q=80',
  true,
  1
),
(
  'Pedicure Delicado (Pés)',
  'Unhas',
  'Higienização com sais emolientes, cutilagem suave, alinhamento técnico das lâminas, esfoliação com cristais de quartzo e hidratação.',
  55.00,
  50,
  'https://images.unsplash.com/photo-1664643411326-6c589531be3c?auto=format&fit=crop&w=700&q=80',
  false,
  2
),
(
  'Combo Mão e Pé Harmonioso',
  'Combos',
  'O cuidado completo e revigorante. Cutilagem russa nas mãos e pés, esfoliação perfumada, hidratação profunda e esmaltação refinada.',
  90.00,
  90,
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=700&q=80',
  true,
  3
),
(
  'Esmaltação em Gel de Longa Duração',
  'Gel & Esmaltação',
  'Secagem instantânea em cabine LED. Brilho espelhado que não descasca e mantém as unhas impecáveis por 15 a 21 dias.',
  75.00,
  60,
  'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=700&q=80',
  true,
  4
),
(
  'Blindagem & Banho de Gel Estruturado',
  'Gel & Esmaltação',
  'Camada protetora sobre a unha natural com reforço de queratina. Previne quebras, lascas e estimula o crescimento saudável.',
  110.00,
  75,
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=700&q=80',
  false,
  5
),
(
  'Spa das Mãos & Cuidados Especiais',
  'Spa & Cuidados',
  'Tratamento regenerador com máscara de parafina morna, peeling nutritivo, remoção de asperezas e massagem com óleos essenciais.',
  85.00,
  60,
  'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=700&q=80',
  false,
  6
);

-- Categorias de Cosméticos
INSERT INTO categories (name, slug) VALUES
('Cremes & Hidratantes', 'cremes'),
('Óleos para Cutículas', 'oleos'),
('Esmaltes & Finalizadores', 'esmaltes'),
('Cuidados Especiais', 'cuidados');

-- Produtos de Cosméticos Iniciais
INSERT INTO products (name, category_slug, description, price, stock, image_url, is_featured)
VALUES
(
  'Óleo Reparador de Cutículas (Jojoba & Vitamina E)',
  'oleos',
  'Toque seco e rápida absorção. Nutre a matriz ungueal, prevenindo cutículas ressecadas e pontas esbranquiçadas.',
  42.00,
  18,
  'https://images.unsplash.com/photo-1608248597359-543597d84877?auto=format&fit=crop&w=700&q=80',
  true
),
(
  'Creme Aveludado para Mãos (Manteiga de Karité)',
  'cremes',
  'Emulsão ultra-hidratante com fragrância delicada de baunilha e amêndoas doces. Cria uma película aveludada anti-ressecamento.',
  48.00,
  14,
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=700&q=80',
  true
),
(
  'Sérum Fortalecedor com Queratina & Biotina',
  'cuidados',
  'Fórmula avançada que penetra nas camadas mais profundas da lâmina, devolvendo flexibilidade e força natural contra descamações.',
  58.00,
  10,
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=700&q=80',
  true
),
(
  'Esmalte Gel Effect Nude Champagne 10ml',
  'esmaltes',
  'Pigmentação intensa com acabamento sofisticado e brilho espelhado sem necessidade de cabine. Fórmula 9-Free.',
  28.00,
  25,
  'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=700&q=80',
  false
),
(
  'Cera Nutritiva para Cutículas & Unhas Frágeis',
  'oleos',
  'Bálsamo sólido com cera de abelhas virgem, óleo de girassol e extrato de camomila. Perfeito para levar na bolsa e usar diariamente.',
  35.00,
  12,
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=700&q=80',
  false
),
(
  'Kit Cuidados Diários Home Care Josi Manicure',
  'cuidados',
  'Contém 1 Óleo de Jojoba, 1 Creme de Karité, 1 Lixa de Vidro de precisão e estojo exclusivo em linho cru.',
  120.00,
  8,
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=700&q=80',
  true
);
