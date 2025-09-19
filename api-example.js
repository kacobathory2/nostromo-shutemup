require("dotenv").config();
const express = require("express");
const { createClient } = require("redis");
const cors = require("cors");

const app = express();

// Configuração do Redis
const redis = createClient({ 
  url: process.env.REDIS_URL 
});

// Conectar ao Redis
redis.connect().catch(console.error);

// Middlewares
app.use(express.json());
app.use(cors()); // Permite requisições de qualquer origem

// Rota de teste
app.get("/", async (req, res) => {
  res.json({ ok: true });
});

// Rota para salvar hiscore
app.post("/api/hiscores", async (req, res) => {
  try {
    const { nome, pontos, data } = req.body;
    
    // Validação básica
    if (!nome || !pontos) {
      return res.status(400).json({ 
        error: "Nome e pontos são obrigatórios" 
      });
    }

    // Cria o objeto do hiscore
    const hiscore = {
      nome: nome.toUpperCase(),
      pontos: parseInt(pontos),
      data: data || new Date().toISOString(),
      id: Date.now().toString() // ID único baseado no timestamp
    };

    // Salva no Redis usando o ID como chave
    await redis.hSet("hiscores", hiscore.id, JSON.stringify(hiscore));
    
    console.log("Hiscore salvo:", hiscore);
    
    res.status(201).json({
      success: true,
      message: "Hiscore salvo com sucesso",
      data: hiscore
    });

  } catch (error) {
    console.error("Erro ao salvar hiscore:", error);
    res.status(500).json({ 
      error: "Erro interno do servidor",
      details: error.message 
    });
  }
});

// Rota para buscar hiscores
app.get("/api/hiscores", async (req, res) => {
  try {
    // Busca todos os hiscores do Redis
    const hiscoresData = await redis.hGetAll("hiscores");
    
    // Converte os dados para array e ordena por pontuação
    const hiscores = Object.values(hiscoresData)
      .map(data => JSON.parse(data))
      .sort((a, b) => b.pontos - a.pontos)
      .slice(0, 10); // Top 10

    console.log(`Retornando ${hiscores.length} hiscores`);
    
    res.json(hiscores);

  } catch (error) {
    console.error("Erro ao buscar hiscores:", error);
    res.status(500).json({ 
      error: "Erro interno do servidor",
      details: error.message 
    });
  }
});

// Rota para limpar todos os hiscores (opcional, para testes)
app.delete("/api/hiscores", async (req, res) => {
  try {
    await redis.del("hiscores");
    res.json({ 
      success: true, 
      message: "Todos os hiscores foram removidos" 
    });
  } catch (error) {
    console.error("Erro ao limpar hiscores:", error);
    res.status(500).json({ 
      error: "Erro interno do servidor",
      details: error.message 
    });
  }
});

// Tratamento de erros do Redis
redis.on('error', (err) => {
  console.error('Erro no Redis:', err);
});

redis.on('connect', () => {
  console.log('Conectado ao Redis com sucesso!');
});

module.exports = app;