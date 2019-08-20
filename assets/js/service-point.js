const DECODED = jwt_decode(TOKEN);

const WS_SERVER = DECODED.NOTIFY_SERVER || 'localhost';
const WS_PORT = +DECODED.NOTIFY_PORT || 8888;

const WS_USER = DECODED.NOTIFY_USER || 'q4u';
const WS_PASSWORD = DECODED.NOTIFY_PASSWORD || '##q4u##';

const NOTIFY_URL = `ws://${WS_SERVER}:${WS_PORT}`;
const CLIENT_ID = `Q4U-MONITOR-${new Date().getTime()}`;

const SERVICE_POINT_TOPIC = DECODED.SERVICE_POINT_TOPIC || 'queue/service-point'; // จากไฟล์ queue-config

let topic = '';

let isOffline = false;

let isSound = true;
let isPlayingSound = false; // true = เล่นไฟล์เสียง, false = ไม่เล่นไฟล์เสียง

let playlists = [];

let soundFile = null;
let soundSpeed = null;
let speakSingle = true;

let currentHn = '';
let currentQueueNumber = '';
let currentRoomName = '';
let currentRoomNumber = '';

let soundList = [];

let mqttClient;

let servicePointId = 0;

function getUrlParams(url) {
  return `${url}?`.split('?')[1]
    .split('&').reduce((params, pair) =>
      ((key, val) => key ? { ...params, [key]: val } : params)
        (...`${pair}=`.split('=').map(decodeURIComponent)), {});
}

// เชื่อมต่อ MQTT Server
function initialSocket() {
  mqttClient = mqtt.connect(NOTIFY_URL, {
    CLIENT_ID: CLIENT_ID,
    username: WS_USER,
    password: WS_PASSWORD
  });

  mqttClient.on('message', (topic, payload) => {
    console.log(topic);

    try {
      const _payload = JSON.parse(payload.toString());

      console.log(_payload);

      _getCurrentQueue();
      _getNextQueue();

      if (isSound) {

        const _servicePointId = sessionStorage.getItem('servicePointId');

        if (+_servicePointId === +_payload.servicePointId) {
          // play sound
          const sound = { queueNumber: _payload.queueNumber, roomNumber: _payload.roomNumber.toString(), isInterview: _payload.isInterview, roomId: _payload.roomId };
          playlists.push(sound);

          prepareSound();
        }
      }
    } catch (error) {
      console.log(error);
    }

  });

  mqttClient.on('connect', () => {
    console.log('เชื่อมต่อ MQTT สำเร็จ');
    toggleMQTTError(false);
    mqttClient.subscribe(topic, (error) => {
      if (error) {
        toggleMQTTError(true);
      } else {
        toggleMQTTError(false);
        console.log('subscribe to topic: ' + topic);
      }
    });
  });

  mqttClient.on('close', () => {
    console.log('การเชื่อมต่อ MQTT ปิดแล้ว');
    toggleMQTTError(true);

  });

  mqttClient.on('error', (error) => {
    console.log('เกิดข้อผิดพลาดในการเชื่อมต่อ MQTT');
    toggleMQTTError(true);
  });

  mqttClient.on('offline', () => {
    console.log('MQTT ออฟไลน์');
    toggleMQTTError(true);
  });

}

function toggleMQTTError(isError) {
  if (isError) {
    $('#alertErrorMqtt').show();
  } else {
    $('#alertErrorMqtt').hide();
  }
}

function prepareSound() {

  if (!isPlayingSound) {
    if (playlists.length) {
      const queueNumber = playlists[0].queueNumber;
      const roomNumber = playlists[0].roomNumber;
      const isInterview = playlists[0].isInterview;
      const roomId = playlists[0].roomId;
      playSound(queueNumber, roomNumber, isInterview, roomId);
    }
  }
}

// เล่นไฟล์เสียง
function playSound(
  strQueue /** ตัวเลขคิว เช่น A 001 */,
  strRoomNumber /** หมายเลขห้องตรวจ เช่น 1, 2 */,
  isInterview /** เรียกซักประวัติ Y, N */,
  roomId /** รหัสห้องตรวจ */) {

  isPlayingSound = true;

  let _queue = strQueue.toString().replace(' ', '');
  _queue = _queue.toString().replace('-', '');

  const _strQueue = _queue.split('');
  const _strRoom = strRoomNumber.split('');

  const audioFiles = [];

  audioFiles.push('./assets/audio/please.mp3');
  audioFiles.push('./assets/audio/silent.mp3');

  _strQueue.forEach(v => {
    audioFiles.push(`./assets/audio/${v}.mp3`);
  });

  if (isInterview === 'Y') {
    audioFiles.push(`./assets/audio/interview-table.mp3`);
  } else {
    const idx = _.findIndex(soundList, { 'room_id': roomId });
    if (idx > -1) {
      audioFiles.push(`./assets/audio/${soundList[idx].sound_file}`);
    } else {
      if (soundFile) {
        audioFiles.push(`./assets/audio/${soundFile}`);
      } else {
        audioFiles.push('./assets/audio/channel.mp3');
      }
    }
  }

  if (speakSingle) {
    _strRoom.forEach(v => {
      audioFiles.push(`./assets/audio/${v}.mp3`);
    });
  } else {

    try {
      if (_strRoom.length === 2) {
        var _roomNumber = +strRoomNumber;
        if (_roomNumber >= 30) {
          audioFiles.push(`./assets/audio/${_strRoom[0]}.mp3`);
          audioFiles.push(`./assets/audio/10.mp3`);
        } else if (_roomNumber >= 20) {
          audioFiles.push(`./assets/audio/20.mp3`);
        } else {
          audioFiles.push(`./assets/audio/10.mp3`);
        }

        if (+_strRoom[1] === 1) {
          audioFiles.push(`./assets/audio/11.mp3`);
        } else if (+_strRoom[1] > 0) {
          audioFiles.push(`./assets/audio/${_strRoom[1]}.mp3`);
        }

      } else {
        audioFiles.push(`./assets/audio/${_strRoom[0]}.mp3`);
      }
    } catch (error) {
      console.log('Not numeric!');
    }
  }

  audioFiles.push('./assets/audio/ka.mp3');

  const howlerBank = [];

  const loop = false;

  const onPlay = [false];
  let pCount = 0;
  const that = this;

  const onEnd = function (e) {

    if (loop) {
      pCount = (pCount + 1 !== howlerBank.length) ? pCount + 1 : 0;
    } else {
      pCount = pCount + 1;
    }

    if (pCount <= audioFiles.length - 1) {

      if (!howlerBank[pCount].playing()) {
        howlerBank[pCount].play();
      } else {
        howlerBank[pCount].stop();
        howlerBank[pCount].unload();
        howlerBank[pCount].play();
      }

    } else {
      isPlayingSound = false;
      // remove queue in playlist
      const idx = _.findIndex(playlists, { queueNumber: strQueue, roomNumber: strRoomNumber });
      if (idx > -1) {
        playlists.splice(idx, 1);
      }
      // call sound again
      setTimeout(() => {
        isPlayingSound = false;
        prepareSound();
      }, 1000);
    }
  };

  for (let i = 0; i < audioFiles.length; i++) {
    howlerBank.push(new Howl({
      src: [audioFiles[i]],
      onend: onEnd,
      preload: true,
      html5: true,
    }));
    // ความเร็วในการเล่นไฟล์เสียง
    if (soundSpeed) {
      howlerBank[i].rate(soundSpeed);
    }
  }

  try {
    howlerBank[0].play();
  } catch (error) {
    console.log(error);
  }
}

function _setCurrentQueueList(queues) {

  if (queues.length) {

    let list = $('#currentList');
    list.empty();

    _.forEach(queues, (v, i) => {
      let _list;

      if (v.queue_number === currentQueueNumber) {
        _list = $(`<div class="row bg-danger">
              <div class="col-md-7"><span class="queue-number">${v.queue_number}</span></div>
              <div class="col-md-5 text-center"><span class="queue-number">${v.room_number}</span></div>
            </div>`);
      } else {
        _list = $(`<div class="row">
              <div class="col-md-7"><span class="queue-number">${v.queue_number}</span></div>
              <div class="col-md-5 text-center"><span class="queue-number">${v.room_number}</span></div>
            </div>`);
      }

      list.append(_list);

    });

  }


}

async function _getCurrentQueue() {
  const _servicePointId = sessionStorage.getItem('servicePointId');

  const _url = `${API_URL}/queue/working/${_servicePointId}`;
  try {
    const rs = await serviceGet(_url, TOKEN);
    const data = rs.data;

    if (data.statusCode === 200) {

      const arr = _.sortBy(data.results, ['update_date']).reverse();

      if (arr.length > 0) {
        currentHn = arr[0].hn;
        currentQueueNumber = arr[0].queue_number;
        currentRoomName = arr[0].room_name;
        currentRoomNumber = arr[0].room_number;
      } else {
        currentHn = null;
        currentQueueNumber = null;
        currentRoomName = null;
        currentRoomNumber = null;
      }

      // set queue list
      _setCurrentQueueList(arr);

    } else {
      console.log(rs.message);
    }
  } catch (error) {
    console.log(error);
  }
}

async function _getSoundList(_servicePointId) {
  const _url = `${API_URL}/queue/sound/service-room?servicePointId=${_servicePointId}`;
  try {
    const rs = await serviceGet(_url, TOKEN);

    const data = rs.data;
    if (data.statusCode === 200) {
      soundList = data.results;
    } else {
      console.log(error);
    }
  } catch (error) {
    console.log(error);
  }
}

async function _getSoundFile(_servicePointId) {
  const _url = `${API_URL}/queue/sound/service-point?servicePointId=${_servicePointId}`;
  try {
    const rs = await serviceGet(_url, TOKEN);

    const data = rs.data;
    if (data.statusCode === 200) {
      soundFile = data.results.length ? data.results[0].sound_file : null;
      soundSpeed = data.results.length ? data.results[0].sound_speed : null;
    } else {
      console.log(error);
    }
  } catch (error) {
    console.log(error);
  }
}

function _setNextQueueList(items) {
  if (items.length) {

    let list = $('#nextQueueList');
    list.empty();

    _.forEach(items, (v, i) => {
      let _list = `
      <div class="row">
        <div class="col-md-7"><span class="queue-number-sm">${v.queue_number}</span></div>
        <div class="col-md-5"><span class="queue-number-sm">${v.hn}</span></div>
      </div>
      `;

      list.append(_list);

    });

  }
}

async function _getNextQueue() {
  const _servicePointId = sessionStorage.getItem('servicePointId');
  const limit = 5;
  const _url = `${API_URL}/queue/next-queue/service-point?servicePointId=${_servicePointId}&limit=${limit}`;
  try {
    const rs = await serviceGet(_url, TOKEN);
    const data = rs.data;
    if (data.statusCode === 200) {
      _setNextQueueList(data.results);
    } else {
      console.log(error);
    }
  } catch (error) {
    console.log(error);
  }
}

async function _getServicePointList(_servicePointId) {
  try {
    const _url = `${API_URL}/queue/service-points`;
    const rs = await serviceGet(_url, TOKEN);

    const data = rs.data;

    if (data.statusCode === 200) {
      const idx = _.findIndex(data.results, { service_point_id: +_servicePointId });
      if (idx > -1) {
        const _servicePointName = data.results[idx].service_point_name || 'ไม่พบจุดให้บริการ';
        $('#txtServicePointName').text(_servicePointName);
      }
    } else {
      console.log(data.error);
    }
  } catch (error) {
    console.log(error);
  }
}

function setServicePointId(id) {
  servicePointId = id;
}


async function serviceGet(url, token) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    crossdomain: true
  };
  return await axios.get(url, config);
}

$(document).ready(function () {

  let params = getUrlParams(window.location.search);

  console.log(params);

  let SERVICE_POINT_ID = +params.servicePointId;

  sessionStorage.setItem('servicePointId', SERVICE_POINT_ID);

  topic = `${SERVICE_POINT_TOPIC}/${SERVICE_POINT_ID}`;

  // เชื่อมต่อกับ MQTT Server 
  initialSocket();

  _getCurrentQueue();
  _getNextQueue();

  _getServicePointList(SERVICE_POINT_ID);
  _getSoundList(SERVICE_POINT_ID);
  _getSoundFile(SERVICE_POINT_ID);
  // เปิดหน้าจอเลือกแผนก
  $('#btnOpenServicepoint').on('click', (e) => {
    e.preventDefault();

    $('#modalServicepoints').modal({
      keyboard: false,
      backdrop: 'static'
    });

  });
  // จบเปิดหน้าจอเลือกแผนก

  // ตัวอักษรวิ่ง
  $('.marquee').marquee({
    delayBeforeStart: 0,
    duplicated: true,
    pauseOnHover: true
  });

});