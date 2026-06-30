
export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-8xl mb-6">🐾</div>
      <h1 className="font-brand text-5xl text-coral mb-4">¡Oops! Página no encontrada</h1>
      <p className="text-gray-500 font-body text-lg mb-8 max-w-md">
        Parece que esta página se fue a pasear con su dueño. 
        No te preocupes, volvemos al inicio 🐕
      </p>
      <a
        href="/"
        className="btn-coral text-base px-10 py-3"
        id="not-found-home-link"
      >
        Volver al Inicio
      </a>
    </div>
  );
}
