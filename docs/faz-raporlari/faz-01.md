# Faz 1 — Altyapı ve Veritabanı · Durum Raporu

**Tarih:** 27.11.2026 · **Durum:** CI'da doğrulandı ✅ — mobil görünüm ve Codespaces çalıştırması henüz kontrol edilmedi.

## Doğrulama sonucu (GitHub Actions, CI #30, commit `70f0fc6`)

| Adım | Sonuç |
|---|---|
| Bağımlılık kurulumu (lockfile CI'da üretildi) | ✅ |
| Lint (ESLint) | ✅ |
| Tip kontrolü (shared, api, web) | ✅ |
| Migration + seed (gerçek PostgreSQL 16) | ✅ |
| Drift kontrolü (elle yazılan SQL ↔ Prisma şeması) | ✅ uyumlu |
| Unit testler (`packages/shared`) | ✅ 74/74 |
| Entegrasyon testleri (`apps/api`) | ✅ 8/8 |
| Build (shared, api, web) | ✅ |
| Docker imajları (api, web) | ✅ derlendi |
| Gizli bilgi taraması (gitleaks) | ✅ sızıntı yok |

**Açık kalanlar:**
- `pnpm-lock.yaml` repoda yok; CI her çalışmada yeniden üretiyor (artifact: `pnpm-lock`). Tekrarlanabilir kurulum için repoya eklenmeli.
- Panelin ve sitenin mobil görünümü gerçek tarayıcıda (Codespaces) kontrol edilmedi.
- GitHub, kullanılan bazı action'ların Node 20 sürümünün kullanımdan kalktığı uyarısını veriyor (çalışmayı engellemiyor); action sürümleri güncellenecek.

## Önemli kısıt: yerel derleme yapılamadı

Geliştirme yapılan bilgisayar bir iş yeri bilgisayarı; yönetici izni olmadığı için Node.js, Git, PostgreSQL ve Docker kurulamadı. Bu yüzden:

- Hiçbir komut (install, build, test) yerelde çalıştırılmadı.
- Kod derleyici yerine satır satır gözden geçirildi.
- İlk migration SQL'i `prisma migrate dev` yerine **elle yazıldı**. Şema ile birebir uyuştuğu CI'daki drift kontrolüyle doğrulanacak.
- `pnpm-lock.yaml` henüz yok. CI ilk çalışmada oluşturup artifact olarak yükleyecek; daha sonra repoya eklenmeli.

**Doğrulama yolu (kurulum gerektirmez):**
1. **GitHub Actions:** Her push'ta lint, tip kontrolü, migration, drift kontrolü, seed, testler, build ve Docker build çalışır.
2. **GitHub Codespaces:** Uygulama bulutta, tarayıcıdan çalıştırılır (`.devcontainer/`). Node ve PostgreSQL hazır gelir; telefondan da açılabilir.

Bu adımlar yeşil olmadan Faz 1 "tamamlandı" sayılmayacak.

## Yapılanlar

| Alan | İçerik |
|---|---|
| Monorepo | pnpm workspace (`apps/api`, `apps/web`, `packages/shared`), ortak TS ayarları, ESLint (XSS ve güvensiz SQL kuralları dahil), Prettier, `.editorconfig`, `.gitattributes` |
| Ortak iş kuralları | `packages/shared`: kuruş aritmetiği, kuruş kaybetmeyen indirim dağıtımı, TL biçimlendirme/ayrıştırma, plaka normalizasyonu ve Türk plaka doğrulama, araç durum makinesi, ödeme durumu, yetki anahtarları ve varsayılan rol matrisi, İstanbul saat dilimi |
| API | NestJS 11, `/api/v1` sürümleme, ortam değişkeni doğrulama (zod), tek tip Türkçe hata biçimi, helmet, pino (cookie ve token loglanmaz), Prisma servisi |
| Veritabanı | 27 tablo, 9 enum, FK, unique ve index'ler; ek kısıtlar: aynı araç için tek aktif kabul, tutar tutarlılığı CHECK'leri, pozitif finansal tutarlar, iade–ödeme bağı, tek satırlık işletme ayarları |
| Seed | 3 sistem rolü, 38 yetki, araç tipleri, ödeme yöntemleri, gider kategorileri, işletme ayarları. Örnek müşteri verisi yok; tekrar çalıştırılabilir. |
| Web | Next.js 15 + Tailwind 4; marka rengi veritabanından; panel (masaüstünde sidebar, mobilde çekmece menü, 44px dokunma hedefleri); sistem durumu sayfası; mobil uyumlu ana sayfa iskeleti; WhatsApp butonu (numara tanımlıysa); PWA manifest'i; robots/sitemap; güvenlik başlıkları |
| Altyapı | Docker Compose (geliştirme), API ve web Dockerfile'ları (root olmayan kullanıcı, healthcheck), GitHub Actions CI, Codespaces yapılandırması |

## API uç noktaları

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/api/v1/system/health` | API + DB durumu, sürüm, migration sayısı, iş günü. DB yoksa 503. |
| GET | `/api/v1/public/site` | Herkese açık işletme bilgisi (sadece yayınlanabilir alanlar) |

## Testler (yazıldı, CI'da çalışacak)

- **Unit (`packages/shared`)**: para (yuvarlama, dağıtım değişmezi — 200 rastgele girdi, TL ayrıştırma), plaka (normalizasyon, Türk plaka biçimi, maskeleme), durum makinesi (izinli/yasak geçişler, terminal durumlar, gerekçe/yetki kuralları), ödeme durumu (dokümandaki 750 TL örneği dahil), rol yetkileri, saat dilimi sınırı.
- **Entegrasyon (`apps/api`, gerçek PostgreSQL)**: sağlık ucu, public site ucu (iç alan sızmıyor), 404 hata biçimi, güvenlik başlıkları, seed doğruluğu, plaka tekilliği, aynı araç için ikinci aktif kabulün engellenmesi, tutarsız toplamın CHECK ile reddi.

## Bilerek ertelenenler

- Finansal tabloların silinemezlik trigger'ları → Faz 8 (finans iş mantığıyla birlikte).
- Production compose, Nginx, yedekleme → Faz 17.
- Panel girişi yok → Faz 2. **Bu sürüm gerçek veriyle veya herkese açık bir sunucuda kullanılmamalı.**
- PWA ikonu şimdilik SVG; bazı Android cihazlar PNG ister → Faz 15'te PNG ikon seti.
- E2E (Playwright) testleri → Faz 2 (giriş akışıyla birlikte).

## Bilinen riskler

- Elle yazılan migration: drift kontrolü uyuşmazlık bulursa düzeltme migration'ı eklenecek.
- Seed production imajında `tsx` gerektiriyor (dev bağımlılığı) → Faz 17'de derlenmiş seed'e geçilecek.

## Sonraki faz

**Faz 2 — Kimlik doğrulama ve yetkilendirme:** giriş/çıkış, sunucu tarafı oturum, Argon2id, parola politikası, brute-force koruması, sahip için TOTP, rol/yetki guard'ı, audit log, kullanıcı/personel/rol ekranları, ilk kurulum komutu, Playwright E2E.
