var obterPesoModalHtml,
    historicoDePesagensHtml;

$.get(chrome.extension.getURL('html/obterPesoModal.html'), function(data) {
    obterPesoModalHtml = data;
});

$.get(chrome.extension.getURL('html/historicoDePesagens.html'), function(data) {
    historicoDePesagensHtml = data;
});

function formatarPlaca(texto) {
    texto = texto.trim().replace(/-/g, "");
    return texto.substr(0, 3).toUpperCase() + "-" + texto.substr(3, 4);
}

var elementoSelecionado = null,
    baseUrl,
    deveCarregarPeso = false,
    acoes = {};

chrome.storage.local.get(function(opcoes) {
    var ipDaBalanca = opcoes.ipDaBalanca;

    if(!ipDaBalanca) {
        alert([
            'Você precisa configurar o ip da balança rodoviária',
            'para começar a usar a integração'
        ].join(' '));
    }

    baseUrl = 'http://' + ipDaBalanca;
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
    if(namespace !== 'local') {
        return;
    }

    for (key in changes) {
        if(key === 'ipDaBalanca') {
            var storageChange = changes[key];
            baseUrl = 'http://' + storageChange.newValue;
        }
    }
});

var placaRegExp = /^([a-zA-Z]|[a-zA-Z][a-zA-Z]|[a-zA-Z][a-zA-Z][a-zA-Z]|[a-zA-Z][a-zA-Z][a-zA-Z]\d|[a-zA-Z][a-zA-Z][a-zA-Z]\d\d|[a-zA-Z][a-zA-Z][a-zA-Z]\d\d\d|[a-zA-Z][a-zA-Z][a-zA-Z]\d\d\d\d)$/;

function paraMaiusculas(e) {
    var $target = $(e.target),
        jaDigitado = $target.val();

    $target.val(jaDigitado.toUpperCase());
}

acoes.registrarEntrada = function() {
    var $modal = $(obterPesoModalHtml),
        $motorista = $modal.find('#motorista'),
        $placa = $modal.find('#placa'),
        $cliente = $modal.find('#cliente'),
        $produto = $modal.find('#produto');

    $placa.val('');
    $placa.prop('readonly', false);
    $motorista.val('');
    $motorista.prop('readonly', false);
    $cliente.val('');
    $cliente.prop('readonly', false);
    $produto.val('');
    $produto.prop('readonly', false);
    $modal.find('input#pesoInicial').val('');
    $modal.find('.row.pesoInicial').addClass('hidden');

    $placa.bind('keypress', function(e) {
        var jaDigitado = $(e.target).val(),
            letra = String.fromCharCode(e.which);

        if(!placaRegExp.test(jaDigitado + letra)) {
            e.preventDefault();
        }
    });

    $placa.bind('blur', paraMaiusculas);
    $motorista.bind('blur', paraMaiusculas);
    $cliente.bind('blur', paraMaiusculas);
    $produto.bind('blur', paraMaiusculas);

    var poolId = setInterval(function() {
        var get = $.getJSON(baseUrl + '/peso');

        get.done(function(peso) {
            if(peso === null || peso.valor === null) {
                $modal.find('h1 > span#pesoAtual').html('Carregando...');
                $modal.find('h3#statusAtual').html('');
                return;
            }

            $modal.find('h1 > span#pesoAtual').html(peso.valor + ' Kg');
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

    $modal.one('shown.bs.modal', function() {
        $motorista.focus();
    });

    $modal.one('show.bs.modal', function() {
        $modal.find('button#registrarPeso').on('click', function(e) {
            var post = $.ajax({
                url: baseUrl + '/tickets',
                type: 'POST',
                data: {
                    motorista: $modal.find('input#motorista').val(),
                    placa: $modal.find('input#placa').val(),
                    cliente: $modal.find('input#cliente').val(),
                    produto: $modal.find('input#produto').val()
                }
            });

            post.done(function(ticket) {
                // chrome.runtime.sendMessage({
                //     tipo: 'ticketInserido',
                //     dados: ticket
                // });

                $modal.modal('hide');
            });

            post.fail(function(err) {
                alert(err.responseJSON.message);
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
    var $modal = $(obterPesoModalHtml),
        $motorista = $modal.find('#motorista'),
        $placa = $modal.find('#placa'),
        $cliente = $modal.find('#cliente'),
        $produto = $modal.find('#produto');

    $modal.find('input#pesoInicial').val(ticket.pesoInicial + ' Kg');
    $modal.find('.row.pesoInicial').removeClass('hidden');
    $placa.val(formatarPlaca(ticket.placa));
    $placa.prop('readonly', true);
    $cliente.val(ticket.cliente || '');
    $cliente.prop('readonly', true);
    $produto.val(ticket.produto || '');
    $produto.prop('readonly', true);
    $motorista.val(ticket.motorista);
    $motorista.prop('readonly', true);

    var poolId = setInterval(function() {
        var get = $.getJSON(baseUrl + '/peso');

        get.done(function(peso) {
            if(peso === null || peso.valor === null) {
                $modal.find('h1 > span#pesoAtual').html('Carregando...');
                $modal.find('h3#statusAtual').html('');
                return;
            }

            $modal.find('h1 > span#pesoAtual').html(peso.valor + ' Kg');
            $modal.find('input#pesoLiquido').val((peso.valor - ticket.pesoInicial) + ' Kg');
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
        $modal.find('button#registrarPeso').on('click', function(e) {
            var put = $.ajax({
                url: baseUrl + '/tickets/' + ticket.id,
                type: 'PUT'
            });

            put.done(function(ticket) {
                if(elementoSelecionado) {
                    // Código específico do GammaERP V

                    // var pesoEmToneladas = (ticket.pesoLiquido / 1000).toString().replace('.', ','),
                    //     $motorista = $('input#motorista'),
                    //     $modalidadeDoFrete = $('select#modalidadeDoFrete');

                    // $modalidadeDoFrete.val('porContaDoDestinatario');
                    // $motorista.val(ticket.motorista);
                    // $(elementoSelecionado).val(pesoEmToneladas);

                    // var changeEvent = new Event('change', {
                    //     'bubbles': true,
                    //     'cancelable': false
                    // });

                    // elementoSelecionado && elementoSelecionado.dispatchEvent(changeEvent);
                    // $modalidadeDoFrete.get(0).dispatchEvent(changeEvent);
                    // $motorista.get(0).dispatchEvent(changeEvent);

                    // Código específico do GammaERP ^
                }

                window.open(baseUrl + '/tickets/' + ticket.id + '/pdf');

                // chrome.runtime.sendMessage({
                //     tipo: 'ticketFinalizado',
                //     dados: ticket.id
                // });

                $modal.modal('hide');
            });

            put.fail(function(err) {
                alert(err.responseJSON.message);
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
    var $modal = $(historicoDePesagensHtml),
        $tbody = $modal.find('table#historicoDePesagens tbody');

    $tbody.empty();
    $modal.one('show.bs.modal', function() {
        var get = $.getJSON(baseUrl + '/tickets');

        get.done(function(tickets) {
            tickets.forEach(function(ticket) {
                var $tr = $('<tr />');

                if(ticket.impresso) {
                    $tr.addClass('success');
                }

                if(!ticket.pesoFinal) {
                    $tr.addClass('danger');
                }

                $tr.append($('<td />').html(ticket.id));
                $tr.append($('<td />').html(formatarPlaca(ticket.placa)));
                $tr.append($('<td />').html(ticket.motorista));
                $tr.append($('<td />').html(moment(ticket.dataDeEntrada).format('HH:mm')));
                $tr.append($('<td />').html(ticket.pesoInicial + ' Kg'));
                $tr.append($('<td />').html(ticket.dataDeSaida && moment(ticket.dataDeSaida).format('HH:mm')));
                $tr.append($('<td />').html(ticket.pesoFinal && ticket.pesoFinal + ' Kg'));
                $tr.append($('<td />').append($('<strong />').html(ticket.pesoFinal && (ticket.pesoFinal - ticket.pesoInicial) + ' Kg')));

                if(ticket.pesoFinal) {
                    $tr.append($('<td />').append($('<a href="' + baseUrl + '/tickets/' + ticket.id + '/pdf" target="_blank">TICKET</a>')));
                } else {
                    var $registrarSaida = $('<a href="#">SAÍDA</a>');
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

        get.fail(function(err) {
            alert(err.responseJSON.message);
        });
    });

    $modal.modal({
        'keyboard': true,
        'show': true
    });
}

// document.addEventListener('mousedown', function(event) {
//     if(event.button !== 2) {
//         return;
//     }

//     elementoSelecionado = event.target;
// }, true);

chrome.extension.onRequest.addListener(function(acao, sender, sendResponse) {
    var fn = acoes[acao.tipo];
    fn(acao.dados);
});
