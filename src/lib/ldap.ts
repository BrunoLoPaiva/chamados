import ActiveDirectory from "activedirectory2";

export async function authenticateWithAD(
  username: string,
  pass: string,
): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const adConfig = {
        url: process.env.LDAP_URL || "ldap://10.0.1.2",
        baseDN:
          process.env.LDAP_baseDN ||
          "OU=ViaRondon Concessionaria de Rodovia SA,DC=VIARONDON,DC=LOCAL",
        bindDN: `${username}@viarondon.local`,
        bindCredentials: pass,
      };

      const ad = new ActiveDirectory(adConfig as any);

      ad.authenticate(
        `${username}@viarondon.local`,
        pass,
        (err: any, auth: any) => {
          if (err || !auth) {
            console.error(
              `Falha na autenticação via LDAP para ${username}. Erro: ${
                err?.message || err
              }`,
            );
            return reject(new Error("Credenciais inválidas ou erro no LDAP."));
          }

          console.log(`LDAP: Usuário ${username} autenticado com sucesso.`);

          // Buscar detalhes estendidos do usuário autenticado no AD
          ad.findUser(username, (errFind: any, user: any) => {
            if (errFind || !user) {
              console.warn(`LDAP: Autenticado, mas não foi possível buscar o nome completo de ${username}`, errFind);
              // Fallback para apenas o login caso a busca falhe
              return resolve({ login: username, nome: username });
            }

            const fullName = user.displayName || user.cn || user.givenName || username;
            console.log(`LDAP: Detalhes encontrados -> Nome: ${fullName}`);

            resolve({ login: username, nome: fullName, ...user });
          });
        },
      );
    } catch (e: any) {
      console.error(`Error creating ActiveDirectory instance: ${e.message}`);
      reject(new Error("Active Directory initialization error"));
    }
  });
}
