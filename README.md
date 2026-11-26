# KUZHAN Oto Yıkama Management System

Oto yıkama işletmeleri için araç kabul, müşteri, finans, pazarlama, anket ve raporlama yönetim sistemi + işletme tanıtım sitesi.

**Durum:** Faz 1 — Altyapı. Mimari onaylandı (tüm K-01…K-15 kararları önerildiği gibi). Ayrıntı: [docs/faz-raporlari/faz-01.md](docs/faz-raporlari/faz-01.md)

## Geliştirme ortamı

**Gereksinimler:** Node.js ≥ 22, pnpm 9, PostgreSQL 16 (yerel kurulum veya `infra/docker-compose.yml`).

```powershell
npm install -g pnpm@9
```

```powershell
pnpm install
```

Ortam dosyalarını oluşturun ve `DATABASE_URL`'yi kendi PostgreSQL bilgilerinizle doldurun:

```powershell
Copy-Item apps/api/.env.example apps/api/.env; Copy-Item apps/web/.env.example apps/web/.env.local
```

Veritabanını hazırlayın (migration + başlangıç verisi):

```powershell
pnpm --filter @kuzhan/shared build; pnpm db:deploy; pnpm db:seed
```

Çalıştırın (API: http://localhost:4000/api/v1 · Site: http://localhost:3000 · Panel: http://localhost:3000/panel):

```powershell
pnpm dev
```

Kontroller:

```powershell
pnpm lint; pnpm typecheck; pnpm test; pnpm build
```

| Klasör | İçerik |
|---|---|
| `apps/api` | NestJS API (`/api/v1`), Prisma şeması ve migration'lar |
| `apps/web` | Next.js — tanıtım sitesi (`/`) ve yönetim paneli (`/panel`) |
| `packages/shared` | Ortak iş kuralları: para (kuruş), plaka, durum makinesi, yetkiler |
| `infra` | Docker Compose (geliştirme) — production yapılandırması Faz 17 |
| `docs` | Mimari dokümanlar ve faz raporları |

## Mimari dokümanlar

| Dosya | İçerik (istenen 16 çıktı) |
|---|---|
| [docs/01-kapsam-gereksinim-mimari.md](docs/01-kapsam-gereksinim-mimari.md) | 1 Kapsam analizi · 2 Eksik/çelişkili gereksinimler (E-01…E-30) · 3 Teknik mimari ve API tasarımı · 4 Klasör yapısı |
| [docs/02-veri-modeli-durum-finans.md](docs/02-veri-modeli-durum-finans.md) | 5 ERD ve tablo ilişkileri · 6 Araç kabul ve durum geçiş diyagramı · 7 Finansal veri modeli, hesaplama kuralları, rol–yetki matrisi |
| [docs/03-entegrasyon-anket-rapor.md](docs/03-entegrasyon-anket-rapor.md) | 8 WhatsApp mimarisi · 9 E-posta/kampanya/otomasyon · 10 Anket ve memnuniyet · 11 Raporlama |
| [docs/04-guvenlik-yol-haritasi-test.md](docs/04-guvenlik-yol-haritasi-test.md) | 12 Güvenlik ve KVKK kontrol listesi · 13 V1 aşamaları · 14 V2 hazırlığı · 15 Riskler · 16 Test ve deployment |

Diyagramlar Mermaid formatındadır; GitHub'da otomatik görüntülenir.

## Mimari kararlar (onaylandı — 26.11.2026)

Aşağıdaki kararların tamamı önerildiği şekilde onaylandı.

| # | Karar | Önerim | Neden önemli |
|---|---|---|---|
| K-01 | Ürünleştirme modeli | **Kurulum başına tek işletme**, ayrı sunucu + ayrı veritabanı; DB'de `tenant_id` yok | Veri karışması mimari olarak imkânsız olur; basit kalır |
| K-02 | Teknoloji yığını | Next.js (panel + site tek uygulama) · NestJS · Prisma · PostgreSQL · Tailwind + shadcn/ui · pnpm monorepo | Dokümandaki tercihlerle uyumlu, gerekçeleri 01 §3.1'de |
| K-03 | Kuyruk altyapısı | **pg-boss (PostgreSQL üzerinde), Redis yok** | Kurulum başına bir servis eksik; hacim için yeterli |
| K-04 | Para ve fiyat | Kuruş cinsinden tamsayı; fiyatlar **KDV dahil** girilir | Yuvarlama hatası olmaz; sahadaki fiyat pratiğiyle aynı |
| K-05 | Ciro ne zaman tanınır | **Teslim anında**; teslim öncesi ödemeler "alınan avans" | Tüm finans raporları buna bağlı |
| K-06 | Fatura / e-Arşiv / yazar kasa | **V1 kapsamı dışında**; yasal belge mevcut POS/ÖKC/mali müşavir ile; sistem sadece kalem bazında KDV oranı saklar | Dokümanda hiç geçmiyor; kapsamı netleştirmek gerekiyor |
| K-07 | Durum akışı | 6 durum korunur, ama `Bekliyor → Yıkama devam ediyor` doğrudan geçiş serbest | Personel iki butona basmaz; süre raporları bozulmaz |
| K-08 | Araç başına personel | **Birden fazla personel atanabilir** | Sahada 2–3 kişi bir araca bakar; tek alan performans raporunu yanlış yapar |
| K-09 | Telefon zorunluluğu | **Opsiyonel** (sadece plaka zorunlu); telefonsuz kayıtta mesaj gönderilmez | Telefon vermeyen müşteri kabulü kilitlememeli |
| K-10 | Sunucu | **Türkiye lokasyonlu VPS** (2 vCPU / 4 GB) — dükkândaki bilgisayar değil | WhatsApp webhook ve takip linki için sabit HTTPS adresi şart; KVKK açısından yurt içi |
| K-11 | Pazarlama ve anket gönderimi | Kod hazır olacak ama **varsayılan kapalı**; avukat/KVKK danışmanı teyidi sonrası açılır | İYS/KVKK ihlali idari para cezası riski taşır |
| K-12 | E-posta altyapısı | SMTP + webhook destekli bir servis için ortak arayüz; teslim/bounce istatistiği sadece servisle | SMTP teslim/tıklama verisi vermez; açılma oranı raporlanmayacak |
| K-13 | Mevcut veri | Varsa Excel/CSV'den müşteri + plaka + telefon içe aktarma; pazarlama izinleri **aktarılmaz** | Kanıtı olmayan izin, izin değildir |
| K-14 | İşletme sahibi için iki adımlı doğrulama (TOTP) | **V1'e dahil edilsin** (küçük iş, finansal veriyi korur) | Sahip hesabı tüm finansal veriye erişir |
| K-15 | WhatsApp numarası | İşletmenin **ayrı bir numara** ile Cloud API'ye bağlanması (mevcut numara taşınırsa telefondaki WhatsApp Business uygulamasından çıkar) | İşletmenin günlük WhatsApp kullanımını doğrudan etkiler |

## Sizden gereken bilgiler

1. Yukarıdaki kararlara onay veya düzeltme.
2. İşletmenin Meta Business / WhatsApp Business hesabı var mı? (Onay süreci Faz 1 ile paralel başlamalı.)
3. Kullanılacak alan adı ve e-posta hesabı (veya önerilecek servis).
4. Günlük ortalama araç sayısı ve personel sayısı (performans hedeflerini doğrulamak için).
5. Mevcut müşteri listesi var mı, hangi formatta?
6. GitHub repo URL'si (repo'yu siz oluşturduktan sonra).

## Sonraki adım

Kararlar onaylanınca **Faz 1**: monorepo, Docker Compose, PostgreSQL + Prisma şeması (çekirdek tablolar), CI, tasarım sistemi (mobil uyumlu sidebar/layout), boş ama çalışan panel ve site → GitHub'a ilk push → yerelde derleyip çalıştırma.
