




let contador = 0;

let db;

let exportandoPDF = false;

function abrirBanco() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("RelatorioDB", 1);

        request.onupgradeneeded = event => {
            db = event.target.result;
            db.createObjectStore("rascunho", { keyPath: "id" });
        };

        request.onsuccess = event => {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = () => reject("Erro ao abrir IndexedDB");
    });
}

async function salvarAutoSave() {
    if (!db) await abrirBanco();
	if (exportandoPDF) return;
    const dados = {
        id: "relatorioAtual",
        filial: document.getElementById("filialInput")?.value || "",
        incidente: document.getElementById("incidenteInput")?.value || "",
        field: document.getElementById("fieldInput")?.value || "",
        outroField: document.getElementById("outroField")?.value || "",
        observacao: document.getElementById("obsInput")?.value || "",
        evidencias: []
    };

    document.querySelectorAll(".evidencia").forEach(ev => {
        const texto = ev.querySelector(".descricao-input")?.value || "";
        const img = ev.querySelector("img")?.src || "";
        dados.evidencias.push({ texto, img });
    });

    const tx = db.transaction("rascunho", "readwrite");
    const store = tx.objectStore("rascunho");
    store.put(dados);

    console.log("💾 Auto-save (IndexedDB)");
	
}
async function restaurarAutoSave() {
    if (!db) await abrirBanco();

    const tx = db.transaction("rascunho", "readonly");
    const store = tx.objectStore("rascunho");
    const req = store.get("relatorioAtual");

    req.onsuccess = () => {
        const data = req.result;
        if (!data) return;

        document.getElementById("filialInput").value = data.filial || "";
        document.getElementById("incidenteInput").value = data.incidente || "";
        document.getElementById("fieldInput").value = data.field || "";
        document.getElementById("obsInput").value = data.observacao || "";
		
		
		// === Limpa evidências atuais ===
        document.getElementById("lista").innerHTML = "";


        
		// === Restaura evidências corretamente ===
        data.evidencias.forEach((ev, index) => {
            adicionarEvidencia();

            setTimeout(() => {

					 const blocos = document.querySelectorAll(".evidencia");
						const bloco = blocos[index];// ✅ PEGA A EVIDÊNCIA CORRETA
						
						if (!bloco) return;

						const texto = bloco.querySelector(".descricao-input");
						const img = bloco.querySelector("img");

						if (texto) {
						  texto.value = ev.texto || "";
						  texto.addEventListener("input", atualizarEstadoBotaoFinalizar);
						}

						if (img && ev.img) {
						  img.onload = atualizarEstadoBotaoFinalizar;
						  img.onerror = atualizarEstadoBotaoFinalizar;
						  img.src = ev.img;
						}
					
				// ✅ fallback de segurança
					atualizarEstadoBotaoFinalizar();

            }, 0);
        });

		atualizarEstadoBotaoFinalizar();
        renumerarEvidencias();
        console.log("✅ Auto-save restaurado");
    };
}


document.addEventListener("DOMContentLoaded", async () => {
  await abrirBanco();
  restaurarAutoSave();

  // Campos obrigatórios
  ["filialInput", "incidenteInput", "fieldInput", "obsInput"]
    .forEach(id => {
      document.getElementById(id)
        .addEventListener("input", atualizarEstadoBotaoFinalizar);
    });

  atualizarEstadoBotaoFinalizar();
});


function validarCamposObrigatorios() {
  if (!document.getElementById("filialInput").value.trim()) {
    alert("⚠️ Informe o Nome da Filial.");
    return false;
  }

  if (!document.getElementById("incidenteInput").value.trim()) {
    alert("⚠️ Informe o Número do Incidente.");
    return false;
  }

  if (!document.getElementById("fieldInput").value.trim()) {
    alert("⚠️ Informe o Nome do Field.");
    return false;
  }

  if (!document.getElementById("obsInput").value.trim()) {
    alert("⚠️ Preencha a Observação do que foi realizado.");
    return false;
  }
  const evidencias = document.querySelectorAll(".evidencia");

  if (evidencias.length === 0) {
    alert("⚠️ Adicione pelo menos uma evidência.");
    return false;
  }

  for (let ev of evidencias) {
    const texto = ev.querySelector(".descricao-input")?.value.trim();
    const img = ev.querySelector("img")?.src;

    if (!texto) {
      alert("⚠️ Todas as evidências devem ter descrição.");
      return false;
    }

    if (!img) {
      alert("⚠️ Todas as evidências devem ter imagem.");
      return false;
    }
  }

  return true;
}

function removerEvidencia(botao) {
    const bloco = botao.closest(".evidencia");
    if (!bloco) return;

    const confirmar = confirm("Deseja remover esta evidência?");
    if (!confirmar) return;

    bloco.remove();
    renumerarEvidencias();
	
	//atulizar banco
	salvarAutoSave();
	atualizarEstadoBotaoFinalizar();
}

function renumerarEvidencias() {
    document.querySelectorAll(".evidencia").forEach((bloco, index) => {
        const titulo = bloco.querySelector(".card-title, h6, h3");
        if (titulo) {
            titulo.innerText = `Evidência ${index + 1}`;
        }
    });
}


function adicionarEvidencia() {
    contador++;

    const div = document.createElement("div");
	
    div.className = "evidencia";
    div.innerHTML = `
	<div class="card-body">

            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="card-title mb-0">Evidência ${contador}</h6>

                <!-- Botão remover -->
                <button class="btn no-pdf btn-outline-danger btn-sm no-pdf"
                        onclick="removerEvidencia(this)">
                    <i class="bi bi-trash"></i>
                </button>
            </div>

            <textarea class="form-control descricao-input  no-pdf mb-2"  placeholder="Descrição"></textarea>

            <div class="descricao-pdf mb-2"
                 style="display:none; white-space: pre-wrap;">
            </div>

            <div class="d-flex align-items-center gap-2 mb-2 no-pdf">

                <button class="btn no-pdf btn-outline-primary btn-sm"
                        onclick="tirarPrint('img_${contador}')">
                    <i class="bi bi-camera"></i> Print
                </button>

                <button class="btn no-pdf btn-outline-secondary btn-sm"
                        onclick="document.getElementById('file_${contador}').click()">
                    <i class="bi bi-image"></i> Update Imagem
                </button>

                <input type="file"
                       id="file_${contador}"
                       accept="image/*"
                       onchange="carregarImagem(this,'img_${contador}')"
                       hidden>
            </div>

			
			<img id="img_${contador}" 
				 class="img-fluid rounded border">


        </div>
    `;
// 👉 AGORA ENTRA NO TOPO
    document.getElementById("lista").prepend(div);
	
	 renumerarEvidencias()
	atualizarEstadoBotaoFinalizar();
}

async function tirarPrint(id) {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const video = document.createElement("video");
    video.srcObject = stream;
    await video.play();

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    stream.getTracks().forEach(t => t.stop());

    document.getElementById(id).src = canvas.toDataURL();
	// ✅ SALVA DEPOIS DO PRINT
	 salvarAutoSave();
	 atualizarEstadoBotaoFinalizar();
}


function carregarImagem(input, id) {
  if (!input.files || !input.files[0]) return; // ✅ cancelado ou vazio

  const img = document.getElementById(id);
  if (!img) return; // ✅ segurança extra

  const reader = new FileReader();

  reader.onload = () => {
    img.src = reader.result;

    // ✅ salva e revalida somente após imagem pronta
    salvarAutoSave();
    atualizarEstadoBotaoFinalizar();
  };

  reader.readAsDataURL(input.files[0]);
}

/* ===== FUNÇÃO AUXILIAR: AJUSTAR IMAGEM ===== */
function ajustarImagem(doc, img, maxW, maxH) {
  const props = doc.getImageProperties(img);

  const ratio = Math.min(
    maxW / props.width,
    maxH / props.height
  );

  return {
    w: props.width * ratio,
    h: props.height * ratio,
    type: props.fileType
  };
}

function ajustarImagemQuadrado(doc, img, boxW, boxH) {
  const props = doc.getImageProperties(img);

  // usa MAX (fill), não min (contain)
  const ratio = Math.max(
    boxW / props.width,
    boxH / props.height
  );

  const w = props.width * ratio;
  const h = props.height * ratio;

  return {
    w,
    h,
    type: props.fileType
  };
}

function desenharCabecalho(doc) {
  const imgEsq = document.getElementById("logoEsq");
  const imgDir = document.getElementById("logoDir");

  const margem = 15;
  const topo = 10;
  const logoW = 35;
  const logoH = 18;

  // logos
  doc.addImage(imgEsq, "PNG", margem, topo, logoW, logoH);
  doc.addImage(imgDir, "PNG", 210 - margem - logoW, topo, logoW, logoH);

  // linha separadora
  doc.setDrawColor(180);
  doc.line(15, topo + logoH + 4, 195, topo + logoH + 4);

  // retorna onde o conteúdo deve começar
  return topo + logoH + 12;
}
function desenharRodape(doc, texto) {
  const alturaPagina = doc.internal.pageSize.getHeight();

  doc.setFontSize(9);
  doc.setTextColor(100);

  // linha separadora (opcional)
  doc.setDrawColor(200);
  doc.line(15, alturaPagina - 20, 195, alturaPagina - 20);

  // texto centralizado
  doc.text(
    texto,
    105,
    alturaPagina - 10,
    { align: "center" }
  );
}

async function exportarPDF() {
	  if (!validarCamposObrigatorios()) return;
	  
	  
		const dataHora = new Date().toLocaleString("pt-BR", {
		  dateStyle: "short",
		  timeStyle: "short"
		});

	  

	  const { jsPDF } = window.jspdf;
	  const doc = new jsPDF("p", "mm", "a4");

	  const filial = document.getElementById("filialInput").value;
	  const incidente = document.getElementById("incidenteInput").value;
	  const field = document.getElementById("fieldInput").value;
	  const observacao = document.getElementById("obsInput").value;
	  
	  
	
	const imgEsq = document.getElementById("logoEsq");
	const imgDir = document.getElementById("logoDir");


	
	  


	// posição inicial do conteúdo
	  let y = desenharCabecalho(doc);




	  /* ===== TÍTULO ===== */
	  doc.setFontSize(18);
	  doc.text("Relatório de Evidências", 105, y, { align: "center" });
	  y += 12;

	  /* ===== CAMPOS (3 colunas) ===== */
	  doc.setFontSize(10);

	  
	  const startX = 15;
	  const startY = y;
	  const boxH = 16;
	  const gap = 5;
	  const boxW = (180 - gap * 2) / 3; // divide igualment
	  
	  const limiteInferior = 270; // acima do rodapé



	function campo(x, y, label, value) {
		  // Label
		  doc.setFontSize(9);
		  doc.text(label, x, y - 3);

		  // Caixa
		  doc.rect(x, y, boxW, boxH);

		  // Texto com quebra automática
		  doc.setFontSize(10);

		  const padding = 2;
		  const larguraTexto = boxW - padding * 2;

		  const linhas = doc.splitTextToSize(value || "-", larguraTexto);

		  // altura inicial do texto
		  let yTexto = y + 6;

		  //desenha no máximo 2 linhas (para não estourar)
		  linhas.slice(0, 2).forEach(linha => {
			doc.text(linha, x + padding, yTexto);
			yTexto += 5;
		  });
	}

	campo(startX, y, "Nome da Filial", filial);
	campo(startX + boxW + 5, y, "Número do Incidente", incidente);
	campo(startX + (boxW * 2) + 10, y, "Nome do Field", field);

	y += 25;

	/* ===== TÍTULO TABELA ===== */
	doc.setFontSize(14);
	doc.text("Orientações de Evidências Necessárias", 15, y);
	y += 6;

	/* ===== TABELA ===== */
	doc.setFontSize(10);

	const colX = [15, 30, 95];
	const colW = [15, 65, 100];
	const rowH = 8;

	const headers = ["Item", "Descrição", "Evidência"];
	headers.forEach((h, i) => {
	doc.rect(colX[i], y, colW[i], rowH);
	doc.text(h, colX[i] + 2, y + 5);
	});

	y += rowH;

	const rows = [
	["1", "Observação do que foi realizado", "Descrição detalhada do serviço executado"],
	["2", "Foto do Módulo – Antes", "Imagem da condição inicial do módulo"],
	["3", "Foto do Módulo – Durante", "Imagem do momento da execução"],
	["4", "Foto do Módulo – Depois", "Imagem do estado final do módulo"]
	];

	rows.forEach(r => {
		r.forEach((txt, i) => {
		  doc.rect(colX[i], y, colW[i], rowH);
		  doc.text(txt, colX[i] + 2, y + 5);
		});
		y += rowH;
	});

	y += 8;

	/* ===== OBSERVAÇÃO ===== */
	doc.setFontSize(14);
	doc.text("Observação do que foi realizado", 15, y);
	y += 5;


	doc.rect(15, y, 180, 25);
	doc.setFontSize(10);
	const obsSplit = doc.splitTextToSize(observacao, 176);
	doc.text(obsSplit, 17, y + 6);

	// ✅ avança o y após a observação
	y += 50;

	// ✅ agora sim escreve o texto mais para baixo
	doc.setFontSize(14);
	
	doc.text(
	  "Evidências nas próximas páginas",
	  105,   // centro da página A4
	  y,
	  { align: "center" }
	);


	// ✅ pequeno espaço antes de trocar de página
	y += 5;

    
	doc.addPage();
	const evidencias = [...document.querySelectorAll(".evidencia")];
	
	let margemTop = desenharCabecalho(doc);
	const margemLeft = 15;
	const areaAltura = 130; // espaço vertical por evidência
	const imgMaxW = 180;
	const imgMaxH = 85
	
	/* VARIÁVEIS DE LAYOUT DA EVIDÊNCIA */
	const tituloAltura = 5;
	const descricaoAltura = 22;
	const espacamento = 5;
	const imagemAltura = areaAltura - (tituloAltura + descricaoAltura + espacamento);


  /* ===== EVIDÊNCIAS ===== */

	evidencias.forEach((ev, index) => {

  // ✅ Nova página a cada 2 evidências
  if (index % 2 === 0 && index !== 0) {
    doc.addPage();
    margemTop = desenharCabecalho(doc);
  }

  // ✅ Posição base da evidência
  let yBase = margemTop + (index % 2) * areaAltura;

  const texto = ev.querySelector(".descricao-input")?.value || "-";
  const img = ev.querySelector("img");

  /* ===== TÍTULO (TOPO) ===== */
  doc.setFontSize(13);
  doc.text(`Evidência ${index + 1}`, margemLeft, yBase);
  yBase += tituloAltura;

  /* ===== DESCRIÇÃO DA IMAGEM ===== */
  doc.setFontSize(10);
  doc.rect(margemLeft, yBase - 4, 180, descricaoAltura);

  const textoSplit = doc.splitTextToSize(texto, 176);
  doc.text(textoSplit.slice(0, 4), margemLeft + 2, yBase);

  yBase += descricaoAltura + espacamento;

  /* ===== IMAGEM ===== */
  /* ===== IMAGEM ===== */
	if (img) {

	  const boxW = 180;
	  const boxH = imagemAltura;

	  // ✅ USAR CONTAIN
	  const dims = ajustarImagem(doc, img, boxW, boxH);

	  const xImg = margemLeft + (boxW - dims.w) / 2;
	  const yImg = yBase + (boxH - dims.h) / 2;

	  // moldura
	  doc.setDrawColor(0);
	  doc.rect(margemLeft, yBase, boxW, boxH);

	  doc.addImage(
		img,
		dims.type,
		xImg,
		yImg,
		dims.w,
		dims.h
	  );
	}

});
	
	const totalPaginas = doc.getNumberOfPages();

	for (let i = 1; i <= totalPaginas; i++) {
	  doc.setPage(i);
	  desenharRodape(
		doc,
		`${incidente} | ${dataHora} | Página ${i} de ${totalPaginas}`
	  );
	}


  doc.save(`${incidente}_Evidencias.pdf`);
  atualizarEstadoBotaoFinalizar()  
  
}

 

const templates = {
  1: {
      observacao:
`Realizado abertura manual da cancela lado A`,
    evidencias: [
      { texto: "Antes de Ativar modo manual" },
      { texto: "Modo manual Ativo" },
      { texto: "Cancela lado A aberto" },
	  { texto: "Cancela lado A Fechado" },
	  { texto: "Modo manual desativado" }
    ]
  },

  2: {
    observacao:
	"Relizado abertura manual da cancela lado B",
    evidencias: [
      { texto: "Antes de Ativar modo manual" },
      { texto: "Modo manual Ativo" },
      { texto: "Cancela lado B aberto" },
	  { texto: "Cancela lado B Fechado" },
	  { texto: "Modo manual desativado" }
    ]
  },

  3: {
     observacao:
"Realizado abertura manual da cancel do lado A e lado B",
    evidencias: [
      { texto: "Antes de Ativar modo manual" },
      { texto: "Modo manual Ativo" },
	  { texto: "Cancela lado A aberto" },
	  { texto: "Cancela lado A Fechado" },
      { texto: "Cancela lado B aberto" },
	  { texto: "Cancela lado B Fechado" },
	  { texto: "Modo manual desativado" }
    ]
  },
  4: {
     observacao:
		"Realizado Reset do MCA",
    evidencias: [
      { texto: "Modulo desligado" },
	  { texto: "Modulo ligado" }
    ]
  },
  5: {
     observacao:
		"Realizado abertura manual da cancel do lado A e lado B",
    evidencias: [
      { texto: "Antes de Ativar modo manual" },
      { texto: "Modo manual Ativo" },
	  { texto: "Cancela lado B aberto" },
	  { texto: "Cancela lado B Fechado" },
      { texto: "Cancela lado A aberto" },
	  { texto: "Cancela lado a Fechado" },
	  { texto: "Modo manual desativado" }
    ]
  }
};


function aplicarTemplate(numero) {

  const t = templates[numero];
  if (!t) return;

  if (!confirm("Aplicar este template e substituir os dados atuais?")) return;

  // Campos principais
  document.getElementById("obsInput").value = t.observacao;

  // Limpa evidências atuais
  document.getElementById("lista").innerHTML = "";

  // Cria evidências do template
 
	t.evidencias.slice().reverse().forEach(ev => {
	  adicionarEvidencia();
	  const bloco = document.querySelector(".evidencia:first-child");
	  bloco.querySelector(".descricao-input").value = ev.texto;
	});


  renumerarEvidencias();
  salvarAutoSave();

  alert("✅ Template aplicado com sucesso!");
}

function limparCampos() {
  if (!confirm("Deseja limpar todos os campos do relatório?")) return;

  document.getElementById("filialInput").value = "";
  document.getElementById("incidenteInput").value = "";
  document.getElementById("fieldInput").value = "";
  document.getElementById("obsInput").value = "";
  document.getElementById("lista").innerHTML = "";

  salvarAutoSave();
}

//monitora em tempo real os Campos obriatorios

function atualizarEstadoBotaoFinalizar() {
  const btn = document.getElementById("btnFinalizar");
  if (!btn) return;

  const filial = document.getElementById("filialInput").value.trim();
  const incidente = document.getElementById("incidenteInput").value.trim();
  const field = document.getElementById("fieldInput").value.trim();
  const observacao = document.getElementById("obsInput").value.trim();

  // ✅ Evidências
  const evidencias = document.querySelectorAll(".evidencia");
  let evidenciasValidas = evidencias.length > 0;

  evidencias.forEach(ev => {
    const texto = ev.querySelector(".descricao-input")?.value.trim();
    const img = ev.querySelector("img")?.src;

    if (!texto || !img) {
      evidenciasValidas = false;
    }
  });

  const tudoPreenchido =
    filial &&
    incidente &&
    field &&
    observacao &&
    evidenciasValidas;

  btn.disabled = !tudoPreenchido;
  btn.style.opacity = tudoPreenchido ? "1" : "0.5";
  btn.style.cursor = tudoPreenchido ? "pointer" : "not-allowed";
}






document.addEventListener("input", salvarAutoSave);
document.addEventListener("change", salvarAutoSave);
