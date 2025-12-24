/**
 * 게임 전역 설정
 */
export const GameConfig = {
  // 게임 화면 크기
  GAME_WIDTH: 1280,
  GAME_HEIGHT: 720,
  
  // 디버그 모드
  DEBUG_MODE: false,
  
  // 청크 설정
  CHUNK_SIZE: 1024,
  VISIBLE_CHUNKS: 5, // 5x5 = 25개 청크
  
  // 플레이어 기본 설정
  PLAYER: {
    BASE_SPEED: 200,
    BASE_HP: 100,
    BASE_MP: 50
  },
  
  // 저장 설정
  SAVE_KEY: 'aether_chronicle_save',
  AUTO_SAVE_INTERVAL: 300000, // 5분 (밀리초)
  
  // 게임 버전
  VERSION: '0.1.0',
  
  // 클래스 정보
  CLASSES: {
    WARRIOR: 'warrior',
    ARCHER: 'archer',
    MAGE: 'mage',
    ROGUE: 'rogue',
    FUSIONIST: 'fusionist'
  }
};
