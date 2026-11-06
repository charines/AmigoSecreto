import { describe, expect, it } from 'vitest';
import { renderEmailLayout } from './emailLayout.js';

describe('renderEmailLayout', () => {
  it('includes the heading and body in the output', () => {
    const html = renderEmailLayout({
      heading: '🎁 Você foi convidado!',
      bodyHtml: '<p>Vem participar do Amigo Secreto.</p>',
    });

    expect(html).toContain('🎁 Você foi convidado!');
    expect(html).toContain('<p>Vem participar do Amigo Secreto.</p>');
  });

  it('renders a CTA button with the correct href when ctaLabel and ctaUrl are provided', () => {
    const html = renderEmailLayout({
      heading: 'Teste',
      bodyHtml: '<p>Corpo</p>',
      ctaLabel: 'Confirmar participação',
      ctaUrl: 'https://app.example.com/invite?token=abc123',
    });

    expect(html).toContain('Confirmar participação');
    expect(html).toContain('href="https://app.example.com/invite?token=abc123"');
  });

  it('does not render a CTA button when ctaUrl/ctaLabel are omitted', () => {
    const html = renderEmailLayout({
      heading: 'Teste',
      bodyHtml: '<p>Corpo</p>',
    });

    expect(html).not.toContain('href=');
  });
});
