"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2_1 = __importDefault(require("argon2"));
const shared_1 = require("@waflame/shared");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🔥 Starting database seeding...');
    // 1. Seed Permissions
    const permissionsData = [
        // Devices
        { name: 'Lihat Perangkat', slug: shared_1.Permission.DEVICE_READ, module: 'device', description: 'Melihat daftar dan status perangkat' },
        { name: 'Tambah Perangkat', slug: shared_1.Permission.DEVICE_CREATE, module: 'device', description: 'Menghubungkan perangkat baru' },
        { name: 'Ubah Perangkat', slug: shared_1.Permission.DEVICE_UPDATE, module: 'device', description: 'Mengubah konfigurasi perangkat' },
        { name: 'Hapus Perangkat', slug: shared_1.Permission.DEVICE_DELETE, module: 'device', description: 'Menghapus perangkat dari sistem' },
        { name: 'Kelola Sesi Perangkat', slug: shared_1.Permission.DEVICE_MANAGE, module: 'device', description: 'Scan QR, reconnect, dan restart sesi' },
        // Messages
        { name: 'Lihat Pesan', slug: shared_1.Permission.MESSAGE_READ, module: 'message', description: 'Melihat log riwayat pesan' },
        { name: 'Kirim Pesan', slug: shared_1.Permission.MESSAGE_SEND, module: 'message', description: 'Mengirim pesan instan atau bulk' },
        // Campaigns
        { name: 'Lihat Broadcast', slug: shared_1.Permission.CAMPAIGN_READ, module: 'campaign', description: 'Melihat riwayat dan status campaign' },
        { name: 'Buat Broadcast', slug: shared_1.Permission.CAMPAIGN_CREATE, module: 'campaign', description: 'Membuat campaign broadcast baru' },
        { name: 'Mulai Broadcast', slug: shared_1.Permission.CAMPAIGN_START, module: 'campaign', description: 'Menjalankan antrean campaign' },
        { name: 'Jeda Broadcast', slug: shared_1.Permission.CAMPAIGN_PAUSE, module: 'campaign', description: 'Menjeda sementara campaign' },
        { name: 'Lanjutkan Broadcast', slug: shared_1.Permission.CAMPAIGN_RESUME, module: 'campaign', description: 'Melanjutkan campaign yang dijeda' },
        { name: 'Batalkan Broadcast', slug: shared_1.Permission.CAMPAIGN_CANCEL, module: 'campaign', description: 'Membatalkan campaign berjalan' },
        // Contacts
        { name: 'Lihat Kontak', slug: shared_1.Permission.CONTACT_READ, module: 'contact', description: 'Melihat daftar kontak, grup, dan tag' },
        { name: 'Tambah Kontak', slug: shared_1.Permission.CONTACT_CREATE, module: 'contact', description: 'Menambah kontak baru' },
        { name: 'Ubah Kontak', slug: shared_1.Permission.CONTACT_UPDATE, module: 'contact', description: 'Mengubah profil kontak' },
        { name: 'Hapus Kontak', slug: shared_1.Permission.CONTACT_DELETE, module: 'contact', description: 'Menghapus kontak' },
        { name: 'Kelola Grup & Tag', slug: shared_1.Permission.CONTACT_MANAGE, module: 'contact', description: 'Mengelola tag, grup, dan blacklist' },
        { name: 'Import Kontak', slug: shared_1.Permission.CONTACT_IMPORT, module: 'contact', description: 'Upload file CSV / Excel' },
        { name: 'Export Kontak', slug: shared_1.Permission.CONTACT_EXPORT, module: 'contact', description: 'Download data kontak' },
        // Groups (WA)
        { name: 'Lihat Grup WA', slug: shared_1.Permission.GROUP_READ, module: 'group', description: 'Melihat daftar grup WhatsApp' },
        { name: 'Buat Grup WA', slug: shared_1.Permission.GROUP_CREATE, module: 'group', description: 'Membuat grup WhatsApp baru' },
        { name: 'Kelola Anggota Grup', slug: shared_1.Permission.GROUP_MANAGE, module: 'group', description: 'Invite, kick, promote, dan link grup' },
        // Inbox / CS
        { name: 'Lihat Percakapan', slug: shared_1.Permission.INBOX_READ, module: 'inbox', description: 'Melihat obrolan masuk di inbox' },
        { name: 'Balas Percakapan', slug: shared_1.Permission.INBOX_REPLY, module: 'inbox', description: 'Membalas chat langsung ke pelanggan' },
        { name: 'Kelola Tiket Percakapan', slug: shared_1.Permission.INBOX_MANAGE, module: 'inbox', description: 'Assign ke agent, ubah status tiket' },
        // Bot / Auto Reply
        { name: 'Lihat Auto Reply', slug: shared_1.Permission.BOT_READ, module: 'bot', description: 'Melihat daftar respon otomatis' },
        { name: 'Kelola Auto Reply', slug: shared_1.Permission.BOT_MANAGE, module: 'bot', description: 'Menambah atau mengubah bot rule' },
        // Webhooks
        { name: 'Lihat Webhook', slug: shared_1.Permission.WEBHOOK_READ, module: 'webhook', description: 'Melihat konfigurasi webhook' },
        { name: 'Kelola Webhook', slug: shared_1.Permission.WEBHOOK_MANAGE, module: 'webhook', description: 'Menambah, ubah, dan tes webhook' },
        // API Keys
        { name: 'Kelola API Key', slug: shared_1.Permission.APIKEY_MANAGE, module: 'apikey', description: 'Generate dan revoke API key' },
        // Team & RBAC
        { name: 'Lihat Anggota Tim', slug: shared_1.Permission.TEAM_READ, module: 'team', description: 'Melihat daftar anggota tim tenant' },
        { name: 'Undang Anggota Tim', slug: shared_1.Permission.TEAM_INVITE, module: 'team', description: 'Mengirim undangan ke user baru' },
        { name: 'Kelola Peran Tim', slug: shared_1.Permission.TEAM_MANAGE, module: 'team', description: 'Mengubah peran dan menghapus user' },
        // Billing
        { name: 'Lihat Tagihan', slug: shared_1.Permission.BILLING_READ, module: 'billing', description: 'Melihat paket dan invoice' },
        { name: 'Kelola Langganan', slug: shared_1.Permission.BILLING_MANAGE, module: 'billing', description: 'Upgrade paket atau bayar invoice' },
        // Super Admin
        { name: 'Kelola Seluruh Platform', slug: shared_1.Permission.SUPERADMIN_MANAGE, module: 'superadmin', description: 'Akses penuh superadmin platform' },
    ];
    console.log(`Seeding ${permissionsData.length} permissions...`);
    for (const perm of permissionsData) {
        await prisma.permission.upsert({
            where: { slug: perm.slug },
            update: { name: perm.name, description: perm.description, module: perm.module },
            create: perm,
        });
    }
    const allPermissions = await prisma.permission.findMany();
    // 2. Seed System Roles
    const rolesData = [
        {
            name: 'Super Admin',
            slug: shared_1.SystemRole.SUPER_ADMIN,
            description: 'Akses tanpa batas ke seluruh platform dan seluruh tenant',
            isSystem: true,
            permissions: allPermissions.map((p) => p.id),
        },
        {
            name: 'Admin / Owner',
            slug: shared_1.SystemRole.OWNER,
            description: 'Pemilik akun organisasi/tenant dengan kontrol penuh di tenantnya',
            isSystem: true,
            permissions: allPermissions
                .filter((p) => p.slug !== shared_1.Permission.SUPERADMIN_MANAGE)
                .map((p) => p.id),
        },
        {
            name: 'Manager',
            slug: shared_1.SystemRole.MANAGER,
            description: 'Pengelola operasional: campaign, kontak, inbox, dan pelaporan',
            isSystem: true,
            permissions: allPermissions
                .filter((p) => [
                shared_1.Permission.DEVICE_READ,
                shared_1.Permission.MESSAGE_READ,
                shared_1.Permission.MESSAGE_SEND,
                shared_1.Permission.CAMPAIGN_READ,
                shared_1.Permission.CAMPAIGN_CREATE,
                shared_1.Permission.CAMPAIGN_START,
                shared_1.Permission.CAMPAIGN_PAUSE,
                shared_1.Permission.CAMPAIGN_RESUME,
                shared_1.Permission.CONTACT_READ,
                shared_1.Permission.CONTACT_CREATE,
                shared_1.Permission.CONTACT_UPDATE,
                shared_1.Permission.CONTACT_MANAGE,
                shared_1.Permission.CONTACT_IMPORT,
                shared_1.Permission.CONTACT_EXPORT,
                shared_1.Permission.GROUP_READ,
                shared_1.Permission.GROUP_MANAGE,
                shared_1.Permission.INBOX_READ,
                shared_1.Permission.INBOX_REPLY,
                shared_1.Permission.INBOX_MANAGE,
                shared_1.Permission.BOT_READ,
                shared_1.Permission.BOT_MANAGE,
                shared_1.Permission.TEAM_READ,
            ].includes(p.slug))
                .map((p) => p.id),
        },
        {
            name: 'Agent / Customer Service',
            slug: shared_1.SystemRole.AGENT,
            description: 'Agen CS yang bertugas membalas pesan dan mengelola live chat inbox',
            isSystem: true,
            permissions: allPermissions
                .filter((p) => [
                shared_1.Permission.INBOX_READ,
                shared_1.Permission.INBOX_REPLY,
                shared_1.Permission.MESSAGE_READ,
                shared_1.Permission.CONTACT_READ,
            ].includes(p.slug))
                .map((p) => p.id),
        },
        {
            name: 'Developer / API User',
            slug: shared_1.SystemRole.API_USER,
            description: 'Akses integrasi sistem eksternal: API key, pesan keluar, dan webhook',
            isSystem: true,
            permissions: allPermissions
                .filter((p) => [
                shared_1.Permission.APIKEY_MANAGE,
                shared_1.Permission.WEBHOOK_READ,
                shared_1.Permission.WEBHOOK_MANAGE,
                shared_1.Permission.MESSAGE_READ,
                shared_1.Permission.MESSAGE_SEND,
                shared_1.Permission.CONTACT_READ,
                shared_1.Permission.CONTACT_CREATE,
            ].includes(p.slug))
                .map((p) => p.id),
        },
    ];
    console.log('Seeding system roles & mapping permissions...');
    for (const roleDef of rolesData) {
        let role = await prisma.role.findFirst({
            where: {
                slug: roleDef.slug,
                tenantId: null,
            },
        });
        if (role) {
            role = await prisma.role.update({
                where: { id: role.id },
                data: {
                    name: roleDef.name,
                    description: roleDef.description,
                    isSystem: true,
                },
            });
        }
        else {
            role = await prisma.role.create({
                data: {
                    name: roleDef.name,
                    slug: roleDef.slug,
                    description: roleDef.description,
                    isSystem: true,
                },
            });
        }
        // Sync role permissions
        await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
        await prisma.rolePermission.createMany({
            data: roleDef.permissions.map((pId) => ({
                roleId: role.id,
                permissionId: pId,
            })),
            skipDuplicates: true,
        });
    }
    // 3. Seed Subscription Plans
    console.log('Seeding subscription plans...');
    const plansData = [
        {
            name: 'Free Trial',
            slug: 'free',
            description: 'Paket gratis untuk uji coba fitur WhatsApp Gateway Waflame',
            price: 0,
            billingCycle: 'MONTHLY',
            maxDevices: 1,
            maxContacts: 200,
            maxCampaignsPerMonth: 5,
            maxMessagesPerMonth: 500,
            features: {
                qr_mode: true,
                official_cloud: false,
                auto_reply: true,
                api_access: false,
                webhooks: false,
            },
        },
        {
            name: 'Starter Pro',
            slug: 'starter-pro',
            description: 'Ideal untuk UMKM dan bisnis berkembang dengan multi-device',
            price: 149000,
            billingCycle: 'MONTHLY',
            maxDevices: 3,
            maxContacts: 5000,
            maxCampaignsPerMonth: 50,
            maxMessagesPerMonth: 10000,
            features: {
                qr_mode: true,
                official_cloud: true,
                auto_reply: true,
                api_access: true,
                webhooks: true,
            },
        },
        {
            name: 'Enterprise Flame',
            slug: 'enterprise-flame',
            description: 'Kapasitas tanpa batas untuk enterprise dan volume broadcast masif',
            price: 499000,
            billingCycle: 'MONTHLY',
            maxDevices: 15,
            maxContacts: 100000,
            maxCampaignsPerMonth: 500,
            maxMessagesPerMonth: 250000,
            features: {
                qr_mode: true,
                official_cloud: true,
                auto_reply: true,
                api_access: true,
                webhooks: true,
                priority_support: true,
            },
        },
    ];
    for (const plan of plansData) {
        await prisma.plan.upsert({
            where: { slug: plan.slug },
            update: plan,
            create: plan,
        });
    }
    // 4. Seed Super Admin User & Organization
    const superadminEmail = process.env.SUPERADMIN_EMAIL || 'admin@waflame.com';
    const superadminPassword = process.env.SUPERADMIN_PASSWORD || 'SuperSecretPassword123!';
    const superadminName = process.env.SUPERADMIN_NAME || 'Waflame Super Admin';
    const hashedPassword = await argon2_1.default.hash(superadminPassword);
    console.log(`Seeding Super Admin user: ${superadminEmail}...`);
    const superadminUser = await prisma.user.upsert({
        where: { email: superadminEmail },
        update: {
            fullName: superadminName,
            isSuperadmin: true,
            isActive: true,
        },
        create: {
            email: superadminEmail,
            fullName: superadminName,
            passwordHash: hashedPassword,
            isSuperadmin: true,
            isActive: true,
            emailVerifiedAt: new Date(),
        },
    });
    // 5. Seed Default Tenant for Superadmin
    console.log('Seeding Default Tenant...');
    const defaultTenant = await prisma.tenant.upsert({
        where: { slug: 'waflame-hq' },
        update: {},
        create: {
            name: 'Waflame Headquarter',
            slug: 'waflame-hq',
            status: 'ACTIVE',
            maxDevices: 10,
            maxContacts: 50000,
            maxMessagesPerMonth: 100000,
        },
    });
    // Find Owner role
    const ownerRole = await prisma.role.findFirst({
        where: { slug: shared_1.SystemRole.OWNER, tenantId: null },
    });
    if (ownerRole) {
        await prisma.tenantUser.upsert({
            where: {
                tenantId_userId: {
                    tenantId: defaultTenant.id,
                    userId: superadminUser.id,
                },
            },
            update: {
                roleId: ownerRole.id,
                isOwner: true,
            },
            create: {
                tenantId: defaultTenant.id,
                userId: superadminUser.id,
                roleId: ownerRole.id,
                isOwner: true,
                status: 'ACTIVE',
            },
        });
    }
    // Assign Enterprise Plan to default tenant
    const enterprisePlan = await prisma.plan.findUnique({ where: { slug: 'enterprise-flame' } });
    if (enterprisePlan) {
        const existingSub = await prisma.subscription.findFirst({
            where: { tenantId: defaultTenant.id },
        });
        if (!existingSub) {
            const now = new Date();
            const nextYear = new Date();
            nextYear.setFullYear(now.getFullYear() + 1);
            await prisma.subscription.create({
                data: {
                    tenantId: defaultTenant.id,
                    planId: enterprisePlan.id,
                    status: 'ACTIVE',
                    currentPeriodStart: now,
                    currentPeriodEnd: nextYear,
                },
            });
        }
    }
    console.log('✅ Seeding completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map