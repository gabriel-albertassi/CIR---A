# DOCUMENTAÇÃO TÉCNICA: Sistema CIR-A

Este documento detalha a infraestrutura e as tecnologias utilizadas no desenvolvimento da **Central Inteligente de Regulação Automatizada (CIR-A)**, servindo como base para a apresentação técnica à equipe de T.I.

---

## 1. Arquitetura do Sistema

O sistema foi concebido sob uma arquitetura **Serverless** e **Modern Full-Stack**, focando em alta performance (Core Web Vitals), segurança de dados de saúde e escalabilidade imediata.

### Stack Principal:
- **Framework**: [Next.js](https://nextjs.org/) (Versão estável mais recente com App Router).
- **Linguagem**: TypeScript (Garantindo tipagem estática e redução de bugs em tempo de execução).
- **ORM**: [Prisma](https://www.prisma.io/) (Interface tipo-segura para manipulação do banco de dados).
- **Estilização**: Vanilla CSS com variáveis dinâmicas (Máxima performance e total controle sobre o design customizado).

---

## 2. Infraestrutura: Vercel

O **Vercel** foi escolhido como a plataforma de hospedagem e CI/CD (Integração e Entrega Contínua).

### Vantagens para o Município:
- **Deploy Atômico**: Cada alteração no código passa por um ambiente de "Preview" antes de ir para a produção, garantindo que erros não cheguem ao usuário final.
- **Edge Network**: O sistema é servido a partir de servidores globais, mas otimizado para a latência mínima em nossa região.
- **Serverless Functions**: A lógica de backend (como os cálculos da Cirila) roda em funções isoladas que escalam automaticamente conforme a demanda, sem necessidade de gerenciar servidores ou máquinas virtuais.
- **SSL Automático**: Segurança garantida com certificados HTTPS renovados automaticamente.

---

## 3. Backend e Dados: Supabase

O **Supabase** atua como nossa plataforma de backend-as-a-service, fornecendo uma infraestrutura robusta baseada em padrões abertos.

### Componentes Utilizados:
- **Banco de Dados (PostgreSQL)**: Um banco de dados relacional de nível empresarial, garantindo a integridade dos dados dos pacientes e logs de regulação.
- **Autenticação (Supabase Auth)**: Gerenciamento seguro de usuários com suporte a confirmação por e-mail e tokens JWT.
- **Segurança (Row Level Security - RLS)**: Implementamos políticas de segurança diretamente no banco de dados, onde cada linha de dado só pode ser acessada ou modificada por usuários com as devidas permissões (Cargo: Admin, Regulador, etc).

---

## 4. Inteligência Artificial: Cirila

A **Cirila** é integrada ao sistema através de Server Actions do Next.js, processando linguagem natural para:
1.  **Análise de Dados**: Consultar rapidamente o PostgreSQL para informar o status da fila.
2.  **Automação**: Disparar rotinas de cobrança aos NIRs e alertas de Vaga Zero.
3.  **Interface Humana**: Traduzir dados complexos em insights acionáveis para os reguladores.

---

## 5. Manutenibilidade e Futuro

O sistema foi construído seguindo os princípios de **Clean Code**. A separação entre a camada de apresentação (React components na Vercel) e a camada de dados (PostgreSQL no Supabase) facilita futuras integrações com outros sistemas da Secretaria de Saúde (SMSVR) via APIs REST.

---
**Responsável Técnico**: Gabriel Albertassi
**Data**: 17 de Abril de 2026
**Versão**: 1.5 Premium Final
