const DataAPI = 'https://gsqorbummwauzdfqicdp.supabase.co';
const Apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcW9yYnVtbXdhdXpkZnFpY2RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzA2MzcsImV4cCI6MjA3ODAwNjYzN30.ECOQjNW6ueu1bsJq6_5UlRrxra3KHehMSZ2kpnCJzgE';

const supabase = window.supabase.createClient(DataAPI, Apikey);

const user = JSON.parse(localStorage.getItem('userData'));

async function carregarDados() {
    const hojeISO = new Date().toISOString().split("T")[0];

    const { data: habitos, error } = await supabase
        .from('habitos')
        .select()
        .eq("usuario_id", user.id);

    const { data: historicoHoje } = await supabase
        .from("historico_habitos")
        .select("habito_id")
        .eq("usuario_id", user.id)
        .eq("data", hojeISO)
        .eq("realizado", true);

    const idsConcluidosHoje = new Set(historicoHoje.map(h => h.habito_id));

    const grid = document.getElementById('dadosGrid');
    grid.innerHTML = '';

    habitos.forEach(item => {
        const iconClass = idsConcluidosHoje.has(item.id) ? 'bi-check-circle' : 'bi-circle';

        const linha = document.createElement('div');
        linha.classList.add('row', 'text-center', 'py-3', 'border-bottom');
        grid.innerHTML += `
        <td>${item.nome}</td>
        <td>${item.categoria}</td>
        <td>${item.descricao}</td>
        <td>${item.meta_diaria}</td>
        <td>${item.horario_ideal}</td>
        <td>${item.dias_semanas}</td>
        <td>
            <button class="btn-lixeira" onclick="excluir(${item.id})">
                <i class="bi bi-trash3"></i>
            </button>

            <button class="btn-editar" onclick="editar(${item.id})">
                <i class="bi bi-pencil"></i>
            </button>

            <button class="btn-marcar">
                <i id="icon-${item.id}" class="bi ${iconClass}" onclick="marcarRealizado(${item.id})"></i>
            </button>
        </td>
        `;
    });
    atualizarStreakTopo();
    console.log(habitos)
}
carregarDados();

async function excluir(id) {
    const confirmacao = confirm("Tem certeza que deseja excluir este hábito?");
    if (!confirmacao) return;

    const { error } = await supabase
        .from("habitos")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Erro ao excluir!");
        console.error(error);
        return;
    }

    alert("Hábito excluído com sucesso!");
    carregarDados();
}

async function editar(id) {
    try {
        const { data: habito, error } = await supabase
            .from('habitos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error(error);
            alert('Erro ao buscar hábito!');
            return;
        }

        document.getElementById('idHabito').value = habito.id;
        document.getElementById('nomeHabito').value = habito.nome;
        document.getElementById('categoriaHabito').value = habito.categoria;
        document.getElementById('descricaoHabito').value = habito.descricao;
        document.getElementById('metaHabito').value = habito.meta_diaria;
        document.getElementById('horarioHabito').value = habito.horario_ideal;
        document.getElementById('diasHabito').value = habito.dias_semanas;

        const modal = new bootstrap.Modal(document.getElementById('editarModal'));
        modal.show();

    } catch (err) {
        console.error(err);
        alert('Erro inesperado ao editar hábito.');
    }
}

async function marcarRealizado(id) {
    try {
        const hojeISO = new Date().toISOString().split("T")[0];

        const diaAtual =
            ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sabado"][new Date().getDay()];

        const { data: habito } = await supabase
            .from("habitos")
            .select("id, dias_semanas")
            .eq("id", id)
            .single();

        if (!habito.dias_semanas.split(",").map(d => d.trim().toLowerCase()).includes(diaAtual)) {
            alert(`Este hábito só pode ser concluído em: ${habito.dias_semanas}. Hoje é ${diaAtual}, então não é permitido marcar.`);
            return;
        }

        const icon = document.getElementById("icon-" + id);
        const marcou = !icon.classList.contains("bi-check-circle");

        const { data: historicoHoje } = await supabase
            .from("historico_habitos")
            .select("*")
            .eq("habito_id", id)
            .eq("usuario_id", user.id)
            .eq("data", hojeISO)
            .maybeSingle();

        if (historicoHoje) {
            await supabase
                .from("historico_habitos")
                .update({
                    realizado: marcou,
                    atualizado_em: new Date().toISOString(),
                })
                .eq("id", historicoHoje.id);
        } else {
            await supabase
                .from("historico_habitos")
                .insert({ habito_id: id, usuario_id: user.id, data: hojeISO, realizado: marcou, });
        }

        if (marcou) {
            icon.classList.remove("bi-circle");
            icon.classList.add("bi-check-circle");
        } else {
            icon.classList.remove("bi-check-circle");
            icon.classList.add("bi-circle");
        }

        atualizarStreakTopo();

    } catch (err) {
        console.error("Erro geral:", err);
    }
}
async function atualizarStreakTopo() {
    const { data: habitos, error: erroHabitos } = await supabase
        .from("habitos")
        .select("*")
        .eq("usuario_id", user.id);

    if (erroHabitos) {
        console.error("Erro ao buscar hábitos:", erroHabitos);
        return;
    }

    if (habitos.length === 0) {
        document.getElementById("streakTotal").textContent = 0;
        document.getElementById("pontosTotal").textContent = 0;
        return;
    }

    const { data: historico, error: erroHistorico } = await supabase
        .from("historico_habitos")
        .select("habito_id, data, realizado")
        .eq("usuario_id", user.id)
        .order("data", { ascending: false });

    if (erroHistorico) {
        console.error("Erro ao buscar histórico:", erroHistorico);
        return;
    }

    const normalizarDias = (dias = "") =>
        dias
            .split(",")
            .map(d => d.trim().toLowerCase())
            .filter(Boolean);

    const diaDaSemana = data => {
        const dias = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sabado"];
        return dias[data.getDay()];
    };

    const historicoFiltrado = (historico ?? []).filter(h => h.habito_id !== null && h.realizado);

    const mapaDias = {};
    historicoFiltrado.forEach(item => {
        const diaISO = item.data.split("T")[0];

        if (!mapaDias[diaISO]) mapaDias[diaISO] = [];
        if (!mapaDias[diaISO].includes(item.habito_id)) {
            mapaDias[diaISO].push(item.habito_id);
        }
    });

    let streak = 0;
    let diaAtual = new Date();

    while (true) {
        const diaISO = diaAtual.toISOString().split("T")[0];
        const diaSemanaAtual = diaDaSemana(diaAtual);

        const habitosDoDia = habitos.filter(h => normalizarDias(h.dias_semanas).includes(diaSemanaAtual));

        if (habitosDoDia.length === 0) {
            diaAtual.setDate(diaAtual.getDate() - 1);
            continue;
        }

        const idsConcluidosNoDia = mapaDias[diaISO] ?? [];
        const concluiuTodos = habitosDoDia.every(h => idsConcluidosNoDia.includes(h.id));

        if (!concluiuTodos) break;

        streak++;
        diaAtual.setDate(diaAtual.getDate() - 1);
    }

    const calcularPontos = () => {
        let pontos = 0;

        Object.entries(mapaDias).forEach(([diaISO, idsConcluidos]) => {
            const dataDia = new Date(`${diaISO}T00:00:00`);
            const diaSemana = diaDaSemana(dataDia);

            const habitosDoDia = habitos.filter(h => normalizarDias(h.dias_semanas).includes(diaSemana));

            if (habitosDoDia.length === 0) return;

            const concluiuTodos = habitosDoDia.every(h => idsConcluidos.includes(h.id));

            if (concluiuTodos) pontos += 10;
        });

        return pontos;
    };

    document.getElementById("streakTotal").textContent = streak;
    document.getElementById("pontosTotal").textContent = calcularPontos();
}



const inputPesquisa = document.querySelector('.input-pesquisa');

inputPesquisa.addEventListener('input', () => {
    const filtro = inputPesquisa.value.toLowerCase().trim();
    const linhas = document.querySelectorAll('#dadosGrid tr');

    linhas.forEach(linha => {
        const textoLinha = linha.innerText.toLowerCase();
        linha.style.display = textoLinha.includes(filtro) ? '' : 'none';
    });
});

async function salvarEdicao(event) {
    event.preventDefault();

    const id = document.getElementById("idHabito").value;
    const nome = document.getElementById("nomeHabito").value.trim();
    const categoria = document.getElementById("categoriaHabito").value.trim();
    const descricao = document.getElementById("descricaoHabito").value.trim();
    const meta = document.getElementById("metaHabito").value.trim();
    const horario = document.getElementById("horarioHabito").value.trim();

    const diasBtns = document.querySelectorAll("#diasHabito .dia");
    const diasSelecionados = [];

    diasBtns.forEach(btn => {
        if (btn.classList.contains("ativo")) {
            diasSelecionados.push(btn.dataset.dia);
        }
    });

    const dias = diasSelecionados.join(",");

    const { error } = await supabase
        .from("habitos")
        .update({ nome, categoria, descricao, meta_diaria: meta, horario_ideal: horario, dias_semanas: dias })
        .eq("id", id);

    if (error) {
        console.error("Erro ao atualizar:", error);
        alert("Erro ao salvar alterações!");
        return;
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById("editarModal"));
    modal.hide();

    alert("Hábito atualizado com sucesso!");

    carregarDados();
}

async function sair() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("Error ao sair: ", error.message);
        alert("Error ao sair. Tente Novamente.");
    } else {
        window.location.href = "login.html";
    }

}

function mostrarPerfil() {
    const user = JSON.parse(localStorage.getItem('userData'));
    const perfil = document.getElementById("perfil");

    if (user && user.email) {
        const primeiraLetra = user.email.trim().charAt(0).toUpperCase();
        perfil.textContent = primeiraLetra;
    } else {
        perfil.textContent = "";
    }
}

function novoHabito(){
    window.location.href = "habitos.html";

}

window.addEventListener('DOMContentLoaded', () => {
    mostrarPerfil();
});