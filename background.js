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

chrome.runtime.onMessage.addListener(function(acao, sender, sendResponse) {
    var fn = acoes[acao.tipo];
    fn(acao, sender, sendResponse);
});

