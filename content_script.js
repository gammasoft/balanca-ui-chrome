$.get(chrome.extension.getURL('html/obterPesoModal.html'), function(data) {
    $(data).appendTo('body');
});

$.get(chrome.extension.getURL('html/historicoDePesagens.html'), function(data) {
    $(data).appendTo('body');
});

function formatarPlaca(texto) {
    texto = texto.trim().replace(/-/g, "");
    return texto.substr(0, 3).toUpperCase() + "-" + texto.substr(3, 4);
}

var elementoSelecionado = null,
    baseUrl = 'http://127.0.0.1:7070',
    deveCarregarPeso = false,
    acoes = {};

acoes.registrarEntrada = function() {
    var $modal = $('#obterPesoModal'),
        $placa = $modal.find('#placa');

    $placa.val('');
    $placa.prop('readonly', false);
    $modal.find('input#pesoInicial').val('');
    $modal.find('.row.pesoInicial').addClass('hidden');

    var poolId = setInterval(function() {
        var get = $.getJSON(baseUrl + '/peso');

        get.done(function(peso) {
            if(peso.valor === null) {
                return;
            }

            $modal.find('h1 > span#pesoAtual').html(peso.valor + 'Kg');
            $modal.find('h3#statusAtual').html({
                estavel: 'ESTÁVEL',
                instavel: 'INSTAVEL'
            }[peso.status])
                .removeClass('text-success')
                .removeClass('text-danger')
                .addClass({
                    estavel: 'text-success',
                    instavel: 'text-danger'
                }[peso.status]);
        });
    }, 333);

    $modal.one('show.bs.modal', function() {
        $modal.find('button#registrarPeso').one('click', function(e) {
            var post = $.ajax({
                url: baseUrl + '/tickets',
                type: 'POST',
                data: {
                    placa: $modal.find('#placa').val()
                }
            });

            post.done(function(ticket) {
                chrome.runtime.sendMessage({
                    tipo: 'ticketInserido',
                    dados: ticket
                });

                $modal.modal('hide');
                alert('Peso registrado com sucesso!');
            });

            post.fail(function() {
                alert('Houve um erro registrando o peso!');
            });
        });
    });

    $modal.one('hide.bs.modal', function() {
        $modal.find('button#cancelarPeso').off('click');
        $modal.find('button#registrarPeso').off('click');
    });

    $modal.one('hidden.bs.modal', function() {
        clearInterval(poolId);

        $modal.find('h1 > span#pesoAtual').html('');
        $modal.find('#placa').val('');
    });

    $modal.modal({
        'keyboard': true,
        'show': true
    });
}

acoes.registrarSaida = function registrarSaida(ticket) {
    var $modal = $('#obterPesoModal'),
        $placa = $modal.find('#placa');

    $modal.find('input#pesoInicial').val(ticket.pesoInicial + 'Kg');
    $modal.find('.row.pesoInicial').removeClass('hidden');
    $placa.val(formatarPlaca(ticket.placa));
    $placa.prop('readonly', true);

    var poolId = setInterval(function() {
        var get = $.getJSON(baseUrl + '/peso');

        get.done(function(peso) {
            if(!peso.valor) {
                return;
            }

            $modal.find('h1 > span#pesoAtual').html(peso.valor + 'Kg');
        });
    }, 333);

    $modal.one('show.bs.modal', function() {
        $modal.find('button#registrarPeso').one('click', function(e) {
            var put = $.ajax({
                url: baseUrl + '/tickets/' + ticket.id,
                type: 'PUT'
            });

            put.done(function(ticket) {
                if(elementoSelecionado) {
                    $(elementoSelecionado).val(ticket.pesoLiquido);
                }

                window.open(baseUrl + '/tickets/' + ticket.id + '/pdf');

                chrome.runtime.sendMessage({
                    tipo: 'ticketFinalizado',
                    dados: ticket.id
                });

                $modal.modal('hide');
                alert('Peso registrado com sucesso!');
            });

            put.fail(function() {
                $modal.modal('hide');
                alert('Houve um erro registrando o peso!');
            });
        });
    });

    $modal.one('hide.bs.modal', function() {
        $modal.find('button#cancelarPeso').off('click');
        $modal.find('button#registrarPeso').off('click');
    });

    $modal.one('hidden.bs.modal', function() {
        clearInterval(poolId);

        $modal.find('h1#peso').html('');
        $modal.find('#placa').val('');
    });

    $modal.modal({
        'keyboard': true,
        'show': true
    });
}

acoes.exibirHistoricoDePesagens = function() {
    var $modal = $('#historicoDePesagensModal'),
        $tbody = $modal.find('table#historicoDePesagens tbody');

    $tbody.empty();
    $modal.one('show.bs.modal', function() {
        var get = $.getJSON(baseUrl + '/tickets');

        get.done(function(tickets) {
            tickets.forEach(function(ticket) {
                var $tr = $('<tr />');
                $tr.append($('<td />').html(ticket.id));
                $tr.append($('<td />').html(formatarPlaca(ticket.placa)));
                $tr.append($('<td />').html(moment(ticket.dataDeEntrada).format('DD/MM/YYYY HH:mm')));
                $tr.append($('<td />').html(ticket.pesoInicial + 'Kg'));
                $tr.append($('<td />').html(ticket.dataDeSaida && moment(ticket.dataDeSaida).format('DD/MM/YYYY HH:mm')));
                $tr.append($('<td />').html(ticket.pesoFinal && ticket.pesoFinal + 'Kg'));
                $tr.append($('<td />').append($('<strong />').html(ticket.pesoFinal && (ticket.pesoFinal - ticket.pesoInicial) + 'Kg')));

                if(ticket.pesoFinal) {
                    $tr.append($('<td />').append($('<a href="' + baseUrl + '/tickets/' + ticket.id + '/pdf" target="_blank">EXIBIR TICKET</a>')));
                } else {
                    var $registrarSaida = $('<a href="#">REGISTRAR SAÍDA</a>');
                    $registrarSaida.bind('click', function(e) {
                        e.preventDefault();

                        $modal.modal('hide');
                        $modal.one('hidden.bs.modal', function() {
                            acoes.registrarSaida(ticket);
                        });
                    });

                    $tr.append($('<td />').append($registrarSaida));
                }

                $tbody.append($tr);
            });
        });

        get.fail(function() {
            alert('Houve um erro buscando o histórico de pesagens!');
        });
    });

    $modal.modal({
        'keyboard': true,
        'show': true
    });
}

document.addEventListener("mousedown", function(event) {
    if(event.button !== 2) {
        return;
    }

    elementoSelecionado = event.target;
}, true);

chrome.extension.onRequest.addListener(function(acao, sender, sendResponse) {
    var fn = acoes[acao.tipo];
    fn(acao.dados);
});
