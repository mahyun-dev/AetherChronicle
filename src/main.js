import Phaser from 'phaser';
import { GameConfig } from './config/GameConfig.js';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { CharacterSelectScene } from './scenes/CharacterSelectScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';

// Phaser Game 설정
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GameConfig.GAME_WIDTH,
  height: GameConfig.GAME_HEIGHT,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: GameConfig.DEBUG_MODE
    }
  },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    CharacterSelectScene,
    GameScene,
    UIScene
  ],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  pixelArt: true,
  antialias: false
};

// 게임 시작
window.addEventListener('load', () => {
  const game = new Phaser.Game(config);
  
  // 전역 게임 인스턴스 저장
  window.game = game;
  
  // 로딩 화면 숨김
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    setTimeout(() => {
      loadingElement.classList.add('hidden');
    }, 1000);
  }
});
