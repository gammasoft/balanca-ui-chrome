function formatarPlaca(texto) {
    texto = texto.trim().replace(/-/g, "");
    return texto.substr(0, 3).toUpperCase() + "-" + texto.substr(3, 4);
}

chrome.contextMenus.create({
    id: 'raiz',
    title: 'Balança Rodoviária',
    contexts: [
        'page',
        'editable'
    ]
});

chrome.contextMenus.create({
    id: 'registrarEntrada',
    parentId: 'raiz',
    title: 'Registrar Entrada',
    contexts: [
        'page'
    ],
    onclick: function(info, tab) {
        chrome.tabs.sendRequest(tab.id, {
            tipo: 'registrarEntrada'
        });
    }
});

chrome.contextMenus.create({
    id: 'historicoDePesagens',
    parentId: 'raiz',
    title: 'Exibir Histórico',
    contexts: [
        'page'
    ],
    onclick: function(info, tab) {
        chrome.tabs.sendRequest(tab.id, {
            tipo: 'exibirHistoricoDePesagens'
        });
    }
});

var acoes = {};

acoes.ticketInserido = function adicionarNovoMenuDeContexto(request, sender, sendResponse) {
    var ticket = request.dados;

    chrome.contextMenus.create({
        id: 'ticket' + ticket.id,
        parentId: 'raiz',
        title: formatarPlaca(ticket.placa) + ' (' + ticket.pesoInicial + ' Kg)',
        contexts: [
            'editable',
            'page' // TODO: Excluir depois
        ],
        onclick: function(info, tab) {
            chrome.tabs.sendRequest(tab.id, {
                tipo: 'registrarSaida',
                dados: ticket
            });
        }
    });
}

acoes.ticketFinalizado = function(request, sender, sendResponse) {
    var ticketId = request.dados;
    chrome.contextMenus.remove('ticket' + ticketId);
}

chrome.runtime.onMessage.addListener(function(acao, sender, sendResponse) {
    var fn = acoes[acao.tipo];
    fn(acao, sender, sendResponse);
});

