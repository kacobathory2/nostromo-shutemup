let podeAtirar = true;
const intervaloTiro = 200;

// pontuação
let pontuacao = 0;
const placar = document.getElementById("placar");

// cria o estilo via JavaScript
const style = document.createElement("style");
style.innerHTML = `
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
#placar {
  position: absolute;
  top: 320px;
  left: 60px;
  color: #39ff14;
  font-size: 18px;
  font-family: 'Press Start 2P', cursive, sans-serif;
  z-index: 2;
  text-shadow: 
    2px 2px 2px #000,       /* sombra preta atrás */
    0 0 5px #39ff14,
    0 0 10px #39ff14,
    0 0 20px #0aff0a,
    0 0 40px #0aff0a;
  animation: neon-flicker 1.5s infinite alternate;
}
@keyframes neon-flicker {
  0% { opacity: 1; }
  50% { opacity: 0.85; }
  100% { opacity: 1; }
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(-50px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}`;
document.head.appendChild(style);
document.body.appendChild(placar);
atualizarPlacar();

// game elements
const gameBox = document.getElementById("gameBox");
const nave = document.getElementById("nave");

// posição inicial centralizada
let posX = gameBox.clientWidth / 2 - nave.offsetWidth / 2;
let posY = gameBox.clientHeight / 2 - nave.offsetHeight / 2;
nave.style.left = `${posX}px`;
nave.style.top = `${posY}px`;

const velocidade = 5;
let teclaEsquerda = false;
let teclaDireita = false;
let teclaCima = false;
let teclaBaixo = false;

// --------------------
// CONTROLE DE TECLAS
// --------------------
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") teclaEsquerda = true;
  if (e.key === "ArrowRight") teclaDireita = true;
  if (e.key === "ArrowUp") teclaCima = true;
  if (e.key === "ArrowDown") teclaBaixo = true;
  if (e.code === "Space") disparar();
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") teclaEsquerda = false;
  if (e.key === "ArrowRight") teclaDireita = false;
  if (e.key === "ArrowUp") teclaCima = false;
  if (e.key === "ArrowDown") teclaBaixo = false;
});

// --------------------
// MOVIMENTO SUAVE NAVE
// --------------------
function moverNave() {
  if (teclaEsquerda) posX -= velocidade;
  if (teclaDireita) posX += velocidade;
  if (teclaCima) posY -= velocidade;
  if (teclaBaixo) posY += velocidade;

  posX = Math.max(0, Math.min(posX, gameBox.clientWidth - nave.offsetWidth));
  posY = Math.max(0, Math.min(posY, gameBox.clientHeight - nave.offsetHeight));

  nave.style.left = `${posX}px`;
  nave.style.top = `${posY}px`;

  requestAnimationFrame(moverNave);
}
moverNave();

async function atualizarRanking() {
  try {
    const scores = await buscarHiscoresAPI();
    let rankingList = document.getElementById("rankingList");

    if (rankingList) {
      rankingList.innerHTML = "";

      scores.slice(0, 10).forEach((s, i) => {
        let li = document.createElement("li");
        li.textContent = `${i + 1}. ${s.nome} - ${s.pontos}`;
        rankingList.appendChild(li);
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar ranking:', error);
  }
}

// --------------------
// FUNÇÕES DA API DE HISCORES
// --------------------
const API_BASE_URL = 'https://nostromo-shutemup-backend.vercel.app';

async function salvarHiscoreAPI(nome, pontos) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hiscores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        nome: nome.toUpperCase(),
        pontos: pontos,
        data: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('Hiscore salvo com sucesso na API:', result);
    return result;
  } catch (error) {
    console.error('Erro ao salvar hiscore na API:', error);
    // Fallback para localStorage se a API falhar
    salvarRecordLocal(nome, pontos);
    throw error;
  }
}

async function buscarHiscoresAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hiscores`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    const hiscores = await response.json();
    console.log('Hiscores carregados da API:', hiscores);
    
    // Garante que retorna um array ordenado por pontuação
    if (Array.isArray(hiscores)) {
      return hiscores.sort((a, b) => b.pontos - a.pontos).slice(0, 10);
    }
    
    return [];
  } catch (error) {
    console.error('Erro ao buscar hiscores da API:', error);
    // Fallback para localStorage se a API falhar
    const localScores = JSON.parse(localStorage.getItem("scores")) || [];
    console.log('Usando hiscores locais como fallback:', localScores);
    return localScores;
  }
}

// --------------------
// SALVAR RECORD NO LOCALSTORAGE (FALLBACK)
// --------------------
function salvarRecordLocal(nome, pontos) {
  let scores = JSON.parse(localStorage.getItem("scores")) || [];
  scores.push({ nome, pontos });
  scores.sort((a, b) => b.pontos - a.pontos);
  scores = scores.slice(0, 10);
  localStorage.setItem("scores", JSON.stringify(scores));
}

// --------------------
// MODAL PARA SALVAR RECORD
// --------------------
function mostrarModalRecord() {
  // Cria o overlay principal
  const overlay = document.createElement("div");
  overlay.id = "record-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "10000";
  overlay.style.fontFamily = "'Press Start 2P', cursive, sans-serif";

  // Container do modal
  const modal = document.createElement("div");
  modal.style.backgroundColor = "rgba(0, 20, 0, 0.95)";
  modal.style.border = "3px solid #39ff14";
  modal.style.borderRadius = "15px";
  modal.style.padding = "40px";
  modal.style.textAlign = "center";
  modal.style.boxShadow = "0 0 20px #39ff14, 0 0 40px #0aff0a";
  modal.style.animation = "modal-appear 0.5s ease-out";
  modal.style.minWidth = "400px";

  // Título
  const titulo = document.createElement("h1");
  titulo.textContent = "🏆 NOVO RECORD! 🏆";
  titulo.style.color = "#39ff14";
  titulo.style.fontSize = "24px";
  titulo.style.marginBottom = "20px";
  titulo.style.textShadow =
    "2px 2px 2px #000, 0 0 5px #39ff14, 0 0 10px #39ff14";
  titulo.style.animation = "neon-flicker 1.5s infinite alternate";

  // Pontuação
  const pontuacaoDisplay = document.createElement("p");
  pontuacaoDisplay.textContent = `Pontuação: ${pontuacao}`;
  pontuacaoDisplay.style.color = "#ffffff";
  pontuacaoDisplay.style.fontSize = "16px";
  pontuacaoDisplay.style.marginBottom = "30px";
  pontuacaoDisplay.style.textShadow = "2px 2px 2px #000";

  // Label
  const label = document.createElement("p");
  label.textContent = "Digite suas iniciais:";
  label.style.color = "#39ff14";
  label.style.fontSize = "14px";
  label.style.marginBottom = "15px";
  label.style.textShadow = "2px 2px 2px #000";

  // Input
  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = 3;
  input.placeholder = "ABC";
  input.style.cssText = `
    width: 120px;
    height: 40px;
    font-size: 18px;
    text-align: center;
    background-color: rgba(0, 0, 0, 0.8);
    border: 2px solid #39ff14;
    border-radius: 8px;
    color: #39ff14;
    font-family: 'Press Start 2P', cursive, sans-serif;
    text-transform: uppercase;
    outline: none;
    box-shadow: 0 0 10px rgba(57, 255, 20, 0.3);
    margin: 0 auto 25px auto;
    display: block;
  `;

  // Botão salvar
  const btnSalvar = document.createElement("button");
  btnSalvar.textContent = "SALVAR E JOGAR";
  btnSalvar.style.cssText = `
    padding: 12px 25px;
    font-size: 14px;
    background-color: rgba(0, 0, 0, 0.8);
    border: 2px solid #39ff14;
    border-radius: 8px;
    color: #39ff14;
    font-family: 'Press Start 2P', cursive, sans-serif;
    cursor: pointer;
    margin-right: 15px;
    transition: all 0.3s ease;
    box-shadow: 0 0 10px rgba(57, 255, 20, 0.3);
  `;

  // Botão pular
  const btnPular = document.createElement("button");
  btnPular.textContent = "PULAR";
  btnPular.style.cssText = `
    padding: 12px 30px;
    font-size: 14px;
    background-color: rgba(50, 0, 0, 0.8);
    border: 2px solid #ff3939;
    border-radius: 8px;
    color: #ff3939;
    font-family: 'Press Start 2P', cursive, sans-serif;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 0 10px rgba(255, 57, 57, 0.3);
  `;

  // Eventos do input
  input.addEventListener("input", (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
  });

  // Eventos dos botões
  btnSalvar.addEventListener("click", async () => {
    const nome = input.value.trim();
    if (nome.length === 3) {
      try {
        // Desabilita o botão para evitar cliques múltiplos
        btnSalvar.disabled = true;
        btnSalvar.textContent = "SALVANDO...";
        
        // Tenta salvar na API primeiro
        await salvarHiscoreAPI(nome, pontuacao);
        
        document.body.removeChild(overlay);
        await atualizarRanking();
        location.reload();
      } catch (error) {
        // Se falhar, mostra mensagem mas continua (já foi salvo no localStorage como fallback)
        console.error('Erro ao salvar na API, mas foi salvo localmente:', error);
        document.body.removeChild(overlay);
        await atualizarRanking();
        location.reload();
      }
    } else {
      input.style.borderColor = "#ff3939";
      input.style.animation = "shake 0.5s";
      setTimeout(() => {
        input.style.borderColor = "#39ff14";
        input.style.animation = "";
      }, 500);
    }
  });

  btnPular.addEventListener("click", () => {
    document.body.removeChild(overlay);
    mostrarTelaGameOver();
  });

  // Enter para salvar
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && input.value.length === 3) {
      btnSalvar.click();
    }
  });

  // Container dos botões
  const buttonContainer = document.createElement("div");
  buttonContainer.style.marginTop = "20px";
  buttonContainer.appendChild(btnSalvar);
  buttonContainer.appendChild(btnPular);

  // Monta o modal
  modal.appendChild(titulo);
  modal.appendChild(pontuacaoDisplay);
  modal.appendChild(label);
  modal.appendChild(input);
  modal.appendChild(buttonContainer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Foca no input
  setTimeout(() => input.focus(), 100);
}

// --------------------
// TELA GAME OVER FINAL
// --------------------
function mostrarTelaGameOver() {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0,0,0,0.9);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #39ff14;
    font-size: 32px;
    font-family: 'Press Start 2P', cursive, sans-serif;
    text-shadow: 2px 2px 2px #000, 0 0 5px #39ff14, 0 0 10px #39ff14;
    z-index: 10001;
  `;

  const gameOverText = document.createElement("p");
  gameOverText.textContent = "💥 GAME OVER 💥";
  gameOverText.style.marginBottom = "30px";
  gameOverText.style.animation = "neon-flicker 1.5s infinite alternate";

  const btn = document.createElement("button");
  btn.textContent = "Jogar Novamente";
  btn.style.cssText = `
    padding: 15px 30px;
    font-size: 18px;
    cursor: pointer;
    font-family: 'Press Start 2P', cursive, sans-serif;
    background-color: rgba(0, 0, 0, 0.8);
    border: 3px solid #39ff14;
    border-radius: 10px;
    color: #39ff14;
    box-shadow: 0 0 15px rgba(57, 255, 20, 0.5);
    transition: all 0.3s ease;
  `;

  btn.addEventListener("click", () => location.reload());

  overlay.appendChild(gameOverText);
  overlay.appendChild(btn);
  document.body.appendChild(overlay);
}

// carrega ranking ao abrir jogo
atualizarRanking();

// Atualiza o ranking a cada 30 segundos para pegar novos hiscores
setInterval(atualizarRanking, 30000);

// --------------------
// FUNÇÃO PLACAR
// --------------------
function atualizarPlacar() {
  placar.innerText = "Pontuação: " + pontuacao;
}

// --------------------
// DISPAROS NAVE
// --------------------
function disparar() {
  if (!podeAtirar) return;
  podeAtirar = false;

  const tiro = document.createElement("div");
  tiro.classList.add("tiro");

  const naveRect = nave.getBoundingClientRect();
  const boxRect = gameBox.getBoundingClientRect();

  tiro.style.left =
    naveRect.left - boxRect.left + nave.offsetWidth / 2 - 2.5 + "px";
  tiro.style.top = nave.offsetTop - 15 + "px";

  gameBox.appendChild(tiro);

  let intervalo = setInterval(() => {
    let top = parseInt(tiro.style.top);
    if (top <= 0) {
      tiro.remove();
      clearInterval(intervalo);
    } else {
      tiro.style.top = top - 10 + "px";

      const inimigos = gameBox.querySelectorAll(".inimigo");
      inimigos.forEach((inimigo) => {
        const tiroRect = tiro.getBoundingClientRect();
        const inimigoRect = inimigo.getBoundingClientRect();

        if (
          !(
            tiroRect.right < inimigoRect.left ||
            tiroRect.left > inimigoRect.right ||
            tiroRect.bottom < inimigoRect.top ||
            tiroRect.top > inimigoRect.bottom
          )
        ) {
          criarExplosao(
            inimigo.offsetLeft + inimigo.offsetWidth / 2 - 25,
            inimigo.offsetTop + inimigo.offsetHeight / 2 - 25
          );

          inimigo.remove();
          tiro.remove();
          clearInterval(intervalo);

          pontuacao += 1000;
          atualizarPlacar();
        }
      });
    }
  }, 30);

  setTimeout(() => (podeAtirar = true), intervaloTiro);
}

// --------------------
// CRIAR INIMIGOS
// --------------------
function criarInimigo() {
  const inimigo = document.createElement("img");
  const tipo = Math.floor(Math.random() * 4) + 1;
  inimigo.src = `./inimigo${tipo}.gif`;
  inimigo.classList.add("inimigo");
  inimigo.style.width = "70px";
  inimigo.style.height = "70px";

  const posX = Math.random() * (gameBox.clientWidth - 50);
  inimigo.style.left = `${posX}px`;
  inimigo.style.top = "0px";

  gameBox.appendChild(inimigo);
  moverInimigo(inimigo);
}

// --------------------
// MOVIMENTO INIMIGOS
// --------------------
function moverInimigo(inimigo) {
  let posY = 0;
  let posX = parseInt(inimigo.style.left);
  let direcao = Math.random() < 0.5 ? -1 : 1;
  const velocidadeY = 1 + Math.random() * 2;
  const velocidadeX = 0.5 + Math.random();

  const intervalo = setInterval(() => {
    posY += velocidadeY;
    posX += direcao * velocidadeX;

    if (posX < 0) {
      posX = 0;
      direcao *= -1;
    }
    if (posX > gameBox.clientWidth - inimigo.offsetWidth) {
      posX = gameBox.clientWidth - inimigo.offsetWidth;
      direcao *= -1;
    }

    inimigo.style.top = `${posY}px`;
    inimigo.style.left = `${posX}px`;

    if (posY > gameBox.clientHeight) {
      inimigo.remove();
      clearInterval(intervalo);
    }

    if (Math.random() < 0.01) dispararInimigo(inimigo);
  }, 30);
}

// --------------------
// TIROS INIMIGOS
// --------------------
function dispararInimigo(inimigo) {
  const tiro = document.createElement("div");
  tiro.classList.add("tiro-inimigo");
  tiro.style.left = inimigo.offsetLeft + inimigo.offsetWidth / 2 - 2.5 + "px";
  tiro.style.top = inimigo.offsetTop + inimigo.offsetHeight + "px";

  gameBox.appendChild(tiro);

  const intervalo = setInterval(() => {
    let top = parseInt(tiro.style.top);
    if (top > gameBox.clientHeight) {
      tiro.remove();
      clearInterval(intervalo);
      return;
    }
    tiro.style.top = top + 5 + "px";

    // colisão com a nave
    const tiroRect = tiro.getBoundingClientRect();
    const tiroX = tiroRect.left - gameBox.getBoundingClientRect().left;
    const tiroY = tiroRect.top - gameBox.getBoundingClientRect().top;

    if (
      !(
        tiroX + tiro.offsetWidth < nave.offsetLeft ||
        tiroX > nave.offsetLeft + nave.offsetWidth ||
        tiroY + tiro.offsetHeight < nave.offsetTop ||
        tiroY > nave.offsetTop + nave.offsetHeight
      )
    ) {
      // explosão na nave
      const naveCenterX = nave.offsetLeft + nave.offsetWidth / 2 - 25;
      const naveCenterY = nave.offsetTop + nave.offsetHeight / 2 - 25;
      criarExplosao(naveCenterX, naveCenterY);

      nave.remove();
      tiro.remove();
      clearInterval(intervalo);

      setTimeout(() => mostrarModalRecord(), 600);
    }
  }, 30);
}

// --------------------
// CRIAR EXPLOSÃO
// --------------------
function criarExplosao(x, y) {
  const explosao = document.createElement("div");
  explosao.classList.add("explosao");
  explosao.style.left = x + "px";
  explosao.style.top = y + "px";
  gameBox.appendChild(explosao);

  for (let i = 0; i < 8; i++) {
    const frag = document.createElement("div");
    frag.classList.add("fragmento");

    const angle = Math.random() * 2 * Math.PI;
    const distance = 30 + Math.random() * 20;
    frag.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    frag.style.setProperty("--y", `${Math.sin(angle) * distance}px`);

    explosao.appendChild(frag);
  }

  setTimeout(() => explosao.remove(), 600);
}

// --------------------
// CRIAR INIMIGOS PERIODICAMENTE
// --------------------
setInterval(criarInimigo, 1500);
