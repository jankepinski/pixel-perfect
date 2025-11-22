import ConverterUI from '@/components/ConverterUI';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-black selection:bg-blue-500/30">
      <div className="w-full max-w-6xl mb-12 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg shadow-blue-500/20"></div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Pixel Perfect</h1>
        </div>
        <div className="text-sm text-zinc-500 font-medium">v2.0</div>
      </div>

      <ConverterUI />

      <div className="mt-24 text-zinc-600 text-sm font-medium">
        <p>Pixel Perfect</p>
      </div>
    </main>
  );
}
