-- Prisma şemasıyla ifade edilemeyen veritabanı kuralları (bkz. docs/02 §5.4).
-- Bu kısıtlar uygulama hatalarına karşı son savunma hattıdır.

-- Aynı araç için aynı anda en fazla bir aktif (teslim/iptal edilmemiş) kabul kaydı
CREATE UNIQUE INDEX "vehicle_orders_one_active_per_vehicle"
  ON "vehicle_orders" ("vehicle_id")
  WHERE "status" NOT IN ('DELIVERED', 'CANCELLED');

-- Aktif bölüm: kısmi index (aktif araç listesi hızlı gelsin)
CREATE INDEX "vehicle_orders_active_idx"
  ON "vehicle_orders" ("accepted_at")
  WHERE "status" NOT IN ('DELIVERED', 'CANCELLED');

-- Bir müşteri–araç çiftinin tek aktif bağlantısı olabilir
CREATE UNIQUE INDEX "customer_vehicles_active_link"
  ON "customer_vehicles" ("customer_id", "vehicle_id")
  WHERE "unlinked_at" IS NULL;

-- Sipariş tutar tutarlılığı
ALTER TABLE "vehicle_orders" ADD CONSTRAINT "vehicle_orders_amounts_check" CHECK (
  "subtotal_kurus" >= 0
  AND "manual_discount_kurus" >= 0
  AND "campaign_discount_kurus" >= 0
  AND "total_kurus" = "subtotal_kurus" - "manual_discount_kurus" - "campaign_discount_kurus"
  AND "total_kurus" >= 0
  AND "paid_kurus" >= 0
  AND "paid_kurus" <= "total_kurus"
);

ALTER TABLE "vehicle_order_items" ADD CONSTRAINT "vehicle_order_items_amounts_check" CHECK (
  "unit_price_kurus" >= 0
  AND "quantity" > 0
  AND "discount_kurus" >= 0
  AND "line_total_kurus" = "unit_price_kurus" * "quantity" - "discount_kurus"
  AND "line_total_kurus" >= 0
);

ALTER TABLE "service_prices" ADD CONSTRAINT "service_prices_price_check" CHECK ("price_kurus" >= 0);

-- Finansal tutarlar her zaman pozitif; yönü type/direction belirler
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_check" CHECK ("amount_kurus" > 0);
ALTER TABLE "payments" ADD CONSTRAINT "payments_target_check" CHECK (
  ("type" = 'REFUND' AND "refund_of_id" IS NOT NULL)
  OR ("type" = 'PAYMENT' AND "refund_of_id" IS NULL)
);
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_amount_check" CHECK ("amount_kurus" > 0);
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_amount_check" CHECK ("amount_kurus" > 0);
ALTER TABLE "account_transactions" ADD CONSTRAINT "account_transactions_amount_check" CHECK ("amount_kurus" > 0);

-- İşletme ayarları tek satırdır
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_singleton_check" CHECK ("id" = 1);
