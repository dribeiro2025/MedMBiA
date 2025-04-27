'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function SpinMBiA() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    produto: '',
    preco: '',
    historiaPaciente: '',
    descricaoProduto: '',
    apiKey: ''
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // Salvar o estado no localStorage quando mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('spinmbia_formData', JSON.stringify(formData));
      localStorage.setItem('spinmbia_inputMethod', inputMethod);
    }
  }, [formData, inputMethod]);

  // Carregar o estado do localStorage ao iniciar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFormData = localStorage.getItem('spinmbia_formData');
      const savedInputMethod = localStorage.getItem('spinmbia_inputMethod');

      if (savedFormData) setFormData(JSON.parse(savedFormData));
      if (savedInputMethod) setInputMethod(savedInputMethod as 'text' | 'file');
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setInputMethod('file');
    }
  };

  const handleVoltar = () => {
    // Preserva os dados no localStorage e navega para a página inicial
    router.push('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se a chave da API foi fornecida
    if (!formData.apiKey) {
      setShowApiKeyInput(true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Preparar os dados para enviar à API
      const requestData = {
        ...formData,
        agent: 'spinia',
        queixa: inputMethod === 'file' ? (file ? file.name : 'Não especificada') : formData.historiaPaciente
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
        // Verificar se a resposta é JSON válido
        let errorData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          errorData = { error: `Erro no servidor: ${text.substring(0, 100)}...` };
        }
        throw new Error(errorData.error || 'Erro ao processar solicitação');
      }
      
      // Verificar se a resposta é JSON válido
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Resposta inválida do servidor: ${text.substring(0, 100)}...`);
      }
      
      const data = await response.json();
      setResult(data);
      
      // Limpar a chave da API após o uso
      setFormData(prev => ({ ...prev, apiKey: '' }));
    } catch (error) {
      console.error('Erro:', error);
      alert('Ocorreu um erro ao processar sua solicitação: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowApiKeyInput(false);
    handleSubmit(e);
  };

  // Função para obter a cor do perfil do lead
  const getLeadProfileColor = (perfil: string) => {
    switch(perfil) {
      case 'A': return 'text-green-500';
      case 'B': return 'text-blue-500';
      case 'C': return 'text-yellow-500';
      case 'D': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Função para obter a cor de fundo do card de perfil do lead
  const getLeadProfileBgColor = (perfil: string) => {
    switch(perfil) {
      case 'A': return 'bg-green-900';
      case 'B': return 'bg-blue-900';
      case 'C': return 'bg-yellow-900';
      case 'D': return 'bg-red-900';
      default: return 'bg-gray-900';
    }
  };

  // Função para exportar o roteiro como PDF
  const exportToPDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text('Roteiro de Venda SPIN', 105, 20, { align: 'center' });
    
    // Subtítulo
    doc.setFontSize(14);
    doc.text(`Produto: ${formData.produto}`, 105, 30, { align: 'center' });
    
    // Data
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 40, { align: 'center' });
    
    // Conteúdo
    doc.setFontSize(12);
    
    let yPos = 50;
    
    // Qualificação do Lead
    if (result.leadScore) {
      doc.text('Qualificação do Lead', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.text(`Perfil: ${result.leadScore.perfil || "N/A"}`, 20, yPos);
      yPos += 7;
      doc.text(`Pontuação: ${result.leadScore.pontuacao}/100`, 20, yPos);
      yPos += 7;
      doc.text(`Justificativa: ${result.leadScore.justificativa || "Não disponível"}`, 20, yPos);
      yPos += 7;
      doc.text(`Recomendação de Agenda: ${result.leadScore.recomendacaoAgenda || "Não disponível"}`, 20, yPos);
      yPos += 15;
    }
    
    // Resumo da Situação
    doc.setFontSize(12);
    doc.text('1) Resumo da Situação Atual do Paciente', 20, yPos);
    yPos += 7;
    doc.setFontSize(10);
    
    const resumoLines = doc.splitTextToSize(result.resumoSituacao || result.conexaoInicial || "Não disponível", 170);
    doc.text(resumoLines, 20, yPos);
    yPos += (resumoLines.length * 5) + 10;
    
    // Principais Problemas
    doc.setFontSize(12);
    doc.text('2) Principais Problemas e Implicações', 20, yPos);
    yPos += 7;
    doc.setFontSize(10);
    
    if (Array.isArray(result.principaisProblemas || result.esclarecimentoProblema)) {
      (result.principaisProblemas || result.esclarecimentoProblema).forEach((item: string, index: number) => {
        doc.text(`• ${item}`, 20, yPos);
        yPos += 7;
      });
    } else {
      const problemasLines = doc.splitTextToSize(result.principaisProblemas || result.esclarecimentoProblema || "Não disponível", 170);
      doc.text(problemasLines, 20, yPos);
      yPos += (problemasLines.length * 5) + 10;
    }
    
    // Apresentação da Solução
    doc.setFontSize(12);
    doc.text('3) Apresentação da Solução', 20, yPos);
    yPos += 7;
    doc.setFontSize(10);
    
    const solucaoLines = doc.splitTextToSize(result.apresentacaoSolucao || "Não disponível", 170);
    doc.text(solucaoLines, 20, yPos);
    yPos += (solucaoLines.length * 5) + 10;
    
    // Perguntas Frequentes
    doc.setFontSize(12);
    doc.text('4) Antecipação de Perguntas Frequentes', 20, yPos);
    yPos += 7;
    doc.setFontSize(10);
    
    if (Array.isArray(result.perguntasFrequentes || result.criacaoUrgencia)) {
      (result.perguntasFrequentes || result.criacaoUrgencia).forEach((item: string, index: number) => {
        doc.text(`• ${item}`, 20, yPos);
        yPos += 7;
      });
    } else {
      const perguntasLines = doc.splitTextToSize(result.perguntasFrequentes || result.criacaoUrgencia || "Não disponível", 170);
      doc.text(perguntasLines, 20, yPos);
      yPos += (perguntasLines.length * 5) + 10;
    }
    
    // Roteiro Completo
    if (result.roteiroCompleto) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Roteiro Completo', 105, 20, { align: 'center' });
      
      const roteiroLines = doc.splitTextToSize(result.roteiroCompleto, 170);
      doc.setFontSize(10);
      doc.text(roteiroLines, 20, 30);
    }
    
    // Rodapé
    doc.setFontSize(8);
    doc.text('Gerado pelo MedMBiA - SpinMBiA', 105, 285, { align: 'center' });
    
    // Salvar o PDF
    doc.save('roteiro_venda_spin.pdf');
  };

  // Função para exportar o roteiro como DOCX
  const exportToWord = () => {
    if (!result) return;
    
    // Criar conteúdo HTML para conversão
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { text-align: center; color: #333; }
            h2 { color: #555; margin-top: 20px; }
            .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
            .date { text-align: center; color: #999; margin-bottom: 40px; }
            .section { margin-bottom: 20px; }
            .item { margin-left: 20px; }
            .lead-profile { padding: 15px; background-color: #f5f5f5; border-radius: 5px; margin-bottom: 20px; }
            .lead-profile h3 { margin-top: 0; }
          </style>
        </head>
        <body>
          <h1>Roteiro de Venda SPIN</h1>
          <p class="subtitle">Produto: ${formData.produto}</p>
          <p class="date">Gerado em: ${new Date().toLocaleDateString('pt-BR')}</p>
          
          ${result.leadScore ? `
          <div class="lead-profile">
            <h3>Qualificação do Lead</h3>
            <p><strong>Perfil:</strong> ${result.leadScore.perfil || "N/A"}</p>
            <p><strong>Pontuação:</strong> ${result.leadScore.pontuacao}/100</p>
            <p><strong>Justificativa:</strong> ${result.leadScore.justificativa || "Não disponível"}</p>
            <p><strong>Recomendação de Agenda:</strong> ${result.leadScore.recomendacaoAgenda || "Não disponível"}</p>
          </div>
          ` : ''}
          
          <h2>1) Resumo da Situação Atual do Paciente</h2>
          <div class="section">
            <p>${result.resumoSituacao || result.conexaoInicial || "Não disponível"}</p>
          </div>
          
          <h2>2) Principais Problemas e Implicações</h2>
          <div class="section">
            ${Array.isArray(result.principaisProblemas || result.esclarecimentoProblema) ? 
              `<ul>
                ${(result.principaisProblemas || result.esclarecimentoProblema).map((item: string) => 
                  `<li>${item}</li>`).join('')}
              </ul>` : 
              `<p>${result.principaisProblemas || result.esclarecimentoProblema || "Não disponível"}</p>`
            }
          </div>
          
          <h2>3) Apresentação da Solução</h2>
          <div class="section">
            <p>${result.apresentacaoSolucao || "Não disponível"}</p>
          </div>
          
          <h2>4) Antecipação de Perguntas Frequentes</h2>
          <div class="section">
            ${Array.isArray(result.perguntasFrequentes || result.criacaoUrgencia) ? 
              `<ul>
                ${(result.perguntasFrequentes || result.criacaoUrgencia).map((item: string) => 
                  `<li>${item}</li>`).join('')}
              </ul>` : 
              `<p>${result.perguntasFrequentes || result.criacaoUrgencia || "Não disponível"}</p>`
            }
          </div>
          
          ${result.roteiroCompleto ? `
          <h2>Roteiro Completo</h2>
          <div class="section">
            <p>${result.roteiroCompleto.replace(/\n/g, '<br>')}</p>
          </div>
          ` : ''}
          
          <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #999;">
            Gerado pelo MedMBiA - SpinMBiA
          </div>
        </body>
      </html>
    `;
    
    // Criar um Blob com o conteúdo HTML
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    
    // Criar um link para download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'roteiro_venda_spin.doc';
    
    // Simular clique no link para iniciar o download
    document.body.appendChild(link);
    link.click();
    
    // Limpar
    document.body.removeChild(link);
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">SpinMBiA</h1>
          <button
            onClick={handleVoltar}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md flex items-center"
          >
            ← Voltar para Home
          </button>
        </div>
        
        <p className="text-gray-400 mb-8">
          Crie roteiros de venda estruturados usando o método SPIN e os 26 passos estratégicos do MedMBiA, com qualificação automática de leads (Lead Scoring).
        </p>
        <div className="h-1 w-32 bg-blue-500 mb-6"></div>

        {showApiKeyInput ? (
          <div className="bg-gray-900 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-bold mb-4">Chave da API OpenAI</h2>
            <p className="text-gray-400 mb-4">
              Para gerar roteiros personalizados de alta qualidade, precisamos da sua chave da API OpenAI.
              Esta chave será usada apenas para esta solicitação e não será armazenada.
            </p>
            <form onSubmit={handleApiKeySubmit}>
              <div className="mb-4">
                <label htmlFor="apiKey" className="block text-gray-300 mb-2">Chave da API OpenAI</label>
                <input
                  type="password"
                  id="apiKey"
                  name="apiKey"
                  className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                  value={formData.apiKey}
                  onChange={handleInputChange}
                  placeholder="sk-..."
                  required
                />
                <p className="text-gray-500 text-sm mt-2">
                  Sua chave começa com "sk-" e pode ser obtida no painel da OpenAI.
                </p>
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-md"
                  onClick={() => setShowApiKeyInput(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md"
                >
                  Continuar
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-gray-900 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-bold mb-4">Informações do Produto e Paciente</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="produto" className="block text-gray-300 mb-2">Nome do Produto/Serviço</label>
                  <input
                    type="text"
                    id="produto"
                    name="produto"
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                    value={formData.produto}
                    onChange={handleInputChange}
                    placeholder="Ex: AVCentro - Reabilitação Neurológica Integrada"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="preco" className="block text-gray-300 mb-2">Preço do Produto/Serviço</label>
                  <input
                    type="text"
                    id="preco"
                    name="preco"
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                    value={formData.preco}
                    onChange={handleInputChange}
                    placeholder="Ex: R$ 15.000,00 (pacote de 3 meses)"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="descricaoProduto" className="block text-gray-300 mb-2">Descrição do Produto (o que resolve e como funciona)</label>
                <textarea
                  id="descricaoProduto"
                  name="descricaoProduto"
                  className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white min-h-[100px]"
                  value={formData.descricaoProduto}
                  onChange={handleInputChange}
                  placeholder="Descreva detalhadamente o que seu produto/serviço resolve e como ele funciona. Inclua diferenciais, tecnologias utilizadas e benefícios específicos."
                  required
                ></textarea>
              </div>

              <div className="mb-6">
                <label className="block text-gray-300 mb-2">História do Paciente</label>
                
                <div className="flex mb-4">
                  <button 
                    type="button" 
                    className={`mr-4 px-4 py-2 rounded-md ${inputMethod === 'text' ? 'bg-blue-600' : 'bg-gray-700'}`}
                    onClick={() => setInputMethod('text')}
                  >
                    Inserir Texto
                  </button>
                  <button 
                    type="button" 
                    className={`px-4 py-2 rounded-md ${inputMethod === 'file' ? 'bg-blue-600' : 'bg-gray-700'}`}
                    onClick={() => setInputMethod('file')}
                  >
                    Upload de Arquivo
                  </button>
                </div>
                
                {inputMethod === 'text' ? (
                  <textarea
                    id="historiaPaciente"
                    name="historiaPaciente"
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white min-h-[150px]"
                    value={formData.historiaPaciente}
                    onChange={handleInputChange}
                    placeholder="Cole aqui a transcrição da consulta, mensagem do WhatsApp ou descrição da queixa do paciente. Quanto mais detalhes, melhor será o roteiro gerado."
                    required={inputMethod === 'text'}
                  ></textarea>
                ) : (
                  <div className="border-2 border-dashed border-gray-700 rounded-md p-6 text-center">
                    <input
                      type="file"
                      id="file"
                      onChange={handleFileChange}
                      className="hidden"
                      required={inputMethod === 'file'}
                    />
                    <label htmlFor="file" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mb-2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <p className="mb-1 text-white">{file ? file.name : 'Arraste ou clique para fazer upload'}</p>
                        <p className="text-sm text-gray-500">Arquivos com a história/queixa do paciente (áudio, texto, PDF)</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="apiKey" className="block text-gray-300 mb-2">Chave da API OpenAI (opcional)</label>
                <input
                  type="password"
                  id="apiKey"
                  name="apiKey"
                  className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                  value={formData.apiKey}
                  onChange={handleInputChange}
                  placeholder="sk-..."
                />
                <p className="text-gray-500 text-sm mt-2">
                  Sua chave começa com "sk-" e pode ser obtida no painel da OpenAI. Se não for fornecida agora, será solicitada após o envio.
                </p>
              </div>

              <div className="mt-6 flex items-center">
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md w-full md:w-auto"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processando...' : 'Gerar Roteiro SPIN e Lead Score'}
                </button>
              </div>
            </form>
          </div>
        )}

        {result && (
          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Roteiro de Venda SPIN</h2>
              <div className="flex space-x-2">
                <button
                  onClick={exportToPDF}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <span className="mr-2">📄</span> Salvar como PDF
                </button>
                <button
                  onClick={exportToWord}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <span className="mr-2">📝</span> Salvar como DOC
                </button>
              </div>
            </div>
            
            <div className="h-1 w-32 bg-blue-500 mb-6"></div>
            
            {/* Seção de Qualificação de Lead */}
            {result.leadScore && (
              <div className={`mb-8 p-4 rounded-lg ${getLeadProfileBgColor(result.leadScore.perfil)}`}>
                <h3 className="text-xl font-bold mb-3">Qualificação do Lead</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <span className="text-gray-300 mr-2">Perfil:</span>
                      <span className={`text-xl font-bold ${getLeadProfileColor(result.leadScore.perfil)}`}>
                        {result.leadScore.perfil || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center mb-4">
                      <span className="text-gray-300 mr-2">Pontuação:</span>
                      <div className="flex-1 bg-gray-700 rounded-full h-4 mr-2">
                        <div 
                          className={`h-4 rounded-full ${result.leadScore.perfil === 'A' ? 'bg-green-500' : 
                                                        result.leadScore.perfil === 'B' ? 'bg-blue-500' : 
                                                        result.leadScore.perfil === 'C' ? 'bg-yellow-500' : 
                                                        'bg-red-500'}`}
                          style={{ width: `${result.leadScore.pontuacao}%` }}
                        ></div>
                      </div>
                      <span className="text-white font-bold">{result.leadScore.pontuacao}/100</span>
                    </div>
                  </div>
                  <div>
                    <div className="mb-2">
                      <span className="text-gray-300 block mb-1">Justificativa:</span>
                      <p className="text-white">{result.leadScore.justificativa || "Não disponível"}</p>
                    </div>
                    <div>
                      <span className="text-gray-300 block mb-1">Recomendação de Agenda:</span>
                      <p className="text-white font-medium">{result.leadScore.recomendacaoAgenda || "Não disponível"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-blue-400">1) Resumo da Situação Atual do Paciente</h3>
              <p className="text-gray-300">{result.resumoSituacao || result.conexaoInicial || "Não disponível"}</p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-blue-400">2) Principais Problemas e Implicações</h3>
              {Array.isArray(result.principaisProblemas || result.esclarecimentoProblema) ? (
                <ul className="list-disc pl-5">
                  {(result.principaisProblemas || result.esclarecimentoProblema).map((item: string, index: number) => (
                    <li key={index} className="text-gray-300 mb-1">{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-300">{result.principaisProblemas || result.esclarecimentoProblema || "Não disponível"}</p>
              )}
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-blue-400">3) Apresentação da Solução</h3>
              <p className="text-gray-300">{result.apresentacaoSolucao || "Não disponível"}</p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-blue-400">4) Antecipação de Perguntas Frequentes</h3>
              {Array.isArray(result.perguntasFrequentes || result.criacaoUrgencia) ? (
                <ul className="list-disc pl-5">
                  {(result.perguntasFrequentes || result.criacaoUrgencia).map((item: string, index: number) => (
                    <li key={index} className="text-gray-300 mb-1">{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-300">{result.perguntasFrequentes || result.criacaoUrgencia || "Não disponível"}</p>
              )}
            </div>
            
            {result.roteiroCompleto && (
              <div className="mt-8 border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-4 text-blue-400">Roteiro Completo</h3>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <pre className="text-gray-300 whitespace-pre-wrap font-sans">{result.roteiroCompleto}</pre>
                </div>
              </div>
            )}
          </div>
        )}
        
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-white text-lg">Gerando seu roteiro de venda...</p>
              <p className="text-gray-400 mt-2">Isso pode levar alguns segundos.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
