// Deno 전역 타입 선언 (IDE용)
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    has(key: string): boolean;
    toObject(): { [key: string]: string };
  }

  export const env: Env;

  export function serve(
    handler: (request: Request) => Response | Promise<Response>
  ): void;
}

// Supabase 타입 선언 (IDE용)
declare module "https://esm.sh/@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
  export { createClient } from "@supabase/supabase-js";
}
