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

  /* ===============================
     CABEÇALHO PRIMEIRA PÁGINA
  ============================== */
  let y = desenharCabecalho(doc);

  /* TÍTULO */
  doc.setFontSize(18);
  doc.text("Relatório de Evidências", 105, y, { align: "center" });
  y += 12;

  /* ===============================
     CAMPOS SUPERIORES
  ============================== */
  const startX = 15;
  const boxH = 16;
  const gap = 5;
  const boxW = (180 - gap * 2) / 3;

  function campo(x, yPos, label, value) {
    doc.setFontSize(9);
    doc.text(label, x, yPos - 3);

    doc.rect(x, yPos, boxW, boxH);

    doc.setFontSize(10);

    const linhas = doc.splitTextToSize(value || "-", boxW - 4);

    let yTexto = yPos + 6;

    linhas.slice(0, 2).forEach(linha => {
      doc.text(linha, x + 2, yTexto);
      yTexto += 5;
    });
  }

  campo(startX, y, "Nome da Filial", filial);
  campo(startX + boxW + gap, y, "Número do Incidente", incidente);
  campo(startX + (boxW * 2) + (gap * 2), y, "Nome do Field", field);

  y += 25;

  /* ===============================
     TABELA
  ============================== */
  doc.setFontSize(14);
  doc.text("Orientações de Evidências Necessárias", 15, y);
  y += 6;

  const colX = [15, 30, 95];
  const colW = [15, 65, 100];
  const rowH = 8;

  const headers = ["Item", "Descrição", "Evidência"];

  doc.setFontSize(10);

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

  /* ===============================
     OBSERVAÇÃO
  ============================== */
  doc.setFontSize(14);
  doc.text("Observação do que foi realizado", 15, y);
  y += 5;

  doc.rect(15, y, 180, 25);

  doc.setFontSize(10);

  const obsSplit = doc.splitTextToSize(observacao || "-", 176);
  doc.text(obsSplit.slice(0, 4), 17, y + 6);

  y += 35;

  doc.setFontSize(14);
  doc.text("Evidências nas próximas páginas", 105, y, {
    align: "center"
  });

  /* ===============================
     PÁGINAS DE EVIDÊNCIAS
     2 POR PÁGINA
  ============================== */
  doc.addPage();

  const evidencias = [...document.querySelectorAll(".evidencia")];

  let margemTop = desenharCabecalho(doc);

  const margemLeft = 15;
  const larguraBox = 180;

  const alturaPagina = doc.internal.pageSize.getHeight();
  const margemRodape = 20;

  const areaAltura =
    (alturaPagina - margemTop - margemRodape) / 2;

  evidencias.forEach((ev, index) => {

    /* nova página a cada 2 evidências */
    if (index % 2 === 0 && index !== 0) {
      doc.addPage();
      margemTop = desenharCabecalho(doc);
    }

    const bloco = index % 2;

    let yBase =
      margemTop + (bloco * areaAltura);

    const texto =
      ev.querySelector(".descricao-input")?.value || "-";

    const img =
      ev.querySelector("img");

    const paddingTop = 6;
    const tituloAltura = 8;
    const descricaoAltura = 22;
    const espacamento = 5;
    const paddingBottom = 5;

    const imagemAltura =
      areaAltura -
      paddingTop -
      tituloAltura -
      descricaoAltura -
      espacamento -
      paddingBottom;

    yBase += paddingTop;

    /* título */
    doc.setFontSize(13);
    doc.text(`Evidência ${index + 1}`, margemLeft, yBase);

    yBase += tituloAltura;

    /* descrição */
    doc.rect(
      margemLeft,
      yBase,
      larguraBox,
      descricaoAltura
    );

    doc.setFontSize(10);

    const textoSplit = doc.splitTextToSize(
      texto,
      larguraBox - 4
    );

    doc.text(
      textoSplit.slice(0, 3),
      margemLeft + 2,
      yBase + 6
    );

    yBase += descricaoAltura + espacamento;

    /* box imagem */
    doc.rect(
      margemLeft,
      yBase,
      larguraBox,
      imagemAltura
    );

    if (img) {

      const dims = ajustarImagem(
        doc,
        img,
        larguraBox,
        imagemAltura
      );

      const xImg =
        margemLeft +
        (larguraBox - dims.w) / 2;

      const yImg =
        yBase +
        (imagemAltura - dims.h) / 2;

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
  atualizarEstadoBotaoFinalizar();

}
