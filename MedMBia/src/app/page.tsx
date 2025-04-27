import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bem-vindo ao MedMBiA</h1>
        <p className="text-gray-400 mb-4">Plataforma de apoio aos médicos mentorados pelo programa MedMBA, do Raphael Trotta</p>
        <div className="h-1 w-32 bg-blue-500 mb-6"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Link href="/agentes/spinia" className="bg-gray-900 p-6 rounded-lg hover:bg-gray-800 transition-colors">
          <h2 className="text-2xl font-bold mb-2">SpinMBiA</h2>
          <div className="h-1 w-16 bg-blue-500 mb-4"></div>
          <p className="text-gray-400 mb-4">
            Crie roteiros de venda estruturados usando o método SPIN e os 26 passos estratégicos do MedMBA, com qualificação automática de leads (Lead Scoring).
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">Acessar SpinMBiA</button>
        </Link>

        <Link href="/agentes/experiencia" className="bg-gray-900 p-6 rounded-lg hover:bg-gray-800 transition-colors">
          <h2 className="text-2xl font-bold mb-2">ExperiêncIA</h2>
          <div className="h-1 w-16 bg-blue-500 mb-4"></div>
          <p className="text-gray-400 mb-4">
            Transcreva áudios de consultas médicas em anamneses estruturadas para melhorar a experiência do paciente.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">Acessar ExperiêncIA</button>
        </Link>

        <Link href="/agentes/intencaoia" className="bg-gray-900 p-6 rounded-lg hover:bg-gray-800 transition-colors">
          <h2 className="text-2xl font-bold mb-2">IntencionIA</h2>
          <div className="h-1 w-16 bg-blue-500 mb-4"></div>
          <p className="text-gray-400 mb-4">
            Saia da aleatoriedade e construa uma estratégia de posicionamento intencional, clara e prática em apenas 4 etapas.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">Acessar IntencionIA</button>
        </Link>
      </div>

      <div className="bg-gray-900 p-6 rounded-lg">
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-2">Sobre o MedMBiA</h2>
          <div className="h-1 w-32 bg-blue-500 mb-4"></div>
          <p className="mb-4">
            O MedMBiA é um projeto de inovação que nasce para levar a filosofia do MedMBA para uma nova era: 
            integrando inteligência artificial prática no dia a dia do médico empreendedor.
          </p>
          <p className="mb-4">
            A proposta é criar uma ferramenta que ajude o mentorado a aplicar mais rápido e com mais profundidade 
            os ensinamentos do Trotta, sem depender de memória, papel ou planilhas manuais.
          </p>
          <p>
            Esta plataforma oferece agentes especializados para diferentes necessidades:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-400">
            <li><strong>SpinMBiA</strong> - Gera roteiros de venda estruturados baseados na metodologia SPIN e nos 26 passos estratégicos.</li>
            <li><strong>ExperiêncIA</strong> - Transforma gravações de consultas em anamneses médicas estruturadas, melhorando a documentação clínica.</li>
            <li><strong>IntencionIA</strong> - Desenvolve estratégias de posicionamento intencional baseadas nos 4Ps do marketing e pilares estratégicos.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
