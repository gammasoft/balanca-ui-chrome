chrome.contextMenus.create({
    id: 'raiz',
    title: 'γBalança',
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
        chrome.tabs.sendRequest(tab.id, 'obterPeso');
    }
});

// chrome.contextMenus.create({
//     id: 'registrarSaida',
//     parentId: 'raiz',
//     title: 'JHK-2343 (5.410 Kg)',
//     contexts: [
//         'editable'
//     ],
//     onclick: function(info, tab) {
//         chrome.tabs.sendRequest(tab.id, 'Hello World!');
//     }
// });

