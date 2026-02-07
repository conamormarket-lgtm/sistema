import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" style={{ minHeight: '100vh', background: 'transparent' }}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Ocultar el indicador de desarrollo de Next.js
                function hideDevIndicator() {
                  const selectors = [
                    '[data-nextjs-dev-indicator]',
                    '[data-nextjs-toast]',
                    '#__next-dev-indicator',
                    '#__next-build-indicator',
                    'div[style*="position: fixed"][style*="bottom"][style*="left"]',
                    'div[style*="position:fixed"][style*="bottom"][style*="left"]',
                  ];
                  
                  selectors.forEach(selector => {
                    try {
                      const elements = document.querySelectorAll(selector);
                      elements.forEach(el => {
                        if (!el) return;
                        if (el.closest && el.closest('[data-app-sidebar]')) return;
                        if (el.style.bottom === '16px' || el.style.bottom === '0px' || el.getAttribute('data-nextjs-dev-indicator')) {
                          el.style.setProperty('display', 'none', 'important');
                          el.style.setProperty('visibility', 'hidden', 'important');
                          el.style.setProperty('opacity', '0', 'important');
                          el.style.setProperty('pointer-events', 'none', 'important');
                        }
                      });
                    } catch (e) {}
                  });
                }
                
                // Ejecutar inmediatamente
                hideDevIndicator();
                
                // Ejecutar después de que el DOM esté listo
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', hideDevIndicator);
                } else {
                  hideDevIndicator();
                }
                
                // Observar cambios en el DOM solo cuando body exista (el script está en head)
                function startObserver() {
                  if (typeof document === 'undefined' || !document.body) return;
                  try {
                    const observer = new MutationObserver(hideDevIndicator);
                    observer.observe(document.body, { childList: true, subtree: true });
                    setInterval(hideDevIndicator, 1000);
                  } catch (e) {}
                }
                if (document.body) startObserver();
                else document.addEventListener('DOMContentLoaded', startObserver);
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased" style={{ margin: 0, minHeight: '100vh', background: 'transparent' }}>
        {children}
      </body>
    </html>
  )
}
