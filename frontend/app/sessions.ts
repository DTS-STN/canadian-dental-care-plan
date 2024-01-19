import { createCookieSessionStorage } from "@remix-run/node";

type SessionData = {
  newPhoneNumber: string;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>(
    {
      cookie: {
        name: "__session",
      },
    }
  );

export { getSession, commitSession, destroySession };