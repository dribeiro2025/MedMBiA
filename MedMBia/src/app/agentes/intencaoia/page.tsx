'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function IntencaoIA() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    produto: '',
    preco: '',
    praca: '',
    promocao: '',
    apiKey: ''
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [pilarEstrategico, setPilarEstrategico] = useState<'tecnica' | 'experiencia' | 'preco' | ''>('');
  const [ajustes, setAjustes] = useState({
    produto: '',
    preco: '',
    praca: '',
    promocao: ''
  });
  const [palavrasChave, setPalavrasChave] = useState(['', '', '', '', '']);
  const [frasesPositionamento, setFrasesPositionamento] = useState(['', '', '']);
  const [acoes, setAcoes] = useState(['', '', '']);
  const [dataLimite, setDataLimite] = useState('');

  // Salvar o estado no localStorage quando mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('intencaoia_formData', JSON.stringify(formData));
      localStorage.setItem('intencaoia_pilarEstrategico', pilarEstrategico);
      localStorage.setItem('intencaoia_ajustes', JSON.stringify(ajustes));
      localStorage.setItem('intencaoia_palavrasChave', JSON.stringify(palavrasChave));
      localStorage.setItem('intencaoia_frasesPositionamento', JSON.stringify(frasesPositionamento));
      localStorage.setItem('intencaoia_acoes', JSON.stringify(acoes));
      localStorage.setItem('intencaoia_dataLimite', dataLimite);
      localStorage.setItem('intencaoia_currentStep', currentStep.toString());
    }
  }, [formData, pilarEstrategico, ajustes, palavrasChave, frasesPositionamento, acoes, dataLimite, currentStep]);

  // Carregar o estado do localStorage ao iniciar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFormData = localStorage.getItem('intencaoia_formData');
      const savedPilarEstrategico = localStorage.getItem('intencaoia_pilarEstrategico');
      const savedAjustes = localStorage.getItem('intencaoia_ajustes');
      const savedPalavrasChave = localStorage.getItem('intencaoia_palavrasChave');
      const savedFrasesPositionamento = localStorage.getItem('intencaoia_frasesPositionamento');
      const savedAcoes = localStorage.getItem('intencaoia_acoes');
      const savedDataLimite = localStorage.getItem('intencaoia_dataLimite');
      const savedCurrentStep = localStorage.getItem('intencaoia_currentStep');

      if (savedFormData) setFormData(JSON.parse(savedFormData));
      if (savedPilarEstrategico) setPilarEstrategico(savedPilarEstrategico as any);
      if (savedAjustes) setAjustes(JSON.parse(savedAjustes));
      if (savedPalavrasChave) setPalavrasChave(JSON.parse(savedPalavrasChave));
      if (savedFrasesPositionamento) setFrasesPositionamento(JSON.parse(savedFrasesPositionamento));
      if (savedAcoes) setAcoes(JSON.parse(savedAcoes));
      if (savedDataLimite) setDataLimite(savedDataLimite);
      if (savedCurrentStep) setCurrentStep(parseInt(savedCurrentStep));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAjustesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAjustes(prev => ({ ...prev, [name]: value }));
  };

  const handlePalavraChaveChange = (index: number, value: string) => {
    const newPalavrasChave = [...palavrasChave];
    newPalavrasChave[index] = value;
    setPalavrasChave(newPalavrasChave);
  };

  const handleFrasePositionamentoChange = (index: number, value: string) => {
    const newFrases = [...frasesPositionamento];
    newFrases[index] = value;
    setFrasesPositionamento(newFrases);
  };

  const handleAcaoChange = (index: number, value: string) => {
    const newAcoes = [...acoes];
    newAcoes[index] = value;
    setAcoes(newAcoes);
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleVoltar = () => {
    // Preserva os dados no localStorage e navega para a página inicial
    router.push('/');
  };

  const handleSubmit = async () => {
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
        agent: 'intencaoia',
        pilarEstrategico,
        ajustes,
        palavrasChave,
        frasesPositionamento,
        acoes,
        dataLimite
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
    handleSubmit();
  };

  // Função para obter a cor do pilar estratégico
  const getPilarColor = (pilar: string) => {
    switch(pilar) {
      case 'tecnica': return 'text-purple-500';
      case 'experiencia': return 'text-green-500';
      case 'preco': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  // Função para obter a cor de fundo do card do pilar estratégico
  const getPilarBgColor = (pilar: string) => {
    switch(pilar) {
      case 'tecnica': return 'bg-purple-900';
      case 'experiencia': return 'bg-green-900';
      case 'preco': return 'bg-blue-900';
      default: return 'bg-gray-900';
    }
  };

  // Função para exportar o plano estratégico como PDF
  const exportToPDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text('Plano Estratégico de Marketing Intencional', 105, 20, { align: 'center' });
    
    // Subtítulo
    doc.setFontSize(14);
    doc.text(`Pilar Estratégico: ${
      result.pilarEstrategico === 'tecnica' ? 'Técnica' : 
      result.pilarEstrategico === 'experiencia' ? 'Experiência do Cliente' : 
      result.pilarEstrategico === 'preco' ? 'Preço' : 'Não especificado'
    }`, 105, 30, { align: 'center' });
    
    // Data
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 40, { align: 'center' });
    
    // Conteúdo
    doc.setFontSize(12);
    
    // Diagnóstico Atual
    doc.text('Diagnóstico Atual (4Ps)', 20, 50);
    doc.setFontSize(10);
    doc.text(`Produto: ${result.diagnostico.produto.substring(0, 100)}...`, 20, 60);
    doc.text(`Preço: ${result.diagnostico.preco.substring(0, 100)}...`, 20, 70);
    doc.text(`Praça: ${result.diagnostico.praca.substring(0, 100)}...`, 20, 80);
    doc.text(`Promoção: ${result.diagnostico.promocao.substring(0, 100)}...`, 20, 90);
    
    // Justificativa do Pilar
    doc.setFontSize(12);
    doc.text('Justificativa do Pilar Estratégico', 20, 105);
    doc.setFontSize(10);
    
    const justificativaLines = doc.splitTextToSize(result.justificativaPilar, 170);
    doc.text(justificativaLines, 20, 115);
    
    // Ajustes Estratégicos
    let yPos = 115 + (justificativaLines.length * 5);
    doc.setFontSize(12);
    doc.text('Ajustes Estratégicos dos 4Ps', 20, yPos);
    doc.setFontSize(10);
    
    yPos += 10;
    doc.text(`Produto: ${result.ajustes.produto.substring(0, 100)}...`, 20, yPos);
    yPos += 10;
    doc.text(`Preço: ${result.ajustes.preco.substring(0, 100)}...`, 20, yPos);
    yPos += 10;
    doc.text(`Praça: ${result.ajustes.praca.substring(0, 100)}...`, 20, yPos);
    yPos += 10;
    doc.text(`Promoção: ${result.ajustes.promocao.substring(0, 100)}...`, 20, yPos);
    
    // Plano de Comunicação e Ação
    yPos += 15;
    doc.setFontSize(12);
    doc.text('Plano de Comunicação e Ação', 20, yPos);
    doc.setFontSize(10);
    
    yPos += 10;
    doc.text('Palavras-chave:', 20, yPos);
    yPos += 5;
    result.palavrasChave.forEach((palavra: string, index: number) => {
      if (palavra) {
        yPos += 5;
        doc.text(`${index + 1}. ${palavra}`, 25, yPos);
      }
    });
    
    yPos += 10;
    doc.text('Frases de Posicionamento:', 20, yPos);
    yPos += 5;
    result.frasesPositionamento.forEach((frase: string, index: number) => {
      if (frase) {
        yPos += 5;
        doc.text(`${index + 1}. ${frase}`, 25, yPos);
      }
    });
    
    yPos += 10;
    doc.text('Ações Planejadas:', 20, yPos);
    yPos += 5;
    result.acoes.forEach((acao: string, index: number) => {
      if (acao) {
        yPos += 5;
        doc.text(`${index + 1}. ${acao}`, 25, yPos);
      }
    });
    
    yPos += 10;
    doc.text(`Data-limite: ${result.dataLimite}`, 20, yPos);
    
    // Rodapé
    doc.setFontSize(8);
    doc.text('Gerado pelo MedMBiA - IntencionIA', 105, 285, { align: 'center' });
    
    // Salvar o PDF
    doc.save('plano_estrategico_marketing.pdf');
  };

  // Função para exportar o plano estratégico como DOCX
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
          </style>
        </head>
        <body>
          <h1>Plano Estratégico de Marketing Intencional</h1>
          <p class="subtitle">Pilar Estratégico: ${
            result.pilarEstrategico === 'tecnica' ? 'Técnica' : 
            result.pilarEstrategico === 'experiencia' ? 'Experiência do Cliente' : 
            result.pilarEstrategico === 'preco' ? 'Preço' : 'Não especificado'
          }</p>
          <p class="date">Gerado em: ${new Date().toLocaleDateString('pt-BR')}</p>
          
          <h2>Diagnóstico Atual (4Ps)</h2>
          <div class="section">
            <p><strong>Produto:</strong> ${result.diagnostico.produto}</p>
            <p><strong>Preço:</strong> ${result.diagnostico.preco}</p>
            <p><strong>Praça:</strong> ${result.diagnostico.praca}</p>
            <p><strong>Promoção:</strong> ${result.diagnostico.promocao}</p>
          </div>
          
          <h2>Justificativa do Pilar Estratégico</h2>
          <div class="section">
            <p>${result.justificativaPilar}</p>
          </div>
          
          <h2>Ajustes Estratégicos dos 4Ps</h2>
          <div class="section">
            <p><strong>Produto:</strong> ${result.ajustes.produto}</p>
            <p><strong>Preço:</strong> ${result.ajustes.preco}</p>
            <p><strong>Praça:</strong> ${result.ajustes.praca}</p>
            <p><strong>Promoção:</strong> ${result.ajustes.promocao}</p>
          </div>
          
          <h2>Plano de Comunicação e Ação</h2>
          <div class="section">
            <p><strong>Palavras-chave:</strong></p>
            <ul>
              ${result.palavrasChave.filter(Boolean).map((palavra: string, index: number) => 
                `<li>${palavra}</li>`).join('')}
            </ul>
            
            <p><strong>Frases de Posicionamento:</strong></p>
            <ul>
              ${result.frasesPositionamento.filter(Boolean).map((frase: string, index: number) => 
                `<li>${frase}</li>`).join('')}
            </ul>
            
            <p><strong>Ações Planejadas:</strong></p>
            <ul>
              ${result.acoes.filter(Boolean).map((acao: string, index: number) => 
                `<li>${acao}</li>`).join('')}
            </ul>
            
            <p><strong>Data-limite:</strong> ${result.dataLimite}</p>
          </div>
          
          <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #999;">
            Gerado pelo MedMBiA - IntencionIA
          </div>
        </body>
      </html>
    `;
    
    // Criar um Blob com o conteúdo HTML
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    
    // Criar um link para download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plano_estrategico_marketing.doc';
    
    // Simular clique no link para iniciar o download
    document.body.appendChild(link);
    link.click();
    
    // Limpar
    document.body.removeChild(link);
  };

  // Renderizar o conteúdo com base na etapa atual
  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <>
            <h3 className="text-xl font-bold mb-4">Etapa 1: Diagnóstico Atual (4Ps)</h3>
            <div className="bg-yellow-900/30 border-l-4 border-yellow-500 p-4 mb-6">
              <p className="text-yellow-200 font-medium">
                <strong>IMPORTANTE:</strong> Descreva com total sinceridade a situação <strong>ATUAL</strong> do seu negócio, exatamente como está <strong>HOJE</strong>, não como você gostaria que fosse ou planeja que seja no futuro.
              </p>
              <p className="text-gray-300 mt-2">
                Este diagnóstico precisa ser extremamente condizente com a realidade presente. Seja crítico e objetivo - este é o momento de analisar o que realmente existe agora, não o ideal ou o porvir.
              </p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="produto" className="block text-gray-300 mb-2">📦 Produto atual: O que você vende hoje? Como entrega?</label>
              <textarea
                id="produto"
                name="produto"
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white min-h-[100px]"
                value={formData.produto}
                onChange={handleInputChange}
                placeholder="Descreva detalhadamente seu produto ou serviço ATUAL, incluindo como ele é entregue HOJE, características principais e diferenciais EXISTENTES (se houver)."
                required
              ></textarea>
            </div>

            <div className="mb-6">
              <label htmlFor="preco" className="block text-gray-300 mb-2">💰 Preço atual: Quanto custa? Como definiu esse preço?</label>
              <textarea
                id="preco"
                name="preco"
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white min-h-[100px]"
                value={formData.preco}
                onChange={handleInputChange}
                placeholder="Informe os valores REAIS cobrados HOJE e explique como chegou a esses valores (baseado na concorrência, custos, percepção de valor, etc)."
                required
              ></textarea>
            </div>

            <div className="mb-6">
              <label htmlFor="praca" className="block text-gray-300 mb-2">🏙️ Praça atual: Quem são seus clientes atuais? De onde vêm? Qual classe?</label>
              <textarea
                id="praca"
                name="praca"
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white min-h-[100px]"
                value={formData.praca}
                onChange={handleInputChange}
                placeholder="Descreva o perfil REAL dos seus clientes ATUAIS (não o público ideal que você deseja no futuro). Inclua informações sobre localização, classe social, comportamento, etc."
                required
              ></textarea>
            </div>

            <div className="mb-6">
              <label htmlFor="promocao" className="block text-gray-300 mb-2">📣 Promoção atual: Como divulga hoje? Quais canais usa?</label>
              <textarea
                id="promocao"
                name="promocao"
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white min-h-[100px]"
                value={formData.promocao}
                onChange={handleInputChange}
                placeholder="Descreva como você divulga seu negócio ATUALMENTE. Quais canais utiliza HOJE? Qual mensagem transmite AGORA? Como é sua presença online e offline NESTE MOMENTO?"
                required
              ></textarea>
            </div>
          </>
        );
      
      case 2:
        return (
          <>
            <h3 className="text-xl font-bold mb-4">Etapa 2: Definição do Pilar Estratégico</h3>
            <div className="bg-blue-900/30 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-blue-200 font-medium">
                <strong>O SEGREDO DO POSICIONAMENTO INTENCIONAL:</strong> Escolha apenas UM pilar que representa sua principal força HOJE.
              </p>
              <p className="text-gray-300 mt-2">
                Este é o fundamento da sua estratégia de marketing. Ao invés de tentar ser bom em tudo (e acabar sendo mediano em tudo), você deve escolher uma única direção estratégica onde concentrará seus esforços.
              </p>
              <p className="text-gray-300 mt-2">
                Não misture pilares - para ter uma estratégia clara e eficaz, você precisa priorizar. Seu pilar deve ser baseado em uma força que você já possui hoje, não em algo que deseja desenvolver no futuro.
              </p>
              <p className="text-gray-300 mt-2">
                Lembre-se: sua escolha determinará como você ajustará todos os 4Ps do seu marketing nas próximas etapas.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div 
                className={`p-4 rounded-lg cursor-pointer border-2 ${pilarEstrategico === 'tecnica' ? 'border-purple-500 bg-purple-900/30' : 'border-gray-700 hover:border-purple-500'}`}
                onClick={() => setPilarEstrategico('tecnica')}
              >
                <h4 className="text-lg font-bold mb-2 text-purple-400">Técnica</h4>
                <p className="text-gray-300 text-sm mb-2">
                  Ser o melhor cientificamente/tecnicamente. Foco em excelência, inovação, evidências científicas e resultados superiores.
                </p>
                <ul className="text-gray-400 text-xs list-disc pl-4">
                  <li>Você se destaca pela qualidade técnica</li>
                  <li>Possui formação, certificações ou expertise diferenciada</li>
                  <li>Seus resultados clínicos são superiores</li>
                  <li>Utiliza tecnologias ou métodos avançados</li>
                </ul>
              </div>
              
              <div 
                className={`p-4 rounded-lg cursor-pointer border-2 ${pilarEstrategico === 'experiencia' ? 'border-green-500 bg-green-900/30' : 'border-gray-700 hover:border-green-500'}`}
                onClick={() => setPilarEstrategico('experiencia')}
              >
                <h4 className="text-lg font-bold mb-2 text-green-400">Experiência do Cliente</h4>
                <p className="text-gray-300 text-sm mb-2">
                  Ser o mais acolhedor, mais humano. Foco em atendimento diferenciado, experiência WOW e relacionamento excepcional.
                </p>
                <ul className="text-gray-400 text-xs list-disc pl-4">
                  <li>Você se destaca pelo atendimento humanizado</li>
                  <li>Seus pacientes elogiam o acolhimento e atenção</li>
                  <li>Você cria conexões emocionais com os pacientes</li>
                  <li>O ambiente e processos são pensados para o conforto</li>
                </ul>
              </div>
              
              <div 
                className={`p-4 rounded-lg cursor-pointer border-2 ${pilarEstrategico === 'preco' ? 'border-blue-500 bg-blue-900/30' : 'border-gray-700 hover:border-blue-500'}`}
                onClick={() => setPilarEstrategico('preco')}
              >
                <h4 className="text-lg font-bold mb-2 text-blue-400">Preço</h4>
                <p className="text-gray-300 text-sm mb-2">
                  Ser o mais competitivo/custo-benefício. Foco em acessibilidade, eficiência operacional e vantagem competitiva clara.
                </p>
                <ul className="text-gray-400 text-xs list-disc pl-4">
                  <li>Você consegue oferecer preços mais acessíveis</li>
                  <li>Sua operação é otimizada para reduzir custos</li>
                  <li>Você atende um volume maior de pacientes</li>
                  <li>Oferece condições de pagamento diferenciadas</li>
                </ul>
              </div>
            </div>
            
            {pilarEstrategico === '' && (
              <div className="text-yellow-500 mb-4">
                Por favor, selecione um pilar estratégico para continuar.
              </div>
            )}
          </>
        );
      
      case 3:
        return (
          <>
            <h3 className="text-xl font-bold mb-4">Etapa 3: Ajustes Estratégicos dos 4Ps</h3>
            <p className="text-gray-400 mb-6">
              Com base no pilar estratégico escolhido ({pilarEstrategico === 'tecnica' ? 'Técnica' : 
                                                      pilarEstrategico === 'experiencia' ? 'Experiência do Cliente' : 
                                                      pilarEstrategico === 'preco' ? 'Preço' : ''}), 
              defina os ajustes necessários em cada um dos 4Ps para reforçar esse posicionamento.
            </p>
            
            <div className="mb-6">
              <label htmlFor="ajuste-produto" className="block text-gray-300 mb-2">
                Produto: O que precisa mudar para representar melhor seu pilar escolhido?
              </label>
              <textarea
                id="ajuste-produto"
                name="produto"
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white min-h-[100px]"
                value={ajustes.produto}
                onChange={handleAjustesChange}
                placeholder={`Quais ajustes você precisa fazer no seu produto/serviço para reforçar o pilar de ${
                  pilarEstrategico === 'tecnica' ? 'excelência técnica' : 
                  pilarEstrategico === 'experiencia' ? 'experiência do cliente' : 
                  pilarEstrategico === 'preco' ? 'custo-benefício' : 'seu pilar escolhido'
                }?`}
                required
              ></textarea>
            </div>

            <div className="mb-6">
              <label htmlFor="ajuste-preco" className="block text-gray-300 mb-2">
                Preço: O preço atual reforça seu pilar? Se não, como corrigir?
              </label>
              <textarea
                id="ajuste-preco"
                name="preco"
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white min-h-[100px]"
                value={ajustes.preco}
                onChange={handleAjustesChange}
                placeholder={`Como seu preço deve ser ajustado para alinhar-se ao pilar de ${
                  pilarEstrategico === 'tecnica' ? 'excelência técnica (geralmente premium)' : 
                  pilarEstrategico === 'experiencia' ? 'experiência do cliente (geralmente valor agregado)' : 
                  pilarEstrategico === 'preco' ? 'custo-benefício (geralmente competitivo)' : 'seu pilar escolhido'
                }?`}
                required
              ></textarea>
            </div>

            <div className="mb-6">
              <label htmlFor="ajuste-praca" className="block text-gray-300 mb-2">
                Praça: Que tipo de cliente valoriza mais seu pilar escolhido?
              </label>
              <textarea
                id="ajuste-praca"
                name="praca"
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white min-h-[100px]"
                value={ajustes.praca}
                onChange={handleAjustesChange}
                placeholder={`Quais ajustes você precisa fazer no seu público-alvo e canais de distribuição para atrair clientes que valorizam ${
                  pilarEstrategico === 'tecnica' ? 'excelência técnica' : 
                  pilarEstrategico === 'experiencia' ? 'experiência do cliente' : 
                  pilarEstrategico === 'preco' ? 'custo-benefício' : 'seu pilar escolhido'
                }?`}
                required
              ></textarea>
            </div>

            <div className="mb-6">
              <label htmlFor="ajuste-promocao" className="block text-gray-300 mb-2">
                Promoção: Como comunicar de forma coerente com seu pilar?
              </label>
              <textarea
                id="ajuste-promocao"
                name="promocao"
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white min-h-[100px]"
                value={ajustes.promocao}
                onChange={handleAjustesChange}
                placeholder={`Como sua comunicação e marketing devem ser ajustados para destacar seu pilar de ${
                  pilarEstrategico === 'tecnica' ? 'excelência técnica (ex: evidências científicas, resultados, formação)' : 
                  pilarEstrategico === 'experiencia' ? 'experiência do cliente (ex: depoimentos, ambiente, atendimento)' : 
                  pilarEstrategico === 'preco' ? 'custo-benefício (ex: comparativos, promoções, facilidades)' : 'seu pilar escolhido'
                }?`}
                required
              ></textarea>
            </div>
          </>
        );
      
      case 4:
        return (
          <>
            <h3 className="text-xl font-bold mb-4">Etapa 4: Mini Plano de Comunicação e Ação</h3>
            <p className="text-gray-400 mb-6">
              Defina elementos práticos para implementar sua estratégia de posicionamento intencional nos próximos 14 dias.
            </p>
            
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">
                Palavras-chave: Quais 5 palavras você quer que sejam associadas à sua marca?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                {palavrasChave.map((palavra, index) => (
                  <input
                    key={`palavra-${index}`}
                    type="text"
                    className="bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                    value={palavra}
                    onChange={(e) => handlePalavraChaveChange(index, e.target.value)}
                    placeholder={`Palavra ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 mb-2">
                Frases de posicionamento: Crie 3 frases que comunicam seu pilar estratégico
              </label>
              <div className="space-y-2">
                {frasesPositionamento.map((frase, index) => (
                  <input
                    key={`frase-${index}`}
                    type="text"
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                    value={frase}
                    onChange={(e) => handleFrasePositionamentoChange(index, e.target.value)}
                    placeholder={`Frase de posicionamento ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 mb-2">
                Ações: Liste 3 ações concretas para implementar nos próximos 14 dias
              </label>
              <div className="space-y-2">
                {acoes.map((acao, index) => (
                  <input
                    key={`acao-${index}`}
                    type="text"
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                    value={acao}
                    onChange={(e) => handleAcaoChange(index, e.target.value)}
                    placeholder={`Ação ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="data-limite" className="block text-gray-300 mb-2">
                Data-limite para implementação
              </label>
              <input
                type="date"
                id="data-limite"
                className="bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                value={dataLimite}
                onChange={(e) => setDataLimite(e.target.value)}
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="apiKey" className="block text-gray-300 mb-2">
                Chave da API OpenAI (opcional)
              </label>
              <input
                type="text"
                id="apiKey"
                name="apiKey"
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                value={formData.apiKey}
                onChange={handleInputChange}
                placeholder="sk-..."
              />
              <p className="text-gray-500 text-sm mt-1">
                Forneça sua chave da API OpenAI para gerar um plano estratégico personalizado de alta qualidade.
                Se não fornecida, será usado um processamento local simplificado.
              </p>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  // Renderizar o resultado
  const renderResult = () => {
    if (!result) return null;

    return (
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Seu Plano Estratégico de Marketing Intencional</h2>
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

        <div className={`p-6 rounded-lg mb-6 ${getPilarBgColor(result.pilarEstrategico)}`}>
          <h3 className="text-xl font-bold mb-2">Pilar Estratégico: <span className={getPilarColor(result.pilarEstrategico)}>
            {result.pilarEstrategico === 'tecnica' ? 'Técnica' : 
             result.pilarEstrategico === 'experiencia' ? 'Experiência do Cliente' : 
             result.pilarEstrategico === 'preco' ? 'Preço' : 'Não especificado'}
          </span></h3>
          <div className="text-gray-300">
            <p className="font-bold">Justificativa:</p>
            <p className="whitespace-pre-line">{result.justificativaPilar}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Diagnóstico Atual</h3>
            <div className="space-y-4">
              <div>
                <p className="font-bold text-gray-300">Produto:</p>
                <p className="text-gray-400">{result.diagnostico.produto}</p>
              </div>
              <div>
                <p className="font-bold text-gray-300">Preço:</p>
                <p className="text-gray-400">{result.diagnostico.preco}</p>
              </div>
              <div>
                <p className="font-bold text-gray-300">Praça:</p>
                <p className="text-gray-400">{result.diagnostico.praca}</p>
              </div>
              <div>
                <p className="font-bold text-gray-300">Promoção:</p>
                <p className="text-gray-400">{result.diagnostico.promocao}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Ajustes Estratégicos</h3>
            <div className="space-y-4">
              <div>
                <p className="font-bold text-gray-300">Produto:</p>
                <p className="text-gray-400">{result.ajustes.produto}</p>
              </div>
              <div>
                <p className="font-bold text-gray-300">Preço:</p>
                <p className="text-gray-400">{result.ajustes.preco}</p>
              </div>
              <div>
                <p className="font-bold text-gray-300">Praça:</p>
                <p className="text-gray-400">{result.ajustes.praca}</p>
              </div>
              <div>
                <p className="font-bold text-gray-300">Promoção:</p>
                <p className="text-gray-400">{result.ajustes.promocao}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h3 className="text-xl font-bold mb-4">Plano de Comunicação e Ação</h3>
          
          <div className="mb-4">
            <p className="font-bold text-gray-300">Palavras-chave:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {result.palavrasChave.filter(Boolean).map((palavra: string, index: number) => (
                <span key={`palavra-result-${index}`} className="bg-gray-700 px-3 py-1 rounded-full text-gray-300">
                  {palavra}
                </span>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <p className="font-bold text-gray-300">Frases de Posicionamento:</p>
            <ul className="list-disc list-inside mt-2 text-gray-400">
              {result.frasesPositionamento.filter(Boolean).map((frase: string, index: number) => (
                <li key={`frase-result-${index}`}>{frase}</li>
              ))}
            </ul>
          </div>
          
          <div className="mb-4">
            <p className="font-bold text-gray-300">Ações Planejadas:</p>
            <ul className="list-disc list-inside mt-2 text-gray-400">
              {result.acoes.filter(Boolean).map((acao: string, index: number) => (
                <li key={`acao-result-${index}`}>{acao}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <p className="font-bold text-gray-300">Data-limite: <span className="text-gray-400">{result.dataLimite}</span></p>
          </div>
        </div>

        {result.planoCompleto && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Plano Estratégico Completo</h3>
            <div className="whitespace-pre-line text-gray-300">
              {result.planoCompleto}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderizar o modal de chave da API
  const renderApiKeyModal = () => {
    if (!showApiKeyInput) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
          <h3 className="text-xl font-bold mb-4">Chave da API OpenAI Necessária</h3>
          <p className="text-gray-300 mb-4">
            Para gerar um plano estratégico personalizado de alta qualidade, é necessário fornecer uma chave da API OpenAI.
          </p>
          <form onSubmit={handleApiKeySubmit}>
            <input
              type="text"
              name="apiKey"
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white mb-4"
              value={formData.apiKey}
              onChange={handleInputChange}
              placeholder="sk-..."
              required
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                onClick={() => setShowApiKeyInput(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Continuar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">IntencionIA</h1>
        <button
          onClick={handleVoltar}
          className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md flex items-center"
        >
          ← Voltar para Home
        </button>
      </div>
      
      <p className="text-gray-400 mb-8">
        Crie estratégias de posicionamento intencional usando a metodologia "Transformando o Marketing em Estratégia Intencional" de Rafael Trotta.
      </p>
      
      {!result ? (
        <>
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            {renderStepContent()}
            
            <div className="flex justify-between mt-6">
              {currentStep > 1 ? (
                <button
                  onClick={prevStep}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                >
                  Voltar
                </button>
              ) : (
                <div></div>
              )}
              
              <button
                onClick={nextStep}
                disabled={currentStep === 2 && pilarEstrategico === ''}
                className={`${
                  currentStep === 4
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white px-6 py-2 rounded-md ${
                  currentStep === 2 && pilarEstrategico === ''
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {currentStep === 4 ? 'Gerar Plano Estratégico' : 'Próximo'}
              </button>
            </div>
          </div>
          
          <div className="flex justify-center">
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    currentStep === step ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </>
      ) : (
        renderResult()
      )}
      
      {renderApiKeyModal()}
      
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Gerando seu plano estratégico...</p>
            <p className="text-gray-400 mt-2">Isso pode levar alguns segundos.</p>
          </div>
        </div>
      )}
    </div>
  );
}
