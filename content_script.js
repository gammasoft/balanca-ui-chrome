$.get(chrome.extension.getURL('html/obterPesoModal.html'), function(data) {
    $(data).appendTo('body');
});

var clickedEl = null,
    baseUrl = '192.168.1.100',
    deveCarregarPeso = false,
    requests = {};

function carregarPeso(callback) {
    $.getJSON(baseUrl + '/peso').complete(callback);
}

requests.obterPeso = function() {
    var $modal = $('#obterPesoModal');

    // Inserir aqui um loop para buscar o peso a cada 333ms OU melhor ainda, usar socket.io
    // para receber os novos pesos por push
    // $modal.find('h1#peso').html(peso.valorFormatado);

    $modal.on('show', function() {
        // $modal.find('button#cancelarPeso').on('click', function(e) {
        //     $modal.modal('hide');
        // });

        $modal.find('button#registrarPeso').on('click', function(e) {
            var post = $.ajax({
                url: baseUrl + '/ticket',
                data: {
                    placa: $modal.find('#placa').val()
                }
            });

            post.done(function() {
                alert('Peso registrado com sucesso!');
                $modal.modal('hide');
            });
        });
    });

    $modal.on('hide', function() {
        $modal.find('button#cancelarPeso').off('click');
        $modal.find('button#registrarPeso').off('click');
    });

    $modal.on('hidden', function() {
        $modal.find('h1#peso').html('');
        $modal.find('#placa').val('');
    });

    $modal.modal({
        'backdrop': 'static',
        'keyboard': true,
        'show': true
    });
}

document.addEventListener("mousedown", function(event) {
    if(event.button !== 2) {
        return;
    }

    clickedEl = event.target;
}, true);

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    console.log(arguments);

    var fn = requests[request];
    fn();
});
