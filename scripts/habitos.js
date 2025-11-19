const DataAPI = 'https://gsqorbummwauzdfqicdp.supabase.co';
const Apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcW9yYnVtbXdhdXpkZnFpY2RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzA2MzcsImV4cCI6MjA3ODAwNjYzN30.ECOQjNW6ueu1bsJq6_5UlRrxra3KHehMSZ2kpnCJzgE';

const supabase = window.supabase.createClient(DataAPI, Apikey);
let diasSelecionados = [];

document.querySelectorAll('.dia').forEach(botao => {
    botao.addEventListener('click', () => {

        document.querySelectorAll('.dia').forEach(d => d.classList.remove('ativo'));

        botao.classList.add('ativo');

        diasSelecionados = [botao.id];

        console.log("Dia selecionado:", diasSelecionados[0]);
    });
});
async function salvarHabitos(event) {
    event.preventDefault();

    const nome = document.getElementById("habitName").value.trim()
    const categoria = document.getElementById("habitCategoria").value.trim()
    const descricao = document.getElementById("habitDescricao").value.trim()
    const meta = document.getElementById("habitMeta").value.trim()
    const horario = document.getElementById("habitHorario").value.trim()
    const dias = diasSelecionados.join(',');

    if (!nome || !categoria || !descricao || !meta || !horario || diasSelecionados.length < 1) {
        alert("Preencha todos os campos obrigatórios!");
        return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    const hojeISO = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
        .from("habitos")
        .insert([{
            nome, categoria, descricao, meta_diaria: meta, horario_ideal: horario, dias_semanas: dias, usuario_id: user.id
        }])
        .select();

    if (error) {
        console.error("Erro ao salvar hábito:", error);
        alert("Erro ao salvar hábito!");
        return;
    }


    const hojeSemana = new Date().getDay();
    const diasSemana = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sabado"];
    const diaAtual = diasSemana[hojeSemana];

    const { data: todosHabitos } = await supabase
        .from("habitos")
        .select("id, dias_semanas, streak")
        .eq("usuario_id", user.id);

    const habitosHoje = (todosHabitos ?? []).filter(h =>
        h.dias_semanas.split(",").map(d => d.trim().toLowerCase()).includes(diaAtual)
    );

    const { data: concluidosHoje } = await supabase
        .from("historico_habitos")
        .select("habito_id")
        .eq("usuario_id", user.id)
        .eq("data", hojeISO)
        .eq("realizado", true);

    if ((concluidosHoje?.length ?? 0) !== habitosHoje.length) {
        for (const h of habitosHoje) {
            await supabase
                .from("habitos")
                .update({ streak: 0 })
                .eq("id", h.id);
        }
    }


    const { error: historicoHabitosError } = await supabase
        .from("historico_habitos")
        .insert([{
            habito_id: data[0].id, data: hojeISO, realizado: false, usuario_id: user.id
        }]);

    if (historicoHabitosError) {
        console.error("Erro ao criar histórico:", historicoHabitosError);
        alert("Erro ao salvar hábito!");
        return;
    }

    alert("Hábito salvo com sucesso!");
    document.querySelector("form").reset();
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

function voltar() {
    window.location.href = "frequencia.html";
}

document.addEventListener('DOMContentLoaded', mostrarPerfil)