import { vi } from "vitest";

export const devToolsMock = {
  connect: vi.fn().mockImplementation((_) => {
    return {
      init: vi.fn(),
      subscribe: (_: any) => {},
      unsubscribe: () => {},
      send: vi.fn(),
      error: vi.fn(),
    };
  }),
};
