const { VITE_CLIENT_NAME: CLIENT_NAME, VITE_WEBSITE: WEBSITE } = import.meta
  .env;

export async function registerApplication({ instanceURL }) {
  const registrationParams = new URLSearchParams({
    client_name: CLIENT_NAME,
    redirect_uris: location.origin,
    scopes: 'read write follow',
    website: WEBSITE,
  });
  const registrationResponse = await fetch(
    `https://${instanceURL}/api/v1/apps`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: registrationParams.toString(),
    },
  );
  const registrationJSON = await registrationResponse.json();
  console.log({ registrationJSON });
  return registrationJSON;
}

export async function getAuthorizationURL({ instanceURL, client_id }) {
  const authorizationParams = new URLSearchParams({
    client_id,
    scope: 'read write follow',
    redirect_uri: location.origin,
    // redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
    response_type: 'code',
  });
  const authorizationURL = `https://${instanceURL}/oauth/authorize?${authorizationParams.toString()}`;
  return authorizationURL;
}

export async function getUserPosts({ accessToken, instanceURL, limit }) {
  const lim = limit || 10;
  const response = await fetch(`http://localhost:8000/timelines/home/?limit=${lim}`, {
    method: 'GET',
    headers: { "access-token": accessToken, "instance-url": instanceURL }
  });
  // const responseMe = await fetch(`http://localhost:8000/get_username/`, {
  //   method: 'GET',
  //   headers: { "access-token": accessToken, "instance-url": instanceURL }
  // });
  // const responseMeJson = await responseMe.json();
  // console.log(responseMeJson);
  const posts = await response.json();
  return posts;
}

export async function getAccessToken({
  instanceURL,
  client_id,
  client_secret,
  code,
}) {
  const params = new URLSearchParams({
    client_id,
    client_secret,
    redirect_uri: location.origin,
    grant_type: 'authorization_code',
    code,
    scope: 'read write follow',
  });
  const tokenResponse = await fetch(`https://${instanceURL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  const tokenJSON = await tokenResponse.json();
  // const postsJSON = await getUserPosts({tokenJSON, instanceURL});
  // console.log({ postsJSON })
  console.log({ tokenJSON });
  return tokenJSON;
}
