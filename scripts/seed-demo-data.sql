-- Seed demo data para tenant `55263cb2-da58-4cb8-9c40-c072f8e98a35` (La Tiendita de Prueba)
-- Objetivo: dashboard con orders + WA conversations + fiados que se ve populated para buyer demo

DO $$
DECLARE
  tid uuid := '55263cb2-da58-4cb8-9c40-c072f8e98a35';
  coca_id uuid;
  sabritas_id uuid;
  corona_id uuid;
  marlboro_id uuid;
  leche_id uuid;
  boing_id uuid;
  mari_id uuid;
  jose_id uuid;
  ana_id uuid;
  pedro_id uuid;
  laura_id uuid;
  o1 uuid; o2 uuid; o3 uuid; o4 uuid; o5 uuid; o6 uuid;
BEGIN
  -- Get product IDs
  SELECT id INTO coca_id     FROM products WHERE tenant_id = tid AND name = 'Coca Cola 600ml' LIMIT 1;
  SELECT id INTO sabritas_id FROM products WHERE tenant_id = tid AND name = 'Sabritas Original 45g' LIMIT 1;
  SELECT id INTO corona_id   FROM products WHERE tenant_id = tid AND name = 'Corona Extra 355ml' LIMIT 1;
  SELECT id INTO marlboro_id FROM products WHERE tenant_id = tid AND name = 'Marlboro Rojos 20' LIMIT 1;
  SELECT id INTO leche_id    FROM products WHERE tenant_id = tid AND name = 'Leche Lala Entera 1L' LIMIT 1;
  SELECT id INTO boing_id    FROM products WHERE tenant_id = tid AND name = 'Boing Mango 500ml' LIMIT 1;

  -- Get customer IDs
  SELECT id INTO mari_id  FROM customers WHERE tenant_id = tid AND whatsapp_phone = '+5213311111111' LIMIT 1;
  SELECT id INTO jose_id  FROM customers WHERE tenant_id = tid AND whatsapp_phone = '+5213322222222' LIMIT 1;
  SELECT id INTO ana_id   FROM customers WHERE tenant_id = tid AND whatsapp_phone = '+5213333333333' LIMIT 1;

  -- Add 2 more customers
  INSERT INTO customers (tenant_id, whatsapp_phone, name)
  VALUES (tid, '+5213344444444', 'Don Pedro (taxista)'),
         (tid, '+5213355555555', 'Laura (escuela)')
  ON CONFLICT (tenant_id, whatsapp_phone) DO NOTHING;

  SELECT id INTO pedro_id FROM customers WHERE tenant_id = tid AND whatsapp_phone = '+5213344444444' LIMIT 1;
  SELECT id INTO laura_id FROM customers WHERE tenant_id = tid AND whatsapp_phone = '+5213355555555' LIMIT 1;

  -- Insert 6 orders con diferentes status y fechas
  INSERT INTO orders (tenant_id, customer_id, status, subtotal, total, payment_method, payment_status, source, notes, created_at)
  VALUES
    (tid, mari_id,  'delivered',       105, 105, 'efectivo',      'paid',    'whatsapp', '5 coronas y 1 sabritas',  now() - interval '2 days'),
    (tid, jose_id,  'delivered',       234, 234, 'transferencia', 'paid',    'whatsapp', '3 marlboros',            now() - interval '1 day'),
    (tid, ana_id,   'preparing',       420, 420, 'mercadopago',   'pending', 'whatsapp', 'pedido semanal negocio', now() - interval '4 hours'),
    (tid, pedro_id, 'confirmed',        54, 54, 'efectivo',       'pending', 'whatsapp', '3 boings',                now() - interval '2 hours'),
    (tid, laura_id, 'out_for_delivery', 189, 189, 'oxxo',          'paid',    'whatsapp', '7 sabritas para escuela', now() - interval '45 minutes'),
    (tid, mari_id,  'pending',          75, 75, 'efectivo',       'pending', 'whatsapp', '3 leches',                now() - interval '15 minutes')
  RETURNING id INTO o1;

  -- Insert 15 WhatsApp conversations (mix inbound + outbound, últimas 24h)
  INSERT INTO whatsapp_conversations (tenant_id, customer_id, direction, message_type, content, whatsapp_message_id, parse_confidence, created_at)
  VALUES
    (tid, mari_id,  'inbound',  'text', 'buenas, me manda 3 leches por favor',                                      'wmid_demo_1',  0.95, now() - interval '20 minutes'),
    (tid, mari_id,  'outbound', 'text', 'Claro Doña Mari, van 3 leches Lala. Total $75. ¿Efectivo?',              'wmid_demo_2',  NULL, now() - interval '18 minutes'),
    (tid, mari_id,  'inbound',  'text', 'sí, efectivo, gracias',                                                    'wmid_demo_3',  NULL, now() - interval '15 minutes'),
    (tid, laura_id, 'inbound',  'text', 'necesito 7 sabritas para la escuela',                                     'wmid_demo_4',  0.98, now() - interval '50 minutes'),
    (tid, laura_id, 'outbound', 'text', 'Perfecto Laura, 7 sabritas confirmadas. Total $189. Salen en 15 min',   'wmid_demo_5',  NULL, now() - interval '48 minutes'),
    (tid, pedro_id, 'inbound',  'text', 'don pedro, un boing por favor',                                          'wmid_demo_6',  0.85, now() - interval '2 hours 10 minutes'),
    (tid, pedro_id, 'outbound', 'text', 'Le confirmo 3 boings verdad? $54 total',                                'wmid_demo_7',  NULL, now() - interval '2 hours 5 minutes'),
    (tid, pedro_id, 'inbound',  'text', 'sí, 3 boings',                                                            'wmid_demo_8',  NULL, now() - interval '2 hours 3 minutes'),
    (tid, ana_id,   'inbound',  'text', 'hola, el pedido semanal del restaurante',                                 'wmid_demo_9',  0.90, now() - interval '4 hours 30 minutes'),
    (tid, ana_id,   'outbound', 'text', 'Ana, ya lo estoy preparando. Total $420. Pago mercadopago?',            'wmid_demo_10', NULL, now() - interval '4 hours 25 minutes'),
    (tid, ana_id,   'inbound',  'text', 'sí, ya te mando el link',                                                 'wmid_demo_11', NULL, now() - interval '4 hours 20 minutes'),
    (tid, jose_id,  'inbound',  'text', '3 marlboros rojos',                                                       'wmid_demo_12', 1.0,  now() - interval '1 day 3 hours'),
    (tid, jose_id,  'outbound', 'text', 'Van 3 marlboros. Total $234. Transferencia?',                            'wmid_demo_13', NULL, now() - interval '1 day 2 hours 55 minutes'),
    (tid, mari_id,  'inbound',  'text', 'me manda 5 coronas y unas sabritas',                                     'wmid_demo_14', 0.92, now() - interval '2 days 5 hours'),
    (tid, mari_id,  'outbound', 'text', 'Van 5 Coronas y 1 Sabritas. Total $105. ¿Alguna otra cosa?',           'wmid_demo_15', NULL, now() - interval '2 days 4 hours 50 minutes')
  ON CONFLICT (whatsapp_message_id) DO NOTHING;

  RAISE NOTICE 'Demo seed complete: 2 new customers + 6 orders + 15 WA conversations';
END $$;

SELECT
  (SELECT count(*) FROM customers WHERE tenant_id = '55263cb2-da58-4cb8-9c40-c072f8e98a35') as customers,
  (SELECT count(*) FROM orders WHERE tenant_id = '55263cb2-da58-4cb8-9c40-c072f8e98a35') as orders,
  (SELECT count(*) FROM whatsapp_conversations WHERE tenant_id = '55263cb2-da58-4cb8-9c40-c072f8e98a35') as messages,
  (SELECT count(*) FROM fiados WHERE tenant_id = '55263cb2-da58-4cb8-9c40-c072f8e98a35') as fiados,
  (SELECT count(*) FROM products WHERE tenant_id = '55263cb2-da58-4cb8-9c40-c072f8e98a35') as products;
