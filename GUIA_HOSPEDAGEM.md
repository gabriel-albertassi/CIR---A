# 🚀 Guia: Como Colocar o CIR-A na Internet

Siga estes passos para transformar seu sistema local em um link acessível de qualquer lugar.

## 1. Preparar o Banco de Dados (Supabase)
O sistema agora usa PostgreSQL (necessário para a nuvem).
1.  Crie uma conta em [Supabase.com](https://supabase.com).
2.  Crie um novo projeto chamado **CIR-A**.
3.  Vá em **Project Settings > Database**.
4.  Copie a **Connection String** (opção URI):
    - Você precisará da senha que criou ao criar o projeto.
    - Exemplo de URL: `postgresql://postgres.[ID]:[SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

## 2. Enviar o Código para o GitHub
Para a Vercel ler seu código, ele precisa estar no GitHub.
1.  Crie um repositório vazio no seu GitHub.
2.  No seu computador (na pasta do projeto), rode:
    ```bash
    git init
    git add .
    git commit -m "Preparando para nuvem"
    git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
    git push -u origin main
    ```

## 3. Hospedar na Vercel
1.  Crie uma conta em [Vercel.com](https://vercel.com).
2.  Clique em **Add New > Project** e importe o seu repositório do GitHub.
3.  **IMPORTANTE:** Clique em **Environment Variables** e adicione as seguintes:
    - `DATABASE_URL`: (A URL longa que você copiou do Supabase)
    - `DIRECT_URL`: (A mesma URL, mas mude a porta de `6543` para `5432` e remova o `?pgbouncer=true` no final)
4.  Clique em **Deploy**.

## 4. Popular os Dados (Seed)
Como o banco na nuvem estará vazio, você precisará preenchê-lo uma única vez:
1.  No seu computador (já com o `.env` configurado com a URL do Supabase), rode:
    ```bash
    npx prisma db seed
    ```
    Isso criará os hospitais e pacientes de exemplo que eu preparei.

---

### ✅ Pronto! 
Agora você tem um link oficial (ex: `cira-regula.vercel.app`) para abrir em qualquer computador na Regulação sem precisar ligar o terminal.
