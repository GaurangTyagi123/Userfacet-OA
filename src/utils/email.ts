/**
 * src/utils/email.ts
 * Email helper used to send transactional emails (e.g., password reset).
 * Encapsulates transport creation and template sending.
 */
import { Resend } from "resend";
import { readFileSync } from "fs";
import path from "path";
import Handlebars from "handlebars";
import dotenv from "dotenv";

dotenv.config({ path: "config.env" });

class Email {
    private user: Record<string, string>;
    private url: string;

    constructor(user: Record<string, string>, url: string) {
        // initialize the variables;
        this.user = user;
        this.url = url;
    }
    /**
     * @param template,
     * @param subject
     */
    private async sendMail(template: string, subject: string) {
        const sendOptions = {
            to: this.user.email,
            from: "gaurangtyagi@gaurang.work",
            subject: subject,
            html: template,
        };
        const send = new Resend(process.env.RESEND_KEY || "");
        send.emails.send(sendOptions);
    }

    public async sendResetLink() {
        const verificationHtml = readFileSync(
            path.join(
                import.meta.dirname,
                "emailTemplates",
                "resetPassword.html",
            ),
            { encoding: "utf-8" },
        );
        const options = {
            brand_name: "Userfacet-OA",
            user_name: this.user.userName,
            reset_url: this.url,
            support_email: "gaurangtyagi@gaurang.work",
            year: new Date().getFullYear(),
            otp_ttl_minutes: 10,
        };
        const template = Handlebars.compile(verificationHtml)(options);
        const subject = `Reset your password`;
        await this.sendMail(template, subject);
    }
}
export default Email;
