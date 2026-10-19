import { getLang } from './index.js';

// Local glossary for item names (articulo). Runs in the browser, no external service.
// Entries: [es, en, ko]. An empty target drops the word. Words without an entry stay in Spanish.
// Multi-word entries are matched first, so they fix word order for common phrases.
const GLOSSARY = [
  ['motor de elevacion', 'lifting motor', '리프팅 모터'],
  ['sensores laser', 'laser sensors', '레이저 센서'],
  ['cinta doble cara', 'double-sided tape', '양면 테이프'],
  ['cinta transparente', 'clear tape', '투명 테이프'],
  ['cinta roja', 'red tape', '빨간색 테이프'],
  ['cinta amarilla', 'yellow tape', '노란색 테이프'],
  ['cinta reflejante', 'reflective tape', '반사 테이프'],
  ['cinta de celofan', 'cellophane tape', '셀로판 테이프'],
  ['cintas plateadas', 'silver tapes', '은색 테이프'],
  ['cinta para limitar roja', 'red limit tape', '빨간색 경계 테이프'],
  ['guantes de latex', 'latex gloves', '라텍스 장갑'],
  ['guantes latex', 'latex gloves', '라텍스 장갑'],
  ['toallas antiestaticas', 'antistatic towels', '정전기 방지 타월'],
  ['horno smt', 'SMT oven', 'SMT 오븐'],
  ['resistencia de horno', 'oven heater', '오븐 히터'],
  ['cable usb', 'USB cable', 'USB 케이블'],
  ['cables kic', 'KIC cables', 'KIC 케이블'],
  ['memoria kic', 'KIC memory', 'KIC 메모리'],
  ['vernier', 'vernier caliper', '버니어 캘리퍼스'],
  ['pad lock', 'padlock', '자물쇠'],
  ['cepillo de copa de alambre', 'wire cup brush', '와이어 컵 브러시'],
  ['conos azules', 'blue cones', '파란색 콘'],
  ['hojas blancas', 'white sheets', '흰색 시트'],
  ['carpeta', 'folder', '폴더'],
  ['cubrebocas', 'face mask', '마스크'],
  ['pluma azul', 'blue pen', '파란색 펜'],
  ['de', '', ''],
  ['del', '', ''],
  ['la', '', ''],
  ['el', '', ''],
  ['para', 'for', '용'],
  ['con', 'with', ''],
  ['y', 'and', '및'],
  ['paquete', 'pack', '팩'],
  ['motor', 'motor', '모터'],
  ['sensor', 'sensor', '센서'],
  ['sensores', 'sensors', '센서'],
  ['cable', 'cable', '케이블'],
  ['cables', 'cables', '케이블'],
  ['nozzle', 'nozzle', '노즐'],
  ['banda', 'belt', '벨트'],
  ['bandas', 'belts', '벨트'],
  ['conector', 'connector', '커넥터'],
  ['cinta', 'tape', '테이프'],
  ['cintas', 'tapes', '테이프'],
  ['usb', 'USB', 'USB'],
  ['gripper', 'gripper', '그리퍼'],
  ['jig', 'jig', '지그'],
  ['pin', 'pin', '핀'],
  ['pines', 'pins', '핀'],
  ['piston', 'piston', '피스톤'],
  ['pistón', 'piston', '피스톤'],
  ['manguera', 'hose', '호스'],
  ['macho', 'male', '수형'],
  ['hembra', 'female', '암형'],
  ['soporte', 'support', '지지대'],
  ['plana', 'flat', '평면형'],
  ['valvula', 'valve', '밸브'],
  ['kit', 'kit', '키트'],
  ['pisador', 'presser', '프레서'],
  ['conveyor', 'conveyor', '컨베이어'],
  ['cabezal', 'head', '헤드'],
  ['block', 'block', '블록'],
  ['temperatura', 'temperature', '온도'],
  ['switch', 'switch', '스위치'],
  ['interruptor', 'switch', '스위치'],
  ['rodamiento', 'bearing', '베어링'],
  ['balero', 'bearing', '베어링'],
  ['fotoelectrico', 'photoelectric', '광전'],
  ['filtro', 'filter', '필터'],
  ['filtros', 'filters', '필터'],
  ['tarjeta', 'board', '보드'],
  ['azul', 'blue', '파란색'],
  ['verde', 'green', '녹색'],
  ['rojo', 'red', '빨간색'],
  ['roja', 'red', '빨간색'],
  ['amarillo', 'yellow', '노란색'],
  ['amarilla', 'yellow', '노란색'],
  ['blanco', 'white', '흰색'],
  ['negro', 'black', '검은색'],
  ['laser', 'laser', '레이저'],
  ['camara', 'camera', '카메라'],
  ['base', 'base', '베이스'],
  ['guia', 'guide', '가이드'],
  ['guide', 'guide', '가이드'],
  ['cilindro', 'cylinder', '실린더'],
  ['llave', 'wrench', '렌치'],
  ['pad', 'pad', '패드'],
  ['adaptador', 'adapter', '어댑터'],
  ['pusher', 'pusher', '푸셔'],
  ['push', 'push', '푸시'],
  ['neumatico', 'pneumatic', '공압'],
  ['neum', 'pneum.', '공압'],
  ['horno', 'oven', '오븐'],
  ['gaveta', 'drawer', '서랍'],
  ['manual', 'manual', '매뉴얼'],
  ['grasa', 'grease', '그리스'],
  ['impresora', 'printer', '프린터'],
  ['power', 'power', '전원'],
  ['potencia', 'power', '전원'],
  ['relay', 'relay', '릴레이'],
  ['relevador', 'relay', '릴레이'],
  ['stopper', 'stopper', '스토퍼'],
  ['spring', 'spring', '스프링'],
  ['resorte', 'spring', '스프링'],
  ['selectiva', 'selective', '선택형'],
  ['fixture', 'fixture', '픽스처'],
  ['guantes', 'gloves', '장갑'],
  ['guante', 'glove', '장갑'],
  ['regulador', 'regulator', '레귤레이터'],
  ['nido', 'nest', '네스트'],
  ['calibracion', 'calibration', '교정'],
  ['magazine', 'magazine', '매거진'],
  ['tornillo', 'screw', '나사'],
  ['tornillos', 'screws', '나사'],
  ['squeegee', 'squeegee', '스퀴지'],
  ['pilas', 'batteries', '배터리'],
  ['pila', 'battery', '배터리'],
  ['herramienta', 'tool', '공구'],
  ['carrito', 'cart', '카트'],
  ['tamano', 'size', '크기'],
  ['toallas', 'towels', '타월'],
  ['antiestaticas', 'antistatic', '정전기 방지'],
  ['antiestatico', 'antistatic', '정전기 방지'],
  ['pluma', 'pen', '펜'],
  ['latex', 'latex', '라텍스'],
  ['overoles', 'coveralls', '작업복'],
  ['conos', 'cones', '콘'],
  ['celofan', 'cellophane', '셀로판'],
  ['doble', 'double', '양면'],
  ['transparente', 'clear', '투명'],
  ['reflejante', 'reflective', '반사'],
  ['etiqueta', 'label', '라벨'],
  ['etiquetas', 'labels', '라벨'],
  ['enmicadora', 'laminator', '라미네이터'],
  ['bracket', 'bracket', '브래킷'],
  ['brakets', 'brackets', '브래킷'],
  ['brackets', 'brackets', '브래킷'],
  ['hdmi', 'HDMI', 'HDMI'],
  ['displayport', 'DisplayPort', 'DisplayPort'],
  ['item', 'item', '항목'],
  ['cara', 'face', '면'],
];

const LANG_INDEX = { en: 0, ko: 1 };
const TOKEN_RE = /[\p{L}\p{N}]+(?:[./-][\p{L}\p{N}]+)*|[^\s\p{L}\p{N}]/gu;

function keyOf(word) {
  return word.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

function isWord(token) {
  return /^[\p{L}\p{N}]/u.test(token);
}

const PHRASES = new Map();
let maxPhraseLength = 1;
for (const [es, en, ko] of GLOSSARY) {
  const words = es.split(' ').map(keyOf);
  PHRASES.set(words.join(' '), [en, ko]);
  maxPhraseLength = Math.max(maxPhraseLength, words.length);
}

function translateText(text, index) {
  const tokens = text.match(TOKEN_RE) || [];
  const out = [];
  let hit = false;
  let i = 0;
  while (i < tokens.length) {
    let matched = false;
    if (isWord(tokens[i])) {
      for (let n = Math.min(maxPhraseLength, tokens.length - i); n >= 1; n--) {
        const slice = tokens.slice(i, i + n);
        if (!slice.every(isWord)) continue;
        const entry = PHRASES.get(slice.map(keyOf).join(' '));
        if (!entry) continue;
        hit = true;
        matched = true;
        const target = entry[index];
        if (target) out.push(target);
        i += n;
        break;
      }
    }
    if (!matched) {
      out.push(tokens[i]);
      i++;
    }
  }
  if (!hit) return text;
  return out
    .join(' ')
    .replace(/\s+([),.;:"%])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Results are cached per language and source text. A changed source text is a new key,
// so it is translated again. Nothing is stored on the server.
const CACHE_LIMIT = 2000;
const cache = new Map();

export function traducirArticulo(texto, lang = getLang()) {
  if (!texto) return texto ?? '';
  const index = LANG_INDEX[lang];
  if (index === undefined) return texto;
  const key = `${lang}\u0000${texto}`;
  let value = cache.get(key);
  if (value === undefined) {
    if (cache.size >= CACHE_LIMIT) cache.clear();
    value = translateText(texto, index);
    cache.set(key, value);
  }
  return value;
}

// Returns the original Spanish text when it differs from the displayed one, for use as a tooltip.
export function articuloOriginal(texto, lang = getLang()) {
  if (!texto) return undefined;
  return traducirArticulo(texto, lang) !== texto ? texto : undefined;
}
