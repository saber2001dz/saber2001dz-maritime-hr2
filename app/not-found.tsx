export default function GlobalNotFound() {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>404 - Page non trouvée | Maritime HR</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
            *, ::before, ::after {
              box-sizing: border-box;
              border-width: 0;
              border-style: solid;
              border-color: #e5e7eb;
            }
            
            html, body {
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: 'Geist', ui-sans-serif, system-ui, sans-serif;
              line-height: 1.5;
              -webkit-font-smoothing: antialiased;
            }
            
            .min-h-screen { min-height: 100vh; }
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .items-center { align-items: center; }
            .justify-center { justify-content: center; }
            .text-center { text-align: center; }
            .bg-gray-50 { background-color: #F5F5F9; }
            .px-4 { padding-left: 1rem; padding-right: 1rem; }
            .text-8xl { font-size: 6rem; line-height: 1; }
            .text-2xl { font-size: 1.5rem; line-height: 2rem; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .no-underline { text-decoration: none; }
            .text-gray-700 { color: #374151; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-500 { color: #6b7280; }
            .text-white { color: #ffffff; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-8 { margin-bottom: 2rem; }
            .mt-12 { margin-top: 2rem; }
            .inline-block { display: inline-block; }
            .bg-blue-500 { background-color: #5E61E5; }
            .bg-blue-600 { background-color: #4c4fd9; }
            .px-6 { padding-left: 1rem; padding-right: 1rem; }
            .py-3 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .rounded-lg { border-radius: 0.5rem; }
            .transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; }
            .duration-200 { transition-duration: 200ms; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .max-w-lg { max-width: 28rem; }
            .w-full { width: 100%; }
            .h-auto { height: auto; }
            
            a:hover.bg-blue-500 { background-color: #4c4fd9; }
            
            img { max-width: 100%; height: auto; }
          `,
          }}
        />
      </head>
      <body>
        <div className="flex flex-col items-center min-h-screen bg-gray-50 px-4">
          <div className="text-center">
            <h1 className="text-8xl font-bold text-gray-700 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">Page non trouvée ⚠️</h2>
            <p className="text-gray-500 mb-8">Nous n'avons pas pu trouver la page que vous recherchez.</p>
            <a
              href="/"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm px-6 py-3 rounded-lg transition-colors duration-200 no-underline"
            >
              Retour à l'accueil
            </a>
            <div className="mt-12">
              <img src="/images/404.png" alt="Illustration d'erreur 404" className="mx-auto max-w-lg w-full h-auto" />
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
