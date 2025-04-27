'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LeadScoreIA() {
  const [formData, setFormData] = useState({
    produto: '',
    preco: '',
    persona: '',
    diferencial: '',
    manifesto: ''
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Preparar os dados para enviar à API
      const requestData = {
        ...formData,
        agent: 'leadscoreia',
        queixa: file ? file.name : 'Não especificada'
      };
      
      // Enviar para a API
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao processar solicitação');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Erro:', error);
      alert('Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Link href="/" className="text-blue-500 hover:underline mb-4 inline-block">
          ← Voltar para Home
        </Link>
        <h1 className="text-3xl font-bold mb-2">LeadScoreIA</h1>
        <p className="text-gray-400 mb-4">
          Classifique leads e receba orientações estratégicas para cada categoria.
        </p>
        <div className="medbmia-blue-line"></div>
      </div>

      <div className="medbmia-form-container">
        <h2 className="text-xl font-bold mb-4">Ficha MedMBA</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="produto" className="medbmia-form-label">Produto/Serviço Atual</label>
              <input
                type="text"
                id="produto"
                name="produto"
                className="medbmia-form-input"
                value={formData.produto}
                onChange={handleInputChange}
                placeholder="Ex: Tratamento ortodôntico com alinhadores"
              />
            </div>
            <div>
              <label htmlFor="preco" className="medbmia-form-label">Preço Atual</label>
              <input
                type="text"
                id="preco"
                name="preco"
                className="medbmia-form-input"
                value={formData.preco}
                onChange={handleInputChange}
                placeholder="Ex: R$ 8.000,00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="persona" className="medbmia-form-label">Público-alvo (persona)</label>
            <textarea
              id="persona"
              name="persona"
              className="medbmia-form-textarea"
              value={formData.persona}
              onChange={handleInputChange}
              placeholder="Ex: Profissionais entre 25-40 anos, preocupados com estética e que buscam discrição no tratamento"
            ></textarea>
          </div>

          <div>
            <label htmlFor="diferencial" className="medbmia-form-label">Diferenciais estratégicos e técnicos</label>
            <textarea
              id="diferencial"
              name="diferencial"
              className="medbmia-form-textarea"
              value={formData.diferencial}
              onChange={handleInputChange}
              placeholder="Ex: Uso de tecnologia de escaneamento 3D, planejamento digital e alinhadores transparentes importados"
            ></textarea>
          </div>

          <div>
            <label htmlFor="manifesto" className="medbmia-form-label">Manifesto ("Eu acredito que...")</label>
            <textarea
              id="manifesto"
              name="manifesto"
              className="medbmia-form-textarea"
              value={formData.manifesto}
              onChange={handleInputChange}
              placeholder="Ex: Eu acredito que um sorriso alinhado não é apenas estético, mas fundamental para a saúde bucal e autoestima"
            ></textarea>
          </div>

          <div className="mt-6">
            <label className="medbmia-form-label">Upload de Arquivo (WhatsApp, ligação, planilha)</label>
            <div className="medbmia-file-upload">
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mb-2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <p className="mb-1">{file ? file.name : 'Arraste ou clique para fazer upload'}</p>
                  <p className="text-sm text-gray-500">Arquivos com a queixa específica do paciente</p>
                </div>
              </label>
            </div>
          </div>

          <div className="mt-6">
            <button type="submit" className="medbmia-button" disabled={isLoading}>
              {isLoading ? 'Processando...' : 'Classificar Lead'}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="medbmia-result-container">
          <h2 className="text-xl font-bold mb-4">Resultado LeadScoreIA</h2>
          <div className="medbmia-blue-line"></div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">1) Classificação do lead</h3>
            <div className="flex items-center mb-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mr-4 ${
                result.classificacao === 'A' ? 'bg-green-600' : 
                result.classificacao === 'B' ? 'bg-yellow-500' : 
                result.classificacao === 'C' ? 'bg-blue-600' : 'bg-red-600'
              }`}>
                {result.classificacao}
              </div>
              <div>
                <p className="font-semibold">
                  {result.classificacao === 'A' ? 'Lead Quente' : 
                   result.classificacao === 'B' ? 'Lead Morno' : 
                   result.classificacao === 'C' ? 'Lead Frio' : 'Baixo Potencial'}
                </p>
                <p className="text-gray-300">{result.explicacao}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">2) Orientação de próximos passos</h3>
            <p className="text-gray-300">{result.proximosPassos}</p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">3) Dica prática personalizada</h3>
            <p className="text-gray-300">{result.dicaPratica}</p>
          </div>
        </div>
      )}
    </div>
  );
}
