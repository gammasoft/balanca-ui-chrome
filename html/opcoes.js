function salvar() {
    chrome.storage.local.set({
        ipDaBalanca: document.getElementById('ipDaBalanca').value
    }, function() {
        var status = document.getElementById('status');
        status.textContent = 'Ok!';

        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });
}

function restaurar() {
    chrome.storage.local.get(function(opcoes) {
        document.getElementById('ipDaBalanca').value = opcoes.ipDaBalanca || '';
    });
}

document.addEventListener('DOMContentLoaded', restaurar);
document.getElementById('salvar').addEventListener('click', salvar);
