'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MarketingIA() {
  const [formData, setFormData] = useState({
    produto: '',
    persona: '',
    diferencial: '',
    manifesto: '',
    estagioLead: 'sofa' // Valores possíveis: sofa, consultorio, centro
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Preparar os dados para enviar à API
      const requestData = {
        ...formData,
        agent: 'marketingia'
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
        <h1 className="text-3xl font-bold mb-2">MarketingIA</h1>
        <p className="text-gray-400 mb-4">
          Crie conteúdos alinhados ao funil de vendas médico (Sofá → Consultório → Centro Cirúrgico).
        </p>
        <div className="medbmia-blue-line"></div>
      </div>

      <div className="medbmia-form-container">
        <h2 className="text-xl font-bold mb-4">Ficha MedMBA</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="produto" className="medbmia-form-label">Descrição do produto médico</label>
            <textarea
              id="produto"
              name="produto"
              className="medbmia-form-textarea"
              value={formData.produto}
              onChange={handleInputChange}
              placeholder="Ex: Cirurgia cardíaca minimamente invasiva com técnica exclusiva e recuperação acelerada"
            ></textarea>
          </div>

          <div>
            <label htmlFor="persona" className="medbmia-form-label">Público-alvo (persona)</label>
            <textarea
              id="persona"
              name="persona"
              className="medbmia-form-textarea"
              value={formData.persona}
              onChange={handleInputChange}
              placeholder="Ex: Executivos entre 45-65 anos, com histórico familiar de problemas cardíacos, alto poder aquisitivo e pouco tempo disponível"
            ></textarea>
          </div>

          <div>
            <label htmlFor="diferencial" className="medbmia-form-label">Diferenciais técnicos e estratégicos</label>
            <textarea
              id="diferencial"
              name="diferencial"
              className="medbmia-form-textarea"
              value={formData.diferencial}
              onChange={handleInputChange}
              placeholder="Ex: Técnica exclusiva desenvolvida após fellowship internacional, equipe multidisciplinar integrada e monitoramento pós-cirúrgico com telemedicina"
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
              placeholder="Ex: Eu acredito que procedimentos cardíacos podem e devem ser menos invasivos, com recuperação mais rápida e menor impacto na vida do paciente"
            ></textarea>
          </div>

          <div className="mt-6">
            <label htmlFor="estagioLead" className="medbmia-form-label">Estágio do Lead</label>
            <select
              id="estagioLead"
              name="estagioLead"
              className="medbmia-form-input"
              value={formData.estagioLead}
              onChange={handleInputChange}
            >
              <option value="sofa">Sofá (Topo de Funil)</option>
              <option value="consultorio">Consultório (Meio de Funil)</option>
              <option value="centro">Centro Cirúrgico (Fundo de Funil)</option>
            </select>
            <div className="mt-2 text-gray-400 text-sm">
              <p><strong>Sofá:</strong> Paciente ainda não está plenamente consciente do problema</p>
              <p><strong>Consultório:</strong> Paciente reconhece o problema e busca soluções</p>
              <p><strong>Centro Cirúrgico:</strong> Paciente já decidiu resolver o problema agora</p>
            </div>
          </div>

          <div className="mt-6">
            <button type="submit" className="medbmia-button" disabled={isLoading}>
              {isLoading ? 'Processando...' : 'Gerar Sugestões de Conteúdo'}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="medbmia-result-container">
          <h2 className="text-xl font-bold mb-4">Resultado MarketingIA</h2>
          <div className="medbmia-blue-line"></div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">1) Sugestão principal de conteúdo</h3>
            <div className="bg-gray-800 p-4 rounded-md">
              <p className="font-bold text-xl mb-2">{result.sugestaoPrincipal.titulo}</p>
              <p className="text-gray-300">{result.sugestaoPrincipal.descricao}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">2) Sugestão secundária alternativa</h3>
            <div className="bg-gray-800 p-4 rounded-md">
              <p className="font-bold text-xl mb-2">{result.sugestaoSecundaria.titulo}</p>
              <p className="text-gray-300">{result.sugestaoSecundaria.descricao}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">3) Sugestão de call to action (CTA)</h3>
            <div className="bg-blue-600 text-white font-bold py-3 px-6 rounded-md inline-block">
              {result.cta}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
