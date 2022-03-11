# Hidden Wordle Frontend

The frontend for this project is written using the popular javascript framework [Vue](https://vuejs.org/).

The frontend also utilizes other technologies like:
  - [SCSS](https://sass-lang.com/documentation/syntax)
  - [ESLint](https://eslint.org/)
  - [Prettier](https://prettier.io/)
  - [TypeScript](https://www.typescriptlang.org/)

## Developing
### Without Docker
To setup the frontend for local development you must first ensure that you have the following dependencies installed:
  - [NodeJS](https://nodejs.org/en/) (version v15 or above)
  - [PNPM](https://pnpm.io/)

Now you can install the project specific dependencies using:
```bash
pnpm install
```

Once the project dependencies are installed you can start a development server using:
```bash
pnpm dev
```

### With Docker
To setup the frontend for local development you can also use [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/).

You can run the application using the following command:

```bash
docker-compose up --build
```

## Building
You can build a production version of the application using:

```bash
pnpm build
```

## Linting
You can lint the project using:

```bash
pnpm lint
```
