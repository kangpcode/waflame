import baileysPkg, {
  AuthenticationCreds,
  AuthenticationState,
  SignalDataTypeMap,
} from '@whiskeysockets/baileys';
import { prisma } from '@waflame/database';

const baileys = (baileysPkg as any).default || baileysPkg;
const BufferJSON = (baileysPkg as any).BufferJSON || baileys.BufferJSON;
const initAuthCreds = (baileysPkg as any).initAuthCreds || baileys.initAuthCreds;
const proto = (baileysPkg as any).proto || (baileysPkg as any).WAProto || baileys.proto;

export interface MariaDBAuthStoreResult {
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
  clearCreds: () => Promise<void>;
}

/**
 * Custom Baileys Authentication State Store backed by MariaDB `wa_sessions` table.
 * Keeps sessions persistent across server restarts and allows container scaling.
 */
export async function useMariaDBAuthState(deviceId: string): Promise<MariaDBAuthStoreResult> {
  // 1. Fetch initial credentials from database
  const credsRow = await prisma.waSession.findUnique({
    where: {
      deviceId_sessionKey: {
        deviceId,
        sessionKey: 'creds',
      },
    },
  });

  const creds: AuthenticationCreds = credsRow
    ? JSON.parse(credsRow.sessionData, BufferJSON.reviver)
    : initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: { [key: string]: SignalDataTypeMap[typeof type] } = {};
          await Promise.all(
            ids.map(async (id) => {
              const sessionKey = `${type}-${id}`;
              const row = await prisma.waSession.findUnique({
                where: {
                  deviceId_sessionKey: {
                    deviceId,
                    sessionKey,
                  },
                },
              });

              if (row) {
                let value = JSON.parse(row.sessionData, BufferJSON.reviver);
                if (type === 'app-state-sync-key' && value && proto) {
                  value = proto.Message.AppStateSyncKeyData.fromObject(value);
                }
                data[id] = value;
              }
            })
          );
          return data;
        },
        set: async (data: any) => {
          const tasks: Promise<any>[] = [];
          for (const category of Object.keys(data)) {
            const catObj = data[category];
            if (!catObj) continue;

            for (const id of Object.keys(catObj)) {
              const value = catObj[id];
              const sessionKey = `${category}-${id}`;

              if (value) {
                const serialized = JSON.stringify(value, BufferJSON.replacer);
                tasks.push(
                  prisma.waSession.upsert({
                    where: {
                      deviceId_sessionKey: {
                        deviceId,
                        sessionKey,
                      },
                    },
                    update: { sessionData: serialized },
                    create: {
                      deviceId,
                      sessionKey,
                      sessionData: serialized,
                    },
                  })
                );
              } else {
                tasks.push(
                  prisma.waSession.deleteMany({
                    where: { deviceId, sessionKey },
                  })
                );
              }
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: async () => {
      const serialized = JSON.stringify(creds, BufferJSON.replacer);
      await prisma.waSession.upsert({
        where: {
          deviceId_sessionKey: {
            deviceId,
            sessionKey: 'creds',
          },
        },
        update: { sessionData: serialized },
        create: {
          deviceId,
          sessionKey: 'creds',
          sessionData: serialized,
        },
      });
    },
    clearCreds: async () => {
      await prisma.waSession.deleteMany({
        where: { deviceId },
      });
    },
  };
}
