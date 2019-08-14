
async function serviceGetSoundList(url, token) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  };

  return await axios.get(url, config);

}

async function serviceGetSoundFile(url, token) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  };

  return await axios.get(url, config);

}

async function serviceGetCurrentQueue(token, url) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  };

  return await axios.get(url, config);
}

async function serviceGetServicePointList(url, token) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  };

  return await axios.get(url, config);

}

async function serviceGetServicePointSound(url, token) {
  // const _url = `${this.apiUrl}/queue/sound/service-point`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  };

  return await axios.get(url, config);

}

async function serviceGetNextQueue(url, token) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  };

  return await axios.get(url, config);

}