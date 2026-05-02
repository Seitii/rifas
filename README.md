# 🎟️ Rifa Online — Sistema Completo de Rifas

Sistema web completo para gerenciamento e venda de rifas online, com painel administrativo, atualização em tempo real via WebSocket e controle de concorrência no banco de dados.

---

## 🚀 Início Rápido (Docker)

```bash
# 1. Clone ou extraia o projeto
cd rifa-online

# 2. Suba todos os serviços com um único comando
docker-compose up --build

# 3. Aguarde ~60 segundos e acesse:
#    → Site público:  http://localhost:3000
#    → Painel admin:  http://localhost:3000/admin/login
#    → API backend:   http://localhost:3001
```

---

## 🏗️ Arquitetura

```
rifa-online/
├── docker-compose.yml          # Orquestração de produção
├── docker-compose.dev.yml      # Orquestração de desenvolvimento
├── .env                        # Variáveis de ambiente
│
├── backend/                    # API Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/             # Database pool + Socket.IO
│   │   ├── controllers/        # Request handlers
│   │   ├── database/           # Migrations + Seeds
│   │   ├── middlewares/        # Auth, upload, errors
│   │   ├── repositories/       # Acesso ao banco (pg)
│   │   ├── routes/             # Rotas Express
│   │   ├── services/           # Lógica de negócio
│   │   ├── types/              # TypeScript interfaces
│   │   └── index.ts            # Entry point
│   ├── Dockerfile
│   └── Dockerfile.dev
│
└── frontend/                   # React + Vite + TypeScript + Tailwind
    ├── src/
    │   ├── components/
    │   │   ├── layout/         # PublicLayout, AdminLayout, ProtectedRoute
    │   │   └── raffle/         # RaffleCard, NumberGrid, CheckoutModal
    │   ├── hooks/              # useRaffleSocket (Socket.IO)
    │   ├── pages/
    │   │   ├── HomePage.tsx
    │   │   ├── RaffleDetailPage.tsx
    │   │   └── admin/          # Login, Dashboard, Rifas, Compras
    │   ├── services/           # Clientes de API (axios)
    │   ├── store/              # Zustand (auth state)
    │   ├── types/              # TypeScript types
    │   └── utils/              # Formatadores
    ├── Dockerfile
    ├── Dockerfile.dev
    └── nginx.conf
```

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Estado | Zustand |
| Roteamento | React Router v6 |
| Backend | Node.js, Express, TypeScript |
| Banco | PostgreSQL 16 |
| ORM | pg (driver nativo) |
| Auth | JWT + bcryptjs |
| Tempo Real | Socket.IO |
| Upload | Multer |
| Containerização | Docker + Docker Compose |
| Servidor web | Nginx |

---

## 📡 API Endpoints

### Autenticação
```
POST   /api/auth/login           # Login admin
GET    /api/auth/me              # Dados do usuário autenticado (🔒)
PUT    /api/auth/change-password # Alterar senha (🔒)
```

### Rifas
```
GET    /api/raffles              # Listar rifas (público)
GET    /api/raffles/:id          # Detalhes da rifa (público)
GET    /api/raffles/:id/numbers  # Números da rifa (público)
GET    /api/raffles/:id/stats    # Estatísticas da rifa (público)
POST   /api/raffles              # Criar rifa (🔒 admin)
PUT    /api/raffles/:id          # Atualizar rifa (🔒 admin)
DELETE /api/raffles/:id          # Excluir rifa (🔒 admin)
```

### Compras
```
POST   /api/purchases/reserve    # Reservar números (público)
GET    /api/purchases            # Listar compras (🔒 admin)
GET    /api/purchases/:id        # Detalhes da compra (🔒 admin)
DELETE /api/purchases/:id/cancel # Cancelar compra (🔒 admin)
```

---

## 🗃️ Modelagem do Banco

### `users`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID PK | Identificador único |
| name | VARCHAR(255) | Nome do administrador |
| email | VARCHAR(255) UNIQUE | Email de login |
| password_hash | VARCHAR(255) | Senha com bcrypt (custo 12) |
| role | VARCHAR(20) | 'admin' ou 'user' |

### `raffles`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID PK | Identificador único |
| title | VARCHAR(500) | Título da rifa |
| description | TEXT | Descrição completa |
| image_url | VARCHAR(1000) | Caminho da imagem |
| draw_date | TIMESTAMPTZ | Data do sorteio |
| total_numbers | INTEGER | Total de bilhetes |
| price_per_number | DECIMAL(10,2) | Preço por número |
| whatsapp_number | VARCHAR(20) | WhatsApp do organizador |
| status | VARCHAR(20) | 'active', 'closed', 'drawn' |
| winner_number | INTEGER | Número sorteado |
| created_by | UUID FK → users | Admin que criou |

### `raffle_numbers`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID PK | Identificador único |
| raffle_id | UUID FK → raffles | Rifa pertencente |
| number | INTEGER | Número do bilhete |
| status | VARCHAR(20) | 'available', 'reserved', 'purchased' |
| buyer_name | VARCHAR(255) | Nome do comprador |
| buyer_phone | VARCHAR(20) | Telefone do comprador |
| reserved_at | TIMESTAMPTZ | Data de reserva |
| reservation_expires_at | TIMESTAMPTZ | Expiração da reserva |
| purchased_at | TIMESTAMPTZ | Data de compra confirmada |
| purchase_id | UUID FK → purchases | Compra vinculada |

### `purchases`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID PK | Identificador único |
| raffle_id | UUID FK → raffles | Rifa da compra |
| buyer_name | VARCHAR(255) | Nome do comprador |
| buyer_phone | VARCHAR(20) | Telefone do comprador |
| numbers | INTEGER[] | Array de números comprados |
| total_amount | DECIMAL(10,2) | Valor total |
| status | VARCHAR(20) | 'pending', 'confirmed', 'cancelled' |

---

## ⚠️ Controle de Concorrência

O sistema usa **SELECT FOR UPDATE** (lock de linha) para garantir que dois usuários não possam comprar o mesmo número simultaneamente:

```sql
-- 1. Expira reservas antigas
UPDATE raffle_numbers SET status = 'available' WHERE reservation_expires_at < NOW();

-- 2. Bloqueia as linhas (lock exclusivo)
SELECT * FROM raffle_numbers
WHERE raffle_id = $1 AND number = ANY($2::int[])
FOR UPDATE;

-- 3. Verifica se todos estão disponíveis
-- 4. Se sim, reserva atomicamente
UPDATE raffle_numbers SET status = 'reserved', ...
WHERE raffle_id = $1 AND number = ANY($2::int[]);
```

Todo o fluxo ocorre dentro de uma **transaction** PostgreSQL, garantindo atomicidade e isolamento total.

---

## 🔄 Fluxo do Usuário

```
1. Acessa a rifa → vê o grid de números colorido
2. Seleciona números disponíveis (verde)
3. Clica "Finalizar"
4. Preenche nome + telefone
5. Clica "Ir para WhatsApp"
6. → Números são reservados por 15 minutos
7. → Usuário é redirecionado para o WhatsApp com mensagem formatada
8. → Após confirmação do pagamento, admin marca como pago
```

---

## 💻 Desenvolvimento Local (sem Docker)

### Backend
```bash
cd backend
cp .env.example .env
# Edite .env com suas credenciais do PostgreSQL local
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Abre em http://localhost:5173
```

### Com Docker (dev com hot reload)
```bash
docker-compose -f docker-compose.dev.yml up --build
# Backend: http://localhost:3001
# Frontend: http://localhost:5173
```

---

## 🔧 Configuração (.env)

```env
# Banco de dados
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=postgres

# JWT — MUDE EM PRODUÇÃO!
JWT_SECRET=sua_chave_secreta_muito_longa_e_aleatoria
JWT_EXPIRES_IN=7d
```

---

## 🐳 Comandos Docker Úteis

```bash
# Subir em produção
docker-compose up --build -d

# Ver logs
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend

# Parar tudo
docker-compose down

# Parar e remover volumes (APAGA OS DADOS!)
docker-compose down -v

# Rebuild de um serviço específico
docker-compose up --build backend

# Acessar o banco de dados
docker exec -it rifa_postgres psql -U postgres -d rifa_online

# Acessar o shell do backend
docker exec -it rifa_backend sh
```

---

## 📱 Funcionalidades

### Área Pública
- ✅ Listagem de rifas com cards informativos
- ✅ Filtros por status (ativas, encerradas, sorteadas)
- ✅ Página de detalhes com grid de números colorido
- ✅ Seleção múltipla de números
- ✅ Seleção aleatória de números
- ✅ Barra de progresso de vendas
- ✅ Modal de checkout com nome e telefone
- ✅ Redirecionamento automático para WhatsApp com mensagem formatada
- ✅ Atualização em tempo real via Socket.IO

### Painel Admin
- ✅ Login seguro com JWT
- ✅ Dashboard com estatísticas gerais
- ✅ Criação de rifas com upload de imagem
- ✅ Listagem e gerenciamento de rifas
- ✅ Alteração de status da rifa
- ✅ Visualização detalhada de números por status
- ✅ Histórico completo de compras
- ✅ Cancelamento de compras (libera os números)
- ✅ Paginação nas listagens

---

## 🔐 Segurança

- Senhas hasheadas com **bcrypt** (custo 12)
- Autenticação via **JWT** com expiração configurável
- Middleware de proteção de rotas administrativas
- Validação de inputs com **express-validator**
- Proteção contra SQL injection (queries parametrizadas)
- Limite de tamanho de arquivo no upload (5MB)
- CORS configurado por ambiente

---

## 📄 Licença

MIT — Uso livre para projetos pessoais e comerciais.
