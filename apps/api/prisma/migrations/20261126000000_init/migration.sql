-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'CORPORATE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('WAITING', 'TAKEN_IN', 'WASHING', 'READY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "Settlement" AS ENUM ('DIRECT', 'ACCOUNT');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('PAYMENT', 'REFUND');

-- CreateEnum
CREATE TYPE "PaymentMethodKind" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "CashDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "CashSource" AS ENUM ('PAYMENT', 'REFUND', 'EXPENSE', 'MANUAL', 'OPENING', 'CLOSE_ADJUSTMENT', 'REVERSAL');

-- CreateEnum
CREATE TYPE "AccountTxDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "full_name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "totp_secret_encrypted" TEXT,
    "last_login_at" TIMESTAMPTZ(6),
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "password_changed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(6),
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "hired_at" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone_e164" TEXT,
    "email" TEXT,
    "type" "CustomerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "company_name" TEXT,
    "tax_no" TEXT,
    "whatsapp_operational_optin" BOOLEAN NOT NULL DEFAULT false,
    "kvkk_notice_at" TIMESTAMPTZ(6),
    "first_visit_at" TIMESTAMPTZ(6),
    "last_visit_at" TIMESTAMPTZ(6),
    "visit_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "anonymized_at" TIMESTAMPTZ(6),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_notes" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_types" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vehicle_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "plate_normalized" TEXT NOT NULL,
    "plate_display" TEXT NOT NULL,
    "is_foreign_plate" BOOLEAN NOT NULL DEFAULT false,
    "brand" TEXT,
    "model" TEXT,
    "vehicle_type_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_vehicles" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "linked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlinked_at" TIMESTAMPTZ(6),

    CONSTRAINT "customer_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration_minutes" INTEGER NOT NULL,
    "discountable" BOOLEAN NOT NULL DEFAULT true,
    "show_on_website" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "vat_rate_bps" INTEGER NOT NULL DEFAULT 2000,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_prices" (
    "id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "vehicle_type_id" UUID,
    "price_kurus" INTEGER NOT NULL,
    "valid_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_to" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_orders" (
    "id" UUID NOT NULL,
    "order_no" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "vehicle_type_id" UUID,
    "customer_name_snapshot" TEXT NOT NULL,
    "plate_snapshot" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'WAITING',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "settlement" "Settlement" NOT NULL DEFAULT 'DIRECT',
    "subtotal_kurus" INTEGER NOT NULL,
    "manual_discount_kurus" INTEGER NOT NULL DEFAULT 0,
    "campaign_discount_kurus" INTEGER NOT NULL DEFAULT 0,
    "total_kurus" INTEGER NOT NULL,
    "paid_kurus" INTEGER NOT NULL DEFAULT 0,
    "estimated_minutes" INTEGER,
    "accepted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "work_started_at" TIMESTAMPTZ(6),
    "ready_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "cancel_reason" TEXT,
    "notes" TEXT,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vehicle_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "service_name_snapshot" TEXT NOT NULL,
    "unit_price_kurus" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "discount_kurus" INTEGER NOT NULL DEFAULT 0,
    "line_total_kurus" INTEGER NOT NULL,
    "vat_rate_bps" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_status_history" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "from_status" "OrderStatus",
    "to_status" "OrderStatus" NOT NULL,
    "changed_by_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_order_assignments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_order_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_tokens" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "last_viewed_at" TIMESTAMPTZ(6),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "PaymentMethodKind" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "type" "PaymentType" NOT NULL,
    "order_id" UUID,
    "account_id" UUID,
    "payment_method_id" UUID NOT NULL,
    "amount_kurus" INTEGER NOT NULL,
    "refund_of_id" UUID,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "business_date" DATE NOT NULL,
    "received_by_id" UUID NOT NULL,
    "idempotency_key" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_transactions" (
    "id" UUID NOT NULL,
    "direction" "CashDirection" NOT NULL,
    "source" "CashSource" NOT NULL,
    "amount_kurus" INTEGER NOT NULL,
    "payment_id" UUID,
    "expense_id" UUID,
    "reversal_of_id" UUID,
    "day_close_id" UUID,
    "business_date" DATE NOT NULL,
    "description" TEXT,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_day_closes" (
    "id" UUID NOT NULL,
    "business_date" DATE NOT NULL,
    "opening_kurus" INTEGER NOT NULL,
    "expected_kurus" INTEGER NOT NULL,
    "counted_kurus" INTEGER NOT NULL,
    "difference_kurus" INTEGER NOT NULL,
    "note" TEXT,
    "closed_by_id" UUID NOT NULL,
    "closed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_day_closes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "payment_method_id" UUID NOT NULL,
    "amount_kurus" INTEGER NOT NULL,
    "expense_date" DATE NOT NULL,
    "description" TEXT,
    "reversal_of_id" UUID,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_accounts" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "credit_limit_kurus" INTEGER,
    "payment_term_days" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customer_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_transactions" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "direction" "AccountTxDirection" NOT NULL,
    "amount_kurus" INTEGER NOT NULL,
    "order_id" UUID,
    "payment_id" UUID,
    "reversal_of_id" UUID,
    "business_date" DATE NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "business_name" TEXT NOT NULL,
    "legal_name" TEXT,
    "slogan" TEXT,
    "logo_path" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#0e7490',
    "phone" TEXT,
    "whatsapp_phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "map_lat" DOUBLE PRECISION,
    "map_lng" DOUBLE PRECISION,
    "working_hours" JSONB NOT NULL,
    "social_links" JSONB NOT NULL DEFAULT '{}',
    "quiet_hours_start" TEXT NOT NULL DEFAULT '21:00',
    "quiet_hours_end" TEXT NOT NULL DEFAULT '09:00',
    "tracking_token_ttl_hours" INTEGER NOT NULL DEFAULT 24,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "time_zone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "business_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_settings" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "secret_encrypted" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "last_test_at" TIMESTAMPTZ(6),
    "last_test_result" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "integration_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_key_key" ON "roles"("key");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_hash_key" ON "user_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");

-- CreateIndex
CREATE INDEX "customers_phone_e164_idx" ON "customers"("phone_e164");

-- CreateIndex
CREATE INDEX "customers_last_visit_at_idx" ON "customers"("last_visit_at");

-- CreateIndex
CREATE INDEX "customers_full_name_idx" ON "customers"("full_name");

-- CreateIndex
CREATE INDEX "customer_notes_customer_id_created_at_idx" ON "customer_notes"("customer_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_types_name_key" ON "vehicle_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_normalized_key" ON "vehicles"("plate_normalized");

-- CreateIndex
CREATE INDEX "customer_vehicles_customer_id_idx" ON "customer_vehicles"("customer_id");

-- CreateIndex
CREATE INDEX "customer_vehicles_vehicle_id_idx" ON "customer_vehicles"("vehicle_id");

-- CreateIndex
CREATE INDEX "service_prices_service_id_vehicle_type_id_valid_from_idx" ON "service_prices"("service_id", "vehicle_type_id", "valid_from");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_orders_order_no_key" ON "vehicle_orders"("order_no");

-- CreateIndex
CREATE INDEX "vehicle_orders_status_accepted_at_idx" ON "vehicle_orders"("status", "accepted_at");

-- CreateIndex
CREATE INDEX "vehicle_orders_customer_id_accepted_at_idx" ON "vehicle_orders"("customer_id", "accepted_at");

-- CreateIndex
CREATE INDEX "vehicle_orders_vehicle_id_accepted_at_idx" ON "vehicle_orders"("vehicle_id", "accepted_at");

-- CreateIndex
CREATE INDEX "vehicle_orders_delivered_at_idx" ON "vehicle_orders"("delivered_at");

-- CreateIndex
CREATE INDEX "vehicle_order_items_order_id_idx" ON "vehicle_order_items"("order_id");

-- CreateIndex
CREATE INDEX "vehicle_order_items_service_id_idx" ON "vehicle_order_items"("service_id");

-- CreateIndex
CREATE INDEX "vehicle_status_history_order_id_created_at_idx" ON "vehicle_status_history"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "vehicle_order_assignments_employee_id_idx" ON "vehicle_order_assignments"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_order_assignments_order_id_employee_id_key" ON "vehicle_order_assignments"("order_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "tracking_tokens_token_hash_key" ON "tracking_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "tracking_tokens_order_id_idx" ON "tracking_tokens"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_name_key" ON "payment_methods"("name");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_account_id_idx" ON "payments"("account_id");

-- CreateIndex
CREATE INDEX "payments_business_date_idx" ON "payments"("business_date");

-- CreateIndex
CREATE INDEX "payments_received_at_idx" ON "payments"("received_at");

-- CreateIndex
CREATE UNIQUE INDEX "cash_transactions_payment_id_key" ON "cash_transactions"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "cash_transactions_expense_id_key" ON "cash_transactions"("expense_id");

-- CreateIndex
CREATE UNIQUE INDEX "cash_transactions_reversal_of_id_key" ON "cash_transactions"("reversal_of_id");

-- CreateIndex
CREATE INDEX "cash_transactions_business_date_idx" ON "cash_transactions"("business_date");

-- CreateIndex
CREATE UNIQUE INDEX "cash_day_closes_business_date_key" ON "cash_day_closes"("business_date");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_name_key" ON "expense_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_reversal_of_id_key" ON "expenses"("reversal_of_id");

-- CreateIndex
CREATE INDEX "expenses_expense_date_idx" ON "expenses"("expense_date");

-- CreateIndex
CREATE INDEX "expenses_category_id_idx" ON "expenses"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_accounts_customer_id_key" ON "customer_accounts"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_transactions_order_id_key" ON "account_transactions"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_transactions_payment_id_key" ON "account_transactions"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_transactions_reversal_of_id_key" ON "account_transactions"("reversal_of_id");

-- CreateIndex
CREATE INDEX "account_transactions_account_id_business_date_idx" ON "account_transactions"("account_id", "business_date");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "integration_settings_provider_key" ON "integration_settings"("provider");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_vehicles" ADD CONSTRAINT "customer_vehicles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_vehicles" ADD CONSTRAINT "customer_vehicles_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_prices" ADD CONSTRAINT "service_prices_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_prices" ADD CONSTRAINT "service_prices_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_orders" ADD CONSTRAINT "vehicle_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_orders" ADD CONSTRAINT "vehicle_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_orders" ADD CONSTRAINT "vehicle_orders_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_orders" ADD CONSTRAINT "vehicle_orders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_order_items" ADD CONSTRAINT "vehicle_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "vehicle_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_order_items" ADD CONSTRAINT "vehicle_order_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_status_history" ADD CONSTRAINT "vehicle_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "vehicle_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_status_history" ADD CONSTRAINT "vehicle_status_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_order_assignments" ADD CONSTRAINT "vehicle_order_assignments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "vehicle_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_order_assignments" ADD CONSTRAINT "vehicle_order_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_tokens" ADD CONSTRAINT "tracking_tokens_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "vehicle_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "vehicle_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "customer_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_refund_of_id_fkey" FOREIGN KEY ("refund_of_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_received_by_id_fkey" FOREIGN KEY ("received_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_reversal_of_id_fkey" FOREIGN KEY ("reversal_of_id") REFERENCES "cash_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_day_close_id_fkey" FOREIGN KEY ("day_close_id") REFERENCES "cash_day_closes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_day_closes" ADD CONSTRAINT "cash_day_closes_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_reversal_of_id_fkey" FOREIGN KEY ("reversal_of_id") REFERENCES "expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_accounts" ADD CONSTRAINT "customer_accounts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_transactions" ADD CONSTRAINT "account_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "customer_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_transactions" ADD CONSTRAINT "account_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "vehicle_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_transactions" ADD CONSTRAINT "account_transactions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_transactions" ADD CONSTRAINT "account_transactions_reversal_of_id_fkey" FOREIGN KEY ("reversal_of_id") REFERENCES "account_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
