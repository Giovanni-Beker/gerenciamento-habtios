const DataAPI = 'https://gsqorbummwauzdfqicdp.supabase.co';
const Apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcW9yYnVtbXdhdXpkZnFpY2RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzA2MzcsImV4cCI6MjA3ODAwNjYzN30.ECOQjNW6ueu1bsJq6_5UlRrxra3KHehMSZ2kpnCJzgE';

const supabase = window.supabase.createClient(DataAPI, Apikey)

const telaLogin = document.getElementById('login');
const telaCadastro = document.getElementById('cadastro');
const createName = document.getElementById('create-name');
const createEmail = document.getElementById('create-email');
const createPassword = document.getElementById('create-password');

const loginEmail = document.getElementById('E-mail');
const loginPassword = document.getElementById('password');

let mostrandoLogin = false;
function alternarTela() {
    mostrandoLogin = !mostrandoLogin;

    if (mostrandoLogin) {
        telaLogin.classList.replace("d-none", "d-flex");
        telaCadastro.classList.replace("d-flex", "d-none");
    } else {
        telaLogin.classList.replace("d-flex", "d-none");
        telaCadastro.classList.replace("d-none", "d-flex");
    }
}


async function loginUser() {
    try {

        event.preventDefault();

        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();

        if (!email || !password) {
            alert("Preencha e-mail e senha!");
            return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (!!error) {
            alert(error.message);
            return;
        }

        localStorage.setItem("userData", JSON.stringify(data.user));

        console.log("Usuário autenticado:", data.user);
        window.location.href = "frequencia.html";
    }

    catch {
        console.log("Erro!");
    }
}

async function createUserOnSupabase() {
    try {
        const email = document.getElementById("create-email").value.trim()
        const password = document.getElementById("create-password").value.trim()
        const name = document.getElementById("create-name").value.trim()

        if (!email || !password || !name) {
            console.warn('Preencha todos os campos!')
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name
                }
            }
        })

        if (!!error) return;

        alternarTela()

    } catch {
        console.log("Erro!");
    }
}
