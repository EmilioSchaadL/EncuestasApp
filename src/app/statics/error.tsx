export default function PaginaError(error: any) {
  return (
   <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-neutral-900 border border-red-500/30 rounded-3xl p-10 shadow-lg border-2">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-neutral-400">{error || 'La encuesta no existe o ha sido eliminada.'}</p>
        </div>
      </div>
  );
}