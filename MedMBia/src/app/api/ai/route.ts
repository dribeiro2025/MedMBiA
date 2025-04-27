import { NextRequest, NextResponse } from 'next/server';

// Função para integrar com a API do OpenAI
async function processarComOpenAI(prompt: string, apiKey: string, model: string = 'gpt-4') {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente especializado em vendas médicas, treinado nos 26 passos do método Trotta, na metodologia SPIN Selling e no sistema de qualificação de leads (Leading Score). Sua tarefa é analisar a história do paciente, classificar o lead e gerar um roteiro de venda estruturado e personalizado.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(`Erro na API do OpenAI: ${errorData.error?.message || 'Erro desconhecido'}`);
      } else {
        const errorText = await response.text();
        throw new Error(`Erro na API do OpenAI: Resposta não-JSON recebida`);
      }
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Resposta da API OpenAI não é JSON válido');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Erro ao processar com OpenAI:', error);
    throw error;
  }
}

// Função para transcrever áudio usando a API Whisper da OpenAI
async function transcreverAudio(audioBlob: Blob, apiKey: string) {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');
    formData.append('response_format', 'json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(`Erro na API Whisper: ${errorData.error?.message || 'Erro desconhecido'}`);
      } else {
        const errorText = await response.text();
        throw new Error(`Erro na API Whisper: Resposta não-JSON recebida`);
      }
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Resposta da API Whisper não é JSON válido');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Erro ao transcrever áudio:', error);
    throw error;
  }
}

// Função para gerar anamnese estruturada a partir de transcrição
async function gerarAnamneseEstruturada(transcricao: string, apiKey: string, model: string, settings: any, specialty: string) {
  try {
    const prompt = `
# Contexto
Você é um assistente médico especializado em converter transcrições de consultas médicas em anamneses estruturadas. Sua tarefa é organizar as informações da transcrição em um formato de anamnese médica profissional.

# Transcrição da Consulta
${transcricao}

# Configurações
- Modelo: ${model}
- Detecção de Especialidade: ${specialty === 'auto' ? 'Automática (baseada no conteúdo)' : `Manual (${specialty})`}
- Organizar em ordem cronológica: ${settings.chronologicalOrder ? 'Sim' : 'Não'}
- Usar seções adaptativas: ${settings.adaptiveSections ? 'Sim' : 'Não'}
- Dividir textos longos: ${settings.autoChunkText ? 'Sim' : 'Não'}
- Usar formatação aprimorada: ${settings.enhancedFormatting ? 'Sim' : 'Não'}
- Estilo narrativo para HMA: ${settings.narrativeHPI ? 'Sim' : 'Não'}

# Tarefa
Converta a transcrição acima em uma anamnese médica estruturada e profissional. Siga estas diretrizes:

1. Identifique e separe as falas do médico, paciente e acompanhantes quando possível
2. Organize as informações em seções padrão de anamnese médica:
   - Identificação do Paciente
   - Queixa Principal
   - História da Moléstia Atual (HMA)
   - História Patológica Pregressa
   - História Familiar
   - História Social
   - Medicações em Uso
   - Alergias
   - Exame Físico (se mencionado)
   - Hipóteses Diagnósticas (se mencionadas)
   - Conduta (se mencionada)

3. Se a especialidade for automática, identifique a especialidade médica mais provável com base no conteúdo
4. Use terminologia médica apropriada, convertendo linguagem coloquial para técnica
5. Mantenha 100% de fidelidade ao conteúdo original sem adicionar informações não presentes
6. Não use inteligência médica preditiva - apenas reorganize e reformate o que foi dito
7. Se alguma seção não tiver informações na transcrição, indique "Não informado"

Forneça a anamnese estruturada em formato de texto com formatação clara usando títulos e subtítulos.

Ao final, indique qual especialidade médica foi detectada (se automática) e forneça quaisquer observações relevantes sobre a qualidade da transcrição ou sugestões para melhorar a anamnese.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente médico especializado em converter transcrições de consultas em anamneses estruturadas, usando terminologia médica apropriada.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(`Erro na API do OpenAI: ${errorData.error?.message || 'Erro desconhecido'}`);
      } else {
        const errorText = await response.text();
        throw new Error(`Erro na API do OpenAI: Resposta não-JSON recebida`);
      }
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Resposta da API OpenAI não é JSON válido');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Erro ao gerar anamnese estruturada:', error);
    throw error;
  }
}

// Função para gerar plano estratégico de marketing com a API OpenAI
async function gerarPlanoEstrategico(data: any, apiKey: string) {
  try {
    const prompt = `
# Contexto
Você é um consultor especializado em estratégia de marketing e posicionamento para médicos, treinado na metodologia "Transformando o Marketing em Estratégia Intencional" de Rafael Trotta.

# Diagnóstico Atual (4Ps)
Produto: ${data.produto}
Preço: ${data.preco}
Praça: ${data.praca}
Promoção: ${data.promocao}

# Pilar Estratégico Escolhido
${data.pilarEstrategico === 'tecnica' ? 'Técnica (ser o melhor cientificamente/tecnicamente)' : 
  data.pilarEstrategico === 'experiencia' ? 'Experiência do Cliente (ser o mais acolhedor, mais humano)' : 
  data.pilarEstrategico === 'preco' ? 'Preço (ser o mais competitivo/custo-benefício)' : 'Não especificado'}

# Ajustes Estratégicos Propostos
Produto: ${data.ajustes.produto}
Preço: ${data.ajustes.preco}
Praça: ${data.ajustes.praca}
Promoção: ${data.ajustes.promocao}

# Plano de Comunicação e Ação
Palavras-chave desejadas: ${data.palavrasChave.filter(Boolean).join(', ')}
Frases de posicionamento: 
${data.frasesPositionamento.filter(Boolean).map((frase: string, index: number) => `${index + 1}. ${frase}`).join('\n')}
Ações planejadas:
${data.acoes.filter(Boolean).map((acao: string, index: number) => `${index + 1}. ${acao}`).join('\n')}
Data-limite: ${data.dataLimite}

# Tarefa
Analise as informações acima e forneça um plano estratégico de marketing intencional completo. Sua resposta deve incluir:

1. Uma análise crítica do diagnóstico atual, identificando inconsistências e oportunidades de melhoria nos 4Ps.

2. Uma justificativa para o pilar estratégico escolhido, explicando por que este é (ou não) o melhor pilar para este caso específico.

3. Recomendações detalhadas para os ajustes estratégicos em cada um dos 4Ps, garantindo alinhamento com o pilar escolhido.

4. Refinamento das palavras-chave e frases de posicionamento, sugerindo melhorias quando necessário.

5. Avaliação das ações planejadas, confirmando se são adequadas ou sugerindo alternativas mais eficazes.

6. Adição de insights estratégicos específicos para o contexto médico.

Forneça sua resposta em formato estruturado, com seções claras e recomendações práticas e acionáveis.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Você é um consultor especializado em estratégia de marketing e posicionamento para médicos, com foco em resultados práticos e acionáveis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(`Erro na API do OpenAI: ${errorData.error?.message || 'Erro desconhecido'}`);
      } else {
        const errorText = await response.text();
        throw new Error(`Erro na API do OpenAI: Resposta não-JSON recebida`);
      }
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Resposta da API OpenAI não é JSON válido');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Erro ao gerar plano estratégico:', error);
    throw error;
  }
}

// Função para extrair informações estruturadas do plano estratégico
function estruturarPlanoEstrategico(textoPlano: string, dadosOriginais: any) {
  try {
    // Inicializar objeto de resultado com os dados originais
    const resultado = {
      diagnostico: {
        produto: dadosOriginais.produto,
        preco: dadosOriginais.preco,
        praca: dadosOriginais.praca,
        promocao: dadosOriginais.promocao
      },
      pilarEstrategico: dadosOriginais.pilarEstrategico,
      justificativaPilar: '',
      ajustes: {
        produto: dadosOriginais.ajustes.produto,
        preco: dadosOriginais.ajustes.preco,
        praca: dadosOriginais.ajustes.praca,
        promocao: dadosOriginais.ajustes.promocao
      },
      palavrasChave: dadosOriginais.palavrasChave,
      frasesPositionamento: dadosOriginais.frasesPositionamento,
      acoes: dadosOriginais.acoes,
      dataLimite: dadosOriginais.dataLimite,
      planoCompleto: textoPlano
    };

    // Extrair justificativa do pilar estratégico
    const justificativaPilarMatch = textoPlano.match(/(?:justificativa|razão|motivo).*?(?:pilar|estratégia).*?(?:escolhido|selecionado).*?\n([\s\S]*?)(?=\n\n|\n#|\n\*\*)/i);
    if (justificativaPilarMatch) {
      resultado.justificativaPilar = justificativaPilarMatch[1].trim();
    }

    // Extrair palavras-chave refinadas (se houver)
    const palavrasChaveMatch = textoPlano.match(/(?:palavras-chave|keywords).*?(?:refinadas|sugeridas|recomendadas).*?(?:\n|:)([\s\S]*?)(?=\n\n|\n#|\n\*\*)/i);
    if (palavrasChaveMatch) {
      const palavrasTexto = palavrasChaveMatch[1].trim();
      const palavrasLista = palavrasTexto.split(/[,\n]/).map(p => p.trim()).filter(Boolean);
      if (palavrasLista.length > 0) {
        resultado.palavrasChave = palavrasLista.slice(0, 5);
      }
    }

    // Extrair frases de posicionamento refinadas (se houver)
    const frasesMatch = textoPlano.match(/(?:frases|posicionamento).*?(?:refinadas|sugeridas|recomendadas).*?(?:\n|:)([\s\S]*?)(?=\n\n|\n#|\n\*\*)/i);
    if (frasesMatch) {
      const frasesTexto = frasesMatch[1].trim();
      const frasesLista = frasesTexto.split(/\n/).map(f => {
        // Remover números e pontos no início
        return f.replace(/^\d+\.\s*/, '').trim();
      }).filter(Boolean);
      if (frasesLista.length > 0) {
        resultado.frasesPositionamento = frasesLista.slice(0, 3);
      }
    }

    // Extrair ações refinadas (se houver)
    const acoesMatch = textoPlano.match(/(?:ações|plano de ação).*?(?:refinadas|sugeridas|recomendadas).*?(?:\n|:)([\s\S]*?)(?=\n\n|\n#|\n\*\*)/i);
    if (acoesMatch) {
      const acoesTexto = acoesMatch[1].trim();
      const acoesLista = acoesTexto.split(/\n/).map(a => {
        // Remover números e pontos no início
        return a.replace(/^\d+\.\s*/, '').trim();
      }).filter(Boolean);
      if (acoesLista.length > 0) {
        resultado.acoes = acoesLista.slice(0, 3);
      }
    }

    return resultado;
  } catch (error) {
    console.error('Erro ao estruturar plano estratégico:', error);
    // Retornar os dados originais em caso de erro
    return {
      diagnostico: {
        produto: dadosOriginais.produto,
        preco: dadosOriginais.preco,
        praca: dadosOriginais.praca,
        promocao: dadosOriginais.promocao
      },
      pilarEstrategico: dadosOriginais.pilarEstrategico,
      ajustes: dadosOriginais.ajustes,
      palavrasChave: dadosOriginais.palavrasChave,
      frasesPositionamento: dadosOriginais.frasesPositionamento,
      acoes: dadosOriginais.acoes,
      dataLimite: dadosOriginais.dataLimite,
      planoCompleto: textoPlano
    };
  }
}

// Função para extrair informações da anamnese estruturada
function extrairInformacoesAnamnese(anamneseTexto: string) {
  // Detectar especialidade médica
  let especialidadeDetectada = '';
  const especialidadeMatch = anamneseTexto.match(/Especialidade [Mm]édica [Dd]etectada:?\s*([^\n.]+)/);
  if (especialidadeMatch) {
    especialidadeDetectada = especialidadeMatch[1].trim();
  }

  // Detectar observações adicionais
  let observacoes = '';
  const observacoesMatch = anamneseTexto.match(/Observações:?\s*([\s\S]+?)(?=\n\n|\n*$)/);
  if (observacoesMatch) {
    observacoes = observacoesMatch[1].trim();
  }

  return {
    especialidadeDetectada,
    observacoes
  };
}

// Função para gerar o prompt para a OpenAI
function gerarPromptOpenAI(historiaPaciente: string, produto: string, preco: string, descricaoProduto: string) {
  return `
# Contexto
Você é um consultor especializado em vendas médicas, treinado nos 26 passos do método Trotta, na metodologia SPIN Selling e no sistema de qualificação de leads (Leading Score).

# Produto/Serviço
Nome: ${produto}
Preço: ${preco}
Descrição: ${descricaoProduto}

# História do Paciente
${historiaPaciente}

# Tarefa 1: Qualificação do Lead (Leading Score)
Antes de gerar o roteiro de venda, analise o caso e classifique o lead de acordo com o sistema de qualificação Leading Score:

1. Determine o perfil do lead (A, B, C ou D):
   - Perfil A: Pacientes com alta probabilidade de conversão e alto valor potencial (ex: idade adequada para o tratamento, condição clínica clara, capacidade financeira)
   - Perfil B: Pacientes com boa probabilidade de conversão, mas talvez com algumas ressalvas
   - Perfil C: Pacientes com baixa probabilidade de conversão ou baixo valor potencial
   - Perfil D: Pacientes fora do perfil ideal (ex: condição não tratável pelo serviço oferecido)

2. Atribua uma pontuação de 0 a 100 para o nível de interesse/engajamento do lead

3. Forneça uma recomendação de agenda baseada no perfil:
   - Perfil A: Prioridade máxima, agendar imediatamente (Golden Hour)
   - Perfil B: Prioridade alta, agendar nos próximos dias
   - Perfil C: Prioridade normal, agendar conforme disponibilidade
   - Perfil D: Baixa prioridade, considerar encaminhamento para outro serviço

Apresente a qualificação do lead no seguinte formato:

QUALIFICAÇÃO DE LEAD
Perfil: [A/B/C/D]
Pontuação: [0-100]/100
Justificativa: [Explique por que o lead recebeu essa classificação]
Recomendação de Agenda: [Recomendação específica para este lead]

# Tarefa 2: Roteiro de Venda
Após a qualificação do lead, gere um roteiro de venda estruturado e personalizado seguindo os 26 passos do método Trotta, adaptados para este caso específico. O roteiro deve ser detalhado, prático e diretamente aplicável à situação deste paciente.

Estruture sua resposta exatamente neste formato, com cada passo numerado:

ROTEIRO DE VENDA PERSONALIZADO

1. Consulta roteirizada
[Resumo organizado da história do paciente, destacando pontos relevantes para a venda]

2. Primeiro sim: "Tenho um problema"
[Frase específica para confirmar o problema com o paciente/família]

3. Cases pré-selecionados
[Exemplo de caso similar que teve sucesso com o tratamento]

4. Acerto de histórias de suporte à venda
[Narrativa personalizada conectando o caso ao produto]

5. Antecipação de exame físico quando há demanda
[Observações relevantes sobre o estado atual do paciente]

6. Segundo sim: "Preciso resolver"
[Frase específica para confirmar a necessidade de solução]

7. Diagnóstico
[Explicação clara do diagnóstico em linguagem acessível]

8. Prognóstico
[Explicação das possíveis evoluções sem tratamento]

9. Terceiro sim: "Entendi o problema"
[Frase específica para confirmar entendimento do diagnóstico]

10. Apresentação da solução
[Descrição personalizada de como o produto/serviço resolve o problema]

11. Quarto sim: "Essa solução faz sentido"
[Frase específica para confirmar aceitação da solução proposta]

12. Apresentação do investimento
[Abordagem personalizada para apresentar o preço]

13. Quinto sim: "Está dentro do meu orçamento"
[Frase específica para confirmar aceitação do investimento]

14. Apresentação do plano de tratamento
[Detalhamento das etapas do tratamento]

15. Sexto sim: "Concordo com o plano"
[Frase específica para confirmar aceitação do plano]

16. Apresentação do contrato
[Abordagem para formalizar o acordo]

17. Sétimo sim: "Aceito os termos"
[Frase específica para confirmar aceitação dos termos]

18. Fechamento
[Frase de fechamento personalizada]

19. Oitavo sim: "Vamos começar"
[Frase específica para confirmar início do tratamento]

20. Agendamento
[Sugestão específica de agendamento]

21. Nono sim: "Confirmo a data"
[Frase específica para confirmar o agendamento]

22. Pagamento
[Abordagem personalizada para o pagamento]

23. Décimo sim: "Efetuo o pagamento"
[Frase específica para confirmar o pagamento]

24. Orientações pós-consulta
[Orientações personalizadas relevantes para este caso]

25. Décimo primeiro sim: "Entendi as orientações"
[Frase específica para confirmar entendimento das orientações]

26. Encaminhamento para recepção
[Frase de encerramento personalizada]

Lembre-se de personalizar cada passo para este caso específico, usando informações da história do paciente e características do produto/serviço.
`;
}

// Função para processar localmente (fallback)
function processarLocalmente(historiaPaciente: string, produto: string, preco: string, descricaoProduto: string) {
  // Análise básica do texto para determinar o perfil do lead
  const textoBaixo = historiaPaciente.toLowerCase();
  
  // Palavras-chave para análise
  const palavrasInteresse = ['interessado', 'quero', 'preciso', 'necessito', 'gostaria', 'quando', 'como'];
  const palavrasUrgencia = ['urgente', 'imediato', 'logo', 'rápido', 'dor', 'incômodo', 'problema', 'grave'];
  const palavrasCapacidade = ['plano', 'seguro', 'particular', 'pagar', 'preço', 'valor', 'custo', 'investimento'];
  
  // Contagem de palavras-chave
  let pontuacaoInteresse = 0;
  palavrasInteresse.forEach(palavra => {
    if (textoBaixo.includes(palavra)) pontuacaoInteresse += 10;
  });
  
  let pontuacaoUrgencia = 0;
  palavrasUrgencia.forEach(palavra => {
    if (textoBaixo.includes(palavra)) pontuacaoUrgencia += 10;
  });
  
  let pontuacaoCapacidade = 0;
  palavrasCapacidade.forEach(palavra => {
    if (textoBaixo.includes(palavra)) pontuacaoCapacidade += 10;
  });
  
  // Limitar pontuações a 100
  pontuacaoInteresse = Math.min(pontuacaoInteresse, 100);
  pontuacaoUrgencia = Math.min(pontuacaoUrgencia, 100);
  pontuacaoCapacidade = Math.min(pontuacaoCapacidade, 100);
  
  // Pontuação final
  const pontuacaoFinal = Math.round((pontuacaoInteresse + pontuacaoUrgencia + pontuacaoCapacidade) / 3);
  
  // Determinar perfil
  let perfil = 'C';
  let recomendacaoAgenda = 'Agendar conforme disponibilidade normal da agenda.';
  
  if (pontuacaoFinal >= 70) {
    perfil = 'A';
    recomendacaoAgenda = 'Prioridade máxima, agendar imediatamente (Golden Hour).';
  } else if (pontuacaoFinal >= 40) {
    perfil = 'B';
    recomendacaoAgenda = 'Prioridade alta, agendar nos próximos dias.';
  } else if (pontuacaoFinal < 20) {
    perfil = 'D';
    recomendacaoAgenda = 'Baixa prioridade, considerar encaminhamento para outro serviço.';
  }
  
  // Gerar justificativa
  const justificativa = `Este lead foi classificado com base na análise de texto simples. 
  Nível de interesse: ${pontuacaoInteresse}/100. 
  Nível de urgência: ${pontuacaoUrgencia}/100. 
  Capacidade financeira aparente: ${pontuacaoCapacidade}/100.`;
  
  // Gerar roteiro simplificado
  const roteiro = `
  # ROTEIRO DE VENDA SIMPLIFICADO
  
  Este é um roteiro simplificado gerado localmente. Para um roteiro completo e personalizado seguindo os 26 passos do método Trotta, utilize a integração com a API OpenAI.
  
  ## Resumo do Caso
  ${historiaPaciente.substring(0, 200)}...
  
  ## Abordagem Sugerida
  1. Confirme o problema principal com o paciente
  2. Explique como seu produto/serviço (${produto}) pode ajudar
  3. Apresente o investimento (${preco}) destacando o valor agregado
  4. Sugira um plano de tratamento personalizado
  5. Agende conforme a prioridade recomendada
  
  ## Observações
  Este roteiro é genérico e não substitui uma análise detalhada do caso. Para melhores resultados, considere utilizar a API OpenAI para gerar um roteiro completo e personalizado.
  `;
  
  return {
    qualificacaoLead: {
      perfil,
      pontuacao: pontuacaoFinal,
      justificativa,
      recomendacaoAgenda
    },
    roteiro
  };
}

// Função para processar a solicitação de anamnese
async function processarSolicitacaoAnamnese(req: NextRequest) {
  try {
    const data = await req.json();
    const { transcricao, apiKey, model, settings, specialty } = data;
    
    if (!transcricao) {
      return NextResponse.json({ error: 'Transcrição não fornecida' }, { status: 400 });
    }
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave da API OpenAI não fornecida' }, { status: 400 });
    }
    
    // Gerar anamnese estruturada
    const anamnese = await gerarAnamneseEstruturada(
      transcricao, 
      apiKey, 
      model || 'gpt-3.5-turbo', 
      settings || {
        chronologicalOrder: true,
        adaptiveSections: true,
        autoChunkText: true,
        enhancedFormatting: true,
        narrativeHPI: true
      },
      specialty || 'auto'
    );
    
    // Extrair informações adicionais da anamnese
    const informacoesAdicionais = extrairInformacoesAnamnese(anamnese);
    
    return NextResponse.json({
      anamnese,
      ...informacoesAdicionais
    });
  } catch (error) {
    console.error('Erro ao processar solicitação de anamnese:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao processar anamnese' 
    }, { status: 500 });
  }
}

// Função para processar a solicitação de plano estratégico
async function processarSolicitacaoPlanoEstrategico(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Verificar dados obrigatórios
    if (!data.produto || !data.preco || !data.praca || !data.promocao) {
      return NextResponse.json({ error: 'Dados do diagnóstico 4Ps incompletos' }, { status: 400 });
    }
    
    if (!data.pilarEstrategico) {
      return NextResponse.json({ error: 'Pilar estratégico não selecionado' }, { status: 400 });
    }
    
    // Se não houver chave da API, usar processamento local simplificado
    if (!data.apiKey) {
      // Criar um plano estratégico simplificado localmente
      return NextResponse.json({
        diagnostico: {
          produto: data.produto,
          preco: data.preco,
          praca: data.praca,
          promocao: data.promocao
        },
        pilarEstrategico: data.pilarEstrategico,
        justificativaPilar: `Este é um plano estratégico simplificado gerado localmente. Para um plano completo e personalizado, utilize a integração com a API OpenAI fornecendo uma chave de API válida.`,
        ajustes: data.ajustes,
        palavrasChave: data.palavrasChave,
        frasesPositionamento: data.frasesPositionamento,
        acoes: data.acoes,
        dataLimite: data.dataLimite
      });
    }
    
    try {
      // Gerar plano estratégico com a API OpenAI
      const planoTexto = await gerarPlanoEstrategico(data, data.apiKey);
      
      // Estruturar o plano para retorno
      const planoEstruturado = estruturarPlanoEstrategico(planoTexto, data);
      
      return NextResponse.json(planoEstruturado);
    } catch (error) {
      console.error('Erro ao gerar plano estratégico com OpenAI:', error);
      
      // Fallback para processamento local em caso de erro
      return NextResponse.json({
        diagnostico: {
          produto: data.produto,
          preco: data.preco,
          praca: data.praca,
          promocao: data.promocao
        },
        pilarEstrategico: data.pilarEstrategico,
        justificativaPilar: `Ocorreu um erro ao processar com a API OpenAI. Este é um plano estratégico simplificado gerado localmente como fallback.`,
        ajustes: data.ajustes,
        palavrasChave: data.palavrasChave,
        frasesPositionamento: data.frasesPositionamento,
        acoes: data.acoes,
        dataLimite: data.dataLimite,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  } catch (error) {
    console.error('Erro ao processar solicitação de plano estratégico:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao processar plano estratégico' 
    }, { status: 500 });
  }
}

// Função principal para processar as solicitações
export async function POST(req: NextRequest) {
  try {
    // Verificar o tipo de conteúdo
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Conteúdo deve ser JSON' }, { status: 400 });
    }
    
    // Clonar a requisição para poder ler o corpo múltiplas vezes
    let data;
    try {
      const clonedReq = req.clone();
      data = await clonedReq.json();
    } catch (error) {
      console.error('Erro ao parsear JSON da requisição:', error);
      return NextResponse.json({ 
        error: 'Erro ao processar JSON da requisição' 
      }, { status: 400 });
    }
    
    // Verificar o tipo de agente
    if (data.agent === 'experiencia') {
      return processarSolicitacaoAnamnese(req);
    } else if (data.agent === 'intencaoia') {
      return processarSolicitacaoPlanoEstrategico(req);
    } else {
      // Agente padrão (SpinIA)
      const { historiaPaciente, produto, preco, descricaoProduto, apiKey } = data;
      
      // Verificar dados obrigatórios
      if (!historiaPaciente) {
        return NextResponse.json({ error: 'História do paciente não fornecida' }, { status: 400 });
      }
      
      if (!produto || !preco) {
        return NextResponse.json({ error: 'Informações do produto incompletas' }, { status: 400 });
      }
      
      try {
        // Se não houver chave da API, usar processamento local simplificado
        if (!apiKey) {
          const resultadoLocal = processarLocalmente(historiaPaciente, produto, preco, descricaoProduto || '');
          return NextResponse.json(resultadoLocal);
        }
        
        // Processar com a API do OpenAI
        const resultado = await processarComOpenAI(prompt, apiKey);
        
        // Extrair a qualificação do lead e o roteiro
        const qualificacaoMatch = resultado.match(/QUALIFICAÇÃO DE LEAD([\s\S]*?)(?=\n\nROTEIRO|\n\n#|\n\n\*\*|$)/i);
        const roteiroMatch = resultado.match(/ROTEIRO DE VENDA PERSONALIZADO([\s\S]*?)$/i);
        
        const qualificacaoTexto = qualificacaoMatch ? qualificacaoMatch[1].trim() : '';
        const roteiroTexto = roteiroMatch ? roteiroMatch[1].trim() : resultado;
        
        // Extrair informações da qualificação
        const perfilMatch = qualificacaoTexto.match(/Perfil:\s*([A-D])/i);
        const pontuacaoMatch = qualificacaoTexto.match(/Pontuação:\s*(\d+)/i);
        const justificativaMatch = qualificacaoTexto.match(/Justificativa:\s*([\s\S]*?)(?=\n|$)/i);
        const recomendacaoMatch = qualificacaoTexto.match(/Recomendação de Agenda:\s*([\s\S]*?)(?=\n|$)/i);
        
        const qualificacaoLead = {
          perfil: perfilMatch ? perfilMatch[1] : 'C',
          pontuacao: pontuacaoMatch ? parseInt(pontuacaoMatch[1]) : 50,
          justificativa: justificativaMatch ? justificativaMatch[1].trim() : 'Não fornecida',
          recomendacaoAgenda: recomendacaoMatch ? recomendacaoMatch[1].trim() : 'Agendar conforme disponibilidade'
        };
        
        return NextResponse.json({
          qualificacaoLead,
          roteiro: roteiroTexto
        });
      } catch (error) {
        console.error('Erro ao processar com OpenAI:', error);
        
        // Fallback para processamento local em caso de erro
        const resultadoLocal = processarLocalmente(historiaPaciente, produto, preco, descricaoProduto || '');
        return NextResponse.json({
          ...resultadoLocal,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          fallback: true
        });
      }
    }
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
