"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSiteSettings = exports.getSiteSettings = void 0;
const db_1 = __importDefault(require("../components/db"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const upload_service_1 = require("../services/upload.service");
const getOptionalString = (value, fallback = '') => typeof value === 'string' ? value.trim() : fallback;
const formatSiteSettings = async (row) => ({
    _id: row._id,
    title: row.title,
    subtitle: row.subtitle,
    phone: row.phone,
    email: row.email,
    issn: row.issn,
    favIcon: row.fav_icon ? await (0, upload_service_1.getPresignedUrl)(row.fav_icon) : '',
    iconImage: row.icon_image ? await (0, upload_service_1.getPresignedUrl)(row.icon_image) : '',
    created_at: row.created_at,
    updated_at: row.updated_at,
});
const ensureSiteSettings = async () => {
    const existing = await db_1.default.query('SELECT * FROM site_settings ORDER BY created_at ASC LIMIT 1');
    if (existing.rows.length > 0) {
        return existing.rows[0];
    }
    const created = await db_1.default.query(`INSERT INTO site_settings (title, subtitle, phone, email, issn, fav_icon, icon_image)
     VALUES ('', '', '', '', '', '', '')
     RETURNING *`);
    return created.rows[0];
};
const getSiteSettings = async (_req, res) => {
    const settings = await ensureSiteSettings();
    res.json(await formatSiteSettings(settings));
};
exports.getSiteSettings = getSiteSettings;
const updateSiteSettings = async (req, res) => {
    const existing = await ensureSiteSettings();
    const files = req.files;
    const title = req.body.title !== undefined ? getOptionalString(req.body.title) : existing.title;
    const subtitle = req.body.subtitle !== undefined
        ? getOptionalString(req.body.subtitle)
        : existing.subtitle;
    const phone = req.body.phone !== undefined ? getOptionalString(req.body.phone) : existing.phone;
    const email = req.body.email !== undefined ? getOptionalString(req.body.email) : existing.email;
    const issn = req.body.issn !== undefined ? getOptionalString(req.body.issn) : existing.issn;
    let favIconKey = existing.fav_icon;
    let iconImageKey = existing.icon_image;
    const favIconFile = files?.favIcon?.[0];
    const iconImageFile = files?.iconImage?.[0];
    if (favIconFile) {
        favIconKey = await (0, upload_service_1.uploadSiteImageToS3)(favIconFile, 'site-settings/favicon');
    }
    if (iconImageFile) {
        iconImageKey = await (0, upload_service_1.uploadSiteImageToS3)(iconImageFile, 'site-settings/icon');
    }
    if (!title && !subtitle && !phone && !email && !issn && !favIconKey && !iconImageKey) {
        throw new AppError_1.default('At least one field is required', 400);
    }
    const result = await db_1.default.query(`UPDATE site_settings
     SET title = $1,
         subtitle = $2,
         phone = $3,
         email = $4,
         issn = $5,
         fav_icon = $6,
         icon_image = $7,
         updated_at = NOW()
     WHERE _id = $8
     RETURNING *`, [title, subtitle, phone, email, issn, favIconKey, iconImageKey, existing._id]);
    res.json(await formatSiteSettings(result.rows[0]));
};
exports.updateSiteSettings = updateSiteSettings;
