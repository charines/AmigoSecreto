export type EmailLayoutInput = {
  previewText?: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
};

const COLOR_PRIMARY = '#b7102a';
const COLOR_INK = '#181a2e';
const COLOR_BACKGROUND = '#fbf8ff';
const COLOR_FOOTER_TEXT = '#5b403f';

function renderCta(ctaLabel?: string, ctaUrl?: string): string {
  if (!ctaLabel || !ctaUrl) return '';
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="background-color: ${COLOR_PRIMARY};">
          <a href="${ctaUrl}" style="display: inline-block; padding: 14px 28px; color: #ffffff; font-weight: bold; text-decoration: none; font-family: Arial, sans-serif;">
            ${ctaLabel}
          </a>
        </td>
      </tr>
    </table>`;
}

export function renderEmailLayout(input: EmailLayoutInput): string {
  const previewText = input.previewText ?? '';
  const cta = renderCta(input.ctaLabel, input.ctaUrl);
  const footerNote = input.footerNote ?? 'Este é um e-mail automático do Amigo Secreto.';

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0; background-color: ${COLOR_BACKGROUND}; font-family: Arial, sans-serif;">
    <div style="display: none; max-height: 0; overflow: hidden;">${previewText}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${COLOR_BACKGROUND};">
      <tr>
        <td align="center" style="padding: 24px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; border: 2px solid ${COLOR_INK};">
            <tr>
              <td style="background-color: ${COLOR_PRIMARY}; padding: 20px 24px;">
                <span style="color: #ffffff; font-size: 18px; font-weight: bold; font-family: Arial, sans-serif;">🎁 Amigo Secreto</span>
              </td>
            </tr>
            <tr>
              <td style="background-color: #ffffff; padding: 24px;">
                <h1 style="margin: 0 0 16px; color: ${COLOR_INK}; font-size: 20px; font-family: Arial, sans-serif;">${input.heading}</h1>
                <div style="color: ${COLOR_INK}; font-size: 15px; line-height: 1.5; font-family: Arial, sans-serif;">
                  ${input.bodyHtml}
                </div>
                ${cta}
              </td>
            </tr>
            <tr>
              <td style="background-color: #ffffff; padding: 0 24px 20px;">
                <p style="margin: 0; color: ${COLOR_FOOTER_TEXT}; font-size: 12px; font-family: Arial, sans-serif;">${footerNote}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
