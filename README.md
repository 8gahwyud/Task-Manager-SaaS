# TaskFlow — Task Manager MVP

Минималистичный task-менеджер для команд. Полноценный SaaS с Kanban-доской, приоритетами и аналитикой.

![TaskFlow](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.10-2D3748?style=flat-square&logo=prisma)

## ✨ Возможности

- 🔐 **Аутентификация** — регистрация, вход, защита роутов
- 📁 **Проекты** — создание, управление, приглашение участников
- ✅ **Задачи** — приоритеты, дедлайны, исполнители
- 📊 **Kanban-доска** — drag-and-drop между колонками
- 📈 **Аналитика** — статистика по статусам и приоритетам

## 🚀 Быстрый старт

### Требования

- Node.js 18+
- npm или yarn

### Установка

```bash
# Клонируйте репозиторий
cd taskflow

# Установите зависимости
npm install

# Создайте файл .env
cat > .env << EOF
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-super-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
EOF

# Инициализируйте базу данных
npx prisma db push

# Запустите dev-сервер
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

## 🛠 Технологии

| Слой | Технология |
|------|------------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Backend | Next.js API Routes, NextAuth.js |
| База данных | SQLite (dev), Prisma ORM |
| Drag & Drop | @dnd-kit |
| Графики | Recharts |

## 📁 Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Страницы авторизации
│   ├── (dashboard)/       # Защищённые страницы
│   └── api/               # API endpoints
├── components/            # React компоненты
├── lib/                   # Утилиты (prisma, auth)
└── types/                 # TypeScript типы

prisma/
├── schema.prisma          # Схема базы данных
└── dev.db                 # SQLite база (создаётся автоматически)
```

## 📝 API Endpoints

### Аутентификация
- `POST /api/auth/register` — Регистрация
- `POST /api/auth/[...nextauth]` — NextAuth.js

### Проекты
- `GET /api/projects` — Список проектов
- `POST /api/projects` — Создать проект
- `GET /api/projects/[id]` — Получить проект
- `PATCH /api/projects/[id]` — Обновить проект
- `DELETE /api/projects/[id]` — Удалить проект
- `POST /api/projects/[id]/invite` — Пригласить участника

### Задачи
- `POST /api/tasks` — Создать задачу
- `GET /api/tasks/[id]` — Получить задачу
- `PATCH /api/tasks/[id]` — Обновить задачу
- `DELETE /api/tasks/[id]` — Удалить задачу

## 🗄 Модели данных

```prisma
model User {
  id            String   @id
  email         String   @unique
  name          String
  password      String   # bcrypt hash
}

model Project {
  id          String   @id
  name        String
  description String?
  ownerId     String
}

model Task {
  id          String   @id
  title       String
  description String?
  status      String   # todo, in_progress, review, done
  priority    String   # low, medium, high, urgent
  deadline    DateTime?
  position    Int      # для сортировки
}
```

## 🔒 Переменные окружения

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | URL базы данных |
| `NEXTAUTH_SECRET` | Секрет для JWT |
| `NEXTAUTH_URL` | URL приложения |

## 📦 Скрипты

```bash
npm run dev       # Запуск dev-сервера
npm run build     # Сборка production
npm run start     # Запуск production
npm run db:push   # Применить схему к БД
npm run db:studio # Открыть Prisma Studio
```

## 🚢 Деплой на production

### PostgreSQL

Замените в `.env`:
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```

Обновите `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Vercel

```bash
npm install -g vercel
vercel
```

## 📄 Лицензия

MIT

---

Создано за выходные ✨

