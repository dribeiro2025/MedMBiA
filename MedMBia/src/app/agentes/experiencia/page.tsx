'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ExperienciaMBiA() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    apiKey: '',
    transcricaoTexto: ''
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [inputMethod, setInputMethod] = useState<'text' | 'file' | 'record'>('text');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo-preview');
  const [detectionMode, setDetectionMode] = useState('auto');
  const [specialty, setSpecialty] = useState('geral');
  const [showSpecialtySelect, setShowSpecialtySelect] = useState(false);
  const [settings, setSettings] = useState({
    chronologicalOrder: true,
    adaptiveSections: true,
    autoChunkText: true,
    enhancedFormatting: true,
    narrativeHPI: true
  });

  // Refs para gravação de áudio
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Salvar o estado no localStorage quando mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('experiencia_formData', JSON.stringify(formData));
      localStorage.setItem('experiencia_inputMethod', inputMethod);
      localStorage.setItem('experiencia_selectedModel', selectedModel);
      localStorage.setItem('experiencia_detectionMode', detectionMode);
      localStorage.setItem('experiencia_specialty', specialty);
      localStorage.setItem('experiencia_settings', JSON.stringify(settings));
    }
  }, [formData, inputMethod, selectedModel, detectionMode, specialty, settings]);

  // Carregar o estado do localStorage ao iniciar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFormData = localStorage.getItem('experiencia_formData');
      const savedInputMethod = localStorage.getItem('experiencia_inputMethod');
      const savedSelectedModel = localStorage.getItem('experiencia_selectedModel');
      const savedDetectionMode = localStorage.getItem('experiencia_detectionMode');
      const savedSpecialty = localStorage.getItem('experiencia_specialty');
      const savedSettings = localStorage.getItem('experiencia_settings');

      if (savedFormData) setFormData(JSON.parse(savedFormData));
      if (savedInputMethod) setInputMethod(savedInputMethod as 'text' | 'file' | 'record');
      if (savedSelectedModel) setSelectedModel(savedSelectedModel);
      if (savedDetectionMode) {
        setDetectionMode(savedDetectionMode);
        setShowSpecialtySelect(savedDetectionMode === 'manual');
      }
      if (savedSpecialty) setSpecialty(savedSpecialty);
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Criar URL para o arquivo de áudio para preview
      if (selectedFile.type.startsWith('audio/')) {
        const url = URL.createObjectURL(selectedFile);
        setAudioUrl(url);
      } else {
        setAudioUrl(null);
      }
    }
  };

  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value);
  };

  const handleDetectionModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = e.target.value;
    setDetectionMode(mode);
    setShowSpecialtySelect(mode === 'manual');
  };

  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSpecialty(e.target.value);
  };

  const handleVoltar = () => {
    // Preserva os dados no localStorage e navega para a página inicial
    router.push('/');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setFile(new File([audioBlob], "gravacao.wav", { type: 'audio/wav' }));
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);

      // Iniciar timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      // Pausar timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Retomar timer
      let seconds = recordingTime;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      // Parar timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Parar todas as faixas do stream
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const resetRecording = () => {
    stopRecording();
    setAudioUrl(null);
    setFile(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const switchInputMethod = (method: 'text' | 'file' | 'record') => {
    if (method !== inputMethod) {
      // Se estiver gravando, pare a gravação
      if (isRecording) {
        resetRecording();
      }
      
      setInputMethod(method);
    }
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
        agent: 'experiencia',
        model: selectedModel,
        detectionMode,
        specialty: detectionMode === 'manual' ? specialty : 'auto',
        settings,
        inputMethod
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

  // Função para exportar a anamnese como PDF
  const exportToPDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text('Anamnese Médica Estruturada', 105, 20, { align: 'center' });
    
    // Subtítulo
    doc.setFontSize(14);
    doc.text(`Especialidade: ${result.especialidade || 'Não especificada'}`, 105, 30, { align: 'center' });
    
    // Data
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 40, { align: 'center' });
    
    // Conteúdo
    doc.setFontSize(12);
    
    let yPos = 50;
    
    // Transcrição Original
    if (result.transcricaoOriginal) {
      doc.text('Transcrição Original', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      
      const transcricaoLines = doc.splitTextToSize(result.transcricaoOriginal, 170);
      doc.text(transcricaoLines, 20, yPos);
      yPos += (transcricaoLines.length * 5) + 15;
    }
    
    // Anamnese Estruturada
    doc.setFontSize(12);
    doc.text('Anamnese Estruturada', 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    
    if (result.anamneseEstruturada) {
      const anamneseLines = doc.splitTextToSize(result.anamneseEstruturada, 170);
      doc.text(anamneseLines, 20, yPos);
    }
    
    // Rodapé
    doc.setFontSize(8);
    doc.text('Gerado pelo MedMBiA - ExperiêncIA', 105, 285, { align: 'center' });
    
    // Salvar o PDF
    doc.save('anamnese_estruturada.pdf');
  };

  // Função para exportar a anamnese como DOCX
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
            pre { font-family: Arial, sans-serif; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>Anamnese Médica Estruturada</h1>
          <p class="subtitle">Especialidade: ${result.especialidade || 'Não especificada'}</p>
          <p class="date">Gerado em: ${new Date().toLocaleDateString('pt-BR')}</p>
          
          ${result.transcricaoOriginal ? `
          <h2>Transcrição Original</h2>
          <div class="section">
            <pre>${result.transcricaoOriginal}</pre>
          </div>
          ` : ''}
          
          <h2>Anamnese Estruturada</h2>
          <div class="section">
            <pre>${result.anamneseEstruturada || 'Não disponível'}</pre>
          </div>
          
          <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #999;">
            Gerado pelo MedMBiA - ExperiêncIA
          </div>
        </body>
      </html>
    `;
    
    // Criar um Blob com o conteúdo HTML
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    
    // Criar um link para download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'anamnese_estruturada.doc';
    
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
          <h1 className="text-3xl font-bold">ExperiêncIA</h1>
          <button
            onClick={handleVoltar}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md flex items-center"
          >
            ← Voltar para Home
          </button>
        </div>
        
        <p className="text-gray-400 mb-8">
          Transcreva áudios de consultas médicas em anamneses estruturadas para melhorar a experiência do paciente.
        </p>
        <div className="h-1 w-32 bg-blue-500 mb-6"></div>

        {showApiKeyInput ? (
          <div className="bg-gray-900 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-bold mb-4">Chave da API OpenAI</h2>
            <p className="text-gray-400 mb-4">
              Para transcrever áudios e gerar anamneses de alta qualidade, precisamos da sua chave da API OpenAI.
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
            <h2 className="text-xl font-bold mb-4">Transcrição de Áudio Médico para Anamnese</h2>
            
            <div className="mb-6 bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Configurações Avançadas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="modelSelect" className="block text-gray-300 mb-2">Modelo GPT:</label>
                  <select
                    id="modelSelect"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
                    value={selectedModel}
                    onChange={handleModelChange}
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (mais rápido)</option>
                    <option value="gpt-4">GPT-4 (mais preciso)</option>
                    <option value="gpt-4-turbo-preview">GPT-4 Turbo (recomendado)</option>
                  </select>
                  <p className="text-gray-500 text-xs mt-1">
                    GPT-4 Turbo suporta até 128.000 tokens (ideal para transcrições longas)
                  </p>
                </div>
                
                <div>
                  <label htmlFor="detectionMode" className="block text-gray-300 mb-2">Detecção de Especialidade:</label>
                  <select
                    id="detectionMode"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
                    value={detectionMode}
                    onChange={handleDetectionModeChange}
                  >
                    <option value="auto">Automática (baseada no conteúdo)</option>
                    <option value="manual">Manual (selecionar abaixo)</option>
                  </select>
                </div>
              </div>
              
              {showSpecialtySelect && (
                <div className="mb-4">
                  <label htmlFor="specialtySelect" className="block text-gray-300 mb-2">Especialidade Médica:</label>
                  <select
                    id="specialtySelect"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
                    value={specialty}
                    onChange={handleSpecialtyChange}
                  >
                    <option value="neurologia">Neurologia</option>
                    <option value="oftalmologia">Oftalmologia</option>
                    <option value="obstetricia">Obstetrícia</option>
                    <option value="ultrassonografia">Ultrassonografia</option>
                    <option value="dermatologia">Dermatologia</option>
                    <option value="geriatria">Geriatria</option>
                    <option value="neurocirurgia">Neurocirurgia</option>
                    <option value="ortopedia">Ortopedia</option>
                    <option value="cardiologia">Cardiologia</option>
                    <option value="neuropediatria">Neuropediatria</option>
                    <option value="psiquiatria">Psiquiatria</option>
                    <option value="cirurgia_vascular">Cirurgia Vascular</option>
                    <option value="cirurgia_plastica">Cirurgia Plástica</option>
                    <option value="geral">Clínica Geral</option>
                  </select>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="chronologicalOrder"
                    name="chronologicalOrder"
                    className="mr-2"
                    checked={settings.chronologicalOrder}
                    onChange={handleSettingChange}
                  />
                  <label htmlFor="chronologicalOrder" className="text-gray-300 text-sm">
                    Organizar em ordem cronológica
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="adaptiveSections"
                    name="adaptiveSections"
                    className="mr-2"
                    checked={settings.adaptiveSections}
                    onChange={handleSettingChange}
                  />
                  <label htmlFor="adaptiveSections" className="text-gray-300 text-sm">
                    Usar seções adaptativas
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoChunkText"
                    name="autoChunkText"
                    className="mr-2"
                    checked={settings.autoChunkText}
                    onChange={handleSettingChange}
                  />
                  <label htmlFor="autoChunkText" className="text-gray-300 text-sm">
                    Dividir textos longos automaticamente
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enhancedFormatting"
                    name="enhancedFormatting"
                    className="mr-2"
                    checked={settings.enhancedFormatting}
                    onChange={handleSettingChange}
                  />
                  <label htmlFor="enhancedFormatting" className="text-gray-300 text-sm">
                    Usar formatação aprimorada
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="narrativeHPI"
                    name="narrativeHPI"
                    className="mr-2"
                    checked={settings.narrativeHPI}
                    onChange={handleSettingChange}
                  />
                  <label htmlFor="narrativeHPI" className="text-gray-300 text-sm">
                    Estilo narrativo para História da Moléstia Atual
                  </label>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <div className="flex mb-4 border-b border-gray-700 pb-2">
                  <button 
                    type="button" 
                    className={`mr-4 px-4 py-2 rounded-md flex items-center ${inputMethod === 'text' ? 'bg-blue-600' : 'bg-gray-700'}`}
                    onClick={() => switchInputMethod('text')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Inserir Texto
                  </button>
                  <button 
                    type="button" 
                    className={`mr-4 px-4 py-2 rounded-md flex items-center ${inputMethod === 'file' ? 'bg-blue-600' : 'bg-gray-700'}`}
                    onClick={() => switchInputMethod('file')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Upload de Arquivo
                  </button>
                  <button 
                    type="button" 
                    className={`px-4 py-2 rounded-md flex items-center ${inputMethod === 'record' ? 'bg-blue-600' : 'bg-gray-700'}`}
                    onClick={() => switchInputMethod('record')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                    Gravar Áudio
                  </button>
                </div>
                
                {inputMethod === 'text' && (
                  <div>
                    <label htmlFor="transcricaoTexto" className="block text-gray-300 mb-2">
                      Transcrição da Consulta
                    </label>
                    <textarea
                      id="transcricaoTexto"
                      name="transcricaoTexto"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white min-h-[200px]"
                      value={formData.transcricaoTexto}
                      onChange={handleInputChange}
                      placeholder="Cole aqui a transcrição da consulta médica. Pode ser uma transcrição bruta, notas de voz, ou qualquer texto relacionado à consulta que você deseja converter em uma anamnese estruturada."
                      required={inputMethod === 'text'}
                    ></textarea>
                  </div>
                )}
                
                {inputMethod === 'file' && (
                  <div>
                    <div className="border-2 border-dashed border-gray-700 rounded-md p-6 text-center">
                      <input
                        type="file"
                        id="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept="audio/*,.txt,.pdf,.doc,.docx"
                        required={inputMethod === 'file' && !file}
                      />
                      <label htmlFor="file" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mb-2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <p className="mb-1 text-white">{file ? file.name : 'Arraste ou clique para fazer upload'}</p>
                          <p className="text-sm text-gray-500">Arquivos de áudio (MP3, WAV, M4A) ou texto (TXT, PDF, DOC)</p>
                        </div>
                      </label>
                    </div>
                    
                    {audioUrl && (
                      <div className="mt-4">
                        <p className="text-gray-300 mb-2">Preview do áudio:</p>
                        <audio controls className="w-full" src={audioUrl}></audio>
                      </div>
                    )}
                  </div>
                )}
                
                {inputMethod === 'record' && (
                  <div>
                    <div className="bg-gray-800 border border-gray-700 rounded-md p-6">
                      <div className="flex flex-col items-center">
                        <div className="mb-4">
                          {isRecording ? (
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'} mr-2`}></div>
                              <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
                            </div>
                          ) : (
                            <p className="text-gray-400">Pronto para gravar</p>
                          )}
                        </div>
                        
                        <div className="flex space-x-4">
                          {!isRecording ? (
                            <button
                              type="button"
                              onClick={startRecording}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                              Iniciar Gravação
                            </button>
                          ) : (
                            <>
                              {isPaused ? (
                                <button
                                  type="button"
                                  onClick={resumeRecording}
                                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                  </svg>
                                  Continuar
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={pauseRecording}
                                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-full flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <rect x="6" y="4" width="4" height="16"></rect>
                                    <rect x="14" y="4" width="4" height="16"></rect>
                                  </svg>
                                  Pausar
                                </button>
                              )}
                              
                              <button
                                type="button"
                                onClick={stopRecording}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full flex items-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                  <rect x="6" y="6" width="12" height="12"></rect>
                                </svg>
                                Finalizar
                              </button>
                            </>
                          )}
                        </div>
                        
                        {audioUrl && !isRecording && (
                          <div className="mt-6 w-full">
                            <p className="text-gray-300 mb-2">Gravação concluída:</p>
                            <audio controls className="w-full" src={audioUrl}></audio>
                            <button
                              type="button"
                              onClick={resetRecording}
                              className="mt-2 text-red-500 hover:text-red-400 text-sm"
                            >
                              Descartar e gravar novamente
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
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
                  disabled={isLoading || (inputMethod === 'file' && !file) || (inputMethod === 'record' && !audioUrl)}
                >
                  {isLoading ? 'Processando...' : 'Gerar Anamnese Estruturada'}
                </button>
              </div>
            </form>
          </div>
        )}

        {result && (
          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Anamnese Estruturada</h2>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-blue-400">Transcrição Original</h3>
                <pre className="text-gray-300 whitespace-pre-wrap font-sans">{result.transcricaoOriginal || "Não disponível"}</pre>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-green-400">Anamnese Estruturada</h3>
                <pre className="text-gray-300 whitespace-pre-wrap font-sans">{result.anamneseEstruturada || "Não disponível"}</pre>
                
                {result.especialidade && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-gray-400">
                      <span className="font-semibold">Especialidade detectada:</span> {result.especialidade}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.anamneseEstruturada || "");
                  alert("Anamnese copiada para a área de transferência!");
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
                Copiar Anamnese
              </button>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-white text-lg">Processando sua solicitação...</p>
              <p className="text-gray-400 mt-2">Isso pode levar alguns segundos.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
