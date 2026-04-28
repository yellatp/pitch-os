/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>

declare namespace App {
  interface Locals extends Runtime {
    env: Env
    user?: {
      id: string
      email: string
      name: string
      avatar: string
    }
  }
}