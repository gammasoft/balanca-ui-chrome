function salvar() {
    chrome.storage.sync.set({
        ipDaBalanca: document.getElementById('ipDaBalanca').value
    }, function() {
        var status = document.getElementById('status');
        status.textContent = 'Configurações salvas!';

        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });
}

function restaurar() {
    chrome.storage.sync.get(function(opcoes) {
        document.getElementById('ipDaBalanca').value = opcoes.ipDaBalanca || '';
    });
}

document.addEventListener('DOMContentLoaded', restaurar);
document.getElementById('salvar').addEventListener('click', salvar);
