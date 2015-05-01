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
        'page',
        'editable'
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
        'page',
        'editable'
    ],
    onclick: function(info, tab) {
        chrome.tabs.sendRequest(tab.id, {
            tipo: 'exibirHistoricoDePesagens'
        });
    }
});

chrome.contextMenus.create({
    id: 'patio',
    parentId: 'raiz',
    title: 'Pátio',
    contexts: [
        'page',
        'editable'
    ],
    onclick: function(info, tab) {
        if(Object.keys(patioIds).length === 0) {
            alert('O pátio está vazio neste momento!');
        }
    }
});

chrome.contextMenus.create({
    id: 'limparPatio',
    parentId: 'raiz',
    title: 'Limpar',
    contexts: [
        'page',
        'editable'
    ],
    onclick: function(info, tab) {
        if(confirm('Deseja realmente limpar as entradas?')) {
            for(var id in patioIds){
                if(patioIds.hasOwnProperty(id)) {
                    chrome.contextMenus.remove(id);
                    delete patioIds[id];
                }
            }
        }
    }
});

var acoes = {},
    patioIds = {};

acoes.ticketInserido = function adicionarNovoMenuDeContexto(request, sender, sendResponse) {
    var ticket = request.dados,
        id = 'ticket' + ticket.id;

    patioIds[id] = true;

    chrome.contextMenus.create({
        id: id,
        parentId: 'patio',
        title: ticket.motorista + ' - ' + formatarPlaca(ticket.placa) + ' - ' + ticket.pesoInicial + ' Kg',
        contexts: [
            'editable',
            'page'
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
    var ticketId = request.dados,
        id = 'ticket' + ticketId;

    delete patioIds[id];
    chrome.contextMenus.remove(id);
}

chrome.runtime.onMessage.addListener(function(acao, sender, sendResponse) {
    var fn = acoes[acao.tipo];
    fn(acao, sender, sendResponse);
});

