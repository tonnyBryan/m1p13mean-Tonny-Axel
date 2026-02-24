const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const { transporter } = require("../config/mail");

const APP_CONFIG = {
    name: process.env.APP_NAME,
    email: process.env.MAIL_FROM,
    supportUrl: process.env.SUPPORT_URL,
    privacyUrl: process.env.PRIVACY_URL
};

function renderTemplate(templateName, data) {
    const templatePath = path.join(__dirname, "templates", `${templateName}.hbs`);
    const source = fs.readFileSync(templatePath, "utf8");
    const template = handlebars.compile(source);
    return template(data);
}

async function sendVerificationEmail({ to, name, code, expiresIn, hbsTemplate }) {
    try {
        const contentHtml = renderTemplate(hbsTemplate, {
            name: name || "there",
            code,
            expiresIn,
            appName: APP_CONFIG.name
        });

        const html = renderTemplate("base", {
            title: "Verification code",
            content: contentHtml,
            year: new Date().getFullYear(),
            appName: APP_CONFIG.name,
            supportUrl: APP_CONFIG.supportUrl,
            privacyUrl: APP_CONFIG.privacyUrl
        });

        const info = await transporter.sendMail({
            from: `"${APP_CONFIG.name}" <${APP_CONFIG.email}>`,
            to,
            subject: `${code} is your ${APP_CONFIG.name} verification code`,
            html,
            text: `Hi ${name || "there"},\n\nWe received a request for a single-use code to use with your account.\n\nYour single-use code is: ${code}\n\nOnly enter this code on an official website or app. Don't share it with anyone. We'll never ask for it outside an official platform.\n\nThis code will expire in ${expiresIn} minutes.\n\nThanks,\nThe ${APP_CONFIG.name} team\n\nSupport: ${APP_CONFIG.supportUrl}\nPrivacy: ${APP_CONFIG.privacyUrl}`
        });

        console.log("Email sent:", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Email error:", error);
        throw error;
    }
}

/**
 * Send a support reply email using the base template.
 * contentHtml is injected into the base template as the main content.
 */
async function sendSupportEmail({ to, subject, contentHtml, text }) {
    try {
        const html = renderTemplate("base", {
            title: subject || "Message from support",
            content: contentHtml || text || "",
            year: new Date().getFullYear(),
            appName: APP_CONFIG.name,
            supportUrl: APP_CONFIG.supportUrl,
            privacyUrl: APP_CONFIG.privacyUrl
        });

        const info = await transporter.sendMail({
            from: `"${APP_CONFIG.name}" <${APP_CONFIG.email}>`,
            to,
            subject: subject || `${APP_CONFIG.name} support reply`,
            html,
            text: text || (typeof contentHtml === 'string' ? contentHtml.replace(/<[^>]*>/g, '') : '')
        });

        console.log("Support email sent:", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Support email error:", error);
        throw error;
    }
}

async function sendPasswordResetEmail({ to, name, resetLink }) {
    try {
        const contentHtml = renderTemplate("password-reset", {
            name: name || "there",
            resetLink,
            appName: APP_CONFIG.name
        });

        const html = renderTemplate("base", {
            title: "Reset your password",
            content: contentHtml,
            year: new Date().getFullYear(),
            appName: APP_CONFIG.name,
            supportUrl: APP_CONFIG.supportUrl,
            privacyUrl: APP_CONFIG.privacyUrl
        });

        const info = await transporter.sendMail({
            from: `"${APP_CONFIG.name}" <${APP_CONFIG.email}>`,
            to,
            subject: `Reset your ${APP_CONFIG.name} password`,
            html,
            text: `Hi ${name || "there"},\n\nWe received a request to reset your password.\n\nClick the link below to reset it:\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.\n\nThanks,\nThe ${APP_CONFIG.name} team`
        });

        console.log("Password reset email sent:", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Password reset email error:", error);
        throw error;
    }
}

module.exports = { sendVerificationEmail, sendSupportEmail, sendPasswordResetEmail };
