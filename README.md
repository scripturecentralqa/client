Scripture Central Question-Answering Client


# Requirements

- npm, pnpm, or yarn (pnpm is recommended)

# Installation

First, create a .env file with four lines: 
- a SERVER\_HOST variable that points to a running server instance, such as `SERVER_HOST=http://127.0.0.1:8000`
- a PUBLIC\_SERVER\_HOST variable that points to the same place
- an UPSTASH\_REDIS\_REST\_URL that points to an https://upstash.io redis instance
- an UPSTASH\_REDIS\_REST\_TOKEN that cointains an upstash token

Then run `npm install` or `pnpm install`

## Running

```console
npm run dev
```

## Building

To create a production version of your app:

```console
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
