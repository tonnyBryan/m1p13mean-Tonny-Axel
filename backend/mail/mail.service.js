const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const { transactionalEmailsApi, SibApiV3Sdk } = require("../config/mail");


// dans sendEmail()
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

async function sendEmail({ to, subject, html, text }) {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { name: APP_CONFIG.name, email: APP_CONFIG.email };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.textContent = text;

    const result = await transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent:", result.messageId);
    return { success: true, messageId: result.messageId };
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

        return await sendEmail({
            to,
            subject: `${code} is your ${APP_CONFIG.name} verification code`,
            html,
            text: `Hi ${name || "there"},\n\nYour single-use code is: ${code}\n\nThis code will expire in ${expiresIn} minutes.\n\nThanks,\nThe ${APP_CONFIG.name} team`
        });
    } catch (error) {
        console.error("Email error:", error);
        throw error;
    }
}

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

        return await sendEmail({
            to,
            subject: subject || `${APP_CONFIG.name} support reply`,
            html,
            text: text || (typeof contentHtml === 'string' ? contentHtml.replace(/<[^>]*>/g, '') : '')
        });
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

        return await sendEmail({
            to,
            subject: `Reset your ${APP_CONFIG.name} password`,
            html,
            text: `Hi ${name || "there"},\n\nClick the link below to reset your password:\n${resetLink}\n\nThis link will expire in 1 hour.\n\nThanks,\nThe ${APP_CONFIG.name} team`
        });
    } catch (error) {
        console.error("Password reset email error:", error);
        throw error;
    }
}

async function sendNewDeviceEmail({ to, name, device, browser, os, ip, location, loginAt }) {
    try {
        const contentHtml = renderTemplate("new-device", {
            name: name || 'there',
            device,
            browser,
            os,
            ip,
            location,
            loginAt,
            appName: APP_CONFIG.name
        });

        const html = renderTemplate("base", {
            title: "New sign-in detected",
            content: contentHtml,
            year: new Date().getFullYear(),
            appName: APP_CONFIG.name,
            supportUrl: APP_CONFIG.supportUrl,
            privacyUrl: APP_CONFIG.privacyUrl
        });

        return await sendEmail({
            to,
            subject: `New sign-in to your ${APP_CONFIG.name} account`,
            html,
            text: `Hi ${name || 'there'},\n\nWe detected a sign-in from a new device.\n\nDevice: ${device}\nBrowser: ${browser}\nOS: ${os}\nIP: ${ip}\nLocation: ${location}\nTime: ${loginAt}\n\nIf this was not you, please secure your account immediately.`
        });
    } catch (error) {
        console.error("New device email error:", error);
        throw error;
    }
}

module.exports = { sendVerificationEmail, sendSupportEmail, sendPasswordResetEmail, sendNewDeviceEmail };